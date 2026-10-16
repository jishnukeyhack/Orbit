// ============================================
// POST /api/action — run an agent through the Action Layer (SSE)
// Drop-in route: src/app/api/action/route.ts
// Body: {
//   task: string,
//   systemPrompt?: string,
//   agentId?: string,               // workspace = orbit-workspace/agents/<agentId>
//   policyMode?: 'permissive' | 'balanced' | 'strict',   // default 'balanced'
//   allowedTools?: string[],
//   maxTurns?: number
// }
// Events (SSE, same `data: {type, data}` shape as /api/agents/run):
//   start | turn | text | tool_call | tool_result | done | error
// Approvals: this headless route has no human in the loop, so in
// balanced/strict mode approval-gated tools return 'needs_approval'
// to the model (it must tell the user) — they are NEVER auto-approved.
// Wire opts.approve in run.ts to a real approval UI to change that.
// ============================================
import { NextRequest } from 'next/server';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';

import { callAgent } from '@/lib/server/llm';
import { ensureWorkspace } from '@/lib/server/tools';
import { getAgentById } from '@/lib/openswarm/agentRegistry';
import {
  ActionExecutor, Policy, createOrbitRegistry, defaultAuditSink,
  orbitLLMClient, runAgentWithActions,
} from '@/lib/action';
import type { PolicyMode } from '@/lib/action';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    task?: string;
    systemPrompt?: string;
    agentId?: string;
    policyMode?: PolicyMode;
    allowedTools?: string[];
    maxTurns?: number;
  };

  if (!body.task?.trim()) {
    return new Response('Task is required', { status: 400 });
  }

  let systemPrompt = body.systemPrompt ?? 'You are an Orbit agent. Use tools to complete the task in your workspace, then summarise what you actually did.';
  if (body.agentId) {
    const agent = getAgentById(body.agentId);
    if (!agent) return new Response(`Agent "${body.agentId}" not found`, { status: 404 });
    systemPrompt = agent.systemPrompt;
  }

  const baseWs = ensureWorkspace();
  const cwd = body.agentId
    ? path.join(baseWs, 'agents', body.agentId.replace(/[^a-zA-Z0-9-_]/g, '-'))
    : path.join(baseWs, 'action-runs');
  if (!existsSync(cwd)) mkdirSync(cwd, { recursive: true });

  const registry = createOrbitRegistry();
  const executor = new ActionExecutor({
    registry,
    policy: new Policy(body.policyMode ?? 'balanced'),
    audit: defaultAuditSink(baseWs),
    // no approve callback on purpose — see header comment
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (type: string, data: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, data })}\n\n`));
      send('start', { task: body.task, policyMode: body.policyMode ?? 'balanced' });
      try {
        const result = await runAgentWithActions({
          systemPrompt,
          task: body.task,
          llm: orbitLLMClient(callAgent),
          executor,
          ctx: { cwd, meta: { agentId: body.agentId ?? null } },
          maxTurns: body.maxTurns ?? 15,
          allowedTools: body.allowedTools,
          onEvent: (event) => {
            if (event.type === 'done') return; // sent once, below
            send(event.type, event);
          },
        });
        send('done', result);
      } catch (err) {
        send('error', { message: err instanceof Error ? err.message : String(err) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
