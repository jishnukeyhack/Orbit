// ============================================
// Orbit — Real LLM Engine
// Uses OpenAI API when key is present
// Falls back to intelligent simulation otherwise
// Add OPENAI_API_KEY to .env.local to activate
// Keys are also persisted in SQLite settings table
// ============================================

// Lazy import to avoid circular deps at module level
function getDbSetting(key: string): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getSetting } = require('./db');
    return getSetting(key) ?? '';
  } catch {
    return '';
  }
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: Array<{ id: string; type: 'function'; function: { name: string; arguments: string } }>;
  tool_call_id?: string;
}

export interface LLMResponse {
  content: string | null;
  tool_calls?: Array<{ id: string; function: { name: string; arguments: string } }>;
  inputTokens: number;
  outputTokens: number;
  model: string;
  finishReason: string;
}

function isRealKey(key: string | undefined): boolean {
  if (!key || !key.trim()) return false;
  const k = key.trim();
  // Reject obvious placeholders
  if (k.includes('your-') || k.includes('your_') || k === 'sk-...' || k.includes('xxx') || k.includes('placeholder') || k.length < 10) return false;
  return true;
}

export function getOpenAIKey(): string {
  const fromDb = getDbSetting('openai_api_key');
  if (isRealKey(fromDb)) return fromDb.trim();
  const key = process.env.OPENAI_API_KEY ?? '';
  return isRealKey(key) ? key.trim() : '';
}
export function getGeminiKey(): string {
  const fromDb = getDbSetting('gemini_api_key');
  if (isRealKey(fromDb)) return fromDb.trim();
  const key = process.env.GEMINI_API_KEY ?? '';
  return isRealKey(key) ? key.trim() : '';
}
export function getAnthropicKey(): string {
  const fromDb = getDbSetting('anthropic_api_key');
  if (isRealKey(fromDb)) return fromDb.trim();
  const key = process.env.ANTHROPIC_API_KEY ?? '';
  return isRealKey(key) ? key.trim() : '';
}

export function hasRealLLM(): boolean {
  return Boolean(getOpenAIKey() || getAnthropicKey() || getGeminiKey());
}

export function getActiveModel(): string {
  if (getOpenAIKey()) return 'gpt-4o';
  if (getGeminiKey()) return 'gemini-1.5-pro';
  if (getAnthropicKey()) return 'claude-sonnet-4-5';
  return 'orbit-sim-v1';
}

// ============================================
// Real OpenAI Call
// ============================================

async function callOpenAI(
  messages: LLMMessage[],
  tools: unknown[],
  apiKey?: string,
  model = 'gpt-4o'
): Promise<LLMResponse> {
  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: 0.2,
    max_tokens: 16384,
  };
  if (tools.length > 0) body.tools = tools;

  const keyToUse = apiKey && isRealKey(apiKey) ? apiKey : getOpenAIKey();

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${keyToUse}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI error (${res.status}): ${err.slice(0, 300)}`);
  }

  const data = await res.json() as {
    choices: Array<{
      message: { content: string | null; tool_calls?: Array<{ id: string; type: 'function'; function: { name: string; arguments: string } }> };
      finish_reason: string;
    }>;
    usage: { prompt_tokens: number; completion_tokens: number };
  };

  const choice = data.choices[0];
  return {
    content: choice.message.content,
    tool_calls: choice.message.tool_calls?.map(tc => ({ id: tc.id, function: tc.function })),
    inputTokens: data.usage.prompt_tokens,
    outputTokens: data.usage.completion_tokens,
    model,
    finishReason: choice.finish_reason,
  };
}

// ============================================
// Real Anthropic Call
// ============================================

async function callAnthropic(
  messages: LLMMessage[],
  systemPrompt: string,
  model = 'claude-sonnet-4-5',
  tools?: unknown[],
): Promise<LLMResponse> {
  // Convert OpenAI-format messages to Anthropic format
  const anthropicMessages = messages
    .filter(m => m.role !== 'system')
    .map(m => {
      if (m.role === 'tool') {
        // Tool results must be wrapped as user messages in Anthropic format
        return {
          role: 'user' as const,
          content: [{
            type: 'tool_result',
            tool_use_id: m.tool_call_id ?? 'unknown',
            content: m.content ?? '',
          }],
        };
      }
      if (m.role === 'assistant' && m.tool_calls?.length) {
        // Assistant tool_calls must be in Anthropic's tool_use format
        return {
          role: 'assistant' as const,
          content: m.tool_calls.map(tc => ({
            type: 'tool_use',
            id: tc.id,
            name: tc.function.name,
            input: (() => { try { return JSON.parse(tc.function.arguments); } catch { return {}; } })(),
          })),
        };
      }
      return { role: m.role as 'user' | 'assistant', content: m.content ?? '' };
    });

  // Convert OpenAI tools to Anthropic tools format
  const anthropicTools = tools?.map((t: unknown) => {
    const tool = t as { function: { name: string; description?: string; parameters: unknown } };
    return {
      name: tool.function.name,
      description: tool.function.description ?? '',
      input_schema: tool.function.parameters,
    };
  });

  const bodyObj: Record<string, unknown> = {
    model,
    messages: anthropicMessages,
    system: systemPrompt,
    max_tokens: 8192,
  };
  if (anthropicTools?.length) bodyObj.tools = anthropicTools;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': getAnthropicKey(),
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bodyObj),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic error (${res.status}): ${err.slice(0, 300)}`);
  }

  const data = await res.json() as {
    content: Array<{ type: string; text?: string; id?: string; name?: string; input?: Record<string, unknown> }>;
    usage: { input_tokens: number; output_tokens: number };
  };


  // Extract tool_use blocks as tool_calls (in OpenAI format for compatibility)
  const toolUseCalls = data.content
    .filter(c => c.type === 'tool_use' && c.id && c.name)
    .map(c => ({
      id: c.id!,
      function: {
        name: c.name!,
        arguments: JSON.stringify(c.input ?? {}),
      },
    }));

  return {
    content: data.content.find(c => c.type === 'text')?.text ?? '',
    tool_calls: toolUseCalls.length > 0 ? toolUseCalls : undefined,
    inputTokens: data.usage.input_tokens,
    outputTokens: data.usage.output_tokens,
    model,
    finishReason: toolUseCalls.length > 0 ? 'tool_calls' : 'stop',
  };
}

// ============================================
// Real Google Gemini REST Call
// ============================================

function convertToolsToGemini(openaiTools: any[]): any[] {
  if (!openaiTools || openaiTools.length === 0) return [];
  try {
    const functionDeclarations = openaiTools.map((t: any) => {
      const fn = t.function;
      const mapTypes = (obj: any): any => {
        if (!obj) return obj;
        const newObj = { ...obj };
        if (typeof newObj.type === 'string') {
          newObj.type = newObj.type.toUpperCase();
        }
        if (newObj.properties) {
          newObj.properties = Object.keys(newObj.properties).reduce((acc: any, key) => {
            acc[key] = mapTypes(newObj.properties[key]);
            return acc;
          }, {});
        }
        if (newObj.items) {
          newObj.items = mapTypes(newObj.items);
        }
        return newObj;
      };
      return {
        name: fn.name,
        description: fn.description,
        parameters: mapTypes(fn.parameters)
      };
    });
    return [{ functionDeclarations }];
  } catch (err) {
    console.error('Error mapping tools to Gemini format:', err);
    return [];
  }
}

async function callGemini(
  messages: LLMMessage[],
  systemPrompt: string,
  tools: any[] = [],
  apiKey?: string,
  model = 'gemini-1.5-pro'
): Promise<LLMResponse> {
  const modelsToTry = [
    model,
    'gemini-1.5-flash',
    'gemini-1.5-pro-latest',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
  ].filter((v, i, a) => a.indexOf(v) === i);

  let lastError: Error | null = null;

  for (const currentModel of modelsToTry) {
    try {
      const geminiContents = messages.map(m => {
        let role = 'user';
        if (m.role === 'assistant') role = 'model';
        else if (m.role === 'tool') role = 'function';

        const parts: any[] = [];
        if (m.content && m.role !== 'tool') {
          parts.push({ text: m.content });
        }
        if (m.tool_calls) {
          m.tool_calls.forEach(tc => {
            parts.push({
              functionCall: {
                name: tc.function.name,
                args: JSON.parse(tc.function.arguments)
              }
            });
          });
        }
        if (m.role === 'tool') {
          let functionName = m.tool_call_id ?? '';
          if (functionName.includes('_')) {
            const knownTools = ['think', 'read_file', 'write_file', 'edit_file', 'list_dir', 'mkdir', 'bash'];
            const matched = knownTools.find(t => functionName.startsWith(t + '_'));
            if (matched) {
              functionName = matched;
            }
          }
          parts.push({
            functionResponse: {
              name: functionName,
              response: { output: m.content }
            }
          });
        }
        return { role, parts };
      });

      const body: any = {
        contents: geminiContents,
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 8192
        }
      };

      if (systemPrompt) {
        body.systemInstruction = {
          parts: [{ text: systemPrompt }]
        };
      }

      if (tools && tools.length > 0) {
        body.tools = convertToolsToGemini(tools);
      }

      const keyToUse = apiKey && isRealKey(apiKey) ? apiKey : getGeminiKey();

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${keyToUse}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Gemini API error (${res.status}) for model ${currentModel}: ${errText.slice(0, 300)}`);
      }

      const data = await res.json() as any;
      const candidate = data.candidates?.[0];
      const contentObj = candidate?.content;
      const parts = contentObj?.parts ?? [];
      
      let text = '';
      const toolCalls: any[] = [];
      
      parts.forEach((p: any) => {
        if (p.text) {
          text += p.text;
        }
        if (p.functionCall) {
          toolCalls.push({
            id: p.functionCall.name + '_' + Date.now(),
            function: {
              name: p.functionCall.name,
              arguments: JSON.stringify(p.functionCall.args)
            }
          });
        }
      });

      const promptTokens = data.usageMetadata?.promptTokenCount ?? 0;
      const outputTokens = data.usageMetadata?.candidatesTokenCount ?? 0;

      return {
        content: text || null,
        tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
        inputTokens: promptTokens,
        outputTokens: outputTokens,
        model: currentModel,
        finishReason: candidate?.finishReason?.toLowerCase() ?? 'stop'
      };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn(`Attempt with Gemini model ${currentModel} failed: ${errMsg}`);
      lastError = err instanceof Error ? err : new Error(String(err));
      // Try next fallback model in the list for any failure (including 503, 429, etc.)
      continue;
    }
  }

  throw lastError ?? new Error(`All Gemini fallback models failed.`);
}

// ============================================================
// Intelligent Simulation Engine
// Generates realistic, detailed responses that
// look and behave like real LLM output
// ============================================

const CODE_SAMPLES: Record<string, string[]> = {
  worker: [
    `I've analyzed the codebase and implemented the requested changes.

## Changes Made

**Modified Files:**
- \`src/lib/auth/middleware.ts\` — Added JWT validation with refresh token support
- \`src/app/api/protected/route.ts\` — Wrapped all endpoints with auth middleware
- \`src/lib/auth/types.ts\` — Added \`AuthenticatedRequest\` interface

**Implementation Details:**
The auth middleware now:
1. Extracts Bearer token from Authorization header
2. Validates JWT signature using \`process.env.JWT_SECRET\`
3. Checks token expiry with 5-minute grace period
4. Attaches \`req.user\` to downstream handlers

**Test Results:**
- ✓ Valid token → passes through
- ✓ Expired token → 401 with refresh hint
- ✓ Missing token → 401 with auth URL`,

    `## Implementation Complete

I've scaffolded the new feature module with full TypeScript types.

**Created:**
- \`src/features/analytics/index.ts\` — Public API surface
- \`src/features/analytics/engine.ts\` — Core analytics processor
- \`src/features/analytics/types.ts\` — Shared type definitions
- \`src/features/analytics/__tests__/engine.test.ts\` — Unit tests

**Key Design Decisions:**
- Used event sourcing pattern for immutable audit trail
- Implemented cursor-based pagination for large datasets
- Added Redis caching layer with 5-minute TTL
- All async operations have timeout guards (10s default)`,

    `Analysis complete. Here's what I found and fixed:

**Root Cause:** The memory leak was in \`AgentRunner.ts\` — the EventEmitter listeners were never cleaned up when agents were terminated, causing ~2MB accumulation per agent per hour.

**Fix Applied:**
\`\`\`typescript
// Before
agent.on('task:complete', handler);

// After  
agent.once('task:complete', handler);
agent.on('close', () => agent.removeAllListeners());
\`\`\`

**Files Changed:** \`src/core/AgentRunner.ts\`, \`src/core/AgentPool.ts\`
**Tests:** All 47 existing tests pass. Added 3 new tests for cleanup verification.`,
  ],

  reviewer: [
    `**Review Decision: APPROVE** ✅

Code quality is excellent. I reviewed all changed files and found:

**Strengths:**
- Proper error handling with typed errors
- Good separation of concerns
- TypeScript strict mode compliance
- Adequate test coverage (83%)

**Minor suggestions (non-blocking):**
- Consider adding JSDoc to public interfaces
- \`retryCount\` could be configurable via env var

Overall, implementation looks production-ready. Merging.`,

    `**Review Decision: REVISE** ↩

Found issues that should be addressed before merging:

**Required Changes:**
1. **Missing null check on line 47** — \`user.profile\` can be undefined for OAuth users
2. **No rate limit on the new endpoint** — Add to prevent abuse
3. **SQL query not parameterized** — Potential injection vector

These are blocking. Please address and resubmit.`,

    `**Review Decision: APPROVE** ✅

Reviewed with focus on security and performance:

- ✓ Input validation present on all fields
- ✓ SQL queries use parameterized statements
- ✓ No hardcoded credentials found
- ✓ Rate limiting implemented correctly
- ✓ Response times within SLA (avg 145ms in load tests)

Approved for production deployment.`,
  ],

  tester: [
    `## Test Suite Results

**Status: ALL PASSING** ✅

\`\`\`
Test Suites: 12 passed, 12 total
Tests:       87 passed, 87 total
Coverage:    81.4% statements, 76.2% branches
Time:        3.847s
\`\`\`

**New Tests Added:**
- \`auth.middleware.test.ts\` — 8 tests covering happy path + edge cases
- \`auth.refresh.test.ts\` — 4 tests for token refresh scenarios

All existing regression tests pass. Coverage meets the 80% threshold.`,

    `## Test Results

**Status: 2 FAILURES** ❌

\`\`\`
FAIL src/__tests__/analytics.test.ts
  ● Analytics Engine > should handle empty dataset
    Expected: []  
    Received: null

  ● Analytics Engine > pagination cursor > should not duplicate records
    Expected length: 10, Received length: 11
\`\`\`

**Root Cause:** Off-by-one error in cursor pagination and missing null guard.
Sending back to worker for fixes.`,
  ],

  documenter: [
    `## Documentation Updated

Generated comprehensive documentation for all changed modules:

**Updated Files:**
- \`docs/api/auth.md\` — Full endpoint reference with examples
- \`docs/guides/authentication.md\` — Integration guide
- \`CHANGELOG.md\` — Added v2.1.0 entry
- \`README.md\` — Updated prerequisites section

**Highlights:**
- Added curl examples for all auth endpoints
- Documented refresh token flow with sequence diagram
- Added troubleshooting section for common 401 errors`,
  ],

  auditor: [
    `## Security Audit Complete

**Status: PASSED** 🔒

**Checks Performed:**
- ✅ No hardcoded secrets or API keys
- ✅ SQL injection patterns not found
- ✅ XSS vectors not present in user-facing outputs
- ✅ CSRF protection verified on state-changing endpoints
- ✅ Authentication checks present on all private routes
- ✅ Dependency vulnerabilities: 0 critical, 1 moderate (non-exploitable in context)
- ✅ Sensitive data not logged

**Recommendation:** Ready for production deployment.`,
  ],
};

function generateSmartResponse(input: string): string {
  const lower = input.toLowerCase();
  
  if (lower.includes('agent') || lower.includes('what can')) {
    return `**Orbit has 200+ specialized agents ready to use!** 🤖\n\nHere are some popular ones:\n- **Frontend Developer** — React, TypeScript, UI components\n- **Backend Architect** — APIs, databases, system design\n- **SEO Specialist** — Keyword research, content optimization\n- **DevOps Automator** — CI/CD, Docker, Kubernetes\n- **Data Engineer** — ETL pipelines, analytics\n\nTo use any agent, go to the **Agents** page and click **Run Task** on any agent card. Your API keys are already configured! 🚀`;
  }

  if (lower.includes('pipeline') || lower.includes('workflow')) {
    return `**The Orbit Pipeline** runs through 5 stages automatically:\n\n1. **Worker** — Implements the task\n2. **Reviewer** — Reviews and approves the code\n3. **Tester** — Writes and runs tests\n4. **Documenter** — Creates documentation\n5. **Auditor** — Security audit\n\nGo to **Pipeline** and click **Run New Pipeline** to start. Your results are saved to \`orbit-workspace/\` and tracked in the database.`;
  }

  if (lower.includes('swarm')) {
    return `**Agent Swarms** allow multiple agents to collaborate on complex tasks simultaneously! 🐝\n\n**Strategies available:**\n- **Parallel** — All agents work at once (fastest)\n- **Sequential** — Agents hand off to each other\n- **Hierarchical** — Lead agent coordinates others\n\nGo to **Swarms** → **Create Swarm** to get started. Pick 2-5 agents and give them a shared goal!`;
  }

  if (lower.includes('terminal') || lower.includes('shell')) {
    return `**The Orbit Terminal** supports natural language! 🖥️\n\nYou can type things like:\n- *"show me all files in my workspace"*\n- *"create a new folder called my-project"*\n- *"run npm install in the workspace"*\n- *"git status"*\n\nGo to **Terminal** and try it. The AI will translate your plain English into shell commands automatically.`;
  }

  return `I'm **Orbit AI**, your autonomous intelligence assistant! 🚀\n\nI can help you:\n- **Run agents** — 200+ specialized AI agents for any task\n- **Build swarms** — Multiple agents working together\n- **Create workflows** — Automated multi-step processes\n- **Use the terminal** — Natural language shell commands\n- **Monitor performance** — Real-time costs and metrics\n\nWhat would you like to build today? Your API keys are connected and everything is ready to go!`;
}

function pickResponse(stage: string, taskTitle: string, userPrompt?: string): string {
  if (stage === 'assistant' || stage === 'assistant_chat') {
    return generateSmartResponse(userPrompt || '');
  }
  const samples = CODE_SAMPLES[stage];
  if (!samples) return `${stage} completed for: ${taskTitle}`;
  const base = samples[Math.floor(Math.random() * samples.length)];
  // Personalize with task title
  return base.replace('the requested changes', `"${taskTitle}"`);
}

// ============================================
// Unified LLM Call (Real or Simulated)
// ============================================

export interface AgentCallOptions {
  systemPrompt: string;
  userPrompt: string;
  stage: string;
  taskTitle: string;
  tools?: unknown[];
  model?: string;
  onLog?: (line: string) => void;
  messages?: LLMMessage[];
  openaiKey?: string;
  geminiKey?: string;
}

export interface AgentCallResult {
  output: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
  durationMs: number;
  isSimulated: boolean;
  tool_calls?: any[];
}

export async function callAgent(options: AgentCallOptions): Promise<AgentCallResult> {
  const startTime = Date.now();
  const { systemPrompt, userPrompt, stage, taskTitle, tools = [], model, onLog, messages, openaiKey, geminiKey } = options;

  const finalMessages = messages ?? [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  const resolvedOpenaiKey = (openaiKey && isRealKey(openaiKey)) ? openaiKey.trim() : getOpenAIKey();
  const resolvedGeminiKey = (geminiKey && isRealKey(geminiKey)) ? geminiKey.trim() : getGeminiKey();

  const errors: string[] = [];

  // 1. OpenAI Path
  if (resolvedOpenaiKey) {
    onLog?.(`  🌐 Calling OpenAI ${model ?? 'gpt-4o'}...`);
    try {
      const res = await callOpenAI(finalMessages, tools, resolvedOpenaiKey, model ?? 'gpt-4o');
      return {
        output: res.content ?? '',
        inputTokens: res.inputTokens,
        outputTokens: res.outputTokens,
        model: res.model,
        durationMs: Date.now() - startTime,
        isSimulated: false,
        tool_calls: res.tool_calls,
      };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      errors.push(`OpenAI failed: ${errMsg}`);
      onLog?.(`  ⚠️ OpenAI failed: ${errMsg}. Falling back...`);
      console.warn(`[OpenAI Path] Error: ${errMsg}`);
    }
  }

  // 2. Gemini Fallback Path
  if (resolvedGeminiKey) {
    onLog?.(`  🌐 Calling Gemini fallback (${model ?? 'gemini-1.5-pro'})...`);
    try {
      // Map system role or omit system if callGemini does systemInstruction
      const geminiMessages = finalMessages.filter(m => m.role !== 'system');
      const res = await callGemini(geminiMessages, systemPrompt, tools, resolvedGeminiKey, model ?? 'gemini-1.5-pro');
      return {
        output: res.content ?? '',
        inputTokens: res.inputTokens,
        outputTokens: res.outputTokens,
        model: res.model,
        durationMs: Date.now() - startTime,
        isSimulated: false,
        tool_calls: res.tool_calls,
      };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      errors.push(`Gemini failed: ${errMsg}`);
      onLog?.(`  ⚠️ Gemini failed: ${errMsg}. Falling back...`);
      console.warn(`[Gemini Path] Error: ${errMsg}`);
    }
  }

  // 3. Anthropic Path
  if (getAnthropicKey()) {
    onLog?.(`  🌐 Calling Anthropic Claude...`);
    try {
      const messages: LLMMessage[] = [{ role: 'user', content: userPrompt }];
      const res = await callAnthropic(messages, systemPrompt, model ?? 'claude-sonnet-4-5');
      return {
        output: res.content ?? '',
        inputTokens: res.inputTokens,
        outputTokens: res.outputTokens,
        model: res.model,
        durationMs: Date.now() - startTime,
        isSimulated: false,
      };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      errors.push(`Anthropic failed: ${errMsg}`);
      onLog?.(`  ⚠️ Anthropic failed: ${errMsg}. Falling back...`);
      console.warn(`[Anthropic Path] Error: ${errMsg}`);
    }
  }

  // If a real key was attempted but failed, throw the detailed error rather than displaying simulated success
  const attemptedRealLLM = Boolean(resolvedOpenaiKey || resolvedGeminiKey || getAnthropicKey());
  if (attemptedRealLLM) {
    const combinedError = `Real LLM execution failed despite configured API key(s):\n${errors.map((e, idx) => `${idx + 1}. ${e}`).join('\n')}\n\nPlease verify your API key validity, billing quota, or network connection in your settings.`;
    throw new Error(combinedError);
  }

  // 4. Intelligent Simulation Fallback
  onLog?.(`  🤖 Orbit Simulation Engine active (No real API keys found)`);
  
  const output = `⚠️ **No LLM API Key Configured!**

Project Orbit's mock simulated responses have been disabled to ensure real autonomous execution. 

To enable real agentic behavior (where agents actually write code, manage files, and execute system commands), the system needs an LLM brain.

**How to fix this:**
1. Go to the **Settings** page in the sidebar.
2. Enter your **Gemini API Key** (or OpenAI/Anthropic key).
3. Come back and run this agent again!

Once a key is provided, this agent will autonomously execute tools in real-time.`;

  return {
    output,
    inputTokens: 10,
    outputTokens: 50,
    model: 'orbit-sim-v1',
    durationMs: Date.now() - startTime,
    isSimulated: true,
  };
}
