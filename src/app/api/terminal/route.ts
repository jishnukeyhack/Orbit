// ============================================
// Orbit — Terminal API Route
// Starts the WS server on first request, returns port
// ============================================
import { NextRequest } from 'next/server';
import { startTerminalServer, getTerminalPort } from '@/lib/server/terminalServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    startTerminalServer(3001);
    return Response.json({
      wsUrl: `ws://localhost:${getTerminalPort()}`,
      port: getTerminalPort(),
      ready: true,
    });
  } catch (err) {
    return Response.json({
      error: err instanceof Error ? err.message : 'Failed to start terminal',
      ready: false,
    }, { status: 500 });
  }
}
