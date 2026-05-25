// GET /api/agents — List all agents from registry
// POST /api/agents — (future: create custom agent)
import { NextRequest, NextResponse } from 'next/server';
import { loadAllAgents, getCategoryMeta } from '@/lib/openswarm/agentRegistry';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  console.log("DEBUG AGENT PATHS:", {
    cwd: process.cwd(),
    localExists: fs.existsSync(path.join(process.cwd(), 'agency-agents-main')),
    localPathResolved: path.join(process.cwd(), 'agency-agents-main'),
    filesInCwd: fs.existsSync(process.cwd()) ? fs.readdirSync(process.cwd()) : []
  });

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
