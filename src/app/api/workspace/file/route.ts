import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get('agentId');
  const filepath = searchParams.get('path');

  if (!agentId || !filepath) {
    return new Response('agentId and path are required', { status: 400 });
  }

  const safeAgentId = agentId.replace(/[^a-z0-9-]/g, '-');
  const workspaceRoot = path.join(process.cwd(), 'orbit-workspace', 'agents', safeAgentId);

  // Prevent path traversal
  const targetPath = path.normalize(path.join(workspaceRoot, filepath));
  if (!targetPath.startsWith(workspaceRoot)) {
    return new Response('Invalid path', { status: 403 });
  }

  try {
    if (!fs.existsSync(targetPath)) {
      return new Response('File not found', { status: 404 });
    }
    
    const content = fs.readFileSync(targetPath, 'utf8');
    return new Response(content, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err) {
    return new Response('Error reading file', { status: 500 });
  }
}
