---
description: Agents page and many more of Orbit
---

## 7. Agents Page

### 7.1 Page Header

```
Agents                                   [+ Create Agent] [⊞ Grid | ≡ List]
1,247 agents · 1,189 running · 58 paused

[Search agents...]  [Status ▾]  [Model ▾]  [Sort: Recent ▾]
```

### 7.2 Agent Card (Grid View)

```
┌──────────────────────────────────────┐
│ ● Running                    [···]   │
│                                      │
│  🤖  SalesBot-Enterprise             │
│      GPT-4o · 12 tools               │
│                                      │
│  Tasks today   Memory     Tokens     │
│  2,847         847 MB     1.2M       │
│                                      │
│  ████████████░░░░ 78% CPU            │
│                                      │
│  [Monitor] [Config] [Clone] [Stop]   │
└──────────────────────────────────────┘
```

### 7.3 Agent Creation Wizard (5 steps)

```
Step 1 — Identity
  · Agent name (required)
  · Goal / description
  · Icon / avatar picker

Step 2 — Model & Memory
  · Provider (OpenAI / Anthropic / Google / Mistral / Local)
  · Model selection
  · Context window size
  · Memory type (short-term / vector / graph / episodic)

Step 3 — Tools & Permissions
  · Tool selector: web, code exec, file, DB, API, custom
  · Permission scope: read / write / execute

Step 4 — Deployment
  · Environment: cloud / edge / on-prem
  · Auto-scaling rules
  · Retry / failure policy
  · Environment variables

Step 5 — Review & Launch
  · Full summary card
  · Estimated monthly cost
  · [Deploy Agent] CTA
```

---

## 8. Swarms Page

### 8.1 Node Editor (React Flow)

```
Node types:
  PlannerAgent   — orchestrator node, blue gradient border
  ExecutorAgent  — worker, green border when active
  MemoryStore    — shared memory pool, purple hex shape
  ToolConnector  — external service, amber border
  HumanGate      — approval gate, orange, pauses execution

Edge types:
  DataFlow       — animated dashed line, left→right
  EventTrigger   — pulsing arrow
  ParallelFork   — fan-out with branch count badge
  Feedback       — curved back-edge, reduced opacity
```

### 8.2 Swarm Toolbar

```
[+ Agent] [+ Memory] [+ Tool] [+ Gate] | [▶ Run] [⏸ Pause] [⏹ Stop] | [💾 Save] [⬆ Export]
```

### 8.3 Live Execution State

When a swarm runs:
- Active edges show moving particle animations
- Each executor node shows a live token counter badge
- Planner node shows aggregate progress ring (% tasks complete)
- Completed nodes get a green checkmark overlay

---

## 9. Workflow Builder

### 9.1 Canvas Layout

```
┌──────────────────────────────────────────────────────────┐
│ [Add Block ▾] [▶ Run] [💾 Save] [Version: v3 ▾] [Share] │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  [Trigger] ──→ [LLM] ──→ [Tool Use] ──→ [Output]       │
│                  │                                       │
│                  └──→ [Conditional]                      │
│                          ├──→ [Branch A] ──→ [Webhook]  │
│                          └──→ [Branch B] ──→ [Approve]  │
│                                                          │
└──────────────────────────────────────────────────────────┤
│ INSPECTOR PANEL (right, 320px) — block config & params   │
└──────────────────────────────────────────────────────────┘
```

### 9.2 Block Types

```tsx
type BlockType =
  | 'trigger'        // Webhook / cron schedule / event listener
  | 'llm'            // LLM call — model, prompt template, params
  | 'api_call'       // HTTP request — method, headers, body
  | 'memory_read'    // Read from vector / KV store
  | 'memory_write'   // Write to store
  | 'tool_use'       // Run tool: code exec, web search, file I/O
  | 'conditional'    // if / else branching with expression eval
  | 'parallel'       // Fan-out N concurrent tasks, merge results
  | 'webhook'        // Send outbound HTTP webhook
  | 'vector_search'  // Semantic similarity lookup
  | 'human_approval' // Pause; notify human; resume on approval
  | 'transform'      // JSON / data mapper
  | 'delay'          // Wait / sleep N seconds
  | 'loop'           // Iterate over array input
```

---

## 10. Terminal Page

### 10.1 Layout

```
┌─────────────────────────────────────────────────────────┐
│  [● session-1 ×] [session-2 ×]  [+ New]   [⚙ Settings]│
├─────────────────────────────────────────────────────────┤
│  agentos v2.0.1 — Type 'help' for commands             │
│                                                         │
│  $ agent deploy --name="SalesBot" --model=gpt-4o       │
│  ✓ Building container image...                          │
│  ✓ Pushing to registry...                               │
│  ✓ Deploying to us-east-1...                            │
│  ✓ Agent SalesBot deployed. ID: agt_8f9a2c             │
│                                                         │
│  $ swarm start research-cluster --agents=5              │
│  ⣾ Initializing swarm...                                │
│                                                         │
│  ✦ AI Shell — type naturally: "show me running agents"  │
│  $ _                                                    │
└─────────────────────────────────────────────────────────┘
```

### 10.2 Features

```
Multi-session tabs       — isolated pty per tab
AI shell assistant       — natural language → CLI suggestion overlay
Syntax highlighting      — token-by-token, theme-matched
Streaming output         — real-time stdout/stderr, auto-scroll lock
Command history          — ↑/↓ navigation, ⌘R fuzzy history search
Block copy               — click output block to copy
Docker/K8s log tailing   — agent logs -f agt_8f9a2c
Resize panes             — drag handle between terminal and log panel
```

### 10.3 Sample Commands

```bash
# Agent lifecycle
agent create --name="ResearchBot" --model=claude-3-5-sonnet
agent deploy agt_8f9a2c --env=production
agent pause  agt_8f9a2c
agent resume agt_8f9a2c
agent clone  agt_8f9a2c --name="ResearchBot-v2"
agent logs  -f agt_8f9a2c

# Swarm
swarm start  --config=research.yaml --agents=8
swarm status swm_4d2e1a
swarm scale  swm_4d2e1a --replicas=16
swarm stop   swm_4d2e1a

# Workflow
workflow run  wf_73ab12 --input='{"query":"market analysis"}'
workflow list --status=running
workflow logs wf_73ab12 --tail=100

# System
agentos status
agentos usage  --period=7d
agentos version
```

---

## 11. Marketplace Page

### 11.1 Layout

```
HEADER — Marketplace  [Search agents, automations...]
CATEGORIES — [All] [Automation] [Research] [Sales] [DevOps] [Finance] [Support]

FEATURED BANNER (horizontal scroll)
┌──────────────────────────────────────────────────────────┐
│  ⭐ Featured · Staff Pick                                 │
│  AutoResearcher Pro  ·  by Anthropic  ✓ Verified         │
│  Deep web research with citations and PDF export         │
│  ★ 4.9 (2.1k reviews) · 48,000 installs                 │
│  Free  ·  [Install]                                      │
└──────────────────────────────────────────────────────────┘

TRENDING GRID (3–4 col)  |  TOP CREATORS sidebar
```

### 11.2 Agent Card Data Model

```tsx
interface MarketplaceAgent {
  id:          string;
  name:        string;
  publisher:   string;
  verified:    boolean;
  description: string;
  category:    string[];
  rating:      number;      // 0–5
  reviews:     number;
  installs:    number;
  pricing:     'free' | 'paid' | 'usage';
  priceLabel:  string;      // "Free" | "$9/mo" | "$0.001/call"
  tools:       string[];
  models:      string[];
  version:     string;
  lastUpdated: Date;
  revenue?:    number;      // creator earnings (shown to creator)
}
```

---

## 12. Integrations Page

### 12.1 Integration Card

```
┌──────────────────────────────┐
│  [Logo]  Slack               │
│  ● Connected · 3 agents      │
│                              │
│  Send messages, read DMs,    │
│  trigger workflows from chat │
│                              │
│  [Configure]  [Disconnect]   │
└──────────────────────────────┘
```

### 12.2 Full Integration List

```
Communication:   Slack · Discord · Telegram · Email (SMTP) · Twilio · WhatsApp
CRM:             Salesforce · HubSpot · Pipedrive · Zoho
Productivity:    Notion · Airtable · Google Workspace · Microsoft 365
Dev:             GitHub · GitLab · Linear · Jira · Vercel · Netlify · Render
Data:            PostgreSQL · MySQL · MongoDB · Supabase · PlanetScale · Redis
AI/ML:           OpenAI · Anthropic · Google AI · HuggingFace · Replicate
Cloud:           AWS · GCP · Azure · Cloudflare Workers
Container:       Docker · Kubernetes · Railway
Storage:         Google Drive · Dropbox · AWS S3
```

### 12.3 OAuth Connect Flow

```
[Connect] click → OAuth popup (400×600px)
  → Provider login screen
  → Permission grant screen  
  → Redirect with token → popup closes
  → Toast: "Slack connected successfully ✓"
  → Card updates: ● Connected state
  → Agent picker: "Which agents can use this integration?"
```

---

## 13. Logs & Observability

### 13.1 Three-Tab Layout

```
[ Logs ]   [ Metrics ]   [ Traces ]
```

### 13.2 Logs Tab

```
[Agent: All ▾] [Level: All ▾] [Last 1h ▾] [Search regex...] [▶ Live] [⬇ Export]

┌────────────────────────────────────────────────────────────────────┐
│ 14:32:01.847  INFO   agt_8f9a  Tool call: web_search("AI news")   │
│ 14:32:02.103  INFO   agt_8f9a  Tool response (256ms, 1.2KB)       │
│ 14:32:02.410  INFO   agt_8f9a  LLM response: 847 tokens           │
│ 14:32:03.012  WARN   agt_4b2c  Retry 2/3 (rate limit hit)        │
│ 14:32:03.890  ERROR  agt_9d1e  Tool timeout after 30s             │
│ [streaming indicator]                                              │
└────────────────────────────────────────────────────────────────────┘

Log level colors:
  INFO   #94A3B8 (secondary)
  WARN   #F59E0B (amber)
  ERROR  #EF4444 (red)
  DEBUG  #4B5563 (muted)
```

### 13.3 Metrics Tab (Grafana-style panels)

```
Panels:
  Agent success rate (%)        — sparkline, 24h window
  Average LLM latency (ms)      — bar chart, per model provider
  Token usage / hour            — area chart with threshold line
  Error rate by agent           — horizontal sorted bar
  API requests / minute         — real-time line chart
  Memory usage per agent        — grouped bar chart
```

### 13.4 Traces Tab (Jaeger-style waterfall)

```
Trace: wf_73ab12   Total: 4.2s   Spans: 6   Status: ✓

  ├─ workflow.run              0ms ─────────────────────── 4200ms
  │   ├─ agent.invoke          12ms ─────────── 1840ms
  │   │   ├─ llm.call          15ms ──────── 980ms
  │   │   └─ tool.web_search   1010ms ─────── 820ms
  │   └─ agent.invoke          1860ms ────── 2300ms
  │       ├─ llm.call          1862ms ──── 640ms
  │       └─ memory.write      2510ms ─ 48ms
```

---