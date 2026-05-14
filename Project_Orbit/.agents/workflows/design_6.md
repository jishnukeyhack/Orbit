---
description: Billing page and floating AI assistant panel of Orbit
---


## 14. Billing Page

### 14.1 Plan Cards

```
┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│   Starter      │ │   Pro          │ │   Enterprise   │
│   $29/mo       │ │   $149/mo      │ │   Custom       │
│                │ │  ★ Most Popular│ │                │
├────────────────┤ ├────────────────┤ ├────────────────┤
│ 10 agents      │ │ 200 agents     │ │ Unlimited      │
│ 5B tokens/mo   │ │ 50B tokens/mo  │ │ Unlimited      │
│ 10 workflows   │ │ Unlimited wf   │ │ Unlimited      │
│ Community sup. │ │ Priority sup.  │ │ Dedicated CSM  │
│ 3 team members │ │ 25 members     │ │ Unlimited      │
│                │ │ SSO + SAML     │ │ On-prem option │
│ [Current Plan] │ │ [Upgrade →]    │ │ [Contact Sales]│
└────────────────┘ └────────────────┘ └────────────────┘
```

### 14.2 Usage Meters

```
Token usage:   ████████████░░░░░░  2.4B / 5B     48%
Agent hours:   ██████░░░░░░░░░░░░   847h / 2000h  42%
API calls:     ████████████████░░  8.2M / 10M    82%  ⚠ Near limit
Storage:       ██░░░░░░░░░░░░░░░░    24GB / 100GB 24%
```

### 14.3 Payment History

```
Date          Description                     Amount    Status
──────────────────────────────────────────────────────────────
May 01, 2026  Pro Plan — May 2026              $149.00   ✓ Paid
Apr 23, 2026  Token overage charge              $23.40   ✓ Paid
Apr 01, 2026  Pro Plan — April 2026            $149.00   ✓ Paid
Mar 15, 2026  Enterprise trial add-on            $0.00   ✓ Free
```

---

## 15. Floating AI Assistant Panel

### 15.1 Spec

```
Position:    fixed bottom-right, 20px margin from edges
Closed:      52×52px circular button, gradient background
Open:        380×580px panel, glass surface
Animation:   spring scale from bottom-right origin

Background:  rgba(21,27,46,0.82), blur 16px
Border:      1px solid; gradient blue→purple
Shadow:      0 8px 48px rgba(0,0,0,0.5), 0 0 24px rgba(79,140,255,0.15)
```

### 15.2 Panel UI

```
╔══════════════════════════════════════╗
║  ✦ AgentOS Copilot          [–] [×] ║
╠══════════════════════════════════════╣
║                                      ║
║   How can I help you today?          ║
║                                      ║
║   Quick actions:                     ║
║   [Create agent] [Debug workflow]    ║
║   [Optimize tokens] [Generate API]   ║
║                                      ║
║   ─────────────────────────────────  ║
║   You:  "Why did agent #247 fail?"   ║
║   AI:   "Agent agt_4b2c timed out   ║
║          on web_search after 30s.    ║
║          Likely cause: external      ║
║          API rate limit. Suggest:    ║
║          [Add retry logic] [View log]║
║          ▌" ← streaming cursor      ║
║                                      ║
╠══════════════════════════════════════╣
║  [🎤]  [  Ask anything...    ]  [↑] ║
╚══════════════════════════════════════╝
```

### 15.3 Capabilities

```
· Natural language agent creation
· Workflow generation from description
· Log analysis and error explanation
· Code generation for custom tool plugins
· Token usage optimization analysis
· Inline runnable suggestions with [Apply] buttons
· Voice input (Web Speech API)
· Streaming token-by-token response rendering
```

---