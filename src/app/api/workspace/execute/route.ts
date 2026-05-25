// ============================================
// Orbit — Safe Sandbox Execution API
// Compiles and runs user-generated files (Python, Rust, Node.js)
// inside active agent workspaces
// ============================================
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import { ensureWorkspace } from '@/lib/server/tools';

const execAsync = promisify(exec);

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const ws = ensureWorkspace();
    const body = await request.json() as { path: string; agentId: string };
    const { path: relativePath, agentId } = body;

    if (!relativePath || !agentId) {
      return NextResponse.json({ error: 'Missing relative file path or agentId' }, { status: 400 });
    }

    const safeAgentId = agentId.replace(/[^a-zA-Z0-9-_]/g, '-');
    const agentWorkspace = path.join(ws, 'agents', safeAgentId);

    // Resolve target path and verify safety bounds
    const targetFile = path.resolve(agentWorkspace, relativePath);
    if (!targetFile.startsWith(agentWorkspace)) {
      return NextResponse.json({ error: 'Access Denied: Path outside workspace bounds' }, { status: 403 });
    }

    if (!existsSync(targetFile)) {
      return NextResponse.json({ error: `File not found: ${relativePath}` }, { status: 404 });
    }

    const ext = path.extname(targetFile).toLowerCase();
    const basename = path.basename(targetFile);
    let runCommand = '';

    // Map script compiler / runner commands based on file extensions
    if (ext === '.py') {
      runCommand = `python "${basename}"`;
    } else if (ext === '.js' || ext === '.mjs') {
      runCommand = `node "${basename}"`;
    } else if (ext === '.ts') {
      runCommand = `npx ts-node "${basename}"`;
    } else if (ext === '.rs') {
      const binName = path.basename(targetFile, '.rs');
      const isWindows = process.platform === 'win32';
      if (isWindows) {
        runCommand = `rustc "${basename}" -o "${binName}.exe" && "${binName}.exe"`;
      } else {
        runCommand = `rustc "${basename}" -o "${binName}" && "./${binName}"`;
      }
    } else if (ext === '.bat' && process.platform === 'win32') {
      runCommand = `"${basename}"`;
    } else if (ext === '.sh' && process.platform !== 'win32') {
      runCommand = `chmod +x "${basename}" && "./${basename}"`;
    } else {
      return NextResponse.json({
        error: `Sandbox execution is not supported for ${ext} files. Supported formats: .py, .rs, .js, .ts, .sh, .bat`
      }, { status: 400 });
    }

    const startTime = Date.now();
    let stdout = '';
    let stderr = '';
    let exitCode = 0;

    try {
      const { stdout: out, stderr: err } = await execAsync(runCommand, {
        cwd: agentWorkspace,
        timeout: 20000, // 20s timeout guard
        maxBuffer: 1024 * 1024,
        windowsHide: true,
      });
      stdout = out;
      stderr = err;
    } catch (err: any) {
      exitCode = err.code ?? 1;
      stdout = err.stdout ?? '';
      stderr = err.stderr ?? err.message ?? String(err);
    }

    const executionTimeMs = Date.now() - startTime;

    return NextResponse.json({
      success: exitCode === 0,
      stdout,
      stderr,
      exitCode,
      executionTimeMs,
      commandExecuted: runCommand
    });

  } catch (err: any) {
    return NextResponse.json({ error: `System execution error: ${err.message}` }, { status: 500 });
  }
}
