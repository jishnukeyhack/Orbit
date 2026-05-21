"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import WaveCanvas from "@/components/landing/WaveCanvas";
import OrbitLogo from "@/components/layout/OrbitLogo";
import {
  Bot, Network, Workflow, Monitor, Store, Plug, Terminal, Zap, Shield, BarChart3,
  ArrowRight, Sparkles, Globe, Cpu, Activity
} from "lucide-react";

const PLACEHOLDERS = [
  '"Create a financial research swarm"',
  '"Deploy autonomous support agents"',
  '"Generate a market intelligence workflow"',
  '"Scale all running agents to 10 replicas"',
  '"Analyze infrastructure latency across regions"',
  '"Build a multi-agent sales pipeline"',
];

const STATS = [
  { value: "50K+", label: "Active Agents" },
  { value: "2.4B", label: "Tasks Executed" },
  { value: "99.97%", label: "Uptime SLA" },
  { value: "180+", label: "Integrations" },
];

const FEATURES = [
  { icon: Zap, label: "Real-time orchestration" },
  { icon: Cpu, label: "Multi-model support" },
  { icon: Plug, label: "180+ integrations" },
  { icon: Monitor, label: "Full observability" },
  { icon: Shield, label: "Enterprise SSO & RBAC" },
  { icon: Store, label: "Agent marketplace" },
  { icon: BarChart3, label: "Usage-based billing" },
  { icon: Terminal, label: "Built-in CLI terminal" },
];

const SHOWCASE = [
  { icon: Bot, title: "AI Agents", desc: "Create, deploy & monitor autonomous AI agents with long-term memory, multi-model support, and self-healing capabilities.", color: "var(--accent-blue)" },
  { icon: Network, title: "Swarm Intelligence", desc: "Orchestrate multi-agent systems with shared memory, distributed reasoning, and real-time coordination graphs.", color: "var(--accent-purple)" },
  { icon: Workflow, title: "Workflow Builder", desc: "Design AI-native workflows with a visual drag-and-drop canvas. Conditional logic, loops, and human approvals.", color: "var(--accent-cyan)" },
  { icon: Activity, title: "Observability", desc: "Enterprise-grade monitoring with live logs, distributed traces, execution replay, and anomaly detection.", color: "#22C55E" },
  { icon: Store, title: "Marketplace", desc: "Install pre-built agents, workflow templates, and swarm configurations. Monetize your own creations.", color: "#F59E0B" },
  { icon: Globe, title: "Global Deploy", desc: "Deploy agents to edge, cloud, or on-prem. Auto-scaling, fault tolerance, and zero-downtime updates.", color: "#EF4444" },
];

export default function LandingPage() {
  const [placeholderIdx, setPlaceholderIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <WaveCanvas />

      {/* Dot grid */}
      <div
        style={{
          position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none",
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.10) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />

      {/* Vignette */}
      <div
        style={{
          position: "fixed", inset: 0, zIndex: 2, pointerEvents: "none",
          background: "radial-gradient(ellipse 80% 65% at 50% 50%, transparent 35%, rgba(11,15,25,0.70) 100%)",
        }}
      />

      {/* ── Navbar ── */}
      <nav
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 10,
          height: 60, display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 32px",
          background: "rgba(11, 15, 25, 0.72)",
          backdropFilter: "blur(14px) saturate(140%)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "var(--text-primary)", fontWeight: 700, fontSize: "1.05rem", letterSpacing: "-0.02em" }}>
          <OrbitLogo variant="full" size={26} />
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <a href="https://github.com/jishnukeyhack/Orbit#readme" target="_blank" rel="noreferrer" style={{ padding: "6px 14px", borderRadius: 8, color: "var(--text-secondary)", fontSize: "0.875rem", fontWeight: 500, textDecoration: "none", transition: "color 0.18s, background 0.18s" }} onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary)"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.background = "transparent"; }}>Docs</a>
          <Link href="/billing" style={{ padding: "6px 14px", borderRadius: 8, color: "var(--text-secondary)", fontSize: "0.875rem", fontWeight: 500, textDecoration: "none", transition: "color 0.18s, background 0.18s" }} onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary)"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.background = "transparent"; }}>Pricing</Link>
          <Link href="/marketplace" style={{ padding: "6px 14px", borderRadius: 8, color: "var(--text-secondary)", fontSize: "0.875rem", fontWeight: 500, textDecoration: "none", transition: "color 0.18s, background 0.18s" }} onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary)"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.background = "transparent"; }}>Marketplace</Link>
          <a href="#" style={{ padding: "6px 14px", borderRadius: 8, color: "var(--text-secondary)", fontSize: "0.875rem", fontWeight: 500, textDecoration: "none", transition: "color 0.18s, background 0.18s" }} onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary)"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.background = "transparent"; }}>Blog</a>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/login" className="btn-ghost" style={{ textDecoration: 'none' }}>Sign in</Link>
          <Link href="/dashboard" className="btn-primary">Get started free</Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ position: "relative", zIndex: 5, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "80px 24px 60px", gap: 28 }}>

        {/* Badge */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px 5px 8px", borderRadius: 100, background: "rgba(79,140,255,0.10)", border: "1px solid rgba(79,140,255,0.24)", fontSize: "0.72rem", fontWeight: 600, color: "var(--accent-blue)", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>
          <span className="animate-pulse-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent-cyan)", boxShadow: "0 0 8px var(--accent-cyan)" }} />
          Now in Public Beta — v2.0
        </div>

        {/* Headline */}
        <h1 style={{ fontSize: "clamp(2.8rem, 7.5vw, 5.25rem)", fontWeight: 700, lineHeight: 1.08, letterSpacing: "-0.03em", maxWidth: 900, margin: 0 }}>
          The Infrastructure for<br />
          <span className="gradient-text">Autonomous AI Agents</span>
        </h1>

        <p style={{ fontSize: "clamp(1rem, 2.2vw, 1.2rem)", fontWeight: 400, color: "var(--text-secondary)", maxWidth: 600, lineHeight: 1.65, margin: 0 }}>
          Create, deploy, orchestrate, monitor, and monetize AI agents at
          enterprise scale. One platform. Infinite intelligence.
        </p>

        {/* AI Command bar */}
        <div style={{ display: "flex", alignItems: "center", width: "100%", maxWidth: 640, background: "rgba(21,27,46,0.80)", backdropFilter: "blur(12px)", border: "1px solid var(--border-default)", borderRadius: 14, padding: "4px 4px 4px 18px", gap: 10, boxShadow: "0 4px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(79,140,255,0.06)", transition: "border-color 0.2s" }}>
          <Sparkles size={16} style={{ color: "var(--accent-blue)", flexShrink: 0 }} />
          <input
            type="text"
            readOnly
            value=""
            placeholder={PLACEHOLDERS[placeholderIdx]}
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: "0.9375rem", fontFamily: "inherit", color: "var(--text-primary)", caretColor: "var(--accent-blue)" }}
          />
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            {["Agent", "Swarm", "Workflow"].map((c) => (
              <button key={c} 
                onClick={() => {
                  if (c === "Agent") setPlaceholderIdx(0);
                  if (c === "Swarm") setPlaceholderIdx(1);
                  if (c === "Workflow") setPlaceholderIdx(2);
                }}
                style={{ padding: "6px 12px", borderRadius: 8, fontSize: "0.78rem", fontWeight: 500, background: "rgba(79,140,255,0.12)", color: "var(--accent-blue)", border: "1px solid rgba(79,140,255,0.22)", cursor: "pointer", transition: "background 0.16s" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(79,140,255,0.22)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(79,140,255,0.12)")}
              >{c}</button>
            ))}
          </div>
          <button style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: "linear-gradient(135deg, var(--accent-blue), var(--accent-purple))", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "opacity 0.16s" }}>
            <ArrowRight size={15} color="#fff" />
          </button>
        </div>

        {/* CTA */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" as const, justifyContent: "center" }}>
          <Link href="/dashboard" className="btn-primary" style={{ padding: "11px 28px", fontSize: "0.9375rem", borderRadius: 10 }}>
            Start building free
          </Link>
          <a href="#showcase" className="btn-ghost" style={{ padding: "11px 24px", fontSize: "0.9375rem", borderRadius: 10 }}>
            View live demo →
          </a>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", alignItems: "center", gap: 40, flexWrap: "wrap" as const, justifyContent: "center" }}>
          {STATS.map((s, i) => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 40 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.02em" }}>{s.value}</div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: 2 }}>{s.label}</div>
              </div>
              {i < STATS.length - 1 && <div style={{ width: 1, height: 36, background: "var(--border-default)" }} />}
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature pills ── */}
      <div style={{ position: "relative", zIndex: 5, display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" as const, padding: "0 24px 80px" }}>
        {FEATURES.map((f) => (
          <div
            key={f.label}
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "8px 18px", borderRadius: 100,
              background: "rgba(21,27,46,0.70)", border: "1px solid var(--border-default)",
              fontSize: "0.8125rem", fontWeight: 500, color: "var(--text-secondary)",
              backdropFilter: "blur(8px)", transition: "border-color 0.18s, color 0.18s",
            }}
          >
            <f.icon size={14} /> {f.label}
          </div>
        ))}
      </div>

      {/* ── Product Showcase ── */}
      <section id="showcase" style={{ position: "relative", zIndex: 5, maxWidth: 1200, margin: "0 auto", padding: "40px 24px 120px" }}>
        <h2 style={{ textAlign: "center", fontSize: "2rem", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 12 }}>
          Everything you need to <span className="gradient-text">orchestrate intelligence</span>
        </h2>
        <p style={{ textAlign: "center", color: "var(--text-secondary)", maxWidth: 560, margin: "0 auto 48px", fontSize: "1rem", lineHeight: 1.6 }}>
          From single agents to multi-swarm orchestration — Orbit is the complete platform for the autonomous AI era.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20 }}>
          {SHOWCASE.map((item) => (
            <div key={item.title} className="orbit-card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${item.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <item.icon size={22} style={{ color: item.color }} />
              </div>
              <h3 style={{ fontSize: "1.125rem", fontWeight: 600, margin: 0 }}>{item.title}</h3>
              <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ position: "relative", zIndex: 5, textAlign: "center", padding: "40px 24px", borderTop: "1px solid var(--border-subtle)" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>
          © 2026 Orbit — Orchestrating Autonomous Intelligence Into Action.
        </p>
      </footer>
    </>
  );
}
