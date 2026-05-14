// GET /api/agents — List all agents from registry
// POST /api/agents — (future: create custom agent)
import { NextRequest, NextResponse } from 'next/server';
import { loadAllAgents, getCategoryMeta } from '@/lib/openswarm/agentRegistry';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const search = searchParams.get('search')?.toLowerCase();
  const limit = parseInt(searchParams.get('limit') ?? '100');

  let agents = loadAllAgents();

  if (category && category !== 'all') {
    agents = agents.filter(a => a.category === category);
  }

  if (search) {
    agents = agents.filter(a =>
      a.name.toLowerCase().includes(search) ||
      a.description.toLowerCase().includes(search) ||
      a.category.toLowerCase().includes(search)
    );
  }

  return NextResponse.json({
    agents: agents.slice(0, limit).map(a => ({
      id: a.id,
      name: a.name,
      description: a.description,
      color: a.color,
      emoji: a.emoji,
      vibe: a.vibe,
      category: a.category,
    })),
    total: agents.length,
    categories: getCategoryMeta(),
  });
}
