// ============================================
// Orbit — Agentic Tool Loop
// Ported from OpenSwarm src/adapters/agenticLoop.ts
// Uses Gemini API in simulated/real mode
// ============================================

import type { AgenticLoopOptions, AgenticLoopResult } from './types';

// ============================================
// Tool Definitions
// ============================================

export const TOOL_DEFINITIONS = [
  {
    type: 'function' as const,
    function: {
      name: 'read_file',
      description: 'Read the contents of a file',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path relative to project root' },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'write_file',
      description: 'Write content to a file',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path relative to project root' },
          content: { type: 'string', description: 'File content to write' },
        },
        required: ['path', 'content'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'search_files',
      description: 'Search files for a pattern',
      parameters: {
        type: 'object',
        properties: {
          pattern: { type: 'string', description: 'Pattern to search for' },
          path: { type: 'string', description: 'Directory to search in' },
        },
        required: ['pattern'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'bash',
      description: 'Run a shell command',
      parameters: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'Command to execute' },
        },
        required: ['command'],
      },
    },
  },
];

// ============================================
// Simulated tool execution
// ============================================

function executeSimulatedTool(name: string, args: Record<string, string>): string {
  switch (name) {
    case 'read_file':
      return `// Contents of ${args.path}\n// [Simulated file content - connect to real filesystem for actual content]\nexport function example() {\n  return 'hello world';\n}`;
    case 'write_file':
      return `Successfully wrote ${(args.content?.length ?? 0)} bytes to ${args.path}`;
    case 'search_files':
      return `Found 3 matches for "${args.pattern}" in ${args.path ?? '.'}:\n  src/lib/example.ts:12:  ${args.pattern}\n  src/app/page.tsx:45:  // ${args.pattern}\n  tests/unit.test.ts:8:  expect(${args.pattern})`;
    case 'bash':
      return `$ ${args.command}\n[Simulated output]\nCommand executed successfully.`;
    default:
      return `Tool "${name}" executed`;
  }
}

// ============================================
// Main Loop
// ============================================

export async function runAgenticLoop(options: AgenticLoopOptions): Promise<AgenticLoopResult> {
  const {
    systemPrompt, prompt, maxTurns = 8, timeoutMs = 60000,
    onLog, enableTools = true,
  } = options;

  const startTime = Date.now();
  let toolCallCount = 0;
  let apiCallCount = 0;
  let totalTokens = 0;
  let finalText = '';

  // Build message history
  interface Message {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string;
    tool_calls?: Array<{ id: string; function: { name: string; arguments: string } }>;
    tool_call_id?: string;
  }
  const messages: Message[] = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: prompt });

  onLog?.(`▸ Starting agentic loop (max ${maxTurns} turns)`);

  for (let turn = 0; turn < maxTurns; turn++) {
    if (Date.now() - startTime > timeoutMs) {
      onLog?.(`⏰ Timeout after ${turn} turns`);
      break;
    }

    apiCallCount++;
    onLog?.(`▸ API call #${apiCallCount} (turn ${turn + 1}/${maxTurns})`);

    // Simulate a response with tool calls on early turns, then finalize
    const shouldUseTool = enableTools && turn < Math.min(3, maxTurns - 1) && Math.random() > 0.4;

    if (shouldUseTool) {
      const tool = TOOL_DEFINITIONS[Math.floor(Math.random() * TOOL_DEFINITIONS.length)];
      const toolCallId = `call-${Date.now()}-${turn}`;
      const toolArgs = tool.function.name === 'read_file'
        ? { path: 'src/lib/example.ts' }
        : tool.function.name === 'bash'
        ? { command: 'npm test' }
        : tool.function.name === 'search_files'
        ? { pattern: prompt.split(' ').slice(0, 3).join(''), path: 'src' }
        : { path: 'src/output.ts', content: '// generated output' };

      onLog?.(`  🔧 ${tool.function.name}(${Object.values(toolArgs)[0]})`);

      messages.push({
        role: 'assistant', content: null as unknown as string,
        tool_calls: [{ id: toolCallId, function: { name: tool.function.name, arguments: JSON.stringify(toolArgs) } }],
      });

      const toolResult = executeSimulatedTool(tool.function.name, toolArgs as unknown as Record<string, string>);
      messages.push({ role: 'tool', content: toolResult, tool_call_id: toolCallId });
      toolCallCount++;
      totalTokens += 500;
    } else {
      // Final response
      finalText = generateSimulatedResponse(prompt, messages.length);
      totalTokens += 1000 + finalText.length;
      onLog?.(`✓ Response generated (${finalText.length} chars)`);
      break;
    }
  }

  if (!finalText) {
    finalText = generateSimulatedResponse(prompt, messages.length);
  }

  return { text: finalText, toolCallCount, apiCallCount, totalTokens, durationMs: Date.now() - startTime };
}

function generateSimulatedResponse(prompt: string, contextLength: number): string {
  const topic = prompt.slice(0, 60);
  return `Based on my analysis of "${topic}"...\n\nI've examined the codebase and identified the key areas that need attention. After ${contextLength} context exchanges:\n\n**Key Findings:**\n- The implementation looks solid with good separation of concerns\n- There are opportunities to improve error handling in edge cases\n- Consider adding retry logic for external API calls\n\n**Recommended Actions:**\n1. Add comprehensive error boundaries\n2. Implement circuit breaker pattern for resilience\n3. Add telemetry for observability\n\nAll changes have been applied following the project's TypeScript strict mode conventions.`;
}

export type { AgenticLoopOptions, AgenticLoopResult };
