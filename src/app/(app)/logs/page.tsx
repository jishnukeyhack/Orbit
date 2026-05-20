'use client';
import { useState, useEffect } from 'react';

interface LogEntry {
  id: number;
  run_id: string;
  stage: string;
  event_type: string;
  message: string;
  created_at: number;
}

interface PipelineRun {
  id: string;
  task_title: string;
  status: string;
  started_at: number;
  total_duration_ms?: number;
  cost_usd?: number;
}

const STAGE_COLORS: Record<string, string> = {
  worker: '#6366f1', reviewer: '#8b5cf6', tester: '#10b981',
  documenter: '#f59e0b', auditor: '#ef4444', system: '#22d3ee',
};

const EVENT_ICONS: Record<string, string> = {
  'stage:start': '▶', 'stage:complete': '✅', 'stage:fail': '❌',
  'stage:log': '  ', 'pipeline:done': '🏁', 'pipeline:error': '💥',
};

export default function LogsPage() {
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetch('/api/pipeline?limit=30')
      .then(r => r.json())
      .then((d: { runs: PipelineRun[] }) => {
        setRuns(d.runs ?? []);
        if (d.runs?.length > 0) {
          setSelectedRun(d.runs[0].id);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedRun) return;
    setLoading(true);
    fetch(`/api/pipeline?action=logs&runId=${selectedRun}`)
      .then(r => r.json())
      .then((d: { logs: LogEntry[] }) => { setLogs(d.logs ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [selectedRun]);

  const filteredLogs = filter === 'all' ? logs : logs.filter(l => l.stage === filter || l.event_type === filter);
  const stages = [...new Set(logs.map(l => l.stage).filter(Boolean))];

  const statusColor = (s: string) => ({ completed: '#10b981', failed: '#ef4444', running: '#f59e0b' }[s] ?? '#64748b');

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1300, margin: '0 auto', height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>📋 Execution Logs</h1>
        <p style={{ color: '#64748b', margin: '0.3rem 0 0', fontSize: '0.9rem' }}>
          Detailed logs from every pipeline run stored in SQLite
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1rem', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {/* Run list */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontWeight: 600, color: '#94a3b8', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0 }}>
            Pipeline Runs ({runs.length})
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {runs.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#334155', fontSize: '0.82rem' }}>
                No pipeline runs yet.<br />
                <span style={{ color: '#475569' }}>Start a pipeline to see logs.</span>
              </div>
            ) : (
              runs.map(run => (
                <div
                  key={run.id}
                  onClick={() => setSelectedRun(run.id)}
                  style={{
                    padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)',
                    background: selectedRun === run.id ? 'rgba(99,102,241,0.12)' : 'transparent',
                    borderLeft: selectedRun === run.id ? '3px solid #6366f1' : '3px solid transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor(run.status), flexShrink: 0 }} />
                    <div style={{ fontSize: '0.8rem', fontWeight: 500, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {run.task_title}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#475569', display: 'flex', gap: 8 }}>
                    <span>{new Date(run.started_at).toLocaleString()}</span>
                    {run.total_duration_ms && <span>{(run.total_duration_ms / 1000).toFixed(1)}s</span>}
                    {run.cost_usd && <span style={{ color: '#4ade80' }}>${run.cost_usd.toFixed(4)}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Log viewer */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Log header + filter */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
            <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '0.85rem', flex: 1 }}>
              {selectedRun ? `Logs for run ${selectedRun.slice(0, 20)}...` : 'Select a run'}
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {['all', ...stages].map(s => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  style={{
                    padding: '3px 10px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 500, cursor: 'pointer',
                    background: filter === s ? (STAGE_COLORS[s] ?? '#6366f1') + '33' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${filter === s ? (STAGE_COLORS[s] ?? '#6366f1') + '55' : 'rgba(255,255,255,0.08)'}`,
                    color: filter === s ? (STAGE_COLORS[s] ?? '#818cf8') : '#64748b',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Log content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', fontFamily: '"Fira Code", "Consolas", monospace', fontSize: '0.8rem' }}>
            {loading ? (
              <div style={{ color: '#475569', padding: '2rem', textAlign: 'center' }}>Loading logs...</div>
            ) : filteredLogs.length === 0 ? (
              <div style={{ color: '#334155', padding: '2rem', textAlign: 'center' }}>
                {selectedRun ? 'No logs found for this run.' : 'Select a run from the left panel.'}
              </div>
            ) : (
              filteredLogs.map((log, i) => {
                const stageColor = STAGE_COLORS[log.stage] ?? '#64748b';
                const isPositive = log.message?.startsWith('✅') || log.message?.startsWith('✓');
                const isNegative = log.message?.startsWith('❌') || log.message?.startsWith('✗');
                const msgColor = isPositive ? '#10b981' : isNegative ? '#ef4444' : '#94a3b8';
                return (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.02)', alignItems: 'flex-start' }}>
                    <span style={{ color: '#1e293b', fontSize: '0.65rem', flexShrink: 0, marginTop: 2, minWidth: 70 }}>
                      {new Date(log.created_at).toLocaleTimeString()}
                    </span>
                    <span style={{ color: stageColor, minWidth: 72, fontSize: '0.68rem', opacity: 0.8, flexShrink: 0, marginTop: 2 }}>
                      [{log.stage?.toUpperCase() ?? 'SYS'}]
                    </span>
                    <span style={{ color: '#475569', fontSize: '0.7rem', flexShrink: 0, marginTop: 2 }}>
                      {EVENT_ICONS[log.event_type] ?? '  '}
                    </span>
                    <span style={{ color: msgColor, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {log.message}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Log footer */}
          {filteredLogs.length > 0 && (
            <div style={{ padding: '8px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '0.7rem', color: '#334155', flexShrink: 0 }}>
              {filteredLogs.length} log entries · Click a row to expand
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
