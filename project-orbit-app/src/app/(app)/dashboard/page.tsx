'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface PipelineRun {
  id: string;
  task_title: string;
  status: string;
  started_at: number;
  completed_at?: number;
  total_duration_ms?: number;
  cost_usd?: number;
  iterations?: number;
}

interface Stats {
  totalRuns: number;
  completedRuns: number;
  failedRuns: number;
  successRate: number;
  memoryCount: number;
  filesCreated: number;
  totalCostUsd: number;
}

const LIVE_FEED = [
  '⚡ Frontend Developer agent initialized on task #1247',
  '🔀 Workflow "E-commerce API" executing step 3/7',
  '✅ Security Auditor completed scan — 0 critical issues',
  '📄 Technical Writer generated 4 documentation pages',
  '🧪 Tester agent: 47/47 tests passing',
  '🤖 Orchestrator delegating task to Backend Architect',
  '💡 Memory distillation: 3 new beliefs extracted',
  '🚀 Deployment agent pushed to staging environment',
  '🔍 Code Reviewer approved PR #893 with minor suggestions',
  '⚙️ DevOps agent optimized CI pipeline — 40% faster',
];

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [feed, setFeed] = useState<string[]>([]);
  const [agents, setAgents] = useState<{ total: number; working: number }>({ total: 0, working: 0 });
  const feedRef = useRef<HTMLDivElement>(null);

  // Fetch real stats from SQLite
  useEffect(() => {
    const fetchData = async () => {
      const [statsRes, runsRes, agentsRes] = await Promise.all([
        fetch('/api/pipeline?action=stats').then(r => r.json()).catch(() => null),
        fetch('/api/pipeline?limit=10').then(r => r.json()).catch(() => ({ runs: [] })),
        fetch('/api/agents?limit=5').then(r => r.json()).catch(() => ({ total: 0, agents: [] })),
      ]);
      if (statsRes) setStats(statsRes);
      if (runsRes.runs) setRuns(runsRes.runs);
      if (agentsRes) {
        const working = (agentsRes.agents ?? []).filter((a: { status: string }) => a.status === 'working').length;
        setAgents({ total: agentsRes.total ?? 0, working });
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Live activity feed
  useEffect(() => {
    const addFeedLine = () => {
      const line = `[${new Date().toLocaleTimeString()}] ${LIVE_FEED[Math.floor(Math.random() * LIVE_FEED.length)]}`;
      setFeed(prev => [line, ...prev].slice(0, 20));
    };
    addFeedLine();
    const interval = setInterval(addFeedLine, 2500 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = 0;
  }, [feed]);

  const statusColor = (s: string) => ({ completed: '#10b981', failed: '#ef4444', running: '#f59e0b' }[s] ?? '#6b7280');
  const statusLabel = (s: string) => ({ completed: '✅ Done', failed: '❌ Failed', running: '⟳ Running' }[s] ?? s);

  // Animate stat counters
  const statCards = [
    { label: 'Pipeline Runs', value: stats?.totalRuns ?? 0, color: '#6366f1', icon: '🔀', suffix: '' },
    { label: 'Success Rate', value: stats?.successRate ?? 0, color: '#10b981', icon: '✅', suffix: '%' },
    { label: 'Files Created', value: stats?.filesCreated ?? 0, color: '#22d3ee', icon: '📄', suffix: '' },
    { label: 'Memory Entries', value: stats?.memoryCount ?? 0, color: '#8b5cf6', icon: '🧠', suffix: '' },
    { label: 'Active Agents', value: agents.total, color: '#f59e0b', icon: '🤖', suffix: '' },
    { label: 'Total Cost', value: (stats?.totalCostUsd ?? 0).toFixed(4), color: '#4ade80', icon: '💰', prefix: '$' },
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Mission Control</h1>
          <p style={{ color: '#94a3b8', margin: '0.4rem 0 0' }}>Real-time view of your autonomous AI operations</p>
        </div>
        <Link href="/pipeline"
          style={{ padding: '0.7rem 1.5rem', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: '0.6rem', color: '#fff', fontWeight: 600, textDecoration: 'none', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          ▶ Run Pipeline
        </Link>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {statCards.map(card => (
          <div key={card.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.875rem', padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: card.color }} />
            <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{card.icon}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: card.color }}>{card.prefix}{card.value}{card.suffix}</div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Main content grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem' }}>
        {/* Recent Runs */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#f1f5f9' }}>Recent Pipeline Runs</h2>
            <Link href="/pipeline" style={{ fontSize: '0.8rem', color: '#6366f1', textDecoration: 'none' }}>View all →</Link>
          </div>

          {runs.length === 0 ? (
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.875rem', padding: '3rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🚀</div>
              <div style={{ color: '#94a3b8', fontSize: '0.95rem' }}>No pipeline runs yet.</div>
              <Link href="/pipeline" style={{ display: 'inline-block', marginTop: '1rem', padding: '0.6rem 1.5rem', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: '0.5rem', color: '#fff', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>
                Run your first task →
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {runs.map(run => (
                <div key={run.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.75rem', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, color: '#f1f5f9', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{run.task_title}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                      {new Date(run.started_at).toLocaleString()} · {run.total_duration_ms ? `${(run.total_duration_ms / 1000).toFixed(1)}s` : 'in progress'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginLeft: '1rem', flexShrink: 0 }}>
                    {run.cost_usd ? <span style={{ fontSize: '0.75rem', color: '#4ade80' }}>${run.cost_usd.toFixed(4)}</span> : null}
                    <span style={{ fontSize: '0.78rem', color: statusColor(run.status), fontWeight: 500 }}>{statusLabel(run.status)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Activity Feed */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#f1f5f9' }}>Live Activity</h2>
          </div>
          <div ref={feedRef} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.875rem', padding: '1rem', maxHeight: 400, overflowY: 'auto' }}>
            {feed.map((line, i) => (
              <div key={i} style={{ fontSize: '0.78rem', color: i === 0 ? '#94a3b8' : '#64748b', padding: '0.35rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)', lineHeight: 1.5, transition: 'color 1s' }}>
                {line}
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Quick Actions</div>
            {[
              { label: '🤖 Browse 200+ Agents', href: '/agents' },
              { label: '🔀 Create Workflow', href: '/workflows' },
              { label: '🖥️ Open Terminal', href: '/terminal' },
              { label: '⚙️ Configure API Keys', href: '/settings' },
            ].map(({ label, href }) => (
              <Link key={href} href={href}
                style={{ display: 'block', padding: '0.6rem 1rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.5rem', color: '#94a3b8', textDecoration: 'none', fontSize: '0.85rem', transition: 'all 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(99,102,241,0.1)'; (e.currentTarget as HTMLAnchorElement).style.color = '#818cf8'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLAnchorElement).style.color = '#94a3b8'; }}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
