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
  openaiKey?: string;
  geminiKey?: string;
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

import { callAgent } from '@/lib/server/llm';

export async function streamChat(options: ChatOptions): Promise<void> {
  const { messages, onChunk, onDone, onError, openaiKey, geminiKey } = options;

  try {
    const userPrompt = messages[messages.length - 1]?.content ?? '';
    const result = await callAgent({
      systemPrompt: ORBIT_SYSTEM_PROMPT,
      userPrompt: userPrompt,
      stage: 'assistant',
      taskTitle: 'Copilot Assistant',
      openaiKey,
      geminiKey,
    });

    const output = result.output || '';
    // Stream the text output out in chunks to keep the typing effect
    const chunkSize = 25; // characters per chunk
    for (let i = 0; i < output.length; i += chunkSize) {
      const chunk = output.slice(i, i + chunkSize);
      onChunk(chunk);
      await new Promise(r => setTimeout(r, 10));
    }

    onDone(output, { 
      inputTokens: result.inputTokens || 500, 
      outputTokens: result.outputTokens || 200 
    });
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
