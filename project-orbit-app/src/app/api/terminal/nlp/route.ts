// POST /api/terminal/nlp — Convert natural language to shell command and execute
import { NextRequest, NextResponse } from 'next/server';
import { nlpToCommand, executeTerminalCommand } from '@/lib/openswarm/nlpTerminal';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const body = await request.json() as { input: string; execute?: boolean };
  const { input, execute = true } = body;

  if (!input?.trim()) {
    return NextResponse.json({ error: 'Input required' }, { status: 400 });
  }

  const { interpretation, command, isNlp } = await nlpToCommand(input);

  if (!command) {
    return NextResponse.json({
      interpretation,
      command: null,
      output: "I couldn't convert that to a safe shell command. Try rephrasing or use a direct command.",
      isError: false,
      isNlp,
    });
  }

  if (!execute) {
    return NextResponse.json({ interpretation, command, isNlp });
  }

  const workspaceRoot = path.join(process.cwd(), 'orbit-workspace');
  const result = await executeTerminalCommand(command, workspaceRoot);

  return NextResponse.json({
    interpretation,
    command,
    isNlp,
    output: result.output,
    isError: result.isError,
    durationMs: result.durationMs,
  });
}
