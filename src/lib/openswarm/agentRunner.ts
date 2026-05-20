// ============================================
// Orbit — Real Agent Runner
// Executes a single agent with OpenAI / Gemini
// Returns a Server-Sent Events stream
// ============================================

import { callAgent, LLMMessage } from '../server/llm';
import { executeTool, ensureWorkspace, REAL_TOOL_DEFINITIONS } from '../server/tools';
import path from 'path';
import { existsSync, mkdirSync, readdirSync } from 'fs';
import { readFileSync } from 'fs';

export interface AgentRunOptions {
  agentId: string;
  agentName: string;
  systemPrompt: string;
  task: string;
  onChunk: (text: string) => void;
  onTool?: (name: string, args: Record<string, unknown>) => void;
  onDone: (fullOutput: string, tokensUsed: number, costUsd: number) => void;
  onError: (error: string) => void;
  openaiKey?: string;
  geminiKey?: string;
}

const AGENT_TOOLS = REAL_TOOL_DEFINITIONS;

// ============================================
// Repository Intelligence — scan workspace before task
// ============================================

async function scanRepository(ws: string): Promise<string> {
  const lines: string[] = ['## Repository Context\n'];

  // List top-level files/dirs
  try {
    const entries = readdirSync(ws, { withFileTypes: true }).slice(0, 30);
    lines.push('**Workspace structure:**');
    for (const e of entries) {
      lines.push(`  ${e.isDirectory() ? 'd' : 'f'} ${e.name}`);
    }
    lines.push('');
  } catch { /* skip if not readable */ }

  // Read package.json if present
  const packageJsonPath = path.join(ws, 'package.json');
  if (existsSync(packageJsonPath)) {
    try {
      const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as Record<string, unknown>;
      lines.push(`**package.json:** name=${pkg.name}, version=${pkg.version}`);
      if (pkg.scripts) lines.push(`  scripts: ${Object.keys(pkg.scripts as object).join(', ')}`);
      if (pkg.dependencies) lines.push(`  dependencies: ${Object.keys(pkg.dependencies as object).slice(0, 15).join(', ')}`);
      if (pkg.devDependencies) lines.push(`  devDependencies: ${Object.keys(pkg.devDependencies as object).slice(0, 10).join(', ')}`);
      lines.push('');
    } catch { /* skip */ }
  }

  // Read requirements.txt if present
  const reqPath = path.join(ws, 'requirements.txt');
  if (existsSync(reqPath)) {
    try {
      const reqs = readFileSync(reqPath, 'utf-8').split('\n').slice(0, 20).join(', ');
      lines.push(`**requirements.txt:** ${reqs}`);
      lines.push('');
    } catch { /* skip */ }
  }

  // Read README.md first 30 lines
  const readmePath = path.join(ws, 'README.md');
  if (existsSync(readmePath)) {
    try {
      const readme = readFileSync(readmePath, 'utf-8').split('\n').slice(0, 30).join('\n');
      lines.push('**README.md (first 30 lines):**');
      lines.push('```');
      lines.push(readme);
      lines.push('```');
      lines.push('');
    } catch { /* skip */ }
  }

  // Detect framework
  if (existsSync(path.join(ws, 'next.config.ts')) || existsSync(path.join(ws, 'next.config.js'))) {
    lines.push('**Framework:** Next.js');
  } else if (existsSync(path.join(ws, 'vite.config.ts'))) {
    lines.push('**Framework:** Vite/React');
  } else if (existsSync(path.join(ws, 'manage.py'))) {
    lines.push('**Framework:** Django');
  } else if (existsSync(path.join(ws, 'app.py'))) {
    lines.push('**Framework:** Flask/Python');
  }

  return lines.join('\n');
}


export async function runAgent(options: AgentRunOptions): Promise<void> {
  const { agentId, agentName, systemPrompt, task, onChunk, onTool, onDone, onError } = options;

  const baseWs = ensureWorkspace();
  const ws = path.join(baseWs, 'agents', agentId.replace(/[^a-zA-Z0-9-_]/g, '-'));
  if (!existsSync(ws)) {
    mkdirSync(ws, { recursive: true });
  }


  let fullOutput = '';
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let iterations = 0;
  const MAX_ITERATIONS = 15;

  onChunk(`\n**${agentName}** is initializing...\n\n`);

  // Repository scanning pre-step
  let repoContext = '';
  try {
    repoContext = await scanRepository(ws);
    if (repoContext.trim().length > 20) {
      onChunk(`📁 *Scanning repository...*\n\n`);
    }
  } catch { /* skip if scan fails */ }

  const enhancedSystemPrompt = repoContext
    ? `${systemPrompt}\n\n${repoContext}`
    : systemPrompt;

  const messages: LLMMessage[] = [
    { role: 'system', content: enhancedSystemPrompt },
    {
      role: 'user',
      content: `Task: ${task}\n\nWorkspace directory: ${ws}\n\nPlease complete this task thoroughly. Use available tools to read existing files, inspect the repository structure, and implement the solution. Write code to actual files. Run tests when appropriate.`,
    },
  ];

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    try {
      const result = await callAgent({
        systemPrompt: enhancedSystemPrompt,
        userPrompt: messages[messages.length - 1].content ?? '',
        stage: 'worker',
        taskTitle: task,
        tools: AGENT_TOOLS,
        messages: messages,
        openaiKey: options.openaiKey,
        geminiKey: options.geminiKey,
      });


      totalInputTokens += result.inputTokens;
      totalOutputTokens += result.outputTokens;

      if (result.isSimulated) {
        if (result.output) {
          fullOutput += result.output;
          onChunk(result.output);
        }
        break;
      }

      const assistantMessage: LLMMessage = {
        role: 'assistant',
        content: result.output || '',
        tool_calls: result.tool_calls?.map(tc => ({
          id: tc.id,
          type: 'function',
          function: { name: tc.function.name, arguments: tc.function.arguments }
        }))
      };
      messages.push(assistantMessage);

      if (result.output) {
        fullOutput += result.output;
        onChunk(result.output);
      }

      if (result.tool_calls && result.tool_calls.length > 0) {
        for (const tc of result.tool_calls) {
          let args: Record<string, unknown> = {};
          try { args = JSON.parse(tc.function.arguments); } catch { /* ignore */ }

          onTool?.(tc.function.name, args);

          let toolResult = '';
          if (tc.function.name === 'think') {
            toolResult = `Reasoning logged: ${args.reasoning}`;
            onChunk(`\n💭 *Thinking...*\n> ${String(args.reasoning)}\n\n`);
          } else {
            onChunk(`\n⚙️ **Executing tool:** \`${tc.function.name}\` with arguments: \`${JSON.stringify(args)}\`\n`);
            
            const execution = await executeTool({
              id: tc.id,
              name: tc.function.name,
              args: args
            }, ws);

            toolResult = execution.output;
            if (execution.isError) {
              onChunk(`\n❌ **Tool Error:**\n\`\`\`\n${execution.output}\n\`\`\`\n\n`);
            } else {
              onChunk(`\n✓ **Tool Result:**\n\`\`\`\n${execution.output.slice(0, 1000)}${execution.output.length > 1000 ? '...' : ''}\n\`\`\`\n\n`);
            }
          }

          messages.push({
            role: 'tool',
            tool_call_id: tc.id,
            content: toolResult,
          });
        }
        continue;
      }

      break;

    } catch (err) {
      onError(`Agent error: ${err instanceof Error ? err.message : String(err)}`);
      return;
    }
  }

  const costUsd = (totalInputTokens * 0.0000025) + (totalOutputTokens * 0.00001);
  onDone(fullOutput, totalInputTokens + totalOutputTokens, costUsd);
}
