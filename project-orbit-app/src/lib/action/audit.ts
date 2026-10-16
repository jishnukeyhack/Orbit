// ============================================
// Orbit — Agent Action Layer: audit
// Every attempted action is recorded — allowed, denied, or failed.
// Default sink appends JSONL to orbit-workspace/audit.jsonl; swap in a
// DB sink (Orbit already has better-sqlite3 in src/lib/server/db.ts)
// by implementing AuditSink.
// ============================================
import { appendFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import type { AuditRecord, AuditSink } from './types';

const SECRET_KEYS = /password|token|api[-_]?key|secret|authorization|cookie/i;

export function redactArgs(args: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(args)) {
    if (SECRET_KEYS.test(k)) {
      out[k] = '***';
    } else if (typeof v === 'string' && v.length > 500) {
      out[k] = `${v.slice(0, 500)}…[${v.length} chars]`;
    } else {
      out[k] = v;
    }
  }
  return out;
}

export class InMemoryAuditSink implements AuditSink {
  records: AuditRecord[] = [];
  write(record: AuditRecord): void {
    this.records.push(record);
  }
}

export class JsonlFileAuditSink implements AuditSink {
  constructor(private filePath: string) {}
  write(record: AuditRecord): void {
    const dir = path.dirname(this.filePath);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    appendFileSync(this.filePath, JSON.stringify(record) + '\n', 'utf-8');
  }
}

export function defaultAuditSink(workspaceRoot: string): AuditSink {
  return new JsonlFileAuditSink(path.join(workspaceRoot, 'audit.jsonl'));
}
