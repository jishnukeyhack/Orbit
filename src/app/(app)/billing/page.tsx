"use client";
import { CreditCard, AlertTriangle, Check, Download } from "lucide-react";

const PLANS = [
  { name: "Starter", price: "$29/mo", features: ["10 agents", "5B tokens/mo", "10 workflows", "Community support", "3 team members"], current: true, popular: false },
  { name: "Pro", price: "$149/mo", features: ["200 agents", "50B tokens/mo", "Unlimited workflows", "Priority support", "25 members", "SSO + SAML"], current: false, popular: true },
  { name: "Enterprise", price: "Custom", features: ["Unlimited agents", "Unlimited tokens", "Unlimited workflows", "Dedicated CSM", "Unlimited members", "On-prem option"], current: false, popular: false },
];

const USAGE_METERS = [
  { label: "Token usage", current: "2.4B", max: "5B", percent: 48, warning: false },
  { label: "Agent hours", current: "847h", max: "2000h", percent: 42, warning: false },
  { label: "API calls", current: "8.2M", max: "10M", percent: 82, warning: true },
  { label: "Storage", current: "24GB", max: "100GB", percent: 24, warning: false },
];

const PAYMENTS = [
  { date: "May 01, 2026", desc: "Pro Plan — May 2026", amount: "$149.00", status: "Paid" },
  { date: "Apr 23, 2026", desc: "Token overage charge", amount: "$23.40", status: "Paid" },
  { date: "Apr 01, 2026", desc: "Pro Plan — April 2026", amount: "$149.00", status: "Paid" },
  { date: "Mar 15, 2026", desc: "Enterprise trial add-on", amount: "$0.00", status: "Free" },
];

export default function BillingPage() {
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.02em", margin: 0 }}>Billing</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.8125rem", margin: "4px 0 0" }}>Manage your subscription and usage</p>
      </div>

      {/* Plan cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
        {PLANS.map((plan) => (
          <div key={plan.name} className="orbit-card" style={{ display: "flex", flexDirection: "column", gap: 16, position: "relative", border: plan.popular ? "1px solid rgba(79,140,255,0.35)" : undefined }}>
            {plan.popular && (
              <span style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", padding: "3px 12px", borderRadius: 100, background: "linear-gradient(135deg, var(--accent-blue), var(--accent-purple))", fontSize: "0.65rem", fontWeight: 600, color: "#fff", letterSpacing: "0.04em" }}>
                 Most Popular
              </span>
            )}
            <div>
              <div style={{ fontSize: "1.125rem", fontWeight: 700 }}>{plan.name}</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, marginTop: 4 }}>{plan.price}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
              {plan.features.map((f) => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                  <Check size={13} style={{ color: "var(--status-success)", flexShrink: 0 }} /> {f}
                </div>
              ))}
            </div>
            {plan.current ? (
              <button className="btn-ghost" style={{ justifyContent: "center", opacity: 0.6 }}>Current Plan</button>
            ) : plan.name === "Enterprise" ? (
              <button className="btn-ghost" style={{ justifyContent: "center" }}>Contact Sales</button>
            ) : (
              <button className="btn-primary" style={{ justifyContent: "center" }}>Upgrade →</button>
            )}
          </div>
        ))}
      </div>

      {/* Usage meters */}
      <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: 16 }}>Usage</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 32 }}>
        {USAGE_METERS.map((m) => (
          <div key={m.label} className="orbit-card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8125rem" }}>
              <span style={{ color: "var(--text-secondary)" }}>{m.label}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {m.warning && <AlertTriangle size={12} style={{ color: "var(--status-warning)" }} />}
                <span style={{ fontWeight: 600 }}>{m.current}</span>
                <span style={{ color: "var(--text-muted)" }}>/ {m.max}</span>
                <span style={{ color: "var(--text-muted)", marginLeft: 4 }}>{m.percent}%</span>
              </span>
            </div>
            <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${m.percent}%`, background: m.warning ? "var(--status-warning)" : "linear-gradient(90deg, var(--accent-blue), var(--accent-purple))", borderRadius: 3, transition: "width 0.6s ease" }} />
            </div>
          </div>
        ))}
      </div>

      {/* Payment history */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h2 style={{ fontSize: "1.125rem", fontWeight: 600, margin: 0 }}>Payment History</h2>
        <button className="btn-ghost" style={{ padding: "5px 10px", fontSize: "0.72rem" }}><Download size={12} /> Export</button>
      </div>
      <div className="orbit-card" style={{ padding: 0 }}>
        <div style={{ display: "grid", gridTemplateColumns: "140px 1fr 100px 80px", gap: 12, padding: "10px 16px", borderBottom: "1px solid var(--border-subtle)", fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>
          <span>Date</span><span>Description</span><span>Amount</span><span>Status</span>
        </div>
        {PAYMENTS.map((p, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "140px 1fr 100px 80px", gap: 12, padding: "12px 16px", borderBottom: i < PAYMENTS.length - 1 ? "1px solid var(--border-subtle)" : "none", fontSize: "0.8125rem" }}>
            <span style={{ color: "var(--text-muted)" }}>{p.date}</span>
            <span>{p.desc}</span>
            <span style={{ fontWeight: 600 }}>{p.amount}</span>
            <span style={{ color: "var(--status-success)", display: "flex", alignItems: "center", gap: 3, fontSize: "0.72rem" }}>
              <Check size={11} /> {p.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
