// ============================================
// Orbit — Real LLM Engine
// Uses OpenAI API when key is present
// Falls back to intelligent simulation otherwise
// Add OPENAI_API_KEY to .env.local to activate
// ============================================

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

const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? '';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? '';

export function hasRealLLM(): boolean {
  return Boolean(OPENAI_API_KEY || ANTHROPIC_API_KEY);
}

export function getActiveModel(): string {
  if (OPENAI_API_KEY) return 'gpt-4o';
  if (ANTHROPIC_API_KEY) return 'claude-sonnet-4-5';
  return 'orbit-sim-v1';
}

// ============================================
// Real OpenAI Call
// ============================================

async function callOpenAI(
  messages: LLMMessage[],
  tools: unknown[],
  model = 'gpt-4o'
): Promise<LLMResponse> {
  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: 0.2,
    max_tokens: 16384,
  };
  if (tools.length > 0) body.tools = tools;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
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
  model = 'claude-sonnet-4-5'
): Promise<LLMResponse> {
  const anthropicMessages = messages
    .filter(m => m.role !== 'system')
    .map(m => ({ role: m.role === 'tool' ? 'user' : m.role, content: m.content }));

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: anthropicMessages,
      system: systemPrompt,
      max_tokens: 8192,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic error (${res.status}): ${err.slice(0, 300)}`);
  }

  const data = await res.json() as {
    content: Array<{ type: string; text: string }>;
    usage: { input_tokens: number; output_tokens: number };
  };

  return {
    content: data.content.find(c => c.type === 'text')?.text ?? '',
    inputTokens: data.usage.input_tokens,
    outputTokens: data.usage.output_tokens,
    model,
    finishReason: 'stop',
  };
}

// ============================================
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

function pickResponse(stage: string, taskTitle: string): string {
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
}

export interface AgentCallResult {
  output: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
  durationMs: number;
  isSimulated: boolean;
}

export async function callAgent(options: AgentCallOptions): Promise<AgentCallResult> {
  const startTime = Date.now();
  const { systemPrompt, userPrompt, stage, taskTitle, tools = [], model, onLog } = options;

  // Real LLM path
  if (OPENAI_API_KEY) {
    onLog?.(`  🌐 Calling OpenAI ${model ?? 'gpt-4o'}...`);
    try {
      const messages: LLMMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ];
      const res = await callOpenAI(messages, tools, model ?? 'gpt-4o');
      return {
        output: res.content ?? '',
        inputTokens: res.inputTokens,
        outputTokens: res.outputTokens,
        model: res.model,
        durationMs: Date.now() - startTime,
        isSimulated: false,
      };
    } catch (err) {
      onLog?.(`  ⚠️ OpenAI error: ${err instanceof Error ? err.message : String(err)}, falling back to simulation`);
    }
  }

  if (ANTHROPIC_API_KEY) {
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
      onLog?.(`  ⚠️ Anthropic error: ${err instanceof Error ? err.message : String(err)}, falling back to simulation`);
    }
  }

  // Intelligent simulation — generates realistic output
  onLog?.(`  🤖 Orbit AI Engine (add API key to .env.local for real LLM)`);
  const delay = 600 + Math.random() * 1200;
  await new Promise(r => setTimeout(r, delay));
  const output = pickResponse(stage, taskTitle);
  const fakeTokens = Math.floor(output.length / 3.5);
  return {
    output,
    inputTokens: 800 + Math.floor(Math.random() * 2000),
    outputTokens: fakeTokens,
    model: 'orbit-sim-v1',
    durationMs: Date.now() - startTime,
    isSimulated: true,
  };
}
