import { NextRequest, NextResponse } from 'next/server';
import { searchKnowledge, getKnowledgeForCategory } from '@/lib/openswarm/agentKnowledge';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') ?? undefined;
    const query = searchParams.get('query') ?? '';

    let results = [];
    if (query) {
      results = searchKnowledge(query, category);
    } else if (category && category !== 'all') {
      results = getKnowledgeForCategory(category);
    } else {
      results = searchKnowledge('');
    }

    return NextResponse.json({
      documents: results.map(doc => ({
        id: doc.id,
        title: doc.title,
        category: doc.category,
        source: doc.source,
        tags: doc.tags,
        // Shorten the content preview for the listing, return full document if queried explicitly
        preview: doc.content.slice(0, 300) + '...',
        content: doc.content
      }))
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
