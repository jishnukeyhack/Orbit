---
description: Component Library part of Orbit
---

## 17. Component Library

### 17.1 Core Shared Components

```
AgentStatusBadge     — pill + colored dot + label (running/paused/error/scaling)
TokenUsageMeter      — segmented bar + count + % + threshold marker
ModelSelector        — dropdown with provider logos + model names
WorkflowBlockCard    — draggable block for canvas with block-type icon
LogLine              — monospace row with level color + timestamp + agent ID
TraceSpan            — horizontal bar for distributed trace waterfall
MetricSparkline      — 7-day inline SVG sparkline chart
CommandInput         — AI command bar with cycling placeholder + chip buttons
IntegrationCard      — logo + name + status + connect/disconnect
BillingUsageMeter    — bar with warning threshold + overage indicator
NotificationToast    — slide-in from right, 4 variants, auto-dismiss 5s
EmptyState           — centered icon + headline + body + optional CTA
LoadingSkeleton      — shimmer placeholder matching target component shape
GlassPanel           — base glass container, accepts gradient-border variant
GradientBorderCard   — card with animated gradient border on hover
```

### 17.2 Empty States

```tsx
// Agents page — no agents
<EmptyState
  icon={<Bot size={40} className="text-blue-400/60" />}
  headline="No agents yet"
  body="Create your first AI agent to start automating tasks at scale."
  cta={{ label: 'Create agent', onClick: openCreateWizard }}
/>

// Logs page — no results
<EmptyState
  icon={<Search size={40} className="text-slate-500" />}
  headline="No logs match your filters"
  body="Try adjusting the time range, agent filter, or search query."
/>

// Marketplace — no search results
<EmptyState
  icon={<Store size={40} className="text-slate-500" />}
  headline="No agents found"
  body="Try a different search term or browse by category."
/>
```

### 17.3 Loading States

```
Page initial load     — full skeleton grid (card outlines shimmer)
Data refetch          — inline skeleton rows replace content rows
Chart loading         — shimmer rect at exact chart dimensions
Agent card skeleton   — avatar circle + 3 text lines + 2 button rects
Log stream            — pulsing bottom border on last row while fetching
Command palette       — spinner + "Searching..." while querying
```

---

## 18. Tech Stack & Architecture

### 18.1 Frontend Stack

```
Framework:     Next.js 15 (App Router, React 19, Server Components)
Language:      TypeScript 5.5
Styling:       TailwindCSS 4 + CSS custom properties
Components:    shadcn/ui (Radix UI primitives, unstyled)
Animation:     Framer Motion 11
Node graph:    React Flow 12 (agents, swarms, workflow canvas)
Charts:        Recharts 2 + custom SVG sparklines
State:         Zustand 5 (slices: ui, agents, swarms, billing, notifications)
Data:          TanStack Query 5 (caching, polling, mutations)
Forms:         React Hook Form + Zod validation
Terminal:      xterm.js + xterm-addon-fit
Icons:         Lucide React
Fonts:         Geist (Vercel) + Geist Mono
```

### 18.2 Folder Structure

```
agentos/
├── app/
│   ├── (landing)/
│   │   └── page.tsx              # Public landing page
│   ├── (app)/
│   │   ├── layout.tsx            # AppLayout shell
│   │   ├── dashboard/page.tsx
│   │   ├── agents/
│   │   │   ├── page.tsx          # Agent list (grid/list)
│   │   │   ├── [id]/page.tsx     # Agent detail & monitor
│   │   │   └── create/page.tsx   # 5-step creation wizard
│   │   ├── swarms/page.tsx
│   │   ├── workflows/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx     # Canvas builder
│   │   ├── automations/page.tsx
│   │   ├── terminal/page.tsx
│   │   ├── marketplace/page.tsx
│   │   ├── integrations/page.tsx
│   │   ├── logs/page.tsx
│   │   ├── analytics/page.tsx
│   │   ├── billing/page.tsx
│   │   ├── api-keys/page.tsx
│   │   ├── team/page.tsx
│   │   └── settings/page.tsx
│   ├── api/                      # Next.js BFF API routes
│   └── globals.css
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── TopNavbar.tsx
│   │   ├── CommandPalette.tsx
│   │   ├── StatusBar.tsx
│   │   └── NotificationSystem.tsx
│   ├── ui/                       # shadcn/ui extensions
│   ├── agents/
│   │   ├── AgentCard.tsx
│   │   ├── AgentStatusBadge.tsx
│   │   ├── AgentCreateWizard.tsx
│   │   └── AgentGraph.tsx
│   ├── swarms/
│   ├── workflows/
│   │   ├── WorkflowCanvas.tsx
│   │   ├── BlockInspector.tsx
│   │   └── blocks/              # One file per block type
│   ├── charts/
│   │   ├── UsageAreaChart.tsx
│   │   ├── RevenueBarChart.tsx
│   │   └── Sparkline.tsx
│   ├── terminal/
│   │   └── TerminalPane.tsx
│   ├── ai-assistant/
│   │   └── AssistantPanel.tsx
│   └── shared/
│       ├── EmptyState.tsx
│       ├── LoadingSkeleton.tsx
│       ├── GlassPanel.tsx
│       └── TokenUsageMeter.tsx
├── lib/
│   ├── api/                      # Typed API client
│   ├── hooks/                    # useAgents, useSwarms, useLogs...
│   ├── stores/                   # Zustand store slices
│   └── utils/
├── types/                        # Shared TypeScript types
└── public/
```

### 18.3 API-Ready Hook Pattern

```tsx
// lib/hooks/useAgents.ts
export function useAgents(filters: AgentFilters) {
  return useQuery({
    queryKey:        ['agents', filters],
    queryFn:         () => api.agents.list(filters),
    staleTime:       30_000,
    refetchInterval: 15_000,   // live polling every 15s
  });
}

export function useCreateAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAgentInput) => api.agents.create(data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['agents'] }),
  });
}
```

### 18.4 Real-time Data Strategy

```
Agent activity feed    WebSocket   ws://api/v1/stream/activity
Log streaming          SSE         EventSource /api/v1/logs/stream
Live metric charts     Polling     TanStack Query, 15s interval
Terminal              WebSocket   xterm.js attach addon
AI assistant chat      Streaming   fetch() + ReadableStream
Deployment status      WebSocket   ws://api/v1/deployments/watch
```

### 18.5 Performance Budget

```
First Contentful Paint   < 1.2s
Largest Contentful Paint < 2.0s
Time to Interactive      < 2.8s
Cumulative Layout Shift  < 0.05
Bundle size (initial)    < 180 kB gzipped
```

Strategies: route-based code splitting, React Server Components for static sections, `<Suspense>` boundaries per panel, `next/dynamic` for heavy libs (React Flow, xterm.js, Recharts).

---

*End of AgentOS UI/UX Design Document — v1.0*
