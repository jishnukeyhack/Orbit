// ============================================
// Orbit — Real Workflow Executor
// Executes DAG workflows step-by-step using real LLM agents
// POST /api/workflow/execute — run a full workflow with SSE streaming
// ============================================
import { NextRequest } from 'next/server';
import { loadWorkflow, getParallelGroups, saveExecution } from '@/lib/openswarm/workflow';
import { callAgent } from '@/lib/server/llm';
import { executeTool, ensureWorkspace } from '@/lib/server/tools';
import { REAL_TOOL_DEFINITIONS } from '@/lib/server/tools';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { mkdirSync } from 'fs';
import type { WorkflowExecution, StepResult } from '@/lib/openswarm/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STEP_SYSTEM_PROMPT = `You are an autonomous agent executing a workflow step.
Complete the assigned task using your tools. Be thorough and produce real outputs.
Write files, execute commands, and verify results.
When done, summarize what you accomplished.`;

export async function POST(request: NextRequest) {
  const openaiKey = request.headers.get('x-openai-api-key') || '';
  const geminiKey = request.headers.get('x-gemini-api-key') || '';

  if (openaiKey?.trim()) process.env.OPENAI_API_KEY = openaiKey.trim();
  if (geminiKey?.trim()) process.env.GEMINI_API_KEY = geminiKey.trim();

  const body = await request.json() as { workflowId?: string; stepId?: string; stepPrompt?: string; stepName?: string };
  const { workflowId, stepId, stepPrompt, stepName } = body;

  // Single-step execution mode (from UI)
  if (!workflowId && stepPrompt) {
    const runId = uuidv4();
    const ws = ensureWorkspace();
    const stepDir = path.join(ws, 'workflow-steps', runId.slice(0, 8));
    mkdirSync(stepDir, { recursive: true });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (type: string, data: unknown) => {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, data })}\n\n`));
          } catch { /* closed */ }
        };

        send('start', { stepName: stepName || 'Step', stepId: stepId || runId });

        const messages: Array<{ role: string; content: string; tool_calls?: unknown[]; tool_call_id?: string }> = [
          { role: 'system', content: STEP_SYSTEM_PROMPT },
          { role: 'user', content: stepPrompt },
        ];

        let fullOutput = '';
        let iterations = 0;
        const MAX_ITERATIONS = 8;

        while (iterations < MAX_ITERATIONS) {
          iterations++;

          const result = await callAgent({
            systemPrompt: STEP_SYSTEM_PROMPT,
            userPrompt: messages[messages.length - 1].content ?? '',
            stage: 'worker',
            taskTitle: stepName || 'Workflow Step',
            tools: REAL_TOOL_DEFINITIONS,
            messages: messages as Parameters<typeof callAgent>[0]['messages'],
          });

          if (result.output) {
            fullOutput += result.output;
            send('chunk', { text: result.output });
          }

          if (result.isSimulated || !result.tool_calls || result.tool_calls.length === 0) {
            break;
          }

          messages.push({
            role: 'assistant',
            content: result.output || '',
            tool_calls: result.tool_calls.map(tc => ({
              id: tc.id, type: 'function', function: tc.function,
            })),
          });

          for (const tc of result.tool_calls) {
            let args: Record<string, unknown> = {};
            try { args = JSON.parse(tc.function.arguments); } catch { /* ignore */ }

            send('tool', { name: tc.function.name, args });

            let toolOutput = '';
            if (tc.function.name === 'think') {
              toolOutput = `Reasoning: ${args.reasoning}`;
              send('chunk', { text: `\n💭 *${args.reasoning}*\n\n` });
            } else {
              const execution = await executeTool({ id: tc.id, name: tc.function.name, args }, stepDir);
              toolOutput = execution.output;
              send('chunk', { text: `\n✓ \`${tc.function.name}\`: ${execution.output.slice(0, 300)}\n\n` });
            }

            messages.push({ role: 'tool', content: toolOutput, tool_call_id: tc.id });
          }
        }

        send('done', { output: fullOutput, runId });
        controller.close();
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

  // Full workflow execution mode
  if (!workflowId) {
    return Response.json({ error: 'workflowId required' }, { status: 400 });
  }

  const workflow = loadWorkflow(workflowId);
  if (!workflow) {
    return Response.json({ error: `Workflow ${workflowId} not found` }, { status: 404 });
  }

  const executionId = uuidv4();
  const ws = ensureWorkspace();
  const workflowDir = path.join(ws, 'workflows', executionId.slice(0, 8));
  mkdirSync(workflowDir, { recursive: true });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (type: string, data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, data })}\n\n`));
        } catch { /* closed */ }
      };

      const stepResults: Record<string, StepResult> = {};
      const groups = getParallelGroups(workflow.steps);

      send('workflow:start', { executionId, workflowId, name: workflow.name, totalSteps: workflow.steps.length });

      for (const group of groups) {
        await Promise.all(group.map(async (step) => {
          const stepStart = Date.now();
          send('step:start', { stepId: step.id, stepName: step.name });

          // Build context from dependency outputs
          const depOutputs = step.dependsOn
            ?.map(depId => stepResults[depId]?.output)
            .filter(Boolean)
            .join('\n\n---\n\n') || '';

          const fullPrompt = depOutputs
            ? `${step.prompt}\n\nContext from previous steps:\n${depOutputs.slice(0, 2000)}`
            : step.prompt;

          try {
            const result = await callAgent({
              systemPrompt: STEP_SYSTEM_PROMPT,
              userPrompt: fullPrompt,
              stage: 'worker',
              taskTitle: step.name,
            });

            const stepResult: StepResult = {
              stepId: step.id,
              status: 'completed',
              output: result.output,
              startedAt: stepStart,
              completedAt: Date.now(),
            };

            stepResults[step.id] = stepResult;
            send('step:complete', { stepId: step.id, stepName: step.name, output: result.output, durationMs: Date.now() - stepStart });
          } catch (err) {
            const stepResult: StepResult = {
              stepId: step.id,
              status: 'failed',
              output: '',
              error: String(err),
              startedAt: stepStart,
              completedAt: Date.now(),
            };

            stepResults[step.id] = stepResult;
            send('step:fail', { stepId: step.id, error: String(err) });
          }
        }));
      }

      const execution: WorkflowExecution = {
        executionId,
        workflowId,
        status: Object.values(stepResults).every(r => r.status === 'completed') ? 'completed' : 'failed',
        startedAt: Date.now(),
        completedAt: Date.now(),
        stepResults,
      };
      saveExecution(execution);

      send('workflow:done', { executionId, success: execution.status === 'completed', stepResults });
      controller.close();
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
