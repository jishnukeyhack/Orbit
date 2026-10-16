// ============================================
// Orbit — Agent Action Layer: policy
// Decides, OUTSIDE the model, whether a call may run, needs approval,
// or is denied outright. Three modes so you can start where Orbit is
// today ('permissive' ≈ current behaviour, but audited) and tighten.
// ============================================
import path from 'path';
import type { RiskLevel, ToolDefinition } from './types';

export type PolicyMode = 'permissive' | 'balanced' | 'strict';

export interface PolicyDecision {
  allowed: boolean;
  needsApproval: boolean;
  reason?: string;
}

const APPROVAL_MATRIX: Record<PolicyMode, Record<RiskLevel, boolean>> = {
  //                     read    write   execute  destructive
  permissive: { read: false, write: false, execute: false, destructive: false },
  balanced:   { read: false, write: false, execute: true,  destructive: true },
  strict:     { read: false, write: true,  execute: true,  destructive: true },
};

export class Policy {
  constructor(
    readonly mode: PolicyMode = 'balanced',
    /** Tools denied in every mode, no approval can override. */
    readonly denyList: string[] = [],
  ) {}

  decide(tool: ToolDefinition): PolicyDecision {
    if (this.denyList.includes(tool.name)) {
      return { allowed: false, needsApproval: false, reason: `${tool.name} is on the deny list` };
    }
    const needsApproval =
      tool.requiresApproval ?? APPROVAL_MATRIX[this.mode][tool.risk];
    return { allowed: true, needsApproval };
  }
}

// ---------- shell safety: Orbit's tools.ts has a small regex blocklist.
// ---------- Keep it, but treat it as defence-in-depth only — the real
// ---------- controls are: approval for 'execute', an env scrub (below),
// ---------- and running in the run's workspace, not $HOME / project root.

const BLOCKED_SHELL_PATTERNS: RegExp[] = [
  /\brm\s+-[a-z]*r[a-z]*f?\s+\/(?:\s|$)/i,        // rm -rf /
  /\brm\s+-[a-z]*f[a-z]*r?\s+\/(?:\s|$)/i,        // rm -fr /
  /\bgit\s+reset\s+--hard\b/i,
  /\bgit\s+push\s+.*--force\b/i,
  /\bdrop\s+database\b/i,
  /\btruncate\s+table\b/i,
  /\bmkfs\b/i,
  /\bdd\s+.*of=\/dev\//i,
  /:\(\)\s*\{\s*:\|:&\s*\}\s*;/,                    // fork bomb
  /\bshutdown\b|\breboot\b/i,
  /\b(curl|wget)\b[^|]*\|\s*(sh|bash)\b/i,         // pipe remote code into a shell
];

export function shellCommandBlocked(command: string): string | null {
  const hit = BLOCKED_SHELL_PATTERNS.find((p) => p.test(command));
  return hit ? `Blocked by shell policy: ${hit.source}` : null;
}

/** Environment for child processes: inherit the boring stuff, strip every
 *  secret. Orbit's current bash tool spreads the full process.env — which
 *  includes OPENAI_API_KEY / GEMINI_API_KEY / ANTHROPIC_API_KEY — into any
 *  command the model writes (e.g. `env`, `printenv`, exfiltration). */
export function scrubbedEnv(extra: Record<string, string> = {}): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (v === undefined) continue;
    if (/KEY|TOKEN|SECRET|PASSWORD|AUTHORIZATION|COOKIE/i.test(k)) continue;
    out[k] = v;
  }
  return { ...out, ...extra };
}

/** Resolve `target` inside `cwd`; throw if it escapes. Use for every
 *  file tool — one implementation instead of a copy per tool. */
export function sandboxPath(cwd: string, target: string): string {
  const root = path.resolve(cwd);
  const resolved = path.resolve(root, target);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    throw new Error(`Path escapes the run workspace: ${target}`);
  }
  return resolved;
}

/** SSRF guard for the web_fetch tool: no loopback / private / link-local. */
export function isPublicHttpUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
  const host = url.hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) return false;
  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
    if (a === 10 || a === 127 || a === 0) return false;
    if (a === 172 && b >= 16 && b <= 31) return false;
    if (a === 192 && b === 168) return false;
    if (a === 169 && b === 254) return false; // cloud metadata endpoints live here
  }
  if (host === '::1' || host.startsWith('fe80:') || host.startsWith('fc') || host.startsWith('fd')) return false;
  return true;
}
