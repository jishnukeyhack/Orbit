'use client';
import { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, Search, Play, HelpCircle, ShieldAlert, Cpu, Sparkles, TerminalSquare } from 'lucide-react';

interface TerminalLine {
  type: 'nlp-input' | 'command' | 'output' | 'error' | 'info' | 'system';
  content: string;
  timestamp: string;
}

const SUGGESTIONS = [
  'list all files in my workspace',
  'show git status',
  'npm run dev',
  'node -v',
  'create a hello-world.js file',
  'show me the package.json',
];

export default function TerminalPage() {
  const [terminalMode, setTerminalMode] = useState<'shell' | 'ai'>('shell');
  
  // State for AI Mode
  const [aiLines, setAiLines] = useState<TerminalLine[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  
  // State for Real Shell Mode
  const [shellInput, setShellInput] = useState('');
  const [shellOutput, setShellOutput] = useState<string>('');
  const [shellStatus, setShellStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  
  const wsRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize Welcome Messages
  const getWelcomeLines = (): TerminalLine[] => [
    { type: 'system', content: '╔══════════════════════════════════════════════╗', timestamp: '' },
    { type: 'system', content: '║         ORBIT AUTOPILOT — AI ASSISTANT       ║', timestamp: '' },
    { type: 'system', content: '║   Translate natural language into shell ops  ║', timestamp: '' },
    { type: 'system', content: '╚══════════════════════════════════════════════╝', timestamp: '' },
    { type: 'info', content: 'Examples: "show my files" · "list git history" · "make a new folder"', timestamp: '' },
    { type: 'info', content: 'Type English sentences below, and AI will interpret and execute them.', timestamp: '' },
    { type: 'system', content: '─'.repeat(50), timestamp: '' },
  ];

  useEffect(() => {
    setAiLines(getWelcomeLines());
  }, []);

  // Sync scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiLines, shellOutput, terminalMode]);

  // Focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, [terminalMode]);

  // Connect WebSocket for Real PTY Shell Mode
  const connectWebSocket = async () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    setShellStatus('connecting');
    setShellOutput(prev => prev + '\r\n🔌 Connecting to Orbit Terminal Server...\r\n');

    try {
      // Trigger API to start WebSocket server
      const res = await fetch('/api/terminal');
      const data = await res.json() as { wsUrl: string; ready: boolean };
      
      if (!res.ok || !data.ready) {
        throw new Error('Terminal server not ready');
      }

      const socket = new WebSocket(data.wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        setShellStatus('connected');
        setShellOutput(prev => prev + '✅ PTY WebSocket Established. Interactive Shell Active.\r\n\r\n');
      };

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as { type: string; data?: string; message?: string; code?: number };
          if (msg.type === 'output' && msg.data) {
            setShellOutput(prev => prev + msg.data);
          } else if (msg.type === 'error') {
            setShellOutput(prev => prev + `\r\n❌ [Terminal Error] ${msg.message}\r\n`);
          } else if (msg.type === 'exit') {
            setShellOutput(prev => prev + `\r\n🚪 Shell process exited with code ${msg.code}\r\n`);
            setShellStatus('disconnected');
          }
        } catch {
          // Fallback to raw string output
          setShellOutput(prev => prev + event.data);
        }
      };

      socket.onclose = () => {
        setShellStatus('disconnected');
        setShellOutput(prev => prev + '🔌 Connection to terminal server closed.\r\n');
      };

      socket.onerror = () => {
        setShellStatus('disconnected');
        setShellOutput(prev => prev + '❌ WebSocket connection error. Ensure backend server is running.\r\n');
      };

    } catch (err) {
      setShellStatus('disconnected');
      setShellOutput(prev => prev + `❌ Failed to initiate PTY Shell: ${err instanceof Error ? err.message : String(err)}\r\n`);
    }
  };

  // Auto connect socket on mount/mode-toggle
  useEffect(() => {
    if (terminalMode === 'shell' && shellStatus === 'disconnected') {
      connectWebSocket();
    }
    return () => {
      // Keep socket open but clean up on page exit
    };
  }, [terminalMode]);

  // Clean up socket on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const timestamp = () => new Date().toLocaleTimeString();

  // Executing NLP AI Assistant Mode
  const runAiCommand = async (userInput: string) => {
    const trimmed = userInput.trim();
    if (!trimmed) return;

    setHistory(h => [trimmed, ...h].slice(0, 50));
    setHistoryIdx(-1);
    setAiInput('');
    setAiLoading(true);

    setAiLines(prev => [...prev, { type: 'nlp-input', content: `> ${trimmed}`, timestamp: timestamp() }]);

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
      };

      if (data.isNlp && data.command) {
        setAiLines(prev => [...prev, { type: 'info', content: `Interpreted: ${data.interpretation}`, timestamp: '' }]);
        setAiLines(prev => [...prev, { type: 'command', content: `$ ${data.command}`, timestamp: '' }]);
      } else if (data.command) {
        setAiLines(prev => [...prev, { type: 'command', content: `$ ${data.command}`, timestamp: '' }]);
      }

      if (data.output) {
        const outputLines = data.output.split('\n');
        for (const line of outputLines) {
          setAiLines(prev => [...prev, {
            type: data.isError ? 'error' : 'output',
            content: line,
            timestamp: '',
          }]);
        }
      }

      if (data.durationMs) {
        setAiLines(prev => [...prev, { type: 'info', content: `Done in ${data.durationMs}ms`, timestamp: '' }]);
      }

    } catch (err) {
      setAiLines(prev => [...prev, { type: 'error', content: `Error: ${err instanceof Error ? err.message : String(err)}`, timestamp: '' }]);
    } finally {
      setAiLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  // Executing Direct WebSocket shell commands
  const runShellCommand = (userInput: string) => {
    const trimmed = userInput.trim();
    if (!trimmed) return;

    setHistory(h => [trimmed, ...h].slice(0, 50));
    setHistoryIdx(-1);
    setShellInput('');

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'cmd', command: trimmed }));
    } else {
      setShellOutput(prev => prev + `\r\n❌ Shell disconnected. Click Reconnect above.\r\n`);
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
      case 'info': return '#64748b';
      case 'nlp-input': return '#22d3ee';
      case 'command': return '#fbbf24';
      case 'error': return '#ef4444';
      case 'output': return '#cbd5e1';
      default: return '#94a3b8';
    }
  };

  return (
    <div style={{ padding: '1.5rem', height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f1f5f9', margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
            <TerminalIcon size={24} style={{ color: '#818cf8' }} />
            Developer Console
            <span style={{
              fontSize: '0.65rem', padding: '3px 10px', borderRadius: 20, 
              background: terminalMode === 'shell' ? 'rgba(16,185,129,0.12)' : 'rgba(129,140,248,0.12)', 
              color: terminalMode === 'shell' ? '#10b981' : '#818cf8', 
              border: `1px solid ${terminalMode === 'shell' ? 'rgba(16,185,129,0.2)' : 'rgba(129,140,248,0.2)'}`, 
              fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: terminalMode === 'shell' ? '#10b981' : '#818cf8', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
              {terminalMode === 'shell' ? `PTY ACTIVE (PORT 3001)` : 'AI ASSISTANT'}
            </span>
          </h1>
          <p style={{ color: '#64748b', margin: '0.3rem 0 0', fontSize: '0.85rem' }}>
            Fully operational multi-mode OS terminal. Ctrl+L to clear screen.
          </p>
        </div>

        {/* Console Mode Selectors */}
        <div style={{ display: 'flex', gap: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 3 }}>
          <button
            onClick={() => setTerminalMode('shell')}
            style={{
              padding: '6px 14px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s',
              background: terminalMode === 'shell' ? '#818cf8' : 'transparent',
              color: terminalMode === 'shell' ? '#fff' : '#94a3b8',
              border: 'none',
            }}
          >
            <Cpu size={14} /> Interactive Shell
          </button>
          <button
            onClick={() => setTerminalMode('ai')}
            style={{
              padding: '6px 14px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s',
              background: terminalMode === 'ai' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
              color: terminalMode === 'ai' ? '#fff' : '#94a3b8',
              border: 'none',
            }}
          >
            <Sparkles size={14} /> AI Autopilot
          </button>
        </div>
      </div>

      {/* Suggested Bank (Quick commands) */}
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
              padding: '5px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 8, color: '#94a3b8', fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
              e.currentTarget.style.color = '#94a3b8';
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Terminal Output viewport */}
      <div
        onClick={() => inputRef.current?.focus()}
        style={{
          flex: 1, background: '#030712', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 14, padding: '20px 24px', overflowY: 'auto', cursor: 'text',
          fontFamily: '"Fira Code", "Cascadia Code", "Consolas", monospace', fontSize: '0.86rem', lineHeight: 1.7,
          boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.8)'
        }}
      >
        {terminalMode === 'ai' ? (
          /* AI Assistant output */
          aiLines.map((line, i) => (
            <div key={i} style={{ color: lineTextColor(line.type), display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              {line.timestamp && <span style={{ color: '#334155', fontSize: '0.7rem', flexShrink: 0, marginTop: 2 }}>{line.timestamp}</span>}
              <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{line.content}</span>
            </div>
          ))
        ) : (
          /* Real PTY WebSocket output */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <pre style={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              color: '#e2e8f0',
              margin: 0,
              fontFamily: 'inherit',
              lineHeight: 'inherit'
            }}>
              {shellOutput}
            </pre>
            
            {shellStatus === 'disconnected' && (
              <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, alignSelf: 'flex-start', fontSize: '0.8rem' }}>
                <ShieldAlert size={16} />
                <span>PTY Session closed. Ensure Orbit Server is running on port 3001.</span>
                <button
                  onClick={connectWebSocket}
                  style={{
                    background: '#ef4444', border: 'none', borderRadius: 4, padding: '3px 8px', color: '#fff', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600, marginLeft: 8
                  }}
                >
                  Reconnect
                </button>
              </div>
            )}
          </div>
        )}

        {aiLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', marginTop: 6 }}>
            <div style={{ display: 'flex', gap: 3 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#818cf8', animation: `bounce 0.8s ${i * 0.15}s infinite` }} />
              ))}
            </div>
            <span style={{ fontSize: '0.8rem' }}>Thinking & executing...</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input console */}
      <div style={{
        flexShrink: 0, display: 'flex', gap: 12, alignItems: 'center', background: '#030712', 
        border: `1px solid ${terminalMode === 'shell' ? 'rgba(16,185,129,0.3)' : 'rgba(129,140,248,0.35)'}`, 
        borderRadius: 12, padding: '12px 16px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
      }}>
        <span style={{
          color: terminalMode === 'shell' ? '#10b981' : '#818cf8', 
          fontFamily: 'monospace', fontSize: '0.92rem', fontWeight: 700, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6
        }}>
          {terminalMode === 'shell' ? 'shell $' : 'ai 🤖'}
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
              ? "Type standard terminal commands (ls, git, npm, node, python)..." 
              : "Ask the AI assistant to perform actions (e.g. 'show workspace files')..."
          }
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: '#f1f5f9', fontFamily: '"Fira Code", "Consolas", monospace',
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
            padding: '6px 16px', 
            background: (terminalMode === 'shell' ? shellInput.trim() : aiInput.trim()) && !aiLoading
              ? (terminalMode === 'shell' ? '#10b981' : 'linear-gradient(135deg, #6366f1, #8b5cf6)') 
              : 'rgba(255,255,255,0.04)',
            border: 'none', borderRadius: 8, color: '#fff', fontSize: '0.8rem', 
            cursor: (terminalMode === 'shell' ? shellInput.trim() : aiInput.trim()) && !aiLoading ? 'pointer' : 'not-allowed', 
            fontWeight: 600, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6
          }}
        >
          {terminalMode === 'shell' ? <TerminalSquare size={14} /> : <Sparkles size={14} />}
          Send ↵
        </button>
      </div>

      <style>{`
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
}
