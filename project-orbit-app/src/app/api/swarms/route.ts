// POST /api/swarms/run — Stream a real swarm execution via SSE
import { NextRequest } from 'next/server';
import { runSwarm, SwarmConfig, SwarmEvent } from '@/lib/openswarm/swarmOrchestrator';
import { getAgentById, loadAllAgents } from '@/lib/openswarm/agentRegistry';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
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

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: SwarmEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      try {
        await runSwarm(config, send);
      } catch (err) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', text: String(err) })}\n\n`));
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

// GET /api/swarms — List available agents for swarm building
export async function GET() {
  const agents = loadAllAgents().slice(0, 50).map(a => ({
    id: a.id, name: a.name, emoji: a.emoji, category: a.category, color: a.color,
  }));
  return Response.json({ agents });
}
