'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play, Plus, Trash2, Settings, Sparkles, RefreshCw, Layers,
  Mail, Terminal, CheckCircle2, AlertCircle, X, ZoomIn, ZoomOut,
  Cpu, Globe, Database, Code2, Webhook, Clock, GitBranch,
  ChevronDown, Search, Filter, MoreHorizontal, Copy, Maximize2
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Port { id: string; label: string; type: 'input' | 'output'; }

interface NodeDef {
  id: string;
  type: string;
  label: string;
  x: number;
  y: number;
  status: 'idle' | 'running' | 'success' | 'error';
  output?: string;
  durationMs?: number;
  tokens?: number;
  config?: Record<string, string>;
  description?: string;
  color: string;
  icon: React.ElementType;
  inputs: Port[];
  outputs: Port[];
}

interface Edge {
  id: string;
  fromNodeId: string;
  fromPortId: string;
  toNodeId: string;
  toPortId: string;
}

interface DragEdge {
  fromNodeId: string;
  fromPortId: string;
  x: number;
  y: number;
}

// ─── Node type catalog ───────────────────────────────────────────────────────

const NODE_CATALOG = [
  { type: 'trigger',    label: 'Manual Trigger',   color: '#6366f1', icon: Play,      inputs: [],                                   outputs: [{ id: 'out', label: 'Output', type: 'output' as const }], description: 'Manually start the workflow' },
  { type: 'schedule',   label: 'Schedule',          color: '#8b5cf6', icon: Clock,     inputs: [],                                   outputs: [{ id: 'out', label: 'Output', type: 'output' as const }], description: 'Run on a cron schedule' },
  { type: 'webhook',    label: 'Webhook',            color: '#06b6d4', icon: Webhook,   inputs: [],                                   outputs: [{ id: 'out', label: 'Output', type: 'output' as const }], description: 'Trigger via HTTP webhook' },
  { type: 'agent',      label: 'AI Agent',           color: '#10b981', icon: Sparkles,  inputs: [{ id: 'in', label: 'Input', type: 'input' as const }],   outputs: [{ id: 'out', label: 'Output', type: 'output' as const }], description: 'Run an AI agent task' },
  { type: 'code',       label: 'Code',               color: '#f59e0b', icon: Code2,     inputs: [{ id: 'in', label: 'Input', type: 'input' as const }],   outputs: [{ id: 'out', label: 'Output', type: 'output' as const }], description: 'Execute custom code' },
  { type: 'http',       label: 'HTTP Request',       color: '#3b82f6', icon: Globe,     inputs: [{ id: 'in', label: 'Input', type: 'input' as const }],   outputs: [{ id: 'out', label: 'Output', type: 'output' as const }, { id: 'err', label: 'Error', type: 'output' as const }], description: 'Call an external API' },
  { type: 'database',   label: 'Database',           color: '#ec4899', icon: Database,  inputs: [{ id: 'in', label: 'Input', type: 'input' as const }],   outputs: [{ id: 'out', label: 'Output', type: 'output' as const }], description: 'Query or update database' },
  { type: 'email',      label: 'Send Email',         color: '#22c55e', icon: Mail,      inputs: [{ id: 'in', label: 'Input', type: 'input' as const }],   outputs: [{ id: 'out', label: 'Sent', type: 'output' as const }], description: 'Send an email notification' },
  { type: 'branch',     label: 'If / Branch',        color: '#f97316', icon: GitBranch, inputs: [{ id: 'in', label: 'Input', type: 'input' as const }],   outputs: [{ id: 'true', label: 'True', type: 'output' as const }, { id: 'false', label: 'False', type: 'output' as const }], description: 'Conditional logic' },
  { type: 'terminal',   label: 'Shell Command',      color: '#94a3b8', icon: Terminal,  inputs: [{ id: 'in', label: 'Input', type: 'input' as const }],   outputs: [{ id: 'out', label: 'Output', type: 'output' as const }], description: 'Run a shell command' },
  { type: 'mcp',        label: 'MCP Tool',           color: '#a78bfa', icon: Cpu,       inputs: [{ id: 'in', label: 'Input', type: 'input' as const }],   outputs: [{ id: 'out', label: 'Output', type: 'output' as const }], description: 'Call an MCP tool' },
];

// ─── Default canvas ──────────────────────────────────────────────────────────

function makeNode(catalogType: string, x: number, y: number, id?: string): NodeDef {
  const cat = NODE_CATALOG.find(c => c.type === catalogType) || NODE_CATALOG[0];
  return {
    id: id || `node-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: cat.type,
    label: cat.label,
    x, y,
    status: 'idle',
    color: cat.color,
    icon: cat.icon,
    inputs: cat.inputs.map(p => ({ ...p })),
    outputs: cat.outputs.map(p => ({ ...p })),
    description: cat.description,
    output: '',
    config: {},
  };
}

const INITIAL_NODES: NodeDef[] = [
  { ...makeNode('trigger', 80, 200, 'n1'), label: 'Manual Trigger' },
  { ...makeNode('agent',   340, 100, 'n2'), label: 'Architecture Agent' },
  { ...makeNode('code',    600, 100, 'n3'), label: 'Code Generator' },
  { ...makeNode('http',    860, 200, 'n4'), label: 'API Request' },
  { ...makeNode('email',   600, 320, 'n5'), label: 'Email Report' },
];

const INITIAL_EDGES: Edge[] = [
  { id: 'e1', fromNodeId: 'n1', fromPortId: 'out', toNodeId: 'n2', toPortId: 'in' },
  { id: 'e2', fromNodeId: 'n2', fromPortId: 'out', toNodeId: 'n3', toPortId: 'in' },
  { id: 'e3', fromNodeId: 'n3', fromPortId: 'out', toNodeId: 'n4', toPortId: 'in' },
  { id: 'e4', fromNodeId: 'n3', fromPortId: 'out', toNodeId: 'n5', toPortId: 'in' },
];

// ─── Port dot component ──────────────────────────────────────────────────────

const NODE_W = 200;
const PORT_SIZE = 11;
const PORT_Y_CENTER = 44; // vertical center of node header

function portScreenPos(node: NodeDef, portId: string, portType: 'input' | 'output') {
  const ports = portType === 'input' ? node.inputs : node.outputs;
  const idx = ports.findIndex(p => p.id === portId);
  const count = ports.length;
  const startY = 40 + (idx + 1) * (40 / (count + 1));
  return {
    x: portType === 'input' ? node.x : node.x + NODE_W,
    y: node.y + startY,
  };
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function WorkflowsPage() {
  const [nodes, setNodes] = useState<NodeDef[]>(INITIAL_NODES);
  const [edges, setEdges] = useState<Edge[]>(INITIAL_EDGES);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const [dragEdge, setDragEdge] = useState<DragEdge | null>(null);
  const [running, setRunning] = useState(false);
  const [goal, setGoal] = useState('');
  const [showCatalog, setShowCatalog] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [totalTokens, setTotalTokens] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [execLog, setExecLog] = useState<string[]>([]);
  const [showLog, setShowLog] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const selectedNode = nodes.find(n => n.id === selectedId) || null;

  // ── Wheel zoom ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.08 : 0.93;
      setScale(s => Math.min(2.5, Math.max(0.2, s * factor)));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // Pre-populate search query / goal if redirected from landing page with a query
  useEffect(() => {
    const savedQuery = localStorage.getItem("orbit_landing_search_query");
    if (savedQuery) {
      setGoal(savedQuery);
      localStorage.removeItem("orbit_landing_search_query");
    }
  }, []);

  // ── Escape to cancel wiring ─────────────────────────────────────────────────
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') { setDragEdge(null); setSelectedId(null); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  // ── Canvas mouse down ───────────────────────────────────────────────────────
  const onCanvasMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement) === canvasRef.current || (e.target as HTMLElement).classList.contains('grid-bg')) {
      setIsPanning(true);
      setSelectedId(null);
      panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const onCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y });
    } else if (draggingNodeId) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const cx = (e.clientX - rect.left - pan.x) / scale;
        const cy = (e.clientY - rect.top - pan.y) / scale;
        setNodes(prev => prev.map(n => n.id === draggingNodeId
          ? { ...n, x: Math.round(cx - dragOffset.current.x), y: Math.round(cy - dragOffset.current.y) }
          : n));
      }
    } else if (dragEdge) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        setDragEdge(d => d ? { ...d, x: (e.clientX - rect.left - pan.x) / scale, y: (e.clientY - rect.top - pan.y) / scale } : null);
      }
    }
  };

  const onCanvasMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
  };

  const onNodeMouseDown = (e: React.MouseEvent, node: NodeDef) => {
    e.stopPropagation();
    setSelectedId(node.id);
    setDraggingNodeId(node.id);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      dragOffset.current = {
        x: (e.clientX - rect.left - pan.x) / scale - node.x,
        y: (e.clientY - rect.top - pan.y) / scale - node.y,
      };
    }
  };

  const startWire = (e: React.MouseEvent, node: NodeDef, portId: string) => {
    e.stopPropagation();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pos = portScreenPos(node, portId, 'output');
    setDragEdge({ fromNodeId: node.id, fromPortId: portId, x: pos.x, y: pos.y });
  };

  const finishWire = (e: React.MouseEvent, node: NodeDef, portId: string) => {
    e.stopPropagation();
    if (!dragEdge || dragEdge.fromNodeId === node.id) { setDragEdge(null); return; }
    const exists = edges.some(ed => ed.fromNodeId === dragEdge.fromNodeId && ed.toNodeId === node.id && ed.toPortId === portId);
    if (!exists) {
      setEdges(prev => [...prev, { id: `e-${Date.now()}`, fromNodeId: dragEdge.fromNodeId, fromPortId: dragEdge.fromPortId, toNodeId: node.id, toPortId: portId }]);
    }
    setDragEdge(null);
  };

  const deleteNode = (id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id));
    setEdges(prev => prev.filter(e => e.fromNodeId !== id && e.toNodeId !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const addNode = (type: string) => {
    const cx = (300 - pan.x) / scale;
    const cy = (200 - pan.y) / scale;
    const node = makeNode(type, Math.round(cx), Math.round(cy));
    setNodes(prev => [...prev, node]);
    setSelectedId(node.id);
    setShowCatalog(false);
  };

  // ── Bezier path ─────────────────────────────────────────────────────────────
  const bezier = (x1: number, y1: number, x2: number, y2: number) => {
    const dx = Math.abs(x2 - x1) * 0.5;
    return `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;
  };

  // ── Run pipeline ─────────────────────────────────────────────────────────────
  const runPipeline = async () => {
    if (running) return;
    setRunning(true);
    setTotalTokens(0);
    setTotalCost(0);
    setExecLog([`▶ Starting workflow${goal ? ` — Goal: ${goal}` : ''}...`]);
    setShowLog(true);
    setNodes(prev => prev.map(n => ({ ...n, status: 'idle', output: '', durationMs: undefined, tokens: undefined })));

    const visited = new Set<string>();
    const order: string[] = [];
    const visit = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);
      order.push(id);
      edges.filter(e => e.fromNodeId === id).forEach(e => visit(e.toNodeId));
    };
    const triggers = nodes.filter(n => n.inputs.length === 0);
    triggers.forEach(n => visit(n.id));
    nodes.forEach(n => { if (!visited.has(n.id)) visit(n.id); });

    const localOpenaiKey = typeof window !== 'undefined' ? localStorage.getItem('orbit_openai_key') || '' : '';
    const localGeminiKey = typeof window !== 'undefined' ? localStorage.getItem('orbit_gemini_key') || '' : '';

    let ctx = '';
    for (const nodeId of order) {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) continue;
      if (node.inputs.length === 0) {
        setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, status: 'success' } : n));
        setExecLog(prev => [...prev, `✅ ${node.label} — triggered`]);
        ctx += `[Trigger: ${node.label}]\n`;
        continue;
      }
      setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, status: 'running' } : n));
      setExecLog(prev => [...prev, `⚡ Running: ${node.label}...`]);
      const t0 = Date.now();
      try {
        const prompt = goal
          ? `Global Goal: ${goal}\n\nPrior Context:\n${ctx}\n\nYour Task (${node.label}): ${node.description || 'Execute this step.'}`
          : `Prior Context:\n${ctx}\n\nTask (${node.label}): ${node.description || 'Execute this step.'}`;

        const res = await fetch('/api/workflow/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-openai-api-key': localOpenaiKey, 'x-gemini-api-key': localGeminiKey },
          body: JSON.stringify({ stepName: node.label, agentRole: node.label, stepPrompt: prompt }),
        });
        if (!res.ok) throw new Error(await res.text());

        const reader = res.body!.getReader();
        const dec = new TextDecoder();
        let out = '';
        let buf = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          let nl: number;
          while ((nl = buf.indexOf('\n')) !== -1) {
            const line = buf.slice(0, nl).trim();
            buf = buf.slice(nl + 1);
            if (line.startsWith('data:')) {
              try {
                const ev = JSON.parse(line.slice(5).trim());
                const chunk = ev.token || ev.data?.text || ev.text;
                if (chunk) { out += chunk; setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, output: out } : n)); }
                if (ev.type === 'done' && ev.usage) {
                  const st = ev.usage.inputTokens + ev.usage.outputTokens;
                  const sc = (ev.usage.inputTokens * 0.0000025) + (ev.usage.outputTokens * 0.00001);
                  setTotalTokens(t => t + st);
                  setTotalCost(c => c + sc);
                  setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, tokens: st } : n));
                }
              } catch { /* ignore */ }
            }
          }
        }
        const dur = Date.now() - t0;
        setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, status: 'success', durationMs: dur, output: out } : n));
        setExecLog(prev => [...prev, `✅ ${node.label} — done in ${(dur / 1000).toFixed(1)}s`]);
        ctx += `\n[${node.label}]:\n${out.slice(0, 800)}\n`;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, status: 'error', output: msg } : n));
        setExecLog(prev => [...prev, `❌ ${node.label} — ${msg}`]);
      }
    }
    setExecLog(prev => [...prev, '✔ Workflow complete.']);
    setRunning(false);
  };

  const filteredCatalog = NODE_CATALOG.filter(c =>
    catalogSearch === '' || c.label.toLowerCase().includes(catalogSearch.toLowerCase()) || c.type.toLowerCase().includes(catalogSearch.toLowerCase())
  );

  const statusColor = (s: string) => ({ idle: '#334155', running: '#f59e0b', success: '#10b981', error: '#ef4444' }[s] || '#334155');
  const statusGlow = (s: string) => ({ idle: 'none', running: '0 0 20px rgba(245,158,11,0.3)', success: '0 0 20px rgba(16,185,129,0.2)', error: '0 0 20px rgba(239,68,68,0.25)' }[s] || 'none');

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)', background: '#080c18', overflow: 'hidden', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── Left Panel — Node Catalog ─────────────────────────────────────────── */}
      <div style={{ width: 260, background: '#0c1220', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', zIndex: 20, flexShrink: 0 }}>

        {/* Header */}
        <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
            Node Library
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '6px 10px' }}>
            <Search size={12} style={{ color: '#475569', flexShrink: 0 }} />
            <input
              value={catalogSearch}
              onChange={e => setCatalogSearch(e.target.value)}
              placeholder="Search nodes..."
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '0.75rem', color: '#e2e8f0', fontFamily: 'inherit' }}
            />
          </div>
        </div>

        {/* Node list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {filteredCatalog.map(cat => (
            <div
              key={cat.type}
              draggable
              onClick={() => addNode(cat.type)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 10px', borderRadius: 8, marginBottom: 2,
                background: 'transparent', border: '1px solid transparent',
                cursor: 'pointer', transition: 'all 0.15s', userSelect: 'none',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
            >
              <div style={{ width: 30, height: 30, borderRadius: 8, background: `${cat.color}18`, border: `1px solid ${cat.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <cat.icon size={14} style={{ color: cat.color }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0' }}>{cat.label}</div>
                <div style={{ fontSize: '0.65rem', color: '#475569', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cat.description}</div>
              </div>
            </div>
          ))}
        </div>

        {/* MCP Tools section */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '10px 12px' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>MCP Connected</div>
          {['web_search', 'http_request', 'execute_code', 'memory_store'].map(tool => (
            <div key={tool} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
              <span style={{ fontSize: '0.68rem', color: '#64748b', fontFamily: 'monospace' }}>{tool}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Canvas ──────────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

        {/* Top toolbar */}
        <div style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', zIndex: 30, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(12,18,32,0.9)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 12, padding: '6px 8px', backdropFilter: 'blur(12px)' }}>
            <input
              value={goal}
              onChange={e => setGoal(e.target.value)}
              placeholder="Workflow goal (optional)..."
              style={{ width: 260, background: 'transparent', border: 'none', outline: 'none', fontSize: '0.8rem', color: '#e2e8f0', fontFamily: 'inherit' }}
            />
            <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.08)' }} />
            <button
              onClick={runPipeline} disabled={running}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: running ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: 8, color: '#fff', fontSize: '0.78rem', fontWeight: 700, cursor: running ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
            >
              {running ? <RefreshCw size={12} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Play size={12} fill="#fff" />}
              {running ? 'Running...' : 'Execute'}
            </button>
          </div>

          {/* Zoom controls */}
          <div style={{ display: 'flex', gap: 4, background: 'rgba(12,18,32,0.9)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10, padding: '4px', backdropFilter: 'blur(12px)' }}>
            <button onClick={() => setScale(s => Math.min(2.5, s * 1.15))} style={{ width: 28, height: 28, borderRadius: 7, background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#fff'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}>
              <ZoomIn size={13} />
            </button>
            <span style={{ fontSize: '0.7rem', color: '#475569', display: 'flex', alignItems: 'center', padding: '0 4px', minWidth: 38, justifyContent: 'center', fontWeight: 600 }}>{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(s => Math.max(0.2, s * 0.87))} style={{ width: 28, height: 28, borderRadius: 7, background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#fff'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}>
              <ZoomOut size={13} />
            </button>
            <button onClick={() => { setScale(1); setPan({ x: 0, y: 0 }); }} style={{ width: 28, height: 28, borderRadius: 7, background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', fontWeight: 700 }}>1:1</button>
          </div>

          {/* Stats */}
          {(totalTokens > 0 || totalCost > 0) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(12,18,32,0.9)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, padding: '6px 12px', backdropFilter: 'blur(12px)', fontSize: '0.7rem', color: '#10b981', fontWeight: 600 }}>
              <span>{totalTokens.toLocaleString()} tokens</span>
              <span style={{ opacity: 0.4 }}>·</span>
              <span>${totalCost.toFixed(4)}</span>
            </div>
          )}
        </div>

        {/* Log toggle */}
        <button
          onClick={() => setShowLog(v => !v)}
          style={{ position: 'absolute', bottom: 14, right: 14, zIndex: 30, display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'rgba(12,18,32,0.9)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 9, color: '#94a3b8', fontSize: '0.72rem', cursor: 'pointer', backdropFilter: 'blur(12px)' }}
        >
          <Terminal size={12} />
          Execution Log
          {execLog.length > 0 && <span style={{ background: '#6366f1', color: '#fff', borderRadius: 8, padding: '1px 5px', fontSize: '0.6rem', fontWeight: 700 }}>{execLog.length}</span>}
        </button>

        {/* Canvas */}
        <div
          ref={canvasRef}
          onMouseDown={onCanvasMouseDown}
          onMouseMove={onCanvasMouseMove}
          onMouseUp={onCanvasMouseUp}
          style={{ width: '100%', height: '100%', cursor: isPanning ? 'grabbing' : 'grab', position: 'relative', overflow: 'hidden', userSelect: 'none' }}
        >
          {/* Dot grid background */}
          <div className="grid-bg" style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(148,163,184,0.13) 1px, transparent 1px)',
            backgroundSize: `${20 * scale}px ${20 * scale}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px`,
            pointerEvents: 'none',
          }} />

          {/* SVG edges */}
          <svg
            ref={svgRef}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 5 }}
          >
            <defs>
              <filter id="edge-glow">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            <g transform={`translate(${pan.x},${pan.y}) scale(${scale})`}>
              {edges.map(edge => {
                const fn = nodes.find(n => n.id === edge.fromNodeId);
                const tn = nodes.find(n => n.id === edge.toNodeId);
                if (!fn || !tn) return null;
                const fp = portScreenPos(fn, edge.fromPortId, 'output');
                const tp = portScreenPos(tn, edge.toPortId, 'input');
                const isActive = fn.status === 'running' || tn.status === 'running';
                const isDone = fn.status === 'success' && tn.status === 'success';
                return (
                  <g key={edge.id}>
                    <path d={bezier(fp.x, fp.y, tp.x, tp.y)} fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth={6} />
                    <path
                      d={bezier(fp.x, fp.y, tp.x, tp.y)} fill="none"
                      stroke={isActive ? '#f59e0b' : isDone ? '#10b981' : 'rgba(148,163,184,0.2)'}
                      strokeWidth={isActive ? 2.5 : 1.5}
                      strokeDasharray={isActive ? '6 4' : 'none'}
                      style={{ animation: isActive ? 'dashMove 0.6s linear infinite' : 'none' }}
                      filter={isActive || isDone ? 'url(#edge-glow)' : undefined}
                    />
                    {/* Arrow head */}
                    <circle cx={tp.x} cy={tp.y} r={3.5} fill={isDone ? '#10b981' : isActive ? '#f59e0b' : 'rgba(148,163,184,0.3)'} />
                  </g>
                );
              })}
              {/* Live drag edge */}
              {dragEdge && (() => {
                const fn = nodes.find(n => n.id === dragEdge.fromNodeId);
                if (!fn) return null;
                const fp = portScreenPos(fn, dragEdge.fromPortId, 'output');
                return (
                  <path d={bezier(fp.x, fp.y, dragEdge.x, dragEdge.y)} fill="none" stroke="#6366f1" strokeWidth={1.5} strokeDasharray="5 4" opacity={0.8} />
                );
              })()}
            </g>
          </svg>

          {/* Nodes */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
            <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`, transformOrigin: '0 0', position: 'absolute' }}>
              {nodes.map(node => {
                const isSelected = selectedId === node.id;
                return (
                  <div
                    key={node.id}
                    onMouseDown={e => onNodeMouseDown(e, node)}
                    style={{
                      position: 'absolute', left: node.x, top: node.y, width: NODE_W,
                      background: '#0f1729',
                      border: `1.5px solid ${isSelected ? node.color : statusColor(node.status) === '#334155' ? 'rgba(255,255,255,0.08)' : statusColor(node.status)}`,
                      borderRadius: 12,
                      boxShadow: isSelected ? `0 0 0 2px ${node.color}40, ${statusGlow(node.status)}` : statusGlow(node.status),
                      cursor: 'grab', userSelect: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
                      overflow: 'visible',
                    }}
                  >
                    {/* Input ports */}
                    {node.inputs.map((port, i) => {
                      const py = 36 + (i + 1) * (40 / (node.inputs.length + 1));
                      return (
                        <div
                          key={port.id}
                          onMouseUp={e => finishWire(e, node, port.id)}
                          title={port.label}
                          style={{
                            position: 'absolute', left: -PORT_SIZE / 2, top: py - PORT_SIZE / 2,
                            width: PORT_SIZE, height: PORT_SIZE, borderRadius: '50%',
                            background: dragEdge ? node.color : '#0f1729',
                            border: `2px solid ${dragEdge ? node.color : 'rgba(148,163,184,0.3)'}`,
                            cursor: 'crosshair', zIndex: 20,
                            transition: 'all 0.15s',
                            boxShadow: dragEdge ? `0 0 8px ${node.color}60` : 'none',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = node.color; e.currentTarget.style.borderColor = node.color; }}
                          onMouseLeave={e => { e.currentTarget.style.background = dragEdge ? node.color : '#0f1729'; e.currentTarget.style.borderColor = dragEdge ? node.color : 'rgba(148,163,184,0.3)'; }}
                        />
                      );
                    })}

                    {/* Header */}
                    <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 26, height: 26, borderRadius: 7, background: `${node.color}18`, border: `1px solid ${node.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <node.icon size={12} style={{ color: node.color }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{node.label}</div>
                        <div style={{ fontSize: '0.6rem', color: '#475569', marginTop: 1 }}>{node.type}</div>
                      </div>
                      {/* Status indicator */}
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: statusColor(node.status), boxShadow: node.status !== 'idle' ? `0 0 6px ${statusColor(node.status)}` : 'none', flexShrink: 0 }} />
                    </div>

                    {/* Body */}
                    <div style={{ padding: '8px 12px 10px' }}>
                      {node.status === 'running' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f59e0b', fontSize: '0.68rem' }}>
                          <RefreshCw size={10} style={{ animation: 'spin 0.8s linear infinite' }} />
                          Executing...
                        </div>
                      ) : node.output ? (
                        <div style={{ fontSize: '0.65rem', color: '#64748b', lineHeight: 1.4, maxHeight: 44, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                          {node.output.slice(0, 120)}
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.65rem', color: '#334155' }}>{node.description}</div>
                      )}
                      {node.durationMs && (
                        <div style={{ marginTop: 6, fontSize: '0.6rem', color: '#475569' }}>
                          {(node.durationMs / 1000).toFixed(1)}s {node.tokens ? `· ${node.tokens.toLocaleString()} tokens` : ''}
                        </div>
                      )}
                    </div>

                    {/* Footer actions */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 10px 8px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={e => { e.stopPropagation(); setSelectedId(node.id); }} style={{ background: 'none', border: 'none', color: '#334155', cursor: 'pointer', padding: 3, display: 'flex', alignItems: 'center', borderRadius: 4, transition: 'all 0.15s' }} onMouseEnter={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }} onMouseLeave={e => { e.currentTarget.style.color = '#334155'; e.currentTarget.style.background = 'none'; }}>
                          <Settings size={10} />
                        </button>
                        <button onClick={e => { e.stopPropagation(); deleteNode(node.id); }} style={{ background: 'none', border: 'none', color: '#334155', cursor: 'pointer', padding: 3, display: 'flex', alignItems: 'center', borderRadius: 4, transition: 'all 0.15s' }} onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }} onMouseLeave={e => { e.currentTarget.style.color = '#334155'; e.currentTarget.style.background = 'none'; }}>
                          <Trash2 size={10} />
                        </button>
                      </div>
                      {node.inputs.length > 0 && (
                        <button
                          onClick={e => { e.stopPropagation(); /* run single */ }}
                          style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '3px 7px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 5, color: '#818cf8', fontSize: '0.58rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                          <Play size={7} fill="#818cf8" /> Run
                        </button>
                      )}
                    </div>

                    {/* Output ports */}
                    {node.outputs.map((port, i) => {
                      const py = 36 + (i + 1) * (40 / (node.outputs.length + 1));
                      return (
                        <div
                          key={port.id}
                          onMouseDown={e => startWire(e, node, port.id)}
                          title={`${port.label} — drag to connect`}
                          style={{
                            position: 'absolute', right: -PORT_SIZE / 2, top: py - PORT_SIZE / 2,
                            width: PORT_SIZE, height: PORT_SIZE, borderRadius: '50%',
                            background: '#0f1729', border: `2px solid ${node.color}`,
                            cursor: 'crosshair', zIndex: 20, transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = node.color; e.currentTarget.style.boxShadow = `0 0 10px ${node.color}60`; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#0f1729'; e.currentTarget.style.boxShadow = 'none'; }}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Execution log panel */}
          {showLog && (
            <div style={{
              position: 'absolute', bottom: 46, right: 14, width: 360, maxHeight: 240,
              background: 'rgba(8,12,24,0.96)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12, overflow: 'hidden', backdropFilter: 'blur(12px)', zIndex: 40,
              display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Execution Log</span>
                <button onClick={() => setShowLog(false)} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', display: 'flex', padding: 0 }}><X size={12} /></button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px', fontFamily: 'monospace', fontSize: '0.68rem', lineHeight: 1.6, color: '#64748b' }}>
                {execLog.length === 0 ? <span style={{ color: '#334155' }}>Run the workflow to see execution logs...</span> : execLog.map((log, i) => (
                  <div key={i} style={{ color: log.startsWith('✅') ? '#10b981' : log.startsWith('❌') ? '#ef4444' : log.startsWith('⚡') ? '#f59e0b' : log.startsWith('✔') ? '#6366f1' : '#64748b' }}>{log}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Right Panel — Node Config ─────────────────────────────────────────── */}
      {selectedNode && (
        <div style={{ width: 280, background: '#0c1220', borderLeft: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', zIndex: 20, flexShrink: 0 }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: `${selectedNode.color}18`, border: `1px solid ${selectedNode.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <selectedNode.icon size={13} style={{ color: selectedNode.color }} />
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f1f5f9' }}>{selectedNode.label}</div>
                <div style={{ fontSize: '0.6rem', color: '#475569' }}>{selectedNode.type}</div>
              </div>
            </div>
            <button onClick={() => setSelectedId(null)} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', display: 'flex' }}><X size={14} /></button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
            {/* Label */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: '0.65rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 5 }}>Label</label>
              <input
                value={selectedNode.label}
                onChange={e => setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, label: e.target.value } : n))}
                style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, padding: '7px 10px', color: '#e2e8f0', fontSize: '0.8rem', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>

            {/* Status */}
            <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor(selectedNode.status) }} />
              <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'capitalize' }}>{selectedNode.status}</span>
              {selectedNode.durationMs && <span style={{ fontSize: '0.68rem', color: '#475569', marginLeft: 'auto' }}>{(selectedNode.durationMs / 1000).toFixed(1)}s</span>}
            </div>

            {/* Output */}
            {selectedNode.output && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: '0.65rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 5 }}>Output</label>
                <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 7, padding: '8px 10px', fontSize: '0.68rem', color: '#94a3b8', lineHeight: 1.5, maxHeight: 200, overflowY: 'auto', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {selectedNode.output}
                </div>
              </div>
            )}

            {/* Connections */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: '0.65rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Connections</label>
              {edges.filter(e => e.fromNodeId === selectedNode.id || e.toNodeId === selectedNode.id).length === 0 ? (
                <div style={{ fontSize: '0.68rem', color: '#334155' }}>No connections. Drag from output ports to connect.</div>
              ) : edges.filter(e => e.fromNodeId === selectedNode.id || e.toNodeId === selectedNode.id).map(e => {
                const other = nodes.find(n => n.id === (e.fromNodeId === selectedNode.id ? e.toNodeId : e.fromNodeId));
                if (!other) return null;
                const dir = e.fromNodeId === selectedNode.id ? '→' : '←';
                return (
                  <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', fontSize: '0.68rem', color: '#64748b' }}>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: other.color }} />
                    <span>{dir} {other.label}</span>
                    <button onClick={() => setEdges(prev => prev.filter(ed => ed.id !== e.id))} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#334155', cursor: 'pointer', display: 'flex' }} onMouseEnter={e2 => { (e2.currentTarget as HTMLElement).style.color = '#ef4444'; }} onMouseLeave={e2 => { (e2.currentTarget as HTMLElement).style.color = '#334155'; }}>
                      <X size={10} />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Danger */}
            <button
              onClick={() => deleteNode(selectedNode.id)}
              style={{ width: '100%', padding: '8px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, color: '#ef4444', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; }}
            >
              <Trash2 size={12} /> Delete Node
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes dashMove { to { stroke-dashoffset: -10; } }
      `}</style>
    </div>
  );
}
