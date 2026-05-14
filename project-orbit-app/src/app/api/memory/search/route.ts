import { NextRequest, NextResponse } from 'next/server';
import { searchMemory } from '@/lib/openswarm/memoryEngine';
import type { MemoryType } from '@/lib/openswarm/types';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { query, types, repo, minSimilarity, limit } = body;

  if (!query) {
    return NextResponse.json({ error: 'query is required' }, { status: 400 });
  }

  const results = searchMemory(query, {
    types: types as MemoryType[] | undefined,
    repo,
    minSimilarity: minSimilarity ?? 0.05,
    limit: limit ?? 10,
  });

  return NextResponse.json({
    query,
    results,
    total: results.length,
    topScore: results[0]?.score ?? 0,
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'q parameter required' }, { status: 400 });
  }

  const results = searchMemory(query, { limit: parseInt(searchParams.get('limit') ?? '10', 10) });
  return NextResponse.json({ query, results, total: results.length });
}
