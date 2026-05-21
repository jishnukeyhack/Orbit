"use client";
import { useState } from "react";
import { Users, Plus, Shield, Mail, MoreHorizontal, X } from "lucide-react";

const TEAM = [
  { name: "Jishnu Chauhan", email: "jc@orbit.ai", role: "CEO", avatar: "J", status: "Active", joined: "Jan 2026" },
  { name: "aditya kumar", email: "ak@orbit.ai", role: "co-founder", avatar: "A", status: "Active", joined: "Feb 2026" },
  { name: "pallab", email: "pb@orbit.ai", role: "co-founder", avatar: "P", status: "Active", joined: "Mar 2026" },
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
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Developer");
  const [inviteStatus, setInviteStatus] = useState("");
  const [openDropdownIdx, setOpenDropdownIdx] = useState<number | null>(null);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.02em", margin: 0 }}>Team</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.8125rem", margin: "4px 0 0" }}>{TEAM.length} members · Orbit HQ workspace</p>
        </div>
        <button className="btn-primary" onClick={() => setInviteModalOpen(true)}><Plus size={16} /> Invite Member</button>
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
            <div style={{ position: "relative" }}>
              <button 
                onClick={() => setOpenDropdownIdx(openDropdownIdx === i ? null : i)}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 4 }}
              >
                <MoreHorizontal size={16} />
              </button>
              {openDropdownIdx === i && (
                <>
                  <div 
                    onClick={() => setOpenDropdownIdx(null)}
                    style={{ position: "fixed", inset: 0, zIndex: 90 }} 
                  />
                  <div style={{
                    position: "absolute", top: "calc(100% + 4px)", right: 0, width: 140,
                    background: "#0f1629", border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 12, padding: 6, boxShadow: "0 16px 48px rgba(0,0,0,0.5)", zIndex: 100,
                  }}>
                    <button onClick={() => { console.log("Change role"); setOpenDropdownIdx(null); }} style={{ width: "100%", textAlign: "left", padding: "8px 10px", borderRadius: 6, background: "transparent", border: "none", color: "#94a3b8", fontSize: "0.85rem", cursor: "pointer" }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#f1f5f9"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94a3b8"; }}>Change role</button>
                    <button onClick={() => { console.log("Remove member"); setOpenDropdownIdx(null); }} style={{ width: "100%", textAlign: "left", padding: "8px 10px", borderRadius: 6, background: "transparent", border: "none", color: "#ef4444", fontSize: "0.85rem", cursor: "pointer", marginTop: 2 }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>Remove member</button>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Invite Modal */}
      {inviteModalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div className="orbit-card" style={{ width: "100%", maxWidth: 420, padding: 0, display: "flex", flexDirection: "column", animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}>
            <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", background: "rgba(255,255,255,0.02)" }}>
              <div style={{ fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
                <Mail size={16} /> Invite Member
              </div>
              <button 
                onClick={() => { setInviteModalOpen(false); setInviteStatus(""); }}
                style={{ width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", border: "none", background: "transparent", color: "var(--text-muted)", cursor: "pointer" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
              >
                <X size={16} />
              </button>
            </div>
            
            <div style={{ padding: "24px 20px" }}>
              {inviteStatus ? (
                <div style={{ padding: "12px", borderRadius: 8, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: "#10b981", fontSize: "0.85rem", textAlign: "center", marginBottom: 16 }}>
                  {inviteStatus}
                </div>
              ) : null}
              
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: 8 }}>Email Address</label>
                <input 
                  type="email" 
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com" 
                  style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-subtle)", borderRadius: 8, padding: "8px 12px", color: "var(--text-primary)", fontSize: "0.85rem", outline: "none" }}
                />
              </div>
              
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: 8 }}>Role</label>
                <select 
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-subtle)", borderRadius: 8, padding: "8px 12px", color: "var(--text-primary)", fontSize: "0.85rem", outline: "none", appearance: "none" }}
                >
                  <option value="Admin">Admin</option>
                  <option value="Developer">Developer</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>
              
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button className="btn-ghost" onClick={() => setInviteModalOpen(false)}>Cancel</button>
                <button 
                  className="btn-primary" 
                  onClick={() => {
                    if (inviteEmail) {
                      setInviteStatus(\`Invite sent to \${inviteEmail}\`);
                      setInviteEmail("");
                    }
                  }}
                >
                  Send Invite
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
