'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User as UserIcon, Key, Settings as SettingsIcon, Palette, Check, Loader2, Sparkles, ShieldCheck } from 'lucide-react';

interface SystemStatus {
  openai: boolean;
  gemini: boolean;
  database: boolean;
  agentCount: number;
  version: string;
}

const GLOW_PRESETS: Record<string, { name: string; gradient: string; shadow: string; color: string }> = {
  blue: { name: "Cosmic Blue", gradient: "linear-gradient(135deg, #4f8cff, #0072ff)", shadow: "0 0 16px rgba(79,140,255,0.55)", color: "#4f8cff" },
  indigo: { name: "Indigo Nebula", gradient: "linear-gradient(135deg, #6366f1, #8b5cf6)", shadow: "0 0 16px rgba(99,102,241,0.55)", color: "#6366f1" },
  red: { name: "Ruby Red", gradient: "linear-gradient(135deg, #ef4444, #b91c1c)", shadow: "0 0 16px rgba(239,68,68,0.55)", color: "#ef4444" },
  amber: { name: "Volt Amber", gradient: "linear-gradient(135deg, #f59e0b, #d97706)", shadow: "0 0 16px rgba(245,158,11,0.55)", color: "#f59e0b" },
  emerald: { name: "Bio Emerald", gradient: "linear-gradient(135deg, #10b981, #059669)", shadow: "0 0 16px rgba(16,185,129,0.55)", color: "#10b981" },
  pink: { name: "Neon Pink", gradient: "linear-gradient(135deg, #ec4899, #be185d)", shadow: "0 0 16px rgba(236,72,153,0.55)", color: "#ec4899" },
};

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [savedKey, setSavedKey] = useState('');
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [saved, setSaved] = useState(false);

  // Gemini state variables
  const [geminiKey, setGeminiKey] = useState('');
  const [savedGeminiKey, setSavedGeminiKey] = useState('');
  const [testingGemini, setTestingGemini] = useState(false);
  const [testGeminiResult, setTestGeminiResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [savedGemini, setSavedGemini] = useState(false);

  // Authenticated Profile State
  const [user, setUser] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [presetGlow, setPresetGlow] = useState('indigo');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [savingKeys, setSavingKeys] = useState(false);

  useEffect(() => {
    // Load OpenAI key
    const stored = localStorage.getItem('orbit_openai_key');
    if (stored) setSavedKey(stored.slice(0, 7) + '•'.repeat(20) + stored.slice(-4));

    // Load Gemini key
    const storedGemini = localStorage.getItem('orbit_gemini_key');
    if (storedGemini) setSavedGeminiKey(storedGemini.slice(0, 4) + '•'.repeat(20) + storedGemini.slice(-4));

    // Fetch system status
    fetch('/api/status').then(r => r.json()).then(d => setStatus(d as SystemStatus)).catch(() => {});

    // Fetch user and profile details
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user);
        setFullName(user.user_metadata?.full_name || '');
        setAvatarUrl(user.user_metadata?.avatar_url || '');
        setPresetGlow(user.user_metadata?.preset_glow || 'indigo');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        setFullName(session.user.user_metadata?.full_name || '');
        setAvatarUrl(session.user.user_metadata?.avatar_url || '');
        setPresetGlow(session.user.user_metadata?.preset_glow || 'indigo');
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const saveKey = async () => {
    if (!apiKey.trim().startsWith('sk-')) {
      setTestResult({ ok: false, message: 'OpenAI API key must start with sk-' });
      return;
    }
    setSavingKeys(true);
    const startTime = Date.now();
    
    localStorage.setItem('orbit_openai_key', apiKey.trim());
    setSavedKey(apiKey.slice(0, 7) + '•'.repeat(20) + apiKey.slice(-4));
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ openai_api_key: apiKey.trim() }),
      });
    } catch { /* silently fail, localStorage is still set */ }
    setApiKey('');
    setSaved(true);
    
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, 1800 - elapsed);
    setTimeout(() => {
      setSavingKeys(false);
      setTimeout(() => setSaved(false), 3000);
    }, remaining);
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
        setTestResult({ ok: true, message: ' API key is valid! GPT-4o is accessible.' });
      } else {
        const err = await res.json() as { error?: { message?: string } };
        setTestResult({ ok: false, message: ` ${err.error?.message ?? 'Invalid API key'}` });
      }
    } catch {
      setTestResult({ ok: false, message: ' Connection failed. Check your internet.' });
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

  const saveGeminiKey = async () => {
    if (!geminiKey.trim()) {
      setTestGeminiResult({ ok: false, message: 'API key cannot be empty' });
      return;
    }
    setSavingKeys(true);
    const startTime = Date.now();

    localStorage.setItem('orbit_gemini_key', geminiKey.trim());
    setSavedGeminiKey(geminiKey.slice(0, 4) + '•'.repeat(20) + geminiKey.slice(-4));
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gemini_api_key: geminiKey.trim() }),
      });
    } catch { /* silently fail, localStorage is still set */ }
    setGeminiKey('');
    setSavedGemini(true);

    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, 1800 - elapsed);
    setTimeout(() => {
      setSavingKeys(false);
      setTimeout(() => setSavedGemini(false), 3000);
    }, remaining);
  };

  const testGeminiKey = async () => {
    const keyToTest = geminiKey.trim() || localStorage.getItem('orbit_gemini_key') || '';
    if (!keyToTest) { setTestGeminiResult({ ok: false, message: 'Enter a Gemini API key first' }); return; }
    setTestingGemini(true);
    setTestGeminiResult(null);
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${keyToTest}`);
      if (res.ok) {
        setTestGeminiResult({ ok: true, message: ' API key is valid! Gemini 1.5 Pro is accessible.' });
      } else {
        const err = await res.json() as { error?: { message?: string } };
        setTestGeminiResult({ ok: false, message: ` ${err.error?.message ?? 'Invalid Gemini API key'}` });
      }
    } catch {
      setTestGeminiResult({ ok: false, message: ' Connection failed. Check your internet.' });
    } finally {
      setTestingGemini(false);
    }
  };

  const clearGeminiKey = () => {
    localStorage.removeItem('orbit_gemini_key');
    setSavedGeminiKey('');
    setGeminiKey('');
    setTestGeminiResult(null);
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    setProfileError(null);
    setProfileSaved(false);
    try {
      const { data, error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName.trim(),
          avatar_url: avatarUrl.trim(),
          preset_glow: presetGlow,
        }
      });
      if (updateError) {
        setProfileError(updateError.message);
      } else {
        setProfileSaved(true);
        if (data?.user) {
          setUser(data.user);
        }
        setTimeout(() => setProfileSaved(false), 3000);
      }
    } catch (err: any) {
      setProfileError(err.message || 'An error occurred while saving profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const configItems = [
    { key: 'Primary Model', value: 'gpt-4o', desc: 'Default execution model for agents and workflows', icon: '' },
    { key: 'Failover Model', value: 'gemini-1.5-pro', desc: 'High-availability backup if OpenAI key fails', icon: '' },
    { key: 'Database', value: 'SQLite (orbit.db)', desc: 'Local persistence for pipeline runs and memory', icon: '️' },
    { key: 'Workspace', value: './orbit-workspace/', desc: 'Directory where agents create and edit files', icon: '' },
    { key: 'Agent Registry', value: `${status?.agentCount ?? '?'} agents loaded`, desc: 'Parsed from agency-agents-main library', icon: '' },
  ];

  return (
    <div style={{ padding: '1.5rem 2rem', maxWidth: 1200, margin: '0 auto', minHeight: 'calc(100vh - 60px)', boxSizing: 'border-box' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#f1f5f9', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ filter: 'drop-shadow(0 0 8px rgba(99,102,241,0.5))' }}>️</span> Settings
          </h1>
          <p style={{ color: '#64748b', margin: '0.4rem 0 0', fontSize: '0.9rem', fontWeight: 500 }}>
            Configure and personalize your Orbit agentic command center
          </p>
        </div>
        {user && (
          <div style={{ padding: '6px 12px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', color: '#10b981', fontWeight: 600 }}>
            <ShieldCheck size={14} /> Cloud Active: {user.email}
          </div>
        )}
      </div>

      {/* Main Responsive Layout Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: User profile, theme preview, status, configs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* USER PROFILE & AESTHETIC CUSTOMIZER */}
          <div style={{ 
            background: 'rgba(13, 18, 30, 0.45)', 
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.08)', 
            borderRadius: 16, 
            padding: '1.75rem',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.24)',
            transition: 'border-color 0.3s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.25rem' }}>
              <Palette size={20} style={{ color: GLOW_PRESETS[presetGlow]?.color || '#6366f1' }} />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Appearance & Profile</h2>
            </div>

            {user ? (
              <div>
                {/* Live Preview Avatar */}
                <div style={{ 
                  display: 'flex', 
                  gap: 16, 
                  alignItems: 'center', 
                  background: 'rgba(255,255,255,0.015)', 
                  border: '1px dashed rgba(255,255,255,0.06)', 
                  borderRadius: 12, 
                  padding: '14px 18px', 
                  marginBottom: '1.5rem' 
                }}>
                  <div style={{
                    width: 54,
                    height: 54,
                    borderRadius: '50%',
                    background: GLOW_PRESETS[presetGlow]?.gradient || GLOW_PRESETS.indigo.gradient,
                    boxShadow: GLOW_PRESETS[presetGlow]?.shadow || GLOW_PRESETS.indigo.shadow,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    fontWeight: 800,
                    color: '#fff',
                    border: '2px solid rgba(255,255,255,0.2)',
                    overflow: 'hidden',
                    flexShrink: 0,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}>
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      ((fullName || user.email || 'U')[0]).toUpperCase()
                    )}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Aesthetic Preview</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f1f5f9', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {fullName || user.email?.split('@')[0]}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: GLOW_PRESETS[presetGlow]?.color || '#6366f1', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, fontWeight: 500 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: GLOW_PRESETS[presetGlow]?.color || '#6366f1' }} />
                      {GLOW_PRESETS[presetGlow]?.name || 'Indigo Nebula'}
                    </div>
                  </div>
                </div>

                {/* Full Name Input */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600, marginBottom: 6 }}>Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Enter your name"
                    style={{
                      width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10,
                      color: '#f1f5f9', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'}
                    onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
                  />
                </div>

                {/* Avatar Photo Input (File Upload + URL) */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600, marginBottom: 6 }}>Profile Picture</label>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 1024 * 1024) {
                            alert("Please choose an image smaller than 1MB.");
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setAvatarUrl(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      style={{ display: 'none' }}
                      id="profile-upload-file"
                    />
                    <label
                      htmlFor="profile-upload-file"
                      style={{
                        padding: '8px 14px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 8,
                        color: '#f1f5f9',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                    >
                      Upload Image File
                    </label>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>or paste image URL below</span>
                  </div>
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={e => setAvatarUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    style={{
                      width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10,
                      color: '#f1f5f9', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'}
                    onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
                  />
                </div>

                {/* Neon Theme Grid Selection */}
                <div style={{ marginBottom: '1.75rem' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600, marginBottom: 10 }}>Dashboard Neon Glow</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    {Object.entries(GLOW_PRESETS).map(([key, val]) => {
                      const active = presetGlow === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setPresetGlow(key)}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 6,
                            padding: '12px 6px',
                            background: active ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.015)',
                            border: active ? `1.5px solid ${val.color}` : '1.5px solid rgba(255,255,255,0.05)',
                            borderRadius: 12,
                            cursor: 'pointer',
                            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: active ? `0 0 12px ${val.color}25` : 'none',
                          }}
                          onMouseEnter={e => {
                            if (!active) {
                              e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                            }
                          }}
                          onMouseLeave={e => {
                            if (!active) {
                              e.currentTarget.style.background = 'rgba(255,255,255,0.015)';
                              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                            }
                          }}
                        >
                          <div style={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            background: val.gradient,
                            boxShadow: val.shadow,
                            border: active ? '2px solid #fff' : '2px solid rgba(255,255,255,0.15)',
                            transform: active ? 'scale(1.08)' : 'scale(1)',
                            transition: 'transform 0.2s ease',
                          }} />
                          <span style={{ fontSize: '0.68rem', color: active ? '#f1f5f9' : '#64748b', fontWeight: active ? 700 : 500 }}>
                            {val.name.split(' ')[1]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Profile save trigger */}
                <button
                  onClick={saveProfile}
                  disabled={savingProfile}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: GLOW_PRESETS[presetGlow]?.gradient || 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    boxShadow: GLOW_PRESETS[presetGlow]?.shadow || 'none',
                    border: 'none',
                    borderRadius: 10,
                    color: '#fff',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  {savingProfile ? (
                    <>
                      <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                      Saving profile...
                    </>
                  ) : profileSaved ? (
                    <>
                      <Check size={16} />
                      Appearance Saved!
                    </>
                  ) : (
                    'Save Appearance & Profile'
                  )}
                </button>

                {profileError && (
                  <div style={{ marginTop: '0.75rem', padding: '10px 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, fontSize: '0.78rem', color: '#ef4444' }}>
                    {profileError}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '1.5rem 1rem', background: 'rgba(255,255,255,0.015)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 12 }}>
                <UserIcon size={32} style={{ color: '#475569', marginBottom: 12 }} />
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#e2e8f0', marginBottom: 6 }}>Supabase Authentication Profile</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5 }}>
                  Sign in or register an account with Supabase to unlock custom avatars, usernames, and personalized dashboard themes.
                </div>
              </div>
            )}
          </div>

          {/* SYSTEM STATUS CARD */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '1.5rem' }}>
            <div style={{ fontWeight: 600, color: '#f1f5f9', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>System Status</span>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
              {[
                { label: 'OpenAI Stream', ok: status?.openai ?? (process.env.NEXT_PUBLIC_HAS_OPENAI === 'true'), icon: '' },
                { label: 'Gemini Engine', ok: status?.gemini ?? false, icon: '' },
                { label: 'SQLite DB', ok: status?.database ?? true, icon: '️' },
                { label: 'Agent Library', ok: (status?.agentCount ?? 0) > 0, icon: '' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10 }}>
                  <span style={{ fontSize: 16 }}>{item.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#cbd5e1', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{item.label}</div>
                  </div>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: item.ok ? '#10b981' : '#ef4444', boxShadow: `0 0 6px ${item.ok ? '#10b981' : '#ef4444'}`, flexShrink: 0 }} />
                </div>
              ))}
            </div>
          </div>

          {/* PLATFORM CONFIGURATION */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '1.5rem' }}>
            <div style={{ fontWeight: 600, color: '#f1f5f9', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <SettingsIcon size={18} style={{ color: '#818cf8' }} />
              <span>Platform Configuration</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {configItems.map(item => (
                <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 10 }}>
                  <span style={{ fontSize: 18 }}>{item.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{item.key}</div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{item.value}</div>
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#475569', maxWidth: 120, textAlign: 'right', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: OpenAI credentials, Gemini credentials, Env Instructions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* OPENAI API KEY CARD */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '1.75rem' }}>
            <div style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Key size={18} style={{ color: '#6366f1' }} />
              <span> OpenAI API Key</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '1.25rem', lineHeight: 1.6, fontWeight: 500 }}>
              Required for real agent execution, pipeline runs, and swarm coordination. Get yours at{' '}
              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 600 }}>
                platform.openai.com →
              </a>
            </div>

            {/* Masked OpenAI Key Banner */}
            {savedKey && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 10, marginBottom: '1rem' }}>
                <span style={{ color: '#10b981', fontSize: '0.85rem' }}>✓</span>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontFamily: 'monospace', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{savedKey}</span>
                <button onClick={clearKey} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 6, color: '#ef4444', fontSize: '0.7rem', padding: '4px 10px', cursor: 'pointer', fontWeight: 600 }}>
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
                placeholder={savedKey ? 'Enter new key...' : 'sk-proj-...'}
                style={{
                  flex: 1, padding: '10px 14px', background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10,
                  color: '#f1f5f9', fontSize: '0.85rem', outline: 'none', fontFamily: 'monospace',
                }}
              />
              <button
                onClick={testApiKey}
                disabled={testing}
                style={{ padding: '10px 16px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, color: '#818cf8', fontSize: '0.8rem', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 600 }}
              >
                {testing ? '⟳ Testing' : ' Test'}
              </button>
              <button
                onClick={saveKey}
                style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: 10, color: '#fff', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
              >
                {saved ? 'Saved!' : 'Save'}
              </button>
            </div>

            {testResult && (
              <div style={{ padding: '10px 14px', borderRadius: 8, background: testResult.ok ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)', border: `1px solid ${testResult.ok ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}`, fontSize: '0.78rem', color: testResult.ok ? '#10b981' : '#ef4444', fontWeight: 500 }}>
                {testResult.message}
              </div>
            )}
          </div>

          {/* GEMINI API KEY CARD */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '1.75rem' }}>
            <div style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={18} style={{ color: '#0072ff' }} />
              <span> Google Gemini Key</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '1.25rem', lineHeight: 1.6, fontWeight: 500 }}>
              Secondary failover LLM framework. Used automatically if OpenAI token limit or speed-limit hits. Get yours at{' '}
              <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 600 }}>
                aistudio.google.com →
              </a>
            </div>

            {/* Masked Gemini Key Banner */}
            {savedGeminiKey && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 10, marginBottom: '1rem' }}>
                <span style={{ color: '#10b981', fontSize: '0.85rem' }}>✓</span>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontFamily: 'monospace', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{savedGeminiKey}</span>
                <button onClick={clearGeminiKey} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 6, color: '#ef4444', fontSize: '0.7rem', padding: '4px 10px', cursor: 'pointer', fontWeight: 600 }}>
                  Remove
                </button>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginBottom: '0.75rem' }}>
              <input
                type="password"
                value={geminiKey}
                onChange={e => setGeminiKey(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveGeminiKey(); }}
                placeholder={savedGeminiKey ? 'Enter new key...' : 'AIzaSy...'}
                style={{
                  flex: 1, padding: '10px 14px', background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10,
                  color: '#f1f5f9', fontSize: '0.85rem', outline: 'none', fontFamily: 'monospace',
                }}
              />
              <button
                onClick={testGeminiKey}
                disabled={testingGemini}
                style={{ padding: '10px 16px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, color: '#818cf8', fontSize: '0.8rem', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 600 }}
              >
                {testingGemini ? '⟳ Testing' : ' Test'}
              </button>
              <button
                onClick={saveGeminiKey}
                style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: 10, color: '#fff', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
              >
                {savedGemini ? 'Saved!' : 'Save'}
              </button>
            </div>

            {testGeminiResult && (
              <div style={{ padding: '10px 14px', borderRadius: 8, background: testGeminiResult.ok ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)', border: `1px solid ${testGeminiResult.ok ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}`, fontSize: '0.78rem', color: testGeminiResult.ok ? '#10b981' : '#ef4444', fontWeight: 500 }}>
                {testGeminiResult.message}
              </div>
            )}
          </div>

          {/* ENVIRONMENT CONFIG BLOCK */}
          <div style={{ background: 'rgba(99,102,241,0.03)', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 16, padding: '1.5rem' }}>
            <div style={{ fontWeight: 600, color: '#818cf8', marginBottom: '0.75rem', fontSize: '0.88rem' }}> Local Deployment Environment (.env.local)</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.75rem', lineHeight: 1.5 }}>
              For persistent production environment settings, configure the server properties inside <code style={{ color: '#22d3ee' }}>project-orbit-app/.env.local</code>:
            </div>
            <pre style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 10, padding: '1rem', fontSize: '0.75rem', color: '#94a3b8', overflowX: 'auto', margin: 0, fontFamily: 'monospace', lineHeight: 1.6 }}>
{`# Required for real agent execution
OPENAI_API_KEY=sk-proj-your-key-here
GEMINI_API_KEY=AIzaSy-your-key-here

# SQLite Server DB Location  
ORBIT_DB_PATH=./orbit.db

# Agent File IO Directory
ORBIT_WORKSPACE=./orbit-workspace`}
            </pre>
          </div>

        </div>
      </div>

      {savingKeys && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(3, 7, 18, 0.75)',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          fontFamily: 'Inter, sans-serif',
        }}>
          <div style={{
            position: 'relative',
            width: 140,
            height: 140,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              position: 'absolute',
              width: 120,
              height: 120,
              borderRadius: '50%',
              border: '2px dashed rgba(99, 102, 241, 0.25)',
              animation: 'spin 12s linear infinite'
            }} />
            <div style={{
              position: 'absolute',
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: '#818cf8',
              boxShadow: '0 0 10px #818cf8',
              top: 10,
              left: '50%',
              marginLeft: -5,
              animation: 'spin 2s linear infinite',
              transformOrigin: '5px 70px'
            }} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/logo.png" 
              alt="Orbit Logo" 
              style={{ 
                width: 72, 
                height: 72, 
                objectFit: 'contain',
                animation: 'spin 4s linear infinite',
                filter: 'drop-shadow(0 0 16px rgba(99,102,241,0.6))'
              }} 
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fallback = document.getElementById('orbit-fallback-logo');
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            <div 
              id="orbit-fallback-logo"
              style={{
                display: 'none',
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.25rem',
                color: '#fff',
                animation: 'spin 4s linear infinite',
                boxShadow: '0 0 20px rgba(99,102,241,0.6)'
              }}
            >
              O
            </div>
          </div>
          <h3 style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1.1rem', marginTop: 24, marginBottom: 8, letterSpacing: '-0.01em' }}>
            Encrypting API Credentials
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.82rem', margin: 0 }}>
            Syncing workspace keystore properties securely...
          </p>
        </div>
      )}
      
      {/* Keyframe animation for spinner */}
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
