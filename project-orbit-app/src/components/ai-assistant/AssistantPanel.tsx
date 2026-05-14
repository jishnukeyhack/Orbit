"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Sparkles, X, Minus, ArrowUp, Bot, Workflow, Zap, Wrench } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

const SESSION_ID = `orbit-${Date.now()}`;

const QUICK_ACTIONS = [
  { icon: Bot,      label: "What agents can I use?",   q: "What specialized agents are available and what can they do?" },
  { icon: Workflow, label: "How do workflows work?",   q: "Explain how workflows and pipelines work in Orbit." },
  { icon: Zap,      label: "Run a pipeline",           q: "How do I run an AI pipeline to complete a coding task?" },
  { icon: Wrench,   label: "Best agent for coding",    q: "Which agent is best for building a React web app?" },
];

export default function AIAssistantPanel() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;

    const userMsg: Message = { role: "user", content: trimmed };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);

    // Add empty assistant message for streaming
    setMessages(prev => [...prev, { role: "assistant", content: "", streaming: true }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          sessionId: SESSION_ID,
          history: messages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) throw new Error(await res.text());

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value).split("\n").filter(l => l.startsWith("data:"));
        for (const line of lines) {
          try {
            const event = JSON.parse(line.slice(5)) as { type: string; token?: string };
            if (event.type === "chunk" && event.token) {
              accumulated += event.token;
              setMessages(prev =>
                prev.map((m, i) =>
                  i === prev.length - 1
                    ? { ...m, content: accumulated, streaming: true }
                    : m
                )
              );
            }
            if (event.type === "done") {
              setMessages(prev =>
                prev.map((m, i) =>
                  i === prev.length - 1
                    ? { ...m, streaming: false }
                    : m
                )
              );
            }
          } catch { /* skip */ }
        }
      }
    } catch (err) {
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: "assistant", content: `❌ Error: ${err instanceof Error ? err.message : String(err)}` },
      ]);
    } finally {
      setIsStreaming(false);
    }
  }, [messages, isStreaming]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "fixed", bottom: 20, right: 20, width: 52, height: 52,
          borderRadius: "50%", background: "linear-gradient(135deg, var(--accent-blue), var(--accent-purple))",
          border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 24px rgba(79,140,255,0.4)", zIndex: 50, transition: "transform 0.2s, box-shadow 0.2s",
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.08)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
        aria-label="Open Orbit Copilot"
      >
        <Sparkles size={22} color="#fff" />
      </button>
    );
  }

  return (
    <div style={{
      position: "fixed", bottom: 20, right: 20, width: 400, height: 560,
      background: "rgba(11,15,25,0.95)", backdropFilter: "blur(20px) saturate(140%)",
      border: "1px solid rgba(79,140,255,0.22)", borderRadius: 18,
      boxShadow: "0 12px 60px rgba(0,0,0,0.6), 0 0 32px rgba(79,140,255,0.12)",
      zIndex: 50, display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px #10b981" }} />
          <Sparkles size={15} style={{ color: "var(--accent-blue)" }} />
          <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "#f1f5f9" }}>Orbit Copilot</span>
          <span style={{ fontSize: "0.65rem", padding: "2px 6px", borderRadius: 10, background: "rgba(99,102,241,0.2)", color: "#818cf8" }}>GPT-4o</span>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={() => setMessages([])} title="Clear chat" style={{ background: "transparent", border: "none", color: "#475569", cursor: "pointer", padding: 4, fontSize: 12 }}>🗑</button>
          <button onClick={() => setOpen(false)} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 4 }}><Minus size={14} /></button>
          <button onClick={() => setOpen(false)} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 4 }}><X size={14} /></button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.length === 0 ? (
          <>
            <div style={{ textAlign: "center", padding: "20px 0 8px" }}>
              <div style={{ fontSize: "2rem", marginBottom: 8 }}>🚀</div>
              <div style={{ color: "#94a3b8", fontSize: "0.875rem", fontWeight: 500 }}>Orbit Copilot</div>
              <div style={{ color: "#475569", fontSize: "0.78rem", marginTop: 4 }}>Ask me anything about agents, swarms, and AI workflows</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {QUICK_ACTIONS.map(qa => (
                <button
                  key={qa.label}
                  onClick={() => sendMessage(qa.q)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 10, color: "#94a3b8", fontSize: "0.8rem", cursor: "pointer",
                    textAlign: "left", transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.1)"; e.currentTarget.style.color = "#818cf8"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#94a3b8"; }}
                >
                  <qa.icon size={14} style={{ flexShrink: 0 }} />
                  {qa.label}
                </button>
              ))}
            </div>
          </>
        ) : (
          messages.map((msg, i) => (
            <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
              {msg.role === "assistant" && (
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg, #4f8cff, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginRight: 8, marginTop: 2 }}>
                  <Sparkles size={12} color="#fff" />
                </div>
              )}
              <div style={{
                maxWidth: "80%", padding: "9px 13px",
                background: msg.role === "user" ? "rgba(79,140,255,0.18)" : "rgba(255,255,255,0.06)",
                borderRadius: msg.role === "user" ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                border: msg.role === "user" ? "1px solid rgba(79,140,255,0.28)" : "1px solid rgba(255,255,255,0.08)",
                fontSize: "0.82rem", color: msg.role === "user" ? "#e2e8f0" : "#cbd5e1",
                lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word",
              }}>
                {msg.content}
                {msg.streaming && <span style={{ display: "inline-block", width: 6, height: 12, background: "#4f8cff", marginLeft: 3, animation: "blink 0.7s infinite", verticalAlign: "text-bottom" }} />}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "10px 14px", borderTop: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "8px 8px 8px 14px" }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything... (Enter to send)"
            disabled={isStreaming}
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              color: "#f1f5f9", fontSize: "0.85rem", fontFamily: "inherit", resize: "none",
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isStreaming}
            style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: input.trim() && !isStreaming ? "linear-gradient(135deg, var(--accent-blue), var(--accent-purple))" : "rgba(255,255,255,0.1)",
              border: "none", cursor: input.trim() && !isStreaming ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s",
            }}
          >
            {isStreaming
              ? <div style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.8s linear infinite" }} />
              : <ArrowUp size={14} color="#fff" />}
          </button>
        </div>
        <div style={{ fontSize: "0.65rem", color: "#334155", textAlign: "center", marginTop: 6 }}>
          Enter to send • Powered by GPT-4o
        </div>
      </div>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
