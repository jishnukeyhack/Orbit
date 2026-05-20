// ============================================
// Orbit — Cognitive Memory Engine
// Ported from OpenSwarm src/memory/memoryCore.ts
// Uses in-memory store with simple cosine similarity
// ============================================

import type {
  MemoryType, CognitiveMemoryType, StabilityLevel,
  CognitiveMemoryRecord, MemorySearchResult, SearchOptions,
} from './types';

// ============================================
// Constants
// ============================================

export const PERMANENT_EXPIRY = new Date('9999-12-31T23:59:59Z').getTime();

export const BASE_IMPORTANCE: Record<CognitiveMemoryType, number> = {
  constraint: 0.9,
  user_model: 0.85,
  strategy: 0.8,
  belief: 0.7,
  system_pattern: 0.75,
};

const LEGACY_IMPORTANCE: Record<string, number> = {
  decision: 0.8, fact: 0.85, repomap: 0.6, journal: 0.4,
};

// ============================================
// In-memory store
// ============================================

const memoryStore: CognitiveMemoryRecord[] = [];

// Seed with useful initial memories
const SEED_MEMORIES: Omit<CognitiveMemoryRecord, 'id'>[] = [
  {
    type: 'system_pattern', content: 'Use Worker→Reviewer→Tester pipeline for all code changes',
    importance: 0.9, confidence: 0.95, createdAt: Date.now() - 86400000 * 7,
    lastUpdated: Date.now() - 86400000, lastAccessed: Date.now() - 3600000,
    revisionCount: 2, decay: 0, stability: 'high',
    contradicts: '[]', supports: '[]', derivedFrom: 'system_init',
    repo: 'orbit', title: 'Pipeline pattern', metadata: '{}', trust: 0.95, expiresAt: PERMANENT_EXPIRY,
  },
  {
    type: 'constraint', content: 'NEVER skip security review for public API endpoints',
    importance: 0.95, confidence: 0.99, createdAt: Date.now() - 86400000 * 14,
    lastUpdated: Date.now() - 86400000 * 3, lastAccessed: Date.now() - 86400000,
    revisionCount: 0, decay: 0, stability: 'high',
    contradicts: '[]', supports: '[]', derivedFrom: 'security_audit',
    repo: 'orbit', title: 'Security constraint', metadata: '{}', trust: 0.99, expiresAt: PERMANENT_EXPIRY,
  },
  {
    type: 'strategy', content: 'Prefer TypeScript strict mode for all new files in the orbit project',
    importance: 0.8, confidence: 0.85, createdAt: Date.now() - 86400000 * 5,
    lastUpdated: Date.now() - 86400000 * 2, lastAccessed: Date.now() - 3600000 * 2,
    revisionCount: 1, decay: 0, stability: 'medium',
    contradicts: '[]', supports: '[]', derivedFrom: 'architecture_review',
    repo: 'orbit', title: 'TypeScript strategy', metadata: '{}', trust: 0.85, expiresAt: PERMANENT_EXPIRY,
  },
  {
    type: 'belief', content: 'PostgreSQL with pgvector is the best choice for vector similarity search at our scale',
    importance: 0.7, confidence: 0.75, createdAt: Date.now() - 86400000 * 3,
    lastUpdated: Date.now() - 86400000, lastAccessed: Date.now() - 3600000 * 5,
    revisionCount: 1, decay: 0.1, stability: 'medium',
    contradicts: '[]', supports: '[]', derivedFrom: 'performance_testing',
    repo: 'orbit', title: 'Database belief', metadata: '{}', trust: 0.75, expiresAt: PERMANENT_EXPIRY,
  },
  {
    type: 'user_model', content: 'User prefers concise responses with code examples over long explanations',
    importance: 0.85, confidence: 0.8, createdAt: Date.now() - 86400000 * 10,
    lastUpdated: Date.now() - 86400000 * 2, lastAccessed: Date.now() - 3600000,
    revisionCount: 3, decay: 0, stability: 'high',
    contradicts: '[]', supports: '[]', derivedFrom: 'user_feedback',
    repo: 'orbit', title: 'User preference', metadata: '{}', trust: 0.8, expiresAt: PERMANENT_EXPIRY,
  },
];

SEED_MEMORIES.forEach((m, i) => {
  memoryStore.push({ ...m, id: `seed-${m.type}-${i}` });
});

// ============================================
// Distillation Engine
// ============================================

const REJECTION_PATTERNS = [
  /^(test|testing|hello|hi|ok|okay|yes|no|thanks)/i,
  /^(asdf|qwer|abc|123)/i,
];

const EXTRACTION_PATTERNS: { pattern: RegExp; type: CognitiveMemoryType; baseImportance: number }[] = [
  { pattern: /(MUST|NEVER|ALWAYS|NEVER|absolutely|prohibited|required|mandatory)/i, type: 'constraint', baseImportance: 0.9 },
  { pattern: /(constraint|limitation|restriction|blocked)/i, type: 'constraint', baseImportance: 0.85 },
  { pattern: /(prefer|preference|style|habit|always use|never use)/i, type: 'user_model', baseImportance: 0.85 },
  { pattern: /(strategy|pattern|approach|methodology|best practice)/i, type: 'strategy', baseImportance: 0.8 },
  { pattern: /(architecture|design|structure|system|principle|convention)/i, type: 'system_pattern', baseImportance: 0.75 },
  { pattern: /(verified|proven|tested|confirmed|discovered|learned|found that)/i, type: 'belief', baseImportance: 0.7 },
];

interface DistillationResult {
  shouldStore: boolean;
  type: CognitiveMemoryType;
  importance: number;
  confidence: number;
  reason: string;
}

export function distillContent(content: string, context?: {
  isRepeated?: boolean;
  isVerified?: boolean;
}): DistillationResult {
  const normalized = content.trim().toLowerCase();

  for (const pattern of REJECTION_PATTERNS) {
    if (pattern.test(normalized)) {
      return { shouldStore: false, type: 'belief', importance: 0, confidence: 0, reason: 'Noise pattern' };
    }
  }

  if (content.length < 20) {
    return { shouldStore: false, type: 'belief', importance: 0, confidence: 0, reason: 'Too short' };
  }

  for (const { pattern, type, baseImportance } of EXTRACTION_PATTERNS) {
    if (pattern.test(content)) {
      let importance = baseImportance;
      let confidence = 0.7;
      if (context?.isRepeated) { importance = Math.min(1, importance + 0.1); confidence = Math.min(1, confidence + 0.1); }
      if (context?.isVerified) { confidence = Math.min(1, confidence + 0.15); }
      return { shouldStore: true, type, importance, confidence, reason: `Matches ${type} pattern` };
    }
  }

  if (content.length > 100) {
    return { shouldStore: true, type: 'belief', importance: 0.5, confidence: 0.5, reason: 'Default: significant content' };
  }

  return { shouldStore: false, type: 'belief', importance: 0, confidence: 0, reason: 'Does not meet criteria' };
}

// ============================================
// Importance & Stability
// ============================================

export function calculateImportance(type: MemoryType, options?: {
  isRepeated?: boolean; isVerified?: boolean; age?: number; hasContradiction?: boolean;
}): number {
  let importance = BASE_IMPORTANCE[type as CognitiveMemoryType] ?? LEGACY_IMPORTANCE[type] ?? 0.5;
  if (options?.isRepeated) importance = Math.min(1, importance + 0.1);
  if (options?.isVerified) importance = Math.min(1, importance + 0.1);
  if (options?.age && options.age > 30 * 24 * 60 * 60 * 1000) importance = Math.max(0.3, importance - 0.1);
  if (options?.hasContradiction) importance = Math.max(0.2, importance - 0.2);
  return importance;
}

export function calculateStability(revisionCount: number, age: number): StabilityLevel {
  const ageInDays = age / (24 * 60 * 60 * 1000);
  if (ageInDays > 7 && revisionCount === 0) return 'high';
  if (ageInDays < 1 || revisionCount > 3) return 'low';
  return 'medium';
}

export function calculateFreshness(createdAt: number, halfLifeDays = 7): number {
  const ageMs = Date.now() - createdAt;
  const halfLifeMs = halfLifeDays * 24 * 60 * 60 * 1000;
  return Math.exp(-ageMs / halfLifeMs);
}

// ============================================
// Simple text similarity (no external ML)
// ============================================

function tokenize(text: string): Set<string> {
  return new Set(text.toLowerCase().split(/\W+/).filter(t => t.length > 2));
}

function jaccardSimilarity(a: string, b: string): number {
  const ta = tokenize(a);
  const tb = tokenize(b);
  const intersection = new Set([...ta].filter(x => tb.has(x)));
  const union = new Set([...ta, ...tb]);
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

// ============================================
// Save Memory
// ============================================

export function saveMemory(
  type: MemoryType,
  repo: string,
  title: string,
  content: string,
  options?: {
    metadata?: Record<string, unknown>;
    trust?: number;
    ttlDays?: number;
    importance?: number;
    confidence?: number;
    skipDistillation?: boolean;
    isRepeated?: boolean;
    isVerified?: boolean;
    derivedFrom?: string;
  }
): string | null {
  if (!options?.skipDistillation) {
    const distillation = distillContent(content, {
      isRepeated: options?.isRepeated,
      isVerified: options?.isVerified,
    });
    if (!distillation.shouldStore) {
      console.log(`[Memory] Rejected: ${distillation.reason}`);
      return null;
    }
  }

  const now = Date.now();
  const id = `${type}-${repo}-${now}-${Math.random().toString(36).slice(2, 6)}`;

  let expiresAt = PERMANENT_EXPIRY;
  if (type === 'journal') expiresAt = now + (options?.ttlDays ?? 14) * 86400000;
  else if (type === 'repomap') expiresAt = now + (options?.ttlDays ?? 30) * 86400000;

  const importance = options?.importance ?? calculateImportance(type, {
    isRepeated: options?.isRepeated,
    isVerified: options?.isVerified,
  });

  const record: CognitiveMemoryRecord = {
    id, type, content,
    importance, confidence: options?.confidence ?? 0.7,
    createdAt: now, lastUpdated: now, lastAccessed: now,
    revisionCount: 0, decay: 0, stability: 'low',
    contradicts: '[]', supports: '[]',
    derivedFrom: options?.derivedFrom || 'unknown',
    repo, title,
    metadata: JSON.stringify(options?.metadata || {}),
    trust: options?.trust ?? 0.8,
    expiresAt,
  };

  memoryStore.push(record);
  return id;
}

export function saveCognitiveMemory(
  type: CognitiveMemoryType,
  content: string,
  options?: {
    importance?: number; confidence?: number; derivedFrom?: string;
    supports?: string[]; contradicts?: string[];
  }
): string | null {
  return saveMemory(type, 'cognitive', content.slice(0, 100), content, {
    importance: options?.importance,
    confidence: options?.confidence,
    derivedFrom: options?.derivedFrom,
    skipDistillation: true,
  });
}

// ============================================
// Search Memory
// ============================================

function hybridScore(similarity: number, importance: number, recency: number, frequency: number): number {
  return 0.55 * similarity + 0.20 * importance + 0.15 * recency + 0.10 * Math.min(1, frequency / 10);
}

export function searchMemory(query: string, options: SearchOptions = {}): MemorySearchResult[] {
  const {
    types, repo, minSimilarity = 0.05, minTrust = 0.3, limit = 10,
  } = options;

  const now = Date.now();
  const results: MemorySearchResult[] = [];

  for (const record of memoryStore) {
    if (record.expiresAt < now) continue;
    if (types && !types.includes(record.type)) continue;
    if (repo && record.repo !== repo) continue;
    if (record.trust < minTrust) continue;

    const similarity = jaccardSimilarity(query, `${record.title} ${record.content}`);
    if (similarity < minSimilarity) continue;

    const freshness = calculateFreshness(record.createdAt);
    const score = hybridScore(similarity, record.importance, freshness, record.revisionCount);

    results.push({
      id: record.id, type: record.type, repo: record.repo, title: record.title,
      content: record.content, metadata: JSON.parse(record.metadata),
      trust: record.trust, createdAt: record.createdAt, score, freshness,
      importance: record.importance, confidence: record.confidence,
      stability: record.stability, revisionCount: record.revisionCount,
      decay: record.decay, similarityScore: similarity,
    });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

export function listMemories(options: SearchOptions = {}): MemorySearchResult[] {
  const { types, repo, limit = 50 } = options;
  const now = Date.now();

  return memoryStore
    .filter(r => {
      if (r.expiresAt < now) return false;
      if (types && !types.includes(r.type)) return false;
      if (repo && r.repo !== repo) return false;
      return true;
    })
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit)
    .map(record => ({
      id: record.id, type: record.type, repo: record.repo, title: record.title,
      content: record.content, metadata: JSON.parse(record.metadata),
      trust: record.trust, createdAt: record.createdAt,
      score: record.importance, freshness: calculateFreshness(record.createdAt),
      importance: record.importance, confidence: record.confidence,
      stability: record.stability, revisionCount: record.revisionCount,
      decay: record.decay, similarityScore: 1,
    }));
}

export function getMemoryById(id: string): CognitiveMemoryRecord | null {
  return memoryStore.find(r => r.id === id) ?? null;
}

export function getMemoryStats() {
  const now = Date.now();
  const active = memoryStore.filter(r => r.expiresAt > now);
  const byType: Record<string, number> = {};
  for (const r of active) {
    byType[r.type] = (byType[r.type] ?? 0) + 1;
  }
  return {
    total: active.length,
    byType,
    avgImportance: active.reduce((s, r) => s + r.importance, 0) / (active.length || 1),
    avgConfidence: active.reduce((s, r) => s + r.confidence, 0) / (active.length || 1),
  };
}
