// ============================================
// Orbit — Agent Action Layer: the REAL agentic loop
// Drop-in replacement for src/lib/openswarm/agenticLoop.ts, which is
// simulated (it picks tools at random and fabricates results, and
// nothing in src/ imports it). This loop:
//   LLM -> tool_calls -> ActionExecutor (validated, gated, audited)
//   -> tool results appended -> LLM again ... until text or maxTurns.
// The LLM is behind an interface; orbitLLMClient() adapts Orbit's
// existing callAgent() in src/lib/server/llm.ts.
// ============================================
import type { ActionExecutor } from './executor';
import type { ToolCallRequest, ToolContext } from './types';

export interface LLMToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface LLMChatResult {
  text: string | null;
  toolCalls: LLMToolCall[];
  inputTokens: number;
  outputTokens: number;
  /** True when the provider layer fell back to simulation (no API key).
   *  The loop stops and says so — simulated output must never be
   *  presented as a completed action. */
  isSimulated?: boolean;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCalls?: LLMToolCall[];
  toolCallId?: string;
}

export interface LLMClient {
  chat(input: {
    messages: ChatMessage[];
    tools: Array<{ type: 'function'; function: { name: string; description: string; parameters: unknown } }>;
  }): Promise<LLMChatResult>;
}

export type RunEvent =
  | { type: 'turn'; turn: number }
  | { type: 'text'; text: string }
  | { type: 'tool_call'; call: ToolCallRequest }
  | { type: 'tool_result'; call: ToolCallRequest; status: string; outputPreview: string }
  | { type: 'done'; text: string; totalTokens: number; toolCallCount: number }
  | { type: 'error'; message: string };

export interface RunAgentOptions {
  systemPrompt?: string;
  task: string;
  llm: LLMClient;
  executor: ActionExecutor;
  ctx: Omit<ToolContext, 'runId'> & { runId?: string };
  maxTurns?: number;        // default 15, like agentRunner's MAX_ITERATIONS
  timeoutMs?: number;       // default 300_000 overall
  allowedTools?: string[];  // restrict this run to a subset of the registry
  onEvent?: (event: RunEvent) => void;
}

export interface RunAgentResult {
  text: string;
  toolCallCount: number;
  turns: number;
  totalTokens: number;
  durationMs: number;
  stoppedReason: 'text' | 'max_turns' | 'timeout' | 'simulated' | 'error';
}

export async function runAgentWithActions(opts: RunAgentOptions): Promise<RunAgentResult> {
  const started = Date.now();
  const maxTurns = opts.maxTurns ?? 15;
  const timeoutMs = opts.timeoutMs ?? 300_000;
  const runId = opts.ctx.runId ?? `run-${Date.now()}`;
  const ctx: ToolContext = { ...opts.ctx, runId };
  const emit = (e: RunEvent) => { try { opts.onEvent?.(e); } catch { /* listener errors never break the loop */ } };

  const messages: ChatMessage[] = [];
  if (opts.systemPrompt) messages.push({ role: 'system', content: opts.systemPrompt });
  messages.push({ role: 'user', content: opts.task });

  const tools = opts.executor.registry.schemasForLLM(opts.allowedTools);
  let toolCallCount = 0;
  let totalTokens = 0;
  let finalText = '';

  for (let turn = 1; turn <= maxTurns; turn++) {
    if (Date.now() - started > timeoutMs) {
      return { text: finalText, toolCallCount, turns: turn - 1, totalTokens, durationMs: Date.now() - started, stoppedReason: 'timeout' };
    }
    emit({ type: 'turn', turn });

    const step = await opts.llm.chat({ messages, tools });
    totalTokens += step.inputTokens + step.outputTokens;

    if (step.isSimulated) {
      finalText = step.text ?? '';
      emit({ type: 'error', message: 'LLM is in simulation mode (no API key configured) — no real actions were taken.' });
      return { text: finalText, toolCallCount, turns: turn, totalTokens, durationMs: Date.now() - started, stoppedReason: 'simulated' };
    }

    messages.push({ role: 'assistant', content: step.text ?? '', toolCalls: step.toolCalls });

    if (step.text) {
      finalText = step.text;
      emit({ type: 'text', text: step.text });
    }

    if (step.toolCalls.length === 0) {
      emit({ type: 'done', text: finalText, totalTokens, toolCallCount });
      return { text: finalText, toolCallCount, turns: turn, totalTokens, durationMs: Date.now() - started, stoppedReason: 'text' };
    }

    for (const tc of step.toolCalls) {
      const call: ToolCallRequest = { id: tc.id, name: tc.name, args: tc.arguments };
      emit({ type: 'tool_call', call });
      const result = await opts.executor.execute(call, ctx);
      toolCallCount++;
      emit({ type: 'tool_result', call, status: result.status, outputPreview: result.output.slice(0, 500) });
      messages.push({ role: 'tool', toolCallId: tc.id, content: result.output });
    }
  }

  emit({ type: 'done', text: finalText, totalTokens, toolCallCount });
  return { text: finalText, toolCallCount, turns: maxTurns, totalTokens, durationMs: Date.now() - started, stoppedReason: 'max_turns' };
}

// ---------- Orbit adapter: wraps callAgent() from src/lib/server/llm.ts
// Kept as a factory with an injected function so this module can be
// unit-tested without the real llm.ts (and its DB/env key lookups).
export function orbitLLMClient(callAgentImpl: (options: {
  systemPrompt: string;
  userPrompt: string;
  stage: string;
  taskTitle: string;
  tools?: unknown[];
  messages?: Array<{
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string;
    tool_calls?: Array<{ id: string; type: 'function'; function: { name: string; arguments: string } }>;
    tool_call_id?: string;
  }>;
}) => Promise<{
  output: string;
  tool_calls?: Array<{ id: string; function: { name: string; arguments: string } }>;
  inputTokens: number;
  outputTokens: number;
  isSimulated?: boolean;
}>): LLMClient {
  return {
    async chat({ messages, tools }) {
      const systemPrompt = messages.find((m) => m.role === 'system')?.content ?? '';
      const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';
      const result = await callAgentImpl({
        systemPrompt,
        userPrompt: lastUser,
        stage: 'worker',
        taskTitle: lastUser.slice(0, 80),
        tools,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
          tool_calls: m.toolCalls?.map((tc) => ({
            id: tc.id, type: 'function' as const,
            function: { name: tc.name, arguments: JSON.stringify(tc.arguments) },
          })),
          tool_call_id: m.toolCallId,
        })),
      });
      return {
        text: result.output || null,
        toolCalls: (result.tool_calls ?? []).map((tc) => {
          let args: Record<string, unknown> = {};
          try { args = JSON.parse(tc.function.arguments) as Record<string, unknown>; } catch { /* executor validation will report it */ }
          return { id: tc.id, name: tc.function.name, arguments: args };
        }),
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        isSimulated: result.isSimulated,
      };
    },
  };
}
