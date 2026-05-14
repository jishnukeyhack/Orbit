"use client";
import { Plug, Search } from "lucide-react";

const INTEGRATION_CATEGORIES = [
  {
    label: "Communication",
    integrations: [
      { name: "Slack", connected: true, agents: 3, desc: "Send messages, read DMs, trigger workflows from chat" },
      { name: "Discord", connected: true, agents: 2, desc: "Bot commands, channel notifications, event triggers" },
      { name: "Telegram", connected: false, agents: 0, desc: "Bot messaging, group notifications, inline commands" },
      { name: "Email (SMTP)", connected: true, agents: 5, desc: "Send/receive emails, parse attachments, auto-reply" },
    ],
  },
  {
    label: "Developer Tools",
    integrations: [
      { name: "GitHub", connected: true, agents: 4, desc: "PR reviews, issue tracking, CI/CD triggers" },
      { name: "Linear", connected: true, agents: 2, desc: "Issue management, sprint planning, status updates" },
      { name: "Jira", connected: false, agents: 0, desc: "Issue tracking, agile boards, sprint management" },
      { name: "Vercel", connected: true, agents: 1, desc: "Deployments, preview URLs, serverless functions" },
    ],
  },
  {
    label: "Data & Storage",
    integrations: [
      { name: "PostgreSQL", connected: true, agents: 6, desc: "Query data, manage schemas, vector extensions" },
      { name: "Supabase", connected: true, agents: 3, desc: "Auth, realtime, storage, edge functions" },
      { name: "MongoDB", connected: false, agents: 0, desc: "Document queries, aggregation, change streams" },
      { name: "Redis", connected: true, agents: 4, desc: "Caching, pub/sub, session management" },
    ],
  },
  {
    label: "AI / ML",
    integrations: [
      { name: "OpenAI", connected: true, agents: 12, desc: "GPT-4o, o3, embeddings, fine-tuning" },
      { name: "Anthropic", connected: true, agents: 8, desc: "Claude models, tool use, long context" },
      { name: "Google AI", connected: true, agents: 3, desc: "Gemini models, multimodal, search grounding" },
      { name: "Azure OpenAI", connected: false, agents: 0, desc: "Enterprise GPT deployment, content safety" },
    ],
  },
  {
    label: "Cloud",
    integrations: [
      { name: "AWS", connected: true, agents: 5, desc: "Lambda, S3, ECS, CloudFormation" },
      { name: "Microsoft Azure", connected: true, agents: 3, desc: "Container Apps, AKS, Azure Functions" },
      { name: "GCP", connected: false, agents: 0, desc: "Cloud Run, GKE, BigQuery, Vertex AI" },
      { name: "Docker", connected: true, agents: 7, desc: "Container builds, registry, orchestration" },
    ],
  },
];

export default function IntegrationsPage() {
  return (
    <div style={{ maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.02em", margin: 0 }}>Integrations</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.8125rem", margin: "4px 0 0" }}>Connect your tools and services</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: 8, padding: "6px 12px", width: 280 }}>
          <Search size={14} style={{ color: "var(--text-muted)" }} />
          <input type="text" placeholder="Search integrations..." style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: "0.8125rem", color: "var(--text-primary)", fontFamily: "inherit" }} />
        </div>
      </div>

      {INTEGRATION_CATEGORIES.map((cat) => (
        <div key={cat.label} style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 12, textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>{cat.label}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {cat.integrations.map((int) => (
              <div key={int.name} className="orbit-card" style={{ display: "flex", flexDirection: "column", gap: 10, padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Plug size={14} style={{ color: int.connected ? "var(--accent-blue)" : "var(--text-muted)" }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{int.name}</div>
                      {int.connected && (
                        <div style={{ fontSize: "0.68rem", color: "var(--status-success)", display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--status-success)" }} />
                          Connected · {int.agents} agents
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.4, margin: 0 }}>{int.desc}</p>
                <div style={{ display: "flex", gap: 6 }}>
                  {int.connected ? (
                    <>
                      <button style={{ flex: 1, padding: "5px 0", borderRadius: 6, background: "rgba(79,140,255,0.08)", border: "1px solid rgba(79,140,255,0.15)", color: "var(--accent-blue)", fontSize: "0.72rem", fontWeight: 500, cursor: "pointer" }}>Configure</button>
                      <button style={{ flex: 1, padding: "5px 0", borderRadius: 6, background: "transparent", border: "1px solid var(--border-subtle)", color: "var(--text-muted)", fontSize: "0.72rem", cursor: "pointer" }}>Disconnect</button>
                    </>
                  ) : (
                    <button className="btn-primary" style={{ flex: 1, padding: "5px 0", fontSize: "0.72rem", justifyContent: "center" }}>Connect</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
