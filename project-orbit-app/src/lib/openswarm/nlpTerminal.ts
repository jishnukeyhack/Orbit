// ============================================
// Orbit — NLP Terminal Engine
// Converts natural language to shell commands via GPT-4o
// ============================================
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

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

export async function nlpToCommand(userInput: string): Promise<{
  interpretation: string;
  command: string | null;
  isNlp: boolean;
}> {
  const apiKey = process.env.OPENAI_API_KEY;

  // If it looks like a real command already, run it directly
  const rawCommandPattern = /^(ls|dir|cd|pwd|cat|echo|git|npm|node|python|pip|mkdir|touch|cp|mv|find|grep|curl|wget)\b/i;
  if (rawCommandPattern.test(userInput.trim())) {
    return { interpretation: userInput, command: userInput, isNlp: false };
  }

  if (!apiKey) {
    // Fallback heuristics without API
    const lowerInput = userInput.toLowerCase();
    if (lowerInput.includes('list') && lowerInput.includes('file')) {
      return { interpretation: 'List files in workspace', command: 'dir orbit-workspace', isNlp: true };
    }
    if (lowerInput.includes('show') && lowerInput.includes('workspace')) {
      return { interpretation: 'Show workspace directory', command: 'dir orbit-workspace', isNlp: true };
    }
    if (lowerInput.includes('npm') || lowerInput.includes('install')) {
      return { interpretation: 'Install packages', command: 'npm install', isNlp: true };
    }
    return { interpretation: 'Echo input', command: `echo "${userInput}"`, isNlp: true };
  }

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a terminal assistant that converts natural language to Windows PowerShell commands.
The workspace directory is: orbit-workspace/
The user is running on Windows.

Rules:
- Convert the user's natural language request to a single shell command
- Use Windows-compatible commands (dir instead of ls, type instead of cat, etc.)
- If the request is for git operations, use git commands
- If the request is for npm/node, use those commands
- For file listing, prefer: dir <path> /b
- NEVER output rm -rf or format commands
- Output ONLY a JSON object with keys: "interpretation" (brief human explanation) and "command" (the shell command)
- If the request cannot be converted to a safe command, set command to null`,
          },
          { role: 'user', content: userInput },
        ],
        temperature: 0,
        max_tokens: 200,
        response_format: { type: 'json_object' },
      }),
    });

    if (res.ok) {
      const data = await res.json() as { choices: Array<{ message: { content: string } }> };
      const parsed = JSON.parse(data.choices[0].message.content) as { interpretation: string; command: string | null };
      return { ...parsed, isNlp: true };
    }
  } catch {
    // Fall through to heuristics
  }

  return { interpretation: userInput, command: `echo "${userInput}"`, isNlp: true };
}

export async function executeTerminalCommand(
  command: string,
  workspaceRoot: string
): Promise<{ output: string; isError: boolean; durationMs: number }> {
  const startTime = Date.now();

  if (!isCommandSafe(command)) {
    return {
      output: '⛔ Command blocked for safety. Destructive commands are not allowed.',
      isError: true,
      durationMs: 0,
    };
  }

  // Ensure workspace exists
  const ws = path.join(process.cwd(), 'orbit-workspace');
  if (!fs.existsSync(ws)) fs.mkdirSync(ws, { recursive: true });

  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: ws,
      timeout: 30000,
      maxBuffer: 1024 * 512,
      env: { ...process.env },
      windowsHide: true,
      shell: 'cmd.exe',
    });

    const output = stdout + (stderr ? `\n[stderr] ${stderr}` : '');
    return {
      output: output.trim() || '(command ran with no output)',
      isError: false,
      durationMs: Date.now() - startTime,
    };
  } catch (err) {
    const error = err as { stdout?: string; stderr?: string; message?: string };
    const output = error.stdout || error.stderr || error.message || String(err);
    return {
      output: output.trim(),
      isError: true,
      durationMs: Date.now() - startTime,
    };
  }
}
