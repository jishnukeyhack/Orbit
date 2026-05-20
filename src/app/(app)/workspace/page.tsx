'use client';
import { useState, useEffect, useCallback } from 'react';
import { Folder, File, RefreshCw, Download, Eye, ChevronRight, ChevronDown, Terminal, Clock, HardDrive } from 'lucide-react';

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
              padding: `3px 8px 3px ${depth * 16 + 8}px`,
              cursor: 'pointer', borderRadius: 4,
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
                <span style={{ fontSize: '0.82rem', color: '#e2e8f0' }}>{node.name}</span>
              </>
            ) : (
              <>
                <span style={{ width: 12 }} />
                <File size={14} style={{ color: EXT_COLORS[getExt(node.name)] ?? '#64748b', flexShrink: 0 }} />
                <span style={{ fontSize: '0.82rem', color: '#cbd5e1', flex: 1 }}>{node.name}</span>
                {node.size !== undefined && (
                  <span style={{ fontSize: '0.7rem', color: '#334155' }}>{formatSize(node.size)}</span>
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

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/workspace?action=tree');
      const d = await res.json() as WorkspaceData;
      setData(d);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);


  useEffect(() => { refresh(); }, [refresh]);

  const openFile = async (node: FileNode) => {
    setSelectedFile(node);
    setLoadingFile(true);
    setFileContent('');
    try {
      const res = await fetch(`/api/workspace?action=read&path=${encodeURIComponent(node.path)}`);
      const d = await res.json() as { content?: string; error?: string };
      setFileContent(d.content ?? d.error ?? '(empty)');
    } catch {
      setFileContent('Error loading file');
    }
    setLoadingFile(false);
  };

  return (
    <div style={{ padding: '1.5rem', height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f1f5f9', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <HardDrive size={22} style={{ color: '#6366f1' }} />
            Workspace
            <span style={{ fontSize: '0.65rem', padding: '3px 8px', borderRadius: 10, background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)', fontWeight: 500 }}>
              LIVE
            </span>
          </h1>
          <p style={{ color: '#475569', margin: '0.3rem 0 0', fontSize: '0.82rem' }}>
            All files created by agents · orbit-workspace/
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={refresh}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#94a3b8', fontSize: '0.8rem', cursor: 'pointer' }}
          >
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      {data?.stats && (
        <div style={{ display: 'flex', gap: '1rem', flexShrink: 0 }}>
          {[
            { label: 'Files Created', value: data.stats.totalFiles.toString(), icon: <File size={14} /> },
            { label: 'Total Size', value: formatSize(data.stats.totalSize), icon: <HardDrive size={14} /> },
            { label: 'Workspace', value: 'orbit-workspace/', icon: <Folder size={14} /> },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10 }}>
              <span style={{ color: '#6366f1' }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#475569' }}>{s.label}</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f1f5f9' }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1rem', minHeight: 0 }}>
        {/* File tree */}
        <div style={{ background: '#050810', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'auto' }}>
          <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '0.75rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Files
          </div>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#334155', fontSize: '0.82rem' }}>Loading...</div>
          ) : data?.empty ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <div style={{ color: '#334155', fontSize: '0.82rem', marginBottom: 8 }}>No files yet</div>
              <div style={{ color: '#1e293b', fontSize: '0.75rem' }}>Run an agent to create files here</div>
            </div>
          ) : (
            <div style={{ padding: '8px 4px' }}>
              <FileTree nodes={data?.tree ?? []} onSelect={openFile} />
            </div>
          )}
        </div>

        {/* File viewer */}
        <div style={{ background: '#050810', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {selectedFile ? (
            <>
              <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <File size={14} style={{ color: EXT_COLORS[getExt(selectedFile.name)] ?? '#64748b' }} />
                <span style={{ fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 500, fontFamily: 'monospace' }}>{selectedFile.path}</span>
                {selectedFile.size !== undefined && (
                  <span style={{ fontSize: '0.7rem', color: '#334155', marginLeft: 'auto' }}>{formatSize(selectedFile.size)}</span>
                )}
                {selectedFile.modified && (
                  <span style={{ fontSize: '0.7rem', color: '#334155', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={10} />
                    {formatTime(selectedFile.modified)}
                  </span>
                )}
              </div>
              <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
                {loadingFile ? (
                  <div style={{ color: '#334155', fontSize: '0.82rem' }}>Loading file...</div>
                ) : (
                  <pre style={{
                    margin: 0, fontSize: '0.82rem', lineHeight: 1.7,
                    color: '#cbd5e1', fontFamily: '"Fira Code", "Cascadia Code", "Consolas", monospace',
                    whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                  }}>
                    {fileContent}
                  </pre>
                )}
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', color: '#1e293b' }}>
              <Eye size={40} strokeWidth={1} />
              <div style={{ fontSize: '0.85rem' }}>Select a file to preview</div>
              <div style={{ fontSize: '0.75rem', color: '#0f172a' }}>Agents write their output here</div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
