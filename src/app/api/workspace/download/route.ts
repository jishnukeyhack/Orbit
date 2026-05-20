import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { ensureWorkspace } from '../../../../lib/server/tools';

export const dynamic = 'force-dynamic';

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(req: NextRequest) {
  try {
    const ws = ensureWorkspace();
    const { searchParams } = new URL(req.url);
    const filepath = searchParams.get('path') ?? '';
    const agentId = searchParams.get('agentId') ?? '';
    const swarmId = searchParams.get('swarmId') ?? '';
    
    // Resolve target directory relative to either the swarm, agent workspace, or global workspace
    let baseDir = ws;
    if (swarmId) {
      baseDir = path.join(ws, 'swarms', swarmId.replace(/[^a-zA-Z0-9-_]/g, '-'));
    } else if (agentId) {
      baseDir = path.join(ws, 'agents', agentId.replace(/[^a-zA-Z0-9-_]/g, '-'));
    }

    if (!filepath) {
      // If path is missing but swarmId or agentId is present, download the entire workspace
      if (swarmId || agentId) {
        const dirName = swarmId
          ? swarmId.replace(/[^a-zA-Z0-9-_]/g, '-')
          : agentId.replace(/[^a-zA-Z0-9-_]/g, '-');
        const targetDir = baseDir;
        if (!existsSync(targetDir)) {
          return NextResponse.json({ error: 'Workspace is empty' }, { status: 404 });
        }
        const tempZipName = `workspace-${dirName}-${Date.now()}.zip`;
        const tempZipPath = path.join(ws, tempZipName);
        const parentDir = path.dirname(targetDir);
        try {
          await execAsync(`tar -a -c -f "${tempZipPath}" -C "${parentDir}" "${dirName}"`);
          const zipContent = await fs.readFile(tempZipPath);
          const zipSize = zipContent.length;
          await fs.unlink(tempZipPath);
          
          return new Response(zipContent, {
            headers: {
              'Content-Type': 'application/zip',
              'Content-Disposition': `attachment; filename="${dirName}-workspace.zip"`,
              'Content-Length': zipSize.toString(),
            },
          });
        } catch (err) {
          return NextResponse.json({ error: `Failed to zip workspace: ${String(err)}` }, { status: 500 });
        }
      }
      return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 });
    }

    const targetFile = path.resolve(baseDir, filepath);
    if (!targetFile.startsWith(baseDir)) {
      return NextResponse.json({ error: 'Access Denied: Path outside workspace bounds' }, { status: 403 });
    }

    if (!existsSync(targetFile)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const stat = await fs.stat(targetFile);
    if (stat.isDirectory()) {
      const dirName = path.basename(targetFile);
      const parentDir = path.dirname(targetFile);
      const tempZipName = `dir-${dirName}-${Date.now()}.zip`;
      const tempZipPath = path.join(ws, tempZipName);
      
      try {
        await execAsync(`tar -a -c -f "${tempZipPath}" -C "${parentDir}" "${dirName}"`);
        const zipContent = await fs.readFile(tempZipPath);
        const zipSize = zipContent.length;
        await fs.unlink(tempZipPath);
        
        return new Response(zipContent, {
          headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="${dirName}.zip"`,
            'Content-Length': zipSize.toString(),
          },
        });
      } catch (err) {
        return NextResponse.json({ error: `Failed to zip directory: ${String(err)}` }, { status: 500 });
      }
    }

    const fileContent = await fs.readFile(targetFile);
    const filename = path.basename(targetFile);

    return new Response(fileContent, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': stat.size.toString(),
      },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
