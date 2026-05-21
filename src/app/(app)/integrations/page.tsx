"use client";
import { useState } from "react";
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

function getBrandLogo(name: string, connected: boolean) {
  const color = connected ? "var(--accent-blue)" : "var(--text-muted)";
  const size = 18;

  switch (name) {
    case "Slack":
      return (
        <svg viewBox="0 0 24 24" width={size} height={size}>
          <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523 2.528 2.528 0 0 1-2.522-2.523 2.528 2.528 0 0 1 2.522-2.52h2.52v2.52z" fill="#E01E5A" />
          <path d="M6.303 15.165a2.528 2.528 0 0 1 2.52-2.52h5.043a2.528 2.528 0 0 1 2.522 2.52v5.042a2.528 2.528 0 0 1-2.522 2.52H8.824a2.528 2.528 0 0 1-2.52-2.52v-5.042z" fill="#2EB67D" />
          <path d="M8.824 5.043a2.528 2.528 0 0 1 2.52-2.522 2.528 2.528 0 0 1 2.522 2.522v2.52h-2.522a2.528 2.528 0 0 1-2.52-2.52z" fill="#36C5F0" />
          <path d="M8.824 6.304a2.528 2.528 0 0 1 2.52 2.52v5.043a2.528 2.528 0 0 1-2.522 2.522H3.782a2.528 2.528 0 0 1-2.52-2.522V8.824a2.528 2.528 0 0 1 2.52-2.52h5.042z" fill="#36C5F0" />
          <path d="M18.958 8.824a2.528 2.528 0 0 1 2.522-2.52 2.528 2.528 0 0 1 2.52 2.52 2.528 2.528 0 0 1-2.52 2.52h-2.522v-2.52z" fill="#ECB22E" />
          <path d="M17.696 8.824a2.528 2.528 0 0 1-2.52-2.52h-5.043a2.528 2.528 0 0 1-2.522-2.52V3.782a2.528 2.528 0 0 1 2.522-2.52h5.043a2.528 2.528 0 0 1 2.52 2.52v5.042z" fill="#ECB22E" />
          <path d="M15.165 18.958a2.528 2.528 0 0 1-2.522 2.522 2.528 2.528 0 0 1-2.52-2.522v-2.52h2.52a2.528 2.528 0 0 1 2.522 2.52z" fill="#E01E5A" />
          <path d="M15.165 17.696a2.528 2.528 0 0 1-2.522-2.52v-5.043a2.528 2.528 0 0 1 2.52-2.522h5.043a2.528 2.528 0 0 1 2.522 2.522v5.043a2.528 2.528 0 0 1-2.522 2.52h-5.043z" fill="#E01E5A" />
        </svg>
      );
    case "Discord":
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} fill="#5865F2">
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.094 13.094 0 0 1-1.873-.894.077.077 0 0 1-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 0 1 .077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .078.009c.12.099.246.195.373.289a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.156 2.418z" />
        </svg>
      );
    case "Telegram":
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} fill="#24A1DE">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.36-1 .53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.24.35-.49.97-.74 3.79-1.65 6.32-2.73 7.59-3.25 3.61-1.48 4.36-1.74 4.85-1.75.11 0 .35.03.5.16.13.12.17.27.18.39.02.09.02.26-.01.4z" />
        </svg>
      );
    case "Email (SMTP)":
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="#f1f5f9" strokeWidth="2">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
      );
    case "GitHub":
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} fill="#f1f5f9">
          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
        </svg>
      );
    case "Linear":
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="#5E6AD2" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" />
          <path d="m9 10 3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "Jira":
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} fill="#0052CC">
          <path d="M11.53 2c-.07 0-.13.03-.18.08L6.08 7.35a.27.27 0 0 0 0 .38l3.6 3.6c.05.05.12.08.18.08h5.36c.15 0 .23-.18.12-.29L9.98 5.76a.27.27 0 0 0-.38 0L6 9.38c-.1.1-.1.27 0 .38l3.6 3.6c.05.05.12.08.18.08h5.36c.15 0 .23-.18.12-.29l-5.36-5.36a.27.27 0 0 0-.38 0l-3.6 3.6" />
        </svg>
      );
    case "Vercel":
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} fill="#ffffff">
          <path d="M24 22.525H0L12 1.475L24 22.525Z" />
        </svg>
      );
    case "PostgreSQL":
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} fill="#336791">
          <path d="M12.213 2.001c-1.385.02-2.825.297-4.047 1.054a7.994 7.994 0 0 0-3.612 4.417C3.518 10.3 4.298 13.1 5.926 15.03c.516.613 1.157 1.157 1.83 1.637v5.334h5.333c2.723 0 5.253-1.637 6.425-4.08 1.164-2.42 1.154-5.26-.025-7.669a7.99 7.99 0 0 0-4.092-4.046 8.04 8.04 0 0 0-3.184-.205z" />
        </svg>
      );
    case "Supabase":
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} fill="#3ECF8E">
          <path d="M21.362 10.428l-8.583 5.15a1.8 1.8 0 0 1-2.484-.582l-1.378-2.296a.6.6 0 0 0-.918-.117L1.83 18.06A1.2 1.2 0 0 0 2.81 20.1h15.938a3.0 3.0 0 0 0 2.92-2.316l1.377-5.508a.6.6 0 0 0-.616-.723h-1.083z M2.638 13.572l8.583-5.15a1.8 1.8 0 0 1 2.484.582l1.378 2.296a.6.6 0 0 0 .918.117l6.17-5.477A1.2 1.2 0 0 0 21.19 3.9H5.252a3.0 3.0 0 0 0-2.92 2.316l-1.377 5.508a.6.6 0 0 0 .616.723h1.083z" />
        </svg>
      );
    case "MongoDB":
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} fill="#47A248">
          <path d="M12 .002C11.57.002 8 4 8 9.5c0 3.32 1.5 5.5 4 7 2.5-1.5 4-3.68 4-7C16 4 12.43.002 12 .002z" />
        </svg>
      );
    case "Redis":
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} fill="#DC382D">
          <path d="M12 2L2 7l10 5 10-5-10-5zm0 8.243L4.486 7 12 3.757 19.514 7 12 10.243z M2 12l10 5 10-5-10-3-10 3z M2 17l10 5 10-5-10-3-10 3z" />
        </svg>
      );
    case "OpenAI":
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} fill="#10a37f">
          <path d="M21.743 12.32a5.86 5.86 0 0 0-.462-2.222 5.89 5.89 0 0 0-1.637-2.203 5.86 5.86 0 0 0-2.285-1.203 5.86 5.86 0 0 0-2.316.035 5.86 5.86 0 0 0-2.003-2.112 5.89 5.89 0 0 0-2.482-.93 5.86 5.86 0 0 0-2.502.164A5.86 5.86 0 0 0 6.2 5.105a5.86 5.86 0 0 0-.463 2.222 5.89 5.89 0 0 0 1.637 2.203 5.86 5.86 0 0 0 2.285 1.203 5.86 5.86 0 0 0 2.316-.035 5.86 5.86 0 0 0 2.003 2.112 5.89 5.89 0 0 0 2.482.93 5.86 5.86 0 0 0 2.502-.164 5.86 5.86 0 0 0 2.866-2.253z" />
        </svg>
      );
    case "Anthropic":
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} fill="#E05C36">
          <path d="M19.79 16.53L12.38 3.91c-.16-.27-.5-.27-.67 0L4.31 16.53c-.15.26-.01.58.29.58h14.88c.31 0 .45-.32.31-.58z M12 6.88l5.22 8.75H6.78L12 6.88z" />
        </svg>
      );
    case "Google AI":
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} fill="none">
          <defs>
            <linearGradient id="geminiGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9b51e0" />
              <stop offset="50%" stopColor="#3182ce" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
          </defs>
          <path d="M12 2c0 5.5-4.5 10-10 10 5.5 0 10 4.5 10 10 0-5.5 4.5-10 10-10-5.5 0-10-4.5-10-10z" fill="url(#geminiGrad2)" />
        </svg>
      );
    case "Azure OpenAI":
    case "Microsoft Azure":
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} fill="#0078D4">
          <path d="M0 12.012L10.3 0 24 4.568 10.3 24z M10.3 0L24 4.568 13.7 24 0 12.012z" />
        </svg>
      );
    case "AWS":
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} fill="#FF9900">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5.67-1.5 1.5-1.5 1.5.67 1.5 1.5z" />
        </svg>
      );
    case "GCP":
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} fill="#4285F4">
          <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
        </svg>
      );
    default:
      return <Plug size={14} style={{ color }} />;
  }
}

export default function IntegrationsPage() {
  const [connectModalService, setConnectModalService] = useState<string | null>(null);

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
                      {getBrandLogo(int.name, int.connected)}
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
                      <button onClick={() => console.log('Configure', int.name)} style={{ flex: 1, padding: "5px 0", borderRadius: 6, background: "rgba(79,140,255,0.08)", border: "1px solid rgba(79,140,255,0.15)", color: "var(--accent-blue)", fontSize: "0.72rem", fontWeight: 500, cursor: "pointer" }}>Configure</button>
                      <button onClick={() => console.log('Disconnect', int.name)} style={{ flex: 1, padding: "5px 0", borderRadius: 6, background: "transparent", border: "1px solid var(--border-subtle)", color: "var(--text-muted)", fontSize: "0.72rem", cursor: "pointer" }}>Disconnect</button>
                    </>
                  ) : (
                    <button className="btn-primary" onClick={() => setConnectModalService(int.name)} style={{ flex: 1, padding: "5px 0", fontSize: "0.72rem", justifyContent: "center" }}>Connect</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Connect Modal */}
      {connectModalService && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div className="orbit-card" style={{ width: "100%", maxWidth: 400, padding: "24px" }}>
            <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginTop: 0, marginBottom: "12px" }}>Connect {connectModalService}</h3>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "24px" }}>
              Connect {connectModalService}? This will redirect you to authorize access.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button className="btn-ghost" onClick={() => setConnectModalService(null)}>Cancel</button>
              <button className="btn-primary" onClick={() => { console.log('Connecting', connectModalService); setConnectModalService(null); }}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
