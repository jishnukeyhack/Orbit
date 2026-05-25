"use client";
import { Rocket, Plus, Globe, Clock, CheckCircle, AlertCircle, Loader } from "lucide-react";

const DEPLOYMENTS = [
  { id: "dep-1", name: "SalesBot-Enterprise", region: "us-east-1", status: "live", version: "v3.2.1", uptime: "99.98%", time: "2h ago" },
  { id: "dep-2", name: "ResearchBot-v2", region: "eu-west-1", status: "live", version: "v2.1.0", uptime: "99.97%", time: "5h ago" },
  { id: "dep-3", name: "Support Swarm", region: "ap-south-1", status: "deploying", version: "v1.4.0", uptime: "—", time: "3m ago" },
  { id: "dep-4", name: "DataPipeline-Alpha", region: "us-west-2", status: "live", version: "v4.0.0", uptime: "99.99%", time: "1d ago" },
  { id: "dep-5", name: "ContentEngine", region: "eu-central-1", status: "failed", version: "v5.1.0", uptime: "—", time: "45m ago" },
  { id: "dep-6", name: "InfraMonitor", region: "us-east-1", status: "live", version: "v2.0.1", uptime: "100%", time: "3d ago" },
];

function statusIcon(status: string) {
  switch (status) {
    case "live": return <CheckCircle size={14} style={{ color: "var(--status-success)" }} />;
    case "deploying": return <Loader size={14} style={{ color: "var(--accent-blue)", animation: "pulse-dot 1.5s ease infinite" }} />;
    case "failed": return <AlertCircle size={14} style={{ color: "var(--status-error)" }} />;
    default: return null;
  }
}

export default function DeploymentsPage() {
  return (
    <div style={{ maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.02em", margin: 0 }}>Deployments</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.8125rem", margin: "4px 0 0" }}>Global agent deployment management</p>
        </div>
        <button className="btn-primary"><Plus size={16} /> New Deployment</button>
      </div>

      <div className="orbit-card" style={{ padding: 0 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 100px 80px 80px 80px", gap: 12, padding: "10px 16px", borderBottom: "1px solid var(--border-subtle)", fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>
          <span>Service</span><span>Region</span><span>Status</span><span>Version</span><span>Uptime</span><span>Deployed</span>
        </div>
        {DEPLOYMENTS.map((d, i) => (
          <div key={d.id} style={{ display: "grid", gridTemplateColumns: "1fr 120px 100px 80px 80px 80px", gap: 12, padding: "14px 16px", borderBottom: i < DEPLOYMENTS.length - 1 ? "1px solid var(--border-subtle)" : "none", fontSize: "0.8125rem", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Rocket size={14} style={{ color: "var(--accent-blue)" }} />
              <span style={{ fontWeight: 600 }}>{d.name}</span>
            </div>
            <span style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--text-secondary)", fontSize: "0.78rem" }}>
              <Globe size={11} /> {d.region}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>{statusIcon(d.status)} <span style={{ fontSize: "0.78rem", textTransform: "capitalize" as const }}>{d.status}</span></span>
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{d.version}</span>
            <span style={{ fontSize: "0.78rem", fontWeight: 600, color: d.uptime === "100%" ? "var(--status-success)" : "var(--text-secondary)" }}>{d.uptime}</span>
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 3 }}><Clock size={10} /> {d.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
