// ============================================================================
// Orbit — Specialized AI Agent Domain Knowledge Libraries
// Provides high-fidelity, real-world documentation for agent categories
// Supports keyword searches and context extraction to populate agent brains
// ============================================================================

export interface KnowledgeDocument {
  id: string;
  title: string;
  category: string;
  content: string;
  source: string;
  tags: string[];
}

const KNOWLEDGE_DB: KnowledgeDocument[] = [
  // ─── ENGINEERING KNOWLEDGE ────────────────────────────────────────────────
  {
    id: 'rust-concurrency-async',
    title: 'Rust High-Performance Async Concurrency Manual',
    category: 'engineering',
    source: 'Orbit Engineering Standards v2.4',
    tags: ['rust', 'async', 'tokio', 'concurrency'],
    content: `## Rust Asynchronous Concurrency Patterns

This guide outlines the production standards for building high-concurrency systems using Rust and the \`tokio\` runtime.

### 1. The Tokio Runtime Architecture
Tokio relies on a multi-threaded scheduler using a work-stealing algorithm:
- **Worker Threads**: Equal to the number of logical CPUs by default.
- **Task Queues**: Each worker thread maintains a local run queue. Tasks are scheduled locally first, avoiding global mutex contention.
- **Work Stealing**: Idle threads steal tasks from the back of other workers' local queues.

### 2. Guarding Shared State
Avoid standard std mutexes in async blocks to prevent blocking threads. Always use Tokio-aware synchronizations:
\`\`\`rust
use tokio::sync::Mutex;
use std::sync::Arc;

struct AppState {
    counter: Mutex<u64>,
}

async fn handle_request(state: Arc<AppState>) {
    // Correct async mutex locking
    let mut lock = state.counter.lock().await;
    *lock += 1;
}
\`\`\`

### 3. Graceful Task Cancellation
Tasks in Rust are cancelled by dropping their futures. Ensure resource cleanups are handled through the \`Drop\` trait or explicit cancellation channels:
\`\`\`rust
use tokio::sync::oneshot;

async fn monitor_job(mut shutdown: oneshot::Receiver<()>) {
    tokio::select! {
        _ = async_work() => {
            println!("Work finished!");
        }
        _ = &mut shutdown => {
            println!("Shutdown signal received, cleaning up temporary resources...");
        }
    }
}
\`\`\`
`
  },
  {
    id: 'react-19-server-actions',
    title: 'React 19 & Next.js App Router Architecture Guide',
    category: 'engineering',
    source: 'Frontend Architecture Manual',
    tags: ['react', 'nextjs', 'server-actions', 'typescript'],
    content: `## React 19 and Next.js App Router Architecture

This guide covers optimal patterns for designing components and handling mutations in React 19.

### 1. Server vs Client Component Boundaries
- **Server Components (RSC)**: Fetch data directly inside async functions, access environment variables safely, and render static elements without client-side bundle weight.
- **Client Components**: Intercept user events, manage local interactive states (\`useState\`, \`useReducer\`), and hook into browser APIs. Demarcated via \`"use client"\`.

### 2. React 19 Server Actions & Mutations
Handle form submissions and database mutations without manual fetch client pipelines:
\`\`\`typescript
// src/app/actions.ts
"use server";

import { revalidatePath } from 'next/cache';

export async function createWorkspaceRecord(formData: FormData) {
  const name = formData.get("workspaceName") as string;
  if (!name || name.length < 3) {
    throw new Error("Invalid workspace name");
  }
  
  // Write to database
  await db.workspace.create({ data: { name } });
  revalidatePath('/workspace');
}
\`\`\`

### 3. Form Transitions with \`useActionState\`
Provide optimistic visual state updates and direct error bindings on mutations:
\`\`\`tsx
"use client";

import { useActionState } from 'react';
import { createWorkspaceRecord } from './actions';

export function WorkspaceForm() {
  const [state, formAction, isPending] = useActionState(createWorkspaceRecord, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input name="workspaceName" type="text" className="bg-[#0b0f19] border border-gray-800" />
      <button type="submit" disabled={isPending} className="bg-indigo-600 px-4 py-2 text-white">
        {isPending ? 'Deploying...' : 'Deploy Workspace'}
      </button>
      {state && <p className="text-red-500">{state}</p>}
    </form>
  );
}
\`\`\`
`
  },

  // ─── MARKETING KNOWLEDGE ──────────────────────────────────────────────────
  {
    id: 'seo-ranking-algorithms',
    title: 'Modern SEO Heuristics & Search Engine Optimization Specs',
    category: 'marketing',
    source: 'Orbit Growth Playbook v1.9',
    tags: ['seo', 'growth', 'ctr', 'web-vitals'],
    content: `## Search Engine Ranking Algorithms & SEO Standards

This document establishes critical specifications for technical SEO and content indexing procedures.

### 1. Technical Core Web Vitals (CWV)
Core Web Vitals measure the page experience metrics of a website:
- **Largest Contentful Paint (LCP)**: Measures loading performance. Target: **<= 2.5s**.
- **Interaction to Next Paint (INP)**: Measures responsiveness to user input. Target: **<= 200ms**.
- **Cumulative Layout Shift (CLS)**: Measures visual stability. Target: **<= 0.1**.

### 2. Semantic Schema Markup & JSON-LD
Inject rich schema graphs directly in document headers to boost structured search queries:
\`\`\`html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Orbit AI",
  "operatingSystem": "All",
  "applicationCategory": "DeveloperApplication",
  "offers": {
    "@type": "Offer",
    "price": "49.00",
    "priceCurrency": "USD"
  }
}
</script>
\`\`\`

### 3. Optimizing Click-Through Rates (CTR)
- **Title Tag Syntax**: Focus keyword at the beginning, followed by brand. Keep within 50-60 characters.
- **Meta Description Boundaries**: Keep between 120-155 characters. Must contain a persuasive call-to-action (CTA).
- **Heading Hierarchies**: Single \`<h1>\` containing target phrase, nested under subheadings \`<h2>\` to \`<h4>\` with perfect semantics.
`
  },

  // ─── FINANCE KNOWLEDGE ────────────────────────────────────────────────────
  {
    id: 'saas-metrics-valuation',
    title: 'SaaS Finance & Growth Valuation Standards',
    category: 'finance',
    source: 'SaaS Financial Intelligence Manual',
    tags: ['saas', 'finance', 'mrr', 'cac', 'ltv'],
    content: `## SaaS Financial Metrics and Valuation Standards

This guide covers SaaS business model standards, revenue metrics, and unit economics calculations.

### 1. Key Revenue Dimensions
- **MRR (Monthly Recurring Revenue)**: Core recurring subscription component.
- **ARR (Annual Recurring Revenue)**: \`MRR * 12\`. Represents software contract values.
- **NRR (Net Revenue Retention)**: Measures growth from existing customers. Target: **>= 110%** for SMB, **>= 120%** for Enterprise.
  \`\`\`
  NRR = [(Ending MRR from Existing Customers - Churn + Expansion) / Starting MRR] * 100
  \`\`\`

### 2. Unit Economics calculations
- **CAC (Customer Acquisition Cost)**: Total marketing and sales spend divided by new customer cohorts.
- **LTV (Lifetime Value)**: Gross Margin MRR divided by user churn rate.
- **LTV:CAC Ratio**: Target is **>= 3.0x**.
- **CAC Payback Period**: Target is **<= 12 months** for SMB, **<= 18 months** for Enterprise.

### 3. SaaS Valuation Multiples
SaaS businesses are valued primarily on multiples of ARR:
- **High-Growth Bracket (>= 40% YoY)**: 8x to 15x ARR multiple.
- **Rule of 40**: A SaaS company's growth rate plus its profit margin should equal or exceed **40%**.
`
  },

  // ─── DESIGN & PRODUCT KNOWLEDGE ───────────────────────────────────────────
  {
    id: 'design-tokens-glassmorphism',
    title: 'Orbit Premium Glassmorphism & Visual Aesthetics Tokens',
    category: 'design',
    source: 'Orbit Design System Specs',
    tags: ['design', 'css', 'glassmorphism', 'aesthetics'],
    content: `## Orbit Design Aesthetics & Glassmorphism Tokens

This specification details standard variables and visual properties used to deliver a state-of-the-art dark UI.

### 1. Main Palette Tokens
- **Background Matte Primary**: \`#040814\` (Sleek deep obsidian space).
- **Surface Matte Secondary**: \`#090d19\` (Elevation layer).
- **Active Border Glow**: \`rgba(99, 102, 241, 0.15)\` (Tailored indigo).
- **Text Primary Accent**: \`#f8fafc\` (Pure slate white).

### 2. Glassmorphism Design Specs
Apply glass layers safely on nested views without causing render lag:
\`\`\`css
.premium-glass-card {
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  border-radius: 16px;
}
\`\`\`

### 3. Visual Transitions and Hover Micro-Animations
Interactive buttons should always implement bezier transitions:
- **Hover scale**: Scale components slightly up (\`scale(1.025)\`) over **180ms** with ease-out beziers.
- **Tailored Borders**: Scale borders from 5% opacity to 25% opacity dynamically on mouse entrance.
`
  }
];

export function getKnowledgeForCategory(category: string): KnowledgeDocument[] {
  return KNOWLEDGE_DB.filter(doc => doc.category === category);
}

export function searchKnowledge(query: string, category?: string): KnowledgeDocument[] {
  const q = query.toLowerCase().trim();
  if (!q) return category ? getKnowledgeForCategory(category) : KNOWLEDGE_DB;

  return KNOWLEDGE_DB.filter(doc => {
    if (category && doc.category !== category) return false;
    
    return (
      doc.title.toLowerCase().includes(q) ||
      doc.content.toLowerCase().includes(q) ||
      doc.tags.some(tag => tag.toLowerCase().includes(q))
    );
  });
}

export function getDocumentById(id: string): KnowledgeDocument | null {
  return KNOWLEDGE_DB.find(doc => doc.id === id) ?? null;
}
