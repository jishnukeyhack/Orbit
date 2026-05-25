"use client";
import { useState, useEffect } from "react";
import { Users, Plus, Shield, Mail, MoreHorizontal } from "lucide-react";
import { supabase } from "@/lib/supabase";

const INITIAL_TEAM = [
  { name: "Jishnu Chauhan", email: "jc@orbit.ai", role: "CEO", avatar: "J", status: "Active", joined: "Jan 2026" },
  { name: "aditya kumar", email: "ak@orbit.ai", role: "co-founder", avatar: "A", status: "Active", joined: "Feb 2026" },
  { name: "pallab", email: "pb@orbit.ai", role: "co-founder", avatar: "P", status: "Active", joined: "Mar 2026" },
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
  const [team, setTeam] = useState<any[]>(INITIAL_TEAM);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && mounted) {
          const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
          const capitalizedName = fullName.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          const avatarUrl = user.user_metadata?.avatar_url || '';
          
          const joinedDate = new Date(user.created_at || Date.now()).toLocaleDateString('en', { month: 'short', year: 'numeric' });
          
          const activeUserMember = {
            name: capitalizedName,
            email: user.email || '',
            role: "Admin", // Dynamic premium role badge
            avatar: capitalizedName.charAt(0).toUpperCase() || "U",
            avatarUrl: avatarUrl,
            status: "Active",
            joined: joinedDate,
            glow: user.user_metadata?.preset_glow || 'indigo'
          };

          setTeam(prev => {
            // Avoid duplicate rows if they match co-founders or exist already
            if (prev.some(m => m.email.toLowerCase() === activeUserMember.email.toLowerCase())) {
              return prev;
            }
            return [activeUserMember, ...prev];
          });
        }
      } catch (err) {
        console.error("Failed to load active team member:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchUser();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.02em", margin: 0 }}>Team</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.8125rem", margin: "4px 0 0" }}>
            {team.length} members · Orbit HQ workspace
          </p>
        </div>
        <button className="btn-primary" style={{ display: "flex", alignItems: "center", gap: 6 }}><Plus size={16} /> Invite Member</button>
      </div>

      <div className="orbit-card" style={{ padding: 0 }}>
        {team.map((m, i) => (
          <div key={m.email} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderBottom: i < team.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: m.glow ? `var(--glow-${m.glow}-gradient, linear-gradient(135deg, var(--accent-blue), var(--accent-purple)))` : "linear-gradient(135deg, var(--accent-blue), var(--accent-purple))",
              boxShadow: m.glow ? `0 0 10px var(--glow-${m.glow}-color, rgba(99,102,241,0.25))` : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.78rem",
              fontWeight: 700,
              color: "#fff",
              flexShrink: 0,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.15)"
            }}>
              {m.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.avatarUrl} alt={m.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                m.avatar
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: "0.9375rem", display: "flex", alignItems: "center", gap: 6 }}>
                {m.name}
                {m.email === team[0]?.email && !loading && (
                  <span style={{ fontSize: '0.6rem', padding: '1px 5px', borderRadius: 4, background: 'rgba(99,102,241,0.15)', color: '#818cf8', fontWeight: 600, border: '1px solid rgba(99,102,241,0.2)' }}>YOU</span>
                )}
              </div>
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

