// ============================================
// Orbit — Agent Action Layer: executor
// The ONLY place registered tools are run. Pipeline per call:
//   lookup -> validate args -> policy -> approval -> timeout -> run
//   -> idempotency cache -> audit -> structured result for the model
// Errors are returned as data, never thrown into the agent loop.
// ============================================
import { redactArgs } from './audit';
import { Policy } from './policy';
import type { ToolRegistry } from './registry';
import { validateArgs } from './validate';
import type {
  ApprovalCallback, AuditSink, ExecutionResult, ToolCallRequest, ToolContext,
} from './types';

export interface ExecutorOptions {
  registry: ToolRegistry;
  policy?: Policy;
  approve?: ApprovalCallback;         // default: approve nothing that needs it
  audit?: AuditSink;
  defaultTimeoutMs?: number;          // default 30_000
}

function stringifyOutput(value: unknown): string {
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2) ?? String(value);
  } catch {
    return String(value);
  }
}

export class ActionExecutor {
  private idempotencyCache = new Map<string, ExecutionResult>();

  constructor(private opts: ExecutorOptions) {}

  get registry(): ToolRegistry {
    return this.opts.registry;
  }

  async execute(call: ToolCallRequest, ctx: ToolContext): Promise<ExecutionResult> {
    const started = Date.now();
    const done = async (r: Omit<ExecutionResult, 'durationMs'>): Promise<ExecutionResult> => {
      const result: ExecutionResult = { ...r, durationMs: Date.now() - started };
      await this.opts.audit?.write({
        ts: started,
        runId: ctx.runId,
        userId: ctx.userId,
        tool: call.name,
        risk: this.opts.registry.get(call.name)?.risk ?? 'unknown',
        args: redactArgs(call.args ?? {}),
        status: result.status,
        durationMs: result.durationMs,
        error: result.isError ? result.output.slice(0, 300) : undefined,
      });
      return result;
    };

    // 0. idempotent replay — a retried step must not run twice
    const cacheKey = call.idempotencyKey ? `${ctx.runId}:${call.name}:${call.idempotencyKey}` : null;
    if (cacheKey && this.idempotencyCache.has(cacheKey)) {
      return this.idempotencyCache.get(cacheKey)!;
    }

    // 1. lookup
    const tool = this.opts.registry.get(call.name);
    if (!tool) {
      return done({ id: call.id, name: call.name, status: 'unknown_tool', isError: true,
        output: `Unknown tool: ${call.name}. Available: ${this.opts.registry.list().map((t) => t.name).join(', ')}` });
    }

    // 2. validate arguments against the tool's own schema
    const errors = validateArgs(tool.parameters, call.args ?? {});
    if (errors.length > 0) {
      return done({ id: call.id, name: call.name, status: 'invalid_args', isError: true,
        output: `Invalid arguments for ${call.name}: ${errors.map((e) => `${e.path}: ${e.message}`).join('; ')}` });
    }

    // 3. policy + approval
    const policy = this.opts.policy ?? new Policy('balanced');
    const decision = policy.decide(tool);
    if (!decision.allowed) {
      return done({ id: call.id, name: call.name, status: 'denied', isError: true,
        output: `Denied by policy: ${decision.reason ?? 'not allowed'}` });
    }
    if (decision.needsApproval) {
      const approved = this.opts.approve
        ? await this.opts.approve({ runId: ctx.runId, userId: ctx.userId, tool: tool.name, risk: tool.risk, args: call.args })
        : false;
      if (!approved) {
        return done({ id: call.id, name: call.name, status: 'needs_approval', isError: true,
          output: `${tool.name} (${tool.risk}) requires human approval and none was granted. Do not retry it; tell the user what you wanted to do and ask.` });
      }
    }

    // 4. run with timeout
    const timeoutMs = tool.timeoutMs ?? this.opts.defaultTimeoutMs ?? 30_000;
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const value = await Promise.race([
        tool.handler(call.args, ctx),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error(`__ORBIT_TIMEOUT__ after ${timeoutMs}ms`)), timeoutMs);
        }),
      ]);
      const filesChanged =
        value && typeof value === 'object' && 'filesChanged' in (value as Record<string, unknown>)
          ? ((value as Record<string, unknown>).filesChanged as string[])
          : undefined;
      const result = await done({ id: call.id, name: call.name, status: 'ok', isError: false,
        output: stringifyOutput(value), data: value, filesChanged });
      if (cacheKey && tool.idempotent) this.idempotencyCache.set(cacheKey, result);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const isTimeout = msg.startsWith('__ORBIT_TIMEOUT__');
      return done({ id: call.id, name: call.name, status: isTimeout ? 'timeout' : 'error', isError: true,
        output: isTimeout ? `Tool ${tool.name} timed out after ${timeoutMs}ms` : `Error in ${tool.name}: ${msg}` });
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  /** Run calls sequentially (file/git tools share a workspace — parallel
   *  writes race). Parallelise only across independent runs/workspaces. */
  async executeAll(calls: ToolCallRequest[], ctx: ToolContext): Promise<ExecutionResult[]> {
    const results: ExecutionResult[] = [];
    for (const call of calls) results.push(await this.execute(call, ctx));
    return results;
  }
}
