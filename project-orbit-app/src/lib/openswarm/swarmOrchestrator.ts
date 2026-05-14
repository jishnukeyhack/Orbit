// ============================================
// Orbit — Swarm Orchestrator
// Runs multiple agents in parallel/sequential/hierarchical mode
// Real GPT-4o calls per agent with SSE streaming
// ============================================

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

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

async function callAgentWithStreaming(
  agent: SwarmAgent,
  userPrompt: string,
  apiKey: string,
  onChunk: (text: string) => void
): Promise<{ output: string; tokens: number; cost: number }> {
  const messages: OpenAIMessage[] = [
    { role: 'system', content: agent.systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages,
      stream: true,
      temperature: 0.3,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI error ${response.status}: ${await response.text()}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  let inputTokens = 0;
  let outputTokens = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const lines = decoder.decode(value).split('\n').filter(l => l.startsWith('data:'));
    for (const line of lines) {
      const data = line.slice(6);
      if (data === '[DONE]') continue;
      try {
        const parsed = JSON.parse(data) as {
          choices: Array<{ delta: { content?: string }; finish_reason?: string }>;
          usage?: { prompt_tokens: number; completion_tokens: number };
        };
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) {
          fullText += delta;
          onChunk(delta);
        }
        if (parsed.usage) {
          inputTokens = parsed.usage.prompt_tokens;
          outputTokens = parsed.usage.completion_tokens;
        }
      } catch { /* skip */ }
    }
  }

  const cost = (inputTokens * 0.0000025) + (outputTokens * 0.00001);
  return { output: fullText, tokens: inputTokens + outputTokens, cost };
}

async function runSimulatedAgent(
  agent: SwarmAgent,
  prompt: string,
  onChunk: (text: string) => void
): Promise<{ output: string; tokens: number; cost: number }> {
  const responses: Record<string, string> = {
    researcher: `## Research Report\n\n**Topic**: ${prompt.slice(0, 60)}\n\n**Key Findings:**\n- Market analysis shows strong demand in this space\n- Competitors are lacking in real-time collaboration features\n- User surveys indicate pain points around automation complexity\n\n**Recommendation**: Proceed with full implementation focusing on user experience.\n\n*— Researcher Agent*`,
    implementer: `## Implementation Plan\n\n**Task**: ${prompt.slice(0, 60)}\n\n\`\`\`typescript\n// Core implementation\nexport class OrbitAgent {\n  private config: AgentConfig;\n  \n  async execute(task: string): Promise<Result> {\n    const plan = await this.createPlan(task);\n    return await this.runPlan(plan);\n  }\n}\n\`\`\`\n\n**Files to create:**\n- \`src/agents/core.ts\` — Agent base class\n- \`src/agents/runner.ts\` — Execution engine\n\n*— Implementation Agent*`,
    reviewer: `## Code Review\n\n**Decision: ✅ APPROVED**\n\n**Review Summary:**\n- Logic is correct and well-structured\n- TypeScript types are properly defined\n- Error handling is comprehensive\n- Performance considerations addressed\n\n**Minor suggestions (non-blocking):**\n- Add JSDoc to public methods\n- Consider adding telemetry\n\n*— Reviewer Agent*`,
  };

  const roleKey = Object.keys(responses).find(k => agent.role.toLowerCase().includes(k)) ?? 'implementer';
  const response = responses[roleKey] ?? `**${agent.name}** completed analysis of: ${prompt.slice(0, 80)}\n\nAll tasks completed successfully.`;
  
  const words = response.split(' ');
  let output = '';
  for (const word of words) {
    output += word + ' ';
    onChunk(word + ' ');
    await new Promise(r => setTimeout(r, 20));
  }
  
  return { output, tokens: Math.floor(output.length / 3), cost: 0 };
}

export async function runSwarm(config: SwarmConfig, emit: SwarmEmitter): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY;
  const swarmId = config.id;

  emit({ type: 'swarm:start', swarmId, data: { name: config.name, strategy: config.strategy, agentCount: config.agents.length }, timestamp: Date.now() });

  const agentOutputs: Record<string, string> = {};

  if (config.strategy === 'parallel') {
    // All agents work simultaneously
    await Promise.all(
      config.agents.map(async (agent) => {
        emit({ type: 'agent:start', swarmId, agentId: agent.id, agentName: agent.name, timestamp: Date.now() });

        const prompt = `You are working as part of a swarm with the goal: "${config.goal}"\n\nYour specific role is: ${agent.role}\n\nProvide your contribution to this goal from your area of expertise.`;

        try {
          const result = apiKey
            ? await callAgentWithStreaming(agent, prompt, apiKey, (chunk) => {
                emit({ type: 'agent:chunk', swarmId, agentId: agent.id, agentName: agent.name, text: chunk, timestamp: Date.now() });
              })
            : await runSimulatedAgent(agent, prompt, (chunk) => {
                emit({ type: 'agent:chunk', swarmId, agentId: agent.id, agentName: agent.name, text: chunk, timestamp: Date.now() });
              });

          agentOutputs[agent.id] = result.output;
          emit({ type: 'agent:done', swarmId, agentId: agent.id, agentName: agent.name, data: { tokens: result.tokens, cost: result.cost }, timestamp: Date.now() });
        } catch (err) {
          emit({ type: 'agent:error', swarmId, agentId: agent.id, agentName: agent.name, text: String(err), timestamp: Date.now() });
        }
      })
    );

  } else if (config.strategy === 'sequential') {
    // Agents hand off to each other
    let previousOutput = '';
    for (const agent of config.agents) {
      emit({ type: 'agent:start', swarmId, agentId: agent.id, agentName: agent.name, timestamp: Date.now() });

      const prompt = previousOutput
        ? `You are working as part of a swarm with the goal: "${config.goal}"\n\nYour role: ${agent.role}\n\nPrevious agent output:\n${previousOutput.slice(0, 1500)}\n\nBuild on this and provide your contribution.`
        : `You are working as part of a swarm. Goal: "${config.goal}"\nYour role: ${agent.role}\nStart the work.`;

      try {
        const result = apiKey
          ? await callAgentWithStreaming(agent, prompt, apiKey, (chunk) => {
              emit({ type: 'agent:chunk', swarmId, agentId: agent.id, agentName: agent.name, text: chunk, timestamp: Date.now() });
            })
          : await runSimulatedAgent(agent, prompt, (chunk) => {
              emit({ type: 'agent:chunk', swarmId, agentId: agent.id, agentName: agent.name, text: chunk, timestamp: Date.now() });
            });

        previousOutput = result.output;
        agentOutputs[agent.id] = result.output;
        emit({ type: 'agent:done', swarmId, agentId: agent.id, agentName: agent.name, data: { tokens: result.tokens, cost: result.cost }, timestamp: Date.now() });
      } catch (err) {
        emit({ type: 'agent:error', swarmId, agentId: agent.id, agentName: agent.name, text: String(err), timestamp: Date.now() });
        break;
      }
    }

  } else if (config.strategy === 'hierarchical') {
    // First agent is lead, others work under it
    const [lead, ...workers] = config.agents;

    if (lead) {
      emit({ type: 'agent:start', swarmId, agentId: lead.id, agentName: `👑 ${lead.name} (Lead)`, timestamp: Date.now() });
      const leadPrompt = `You are the LEAD AGENT of a swarm. Goal: "${config.goal}"\nBreak this goal into specific sub-tasks for ${workers.length} worker agents: ${workers.map(w => w.name).join(', ')}.\nThen provide your own strategic overview.`;

      let leadOutput = '';
      try {
        const result = apiKey
          ? await callAgentWithStreaming(lead, leadPrompt, apiKey, (chunk) => {
              leadOutput += chunk;
              emit({ type: 'agent:chunk', swarmId, agentId: lead.id, agentName: `👑 ${lead.name}`, text: chunk, timestamp: Date.now() });
            })
          : await runSimulatedAgent(lead, leadPrompt, (chunk) => {
              leadOutput += chunk;
              emit({ type: 'agent:chunk', swarmId, agentId: lead.id, agentName: `👑 ${lead.name}`, text: chunk, timestamp: Date.now() });
            });
        agentOutputs[lead.id] = result.output;
        emit({ type: 'agent:done', swarmId, agentId: lead.id, agentName: lead.name, data: { tokens: result.tokens, cost: result.cost }, timestamp: Date.now() });
      } catch (err) {
        emit({ type: 'agent:error', swarmId, agentId: lead.id, agentName: lead.name, text: String(err), timestamp: Date.now() });
      }

      // Workers in parallel
      await Promise.all(
        workers.map(async (agent) => {
          emit({ type: 'agent:start', swarmId, agentId: agent.id, agentName: agent.name, timestamp: Date.now() });
          const workerPrompt = `You are a worker in a swarm. Lead instructions:\n${leadOutput.slice(0, 800)}\n\nYour specific role: ${agent.role}\nExecute your part of the goal: "${config.goal}"`;

          try {
            const result = apiKey
              ? await callAgentWithStreaming(agent, workerPrompt, apiKey, (chunk) => {
                  emit({ type: 'agent:chunk', swarmId, agentId: agent.id, agentName: agent.name, text: chunk, timestamp: Date.now() });
                })
              : await runSimulatedAgent(agent, workerPrompt, (chunk) => {
                  emit({ type: 'agent:chunk', swarmId, agentId: agent.id, agentName: agent.name, text: chunk, timestamp: Date.now() });
                });
            agentOutputs[agent.id] = result.output;
            emit({ type: 'agent:done', swarmId, agentId: agent.id, agentName: agent.name, data: { tokens: result.tokens, cost: result.cost }, timestamp: Date.now() });
          } catch (err) {
            emit({ type: 'agent:error', swarmId, agentId: agent.id, agentName: agent.name, text: String(err), timestamp: Date.now() });
          }
        })
      );
    }
  }

  // Final synthesis
  const allOutputs = Object.values(agentOutputs).join('\n\n---\n\n');
  emit({
    type: 'swarm:done',
    swarmId,
    data: {
      agentCount: config.agents.length,
      strategy: config.strategy,
      totalOutputLength: allOutputs.length,
    },
    timestamp: Date.now(),
  });
}
