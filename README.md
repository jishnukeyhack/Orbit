<div align="center">

<br/>

<img src="https://img.shields.io/badge/version-0.1.0-6366f1?style=for-the-badge&labelColor=0B0F19" alt="Version"/>
<img src="https://img.shields.io/badge/Next.js-16.2.6-000000?style=for-the-badge&logo=next.js&logoColor=white&labelColor=0B0F19" alt="Next.js"/>
<img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white&labelColor=0B0F19" alt="TypeScript"/>
<img src="https://img.shields.io/badge/OpenSwarm-0.4.4-7B61FF?style=for-the-badge&labelColor=0B0F19" alt="OpenSwarm"/>
<img src="https://img.shields.io/badge/agents-210+-4F8CFF?style=for-the-badge&labelColor=0B0F19" alt="Agents"/>
<img src="https://img.shields.io/badge/license-MIT-22C55E?style=for-the-badge&labelColor=0B0F19" alt="License"/>

<br/><br/>

```
 ██████╗ ██████╗ ██████╗ ██╗████████╗
██╔═══██╗██╔══██╗██╔══██╗██║╚══██╔══╝
██║   ██║██████╔╝██████╔╝██║   ██║   
██║   ██║██╔══██╗██╔══██╗██║   ██║   
╚██████╔╝██║  ██║██████╔╝██║   ██║   
 ╚═════╝ ╚═╝  ╚═╝╚═════╝ ╚═╝   ╚═╝  
```

### **Orchestrating Autonomous Intelligence Into Action**

*A next-generation AI Agent Infrastructure Platform — create, deploy, orchestrate,*  
*monitor, and run 210+ specialized AI agents from a single unified dashboard.*

<br/>

[**Live Demo**](#-deployed-link) · [**Quick Start**](#-quick-start) · [**Architecture**](#-architecture) · [**Agent Registry**](#-agent-registry) · [**Contributing**](#-contributing)

<br/>

</div>

---

## ⬡ What is Orbit?

**Orbit** is a full-stack autonomous AI agent infrastructure platform. It combines a beautiful enterprise-grade **Next.js dashboard** (`project-orbit-app`) with a powerful **multi-agent orchestration engine** (`OpenSwarm`) and a curated library of **210+ specialized agent system prompts** (`agency-agents`).

Think of it as your mission control for AI — where every agent, swarm, workflow, and task is visible, controllable, and deployable from one place.

> *Design philosophy: "A fusion of Google Stitch, OpenAI, Vercel, Linear, and Stripe — built specifically for autonomous AI agents."*

---

## 🚀 Deployed Link

> **🔗 Coming Soon**  
> Authentication is planned for a future release. The deployment link will be updated here once live.

```
Production:   https://orbit.yourdomain.com       ← will be added here
Staging:      https://orbit-staging.yourdomain.com
```

---

## ✨ Feature Overview

<table>
<tr>
<td width="50%">

### 🧠 Agent Infrastructure
- **210+ specialized agents** across 15 categories
- Live agent execution with streaming output
- Real-time token tracking and cost estimation
- Multi-model support: Claude, GPT, Codex, Gemma, local
- Agent-to-agent memory sharing

</td>
<td width="50%">

### ⚡ Orchestration Engine
- Worker → Reviewer pipeline (Pair Programming model)
- Autonomous task scheduler (cron-based, every 15 min)
- Task decomposition with Planner Agent
- Quality gates, BS detector, uncertainty detection
- PR auto-improvement with cooldown system

</td>
</tr>
<tr>
<td width="50%">

### 🖥️ Enterprise Dashboard
- Stitch-style animated aurora landing page
- 16 app pages: Dashboard, Agents, Swarms, Workflows, Terminal...
- Floating AI Assistant copilot panel
- Real-time logs, metrics, and distributed traces
- NLP-powered terminal with AI shell assistant

</td>
<td width="50%">

### 🔗 Integrations & Triggers
- **Discord bot** — receive tasks via chat
- **Linear** — bidirectional issue sync
- **GitHub** — PR processor and CI worker
- GraphQL API for external tool access
- WebSocket + SSE streaming throughout

</td>
</tr>
</table>

---

## 🗂️ Repository Structure

```
Orbit/
├── project-orbit-app/                  ← Next.js 16 dashboard (main UI)
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx                ← Landing page (aurora wave animation)
│   │   │   ├── (app)/                  ← Authenticated app shell
│   │   │   │   ├── dashboard/          ← KPI cards, agent graph, activity feed
│   │   │   │   ├── agents/             ← 210+ agent registry, run modal
│   │   │   │   ├── swarms/             ← Multi-agent orchestration UI
│   │   │   │   ├── workflows/          ← Visual workflow builder
│   │   │   │   ├── pipeline/           ← Live pipeline execution view
│   │   │   │   ├── terminal/           ← NLP-powered web terminal
│   │   │   │   ├── marketplace/        ← Agent discovery & install
│   │   │   │   ├── integrations/       ← Connect external services
│   │   │   │   ├── logs/               ← Streaming log viewer
│   │   │   │   ├── analytics/          ← Usage charts and metrics
│   │   │   │   ├── deployments/        ← Deployment status tracker
│   │   │   │   ├── automations/        ← Automation rules manager
│   │   │   │   ├── billing/            ← Plan and usage management
│   │   │   │   ├── api-keys/           ← API key management
│   │   │   │   ├── team/               ← Team workspace
│   │   │   │   └── settings/           ← Platform settings
│   │   │   └── api/                    ← Next.js BFF API routes
│   │   │       ├── agents/             ← GET list, POST run, GET by id
│   │   │       ├── pipeline/           ← Pipeline + streaming SSE
│   │   │       ├── swarms/             ← Swarm orchestration
│   │   │       ├── workflow/           ← Workflow CRUD + execution
│   │   │       ├── terminal/           ← PTY + NLP terminal
│   │   │       ├── memory/             ← Memory read/write/search
│   │   │       ├── chat/               ← AI assistant streaming
│   │   │       ├── decision/           ← Decision engine
│   │   │       └── status/             ← System health endpoint
│   │   ├── components/
│   │   │   ├── landing/WaveCanvas.tsx  ← Aurora wave animation (canvas)
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.tsx         ← Collapsible nav (240px / 64px)
│   │   │   │   ├── TopNavbar.tsx       ← Search, AI command bar, profile
│   │   │   │   └── StatusBar.tsx       ← System health strip
│   │   │   └── ai-assistant/
│   │   │       └── AssistantPanel.tsx  ← Floating copilot panel
│   │   └── lib/
│   │       ├── openswarm/
│   │       │   ├── agentRegistry.ts    ← Loads 210+ .md agent definitions
│   │       │   ├── agentRunner.ts      ← Executes agents via Claude API
│   │       │   ├── agenticLoop.ts      ← Autonomous execution loop
│   │       │   ├── decisionEngine.ts   ← Task routing and decisions
│   │       │   ├── memoryEngine.ts     ← Agent memory (SQLite)
│   │       │   ├── nlpTerminal.ts      ← Natural language → CLI
│   │       │   ├── pipelineEngine.ts   ← Worker/Reviewer pipeline
│   │       │   ├── swarmOrchestrator.ts← Multi-agent coordination
│   │       │   ├── streamingChat.ts    ← SSE streaming responses
│   │       │   ├── workflow.ts         ← Workflow execution engine
│   │       │   └── types.ts            ← Shared TypeScript types
│   │       └── server/
│   │           ├── llm.ts              ← Anthropic SDK wrapper
│   │           ├── db.ts               ← SQLite (better-sqlite3)
│   │           ├── tools.ts            ← Tool definitions
│   │           └── terminalServer.ts   ← PTY WebSocket server
│
├── Project_Orbit/
│   └── AgentFarm/AgentFarm/
│       ├── OpenSwarm-main/             ← Agent orchestration engine
│       │   └── src/
│       │       ├── adapters/           ← claude / codex / gpt / local
│       │       ├── agents/             ← worker, reviewer, auditor, tester...
│       │       ├── automation/         ← autonomous runner, scheduler, PR processor
│       │       ├── discord/            ← Discord bot integration
│       │       ├── linear/             ← Linear issue sync
│       │       ├── orchestration/      ← Task parser, conflict detector, workflow
│       │       ├── memory/             ← LanceDB vector memory + compaction
│       │       ├── knowledge/          ← Code graph, repository scanner
│       │       └── issues/             ← SQLite issue store + GraphQL
│       └── agency-agents-main/         ← 210+ agent system prompt library
│           ├── engineering/            ← 30+ agents (AI Engineer, DevOps, SRE...)
│           ├── marketing/              ← 28+ agents (SEO, TikTok, LinkedIn...)
│           ├── design/                 ← 8 agents (UI Designer, UX Researcher...)
│           ├── finance/                ← 5 agents (Analyst, Tax Strategist...)
│           ├── sales/                  ← 8 agents (Coach, Deal Strategist...)
│           ├── product/                ← 5 agents (PM, Sprint Prioritizer...)
│           ├── strategy/               ← Multi-phase playbooks + runbooks
│           ├── specialized/            ← 30+ vertical agents (Legal, Healthcare...)
│           ├── game-development/       ← Unity, Unreal, Godot, Roblox agents
│           ├── spatial-computing/      ← visionOS, XR, Metal agents
│           ├── testing/                ← 8 agents (API Tester, Accessibility...)
│           ├── support/                ← 6 agents (Reporter, Finance Tracker...)
│           ├── academic/               ← 5 agents (Historian, Psychologist...)
│           └── paid-media/             ← 7 agents (PPC, Programmatic...)
│
├── agentos/                            ← Standalone AgentOS Next.js scaffold
└── .gitignore
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    project-orbit-app (Next.js 16)                   │
│                                                                     │
│  Landing Page (aurora wave)  →  App Shell (Sidebar + Navbar)        │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────────┐  │
│  │ Agents   │  │ Swarms   │  │Workflows │  │ Terminal (NLP+PTY)  │  │
│  │ Registry │  │Orchestr. │  │ Builder  │  │  nlpTerminal.ts    │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────────────────┘  │
│       │              │              │                                 │
│  ┌────▼──────────────▼──────────────▼──────────────────────────┐    │
│  │                   lib/openswarm/                             │    │
│  │  agentRunner → agenticLoop → pipelineEngine → streamingChat │    │
│  │  decisionEngine → swarmOrchestrator → memoryEngine          │    │
│  └────────────────────────────┬────────────────────────────────┘    │
│                               │ Anthropic API (claude-sonnet-4)     │
└───────────────────────────────┼─────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────┐
│                  OpenSwarm Engine (@intrect/openswarm 0.4.4)         │
│                                                                     │
│  Triggers:  Discord Bot  ←→  Linear Issues  ←→  GitHub PRs          │
│                                                                     │
│  Pipeline:  [Task] → [Planner] → [Worker] → [Reviewer] → [Commit]   │
│                                                                     │
│  Adapters:  claude | codex | gpt | local (Ollama/LMStudio/llama.cpp)│
│                                                                     │
│  Memory:    LanceDB (vector) + SQLite (task state + issues)         │
│  Knowledge: Code graph scanner + repository analyzer                │
│                                                                     │
│  Guards:    qualityGate | fakeDataGuard | conventionalCommits        │
│             branchValidation | uncertaintyDetection | bsDetector    │
└─────────────────────────────────────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────┐
│            agency-agents  (210+ system prompt library)               │
│                                                                     │
│  Each .md file = YAML frontmatter + full system prompt               │
│  agentRegistry.ts parses and serves them via /api/agents            │
└─────────────────────────────────────────────────────────────────────┘
```

### How an Agent Task Flows End-to-End

```
1. Trigger arrives        Discord message / Linear issue / GitHub PR / Dashboard "Run"
2. Task parsed            orchestration/taskParser.ts extracts title, description, labels
3. Skill matched          agentRegistry.ts → finds matching .md system prompt by category
4. Worker invoked         pipelineEngine.ts → agentRunner.ts → Anthropic API (streaming)
5. Output reviewed        reviewer.ts → local Gemma (free) or Claude Sonnet (escalation)
6. Quality gates          pipelineGuards.ts → bsDetector, fakeDataGuard, conventionalCommits
7. Committed              git commit → PR opened → Linear status updated → Discord notified
```

---

## 🎨 Design System

The UI is built on a premium dark design system — no third-party component library, all custom:

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-base` | `#0B0F19` | Page background |
| `--bg-surface` | `#111827` | Sidebar, panels |
| `--bg-card` | `#151B2E` | Cards, modals |
| `--accent-blue` | `#4F8CFF` | Primary actions, active states |
| `--accent-cyan` | `#00D4FF` | Live indicators, highlights |
| `--accent-purple` | `#7B61FF` | Secondary accents, swarms |
| `--text-primary` | `#F9FAFB` | Headings, primary content |
| `--text-secondary` | `#94A3B8` | Body copy, labels |
| `--status-success` | `#22C55E` | Running, completed |
| `--status-warning` | `#F59E0B` | Retrying, warnings |
| `--status-error` | `#EF4444` | Failed, errors |

**Typography:** Geist → Inter → system-ui · **Mono:** Geist Mono → JetBrains Mono

**Landing Page:** 4-layer animated aurora background (canvas bezier waves with lissajous oscillation) + CSS dot-grid + radial vignette — inspired by Google Stitch.

---

## 🤖 Agent Registry

All **210+ agents** live in `agency-agents-main/` as Markdown files with YAML frontmatter. The `agentRegistry.ts` parses them at runtime and serves them via `/api/agents`.

Each agent file follows this format:

```markdown
---
name: AI Engineer
description: Builds and fine-tunes ML models, LLM integrations, and AI pipelines
color: blue
emoji: 🤖
vibe: Trains models. Ships pipelines. Tunes prompts until they sing.
---

# AI Engineer Agent

You are an expert AI/ML engineer...
```

### Agent Categories

| Category | Count | Example Agents |
|----------|-------|----------------|
| 🔧 **Engineering** | 30+ | AI Engineer, Backend Architect, DevOps Automator, SRE, Code Reviewer, Hermes Agent, OpenClaw |
| 📢 **Marketing** | 28+ | SEO Specialist, TikTok Strategist, LinkedIn Creator, Reddit Builder, ASO |
| 🎨 **Design** | 8 | UI Designer, UX Architect, Brand Guardian, Visual Storyteller |
| 💰 **Finance** | 5 | Financial Analyst, FP&A Analyst, Tax Strategist, Investment Researcher |
| 💼 **Sales** | 8 | Sales Coach, Deal Strategist, Outbound Strategist, Pipeline Analyst |
| 📦 **Product** | 5 | Product Manager, Sprint Prioritizer, Trend Researcher, Feedback Synthesizer |
| 📣 **Paid Media** | 7 | PPC Strategist, Programmatic Buyer, Tracking Specialist |
| 🎮 **Game Dev** | 16 | Unity Architect, Unreal Engineer, Godot Scripter, Roblox Designer |
| 🥽 **Spatial Computing** | 6 | visionOS Engineer, XR Developer, macOS Metal Engineer |
| 🔬 **Specialized** | 30+ | Legal, Healthcare, Blockchain, Real Estate, HR, Compliance |
| 🧪 **Testing** | 8 | API Tester, Accessibility Auditor, Performance Benchmarker |
| 🛟 **Support** | 6 | Analytics Reporter, Finance Tracker, Infrastructure Maintainer |
| 🎓 **Academic** | 5 | Historian, Psychologist, Anthropologist, Narratologist |
| ♟️ **Strategy** | Multi-phase playbooks | Phase 0–6: Discovery → Launch → Operate |
| 📋 **Project Mgmt** | 6 | Senior PM, Jira Steward, Studio Producer |

### Running an Agent from the Dashboard

1. Navigate to **Agents** page
2. Browse or search the registry (210+ agents shown in grid)
3. Click **▶ Run Task** on any agent card
4. Enter your task in the modal (supports Ctrl+Enter)
5. Watch the streaming output in real-time
6. See token count and cost on completion

---

## 📦 Tech Stack

### Dashboard — `project-orbit-app`

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2.6 (App Router, React 19) |
| Language | TypeScript 5.x |
| Styling | TailwindCSS 4 + CSS custom properties |
| Animation | Framer Motion 12 |
| State | Zustand 5 |
| Data Fetching | TanStack React Query 5 |
| Database | better-sqlite3 (memory, task state) |
| Real-time | WebSocket (`ws`) + SSE (ReadableStream) |
| Icons | Lucide React |
| AI | Anthropic SDK (via `lib/server/llm.ts`) |

### Orchestration Engine — `OpenSwarm`

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 22 + TypeScript (ESM) |
| CLI | Commander.js |
| Discord | discord.js |
| Linear | @linear/sdk |
| Vector Memory | LanceDB + @xenova/transformers |
| Relational | better-sqlite3 |
| GraphQL | graphql-yoga |
| Scheduler | croner |
| Validation | Zod |
| Testing | Vitest |

---

## ⚙️ Quick Start

### Prerequisites

```bash
node --version   # Need: v22+
git --version    # Need: 2.x+
```

You will also need:
- **Anthropic API key** — for agent execution ([get one here](https://console.anthropic.com))
- **Linear API key** — for issue-based task triggering (optional)
- **Discord Bot Token** — for Discord-based triggering (optional)

---

### 1. Clone the Repository

```bash
git clone https://github.com/jishnukeyhack/Orbit.git
cd Orbit
```

---

### 2. Set Up the Dashboard (`project-orbit-app`)

```bash
cd project-orbit-app

# Install dependencies
npm install

# Create your environment file
cp .env.example .env.local
```

Add this to `.env.local`:

```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

Start the development server:

```bash
npm run dev
# Open http://localhost:3000
```

Build for production:

```bash
npm run build
npm run start
```

---

### 3. Set Up the Orchestration Engine (`OpenSwarm`)

```bash
cd Project_Orbit/AgentFarm/AgentFarm/OpenSwarm-main/OpenSwarm-main

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

Edit `.env` with your real values:

```env
# Required for Discord triggering
DISCORD_TOKEN=your_discord_bot_token
DISCORD_CHANNEL_ID=your_channel_id
DISCORD_ALLOWED_USERS=your_discord_user_id

# Required for Linear triggering
LINEAR_API_KEY=lin_api_xxxxxxxxxxxxxxxxxxxxxxxx
LINEAR_TEAM_ID=00000000-0000-0000-0000-000000000000
```

Copy and configure `config.yaml`:

```bash
cp config.example.yaml config.yaml
```

Key settings in `config.yaml`:

```yaml
adapter: claude          # claude | codex | gpt | local

autonomous:
  enabled: true
  schedule: "*/15 * * * *"    # Every 15 minutes
  maxConcurrentTasks: 4

  defaultRoles:
    worker:
      adapter: claude
      model: claude-sonnet-4-20250514
    reviewer:
      adapter: local           # Free — uses local Gemma via LMStudio
      model: gemma-4-e4b-it
```

Start the engine:

```bash
# Development mode
npm run dev

# Production (runs as daemon)
npm start

# Or install as system service (macOS)
./scripts/install-service.sh
```

---

### 4. (Optional) Local Model for Free Reviews

OpenSwarm's reviewer defaults to **Gemma 4 via LMStudio** — making code review completely free.

```bash
# Install LMStudio from https://lmstudio.ai
# Download: gemma-4-e4b-it model
# Start the local server on port 1234 (LMStudio default)
```

The config already has this wired:

```yaml
reviewer:
  adapter: local
  model: gemma-4-e4b-it
```

---

### 5. Running Agents from the CLI (OpenSwarm)

```bash
# Create and deploy a task
npx openswarm task create \
  --title "Build REST API for user auth" \
  --agent ai-engineer

# Check system status
npx openswarm status

# View running agents
npx openswarm agent list

# Check token usage
npx openswarm usage --period=7d
```

---

## 🔌 Integrations

### Discord

Invite your bot to a Discord server and set `DISCORD_CHANNEL_ID`. Any message in the channel triggers an agent task:

```
You: Build me a TypeScript utility that debounces async functions

→ OpenSwarm picks up the message
→ Matches to best agent (engineering-senior-developer.md)
→ Worker runs with Claude Sonnet
→ Reviewer checks with local Gemma
→ Commits to your project repo
→ Discord: "✓ Task complete. PR: github.com/your/repo/pull/42"
```

### Linear

Set `LINEAR_API_KEY` and `LINEAR_TEAM_ID`. OpenSwarm polls Linear every 15 minutes for new issues. Assign an issue to Orbit and it will:

- Pick it up automatically
- Match the best agent by issue labels
- Execute, review, and commit
- Update the Linear issue status to `Done`

### GitHub

Add repositories to `config.yaml`:

```yaml
github:
  repos:
    - yourusername/your-repo
  checkInterval: 300000    # 5 minutes
```

OpenSwarm monitors PRs and auto-improves them through Worker → Reviewer cycles.

---

## 🖥️ Application Pages

| Page | Route | Description |
|------|-------|-------------|
| **Landing** | `/` | Aurora wave animation, hero, feature pills, stats |
| **Dashboard** | `/dashboard` | KPI cards, agent activity feed, agent graph, AI suggestions |
| **Agents** | `/agents` | 210+ agent registry with search, filter, run modal |
| **Swarms** | `/swarms` | Multi-agent orchestration canvas (React Flow) |
| **Workflows** | `/workflows` | Visual workflow builder with 14 block types |
| **Pipeline** | `/pipeline` | Live Worker → Reviewer pipeline execution view |
| **Terminal** | `/terminal` | NLP-powered web terminal with AI shell assistant |
| **Marketplace** | `/marketplace` | Agent discovery, ratings, categories |
| **Integrations** | `/integrations` | Connect Slack, GitHub, Linear, Discord, and more |
| **Logs** | `/logs` | Streaming log viewer with level filtering |
| **Analytics** | `/analytics` | Usage charts, token consumption, success rates |
| **Deployments** | `/deployments` | Deployment status and history |
| **Automations** | `/automations` | Automation rules and triggers |
| **Billing** | `/billing` | Plan management, usage meters, payment history |
| **API Keys** | `/api-keys` | API key creation and management |
| **Team** | `/team` | Team workspace and member management |
| **Settings** | `/settings` | Platform configuration |

---

## 🔐 Authentication

> **Authentication is not yet implemented.**  
> It is planned for a future release. The deployment is currently open (no login required). When auth ships, this section will be updated with setup instructions for the chosen provider (likely NextAuth.js or Clerk).

The codebase is structured to receive auth at the `(app)/layout.tsx` level — a session check can be added there with minimal changes to existing pages.

---

## 📡 API Reference

All routes live under `/api/` in `project-orbit-app`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/agents` | List agents (filter by category, search, limit) |
| `GET` | `/api/agents/[id]` | Get single agent by ID |
| `POST` | `/api/agents/run` | Run agent task (returns SSE stream) |
| `GET` | `/api/pipeline` | Get pipeline state |
| `POST` | `/api/pipeline/stream` | Execute pipeline step (SSE) |
| `GET` | `/api/swarms` | List active swarms |
| `GET/POST` | `/api/workflow` | Workflow CRUD |
| `POST` | `/api/workflow/execute` | Execute a workflow |
| `POST` | `/api/terminal` | Execute terminal command |
| `POST` | `/api/terminal/nlp` | Natural language → terminal command |
| `GET/POST` | `/api/memory` | Read/write agent memory |
| `POST` | `/api/memory/search` | Semantic memory search |
| `POST` | `/api/chat` | AI assistant chat (streaming) |
| `POST` | `/api/decision` | Decision engine query |
| `GET` | `/api/status` | System health check |

### Example: Running an Agent

```bash
curl -X POST http://localhost:3000/api/agents/run \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "engineering-ai-engineer",
    "task": "Write a Python function that implements exponential backoff retry"
  }'
```

Response is a **Server-Sent Events stream**:

```
data: {"type":"chunk","data":{"text":"Here is a Python implementation..."}}
data: {"type":"tool","data":{"name":"code_execution"}}
data: {"type":"done","data":{"tokens":847,"cost":0.0021}}
```

---

## 🧪 Development

### Running Tests (OpenSwarm)

```bash
cd Project_Orbit/AgentFarm/AgentFarm/OpenSwarm-main/OpenSwarm-main
npm test              # Run all tests
npm run test:watch    # Watch mode
```

Test files are co-located with source:

```
src/agents/worker.test.ts
src/agents/reviewer.test.ts
src/agents/agentPair.test.ts
src/adapters/codex.test.ts
src/core/config.test.ts
```

### Linting & Type Checking

```bash
# Dashboard
cd project-orbit-app
npm run lint
npx tsc --noEmit

# OpenSwarm
cd Project_Orbit/AgentFarm/AgentFarm/OpenSwarm-main/OpenSwarm-main
npm run lint
npx tsc --noEmit
```

### Adding a New Agent

Create a new `.md` file in the appropriate category folder:

```bash
# Example: new engineering agent
touch Project_Orbit/AgentFarm/AgentFarm/agency-agents-main/agency-agents-main/engineering/engineering-my-new-agent.md
```

Use this template:

```markdown
---
name: My New Agent
description: One-line description of what this agent does
color: blue
emoji: 🔧
vibe: Short punchy phrase that captures the agent's personality.
---

# My New Agent

You are an expert [role]. Your primary goal is to [goal].

## Core Responsibilities

- [Responsibility 1]
- [Responsibility 2]

## Operating Principles

1. Always [principle 1]
2. Never [principle 2]
```

The agent appears in the dashboard immediately — no code changes needed. `agentRegistry.ts` reads all `.md` files dynamically.

### Environment Variables Reference

**`project-orbit-app/.env.local`**

```env
ANTHROPIC_API_KEY=          # Required — Claude API key for agent execution
```

**`OpenSwarm/.env`**

```env
DISCORD_TOKEN=              # Discord bot token
DISCORD_CHANNEL_ID=         # Channel to listen on
DISCORD_ALLOWED_USERS=      # Comma-separated user IDs
DISCORD_WEBHOOK_URL=        # Optional rich notifications

LINEAR_API_KEY=             # Linear personal API key
LINEAR_TEAM_ID=             # Linear team UUID

OPENAI_CLIENT_ID=           # Optional — for Codex adapter OAuth
OPENSWARM_TASK_STATE_FILE=  # Optional — custom task state path
```

---

## 🐳 Docker

OpenSwarm ships with Docker support:

```bash
cd Project_Orbit/AgentFarm/AgentFarm/OpenSwarm-main/OpenSwarm-main

# Build and run with Docker Compose
docker compose up --build

# Or standalone
docker build -t openswarm .
docker run -d \
  -e DISCORD_TOKEN=your_token \
  -e LINEAR_API_KEY=your_key \
  -v $(pwd)/config.yaml:/app/config.yaml \
  openswarm
```

---

## 🗺️ Roadmap

- [x] Landing page with aurora wave animation
- [x] 210+ agent system prompt library
- [x] Next.js dashboard with 16 app pages
- [x] OpenSwarm orchestration engine (Worker → Reviewer pipeline)
- [x] Discord and Linear integrations
- [x] Floating AI assistant panel
- [x] NLP-powered web terminal
- [x] Streaming agent execution
- [x] SQLite memory engine
- [x] LanceDB vector memory
- [ ] **Authentication** (NextAuth.js / Clerk — planned)
- [ ] Deployed production link
- [ ] Hermes-Agent integration (NousResearch/hermes-agent)
- [ ] OpenClaw skill integration (openclaw/clawhub)
- [ ] Real-time WebSocket dashboard updates
- [ ] Agent marketplace with ratings and installs
- [ ] Team collaboration features
- [ ] Usage-based billing integration
- [ ] Mobile responsive polish

---

## 🤝 Contributing

Contributions are welcome — especially new agent system prompts!

```bash
# 1. Fork and clone
git clone https://github.com/YOUR_USERNAME/Orbit.git
cd Orbit

# 2. Create a feature branch
git checkout -b feat/your-feature-name

# 3. Make your changes
# For new agents: add .md file to the right category in agency-agents-main/
# For UI changes: work in project-orbit-app/src/
# For engine changes: work in OpenSwarm-main/src/

# 4. Commit using conventional commits
git commit -m "feat: add healthcare-appointment-scheduler agent"

# 5. Push and open a PR
git push origin feat/your-feature-name
```

### Commit Message Format

```
feat:     new feature
fix:      bug fix
chore:    maintenance, dependency updates
docs:     documentation
refactor: code restructuring without behavior change
test:     adding or updating tests
```

---

## 📄 License

```
MIT License

Copyright (c) 2025 Jishnu Chauhan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
```

---

## 🙏 Acknowledgements

Orbit is built on the shoulders of incredible open-source projects:

| Project | What it powers |
|---------|----------------|
| [OpenSwarm](https://github.com/intrect/openswarm) | Core orchestration engine (Worker → Reviewer pipeline) |
| [agency-agents](https://github.com/agency-swarm/agency-agents) | 210+ specialized agent system prompts |
| [Anthropic Claude](https://anthropic.com) | Primary AI model for agent execution |
| [Next.js](https://nextjs.org) | Full-stack React framework |
| [LanceDB](https://lancedb.com) | Vector database for agent memory |
| [discord.js](https://discord.js.org) | Discord bot integration |
| [Linear SDK](https://linear.app) | Issue tracking integration |

---

<div align="center">

<br/>

**Built by [Jishnu Chauhan](https://github.com/jishnukeyhack)**

<br/>

*If this project helped you, consider giving it a ⭐ on GitHub*

<br/>

[![GitHub](https://img.shields.io/badge/GitHub-jishnukeyhack%2FOrbit-181717?style=for-the-badge&logo=github&labelColor=0B0F19)](https://github.com/jishnukeyhack/Orbit)

</div>
