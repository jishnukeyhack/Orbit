'use client';
import { useState, useEffect, useRef } from 'react';
import { 
  Play, Trash2, RefreshCw, Cpu, ShieldCheck, FileCode2, Gauge, 
  Activity, CheckCircle2, AlertCircle, Terminal as TerminalIcon, 
  ArrowRight, Sparkles, Code2, Layers, HardDrive, DollarSign
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

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

const STAGE_INFO: Record<string, { icon: React.ComponentType<any>; label: string; color: string; desc: string; glow: string }> = {
  worker:     { icon: Cpu, label: 'Worker',     color: '#6366f1', desc: 'Implements the code', glow: 'rgba(99,102,241,0.25)' },
  reviewer:   { icon: Code2, label: 'Reviewer',   color: '#8b5cf6', desc: 'Reviews for quality', glow: 'rgba(139,92,246,0.25)' },
  tester:     { icon: Activity, label: 'Tester',     color: '#10b981', desc: 'Writes & runs tests', glow: 'rgba(16,185,129,0.25)' },
  documenter: { icon: FileCode2, label: 'Documenter', color: '#f59e0b', desc: 'Creates docs', glow: 'rgba(245,158,11,0.25)' },
  auditor:    { icon: ShieldCheck, label: 'Auditor',    color: '#ef4444', desc: 'Security audit', glow: 'rgba(239,68,68,0.25)' },
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
  const [history, setHistory] = useState<{ id: string; title: string; success: boolean; cost: number; ts: number }[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const logsRef = useRef<HTMLDivElement>(null);
  const esRef = useRef<EventSource | null>(null);

  // Active streaming code output preview state
  const [activeCodePreview, setActiveCodePreview] = useState<string>('');

  const fetchHistory = async () => {
    try {
      const url = userId ? `/api/pipeline?limit=10&userId=${userId}` : '/api/pipeline?limit=10';
      const res = await fetch(url);
      const data = await res.json();
      if (data.runs) {
        setHistory(data.runs.map((r: any) => ({
          id: r.id,
          title: r.task_title,
          success: r.status === 'completed',
          cost: r.cost_usd ?? 0,
          ts: r.started_at,
        })));
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user && mounted) {
        setUserId(user.id);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [userId]);

  const handleDeleteRun = async (e: React.MouseEvent, runId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this pipeline run from history?')) return;
    
    try {
      const res = await fetch(`/api/pipeline?runId=${runId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setHistory(prev => prev.filter(h => h.id !== runId));
      } else {
        const err = await res.json();
        alert(`Failed to delete run: ${err.error || 'Unknown error'}`);
      }
    } catch (err) {
      alert(`Error deleting run: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  useEffect(() => {
    if (logsRef.current) logsRef.current.scrollTop = logsRef.current.scrollHeight;
  }, [logs]);

  function run() {
    if (!taskTitle.trim() || running) return;
    setRunning(true);
    setLogs([]);
    setStages({});
    setResult(null);
    setActiveCodePreview('');

    const runId = `run-${Date.now()}`;
    const localOpenaiKey = localStorage.getItem('orbit_openai_key') || '';
    const localGeminiKey = localStorage.getItem('orbit_gemini_key') || '';
    const params = new URLSearchParams({ taskTitle, taskDescription: taskDesc, runId });
    if (localOpenaiKey) params.set('openai_key', localOpenaiKey);
    if (localGeminiKey) params.set('gemini_key', localGeminiKey);
    if (userId) params.set('userId', userId);

    const broadcastChannel = new BroadcastChannel('orbit_pipeline_sync');
    const es = new EventSource(`/api/pipeline/stream?${params}`);
    esRef.current = es;

    // Set up Supabase Realtime channel subscription for high-availability log streaming backup
    const channel = supabase
      .channel(`pipeline-logs-${runId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orbit_pipeline_logs',
          filter: `run_id=eq.${runId}`,
        },
        (payload) => {
          const newLog = payload.new;
          const stage = newLog.stage || 'system';
          const lineContent = newLog.message || '';
          const timestamp = newLog.timestamp || Date.now();

          setLogs(prev => {
            if (prev.some(l => l.line === lineContent && l.timestamp === timestamp)) return prev;
            return [...prev, { stage, line: lineContent, timestamp }];
          });

          if (stage === 'worker' && lineContent.length > 10 && !lineContent.startsWith(' ') && !lineContent.startsWith('✓')) {
            setActiveCodePreview(prev => {
              if (prev.includes(lineContent)) return prev;
              return prev + lineContent + '\n';
            });
          }
        }
      )
      .subscribe();

    es.onmessage = e => {
      const evt: PipelineEvent = JSON.parse(e.data);

      if ((evt.line || evt.message) && evt.stage !== undefined) {
        const lineContent = evt.line ?? evt.message ?? '';
        setLogs(prev => {
          if (prev.some(l => l.line === lineContent && l.timestamp === evt.timestamp)) return prev;
          return [...prev, { stage: evt.stage ?? 'system', line: lineContent, timestamp: evt.timestamp }];
        });

        // Extract raw code snippets for dynamic live preview box
        if (evt.stage === 'worker' && lineContent.length > 10 && !lineContent.startsWith(' ') && !lineContent.startsWith('✓')) {
          setActiveCodePreview(prev => {
            if (prev.includes(lineContent)) return prev;
            return prev + lineContent + '\n';
          });
        }
      }

      if (evt.type === 'stage:start' && evt.stage) setStages(p => ({ ...p, [evt.stage!]: 'running' }));
      if (evt.type === 'stage:complete' && evt.stage) setStages(p => ({ ...p, [evt.stage!]: 'done' }));
      if (evt.type === 'stage:fail' && evt.stage) setStages(p => ({ ...p, [evt.stage!]: 'failed' }));
      if (evt.type === 'pipeline:result' && evt.data) {
        const r = evt.data as PipelineResult;
        setResult(r);
        setHistory(prev => [{ id: runId, title: taskTitle, success: r.success ?? false, cost: r.totalCost?.costUsd ?? 0, ts: Date.now() }, ...prev].slice(0, 10));
      }

      try {
        broadcastChannel.postMessage('update');
      } catch (err) {
        console.error('Error posting to BroadcastChannel:', err);
      }

      if (evt.type === 'pipeline:done' || evt.type === 'pipeline:error') {
        setRunning(false);
        es.close();
        supabase.removeChannel(channel);
        try { broadcastChannel.close(); } catch {}
        fetchHistory();
      }
    };
    es.onerror = () => { 
      setRunning(false); 
      es.close(); 
      supabase.removeChannel(channel);
      try { broadcastChannel.close(); } catch {}
    };
  }

  const logColor = (stage: string, line: string) => {
    if (line.startsWith('✓')) return '#10b981';
    if (line.startsWith('✗')) return '#ef4444';
    if (line.startsWith('⚠')) return '#f59e0b';
    if (line.startsWith('ℹ')) return '#22d3ee';
    if (line.startsWith('⚙')) return '#94a3b8';
    if (stage === 'system') return '#818cf8';
    return STAGE_INFO[stage]?.color ? `${STAGE_INFO[stage].color}cc` : '#cbd5e1';
  };

  return (
    <div style={{ padding: '2rem', maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Premium Header Grid */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0, background: 'linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 50%, #94a3b8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'flex', alignItems: 'center', gap: 12 }}>
             Pipeline Studio
            {process.env.NEXT_PUBLIC_HAS_OPENAI === 'true' && (
              <span style={{ fontSize: '0.68rem', padding: '3px 10px', borderRadius: 20, background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.22)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                GPT-4o LIVE
              </span>
            )}
          </h1>
          <p style={{ color: '#64748b', margin: '0.4rem 0 0', fontSize: '0.92rem', fontWeight: 500 }}>
            5-stage autonomous development conduit: Worker → Reviewer → Tester → Documenter → Auditor
          </p>
        </div>
      </div>

      {/* SVG Pipeline Data flow Conduits (Google Neural Style) */}
      <div style={{
        background: '#040813', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: '2rem 1.5rem',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)', position: 'relative', overflow: 'hidden'
      }}>
        {/* Neon decorative grid */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(99,102,241,0.06) 1.5px, transparent 1.5px)', backgroundSize: '16px 16px', opacity: 0.8, pointerEvents: 'none' }} />

        {/* Dynamic conduit path connections */}
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
          <g>
            {Object.keys(STAGE_INFO).map((_, i, arr) => {
              if (i === arr.length - 1) return null;
              const stepPercent = 100 / arr.length;
              const startX = `${stepPercent * (i + 0.5)}%`;
              const endX = `${stepPercent * (i + 1.5)}%`;
              const stageKey = arr[i];
              const nextStageKey = arr[i+1];
              const isActive = stages[stageKey] === 'done' && stages[nextStageKey] === 'running';
              const isDone = stages[stageKey] === 'done' && stages[nextStageKey] === 'done';

              return (
                <path
                  key={i}
                  d={`M ${startX} 52 L ${endX} 52`}
                  fill="none"
                  stroke={isActive ? 'url(#active-gradient)' : isDone ? '#10b981' : '#1f2937'}
                  strokeWidth={isActive ? 3 : 1.5}
                  strokeDasharray={isActive ? '8,8' : 'none'}
                  style={{
                    animation: isActive ? 'dash 18s linear infinite' : 'none',
                    transition: 'stroke 0.4s, stroke-width 0.4s'
                  }}
                />
              );
            })}
            <defs>
              <linearGradient id="active-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="50%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
          </g>
        </svg>

        {/* Pipeline Nodes */}
        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
          {Object.entries(STAGE_INFO).map(([key, info]) => {
            const s = stages[key] ?? 'pending';
            const NodeIcon = info.icon;
            const isPending = s === 'pending';
            const isRunning = s === 'running';
            const isDone = s === 'done';
            const isFailed = s === 'failed';

            const nodeBorder = () => {
              if (isRunning) return info.color;
              if (isDone) return '#10b981';
              if (isFailed) return '#ef4444';
              return 'rgba(255,255,255,0.06)';
            };

            const nodeBg = () => {
              if (isRunning) return `${info.color}15`;
              if (isDone) return 'rgba(16,185,129,0.08)';
              if (isFailed) return 'rgba(239,68,68,0.08)';
              return '#070a16';
            };

            return (
              <div
                key={key}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
                  padding: '0 8px'
                }}
              >
                <div
                  style={{
                    width: 52, height: 52, borderRadius: '50%', background: nodeBg(),
                    border: `2.5px solid ${nodeBorder()}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: isRunning ? `0 0 25px ${info.color}45` : isDone ? '0 0 25px rgba(16,185,129,0.3)' : 'none',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', position: 'relative', cursor: 'default'
                  }}
                >
                  {isRunning && (
                    <div style={{
                      position: 'absolute', inset: -6, borderRadius: '50%', border: `2px dashed ${info.color}`,
                      animation: 'spin 12s linear infinite'
                    }} />
                  )}
                  <NodeIcon size={20} style={{ color: isPending ? '#475569' : isDone ? '#10b981' : isFailed ? '#ef4444' : info.color, transition: 'color 0.4s' }} />
                </div>
                <div style={{ marginTop: 12, fontWeight: 700, fontSize: '0.85rem', color: isPending ? '#475569' : '#f1f5f9' }}>{info.label}</div>
                <div style={{ fontSize: '0.68rem', color: isPending ? '#334155' : isDone ? '#10b981' : isFailed ? '#ef4444' : info.color, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em', marginTop: 4 }}>
                  {s}
                </div>
                <div style={{ fontSize: '0.65rem', color: '#475569', marginTop: 6, maxWidth: 120 }}>{info.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Studio Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', alignItems: 'start' }}>
        
        {/* Left Column — Config Inputs, Live Code Previewer & Console Logs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Config Box */}
          <div style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16,
            padding: '1.5rem', boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Layers size={16} style={{ color: '#6366f1' }} /> Workspace Core Configurations
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginBottom: 6, fontWeight: 600 }}>TASK HEADING *</label>
                <input
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) run(); }}
                  placeholder="e.g., Integrate fully operational JWT authentication"
                  disabled={running}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)', color: '#f1f5f9', fontSize: '0.85rem', outline: 'none', transition: 'border-color 0.2s', fontFamily: 'inherit' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginBottom: 6, fontWeight: 600 }}>TASK CONTEXT / SCOPE</label>
                <input
                  value={taskDesc}
                  onChange={e => setTaskDesc(e.target.value)}
                  placeholder="e.g., Include secure refresh tokens & route verification guards"
                  disabled={running}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)', color: '#f1f5f9', fontSize: '0.85rem', outline: 'none', transition: 'border-color 0.2s', fontFamily: 'inherit' }}
                />
              </div>
            </div>

            {/* Quick tasks */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: '0.72rem', color: '#475569', marginBottom: 8, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Layers size={11} style={{ color: '#818cf8' }} /> Quick templates:
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {QUICK_TASKS.map(qt => (
                  <button
                    key={qt.label}
                    onClick={() => { setTaskTitle(qt.title); setTaskDesc(qt.desc); }}
                    disabled={running}
                    style={{ padding: '6px 12px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.18)', borderRadius: 8, color: '#818cf8', fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 600 }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.12)'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.06)'; e.currentTarget.style.color = '#818cf8'; }}
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
                width: '100%', padding: '12px',
                background: taskTitle.trim() && !running ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.04)',
                border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: '0.9rem',
                cursor: taskTitle.trim() && !running ? 'pointer' : 'not-allowed', transition: 'all 0.25s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: taskTitle.trim() && !running ? '0 10px 20px rgba(99,102,241,0.25)' : 'none'
              }}
            >
              {running ? (
                <>
                  <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> 
                  Streaming Autopilot Pipelines...
                </>
              ) : (
                <>
                  <Play size={15} fill="#fff" /> Deploy Autonomous Conduit
                </>
              )}
            </button>
          </div>

          {/* Side-by-side Terminal Logs & Live Code Previewer */}
          <div style={{ display: 'grid', gridTemplateColumns: activeCodePreview ? '1fr 1fr' : '1fr', gap: '1.2rem', transition: 'all 0.3s' }}>
            
            {/* Live Terminal Log */}
            <div style={{ background: '#02040a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.01)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TerminalIcon size={14} style={{ color: '#10b981' }} />
                  <span style={{ fontSize: '0.72rem', color: '#cbd5e1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Conduit Console Logs</span>
                </div>
                {running && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'pulse 1s infinite' }} />
                    <span style={{ fontSize: '0.62rem', color: '#475569', fontWeight: 700 }}>active stream</span>
                  </div>
                )}
              </div>

              <div ref={logsRef} style={{ height: 350, overflowY: 'auto', padding: '16px 20px', fontFamily: '"Fira Code", "Consolas", monospace', fontSize: '0.78rem', background: '#020409', scrollBehavior: 'smooth' }}>
                {logs.length === 0 ? (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#334155', gap: 6 }}>
                     Console idle. Start a run above to see output.
                  </div>
                ) : (
                  logs.map((l, i) => {
                    const stageInfo = STAGE_INFO[l.stage];
                    return (
                      <div key={i} style={{ display: 'flex', gap: 10, padding: '3px 0', alignItems: 'flex-start' }}>
                        {stageInfo && (
                          <span style={{ color: stageInfo.color, minWidth: 72, fontSize: '0.68rem', fontWeight: 700, opacity: 0.8, flexShrink: 0, marginTop: 1.5 }}>
                            [{stageInfo.label}]
                          </span>
                        )}
                        <span style={{ color: logColor(l.stage, l.line), lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{l.line}</span>
                      </div>
                    );
                  })
                )}
                {running && <div style={{ color: '#6366f1', marginTop: 6, animation: 'blink 0.8s infinite' }}>▋</div>}
              </div>
            </div>

            {/* Live Streaming Code Previewer */}
            {activeCodePreview && (
              <div style={{ background: '#02040a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.01)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Code2 size={14} style={{ color: '#6366f1' }} />
                    <span style={{ fontSize: '0.72rem', color: '#cbd5e1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Streaming Sandbox Preview</span>
                  </div>
                  <span style={{ fontSize: '0.65rem', color: '#475569', fontFamily: 'monospace' }}>src/implementation.ts</span>
                </div>

                <div style={{ height: 350, overflowY: 'auto', padding: '16px 20px', fontFamily: '"Fira Code", "Consolas", monospace', fontSize: '0.75rem', background: '#010206', color: '#818cf8', lineHeight: 1.6 }}>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{activeCodePreview}</pre>
                </div>
              </div>
            )}

          </div>

          {/* Premium Completed Result Widget */}
          {result && (
            <div style={{
              background: result.success ? 'rgba(16,185,129,0.04)' : 'rgba(239,68,68,0.04)',
              border: `1px solid ${result.success ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
              borderRadius: 16, padding: '1.5rem', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: '1.25rem' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: result.success ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {result.success ? <CheckCircle2 size={24} style={{ color: '#10b981' }} /> : <AlertCircle size={24} style={{ color: '#ef4444' }} />}
                </div>
                <div>
                  <div style={{ fontWeight: 800, color: '#f1f5f9', fontSize: '1.15rem', letterSpacing: '-0.01em' }}>
                    {result.success ? 'Conduit Completed Successfully' : 'Pipeline Execution Halted'}
                  </div>
                  <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: 2, fontWeight: 500 }}>
                    Duration: {((result.totalDuration ?? 0) / 1000).toFixed(2)}s · {result.iterations ?? 1} thinking cycles
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {[
                  { label: 'Tests Passed', value: result.testsPassed ?? '—', color: '#10b981', sub: result.testsFailed ? `${result.testsFailed} failed` : 'All safe' },
                  { label: 'Test Coverage', value: result.coverage ? `${result.coverage}%` : '—', color: '#22d3ee', sub: 'Critical paths' },
                  { label: 'Total Tokens', value: result.totalCost ? (result.totalCost.inputTokens + result.totalCost.outputTokens).toLocaleString() : '—', color: '#8b5cf6', sub: `${result.totalCost?.model || 'Simulation'}` },
                  { label: 'Computed Cost', value: result.totalCost ? `$${result.totalCost.costUsd.toFixed(4)}` : 'Free Tier', color: '#4ade80', sub: 'Secure Sandbox' },
                ].map(stat => (
                  <div key={stat.label} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontSize: '0.68rem', color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{stat.label}</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: stat.color, marginTop: 4 }}>{stat.value}</div>
                    <div style={{ fontSize: '0.68rem', color: '#475569', marginTop: 2 }}>{stat.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Column — Run History & Informational Widgets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          
          {/* Run History List */}
          <div style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16,
            overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
          }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.01)' }}>
              <span style={{ fontWeight: 700, color: '#cbd5e1', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
                <HardDrive size={13} style={{ color: '#818cf8' }} /> Conduit Logs History
              </span>
            </div>

            <div style={{ padding: 10, maxHeight: 380, overflowY: 'auto' }}>
              {history.length === 0 ? (
                <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#334155', fontSize: '0.8rem', fontWeight: 500 }}>
                  No historical telemetry. Initiate a run to begin.
                </div>
              ) : (
                history.map((h, i) => (
                  <div
                    key={h.id || i}
                    onClick={() => { if (!running) setTaskTitle(h.title); }}
                    style={{
                      padding: '10px 12px', borderRadius: 10, cursor: running ? 'not-allowed' : 'pointer', marginBottom: 6,
                      background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={e => { if (!running) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                    onMouseLeave={e => { if (!running) e.currentTarget.style.background = 'rgba(255,255,255,0.01)'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: h.success ? '#10b981' : '#ef4444',
                        boxShadow: h.success ? '0 0 6px #10b981' : '0 0 6px #ef4444'
                      }} />
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{h.title}</span>
                      {h.id && (
                        <button
                          onClick={(e) => handleDeleteRun(e, h.id)}
                          style={{
                            background: 'transparent', border: 'none', color: '#475569', cursor: 'pointer', padding: 2, borderRadius: 4, transition: 'all 0.15s'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.background = 'transparent'; }}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#475569', fontWeight: 600 }}>
                      <span>{new Date(h.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {h.cost > 0 && <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 1 }}><DollarSign size={10} />{h.cost.toFixed(4)}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Guide */}
          <div style={{
            background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.18)', borderRadius: 16,
            padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 10
          }}>
            <div style={{ fontWeight: 700, color: '#818cf8', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6 }}>
               Autonomous Engine Guidelines
            </div>
            <p style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.65, margin: 0 }}>
              Orbit pipelines run completely inside verified sandboxed environments, spawning specialized sub-agents via standard shell processes.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, borderTop: '1px solid rgba(99,102,241,0.1)', paddingTop: 10 }}>
              {[
                { label: 'Worker', color: '#6366f1', desc: 'Assembles types, implementations.' },
                { label: 'Reviewer', color: '#8b5cf6', desc: 'Assesses security risks, bugs.' },
                { label: 'Tester', color: '#10b981', desc: 'Writes unit tests & tracks coverage.' },
                { label: 'Documenter', color: '#f59e0b', desc: 'Generates API markdowns.' },
                { label: 'Auditor', color: '#ef4444', desc: 'Certifies dependency safety.' }
              ].map(el => (
                <div key={el.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                  <span style={{ fontWeight: 700, color: el.color }}>{el.label}</span>
                  <span style={{ color: '#475569' }}>{el.desc}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:0.5} 50%{opacity:1} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes dash {
          to {
            stroke-dashoffset: -1000;
          }
        }
      `}</style>
    </div>
  );
}
