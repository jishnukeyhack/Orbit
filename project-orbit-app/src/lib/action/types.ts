// ============================================
// Orbit — Agent Action Layer: types
// Drop-in module: src/lib/action/
// ============================================
// Why this exists: Orbit already has an LLM engine (src/lib/server/llm.ts)
// and a raw tool executor (src/lib/server/tools.ts), but the two are only
// loosely connected:
//   * tool *definitions* (REAL_TOOL_DEFINITIONS) live separately from tool
//     *implementations* (the switch in executeTool) and can drift apart
//   * every tool runs the moment the model asks — no risk levels, no
//     approval gate, no argument validation, no audit trail, no timeout
//     or idempotency at the action layer
//   * src/lib/openswarm/agenticLoop.ts is SIMULATED (random tool calls,
//     fake results) and is not imported anywhere in src/
// This module is the missing middle layer, Muse-style:
//   Registry (one source of truth) -> Policy (risk + approvals)
//   -> Executor (validate, gate, timeout, idempotency, audit) -> Tool
// ============================================

export type RiskLevel = 'read' | 'write' | 'execute' | 'destructive';

export interface JsonSchema {
  type: string;
  properties?: Record<string, JsonSchema & { description?: string; enum?: unknown[] }>;
  required?: string[];
  items?: JsonSchema;
  enum?: unknown[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  additionalProperties?: boolean;
  description?: string;
  [key: string]: unknown;
}

/** Per-run context passed to every tool. Never put secrets in here —
 *  tools that need a secret fetch it themselves at execution time. */
export interface ToolContext {
  runId: string;
  userId?: string;
  /** Absolute path of this run's workspace. Tools must stay inside it. */
  cwd: string;
  signal?: AbortSignal;
  /** Free-form, run-scoped metadata (agent id, swarm id, ...). */
  meta?: Record<string, unknown>;
}

export interface ToolDefinition<A = Record<string, unknown>, R = unknown> {
  name: string;
  description: string;
  parameters: JsonSchema;
  risk: RiskLevel;
  /** Extra gate on top of the policy mode. Default: derived from risk. */
  requiresApproval?: boolean;
  /** Milliseconds. Default comes from the executor (30_000). */
  timeoutMs?: number;
  /** If true, a repeated call with the same idempotency key returns the
   *  first result instead of running the tool twice. */
  idempotent?: boolean;
  handler: (args: A, ctx: ToolContext) => Promise<R> | R;
}

export interface ToolCallRequest {
  id: string;
  name: string;
  args: Record<string, unknown>;
  idempotencyKey?: string;
}

export type ExecutionStatus =
  | 'ok'
  | 'error'
  | 'denied'           // policy said no
  | 'needs_approval'   // policy said: ask first (no approval callback approved it)
  | 'invalid_args'
  | 'unknown_tool'
  | 'timeout';

export interface ExecutionResult {
  id: string;
  name: string;
  status: ExecutionStatus;
  /** String form, shaped for an LLM tool-result message. */
  output: string;
  /** Structured form, for UIs / logs. */
  data?: unknown;
  isError: boolean;
  durationMs: number;
  filesChanged?: string[];
}

export interface ApprovalRequest {
  runId: string;
  userId?: string;
  tool: string;
  risk: RiskLevel;
  args: Record<string, unknown>;
}

/** Return true to allow the call to run. Implement this against your UI
 *  (an approval card), a policy service, or — for headless runs — a
 *  pre-approved allow-list. The model can never approve its own calls. */
export type ApprovalCallback = (req: ApprovalRequest) => Promise<boolean> | boolean;

export interface AuditRecord {
  ts: number;
  runId: string;
  userId?: string;
  tool: string;
  risk: RiskLevel | 'unknown';
  args: Record<string, unknown>; // secrets redacted by the executor
  status: ExecutionStatus;
  durationMs: number;
  error?: string;
}

export interface AuditSink {
  write(record: AuditRecord): Promise<void> | void;
}
