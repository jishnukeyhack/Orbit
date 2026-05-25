// ============================================
// Orbit — Unified Terminal Input Route (HTTP POST)
// Pipes interactive client keystrokes and raw inputs into shell stdin
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateSession } from '@/lib/server/terminalServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { sessionId, data, type } = await req.json() as { sessionId: string; data: string; type?: string };

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    const session = getOrCreateSession(sessionId);
    if (!session.alive) {
      return NextResponse.json({ error: 'Shell process is dead' }, { status: 400 });
    }

    if (type === 'cmd') {
      const isWindows = process.platform === 'win32';
      const cmd = isWindows ? `${data}\r\n` : `${data}\n`;
      session.shell.stdin.write(cmd);
    } else {
      session.shell.stdin.write(data);
    }

    session.lastActivity = Date.now();

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown write error' }, { status: 500 });
  }
}
