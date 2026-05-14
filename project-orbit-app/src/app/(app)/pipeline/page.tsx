'use client';
import { useState, useEffect, useRef } from 'react';

interface PipelineEvent {
  type: string;
  stage?: string;
  line?: string;
  message?: string;
  data?: unknown;
  timestamp: number;
}

interface PipelineResult {
  success?: boolean;
  totalDuration?: number;
  iterations?: number;
  testsPassed?: number;
  testsFailed?: number;
  coverage?: number;
  totalCost?: { costUsd: number; inputTokens: number; outputTokens: number; model: string };
}

const STAGE_INFO: Record<string, { icon: string; label: string; color: string; desc: string }> = {
  worker:     { icon: '⚡', label: 'Worker',     color: '#6366f1', desc: 'Implements the code' },
  reviewer:   { icon: '🔍', label: 'Reviewer',   color: '#8b5cf6', desc: 'Reviews for quality' },
  tester:     { icon: '🧪', label: 'Tester',     color: '#10b981', desc: 'Writes & runs tests' },
  documenter: { icon: '📝', label: 'Documenter', color: '#f59e0b', desc: 'Creates docs' },
  auditor:    { icon: '🔒', label: 'Auditor',    color: '#ef4444', desc: 'Security audit' },
};

const QUICK_TASKS = [
  { label: 'JWT Auth System', title: 'Implement JWT authentication with refresh tokens', desc: 'Include login/logout endpoints, token refresh, and middleware for protected routes' },
  { label: 'REST API CRUD', title: 'Build a complete CRUD REST API for a products resource', desc: 'With validation, error handling, pagination, and proper HTTP status codes' },
  { label: 'Rate Limiter', title: 'Add rate limiting to API endpoints', desc: 'Token bucket algorithm with per-user and per-IP limits, Redis support' },
  { label: 'Data Pipeline', title: 'Build an ETL data pipeline with error recovery', desc: 'Extract from CSV/JSON, transform with validation, load to database with retry logic' },
  { label: 'WebSocket Chat', title: 'Implement real-time chat with WebSocket', desc: 'Room-based chat with message history, user presence, and typing indicators' },
  { label: 'Search Engine', title: 'Build full-text search with ranking algorithm', desc: 'TF-IDF scoring, fuzzy matching, filters, and search analytics' },
];

export default function PipelinePage() {
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<{ stage: string; line: string; timestamp: number }[]>([]);
  const [stages, setStages] = useState<Record<string, 'pending' | 'running' | 'done' | 'failed'>>({});
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [history, setHistory] = useState<{ title: string; success: boolean; cost: number; ts: number }[]>([]);
  const logsRef = useRef<HTMLDivElement>(null);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => () => { esRef.current?.close(); }, []);
  useEffect(() => {
    if (logsRef.current) logsRef.current.scrollTop = logsRef.current.scrollHeight;
  }, [logs]);

  function run() {
    if (!taskTitle.trim() || running) return;
    setRunning(true);
    setLogs([]);
    setStages({});
    setResult(null);

    const params = new URLSearchParams({ taskTitle, taskDescription: taskDesc });
    const es = new EventSource(`/api/pipeline/stream?${params}`);
    esRef.current = es;

    es.onmessage = e => {
      const evt: PipelineEvent = JSON.parse(e.data);

      if ((evt.line || evt.message) && evt.stage !== undefined) {
        setLogs(prev => [...prev, { stage: evt.stage ?? 'system', line: evt.line ?? evt.message ?? '', timestamp: evt.timestamp }]);
      }

      if (evt.type === 'stage:start' && evt.stage) setStages(p => ({ ...p, [evt.stage!]: 'running' }));
      if (evt.type === 'stage:complete' && evt.stage) setStages(p => ({ ...p, [evt.stage!]: 'done' }));
      if (evt.type === 'stage:fail' && evt.stage) setStages(p => ({ ...p, [evt.stage!]: 'failed' }));
      if (evt.type === 'pipeline:result' && evt.data) {
        const r = evt.data as PipelineResult;
        setResult(r);
        setHistory(prev => [{ title: taskTitle, success: r.success ?? false, cost: r.totalCost?.costUsd ?? 0, ts: Date.now() }, ...prev].slice(0, 10));
      }
      if (evt.type === 'pipeline:done' || evt.type === 'pipeline:error') {
        setRunning(false);
        es.close();
      }
    };
    es.onerror = () => { setRunning(false); es.close(); };
  }

  const logColor = (stage: string, line: string) => {
    if (line.startsWith('✅') || line.startsWith('✓')) return '#10b981';
    if (line.startsWith('❌') || line.startsWith('✗')) return '#ef4444';
    if (line.startsWith('↩')) return '#f59e0b';
    if (line.startsWith('📡')) return '#22d3ee';
    if (line.startsWith('📄')) return '#94a3b8';
    if (stage === 'system') return '#6366f1';
    return STAGE_INFO[stage]?.color ? `${STAGE_INFO[stage].color}cc` : '#94a3b8';
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1300, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f1f5f9', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          🔀 Pipeline Runner
          {process.env.NEXT_PUBLIC_HAS_OPENAI === 'true' && (
            <span style={{ fontSize: '0.65rem', padding: '3px 8px', borderRadius: 10, background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)', fontWeight: 500 }}>
              GPT-4o LIVE
            </span>
          )}
        </h1>
        <p style={{ color: '#64748b', margin: '0.3rem 0 0', fontSize: '0.9rem' }}>
          5-stage autonomous pipeline: Worker → Reviewer → Tester → Documenter → Auditor
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem' }}>
        {/* Left: input + stages + logs */}
        <div>
          {/* Input form */}
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '1.5rem', marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: 6 }}>Task Title *</label>
            <input
              value={taskTitle}
              onChange={e => setTaskTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) run(); }}
              placeholder="e.g. Add rate limiting to auth endpoints"
              disabled={running}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#f1f5f9', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', marginBottom: 12 }}
            />
            <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: 6 }}>Description (optional)</label>
            <textarea
              value={taskDesc}
              onChange={e => setTaskDesc(e.target.value)}
              placeholder="Additional context, requirements, or constraints..."
              rows={2}
              disabled={running}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#f1f5f9', fontSize: '0.85rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', marginBottom: 14 }}
            />

            {/* Quick tasks */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: '0.72rem', color: '#475569', marginBottom: 8 }}>Quick tasks:</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {QUICK_TASKS.map(qt => (
                  <button
                    key={qt.label}
                    onClick={() => { setTaskTitle(qt.title); setTaskDesc(qt.desc); }}
                    disabled={running}
                    style={{ padding: '4px 10px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 6, color: '#818cf8', fontSize: '0.72rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    {qt.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={run}
              disabled={!taskTitle.trim() || running}
              style={{
                padding: '11px 32px',
                background: taskTitle.trim() && !running ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.06)',
                border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: '0.95rem',
                cursor: taskTitle.trim() && !running ? 'pointer' : 'not-allowed', transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              {running
                ? <><div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} /> Running...</>
                : '▶ Run Pipeline'}
            </button>
          </div>

          {/* Stage tracker */}
          {(running || Object.keys(stages).length > 0) && (
            <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              {Object.entries(STAGE_INFO).map(([key, info]) => {
                const s = stages[key] ?? 'pending';
                const glow = s === 'running' ? `0 0 16px ${info.color}55` : 'none';
                return (
                  <div
                    key={key}
                    style={{
                      flex: 1, minWidth: 110, padding: '12px 14px', borderRadius: 12,
                      background: s === 'done' ? `${info.color}15` : s === 'running' ? `${info.color}22` : s === 'failed' ? '#ef444415' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${s === 'done' ? info.color + '55' : s === 'running' ? info.color : s === 'failed' ? '#ef4444' : 'rgba(255,255,255,0.07)'}`,
                      transition: 'all 0.3s', boxShadow: glow,
                    }}
                  >
                    <div style={{ fontSize: '1.2rem', marginBottom: 4 }}>
                      {s === 'running' ? <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span> : s === 'done' ? '✅' : s === 'failed' ? '❌' : info.icon}
                    </div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: s === 'pending' ? '#334155' : '#f1f5f9' }}>{info.label}</div>
                    <div style={{ fontSize: '0.65rem', color: info.color, marginTop: 2, textTransform: 'capitalize' }}>{s}</div>
                    <div style={{ fontSize: '0.62rem', color: '#334155', marginTop: 2 }}>{info.desc}</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Live log */}
          {logs.length > 0 && (
            <div style={{ background: '#050810', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden', marginBottom: '1rem' }}>
              <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
                {running && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981', animation: 'pulse 1s infinite' }} />}
                <span style={{ fontSize: '0.75rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Live Output</span>
              </div>
              <div ref={logsRef} style={{ maxHeight: 340, overflowY: 'auto', padding: '12px 16px', fontFamily: '"Fira Code", "Consolas", monospace', fontSize: '0.8rem' }}>
                {logs.map((l, i) => {
                  const stageInfo = STAGE_INFO[l.stage];
                  return (
                    <div key={i} style={{ display: 'flex', gap: 10, padding: '2px 0', alignItems: 'flex-start' }}>
                      {stageInfo && (
                        <span style={{ color: stageInfo.color, minWidth: 76, fontSize: '0.7rem', opacity: 0.7, flexShrink: 0, marginTop: 2 }}>
                          [{stageInfo.label}]
                        </span>
                      )}
                      <span style={{ color: logColor(l.stage, l.line), lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{l.line}</span>
                    </div>
                  );
                })}
                {running && <div style={{ color: '#6366f1', marginTop: 6 }}>▋</div>}
              </div>
            </div>
          )}

          {/* Result card */}
          {result && (
            <div style={{
              background: result.success ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${result.success ? '#10b98144' : '#ef444444'}`,
              borderRadius: 14, padding: '1.5rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1rem' }}>
                <span style={{ fontSize: '2rem' }}>{result.success ? '✅' : '❌'}</span>
                <div>
                  <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '1.1rem' }}>
                    {result.success ? 'Pipeline Completed!' : 'Pipeline Failed'}
                  </div>
                  <div style={{ color: '#64748b', fontSize: '0.82rem', marginTop: 2 }}>
                    {result.iterations ?? 1} iteration{(result.iterations ?? 1) > 1 ? 's' : ''} ·{' '}
                    {result.totalCost?.model === 'gpt-4o' ? '🟢 Real GPT-4o' : '🟡 Simulation'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
                {[
                  { label: 'Tests Passed', value: result.testsPassed ?? '—', color: '#10b981' },
                  { label: 'Coverage', value: result.coverage ? `${result.coverage}%` : '—', color: '#22d3ee' },
                  { label: 'Tokens Used', value: result.totalCost ? ((result.totalCost.inputTokens + result.totalCost.outputTokens)).toLocaleString() : '—', color: '#8b5cf6' },
                  { label: 'Cost', value: result.totalCost ? `$${result.totalCost.costUsd.toFixed(4)}` : 'Free', color: '#4ade80' },
                ].map(stat => (
                  <div key={stat.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '10px 14px' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: stat.color }}>{stat.value}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 2 }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: history */}
        <div>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontWeight: 600, color: '#f1f5f9', fontSize: '0.85rem' }}>
              📋 Run History
            </div>
            <div style={{ padding: '8px', maxHeight: 400, overflowY: 'auto' }}>
              {history.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#334155', fontSize: '0.82rem' }}>
                  No runs yet. Start your first pipeline above.
                </div>
              ) : (
                history.map((h, i) => (
                  <div
                    key={i}
                    onClick={() => setTaskTitle(h.title)}
                    style={{ padding: '10px 12px', borderRadius: 8, cursor: 'pointer', marginBottom: 4, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', transition: 'all 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span>{h.success ? '✅' : '❌'}</span>
                      <span style={{ fontSize: '0.78rem', fontWeight: 500, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{h.title}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#475569' }}>
                      <span>{new Date(h.ts).toLocaleTimeString()}</span>
                      {h.cost > 0 && <span style={{ color: '#4ade80' }}>${h.cost.toFixed(4)}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Info card */}
          <div style={{ marginTop: '1rem', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 14, padding: '1rem' }}>
            <div style={{ fontWeight: 600, color: '#818cf8', fontSize: '0.82rem', marginBottom: 8 }}>💡 How it works</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.7 }}>
              Each pipeline stage calls GPT-4o with a specialized system prompt:
              <br /><br />
              <b style={{ color: '#6366f1' }}>⚡ Worker</b> — Writes the implementation<br />
              <b style={{ color: '#8b5cf6' }}>🔍 Reviewer</b> — Reviews for quality<br />
              <b style={{ color: '#10b981' }}>🧪 Tester</b> — Generates test suite<br />
              <b style={{ color: '#f59e0b' }}>📝 Documenter</b> — Creates documentation<br />
              <b style={{ color: '#ef4444' }}>🔒 Auditor</b> — Security audit
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:0.5} 50%{opacity:1} }
      `}</style>
    </div>
  );
}
