import { NextRequest, NextResponse } from 'next/server';
import { loadAllAgents } from '@/lib/openswarm/agentRegistry';
import { callAgent } from '@/lib/server/llm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const openaiKey = request.headers.get('x-openai-api-key') || '';
    const geminiKey = request.headers.get('x-gemini-api-key') || '';
    
    if (openaiKey && openaiKey.trim()) {
      process.env.OPENAI_API_KEY = openaiKey.trim();
    }
    if (geminiKey && geminiKey.trim()) {
      process.env.GEMINI_API_KEY = geminiKey.trim();
    }

    const { goal } = await request.json() as { goal: string };
    if (!goal || !goal.trim()) {
      return new NextResponse('Goal is required', { status: 400 });
    }

    const allAgents = loadAllAgents();
    const agentsList = allAgents.map(a => ({
      id: a.id,
      name: a.name,
      category: a.category,
      description: a.description
    }));

    const systemPrompt = `You are the Lead Swarm Recruiting Director for Project Orbit. 
Your job is to analyze a user's task goal, and select the 3 most qualified specialized agents from the registry of 175+ agents to form a collaborative swarm.

You must output ONLY a valid JSON object matching this schema:
{
  "selectedAgentIds": ["agent-id-1", "agent-id-2", "agent-id-3"],
  "strategy": "parallel" | "sequential" | "hierarchical",
  "rationale": "Brief professional sentence explaining why these 3 agents were selected to work on the task."
}

Do not include any markdown fences (like \`\`\`json) or extra text. Return ONLY the JSON object.`;

    const userPrompt = `Task Goal: "${goal}"

Available Agents Cohort:
${JSON.stringify(agentsList.slice(0, 100))}
${JSON.stringify(agentsList.slice(100))}

Select the 3 best agents and strategy. Return valid JSON.`;

    const result = await callAgent({
      systemPrompt,
      userPrompt,
      stage: 'assistant',
      taskTitle: 'Recruit Agents Swarm',
      openaiKey,
      geminiKey
    });

    let jsonStr = result.output.trim();
    // Strip markdown formatting if any
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    }

    try {
      const parsed = JSON.parse(jsonStr);
      return NextResponse.json(parsed);
    } catch (parseErr) {
      // Fallback in case LLM format fails
      const matchedIds = allAgents.slice(0, 3).map(a => a.id);
      return NextResponse.json({
        selectedAgentIds: matchedIds,
        strategy: 'sequential',
        rationale: 'Automatically matched core specialists to execute task.'
      });
    }
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
