'use client';
import { useState, useRef, useEffect } from 'react';

interface TerminalLine {
  type: 'nlp-input' | 'command' | 'output' | 'error' | 'info' | 'system';
  content: string;
  timestamp: string;
}

const SUGGESTIONS = [
  'list all files in my workspace',
  'show me what projects I have',
  'create a new folder called my-project',
  'what node version am I running',
  'show git status',
  'npm install in workspace',
  'show me the package.json',
  'create a simple hello world file',
];

const WELCOME = [
  { type: 'system' as const, content: '╔══════════════════════════════════════════════╗', timestamp: '' },
  { type: 'system' as const, content: '║          ORBIT AI TERMINAL — NLP POWERED          ║', timestamp: '' },
  { type: 'system' as const, content: '║   Type natural language OR direct commands   ║', timestamp: '' },
  { type: 'system' as const, content: '╚══════════════════════════════════════════════╝', timestamp: '' },
  { type: 'info' as const, content: 'Examples: "list my files" · "show workspace" · "git status"', timestamp: '' },
  { type: 'info' as const, content: 'Direct commands also work: ls, dir, npm, git, node...', timestamp: '' },
  { type: 'info' as const, content: 'Workspace: orbit-workspace/', timestamp: '' },
  { type: 'system' as const, content: '─'.repeat(50), timestamp: '' },
];

export default function TerminalPage() {
  const [lines, setLines] = useState<TerminalLine[]>(WELCOME);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [lines]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const addLine = (line: TerminalLine) => setLines(prev => [...prev, line]);
  const timestamp = () => new Date().toLocaleTimeString();

  const runCommand = async (userInput: string) => {
    const trimmed = userInput.trim();
    if (!trimmed) return;

    setHistory(h => [trimmed, ...h].slice(0, 50));
    setHistoryIdx(-1);
    setInput('');
    setLoading(true);

    addLine({ type: 'nlp-input', content: `> ${trimmed}`, timestamp: timestamp() });

    try {
      const res = await fetch('/api/terminal/nlp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

      // Show NLP interpretation
      if (data.isNlp && data.command) {
        addLine({ type: 'info', content: `🤖 Interpreted as: ${data.interpretation}`, timestamp: '' });
        addLine({ type: 'command', content: `$ ${data.command}`, timestamp: '' });
      } else if (data.command) {
        addLine({ type: 'command', content: `$ ${data.command}`, timestamp: '' });
      }

      if (data.output) {
        const outputLines = data.output.split('\n');
        for (const line of outputLines) {
          addLine({
            type: data.isError ? 'error' : 'output',
            content: line,
            timestamp: '',
          });
        }
      }

      if (data.durationMs) {
        addLine({ type: 'info', content: `⏱ Done in ${data.durationMs}ms`, timestamp: '' });
      }

    } catch (err) {
      addLine({ type: 'error', content: `Error: ${err instanceof Error ? err.message : String(err)}`, timestamp: '' });
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      runCommand(input);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newIdx = Math.min(historyIdx + 1, history.length - 1);
      setHistoryIdx(newIdx);
      setInput(history[newIdx] ?? '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newIdx = Math.max(historyIdx - 1, -1);
      setHistoryIdx(newIdx);
      setInput(newIdx === -1 ? '' : history[newIdx] ?? '');
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setLines(WELCOME);
    }
  };

  const lineColor = (type: TerminalLine['type']) => {
    switch (type) {
      case 'system': return '#6366f1';
      case 'info': return '#64748b';
      case 'nlp-input': return '#22d3ee';
      case 'command': return '#10b981';
      case 'error': return '#ef4444';
      case 'output': return '#cbd5e1';
      default: return '#94a3b8';
    }
  };

  return (
    <div style={{ padding: '1.5rem', height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f1f5f9', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            🖥️ NLP Terminal
            <span style={{ fontSize: '0.65rem', padding: '3px 8px', borderRadius: 10, background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)', fontWeight: 500 }}>
              LIVE
            </span>
          </h1>
          <p style={{ color: '#64748b', margin: '0.3rem 0 0', fontSize: '0.82rem' }}>
            Type natural language or direct shell commands · Ctrl+L to clear
          </p>
        </div>
        <button
          onClick={() => setLines(WELCOME)}
          style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#94a3b8', fontSize: '0.8rem', cursor: 'pointer' }}
        >
          Clear
        </button>
      </div>

      {/* Suggestions */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
        {SUGGESTIONS.slice(0, 5).map(s => (
          <button
            key={s}
            onClick={() => { setInput(s); inputRef.current?.focus(); }}
            style={{
              padding: '4px 10px', background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)',
              borderRadius: 6, color: '#22d3ee', fontSize: '0.72rem', cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Terminal output */}
      <div
        onClick={() => inputRef.current?.focus()}
        style={{
          flex: 1, background: '#050810', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12, padding: '16px 20px', overflowY: 'auto', cursor: 'text',
          fontFamily: '"Fira Code", "Cascadia Code", "Consolas", monospace', fontSize: '0.85rem', lineHeight: 1.7,
        }}
      >
        {lines.map((line, i) => (
          <div key={i} style={{ color: lineColor(line.type), display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            {line.timestamp && <span style={{ color: '#1e293b', fontSize: '0.72rem', flexShrink: 0, marginTop: 2 }}>{line.timestamp}</span>}
            <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{line.content}</span>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b' }}>
            <div style={{ display: 'flex', gap: 3 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1', animation: `bounce 0.8s ${i * 0.15}s infinite` }} />
              ))}
            </div>
            <span style={{ fontSize: '0.8rem' }}>Executing...</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ flexShrink: 0, display: 'flex', gap: 10, alignItems: 'center', background: '#050810', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 10, padding: '10px 14px' }}>
        <span style={{ color: '#22d3ee', fontFamily: 'monospace', fontSize: '0.9rem', flexShrink: 0 }}>
          {loading ? '⟳' : 'orbit $'}
        </span>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          placeholder="Type a command or describe what you want in plain English..."
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: '#f1f5f9', fontFamily: '"Fira Code", "Consolas", monospace',
            fontSize: '0.875rem', caretColor: '#22d3ee',
          }}
        />
        <button
          onClick={() => runCommand(input)}
          disabled={!input.trim() || loading}
          style={{
            padding: '5px 14px', background: input.trim() && !loading ? 'linear-gradient(135deg, #6366f1, #22d3ee)' : 'rgba(255,255,255,0.06)',
            border: 'none', borderRadius: 7, color: '#fff', fontSize: '0.8rem', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed', fontWeight: 600,
          }}
        >
          Run ↵
        </button>
      </div>

      <style>{`
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
      `}</style>
    </div>
  );
}
