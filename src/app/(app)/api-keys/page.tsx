'use client';
import { useState } from 'react';

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  created: string;
  lastUsed: string;
  permissions: string[];
  active: boolean;
}

const DEFAULT_KEYS: ApiKey[] = [
  { id: 'k1', name: 'Production App', prefix: 'orb_prod_••••••••', created: '2026-05-01', lastUsed: '2 hours ago', permissions: ['agents:read', 'agents:run', 'pipeline:run'], active: true },
  { id: 'k2', name: 'Development', prefix: 'orb_dev_••••••••', created: '2026-05-10', lastUsed: '5 minutes ago', permissions: ['agents:read', 'chat:send'], active: true },
];

const ALL_PERMISSIONS = ['agents:read', 'agents:run', 'pipeline:run', 'swarms:run', 'workflows:run', 'chat:send', 'terminal:exec', 'memory:read', 'admin'];

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>(DEFAULT_KEYS);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPerms, setNewPerms] = useState<string[]>(['agents:read', 'agents:run']);
  const [justCreated, setJustCreated] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const createKey = () => {
    if (!newName.trim()) return;
    const fakeKey = `orb_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 18)}`;
    const newKey: ApiKey = {
      id: `k${Date.now()}`, name: newName,
      prefix: fakeKey.slice(0, 18) + '••••••',
      created: new Date().toISOString().slice(0, 10),
      lastUsed: 'Never', permissions: newPerms, active: true,
    };
    setKeys(prev => [newKey, ...prev]);
    setJustCreated(fakeKey);
    setNewName('');
    setNewPerms(['agents:read', 'agents:run']);
    setShowCreate(false);
  };

  const togglePerm = (p: string) => {
    setNewPerms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const revokeKey = (id: string) => {
    setKeys(prev => prev.map(k => k.id === id ? { ...k, active: false } : k));
  };

  const copyKey = () => {
    if (justCreated) {
      navigator.clipboard.writeText(justCreated);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f1f5f9', margin: 0 }}> API Keys</h1>
          <p style={{ color: '#64748b', margin: '0.3rem 0 0', fontSize: '0.9rem' }}>Manage keys for accessing Orbit programmatically</p>
        </div>
        <button onClick={() => { setShowCreate(!showCreate); setJustCreated(null); }}
          style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>
          + Create Key
        </button>
      </div>

      {/* Just created key */}
      {justCreated && (
        <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 12, padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ fontWeight: 600, color: '#10b981', marginBottom: 8 }}> API Key Created — Copy it now, you won't see it again!</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <code style={{ flex: 1, padding: '8px 12px', background: 'rgba(0,0,0,0.3)', borderRadius: 8, color: '#22d3ee', fontSize: '0.82rem', fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {justCreated}
            </code>
            <button onClick={copyKey} style={{ padding: '8px 16px', background: copied ? 'rgba(16,185,129,0.2)' : 'rgba(99,102,241,0.15)', border: `1px solid ${copied ? 'rgba(16,185,129,0.4)' : 'rgba(99,102,241,0.3)'}`, borderRadius: 8, color: copied ? '#10b981' : '#818cf8', fontSize: '0.8rem', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 600 }}>
              {copied ? ' Copied!' : ' Copy'}
            </button>
          </div>
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 14, padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ fontWeight: 600, color: '#818cf8', marginBottom: '1rem' }}>New API Key</div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', marginBottom: 4 }}>Key Name *</label>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. My Integration"
              style={{ width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
          </div>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', marginBottom: 8 }}>Permissions</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {ALL_PERMISSIONS.map(p => (
                <button key={p} onClick={() => togglePerm(p)}
                  style={{ padding: '4px 10px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 500, cursor: 'pointer',
                    background: newPerms.includes(p) ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${newPerms.includes(p) ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.08)'}`,
                    color: newPerms.includes(p) ? '#818cf8' : '#64748b',
                  }}>
                  {newPerms.includes(p) ? '✓ ' : ''}{p}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={createKey} style={{ padding: '9px 24px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' }}>
              Generate Key
            </button>
            <button onClick={() => setShowCreate(false)} style={{ padding: '9px 18px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#94a3b8', fontSize: '0.88rem', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Key list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {keys.map(key => (
          <div key={key.id} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${key.active ? 'rgba(255,255,255,0.08)' : 'rgba(239,68,68,0.15)'}`, borderRadius: 14, padding: '1.25rem 1.5rem', opacity: key.active ? 1 : 0.5 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, color: '#f1f5f9' }}>{key.name}</span>
                  <span style={{ fontSize: '0.65rem', padding: '2px 7px', borderRadius: 10, background: key.active ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: key.active ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                    {key.active ? 'Active' : 'Revoked'}
                  </span>
                </div>
                <code style={{ fontSize: '0.8rem', color: '#64748b', fontFamily: 'monospace' }}>{key.prefix}</code>
                <div style={{ display: 'flex', gap: '1rem', marginTop: 8, fontSize: '0.72rem', color: '#475569' }}>
                  <span>Created: {key.created}</span>
                  <span>Last used: {key.lastUsed}</span>
                </div>
                <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                  {key.permissions.map(p => (
                    <span key={p} style={{ fontSize: '0.65rem', padding: '2px 7px', borderRadius: 6, background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}>
                      {p}
                    </span>
                  ))}
                </div>
              </div>
              {key.active && (
                <button onClick={() => revokeKey(key.id)}
                  style={{ padding: '6px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, color: '#ef4444', fontSize: '0.78rem', cursor: 'pointer', flexShrink: 0, fontWeight: 500 }}>
                  Revoke
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '1.5rem', padding: '1rem 1.25rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10 }}>
        <div style={{ fontSize: '0.75rem', color: '#475569', lineHeight: 1.6 }}>
           API keys grant programmatic access to your Orbit agents and pipelines. Keep them secret — treat like passwords.
          Use the <code style={{ color: '#22d3ee' }}>Authorization: Bearer YOUR_KEY</code> header when calling the Orbit API.
        </div>
      </div>
    </div>
  );
}
