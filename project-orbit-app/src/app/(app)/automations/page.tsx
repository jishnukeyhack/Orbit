'use client';
import { useState } from 'react';

interface Automation {
  id: string;
  name: string;
  trigger: string;
  action: string;
  status: 'active' | 'paused' | 'idle';
  runs: number;
  lastRun: string;
  icon: string;
}

const DEFAULT_AUTOMATIONS: Automation[] = [
  { id: 'a1', name: 'Daily Code Review', trigger: 'Every day at 9:00 AM', action: 'Run Code Reviewer on new commits', status: 'active', runs: 47, lastRun: '2 hours ago', icon: '🔍' },
  { id: 'a2', name: 'Weekly SEO Report', trigger: 'Every Monday at 8:00 AM', action: 'SEO Specialist generates traffic report', status: 'active', runs: 12, lastRun: '3 days ago', icon: '📊' },
  { id: 'a3', name: 'PR Documentation', trigger: 'On GitHub PR opened', action: 'Technical Writer documents changes', status: 'paused', runs: 89, lastRun: '1 week ago', icon: '📝' },
  { id: 'a4', name: 'Security Scan', trigger: 'Every Sunday at midnight', action: 'Security Auditor scans codebase', status: 'active', runs: 8, lastRun: '6 days ago', icon: '🔒' },
  { id: 'a5', name: 'Content Pipeline', trigger: 'On Notion page updated', action: 'Content Creator + SEO pipeline', status: 'idle', runs: 0, lastRun: 'Never', icon: '✍️' },
];

const TRIGGER_TYPES = ['Schedule (Cron)', 'Webhook', 'File Change', 'API Event', 'Manual'];
const ACTION_TYPES = ['Run Agent', 'Run Pipeline', 'Run Swarm', 'Run Workflow', 'Send Notification'];

const STATUS_COLORS = { active: '#10b981', paused: '#f59e0b', idle: '#475569' };
const STATUS_LABELS = { active: '● Active', paused: '⏸ Paused', idle: '○ Idle' };

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>(DEFAULT_AUTOMATIONS);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTrigger, setNewTrigger] = useState(TRIGGER_TYPES[0]);
  const [newAction, setNewAction] = useState(ACTION_TYPES[0]);
  const [newDesc, setNewDesc] = useState('');

  const toggleStatus = (id: string) => {
    setAutomations(prev => prev.map(a =>
      a.id === id
        ? { ...a, status: a.status === 'active' ? 'paused' : 'active' }
        : a
    ));
  };

  const deleteAutomation = (id: string) => {
    setAutomations(prev => prev.filter(a => a.id !== id));
  };

  const createAutomation = () => {
    if (!newName.trim()) return;
    const newAuto: Automation = {
      id: `a${Date.now()}`,
      name: newName,
      trigger: newTrigger,
      action: newAction || newDesc,
      status: 'idle',
      runs: 0,
      lastRun: 'Never',
      icon: '⚡',
    };
    setAutomations(prev => [newAuto, ...prev]);
    setNewName('');
    setNewDesc('');
    setShowCreate(false);
  };

  const runNow = (auto: Automation) => {
    setAutomations(prev => prev.map(a =>
      a.id === auto.id
        ? { ...a, runs: a.runs + 1, lastRun: 'Just now', status: 'active' }
        : a
    ));
    // In production, this would trigger the actual pipeline/agent
    alert(`✅ "${auto.name}" triggered! Check the Pipeline page for execution status.`);
  };

  const activeCount = automations.filter(a => a.status === 'active').length;
  const totalRuns = automations.reduce((s, a) => s + a.runs, 0);

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>⚡ Automations</h1>
          <p style={{ color: '#64748b', margin: '0.3rem 0 0', fontSize: '0.9rem' }}>
            Schedule agents and pipelines to run automatically
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          + New Automation
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Active', value: activeCount, color: '#10b981', icon: '🟢' },
          { label: 'Total Runs', value: totalRuns, color: '#6366f1', icon: '🔁' },
          { label: 'Automations', value: automations.length, color: '#f59e0b', icon: '⚡' },
        ].map(s => (
          <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '1.25rem', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ fontSize: '2rem' }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Create form */}
      {showCreate && (
        <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 14, padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ fontWeight: 600, color: '#818cf8', marginBottom: '1rem' }}>Create New Automation</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', marginBottom: 4 }}>Name *</label>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Daily Code Review"
                style={{ width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', marginBottom: 4 }}>Trigger</label>
              <select value={newTrigger} onChange={e => setNewTrigger(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', background: '#0f1629', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}>
                {TRIGGER_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', marginBottom: 4 }}>Action</label>
              <select value={newAction} onChange={e => setNewAction(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', background: '#0f1629', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}>
                {ACTION_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', marginBottom: 4 }}>Description</label>
              <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="What should this automation do?"
                style={{ width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={createAutomation} style={{ padding: '9px 24px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' }}>
              Create
            </button>
            <button onClick={() => setShowCreate(false)} style={{ padding: '9px 18px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#94a3b8', fontSize: '0.88rem', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Automation list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {automations.map(auto => (
          <div key={auto.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'border-color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
          >
            <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>{auto.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#f1f5f9' }}>{auto.name}</span>
                <span style={{ fontSize: '0.7rem', color: STATUS_COLORS[auto.status], fontWeight: 600 }}>{STATUS_LABELS[auto.status]}</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <span>🕐 {auto.trigger}</span>
                <span>→ {auto.action}</span>
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#475569', flexShrink: 0 }}>
              <div style={{ color: '#94a3b8', fontWeight: 600 }}>{auto.runs} runs</div>
              <div style={{ marginTop: 2 }}>Last: {auto.lastRun}</div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button onClick={() => runNow(auto)} title="Run now"
                style={{ padding: '6px 12px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 7, color: '#10b981', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>
                ▶ Run
              </button>
              <button onClick={() => toggleStatus(auto.id)} title={auto.status === 'active' ? 'Pause' : 'Activate'}
                style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, color: '#94a3b8', fontSize: '0.75rem', cursor: 'pointer' }}>
                {auto.status === 'active' ? '⏸' : '▶'}
              </button>
              <button onClick={() => deleteAutomation(auto.id)} title="Delete"
                style={{ padding: '6px 10px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 7, color: '#ef4444', fontSize: '0.75rem', cursor: 'pointer' }}>
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
