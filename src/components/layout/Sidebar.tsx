"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Bot, Network, GitBranch, Zap, Store, Plug, Terminal,
  Rocket, Activity, BarChart3, CreditCard, Key, Users, Settings,
  ChevronLeft, ChevronRight, Play, HardDrive,
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
    ],
  },
  {
    label: "Ecosystem",
    items: [
      { icon: Store,     label: "Marketplace",  href: "/marketplace" },
      { icon: Plug,      label: "Integrations", href: "/integrations" },
      { icon: Terminal,  label: "Terminal",      href: "/terminal" },
      { icon: HardDrive, label: "Workspace",     href: "/workspace" },
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

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

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
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
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
