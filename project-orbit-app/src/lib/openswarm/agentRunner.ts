// ============================================
// Orbit — Real Agent Runner
// Executes a single agent with OpenAI GPT-4o
// Returns a Server-Sent Events stream
// ============================================

export interface AgentRunOptions {
  agentId: string;
  agentName: string;
  systemPrompt: string;
  task: string;
  onChunk: (text: string) => void;
  onTool?: (name: string, args: Record<string, unknown>) => void;
  onDone: (fullOutput: string, tokensUsed: number, costUsd: number) => void;
  onError: (error: string) => void;
}

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: { name: string; arguments: string };
  }>;
  tool_call_id?: string;
  name?: string;
}

const AGENT_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'think',
      description: 'Think through a problem step by step before answering',
      parameters: {
        type: 'object',
        properties: {
          reasoning: { type: 'string', description: 'Your step-by-step reasoning' },
        },
        required: ['reasoning'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_file',
      description: 'Create a file with content as part of your deliverable',
      parameters: {
        type: 'object',
        properties: {
          filename: { type: 'string', description: 'The filename to create' },
          content: { type: 'string', description: 'The file content' },
          language: { type: 'string', description: 'Programming language or file type' },
        },
        required: ['filename', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'web_search',
      description: 'Simulate searching the web for information',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'The search query' },
        },
        required: ['query'],
      },
    },
  },
];

export async function runAgent(options: AgentRunOptions): Promise<void> {
  const { agentName, systemPrompt, task, onChunk, onTool, onDone, onError } = options;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    onError('OpenAI API key not configured. Add OPENAI_API_KEY to .env.local');
    return;
  }

  const messages: OpenAIMessage[] = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `Task: ${task}\n\nPlease complete this task thoroughly and provide a detailed, actionable response. Use the create_file tool to produce any code or document deliverables.`,
    },
  ];

  let fullOutput = '';
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let iterations = 0;
  const MAX_ITERATIONS = 6;

  onChunk(`\n**${agentName}** is analyzing your task...\n\n`);

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages,
          tools: AGENT_TOOLS,
          tool_choice: 'auto',
          temperature: 0.2,
          max_tokens: 4096,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        onError(`OpenAI API error ${response.status}: ${errorText.slice(0, 300)}`);
        return;
      }

      const data = await response.json() as {
        choices: Array<{
          message: OpenAIMessage;
          finish_reason: string;
        }>;
        usage: { prompt_tokens: number; completion_tokens: number };
      };

      const choice = data.choices[0];
      const msg = choice.message;

      totalInputTokens += data.usage?.prompt_tokens ?? 0;
      totalOutputTokens += data.usage?.completion_tokens ?? 0;

      messages.push(msg);

      // Handle tool calls
      if (msg.tool_calls && msg.tool_calls.length > 0) {
        for (const tc of msg.tool_calls) {
          let args: Record<string, unknown> = {};
          try { args = JSON.parse(tc.function.arguments); } catch { /* ignore */ }

          onTool?.(tc.function.name, args);

          let toolResult = '';
          if (tc.function.name === 'think') {
            toolResult = `Reasoning logged: ${args.reasoning}`;
            onChunk(`\n💭 *Thinking...*\n> ${String(args.reasoning).slice(0, 200)}\n\n`);
          } else if (tc.function.name === 'create_file') {
            toolResult = `File created: ${args.filename}`;
            onChunk(`\n📄 **Creating file:** \`${args.filename}\`\n\`\`\`${args.language || ''}\n${String(args.content).slice(0, 2000)}\n\`\`\`\n\n`);
          } else if (tc.function.name === 'web_search') {
            toolResult = `Search results for "${args.query}": [Simulated: Found 10 relevant results about ${args.query}]`;
            onChunk(`\n🔍 **Searching:** "${args.query}"\n\n`);
          }

          messages.push({
            role: 'tool',
            tool_call_id: tc.id,
            content: toolResult,
          });
        }
        continue; // Loop for tool response
      }

      // Final text response
      if (msg.content) {
        fullOutput += msg.content;
        onChunk(msg.content);
      }

      if (choice.finish_reason === 'stop' || choice.finish_reason === 'length') {
        break;
      }

    } catch (err) {
      onError(`Agent error: ${err instanceof Error ? err.message : String(err)}`);
      return;
    }
  }

  const costUsd = (totalInputTokens * 0.0000025) + (totalOutputTokens * 0.00001);
  onDone(fullOutput, totalInputTokens + totalOutputTokens, costUsd);
}
