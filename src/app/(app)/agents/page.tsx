'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Terminal as TerminalIcon, Cpu, Megaphone, DollarSign, Palette, Box, Briefcase, 
  LifeBuoy, Compass, GraduationCap, FlaskConical, Gamepad2, Plug, 
  Volume2, ClipboardList, Sparkles, Eye, Shield, Folder, File, Download, 
  Play, RotateCcw, X, Search, ChevronRight, Loader2, Code, History, 
  Send, ArrowUpRight, FileText, Globe, RefreshCw, Layers, BookOpen, Save, CheckCircle
} from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  description: string;
  color: string;
  emoji: string; 
  vibe: string;
  category: string;
}

interface WorkspaceFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size: number;
  mtime: number;
}

interface KnowledgeDoc {
  id: string;
  title: string;
  category: string;
  source: string;
  tags: string[];
  preview: string;
  content: string;
}

const COLOR_MAP: Record<string, string> = {
  cyan:    '#22d3ee',
  blue:    '#3b82f6',
  purple:  '#8b5cf6',
  green:   '#10b981',
  red:     '#ef4444',
  orange:  '#f97316',
  yellow:  '#eab308',
  pink:    '#ec4899',
  indigo:  '#6366f1',
  teal:    '#14b8a6',
};

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  cpu: Cpu,
  megaphone: Megaphone,
  'dollar-sign': DollarSign,
  palette: Palette,
  box: Box,
  briefcase: Briefcase,
  'life-buoy': LifeBuoy,
  compass: Compass,
  'graduation-cap': GraduationCap,
  'flask-conical': FlaskConical,
  'gamepad-2': Gamepad2,
  plug: Plug,
  'volume-2': Volume2,
  'clipboard-list': ClipboardList,
  sparkles: Sparkles,
  eye: Eye,
  shield: Shield,
};

function getColor(c: string) {
  return COLOR_MAP[c] ?? '#6366f1';
}

function getIcon(name: string) {
  return ICON_MAP[name] ?? Cpu;
}

// ─── Workspace Real-Time Conversational & Scraper Modal ─────────────────────
function AgentWorkspaceModal({
  agent,
  onClose,
}: {
  agent: Agent;
  onClose: () => void;
}) {
  const [chatTimeline, setChatTimeline] = useState<{ sender: 'user' | 'agent'; text: string; timestamp: string }[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('orbit_chat_timeline_' + agent.id);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return [
      { sender: 'agent', text: `Greetings! I am the **${agent.name}** agent. I've initiated a secure sandbox workspace directory. What goal or code asset should we engineer today?`, timestamp: new Date().toLocaleTimeString() }
    ];
  });
  const [chatInput, setChatInput] = useState('');
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);

  const [running, setRunning] = useState(false);
  const [traceLogs, setTraceLogs] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('orbit_trace_logs_' + agent.id);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return [];
  });
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [tokens, setTokens] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('orbit_tokens_' + agent.id);
      if (saved) return parseInt(saved) || 0;
    }
    return 0;
  });
  const [cost, setCost] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('orbit_cost_' + agent.id);
      if (saved) return parseFloat(saved) || 0;
    }
    return 0;
  });

  const [isListening, setIsListening] = useState(false);

  const handleMicClick = () => {
    if (isListening || running) return;
    setIsListening(true);
    
    const phrases = agent.category?.toLowerCase() === 'design'
      ? ["Design a sleek dark glassmorphic dashboard layout", "Design a responsive modular grids frame", "Design customized border colors animations"]
      : agent.category?.toLowerCase() === 'database'
      ? ["Establish secure Postgres row-level policies", "Configure a Supabase real-time broadcast client", "Write database sync migration schemas"]
      : ["Write a high-performance HTTP web server script", "Compile concurrent loop task queues", "Write a secure serverless script"];
    
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

  const promptStarters = useMemo(() => {
    switch (agent.category?.toLowerCase()) {
      case 'coding':
      case 'developer':
        return [
          { label: '🦀 High-perf Rust Server', text: 'Write a high-performance HTTP web server script in Rust' },
          { label: '⚙️ Concurrent Queue', text: 'Build a concurrent loop task queue pipeline in TypeScript' },
          { label: '🔍 Test Suite', text: 'Write a comprehensive unit test suite in JavaScript' }
        ];
      case 'design':
      case 'ui':
      case 'ux':
        return [
          { label: '🎨 Glassmorphic Dashboard', text: 'Design a sleek dark glassmorphic dashboard web application' },
          { label: '✨ Hover Highlights', text: 'Create buttery smooth border hovering card animations' },
          { label: '📱 Responsive Layouts', text: 'Draft a fully responsive grid system with flex wrap' }
        ];
      case 'database':
      case 'db':
        return [
          { label: '🔐 Row-Level Policies', text: 'Establish secure Postgres Row-Level Security (RLS) policies' },
          { label: '📊 Connection Pooler', text: 'Configure a highly available connection pool schema' },
          { label: '📡 Live Broadcasts', text: 'Write a Supabase real-time broadcast integration pipeline' }
        ];
      case 'marketing':
      case 'business':
        return [
          { label: '📈 Competitor Matrix', text: 'Analyze market competitors and outline a strategy doc' },
          { label: '🎯 SEO Campaign', text: 'Generate high-intent SEO keywords and metadata strategies' },
          { label: '💌 Product Launch', text: 'Draft a compelling multi-stage email marketing sequence' }
        ];
      default:
        return [
          { label: '🚀 Quick Scaffold', text: `Write a clean bootstrap script for a modern ${agent.name} project` },
          { label: '🛠️ Optimization', text: 'Audit this directory structure and optimize critical code paths' },
          { label: '📚 Build API Docs', text: 'Generate production-ready markdown API documentation' }
        ];
    }
  }, [agent]);
  
  // Workspace explorer
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [fileSearchQuery, setFileSearchQuery] = useState('');
  const [currentPath, setCurrentPath] = useState('');
  const [selectedFile, setSelectedFile] = useState<WorkspaceFile | null>(null);
  const [selectedFileContent, setSelectedFileContent] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [savingFile, setSavingFile] = useState(false);
  const [loadingFile, setLoadingFile] = useState(false);
  const [activeXlsTab, setActiveXlsTab] = useState<'sheet' | 'preview' | 'downloads'>('sheet');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [iframeKey, setIframeKey] = useState(0);

  // Script Execution Telemetry
  const [executingScript, setExecutingScript] = useState(false);
  const [execResult, setExecResult] = useState<{
    success: boolean;
    stdout: string;
    stderr: string;
    exitCode: number;
    executionTimeMs: number;
    commandExecuted: string;
  } | null>(null);
  const [execError, setExecError] = useState<string>('');

  // Knowledge base search
  const [knowledgeDocs, setKnowledgeDocs] = useState<KnowledgeDoc[]>([]);
  const [knowledgeQuery, setKnowledgeQuery] = useState('');
  const [searchingKnowledge, setSearchingKnowledge] = useState(false);

  // Persist timeline & logs
  useEffect(() => {
    localStorage.setItem('orbit_chat_timeline_' + agent.id, JSON.stringify(chatTimeline));
  }, [chatTimeline, agent.id]);

  useEffect(() => {
    localStorage.setItem('orbit_trace_logs_' + agent.id, JSON.stringify(traceLogs));
  }, [traceLogs, agent.id]);

  useEffect(() => {
    localStorage.setItem('orbit_tokens_' + agent.id, tokens.toString());
  }, [tokens, agent.id]);

  useEffect(() => {
    localStorage.setItem('orbit_cost_' + agent.id, cost.toString());
  }, [cost, agent.id]);

  // Load Specialized Knowledge Docs
  const loadKnowledge = useCallback(async (query = '') => {
    setSearchingKnowledge(true);
    try {
      const res = await fetch(`/api/agents/knowledge?category=${encodeURIComponent(agent.category)}&query=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json() as { documents: KnowledgeDoc[] };
        setKnowledgeDocs(data.documents || []);
      }
    } catch { /* ignore silently */ }
    finally {
      setSearchingKnowledge(false);
    }
  }, [agent.category]);

  useEffect(() => {
    loadKnowledge();
  }, [loadKnowledge]);

  const handleExecuteScript = async () => {
    if (!selectedFile || executingScript) return;
    setExecutingScript(true);
    setExecResult(null);
    setExecError('');

    try {
      const res = await fetch('/api/workspace/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: selectedFile.path,
          agentId: agent.id
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.error) {
          setExecError(data.error);
        } else {
          setExecResult(data);
        }
      } else {
        const text = await res.text();
        setExecError(text || 'Failed to compile or run code in sandbox');
      }
    } catch (err: any) {
      setExecError(err.message ?? String(err));
    } finally {
      setExecutingScript(false);
    }
  };

  const handleSaveFile = async () => {
    if (!selectedFile || savingFile) return;
    setSavingFile(true);
    try {
      const res = await fetch('/api/workspace', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId: agent.id,
          path: selectedFile.path,
          content: editedContent
        })
      });

      if (res.ok) {
        setSelectedFileContent(editedContent);
        setIsEditing(false);
        // Refresh preview if it's currently loaded
        setIframeKey(prev => prev + 1);
      } else {
        alert("Failed to save changes to sandbox workspace.");
      }
    } catch (err) {
      alert("Error saving file: " + String(err));
    } finally {
      setSavingFile(false);
    }
  };

  const bottomRef = useRef<HTMLDivElement>(null);
  const color = getColor(agent.color);
  const AgentIcon = getIcon(agent.emoji);

  // Auto-scroll chat/logs
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatTimeline, traceLogs]);

  // Load files in active workspace
  const loadWorkspaceFiles = useCallback(async (subpath = '') => {
    try {
      const res = await fetch(`/api/workspace?path=${encodeURIComponent(subpath)}&agentId=${encodeURIComponent(agent.id)}`);
      if (res.ok) {
        const data = await res.json() as { files: WorkspaceFile[] };
        setFiles(data.files || []);
      }
    } catch { /* ignore silently */ }
  }, [agent.id]);

  useEffect(() => {
    loadWorkspaceFiles(currentPath);
    if (running) {
      const timer = setInterval(() => loadWorkspaceFiles(currentPath), 3000);
      return () => clearInterval(timer);
    }
  }, [running, currentPath, loadWorkspaceFiles]);

  const handleViewFile = async (file: WorkspaceFile) => {
    setSelectedFile(file);
    setLoadingFile(true);
    setSelectedFileContent('');
    setIsEditing(false);
    setEditedContent('');
    setExecResult(null);
    setExecError('');
    try {
      const res = await fetch(`/api/workspace/download?path=${encodeURIComponent(file.path)}&agentId=${encodeURIComponent(agent.id)}`);
      if (res.ok) {
        const text = await res.text();
        setSelectedFileContent(text);
        setEditedContent(text);
      } else {
        setSelectedFileContent(`Error loading file: ${await res.text()}`);
      }
    } catch (err) {
      setSelectedFileContent(`Error loading file: ${String(err)}`);
    } finally {
      setLoadingFile(false);
    }
  };

  // Live URL Scraping Simulator
  const handleScrapeURL = async () => {
    if (!scrapeUrl.trim() || isScraping) return;
    const url = scrapeUrl;
    setScrapeUrl('');
    setIsScraping(true);
    setRunning(true);

    setChatTimeline(prev => [...prev, {
      sender: 'user',
      text: `Scrape web page context from: ${url}`,
      timestamp: new Date().toLocaleTimeString()
    }]);

    setTraceLogs(prev => [...prev, `[Scraper Tool]: Initiating network request to ${url}...`, `[Scraper Tool]: Fetching DOM, extracting clean Markdown payload...`]);

    setTimeout(() => {
      setIsScraping(false);
      setRunning(false);
      const baseName = url.replace(/https?:\/\/(www\.)?/, "").replace(/[^a-zA-Z0-9]/g, "_").slice(0, 15);
      
      setTraceLogs(prev => [...prev, `[Scraper Tool]: Scraped successfully! Saving parsed contents into workspace as '${baseName}_scraped.md'.`]);
      
      setChatTimeline(prev => [...prev, {
        sender: 'agent',
        text: `I have successfully scraped **${url}**, mined all core text headers, and saved the structured markdown output inside your workspace as **\`${baseName}_scraped.md\`**. You can open and inspect it inside the Sandboxed IDE explorer on the right!`,
        timestamp: new Date().toLocaleTimeString()
      }]);

      loadWorkspaceFiles(currentPath);
    }, 2800);
  };

  // Submit chat query & run agent workflow
  const handleSendAgentMessage = async (overrideText?: string) => {
    if ((!chatInput.trim() && !overrideText) || running) return;
    const text = overrideText ?? chatInput;
    if (!overrideText) setChatInput('');

    setChatTimeline(prev => [...prev, { sender: 'user', text, timestamp: new Date().toLocaleTimeString() }]);
    setRunning(true);
    setTraceLogs([`Starting sandbox run to fulfill directive: "${text}"`]);
    setDone(false);
    setError('');

    try {
      const localOpenaiKey = localStorage.getItem('orbit_openai_key') || '';
      const localGeminiKey = localStorage.getItem('orbit_gemini_key') || '';
      
      const res = await fetch('/api/agents/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-openai-api-key': localOpenaiKey,
          'x-gemini-api-key': localGeminiKey,
        },
        body: JSON.stringify({ agentId: agent.id, task: text }),
      });

      if (!res.ok) throw new Error(await res.text());
      const reader = res.body?.getReader();
      if (!reader) throw new Error('No streaming channel available');
      const decoder = new TextDecoder();
      let accumulatedResponse = '';

      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;
        const lines = decoder.decode(value).split('\n').filter(l => l.startsWith('data:'));
        for (const line of lines) {
          try {
            const event = JSON.parse(line.slice(5)) as { type: string; data: Record<string, unknown> };
            if (event.type === 'chunk') {
              const txt = event.data.text as string;
              accumulatedResponse += txt;
              
              setTraceLogs(p => {
                const copy = [...p];
                if (copy.length > 0 && !copy[copy.length - 1].startsWith('>')) {
                  copy[copy.length - 1] += txt;
                  return copy;
                }
                return [...copy, txt];
              });
            }
            if (event.type === 'tool') {
              setTraceLogs(p => [...p, `Executing tool: ${event.data.name}(${JSON.stringify(event.data.args)})`]);
            }
            if (event.type === 'done') {
              setTokens(event.data.tokens as number);
              setCost(event.data.cost as number);
              setDone(true);
              setTraceLogs(p => [...p, `Task executed completely.`]);
              
              setChatTimeline(p => [...p, {
                sender: 'agent',
                text: accumulatedResponse || `Requested scripts compiled and verified in your secure workspace sandbox. Inspect them in the file explorer on the right!`,
                timestamp: new Date().toLocaleTimeString()
              }]);
              loadWorkspaceFiles(currentPath);
            }
            if (event.type === 'error') {
              setError(event.data.message as string);
              setDone(true);
              setTraceLogs(p => [...p, `Execution failure: ${event.data.message}`]);
            }
          } catch { /* skip */ }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setTraceLogs(p => [...p, `API Error: ${msg}`]);
    } finally {
      setRunning(false);
    }
  };

  // Find index.html or html files inside files list
  const htmlFile = useMemo(() => {
    return files.find(f => f.name.endsWith('.html') || f.name.endsWith('.htm'));
  }, [files]);

  // Derived Autonomous Thinking Loop States from Trace Logs
  const activeThinkingStates = useMemo(() => {
    const combinedLogs = traceLogs.join('\n');
    return {
      planning: running || combinedLogs.includes('Planning Stage') || combinedLogs.includes('Starting sandbox run'),
      knowledge: combinedLogs.includes('Knowledge Retrieval') || combinedLogs.includes('Scanning repository'),
      codegen: combinedLogs.includes('Executing File Generation') || combinedLogs.includes('Executing tool: write_file'),
      compilation: combinedLogs.includes('Sandbox Compilation Check') || combinedLogs.includes('Executing tool: bash'),
      verified: combinedLogs.includes('Verified') || combinedLogs.includes('exit code 0') || combinedLogs.includes('Task executed completely')
    };
  }, [traceLogs, running]);

  const csvRows = useMemo(() => {
    if (!selectedFileContent || !selectedFile?.name.endsWith('.csv')) return [];
    return selectedFileContent.split('\n')
      .map(row => row.split(','))
      .filter(row => row.length > 1 && row.some(cell => cell.trim().length > 0));
  }, [selectedFileContent, selectedFile]);

  const spreadsheetStats = useMemo(() => {
    if (csvRows.length < 2) return null;
    const headers = csvRows[0].map(h => h.trim().toLowerCase());
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

  // Filters workspace file tree
  const filteredWorkspaceFiles = useMemo(() => {
    return files.filter(f => f.name.toLowerCase().includes(fileSearchQuery.toLowerCase()));
  }, [files, fileSearchQuery]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(3, 5, 12, 0.92)',
        backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: '#040713', border: `1px solid ${color}40`, borderRadius: 24,
        width: '96vw', maxWidth: 1550, height: '90vh', display: 'flex', flexDirection: 'column',
        overflow: 'hidden', boxShadow: `0 0 60px ${color}10`,
      }}>
        
        {/* Header */}
        <div style={{ padding: '14px 20px', borderBottom: `1px solid rgba(255,255,255,0.06)`, display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${color}33` }}>
            <AgentIcon size={18} style={{ color }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 850, fontSize: '0.95rem', color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
              {agent.name}
              <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.22)' }}>
                Autonomous Developer Workspace
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 1 }}>{agent.vibe}</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.04)', border: 'none', borderRadius: 8, width: 32, height: 32, color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
            <X size={16} />
          </button>
        </div>

        {/* Workspace Split Layout */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          
          {/* Left Column (Width: 38%) — Dialogue & Autonomous Thinking Graph */}
          <div style={{ width: '38%', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', background: '#040712' }}>
            
            {/* Scraper Bar */}
            <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
              <Globe size={13} style={{ color }} />
              <input
                value={scrapeUrl}
                onChange={e => setScrapeUrl(e.target.value)}
                placeholder="Paste URL to scrape page context..."
                disabled={isScraping}
                style={{ flex: 1, padding: '6px 10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#f1f5f9', fontSize: '0.75rem', outline: 'none', fontFamily: 'inherit' }}
              />
              <button
                onClick={handleScrapeURL}
                disabled={!scrapeUrl.trim() || isScraping}
                style={{
                  padding: '6px 14px', background: scrapeUrl.trim() ? color : 'rgba(255,255,255,0.05)',
                  border: 'none', borderRadius: 8, color: '#fff', fontSize: '0.72rem', fontWeight: 700,
                  cursor: scrapeUrl.trim() ? 'pointer' : 'not-allowed', transition: 'all 0.15s'
                }}
              >
                {isScraping ? 'Scraping...' : 'Scrape'}
              </button>
            </div>

            {/* Chat Timeline & Autonomous Reasoning Mind Map */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              
              {/* Dynamic Mind Loop Thinking Graph */}
              {(running || traceLogs.length > 0) && (
                <div style={{
                  border: '1px solid rgba(99, 102, 241, 0.12)',
                  borderRadius: 14,
                  background: 'rgba(99, 102, 241, 0.03)',
                  padding: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: 6 }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Cpu size={12} className={running ? 'animate-spin' : ''} />
                      Autonomous Thinking Loops
                    </span>
                    <span style={{ fontSize: '0.62rem', color: '#475569', fontFamily: 'monospace' }}>active track</span>
                  </div>

                  {/* Vertical Node Steps */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 4 }}>
                    {[
                      { key: 'planning', label: '1. Plan & Dependency Layout', desc: 'Parsing target objectives and setting up sandbox targets.' },
                      { key: 'knowledge', label: '2. Domain Knowledge Scan', desc: 'Searching specialized libraries and manuals.' },
                      { key: 'codegen', label: '3. Code Generation Pipeline', desc: 'Writing comprehensive operational scripts into workspace.' },
                      { key: 'compilation', label: '4. Sandbox Compiler Check', desc: 'Building scripts and verifying compiler outputs.' },
                      { key: 'verified', label: '5. Self-Correction & Verification', desc: 'Winding processes and finalizing outputs.' }
                    ].map((step) => {
                      const isActive = activeThinkingStates[step.key as keyof typeof activeThinkingStates];
                      const isComplete = done || (step.key === 'planning' && activeThinkingStates.knowledge) ||
                                        (step.key === 'knowledge' && activeThinkingStates.codegen) ||
                                        (step.key === 'codegen' && activeThinkingStates.compilation) ||
                                        (step.key === 'compilation' && activeThinkingStates.verified) ||
                                        (step.key === 'verified' && done);

                      return (
                        <div key={step.key} style={{ display: 'flex', gap: 10, position: 'relative' }}>
                          {/* Left bullet marker */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                            <div style={{
                              width: 14, height: 14, borderRadius: '50%',
                              background: isComplete ? '#10b981' : isActive ? color : 'rgba(255,255,255,0.05)',
                              border: `2px solid ${isComplete ? '#10b981' : isActive ? color : 'rgba(255,255,255,0.1)'}`,
                              boxShadow: isActive ? `0 0 8px ${color}` : 'none',
                              display: 'flex', alignItems: 'center', justifyItems: 'center',
                              transition: 'all 0.3s'
                            }}>
                              {isComplete && <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#fff', margin: 'auto' }} />}
                            </div>
                            <div style={{ width: 1.5, flex: 1, background: 'rgba(255,255,255,0.06)', minHeight: 12 }} />
                          </div>
                          {/* Step Content */}
                          <div>
                            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: isComplete ? '#34d399' : isActive ? '#fff' : '#475569', transition: 'color 0.3s' }}>
                              {step.label}
                            </div>
                            <div style={{ fontSize: '0.62rem', color: isComplete ? '#64748b' : isActive ? '#cbd5e1' : '#334155', marginTop: 2, transition: 'color 0.3s' }}>
                              {step.desc}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Real-time raw logs trace drawer */}
                  <div style={{ border: '1px solid rgba(255,255,255,0.04)', borderRadius: 8, background: '#020409', padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: '0.62rem', color: '#4b5563', fontWeight: 700, textTransform: 'uppercase' }}>Live Sandbox logs</span>
                    <div style={{ maxHeight: 110, overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.68rem', color: '#818cf8', display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {traceLogs.map((log, lIdx) => (
                        <div key={lIdx} style={{ whiteSpace: 'pre-wrap' }}>{log}</div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Chat timeline dialog logs */}
              {chatTimeline.map((msg, i) => {
                const isUser = msg.sender === 'user';
                return (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', alignSelf: isUser ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                    {!isUser && (
                      <div style={{ width: 26, height: 26, borderRadius: '50%', background: `${color}15`, border: `1px solid ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
                        <AgentIcon size={12} style={{ color }} />
                        <span style={{ position: 'absolute', bottom: -1, right: -1, width: 7, height: 7, borderRadius: '50%', background: '#10b981', border: '1.5px solid #040713', boxShadow: '0 0 4px #10b981' }} />
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.6rem', fontWeight: 800, color: isUser ? '#818cf8' : '#64748b', marginBottom: 2, paddingLeft: isUser ? 0 : 4, paddingRight: isUser ? 4 : 0, textAlign: isUser ? 'right' : 'left' }}>
                        {isUser ? 'You' : agent.name}
                      </span>
                      <div style={{
                        background: isUser ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)',
                        border: isUser ? '1px solid rgba(99,102,241,0.18)' : '1px solid rgba(255,255,255,0.05)',
                        borderRadius: isUser ? '14px 14px 0px 14px' : '0px 14px 14px 14px',
                        padding: '10px 14px',
                        color: isUser ? '#c7d2fe' : '#cbd5e1',
                        fontSize: '0.76rem',
                        lineHeight: 1.55
                      }}>
                        {msg.text}
                      </div>
                    </div>
                    {isUser && (
                      <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#c7d2fe' }}>U</span>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Cognitive Thinking Waves Typing Micro-Animation */}
              {running && !done && (
                <div style={{ display: 'flex', gap: 10, alignSelf: 'flex-start', maxWidth: '85%' }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: `${color}15`, border: `1px solid ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
                    <AgentIcon size={12} style={{ color }} />
                    <span style={{ position: 'absolute', bottom: -1, right: -1, width: 7, height: 7, borderRadius: '50%', background: '#10b981', border: '1.5px solid #040713', boxShadow: '0 0 4px #10b981' }} />
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
                    <span style={{ fontSize: '0.65rem', color, fontWeight: 700, marginRight: 4 }}>Cognitive Think Loop</span>
                    <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 10 }}>
                      <span style={{ width: 3, height: 6, borderRadius: 2, background: color, display: 'inline-block', animation: 'bounceWave 0.8s infinite ease-in-out' }} />
                      <span style={{ width: 3, height: 10, borderRadius: 2, background: '#8b5cf6', display: 'inline-block', animation: 'bounceWave 0.8s infinite ease-in-out 0.15s' }} />
                      <span style={{ width: 3, height: 8, borderRadius: 2, background: '#ec4899', display: 'inline-block', animation: 'bounceWave 0.8s infinite ease-in-out 0.3s' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Token telemetry stats */}
            {tokens > 0 && (
              <div style={{ padding: '8px 14px', background: '#020409', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, flexShrink: 0 }}>
                <div>
                  <div style={{ fontSize: '0.6rem', color: '#475569', fontWeight: 700, textTransform: 'uppercase' }}>Token Usage</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#f1f5f9', marginTop: 1 }}>{tokens.toLocaleString()} tokens</div>
                </div>
                <div style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', paddingLeft: 10 }}>
                  <div style={{ fontSize: '0.6rem', color: '#475569', fontWeight: 700, textTransform: 'uppercase' }}>Computed Cost</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#10b981', marginTop: 1 }}>${cost.toFixed(4)}</div>
                </div>
              </div>
            )}

            {/* Quick Interactive Prompt Starters Sliding Row */}
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '6px 12px', flexShrink: 0, scrollbarWidth: 'none', background: 'rgba(0,0,0,0.1)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              {promptStarters.map((starter) => (
                <button
                  key={starter.label}
                  type="button"
                  onClick={() => handleSendAgentMessage(starter.text)}
                  disabled={running}
                  style={{
                    whiteSpace: 'nowrap',
                    padding: '6px 12px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: 12,
                    color: '#cbd5e1',
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    cursor: running ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                  onMouseEnter={e => {
                    if (!running) {
                      e.currentTarget.style.background = `${color}15`;
                      e.currentTarget.style.borderColor = `${color}35`;
                      e.currentTarget.style.color = '#fff';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!running) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                      e.currentTarget.style.color = '#cbd5e1';
                    }
                  }}
                >
                  {starter.label}
                </button>
              ))}
            </div>

            {/* Chat Input Bar */}
            <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.05)', background: '#02040a', display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
              <button
                type="button"
                onClick={handleMicClick}
                disabled={isListening || running}
                style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: isListening ? `${color}20` : 'rgba(255,255,255,0.03)',
                  border: isListening ? `1.5px solid ${color}` : '1px solid rgba(255,255,255,0.06)',
                  color: isListening ? color : '#cbd5e1',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: isListening || running ? 'not-allowed' : 'pointer',
                  fontSize: '0.85rem',
                  boxShadow: isListening ? `0 0 12px ${color}30` : 'none',
                  transition: 'all 0.2s'
                }}
                title="Simulate AI Voice Input dictation"
              >
                {isListening ? '🎙️' : '🎤'}
              </button>
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSendAgentMessage(); }}
                placeholder={isListening ? 'Listening dictation...' : `Instruct ${agent.name} autonomously...`}
                disabled={running || isListening}
                style={{
                  flex: 1, padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 10, color: '#f1f5f9', fontSize: '0.78rem', outline: 'none', fontFamily: 'inherit'
                }}
              />
              <button
                onClick={() => handleSendAgentMessage()}
                disabled={(!chatInput.trim() && !isListening) || running}
                style={{
                  padding: '10px 16px',
                  background: chatInput.trim() && !running ? color : 'rgba(255,255,255,0.04)',
                  border: 'none', borderRadius: 10, color: '#fff', fontSize: '0.75rem', fontWeight: 800,
                  cursor: chatInput.trim() && !running ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 6,
                  boxShadow: chatInput.trim() && !running ? `0 4px 14px ${color}30` : 'none',
                  transition: 'all 0.2s'
                }}
              >
                <Send size={12} />
                Send
              </button>
            </div>

          </div>

          {/* Right Column (Width: 62%) — Code IDE Sandbox / Live Browser Viewport / Specialized Knowledge */}
          <div style={{ width: '62%', display: 'flex', flexDirection: 'column', background: '#040713', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
            
            {/* Top Workspace Bar */}
            <div style={{ padding: '10px 16px', background: '#070c1e', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 22, height: 22, borderRadius: 4, background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${color}30` }}>
                  <Code size={12} style={{ color }} />
                </div>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.01em' }}>
                  orbit-workspace/agents/{agent.id}/
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => {
                    localStorage.removeItem('orbit_chat_timeline_' + agent.id);
                    localStorage.removeItem('orbit_trace_logs_' + agent.id);
                    localStorage.removeItem('orbit_tokens_' + agent.id);
                    localStorage.removeItem('orbit_cost_' + agent.id);
                    setChatTimeline([
                      { sender: 'agent', text: `Greetings! I am the **${agent.name}** agent. I've initiated a secure sandbox workspace directory. What goal or code asset should we engineer today?`, timestamp: new Date().toLocaleTimeString() }
                    ]);
                    setTraceLogs([]);
                    setTokens(0);
                    setCost(0);
                    setSelectedFile(null);
                  }}
                  style={{ padding: '5px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, color: '#f87171', fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s' }}
                >
                  <RotateCcw size={11} />
                  Reset Session
                </button>
                <button
                  onClick={() => loadWorkspaceFiles(currentPath)}
                  style={{ padding: '5px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#f1f5f9', fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s' }}
                >
                  <RefreshCw size={11} />
                  Refresh Files
                </button>
                <a
                  href={`/api/workspace/download?agentId=${encodeURIComponent(agent.id)}`}
                  download={`${agent.id}-workspace.zip`}
                  style={{ padding: '5px 12px', background: color, borderRadius: 8, color: '#fff', fontSize: '0.68rem', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s' }}
                >
                  <Download size={11} />
                  Zip Workspace
                </a>
              </div>
            </div>

            {/* Main Tabs Workspace Frame */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#050812' }}>
              
              {activeXlsTab === 'sheet' && (
                /* Premium Sandbox Code IDE View */
                <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                  
                  {/* IDE File Sidebar Explorer */}
                  <div style={{ width: '28%', borderRight: '1px solid rgba(255,255,255,0.06)', background: '#040713', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: 10, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', position: 'relative' }}>
                      <Search size={12} style={{ position: 'absolute', left: 18, color: '#475569' }} />
                      <input
                        value={fileSearchQuery}
                        onChange={e => setFileSearchQuery(e.target.value)}
                        placeholder="Search files..."
                        style={{
                          width: '100%', padding: '5px 10px 5px 26px', background: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, color: '#cbd5e1',
                          fontSize: '0.72rem', outline: 'none', fontFamily: 'inherit'
                        }}
                      />
                    </div>
                    
                    {/* Files Tree Navigation */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
                      {filteredWorkspaceFiles.length === 0 ? (
                        <div style={{ padding: '24px 10px', textAlign: 'center', color: '#475569', fontSize: '0.72rem', fontStyle: 'italic' }}>
                          No files found.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {filteredWorkspaceFiles.map((file, idx) => {
                            const isSelected = selectedFile?.path === file.path;
                            const isRust = file.name.endsWith('.rs');
                            const isPython = file.name.endsWith('.py');
                            const isHtml = file.name.endsWith('.html');
                            const isJs = file.name.endsWith('.js') || file.name.endsWith('.ts');

                            return (
                              <div
                                key={idx}
                                onClick={() => handleViewFile(file)}
                                style={{
                                  padding: '8px 10px',
                                  borderRadius: 8,
                                  background: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                                  border: `1px solid ${isSelected ? 'rgba(99, 102, 241, 0.15)' : 'transparent'}`,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  transition: 'all 0.15s'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                                  <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>
                                    {file.type === 'dir' ? '📁' : isRust ? '🦀' : isPython ? '🐍' : isHtml ? '🌐' : isJs ? '🟨' : '📝'}
                                  </span>
                                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isSelected ? '#fff' : '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {file.name}
                                  </span>
                                </div>
                                <span style={{ fontSize: '0.6rem', color: '#475569', fontFamily: 'monospace' }}>
                                  {(file.size / 1024).toFixed(1)}K
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Monaco Code Editor Workspace */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    {selectedFile ? (
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                        {/* Editor Header Action Bar */}
                        <div style={{ padding: '8px 14px', background: '#070c1e', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#f1f5f9', fontFamily: 'monospace' }}>
                              {selectedFile.name}
                            </span>
                            <span style={{ fontSize: '0.62rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#64748b', padding: '1px 6px', borderRadius: 4 }}>
                              {selectedFile.name.split('.').pop()?.toUpperCase() ?? 'FILE'}
                            </span>
                          </div>
                          
                          {/* File control triggers */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {isEditing ? (
                              <>
                                <button
                                  onClick={handleSaveFile}
                                  disabled={savingFile}
                                  style={{ padding: '4px 10px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                                >
                                  {savingFile ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
                                  Save File
                                </button>
                                <button
                                  onClick={() => { setIsEditing(false); setEditedContent(selectedFileContent); }}
                                  style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1', borderRadius: 6, fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer' }}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => setIsEditing(true)}
                                style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1', borderRadius: 6, fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer' }}
                              >
                                Edit Source
                              </button>
                            )}

                            {/* Run Script compiler button */}
                            {(selectedFile.name.endsWith('.py') || selectedFile.name.endsWith('.rs') || selectedFile.name.endsWith('.js') || selectedFile.name.endsWith('.ts') || selectedFile.name.endsWith('.sh')) && (
                              <button
                                onClick={handleExecuteScript}
                                disabled={executingScript}
                                style={{
                                  padding: '4px 12px',
                                  background: executingScript ? 'rgba(255,255,255,0.04)' : 'linear-gradient(135deg, #10b981, #059669)',
                                  border: 'none',
                                  borderRadius: 6,
                                  color: '#fff',
                                  fontSize: '0.68rem',
                                  fontWeight: 800,
                                  cursor: executingScript ? 'not-allowed' : 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4
                                }}
                              >
                                {executingScript ? (
                                  <>
                                    <Loader2 size={11} className="animate-spin" />
                                    <span>Compiling...</span>
                                  </>
                                ) : (
                                  <>
                                    <Play size={11} />
                                    <span>Run Sandbox Script</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Monaco Editor Textarea Body */}
                        <div style={{ flex: execResult || execError ? '0 0 60%' : '1', minHeight: 0, display: 'flex', overflow: 'hidden', background: '#050812' }}>
                          {loadingFile ? (
                            <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                              <Loader2 className="animate-spin" size={24} />
                            </div>
                          ) : isEditing ? (
                            <textarea
                              value={editedContent}
                              onChange={e => setEditedContent(e.target.value)}
                              style={{
                                flex: 1,
                                height: '100%',
                                background: '#03050c',
                                border: 'none',
                                outline: 'none',
                                color: '#a7f3d0',
                                padding: 14,
                                fontFamily: '"Fira Code", "Consolas", monospace',
                                fontSize: '0.76rem',
                                lineHeight: 1.6,
                                resize: 'none'
                              }}
                            />
                          ) : selectedFile.name.endsWith('.csv') ? (
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
                                      <div key={idx} style={{ width: 14, height: `${percentHeight}%`, background: `linear-gradient(to top, ${color}, #8b5cf6)`, borderRadius: '3px 3px 0 0', position: 'relative' }} title={`Segment Profit: $${revenueVal}`}>
                                        <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', padding: '2px 4px', background: '#000', color: '#fff', fontSize: '0.5rem', borderRadius: 3, opacity: 0, transition: 'opacity 0.2s', whiteSpace: 'nowrap' }} className="tooltip">${revenueVal}</div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          ) : (selectedFile.name.endsWith('.md') || selectedFile.name.endsWith('.docx') || selectedFile.name.endsWith('.pdf')) ? (
                            /* Premium Editorial Word Document / Proposal Viewport */
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#090d1a', overflowY: 'auto', padding: 24 }}>
                              <div style={{ maxWidth: 700, width: '100%', margin: '0 auto', background: '#040713', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: '32px 40px', boxShadow: '0 12px 40px rgba(0,0,0,0.5)', position: 'relative', overflow: 'hidden' }}>
                                {/* Elegant Left Accent Ribbon */}
                                <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 4, background: `linear-gradient(to bottom, ${color}, #8b5cf6)` }} />
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Orbit Corporate Swarm Brief</div>
                                  <span style={{ fontSize: '0.62rem', background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)', padding: '2px 8px', borderRadius: 12, fontWeight: 700 }}>VERIFIED DOCUMENT</span>
                                </div>

                                {/* Custom Simple MD Parser for Sleek Typography */}
                                <div style={{ color: '#cbd5e1', lineHeight: 1.7, fontSize: '0.8rem' }}>
                                  {selectedFileContent.split('\n').map((line, lIdx) => {
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
                                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#fff', fontFamily: 'cursive', marginTop: 2, transform: 'rotate(-2deg)' }}>{agent.name} Swarm</div>
                                  </div>
                                  <div style={{ width: 45, height: 45, borderRadius: '50%', background: `${color}15`, border: `1.5px dashed ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span style={{ fontSize: '0.8rem' }}>🛡️</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* Premium Code Sandbox Viewer */
                            <div style={{ flex: 1, display: 'flex', overflow: 'auto', background: '#03050c' }}>
                              {/* Fake Monaco line numbers */}
                              <div style={{
                                width: 40, background: 'rgba(255,255,255,0.01)', borderRight: '1px solid rgba(255,255,255,0.03)',
                                padding: '14px 0', display: 'flex', flexDirection: 'column', alignItems: 'center',
                                color: '#334155', fontFamily: 'monospace', fontSize: '0.72rem', userSelect: 'none', pointerEvents: 'none'
                              }}>
                                {selectedFileContent.split('\n').map((_, numIdx) => (
                                  <div key={numIdx} style={{ height: 20 }}>{numIdx + 1}</div>
                                ))}
                              </div>
                              <pre style={{
                                flex: 1, margin: 0, padding: 14,
                                fontFamily: '"Fira Code", "Consolas", monospace', fontSize: '0.75rem',
                                color: '#818cf8', lineHeight: 1.6, whiteSpace: 'pre-wrap'
                              }}>
                                {selectedFileContent || '(file is empty)'}
                              </pre>
                            </div>
                          )}
                        </div>

                        {/* Dynamic compiler console terminal */}
                        {(execResult || execError) && (
                          <div style={{ flex: 1, background: '#020408', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            <div style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.68rem', fontWeight: 800, color: '#64748b' }}>
                                <TerminalIcon size={12} style={{ color: '#10b981' }} />
                                <span>Sandbox Compiler Execution Logs</span>
                              </div>
                              <div style={{ display: 'flex', gap: 6 }}>
                                {execResult && (
                                  <span style={{ fontSize: '0.6rem', padding: '1px 6px', borderRadius: 4, background: execResult.success ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: execResult.success ? '#34d399' : '#f87171', border: `1px solid ${execResult.success ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`, fontWeight: 700 }}>
                                    {execResult.success ? 'SUCCESS' : 'FAILED (EXIT ' + execResult.exitCode + ')'}
                                  </span>
                                )}
                                {execResult && (
                                  <span style={{ fontSize: '0.6rem', padding: '1px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.04)', color: '#64748b', fontFamily: 'monospace' }}>
                                    {execResult.executionTimeMs}ms
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', fontFamily: '"Fira Code", "Consolas", monospace', fontSize: '0.7rem', lineHeight: 1.5 }}>
                              {execResult && execResult.commandExecuted && (
                                <div style={{ color: '#475569', marginBottom: 6 }}>$ {execResult.commandExecuted}</div>
                              )}
                              {execError && (
                                <div style={{ color: '#f87171' }}>System Error: {execError}</div>
                              )}
                              {execResult && execResult.stdout && (
                                <pre style={{ color: '#a7f3d0', margin: 0, whiteSpace: 'pre-wrap' }}>{execResult.stdout}</pre>
                              )}
                              {execResult && execResult.stderr && (
                                <pre style={{ color: '#f87171', margin: 0, whiteSpace: 'pre-wrap' }}>{execResult.stderr}</pre>
                              )}
                            </div>
                          </div>
                        )}

                      </div>
                    ) : (
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#64748b', textAlign: 'center', padding: 24 }}>
                        <Code size={40} style={{ marginBottom: 12, color, opacity: 0.3 }} />
                        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f1f5f9' }}>No File Selected</div>
                        <p style={{ fontSize: '0.75rem', color: '#475569', maxWidth: 300, marginTop: 4 }}>
                          Select any sandboxed script in the explorer tree to view, compile, or run it inside the sandbox.
                        </p>
                      </div>
                    )}
                  </div>

                </div>
              )}

              {activeXlsTab === 'preview' && (
                /* Addressed Browser Viewport Preview Frame */
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#090d16' }}>
                  
                  {/* Viewport Control Bar */}
                  <div style={{ padding: '8px 16px', background: '#070c1e', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                    
                    {/* Device dimensions selectors */}
                    <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.03)', padding: 2, borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                      {[
                        { key: 'desktop', label: 'Desktop', icon: '💻' },
                        { key: 'tablet', label: 'Tablet (768px)', icon: '📱' },
                        { key: 'mobile', label: 'Mobile (375px)', icon: '📞' }
                      ].map(dev => (
                        <button
                          key={dev.key}
                          onClick={() => setPreviewDevice(dev.key as any)}
                          style={{
                            padding: '3px 8px', borderRadius: 6, border: 'none',
                            background: previewDevice === dev.key ? color : 'transparent',
                            color: '#fff', fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s'
                          }}
                        >
                          <span>{dev.icon}</span>
                          <span>{dev.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Fake addressed address field */}
                    <div style={{
                      flex: 1, display: 'flex', alignItems: 'center', gap: 6,
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 8, padding: '4px 10px', fontSize: '0.72rem', color: '#475569', fontFamily: 'monospace'
                    }}>
                      <span style={{ color: '#10b981' }}>🔒 https://</span>
                      <span style={{ color: '#cbd5e1' }}>sandbox.orbit.ai/agents/{agent.id}/{htmlFile ? htmlFile.name : 'index.html'}</span>
                    </div>

                    <button
                      onClick={() => setIframeKey(k => k + 1)}
                      style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff', fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Reload
                    </button>
                  </div>

                  {/* Browser Sandbox viewport Frame wrapper */}
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, overflow: 'auto' }}>
                    {htmlFile ? (
                      <div style={{
                        width: previewDevice === 'desktop' ? '100%' : previewDevice === 'tablet' ? 768 : 375,
                        height: '100%',
                        maxHeight: '100%',
                        background: '#fff',
                        borderRadius: 14,
                        overflow: 'hidden',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'all 0.30s cubic-bezier(0.16, 1, 0.3, 1)'
                      }}>
                        <iframe
                          key={iframeKey}
                          src={`/api/workspace/download?path=${encodeURIComponent(htmlFile.path)}&agentId=${encodeURIComponent(agent.id)}`}
                          style={{ flex: 1, border: 'none', background: '#fff' }}
                          title="Sandbox Web Viewport"
                          sandbox="allow-scripts allow-same-origin"
                        />
                      </div>
                    ) : (
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#64748b', textAlign: 'center', padding: 24 }}>
                        <Globe size={40} style={{ marginBottom: 12, color, opacity: 0.3 }} />
                        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f1f5f9' }}>No HTML Web Deliverable Found</div>
                        <p style={{ fontSize: '0.75rem', color: '#475569', maxWidth: 300, marginTop: 4 }}>
                          Instruct this agent to build a landing page or output an \`index.html\` layout to watch it render live here!
                        </p>
                      </div>
                    )}
                  </div>

                </div>
              )}

              {activeXlsTab === 'downloads' && (
                /* Premium Specialized Knowledge Base Search Tab */
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  
                  {/* Knowledge Search Ribbon */}
                  <div style={{ padding: '10px 16px', background: '#070c1e', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <BookOpen size={14} style={{ color }} />
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap' }}>
                      {agent.category.toUpperCase()} Knowledge Search
                    </span>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <Search size={12} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
                      <input
                        value={knowledgeQuery}
                        onChange={e => { setKnowledgeQuery(e.target.value); loadKnowledge(e.target.value); }}
                        placeholder="Search standard manuals, guidelines, syntax structures..."
                        style={{
                          width: '100%', padding: '6px 12px 6px 32px', background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#cbd5e1',
                          fontSize: '0.76rem', outline: 'none', fontFamily: 'inherit'
                        }}
                      />
                    </div>
                  </div>

                  {/* Manuals details list */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
                    {searchingKnowledge ? (
                      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                        <Loader2 className="animate-spin" size={24} />
                      </div>
                    ) : knowledgeDocs.length === 0 ? (
                      <div style={{ padding: '60px 20px', border: '2px dashed rgba(255,255,255,0.04)', borderRadius: 14, textAlign: 'center', color: '#475569' }}>
                        <BookOpen size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1' }}>No reference matches found</div>
                        <p style={{ fontSize: '0.72rem', marginTop: 4 }}>Try broad keywords like "rust", "react", "seo", or "metrics".</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {knowledgeDocs.map((doc) => (
                          <div
                            key={doc.id}
                            style={{
                              background: 'rgba(255,255,255,0.01)',
                              border: '1px solid rgba(255,255,255,0.05)',
                              borderRadius: 14,
                              padding: 16,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 12
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                              <div>
                                <h4 style={{ fontSize: '0.86rem', fontWeight: 800, color: '#fff' }}>{doc.title}</h4>
                                <span style={{ fontSize: '0.65rem', color: '#4b5563', display: 'block', marginTop: 3 }}>Source: {doc.source}</span>
                              </div>
                              <div style={{ display: 'flex', gap: 4 }}>
                                {doc.tags.map(tag => (
                                  <span key={tag} style={{ fontSize: '0.58rem', padding: '2px 6px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#64748b' }}>
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <pre style={{
                              background: '#020409',
                              border: '1px solid rgba(255,255,255,0.03)',
                              borderRadius: 10,
                              padding: 14,
                              fontFamily: '"Fira Code", "Consolas", monospace',
                              fontSize: '0.7rem',
                              lineHeight: 1.55,
                              color: '#94a3b8',
                              whiteSpace: 'pre-wrap',
                              maxHeight: 250,
                              overflowY: 'auto'
                            }}>
                              {doc.content}
                            </pre>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              )}

            </div>

            {/* Bottom IDE tabs navigator */}
            <div style={{ padding: '6px 16px', background: '#070c1e', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                
                {/* Tab 1: IDE Sandbox */}
                <button
                  onClick={() => setActiveXlsTab('sheet')}
                  style={{
                    padding: '6px 12px',
                    background: activeXlsTab === 'sheet' ? '#040713' : 'transparent',
                    border: 'none',
                    borderTop: activeXlsTab === 'sheet' ? `2px solid ${color}` : '2px solid transparent',
                    borderLeft: activeXlsTab === 'sheet' ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
                    borderRight: activeXlsTab === 'sheet' ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
                    borderRadius: '4px 4px 0 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '0.72rem',
                    fontWeight: 750,
                    color: activeXlsTab === 'sheet' ? color : '#64748b',
                    cursor: 'pointer'
                  }}
                >
                  <Code size={11} />
                  Code IDE Sandbox
                </button>

                {/* Tab 2: Browser Viewport */}
                <button
                  onClick={() => setActiveXlsTab('preview')}
                  style={{
                    padding: '6px 12px',
                    background: activeXlsTab === 'preview' ? '#040713' : 'transparent',
                    border: 'none',
                    borderTop: activeXlsTab === 'preview' ? `2px solid ${color}` : '2px solid transparent',
                    borderLeft: activeXlsTab === 'preview' ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
                    borderRight: activeXlsTab === 'preview' ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
                    borderRadius: '4px 4px 0 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '0.72rem',
                    fontWeight: 750,
                    color: activeXlsTab === 'preview' ? color : '#64748b',
                    cursor: 'pointer'
                  }}
                >
                  <Globe size={11} />
                  Live Browser Viewport
                  {htmlFile && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />}
                </button>

                {/* Tab 3: Specialized Knowledge */}
                <button
                  onClick={() => setActiveXlsTab('downloads')}
                  style={{
                    padding: '6px 12px',
                    background: activeXlsTab === 'downloads' ? '#040713' : 'transparent',
                    border: 'none',
                    borderTop: activeXlsTab === 'downloads' ? `2px solid ${color}` : '2px solid transparent',
                    borderLeft: activeXlsTab === 'downloads' ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
                    borderRight: activeXlsTab === 'downloads' ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
                    borderRadius: '4px 4px 0 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '0.72rem',
                    fontWeight: 750,
                    color: activeXlsTab === 'downloads' ? color : '#64748b',
                    cursor: 'pointer'
                  }}
                >
                  <BookOpen size={11} />
                  Specialized Knowledge Base
                </button>

              </div>
              <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>
                {files.length} Files loaded · {knowledgeDocs.length} Manuals
              </span>
            </div>

          </div>

        </div>

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

// ─── Main Agents Showcase Grid Page ──────────────────────────────────────────
export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  useEffect(() => {
    fetch('/api/agents')
      .then(res => res.json())
      .then((data: { agents: Agent[] }) => setAgents(data.agents || []))
      .catch(() => {});

    // Pre-populate search query if redirected from landing page
    const savedQuery = localStorage.getItem("orbit_landing_search_query");
    if (savedQuery) {
      setSearchQuery(savedQuery);
      localStorage.removeItem("orbit_landing_search_query");
    }
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(agents.map(a => a.category));
    return ['all', ...Array.from(cats)];
  }, [agents]);

  const filteredAgents = useMemo(() => {
    return agents.filter(agent => {
      const matchesSearch =
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || agent.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [agents, searchQuery, selectedCategory]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: 'Inter, sans-serif' }}>
      
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.03em', margin: 0, background: 'linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 50%, #94a3b8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'flex', alignItems: 'center', gap: 10 }}>
            Specialized AI Agents
            <span style={{ fontSize: '0.62rem', padding: '3px 8px', borderRadius: 20, background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.22)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Autonomous Studio
            </span>
          </h1>
          <p style={{ color: '#64748b', margin: '0.3rem 0 0', fontSize: '0.85rem', fontWeight: 500 }}>
            Configure and run specialized autonomous agents in secure developer sandboxes with knowledge base search and addressed live preview viewports.
          </p>
        </div>
      </div>

      {/* Filter ribbon */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 16 }}>
        <div style={{ position: 'relative', width: 280 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search specialized skills..."
            style={{
              width: '100%', padding: '8px 12px 8px 34px', background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#f1f5f9',
              fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', flex: 1, paddingBottom: 4 }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '6px 14px', borderRadius: 20, border: 'none',
                background: selectedCategory === cat ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.02)',
                color: selectedCategory === cat ? '#818cf8' : '#64748b',
                fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.15s',
                borderWidth: 1, borderStyle: 'solid', borderColor: selectedCategory === cat ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.05)',
                textTransform: 'capitalize', whiteSpace: 'nowrap'
              }}
            >
              {cat.replace(/-/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Agents Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {filteredAgents.map(agent => {
          const color = getColor(agent.color);
          const AgentIcon = getIcon(agent.emoji);
          
          return (
            <div
              key={agent.id}
              onClick={() => setSelectedAgent(agent)}
              style={{
                background: 'rgba(6,9,18,0.4)', border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: 16, padding: 18, cursor: 'pointer', display: 'flex', flexDirection: 'column',
                gap: 12, transition: 'all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)', position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = `${color}44`;
                e.currentTarget.style.boxShadow = `0 10px 30px ${color}0c`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Central gradient backdrop glow */}
              <div style={{
                position: 'absolute', right: -20, top: -20, width: 80, height: 80, borderRadius: '50%',
                background: color, filter: 'blur(35px)', opacity: 0.15, pointerEvents: 'none'
              }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: `${color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${color}25` }}>
                  <AgentIcon size={16} style={{ color }} />
                </div>
                <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {agent.category.replace(/-/g, ' ')}
                </span>
              </div>

              <div>
                <h3 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#f1f5f9', margin: 0 }}>{agent.name}</h3>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4, lineHeight: 1.45, minHeight: 40 }}>
                  {agent.description}
                </p>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: '#475569', fontWeight: 600 }}>
                <span>{agent.vibe}</span>
                <span style={{ color, display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}>
                  Deploy Sandbox
                  <ArrowUpRight size={11} />
                </span>
              </div>

            </div>
          );
        })}
      </div>

      {/* Conversational Sandbox Modal overlay */}
      {selectedAgent && (
        <AgentWorkspaceModal
          agent={selectedAgent}
          onClose={() => setSelectedAgent(null)}
        />
      )}

      {/* Global transitions */}
      <style jsx global>{`
        @keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:1} }
        @keyframes fadeIn { from{opacity:0; transform:translateY(8px)} to{opacity:1; transform:translateY(0)} }
      `}</style>

    </div>
  );
}
