// ============================================
// Orbit — SQLite Database Layer
// Persists all task runs, logs, memory, sessions
// ============================================
import path from 'path';
import fs from 'fs';
import { supabase } from '../supabase';

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

// ============================================
// Supabase Cloud Synchronizers
// ============================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function syncRunToSupabase(row: any): Promise<void> {
  try {
    const { error } = await supabase
      .from('orbit_pipeline_runs')
      .upsert({
        id: row.id,
        user_id: row.user_id || null,
        task_title: row.task_title,
        task_description: row.task_description || '',
        project_path: row.project_path || '',
        status: row.status,
        started_at: row.started_at,
        completed_at: row.completed_at || null,
        result_json: row.result_json || null,
        total_duration_ms: row.total_duration_ms || null,
        iterations: row.iterations || 1,
        cost_usd: row.cost_usd || 0.0,
      });
    if (error) {
      console.log('[Supabase Db Sync] Skipped Run Sync: table public.orbit_pipeline_runs not initialized.');
    }
  } catch (err) {
    // Graceful catch to ensure zero crashes
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function syncLogToSupabase(runId: string, log: any): Promise<void> {
  try {
    const { error } = await supabase
      .from('orbit_pipeline_logs')
      .insert({
        run_id: runId,
        stage: log.stage,
        level: log.level,
        message: log.message,
        timestamp: log.timestamp,
      });
    if (error) {
      console.log('[Supabase Db Sync] Skipped Log Sync: table public.orbit_pipeline_logs not initialized.');
    }
  } catch (err) {
    // Graceful catch to ensure zero crashes
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function syncFileToSupabase(runId: string, file: any): Promise<void> {
  try {
    const { error } = await supabase
      .from('orbit_workspace_files')
      .insert({
        run_id: runId,
        file_path: file.filePath,
        content: file.content,
        action: file.action,
        created_at: file.created_at,
      });
    if (error) {
      console.log('[Supabase Db Sync] Skipped File Sync: table public.orbit_workspace_files not initialized.');
    }
  } catch (err) {
    // Graceful catch to ensure zero crashes
  }
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

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  // Safe migration to add user_id to pipeline_runs if it doesn't already exist
  try {
    db.exec("ALTER TABLE pipeline_runs ADD COLUMN user_id TEXT;");
  } catch (err) {
    // Ignore error if column already exists
  }
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
  user_id?: string;
}

export function createPipelineRun(run: Omit<PipelineRunRow, 'status'>): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO pipeline_runs (id, task_title, task_description, project_path, status, started_at, user_id)
    VALUES (?, ?, ?, ?, 'running', ?, ?)
  `).run(run.id, run.task_title, run.task_description ?? '', run.project_path ?? '', run.started_at, run.user_id ?? null);

  // Async non-blocking cloud sync
  const fullRow = {
    id: run.id,
    task_title: run.task_title,
    task_description: run.task_description,
    project_path: run.project_path,
    status: 'running',
    started_at: run.started_at,
    user_id: run.user_id
  };
  syncRunToSupabase(fullRow);
}

export function updatePipelineRun(id: string, updates: Partial<PipelineRunRow>): void {
  const db = getDb();
  const fields = Object.entries(updates)
    .map(([k]) => `${k} = ?`)
    .join(', ');
  const values = Object.values(updates);
  db.prepare(`UPDATE pipeline_runs SET ${fields} WHERE id = ?`).run(...values, id);

  // Async non-blocking cloud sync
  const current = getPipelineRun(id);
  if (current) {
    syncRunToSupabase(current);
  }
}

export function getPipelineRun(id: string): PipelineRunRow | null {
  const db = getDb();
  return db.prepare('SELECT * FROM pipeline_runs WHERE id = ?').get(id) ?? null;
}

export function deletePipelineRun(id: string): void {
  const db = getDb();
  const deleteLogs = db.prepare('DELETE FROM pipeline_logs WHERE run_id = ?');
  const deleteFiles = db.prepare('DELETE FROM workspace_files WHERE run_id = ?');
  const deleteRun = db.prepare('DELETE FROM pipeline_runs WHERE id = ?');
  
  db.transaction(() => {
    deleteLogs.run(id);
    deleteFiles.run(id);
    deleteRun.run(id);
  })();
}

export function listPipelineRuns(limit = 50, userId?: string): PipelineRunRow[] {
  const db = getDb();
  if (userId) {
    return db.prepare('SELECT * FROM pipeline_runs WHERE user_id = ? ORDER BY started_at DESC LIMIT ?').all(userId, limit);
  }
  return db.prepare('SELECT * FROM pipeline_runs ORDER BY started_at DESC LIMIT ?').all(limit);
}

// ============================================
// Pipeline Logs
// ============================================

export function addPipelineLog(runId: string, stage: string | null, level: string, message: string): void {
  const db = getDb();
  const timestamp = Date.now();
  db.prepare(`
    INSERT INTO pipeline_logs (run_id, stage, level, message, timestamp)
    VALUES (?, ?, ?, ?, ?)
  `).run(runId, stage, level, message, timestamp);

  // Async non-blocking cloud sync
  syncLogToSupabase(runId, { stage, level, message, timestamp });
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
  const timestamp = Date.now();
  db.prepare(`
    INSERT INTO workspace_files (run_id, file_path, content, action, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(runId, filePath, content, action, timestamp);

  try {
    const run = db.prepare('SELECT user_id FROM pipeline_runs WHERE id = ?').get(runId) as { user_id?: string } | undefined;
    const userId = run?.user_id;
    const wsRoot = path.join(process.cwd(), 'orbit-workspace');
    
    let targetDir = wsRoot;
    if (userId) {
      targetDir = path.join(wsRoot, 'users', userId);
    }
    
    const fullPath = path.join(targetDir, filePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content, 'utf-8');
  } catch (err) {
    console.error("Failed to write physical workspace file:", err);
  }

  // Async non-blocking cloud sync
  syncFileToSupabase(runId, { filePath, content, action, created_at: timestamp });
}

export function getWorkspaceFiles(runId: string): Array<{ file_path: string; action: string; created_at: number }> {
  const db = getDb();
  return db.prepare('SELECT file_path, action, created_at FROM workspace_files WHERE run_id = ? ORDER BY created_at ASC').all(runId);
}

// ============================================
// Settings (API Keys + User Preferences)
// ============================================

export function getSetting(key: string): string | null {
  const db = getDb();
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

export function setSetting(key: string, value: string): void {
  const db = getDb();
  db.prepare(`
    INSERT OR REPLACE INTO settings (key, value, updated_at)
    VALUES (?, ?, ?)
  `).run(key, value, Date.now());
}

export function getAllSettings(): Record<string, string> {
  const db = getDb();
  const rows = db.prepare('SELECT key, value FROM settings').all() as Array<{ key: string; value: string }>;
  return Object.fromEntries(rows.map(r => [r.key, r.value]));
}

// ============================================
// Stats
// ============================================

export function getOrbitStats(userId?: string) {
  const db = getDb();
  
  let totalQuery = 'SELECT COUNT(*) as c FROM pipeline_runs';
  let completedQuery = "SELECT COUNT(*) as c FROM pipeline_runs WHERE status = 'completed'";
  let failedQuery = "SELECT COUNT(*) as c FROM pipeline_runs WHERE status = 'failed'";
  let totalCostQuery = 'SELECT SUM(cost_usd) as s FROM pipeline_runs';
  let runsQuery = 'SELECT result_json FROM pipeline_runs WHERE result_json IS NOT NULL';
  
  if (userId) {
    totalQuery += ' WHERE user_id = ?';
    completedQuery += " AND user_id = ?";
    failedQuery += " AND user_id = ?";
    totalCostQuery += ' WHERE user_id = ?';
    runsQuery += ' AND user_id = ?';
  }

  const total = userId ? db.prepare(totalQuery).get(userId) : db.prepare(totalQuery).get();
  const completed = userId ? db.prepare(completedQuery).get(userId) : db.prepare(completedQuery).get();
  const failed = userId ? db.prepare(failedQuery).get(userId) : db.prepare(failedQuery).get();
  
  let memoriesCountQuery = 'SELECT COUNT(*) as c FROM memories WHERE expires_at > ?';
  let filesCountQuery = 'SELECT COUNT(*) as c FROM workspace_files';
  if (userId) {
    filesCountQuery = 'SELECT COUNT(*) as c FROM workspace_files WHERE run_id IN (SELECT id FROM pipeline_runs WHERE user_id = ?)';
  }
  
  const memories = db.prepare(memoriesCountQuery).get(Date.now()) as { c: number };
  const files = userId ? db.prepare(filesCountQuery).get(userId) : db.prepare(filesCountQuery).get();
  const totalCost = userId ? db.prepare(totalCostQuery).get(userId) : db.prepare(totalCostQuery).get();
  
  const runs = userId ? db.prepare(runsQuery).all(userId) : db.prepare(runsQuery).all();
  let tokensUsed = 0;
  for (const r of runs) {
    try {
      const data = JSON.parse(r.result_json);
      if (data && typeof data.tokensUsed === 'number') {
        tokensUsed += data.tokensUsed;
      } else if (data && typeof data.totalTokens === 'number') {
        tokensUsed += data.totalTokens;
      } else if (data && data.totalCost && typeof data.totalCost.inputTokens === 'number' && typeof data.totalCost.outputTokens === 'number') {
        tokensUsed += (data.totalCost.inputTokens + data.totalCost.outputTokens);
      }
    } catch { /* ignore */ }
  }

  return {
    totalRuns: total.c,
    completedRuns: completed.c,
    failedRuns: failed.c,
    successRate: total.c > 0 ? Math.round((completed.c / total.c) * 100) : 0,
    memoryCount: memories.c,
    filesCreated: files.c,
    totalCostUsd: totalCost.s ?? 0,
    tokensUsed,
  };
}

export function getOrbitAnalytics(userId?: string, daysLimit = 14) {
  const db = getDb();
  const daily = [];
  const now = Date.now();

  for (let i = daysLimit - 1; i >= 0; i--) {
    const dayDate = new Date(now - i * 86400000);
    const dayLabel = dayDate.toLocaleDateString('en', { month: 'short', day: 'numeric' });
    
    // Calculate start and end of this day
    const startOfDay = new Date(dayDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dayDate);
    endOfDay.setHours(23, 59, 59, 999);

    let query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(cost_usd) as cost
      FROM pipeline_runs
      WHERE started_at >= ? AND started_at <= ?
    `;
    const params: (string | number)[] = [startOfDay.getTime(), endOfDay.getTime()];
    if (userId) {
      query += ' AND user_id = ?';
      params.push(userId);
    }

    const stats = db.prepare(query).get(...params) as { total: number, completed: number, cost: number | null };

    const total = stats.total ?? 0;
    const completed = stats.completed ?? 0;
    const cost = stats.cost ?? 0;
    const successRate = total > 0 ? Math.round((completed / total) * 100) : 100;

    daily.push({
      day: dayLabel,
      runs: total,
      cost: parseFloat((cost || 0).toFixed(4)),
      success: successRate,
    });
  }

  // 2. Usage breakdown
  let pipelineCountQuery = "SELECT COUNT(*) as c FROM pipeline_runs WHERE task_title NOT LIKE '[Swarm]%'";
  let swarmCountQuery = "SELECT COUNT(*) as c FROM pipeline_runs WHERE task_title LIKE '[Swarm]%'";
  let fileCountQuery = "SELECT COUNT(*) as c FROM workspace_files";
  
  if (userId) {
    pipelineCountQuery += " AND user_id = ?";
    swarmCountQuery += " AND user_id = ?";
    fileCountQuery = "SELECT COUNT(*) as c FROM workspace_files WHERE run_id IN (SELECT id FROM pipeline_runs WHERE user_id = ?)";
  }
  
  const pipelineCount = userId ? db.prepare(pipelineCountQuery).get(userId) : db.prepare(pipelineCountQuery).get();
  const swarmCount = userId ? db.prepare(swarmCountQuery).get(userId) : db.prepare(swarmCountQuery).get();
  const fileCount = userId ? db.prepare(fileCountQuery).get(userId) : db.prepare(fileCountQuery).get();
  const memoryCount = db.prepare("SELECT COUNT(*) as c FROM memories WHERE expires_at > ?").get(Date.now()) as { c: number };

  const pipelines = pipelineCount.c;
  const swarms = swarmCount.c;
  const files = fileCount.c;
  const memories = memoryCount.c;
  const totalOps = pipelines + swarms + files + memories;

  const usageBreakdown = [
    { label: 'Pipeline Runs', value: pipelines, color: '#6366f1', pct: totalOps > 0 ? Math.round((pipelines / totalOps) * 100) : 0 },
    { label: 'Swarm Tasks', value: swarms, color: '#f59e0b', pct: totalOps > 0 ? Math.round((swarms / totalOps) * 100) : 0 },
    { label: 'Workspace Files', value: files, color: '#22d3ee', pct: totalOps > 0 ? Math.round((files / totalOps) * 100) : 0 },
    { label: 'Memory Entries', value: memories, color: '#8b5cf6', pct: totalOps > 0 ? Math.round((memories / totalOps) * 100) : 0 },
  ];

  return {
    daily,
    usageBreakdown,
  };
}

// ============================================
// Cloud Sync Reconciliation Services
// ============================================

export async function getSyncStats(userId?: string) {
  const db = getDb();
  
  // 1. Query SQLite counts
  let runsCountQuery = 'SELECT COUNT(*) as c FROM pipeline_runs';
  let logsCountQuery = 'SELECT COUNT(*) as c FROM pipeline_logs';
  let filesCountQuery = 'SELECT COUNT(*) as c FROM workspace_files';
  
  if (userId) {
    runsCountQuery += ' WHERE user_id = ?';
    logsCountQuery += ' WHERE run_id IN (SELECT id FROM pipeline_runs WHERE user_id = ?)';
    filesCountQuery += ' WHERE run_id IN (SELECT id FROM pipeline_runs WHERE user_id = ?)';
  }
  
  const localRuns = userId ? db.prepare(runsCountQuery).get(userId) : db.prepare(runsCountQuery).get();
  const localLogs = userId ? db.prepare(logsCountQuery).get(userId) : db.prepare(logsCountQuery).get();
  const localFiles = userId ? db.prepare(filesCountQuery).get(userId) : db.prepare(filesCountQuery).get();
  
  // 2. Query Supabase counts
  let remoteRunsCount = 0;
  let remoteLogsCount = 0;
  let remoteFilesCount = 0;
  let remoteChatsCount = 0;
  let cloudStatus = 'connected';
  
  try {
    let runsQuery = supabase.from('orbit_pipeline_runs').select('*', { count: 'exact', head: true });
    let logsQuery = supabase.from('orbit_pipeline_logs').select('*', { count: 'exact', head: true });
    let filesQuery = supabase.from('orbit_workspace_files').select('*', { count: 'exact', head: true });
    
    if (userId) {
      runsQuery = runsQuery.eq('user_id', userId);
    }
    
    const [runsRes, logsRes, filesRes, chatsRes] = await Promise.all([
      runsQuery,
      logsQuery,
      filesQuery,
      supabase.from('orbit_chat_messages').select('*', { count: 'exact', head: true })
    ]);
    
    if (runsRes.error || logsRes.error || filesRes.error) {
      cloudStatus = 'fallback';
    } else {
      remoteRunsCount = runsRes.count ?? 0;
      remoteLogsCount = logsRes.count ?? 0;
      remoteFilesCount = filesRes.count ?? 0;
      remoteChatsCount = chatsRes.count ?? 0;
    }
  } catch (err) {
    cloudStatus = 'fallback';
  }
  
  return {
    status: cloudStatus,
    local: {
      runs: localRuns.c,
      logs: localLogs.c,
      files: localFiles.c,
    },
    remote: {
      runs: remoteRunsCount,
      logs: remoteLogsCount,
      files: remoteFilesCount,
      chats: remoteChatsCount,
    }
  };
}

export async function reconcileLocalData(userId?: string) {
  const db = getDb();
  let syncCount = 0;
  let logsCount = 0;
  let filesCount = 0;
  
  try {
    // 1. Fetch all run IDs from Supabase to find missing runs
    let remoteRunsQuery = supabase.from('orbit_pipeline_runs').select('id');
    if (userId) {
      remoteRunsQuery = remoteRunsQuery.eq('user_id', userId);
    }
    
    const { data: remoteRuns, error } = await remoteRunsQuery;
    if (error) {
      throw new Error(`Supabase query failed: ${error.message}`);
    }
    
    const remoteIds = new Set((remoteRuns || []).map(r => r.id));
    
    // 2. Fetch all runs from SQLite
    let localRunsQuery = 'SELECT * FROM pipeline_runs';
    const localRuns = userId ? db.prepare(localRunsQuery + ' WHERE user_id = ?').all(userId) : db.prepare(localRunsQuery).all();
    
    // 3. Sync runs not in remoteIds
    for (const run of localRuns) {
      if (!remoteIds.has(run.id)) {
        // Sync the run
        await syncRunToSupabase(run);
        syncCount++;
        
        // Sync all logs for this run
        const localLogs = db.prepare('SELECT stage, level, message, timestamp FROM pipeline_logs WHERE run_id = ?').all(run.id);
        for (const log of localLogs) {
          await syncLogToSupabase(run.id, log);
          logsCount++;
        }
        
        // Sync all files for this run
        const localFiles = db.prepare('SELECT file_path as filePath, content, action, created_at FROM workspace_files WHERE run_id = ?').all(run.id);
        for (const file of localFiles) {
          await syncFileToSupabase(run.id, file);
          filesCount++;
        }
      }
    }
  } catch (err) {
    console.error('[Supabase Db Sync] Manual reconciliation failed:', err);
    throw err;
  }
  
  return {
    runsSynced: syncCount,
    logsSynced: logsCount,
    filesSynced: filesCount,
  };
}
