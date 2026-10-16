# Orbit — Agent Action Layer (added on `new_agents`)

The missing layer between the LLM engine (`src/lib/server/llm.ts`) and the
raw tools (`src/lib/server/tools.ts`) — Muse-style: the model proposes
tool calls, this layer decides whether and how they actually run.

## What was added

```
src/lib/action/
  types.ts         Risk levels, tool definitions, run context, results, audit/approval types
  validate.ts      Zero-dependency JSON-Schema argument validation
  registry.ts      ToolRegistry — schema + risk + implementation in ONE place
  policy.ts        permissive / balanced / strict modes, shell blocklist,
                   scrubbedEnv(), path sandbox, SSRF guard
  audit.ts         Audit sinks (memory, JSONL) with secret redaction
  executor.ts      lookup -> validate -> policy -> approval -> timeout ->
                   idempotency -> audit. Errors returned as data, never thrown.
  tools-orbit.ts   Orbit's existing tools registered with risk levels
                   (read_file/list_dir = read, write/edit/mkdir = write,
                   bash = execute) + new web_fetch and spawn_agent tools
  browser.ts       One real Chromium per run (Playwright), DOM-first perception
  tools-browser.ts browser_open / snapshot / click / fill / press /
                   screenshot / close — interact by text/label, not coordinates
  run.ts           runAgentWithActions() — a REAL agentic loop (replaces the
                   simulated openswarm/agenticLoop.ts) + orbitLLMClient()
  index.ts         Public surface
src/app/api/action/route.ts   POST /api/action — SSE, same shape as /api/agents/run
```

## Two small patches to existing files

1. `src/lib/server/llm.ts` — `callAgent` now accepts `messages` (multi-turn
   history) and returns the model's `tool_calls`. Without this, the OpenAI
   path built a single system+user exchange and threw tool calls away, so
   no loop could ever act. Legacy single-shot behaviour is unchanged when
   `messages` is omitted.
2. `src/lib/server/tools.ts` — the `bash` tool now runs with
   `scrubbedEnv()` instead of the full `process.env`, which previously
   exposed every API key in the environment to any command the model
   wrote (`env` alone would print them).

## Policy modes

| Risk | Tools | permissive | balanced (default) | strict |
|---|---|---|---|---|
| read | read_file, web_fetch, browser_open/snapshot | run | run | run |
| write | write_file, edit_file, mkdir | run | run | approval |
| execute | bash, browser_click/fill/press, spawn_agent | run | approval | approval |
| destructive | (future delete/git tools) | run | approval | approval |

Approvals are a callback supplied by your code — the model can never
approve its own calls. The headless `/api/action` route supplies none, so
approval-gated tools return `needs_approval` to the model instead of
running. Note: this branch's `REAL_TOOL_DEFINITIONS` exposes 6 tools
(read/write/edit file, bash, list_dir, mkdir); the registry registers
whatever definitions exist, so tools added there are picked up — give
them a risk entry in `tools-orbit.ts`.

## Browser use

`npm install playwright && npx playwright install chromium`, then:

```ts
import { BrowserSessionManager, createOrbitRegistry, registerBrowserTools } from '@/lib/action';
const registry = createOrbitRegistry();
registerBrowserTools(registry, new BrowserSessionManager({ headless: true }));
```

Agents then open pages, read a DOM snapshot (text + interactive
elements), and click/fill by meaning. Public URLs only (SSRF guard);
localhost bypass is handled for proxied deployments.

## Verification

- `tsc --strict` over `src/lib/action/**` against this branch's real
  `server/tools.ts`: clean.
- Executor smoke tests (fake LLM): write ok, malformed args rejected,
  `bash` gated as `needs_approval`, unknown tool handled, audit complete.
- Browser tools: fake-page smoke test + real-Chromium run against a
  locally served page (fill by label, click by text, DOM updated,
  screenshot saved).
- Run `npm run build` in `project-orbit-app` after pulling — the API
  route follows the same conventions as `api/agents/run`.
