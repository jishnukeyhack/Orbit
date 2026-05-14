"use client";
import { Store, Search, Star, Download, CheckCircle, TrendingUp } from "lucide-react";

const CATEGORIES = ["All", "Automation", "Research", "Sales", "DevOps", "Finance", "Support", "Marketing"];

const MARKETPLACE_AGENTS = [
  { id: "mp-1", name: "AutoResearcher Pro", publisher: "Anthropic", verified: true, description: "Deep web research with citations and PDF export", rating: 4.9, reviews: 2100, installs: 48000, pricing: "Free", category: "Research", featured: true },
  { id: "mp-2", name: "SalesForce AI", publisher: "Orbit Labs", verified: true, description: "End-to-end sales pipeline automation with CRM integration", rating: 4.8, reviews: 1800, installs: 35000, pricing: "$9/mo", category: "Sales", featured: false },
  { id: "mp-3", name: "CodeGuard", publisher: "SecurAI", verified: true, description: "Automated security scanning and vulnerability detection", rating: 4.7, reviews: 890, installs: 22000, pricing: "$19/mo", category: "DevOps", featured: false },
  { id: "mp-4", name: "ContentEngine", publisher: "CreativeAI", verified: false, description: "Multi-platform content creation and scheduling", rating: 4.5, reviews: 1200, installs: 28000, pricing: "Free", category: "Marketing", featured: false },
  { id: "mp-5", name: "FinAnalyst Pro", publisher: "FinTech Labs", verified: true, description: "Real-time financial modeling and risk assessment", rating: 4.6, reviews: 560, installs: 12000, pricing: "$29/mo", category: "Finance", featured: false },
  { id: "mp-6", name: "SupportBot Elite", publisher: "Orbit Labs", verified: true, description: "Intelligent customer support with CSAT optimization", rating: 4.8, reviews: 2400, installs: 56000, pricing: "Free", category: "Support", featured: false },
  { id: "mp-7", name: "DataPipe Builder", publisher: "DataForge", verified: true, description: "Visual ETL pipeline builder with 50+ connectors", rating: 4.4, reviews: 340, installs: 8900, pricing: "$0.001/call", category: "Automation", featured: false },
  { id: "mp-8", name: "InfraWatch", publisher: "CloudOps", verified: true, description: "Real-time infrastructure monitoring and anomaly detection", rating: 4.7, reviews: 780, installs: 19000, pricing: "$15/mo", category: "DevOps", featured: false },
];

export default function MarketplacePage() {
  return (
    <div style={{ maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.02em", margin: 0 }}>Marketplace</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.8125rem", margin: "4px 0 0" }}>Discover and install pre-built agents and automations</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: 8, padding: "6px 12px", width: 300 }}>
          <Search size={14} style={{ color: "var(--text-muted)" }} />
          <input type="text" placeholder="Search agents, automations..." style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: "0.8125rem", color: "var(--text-primary)", fontFamily: "inherit" }} />
        </div>
      </div>

      {/* Categories */}
      <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" as const }}>
        {CATEGORIES.map((c, i) => (
          <button key={c} style={{ padding: "6px 14px", borderRadius: 100, fontSize: "0.78rem", fontWeight: 500, cursor: "pointer", background: i === 0 ? "rgba(79,140,255,0.15)" : "transparent", border: `1px solid ${i === 0 ? "rgba(79,140,255,0.3)" : "var(--border-subtle)"}`, color: i === 0 ? "var(--accent-blue)" : "var(--text-secondary)" }}>
            {c}
          </button>
        ))}
      </div>

      {/* Featured */}
      <div className="orbit-card glass-panel--gradient-border" style={{ marginBottom: 24, display: "flex", gap: 20, padding: 24 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Star size={14} style={{ color: "var(--status-warning)" }} />
            <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--status-warning)", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>Featured · Staff Pick</span>
          </div>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 4px" }}>AutoResearcher Pro</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: 12 }}>
            by Anthropic <CheckCircle size={12} style={{ color: "var(--accent-blue)" }} /> Verified
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.5, margin: "0 0 16px" }}>
            Deep web research with citations and PDF export. Powered by Claude with real-time data access.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: 16 }}>
            <span>★ 4.9 (2.1k reviews)</span>
            <span>48,000 installs</span>
            <span style={{ color: "var(--status-success)", fontWeight: 600 }}>Free</span>
          </div>
          <button className="btn-primary" style={{ padding: "8px 20px" }}>
            <Download size={14} /> Install
          </button>
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {MARKETPLACE_AGENTS.filter(a => !a.featured).map((agent) => (
          <div key={agent.id} className="orbit-card" style={{ display: "flex", flexDirection: "column", gap: 12, cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg, var(--accent-blue), var(--accent-purple))", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Store size={16} color="#fff" />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{agent.name}</div>
                  <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 3 }}>
                    {agent.publisher} {agent.verified && <CheckCircle size={9} style={{ color: "var(--accent-blue)" }} />}
                  </div>
                </div>
              </div>
              <span style={{ padding: "3px 8px", borderRadius: 6, fontSize: "0.68rem", fontWeight: 600, background: agent.pricing === "Free" ? "rgba(34,197,94,0.12)" : "rgba(79,140,255,0.12)", color: agent.pricing === "Free" ? "var(--status-success)" : "var(--accent-blue)" }}>
                {agent.pricing}
              </span>
            </div>
            <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>{agent.description}</p>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--text-muted)" }}>
              <span>★ {agent.rating} ({agent.reviews})</span>
              <span>{(agent.installs / 1000).toFixed(0)}k installs</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
