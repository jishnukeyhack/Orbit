// POST /api/chat — Full streaming chat with AI assistant
import { NextRequest } from 'next/server';
import { streamChat, addToConversation, getConversation } from '@/lib/openswarm/streamingChat';

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
    message: string;
    sessionId?: string;
    history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  };

  const { message, sessionId = 'default', history = [] } = body;

  if (!message?.trim()) {
    return new Response('Message is required', { status: 400 });
  }

  // Build conversation from history + new message
  const messages = [
    ...history,
    { role: 'user' as const, content: message },
  ];

  // Store in session
  addToConversation(sessionId, { role: 'user', content: message });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let fullResponse = '';

      await streamChat({
        messages,
        onChunk: (token) => {
          fullResponse += token;
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'chunk', token })}\n\n`)
          );
        },
        onDone: (text, usage) => {
          addToConversation(sessionId, { role: 'assistant', content: text });
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'done', usage })}\n\n`)
          );
          controller.close();
        },
        onError: (err) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', message: err })}\n\n`)
          );
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

// GET /api/chat — Get conversation history
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId') ?? 'default';
  const history = getConversation(sessionId);
  return Response.json({ history, sessionId });
}
