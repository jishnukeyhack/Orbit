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

const execAsync = promisify(exec);

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
        await fs.writeFile(filePath, call.args.content as string, 'utf-8');
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
        return { id: call.id, output: `✓ Edited: ${path.relative(cwd, filePath)}`, isError: false, filesChanged: [filePath] };
      }

      case 'bash': {
        const command = call.args.command as string;
        if (isBlocked(command)) {
          return { id: call.id, output: `BLOCKED: destructive command not allowed`, isError: true };
        }
        const { stdout, stderr } = await execAsync(command, {
          cwd,
          timeout: 30000,
          maxBuffer: 1024 * 512,
          env: { ...process.env, NODE_ENV: 'development' },
          windowsHide: true,
        });
        const output = stdout + (stderr ? `\n[stderr] ${stderr}` : '');
        return { id: call.id, output: output.slice(0, 8000) || '(no output)', isError: false };
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
  { type: 'function', function: { name: 'read_file', description: 'Read file contents', parameters: { type: 'object', properties: { path: { type: 'string' }, offset: { type: 'number' }, limit: { type: 'number' } }, required: ['path'] } } },
  { type: 'function', function: { name: 'write_file', description: 'Write content to file', parameters: { type: 'object', properties: { path: { type: 'string' }, content: { type: 'string' } }, required: ['path', 'content'] } } },
  { type: 'function', function: { name: 'edit_file', description: 'Replace string in file', parameters: { type: 'object', properties: { path: { type: 'string' }, old_string: { type: 'string' }, new_string: { type: 'string' } }, required: ['path', 'old_string', 'new_string'] } } },
  { type: 'function', function: { name: 'bash', description: 'Execute shell command', parameters: { type: 'object', properties: { command: { type: 'string' } }, required: ['command'] } } },
  { type: 'function', function: { name: 'list_dir', description: 'List directory contents', parameters: { type: 'object', properties: { path: { type: 'string' } }, required: [] } } },
  { type: 'function', function: { name: 'mkdir', description: 'Create directory', parameters: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] } } },
];
