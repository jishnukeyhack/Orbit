// ============================================
// Orbit — Real Terminal Server
// WebSocket-based and HTTP/SSE-based shell with actual command execution
// Works on Windows (cmd/powershell) and Linux/Mac (bash)
// Supports multi-tenant same-origin unified stream transport on single-port environments
// ============================================

import { WebSocketServer, WebSocket } from 'ws';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import path from 'path';
import { ensureWorkspace } from '@/lib/server/tools';

export interface TerminalSession {
  id: string;
  shell: ChildProcessWithoutNullStreams;
  alive: boolean;
  outputBuffer: string[];
  listeners: Set<(data: string) => void>;
  lastActivity: number;
}

export const sessions = new Map<string, TerminalSession>();

// Register absolute cleanup of dead/idle sessions
if (typeof global !== 'undefined' && !(global as any)._terminal_cleanup_registered) {
  (global as any)._terminal_cleanup_registered = true;
  setInterval(() => {
    const now = Date.now();
    for (const [id, session] of sessions.entries()) {
      if (now - session.lastActivity > 15 * 60 * 1000) { // 15 mins idle
        console.log(`[Terminal Server] Cleaning up idle session: ${id}`);
        session.alive = false;
        if (!session.shell.killed) {
          session.shell.kill();
        }
        sessions.delete(id);
      }
    }
  }, 60000);
}

export function getOrCreateSession(sessionId: string): TerminalSession {
  let session = sessions.get(sessionId);
  if (session && session.alive) {
    session.lastActivity = Date.now();
    return session;
  }

  const workspace = ensureWorkspace();
  const isWindows = process.platform === 'win32';

  console.log(`[Terminal Server] Spawning new shell session ${sessionId} inside ${workspace}`);

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

  const newSession: TerminalSession = {
    id: sessionId,
    shell,
    alive: true,
    outputBuffer: [],
    listeners: new Set(),
    lastActivity: Date.now(),
  };

  sessions.set(sessionId, newSession);

  const handleData = (data: Buffer | string) => {
    newSession.lastActivity = Date.now();
    const str = typeof data === 'string' ? data : data.toString();
    newSession.outputBuffer.push(str);
    
    // Prevent buffer memory leak
    if (newSession.outputBuffer.length > 800) {
      newSession.outputBuffer.shift();
    }

    for (const listener of newSession.listeners) {
      try {
        listener(str);
      } catch (err) {
        console.error(`[Terminal Server] Listener dispatch failed:`, err);
      }
    }
  };

  shell.stdout.on('data', handleData);
  shell.stderr.on('data', handleData);

  shell.on('exit', (code) => {
    newSession.alive = false;
    console.log(`[Terminal Server] Process ${sessionId} exited with code ${code}`);
    handleData(`\r\nPTY Session closed. (Exit Code: ${code})\r\n`);
  });

  shell.on('error', (err) => {
    console.error(`[Terminal Server] shell error:`, err);
    handleData(`\r\n[Terminal Error] ${err.message}\r\n`);
  });

  // Welcome banner on startup
  setTimeout(() => {
    const welcome = `\x1b[36m╔══════════════════════════════════════╗\r\n║     Orbit AI Terminal — Ready        ║\r\n║  Workspace: ${path.basename(workspace).padEnd(26)}║\r\n╚══════════════════════════════════════╝\x1b[0m\r\n`;
    handleData(welcome);
  }, 200);

  return newSession;
}

let wss: WebSocketServer | null = null;
let serverPort = 3001;

export function startTerminalServer(port = 3001): WebSocketServer {
  if (wss) return wss;
  serverPort = port;

  try {
    wss = new WebSocketServer({ port });

    wss.on('connection', (ws: WebSocket) => {
      const sessionId = `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const session = getOrCreateSession(sessionId);

      const listener = (data: string) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'output', data }));
        }
      };

      session.listeners.add(listener);

      ws.on('message', (message: Buffer | string) => {
        try {
          const msg = JSON.parse(message.toString());
          if (msg.type === 'input' && session.alive) {
            session.shell.stdin.write(msg.data);
          } else if (msg.type === 'cmd' && session.alive) {
            const isWindows = process.platform === 'win32';
            const cmd = isWindows ? `${msg.command}\r\n` : `${msg.command}\n`;
            session.shell.stdin.write(cmd);
          }
        } catch {
          if (session.alive) {
            session.shell.stdin.write(message.toString());
          }
        }
      });

      ws.on('close', () => {
        session.listeners.delete(listener);
        // Delay session death in case it's a transient disconnect or refresh
        setTimeout(() => {
          if (session.listeners.size === 0) {
            session.alive = false;
            if (!session.shell.killed) {
              session.shell.kill();
            }
            sessions.delete(sessionId);
          }
        }, 5000);
      });
    });

    console.log(`[Orbit Terminal] WebSocket server running on ws://localhost:${port}`);
  } catch (err) {
    console.error('[Orbit Terminal] Failed to initialize WS server, likely blocked port. Continuing with HTTP fallbacks.', err);
  }

  return wss || new WebSocketServer({ noServer: true });
}

export function getTerminalPort(): number {
  return serverPort;
}
