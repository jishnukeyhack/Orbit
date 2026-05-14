---
description: Side bar navigation and many more of Orbit
---


## 4. Sidebar Navigation

### 4.1 Visual Spec

```
Width:          240px expanded / 64px collapsed
Background:     #111827
Right border:   1px solid rgba(255,255,255,0.06)
Transition:     width 220ms cubic-bezier(0.4,0,0.2,1)

Item height:    40px
Item radius:    8px
Active bg:      rgba(79,140,255,0.12)
Active border:  left 2px solid #4F8CFF
Active text:    #4F8CFF
Hover bg:       rgba(255,255,255,0.05)
Icon size:      18px
Gap icon↔label: 12px
```

### 4.2 Navigation Sections

```
PLATFORM
  ⬡  Dashboard
  ◈  Agents
  ⬡  Swarms
  ⟳  Workflows
  ⚡  Automations

ECOSYSTEM
  🏪  Marketplace
  🔗  Integrations
  >_  Terminal

OPERATIONS
  🚀  Deployments
  📋  Logs & Monitoring
  📊  Analytics

ACCOUNT
  💳  Billing
  🔑  API Keys
  👥  Team
  ⚙️  Settings
```

### 4.3 Sidebar Component — TSX

```tsx
const navSections = [
  {
    label: 'Platform',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard',   href: '/dashboard'   },
      { icon: Bot,             label: 'Agents',       href: '/agents'      },
      { icon: Network,         label: 'Swarms',       href: '/swarms'      },
      { icon: GitBranch,       label: 'Workflows',    href: '/workflows'   },
      { icon: Zap,             label: 'Automations',  href: '/automations' },
    ],
  },
  {
    label: 'Ecosystem',
    items: [
      { icon: Store,    label: 'Marketplace',  href: '/marketplace'  },
      { icon: Plug,     label: 'Integrations', href: '/integrations' },
      { icon: Terminal, label: 'Terminal',     href: '/terminal'     },
    ],
  },
  {
    label: 'Operations',
    items: [
      { icon: Rocket,    label: 'Deployments', href: '/deployments' },
      { icon: Activity,  label: 'Logs',        href: '/logs'        },
      { icon: BarChart3, label: 'Analytics',   href: '/analytics'   },
    ],
  },
  {
    label: 'Account',
    items: [
      { icon: CreditCard, label: 'Billing',  href: '/billing'   },
      { icon: Key,        label: 'API Keys', href: '/api-keys'  },
      { icon: Users,      label: 'Team',     href: '/team'      },
      { icon: Settings,   label: 'Settings', href: '/settings'  },
    ],
  },
];
```

---

## 5. Top Command Bar

### 5.1 Layout (left → right)

```
[≡ Toggle] [Logo] [  Global Search / ⌘K  ] [AI Input] [● Status] [🔔] [Workspace ▾] [Avatar]
```

### 5.2 Command Palette (⌘K)

- Full-screen blur overlay, centered modal 560px wide
- Sections: Recent · Pages · Agents · Commands · Docs
- Keyboard nav: arrow keys + Enter to execute

```tsx
const commands = [
  { type: 'action', icon: Plus,    label: 'Create new agent',   shortcut: '⌘N'  },
  { type: 'action', icon: Rocket,  label: 'Deploy swarm',       shortcut: '⌘D'  },
  { type: 'action', icon: Play,    label: 'Run workflow',        shortcut: '⌘R'  },
  { type: 'nav',    icon: Bot,     label: 'Go to Agents',       shortcut: 'G A' },
  { type: 'nav',    icon: Network, label: 'Go to Swarms',       shortcut: 'G S' },
  { type: 'theme',  icon: Moon,    label: 'Toggle theme'                        },
];
```

### 5.3 AI Command Bar — Typewriter Placeholder Cycle

```
Cycling placeholder examples (500ms crossfade):
  "Create a sales outreach agent..."
  "Deploy swarm for data processing..."
  "Connect Slack integration..."
  "Show me token usage this week..."
  "Debug workflow #247..."
  "Scale research cluster to 10 agents..."
```

---

## 6. Dashboard Page

### 6.1 KPI Overview Row (6 cards)

```
┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│ Active Agents  │ │Running Workflows│ │  Token Usage   │
│    1,247       │ │      89        │ │  2.4B / 5B     │
│ ▲ +12% today   │ │  ▲ 3 new today │ │ ████████░░ 48% │
└────────────────┘ └────────────────┘ └────────────────┘
┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│ Monthly Cost   │ │Active Deploys  │ │  API Requests  │
│  $4,821.50     │ │      34        │ │  12.8M today   │
│ ▼ -4% vs last  │ │ ● 3 scaling   │ │ ▲ +22% avg     │
└────────────────┘ └────────────────┘ └────────────────┘
```

Card spec:
```
background:    #151B2E
border:        1px solid rgba(255,255,255,0.08)
border-radius: 12px
padding:       20px 24px
hover:         0 0 0 1px rgba(79,140,255,0.20), 0 8px 32px rgba(0,0,0,0.30)
transition:    all 200ms ease
```

### 6.2 Dashboard Grid Layout

```
┌──────────────────────────┬──────────────────┐
│  Agent Graph             │  AI Activity Feed│
│  (React Flow, ~60%)      │  (live stream)   │
├──────────────────────────┴──────────────────┤
│  Usage Chart (area)  │  Revenue Chart (bar) │
├──────────────────────┼──────────────────────┤
│  Deployment Status   │  AI Suggestions      │
└──────────────────────┴──────────────────────┘
```

### 6.3 Live AI Activity Feed

```tsx
interface ActivityEvent {
  id:        string;
  agentName: string;
  action:    'task_complete' | 'error' | 'spawn' | 'tool_call' | 'memory_write';
  message:   string;
  timestamp: Date;
  duration?: number; // ms
}
```

Events stream in from top; older entries fade with `opacity`. Status dots:
- Green pulsing = active
- Amber = pending / retrying
- Red = error

### 6.4 Agent Graph — React Flow Config

```tsx
const nodeTypes = {
  agentNode:  AgentNode,   // rounded rect, gradient border when active
  memoryNode: MemoryNode,  // hexagon, purple tint
  toolNode:   ToolNode,    // rect with tool icon
  swarmNode:  SwarmNode,   // cluster node, larger
};
const edgeTypes = {
  dataFlow: AnimatedEdge,  // animated dashed line
  trigger:  TriggerEdge,   // pulsing arrow
};
```

### 6.5 AI Suggestions Widget

```
╔══════════════════════════════════════╗
║  ✦ AI Suggestions                    ║
╠══════════════════════════════════════╣
║  ⚡ Optimize workflow #12             ║
║     Est. 34% token reduction  [Apply]║
║                                      ║
║  📈 Scale "ResearchBot"              ║
║     High queue depth detected [Scale]║
║                                      ║
║  🔴 Agent "SalesBot-3" failing       ║
║     3 retries in last 10 min  [Debug]║
╚══════════════════════════════════════╝
```

---