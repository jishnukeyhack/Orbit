import { NextRequest, NextResponse } from 'next/server';
import { getDecisionEngine, SAMPLE_TASKS } from '@/lib/openswarm/decisionEngine';
import type { TaskItem } from '@/lib/openswarm/types';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  const engine = getDecisionEngine({
    allowedProjects: [],
    autoExecute: false,
    maxConsecutiveTasks: 5,
    cooldownSeconds: 60,
    dryRun: body.dryRun ?? false,
  });

  if (action === 'heartbeat') {
    const tasks: TaskItem[] = body.tasks ?? SAMPLE_TASKS;
    const result = engine.heartbeat(tasks);
    return NextResponse.json({ result, stats: engine.getStats() });
  }

  if (action === 'heartbeat_multiple') {
    const tasks: TaskItem[] = body.tasks ?? SAMPLE_TASKS;
    const maxTasks: number = body.maxTasks ?? 3;
    const result = engine.heartbeatMultiple(tasks, maxTasks);
    return NextResponse.json({ result, stats: engine.getStats() });
  }

  if (action === 'complete') {
    engine.markCompleted(body.taskId);
    return NextResponse.json({ success: true, stats: engine.getStats() });
  }

  if (action === 'fail') {
    engine.markFailed(body.taskId);
    return NextResponse.json({ success: true, stats: engine.getStats() });
  }

  if (action === 'update_projects') {
    engine.updateAllowedProjects(body.projects ?? []);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

export async function GET() {
  const engine = getDecisionEngine();
  const stats = engine.getStats();
  const sampleDecision = engine.heartbeat(SAMPLE_TASKS);

  return NextResponse.json({
    stats,
    sampleDecision,
    sampleTasks: SAMPLE_TASKS,
  });
}
