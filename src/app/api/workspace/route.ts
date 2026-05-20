// ============================================
// Orbit — Unified Workspace Browser API
// Supports:
// 1. General workspace browser tree (action=tree)
// 2. File content reading (action=read)
// 3. Flat file listing scoped by agentId (default)
// ============================================
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { ensureWorkspace } from '../../../lib/server/tools';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: number;
  children?: FileNode[];
}

interface WorkspaceFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size: number;
  mtime: number;
}

async function buildTree(workspaceRoot: string, dirPath: string, maxDepth = 3, currentDepth = 0): Promise<FileNode[]> {
  if (currentDepth >= maxDepth) return [];
  
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const nodes: FileNode[] = [];
    
    for (const entry of entries.slice(0, 50)) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(workspaceRoot, fullPath);
      
      if (entry.isDirectory()) {
        const children = await buildTree(workspaceRoot, fullPath, maxDepth, currentDepth + 1);
        nodes.push({ name: entry.name, path: relativePath, type: 'directory', children });
      } else {
        try {
          const stat = await fs.stat(fullPath);
          nodes.push({
            name: entry.name,
            path: relativePath,
            type: 'file',
            size: stat.size,
            modified: stat.mtimeMs,
          });
        } catch { /* skip */ }
      }
    }
    
    return nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const ws = ensureWorkspace();
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path') ?? '';
    const agentId = searchParams.get('agentId');
    const action = searchParams.get('action');

    // Scoped workspace root
    let workspaceRoot = ws;
    if (agentId) {
      const safeAgentId = agentId.replace(/[^a-zA-Z0-9-_]/g, '-');
      workspaceRoot = path.join(ws, 'agents', safeAgentId);
    }

    // Resolve target path and verify safety bounds
    const targetPath = path.resolve(workspaceRoot, filePath);
    if (!targetPath.startsWith(workspaceRoot)) {
      return NextResponse.json({ error: 'Access Denied: Path outside workspace bounds' }, { status: 403 });
    }

    // 1. File reading mode
    if (action === 'read') {
      try {
        if (!existsSync(targetPath)) {
          return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }
        const content = await fs.readFile(targetPath, 'utf-8');
        return NextResponse.json({ content, path: filePath });
      } catch {
        return NextResponse.json({ error: 'Failed to read file' }, { status: 500 });
      }
    }

    // 2. Directory tree mode (for general Sidebar explorer)
    if (action === 'tree') {
      if (!existsSync(workspaceRoot)) {
        return NextResponse.json({ tree: [], empty: true, workspace: workspaceRoot });
      }
      const tree = await buildTree(workspaceRoot, workspaceRoot);
      let totalFiles = 0;
      let totalSize = 0;
      const countFiles = (nodes: FileNode[]) => {
        for (const n of nodes) {
          if (n.type === 'file') { totalFiles++; totalSize += n.size ?? 0; }
          if (n.children) countFiles(n.children);
        }
      };
      countFiles(tree);
      return NextResponse.json({
        tree,
        stats: { totalFiles, totalSize, workspace: workspaceRoot },
      });
    }

    // 3. Flat file listing scoped by agentId (default behavior expected by Agents Page Workspace Modal)
    if (!existsSync(targetPath)) {
      return NextResponse.json({ files: [] });
    }

    const entries = await fs.readdir(targetPath, { withFileTypes: true });
    const files: WorkspaceFile[] = await Promise.all(
      entries.map(async (entry) => {
        const entryPath = path.join(targetPath, entry.name);
        const relativePath = path.relative(workspaceRoot, entryPath);
        let size = 0;
        let mtime = Date.now();
        
        try {
          const stats = await fs.stat(entryPath);
          size = stats.size;
          mtime = stats.mtimeMs;
        } catch { /* ignore */ }

        return {
          name: entry.name,
          path: relativePath.replace(/\\/g, '/'),
          type: entry.isDirectory() ? 'dir' : 'file',
          size,
          mtime,
        };
      })
    );

    return NextResponse.json({ files });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
