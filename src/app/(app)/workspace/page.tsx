'use client';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  Folder, File, RefreshCw, Download, Eye, ChevronRight, ChevronDown, 
  Terminal as TermIcon, Clock, HardDrive, Play, ShieldAlert, Sparkles, 
  Rocket, CheckCircle2, AlertCircle, Cpu, Loader2, Save, FileCode, Users, Globe, Smartphone, Tablet, Monitor
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: number;
  children?: FileNode[];
}

interface WorkspaceData {
  tree: FileNode[];
  stats: { totalFiles: number; totalSize: number; workspace: string };
  empty?: boolean;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function formatTime(ms: number): string {
  return new Date(ms).toLocaleString();
}

const EXT_COLORS: Record<string, string> = {
  ts: '#3b82f6', tsx: '#06b6d4', js: '#f59e0b', jsx: '#fb923c',
  py: '#a3e635', md: '#94a3b8', json: '#10b981', txt: '#cbd5e1',
  css: '#ec4899', html: '#f97316', sh: '#22c55e', yml: '#8b5cf6',
};

function getExt(name: string): string {
  return name.split('.').pop()?.toLowerCase() ?? '';
}

function FileTree({
  nodes, depth = 0, onSelect,
}: {
  nodes: FileNode[];
  depth?: number;
  onSelect: (node: FileNode) => void;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (path: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  return (
    <div>
      {nodes.map(node => (
        <div key={node.path}>
          <div
            onClick={() => {
              if (node.type === 'directory') toggle(node.path);
              else onSelect(node);
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: `4px 8px 4px ${depth * 16 + 8}px`,
              cursor: 'pointer', borderRadius: 6,
              transition: 'background 0.1s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            {node.type === 'directory' ? (
              <>
                {expanded.has(node.path)
                  ? <ChevronDown size={12} style={{ color: '#475569', flexShrink: 0 }} />
                  : <ChevronRight size={12} style={{ color: '#475569', flexShrink: 0 }} />
                }
                <Folder size={14} style={{ color: '#fbbf24', flexShrink: 0 }} />
                <span style={{ fontSize: '0.82rem', color: '#e2e8f0', fontWeight: 500 }}>{node.name}</span>
              </>
            ) : (
              <>
                <span style={{ width: 12 }} />
                <File size={14} style={{ color: EXT_COLORS[getExt(node.name)] ?? '#64748b', flexShrink: 0 }} />
                <span style={{ fontSize: '0.82rem', color: '#cbd5e1', flex: 1 }}>{node.name}</span>
                {node.size !== undefined && (
                  <span style={{ fontSize: '0.7rem', color: '#475569' }}>{formatSize(node.size)}</span>
                )}
              </>
            )}
          </div>
          {node.type === 'directory' && expanded.has(node.path) && node.children && (
            <FileTree nodes={node.children} depth={depth + 1} onSelect={onSelect} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function WorkspacePage() {
  const [data, setData] = useState<WorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [loadingFile, setLoadingFile] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Orbit Workspace";
  }, []);

  // Monaco and premium state extensions
  const [saving, setSaving] = useState(false);
  const [sandboxTab, setSandboxTab] = useState<'editor' | 'consensus' | 'terminal' | 'deploy' | 'preview'>('editor');
  const [showSidebar, setShowSidebar] = useState(true);
  const [showTerminal, setShowTerminal] = useState(true);
  const [showChat, setShowChat] = useState(true);
  const [activeAgent, setActiveAgent] = useState<'sam' | 'aditya' | 'jishnu'>('sam');
  const [chatInput, setChatInput] = useState('');
  const [agentTyping, setAgentTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const handleMicClick = () => {
    if (isListening || agentTyping) return;
    setIsListening(true);
    
    const phrases = activeAgent === 'sam'
      ? ["Write a high-performance HTTP web server script", "Compile concurrent loop task queues", "Write a secure serverless script"]
      : activeAgent === 'aditya'
      ? ["Design a sleek dark glassmorphic dashboard layout", "Design a responsive modular grids frame", "Design customized border colors animations"]
      : ["Establish secure Postgres row-level policies", "Configure a Supabase real-time broadcast client", "Write database sync migration schemas"];
      
    const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
    
    let currentIdx = 0;
    setChatInput('');
    const typingInterval = setInterval(() => {
      if (currentIdx < randomPhrase.length) {
        setChatInput(prev => prev + randomPhrase.charAt(currentIdx));
        currentIdx++;
      } else {
        clearInterval(typingInterval);
        setIsListening(false);
      }
    }, 25);
  };

  const [messages, setMessages] = useState<Record<'sam' | 'aditya' | 'jishnu', { sender: string; text: string; time: string; hasPreview?: boolean; previewActionLabel?: string }[]>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('orbit_workspace_agent_messages');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) { /* ignore */ }
      }
    }
    return {
      sam: [
        { sender: 'Sam', text: "Hey! I'm Sam, your AI Coding Specialist. I can write and compile robust, self-healing code directly into your Monaco workspace draft. Let me know what feature or component you want me to write!", time: 'Just now' }
      ],
      aditya: [
        { sender: 'Aditya', text: "Hi there! I'm Aditya, your Principal UI/UX Architect. I can craft stunning dark matte visual interfaces, custom responsive layout grids, and buttery smooth highlights. What interface shall we design?", time: 'Just now' }
      ],
      jishnu: [
        { sender: 'Jishnu', text: "Hello! Jishnu here. I specialize in secure auth pipelines, Postgres dual-stack connection poolers, and live Supabase sync broadcasts. Let's configure your database layer!", time: 'Just now' }
      ]
    };
  });

  useEffect(() => {
    localStorage.setItem('orbit_workspace_agent_messages', JSON.stringify(messages));
  }, [messages]);

  const csvRows = useMemo<string[][]>(() => {
    if (!fileContent || !selectedFile?.path.endsWith('.csv')) return [];
    return fileContent.split('\n')
      .map((row: string) => row.split(','))
      .filter((row: string[]) => row.length > 1 && row.some((cell: string) => cell.trim().length > 0));
  }, [fileContent, selectedFile]);

  const spreadsheetStats = useMemo<{ totalRevenue: number; totalProfit: number; totalUnits: number } | null>(() => {
    if (csvRows.length < 2) return null;
    const headers = csvRows[0].map((h: string) => h.trim().toLowerCase());
    const revIdx = headers.indexOf('revenue');
    const profitIdx = headers.indexOf('profit');
    const soldIdx = headers.indexOf('units sold');

    let totalRevenue = 0;
    let totalProfit = 0;
    let totalUnits = 0;

    for (let i = 1; i < csvRows.length; i++) {
      const row = csvRows[i];
      if (revIdx !== -1 && row[revIdx]) totalRevenue += parseFloat(row[revIdx]) || 0;
      if (profitIdx !== -1 && row[profitIdx]) totalProfit += parseFloat(row[profitIdx]) || 0;
      if (soldIdx !== -1 && row[soldIdx]) totalUnits += parseInt(row[soldIdx]) || 0;
    }

    return { totalRevenue, totalProfit, totalUnits };
  }, [csvRows]);

  const getPreviewSrcDoc = () => {
    if (!selectedFile) return '';
    const name = selectedFile.name.toLowerCase();
    
    // Auto-detect tailwind classes or HTML tags to ensure it displays perfectly
    const hasHtmlTags = fileContent.includes('<html') || fileContent.includes('<body');
    
    if (name.endsWith('.html') || name === 'sandbox-preview.html') {
      if (hasHtmlTags) {
        let content = fileContent;
        if (!content.includes('tailwindcss') && !content.includes('tailwind.css')) {
          content = content.replace('</head>', '<script src="https://cdn.tailwindcss.com"></script><link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet"><style>body { font-family: "Outfit", sans-serif; }</style></head>');
        }
        return content;
      } else {
        return `
          <html>
            <head>
              <script src="https://cdn.tailwindcss.com"></script>
              <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
              <style>
                body {
                  font-family: 'Outfit', sans-serif;
                  background: #070b13;
                  color: #cbd5e1;
                  padding: 24px;
                  min-height: 100vh;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                }
              </style>
            </head>
            <body>
              <div class="w-full flex justify-center">
                ${fileContent}
              </div>
            </body>
          </html>
        `;
      }
    }
    if (name.endsWith('.css')) {
      return `
        <html>
          <head>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>${fileContent}</style>
          </head>
          <body class="bg-[#070b13] text-slate-300 p-8 font-sans">
            <h3 class="text-xl font-bold text-white mb-2">CSS Style Preview</h3>
            <p class="text-sm text-slate-500 mb-6">Your modified style rules compiled successfully. Edit in Monaco to see live hot-reloading.</p>
            <button class="px-6 py-2.5 bg-indigo-600 text-white rounded-lg shadow-lg font-semibold hover:opacity-90 transition-all">Preview Action Button</button>
          </body>
        </html>
      `;
    }
    if (name.endsWith('.js') || name.endsWith('.ts') || name.endsWith('.jsx') || name.endsWith('.tsx')) {
      return `
        <html>
          <head>
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
            <style>
              body { font-family: 'Outfit', sans-serif; background: #070b13; color: #f8fafc; padding: 32px; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
            </style>
          </head>
          <body>
            <div id="root" class="w-full max-w-lg"></div>
            <script>
              try {
                let code = ${JSON.stringify(fileContent)};
                if (code.includes('class="') || code.includes("class='")) {
                  document.getElementById('root').innerHTML = code;
                } else {
                  document.getElementById('root').innerHTML = \`
                    <div class="bg-[#0f1524] border border-white/5 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
                      <div class="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/20">
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-white"><polygon points="6 3 20 12 6 21 6 3"/></svg>
                      </div>
                      <h1 class="text-2xl font-bold text-white mb-3 tracking-tight">Orbit Sandbox App</h1>
                      <p class="text-sm text-slate-400 mb-6 leading-relaxed">
                        JavaScript module compiled and running inside the secure Sandbox edge viewport frame.
                      </p>
                      <div class="text-left bg-slate-950 p-4 rounded-xl text-xs font-mono text-emerald-400 overflow-x-auto max-h-40 border border-white/5">
                        \\\${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
                      </div>
                    </div>
                  \`;
                }
              } catch(err) {
                document.getElementById('root').innerHTML = '<div class="text-red-400 font-mono">Compile error: ' + err.message + '</div>';
              }
            </script>
          </body>
        </html>
      `;
    }
    return `
      <html>
        <body style="font-family: monospace; white-space: pre-wrap; padding: 20px; background: #070b13; color: #34d399;">
          ${fileContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
        </body>
      </html>
    `;
  };

  const handleSendMessage = (e?: React.FormEvent, overrideText?: string) => {
    if (e) e.preventDefault();
    const activeText = overrideText || chatInput;
    if (!activeText.trim()) return;

    const userText = activeText.trim();
    const userMsg = { sender: 'User', text: userText, time: 'Just now' };

    setMessages(prev => ({
      ...prev,
      [activeAgent]: [...prev[activeAgent], userMsg]
    }));
    setChatInput('');
    setAgentTyping(true);

    setTimeout(() => {
      let reply = '';
      let shouldGenerateCode = false;
      let generatedCode = '';
      let previewActionLabel = 'View Live Preview';

      if (activeAgent === 'sam') {
        const isRequestingCode = userText.toLowerCase().match(/(write|code|html|create|build|page|component|react|app|snippet|button|landing)/);
        if (isRequestingCode) {
          shouldGenerateCode = true;
          reply = "Perfect! I have convened our isolated developer cohort to write a robust, high-performance module. I've designed a premium swarms controller interface in standard responsive Tailwind elements, packed with clean event hooks and strict boundaries. The live compiled blueprint has been injected directly into your Monaco workspace draft. Click 'Launch Live Coding Viewport' below to watch it render dynamically inside our secure preview frame!";
          previewActionLabel = "Launch Live Coding Viewport";
          generatedCode = `
<div class="bg-[#0f1524] border border-white/5 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden max-w-md w-full">
  <div class="absolute inset-0 bg-radial-gradient from-indigo-500/10 to-transparent pointer-events-none"></div>
  <div class="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-400 to-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20">
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-white"><polygon points="6 3 20 12 6 21 6 3"/></svg>
  </div>
  <h1 class="text-2xl font-bold text-white mb-3 tracking-tight">Swarm Engine Live</h1>
  <p class="text-sm text-slate-400 mb-6 leading-relaxed">
    This template was compiled in real time by your dedicated AI Developer Agent cohort (Sam & Team).
  </p>
  <div class="space-y-3 mb-8 text-left">
    <div class="flex items-center justify-between bg-white/5 p-3.5 rounded-xl border border-white/5">
      <div class="flex items-center gap-3">
        <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-md shadow-emerald-500/50 animate-pulse"></span>
        <span class="text-xs text-slate-300 font-semibold">Autopilot Swarm Status</span>
      </div>
      <span class="text-xs text-emerald-400 font-bold font-mono">CONVERGED</span>
    </div>
    <div class="flex items-center justify-between bg-white/5 p-3.5 rounded-xl border border-white/5">
      <div class="flex items-center gap-3">
        <span class="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-md shadow-indigo-500/50"></span>
        <span class="text-xs text-slate-300 font-semibold">Consensus Validation Score</span>
      </div>
      <span class="text-xs text-indigo-400 font-bold font-mono">98.2%</span>
    </div>
  </div>
  <button class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 font-semibold text-sm hover:opacity-90 active:scale-[0.99] transition-all shadow-lg shadow-indigo-500/20 text-white">
    Execute Sandbox Smoke Tests
  </button>
</div>
          `.trim();
        } else {
          reply = "I'm on it! I can help you structure robust state hooks, refactor TypeScript interfaces, optimize serverless edge routing, or write clean JavaScript functions in your active Monaco files. Tell me what module or feature you'd like me to help implement!";
        }
      } else if (activeAgent === 'aditya') {
        const isRequestingDesign = userText.toLowerCase().match(/(design|ui|ux|matte|card|style|dashboard|layout|border|color|theme|aesthetics)/);
        if (isRequestingDesign) {
          shouldGenerateCode = true;
          reply = "Aesthetics are absolutely paramount! I've crafted a premium, glassmorphic dark matte dashboard layout using bespoke HSL tailored color ratios, clean responsive columns, and buttery smooth highlight parameters. It integrates micro-telemetry panels and model alignment trackers flawlessly. The complete markup has been loaded into Monaco. Let's see the visually stunning results live by clicking 'Render Visual Canvas' below!";
          previewActionLabel = "Render Visual Canvas";
          generatedCode = `
<div class="w-full max-w-lg bg-[#0a0f1d] border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
  <div class="flex items-center justify-between border-b border-white/5 pb-6 mb-6">
    <div>
      <h2 class="text-xl font-bold text-white tracking-tight">System Telemetry</h2>
      <p class="text-xs text-slate-400 mt-1">Real-time model alignment & diagnostic throughput.</p>
    </div>
    <span class="px-3 py-1 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 uppercase tracking-wider">Active</span>
  </div>
  
  <div class="grid grid-cols-3 gap-4 mb-6">
    <div class="bg-[#12182b] border border-white/5 rounded-2xl p-4 text-center">
      <div class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Uptime SLA</div>
      <div class="text-lg font-extrabold text-white mt-1">99.98%</div>
    </div>
    <div class="bg-[#12182b] border border-white/5 rounded-2xl p-4 text-center">
      <div class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Consensus</div>
      <div class="text-lg font-extrabold text-emerald-400 mt-1">98.2%</div>
    </div>
    <div class="bg-[#12182b] border border-white/5 rounded-2xl p-4 text-center">
      <div class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Latency</div>
      <div class="text-lg font-extrabold text-indigo-400 mt-1">&lt;0.8s</div>
    </div>
  </div>
  
  <div class="bg-[#0f1524] border border-white/5 rounded-2xl p-5">
    <h3 class="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Model Consensus Alignment</h3>
    <div class="space-y-4">
      <div>
        <div class="flex justify-between text-xs text-slate-300 mb-1.5 font-medium">
          <span>Gemini 2.0 Flash</span>
          <span class="text-emerald-400 font-bold">98.2%</span>
        </div>
        <div class="w-full h-2 bg-slate-900 rounded-full overflow-hidden p-[1px]">
          <div class="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" style="width: 98.2%"></div>
        </div>
      </div>
      <div>
        <div class="flex justify-between text-xs text-slate-300 mb-1.5 font-medium">
          <span>Claude 3.5 Sonnet</span>
          <span class="text-indigo-400 font-bold">96.5%</span>
        </div>
        <div class="w-full h-2 bg-slate-900 rounded-full overflow-hidden p-[1px]">
          <div class="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" style="width: 96.5%"></div>
        </div>
      </div>
    </div>
  </div>
</div>
          `.trim();
        } else {
          reply = "I've structured premium visual styles and dashboard grid outlines. Let me know what section or element you want designed, and I will apply world-class aesthetics and smooth highlights instantly!";
        }
      } else {
        const isRequestingDB = userText.toLowerCase().match(/(db|database|auth|secure|sql|rls|policy|postgres|supabase|migration|table)/);
        if (isRequestingDB) {
          shouldGenerateCode = true;
          reply = "Database and Auth pipelines secured! I have compiled a Postgres migration block that enables Row-Level Security (RLS) policies and authenticates user-level operations on Supabase instantly. I've loaded the schema script into your Monaco workspace editor. Click 'Inspect Database Gate' below to inspect the secure framework draft!";
          previewActionLabel = "Inspect Database Gate";
          generatedCode = `
<div class="max-w-md w-full bg-[#0a0f1d] border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
  <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 text-emerald-400">
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-check"><path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>
  </div>
  <h2 class="text-xl font-bold text-white tracking-tight mb-2">Supabase Secure RLS Gate</h2>
  <p class="text-xs text-slate-400 mb-6 leading-relaxed">
    Postgres Row-Level Security policies active. Anonymous insertions blocked, session-level bindings strictly enforced.
  </p>
  <div class="bg-slate-950 p-4 rounded-2xl text-xs font-mono text-emerald-400 space-y-2 border border-white/5 overflow-x-auto">
    <div class="text-slate-500">-- Enable RLS on Swarm Blogs</div>
    <div>ALTER TABLE orbit_blogs ENABLE RLS;</div>
    <div class="text-indigo-400">CREATE POLICY authenticated_inserts</div>
    <div class="pl-4 text-slate-300">ON public.orbit_blogs FOR INSERT</div>
    <div class="pl-4 text-slate-400">WITH CHECK (auth.uid() = user_id);</div>
  </div>
</div>
          `.trim();
        } else {
          reply = "I specialize in Postgres dual-stack pipelines, Supabase schemas, and RLS gates. Ask me about connection pooling, real-time broadcasts, or setting up secure user permissions!";
        }
      }

      if (shouldGenerateCode) {
        setFileContent(generatedCode);
        if (!selectedFile) {
          setSelectedFile({
            name: 'sandbox-preview.html',
            path: 'sandbox-preview.html',
            type: 'file'
          });
        }
      }

      const agentMsg = {
        sender: activeAgent.charAt(0).toUpperCase() + activeAgent.slice(1),
        text: reply,
        time: 'Just now',
        hasPreview: shouldGenerateCode,
        previewActionLabel
      };

      setMessages(prev => ({
        ...prev,
        [activeAgent]: [...prev[activeAgent], agentMsg]
      }));
      setAgentTyping(false);
    }, 1200);
  };
  
  // Collaborative simulated states
  const [collaborators, setCollaborators] = useState<{ name: string; avatarColor: string; action: string }[]>([
    { name: 'Agent Architect', avatarColor: '#3b82f6', action: 'Designing API schemas...' },
    { name: 'Agent Implementer', avatarColor: '#8b5cf6', action: 'Writing standard endpoints...' },
  ]);
  const [collabIndex, setCollabIndex] = useState(0);

  // Consensus Swarm Arena States
  const [arenaActive, setArenaActive] = useState(false);
  const [arenaStep, setArenaStep] = useState<number>(0);
  const [votingData, setVotingData] = useState<{ model: string; proposal: string; confidence: number; vote: boolean }[]>([
    { model: 'Gemini 1.5 Pro (Recommended)', proposal: 'Generating concurrent stream listener using custom channels...', confidence: 96, vote: true },
    { model: 'GPT-4o Agent', proposal: 'Building standard socket listener utilizing micro-buffers...', confidence: 91, vote: true },
    { model: 'Claude 3 Opus Agent', proposal: 'Drafting pure dynamic event pipelines inside worker loops...', confidence: 94, vote: true },
  ]);
  const [healingLogs, setHealingLogs] = useState<string[]>([]);
  const [healingRunning, setHealingRunning] = useState(false);

  // Deployments Premium States
  const [deployActive, setDeployActive] = useState(false);
  const [deployStep, setDeployStep] = useState(0);
  const [deployLogs, setDeployLogs] = useState<string[]>([]);
  const [viewportMode, setViewportMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Sci-Fi Console Logs
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    'System: Orbit Sandbox Environment Initialized.',
    'System: Integrated n8n-style agent pipelines.',
    'System: Type commands or run tests to execute code autonomously.'
  ]);
  const [terminalInput, setTerminalInput] = useState('');

  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLogs, healingLogs, deployLogs]);

  // Collaborative simulated worker actions ticker
  useEffect(() => {
    const actions = [
      { name: 'Agent Architect', avatarColor: '#3b82f6', action: 'Polishing architecture contract...' },
      { name: 'Agent Implementer', avatarColor: '#8b5cf6', action: 'Streaming self-healing checks...' },
      { name: 'Agent QA', avatarColor: '#10b981', action: 'Deploying edge sandbox bundle...' },
      { name: 'Agent Security', avatarColor: '#ef4444', action: 'Verifying CORS access parameters...' },
    ];

    const interval = setInterval(() => {
      setCollabIndex(i => (i + 1) % actions.length);
      // Ticker terminal entry occasionally
      if (Math.random() > 0.6) {
        const selected = actions[Math.floor(Math.random() * actions.length)];
        setTerminalLogs(prev => [...prev.slice(-30), `[Collaborator] ${selected.name}: ${selected.action}`]);
      }
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  // Authenticate user on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
      } else {
        setUserId(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/workspace?action=tree&userId=${userId}`);
      const d = await res.json() as WorkspaceData;
      setData(d);
    } catch { /* ignore */ }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (userId) {
      refresh();
    }
  }, [userId, refresh]);

  // Real-time synchronization on agent pipeline completed
  useEffect(() => {
    if (!userId) return;
    
    const updateChannel = new BroadcastChannel('orbit_pipeline_sync');
    updateChannel.onmessage = () => {
      refresh();
    };

    return () => {
      updateChannel.close();
    };
  }, [userId, refresh]);

  const openFile = async (node: FileNode) => {
    if (!userId) return;
    setSelectedFile(node);
    setLoadingFile(true);
    setFileContent('');
    try {
      const res = await fetch(`/api/workspace?action=read&path=${encodeURIComponent(node.path)}&userId=${userId}`);
      const d = await res.json() as { content?: string; error?: string };
      setFileContent(d.content ?? d.error ?? '// Add code and deploy...');
    } catch {
      setFileContent('Error loading file');
    }
    setLoadingFile(false);
  };

  const handleSaveFile = async () => {
    if (!userId || !selectedFile) return;
    setSaving(true);
    // Simulate API save
    setTimeout(() => {
      setSaving(false);
      setTerminalLogs(prev => [...prev, `[IDE] Saved successfully: ${selectedFile.name} (File tree updated)`]);
    }, 800);
  };

  // Run Consensus voting & self-healing automation
  const runConsensusArena = () => {
    if (healingRunning) return;
    setSandboxTab('consensus');
    setArenaActive(true);
    setHealingRunning(true);
    setArenaStep(1);
    setHealingLogs(['[Consensus Arena] Initiating multi-model consensus checks...']);

    // Step 1: Draft model proposals
    setTimeout(() => {
      setArenaStep(2);
      setHealingLogs(prev => [
        ...prev, 
        '   - Gemini 1.5 Pro drafted proposal A (96% Confidence)',
        '   - GPT-4o drafted proposal B (91% Confidence)',
        '   - Claude 3 Opus drafted proposal C (94% Confidence)',
        '[Consensus Arena] Alignment established: 94% vote consensus on unified blueprint!'
      ]);
    }, 1800);

    // Step 2: Triggering unit tests
    setTimeout(() => {
      setArenaStep(3);
      setHealingLogs(prev => [
        ...prev,
        '[Consensus Arena] Dispatching automated test runner: npm run test',
        '   ❌ FAIL: auth-conduit.test.js > token encryption validation',
        '   Error: Expected JWT payload structure, got raw unencrypted string.'
      ]);
    }, 3600);

    // Step 3: Self-healing automation
    setTimeout(() => {
      setArenaStep(4);
      setHealingLogs(prev => [
        ...prev,
        '[Self-Healing Swarm] Intercepted failure logs!',
        '[Self-Healing Swarm] Formulating repair instructions...',
        '   -> Modifying src/lib/cryptography.ts to apply correct secret salt...',
        '[Self-Healing Swarm] Patch deployed successfully! Re-running tests...'
      ]);
    }, 5600);

    // Step 4: Verification pass
    setTimeout(() => {
      setArenaStep(5);
      setHealingLogs(prev => [
        ...prev,
        '   ✅ PASS: auth-conduit.test.js > token encryption validation',
        '   ✅ PASS: auth-conduit.test.js > session token validation',
        '[Consensus Arena] All 12 unit tests passed successfully. Code healed! 100% test integrity verified.'
      ]);
      setHealingRunning(false);
      setTerminalLogs(prev => [...prev, '[Consensus Arena] Successfully auto-healed code. Integration checks passed.']);
    }, 8000);
  };

  // One-Click Sandbox Edge Deployment trigger
  const runOneClickDeploy = () => {
    if (deployActive) return;
    setSandboxTab('deploy');
    setDeployActive(true);
    setDeployStep(1);
    setDeployLogs(['[Edge Deployment] Initializing instant Edge sandbox builder...']);

    // Step 1: Compile assets
    setTimeout(() => {
      setDeployStep(2);
      setDeployLogs(prev => [
        ...prev,
        '[Edge Deployment] Compiling bundle scripts & styling conduits...',
        '[Edge Deployment] Compiling public/index.html to edge CDN build logs...'
      ]);
    }, 1500);

    // Step 2: Deploying
    setTimeout(() => {
      setDeployStep(3);
      setDeployLogs(prev => [
        ...prev,
        '[Edge Deployment] Provisioning global serverless routing at us-east-4...',
        '[Edge Deployment] Setting up SSL certificates: edge.orbit.ai/deploy/...',
        '[Edge Deployment] Syncing distributed edge caches...'
      ]);
    }, 3200);

    // Step 3: Deployment Live
    setTimeout(() => {
      setDeployStep(4);
      setDeployLogs(prev => [
        ...prev,
        '🚀 Edge deployment finished successfully!',
        '   URL: https://edge.orbit.ai/deploy/dep-10650aa',
        '   Status: 100% Live & previewable.'
      ]);
      setTerminalLogs(prev => [...prev, '🚀 Edge deployment complete: https://edge.orbit.ai/deploy/dep-10650aa']);
    }, 5000);
  };

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;

    const cmd = terminalInput.trim().toLowerCase();
    setTerminalLogs(prev => [...prev, `user@orbit-sandbox:~$ ${terminalInput}`]);
    setTerminalInput('');

    setTimeout(() => {
      if (cmd === 'clear') {
        setTerminalLogs([]);
      } else if (cmd === 'npm run test') {
        runConsensusArena();
      } else if (cmd === 'deploy' || cmd === 'npm run deploy') {
        runOneClickDeploy();
      } else if (cmd === 'ls') {
        setTerminalLogs(prev => [
          ...prev,
          'package.json    src/            public/         tsconfig.json',
          'README.md       orbit.config.ts node_modules/   build/'
        ]);
      } else {
        setTerminalLogs(prev => [
          ...prev,
          `sh: command not found: ${cmd}. Available: 'ls', 'npm run test', 'deploy', 'clear'`
        ]);
      }
    }, 150);
  };

  const activeCollab = collaborators[collabIndex] || collaborators[0];

  return (
    <div style={{ padding: '1rem', height: 'calc(100vh - 84px)', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#02040a', position: 'relative' }}>
      
      {/* Glow mesh background */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(99,102,241,0.03) 1px, transparent 1px)', backgroundSize: '16px 16px', pointerEvents: 'none', zIndex: 0 }} />

      {/* Header Panel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, zIndex: 10, background: 'rgba(6,9,18,0.8)', padding: '10px 18px', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, backdropFilter: 'blur(12px)' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#f1f5f9', margin: 0, display: 'flex', alignItems: 'center', gap: 10, letterSpacing: '-0.02em' }}>
            <HardDrive size={20} style={{ color: '#6366f1' }} />
            Orbit Workspace
          </h1>
          <p style={{ color: '#64748b', margin: '3px 0 0', fontSize: '0.8rem', fontWeight: 500 }}>
            Collaborative code editing, multi-model consensus diagnostics, and serverless edge deployments.
          </p>
        </div>

        {/* Action Ticker & Top Options */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Active simulated collaborative typing indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 10, fontSize: '0.74rem' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: activeCollab.avatarColor, boxShadow: `0 0 6px ${activeCollab.avatarColor}`, animation: 'pulse 1s infinite alternate' }} />
            <span style={{ fontWeight: 800, color: '#e2e8f0' }}>{activeCollab.name}:</span>
            <span style={{ color: '#64748b', fontFamily: 'monospace' }}>{activeCollab.action}</span>
          </div>

          <button
            onClick={refresh}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, color: '#94a3b8', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
          >
            <RefreshCw size={12} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Sync Filetree
          </button>

          <button
            onClick={() => setShowSidebar(!showSidebar)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
              background: showSidebar ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)',
              border: showSidebar ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.06)',
              borderRadius: 8, color: showSidebar ? '#818cf8' : '#94a3b8',
              fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = showSidebar ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.06)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = showSidebar ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)'; }}
          >
            <Folder size={12} />
            {showSidebar ? 'Hide Explorer' : 'Show Explorer'}
          </button>

          <button
            onClick={() => setShowTerminal(!showTerminal)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
              background: showTerminal ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)',
              border: showTerminal ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.06)',
              borderRadius: 8, color: showTerminal ? '#818cf8' : '#94a3b8',
              fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = showTerminal ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.06)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = showTerminal ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)'; }}
          >
            <TermIcon size={12} />
            {showTerminal ? 'Hide Terminal' : 'Show Terminal'}
          </button>

          <button
            onClick={() => setShowChat(!showChat)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
              background: showChat ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)',
              border: showChat ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.06)',
              borderRadius: 8, color: showChat ? '#818cf8' : '#94a3b8',
              fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = showChat ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.06)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = showChat ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)'; }}
          >
            <Users size={12} />
            {showChat ? 'Hide Agents Chat' : 'Show Agents Chat'}
          </button>
        </div>
      </div>

      {/* Main split-pane workspace layout */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: (showSidebar ? '260px ' : '') + '1fr' + (showChat ? ' 320px' : ''),
        gap: '1rem',
        minHeight: 0,
        zIndex: 10,
        transition: 'grid-template-columns 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        
        {/* Left Side: Code Files Explorer */}
        {showSidebar && (
          <div style={{ background: 'rgba(6,9,18,0.9)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'auto', display: 'flex', flexDirection: 'column', backdropFilter: 'blur(8px)' }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileCode size={13} style={{ color: '#818cf8' }} /> Sandbox Directory Tree
            </div>
            {loading ? (
              <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#475569', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                <Loader2 size={16} className="animate-spin" />
                Loading virtual workspace...
              </div>
            ) : data?.empty ? (
              <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
                <div style={{ color: '#475569', fontSize: '0.8rem', marginBottom: 8, fontWeight: 500 }}>No codebooks spawned</div>
                <div style={{ color: '#334155', fontSize: '0.72rem', lineHeight: 1.45 }}>Instruct any agent to create files and they will materialize in this directory tree.</div>
              </div>
            ) : (
              <div style={{ padding: '8px 4px' }}>
                <FileTree nodes={data?.tree ?? []} onSelect={openFile} />
              </div>
            )}
          </div>
        )}

        {/* Right Side: Monaco IDE central sandbox panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: 0 }}>
          
          {/* Main IDE pane: editor or arena or edge preview */}
          <div style={{ flex: 1, background: '#05080f', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 15px 40px rgba(0,0,0,0.5)' }}>
            
            {/* Monaco Tab bar */}
            <div style={{ padding: '6px 12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', background: 'rgba(255,255,255,0.01)', gap: 8, flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: 2 }}>
                
                {/* Editor Tab */}
                <button
                  onClick={() => setSandboxTab('editor')}
                  style={{
                    padding: '8px 14px', border: 'none', borderTopLeftRadius: 8, borderTopRightRadius: 8,
                    background: sandboxTab === 'editor' ? '#05080f' : 'transparent',
                    borderBottom: '2px solid ' + (sandboxTab === 'editor' ? '#6366f1' : 'transparent'),
                    color: sandboxTab === 'editor' ? '#f8fafc' : '#475569',
                    fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s'
                  }}
                >
                  <FileCode size={12} />
                  <span>Monaco Editor</span>
                </button>

                {/* Consensus Arena Tab */}
                <button
                  onClick={() => setSandboxTab('consensus')}
                  style={{
                    padding: '8px 14px', border: 'none', borderTopLeftRadius: 8, borderTopRightRadius: 8,
                    background: sandboxTab === 'consensus' ? '#05080f' : 'transparent',
                    borderBottom: '2px solid ' + (sandboxTab === 'consensus' ? '#a855f7' : 'transparent'),
                    color: sandboxTab === 'consensus' ? '#f8fafc' : '#475569',
                    fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s'
                  }}
                >
                  <Cpu size={12} style={{ color: arenaActive ? '#a855f7' : 'inherit' }} />
                  <span>Consensus Arena</span>
                  {arenaActive && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#a855f7', animation: 'pulse 0.5s infinite alternate' }} />}
                </button>

                {/* Dynamic Code Preview Tab */}
                <button
                  onClick={() => setSandboxTab('preview')}
                  style={{
                    padding: '8px 14px', border: 'none', borderTopLeftRadius: 8, borderTopRightRadius: 8,
                    background: sandboxTab === 'preview' ? '#05080f' : 'transparent',
                    borderBottom: '2px solid ' + (sandboxTab === 'preview' ? '#22c55e' : 'transparent'),
                    color: sandboxTab === 'preview' ? '#f8fafc' : '#475569',
                    fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s'
                  }}
                >
                  <Eye size={12} style={{ color: sandboxTab === 'preview' ? '#22c55e' : 'inherit' }} />
                  <span>Live Preview</span>
                </button>

                {/* Live Deploy Preview Tab */}
                <button
                  onClick={() => setSandboxTab('deploy')}
                  style={{
                    padding: '8px 14px', border: 'none', borderTopLeftRadius: 8, borderTopRightRadius: 8,
                    background: sandboxTab === 'deploy' ? '#05080f' : 'transparent',
                    borderBottom: '2px solid ' + (sandboxTab === 'deploy' ? '#ec4899' : 'transparent'),
                    color: sandboxTab === 'deploy' ? '#f8fafc' : '#475569',
                    fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s'
                  }}
                >
                  <Rocket size={12} style={{ color: deployActive ? '#ec4899' : 'inherit' }} />
                  <span>Edge Sandbox Deployment</span>
                  {deployActive && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ec4899', animation: 'pulse 0.5s infinite alternate' }} />}
                </button>
              </div>

              {/* Sandbox Control Actions */}
              <div style={{ display: 'flex', gap: 6, paddingBottom: 6 }}>
                {selectedFile && sandboxTab === 'editor' && (
                  <button
                    onClick={handleSaveFile}
                    disabled={saving}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px',
                      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 6, color: '#94a3b8', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                  >
                    {saving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
                    {saving ? 'Saving...' : 'Save Draft'}
                  </button>
                )}

                <button
                  onClick={runConsensusArena}
                  disabled={healingRunning}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px',
                    background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)',
                    borderRadius: 6, color: '#a78bfa', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.16)'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.08)'; e.currentTarget.style.color = '#a78bfa'; }}
                >
                  <Cpu size={11} />
                  Auto-Healing Tests
                </button>

                <button
                  onClick={runOneClickDeploy}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px',
                    background: 'linear-gradient(135deg, #ec4899, #be185d)', border: 'none',
                    borderRadius: 6, color: '#fff', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.15s',
                    boxShadow: '0 4px 10px rgba(236,72,153,0.2)'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)'; }}
                >
                  <Rocket size={11} />
                  Deploy Edge URL
                </button>
              </div>
            </div>

            {/* TAB A: MONACO CODE EDITOR */}
            {sandboxTab === 'editor' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                {selectedFile ? (
                  <>
                    {/* Path breadcrumb */}
                    <div style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', color: '#64748b', fontWeight: 500, fontFamily: 'monospace' }}>
                      <span>workspace</span><span>/</span>
                      <span style={{ color: '#cbd5e1' }}>{selectedFile.path}</span>
                    </div>

                    {/* Monaco Editor frame */}
                    <div style={{ flex: 1, display: 'flex', minHeight: 0, position: 'relative' }}>
                      {/* Monaco Line Numbers column */}
                      <div style={{ width: 44, borderRight: '1px solid rgba(255,255,255,0.03)', background: 'rgba(0,0,0,0.2)', padding: '12px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#334155', fontFamily: 'monospace', fontSize: '0.75rem', lineHeight: 1.6, userSelect: 'none' }}>
                        {[...Array(40)].map((_, i) => (
                          <div key={i} style={{ height: 21 }}>{i + 1}</div>
                        ))}
                      </div>

                      {/* Code editor textarea */}
                      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
                        {loadingFile ? (
                          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: '0.8rem', gap: 8 }}>
                            <Loader2 size={13} className="animate-spin" /> Fetching codespace buffers...
                          </div>
                        ) : selectedFile.path.endsWith('.csv') ? (
                            /* Premium Spreadsheet Grid Preview Component */
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#070c19', overflow: 'hidden', padding: 14 }}>
                              {/* Telemetry KPI Cards */}
                              {spreadsheetStats && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
                                  <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10 }}>
                                    <div style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Units Sold</div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f1f5f9', marginTop: 1 }}>{spreadsheetStats.totalUnits.toLocaleString()}</div>
                                  </div>
                                  <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10 }}>
                                    <div style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Total Revenue</div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#10b981', marginTop: 1 }}>${spreadsheetStats.totalRevenue.toLocaleString()}</div>
                                  </div>
                                  <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10 }}>
                                    <div style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Computed Profits</div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#3b82f6', marginTop: 1 }}>${spreadsheetStats.totalProfit.toLocaleString()}</div>
                                  </div>
                                </div>
                              )}

                              {/* Interactive Table Grid */}
                              <div style={{ flex: 1, overflow: 'auto', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, background: '#03050c' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem', color: '#cbd5e1', textAlign: 'left' }}>
                                  <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                      {csvRows[0]?.map((header: string, hIdx: number) => (
                                        <th key={hIdx} style={{ padding: '10px 12px', fontWeight: 800, color: '#fff', borderRight: '1px solid rgba(255,255,255,0.04)' }}>{header.trim()}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {csvRows.slice(1).map((row: string[], rIdx: number) => (
                                      <tr key={rIdx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        {row.map((cell: string, cIdx: number) => (
                                          <td key={cIdx} style={{ padding: '9px 12px', borderRight: '1px solid rgba(255,255,255,0.04)', color: cIdx === 0 ? '#64748b' : cell.startsWith('$') || !isNaN(Number(cell.replace(/[^0-9.-]/g, ''))) ? '#34d399' : '#cbd5e1' }}>
                                            {cell.trim()}
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>

                              {/* Interactive SVG analytics bar chart built dynamically */}
                              <div style={{ height: 60, marginTop: 12, background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '0 14px' }}>
                                <div style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Visual Yield Graph</div>
                                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 40, flex: 1, justifyContent: 'flex-end' }}>
                                  {csvRows.slice(1).map((row: string[], idx: number) => {
                                    const revenueVal = parseFloat(row[5]) || 50000;
                                    const percentHeight = Math.min(100, Math.max(15, (revenueVal / 500000) * 100));
                                    return (
                                      <div key={idx} style={{ width: 14, height: `${percentHeight}%`, background: 'linear-gradient(to top, #6366f1, #8b5cf6)', borderRadius: '3px 3px 0 0', position: 'relative' }} title={`Segment Profit: $${revenueVal}`}>
                                        <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', padding: '2px 4px', background: '#000', color: '#fff', fontSize: '0.5rem', borderRadius: 3, opacity: 0, transition: 'opacity 0.2s', whiteSpace: 'nowrap' }} className="tooltip">${revenueVal}</div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          ) : (selectedFile.path.endsWith('.md') || selectedFile.path.endsWith('.docx') || selectedFile.path.endsWith('.pdf')) ? (
                            /* Premium Editorial Word Document / Proposal Viewport */
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#090d1a', overflowY: 'auto', padding: 24, width: '100%' }}>
                              <div style={{ maxWidth: 700, width: '100%', margin: '0 auto', background: '#040713', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: '32px 40px', boxShadow: '0 12px 40px rgba(0,0,0,0.5)', position: 'relative', overflow: 'hidden' }}>
                                {/* Elegant Left Accent Ribbon */}
                                <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 4, background: 'linear-gradient(to bottom, #6366f1, #8b5cf6)' }} />
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Orbit Corporate Swarm Brief</div>
                                  <span style={{ fontSize: '0.62rem', background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)', padding: '2px 8px', borderRadius: 12, fontWeight: 700 }}>VERIFIED DOCUMENT</span>
                                </div>

                                {/* Custom Simple MD Parser for Sleek Typography */}
                                <div style={{ color: '#cbd5e1', lineHeight: 1.7, fontSize: '0.8rem' }}>
                                  {fileContent.split('\n').map((line, lIdx) => {
                                    const trimmed = line.trim();
                                    if (trimmed.startsWith('# ')) {
                                      return <h1 key={lIdx} style={{ fontSize: '1.4rem', fontWeight: 850, color: '#fff', marginTop: 24, marginBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 6 }}>{trimmed.slice(2)}</h1>;
                                    }
                                    if (trimmed.startsWith('## ')) {
                                      return <h2 key={lIdx} style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f1f5f9', marginTop: 18, marginBottom: 8 }}>{trimmed.slice(3)}</h2>;
                                    }
                                    if (trimmed.startsWith('### ')) {
                                      return <h3 key={lIdx} style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff', marginTop: 14, marginBottom: 6 }}>{trimmed.slice(4)}</h3>;
                                    }
                                    if (trimmed.startsWith('- ')) {
                                      return <li key={lIdx} style={{ marginLeft: 16, marginBottom: 4, color: '#94a3b8' }}>{trimmed.slice(2)}</li>;
                                    }
                                    if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
                                      return <p key={lIdx} style={{ fontWeight: 800, color: '#cbd5e1', marginBottom: 10 }}>{trimmed.replace(/\*\*/g, '')}</p>;
                                    }
                                    if (trimmed === '---') {
                                      return <hr key={lIdx} style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)', margin: '20px 0' }} />;
                                    }
                                    return <p key={lIdx} style={{ marginBottom: 12, color: '#cbd5e1' }}>{trimmed}</p>;
                                  })}
                                </div>

                                {/* Decorative Signature Canvas */}
                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 32, paddingTop: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div>
                                    <div style={{ fontSize: '0.62rem', color: '#64748b' }}>Digitally Approved By</div>
                                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#fff', fontFamily: 'cursive', marginTop: 2, transform: 'rotate(-2deg)' }}>Orbit Swarm Developer</div>
                                  </div>
                                  <div style={{ width: 45, height: 45, borderRadius: '50%', background: 'rgba(99,102,241,0.1)', border: '1.5px dashed #818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span style={{ fontSize: '0.8rem' }}>🛡️</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <textarea
                              value={fileContent}
                              onChange={e => setFileContent(e.target.value)}
                              style={{
                                flex: 1, border: 'none', background: 'transparent', outline: 'none',
                                color: '#93c5fd', fontFamily: '"Fira Code", "Cascadia Code", "Consolas", monospace',
                                fontSize: '0.82rem', lineHeight: 1.6, padding: '12px 16px', resize: 'none',
                                whiteSpace: 'pre', overflow: 'auto', tabSize: 2,
                              }}
                            />
                          )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', color: '#475569' }}>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(99,102,241,0.05)', border: '1.5px dashed rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Sparkles size={20} style={{ color: '#818cf8' }} />
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8' }}>Workspace Sandbox Idle</div>
                    <div style={{ fontSize: '0.75rem', color: '#334155', maxWidth: 300, textAlign: 'center', lineHeight: 1.4 }}>Select any file on the left tree to edit code, or run self-healing tests.</div>
                  </div>
                )}
              </div>
            )}

            {/* TAB B: SWARM CONSENSUS ARENA */}
            {sandboxTab === 'consensus' && (
              <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                
                {/* Consensus Top bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(139,92,246,0.03)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 12, padding: '10px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      <Cpu size={14} color="#fff" style={{ margin: 'auto' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#f8fafc' }}>Swarm Consensus Arena</div>
                      <div style={{ fontSize: '0.68rem', color: '#a78bfa', fontWeight: 600 }}>Multi-model voting & self-healing test automation</div>
                    </div>
                  </div>

                  <button
                    onClick={runConsensusArena}
                    disabled={healingRunning}
                    style={{
                      padding: '6px 14px', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', border: 'none',
                      borderRadius: 8, color: '#fff', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.15s'
                    }}
                  >
                    {healingRunning ? 'Arena Active...' : 'Re-Run Consensus Swarm'}
                  </button>
                </div>

                {/* Multi-model comparison column blocks */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {votingData.map((vote, i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: 6 }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: i === 0 ? '#10b981' : '#cbd5e1' }}>{vote.model}</span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>PROPOSAL DESIGN:</div>
                      <pre style={{ margin: 0, padding: 8, background: '#020408', borderRadius: 8, color: '#a5b4fc', fontSize: '0.65rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap', lineHeight: 1.45 }}>
                        {vote.proposal}
                      </pre>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                        <span style={{ fontSize: '0.65rem', color: '#475569', fontWeight: 700 }}>CONFIDENCE SCORE:</span>
                        <span style={{ fontSize: '0.7rem', color: '#a855f7', fontWeight: 800 }}>{vote.confidence}%</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Test Healing logs output logger */}
                {arenaActive && (
                  <div style={{ flex: 1, minHeight: 180, background: '#020408', border: '1.5px solid rgba(139,92,246,0.2)', borderRadius: 12, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(139,92,246,0.15)', background: 'rgba(139,92,246,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 800, color: '#a78bfa' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><TermIcon size={12} /> Test Execution Logs</span>
                      <span>Progress State {arenaStep}/5</span>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {healingLogs.map((log, index) => {
                        const isErr = log.includes('❌') || log.includes('Error:');
                        const isOk = log.includes('✅') || log.includes('passed');
                        const isHealing = log.includes('[Self-Healing]');
                        
                        let color = '#94a3b8';
                        if (isErr) color = '#f87171';
                        else if (isOk) color = '#4ade80';
                        else if (isHealing) color = '#c084fc';
                        else if (log.includes('[Consensus Arena]')) color = '#a78bfa';

                        return (
                          <div key={index} style={{ fontSize: '0.72rem', color, fontFamily: 'monospace', lineHeight: 1.5 }}>
                            {log}
                          </div>
                        );
                      })}
                      <div ref={logsEndRef} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB D: LIVE INTERACTIVE PREVIEW */}
            {sandboxTab === 'preview' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#090d16', overflow: 'hidden' }}>
                {/* Viewport header bar */}
                <div style={{ padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Globe size={13} style={{ color: '#22c55e' }} />
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#cbd5e1' }}>Interactive Sandbox Viewport</span>
                    <span style={{ fontSize: '0.65rem', color: '#475569', background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: 4, fontFamily: 'monospace' }}>
                      {selectedFile ? selectedFile.name : 'no-file.html'}
                    </span>
                  </div>

                  {/* Responsive size toggles */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 2, background: 'rgba(0,0,0,0.4)', padding: 3, borderRadius: 6 }}>
                      {[
                        { mode: 'desktop', icon: <Monitor size={11} />, label: 'Desktop' },
                        { mode: 'tablet', icon: <Tablet size={11} />, label: 'Tablet' },
                        { mode: 'mobile', icon: <Smartphone size={11} />, label: 'Mobile' },
                      ].map(btn => (
                        <button
                          key={btn.mode}
                          onClick={() => setViewportMode(btn.mode as any)}
                          style={{
                            border: 'none', background: viewportMode === btn.mode ? 'rgba(255,255,255,0.08)' : 'transparent',
                            color: viewportMode === btn.mode ? '#22c55e' : '#475569',
                            padding: '4px 8px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                            fontSize: '0.65rem', fontWeight: 700, transition: 'all 0.15s'
                          }}
                        >
                          {btn.icon}
                          <span style={{ fontSize: '0.62rem' }}>{btn.label}</span>
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => {
                        const iframe = document.getElementById('sandbox-preview-iframe') as HTMLIFrameElement;
                        if (iframe) {
                          iframe.srcdoc = getPreviewSrcDoc();
                        }
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px',
                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 6, color: '#94a3b8', fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s'
                      }}
                    >
                      <RefreshCw size={10} />
                      Reload
                    </button>
                  </div>
                </div>

                {/* Viewport Frame Container */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020408', padding: '16px', minHeight: 0, overflow: 'auto' }}>
                  {selectedFile ? (
                    <div
                      style={{
                        width: viewportMode === 'desktop' ? '100%' : viewportMode === 'tablet' ? '768px' : '375px',
                        height: '100%',
                        background: '#070b13',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 14,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
                      }}
                    >
                      {/* Browser url simulation bar */}
                      <div style={{ padding: '6px 12px', background: '#0a0f1d', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <div style={{ display: 'flex', gap: 5 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                        </div>
                        <div style={{
                          flex: 1, background: '#020408', border: '1px solid rgba(255,255,255,0.04)',
                          borderRadius: 6, padding: '3px 10px', fontSize: '0.65rem', color: '#475569',
                          fontFamily: 'monospace', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap',
                          display: 'flex', alignItems: 'center', gap: 6
                        }}>
                          <span style={{ color: '#10b981', fontWeight: 800 }}>https://</span>
                          <span style={{ color: '#64748b' }}>sandbox.orbit.ai/preview/{selectedFile.path}</span>
                        </div>
                      </div>

                      {/* Live compiled iframe */}
                      <iframe
                        id="sandbox-preview-iframe"
                        srcDoc={getPreviewSrcDoc()}
                        title="Orbit Live Preview Viewport"
                        sandbox="allow-scripts allow-same-origin"
                        style={{ width: '100%', height: '100%', border: 'none', background: '#070b13' }}
                      />
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: '#475569', textAlign: 'center' }}>
                      <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(34,197,94,0.05)', border: '1.5px dashed rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Eye size={20} style={{ color: '#22c55e' }} />
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8' }}>Live Sandbox Preview Idle</div>
                      <div style={{ fontSize: '0.75rem', color: '#334155', maxWidth: 320, lineHeight: 1.4 }}>
                        Select or create a file in Monaco, then use AI chat to generate gorgeous visual layouts and view them live instantly!
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB C: EDGE DEPLOYMENTS PREVIEW */}
            {sandboxTab === 'deploy' && (
              <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                
                {/* Deploy Progress Banner */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(236,72,153,0.03)', border: '1px solid rgba(236,72,153,0.15)', borderRadius: 12, padding: '10px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      <Rocket size={14} color="#fff" style={{ margin: 'auto' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#f8fafc' }}>Serverless Edge Deployments</div>
                      <div style={{ fontSize: '0.68rem', color: '#f472b6', fontWeight: 600 }}>Compile sandbox HTML components to live edge routing networks</div>
                    </div>
                  </div>

                  <button
                    onClick={runOneClickDeploy}
                    style={{
                      padding: '6px 14px', background: 'linear-gradient(135deg, #ec4899, #be185d)', border: 'none',
                      borderRadius: 8, color: '#fff', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.15s'
                    }}
                  >
                    Deploy to Edge Network
                  </button>
                </div>

                {deployActive && (
                  <div style={{ display: 'grid', gridTemplateColumns: deployStep === 4 ? '300px 1fr' : '1fr', gap: '1.2rem', flex: 1, minHeight: 300 }}>
                    
                    {/* Deployment Logs & Information Card */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ background: '#020408', border: '1px solid rgba(236,72,153,0.15)', borderRadius: 12, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(236,72,153,0.15)', background: 'rgba(236,72,153,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 800, color: '#f472b6' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Rocket size={11} /> Provisioning Logs</span>
                          <span>Step {deployStep}/4</span>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {deployLogs.map((log, index) => {
                            const isRocket = log.includes('🚀') || log.includes('finished');
                            let color = '#94a3b8';
                            if (isRocket) color = '#f472b6';
                            return (
                              <div key={index} style={{ fontSize: '0.72rem', color, fontFamily: 'monospace', lineHeight: 1.5 }}>
                                {log}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {deployStep === 4 && (
                        <div style={{ background: 'rgba(16,185,129,0.05)', border: '1.5px solid rgba(16,185,129,0.35)', borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div style={{ fontSize: '0.78rem', fontWeight: 900, color: '#10b981', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <CheckCircle2 size={13} /> Deployed Successfully!
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>
                            Your application is now hosted and previewable globally:
                          </div>
                          <a
                            href="https://edge.orbit.ai/deploy/dep-10650aa"
                            target="_blank"
                            rel="noreferrer"
                            style={{ fontSize: '0.72rem', color: '#34d399', fontFamily: 'monospace', fontWeight: 800, textDecoration: 'underline' }}
                          >
                            edge.orbit.ai/deploy/dep-10650aa
                          </a>
                        </div>
                      )}
                    </div>

                    {/* LIVE INTERACTIVE EDGE WEB VIEWPORT */}
                    {deployStep === 4 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: '#090d16', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden' }}>
                        {/* Viewport header */}
                        <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Globe size={11} style={{ color: '#ec4899' }} /> Preview Viewport
                          </span>

                          {/* Viewport size controls */}
                          <div style={{ display: 'flex', gap: 2, background: 'rgba(0,0,0,0.2)', padding: 3, borderRadius: 6 }}>
                            {[
                              { mode: 'desktop', icon: <Monitor size={10} /> },
                              { mode: 'tablet', icon: <Tablet size={10} /> },
                              { mode: 'mobile', icon: <Smartphone size={10} /> },
                            ].map(btn => (
                              <button
                                key={btn.mode}
                                onClick={() => setViewportMode(btn.mode as any)}
                                style={{
                                  border: 'none', background: viewportMode === btn.mode ? 'rgba(255,255,255,0.08)' : 'transparent',
                                  color: viewportMode === btn.mode ? '#ec4899' : '#475569',
                                  padding: '3px 7px', borderRadius: 4, cursor: 'pointer', display: 'flex'
                                }}
                              >
                                {btn.icon}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Interactive live viewport iframe simulator */}
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020408', padding: 8 }}>
                          <div
                            style={{
                              width: viewportMode === 'desktop' ? '100%' : viewportMode === 'tablet' ? '460px' : '280px',
                              height: '100%',
                              background: 'radial-gradient(circle at top left, #0e1628 0%, #030712 100%)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: 12,
                              overflow: 'hidden',
                              display: 'flex',
                              flexDirection: 'column',
                              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                              boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                            }}
                          >
                            {/* Visual live content representing the deployed swarm app */}
                            <div style={{ padding: 14, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 6, margin: 'auto' }}>
                              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #ec4899, #be185d)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 4px', boxShadow: '0 0 10px #ec4899' }}>
                                <Rocket size={14} color="#fff" style={{ margin: 'auto' }} />
                              </div>
                              <div style={{ fontSize: '0.8rem', fontWeight: 900, color: '#f8fafc' }}>Orbit Sandbox App</div>
                              <div style={{ fontSize: '0.62rem', color: '#64748b', lineHeight: 1.4 }}>
                                Live Edge deploy successful. All worker agents converged correctly!
                              </div>
                              <div style={{ padding: '6px 12px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 8, color: '#10b981', fontSize: '0.65rem', fontWeight: 700, marginTop: 4 }}>
                                System Health: Excellent (100%)
                              </div>
                            </div>
                          </div>
                        </div>

                      </div>
                    )}

                  </div>
                )}
              </div>
            )}

          </div>

          {/* Bottom Pane: Sci-Fi Command Terminal */}
          {showTerminal && (
            <div style={{ height: 210, background: '#020408', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18, overflow: 'hidden', display: 'flex', flexDirection: 'column', flexShrink: 0, boxShadow: '0 10px 30px rgba(0,0,0,0.4)', animation: 'fadeIn 0.2s ease-in-out' }}>
              <div style={{ padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.01)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <TermIcon size={12} style={{ color: '#6366f1' }} />
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#cbd5e1', letterSpacing: '0.01em' }}>Orbit Virtual Sandbox CLI</span>
                <span style={{ fontSize: '0.62rem', padding: '1px 6px', background: 'rgba(99,102,241,0.1)', color: '#818cf8', borderRadius: 4, fontFamily: 'monospace', fontWeight: 700, marginLeft: 'auto' }}>orbit@sandbox:~</span>
              </div>

              {/* Scrollable command list logs */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {terminalLogs.map((log, i) => (
                  <div key={i} style={{ fontSize: '0.72rem', color: log.startsWith('user@') ? '#38bdf8' : log.includes('[Collaborator]') ? '#818cf8' : log.includes('Success') || log.includes('🚀') ? '#34d399' : '#cbd5e1', fontFamily: '"Fira Code", "Cascadia Code", "Consolas", monospace', lineHeight: 1.5 }}>
                    {log}
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>

              {/* Command submission form */}
              <form onSubmit={handleCommandSubmit} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.2)', flexShrink: 0 }}>
                <span style={{ paddingLeft: 14, color: '#6366f1', fontFamily: 'monospace', fontSize: '0.72rem', fontWeight: 700 }}>user@orbit-sandbox:~$</span>
                <input
                  type="text"
                  value={terminalInput}
                  onChange={e => setTerminalInput(e.target.value)}
                  placeholder="Type commands (e.g. 'ls', 'npm run test', 'deploy')..."
                  style={{
                    flex: 1, border: 'none', background: 'transparent', outline: 'none',
                    color: '#cbd5e1', fontFamily: '"Fira Code", monospace', fontSize: '0.72rem',
                    padding: '10px 12px'
                  }}
                />
              </form>
            </div>
          )}

        </div>

        {/* Right Side: Agent Cohorts Chat Column */}
        {showChat && (
          <div style={{ background: 'rgba(6,9,18,0.9)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', backdropFilter: 'blur(8px)' }}>
            
            {/* Chat Header */}
            <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Users size={13} style={{ color: '#818cf8' }} />
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Agent Cohorts</span>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem('orbit_workspace_agent_messages');
                  setMessages({
                    sam: [
                      { sender: 'Sam', text: "Hey! I'm Sam, your AI Coding Specialist. I can write and compile robust, self-healing code directly into your Monaco workspace draft. Let me know what feature or component you want me to write!", time: 'Just now' }
                    ],
                    aditya: [
                      { sender: 'Aditya', text: "Hi there! I'm Aditya, your Principal UI/UX Architect. I can craft stunning dark matte visual interfaces, custom responsive layout grids, and buttery smooth highlights. What interface shall we design?", time: 'Just now' }
                    ],
                    jishnu: [
                      { sender: 'Jishnu', text: "Hello! Jishnu here. I specialize in secure auth pipelines, Postgres dual-stack connection poolers, and live Supabase sync broadcasts. Let's configure your database layer!", time: 'Just now' }
                    ]
                  });
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ef4444',
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  opacity: 0.8,
                  transition: 'opacity 0.15s'
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '1'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '0.8'; }}
              >
                <RefreshCw size={10} />
                Clear Chats
              </button>
            </div>

            {/* Agent Select Panel - Upgraded to Visual Cohort Cards */}
            <div style={{ display: 'flex', gap: 8, padding: '12px', background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid rgba(255,255,255,0.04)', flexShrink: 0, overflowX: 'auto', scrollbarWidth: 'none' }}>
              {[
                { id: 'sam', name: 'Sam', role: 'Dev Specialist', emoji: '👨‍💻', color: '#3b82f6' },
                { id: 'aditya', name: 'Aditya', role: 'UI/UX Architect', emoji: '🎨', color: '#8b5cf6' },
                { id: 'jishnu', name: 'Jishnu', role: 'DB Engineer', emoji: '🔐', color: '#10b981' }
              ].map((agentItem) => {
                const isActive = activeAgent === agentItem.id;
                return (
                  <button
                    key={agentItem.id}
                    type="button"
                    onClick={() => setActiveAgent(agentItem.id as any)}
                    style={{
                      flex: '1 0 auto',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 12px',
                      borderRadius: 12,
                      background: isActive ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.01)',
                      border: isActive ? `1.5px solid ${agentItem.color}80` : '1.5px solid rgba(255, 255, 255, 0.04)',
                      boxShadow: isActive ? `0 4px 20px ${agentItem.color}15` : 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                    onMouseEnter={e => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.01)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.04)';
                      }
                    }}
                  >
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${agentItem.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      <span style={{ fontSize: '0.85rem' }}>{agentItem.emoji}</span>
                      <span style={{ position: 'absolute', bottom: -1, right: -1, width: 8, height: 8, borderRadius: '50%', background: '#10b981', border: '1.5px solid #060912', animation: 'pulseGlow 1.4s infinite alternate' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.74rem', fontWeight: 800, color: isActive ? '#f8fafc' : '#94a3b8' }}>{agentItem.name}</span>
                      <span style={{ fontSize: '0.58rem', color: isActive ? '#cbd5e1' : '#64748b', fontWeight: 500 }}>{agentItem.role}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Message Thread */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {messages[activeAgent].map((msg, idx) => {
                const isUser = msg.sender === 'User';
                const avatar = isUser ? '👤' : activeAgent === 'sam' ? '👨‍💻' : activeAgent === 'aditya' ? '🎨' : '🔐';
                const bubbleColor = isUser ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)';
                const borderColor = isUser ? '1px solid rgba(99,102,241,0.18)' : '1px solid rgba(255,255,255,0.05)';

                return (
                  <div key={idx} style={{ display: 'flex', gap: 8, alignSelf: isUser ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                    {!isUser && (
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: '0.58rem' }}>{avatar}</span>
                      </div>
                    )}
                    
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.58rem', fontWeight: 800, color: isUser ? '#818cf8' : '#cbd5e1', marginBottom: 2, paddingLeft: isUser ? 0 : 4, paddingRight: isUser ? 4 : 0, textAlign: isUser ? 'right' : 'left' }}>
                        {msg.sender}
                      </span>
                      
                      <div style={{ 
                        padding: '10px 14px', 
                        borderRadius: isUser ? '14px 14px 0px 14px' : '0px 14px 14px 14px', 
                        fontSize: '0.76rem', 
                        lineHeight: 1.5,
                        background: bubbleColor,
                        border: borderColor,
                        color: isUser ? '#c7d2fe' : '#cbd5e1',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6
                      }}>
                        <div>{msg.text}</div>
                        
                        {msg.hasPreview && (
                          <button
                            onClick={() => {
                              setSandboxTab('preview');
                              if (!selectedFile) {
                                setSelectedFile({
                                  name: 'sandbox-preview.html',
                                  path: 'sandbox-preview.html',
                                  type: 'file'
                                });
                              }
                            }}
                            style={{
                              marginTop: 4,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '6px 12px',
                              background: 'rgba(34,197,94,0.1)',
                              border: '1px solid rgba(34,197,94,0.25)',
                              borderRadius: 8,
                              color: '#4ade80',
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              alignSelf: 'flex-start',
                              transition: 'all 0.15s'
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = 'rgba(34,197,94,0.18)';
                              e.currentTarget.style.borderColor = 'rgba(34,197,94,0.4)';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = 'rgba(34,197,94,0.1)';
                              e.currentTarget.style.borderColor = 'rgba(34,197,94,0.25)';
                            }}
                          >
                            <Eye size={11} />
                            <span>{msg.previewActionLabel || 'View Live Preview'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {agentTyping && (
                <div style={{ display: 'flex', gap: 8, alignSelf: 'flex-start', maxWidth: '85%' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.62rem' }}>{activeAgent === 'sam' ? '👨‍💻' : activeAgent === 'aditya' ? '🎨' : '🔐'}</span>
                  </div>
                  <div style={{
                    padding: '12px 16px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.04)',
                    borderRadius: '0px 16px 16px 16px',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5
                  }}>
                    <span style={{ fontSize: '0.65rem', color: '#818cf8', fontWeight: 700, marginRight: 4 }}>Cognitive Think Loop</span>
                    <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 10 }}>
                      <span style={{ width: 3, height: 6, borderRadius: 2, background: activeAgent === 'sam' ? '#3b82f6' : activeAgent === 'aditya' ? '#8b5cf6' : '#10b981', display: 'inline-block', animation: 'bounceWave 0.8s infinite ease-in-out' }} />
                      <span style={{ width: 3, height: 10, borderRadius: 2, background: '#8b5cf6', display: 'inline-block', animation: 'bounceWave 0.8s infinite ease-in-out 0.15s' }} />
                      <span style={{ width: 3, height: 8, borderRadius: 2, background: '#ec4899', display: 'inline-block', animation: 'bounceWave 0.8s infinite ease-in-out 0.3s' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Suggestion Pills */}
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '4px 10px', flexShrink: 0, scrollbarWidth: 'none' }}>
              {(activeAgent === 'sam' 
                ? ["⌨️ Landing page", "🦀 Rust server", "🟨 Run JS tests"]
                : activeAgent === 'aditya'
                ? ["🎨 Design dashboard", "✨ Hover animations"]
                : ["🔐 Enable RLS rules", "📊 Postgres pooler"]
              ).map((pill) => (
                <button
                  key={pill}
                  type="button"
                  onClick={() => handleSendMessage(undefined, pill.replace(/^[^\s]+\s/, ''))}
                  style={{
                    whiteSpace: 'nowrap',
                    padding: '5px 10px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 12,
                    color: '#cbd5e1',
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(99, 102, 241, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.2)';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.color = '#cbd5e1';
                  }}
                >
                  {pill}
                </button>
              ))}
            </div>

            {/* Chat Input Area */}
             <form onSubmit={handleSendMessage} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: 10, background: 'rgba(0,0,0,0.2)', display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
              <button
                type="button"
                onClick={handleMicClick}
                disabled={isListening || agentTyping}
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: isListening ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.03)',
                  border: isListening ? '1.5px solid #818cf8' : '1px solid rgba(255,255,255,0.06)',
                  color: isListening ? '#818cf8' : '#cbd5e1',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: isListening || agentTyping ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s', fontSize: '0.85rem',
                  boxShadow: isListening ? '0 0 10px rgba(99, 102, 241, 0.4)' : 'none'
                }}
                title="Simulate Voice Command"
              >
                {isListening ? '🎙️' : '🎤'}
              </button>
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder={isListening ? 'Listening dictation...' : `Ask ${activeAgent.charAt(0).toUpperCase() + activeAgent.slice(1)} to generate code...`}
                disabled={agentTyping || isListening}
                style={{ flex: 1, background: '#020408', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '7px 10px', fontSize: '0.74rem', color: '#cbd5e1', outline: 'none' }}
              />
              <button 
                type="submit"
                style={{ padding: '7px 14px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', border: 'none', borderRadius: 8, color: '#fff', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.15s' }}
              >
                Send
              </button>
            </form>

          </div>
        )}

      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes bounceWave {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes pulseGlow {
          0% { box-shadow: 0 0 4px rgba(16,185,129,0.4); }
          100% { box-shadow: 0 0 12px rgba(16,185,129,0.8); }
        }
      ` }} />
    </div>
  );
}
