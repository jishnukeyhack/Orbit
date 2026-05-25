// POST /api/chat — Full streaming chat with AI assistant
import { NextRequest } from 'next/server';
import { streamChat, addToConversation, getConversation } from '@/lib/openswarm/streamingChat';
import { supabase } from '@/lib/supabase';

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

  // Store in local session fallback
  addToConversation(sessionId, { role: 'user', content: message });

  // Sync user message to Supabase PostgreSQL (async, non-blocking)
  supabase
    .from('orbit_chat_messages')
    .insert({
      session_id: sessionId,
      role: 'user',
      content: message,
    })
    .then(({ error }) => {
      if (error) {
        console.log('[Supabase Chat Sync] Skipped User Insert: table public.orbit_chat_messages not found.');
      }
    });

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
          
          // Sync assistant reply to Supabase PostgreSQL (async, non-blocking)
          supabase
            .from('orbit_chat_messages')
            .insert({
              session_id: sessionId,
              role: 'assistant',
              content: text,
            })
            .then(({ error }) => {
              if (error) {
                console.log('[Supabase Chat Sync] Skipped Assistant Insert: table public.orbit_chat_messages not found.');
              }
            });

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

  // 1. Try loading from Supabase Cloud first
  try {
    const { data: cloudMessages, error } = await supabase
      .from('orbit_chat_messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(30);

    if (!error && cloudMessages && cloudMessages.length > 0) {
      // Cast the results to the local ChatMessage format
      const history = cloudMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));
      return Response.json({ history, sessionId });
    }
  } catch (err) {
    console.warn('[Supabase Chat Sync] Failed to query cloud database, falling back to local storage.');
  }

  // 2. Fall back to local in-memory storage
  const history = getConversation(sessionId);
  return Response.json({ history, sessionId });
}
