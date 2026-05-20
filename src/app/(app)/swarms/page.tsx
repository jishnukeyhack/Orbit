'use client';
import { useState, useEffect, useRef } from 'react';
import { Download, Code, Loader2 } from 'lucide-react';

interface AgentOption {
  id: string;
  name: string;
  emoji: string;
  category: string;
  color: string;
}

interface WorkspaceFile {
  name: string;
  path: string;
  type: 'dir' | 'file';
  size: number;
  mtime: number;
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

  // Autopilot Swarm Recruitment States
  const [autopilot, setAutopilot] = useState(true);
  const [autopilotLoading, setAutopilotLoading] = useState(false);
  const [autopilotRationale, setAutopilotRationale] = useState('');

  // Workspace Explorer state variables
  const [activeTab, setActiveTab] = useState<'chat' | 'workspace'>('chat');
  const [activeSwarmId, setActiveSwarmId] = useState<string | null>(null);
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [selectedFile, setSelectedFile] = useState<WorkspaceFile | null>(null);
  const [selectedFileContent, setSelectedFileContent] = useState('');
  const [loadingFile, setLoadingFile] = useState(false);

  const loadWorkspaceFiles = async (subpath = '') => {
    if (!activeSwarmId) return;
    try {
      const res = await fetch(`/api/workspace?path=${encodeURIComponent(subpath)}&swarmId=${encodeURIComponent(activeSwarmId)}`);
      if (res.ok) {
        const data = await res.json() as { files: WorkspaceFile[] };
        setFiles(data.files);
      }
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (activeSwarmId) {
      loadWorkspaceFiles(currentPath);
    }
  }, [activeSwarmId, currentPath]);

  useEffect(() => {
    if (running && activeSwarmId) {
      const timer = setInterval(() => loadWorkspaceFiles(currentPath), 3500);
      return () => clearInterval(timer);
    }
  }, [running, activeSwarmId, currentPath]);

  const handleViewFile = async (file: WorkspaceFile) => {
    setSelectedFile(file);
    setLoadingFile(true);
    setSelectedFileContent('');
    try {
      const res = await fetch(`/api/workspace/download?path=${encodeURIComponent(file.path)}&swarmId=${encodeURIComponent(activeSwarmId || '')}`);
      if (res.ok) {
        const text = await res.text();
        setSelectedFileContent(text);
      } else {
        setSelectedFileContent(`Error loading file: ${await res.text()}`);
      }
    } catch (err) {
      setSelectedFileContent(`Error loading file: ${String(err)}`);
    } finally {
      setLoadingFile(false);
    }
  };

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
    if (!goal.trim()) return;

    let finalAgents = selectedAgents;
    let finalStrategy = strategy;

    setRunning(true);
    setSwarmDone(false);
    setPhase('running');
    setActiveSwarmId(null);
    setFiles([]);
    setSelectedFile(null);
    setSelectedFileContent('');
    setActiveTab('chat');

    if (autopilot) {
      setAutopilotLoading(true);
      setAgentOutputs([
        { id: 'recruiter', name: '🪄 Swarm Director', text: 'Analyzing your goal to recruit the best cohort from all 175 specialized agents...', status: 'running' }
      ]);
      try {
        const localOpenaiKey = localStorage.getItem('orbit_openai_key') || '';
        const localGeminiKey = localStorage.getItem('orbit_gemini_key') || '';

        const autoRes = await fetch('/api/swarms/autopilot', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-openai-api-key': localOpenaiKey,
            'x-gemini-api-key': localGeminiKey
          },
          body: JSON.stringify({ goal })
        });
        if (autoRes.ok) {
          const autoData = await autoRes.json() as { selectedAgentIds: string[], strategy: 'parallel' | 'sequential' | 'hierarchical', rationale: string };
          const matched = agents.filter(a => autoData.selectedAgentIds.includes(a.id));
          if (matched.length > 0) {
            finalAgents = matched;
            setSelectedAgents(matched);
          }
          if (autoData.strategy) {
            finalStrategy = autoData.strategy;
            setStrategy(autoData.strategy);
          }
          if (autoData.rationale) {
            setAutopilotRationale(autoData.rationale);
          }
        }
      } catch (err) {
        console.error('Autopilot recruitment failed:', err);
      } finally {
        setAutopilotLoading(false);
      }
    }

    if (finalAgents.length === 0) {
      finalAgents = agents.slice(0, 3);
      setSelectedAgents(finalAgents);
    }

    setAgentOutputs(
      finalAgents.map(a => ({ id: a.id, name: a.name, text: '', status: 'waiting' }))
    );

    try {
      const localOpenaiKey = localStorage.getItem('orbit_openai_key') || '';
      const localGeminiKey = localStorage.getItem('orbit_gemini_key') || '';

      const res = await fetch('/api/swarms', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-openai-api-key': localOpenaiKey,
          'x-gemini-api-key': localGeminiKey
        },
        body: JSON.stringify({
          name: swarmName || `Swarm — ${goal.slice(0, 40)}`,
          goal, agentIds: finalAgents.map(a => a.id), strategy: finalStrategy,
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
            if (event.type === 'swarm:start' && event.swarmId) {
              setActiveSwarmId(event.swarmId);
            } else if (event.type === 'agent:start') {
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
          {/* Agent selector with Autopilot Overlay */}
          <div style={{ position: 'relative' }}>
            <div style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden',
              filter: autopilot ? 'blur(1.5px) opacity(0.5)' : 'none', transition: 'all 0.3s', pointerEvents: autopilot ? 'none' : 'auto'
            }}>
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

            {autopilot && (
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(2,3,6,0.6)', borderRadius: 14, zIndex: 10, padding: 24, textAlign: 'center',
                border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(3px)'
              }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🪄</div>
                <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.95rem' }}>AI Autopilot Recruitment Active</div>
                <div style={{ color: '#94a3b8', fontSize: '0.78rem', maxWidth: 360, margin: '6px 0 16px', lineHeight: 1.45 }}>
                  The Swarm Director will automatically scan all 175 specialized agents to assemble the perfect team when you launch.
                </div>
                <button
                  onClick={() => setAutopilot(false)}
                  style={{
                    padding: '8px 16px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)',
                    borderRadius: 8, color: '#a5b4fc', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  Configure Team Manually
                </button>
              </div>
            )}
          </div>

          {/* Config panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Recruitment Mode Toggle */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '0.85rem' }}>Recruitment Mode</div>
                <span style={{ fontSize: '0.72rem', background: autopilot ? 'rgba(129,140,248,0.15)' : 'rgba(255,255,255,0.05)', color: autopilot ? '#818cf8' : '#64748b', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>
                  {autopilot ? '🪄 AI Autopilot' : '🛠️ Manual Selection'}
                </span>
              </div>
              <button
                onClick={() => setAutopilot(!autopilot)}
                style={{
                  width: '100%', padding: '10px',
                  background: autopilot ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${autopilot ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: 10, color: autopilot ? '#a5b4fc' : '#cbd5e1', fontSize: '0.82rem',
                  cursor: 'pointer', transition: 'all 0.15s', fontWeight: 600
                }}
              >
                {autopilot ? 'Switch to Manual Selection' : 'Activate 175-Agent AI Autopilot'}
              </button>
              {autopilot && (
                <div style={{ fontSize: '0.7rem', color: '#475569', marginTop: 8, lineHeight: 1.45 }}>
                  The Swarm Director will automatically screen all 175 specialized agents to handpick the perfect 3 experts and coordinate their workflow.
                </div>
              )}
            </div>

            {/* Selected agents (only shown when manual or custom selection has items) */}
            {!autopilot && selectedAgents.length > 0 && (
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 16 }}>
                <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '0.85rem', marginBottom: 10 }}>Selected Agents</div>
                {selectedAgents.map((a, i) => {
                  const color = COLOR_MAP[a.color] ?? '#6366f1';
                  const roles = ['Lead Strategist', 'Researcher', 'Implementer', 'Reviewer', 'Auditor'];
                  const role = roles[i % roles.length];
                  return (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 10px' }}>
                      <span style={{ fontSize: 16 }}>{a.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#e2e8f0' }}>{a.name}</div>
                        <div style={{ fontSize: '0.65rem', color }}>Role: {role}</div>
                      </div>
                      <button onClick={() => toggleAgent(a)} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 12 }}>✕</button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Strategy (only shown when manual) */}
            {!autopilot && (
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
            )}

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
                placeholder={autopilot ? "Describe what you want to achieve in plain English... e.g. 'Help me design gourmet recipes for dog treats, outline my brand identity, and list start-up expenses'" : "Describe what this swarm should accomplish..."}
                style={{ width: '100%', minHeight: 100, padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9', fontSize: '0.82rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
              <button
                onClick={launchSwarm}
                disabled={!goal.trim() || (!autopilot && selectedAgents.length === 0)}
                style={{
                  width: '100%', padding: '12px', marginTop: 10,
                  background: goal.trim() && (autopilot || selectedAgents.length > 0) ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.06)',
                  border: 'none', borderRadius: 10, color: '#fff', fontSize: '0.9rem', fontWeight: 700,
                  cursor: goal.trim() && (autopilot || selectedAgents.length > 0) ? 'pointer' : 'not-allowed', transition: 'all 0.15s',
                }}
              >
                {autopilot ? '🪄 Launch Autopilot Swarm' : `🚀 Launch Swarm (${selectedAgents.length} agents)`}
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
              {autopilotRationale && (
                <div style={{ fontSize: '0.73rem', color: '#a5b4fc', marginTop: 6, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 6, padding: '4px 8px', display: 'inline-block' }}>
                  🪄 <strong>Director:</strong> {autopilotRationale}
                </div>
              )}
            </div>
          </div>

          {/* Premium Tab Bar for Chat & Workspace Explorer */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '1.5rem', gap: '0.5rem' }}>
            <button
              onClick={() => setActiveTab('chat')}
              style={{
                padding: '10px 16px',
                background: activeTab === 'chat' ? 'rgba(99,102,241,0.08)' : 'none',
                border: 'none',
                borderBottom: activeTab === 'chat' ? '2px solid #6366f1' : '2px solid transparent',
                color: activeTab === 'chat' ? '#818cf8' : '#94a3b8',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.85rem',
                borderRadius: '6px 6px 0 0',
                transition: 'all 0.2s'
              }}
            >
              🐝 Live Agent Chat
            </button>
            <button
              onClick={() => setActiveTab('workspace')}
              style={{
                padding: '10px 16px',
                background: activeTab === 'workspace' ? 'rgba(99,102,241,0.08)' : 'none',
                border: 'none',
                borderBottom: activeTab === 'workspace' ? '2px solid #6366f1' : '2px solid transparent',
                color: activeTab === 'workspace' ? '#818cf8' : '#94a3b8',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.85rem',
                borderRadius: '6px 6px 0 0',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              📁 Workspace Sandbox {files.length > 0 && <span style={{ background: '#6366f1', color: '#fff', fontSize: '0.68rem', padding: '1px 5px', borderRadius: 10, fontWeight: 700 }}>{files.length}</span>}
            </button>
          </div>

          {activeTab === 'chat' ? (
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
          ) : (
            <div style={{ display: 'flex', height: 600, background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, overflow: 'hidden' }}>
              {/* Left pane: File List */}
              <div style={{ width: 300, borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.1)' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f1f5f9' }}>Files ({files.length})</div>
                  {activeSwarmId && (
                    <a
                      href={`/api/workspace/download?swarmId=${encodeURIComponent(activeSwarmId)}`}
                      download
                      style={{
                        fontSize: '0.72rem', color: '#818cf8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600
                      }}
                    >
                      <Download size={12} /> Zip Output
                    </a>
                  )}
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
                  {currentPath && (
                    <button
                      onClick={() => {
                        const parts = currentPath.split('/');
                        parts.pop();
                        setCurrentPath(parts.join('/'));
                      }}
                      style={{
                        width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.02)', border: 'none', color: '#a78bfa', fontSize: '0.8rem', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 6, borderRadius: 6, marginBottom: 4
                      }}
                    >
                      📁 .. (go up parent)
                    </button>
                  )}

                  {files.length === 0 ? (
                    <div style={{ padding: 24, textAlign: 'center', color: '#475569', fontSize: '0.78rem' }}>
                      No files created yet in the workspace sandbox. Run the swarm and verify progress!
                    </div>
                  ) : (
                    files.map((file, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          if (file.type === 'dir') {
                            setCurrentPath(currentPath ? `${currentPath}/${file.name}` : file.name);
                          } else {
                            handleViewFile(file);
                          }
                        }}
                        style={{
                          width: '100%', padding: '8px 10px', background: selectedFile?.path === file.path ? 'rgba(99,102,241,0.1)' : 'none', border: 'none',
                          color: selectedFile?.path === file.path ? '#818cf8' : '#cbd5e1', fontSize: '0.8rem', cursor: 'pointer', textAlign: 'left',
                          display: 'flex', alignItems: 'center', gap: 8, borderRadius: 6, transition: 'all 0.15s',
                          borderLeft: selectedFile?.path === file.path ? '2px solid #6366f1' : '2px solid transparent',
                          marginBottom: 2
                        }}
                      >
                        <span style={{ fontSize: 16 }}>{file.type === 'dir' ? '📁' : '📄'}</span>
                        <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
                        {file.type === 'file' && <span style={{ fontSize: '0.65rem', color: '#475569' }}>{(file.size / 1024).toFixed(1)}K</span>}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Right pane: Preview */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#020306' }}>
                {selectedFile ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '10px 16px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 16 }}>📄</span>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0', fontFamily: 'monospace' }}>{selectedFile.name}</span>
                      </div>
                      <a
                        href={`/api/workspace/download?path=${encodeURIComponent(selectedFile.path)}&swarmId=${encodeURIComponent(activeSwarmId || '')}`}
                        download
                        style={{
                          padding: '6px 12px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 6, color: '#818cf8', fontSize: '0.72rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4
                        }}
                      >
                        <Download size={11} /> Download File
                      </a>
                    </div>

                    {loadingFile ? (
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                        <Loader2 className="animate-spin" size={24} />
                      </div>
                    ) : (
                      <pre style={{ flex: 1, overflow: 'auto', padding: 16, fontFamily: 'monospace', fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.6, whiteSpace: 'pre-wrap', background: '#020306', margin: 0 }}>
                        {selectedFileContent || '(file is empty)'}
                      </pre>
                    )}
                  </div>
                ) : (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#334155', padding: 24 }}>
                    <Code size={40} style={{ marginBottom: 12, opacity: 0.5 }} />
                    <span style={{ fontSize: '0.85rem' }}>Select a file from the list to preview the swarm deliverables</span>
                  </div>
                )}
              </div>
            </div>
          )}
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
