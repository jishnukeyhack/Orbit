// ============================================
// Orbit — Real Terminal Server
// WebSocket-based shell with actual command execution
// Works on Windows (cmd/powershell) and Linux/Mac (bash)
// ============================================

import { WebSocketServer, WebSocket } from 'ws';
import { spawn } from 'child_process';
import path from 'path';
import { ensureWorkspace } from '@/lib/server/tools';

let wss: WebSocketServer | null = null;
let serverPort = 3001;

export function startTerminalServer(port = 3001): WebSocketServer {
  if (wss) return wss;
  serverPort = port;

  wss = new WebSocketServer({ port });

  wss.on('connection', (ws: WebSocket) => {
    const workspace = ensureWorkspace();
    const isWindows = process.platform === 'win32';

    // Spawn a real shell
    const shell = spawn(
      isWindows ? 'cmd.exe' : 'bash',
      isWindows ? [] : ['--login'],
      {
        cwd: workspace,
        env: {
          ...process.env,
          TERM: 'xterm-256color',
          COLORTERM: 'truecolor',
          FORCE_COLOR: '1',
        },
        windowsHide: false,
      }
    );

    let alive = true;

    // Stream shell stdout to browser
    shell.stdout.on('data', (data: Buffer) => {
      if (alive && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'output', data: data.toString() }));
      }
    });

    // Stream stderr too
    shell.stderr.on('data', (data: Buffer) => {
      if (alive && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'output', data: data.toString() }));
      }
    });

    shell.on('exit', (code) => {
      alive = false;
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'exit', code }));
        ws.close();
      }
    });

    shell.on('error', (err) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'error', message: err.message }));
      }
    });

    // Receive input from browser → send to shell stdin
    ws.on('message', (message: Buffer | string) => {
      try {
        const msg = JSON.parse(message.toString());
        if (msg.type === 'input' && alive) {
          shell.stdin.write(msg.data);
        } else if (msg.type === 'resize') {
          // PTY resize would go here if using node-pty
        } else if (msg.type === 'cmd') {
          // Convenience: run a complete command
          if (alive) {
            const cmd = isWindows ? `${msg.command}\r\n` : `${msg.command}\n`;
            shell.stdin.write(cmd);
          }
        }
      } catch {
        // Not JSON — treat as raw input
        if (alive) {
          shell.stdin.write(message.toString());
        }
      }
    });

    ws.on('close', () => {
      alive = false;
      if (!shell.killed) {
        shell.kill();
      }
    });

    // Send welcome message
    setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'output',
          data: `\x1b[36m╔══════════════════════════════════════╗\r\n║     Orbit AI Terminal — Ready        ║\r\n║  Workspace: ${path.basename(workspace).padEnd(26)}║\r\n╚══════════════════════════════════════╝\x1b[0m\r\n`,
        }));
      }
    }, 100);
  });

  console.log(`[Orbit Terminal] WebSocket server running on ws://localhost:${port}`);
  return wss;
}

export function getTerminalPort(): number {
  return serverPort;
}
