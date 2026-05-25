"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  LayoutDashboard, Bot, Network, GitBranch, Zap, Store, Plug, Terminal,
  Rocket, Activity, BarChart3, CreditCard, Key, Users, Settings,
  ChevronLeft, ChevronRight, Play, HardDrive, LogOut, MessageSquare,
} from "lucide-react";

const NAV_SECTIONS = [
  {
    label: "Platform",
    items: [
      { icon: LayoutDashboard, label: "Dashboard",   href: "/dashboard" },
      { icon: Bot,             label: "Agents",       href: "/agents" },
      { icon: Network,         label: "Swarms",       href: "/swarms" },
      { icon: GitBranch,       label: "Workflows",    href: "/workflows" },
      { icon: Play,            label: "Pipeline",     href: "/pipeline" },
      { icon: Zap,             label: "Automations",  href: "/automations" },
      { icon: MessageSquare,   label: "Blog",         href: "/blog" },
    ],
  },
  {
    label: "Ecosystem",
    items: [
      { icon: Store,     label: "Marketplace",  href: "/marketplace" },
      { icon: Plug,      label: "Integrations", href: "/integrations" },
      { icon: Terminal,  label: "Terminal",      href: "/terminal" },
      { icon: HardDrive, label: "Orbit Workspace", href: "/workspace" },
    ],
  },
  {
    label: "Operations",
    items: [
      { icon: Rocket,    label: "Deployments", href: "/deployments" },
      { icon: Activity,  label: "Logs",        href: "/logs" },
      { icon: BarChart3, label: "Analytics",   href: "/analytics" },
    ],
  },
  {
    label: "Account",
    items: [
      { icon: CreditCard, label: "Billing",   href: "/billing" },
      { icon: Key,         label: "API Keys",  href: "/api-keys" },
      { icon: Users,       label: "Team",      href: "/team" },
      { icon: Settings,    label: "Settings",  href: "/settings" },
    ],
  },
];

import OrbitLogo from "@/components/layout/OrbitLogo";

const GLOW_PRESETS: Record<string, { gradient: string; shadow: string }> = {
  blue: { gradient: "linear-gradient(135deg, #4f8cff, #0072ff)", shadow: "0 0 12px rgba(79,140,255,0.45)" },
  indigo: { gradient: "linear-gradient(135deg, #6366f1, #8b5cf6)", shadow: "0 0 12px rgba(99,102,241,0.45)" },
  red: { gradient: "linear-gradient(135deg, #ef4444, #b91c1c)", shadow: "0 0 12px rgba(239,68,68,0.45)" },
  amber: { gradient: "linear-gradient(135deg, #f59e0b, #d97706)", shadow: "0 0 12px rgba(245,158,11,0.45)" },
  emerald: { gradient: "linear-gradient(135deg, #10b981, #059669)", shadow: "0 0 12px rgba(16,185,129,0.45)" },
  pink: { gradient: "linear-gradient(135deg, #ec4899, #be185d)", shadow: "0 0 12px rgba(236,72,153,0.45)" },
};

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const presetGlow = user?.user_metadata?.preset_glow || 'indigo';
  const activeGlow = GLOW_PRESETS[presetGlow] || GLOW_PRESETS.indigo;

  return (
    <aside
      style={{
        width: collapsed ? 64 : 240,
        minWidth: collapsed ? 64 : 240,
        height: "100vh",
        background: "var(--bg-surface)",
        borderRight: "1px solid var(--border-subtle)",
        display: "flex",
        flexDirection: "column",
        transition: "width 220ms cubic-bezier(0.4,0,0.2,1), min-width 220ms cubic-bezier(0.4,0,0.2,1)",
        overflow: "hidden",
        position: "relative",
        zIndex: 20,
      }}
    >
      {/* Logo */}
      <div style={{ height: 60, display: "flex", alignItems: "center", padding: collapsed ? "0 18px" : "0 16px", gap: 10, borderBottom: "1px solid var(--border-subtle)", flexShrink: 0 }}>
        <OrbitLogo variant={collapsed ? "icon" : "full"} size={26} />
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "12px 8px" }}>
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} style={{ marginBottom: 16 }}>
            {!collapsed && (
              <div style={{ padding: "4px 8px", fontSize: "0.68rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 4 }}>
                {section.label}
              </div>
            )}
            {section.items.map((item) => {
              const encryptionKey = user?.user_metadata?.encryption_key;
              const targetHref = encryptionKey ? `${item.href}/${encryptionKey}` : item.href;
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={targetHref}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    height: 40,
                    padding: collapsed ? "0 20px" : "0 12px",
                    borderRadius: 8,
                    fontSize: "0.8125rem",
                    fontWeight: 500,
                    color: active ? "var(--accent-blue)" : "var(--text-secondary)",
                    background: active ? "rgba(79,140,255,0.12)" : "transparent",
                    borderLeft: active ? "2px solid var(--accent-blue)" : "2px solid transparent",
                    textDecoration: "none",
                    transition: "background 0.15s, color 0.15s",
                    whiteSpace: "nowrap" as const,
                  }}
                >
                  <item.icon size={18} style={{ flexShrink: 0 }} />
                  {!collapsed && item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User profile section */}
      {user && (
        <div
          style={{
            padding: "12px 10px",
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: activeGlow.gradient,
              boxShadow: activeGlow.shadow,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.78rem",
              fontWeight: 700,
              color: "#fff",
              flexShrink: 0,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.15)"
            }}
          >
            {user.user_metadata?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.user_metadata.avatar_url}
                alt="Avatar"
                style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
              />
            ) : (
              (user.email?.[0] || "U").toUpperCase()
            )}
          </div>

          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
              <span
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {user.user_metadata?.full_name || user.email?.split("@")[0]}
              </span>
              <span
                style={{
                  fontSize: "0.68rem",
                  color: "var(--text-muted)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {user.email}
              </span>
            </div>
          )}

          {!collapsed && (
            <button
              onClick={handleLogout}
              title="Sign Out"
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                padding: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "color 0.14s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--status-error)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-end",
          padding: collapsed ? 0 : "0 12px",
          background: "transparent",
          border: "none",
          borderTop: "1px solid var(--border-subtle)",
          color: "var(--text-muted)",
          cursor: "pointer",
          transition: "color 0.15s",
        }}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  );
}
