'use client';
import { useState, useEffect, useRef } from 'react';

interface AgentOption {
  id: string;
  name: string;
  emoji: string;
  category: string;
  color: string;
}

interface StreamEvent {
  type: string;
  swarmId?: string;
  agentId?: string;
  agentName?: string;
  text?: string;
  data?: Record<string, unknown>;
  timestamp: number;
}

interface AgentOutput {
  id: string;
  name: string;
  text: string;
  status: 'waiting' | 'running' | 'done' | 'error';
  tokens?: number;
  cost?: number;
}

const STRATEGY_INFO = {
  parallel: { label: 'Parallel', icon: '⚡', desc: 'All agents work simultaneously — fastest for independent tasks' },
  sequential: { label: 'Sequential', icon: '🔗', desc: 'Agents hand off results one by one — best for iterative refinement' },
  hierarchical: { label: 'Hierarchical', icon: '👑', desc: 'Lead agent coordinates workers — best for complex goals' },
};

const COLOR_MAP: Record<string, string> = {
  cyan: '#22d3ee', blue: '#3b82f6', purple: '#8b5cf6', green: '#10b981',
  red: '#ef4444', orange: '#f97316', yellow: '#eab308', pink: '#ec4899', indigo: '#6366f1',
};

export default function SwarmsPage() {
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<AgentOption[]>([]);
  const [goal, setGoal] = useState('');
  const [swarmName, setSwarmName] = useState('');
  const [strategy, setStrategy] = useState<'parallel' | 'sequential' | 'hierarchical'>('parallel');
  const [running, setRunning] = useState(false);
  const [agentOutputs, setAgentOutputs] = useState<AgentOutput[]>([]);
  const [swarmDone, setSwarmDone] = useState(false);
  const [phase, setPhase] = useState<'setup' | 'running' | 'done'>('setup');
  const [agentSearch, setAgentSearch] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/swarms')
      .then(r => r.json())
      .then((d: { agents: AgentOption[] }) => setAgents(d.agents))
      .catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [agentOutputs]);

  const filteredAgents = agents.filter(a =>
    !agentSearch || a.name.toLowerCase().includes(agentSearch.toLowerCase()) || a.category.toLowerCase().includes(agentSearch.toLowerCase())
  );

  const toggleAgent = (agent: AgentOption) => {
    setSelectedAgents(prev => {
      const exists = prev.find(a => a.id === agent.id);
      if (exists) return prev.filter(a => a.id !== agent.id);
      if (prev.length >= 5) return prev; // max 5 agents
      return [...prev, agent];
    });
  };

  const launchSwarm = async () => {
    if (!goal.trim() || selectedAgents.length === 0) return;
    setRunning(true);
    setSwarmDone(false);
    setPhase('running');
    setAgentOutputs(
      selectedAgents.map(a => ({ id: a.id, name: a.name, text: '', status: 'waiting' }))
    );

    try {
      const res = await fetch('/api/swarms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: swarmName || `Swarm — ${goal.slice(0, 40)}`,
          goal, agentIds: selectedAgents.map(a => a.id), strategy,
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value).split('\n').filter(l => l.startsWith('data:'));
        for (const line of lines) {
          try {
            const event = JSON.parse(line.slice(5)) as StreamEvent;
            if (event.type === 'agent:start') {
              setAgentOutputs(prev =>
                prev.map(a => a.id === event.agentId ? { ...a, status: 'running' } : a)
              );
            } else if (event.type === 'agent:chunk' && event.text) {
              setAgentOutputs(prev =>
                prev.map(a => a.id === event.agentId ? { ...a, text: a.text + event.text, status: 'running' } : a)
              );
            } else if (event.type === 'agent:done') {
              setAgentOutputs(prev =>
                prev.map(a => a.id === event.agentId
                  ? { ...a, status: 'done', tokens: event.data?.tokens as number, cost: event.data?.cost as number }
                  : a)
              );
            } else if (event.type === 'agent:error') {
              setAgentOutputs(prev =>
                prev.map(a => a.id === event.agentId ? { ...a, status: 'error', text: a.text + `\n❌ ${event.text}` } : a)
              );
            } else if (event.type === 'swarm:done') {
              setSwarmDone(true);
              setPhase('done');
            }
          } catch { /* skip */ }
        }
      }
    } catch (err) {
      setAgentOutputs(prev =>
        prev.map(a => ({ ...a, status: 'error', text: `Error: ${String(err)}` }))
      );
    } finally {
      setRunning(false);
    }
  };

  const statusColor = (s: AgentOutput['status']) => ({
    waiting: '#475569', running: '#f59e0b', done: '#10b981', error: '#ef4444',
  }[s]);

  const statusLabel = (s: AgentOutput['status']) => ({
    waiting: '⏳ Waiting', running: '⚡ Working', done: '✅ Done', error: '❌ Error',
  }[s]);

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>🐝 Agent Swarms</h1>
          <p style={{ color: '#64748b', margin: '0.3rem 0 0', fontSize: '0.9rem' }}>
            Deploy multiple AI agents working together toward a shared goal
          </p>
        </div>
        {phase !== 'setup' && (
          <button
            onClick={() => { setPhase('setup'); setAgentOutputs([]); setSwarmDone(false); }}
            style={{ padding: '8px 18px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#94a3b8', fontSize: '0.85rem', cursor: 'pointer' }}
          >
            ← New Swarm
          </button>
        )}
      </div>

      {phase === 'setup' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.5rem' }}>
          {/* Agent selector */}
          <div>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '0.95rem' }}>Select Agents</div>
                  <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: 2 }}>{selectedAgents.length}/5 selected</div>
                </div>
                <input
                  value={agentSearch}
                  onChange={e => setAgentSearch(e.target.value)}
                  placeholder="Search agents..."
                  style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9', fontSize: '0.8rem', outline: 'none', width: 180, fontFamily: 'inherit' }}
                />
              </div>
              <div style={{ maxHeight: 420, overflowY: 'auto', padding: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
                {filteredAgents.map(agent => {
                  const isSelected = selectedAgents.some(a => a.id === agent.id);
                  const color = COLOR_MAP[agent.color] ?? '#6366f1';
                  return (
                    <button
                      key={agent.id}
                      onClick={() => toggleAgent(agent)}
                      style={{
                        padding: '10px 14px', background: isSelected ? `${color}18` : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isSelected ? color + '55' : 'rgba(255,255,255,0.08)'}`,
                        borderRadius: 10, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                        display: 'flex', alignItems: 'center', gap: 8,
                      }}
                    >
                      {isSelected && <span style={{ color: '#10b981', fontSize: 12, flexShrink: 0 }}>✓</span>}
                      <span style={{ fontSize: 18, flexShrink: 0 }}>{agent.emoji}</span>
                      <div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: isSelected ? color : '#cbd5e1', lineHeight: 1.2 }}>{agent.name}</div>
                        <div style={{ fontSize: '0.65rem', color: '#475569', marginTop: 1 }}>{agent.category}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Config panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Selected agents */}
            {selectedAgents.length > 0 && (
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 16 }}>
                <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '0.85rem', marginBottom: 10 }}>Selected Agents</div>
                {selectedAgents.map((a, i) => {
                  const color = COLOR_MAP[a.color] ?? '#6366f1';
                  const roles = ['Lead Strategist', 'Researcher', 'Implementer', 'Reviewer', 'Auditor'];
                  return (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 10px' }}>
                      <span style={{ fontSize: 16 }}>{a.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#e2e8f0' }}>{a.name}</div>
                        <div style={{ fontSize: '0.65rem', color }}>Role: {roles[i % roles.length]}</div>
                      </div>
                      <button onClick={() => toggleAgent(a)} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 12 }}>✕</button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Strategy */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 16 }}>
              <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '0.85rem', marginBottom: 10 }}>Strategy</div>
              {(Object.entries(STRATEGY_INFO) as [keyof typeof STRATEGY_INFO, typeof STRATEGY_INFO[keyof typeof STRATEGY_INFO]][]).map(([key, info]) => (
                <div
                  key={key}
                  onClick={() => setStrategy(key)}
                  style={{
                    padding: '10px 12px', borderRadius: 8, cursor: 'pointer', marginBottom: 6,
                    background: strategy === key ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${strategy === key ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.06)'}`,
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span>{info.icon}</span>
                    <span style={{ fontWeight: 600, fontSize: '0.82rem', color: strategy === key ? '#818cf8' : '#cbd5e1' }}>{info.label}</span>
                    {strategy === key && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#10b981' }}>✓</span>}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#475569', lineHeight: 1.4 }}>{info.desc}</div>
                </div>
              ))}
            </div>

            {/* Goal */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 16 }}>
              <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '0.85rem', marginBottom: 10 }}>Swarm Goal</div>
              <input
                value={swarmName}
                onChange={e => setSwarmName(e.target.value)}
                placeholder="Swarm name (optional)"
                style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9', fontSize: '0.82rem', outline: 'none', marginBottom: 8, boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
              <textarea
                value={goal}
                onChange={e => setGoal(e.target.value)}
                placeholder="Describe what this swarm should accomplish... e.g. 'Build and launch a SaaS landing page with SEO optimization and conversion tracking'"
                style={{ width: '100%', minHeight: 100, padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9', fontSize: '0.82rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
              <button
                onClick={launchSwarm}
                disabled={!goal.trim() || selectedAgents.length === 0}
                style={{
                  width: '100%', padding: '12px', marginTop: 10,
                  background: goal.trim() && selectedAgents.length > 0 ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.06)',
                  border: 'none', borderRadius: 10, color: '#fff', fontSize: '0.9rem', fontWeight: 700,
                  cursor: goal.trim() && selectedAgents.length > 0 ? 'pointer' : 'not-allowed', transition: 'all 0.15s',
                }}
              >
                🚀 Launch Swarm ({selectedAgents.length} agents)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Running / Done view */}
      {(phase === 'running' || phase === 'done') && (
        <div>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '16px 20px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 12 }}>
            {running ? <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 10px #f59e0b', animation: 'pulse 1s infinite' }} /> : <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />}
            <div>
              <div style={{ fontWeight: 600, color: '#f1f5f9' }}>{swarmDone ? '✅ Swarm Complete' : '⚡ Swarm Running'}</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{goal.slice(0, 80)}{goal.length > 80 ? '...' : ''} · {strategy} strategy · {selectedAgents.length} agents</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1rem' }}>
            {agentOutputs.map(ao => {
              const agent = selectedAgents.find(a => a.id === ao.id);
              const color = agent ? (COLOR_MAP[agent.color] ?? '#6366f1') : '#6366f1';
              return (
                <div key={ao.id} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${ao.status === 'running' ? color + '44' : 'rgba(255,255,255,0.08)'}`, borderRadius: 14, overflow: 'hidden', transition: 'border-color 0.3s' }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10, background: ao.status === 'running' ? `${color}0a` : 'transparent' }}>
                    <span style={{ fontSize: 20 }}>{agent?.emoji ?? '🤖'}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#f1f5f9' }}>{ao.name}</div>
                      <div style={{ fontSize: '0.7rem', color: statusColor(ao.status) }}>{statusLabel(ao.status)}</div>
                    </div>
                    {ao.tokens && <div style={{ fontSize: '0.65rem', color: '#475569', textAlign: 'right' }}>
                      <div>{ao.tokens.toLocaleString()} tokens</div>
                      {ao.cost && <div style={{ color: '#10b981' }}>${ao.cost.toFixed(4)}</div>}
                    </div>}
                    {ao.status === 'running' && (
                      <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${color}33`, borderTopColor: color, animation: 'spin 0.8s linear infinite' }} />
                    )}
                  </div>
                  <div style={{ padding: 16, maxHeight: 280, overflowY: 'auto', fontFamily: 'inherit', fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {ao.text || <span style={{ color: '#334155', fontStyle: 'italic' }}>Waiting to start...</span>}
                    {ao.status === 'running' && <span style={{ display: 'inline-block', width: 6, height: 12, background: color, marginLeft: 2, animation: 'blink 0.7s infinite', verticalAlign: 'text-bottom' }} />}
                  </div>
                </div>
              );
            })}
          </div>
          <div ref={bottomRef} />
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:0.6} 50%{opacity:1} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </div>
  );
}
