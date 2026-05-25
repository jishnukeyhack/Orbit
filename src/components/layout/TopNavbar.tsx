"use client";
import { useState, useEffect, useRef } from "react";
import { Search, Sparkles, Bell, ChevronDown } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Bot, GitBranch, Network, Terminal, BarChart3, Settings } from "lucide-react";


const TYPING_PLACEHOLDERS = [
  "Run SEO Specialist on my website...",
  "Deploy swarm for market research...",
  "Build a rate-limiting middleware...",
  "Analyze competitors in the SaaS space...",
  "Debug the auth pipeline...",
  "Create content for product launch...",
];

const QUICK_COMMANDS = [
  { label: "Browse Agents", href: "/agents", icon: Bot },
  { label: "Run Pipeline", href: "/pipeline", icon: GitBranch },
  { label: "Create Swarm", href: "/swarms", icon: Network },
  { label: "Open Terminal", href: "/terminal", icon: Terminal },
  { label: "View Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];

interface StatusData { openai: boolean; database: boolean; agentCount: number }

const GLOW_PRESETS: Record<string, { gradient: string; shadow: string }> = {
  blue: { gradient: "linear-gradient(135deg, #4f8cff, #0072ff)", shadow: "0 0 12px rgba(79,140,255,0.45)" },
  indigo: { gradient: "linear-gradient(135deg, #6366f1, #8b5cf6)", shadow: "0 0 12px rgba(99,102,241,0.45)" },
  red: { gradient: "linear-gradient(135deg, #ef4444, #b91c1c)", shadow: "0 0 12px rgba(239,68,68,0.45)" },
  amber: { gradient: "linear-gradient(135deg, #f59e0b, #d97706)", shadow: "0 0 12px rgba(245,158,11,0.45)" },
  emerald: { gradient: "linear-gradient(135deg, #10b981, #059669)", shadow: "0 0 12px rgba(16,185,129,0.45)" },
  pink: { gradient: "linear-gradient(135deg, #ec4899, #be185d)", shadow: "0 0 12px rgba(236,72,153,0.45)" },
};

export default function TopNavbar() {
  const [placeholder, setPlaceholder] = useState(TYPING_PLACEHOLDERS[0]);
  const [aiInput, setAiInput] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [statusData, setStatusData] = useState<StatusData | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [aiHovered, setAiHovered] = useState(false);
  const [showInitialSpin, setShowInitialSpin] = useState(true);
  const searchRef = useRef<HTMLDivElement>(null);
  const aiBarRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUser(user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % TYPING_PLACEHOLDERS.length;
      setPlaceholder(TYPING_PLACEHOLDERS[idx]);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetch("/api/status").then(r => r.json()).then(d => setStatusData(d as StatusData)).catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);



  const handleAiSubmit = (e: React.KeyboardEvent) => {

    if (e.key === "Enter" && aiInput.trim()) {
      window.dispatchEvent(new CustomEvent("orbit-autopilot-command", { detail: { query: aiInput } }));
      setAiInput("");
    }
  };

  const hasGemini = (statusData as any)?.gemini;
  const hasAnthropic = (statusData as any)?.anthropic;
  const hasApiKey = statusData?.openai || hasGemini || hasAnthropic || (process.env.NEXT_PUBLIC_HAS_OPENAI === "true");
  const presetGlow = user?.user_metadata?.preset_glow || 'indigo';
  const avatarUrl = user?.user_metadata?.avatar_url;
  const fullName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const activeGlow = GLOW_PRESETS[presetGlow] || GLOW_PRESETS.indigo;

  return (
    <header style={{
      height: 60, display: "flex", alignItems: "center",
      justifyContent: "space-between", padding: "0 20px",
      background: "var(--bg-surface)", borderBottom: "1px solid var(--border-subtle)",
      gap: 12, flexShrink: 0, position: "relative", zIndex: 30,
    }}>
      {/* Quick Search */}
      <div ref={searchRef} style={{ position: "relative", flex: "0 0 300px" }}>
        <div
          style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 10, padding: "7px 12px", cursor: "text",
            transition: "border-color 0.2s, background 0.2s",
          }}
          onClick={() => setSearchOpen(true)}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(79,140,255,0.3)'; e.currentTarget.style.background = 'rgba(79,140,255,0.04)'; }}
          onMouseLeave={e => { if (!searchOpen) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; } }}
        >
          <Search size={14} style={{ color: "#4B5563", flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search or ⌘K..."
            onFocus={() => setSearchOpen(true)}
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: "0.8rem", color: "var(--text-primary)", fontFamily: "inherit" }}
          />
          <kbd style={{ fontSize: "0.6rem", padding: "2px 5px", borderRadius: 4, background: "rgba(255,255,255,0.05)", color: "#4B5563", border: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>⌘K</kbd>
        </div>
        {searchOpen && (
          <div style={{
            position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
            background: "#0d1526", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12, padding: 8, boxShadow: "0 20px 60px rgba(0,0,0,0.6)", zIndex: 100,
          }}>
            <div style={{ fontSize: "0.62rem", color: "#475569", padding: "4px 8px 8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Quick Actions</div>
            {QUICK_COMMANDS.map(cmd => {
              const encryptionKey = user?.user_metadata?.encryption_key;
              const targetHref = encryptionKey ? `${cmd.href}/${encryptionKey}` : cmd.href;
              return (
                <Link key={cmd.href} href={targetHref} onClick={() => setSearchOpen(false)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, color: "#94a3b8", textDecoration: "none", fontSize: "0.82rem", transition: "all 0.12s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(79,140,255,0.1)"; (e.currentTarget as HTMLElement).style.color = "#c7d2fe"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#94a3b8"; }}
                >
                  <cmd.icon size={14} style={{ flexShrink: 0, opacity: 0.7 }} />
                  <span>{cmd.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* AI Command Bar with animated RGBY rotating border */}
      <div
        style={{
          position: 'relative',
          display: "flex",
          flexDirection: "column",
          flex: 1,
          maxWidth: 440,
          zIndex: 10,
        }}
      >
        {/* Outer ambient unclipped glow (perfect hollow rounded-rectangle glow with ZERO windmill clipping!) */}
        <div
          style={{
            position: "absolute",
            inset: "-2.5px", // Bleed outward to form a sharp fiber-optic neon glow ring!
            borderRadius: 14,
            overflow: "hidden", // Clip the spinning square to a perfect rounded rectangle!
            filter: "blur(6px) saturate(1.6)", // Concentrated neon glowing outline ring!
            opacity: aiHovered ? 0.85 : showInitialSpin ? 0.5 : 0,
            transition: "opacity 0.4s ease",
            pointerEvents: "none",
            zIndex: 0,
          }}
        >
          {/* Spinning perfect square inside the navbar glow container (perfect circular rotation, no corner windmill artifacts!) */}
          <div
            style={{
              position: "absolute",
              width: 600,
              height: 600,
              top: "calc(50% - 300px)",
              left: "calc(50% - 300px)",
              background: "conic-gradient(from 0deg, #4285F4, #EA4335, #FBBC05, #34A853, #4285F4)",
              animation: "spin 6s linear infinite",
              pointerEvents: "none",
            }}
          />
        </div>

        {/* Actual Search Box Container */}
        <div
          ref={aiBarRef}
          onMouseEnter={() => {
            setAiHovered(true);
            if (showInitialSpin) {
              setShowInitialSpin(false);
            }
          }}
          onMouseLeave={() => setAiHovered(false)}
          style={{
            position: 'relative',
            display: "flex",
            flexDirection: "column",
            flex: 1,
            borderRadius: 11,
            padding: "0.5px", // Micro-thin Google AI Studio border padding!
            overflow: 'hidden',
            background: aiHovered || showInitialSpin ? "transparent" : "rgba(79,140,255,0.08)",
            boxShadow: aiHovered ? "0 8px 24px rgba(0, 0, 0, 0.5)" : "none",
            transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            zIndex: 1, // Draw above sibling background glow
          }}
        >
          {/* Rotating RGBY border sweep line inside overflow:hidden boundary */}
          <div
            style={{
              position: "absolute",
              width: 600,
              height: 600,
              top: "calc(50% - 300px)",
              left: "calc(50% - 300px)",
              background: "conic-gradient(from 0deg, #4285F4, #EA4335, #FBBC05, #34A853, #4285F4)",
              animation: "spin 6s linear infinite",
              opacity: aiHovered || showInitialSpin ? 1 : 0.35, // Keep visible hairline outline!
              transition: "opacity 0.4s ease",
              pointerEvents: "none",
              zIndex: 0,
            }}
          />

          {/* Inner layout card offset wrapper */}
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap: 8,
              flex: 1,
              background: "rgba(10, 16, 32, 0.94)",
              borderRadius: 10, // 11px - 1px offset
              padding: "7px 12px",
              zIndex: 1,
              overflow: "hidden",
            }}
          >
            <Sparkles size={13} style={{ color: aiHovered ? "#4285f4" : "#4f8cff", flexShrink: 0, transition: "color 0.3s" }} />
            <input
              type="text"
              value={aiInput}
              onChange={e => setAiInput(e.target.value)}
              onKeyDown={handleAiSubmit}
              placeholder={placeholder}
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: "0.78rem", color: "var(--text-primary)", fontFamily: "inherit" }}
            />
            {aiInput && (
              <kbd style={{ fontSize: "0.58rem", padding: "1px 5px", borderRadius: 4, background: "rgba(79,140,255,0.15)", color: "#4f8cff", border: "1px solid rgba(79,140,255,0.2)" }}>↵</kbd>
            )}
          </div>
        </div>
      </div>

      {/* Right actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        {/* Status */}
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: hasApiKey ? "#10b981" : "#f59e0b", boxShadow: `0 0 5px ${hasApiKey ? "#10b981" : "#f59e0b"}` }} />
          <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
            {statusData?.openai || (process.env.NEXT_PUBLIC_HAS_OPENAI === "true") ? "OpenAI Live" : hasGemini ? "Gemini" : hasAnthropic ? "Claude" : "Simulation"}
          </span>
        </div>

        {statusData?.agentCount && statusData.agentCount > 0 && (
          <div style={{ fontSize: "0.7rem", color: "#475569", whiteSpace: "nowrap" }}>{statusData.agentCount} agents</div>
        )}

        {/* Notifications */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            style={{ width: 32, height: 32, borderRadius: 8, background: "transparent", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(79,140,255,0.3)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <Bell size={14} />
            <span style={{ position: "absolute", top: 7, right: 7, width: 5, height: 5, borderRadius: "50%", background: "#6366f1" }} />
          </button>
          {notifOpen && (
            <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 280, background: "#0d1526", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: 12, boxShadow: "0 20px 60px rgba(0,0,0,0.6)", zIndex: 100 }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8", marginBottom: 10 }}>Notifications</div>
              {[
                { text: "Pipeline completed: JWT Auth System", time: "2m ago", color: "#10b981" },
                { text: "Agent swarm initialized: 3 agents", time: "15m ago", color: "#6366f1" },
                { text: "Add your OpenAI key to go live!", time: "now", color: "#f59e0b" },
              ].map((n, i) => (
                <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: n.color, marginTop: 5, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "#cbd5e1", lineHeight: 1.4 }}>{n.text}</div>
                    <div style={{ fontSize: "0.62rem", color: "#475569", marginTop: 2 }}>{n.time}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", borderRadius: 8, background: "transparent", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 500, cursor: "pointer", transition: 'all 0.15s', whiteSpace: 'nowrap' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >Orbit HQ <ChevronDown size={11} /></button>

        {/* Avatar */}
        <Link href="/settings">
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: activeGlow.gradient, boxShadow: activeGlow.shadow, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", flexShrink: 0, border: "1px solid rgba(255,255,255,0.12)", transition: "transform 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#fff" }}>{(fullName[0] || "U").toUpperCase()}</span>
            )}
          </div>
        </Link>
      </div>
    </header>
  );
}
