'use client';
import { useState, useRef, useEffect } from 'react';
import { 
  Terminal as TerminalIcon, ShieldAlert, Cpu, Sparkles, TerminalSquare, 
  ChevronRight, ChevronDown, Folder, File, CheckCircle2, Play, CornerDownRight, 
  Check, ArrowRight, Layers, FileCode2
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface WorkspaceMetadata {
  name: string;
  files: { path: string; size: number; contentSummary: string }[];
  tasks: { id: string; title: string; status: 'pending' | 'in_progress' | 'completed' }[];
  rationale: string;
}

interface TerminalLine {
  type: 'nlp-input' | 'command' | 'output' | 'error' | 'info' | 'system';
  content: string;
  timestamp: string;
  workspace?: WorkspaceMetadata;
}

const SUGGESTIONS = [
  'create workspace for express app',
  'initialize yc startup chatbot',
  'list all files in my workspace',
  'show git status',
  'npm run dev',
  'node -v'
];

export default function TerminalPage() {
  const router = useRouter();
  const [terminalMode, setTerminalMode] = useState<'shell' | 'ai'>('ai');
  
  // State for AI Mode
  const [aiLines, setAiLines] = useState<TerminalLine[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  
  // State for Real Shell Mode
  const [shellInput, setShellInput] = useState('');
  const [shellOutput, setShellOutput] = useState<string>('');
  const [shellStatus, setShellStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [transport, setTransport] = useState<'ws' | 'http' | 'stateless' | null>(null);
  const [shellCwd, setShellCwd] = useState('.');
  
  const [sessionId] = useState(() => `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  
  const wsRef = useRef<WebSocket | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const getWelcomeLines = (): TerminalLine[] => [
    { type: 'system', content: '╔═══════════════════════════════════════════════════════════════╗', timestamp: '' },
    { type: 'system', content: '║                      ORBIT CLI — v1.0.0                       ║', timestamp: '' },
    { type: 'system', content: '║       YC-Startup Autonomous Workspace Swarm Assistant         ║', timestamp: '' },
    { type: 'system', content: '╚═══════════════════════════════════════════════════════════════╝', timestamp: '' },
    { type: 'info', content: 'Try: "create workspace for ecommerce api" or "initialize chat app startup"', timestamp: '' },
    { type: 'info', content: 'Autonomously generates code structures, files, and screens agent swarms.', timestamp: '' },
    { type: 'system', content: '─'.repeat(64), timestamp: '' },
  ];

  useEffect(() => {
    setAiLines(getWelcomeLines());
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiLines, shellOutput, terminalMode]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [terminalMode]);

  const connectStateless = () => {
    setShellStatus('connected');
    setTransport('stateless');
    setShellOutput(prev => prev + 'Orbit Serverless Terminal Connected.\r\nStateless command execution active.\r\n\r\n');
  };

  const connectTerminal = async () => {
    if (wsRef.current) {
      try { wsRef.current.close(); } catch {}
      wsRef.current = null;
    }
    if (eventSourceRef.current) {
      try { eventSourceRef.current.close(); } catch {}
      eventSourceRef.current = null;
    }

    setShellStatus('connecting');
    setTransport(null);
    setShellOutput(prev => prev + '\r\nConnecting to Orbit Terminal Server...\r\n');

    const isLocalhost = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    if (!isLocalhost) {
      connectStateless();
      return;
    }

    try {
      const res = await fetch('/api/terminal');
      const data = await res.json() as { wsUrl: string; ready: boolean };
      
      if (!res.ok || !data.ready) {
        throw new Error('Terminal server not ready');
      }

      const socket = new WebSocket(data.wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        setShellStatus('connected');
        setTransport('ws');
        setShellOutput(prev => prev + 'PTY WebSocket Established. Interactive Shell Active.\r\n\r\n');
      };

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as { type: string; data?: string; message?: string; code?: number };
          if (msg.type === 'output' && msg.data) {
            setShellOutput(prev => prev + msg.data);
          } else if (msg.type === 'error') {
            setShellOutput(prev => prev + `\r\n[Terminal Error] ${msg.message}\r\n`);
          } else if (msg.type === 'exit') {
            setShellOutput(prev => prev + `\r\nShell process exited with code ${msg.code}\r\n`);
            setShellStatus('disconnected');
          }
        } catch {
          setShellOutput(prev => prev + event.data);
        }
      };

      socket.onclose = () => {
        if (wsRef.current === socket) {
          wsRef.current = null;
          setShellStatus('disconnected');
          setShellOutput(prev => prev + 'Connection to terminal server closed.\r\n');
        }
      };

      socket.onerror = () => {
        wsRef.current = null;
        connectStateless();
      };

    } catch (err) {
      connectStateless();
    }
  };

  useEffect(() => {
    if (terminalMode === 'shell' && shellStatus === 'disconnected') {
      connectTerminal();
    }
  }, [terminalMode]);

  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (eventSourceRef.current) eventSourceRef.current.close();
    };
  }, []);

  const timestamp = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const runAiCommand = async (userInput: string) => {
    const trimmed = userInput.trim();
    if (!trimmed) return;

    setHistory(h => [trimmed, ...h].slice(0, 50));
    setHistoryIdx(-1);
    setAiInput('');
    setAiLoading(true);

    setAiLines(prev => [...prev, { type: 'nlp-input', content:trimmed, timestamp: timestamp() }]);

    try {
      const localOpenaiKey = localStorage.getItem('orbit_openai_key') || '';
      const localGeminiKey = localStorage.getItem('orbit_gemini_key') || '';

      const res = await fetch('/api/terminal/nlp', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-openai-api-key': localOpenaiKey,
          'x-gemini-api-key': localGeminiKey
        },
        body: JSON.stringify({ input: trimmed, execute: true }),
      });

      const data = await res.json() as {
        interpretation: string;
        command: string | null;
        output: string;
        isError: boolean;
        isNlp: boolean;
        durationMs?: number;
        workspace?: WorkspaceMetadata;
      };

      if (data.isNlp && data.command) {
        setAiLines(prev => [...prev, { type: 'info', content: `Interpretation: ${data.interpretation}`, timestamp: '' }]);
        setAiLines(prev => [...prev, { type: 'command', content: `orbit run "${trimmed}"`, timestamp: '' }]);
      } else if (data.command) {
        setAiLines(prev => [...prev, { type: 'command', content: data.command!, timestamp: '' }]);
      }

      if (data.output) {
        setAiLines(prev => [...prev, {
          type: data.isError ? 'error' : 'output',
          content: data.output,
          timestamp: '',
          workspace: data.workspace
        }]);
      }

      if (data.durationMs) {
        setAiLines(prev => [...prev, { type: 'info', content: `Autonomy cycle concluded in ${data.durationMs}ms`, timestamp: '' }]);
      }

    } catch (err) {
      setAiLines(prev => [...prev, { type: 'error', content: `Error executing: ${err instanceof Error ? err.message : String(err)}`, timestamp: '' }]);
    } finally {
      setAiLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const runShellCommand = async (userInput: string) => {
    const trimmed = userInput.trim();
    if (!trimmed) return;

    setHistory(h => [trimmed, ...h].slice(0, 50));
    setHistoryIdx(-1);
    setShellInput('');

    if (transport === 'ws' && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'cmd', command: trimmed }));
    } else if (transport === 'http') {
      try {
        await fetch('/api/terminal/input', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, data: trimmed, type: 'cmd' }),
        });
      } catch (err) {
        setShellOutput(prev => prev + `\r\nFailed to send input: ${err instanceof Error ? err.message : String(err)}\r\n`);
      }
    } else if (transport === 'stateless') {
      if (trimmed.toLowerCase() === 'clear') {
        setShellOutput('');
        return;
      }
      setShellOutput(prev => prev + `\r\n[${shellCwd}] $ ${trimmed}\r\n`);
      try {
        const res = await fetch('/api/terminal/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: trimmed, cwd: shellCwd }),
        });

        if (!res.ok) throw new Error(`Execution error: ${res.statusText}`);
        const data = await res.json() as { output: string; isError: boolean; cwd: string };
        setShellOutput(prev => prev + data.output + '\r\n');
        if (data.cwd) setShellCwd(data.cwd);
      } catch (err) {
        setShellOutput(prev => prev + `[Terminal Error] ${err instanceof Error ? err.message : String(err)}\r\n`);
      }
    } else {
      setShellOutput(prev => prev + `\r\nShell disconnected.\r\n`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const inputVal = terminalMode === 'shell' ? shellInput : aiInput;
    const setInputVal = terminalMode === 'shell' ? setShellInput : setAiInput;

    if (e.key === 'Enter') {
      if (terminalMode === 'shell') {
        runShellCommand(shellInput);
      } else {
        runAiCommand(aiInput);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newIdx = Math.min(historyIdx + 1, history.length - 1);
      setHistoryIdx(newIdx);
      setInputVal(history[newIdx] ?? '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newIdx = Math.max(historyIdx - 1, -1);
      setHistoryIdx(newIdx);
      setInputVal(newIdx === -1 ? '' : history[newIdx] ?? '');
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      if (terminalMode === 'shell') {
        setShellOutput('');
      } else {
        setAiLines(getWelcomeLines());
      }
    }
  };

  const lineTextColor = (type: TerminalLine['type']) => {
    switch (type) {
      case 'system': return '#818cf8';
      case 'info': return '#475569';
      case 'nlp-input': return '#38bdf8';
      case 'command': return '#f59e0b';
      case 'error': return '#ef4444';
      case 'output': return '#cbd5e1';
      default: return '#94a3b8';
    }
  };

  // Spectacular premium inline Workspace manifest previewer
  function WorkspacePreviewBox({ workspace }: { workspace: WorkspaceMetadata }) {
    const [openTree, setOpenTree] = useState(true);
    
    return (
      <div style={{
        background: '#040813', border: '1.5px solid rgba(99,102,241,0.25)', borderRadius: 16,
        padding: 16, margin: '12px 0', maxWidth: 650, boxShadow: '0 10px 30px rgba(99,102,241,0.06)',
        display: 'flex', flexDirection: 'column', gap: 12
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Layers size={14} style={{ color: '#818cf8' }} />
            <span style={{ fontWeight: 800, color: '#f8fafc', fontSize: '0.82rem', letterSpacing: '-0.01em' }}>Orbit CLI Workspace Manifest</span>
          </div>
          <span style={{ fontSize: '0.68rem', padding: '2px 8px', background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.22)', borderRadius: 20, fontWeight: 700 }}>
            YC INITIALIZED
          </span>
        </div>

        {/* Directory Tree */}
        <div>
          <button
            onClick={() => setOpenTree(!openTree)}
            style={{ background: 'none', border: 'none', color: '#cbd5e1', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}
          >
            {openTree ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            <Folder size={12} style={{ color: '#f59e0b' }} />
            <span>orbit-workspace/projects/{workspace.name}/</span>
          </button>
          
          {openTree && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingLeft: 16, marginTop: 6, borderLeft: '1.5px solid rgba(255,255,255,0.04)' }}>
              {workspace.files.map((file, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: '#94a3b8' }}>
                  <CornerDownRight size={10} style={{ color: '#475569' }} />
                  <File size={11} style={{ color: '#818cf8' }} />
                  <span style={{ fontFamily: 'monospace' }}>{file.path.split('/').pop()}</span>
                  <span style={{ fontSize: '0.65rem', color: '#475569' }}>({file.size} bytes)</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Task Checklist */}
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Checkpoint Progress</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {workspace.tasks.map(task => (
              <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.72rem' }}>
                {task.status === 'completed' ? (
                  <CheckCircle2 size={12} style={{ color: '#10b981' }} />
                ) : (
                  <div style={{ width: 12, height: 12, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.18)' }} />
                )}
                <span style={{ color: task.status === 'completed' ? '#cbd5e1' : '#64748b', fontWeight: 500 }}>{task.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* YC Action Trigger Button */}
        <button
          onClick={() => {
            // Save the objective preconfigured
            localStorage.setItem('orbit_preloaded_swarm_goal', `Implement detailed backend routing, schema logic, and Jest coverage testing for ${workspace.name}`);
            router.push('/swarms');
          }}
          style={{
            padding: '10px 14px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none',
            borderRadius: 8, color: '#fff', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', gap: 6,
            justifyContent: 'center', transition: 'all 0.2s', marginTop: 4
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
        >
          <Play size={10} fill="#fff" /> Deploy Autonomous Agent Swarms <ArrowRight size={10} />
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: 1400, margin: '0 auto' }}>
      
      {/* Console Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f1f5f9', margin: 0, letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: 12 }}>
            <TerminalIcon size={24} style={{ color: '#818cf8' }} />
             Orbit CLI Console
            <span style={{
              fontSize: '0.65rem', padding: '3px 10px', borderRadius: 20, 
              background: terminalMode === 'shell' ? 'rgba(16,185,129,0.12)' : 'rgba(129,140,248,0.12)', 
              color: terminalMode === 'shell' ? '#10b981' : '#818cf8', 
              border: `1px solid ${terminalMode === 'shell' ? 'rgba(16,185,129,0.22)' : 'rgba(129,140,248,0.22)'}`, 
              fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: terminalMode === 'shell' ? '#10b981' : '#818cf8', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
              {terminalMode === 'shell' 
                ? (transport === 'ws' ? 'PTY WS ACTIVE' : transport === 'http' ? 'PTY HTTP STREAM' : transport === 'stateless' ? 'STATELESS RUNNER' : 'PTY ONLINE') 
                : 'ORBIT CLI AGENT'}
            </span>
          </h1>
          <p style={{ color: '#64748b', margin: '0.4rem 0 0', fontSize: '0.85rem', fontWeight: 500 }}>
            Autonomous natural language terminal engine. Press Ctrl+L to clear screen.
          </p>
        </div>

        {/* Mode Selector */}
        <div style={{ display: 'flex', gap: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 3 }}>
          <button
            onClick={() => setTerminalMode('shell')}
            style={{
              padding: '6px 14px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s',
              background: terminalMode === 'shell' ? '#818cf8' : 'transparent',
              color: terminalMode === 'shell' ? '#fff' : '#94a3b8',
              border: 'none',
            }}
          >
            <Cpu size={13} /> Shell
          </button>
          <button
            onClick={() => setTerminalMode('ai')}
            style={{
              padding: '6px 14px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s',
              background: terminalMode === 'ai' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
              color: terminalMode === 'ai' ? '#fff' : '#94a3b8',
              border: 'none',
            }}
          >
            <Sparkles size={13} /> Orbit CLI (`orbit`)
          </button>
        </div>
      </div>

      {/* Suggested commands */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
        {SUGGESTIONS.map(s => (
          <button
            key={s}
            onClick={() => {
              if (terminalMode === 'shell') {
                setShellInput(s);
              } else {
                setAiInput(s);
              }
              inputRef.current?.focus();
            }}
            style={{
              padding: '5px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: 8, color: '#94a3b8', fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 600
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.color = '#94a3b8'; }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Terminal Viewport */}
      <div
        onClick={() => inputRef.current?.focus()}
        style={{
          flex: 1, background: '#020409', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 16, padding: '20px 24px', overflowY: 'auto', cursor: 'text',
          fontFamily: '"Fira Code", "Consolas", monospace', fontSize: '0.86rem', lineHeight: 1.7,
          boxShadow: 'inset 0 4px 30px rgba(0,0,0,0.8)'
        }}
      >
        {terminalMode === 'ai' ? (
          aiLines.map((line, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
              <div style={{ color: lineTextColor(line.type), display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                {line.timestamp && <span style={{ color: '#334155', fontSize: '0.7rem', flexShrink: 0, marginTop: 2 }}>{line.timestamp}</span>}
                {line.type === 'nlp-input' && <span style={{ color: '#38bdf8', fontWeight: 800 }}>orbit $</span>}
                <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{line.content}</span>
              </div>
              
              {line.workspace && (
                <WorkspacePreviewBox workspace={line.workspace} />
              )}
            </div>
          ))
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: '#e2e8f0', margin: 0, fontFamily: 'inherit', lineHeight: 'inherit' }}>
              {shellOutput}
            </pre>
            
            {shellStatus === 'disconnected' && (
              <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 8, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, alignSelf: 'flex-start', fontSize: '0.8rem', fontWeight: 600 }}>
                <ShieldAlert size={16} />
                <span>PTY Session closed. Ensure Orbit Server is running properly.</span>
                <button
                  onClick={connectTerminal}
                  style={{ background: '#ef4444', border: 'none', borderRadius: 6, padding: '4px 10px', color: '#fff', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 700, marginLeft: 8 }}
                >
                  Reconnect
                </button>
              </div>
            )}
          </div>
        )}

        {aiLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', marginTop: 6 }}>
            <div style={{ display: 'flex', gap: 3 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#818cf8', animation: `bounce 0.8s ${i * 0.15}s infinite` }} />
              ))}
            </div>
            <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>Orbit Swarms recruiting & executing...</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input console */}
      <div style={{
        flexShrink: 0, display: 'flex', gap: 12, alignItems: 'center', background: '#020409', 
        border: `1.5px solid ${terminalMode === 'shell' ? 'rgba(16,185,129,0.3)' : 'rgba(129,140,248,0.3)'}`, 
        borderRadius: 14, padding: '12px 16px', boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
      }}>
        <span style={{
          color: terminalMode === 'shell' ? '#10b981' : '#818cf8', 
          fontFamily: 'monospace', fontSize: '0.92rem', fontWeight: 800, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6
        }}>
          {terminalMode === 'shell' ? 'shell $' : 'orbit $'}
        </span>
        
        <input
          ref={inputRef}
          value={terminalMode === 'shell' ? shellInput : aiInput}
          onChange={e => {
            if (terminalMode === 'shell') {
              setShellInput(e.target.value);
            } else {
              setAiInput(e.target.value);
            }
          }}
          onKeyDown={handleKeyDown}
          disabled={aiLoading}
          placeholder={
            terminalMode === 'shell' 
              ? "Type standard shell commands (ls, git, npm, node, python)..." 
              : "Ask the Orbit Swarms to build a workspace (e.g. 'create express workspace')..."
          }
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: '#f1f5f9', fontFamily: '"Fira Code", monospace',
            fontSize: '0.88rem', caretColor: terminalMode === 'shell' ? '#10b981' : '#818cf8',
          }}
        />
        
        <button
          onClick={() => {
            if (terminalMode === 'shell') {
              runShellCommand(shellInput);
            } else {
              runAiCommand(aiInput);
            }
          }}
          disabled={
            (terminalMode === 'shell' ? !shellInput.trim() : !aiInput.trim()) || aiLoading
          }
          style={{
            padding: '8px 16px', 
            background: (terminalMode === 'shell' ? shellInput.trim() : aiInput.trim()) && !aiLoading
              ? (terminalMode === 'shell' ? '#10b981' : 'linear-gradient(135deg, #6366f1, #8b5cf6)') 
              : 'rgba(255,255,255,0.02)',
            border: 'none', borderRadius: 8, color: '#fff', fontSize: '0.8rem', 
            cursor: (terminalMode === 'shell' ? shellInput.trim() : aiInput.trim()) && !aiLoading ? 'pointer' : 'not-allowed', 
            fontWeight: 700, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6
          }}
        >
          {terminalMode === 'shell' ? <TerminalSquare size={14} /> : <Sparkles size={14} />}
          Execute ↵
        </button>
      </div>

      <style>{`
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
}
