'use client';
import { useState, useEffect } from 'react';
import { Database, RefreshCw, Server, Cloud, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';

interface Stats {
  totalRuns: number;
  completedRuns: number;
  failedRuns: number;
  successRate: number;
  memoryCount: number;
  filesCreated: number;
  totalCostUsd: number;
  tokensUsed?: number;
}

interface PipelineRun {
  id: string;
  task_title: string;
  status: string;
  started_at: number;
  total_duration_ms?: number;
  cost_usd?: number;
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [dailyData, setDailyData] = useState<Array<{ day: string; runs: number; cost: number; success: number }>>([]);
  const [usageBreakdown, setUsageBreakdown] = useState<Array<{ label: string; value: number; color: string; pct: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('14d');

  // Supabase Database Sync Telemetry & Manual Reconciliation State
  const [syncStats, setSyncStats] = useState<{
    status: string;
    local: { runs: number; logs: number; files: number };
    remote: { runs: number; logs: number; files: number; chats: number };
  } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const fetchSyncStats = () => {
    fetch('/api/pipeline/sync')
      .then(r => r.json())
      .then(d => {
        if (d && d.local) setSyncStats(d);
      })
      .catch(() => {});
  };

  const triggerReconcile = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/pipeline/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) {
        setSyncResult(`Successfully synchronized! Reconciled ${data.result.runsSynced} pipeline runs, ${data.result.logsSynced} logs, and ${data.result.filesSynced} files with Supabase.`);
        fetchSyncStats();
      } else {
        setSyncResult(`Sync failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      setSyncResult(`Reconciliation failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchSyncStats();
  }, []);

  useEffect(() => {
    setLoading(true);
    const days = parseInt(timeRange, 10) || 14;
    Promise.all([
      fetch('/api/pipeline?action=stats').then(r => r.json()).catch(() => null),
      fetch(`/api/pipeline?action=analytics&days=${days}`).then(r => r.json()).catch(() => null),
      fetch('/api/pipeline?limit=20').then(r => r.json()).catch(() => ({ runs: [] })),
    ]).then(([statsData, analyticsData, runsData]) => {
      if (statsData) setStats(statsData as Stats);
      if (analyticsData) {
        setDailyData(analyticsData.daily || []);
        setUsageBreakdown(analyticsData.usageBreakdown || []);
      }
      if (runsData?.runs) setRuns(runsData.runs as PipelineRun[]);
      setLoading(false);
    });
  }, [timeRange]);

  const maxRuns = Math.max(...dailyData.map(d => d.runs), 1);

  const kpiCards = [
    { label: 'Total Pipeline Runs', value: stats?.totalRuns ?? 0, sub: 'All time', color: '#6366f1', icon: '', suffix: '' },
    { label: 'Success Rate', value: stats ? `${stats.successRate.toFixed(0)}%` : '—', sub: `${stats?.completedRuns ?? 0} completed`, color: '#10b981', icon: '', suffix: '' },
    { label: 'Agent Tokens Used', value: stats?.tokensUsed ? stats.tokensUsed.toLocaleString() : '0', sub: 'GPT-4o tokens', color: '#22d3ee', icon: '', suffix: '' },
    { label: 'Total AI Cost', value: stats ? `$${stats.totalCostUsd.toFixed(4)}` : '$0.0000', sub: 'OpenAI charges', color: '#4ade80', icon: '', suffix: '' },
    { label: 'Memory Entries', value: stats?.memoryCount ?? 0, sub: 'Agent memory store', color: '#8b5cf6', icon: '', suffix: '' },
    { label: 'Files Created', value: stats?.filesCreated ?? 0, sub: 'In orbit-workspace/', color: '#f59e0b', icon: '', suffix: '' },
  ];

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f1f5f9', margin: 0 }}> Analytics</h1>
          <p style={{ color: '#64748b', margin: '0.3rem 0 0', fontSize: '0.9rem' }}>
            Real-time performance metrics and cost tracking
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['7d', '14d', '30d'].map(r => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              style={{
                padding: '6px 14px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer',
                background: timeRange === r ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.05)',
                border: timeRange === r ? 'none' : '1px solid rgba(255,255,255,0.1)',
                color: timeRange === r ? '#fff' : '#94a3b8',
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {kpiCards.map(card => (
          <div key={card.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: card.color }} />
            <div style={{ fontSize: '1.6rem', marginBottom: 6 }}>{card.icon}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: card.color, lineHeight: 1 }}>{loading ? '—' : card.value}</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0', marginTop: 4 }}>{card.label}</div>
            <div style={{ fontSize: '0.7rem', color: '#475569', marginTop: 2 }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Supabase Live DB Sync Control Center */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(8, 14, 28, 0.9) 0%, rgba(13, 25, 48, 0.7) 100%)',
        border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '1.5rem',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)',
        marginBottom: '1.5rem', position: 'relative', overflow: 'hidden'
      }}>
        {/* Glow backdrop decorative */}
        <div style={{ position: 'absolute', top: -100, right: -100, width: 300, height: 300, background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Database size={20} style={{ color: '#6366f1' }} />
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f1f5f9', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                Supabase Cloud-Sync Control Center
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.65rem',
                  padding: '3px 8px', borderRadius: 20,
                  background: syncStats?.status === 'connected' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                  color: syncStats?.status === 'connected' ? '#10b981' : '#f59e0b',
                  border: `1px solid ${syncStats?.status === 'connected' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`,
                  fontWeight: 600
                }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: syncStats?.status === 'connected' ? '#10b981' : '#f59e0b',
                    display: 'inline-block',
                    animation: 'pulse 1.2s infinite'
                  }} />
                  {syncStats?.status === 'connected' ? 'CLOUD ACTIVE' : 'LOCAL CACHE FALLBACK'}
                </span>
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.78rem', margin: '2px 0 0', fontWeight: 500 }}>
                Synchronizes pipeline runs, system telemetry logs, and sandbox workspace assets with Supabase PostgreSQL.
              </p>
            </div>
          </div>

          <button
            onClick={triggerReconcile}
            disabled={syncing}
            style={{
              padding: '8px 16px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600, cursor: syncing ? 'not-allowed' : 'pointer',
              background: syncing ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: syncing ? 'none' : '0 4px 12px rgba(99,102,241,0.25)', transition: 'all 0.2s'
            }}
          >
            <RefreshCw size={14} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
            {syncing ? 'Syncing...' : 'Reconcile Cloud Data'}
          </button>
        </div>

        {syncResult && (
          <div style={{
            fontSize: '0.78rem', padding: '10px 14px', borderRadius: 8,
            background: syncResult.startsWith('Succ') ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
            border: `1px solid ${syncResult.startsWith('Succ') ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}`,
            color: syncResult.startsWith('Succ') ? '#4ade80' : '#f87171',
            marginBottom: '1rem', display: 'flex', gap: 8, alignItems: 'center'
          }}>
            {syncResult.startsWith('Succ') ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
            {syncResult}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          {[
            {
              table: 'Pipeline Runs', desc: 'orbit_pipeline_runs',
              local: syncStats?.local?.runs ?? 0, remote: syncStats?.remote?.runs ?? 0,
              icon: <Server size={14} style={{ color: '#6366f1' }} />,
              color: '#6366f1'
            },
            {
              table: 'Telemetry Logs', desc: 'orbit_pipeline_logs',
              local: syncStats?.local?.logs ?? 0, remote: syncStats?.remote?.logs ?? 0,
              icon: <Database size={14} style={{ color: '#22d3ee' }} />,
              color: '#22d3ee'
            },
            {
              table: 'Workspace Files', desc: 'orbit_workspace_files',
              local: syncStats?.local?.files ?? 0, remote: syncStats?.remote?.files ?? 0,
              icon: <Cloud size={14} style={{ color: '#f59e0b' }} />,
              color: '#f59e0b'
            }
          ].map(tableStats => {
            const outOfSync = tableStats.local > tableStats.remote;
            return (
              <div key={tableStats.table} style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: 12, padding: '10px 14px', position: 'relative'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  {tableStats.icon}
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0' }}>{tableStats.table}</span>
                  <span style={{ color: '#64748b', fontSize: '0.62rem', fontFamily: 'monospace' }}>({tableStats.desc})</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>SQLite Cache</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f1f5f9', marginTop: 2 }}>{tableStats.local}</div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', padding: '0 6px', color: outOfSync ? '#f59e0b' : '#10b981' }}>
                    <ArrowRight size={14} style={{ animation: outOfSync ? 'pulse 1s infinite' : 'none' }} />
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Supabase Cloud</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: tableStats.color, marginTop: 2 }}>{tableStats.remote}</div>
                  </div>
                </div>

                {outOfSync && (
                  <div style={{ fontSize: '0.62rem', color: '#f59e0b', marginTop: 8, background: 'rgba(245,158,11,0.08)', padding: '4px 8px', borderRadius: 4, textAlign: 'center', fontWeight: 600 }}>
                    ⚠️ {tableStats.local - tableStats.remote} records ready to reconcile
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Activity Chart */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '1.5rem' }}>
          <div style={{ fontWeight: 600, color: '#f1f5f9', marginBottom: '1.25rem', fontSize: '0.95rem' }}>
             Pipeline Runs — Last {timeRange}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 160 }}>
            {dailyData.map((d, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ fontSize: '0.6rem', color: '#475569' }}>{d.runs}</div>
                <div
                  style={{
                    width: '100%', borderRadius: '4px 4px 0 0',
                    background: `linear-gradient(0deg, #6366f1, #8b5cf6)`,
                    height: `${(d.runs / maxRuns) * 120}px`,
                    opacity: 0.8 + (i / dailyData.length) * 0.2,
                    transition: 'height 0.5s',
                  }}
                />
                <div style={{ fontSize: '0.6rem', color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', width: '100%', textAlign: 'center' }}>
                  {d.day.split(' ')[1] || d.day}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {[
              { label: 'Avg Runs/day', value: dailyData.length > 0 ? (dailyData.reduce((a, b) => a + b.runs, 0) / dailyData.length).toFixed(1) : '0.0' },
              { label: 'Avg Success', value: dailyData.length > 0 ? `${(dailyData.reduce((a, b) => a + b.success, 0) / dailyData.length).toFixed(0)}%` : '0%' },
              { label: 'Total Cost', value: `$${dailyData.reduce((a, b) => a + b.cost, 0).toFixed(4)}` },
            ].map(m => (
              <div key={m.label}>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9' }}>{m.value}</div>
                <div style={{ fontSize: '0.7rem', color: '#475569' }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Usage breakdown */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '1.5rem' }}>
          <div style={{ fontWeight: 600, color: '#f1f5f9', marginBottom: '1.25rem', fontSize: '0.95rem' }}> Usage Breakdown</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {usageBreakdown.map(item => (
              <div key={item.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>{item.label}</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: item.color }}>{item.pct}%</span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${item.pct}%`, background: item.color, borderRadius: 3, transition: 'width 1s' }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '0.75rem', color: '#475569', marginBottom: 8 }}>Cost per operation</div>
            {[
              { op: 'Agent Run (full)', cost: '~$0.008', color: '#6366f1' },
              { op: 'Pipeline (5 stages)', cost: '~$0.045', color: '#22d3ee' },
              { op: 'Chat message', cost: '~$0.002', color: '#10b981' },
              { op: 'Swarm (3 agents)', cost: '~$0.024', color: '#f59e0b' },
            ].map(row => (
              <div key={row.op} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{row.op}</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: row.color }}>{row.cost}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent runs table */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', fontWeight: 600, color: '#f1f5f9', fontSize: '0.95rem' }}>
           Recent Pipeline Runs
        </div>
        {runs.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#475569' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}></div>
            <div style={{ fontSize: '0.9rem' }}>No runs yet. Start a pipeline to see analytics.</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Task', 'Status', 'Duration', 'Cost', 'Started'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '0.72rem', color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {runs.map(run => (
                <tr key={run.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#e2e8f0', maxWidth: 300 }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{run.task_title}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      fontSize: '0.72rem', padding: '3px 8px', borderRadius: 6, fontWeight: 600,
                      background: run.status === 'completed' ? 'rgba(16,185,129,0.15)' : run.status === 'failed' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                      color: run.status === 'completed' ? '#10b981' : run.status === 'failed' ? '#ef4444' : '#f59e0b',
                    }}>
                      {run.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.82rem', color: '#64748b' }}>
                    {run.total_duration_ms ? `${(run.total_duration_ms / 1000).toFixed(1)}s` : '—'}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.82rem', color: '#4ade80' }}>
                    {run.cost_usd ? `$${run.cost_usd.toFixed(4)}` : '—'}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.75rem', color: '#475569' }}>
                    {new Date(run.started_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
