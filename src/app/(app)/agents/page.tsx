'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Terminal as TerminalIcon, Cpu, Megaphone, DollarSign, Palette, Box, Briefcase, 
  LifeBuoy, Compass, GraduationCap, FlaskConical, Gamepad2, Plug, 
  Volume2, ClipboardList, Sparkles, Eye, Shield, Folder, File, Download, 
  Play, RotateCcw, X, Search, ChevronRight, Loader2, Code, History
} from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  description: string;
  color: string;
  emoji: string; // mapped to Lucide icon identifier
  vibe: string;
  category: string;
}

interface CategoryMeta {
  [key: string]: { label: string; icon: string };
}

interface WorkspaceFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size: number;
  mtime: number;
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

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  cpu: Cpu,
  megaphone: Megaphone,
  'dollar-sign': DollarSign,
  palette: Palette,
  box: Box,
  briefcase: Briefcase,
  'life-buoy': LifeBuoy,
  compass: Compass,
  'graduation-cap': GraduationCap,
  'flask-conical': FlaskConical,
  'gamepad-2': Gamepad2,
  plug: Plug,
  'volume-2': Volume2,
  'clipboard-list': ClipboardList,
  sparkles: Sparkles,
  eye: Eye,
  shield: Shield,
};

function getColor(c: string) {
  return COLOR_MAP[c] ?? '#6366f1';
}

function getIcon(name: string) {
  return ICON_MAP[name] ?? Cpu;
}

// ─── Workspace Run Split Interface ──────────────────────────────────────────
function AgentWorkspaceModal({
  agent,
  onClose,
}: {
  agent: Agent;
  onClose: () => void;
}) {
  const [task, setTask] = useState('');
  const [running, setRunning] = useState(false);
  const [traceLogs, setTraceLogs] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [tokens, setTokens] = useState(0);
  const [cost, setCost] = useState(0);
  
  // Workspace files & active preview state
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [selectedFile, setSelectedFile] = useState<WorkspaceFile | null>(null);
  const [selectedFileContent, setSelectedFileContent] = useState<string>('');
  const [loadingFile, setLoadingFile] = useState(false);
  const [activeTab, setActiveTab] = useState<'explorer' | 'downloads'>('explorer');

  const traceEndRef = useRef<HTMLDivElement>(null);
  const color = getColor(agent.color);
  const AgentIcon = getIcon(agent.emoji);

  // Auto-scroll trace logs
  useEffect(() => {
    if (traceEndRef.current) {
      traceEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [traceLogs]);

  // Load files inside sandbox workspace
  const loadWorkspaceFiles = useCallback(async (subpath = '') => {
    try {
      const res = await fetch(`/api/workspace?path=${encodeURIComponent(subpath)}&agentId=${encodeURIComponent(agent.id)}`);
      if (res.ok) {
        const data = await res.json() as { files: WorkspaceFile[] };
        setFiles(data.files || []);
      }
    } catch { /* ignore silently */ }
  }, [agent.id]);

  // Poll workspace files during execution
  useEffect(() => {
    loadWorkspaceFiles(currentPath);
    if (running) {
      const timer = setInterval(() => loadWorkspaceFiles(currentPath), 3500);
      return () => clearInterval(timer);
    }
  }, [running, currentPath, loadWorkspaceFiles]);

  // View specific file code preview
  const handleViewFile = async (file: WorkspaceFile) => {
    setSelectedFile(file);
    setLoadingFile(true);
    setSelectedFileContent('');
    try {
      const res = await fetch(`/api/workspace/download?path=${encodeURIComponent(file.path)}&agentId=${encodeURIComponent(agent.id)}`);
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

  const handleRun = async () => {
    if (!task.trim() || running) return;
    setRunning(true);
    setTraceLogs([`🚀 Starting workspace sandbox for ${agent.name}...`]);
    setDone(false);
    setError('');
    setSelectedFile(null);
    setSelectedFileContent('');

    try {
      const localOpenaiKey = localStorage.getItem('orbit_openai_key') || '';
      const localGeminiKey = localStorage.getItem('orbit_gemini_key') || '';
      const res = await fetch('/api/agents/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-openai-api-key': localOpenaiKey,
          'x-gemini-api-key': localGeminiKey,
        },
        body: JSON.stringify({ agentId: agent.id, task }),
      });

      if (!res.ok) throw new Error(await res.text());

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No streaming channel available');
      const decoder = new TextDecoder();

      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;
        const lines = decoder.decode(value).split('\n').filter(l => l.startsWith('data:'));
        for (const line of lines) {
          try {
            const event = JSON.parse(line.slice(5)) as { type: string; data: Record<string, unknown> };
            if (event.type === 'chunk') {
              const txt = event.data.text as string;
              setTraceLogs(p => {
                const copy = [...p];
                if (copy.length > 0 && !copy[copy.length - 1].startsWith('>')) {
                  copy[copy.length - 1] += txt;
                  return copy;
                }
                return [...copy, txt];
              });
            }
            if (event.type === 'tool') {
              setTraceLogs(p => [...p, `🔧 Executing tool: ${event.data.name}(${JSON.stringify(event.data.args)})`]);
            }
            if (event.type === 'done') {
              setTokens(event.data.tokens as number);
              setCost(event.data.cost as number);
              setDone(true);
              setTraceLogs(p => [...p, `✅ Task executed completely.`]);
              loadWorkspaceFiles(currentPath);
            }
            if (event.type === 'error') {
              setError(event.data.message as string);
              setDone(true);
              setTraceLogs(p => [...p, `❌ Execution failure: ${event.data.message}`]);
            }
          } catch { /* skip */ }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setTraceLogs(p => [...p, `❌ API/Network Error: ${msg}`]);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(5, 8, 16, 0.85)',
        backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: '#0a0f1d', border: `1px solid ${color}44`, borderRadius: 16,
        width: '95vw', maxWidth: 1400, height: '85vh', display: 'flex', flexDirection: 'column',
        overflow: 'hidden', boxShadow: `0 0 60px ${color}15`,
      }}>
        {/* IDE Header */}
        <div style={{ padding: '16px 24px', borderBottom: `1px solid rgba(255,255,255,0.06)`, display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${color}33` }}>
            <AgentIcon size={20} style={{ color }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
              {agent.name}
              <span style={{ fontSize: '0.75rem', fontWeight: 500, padding: '2px 8px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', color: '#64748b', border: '1px solid rgba(255,255,255,0.08)' }}>
                Sandbox Workspace
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: 1 }}>{agent.vibe}</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.04)', border: 'none', borderRadius: 8, width: 32, height: 32, color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
            <X size={16} />
          </button>
        </div>

        {/* Workspace Split Layout */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          
          {/* Left Column (Width: 35%) — Inputs, Trace logs, Cost metrics */}
          <div style={{ width: '35%', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', background: '#070a14' }}>
            
            {/* Task input header */}
            {!running && !traceLogs.length && (
              <div style={{ padding: 20, borderBottom: '1px solid rgba(255,255,255,0.04)', flexShrink: 0 }}>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: 8, fontWeight: 500 }}>
                  Enter task for execution
                </label>
                <textarea
                  value={task}
                  onChange={e => setTask(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleRun(); }}
                  placeholder={`e.g., "Analyze workspace files and create a summary report"`}
                  autoFocus
                  style={{
                    width: '100%', minHeight: 90, background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 12px',
                    color: '#f1f5f9', fontSize: '0.85rem', fontFamily: 'inherit', resize: 'vertical', outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                  <span style={{ fontSize: '0.7rem', color: '#334155' }}>Ctrl+Enter to execute</span>
                  <button
                    onClick={handleRun}
                    disabled={!task.trim()}
                    style={{
                      padding: '8px 18px', background: task.trim() ? `linear-gradient(135deg, ${color}, ${color}cc)` : 'rgba(255,255,255,0.03)',
                      border: 'none', borderRadius: 6, color: '#fff', fontWeight: 600, cursor: task.trim() ? 'pointer' : 'not-allowed',
                      fontSize: '0.8rem', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    <Play size={12} /> Run Agent
                  </button>
                </div>
              </div>
            )}

            {/* Trace logs list */}
            {(running || traceLogs.length > 0) && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ padding: '10px 16px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: running ? color : '#10b981', animation: running ? 'pulse 1s infinite' : 'none' }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Action & Reasoner Trace</span>
                  {done && (
                    <button
                      onClick={() => { setTraceLogs([]); setDone(false); setError(''); }}
                      style={{ marginLeft: 'auto', background: 'none', border: 'none', color, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <RotateCcw size={10} /> Reset
                    </button>
                  )}
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: 16, fontFamily: 'monospace', fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {traceLogs.map((log, idx) => {
                    const isError = log.startsWith('❌');
                    const isSuccess = log.startsWith('✅') || log.startsWith('🚀');
                    const isTool = log.startsWith('🔧');
                    let logColor = '#94a3b8';
                    if (isError) logColor = '#f43f5e';
                    else if (isSuccess) logColor = '#10b981';
                    else if (isTool) logColor = color;

                    return (
                      <div key={idx} style={{ color: logColor, marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                        {log}
                      </div>
                    );
                  })}
                  <div ref={traceEndRef} />
                </div>

                {/* Metadata details */}
                <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: 16, flexShrink: 0 }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Token Usage</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#cbd5e1', marginTop: 2 }}>{tokens.toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Computed Cost (USD)</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#cbd5e1', marginTop: 2 }}>${cost.toFixed(4)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column (Width: 65%) — Tabbed Explorer / Downloads */}
          <div style={{ width: '65%', display: 'flex', flexDirection: 'column', background: '#0a0f1d' }}>
            
            {/* Tabs */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
              <button
                onClick={() => setActiveTab('explorer')}
                style={{
                  padding: '12px 20px', background: activeTab === 'explorer' ? '#0a0f1d' : 'transparent',
                  border: 'none', borderBottom: activeTab === 'explorer' ? `2px solid ${color}` : 'none',
                  color: activeTab === 'explorer' ? '#f1f5f9' : '#64748b', fontSize: '0.8rem', fontWeight: 600,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s',
                }}
              >
                <Code size={14} /> Workspace Explorer
              </button>
              <button
                onClick={() => setActiveTab('downloads')}
                style={{
                  padding: '12px 20px', background: activeTab === 'downloads' ? '#0a0f1d' : 'transparent',
                  border: 'none', borderBottom: activeTab === 'downloads' ? `2px solid ${color}` : 'none',
                  color: activeTab === 'downloads' ? '#f1f5f9' : '#64748b', fontSize: '0.8rem', fontWeight: 600,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s',
                }}
              >
                <Download size={14} /> Assets & Downloads
              </button>
            </div>

            {/* Content Tab Explorer */}
            {activeTab === 'explorer' ? (
              <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                
                {/* Explorer File list (Width: 40%) */}
                <div style={{ width: '40%', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', overflowY: 'auto', background: 'rgba(0,0,0,0.1)' }}>
                  <div style={{ padding: '12px 16px', fontSize: '0.72rem', fontWeight: 600, color: '#475569', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>SANDBOX FILESYSTEM</span>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <span style={{ cursor: 'pointer', color }} onClick={() => loadWorkspaceFiles(currentPath)}>refresh</span>
                      <a
                        href={`/api/workspace/download?agentId=${encodeURIComponent(agent.id)}`}
                        download={`${agent.id}-workspace.zip`}
                        style={{ cursor: 'pointer', color, textDecoration: 'none' }}
                      >
                        download zip
                      </a>
                    </div>
                  </div>
                  {files.length === 0 ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#334155', padding: 24, textAlign: 'center' }}>
                      <Folder size={32} style={{ marginBottom: 8 }} />
                      <span style={{ fontSize: '0.8rem' }}>No files generated yet. Run the agent to create files in the workspace.</span>
                    </div>
                  ) : (
                    <div style={{ padding: 8 }}>
                      {files.map((file, idx) => (
                        <div
                          key={idx}
                          onClick={() => { if (file.type === 'file') handleViewFile(file); }}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '8px 10px', borderRadius: 6, cursor: file.type === 'file' ? 'pointer' : 'default',
                            background: selectedFile?.path === file.path ? 'rgba(255,255,255,0.04)' : 'transparent',
                            marginBottom: 2, transition: 'all 0.15s',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                            {file.type === 'dir' ? (
                              <Folder size={14} style={{ color: '#eab308' }} />
                            ) : (
                              <File size={14} style={{ color: '#38bdf8' }} />
                            )}
                            <span style={{ fontSize: '0.78rem', color: '#cbd5e1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {file.name}
                            </span>
                          </div>
                          {file.type === 'file' && (
                            <a
                              href={`/api/workspace/download?path=${encodeURIComponent(file.path)}&agentId=${encodeURIComponent(agent.id)}`}
                              download
                              onClick={e => e.stopPropagation()}
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: 4, background: 'rgba(255,255,255,0.03)', color: '#64748b', cursor: 'pointer', transition: 'all 0.2s' }}
                            >
                              <Download size={11} />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Code Preview Pane (Width: 60%) */}
                <div style={{ width: '60%', display: 'flex', flexDirection: 'column', background: '#05080f', overflow: 'hidden' }}>
                  {selectedFile ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      <div style={{ padding: '10px 16px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#cbd5e1' }}>{selectedFile.name}</span>
                        <a
                          href={`/api/workspace/download?path=${encodeURIComponent(selectedFile.path)}&agentId=${encodeURIComponent(agent.id)}`}
                          download
                          style={{ fontSize: '0.72rem', color, textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <Download size={11} /> Download File
                        </a>
                      </div>

                      {loadingFile ? (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                          <Loader2 className="animate-spin" size={24} />
                        </div>
                      ) : (
                        <div style={{ flex: 1, overflow: 'auto', padding: 16, fontFamily: 'monospace', fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.6, whiteSpace: 'pre', background: '#03050a' }}>
                          {selectedFileContent || '(file is empty)'}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#334155', padding: 24 }}>
                      <Code size={40} style={{ marginBottom: 12 }} />
                      <span style={{ fontSize: '0.85rem' }}>Select a file from the list to preview its code in real time</span>
                    </div>
                  )}
                </div>

              </div>
            ) : (
              /* Downloads Tab */
              <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f1f5f9', marginBottom: 16 }}>
                  Generated Workspace Deliverables
                </div>
                {files.filter(f => f.type === 'file').length === 0 ? (
                  <div style={{ border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 10, padding: '40px 20px', textAlign: 'center', color: '#475569' }}>
                    <Download size={32} style={{ marginBottom: 10, opacity: 0.5 }} />
                    <div style={{ fontSize: '0.8rem' }}>No assets generated for download yet. Run the agent and check back here.</div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    {files.filter(f => f.type === 'file').map((file, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                          borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                          gap: 12,
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#cbd5e1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {file.name}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: 4 }}>
                            Size: {(file.size / 1024).toFixed(2)} KB
                          </div>
                        </div>
                        <a
                          href={`/api/workspace/download?path=${encodeURIComponent(file.path)}&agentId=${encodeURIComponent(agent.id)}`}
                          download
                          style={{
                            padding: '8px 12px', background: `${color}15`, border: `1px solid ${color}33`,
                            borderRadius: 6, color, fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none',
                            display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', transition: 'all 0.2s',
                          }}
                        >
                          <Download size={12} /> Download Deliverable
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}

// ─── Agent Card ──────────────────────────────────────────────────────────────
function AgentCard({ agent, onRun }: { agent: Agent; onRun: (a: Agent) => void }) {
  const color = getColor(agent.color);
  const [hover, setHover] = useState(false);
  const CardIcon = getIcon(agent.emoji);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${hover ? color + '44' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 14, padding: '18px 20px', cursor: 'pointer',
        transition: 'all 0.18s', display: 'flex', flexDirection: 'column', gap: 12,
        position: 'relative', overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: hover ? color : 'transparent', transition: 'background 0.18s' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${color}22`, flexShrink: 0 }}>
          <CardIcon size={20} style={{ color }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: '0.92rem', color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {agent.name}
          </div>
          <div style={{ fontSize: '0.7rem', color, textTransform: 'capitalize', marginTop: 2, fontWeight: 500 }}>
            {agent.category.replace(/-/g, ' ')}
          </div>
        </div>
      </div>

      <div style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: 36 }}>
        {agent.vibe || agent.description}
      </div>

      <button
        onClick={() => onRun(agent)}
        style={{
          padding: '8px 16px', background: hover ? `${color}20` : 'rgba(255,255,255,0.04)',
          border: `1px solid ${hover ? color + '44' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: 8, color: hover ? color : '#94a3b8', fontSize: '0.8rem', fontWeight: 600,
          cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center',
        }}
      >
        <Play size={11} /> Run Task
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
    <div style={{ padding: '2rem', maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Title Header */}
      <div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 8 }}>
          Autonomous Agent Registry
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 4 }}>
          {total} specialized agents configured to execute system and code tasks on your machine.
        </p>
      </div>

      {/* Control Actions (Search & Tabs) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {/* Search */}
        <div style={{ position: 'relative', width: '100%', maxWidth: 480 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569', display: 'flex', alignItems: 'center' }}>
            <Search size={16} />
          </span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search agents by name, skill, or department..."
            style={{
              width: '100%', padding: '10px 12px 10px 38px', background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, color: '#f1f5f9',
              fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
              transition: 'border 0.2s',
            }}
          />
        </div>

        {/* Categories Tab Selector */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setSelectedCategory('all')}
            style={{
              padding: '6px 14px', borderRadius: 20,
              background: selectedCategory === 'all' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.03)',
              border: selectedCategory === 'all' ? 'none' : '1px solid rgba(255,255,255,0.06)',
              color: selectedCategory === 'all' ? '#fff' : '#94a3b8',
              fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            All Divisions
          </button>
          
          {Object.entries(categories).map(([key, meta]) => {
            const CatIcon = getIcon(meta.icon);
            const isSelected = selectedCategory === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                style={{
                  padding: '6px 14px', borderRadius: 20,
                  background: isSelected ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.03)',
                  border: isSelected ? 'none' : '1px solid rgba(255,255,255,0.06)',
                  color: isSelected ? '#fff' : '#94a3b8',
                  fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <CatIcon size={12} />
                {meta.label}
              </button>
            );
          })}
        </div>

      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.2rem' }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} style={{ height: 160, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 14, animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : agents.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '6rem 2rem', color: '#475569', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: 16 }}>
          <Cpu size={40} style={{ opacity: 0.5 }} />
          <span style={{ fontSize: '0.9rem' }}>No specialized agents found. Try adjusting your query or filters.</span>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.2rem' }}>
          {agents.map(agent => (
            <AgentCard key={agent.id} agent={agent} onRun={setSelectedAgent} />
          ))}
        </div>
      )}

      {/* Split Workspace Interface */}
      {selectedAgent && (
        <AgentWorkspaceModal agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:1} }
      `}</style>

    </div>
  );
}
