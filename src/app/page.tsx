"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import WaveCanvas from "@/components/landing/WaveCanvas";
import OrbitLogo from "@/components/layout/OrbitLogo";
import {
  Bot, Network, Workflow, Monitor, Store, Plug, Terminal, Zap, Shield, BarChart3,
  ArrowRight, Sparkles, Globe, Cpu, Activity, Plus, ArrowUp
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
  { value: "175+", label: "Specialized Agents" },
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
  const router = useRouter();
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [hovered, setHovered] = useState(false);
  const [showInitialSpin, setShowInitialSpin] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const searchBarRef = useRef<HTMLDivElement>(null);

  // Rotate placeholders
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Check auth session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });
  }, []);

  // Context-aware query routing logic
  const handleSearchSubmit = (actionType?: 'agent' | 'swarm' | 'workflow') => {
    const query = searchQuery.trim();
    if (!query) return;

    setIsSubmitting(true);

    let targetType = actionType;
    if (!targetType) {
      const q = query.toLowerCase();
      if (q.includes("swarm") || q.includes("multi-agent") || q.includes("team") || q.includes("consensus") || q.includes("collective")) {
        targetType = "swarm";
      } else if (q.includes("workflow") || q.includes("pipeline") || q.includes("n8n") || q.includes("automation") || q.includes("canvas") || q.includes("chain")) {
        targetType = "workflow";
      } else {
        targetType = "agent";
      }
    }

    // Save query text in storage to retrieve on destination page
    localStorage.setItem("orbit_landing_search_query", query);

    setTimeout(() => {
      if (isAuthenticated) {
        // Redirect directly to the correct app route (AppLayout intercepts and appends encryptionKey)
        if (targetType === "swarm") {
          router.push("/swarms");
        } else if (targetType === "workflow") {
          router.push("/workflows");
        } else {
          router.push("/agents");
        }
      } else {
        // Not logged in, route to login first, saving a post-auth redirect target
        localStorage.setItem("orbit_redirect_target", `/${targetType}s`);
        router.push("/login");
      }
    }, 800); // 800ms glorious warp-speed execution loop animation!
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSearchSubmit();
    }
  };

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
          {[
            { label: "Docs", href: "/docs" },
            { label: "Pricing", href: "/billing" },
            { label: "Marketplace", href: "/marketplace" },
            { label: "Blog", href: "/blog" }
          ].map((l) => (
            <Link key={l.label} href={l.href} style={{ padding: "6px 14px", borderRadius: 8, color: "var(--text-secondary)", fontSize: "0.875rem", fontWeight: 500, textDecoration: "none", transition: "color 0.18s, background 0.18s" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary)"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.background = "transparent"; }}
            >{l.label}</Link>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/login" className="btn-ghost">Sign in</Link>
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

        {/* AI Command bar (Glossy Rotating Ring Border Glow - Tall YC Box!) */}
        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: 780, // Sleek, aligns beautifully with Orbit main title!
            zIndex: 10,
          }}
        >
          {/* Outer ambient background glow (hollow rounded-rectangle glow with ZERO windmill clipping!) */}
          <div
            style={{
              position: "absolute",
              inset: "-4px", // Positioned slightly outside the search box
              borderRadius: 28,
              overflow: "hidden", // Clip the spinning square to a perfect rounded rectangle outline shape!
              filter: "blur(12px) saturate(1.8)", // Concentrated neon glowing outline ring!
              opacity: isSubmitting ? 0.95 : hovered ? 0.85 : showInitialSpin ? 0.5 : 0,
              transition: "opacity 0.4s ease",
              pointerEvents: "none",
              zIndex: 0,
            }}
          >
            {/* Spinning perfect square inside the clipped glow container (perfect circular rotation, no corner windmill artifacts!) */}
            <div
              style={{
                position: "absolute",
                width: 850,
                height: 850,
                top: "calc(50% - 425px)",
                left: "calc(50% - 425px)",
                background: "conic-gradient(from 0deg, #4285F4, #EA4335, #FBBC05, #34A853, #4285F4)",
                animation: isSubmitting ? "spin 1.2s linear infinite" : "spin 6s linear infinite",
                pointerEvents: "none",
              }}
            />
          </div>

          {/* Actual Search Box Container */}
          <div
            ref={searchBarRef}
            onMouseEnter={() => {
              setHovered(true);
              if (showInitialSpin) {
                setShowInitialSpin(false);
              }
            }}
            onMouseLeave={() => setHovered(false)}
            style={{
              position: "relative",
              width: "100%",
              borderRadius: 24, // highly rounded corners like AI Studio
              padding: "0.8px", // Razor-thin Google AI Studio style hairline border!
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              background: hovered || isSubmitting || showInitialSpin ? "transparent" : "rgba(255, 255, 255, 0.08)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
              transform: isSubmitting
                ? "scale(0.99)"
                : hovered
                ? "scale(1.002)"
                : "scale(1)",
              transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
              zIndex: 1, // Draw above the sibling background glow
            }}
          >
            {/* Spinning hairline border gradient inside the overflow:hidden container */}
            <div
              style={{
                position: "absolute",
                width: 850,
                height: 850,
                top: "calc(50% - 425px)",
                left: "calc(50% - 425px)",
                background: "conic-gradient(from 0deg, #4285F4, #EA4335, #FBBC05, #34A853, #4285F4)",
                animation: isSubmitting ? "spin 1.2s linear infinite" : "spin 6s linear infinite",
                opacity: isSubmitting || hovered || showInitialSpin ? 1 : 0,
                transition: "opacity 0.4s ease",
                pointerEvents: "none",
                zIndex: 0,
              }}
            />

            {/* Inner input content card wrapper */}
            <div
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                flex: 1,
                background: "rgba(10, 16, 32, 0.94)",
                borderRadius: 23, // 24px outer - 1px inner layout offset
                padding: "20px 24px",
                minHeight: 170, // Tall, exact screenshot size!
                gap: 16,
                zIndex: 1,
                overflow: "hidden",
              }}
            >
            {/* User glossy sheen reflection overlay */}
            <div
              style={{
                position: "absolute",
                top: "2%",
                left: "15%",
                width: "70%",
                height: "35%",
                background: "linear-gradient(to bottom, rgba(255, 255, 255, 0.15), transparent)",
                borderRadius: "50% / 100% 100% 0 0",
                pointerEvents: "none",
                zIndex: 2,
              }}
            />

            {/* Spacious Multiline Textarea */}
            <textarea
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSubmitting}
              placeholder={isSubmitting ? "Provisioning Swarm Pipeline..." : "Describe an app, swarm, or workflow and let Orbit do the rest..."}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                resize: "none",
                fontSize: "1.05rem",
                fontFamily: "inherit",
                color: "var(--text-primary)",
                caretColor: "#4285F4",
                position: "relative",
                zIndex: 3
              }}
            />

            {/* Bottom Actions Row (Microphone, Plus, submit pills) */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 3 }}>
              {/* Left actions: Microphone + Plus */}
              <div style={{ display: "flex", gap: 10 }}>
                {/* Microphone */}
                <button
                  disabled={isSubmitting}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#fff"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                >
                  <Sparkles size={16} />
                </button>
                {/* Plus add context */}
                <button
                  disabled={isSubmitting}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#fff"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Right actions: Selector pills + primary submit */}
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                {["Agent", "Swarm", "Workflow"].map((c) => (
                  <button
                    key={c}
                    disabled={isSubmitting}
                    onClick={() => handleSearchSubmit(c.toLowerCase() as any)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 100,
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      background: "rgba(79,140,255,0.12)",
                      color: "var(--accent-blue)",
                      border: "1px solid rgba(79,140,255,0.22)",
                      cursor: isSubmitting ? "not-allowed" : "pointer",
                      transition: "background 0.16s"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(79,140,255,0.22)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(79,140,255,0.12)")}
                  >
                    {c}
                  </button>
                ))}

                {/* Sleek round Up Arrow submit button matching modern Google Gemini/AI Studio chat interfaces */}
                <button
                  onClick={() => handleSearchSubmit()}
                  disabled={isSubmitting}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, var(--accent-blue), var(--accent-purple))",
                    border: "none",
                    color: "#fff",
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 12px rgba(79,140,255,0.35)",
                    transition: "all 0.16s ease",
                    flexShrink: 0,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = "0.95"; e.currentTarget.style.transform = "scale(1.06)"; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "scale(1)"; }}
                >
                  <ArrowUp size={18} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>



        {/* CTA */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <Link href="/dashboard" className="btn-primary" style={{ padding: "11px 28px", fontSize: "0.9375rem", borderRadius: 10 }}>
            Start building free
          </Link>
          <a href="#showcase" className="btn-ghost" style={{ padding: "11px 24px", fontSize: "0.9375rem", borderRadius: 10 }}>
            View live demo →
          </a>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", alignItems: "center", gap: 40, flexWrap: "wrap", justifyContent: "center" }}>
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
      <div style={{ position: "relative", zIndex: 5, display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap", maxWidth: 1100, margin: "0 auto", padding: "0 24px 80px" }}>
        {FEATURES.map((f) => (
          <div
            key={f.label}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 100,
              background: "rgba(15, 22, 40, 0.90)", border: "1px solid var(--border-subtle)",
              fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)",
              backdropFilter: "blur(8px)", transition: "all 0.18s ease-out",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(79,140,255,0.3)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <f.icon size={12} style={{ flexShrink: 0 }} /> {f.label}
          </div>
        ))}
      </div>

      {/* ── Section 1: The Swarm Orchestration Engine (Stepped Lifecycle) ── */}
      <section style={{ position: "relative", zIndex: 5, maxWidth: 1200, margin: "0 auto", padding: "60px 24px 80px" }}>
        <h2 style={{ textAlign: "center", fontSize: "2.2rem", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 12 }}>
          The <span className="gradient-text">Autonomous Swarm Lifecycle</span>
        </h2>
        <p style={{ textAlign: "center", color: "var(--text-secondary)", maxWidth: 640, margin: "0 auto 50px", fontSize: "1rem", lineHeight: 1.6 }}>
          Understand how Orbit ingests goals, recruits specialised sandboxed agents, reconciles code via consensus, and deploys it live.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
          {[
            { step: "01", title: "Goal Ingestion & Parsing", desc: "Type instructions into the premium wide search bar. Orbit's semantic parser classifies the context and flags whether to spin up an Agent, Swarm, or Workflow.", border: "var(--accent-blue)" },
            { step: "02", title: "Cohort Recruitment", desc: "Our Autopilot engine analyzes requirements to hire and configure the best team of specialized agents from Orbit's catalog of 175+ sandboxed developers and researchers.", border: "var(--accent-purple)" },
            { step: "03", title: "Consensus & Self-Healing", desc: "Agents generate competing code versions across models. The Consensus Arena votes on consensus while the Self-Healing runner executes unit tests and auto-repairs code.", border: "var(--accent-cyan)" },
            { step: "04", title: "One-Click Deployments", desc: "Deploy final deliverables to live, serverless edge URLs. Preview builds in responsive viewports or scan QR codes to test live on mobile instantly.", border: "#22C55E" },
          ].map((s, idx) => (
            <div key={idx} style={{
              background: "rgba(15, 22, 40, 0.94)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 16,
              padding: 24,
              position: "relative",
              overflow: "hidden",
              transition: "transform 0.25s, border-color 0.25s, background 0.25s",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.borderColor = s.border; e.currentTarget.style.background = "rgba(15, 22, 40, 0.98)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)"; e.currentTarget.style.background = "rgba(15, 22, 40, 0.94)"; }}
            >
              <div style={{ position: "absolute", top: -10, right: 10, fontSize: "4rem", fontWeight: 900, color: "rgba(255,255,255,0.02)", userSelect: "none" }}>{s.step}</div>
              <div style={{ display: "inline-flex", padding: "4px 10px", borderRadius: 8, background: `${s.border}15`, color: s.border, fontSize: "0.75rem", fontWeight: 700, marginBottom: 16 }}>Step {s.step}</div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 10px", color: "#f8fafc" }}>{s.title}</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 2: Consensus Arena Benchmarks ── */}
      <section style={{ position: "relative", zIndex: 5, maxWidth: 1200, margin: "0 auto", padding: "40px 24px 80px" }}>
        <div style={{ background: "rgba(15, 22, 40, 0.94)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 24, padding: "40px 32px", overflow: "hidden", boxShadow: "0 20px 80px rgba(0,0,0,0.5)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, flexWrap: "wrap", alignItems: "center" }}>
            <div>
              <h2 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 12px" }}>
                The <span className="gradient-text">Consensus Arena</span> Benchmarks
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.65, margin: "0 0 24px" }}>
                Orbit coordinates multi-model swarms by comparing results across leading LLMs. Our self-healing pipeline guarantees 99.97% task success.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { label: "Gemini 1.5 Pro integration", value: "98% alignment achieved" },
                  { label: "Claude 3.5 Sonnet pipeline", value: "96% success consensus" },
                  { label: "GPT-4o self-healing tests", value: "94% automated repair rate" },
                ].map((item, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent-cyan)" }} />
                    <span style={{ fontSize: "0.85rem", color: "#f8fafc", fontWeight: 650 }}>{item.label}:</span>
                    <span style={{ fontSize: "0.85rem", color: "var(--accent-cyan)", fontWeight: 700 }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Glassmorphic Table Grid */}
            <div style={{ background: "rgba(10, 16, 30, 0.95)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 16, overflow: "hidden", padding: 8 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem", color: "#f8fafc", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    <th style={{ padding: "12px 14px", fontWeight: 700, color: "var(--text-secondary)" }}>Model Engine</th>
                    <th style={{ padding: "12px 14px", fontWeight: 700, color: "var(--text-secondary)", textAlign: "center" }}>Consensus</th>
                    <th style={{ padding: "12px 14px", fontWeight: 700, color: "var(--text-secondary)", textAlign: "center" }}>Latency</th>
                    <th style={{ padding: "12px 14px", fontWeight: 700, color: "var(--text-secondary)", textAlign: "right" }}>Success Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { model: "Gemini 1.5 Pro", consensus: "98.2%", latency: "< 1.2s", rate: "99.96%", color: "#4285F4" },
                    { model: "Claude 3.5 Sonnet", consensus: "96.5%", latency: "< 1.8s", rate: "99.88%", color: "#8b5cf6" },
                    { model: "GPT-4o Engine", consensus: "94.8%", latency: "< 1.5s", rate: "99.74%", color: "#22C55E" },
                  ].map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: idx < 2 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                      <td style={{ padding: "14px", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: row.color }} />
                        {row.model}
                      </td>
                      <td style={{ padding: "14px", textAlign: "center", fontWeight: 650, color: "var(--accent-cyan)" }}>{row.consensus}</td>
                      <td style={{ padding: "14px", textAlign: "center", color: "var(--text-secondary)" }}>{row.latency}</td>
                      <td style={{ padding: "14px", textAlign: "right", fontWeight: 700, color: "#22C55E" }}>{row.rate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 3: Developer Code SDK Sandbox ── */}
      <section style={{ position: "relative", zIndex: 5, maxWidth: 1200, margin: "0 auto", padding: "40px 24px 100px" }}>
        <h2 style={{ textAlign: "center", fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 12 }}>
          Deploy Swarms in <span className="gradient-text">Three Lines of Code</span>
        </h2>
        <p style={{ textAlign: "center", color: "var(--text-secondary)", maxWidth: 520, margin: "0 auto 40px", fontSize: "1rem", lineHeight: 1.6 }}>
          Run self-healing multi-agent pipelines from your local console or integrate Orbit seamlessly into your cloud pipeline.
        </p>

        {/* Code Console */}
        <div style={{ maxWidth: 760, margin: "0 auto", background: "#040815", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.6)" }}>
          {/* Header */}
          <div style={{ background: "rgba(255,255,255,0.03)", padding: "10px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981" }} />
            </div>
            <span style={{ fontSize: "0.68rem", color: "#64748b", fontFamily: "monospace", fontWeight: 600 }}>orbit-swarm-sdk.ts</span>
          </div>

          {/* Code Text */}
          <div style={{ padding: "20px 24px", fontFamily: "monospace", fontSize: "0.82rem", lineHeight: 1.7, color: "#cbd5e1" }}>
            <div><span style={{ color: "#f43f5e" }}>import</span> &#123; <span style={{ color: "#38bdf8" }}>OrbitSwarm</span> &#125; <span style={{ color: "#f43f5e" }}>from</span> <span style={{ color: "#34d399" }}>"@orbit/sdk"</span>;</div>
            <div style={{ marginTop: 8 }}><span style={{ color: "#64748b" }}>// Provision 175+ specialized sandboxed agents on autopilot</span></div>
            <div><span style={{ color: "#f43f5e" }}>const</span> <span style={{ color: "#a855f7" }}>swarm</span> = <span style={{ color: "#f43f5e" }}>new</span> <span style={{ color: "#38bdf8" }}>OrbitSwarm</span>(&#123;</div>
            <div style={{ paddingLeft: 18 }}>goal: <span style={{ color: "#34d399" }}>"Deploy SEO Specialist and Content Swarm"</span>,</div>
            <div style={{ paddingLeft: 18 }}>strategy: <span style={{ color: "#34d399" }}>"hierarchical"</span>,</div>
            <div style={{ paddingLeft: 18 }}>consensusLevel: <span style={{ color: "#fb923c" }}>0.95</span></div>
            <div>&#125;);</div>
            <div style={{ marginTop: 8 }}><span style={{ color: "#f43f5e" }}>await</span> <span style={{ color: "#a855f7" }}>swarm</span>.<span style={{ color: "#38bdf8" }}>provision</span>();</div>
            <div><span style={{ color: "#f43f5e" }}>const</span> &#123; <span style={{ color: "#cbd5e1" }}>success, liveUrl</span> &#125; = <span style={{ color: "#f43f5e" }}>await</span> <span style={{ color: "#a855f7" }}>swarm</span>.<span style={{ color: "#38bdf8" }}>executeSelfHealingTests</span>();</div>
          </div>
        </div>
      </section>

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

      {/* ── Team Section ── */}
      <section style={{ position: "relative", zIndex: 5, maxWidth: 1200, margin: "0 auto", padding: "40px 24px 100px" }}>
        <h2 style={{ textAlign: "center", fontSize: "2.2rem", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 12 }}>
          Meet the <span className="gradient-text">Core Architects</span>
        </h2>
        <p style={{ textAlign: "center", color: "var(--text-secondary)", maxWidth: 580, margin: "0 auto 48px", fontSize: "1rem", lineHeight: 1.65 }}>
          The visionary senior engineers and systems designers behind Orbit's distributed autonomous swarm infrastructure.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
          {[
            {
              name: "Jishnu Chauhan",
              role: "Full Stack with Auth and AI",
              avatar: "J",
              image: "/developers/jishnu.png",
              gradient: "linear-gradient(135deg, #4285F4, #6366F1)",
              github: "https://www.github.com/jishnukeyhack",
              linkedin: "https://www.linkedin.com/in/jishnu-chauhan-87624b36a/",
              bio: "Designed Orbit's secure real-time authentication pipeline and distributed vector indexing engine for LLM orchestrations."
            },
            {
              name: "Aditya Verma",
              role: "Lead Systems Architect and UI/UX",
              avatar: "A",
              image: "/developers/aditya.png",
              gradient: "linear-gradient(135deg, #EF4444, #F59E0B)",
              github: "https://github.com/Aditya-Logic",
              linkedin: "https://www.linkedin.com/in/aditya-verma-b78a91324/",
              bio: "Engineered the high-performance core microservices topology and custom responsive developer studio layout."
            },
            {
              name: "Pallav Das",
              role: "Research Engineer for Swarms and Agentic Architecture",
              avatar: "P",
              image: "/developers/pallav.jpg",
              gradient: "linear-gradient(135deg, #10B981, #06B6D4)",
              github: "https://github.com/ProfessionalPallav20014",
              linkedin: "https://www.linkedin.com/in/pallav-das-83b185314/",
              bio: "Pioneered multi-agent cohort consensus logic, distributed swarm communication trees, and self-healing workspace runtime simulations."
            }
          ].map((dev, i) => {
            const isHovered = hoveredCard === i;
            return (
              <div
                key={i}
                onMouseEnter={() => setHoveredCard(i)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  transform: isHovered ? "translateY(-6px)" : "translateY(0)",
                  transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                {/* Outer ambient card background glow (hollow rounded-rectangle glow with ZERO windmill clipping!) */}
                <div
                  style={{
                    position: "absolute",
                    inset: "-4px", // Positioned slightly outside the card
                    borderRadius: 24,
                    overflow: "hidden", // Clip the spinning square to a perfect rounded rectangle outline shape!
                    filter: "blur(12px) saturate(1.8)", // Concentrated neon glowing outline ring!
                    opacity: isHovered ? 0.85 : 0.35, // Continuous glowing neon ring outline teaser!
                    transition: "opacity 0.4s ease",
                    pointerEvents: "none",
                    zIndex: 0,
                  }}
                >
                  {/* Spinning perfect square inside the card glow container (perfect circular rotation, no corner windmill artifacts!) */}
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

                {/* Actual Card Container */}
                <div
                  style={{
                    position: "relative",
                    borderRadius: 20,
                    padding: "0.8px", // Razor-thin Google AI Studio border padding!
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    background: isHovered ? "transparent" : "rgba(255, 255, 255, 0.08)",
                    boxShadow: isHovered
                      ? "0 20px 48px rgba(0, 0, 0, 0.6)"
                      : "0 10px 30px rgba(0, 0, 0, 0.35)",
                    transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                    width: "100%",
                    height: "100%",
                    zIndex: 1, // Draw above unclipped ambient glow
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
                      opacity: isHovered ? 1 : 0.35, // Vibrant continuous outline!
                      transition: "opacity 0.4s ease",
                      pointerEvents: "none",
                      zIndex: 0,
                    }}
                  />

                  {/* Inner layout card offset wrapper with rich dark grey background matching standard theme panels */}
                  <div
                    style={{
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                      gap: 16,
                      flex: 1,
                      background: "rgba(15, 22, 40, 0.95)", // High-end Google theme dark grey matching Orbit panels perfectly
                      borderRadius: 19, // 20px - 1px layout offset
                      padding: "28px 24px",
                      zIndex: 1,
                      overflow: "hidden",
                    }}
                  >
                    {/* Glossy top sheen overlay */}
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: "40%",
                        background: "linear-gradient(to bottom, rgba(255, 255, 255, 0.03), transparent)",
                        pointerEvents: "none"
                      }}
                    />

                    <div style={{ display: "flex", alignItems: "center", gap: 16, position: "relative", zIndex: 1 }}>
                      {/* Glowing Avatar */}
                      <div
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: "50%",
                          background: dev.gradient,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1.2rem",
                          fontWeight: 800,
                          color: "#fff",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                          border: "1.5px solid rgba(255,255,255,0.15)",
                          flexShrink: 0,
                          overflow: "hidden",
                          position: "relative",
                        }}
                      >
                        {dev.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={dev.image}
                            alt={dev.name}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          dev.avatar
                        )}
                      </div>
                      <div>
                        <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0, color: "#f8fafc" }}>{dev.name}</h3>
                        <span style={{ fontSize: "0.78rem", color: "var(--accent-blue)", fontWeight: 600 }}>{dev.role}</span>
                      </div>
                    </div>

                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0, position: "relative", zIndex: 1, flex: 1 }}>
                      {dev.bio}
                    </p>

                    {/* Social buttons */}
                    <div style={{ display: "flex", gap: 12, marginTop: 8, position: "relative", zIndex: 1 }}>
                      <a
                        href={dev.github}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          padding: "8px 12px",
                          borderRadius: 8,
                          background: "rgba(255, 255, 255, 0.04)",
                          border: "1px solid rgba(255, 255, 255, 0.08)",
                          color: "#cbd5e1",
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          textDecoration: "none",
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#fff"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)"; e.currentTarget.style.color = "#cbd5e1"; }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path>
                          <path d="M9 18c-4.51 2-5-2-7-2"></path>
                        </svg>
                        GitHub
                      </a>
                      <a
                        href={dev.linkedin}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          padding: "8px 12px",
                          borderRadius: 8,
                          background: "rgba(79, 140, 255, 0.1)",
                          border: "1px solid rgba(79, 140, 255, 0.2)",
                          color: "#60a5fa",
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          textDecoration: "none",
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(79, 140, 255, 0.18)"; e.currentTarget.style.color = "#fff"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "rgba(79, 140, 255, 0.1)"; e.currentTarget.style.color = "#60a5fa"; }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                          <rect x="2" y="9" width="4" height="12"></rect>
                          <circle cx="4" cy="4" r="2"></circle>
                        </svg>
                        LinkedIn
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ position: "relative", zIndex: 5, textAlign: "center", padding: "40px 24px", borderTop: "1px solid var(--border-subtle)" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>
           2026 Orbit — Orchestrating Autonomous Intelligence Into Action.
        </p>
      </footer>
    </>
  );
}
