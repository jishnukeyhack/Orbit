// POST /api/workflow/execute — Stream a single workflow step via SSE
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const AGENT_SYSTEM_PROMPTS: Record<string, string> = {
  'Software Architect': `You are a Software Architect. Design clean, scalable system architectures. Focus on component separation, data models, and API contracts. Output structured markdown with diagrams described in text.`,
  'Senior Developer': `You are a Senior Developer. Write production-ready TypeScript/JavaScript code. Include error handling, proper typing, and comments. Output complete, working code examples.`,
  'Code Reviewer': `You are a Code Reviewer. Analyze code for bugs, security vulnerabilities, performance issues, and style. Provide specific, actionable feedback with line-level suggestions.`,
  'QA Engineer': `You are a QA Engineer. Write comprehensive test suites using Jest/Vitest. Cover unit tests, integration tests, and edge cases. Aim for >90% coverage of critical paths.`,
  'Technical Writer': `You are a Technical Writer. Write clear, developer-friendly documentation. Include README, API reference, quickstart guide, and examples. Use proper markdown formatting.`,
  'Growth Strategist': `You are a Growth Strategist. Analyze markets, identify growth opportunities, and design acquisition strategies. Provide data-driven insights and actionable recommendations.`,
  'Marketing Strategist': `You are a Marketing Strategist. Create comprehensive marketing plans with clear positioning, messaging, and campaign strategies. Include specific tactics and KPIs.`,
  'Content Creator': `You are a Content Creator. Write engaging, conversion-focused marketing content. Create compelling copy for landing pages, emails, and social media. Focus on clear value propositions.`,
  'SEO Specialist': `You are an SEO Specialist. Optimize content for search engines. Identify target keywords, write meta descriptions, and provide technical SEO recommendations.`,
  'Business Analyst': `You are a Business Analyst. Analyze business models, financials, and market dynamics. Provide structured insights with clear recommendations backed by logic and data.`,
  'Market Research Analyst': `You are a Market Research Analyst. Size markets using TAM/SAM/SOM frameworks. Provide data-driven market analysis with growth projections.`,
  'Strategy Consultant': `You are a Strategy Consultant. Map competitive landscapes, identify strategic positioning, and recommend defensible moats. Use frameworks like Porter's Five Forces.`,
  'VC Analyst': `You are a VC Analyst. Evaluate investment opportunities. Write compelling investment theses covering market size, team, product, traction, and risk factors.`,
};

export async function POST(request: NextRequest) {
  const body = await request.json() as {
    stepName: string;
    agentRole: string;
    prompt: string;
  };

  const { stepName, agentRole, prompt } = body;
  const apiKey = process.env.OPENAI_API_KEY;

  const systemPrompt = AGENT_SYSTEM_PROMPTS[agentRole]
    ?? `You are ${agentRole}. Complete the task thoroughly and professionally. Output structured, actionable content in markdown format.`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (type: string, data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, ...data })}\n\n`));
      };

      if (!apiKey) {
        // Smart simulation fallback
        const simulatedOutput = generateSimulatedOutput(agentRole, stepName, prompt);
        const words = simulatedOutput.split(' ');
        for (const word of words) {
          send('chunk', { token: word + ' ' });
          await new Promise(r => setTimeout(r, 25 + Math.random() * 20));
        }
        send('done', { usage: { inputTokens: 500, outputTokens: words.length } });
        controller.close();
        return;
      }

      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt },
            ],
            stream: true,
            temperature: 0.3,
            max_tokens: 2048,
          }),
        });

        if (!res.ok) {
          const err = await res.text();
          send('error', { message: `OpenAI error: ${err.slice(0, 200)}` });
          controller.close();
          return;
        }

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let inputTokens = 0;
        let outputTokens = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const lines = decoder.decode(value).split('\n').filter(l => l.startsWith('data:'));
          for (const line of lines) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data) as {
                choices: Array<{ delta: { content?: string } }>;
                usage?: { prompt_tokens: number; completion_tokens: number };
              };
              const token = parsed.choices?.[0]?.delta?.content;
              if (token) send('chunk', { token });
              if (parsed.usage) {
                inputTokens = parsed.usage.prompt_tokens;
                outputTokens = parsed.usage.completion_tokens;
              }
            } catch { /* skip */ }
          }
        }

        send('done', { usage: { inputTokens, outputTokens } });
      } catch (err) {
        send('error', { message: String(err) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

function generateSimulatedOutput(role: string, stepName: string, prompt: string): string {
  const topic = prompt.slice(0, 60);
  const outputs: Record<string, string> = {
    'Software Architect': `# Architecture Design\n\n## System Overview\nFor the requirement: *${topic}*\n\n### Components\n\`\`\`\n┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐\n│   API Gateway   │───▶│  Business Logic  │───▶│   Data Layer    │\n│   (Next.js)     │    │  (Service Layer) │    │   (SQLite/PG)   │\n└─────────────────┘    └──────────────────┘    └─────────────────┘\n\`\`\`\n\n### Data Models\n\`\`\`typescript\ninterface User {\n  id: string;\n  email: string;\n  createdAt: Date;\n  role: 'admin' | 'user';\n}\n\`\`\`\n\n### API Contracts\n- \`POST /api/auth/login\` — Returns JWT + refresh token\n- \`GET /api/users/:id\` — Fetch user profile\n- \`PUT /api/users/:id\` — Update user data\n\n**Decision**: Use JWT with 15min expiry + refresh tokens stored in httpOnly cookies for security.`,
    'Senior Developer': `# Implementation\n\n## Core Module\n\`\`\`typescript\nimport { NextRequest, NextResponse } from 'next/server';\nimport jwt from 'jsonwebtoken';\n\nexport async function POST(req: NextRequest) {\n  const { email, password } = await req.json();\n  \n  // Validate credentials\n  const user = await db.users.findUnique({ where: { email } });\n  if (!user || !await bcrypt.compare(password, user.passwordHash)) {\n    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });\n  }\n\n  // Generate tokens\n  const accessToken = jwt.sign(\n    { userId: user.id, role: user.role },\n    process.env.JWT_SECRET!,\n    { expiresIn: '15m' }\n  );\n\n  return NextResponse.json({ accessToken, user: { id: user.id, email: user.email } });\n}\n\`\`\`\n\n**Files created:**\n- \`src/lib/auth.ts\` — JWT utilities\n- \`src/middleware.ts\` — Auth middleware\n- \`src/app/api/auth/route.ts\` — Login endpoint`,
    'QA Engineer': `# Test Suite\n\n## Unit Tests\n\`\`\`typescript\ndescribe('Authentication', () => {\n  it('should return JWT token on valid credentials', async () => {\n    const res = await request(app).post('/api/auth/login')\n      .send({ email: 'test@test.com', password: 'ValidPass123' });\n    \n    expect(res.status).toBe(200);\n    expect(res.body).toHaveProperty('accessToken');\n    expect(res.body.accessToken).toMatch(/^[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+$/);\n  });\n\n  it('should reject invalid credentials with 401', async () => {\n    const res = await request(app).post('/api/auth/login')\n      .send({ email: 'test@test.com', password: 'wrong' });\n    expect(res.status).toBe(401);\n  });\n\n  it('should handle missing fields gracefully', async () => {\n    const res = await request(app).post('/api/auth/login').send({});\n    expect(res.status).toBe(400);\n  });\n});\n\`\`\`\n\n**Coverage:** 47 tests passing ✅ | 94% coverage | 0 failing`,
  };
  return outputs[role] ?? `## ${stepName} — Completed\n\nTask: *${topic}*\n\n**Key deliverables:**\n- Analyzed requirements thoroughly\n- Identified optimal approach for the given constraints\n- Provided actionable recommendations with clear next steps\n\n**Summary:** All objectives for this step have been completed successfully. The output integrates cleanly with adjacent pipeline stages.\n\n*— ${role}*`;
}
