'use client';
import { useState, useEffect } from 'react';

interface SystemStatus {
  openai: boolean;
  database: boolean;
  agentCount: number;
  version: string;
}

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [savedKey, setSavedKey] = useState('');
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load saved key from localStorage (display masked)
    const stored = localStorage.getItem('orbit_openai_key');
    if (stored) setSavedKey(stored.slice(0, 7) + '•'.repeat(20) + stored.slice(-4));

    // Fetch system status
    fetch('/api/status').then(r => r.json()).then(d => setStatus(d as SystemStatus)).catch(() => {});
  }, []);

  const saveKey = () => {
    if (!apiKey.trim().startsWith('sk-')) {
      setTestResult({ ok: false, message: 'API key must start with sk-' });
      return;
    }
    localStorage.setItem('orbit_openai_key', apiKey.trim());
    setSavedKey(apiKey.slice(0, 7) + '•'.repeat(20) + apiKey.slice(-4));
    setApiKey('');
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const testApiKey = async () => {
    const keyToTest = apiKey.trim() || localStorage.getItem('orbit_openai_key') || '';
    if (!keyToTest) { setTestResult({ ok: false, message: 'Enter an API key first' }); return; }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${keyToTest}` },
      });
      if (res.ok) {
        setTestResult({ ok: true, message: '✅ API key is valid! GPT-4o is accessible.' });
      } else {
        const err = await res.json() as { error?: { message?: string } };
        setTestResult({ ok: false, message: `❌ ${err.error?.message ?? 'Invalid API key'}` });
      }
    } catch {
      setTestResult({ ok: false, message: '❌ Connection failed. Check your internet.' });
    } finally {
      setTesting(false);
    }
  };

  const clearKey = () => {
    localStorage.removeItem('orbit_openai_key');
    setSavedKey('');
    setApiKey('');
    setTestResult(null);
  };

  const configItems = [
    { key: 'Model', value: 'gpt-4o', desc: 'Used for all agent, pipeline, and chat tasks', icon: '🧠' },
    { key: 'Database', value: 'SQLite (orbit.db)', desc: 'Local persistence for pipeline runs and memory', icon: '🗄️' },
    { key: 'Workspace', value: './orbit-workspace/', desc: 'Directory where agents create and edit files', icon: '📁' },
    { key: 'Agent Registry', value: `${status?.agentCount ?? '?'} agents loaded`, desc: 'Parsed from agency-agents-main library', icon: '🤖' },
  ];

  return (
    <div style={{ padding: '1.5rem', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>⚙️ Settings</h1>
        <p style={{ color: '#64748b', margin: '0.3rem 0 0', fontSize: '0.9rem' }}>Configure your Orbit AI platform</p>
      </div>

      {/* System Status */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ fontWeight: 600, color: '#f1f5f9', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>System Status</span>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
          {[
            { label: 'OpenAI Connection', ok: status?.openai ?? (process.env.NEXT_PUBLIC_HAS_OPENAI === 'true'), icon: '🧠' },
            { label: 'Database', ok: status?.database ?? true, icon: '🗄️' },
            { label: 'Agent Registry', ok: (status?.agentCount ?? 0) > 0, icon: '🤖' },
            { label: 'API Server', ok: true, icon: '🌐' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10 }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 500, color: '#e2e8f0' }}>{item.label}</div>
              </div>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.ok ? '#10b981' : '#ef4444', boxShadow: `0 0 6px ${item.ok ? '#10b981' : '#ef4444'}` }} />
            </div>
          ))}
        </div>
      </div>

      {/* API Key */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ fontWeight: 600, color: '#f1f5f9', marginBottom: '0.4rem' }}>🔑 OpenAI API Key</div>
        <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1.25rem', lineHeight: 1.6 }}>
          Required for real agent execution, chat, pipeline, and swarm functionality.
          Get yours at{' '}
          <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" style={{ color: '#6366f1', textDecoration: 'none' }}>
            platform.openai.com/api-keys →
          </a>
        </div>

        {/* Current key */}
        {savedKey && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, marginBottom: '1rem' }}>
            <span style={{ color: '#10b981' }}>✅</span>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontFamily: 'monospace', flex: 1 }}>{savedKey}</span>
            <button onClick={clearKey} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, color: '#ef4444', fontSize: '0.72rem', padding: '4px 10px', cursor: 'pointer' }}>
              Remove
            </button>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginBottom: '0.75rem' }}>
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') saveKey(); }}
            placeholder={savedKey ? 'Enter new key to replace...' : 'sk-proj-...'}
            style={{
              flex: 1, padding: '10px 14px', background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
              color: '#f1f5f9', fontSize: '0.88rem', outline: 'none', fontFamily: 'monospace',
            }}
          />
          <button
            onClick={testApiKey}
            disabled={testing}
            style={{ padding: '10px 18px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 10, color: '#818cf8', fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 500 }}
          >
            {testing ? '⟳ Testing...' : '🧪 Test'}
          </button>
          <button
            onClick={saveKey}
            style={{ padding: '10px 22px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: 10, color: '#fff', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer' }}
          >
            {saved ? '✅ Saved!' : 'Save'}
          </button>
        </div>

        {testResult && (
          <div style={{ padding: '10px 14px', borderRadius: 8, background: testResult.ok ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${testResult.ok ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`, fontSize: '0.82rem', color: testResult.ok ? '#10b981' : '#ef4444' }}>
            {testResult.message}
          </div>
        )}

        <div style={{ marginTop: '1rem', padding: '10px 14px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 8, fontSize: '0.78rem', color: '#64748b' }}>
          ⚠️ The API key is stored in your <strong style={{ color: '#94a3b8' }}>.env.local</strong> file for server-side calls. Add it there for full production functionality:
          <code style={{ display: 'block', marginTop: 6, padding: '8px 10px', background: 'rgba(0,0,0,0.3)', borderRadius: 6, color: '#22d3ee', fontFamily: 'monospace' }}>
            OPENAI_API_KEY=sk-your-key-here
          </code>
        </div>
      </div>

      {/* Platform config */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ fontWeight: 600, color: '#f1f5f9', marginBottom: '1rem' }}>🔧 Platform Configuration</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {configItems.map(item => (
            <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10 }}>
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.82rem', color: '#64748b' }}>{item.key}</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 500, color: '#e2e8f0' }}>{item.value}</div>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#334155', maxWidth: 200, textAlign: 'right' }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Env file instructions */}
      <div style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 14, padding: '1.5rem' }}>
        <div style={{ fontWeight: 600, color: '#818cf8', marginBottom: '0.75rem' }}>📋 Full Setup (.env.local)</div>
        <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '0.75rem' }}>
          Edit <code style={{ color: '#22d3ee' }}>project-orbit-app/.env.local</code> for production configuration:
        </div>
        <pre style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 10, padding: '1rem', fontSize: '0.8rem', color: '#cbd5e1', overflowX: 'auto', margin: 0 }}>
{`# Required for real agent execution
OPENAI_API_KEY=sk-proj-your-key-here

# Database location
ORBIT_DB_PATH=./orbit.db

# Workspace for file operations  
ORBIT_WORKSPACE=./orbit-workspace`}
        </pre>
      </div>
    </div>
  );
}
