"use client";
import { Activity, Cpu, Wifi } from "lucide-react";

export default function StatusBar() {
  return (
    <div
      style={{
        height: 32,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        background: "var(--bg-surface)",
        borderTop: "1px solid var(--border-subtle)",
        fontSize: "0.68rem",
        color: "var(--text-muted)",
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span className="status-dot status-dot--running" style={{ width: 6, height: 6 }} />
          System healthy
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Activity size={10} /> 1,247 agents active
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Cpu size={10} /> 2.4B tokens/today
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Wifi size={10} /> 12ms latency
        </span>
        <span>v2.0.1</span>
      </div>
    </div>
  );
}
