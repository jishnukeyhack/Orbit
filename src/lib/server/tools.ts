// ============================================
// Orbit — Real Tool Executor
// Ported from OpenSwarm src/adapters/tools.ts
// Actual fs operations + bash execution in sandbox
// ============================================
import fs from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { recordWorkspaceFile } from './db';

const execAsync = promisify(exec);

function recordFileOp(cwd: string, filePath: string, content: string, action: string) {
  try {
    let runId = 'system';
    
    // Check if Swarm workspace: orbit-workspace/swarms/swarm-XXXX
    if (cwd.includes('swarms')) {
      const parts = cwd.split(/[/\\]/);
      const swarmDir = parts.find(p => p.startsWith('swarm-'));
      if (swarmDir) {
        runId = swarmDir;
      }
    }
    // Check if Project workspace: orbit-workspace/projects/projectName-run-XXXX
    else if (cwd.includes('projects')) {
      const parts = cwd.split(/[/\\]/);
      const projectDir = parts.find(p => p.includes('-run-') || p.includes('run-'));
      if (projectDir) {
        runId = projectDir;
      } else {
        const lastDir = parts[parts.length - 1];
        if (lastDir) runId = lastDir;
      }
    }
    
    recordWorkspaceFile(runId, path.basename(filePath), content, action);
  } catch (err) {
    console.error("Failed to record workspace file in db:", err);
  }
}

// ============================================
// Workspace Management
// ============================================

const WORKSPACE_ROOT = path.join(process.cwd(), 'orbit-workspace');

export function ensureWorkspace(): string {
  if (!existsSync(WORKSPACE_ROOT)) {
    mkdirSync(WORKSPACE_ROOT, { recursive: true });
    mkdirSync(path.join(WORKSPACE_ROOT, 'projects'), { recursive: true });
    mkdirSync(path.join(WORKSPACE_ROOT, 'outputs'), { recursive: true });
  }
  return WORKSPACE_ROOT;
}

export function getProjectPath(projectName: string): string {
  const ws = ensureWorkspace();
  const projectPath = path.join(ws, 'projects', projectName.replace(/[^a-zA-Z0-9-_]/g, '-'));
  if (!existsSync(projectPath)) {
    mkdirSync(projectPath, { recursive: true });
  }
  return projectPath;
}

// ============================================
// Safety Guards (from OpenSwarm tools.ts)
// ============================================

const BLOCKED_PATTERNS = [
  /\brm\s+(-[rR]f?|--recursive)\s+\/\b/,
  /\bgit\s+reset\s+--hard\b/,
  /\bformat\s+[A-Z]:\b/i,
  /\bdrop\s+database\b/i,
  /\btruncate\s+table\b/i,
  /\bdel\s+\/[Ff]\s/i,
];

function isBlocked(cmd: string): boolean {
  return BLOCKED_PATTERNS.some(p => p.test(cmd));
}

function validatePath(filePath: string, cwd: string): string {
  // Allow absolute paths within workspace OR relative paths
  if (path.isAbsolute(filePath)) {
    // Must be within workspace
    if (!filePath.startsWith(WORKSPACE_ROOT) && !filePath.startsWith(cwd)) {
      throw new Error(`Path outside workspace: ${filePath}`);
    }
    return filePath;
  }
  return path.resolve(cwd, filePath);
}

// ============================================
// Tool Interfaces
// ============================================

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

export interface ToolResult {
  id: string;
  output: string;
  isError: boolean;
  filesChanged?: string[];
}

// ============================================
// Real Tool Implementations
// ============================================

export async function executeTool(call: ToolCall, cwd: string): Promise<ToolResult> {
  try {
    switch (call.name) {
      case 'read_file': {
        const filePath = validatePath(call.args.path as string, cwd);
        const content = await fs.readFile(filePath, 'utf-8');
        const lines = content.split('\n');
        const offset = (call.args.offset as number) ?? 0;
        const limit = (call.args.limit as number) ?? 200;
        const slice = lines.slice(offset, offset + limit);
        const result = slice.map((l, i) => `${offset + i + 1}\t${l}`).join('\n');
        const more = lines.length > offset + limit ? `\n...(${lines.length - offset - limit} more lines)` : '';
        return { id: call.id, output: result + more, isError: false };
      }

      case 'write_file': {
        const filePath = validatePath(call.args.path as string, cwd);
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        const content = call.args.content as string;
        await fs.writeFile(filePath, content, 'utf-8');
        recordFileOp(cwd, filePath, content, 'created');
        return { id: call.id, output: `✓ Written: ${path.relative(cwd, filePath)}`, isError: false, filesChanged: [filePath] };
      }

      case 'edit_file': {
        const filePath = validatePath(call.args.path as string, cwd);
        const original = await fs.readFile(filePath, 'utf-8');
        const oldStr = call.args.old_string as string;
        const newStr = call.args.new_string as string;
        if (!original.includes(oldStr)) {
          return { id: call.id, output: `old_string not found in ${path.basename(filePath)}`, isError: true };
        }
        const updated = original.replace(oldStr, newStr);
        await fs.writeFile(filePath, updated, 'utf-8');
        recordFileOp(cwd, filePath, updated, 'updated');
        return { id: call.id, output: `✓ Edited: ${path.relative(cwd, filePath)}`, isError: false, filesChanged: [filePath] };
      }

      case 'bash': {
        const command = call.args.command as string;
        if (isBlocked(command)) {
          return { id: call.id, output: `BLOCKED: destructive command not allowed`, isError: true };
        }
        const { stdout, stderr } = await execAsync(command, {
          cwd,
          timeout: 60000,
          maxBuffer: 1024 * 1024,
          env: { ...process.env, NODE_ENV: 'development' },
          windowsHide: true,
        });
        const output = stdout + (stderr ? `\n[stderr] ${stderr}` : '');
        return { id: call.id, output: output.slice(0, 12000) || '(no output)', isError: false };
      }

      case 'list_dir': {
        const dirPath = validatePath((call.args.path as string) ?? cwd, cwd);
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        const lines = entries.map(e => `${e.isDirectory() ? 'd' : 'f'} ${e.name}`);
        return { id: call.id, output: lines.join('\n') || '(empty)', isError: false };
      }

      case 'mkdir': {
        const dirPath = validatePath(call.args.path as string, cwd);
        await fs.mkdir(dirPath, { recursive: true });
        return { id: call.id, output: `✓ Created directory: ${path.relative(cwd, dirPath)}`, isError: false };
      }

      case 'grep_files': {
        const pattern = call.args.pattern as string;
        const searchPath = call.args.path ? validatePath(call.args.path as string, cwd) : cwd;
        const flags = (call.args.flags as string) ?? '-rn --include="*.ts" --include="*.tsx" --include="*.js" --include="*.py" --include="*.json"';
        const isWindows = process.platform === 'win32';
        let grepCmd: string;
        if (isWindows) {
          // Try ripgrep first, fall back to findstr
          grepCmd = `rg ${flags} "${pattern}" "${searchPath}" 2>nul || findstr /s /n "${pattern}" "${searchPath}\\*"`;
        } else {
          grepCmd = `grep ${flags} "${pattern}" "${searchPath}" 2>/dev/null || echo "(no matches)"`;
        }
        try {
          const { stdout } = await execAsync(grepCmd, { cwd, timeout: 15000, maxBuffer: 1024 * 512, windowsHide: true });
          return { id: call.id, output: stdout.slice(0, 8000) || '(no matches)', isError: false };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return { id: call.id, output: `(no matches found for "${pattern}")`, isError: false };
        }
      }

      case 'git_status': {
        try {
          const { stdout } = await execAsync('git status', { cwd, timeout: 10000, windowsHide: true });
          return { id: call.id, output: stdout || '(no git repo)', isError: false };
        } catch {
          return { id: call.id, output: 'Not a git repository or git not installed', isError: false };
        }
      }

      case 'git_diff': {
        const target = (call.args.target as string) ?? '';
        try {
          const { stdout } = await execAsync(`git diff ${target}`, { cwd, timeout: 15000, maxBuffer: 1024 * 512, windowsHide: true });
          return { id: call.id, output: stdout.slice(0, 8000) || '(no changes)', isError: false };
        } catch {
          return { id: call.id, output: 'Not a git repository or git not installed', isError: false };
        }
      }

      case 'git_commit': {
        const message = (call.args.message as string) || 'Automated commit by Orbit AI';
        if (isBlocked('git reset --hard')) { // git_commit is safe, but verify message
          return { id: call.id, output: 'BLOCKED', isError: true };
        }
        try {
          const { stdout } = await execAsync(
            `git add -A && git commit -m "${message.replace(/"/g, "'")}" 2>&1 || echo "Nothing to commit"`,
            { cwd, timeout: 15000, windowsHide: true }
          );
          return { id: call.id, output: stdout || 'Committed', isError: false };
        } catch (err) {
          return { id: call.id, output: `Git error: ${err instanceof Error ? err.message : String(err)}`, isError: true };
        }
      }

      case 'git_log': {
        const n = (call.args.n as number) ?? 10;
        try {
          const { stdout } = await execAsync(`git log --oneline -${n}`, { cwd, timeout: 10000, windowsHide: true });
          return { id: call.id, output: stdout || '(no commits)', isError: false };
        } catch {
          return { id: call.id, output: 'Not a git repository', isError: false };
        }
      }

      case 'delete_file': {
        const filePath = validatePath(call.args.path as string, cwd);
        await fs.unlink(filePath);
        recordFileOp(cwd, filePath, '', 'deleted');
        return { id: call.id, output: `✓ Deleted: ${path.relative(cwd, filePath)}`, isError: false };
      }

      case 'move_file': {
        const src = validatePath(call.args.from as string, cwd);
        const dest = validatePath(call.args.to as string, cwd);
        await fs.mkdir(path.dirname(dest), { recursive: true });
        await fs.rename(src, dest);
        return { id: call.id, output: `✓ Moved: ${path.relative(cwd, src)} → ${path.relative(cwd, dest)}`, isError: false };
      }

      default:
        return { id: call.id, output: `Unknown tool: ${call.name}`, isError: true };
    }
  } catch (err) {
    return { id: call.id, output: `Error: ${err instanceof Error ? err.message : String(err)}`, isError: true };
  }
}

export async function executeTools(calls: ToolCall[], cwd: string): Promise<ToolResult[]> {
  const results: ToolResult[] = [];
  for (const call of calls) {
    results.push(await executeTool(call, cwd));
  }
  return results;
}

// ============================================
// Tool Definitions (OpenAI function calling format)
// ============================================

export const REAL_TOOL_DEFINITIONS = [
  { type: 'function', function: { name: 'think', description: 'Think through a problem step by step before taking action', parameters: { type: 'object', properties: { reasoning: { type: 'string' } }, required: ['reasoning'] } } },
  { type: 'function', function: { name: 'read_file', description: 'Read file contents (paginated)', parameters: { type: 'object', properties: { path: { type: 'string' }, offset: { type: 'number' }, limit: { type: 'number' } }, required: ['path'] } } },
  { type: 'function', function: { name: 'write_file', description: 'Write/create a file with full content', parameters: { type: 'object', properties: { path: { type: 'string' }, content: { type: 'string' } }, required: ['path', 'content'] } } },
  { type: 'function', function: { name: 'edit_file', description: 'Replace an exact string in a file (surgical edit)', parameters: { type: 'object', properties: { path: { type: 'string' }, old_string: { type: 'string' }, new_string: { type: 'string' } }, required: ['path', 'old_string', 'new_string'] } } },
  { type: 'function', function: { name: 'delete_file', description: 'Delete a file', parameters: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] } } },
  { type: 'function', function: { name: 'move_file', description: 'Move/rename a file', parameters: { type: 'object', properties: { from: { type: 'string' }, to: { type: 'string' } }, required: ['from', 'to'] } } },
  { type: 'function', function: { name: 'list_dir', description: 'List directory contents', parameters: { type: 'object', properties: { path: { type: 'string' } }, required: [] } } },
  { type: 'function', function: { name: 'mkdir', description: 'Create a directory', parameters: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] } } },
  { type: 'function', function: { name: 'grep_files', description: 'Search files for a pattern using ripgrep/grep', parameters: { type: 'object', properties: { pattern: { type: 'string' }, path: { type: 'string' }, flags: { type: 'string' } }, required: ['pattern'] } } },
  { type: 'function', function: { name: 'bash', description: 'Execute a shell command (npm, python, git, etc)', parameters: { type: 'object', properties: { command: { type: 'string' } }, required: ['command'] } } },
  { type: 'function', function: { name: 'git_status', description: 'Show git repository status', parameters: { type: 'object', properties: {}, required: [] } } },
  { type: 'function', function: { name: 'git_diff', description: 'Show git diff of uncommitted changes', parameters: { type: 'object', properties: { target: { type: 'string' } }, required: [] } } },
  { type: 'function', function: { name: 'git_commit', description: 'Stage all changes and create a git commit', parameters: { type: 'object', properties: { message: { type: 'string' } }, required: ['message'] } } },
  { type: 'function', function: { name: 'git_log', description: 'Show recent git commit history', parameters: { type: 'object', properties: { n: { type: 'number' } }, required: [] } } },
];

