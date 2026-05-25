// ============================================
// Orbit — Stateless Terminal Command Executor
// Runs commands statelessly and tracks/updates client cwd securely
// ============================================
import { NextRequest, NextResponse } from 'next/server';
import { ensureWorkspace } from '@/lib/server/tools';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BLOCKED_COMMANDS = [
  /rm\s+-[rRf]+\s+\//,
  /del\s+\/[fFsS]/i,
  /format\s+[A-Z]:/i,
  /shutdown/i,
  /mkfs/i,
  /dd\s+if=/,
];

function isCommandSafe(cmd: string): boolean {
  return !BLOCKED_COMMANDS.some(p => p.test(cmd));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { command, cwd } = body as { command: string; cwd?: string };

    if (!command) {
      return NextResponse.json({ error: 'Command is required' }, { status: 400 });
    }

    if (!isCommandSafe(command)) {
      return NextResponse.json({
        output: 'Command blocked for safety. Destructive actions are not allowed.',
        isError: true,
        cwd: cwd || '.',
      });
    }

    const workspaceRoot = ensureWorkspace();
    
    // Resolve start directory safely
    let startDir = workspaceRoot;
    if (cwd) {
      const resolvedCwd = path.isAbsolute(cwd) ? cwd : path.resolve(workspaceRoot, cwd);
      if (resolvedCwd.startsWith(workspaceRoot)) {
        startDir = resolvedCwd;
      }
    }

    const isWindows = process.platform === 'win32';
    let execCommand = '';
    
    if (isWindows) {
      // Escape paths and run
      execCommand = `cmd.exe /d /s /c "cd /d "${startDir}" && (${command}) & echo. & echo __ORBIT_CWD__ & cd"`;
    } else {
      execCommand = `bash -c "cd '${startDir}' && (${command}) ; echo; echo __ORBIT_CWD__; pwd"`;
    }

    const startTime = Date.now();
    try {
      const { stdout, stderr } = await execAsync(execCommand, {
        timeout: 30000,
        maxBuffer: 1024 * 1024,
        env: {
          ...process.env,
          NODE_ENV: 'development',
          FORCE_COLOR: '1',
        },
        windowsHide: true,
      });

      const fullOutput = stdout;
      const errorOutput = stderr;

      // Extract new CWD
      let outputText = fullOutput;
      let finalCwd = startDir;

      if (fullOutput.includes('__ORBIT_CWD__')) {
        const parts = fullOutput.split('__ORBIT_CWD__');
        outputText = parts[0];
        const rawCwd = parts[1]?.trim() || '';
        
        if (rawCwd) {
          const resolvedNewCwd = path.resolve(rawCwd);
          if (resolvedNewCwd.startsWith(workspaceRoot)) {
            finalCwd = resolvedNewCwd;
          } else {
            // Cap at workspaceRoot if they tried to escape
            finalCwd = workspaceRoot;
            outputText += '\n[System Warning] Directory escape blocked. CWD reset to workspace root.\n';
          }
        }
      }

      // Combine stdout & stderr cleanly
      let displayOutput = outputText.trim();
      if (errorOutput && errorOutput.trim()) {
        displayOutput += (displayOutput ? '\n' : '') + `[stderr] ${errorOutput.trim()}`;
      }

      const relativeCwd = path.relative(workspaceRoot, finalCwd) || '.';

      return NextResponse.json({
        output: displayOutput || '(command ran with no output)',
        isError: false,
        cwd: relativeCwd,
        durationMs: Date.now() - startTime,
      });

    } catch (err: any) {
      // Command execution failed or exited with non-zero code
      const errorOutput = err.stderr || err.message || String(err);
      let outputText = err.stdout || '';
      let finalCwd = startDir;

      if (outputText.includes('__ORBIT_CWD__')) {
        const parts = outputText.split('__ORBIT_CWD__');
        outputText = parts[0];
        const rawCwd = parts[1]?.trim() || '';
        if (rawCwd) {
          const resolvedNewCwd = path.resolve(rawCwd);
          if (resolvedNewCwd.startsWith(workspaceRoot)) {
            finalCwd = resolvedNewCwd;
          }
        }
      }

      let displayOutput = outputText.trim();
      if (errorOutput && errorOutput.trim()) {
        displayOutput += (displayOutput ? '\n' : '') + `${errorOutput.trim()}`;
      }

      const relativeCwd = path.relative(workspaceRoot, finalCwd) || '.';

      return NextResponse.json({
        output: displayOutput || 'Command failed with error.',
        isError: true,
        cwd: relativeCwd,
        durationMs: Date.now() - startTime,
      });
    }

  } catch (err: any) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Internal Server Error',
    }, { status: 500 });
  }
}
