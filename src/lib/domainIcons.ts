// Orbit — Domain SVG Icons (no emojis — production SVGs per domain)
export const DOMAIN_SVGS: Record<string, { color: string; path: string }> = {
  engineering:            { color: '#22d3ee', path: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' },
  marketing:              { color: '#f97316', path: 'M22 12h-4l-3 9L9 3l-3 9H2' },
  finance:                { color: '#10b981', path: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' },
  design:                 { color: '#a855f7', path: 'M12 2a10 10 0 1 0 10 10M12 2v10l4.5 4.5' },
  product:                { color: '#3b82f6', path: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z' },
  sales:                  { color: '#eab308', path: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' },
  support:                { color: '#06b6d4', path: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' },
  strategy:               { color: '#8b5cf6', path: 'M18 20V10M12 20V4M6 20v-6' },
  academic:               { color: '#64748b', path: 'M22 10v6M2 10l10-5 10 5-10 5z M6 12v5c3 3 9 3 12 0v-5' },
  testing:                { color: '#ec4899', path: 'M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v11m0 0H5m4 0h6m0-3v3h4a2 2 0 0 0 2-2v-3M3 9h18' },
  'game-development':     { color: '#f43f5e', path: 'M6 12h4m2 0h4M8 10v4M14 10v4M21 9V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2' },
  integrations:           { color: '#14b8a6', path: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71' },
  'paid-media':           { color: '#fb923c', path: 'M11 5.882V19.24a1.76 1.76 0 0 1-3.417.592l-2.147-6.15M18 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 0v.5M5.5 13H18' },
  'project-management':   { color: '#38bdf8', path: 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11' },
  specialized:            { color: '#a3e635', path: 'M9.663 17h4.673M12 3v1m6.364 1.636-.707.707M21 12h-1M17.657 17.657l-.707-.707M12 21v-1m-4.95-2.343-.707.707M3 12H2m4.343-5.657-.707-.707M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z' },
  'spatial-computing':    { color: '#c084fc', path: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z' },
  data:                   { color: '#34d399', path: 'M4 7h16M4 12h16M4 17h16' },
  legal:                  { color: '#94a3b8', path: 'M3 6l9-4 9 4v6c0 5.25-3.75 9.75-9 11C6.75 21.75 3 17.25 3 12V6z' },
  devops:                 { color: '#22c55e', path: 'M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83' },
  hr:                     { color: '#f472b6', path: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6z' },
};

export function getDomainIcon(category: string): { color: string; path: string } {
  return DOMAIN_SVGS[category] ?? DOMAIN_SVGS['engineering'];
}
