"use client";
import { useState, useEffect, useRef } from "react";
import { Search, Sparkles, Bell, ChevronDown, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const TYPING_PLACEHOLDERS = [
  "Run SEO Specialist on my website...",
  "Deploy swarm for market research...",
  "Build a rate-limiting middleware...",
  "Analyze competitors in the SaaS space...",
  "Debug the auth pipeline...",
  "Create content for product launch...",
];

import { Bot, GitBranch, Network, Terminal, BarChart3, Settings } from "lucide-react";

const QUICK_COMMANDS = [
  { label: "Browse Agents", href: "/agents", icon: Bot },
  { label: "Run Pipeline", href: "/pipeline", icon: GitBranch },
  { label: "Create Swarm", href: "/swarms", icon: Network },
  { label: "Open Terminal", href: "/terminal", icon: Terminal },
  { label: "View Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];

interface StatusData { openai: boolean; database: boolean; agentCount: number }

export default function TopNavbar() {
  const [placeholder, setPlaceholder] = useState(TYPING_PLACEHOLDERS[0]);
  const [aiInput, setAiInput] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [statusData, setStatusData] = useState<StatusData | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % TYPING_PLACEHOLDERS.length;
      setPlaceholder(TYPING_PLACEHOLDERS[idx]);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then((d) => setStatusData(d as StatusData))
      .catch(() => {});
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
      // @ts-ignore - custom workspace dropdown closing
      if (e.target && !(e.target as Element).closest('#workspace-btn') && !(e.target as Element).closest('#workspace-dropdown')) {
        setWorkspaceOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleAiSubmit = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && aiInput.trim()) {
      // Redirect to terminal with the query pre-filled (or chat)
      router.push(`/terminal`);
      setAiInput("");
    }
  };

  const hasGemini = (statusData as any)?.gemini;
  const hasAnthropic = (statusData as any)?.anthropic;
  const hasApiKey = statusData?.openai || hasGemini || hasAnthropic || (process.env.NEXT_PUBLIC_HAS_OPENAI === "true");

  return (
    <header
      style={{
        height: 60, display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: "0 24px",
        background: "var(--bg-surface)", borderBottom: "1px solid var(--border-subtle)",
        gap: 16, flexShrink: 0, position: "relative", zIndex: 30,
      }}
    >
      {/* Search */}
      <div ref={searchRef} style={{ position: "relative", flex: 1, maxWidth: 440 }}>
        <div
          style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
            borderRadius: 10, padding: "6px 12px", cursor: "text",
          }}
          onClick={() => setSearchOpen(true)}
        >
          <Search size={15} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Quick search or ⌘K..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onFocus={() => setSearchOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchValue.trim()) {
                const match = QUICK_COMMANDS.find(cmd => cmd.label.toLowerCase() === searchValue.trim().toLowerCase());
                if (match) {
                  router.push(match.href);
                } else {
                  router.push(`/agents?search=${encodeURIComponent(searchValue.trim())}`);
                }
                setSearchOpen(false);
              }
            }}
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: "0.8125rem", color: "var(--text-primary)", fontFamily: "inherit" }}
          />
          <kbd style={{ fontSize: "0.65rem", padding: "2px 6px", borderRadius: 4, background: "rgba(255,255,255,0.06)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
            ⌘K
          </kbd>
        </div>

        {/* Quick commands dropdown */}
        {searchOpen && (
          <div style={{
            position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
            background: "#0f1629", border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 12, padding: 8, boxShadow: "0 16px 48px rgba(0,0,0,0.5)", zIndex: 100,
          }}>
            <div style={{ fontSize: "0.65rem", color: "#475569", padding: "4px 8px 8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Quick Actions
            </div>
            {QUICK_COMMANDS.map(cmd => (
              <Link key={cmd.href} href={cmd.href} onClick={() => setSearchOpen(false)}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, color: "#94a3b8", textDecoration: "none", fontSize: "0.85rem", transition: "all 0.12s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.12)"; (e.currentTarget as HTMLElement).style.color = "#818cf8"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#94a3b8"; }}
              >
                <cmd.icon size={15} style={{ flexShrink: 0 }} />
                <span>{cmd.label}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* AI command bar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8, flex: 1, maxWidth: 360,
        background: "rgba(79,140,255,0.06)", border: "1px solid rgba(79,140,255,0.14)",
        borderRadius: 10, padding: "6px 12px",
      }}>
        <Sparkles size={14} style={{ color: "var(--accent-blue)", flexShrink: 0 }} />
        <input
          type="text"
          value={aiInput}
          onChange={e => setAiInput(e.target.value)}
          onKeyDown={handleAiSubmit}
          placeholder={placeholder}
          style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: "0.78rem", color: "var(--text-primary)", fontFamily: "inherit" }}
        />
        {aiInput && (
          <kbd style={{ fontSize: "0.6rem", padding: "1px 5px", borderRadius: 4, background: "rgba(79,140,255,0.15)", color: "#4f8cff", border: "1px solid rgba(79,140,255,0.2)" }}>↵</kbd>
        )}
      </div>

      {/* Right actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* API Key status */}
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{
            width: 7, height: 7, borderRadius: "50%",
            background: hasApiKey ? "#10b981" : "#f59e0b",
            boxShadow: `0 0 6px ${hasApiKey ? "#10b981" : "#f59e0b"}`,
          }} />
          <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
            {statusData?.openai || (process.env.NEXT_PUBLIC_HAS_OPENAI === "true")
              ? "OpenAI Live"
              : hasGemini
              ? "Gemini Fallback"
              : hasAnthropic
              ? "Claude Fallback"
              : "Simulation"}
          </span>
        </div>

        {/* Agents count */}
        {statusData?.agentCount && statusData.agentCount > 0 && (
          <div style={{ fontSize: "0.72rem", color: "#475569", whiteSpace: "nowrap" }}>
            {statusData.agentCount} agents
          </div>
        )}

        {/* Notifications */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            style={{
              width: 34, height: 34, borderRadius: 8, background: "transparent",
              border: "1px solid var(--border-subtle)", color: "var(--text-secondary)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
            }}
          >
            <Bell size={15} />
            <span style={{ position: "absolute", top: 6, right: 6, width: 6, height: 6, borderRadius: "50%", background: "#6366f1" }} />
          </button>
          {notifOpen && (
            <div style={{
              position: "absolute", top: "calc(100% + 8px)", right: 0, width: 280,
              background: "#0f1629", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12,
              padding: 12, boxShadow: "0 16px 48px rgba(0,0,0,0.5)", zIndex: 100,
            }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#94a3b8", marginBottom: 10 }}>Notifications</div>
              {[
                { text: "Pipeline completed: JWT Auth System", time: "2m ago", color: "#10b981" },
                { text: "Agent swarm initialized: 3 agents", time: "15m ago", color: "#6366f1" },
                { text: "Add your OpenAI key to go live!", time: "now", color: "#f59e0b" },
              ].map((n, i) => (
                <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: n.color, marginTop: 4, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: "0.78rem", color: "#cbd5e1", lineHeight: 1.4 }}>{n.text}</div>
                    <div style={{ fontSize: "0.65rem", color: "#475569", marginTop: 2 }}>{n.time}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Workspace */}
        <div style={{ position: "relative" }}>
          <button id="workspace-btn" onClick={() => setWorkspaceOpen(!workspaceOpen)} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "6px 10px",
            borderRadius: 8, background: "transparent", border: "1px solid var(--border-subtle)",
            color: "var(--text-secondary)", fontSize: "0.78rem", fontWeight: 500, cursor: "pointer",
          }}>
            Orbit HQ <ChevronDown size={12} />
          </button>
          {workspaceOpen && (
            <div id="workspace-dropdown" style={{
              position: "absolute", top: "calc(100% + 8px)", right: 0, width: 220,
              background: "#0f1629", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12,
              padding: 8, boxShadow: "0 16px 48px rgba(0,0,0,0.5)", zIndex: 100,
            }}>
              <div style={{ padding: "8px 10px", fontSize: "0.8rem", color: "#e2e8f0", background: "rgba(255,255,255,0.05)", borderRadius: 6, marginBottom: 4 }}>
                Orbit HQ (current)
              </div>
              <div style={{ padding: "8px 10px", fontSize: "0.8rem", color: "#64748b", cursor: "not-allowed", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: "1rem" }}>+</span> Add workspace
              </div>
            </div>
          )}
        </div>

        {/* Avatar & Sign Out */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link href="/settings">
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "linear-gradient(135deg, var(--accent-blue), var(--accent-purple))",
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            }}>
              <User size={16} color="#fff" />
            </div>
          </Link>
          <button 
            onClick={async () => {
              const supabase = createClient();
              await supabase.auth.signOut();
              router.push('/');
            }}
            style={{
              padding: "6px 10px", borderRadius: 8, background: "transparent",
              border: "1px solid var(--border-subtle)", color: "var(--text-secondary)",
              fontSize: "0.78rem", fontWeight: 500, cursor: "pointer", transition: "all 0.2s"
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.borderColor = "var(--border-subtle)"; }}
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
