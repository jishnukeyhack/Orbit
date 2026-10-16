// ============================================
// Orbit — Agent Action Layer: Orbit's existing tools, registered
// Wraps src/lib/server/tools.ts (executeTool) — no tool is reimplemented.
// The gain: each tool now carries its risk level next to its schema, so
// the executor can gate bash / git_commit / delete_file instead of
// running everything the moment the model asks.
// Plus two genuinely new Muse-style tools: web_fetch and spawn_agent.
// ============================================
import { executeTool, REAL_TOOL_DEFINITIONS } from '../server/tools';
import { isPublicHttpUrl, shellCommandBlocked } from './policy';
import { defineTool, ToolRegistry } from './registry';
import type { ToolContext } from './types';

const RISK_BY_TOOL: Record<string, 'read' | 'write' | 'execute' | 'destructive'> = {
  think: 'read',
  read_file: 'read',
  list_dir: 'read',
  grep_files: 'read',
  git_status: 'read',
  git_diff: 'read',
  git_log: 'read',
  write_file: 'write',
  edit_file: 'write',
  mkdir: 'write',
  move_file: 'write',
  git_commit: 'write',
  bash: 'execute',        // arbitrary code — approval in balanced/strict modes
  delete_file: 'destructive',
};

/** Register every tool Orbit already has, using Orbit's own schemas. */
export function registerOrbitTools(registry: ToolRegistry): ToolRegistry {
  const defs = REAL_TOOL_DEFINITIONS as unknown as Array<{
    function: { name: string; description: string; parameters: import('./types').JsonSchema };
  }>;
  for (const def of defs) {
    const name = def.function.name;
    registry.register(
      defineTool<Record<string, unknown>, unknown>({
        name,
        description: def.function.description,
        parameters: def.function.parameters,
        risk: RISK_BY_TOOL[name] ?? 'write',
        idempotent: (RISK_BY_TOOL[name] ?? 'write') === 'read',
        handler: async (args, ctx: ToolContext) => {
          if (name === 'bash') {
            const blocked = shellCommandBlocked(String(args.command ?? ''));
            if (blocked) return { output: blocked, isError: true };
            // NOTE: Orbit's bash still spreads process.env (with API keys).
            // See INTEGRATION.md — patch tools.ts to use scrubbedEnv().
          }
          const result = await executeTool({ id: `action-${Date.now()}`, name, args }, ctx.cwd);
          if (result.isError) throw new Error(result.output);
          return { output: result.output, filesChanged: result.filesChanged };
        },
      }),
    );
  }
  return registry;
}

/** NEW: read a public web page as text. SSRF-guarded, size-limited.
 *  This is Orbit's equivalent of an agent "looking something up" —
 *  deliberately a *read* tool: it cannot submit forms or click. Browser
 *  interaction (Playwright) belongs in a separate, approval-gated
 *  'execute' tool, not here. */
export function registerWebFetchTool(registry: ToolRegistry): ToolRegistry {
  registry.register(
    defineTool<Record<string, unknown>, unknown>({
      name: 'web_fetch',
      description: 'Fetch a public http(s) page and return its visible text (truncated). Read-only.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Public http(s) URL' },
          maxChars: { type: 'number', description: 'Max characters to return (default 8000)' },
        },
        required: ['url'],
      },
      risk: 'read',
      timeoutMs: 20_000,
      idempotent: true,
      handler: async (args) => {
        const url = String(args.url ?? '');
        if (!isPublicHttpUrl(url)) {
          throw new Error(`Refused: not a public http(s) URL: ${url}`);
        }
        const res = await fetch(url, {
          redirect: 'follow',
          headers: { 'User-Agent': 'OrbitAgent/1.0 (+action-layer web_fetch)' },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
        const html = await res.text();
        const text = html
          .replace(/<script[\s\S]*?<\/script>/gi, ' ')
          .replace(/<style[\s\S]*?<\/style>/gi, ' ')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        const max = typeof args.maxChars === 'number' ? args.maxChars : 8000;
        return { url, status: res.status, text: text.slice(0, max) };
      },
    }),
  );
  return registry;
}

export interface SpawnAgentRunner {
  (input: { systemPrompt: string; task: string; parentRunId: string }): Promise<{ text: string }>;
}

/** NEW: sub-agents. A tool that runs another agent (with its own runId,
 *  workspace and action-layer executor) and returns only its final text.
 *  Depth is capped by the CALLER wiring this once, not recursively —
 *  pass maxDepth through ctx.meta and refuse beyond it (see run.ts). */
export function registerSpawnAgentTool(registry: ToolRegistry, runner: SpawnAgentRunner): ToolRegistry {
  registry.register(
    defineTool<Record<string, unknown>, unknown>({
      name: 'spawn_agent',
      description: 'Delegate a self-contained sub-task to another agent and return its result. Use for independent sub-tasks, not for steps that share files with this run.',
      parameters: {
        type: 'object',
        properties: {
          systemPrompt: { type: 'string' },
          task: { type: 'string' },
        },
        required: ['systemPrompt', 'task'],
      },
      risk: 'execute',
      timeoutMs: 300_000,
      handler: async (args, ctx) => {
        const depth = Number(ctx.meta?.depth ?? 0);
        const maxDepth = Number(ctx.meta?.maxDepth ?? 1);
        if (depth >= maxDepth) {
          throw new Error(`Sub-agent depth limit reached (${maxDepth}). Do this step yourself.`);
        }
        const result = await runner({
          systemPrompt: String(args.systemPrompt ?? ''),
          task: String(args.task ?? ''),
          parentRunId: ctx.runId,
        });
        return { text: result.text };
      },
    }),
  );
  return registry;
}

/** Convenience: a registry with Orbit's tools + web_fetch, ready to use. */
export function createOrbitRegistry(): ToolRegistry {
  const registry = new ToolRegistry();
  registerOrbitTools(registry);
  registerWebFetchTool(registry);
  return registry;
}
