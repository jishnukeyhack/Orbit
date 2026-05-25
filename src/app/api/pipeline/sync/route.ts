// ============================================
// Orbit — Database Cloud-Sync Reconciliation API
// GET /api/pipeline/sync → returns row counts & status
// POST /api/pipeline/sync → pushes unsynced SQLite records to Supabase
// ============================================
import { NextRequest, NextResponse } from 'next/server';
import { getSyncStats, reconcileLocalData } from '@/lib/server/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || undefined;

    const stats = await getSyncStats(userId);
    return NextResponse.json(stats);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const userId = body.userId || undefined;

    const result = await reconcileLocalData(userId);
    return NextResponse.json({
      success: true,
      message: 'Database reconciliation completed successfully',
      result
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
