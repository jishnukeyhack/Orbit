"use client";
import { Users, Plus, Shield, Mail, MoreHorizontal } from "lucide-react";

const TEAM = [
  { name: "Om Patel", email: "om@orbit.ai", role: "Admin", avatar: "O", status: "Active", joined: "Jan 2026" },
  { name: "Sarah Chen", email: "sarah@orbit.ai", role: "Developer", avatar: "S", status: "Active", joined: "Feb 2026" },
  { name: "Alex Kumar", email: "alex@orbit.ai", role: "Operator", avatar: "A", status: "Active", joined: "Mar 2026" },
  { name: "Lisa Wang", email: "lisa@orbit.ai", role: "Developer", avatar: "L", status: "Active", joined: "Mar 2026" },
  { name: "Jordan Lee", email: "jordan@orbit.ai", role: "Viewer", avatar: "J", status: "Invited", joined: "—" },
];

function roleColor(role: string) {
  switch (role) {
    case "Admin": return "var(--status-error)";
    case "Developer": return "var(--accent-blue)";
    case "Operator": return "var(--status-warning)";
    case "Viewer": return "var(--text-muted)";
    default: return "var(--text-secondary)";
  }
}

export default function TeamPage() {
  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.02em", margin: 0 }}>Team</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.8125rem", margin: "4px 0 0" }}>{TEAM.length} members · Orbit HQ workspace</p>
        </div>
        <button className="btn-primary"><Plus size={16} /> Invite Member</button>
      </div>

      <div className="orbit-card" style={{ padding: 0 }}>
        {TEAM.map((m, i) => (
          <div key={m.email} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderBottom: i < TEAM.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, var(--accent-blue), var(--accent-purple))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.78rem", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
              {m.avatar}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: "0.9375rem" }}>{m.name}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{m.email}</div>
            </div>
            <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: "0.68rem", fontWeight: 600, background: `${roleColor(m.role)}15`, color: roleColor(m.role), border: `1px solid ${roleColor(m.role)}25` }}>
              {m.role}
            </span>
            <span style={{ fontSize: "0.72rem", color: m.status === "Active" ? "var(--status-success)" : "var(--status-warning)", width: 60 }}>{m.status}</span>
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", width: 70 }}>{m.joined}</span>
            <button style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 4 }}><MoreHorizontal size={16} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
