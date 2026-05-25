import { NextRequest, NextResponse } from 'next/server';
import { getAgentById } from '@/lib/agents-data';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const agent = getAgentById(id);
  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  const liveStats = {
    ...agent,
    liveStatus: Math.random() > 0.7 ? 'working' : Math.random() > 0.5 ? 'idle' : 'reviewing',
    currentTask: Math.random() > 0.6 ? {
      id: `task-${Math.floor(Math.random() * 1000)}`,
      title: 'Analyzing codebase structure',
      startedAt: Date.now() - Math.floor(Math.random() * 300000),
    } : null,
    tokenUsageToday: Math.floor(Math.random() * 50000),
    tasksToday: Math.floor(Math.random() * 15),
  };

  return NextResponse.json(liveStats);
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const agent = getAgentById(id);
  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  const body = await req.json();
  const { action } = body;

  if (!['start', 'stop', 'pause'].includes(action)) {
    return NextResponse.json({ error: 'action must be start, stop, or pause' }, { status: 400 });
  }

  const statusMap: Record<string, string> = { start: 'working', stop: 'idle', pause: 'paused' };
  return NextResponse.json({
    ...agent,
    liveStatus: statusMap[action],
    message: `Agent ${action}ed successfully`,
  });
}
