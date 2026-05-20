// POST /api/swarms/run — Stream a real swarm execution via SSE
import { NextRequest } from 'next/server';
import { runSwarm, SwarmConfig, SwarmEvent } from '@/lib/openswarm/swarmOrchestrator';
import { getAgentById, loadAllAgents } from '@/lib/openswarm/agentRegistry';
import { createPipelineRun, updatePipelineRun } from '@/lib/server/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const openaiKey = request.headers.get('x-openai-api-key') || '';
  const geminiKey = request.headers.get('x-gemini-api-key') || '';
  
  if (openaiKey && openaiKey.trim()) {
    process.env.OPENAI_API_KEY = openaiKey.trim();
  }
  if (geminiKey && geminiKey.trim()) {
    process.env.GEMINI_API_KEY = geminiKey.trim();
  }

  const body = await request.json() as {
    name: string;
    goal: string;
    agentIds: string[];
    strategy: 'parallel' | 'sequential' | 'hierarchical';
  };

  const { name, goal, agentIds, strategy } = body;

  if (!goal?.trim()) return new Response('Goal is required', { status: 400 });
  if (!agentIds?.length) return new Response('At least one agent required', { status: 400 });

  const allAgents = loadAllAgents();
  const swarmAgents = agentIds.map((id, i) => {
    const def = getAgentById(id) ?? allAgents[0];
    const roles = ['Lead Strategist', 'Researcher', 'Implementer', 'Reviewer', 'Quality Auditor'];
    return {
      id: def.id,
      name: def.name,
      emoji: def.emoji,
      systemPrompt: def.systemPrompt,
      role: roles[i % roles.length],
    };
  });

  const config: SwarmConfig = {
    id: `swarm-${Date.now()}`,
    name: name || `Swarm: ${goal.slice(0, 40)}`,
    goal,
    agents: swarmAgents,
    strategy,
  };

  const startTime = Date.now();
  try {
    createPipelineRun({
      id: config.id,
      task_title: `[Swarm] ${config.name}`,
      task_description: config.goal,
      started_at: startTime
    });
  } catch (err) {
    console.error("DB error in swarm run creation:", err);
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let totalTokens = 0;
      let totalCostUsd = 0;
      let status = 'completed';

      const send = (event: SwarmEvent) => {
        if (event.type === 'agent:done') {
          const tokens = (event.data?.tokens as number) || 0;
          const cost = (event.data?.cost as number) || 0;
          totalTokens += tokens;
          totalCostUsd += cost;
        } else if (event.type === 'agent:error') {
          status = 'failed';
        }
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch { /* ignored */ }
      };

      try {
        await runSwarm(config, send, openaiKey, geminiKey);
        
        try {
          updatePipelineRun(config.id, {
            status: status,
            completed_at: Date.now(),
            total_duration_ms: Date.now() - startTime,
            cost_usd: totalCostUsd,
            result_json: JSON.stringify({
              success: status === 'completed',
              tokensUsed: totalTokens,
              totalTokens: totalTokens,
              costUsd: totalCostUsd,
              agentCount: config.agents.length,
              strategy: config.strategy
            })
          });
        } catch (dbErr) {
          console.error("DB error updating swarm run status:", dbErr);
        }
      } catch (err) {
        status = 'failed';
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', text: String(err) })}\n\n`));
        } catch { /* ignored */ }
        
        try {
          updatePipelineRun(config.id, {
            status: 'failed',
            completed_at: Date.now(),
            total_duration_ms: Date.now() - startTime,
            cost_usd: totalCostUsd,
            result_json: JSON.stringify({
              success: false,
              error: String(err),
              tokensUsed: totalTokens,
              totalTokens: totalTokens,
              costUsd: totalCostUsd,
            })
          });
        } catch (dbErr) {
          console.error("DB error updating failed swarm run status:", dbErr);
        }
      } finally {
        try {
          controller.close();
        } catch { /* ignored */ }
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

// GET /api/swarms — List available agents for swarm building
export async function GET() {
  const agents = loadAllAgents().map(a => ({
    id: a.id, name: a.name, emoji: a.emoji, category: a.category, color: a.color,
  }));
  return Response.json({ agents });
}
