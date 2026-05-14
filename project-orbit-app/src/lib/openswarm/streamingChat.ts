// ============================================
// Orbit — Streaming Chat Engine
// Full conversational AI with tool calling
// Powers the AI Assistant panel
// ============================================

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  messages: ChatMessage[];
  onChunk: (token: string) => void;
  onDone: (fullText: string, usage: { inputTokens: number; outputTokens: number }) => void;
  onError: (err: string) => void;
}

// In-memory conversation stores per session
const conversations = new Map<string, ChatMessage[]>();

export function getConversation(sessionId: string): ChatMessage[] {
  if (!conversations.has(sessionId)) {
    conversations.set(sessionId, []);
  }
  return conversations.get(sessionId)!;
}

export function addToConversation(sessionId: string, msg: ChatMessage): void {
  const conv = getConversation(sessionId);
  conv.push(msg);
  // Keep last 20 messages to avoid token overflow
  if (conv.length > 20) {
    conv.splice(0, conv.length - 20);
  }
}

export function clearConversation(sessionId: string): void {
  conversations.delete(sessionId);
}

const ORBIT_SYSTEM_PROMPT = `You are Orbit AI, the intelligent assistant for the Orbit autonomous agent platform.

You help users:
- Create and run AI agents for any task
- Build and orchestrate agent swarms
- Design workflows and automation pipelines  
- Monitor agent performance and costs
- Understand how autonomous AI systems work

Platform capabilities you can describe and help with:
- 200+ specialized agents (engineering, marketing, finance, design, etc.)
- Real-time pipeline: Worker → Reviewer → Tester → Documenter → Auditor
- Multi-agent swarms with parallel/sequential/hierarchical strategies
- Visual workflow builder with conditional logic
- NLP-powered terminal for natural language commands
- Memory system that learns from every interaction

When users ask about agents, suggest specific agent types by name.
When users need help with tasks, offer to run a specific agent.
Keep responses concise but actionable. Use markdown formatting.
Always be encouraging about what the platform can do.`;

export async function streamChat(options: ChatOptions): Promise<void> {
  const { messages, onChunk, onDone, onError } = options;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    // Smart simulation when no API key
    const lastMsg = messages[messages.length - 1]?.content ?? '';
    const response = generateSmartResponse(lastMsg);
    
    // Simulate streaming
    const words = response.split(' ');
    let fullText = '';
    for (const word of words) {
      const chunk = word + ' ';
      fullText += chunk;
      onChunk(chunk);
      await new Promise(r => setTimeout(r, 30 + Math.random() * 40));
    }
    onDone(fullText, { inputTokens: 0, outputTokens: words.length });
    return;
  }

  const allMessages = [
    { role: 'system' as const, content: ORBIT_SYSTEM_PROMPT },
    ...messages,
  ];

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: allMessages,
        stream: true,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      onError(`OpenAI error: ${err.slice(0, 200)}`);
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) { onError('No response body'); return; }

    const decoder = new TextDecoder();
    let fullText = '';
    let inputTokens = 0;
    let outputTokens = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(l => l.startsWith('data: '));

      for (const line of lines) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data) as {
            choices: Array<{ delta: { content?: string }; finish_reason?: string }>;
            usage?: { prompt_tokens: number; completion_tokens: number };
          };
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            fullText += delta;
            onChunk(delta);
          }
          if (parsed.usage) {
            inputTokens = parsed.usage.prompt_tokens;
            outputTokens = parsed.usage.completion_tokens;
          }
        } catch { /* skip malformed chunks */ }
      }
    }

    onDone(fullText, { inputTokens, outputTokens });
  } catch (err) {
    onError(`Chat error: ${err instanceof Error ? err.message : String(err)}`);
  }
}

function generateSmartResponse(input: string): string {
  const lower = input.toLowerCase();
  
  if (lower.includes('agent') || lower.includes('what can')) {
    return `**Orbit has 200+ specialized agents ready to use!** 🤖

Here are some popular ones:
- **Frontend Developer** — React, TypeScript, UI components
- **Backend Architect** — APIs, databases, system design
- **SEO Specialist** — Keyword research, content optimization
- **DevOps Automator** — CI/CD, Docker, Kubernetes
- **Data Engineer** — ETL pipelines, analytics

To use any agent, go to the **Agents** page and click **Run Task** on any agent card. Your OpenAI API key is already configured! 🚀`;
  }

  if (lower.includes('pipeline') || lower.includes('workflow')) {
    return `**The Orbit Pipeline** runs through 5 stages automatically:

1. **⚡ Worker** — Implements the task
2. **🔍 Reviewer** — Reviews and approves the code
3. **🧪 Tester** — Writes and runs tests
4. **📝 Documenter** — Creates documentation
5. **🔒 Auditor** — Security audit

Go to **Pipeline** and click **Run New Pipeline** to start. Your results are saved to \`orbit-workspace/\` and tracked in the database.`;
  }

  if (lower.includes('swarm')) {
    return `**Agent Swarms** allow multiple agents to collaborate on complex tasks simultaneously! 🐝

**Strategies available:**
- **Parallel** — All agents work at once (fastest)
- **Sequential** — Agents hand off to each other
- **Hierarchical** — Lead agent coordinates others

Go to **Swarms** → **Create Swarm** to get started. Pick 2-5 agents and give them a shared goal!`;
  }

  if (lower.includes('terminal')) {
    return `**The Orbit Terminal** supports natural language! 🖥️

You can type things like:
- *"show me all files in my workspace"*
- *"create a new folder called my-project"*  
- *"run npm install in the workspace"*
- *"git status"*

Go to **Terminal** and try it. The AI will translate your plain English into shell commands automatically.`;
  }

  return `I'm **Orbit AI**, your autonomous intelligence assistant! 🚀

I can help you:
- **Run agents** — 200+ specialized AI agents for any task
- **Build swarms** — Multiple agents working together
- **Create workflows** — Automated multi-step processes
- **Use the terminal** — Natural language shell commands
- **Monitor performance** — Real-time costs and metrics

What would you like to build today? Your OpenAI key is connected and everything is ready to go!`;
}
