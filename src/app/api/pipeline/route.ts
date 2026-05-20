// ============================================
// Orbit — Pipeline Runs History API
// Real data from SQLite
// ============================================
import { NextRequest } from 'next/server';
import { listPipelineRuns, getPipelineLogs, getOrbitStats, getOrbitAnalytics } from '@/lib/server/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action') ?? 'list';

  if (action === 'stats') {
    const stats = getOrbitStats();
    return Response.json(stats);
  }

  if (action === 'analytics') {
    const limit = parseInt(searchParams.get('days') ?? '14', 10);
    const data = getOrbitAnalytics(limit);
    return Response.json(data);
  }

  if (action === 'logs') {
    const runId = searchParams.get('runId');
    if (!runId) return Response.json({ error: 'runId required' }, { status: 400 });
    const logs = getPipelineLogs(runId);
    return Response.json({ logs });
  }

  const limit = parseInt(searchParams.get('limit') ?? '50', 10);
  const runs = listPipelineRuns(limit);
  const parsed = runs.map(r => ({
    ...r,
    result: r.result_json ? JSON.parse(r.result_json) : null,
  }));

  return Response.json({ runs: parsed, total: parsed.length });
}
