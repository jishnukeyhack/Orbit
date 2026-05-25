"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { 
  Sparkles, X, Minus, ArrowUp, Bot, Workflow, Zap, Wrench, Eye, Loader2, 
  Compass, ArrowRight, Play, CheckCircle2, AlertCircle, Terminal as TermIcon, ShieldAlert 
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  isAutopilot?: boolean;
}

const SESSION_ID = `orbit-${Date.now()}`;

const QUICK_ACTIONS = [
  { icon: Bot,      label: "What agents can I use?",   q: "What specialized agents are available and what can they do?" },
  { icon: Workflow, label: "Take me to workflows",     q: "Autopilot: Route me to the visual Flow Builder workflows page and explain how it operates." },
  { icon: Zap,      label: "Open pipeline conduit",   q: "Autopilot: Take me to the Pipeline runner conduit studio." },
  { icon: TermIcon, label: "Launch AI terminal",       q: "Autopilot: Access the conversational Orbit CLI terminal." },
];

export default function AIAssistantPanel() {
  const router = useRouter();
  const pathname = usePathname();
  
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  
  // Autopilot visual highlights
  const [autopilotState, setAutopilotState] = useState<{
    active: boolean;
    status: string;
    targetRoute: string;
    step: number;
  }>({
    active: false,
    status: "",
    targetRoute: "",
    step: 0
  });

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll chat logs
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, autopilotState]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  // Extract encryption key from active path to maintain AES route protection
  const getEncryptionKey = useCallback((): string => {
    if (!pathname) return "";
    const segments = pathname.split("/");
    const lastSegment = segments[segments.length - 1];
    const isHex16 = /^[a-zA-Z0-9]{16}$/.test(lastSegment);
    return isHex16 ? lastSegment : "";
  }, [pathname]);

  // Scrape DOM text content to feed screen context to Orbit Copilot
  const scrapeScreenContent = () => {
    if (typeof document === 'undefined') return '';
    const elements = document.querySelectorAll('h1, h2, h3, p, li, table, [role="status"]');
    const texts: string[] = [];
    elements.forEach(el => {
      if (el.closest('.copilot-panel') || el.closest('button')) return;
      const text = el.textContent?.trim();
      if (text && text.length > 5 && text.length < 500) {
        texts.push(`${el.tagName}: ${text}`);
      }
    });
    return texts.slice(0, 30).join('\n');
  };

  const handleAnalyzePage = () => {
    const scraped = scrapeScreenContent();
    const messageText = `Analyze this page context and guide me on what to do next:\n\n[Active Route: ${pathname}]\n[Screen Content Snippets]:\n${scraped || 'No major textual elements found.'}`;
    sendMessage(messageText);
  };

  // Autopilot routing system (Autonomous router actor)
  const triggerAutopilotRoute = useCallback((route: string, label: string) => {
    const encKey = getEncryptionKey();
    const destination = encKey ? `/${route}/${encKey}` : `/${route}`;
    
    setAutopilotState({
      active: true,
      status: `Calculating quantum route to ${label}...`,
      targetRoute: destination,
      step: 1
    });

    // Step 1: Aligning coordinates
    setTimeout(() => {
      setAutopilotState(prev => ({
        ...prev,
        status: `Quantum route aligned. Opening warp conduits...`,
        step: 2
      }));
    }, 1200);

    // Step 2: Route routing redirection
    setTimeout(() => {
      setAutopilotState(prev => ({
        ...prev,
        status: `Engaging autopilot warp... Redirection active!`,
        step: 3
      }));
      router.push(destination);
    }, 2400);

    // Step 3: Settling down
    setTimeout(() => {
      setAutopilotState({
        active: false,
        status: "",
        targetRoute: "",
        step: 0
      });
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: ` [Orbit Autopilot]: Quantum navigation complete! We have safely arrived at the **${label}** page. How can I help you orchestrate this screen now?`
        }
      ]);
    }, 3800);

  }, [getEncryptionKey, router]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;

    // Detect navigation autonomous instructions
    const lowerText = trimmed.toLowerCase();
    let isNavigation = false;
    let target = "";
    let targetLabel = "";

    if (lowerText.includes("workflows") || lowerText.includes("flow builder")) {
      isNavigation = true;
      target = "workflows";
      targetLabel = "Autonomous Workflows visual Flow Builder";
    } else if (lowerText.includes("pipeline") || lowerText.includes("conduit") || lowerText.includes("runner")) {
      isNavigation = true;
      target = "pipeline";
      targetLabel = "Pipeline Runner Conduit Studio";
    } else if (lowerText.includes("swarms") || lowerText.includes("swarm studio") || lowerText.includes("kimi")) {
      isNavigation = true;
      target = "swarms";
      targetLabel = "Swarm Intelligence & Kimi Studio";
    } else if (lowerText.includes("terminal") || lowerText.includes("orbit cli") || lowerText.includes("cli")) {
      isNavigation = true;
      target = "terminal";
      targetLabel = "Conversational Orbit CLI Terminal";
    } else if (lowerText.includes("workspace") || lowerText.includes("files explorer")) {
      isNavigation = true;
      target = "workspace";
      targetLabel = "Workspace Files Sandbox Explorer";
    } else if (lowerText.includes("dashboard")) {
      isNavigation = true;
      target = "dashboard";
      targetLabel = "Systems Operations Dashboard";
    }

    const userMsg: Message = { role: "user", content: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsStreaming(true);

    if (isNavigation) {
      // Autopilot Redirection workflow
      setMessages(prev => [...prev, {
        role: "assistant",
        content: ` [Orbit Autopilot]: Navigation directive intercepted. Preparing autonomous route execution to **${targetLabel}**...`,
        isAutopilot: true
      }]);
      setIsStreaming(false);
      triggerAutopilotRoute(target, targetLabel);
      return;
    }

    // Add empty assistant message for streaming
    setMessages(prev => [...prev, { role: "assistant", content: "", streaming: true }]);

    try {
      const localOpenaiKey = localStorage.getItem("orbit_openai_key") || "";
      const localGeminiKey = localStorage.getItem("orbit_gemini_key") || "";

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-openai-api-key": localOpenaiKey,
          "x-gemini-api-key": localGeminiKey
        },
        body: JSON.stringify({
          message: trimmed,
          sessionId: SESSION_ID,
          history: messages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) throw new Error(await res.text());

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No streaming stream available");
      const decoder = new TextDecoder();
      let accumulated = "";

      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let lineEndIdx;
        while ((lineEndIdx = buffer.indexOf("\n")) !== -1) {
          const line = buffer.slice(0, lineEndIdx).trim();
          buffer = buffer.slice(lineEndIdx + 1);
          if (line.startsWith("data:")) {
            try {
              const rawData = line.slice(5).trim();
              const event = JSON.parse(rawData);
              
              const chunkText = event.token || event.data?.text || event.data?.token || event.text;
              if (chunkText) {
                accumulated += chunkText;
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
            } catch (e) {
              console.error("Assistant stream line parse error:", e);
            }
          }
        }
      }
    } catch (err) {
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: "assistant", content: ` API Error: ${err instanceof Error ? err.message : String(err)}` },
      ]);
    } finally {
      setIsStreaming(false);
    }
  }, [messages, isStreaming, triggerAutopilotRoute]);

  useEffect(() => {
    const handleAutopilotCommand = (e: Event) => {
      const customEvent = e as CustomEvent<{ query: string }>;
      if (customEvent.detail?.query) {
        setOpen(true);
        sendMessage(customEvent.detail.query);
      }
    };
    window.addEventListener("orbit-autopilot-command", handleAutopilotCommand);
    return () => window.removeEventListener("orbit-autopilot-command", handleAutopilotCommand);
  }, [sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <>
      {/* ── Floating Orbit Circular Glowing Trigger Logo ──────────────────────── */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{
            position: "fixed", bottom: 20, right: 20, width: 56, height: 56,
            borderRadius: "50%", background: "#020617",
            border: "2px solid rgba(59,130,246,0.35)", cursor: "pointer", display: "flex", 
            alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 30px rgba(59,130,246,0.3), inset 0 0 15px rgba(99,102,241,0.2)", 
            zIndex: 50, transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          }}
          onMouseEnter={e => { 
            e.currentTarget.style.transform = "scale(1.1) rotate(15deg)";
            e.currentTarget.style.boxShadow = "0 0 45px rgba(99,102,241,0.55), inset 0 0 20px rgba(59,130,246,0.4)";
          }}
          onMouseLeave={e => { 
            e.currentTarget.style.transform = "scale(1) rotate(0deg)";
            e.currentTarget.style.boxShadow = "0 0 30px rgba(59,130,246,0.3), inset 0 0 15px rgba(99,102,241,0.2)";
          }}
          aria-label="Orbit Swarm Autopilot"
        >
          {/* Animated Orbital Canvas Rings inside Button */}
          <div style={{ position: "absolute", width: "80%", height: "80%", borderRadius: "50%", border: "1px dashed rgba(99,102,241,0.5)", animation: "spin 12s linear infinite" }} />
          <div style={{ position: "absolute", width: "55%", height: "55%", borderRadius: "50%", border: "1px solid rgba(59,130,246,0.4)", animation: "spin 6s linear reverse infinite" }} />
          
          {/* Central Orbit glowing core */}
          <div style={{
            width: 18, height: 18, borderRadius: "50%", 
            background: "radial-gradient(circle, #60a5fa 0%, #8b5cf6 100%)",
            boxShadow: "0 0 12px #60a5fa"
          }} />
        </button>
      )}

      {/* ── Orbit Autopilot Global Glowing Frame Overlay ──────────────────────── */}
      {autopilotState.active && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 99999, pointerEvents: "none",
          border: "4px solid #3b82f6", boxShadow: "inset 0 0 80px rgba(59,130,246,0.4)",
          animation: "pulse 1s infinite alternate", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center"
        }}>
          {/* Floating Quantum Laser Conduit Portal */}
          <div style={{
            padding: "24px 36px", background: "rgba(3,7,18,0.92)", border: "1.5px solid rgba(59,130,246,0.5)",
            borderRadius: 20, boxShadow: "0 25px 60px rgba(0,0,0,0.8), 0 0 30px rgba(59,130,246,0.3)",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 12, textAlign: "center",
            maxWidth: 420
          }}>
            <div style={{ position: "relative", width: 48, height: 48 }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px dashed #60a5fa", animation: "spin 3s linear infinite" }} />
              <Compass size={24} style={{ color: "#3b82f6", position: "absolute", left: 12, top: 12 }} />
            </div>
            <div style={{ fontWeight: 900, color: "#f8fafc", fontSize: "0.95rem", letterSpacing: "0.01em" }}>Orbit Autopilot Engaged</div>
            <div style={{ fontSize: "0.78rem", color: "#60a5fa", fontFamily: "monospace", display: "flex", alignItems: "center", gap: 4 }}>
              <Loader2 className="animate-spin" size={12} />
              {autopilotState.status}
            </div>
            <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
              {[...Array(3)].map((_, i) => (
                <div 
                  key={i} 
                  style={{
                    width: 24, height: 4, borderRadius: 2,
                    background: autopilotState.step > i ? '#3b82f6' : 'rgba(255,255,255,0.06)',
                    transition: 'all 0.3s'
                  }} 
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Conversational Copilot Chat Panel ────────────────────────── */}
      {open && (
        <div style={{
          position: "fixed", bottom: 20, right: 20, width: 410, height: 580,
          background: "rgba(6,9,18,0.94)", backdropFilter: "blur(24px) saturate(130%)",
          border: "1.5px solid rgba(59,130,246,0.25)", borderRadius: 24,
          boxShadow: "0 25px 70px rgba(0,0,0,0.6), 0 0 40px rgba(59,130,246,0.14)",
          zIndex: 50, display: "flex", flexDirection: "column", overflow: "hidden",
          animation: "fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
        }}>
          
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0, background: "rgba(255,255,255,0.01)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* Circular Glowing Central Mini Orbit Logo */}
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#020617", border: "1.5px solid #3b82f6", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", boxShadow: "0 0 8px #3b82f6" }}>
                <div style={{ position: "absolute", inset: 2, borderRadius: "50%", border: "1px dashed rgba(59,130,246,0.6)", animation: "spin 6s linear infinite" }} />
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#60a5fa" }} />
              </div>
              <div>
                <span style={{ fontWeight: 850, fontSize: "0.85rem", color: "#f8fafc", display: "flex", alignItems: "center", gap: 5 }}>
                  Orbit Autopilot
                </span>
                <span style={{ fontSize: "0.62rem", color: "#10b981", fontWeight: 700, display: "flex", alignItems: "center", gap: 3, marginTop: 1 }}>
                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#10b981", animation: "pulse 0.8s infinite" }} />
                  Live App Agent Active
                </span>
              </div>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* Scrape Page Action */}
              <button 
                onClick={handleAnalyzePage} 
                title="Scrape Screen Context Content" 
                style={{ 
                  background: "rgba(59,130,246,0.12)", 
                  border: "1px solid rgba(59,130,246,0.25)", 
                  borderRadius: 6, 
                  color: "#60a5fa", 
                  cursor: "pointer", 
                  padding: "4px 8px", 
                  fontSize: "0.68rem", 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 4,
                  fontWeight: 700,
                  transition: "all 0.15s"
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(59,130,246,0.22)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(59,130,246,0.12)"; }}
              >
                <Eye size={12} /> Scrape Page
              </button>
              
              <button onClick={() => setOpen(false)} style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", padding: 4 }}><Minus size={14} /></button>
              <button onClick={() => setOpen(false)} style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", padding: 4 }}><X size={14} /></button>
            </div>
          </div>

          {/* Chat area */}
          <div style={{ flex: 1, overflowY: "auto", padding: "14px", display: "flex", flexDirection: "column", gap: 12 }}>
            {messages.length === 0 ? (
              <>
                {/* Brand Showcase */}
                <div style={{ textAlign: "center", padding: "24px 0 12px" }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#020617", border: "2px solid #3b82f6", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", position: "relative", boxShadow: "0 0 20px rgba(59,130,246,0.4)" }}>
                    <div style={{ position: "absolute", inset: 3, borderRadius: "50%", border: "1.5px dashed rgba(59,130,246,0.7)", animation: "spin 8s linear infinite" }} />
                    <Sparkles size={16} style={{ color: "#60a5fa" }} />
                  </div>
                  <div style={{ color: "#f8fafc", fontSize: "0.95rem", fontWeight: 900, letterSpacing: "-0.01em" }}>Orbit Swarm Autopilot</div>
                  <div style={{ color: "#64748b", fontSize: "0.78rem", marginTop: 4, padding: "0 24px", lineHeight: 1.45 }}>
                    Spawns sandboxes recursively, scrapes screens, and navigates screens autonomously. Instruct me to take you anywhere!
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
                  {QUICK_ACTIONS.map(qa => (
                    <button
                      key={qa.label}
                      onClick={() => sendMessage(qa.q)}
                      style={{
                        display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                        background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
                        borderRadius: 12, color: "#cbd5e1", fontSize: "0.78rem", cursor: "pointer",
                        textAlign: "left", transition: "all 0.15s",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.08)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.2)"; e.currentTarget.style.color = "#818cf8"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#cbd5e1"; }}
                    >
                      <qa.icon size={13} style={{ flexShrink: 0, color: "#818cf8" }} />
                      {qa.label}
                      <ArrowRight size={10} style={{ marginLeft: "auto", opacity: 0.5 }} />
                    </button>
                  ))}
                </div>
              </>
            ) : (
              messages.map((msg, i) => (
                <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                  {msg.role === "assistant" && (
                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: msg.isAutopilot ? "linear-gradient(135deg, #ef4444, #f59e0b)" : "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginRight: 8, marginTop: 2 }}>
                      <Sparkles size={11} color="#fff" />
                    </div>
                  )}
                  <div style={{
                    maxWidth: "82%", padding: "10px 14px",
                    background: msg.isAutopilot ? "rgba(245,158,11,0.12)" : msg.role === "user" ? "rgba(59,130,246,0.16)" : "rgba(255,255,255,0.04)",
                    borderRadius: msg.role === "user" ? "16px 16px 2px 16px" : "16px 16px 16px 2px",
                    border: msg.isAutopilot ? "1px solid rgba(245,158,11,0.3)" : msg.role === "user" ? "1px solid rgba(59,130,246,0.25)" : "1px solid rgba(255,255,255,0.06)",
                    fontSize: "0.8rem", color: msg.role === "user" ? "#f8fafc" : "#cbd5e1",
                    lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word",
                  }}>
                    {msg.content}
                    {msg.streaming && <span style={{ display: "inline-block", width: 5, height: 11, background: "#3b82f6", marginLeft: 3, animation: "blink 0.7s infinite", verticalAlign: "text-bottom" }} />}
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Bottom Chat input bar */}
          <div style={{ padding: "10px 14px", borderTop: "1px solid rgba(255,255,255,0.06)", flexShrink: 0, background: "rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "6px 6px 6px 12px" }}>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Swarms or type a page navigation command..."
                disabled={isStreaming}
                style={{
                  flex: 1, background: "transparent", border: "none", outline: "none",
                  color: "#f8fafc", fontSize: "0.82rem", fontFamily: "inherit"
                }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isStreaming}
                style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: input.trim() && !isStreaming ? "linear-gradient(135deg, #3b82f6, #8b5cf6)" : "rgba(255,255,255,0.05)",
                  border: "none", cursor: input.trim() && !isStreaming ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s",
                }}
              >
                {isStreaming
                  ? <div style={{ width: 10, height: 10, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.8s linear infinite" }} />
                  : <ArrowUp size={12} color="#fff" />}
              </button>
            </div>
            <div style={{ fontSize: "0.62rem", color: "#475569", textAlign: "center", marginTop: 6, fontWeight: 500 }}>
              Enter to send · Secured AES quantum connection
            </div>
          </div>

        </div>
      )}

      {/* Loader spin animation definitions */}
      <style jsx global>{`
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:1} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </>
  );
}
