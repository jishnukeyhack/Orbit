import { NextRequest, NextResponse } from 'next/server';
import { listMemories, saveMemory, getMemoryStats } from '@/lib/openswarm/memoryEngine';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') as 'belief' | 'strategy' | 'constraint' | 'user_model' | 'system_pattern' | null;
  const repo = searchParams.get('repo') ?? undefined;
  const limit = parseInt(searchParams.get('limit') ?? '50', 10);

  const memories = listMemories({
    types: type ? [type] : undefined,
    repo,
    limit,
  });

  const stats = getMemoryStats();

  return NextResponse.json({ memories, stats, total: memories.length });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { type, repo, title, content, trust, importance, confidence, skipDistillation, derivedFrom } = body;

  if (!content) {
    return NextResponse.json({ error: 'content is required' }, { status: 400 });
  }

  const id = saveMemory(
    type ?? 'belief',
    repo ?? 'orbit',
    title ?? content.slice(0, 60),
    content,
    { trust, importance, confidence, skipDistillation, derivedFrom }
  );

  if (!id) {
    return NextResponse.json({
      stored: false,
      message: 'Content rejected by distillation engine (not significant enough to store)',
    });
  }

  return NextResponse.json({ stored: true, id, message: 'Memory saved successfully' }, { status: 201 });
}
