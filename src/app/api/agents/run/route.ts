// POST /api/agents/run — Stream agent execution via SSE
import { NextRequest } from 'next/server';
import { getAgentById } from '@/lib/openswarm/agentRegistry';
import { runAgent } from '@/lib/openswarm/agentRunner';

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

  const body = await request.json() as { agentId: string; task: string };
  const { agentId, task } = body;

  if (!task?.trim()) {
    return new Response('Task is required', { status: 400 });
  }

  const agent = getAgentById(agentId);
  if (!agent) {
    return new Response(`Agent "${agentId}" not found`, { status: 404 });
  }

  // Set up SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (type: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type, data })}\n\n`)
        );
      };

      send('start', { agentId, agentName: agent.name, task });

      await runAgent({
        agentId,
        agentName: agent.name,
        systemPrompt: agent.systemPrompt,
        task,
        onChunk: (text) => send('chunk', { text }),
        onTool: (name, args) => send('tool', { name, args }),
        onDone: (output, tokens, cost) => {
          send('done', { output, tokens, cost });
          controller.close();
        },
        onError: (error) => {
          send('error', { message: error });
          controller.close();
        },
        openaiKey,
        geminiKey,
      });
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
