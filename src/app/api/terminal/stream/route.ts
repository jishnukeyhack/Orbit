// ============================================
// Orbit — Unified Terminal Stream Route (HTTP SSE)
// Keeps a same-origin chunked HTTP stream open to receive shell output
// ============================================

import { NextRequest } from 'next/server';
import { getOrCreateSession } from '@/lib/server/terminalServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId') || 'default';

  const session = getOrCreateSession(sessionId);

  const encoder = new TextEncoder();
  const responseStream = new ReadableStream({
    start(controller) {
      // 1. Send all buffered terminal output scrollback instantly
      for (const chunk of session.outputBuffer) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'output', data: chunk })}\n\n`));
      }

      // 2. Define data dispatcher listener
      const listener = (data: string) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'output', data })}\n\n`));
        } catch (err) {
          console.error('[Terminal SSE Stream] Failed to dispatch chunk:', err);
          cleanup();
        }
      };

      session.listeners.add(listener);

      // Keep Cloud Run alive via periodic SSE heartbeats (every 15s)
      const heartbeatTimer = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'heartbeat' })}\n\n`));
        } catch {
          cleanup();
        }
      }, 15000);

      const cleanup = () => {
        clearInterval(heartbeatTimer);
        session.listeners.delete(listener);
        try {
          controller.close();
        } catch {}
      };

      // Register connection close listeners
      req.signal.addEventListener('abort', () => {
        cleanup();
      });
    }
  });

  return new Response(responseStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Content-Encoding': 'none',
    },
  });
}
