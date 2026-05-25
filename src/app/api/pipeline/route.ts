// ============================================
// Orbit — Pipeline Runs History API
// Real data from SQLite
// ============================================
import { NextRequest } from 'next/server';
import { listPipelineRuns, getPipelineLogs, getOrbitStats, getOrbitAnalytics, deletePipelineRun } from '@/lib/server/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action') ?? 'list';
  const userId = searchParams.get('userId') || undefined;

  if (action === 'stats') {
    const stats = getOrbitStats(userId);
    return Response.json(stats);
  }

  if (action === 'analytics') {
    const limit = parseInt(searchParams.get('days') ?? '14', 10);
    const data = getOrbitAnalytics(userId, limit);
    return Response.json(data);
  }

  if (action === 'logs') {
    const runId = searchParams.get('runId');
    if (!runId) return Response.json({ error: 'runId required' }, { status: 400 });
    const logs = getPipelineLogs(runId);
    return Response.json({ logs });
  }

  const limit = parseInt(searchParams.get('limit') ?? '50', 10);
  const runs = listPipelineRuns(limit, userId);
  const parsed = runs.map(r => ({
    ...r,
    result: r.result_json ? JSON.parse(r.result_json) : null,
  }));

  return Response.json({ runs: parsed, total: parsed.length });
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const runId = searchParams.get('runId');
    if (!runId) {
      return Response.json({ error: 'runId required' }, { status: 400 });
    }

    deletePipelineRun(runId);
    return Response.json({ success: true, message: 'Pipeline run deleted successfully' });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
