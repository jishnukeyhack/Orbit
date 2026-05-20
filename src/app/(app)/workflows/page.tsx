'use client';
import { useState, useRef, useEffect } from 'react';

interface WorkflowStep {
  id: string;
  name: string;
  agentRole: string;
  prompt: string;
  status: 'pending' | 'running' | 'done' | 'error';
  output: string;
  durationMs?: number;
  tokens?: number;
}

const TEMPLATES = [
  {
    id: 'fullstack-feature',
    name: '🚀 Full-Stack Feature Build',
    description: 'Design → Code → Review → Test → Document a complete feature',
    steps: [
      { id: 's1', name: 'Architecture Design', agentRole: 'Software Architect', prompt: 'Design the system architecture for this feature. Define components, data models, and API contracts.', status: 'pending' as const, output: '' },
      { id: 's2', name: 'Implementation', agentRole: 'Senior Developer', prompt: 'Implement the feature based on the architecture. Write clean, production-ready TypeScript code.', status: 'pending' as const, output: '' },
      { id: 's3', name: 'Code Review', agentRole: 'Code Reviewer', prompt: 'Review the implementation for bugs, security issues, and code quality. Provide actionable feedback.', status: 'pending' as const, output: '' },
      { id: 's4', name: 'Test Suite', agentRole: 'QA Engineer', prompt: 'Write comprehensive unit and integration tests. Aim for >90% coverage of critical paths.', status: 'pending' as const, output: '' },
      { id: 's5', name: 'Documentation', agentRole: 'Technical Writer', prompt: 'Write clear documentation including README, API docs, and usage examples.', status: 'pending' as const, output: '' },
    ],
  },
  {
    id: 'marketing-campaign',
    name: '📢 Marketing Campaign',
    description: 'Strategy → Content → SEO → Social → Analytics',
    steps: [
      { id: 's1', name: 'Market Research', agentRole: 'Growth Strategist', prompt: 'Research the target market, competitors, and key differentiators. Identify the best channels.', status: 'pending' as const, output: '' },
      { id: 's2', name: 'Campaign Strategy', agentRole: 'Marketing Strategist', prompt: 'Create a detailed campaign strategy with messaging, positioning, and KPIs.', status: 'pending' as const, output: '' },
      { id: 's3', name: 'Content Creation', agentRole: 'Content Creator', prompt: 'Write compelling marketing copy: landing page, email sequence, and social posts.', status: 'pending' as const, output: '' },
      { id: 's4', name: 'SEO Optimization', agentRole: 'SEO Specialist', prompt: 'Optimize all content for search engines. Identify target keywords and meta descriptions.', status: 'pending' as const, output: '' },
    ],
  },
  {
    id: 'startup-analysis',
    name: '📊 Startup Analysis',
    description: 'Business model → Market sizing → Competitive analysis → Pitch deck',
    steps: [
      { id: 's1', name: 'Business Model Analysis', agentRole: 'Business Analyst', prompt: 'Analyze the business model, revenue streams, and unit economics. Identify strengths and weaknesses.', status: 'pending' as const, output: '' },
      { id: 's2', name: 'Market Sizing', agentRole: 'Market Research Analyst', prompt: 'Calculate TAM, SAM, SOM. Provide data-backed market size estimates and growth projections.', status: 'pending' as const, output: '' },
      { id: 's3', name: 'Competitive Landscape', agentRole: 'Strategy Consultant', prompt: 'Map the competitive landscape. Identify key players, their strengths, and defensible moats.', status: 'pending' as const, output: '' },
      { id: 's4', name: 'Investment Thesis', agentRole: 'VC Analyst', prompt: 'Write a compelling investment thesis. What makes this a venture-scale opportunity?', status: 'pending' as const, output: '' },
    ],
  },
];

const STEP_COLORS = ['#6366f1', '#22d3ee', '#10b981', '#f59e0b', '#8b5cf6'];

export default function WorkflowsPage() {
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);
  const [steps, setSteps] = useState<WorkflowStep[]>(TEMPLATES[0].steps);
  const [goal, setGoal] = useState('');
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<'setup' | 'running' | 'done'>('setup');
  const [currentStepIdx, setCurrentStepIdx] = useState(-1);
  const [totalTokens, setTotalTokens] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [steps, currentStepIdx]);

  const selectTemplate = (t: typeof TEMPLATES[0]) => {
    setSelectedTemplate(t);
    setSteps(t.steps.map(s => ({ ...s, status: 'pending', output: '' })));
    setPhase('setup');
    setCurrentStepIdx(-1);
  };

  const executeStep = async (step: WorkflowStep, idx: number, context: string): Promise<string> => {
    setCurrentStepIdx(idx);
    setSteps(prev => prev.map((s, i) => i === idx ? { ...s, status: 'running' } : s));

    const apiKey = typeof window !== 'undefined' ? undefined : null;
    const startTime = Date.now();

    try {
      const fullPrompt = context
        ? `Goal: ${goal}\n\nContext from previous steps:\n${context.slice(0, 800)}\n\nYour task: ${step.prompt}`
        : `Goal: ${goal}\n\nYour task: ${step.prompt}`;

      const localOpenaiKey = localStorage.getItem('orbit_openai_key') || '';
      const localGeminiKey = localStorage.getItem('orbit_gemini_key') || '';

      const res = await fetch('/api/workflow/execute', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-openai-api-key': localOpenaiKey,
          'x-gemini-api-key': localGeminiKey
        },
        body: JSON.stringify({
          stepName: step.name,
          agentRole: step.agentRole,
          prompt: fullPrompt,
        }),
      });

      if (!res.ok) throw new Error(await res.text());

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let stepOutput = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value).split('\n').filter(l => l.startsWith('data:'));
        for (const line of lines) {
          try {
            const evt = JSON.parse(line.slice(5)) as { type: string; token?: string; usage?: { inputTokens: number; outputTokens: number } };
            if (evt.type === 'chunk' && evt.token) {
              stepOutput += evt.token;
              setSteps(prev => prev.map((s, i) => i === idx ? { ...s, output: stepOutput } : s));
            }
            if (evt.type === 'done' && evt.usage) {
              const stepTokens = evt.usage.inputTokens + evt.usage.outputTokens;
              const stepCost = (evt.usage.inputTokens * 0.0000025) + (evt.usage.outputTokens * 0.00001);
              setTotalTokens(t => t + stepTokens);
              setTotalCost(c => c + stepCost);
              setSteps(prev => prev.map((s, i) => i === idx ? { ...s, tokens: stepTokens } : s));
            }
          } catch { /* skip */ }
        }
      }

      const duration = Date.now() - startTime;
      setSteps(prev => prev.map((s, i) => i === idx ? { ...s, status: 'done', durationMs: duration } : s));
      return stepOutput;

    } catch (err) {
      setSteps(prev => prev.map((s, i) => i === idx ? { ...s, status: 'error', output: `Error: ${String(err)}` } : s));
      return '';
    }
  };

  const runWorkflow = async () => {
    if (!goal.trim()) return;
    setRunning(true);
    setPhase('running');
    setTotalTokens(0);
    setTotalCost(0);
    setSteps(selectedTemplate.steps.map(s => ({ ...s, status: 'pending', output: '' })));

    let context = '';
    for (let i = 0; i < steps.length; i++) {
      const output = await executeStep(steps[i], i, context);
      context += `\n\n## ${steps[i].name} Output:\n${output.slice(0, 600)}`;
    }

    setPhase('done');
    setRunning(false);
    setCurrentStepIdx(-1);
  };

  const statusIcon = (s: WorkflowStep['status'], idx: number) => {
    if (s === 'done') return '✅';
    if (s === 'error') return '❌';
    if (s === 'running') return '⚡';
    return `${idx + 1}`;
  };

  const statusColor = (s: WorkflowStep['status']) => ({
    pending: '#334155', running: '#f59e0b', done: '#10b981', error: '#ef4444',
  }[s]);

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1300, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>🔀 Workflows</h1>
          <p style={{ color: '#64748b', margin: '0.3rem 0 0', fontSize: '0.9rem' }}>
            Multi-step AI workflows — each step runs a specialized agent with real GPT-4o
          </p>
        </div>
        {phase !== 'setup' && (
          <button
            onClick={() => { setPhase('setup'); setCurrentStepIdx(-1); setSteps(selectedTemplate.steps.map(s => ({ ...s, status: 'pending', output: '' }))); }}
            style={{ padding: '8px 18px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#94a3b8', fontSize: '0.85rem', cursor: 'pointer' }}
          >
            ← New Workflow
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: phase === 'setup' ? '280px 1fr' : '1fr', gap: '1.5rem' }}>
        {/* Template selector — only in setup */}
        {phase === 'setup' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Templates</div>
            {TEMPLATES.map(t => (
              <div
                key={t.id}
                onClick={() => selectTemplate(t)}
                style={{
                  padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
                  background: selectedTemplate.id === t.id ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${selectedTemplate.id === t.id ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: selectedTemplate.id === t.id ? '#818cf8' : '#e2e8f0', marginBottom: 4 }}>{t.name}</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', lineHeight: 1.4 }}>{t.description}</div>
                <div style={{ fontSize: '0.68rem', color: '#334155', marginTop: 6 }}>{t.steps.length} steps</div>
              </div>
            ))}
          </div>
        )}

        {/* Main area */}
        <div>
          {phase === 'setup' && (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 24, marginBottom: '1.5rem' }}>
              <div style={{ fontWeight: 600, color: '#f1f5f9', marginBottom: 12 }}>{selectedTemplate.name}</div>

              {/* Step preview */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                {selectedTemplate.steps.map((s, i) => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ padding: '5px 12px', borderRadius: 20, background: `${STEP_COLORS[i % STEP_COLORS.length]}18`, border: `1px solid ${STEP_COLORS[i % STEP_COLORS.length]}33`, fontSize: '0.75rem', color: STEP_COLORS[i % STEP_COLORS.length], fontWeight: 500 }}>
                      {i + 1}. {s.name}
                    </div>
                    {i < selectedTemplate.steps.length - 1 && <span style={{ color: '#334155', fontSize: 14 }}>→</span>}
                  </div>
                ))}
              </div>

              <label style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: 10 }}>
                What should this workflow accomplish?
              </label>
              <textarea
                value={goal}
                onChange={e => setGoal(e.target.value)}
                placeholder="e.g. 'Build a user authentication system with JWT, refresh tokens, and rate limiting for our Node.js API'"
                style={{
                  width: '100%', minHeight: 90, padding: '12px 14px',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10, color: '#f1f5f9', fontSize: '0.88rem', fontFamily: 'inherit',
                  resize: 'vertical', outline: 'none', boxSizing: 'border-box',
                }}
              />
              <button
                onClick={runWorkflow}
                disabled={!goal.trim()}
                style={{
                  marginTop: 14, padding: '12px 32px',
                  background: goal.trim() ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.06)',
                  border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700,
                  fontSize: '0.95rem', cursor: goal.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                ▶ Execute Workflow ({selectedTemplate.steps.length} steps)
              </button>
            </div>
          )}

          {/* Execution view */}
          {(phase === 'running' || phase === 'done') && (
            <div>
              {/* Status bar */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 20px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {running
                    ? <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 8px #f59e0b', animation: 'pulse 1s infinite' }} />
                    : <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />}
                  <span style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '0.9rem' }}>
                    {phase === 'done' ? '✅ Workflow Complete' : `Running Step ${currentStepIdx + 1}/${steps.length}...`}
                  </span>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 16, fontSize: '0.78rem', color: '#64748b' }}>
                  {totalTokens > 0 && <span>{totalTokens.toLocaleString()} tokens</span>}
                  {totalCost > 0 && <span style={{ color: '#10b981' }}>${totalCost.toFixed(4)}</span>}
                </div>
              </div>

              {/* Step cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {steps.map((step, idx) => {
                  const color = STEP_COLORS[idx % STEP_COLORS.length];
                  const isActive = step.status === 'running';
                  return (
                    <div key={step.id} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${isActive ? color + '44' : 'rgba(255,255,255,0.08)'}`, borderRadius: 14, overflow: 'hidden', transition: 'border-color 0.3s' }}>
                      {/* Step header */}
                      <div style={{ padding: '12px 20px', borderBottom: step.output ? '1px solid rgba(255,255,255,0.06)' : 'none', display: 'flex', alignItems: 'center', gap: 12, background: isActive ? `${color}08` : 'transparent' }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: `${statusColor(step.status)}20`, border: `1.5px solid ${statusColor(step.status)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: statusColor(step.status), flexShrink: 0 }}>
                          {statusIcon(step.status, idx)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#f1f5f9' }}>{step.name}</div>
                          <div style={{ fontSize: '0.72rem', color, marginTop: 2 }}>Agent: {step.agentRole}</div>
                        </div>
                        <div style={{ textAlign: 'right', fontSize: '0.7rem', color: '#475569' }}>
                          {step.durationMs && <div>{(step.durationMs / 1000).toFixed(1)}s</div>}
                          {step.tokens && <div>{step.tokens.toLocaleString()} tok</div>}
                        </div>
                        {isActive && <div style={{ width: 16, height: 16, border: `2px solid ${color}44`, borderTopColor: color, borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />}
                      </div>

                      {/* Output */}
                      {step.output && (
                        <div style={{ padding: '14px 20px', fontFamily: 'inherit', fontSize: '0.83rem', color: '#94a3b8', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 320, overflowY: 'auto' }}>
                          {step.output}
                          {isActive && <span style={{ display: 'inline-block', width: 6, height: 12, background: color, marginLeft: 2, animation: 'blink 0.7s infinite', verticalAlign: 'text-bottom' }} />}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div ref={bottomRef} />
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:0.5} 50%{opacity:1} }
        @keyframes spin  { to{transform:rotate(360deg)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </div>
  );
}
