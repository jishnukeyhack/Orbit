// ============================================
// Orbit — SQLite Database Layer
// Persists all task runs, logs, memory, sessions
// ============================================
import path from 'path';
import fs from 'fs';

// Lazy-load better-sqlite3 (server-side only)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _db: any = null;

function getDb() {
  if (_db) return _db;
  // Dynamic require to avoid Next.js bundling issues
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  const dbPath = path.join(process.cwd(), 'orbit.db');
  _db = new Database(dbPath);
  initSchema(_db);
  return _db;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function initSchema(db: any) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS pipeline_runs (
      id TEXT PRIMARY KEY,
      task_title TEXT NOT NULL,
      task_description TEXT,
      project_path TEXT,
      status TEXT DEFAULT 'running',
      started_at INTEGER NOT NULL,
      completed_at INTEGER,
      result_json TEXT,
      total_duration_ms INTEGER,
      iterations INTEGER DEFAULT 1,
      cost_usd REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS pipeline_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      run_id TEXT NOT NULL,
      stage TEXT,
      level TEXT DEFAULT 'info',
      message TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      FOREIGN KEY(run_id) REFERENCES pipeline_runs(id)
    );

    CREATE TABLE IF NOT EXISTS memories (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      repo TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      importance REAL DEFAULT 0.7,
      confidence REAL DEFAULT 0.7,
      trust REAL DEFAULT 0.8,
      stability TEXT DEFAULT 'medium',
      revision_count INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      last_updated INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      metadata_json TEXT DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS agent_sessions (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL,
      agent_name TEXT NOT NULL,
      status TEXT DEFAULT 'idle',
      current_task TEXT,
      started_at INTEGER NOT NULL,
      last_heartbeat INTEGER NOT NULL,
      tasks_completed INTEGER DEFAULT 0,
      tokens_used INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS workspace_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      run_id TEXT,
      file_path TEXT NOT NULL,
      content TEXT,
      action TEXT DEFAULT 'created',
      created_at INTEGER NOT NULL
    );
  `);
}

// ============================================
// Pipeline Runs
// ============================================

export interface PipelineRunRow {
  id: string;
  task_title: string;
  task_description?: string;
  project_path?: string;
  status: string;
  started_at: number;
  completed_at?: number;
  result_json?: string;
  total_duration_ms?: number;
  iterations?: number;
  cost_usd?: number;
}

export function createPipelineRun(run: Omit<PipelineRunRow, 'status'>): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO pipeline_runs (id, task_title, task_description, project_path, status, started_at)
    VALUES (?, ?, ?, ?, 'running', ?)
  `).run(run.id, run.task_title, run.task_description ?? '', run.project_path ?? '', run.started_at);
}

export function updatePipelineRun(id: string, updates: Partial<PipelineRunRow>): void {
  const db = getDb();
  const fields = Object.entries(updates)
    .map(([k]) => `${k} = ?`)
    .join(', ');
  const values = Object.values(updates);
  db.prepare(`UPDATE pipeline_runs SET ${fields} WHERE id = ?`).run(...values, id);
}

export function getPipelineRun(id: string): PipelineRunRow | null {
  const db = getDb();
  return db.prepare('SELECT * FROM pipeline_runs WHERE id = ?').get(id) ?? null;
}

export function listPipelineRuns(limit = 50): PipelineRunRow[] {
  const db = getDb();
  return db.prepare('SELECT * FROM pipeline_runs ORDER BY started_at DESC LIMIT ?').all(limit);
}

// ============================================
// Pipeline Logs
// ============================================

export function addPipelineLog(runId: string, stage: string | null, level: string, message: string): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO pipeline_logs (run_id, stage, level, message, timestamp)
    VALUES (?, ?, ?, ?, ?)
  `).run(runId, stage, level, message, Date.now());
}

export function getPipelineLogs(runId: string): Array<{ stage: string; level: string; message: string; timestamp: number }> {
  const db = getDb();
  return db.prepare('SELECT stage, level, message, timestamp FROM pipeline_logs WHERE run_id = ? ORDER BY timestamp ASC').all(runId);
}

// ============================================
// Memory
// ============================================

export interface MemoryRow {
  id: string;
  type: string;
  repo: string;
  title: string;
  content: string;
  importance: number;
  confidence: number;
  trust: number;
  stability: string;
  revision_count: number;
  created_at: number;
  last_updated: number;
  expires_at: number;
  metadata_json: string;
}

export function saveMemoryRow(row: MemoryRow): void {
  const db = getDb();
  db.prepare(`
    INSERT OR REPLACE INTO memories
    (id, type, repo, title, content, importance, confidence, trust, stability, revision_count, created_at, last_updated, expires_at, metadata_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(row.id, row.type, row.repo, row.title, row.content, row.importance, row.confidence,
    row.trust, row.stability, row.revision_count, row.created_at, row.last_updated, row.expires_at, row.metadata_json);
}

export function listMemoryRows(type?: string, limit = 50): MemoryRow[] {
  const db = getDb();
  if (type) {
    return db.prepare('SELECT * FROM memories WHERE type = ? AND expires_at > ? ORDER BY importance DESC LIMIT ?').all(type, Date.now(), limit);
  }
  return db.prepare('SELECT * FROM memories WHERE expires_at > ? ORDER BY importance DESC LIMIT ?').all(Date.now(), limit);
}

export function searchMemoryRows(query: string, limit = 10): MemoryRow[] {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM memories WHERE expires_at > ? AND (content LIKE ? OR title LIKE ?)
    ORDER BY importance DESC LIMIT ?
  `).all(Date.now(), `%${query}%`, `%${query}%`, limit);
}

// ============================================
// Workspace Files
// ============================================

export function recordWorkspaceFile(runId: string, filePath: string, content: string, action: string): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO workspace_files (run_id, file_path, content, action, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(runId, filePath, content, action, Date.now());
}

export function getWorkspaceFiles(runId: string): Array<{ file_path: string; action: string; created_at: number }> {
  const db = getDb();
  return db.prepare('SELECT file_path, action, created_at FROM workspace_files WHERE run_id = ? ORDER BY created_at ASC').all(runId);
}

// ============================================
// Stats
// ============================================

export function getOrbitStats() {
  const db = getDb();
  const total = db.prepare('SELECT COUNT(*) as c FROM pipeline_runs').get() as { c: number };
  const completed = db.prepare("SELECT COUNT(*) as c FROM pipeline_runs WHERE status = 'completed'").get() as { c: number };
  const failed = db.prepare("SELECT COUNT(*) as c FROM pipeline_runs WHERE status = 'failed'").get() as { c: number };
  const memories = db.prepare('SELECT COUNT(*) as c FROM memories WHERE expires_at > ?').get(Date.now()) as { c: number };
  const files = db.prepare('SELECT COUNT(*) as c FROM workspace_files').get() as { c: number };
  const totalCost = db.prepare('SELECT SUM(cost_usd) as s FROM pipeline_runs').get() as { s: number };
  return {
    totalRuns: total.c,
    completedRuns: completed.c,
    failedRuns: failed.c,
    successRate: total.c > 0 ? Math.round((completed.c / total.c) * 100) : 0,
    memoryCount: memories.c,
    filesCreated: files.c,
    totalCostUsd: totalCost.s ?? 0,
  };
}
