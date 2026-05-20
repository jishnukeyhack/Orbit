// ============================================
// Orbit — Swarm Orchestrator
// Runs multiple agents in parallel/sequential/hierarchical mode
// Real multi-engine gateway calls per agent with SSE streaming
// ============================================

import { callAgent } from '../server/llm';
import { executeTool, ensureWorkspace } from '../server/tools';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';

export interface SwarmAgent {
  id: string;
  name: string;
  emoji: string;
  systemPrompt: string;
  role: string; // e.g. "Lead", "Researcher", "Implementer"
}

export interface SwarmConfig {
  id: string;
  name: string;
  goal: string;
  agents: SwarmAgent[];
  strategy: 'parallel' | 'sequential' | 'hierarchical';
}

export interface SwarmEvent {
  type:
    | 'swarm:start'
    | 'agent:start'
    | 'agent:chunk'
    | 'agent:done'
    | 'agent:error'
    | 'swarm:synthesis'
    | 'swarm:done';
  swarmId: string;
  agentId?: string;
  agentName?: string;
  text?: string;
  data?: Record<string, unknown>;
  timestamp: number;
}

export type SwarmEmitter = (event: SwarmEvent) => void;

const SWARM_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'think',
      description: 'Think through a problem step by step before executing actions',
      parameters: {
        type: 'object',
        properties: {
          reasoning: { type: 'string', description: 'Your step-by-step reasoning' },
        },
        required: ['reasoning'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Read file contents from the workspace',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Relative path to file in workspace' },
          offset: { type: 'number', description: 'Line offset to start reading from' },
          limit: { type: 'number', description: 'Number of lines to read' }
        },
        required: ['path']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'write_file',
      description: 'Write content to a file in the workspace. Use this to generate code, scripts, or reports.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Relative path to file in workspace' },
          content: { type: 'string', description: 'Full text content of the file' }
        },
        required: ['path', 'content']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'edit_file',
      description: 'Replace an old string in a file with a new string',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Relative path to file' },
          old_string: { type: 'string', description: 'The exact original string to replace' },
          new_string: { type: 'string', description: 'The replacement string' }
        },
        required: ['path', 'old_string', 'new_string']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_dir',
      description: 'List contents of a directory in the workspace',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Relative path to directory' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'mkdir',
      description: 'Create a new directory in the workspace',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Relative directory path to create' }
        },
        required: ['path']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'bash',
      description: 'Execute a terminal command or script (e.g. running Python files, compiling code, running tests)',
      parameters: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'The command to execute' }
        },
        required: ['command']
      }
    }
  }
];

async function callAgentWithStreaming(
  agent: SwarmAgent,
  userPrompt: string,
  onChunk: (text: string) => void,
  ws: string,
  openaiKey?: string,
  geminiKey?: string
): Promise<{ output: string; tokens: number; cost: number }> {
  const messages: any[] = [
    { role: 'system', content: agent.systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  let fullOutput = '';
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let iterations = 0;
  const MAX_ITERATIONS = 5;

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    const result = await callAgent({
      systemPrompt: agent.systemPrompt,
      userPrompt: messages[messages.length - 1].content ?? '',
      stage: 'swarm-worker',
      taskTitle: agent.role,
      tools: SWARM_TOOLS,
      messages: messages,
      openaiKey,
      geminiKey,
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

    const assistantMessage: any = {
      role: 'assistant',
      content: result.output || '',
    };
    if (result.tool_calls && result.tool_calls.length > 0) {
      assistantMessage.tool_calls = result.tool_calls.map(tc => ({
        id: tc.id,
        type: 'function',
        function: { name: tc.function.name, arguments: tc.function.arguments }
      }));
    }
    messages.push(assistantMessage);

    if (result.output) {
      fullOutput += result.output;
      onChunk(result.output);
    }

    if (result.tool_calls && result.tool_calls.length > 0) {
      for (const tc of result.tool_calls) {
        let args: Record<string, unknown> = {};
        try { args = JSON.parse(tc.function.arguments); } catch { /* ignore */ }

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
  }

  const cost = (totalInputTokens * 0.0000025) + (totalOutputTokens * 0.00001);
  return { output: fullOutput, tokens: totalInputTokens + totalOutputTokens, cost };
}

export async function runSwarm(
  config: SwarmConfig,
  emit: SwarmEmitter,
  openaiKey?: string,
  geminiKey?: string
): Promise<void> {
  const swarmId = config.id;
  const baseWs = ensureWorkspace();
  const ws = path.join(baseWs, 'swarms', swarmId.replace(/[^a-zA-Z0-9-_]/g, '-'));
  if (!existsSync(ws)) {
    mkdirSync(ws, { recursive: true });
  }

  emit({
    type: 'swarm:start',
    swarmId,
    data: { name: config.name, strategy: config.strategy, agentCount: config.agents.length, workspace: ws },
    timestamp: Date.now()
  });

  const agentOutputs: Record<string, string> = {};

  if (config.strategy === 'parallel') {
    await Promise.all(
      config.agents.map(async (agent) => {
        emit({ type: 'agent:start', swarmId, agentId: agent.id, agentName: agent.name, timestamp: Date.now() });

        const prompt = `You are working as part of a swarm with the goal: "${config.goal}"\n\nYour specific role is: ${agent.role}\n\nProvide your contribution to this goal from your area of expertise. Write code, execute scripts, and verify your results autonomously.`;

        try {
          const result = await callAgentWithStreaming(agent, prompt, (chunk) => {
            emit({ type: 'agent:chunk', swarmId, agentId: agent.id, agentName: agent.name, text: chunk, timestamp: Date.now() });
          }, ws, openaiKey, geminiKey);

          agentOutputs[agent.id] = result.output;
          emit({ type: 'agent:done', swarmId, agentId: agent.id, agentName: agent.name, data: { tokens: result.tokens, cost: result.cost }, timestamp: Date.now() });
        } catch (err) {
          emit({ type: 'agent:error', swarmId, agentId: agent.id, agentName: agent.name, text: String(err), timestamp: Date.now() });
        }
      })
    );

  } else if (config.strategy === 'sequential') {
    let previousOutput = '';
    for (const agent of config.agents) {
      emit({ type: 'agent:start', swarmId, agentId: agent.id, agentName: agent.name, timestamp: Date.now() });

      const prompt = previousOutput
        ? `You are working as part of a swarm with the goal: "${config.goal}"\n\nYour role: ${agent.role}\n\nPrevious agent output:\n${previousOutput.slice(0, 1500)}\n\nBuild on this, provide your contribution, write any necessary files and execute terminal tasks autonomously.`
        : `You are working as part of a swarm. Goal: "${config.goal}"\nYour role: ${agent.role}\nStart the work. Write code or generate outputs autonomously.`;

      try {
        const result = await callAgentWithStreaming(agent, prompt, (chunk) => {
          emit({ type: 'agent:chunk', swarmId, agentId: agent.id, agentName: agent.name, text: chunk, timestamp: Date.now() });
        }, ws, openaiKey, geminiKey);

        previousOutput = result.output;
        agentOutputs[agent.id] = result.output;
        emit({ type: 'agent:done', swarmId, agentId: agent.id, agentName: agent.name, data: { tokens: result.tokens, cost: result.cost }, timestamp: Date.now() });
      } catch (err) {
        emit({ type: 'agent:error', swarmId, agentId: agent.id, agentName: agent.name, text: String(err), timestamp: Date.now() });
        break;
      }
    }

  } else if (config.strategy === 'hierarchical') {
    const [lead, ...workers] = config.agents;

    if (lead) {
      emit({ type: 'agent:start', swarmId, agentId: lead.id, agentName: `${lead.name} (Lead)`, timestamp: Date.now() });
      const leadPrompt = `You are the LEAD AGENT of a swarm. Goal: "${config.goal}"\nBreak this goal into specific sub-tasks for ${workers.length} worker agents: ${workers.map(w => w.name).join(', ')}.\nThen provide your own strategic overview and set up any files in the workspace.`;

      let leadOutput = '';
      try {
        const result = await callAgentWithStreaming(lead, leadPrompt, (chunk) => {
          leadOutput += chunk;
          emit({ type: 'agent:chunk', swarmId, agentId: lead.id, agentName: lead.name, text: chunk, timestamp: Date.now() });
        }, ws, openaiKey, geminiKey);
        agentOutputs[lead.id] = result.output;
        emit({ type: 'agent:done', swarmId, agentId: lead.id, agentName: lead.name, data: { tokens: result.tokens, cost: result.cost }, timestamp: Date.now() });
      } catch (err) {
        emit({ type: 'agent:error', swarmId, agentId: lead.id, agentName: lead.name, text: String(err), timestamp: Date.now() });
      }

      await Promise.all(
        workers.map(async (agent) => {
          emit({ type: 'agent:start', swarmId, agentId: agent.id, agentName: agent.name, timestamp: Date.now() });
          const workerPrompt = `You are a worker in a swarm. Lead instructions:\n${leadOutput.slice(0, 800)}\n\nYour specific role: ${agent.role}\nExecute your part of the goal: "${config.goal}" autonomously by writing files or executing scripts in the workspace.`;

          try {
            const result = await callAgentWithStreaming(agent, workerPrompt, (chunk) => {
              emit({ type: 'agent:chunk', swarmId, agentId: agent.id, agentName: agent.name, text: chunk, timestamp: Date.now() });
            }, ws, openaiKey, geminiKey);
            agentOutputs[agent.id] = result.output;
            emit({ type: 'agent:done', swarmId, agentId: agent.id, agentName: agent.name, data: { tokens: result.tokens, cost: result.cost }, timestamp: Date.now() });
          } catch (err) {
            emit({ type: 'agent:error', swarmId, agentId: agent.id, agentName: agent.name, text: String(err), timestamp: Date.now() });
          }
        })
      );
    }
  }

  const allOutputs = Object.values(agentOutputs).join('\n\n---\n\n');
  emit({
    type: 'swarm:done',
    swarmId,
    data: {
      agentCount: config.agents.length,
      strategy: config.strategy,
      totalOutputLength: allOutputs.length,
      workspace: ws,
    },
    timestamp: Date.now(),
  });
}
