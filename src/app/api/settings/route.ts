// ============================================
// Orbit — Settings API Route
// Persists API keys + config in SQLite
// GET /api/settings → returns all settings (keys masked)
// POST /api/settings → saves key/value pairs
// ============================================
import { NextRequest } from 'next/server';
import { getSetting, setSetting, getAllSettings } from '@/lib/server/db';
import { hasRealLLM, getActiveModel } from '@/lib/server/llm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SENSITIVE_KEYS = ['openai_api_key', 'gemini_api_key', 'anthropic_api_key'];

function maskKey(value: string): string {
  if (!value || value.length < 8) return value;
  return value.slice(0, 6) + '...' + value.slice(-4);
}

export async function GET() {
  const all = getAllSettings();
  // Mask sensitive keys before returning
  const masked: Record<string, string> = {};
  for (const [k, v] of Object.entries(all)) {
    masked[k] = SENSITIVE_KEYS.includes(k) ? maskKey(v) : v;
  }
  return Response.json({
    settings: masked,
    hasOpenAI: Boolean(getSetting('openai_api_key')),
    hasGemini: Boolean(getSetting('gemini_api_key')),
    hasAnthropic: Boolean(getSetting('anthropic_api_key')),
    hasRealLLM: hasRealLLM(),
    activeModel: getActiveModel(),
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json() as Record<string, string>;
  const saved: string[] = [];

  const allowedKeys = [
    'openai_api_key', 'gemini_api_key', 'anthropic_api_key',
    'theme', 'workspace_path', 'default_model', 'max_iterations',
  ];

  for (const [key, value] of Object.entries(body)) {
    if (!allowedKeys.includes(key)) continue;
    if (typeof value !== 'string') continue;
    
    // For API keys, also set in process.env for immediate use this session
    if (key === 'openai_api_key' && value.trim()) {
      process.env.OPENAI_API_KEY = value.trim();
    } else if (key === 'gemini_api_key' && value.trim()) {
      process.env.GEMINI_API_KEY = value.trim();
    } else if (key === 'anthropic_api_key' && value.trim()) {
      process.env.ANTHROPIC_API_KEY = value.trim();
    }
    
    setSetting(key, value.trim());
    saved.push(key);
  }

  return Response.json({
    saved,
    hasRealLLM: hasRealLLM(),
    activeModel: getActiveModel(),
    message: saved.length > 0 ? `Saved: ${saved.join(', ')}` : 'No valid keys provided',
  });
}

export async function DELETE(request: NextRequest) {
  const { key } = await request.json() as { key: string };
  if (key === 'openai_api_key') process.env.OPENAI_API_KEY = '';
  if (key === 'gemini_api_key') process.env.GEMINI_API_KEY = '';
  if (key === 'anthropic_api_key') process.env.ANTHROPIC_API_KEY = '';
  setSetting(key, '');
  return Response.json({ cleared: key });
}
