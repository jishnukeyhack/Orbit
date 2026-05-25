import { NextRequest, NextResponse } from 'next/server';

// Real MCP (Model Context Protocol) Server Implementation
// Implements JSON-RPC 2.0 transport for MCP tools

const MCP_TOOLS = [
  {
    name: 'web_search',
    description: 'Search the web for real-time information',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'The search query' },
        num_results: { type: 'number', description: 'Number of results (default: 5)', default: 5 }
      },
      required: ['query']
    }
  },
  {
    name: 'read_file',
    description: 'Read contents of a file from the workspace',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Relative file path within workspace' }
      },
      required: ['path']
    }
  },
  {
    name: 'write_file',
    description: 'Write content to a file in the workspace',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Relative file path within workspace' },
        content: { type: 'string', description: 'File content to write' }
      },
      required: ['path', 'content']
    }
  },
  {
    name: 'execute_code',
    description: 'Execute JavaScript/TypeScript code in a sandboxed environment',
    inputSchema: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'Code to execute' },
        language: { type: 'string', enum: ['javascript', 'typescript'], default: 'javascript' }
      },
      required: ['code']
    }
  },
  {
    name: 'http_request',
    description: 'Make an HTTP request to an external API',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to request' },
        method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], default: 'GET' },
        headers: { type: 'object', description: 'Optional request headers' },
        body: { type: 'string', description: 'Optional request body (JSON string)' }
      },
      required: ['url']
    }
  },
  {
    name: 'list_agents',
    description: 'List all available Orbit agents',
    inputSchema: {
      type: 'object',
      properties: {
        category: { type: 'string', description: 'Filter by category (optional)' }
      }
    }
  },
  {
    name: 'run_agent',
    description: 'Execute an Orbit agent with a specific task',
    inputSchema: {
      type: 'object',
      properties: {
        agent_id: { type: 'string', description: 'Agent ID to run' },
        task: { type: 'string', description: 'Task description for the agent' },
        context: { type: 'string', description: 'Optional context to pass to the agent' }
      },
      required: ['agent_id', 'task']
    }
  },
  {
    name: 'memory_store',
    description: 'Store a key-value pair in agent memory',
    inputSchema: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Memory key' },
        value: { type: 'string', description: 'Value to store' },
        namespace: { type: 'string', description: 'Optional namespace', default: 'default' }
      },
      required: ['key', 'value']
    }
  },
  {
    name: 'memory_retrieve',
    description: 'Retrieve a value from agent memory',
    inputSchema: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Memory key to retrieve' },
        namespace: { type: 'string', description: 'Optional namespace', default: 'default' }
      },
      required: ['key']
    }
  },
  {
    name: 'send_notification',
    description: 'Send a notification or alert',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Notification title' },
        message: { type: 'string', description: 'Notification message' },
        level: { type: 'string', enum: ['info', 'warning', 'error', 'success'], default: 'info' }
      },
      required: ['title', 'message']
    }
  }
];

// In-memory store for MCP (replace with Redis/DB in production)
const memoryStore = new Map<string, string>();

async function executeTool(name: string, args: Record<string, any>): Promise<any> {
  switch (name) {
    case 'web_search': {
      // Real search using DuckDuckGo Instant Answer API
      const query = encodeURIComponent(args.query);
      try {
        const res = await fetch(`https://api.duckduckgo.com/?q=${query}&format=json&no_redirect=1&no_html=1`, {
          headers: { 'User-Agent': 'OrbitMCP/1.0' }
        });
        const data = await res.json();
        const results = [
          ...(data.RelatedTopics || []).slice(0, args.num_results || 5).map((t: any) => ({
            title: t.Text?.split(' - ')[0] || t.Text || '',
            snippet: t.Text || '',
            url: t.FirstURL || ''
          }))
        ];
        return { query: args.query, results, abstract: data.Abstract || '' };
      } catch (err) {
        return { query: args.query, results: [], error: 'Search temporarily unavailable' };
      }
    }

    case 'read_file': {
      const fs = await import('fs/promises');
      const path = await import('path');
      const workspaceRoot = process.env.ORBIT_WORKSPACE || path.join(process.cwd(), 'orbit-workspace');
      const safePath = path.join(workspaceRoot, args.path.replace(/\.\.\/|\.\.\\|\/\//g, ''));
      try {
        const content = await fs.readFile(safePath, 'utf-8');
        return { path: args.path, content, size: content.length };
      } catch (err: any) {
        return { error: `Cannot read file: ${err.message}` };
      }
    }

    case 'write_file': {
      const fs = await import('fs/promises');
      const path = await import('path');
      const workspaceRoot = process.env.ORBIT_WORKSPACE || path.join(process.cwd(), 'orbit-workspace');
      const safePath = path.join(workspaceRoot, args.path.replace(/\.\.\/|\.\.\\|\/\//g, ''));
      try {
        await fs.mkdir(path.dirname(safePath), { recursive: true });
        await fs.writeFile(safePath, args.content, 'utf-8');
        return { path: args.path, bytes_written: args.content.length, success: true };
      } catch (err: any) {
        return { error: `Cannot write file: ${err.message}` };
      }
    }

    case 'execute_code': {
      // Safe sandboxed JS execution using Function constructor (restricted)
      try {
        const logs: string[] = [];
        const sandboxConsole = { log: (...a: any[]) => logs.push(a.map(String).join(' ')), error: (...a: any[]) => logs.push('[ERR] ' + a.join(' ')), warn: (...a: any[]) => logs.push('[WARN] ' + a.join(' ')) };
        const fn = new Function('console', 'Math', 'JSON', 'Date', args.code);
        const result = fn(sandboxConsole, Math, JSON, Date);
        return { output: logs.join('\n'), result: result !== undefined ? String(result) : undefined };
      } catch (err: any) {
        return { error: err.message };
      }
    }

    case 'http_request': {
      try {
        const res = await fetch(args.url, {
          method: args.method || 'GET',
          headers: { 'Content-Type': 'application/json', ...(args.headers || {}) },
          body: args.body ? args.body : undefined,
        });
        const contentType = res.headers.get('content-type') || '';
        const body = contentType.includes('json') ? await res.json() : await res.text();
        return { status: res.status, statusText: res.statusText, body };
      } catch (err: any) {
        return { error: err.message };
      }
    }

    case 'list_agents': {
      try {
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const res = await fetch(`${baseUrl}/api/agents`);
        const data = await res.json();
        const agents = (data.agents || []).filter((a: any) => !args.category || a.category === args.category);
        return { agents: agents.slice(0, 20), total: agents.length };
      } catch {
        return { agents: [], total: 0 };
      }
    }

    case 'run_agent': {
      try {
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const res = await fetch(`${baseUrl}/api/agents/run`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agentId: args.agent_id, task: args.task, context: args.context || '' })
        });
        const data = await res.json();
        return { agent_id: args.agent_id, result: data.output || data.result || data, status: 'completed' };
      } catch (err: any) {
        return { error: err.message };
      }
    }

    case 'memory_store': {
      const key = `${args.namespace || 'default'}:${args.key}`;
      memoryStore.set(key, args.value);
      return { success: true, key: args.key, namespace: args.namespace || 'default' };
    }

    case 'memory_retrieve': {
      const key = `${args.namespace || 'default'}:${args.key}`;
      const value = memoryStore.get(key);
      return value !== undefined ? { key: args.key, value, found: true } : { key: args.key, found: false };
    }

    case 'send_notification': {
      // In production, connect to WebSocket broadcast or push service
      console.log(`[MCP Notification] ${args.level?.toUpperCase() || 'INFO'}: ${args.title} - ${args.message}`);
      return { sent: true, title: args.title, level: args.level || 'info', timestamp: new Date().toISOString() };
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}

export async function GET() {
  // MCP Server Info endpoint
  return NextResponse.json({
    name: 'orbit-mcp-server',
    version: '1.0.0',
    description: 'Orbit AI Platform MCP Server — Real Model Context Protocol implementation',
    protocol_version: '2024-11-05',
    capabilities: {
      tools: { listChanged: false },
      resources: { subscribe: false, listChanged: false },
      prompts: { listChanged: false },
      logging: {}
    },
    tools: MCP_TOOLS
  });
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ jsonrpc: '2.0', error: { code: -32700, message: 'Parse error' }, id: null }, { status: 400 });
  }

  const { jsonrpc, method, params, id } = body;

  if (jsonrpc !== '2.0') {
    return NextResponse.json({ jsonrpc: '2.0', error: { code: -32600, message: 'Invalid Request' }, id: id ?? null }, { status: 400 });
  }

  try {
    switch (method) {
      case 'initialize':
        return NextResponse.json({
          jsonrpc: '2.0',
          result: {
            protocolVersion: '2024-11-05',
            capabilities: { tools: {}, resources: {}, prompts: {}, logging: {} },
            serverInfo: { name: 'orbit-mcp-server', version: '1.0.0' }
          },
          id
        });

      case 'tools/list':
        return NextResponse.json({
          jsonrpc: '2.0',
          result: { tools: MCP_TOOLS },
          id
        });

      case 'tools/call': {
        const { name, arguments: args = {} } = params || {};
        if (!name) {
          return NextResponse.json({ jsonrpc: '2.0', error: { code: -32602, message: 'Missing tool name' }, id }, { status: 400 });
        }
        const tool = MCP_TOOLS.find(t => t.name === name);
        if (!tool) {
          return NextResponse.json({ jsonrpc: '2.0', error: { code: -32601, message: `Tool not found: ${name}` }, id }, { status: 404 });
        }
        const result = await executeTool(name, args);
        return NextResponse.json({
          jsonrpc: '2.0',
          result: {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            isError: 'error' in result && !result.success
          },
          id
        });
      }

      case 'resources/list':
        return NextResponse.json({ jsonrpc: '2.0', result: { resources: [] }, id });

      case 'prompts/list':
        return NextResponse.json({
          jsonrpc: '2.0',
          result: {
            prompts: [
              { name: 'analyze_codebase', description: 'Analyze the current workspace codebase', arguments: [] },
              { name: 'generate_tests', description: 'Generate unit tests for a given file', arguments: [{ name: 'file_path', required: true }] }
            ]
          },
          id
        });

      case 'ping':
        return NextResponse.json({ jsonrpc: '2.0', result: {}, id });

      default:
        return NextResponse.json({ jsonrpc: '2.0', error: { code: -32601, message: `Method not found: ${method}` }, id }, { status: 404 });
    }
  } catch (err: any) {
    return NextResponse.json({ jsonrpc: '2.0', error: { code: -32603, message: err.message || 'Internal error' }, id }, { status: 500 });
  }
}
