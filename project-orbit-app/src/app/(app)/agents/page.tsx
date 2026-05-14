'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

interface Agent {
  id: string;
  name: string;
  description: string;
  color: string;
  emoji: string;
  vibe: string;
  category: string;
}

interface CategoryMeta {
  [key: string]: { label: string; icon: string };
}

const COLOR_MAP: Record<string, string> = {
  cyan:    '#22d3ee',
  blue:    '#3b82f6',
  purple:  '#8b5cf6',
  green:   '#10b981',
  red:     '#ef4444',
  orange:  '#f97316',
  yellow:  '#eab308',
  pink:    '#ec4899',
  indigo:  '#6366f1',
  teal:    '#14b8a6',
};

function getColor(c: string) {
  return COLOR_MAP[c] ?? '#6366f1';
}

// ─── Run Modal ──────────────────────────────────────────────────────────────
function RunModal({
  agent,
  onClose,
}: {
  agent: Agent;
  onClose: () => void;
}) {
  const [task, setTask] = useState('');
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [tokens, setTokens] = useState(0);
  const [cost, setCost] = useState(0);
  const outputRef = useRef<HTMLDivElement>(null);
  const color = getColor(agent.color);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const handleRun = async () => {
    if (!task.trim() || running) return;
    setRunning(true);
    setOutput('');
    setDone(false);
    setError('');

    try {
      const res = await fetch('/api/agents/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: agent.id, task }),
      });

      if (!res.ok) throw new Error(await res.text());

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No stream');
      const decoder = new TextDecoder();

      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;
        const lines = decoder.decode(value).split('\n').filter(l => l.startsWith('data:'));
        for (const line of lines) {
          try {
            const event = JSON.parse(line.slice(5)) as { type: string; data: Record<string, unknown> };
            if (event.type === 'chunk') setOutput(p => p + (event.data.text as string));
            if (event.type === 'tool') setOutput(p => p + `\n> Tool: ${event.data.name}\n`);
            if (event.type === 'done') {
              setTokens(event.data.tokens as number);
              setCost(event.data.cost as number);
              setDone(true);
            }
            if (event.type === 'error') {
              setError(event.data.message as string);
              setDone(true);
            }
          } catch { /* skip */ }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: '#0f1629', border: `1px solid ${color}44`, borderRadius: 16,
        width: '100%', maxWidth: 760, maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        overflow: 'hidden', boxShadow: `0 0 60px ${color}22`,
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: `1px solid rgba(255,255,255,0.08)`, display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, border: `1px solid ${color}44` }}>
            {agent.emoji}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#f1f5f9' }}>{agent.name}</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>{agent.vibe || agent.description.slice(0, 80)}</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, width: 32, height: 32, color: '#94a3b8', cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>

        {/* Task input */}
        {!running && !output && (
          <div style={{ padding: 24, flexShrink: 0 }}>
            <label style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: 10 }}>
              What task should this agent work on?
            </label>
            <textarea
              value={task}
              onChange={e => setTask(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleRun(); }}
              placeholder={`e.g. "Build a REST API for user authentication" or "Write an SEO strategy for a SaaS startup"`}
              autoFocus
              style={{
                width: '100%', minHeight: 100, background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 14px',
                color: '#f1f5f9', fontSize: '0.9rem', fontFamily: 'inherit', resize: 'vertical', outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
              <span style={{ fontSize: '0.75rem', color: '#475569' }}>Ctrl+Enter to run</span>
              <button
                onClick={handleRun}
                disabled={!task.trim()}
                style={{
                  padding: '10px 28px', background: task.trim() ? `linear-gradient(135deg, ${color}, ${color}99)` : 'rgba(255,255,255,0.05)',
                  border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, cursor: task.trim() ? 'pointer' : 'not-allowed',
                  fontSize: '0.9rem', transition: 'all 0.15s',
                }}
              >
                ▶ Run Agent
              </button>
            </div>
          </div>
        )}

        {/* Live output */}
        {(running || output) && (
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Status bar */}
            <div style={{ padding: '10px 24px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              {running && <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}`, animation: 'pulse 1s infinite' }} />}
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                {running ? `${agent.name} is working...` : done ? `✅ Task complete${tokens ? ` · ${tokens.toLocaleString()} tokens · $${cost.toFixed(4)}` : ''}` : 'Output'}
              </span>
              {done && (
                <button
                  onClick={() => { setOutput(''); setDone(false); }}
                  style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Run again
                </button>
              )}
            </div>

            {/* Output */}
            <div
              ref={outputRef}
              style={{
                flex: 1, overflowY: 'auto', padding: '16px 24px',
                fontFamily: 'monospace', fontSize: '0.85rem', color: '#cbd5e1',
                lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}
            >
              {error ? <span style={{ color: '#ef4444' }}>❌ {error}</span> : output}
              {running && <span style={{ display: 'inline-block', width: 8, height: 14, background: color, marginLeft: 2, animation: 'blink 0.7s infinite' }} />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Agent Card ──────────────────────────────────────────────────────────────
function AgentCard({ agent, onRun }: { agent: Agent; onRun: (a: Agent) => void }) {
  const color = getColor(agent.color);
  const [hover, setHover] = useState(false);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${hover ? color + '44' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 14, padding: '18px 20px', cursor: 'pointer',
        transition: 'all 0.18s', display: 'flex', flexDirection: 'column', gap: 12,
        position: 'relative', overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: hover ? color : 'transparent', transition: 'background 0.18s' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, border: `1px solid ${color}30`, flexShrink: 0 }}>
          {agent.emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: '0.92rem', color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {agent.name}
          </div>
          <div style={{ fontSize: '0.7rem', color, textTransform: 'capitalize', marginTop: 2 }}>
            {agent.category.replace(/-/g, ' ')}
          </div>
        </div>
      </div>

      <div style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {agent.vibe || agent.description}
      </div>

      <button
        onClick={() => onRun(agent)}
        style={{
          padding: '8px 16px', background: hover ? `${color}22` : 'rgba(255,255,255,0.06)',
          border: `1px solid ${hover ? color + '55' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: 8, color: hover ? color : '#94a3b8', fontSize: '0.8rem', fontWeight: 600,
          cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center',
        }}
      >
        ▶ Run Task
      </button>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [categories, setCategories] = useState<CategoryMeta>({});
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [total, setTotal] = useState(0);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '200' });
      if (selectedCategory !== 'all') params.set('category', selectedCategory);
      if (search) params.set('search', search);
      const res = await fetch(`/api/agents?${params}`);
      const data = await res.json() as { agents: Agent[]; categories: CategoryMeta; total: number };
      setAgents(data.agents);
      setCategories(data.categories);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, search]);

  useEffect(() => { fetchAgents(); }, [fetchAgents]);

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
          AI Agent Registry
        </h1>
        <p style={{ color: '#64748b', margin: '0.4rem 0 0', fontSize: '0.9rem' }}>
          {total} specialized agents ready to deploy — powered by GPT-4o
        </p>
      </div>

      {/* Search + Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569', fontSize: 16 }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search agents by name or skill..."
            style={{
              width: '100%', padding: '10px 12px 10px 38px', background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#f1f5f9',
              fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
            }}
          />
        </div>
      </div>

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[{ key: 'all', label: 'All Agents', icon: '🤖' },
          ...Object.entries(categories).map(([key, meta]) => ({ key, label: meta.label, icon: meta.icon }))
        ].map(cat => (
          <button
            key={cat.key}
            onClick={() => setSelectedCategory(cat.key)}
            style={{
              padding: '6px 14px', borderRadius: 20,
              background: selectedCategory === cat.key ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.05)',
              border: selectedCategory === cat.key ? 'none' : '1px solid rgba(255,255,255,0.1)',
              color: selectedCategory === cat.key ? '#fff' : '#94a3b8',
              fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Agent Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} style={{ height: 160, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : agents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤖</div>
          <div>No agents found. Try a different search or category.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {agents.map(agent => (
            <AgentCard key={agent.id} agent={agent} onRun={setSelectedAgent} />
          ))}
        </div>
      )}

      {/* Run Modal */}
      {selectedAgent && (
        <RunModal agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:1} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </div>
  );
}
