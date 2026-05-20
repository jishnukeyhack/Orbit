// GET /api/status — System health check
import { NextResponse } from 'next/server';
import { loadAllAgents } from '@/lib/openswarm/agentRegistry';
import { getOrbitStats } from '@/lib/server/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasGemini = !!process.env.GEMINI_API_KEY;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;

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
    gemini: hasGemini,
    anthropic: hasAnthropic,
    database: dbOk,
    agentCount,
    version: '2.0.0-production',
    stats: stats ?? null,
    model: hasOpenAI ? 'gpt-4o' : hasGemini ? 'gemini-1.5-pro' : hasAnthropic ? 'claude-3-5-sonnet' : 'simulation',
    timestamp: Date.now(),
  });
}
