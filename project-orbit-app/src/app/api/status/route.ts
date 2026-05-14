// GET /api/status — System health check
import { NextResponse } from 'next/server';
import { loadAllAgents } from '@/lib/openswarm/agentRegistry';
import { getOrbitStats } from '@/lib/server/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const hasOpenAI = !!process.env.OPENAI_API_KEY;

  let dbOk = false;
  let stats = null;
  try {
    stats = getOrbitStats();
    dbOk = true;
  } catch {
    dbOk = false;
  }

  let agentCount = 0;
  try {
    agentCount = loadAllAgents().length;
  } catch {
    agentCount = 0;
  }

  return NextResponse.json({
    openai: hasOpenAI,
    database: dbOk,
    agentCount,
    version: '1.0.0-production',
    stats: stats ?? null,
    model: hasOpenAI ? 'gpt-4o' : 'simulation',
    timestamp: Date.now(),
  });
}
