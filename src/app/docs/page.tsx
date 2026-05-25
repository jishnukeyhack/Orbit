'use client';

import { useState } from 'react';
import Link from 'next/link';
import OrbitLogo from '@/components/layout/OrbitLogo';
import { 
  BookOpen, Settings, Cpu, Database, Terminal, 
  Code2, ChevronRight, HelpCircle, ArrowUpRight, Check,
  AlertCircle, ShieldAlert, Network, Share2, Eye, Server, 
  RefreshCw, Key
} from 'lucide-react';

interface DocSection {
  id: string;
  category: string;
  title: string;
  icon: any;
  content: React.ReactNode;
}

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState<string>('intro');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const sections: DocSection[] = [
    {
      id: 'intro',
      category: '1. GETTING STARTED',
      title: 'Introduction',
      icon: BookOpen,
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>Introduction to Orbit</h2>
          <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: '#94a3b8', margin: 0 }}>
            Orbit is an enterprise-grade software engineering platform designed to provision autonomous developer cohorts and secure sandboxed workspaces. It enables engineering teams to delegate, compile, test, and deploy features dynamically across secure, isolated execution environments.
          </p>
          <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: '#94a3b8', margin: 0 }}>
            Standard AI tools treat code as a simple single-prompt text generation task. Orbit addresses the core reality of software engineering: complex, enterprise-ready software is built by highly collaborative *teams* of specialists. Orbit acts as a virtual engineering coordinator: parsing statements semantically, decomposing complex requirements into hierarchical task trees, spinning up isolated sandbox micro-containers, and executing multi-model consensus and automated compile validations.
          </p>

          <div style={{ height: 1, background: 'rgba(255, 255, 255, 0.08)', margin: '10px 0' }} />

          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#f1f5f9', margin: '10px 0 0' }}>Core Architectural Foundations</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 10 }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Terminal size={16} style={{ color: 'var(--accent-blue)' }} />
                <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: '#f8fafc', margin: 0 }}>Monaco Sandbox Studio</h4>
              </div>
              <p style={{ fontSize: '0.82rem', lineHeight: 1.5, color: '#64748b', margin: 0 }}>A high-performance workspace featuring collapsible directory tree views, live Monaco file editing, and collapsible Sandbox CLI drawers.</p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Cpu size={16} style={{ color: 'var(--accent-purple)' }} />
                <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: '#f8fafc', margin: 0 }}>Autopilot Swarm Core</h4>
              </div>
              <p style={{ fontSize: '0.82rem', lineHeight: 1.5, color: '#64748b', margin: 0 }}>A hierarchical multi-agent cohort system generating, checking, and validating code blueprints across isolated containers.</p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Share2 size={16} style={{ color: '#22c55e' }} />
                <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: '#f8fafc', margin: 0 }}>Realtime Sync Broadcast</h4>
              </div>
              <p style={{ fontSize: '0.82rem', lineHeight: 1.5, color: '#64748b', margin: 0 }}>Direct Supabase database publication socket streams pushing realtime developer social feed updates to the client interface.</p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Database size={16} style={{ color: 'var(--accent-cyan)' }} />
                <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: '#f8fafc', margin: 0 }}>Dual-Stack Network Pools</h4>
              </div>
              <p style={{ fontSize: '0.82rem', lineHeight: 1.5, color: '#64748b', margin: 0 }}>A high-performance Postgres routing gateway that connects over IPv4 port 6543 poolers, avoiding timeouts on IPv6-restricted systems.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'setup',
      category: '1. GETTING STARTED',
      title: 'Quick Start Setup',
      icon: Settings,
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>Quick Start Setup</h2>
          <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: '#94a3b8', margin: 0 }}>
            Follow these configuration steps to instantiate your environment variables, initialize Postgres table schemas, and compile the local Orbit instance.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginTop: 10 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-blue)', background: 'rgba(79, 140, 255, 0.1)', padding: '2px 8px', borderRadius: 4 }}>STEP 1</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f1f5f9' }}>Define Local Environment Variables</span>
              </div>
              <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0 0 10px', lineHeight: 1.5 }}>
                Create a <code style={{ color: 'var(--accent-cyan)' }}>.env.local</code> file in your project root directory and set up the connection endpoints:
              </p>
              <div style={{ position: 'relative' }}>
                <pre style={{ background: '#070a13', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: 16, fontSize: '0.8rem', fontFamily: 'monospace', color: '#34d399', overflowX: 'auto', margin: 0 }}>
{`NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-key
ORBIT_WORKSPACE=c:\\path\\to\\your\\workspace`}
                </pre>
                <button 
                  onClick={() => handleCopy(`NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url\nNEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key\nSUPABASE_SERVICE_ROLE_KEY=your-supabase-service-key\nORBIT_WORKSPACE=c:\\path\\to\\your\\workspace`, 'env')}
                  style={{ position: 'absolute', right: 10, top: 10, padding: '4px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.68rem', color: '#cbd5e1', cursor: 'pointer' }}
                >
                  {copiedText === 'env' ? <Check size={12} style={{ color: '#22c55e' }} /> : 'Copy'}
                </button>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-blue)', background: 'rgba(79, 140, 255, 0.1)', padding: '2px 8px', borderRadius: 4 }}>STEP 2</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f1f5f9' }}>Initialize Postgres Schema & Migrations</span>
              </div>
              <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0 0 10px', lineHeight: 1.5 }}>
                Orbit utilizes an automated dual-stack migration script. Run this command to establish database schemas, apply Row-Level Security (RLS) filters, and trigger Realtime publication channels over standard IPv4 sockets:
              </p>
              <div style={{ position: 'relative' }}>
                <pre style={{ background: '#070a13', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: 16, fontSize: '0.8rem', fontFamily: 'monospace', color: '#34d399', overflowX: 'auto', margin: 0 }}>
{`node scripts/migrate.js`}
                </pre>
                <button 
                  onClick={() => handleCopy(`node scripts/migrate.js`, 'migrate')}
                  style={{ position: 'absolute', right: 10, top: 10, padding: '4px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.68rem', color: '#cbd5e1', cursor: 'pointer' }}
                >
                  {copiedText === 'migrate' ? <Check size={12} style={{ color: '#22c55e' }} /> : 'Copy'}
                </button>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-blue)', background: 'rgba(79, 140, 255, 0.1)', padding: '2px 8px', borderRadius: 4 }}>STEP 3</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f1f5f9' }}>Start Developer Server</span>
              </div>
              <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0 0 10px', lineHeight: 1.5 }}>
                Fire up the local Turbopack compilation engine:
              </p>
              <div style={{ position: 'relative' }}>
                <pre style={{ background: '#070a13', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 8, padding: 16, fontSize: '0.8rem', fontFamily: 'monospace', color: '#34d399', overflowX: 'auto', margin: 0 }}>
{`npm run dev`}
                </pre>
                <button 
                  onClick={() => handleCopy(`npm run dev`, 'dev')}
                  style={{ position: 'absolute', right: 10, top: 10, padding: '4px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.68rem', color: '#cbd5e1', cursor: 'pointer' }}
                >
                  {copiedText === 'dev' ? <Check size={12} style={{ color: '#22c55e' }} /> : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'verification',
      category: '1. GETTING STARTED',
      title: 'Smoke Testing & Verification',
      icon: Eye,
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>Verification & Smoke Testing</h2>
          <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: '#94a3b8', margin: 0 }}>
            Ensure your local environment, dual-stack connections, and workspace containers are fully operational.
          </p>

          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#f1f5f9', margin: '15px 0 5px' }}>1. Local Server Verification</h3>
          <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: '#64748b', margin: 0 }}>
            Point your browser to <code style={{ color: 'var(--accent-cyan)' }}>http://localhost:3000</code>. Verify that the homepage boots correctly, and the WaveCanvas background renders high-performance sine-waves dynamically with zero browser lag.
          </p>

          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#f1f5f9', margin: '15px 0 5px' }}>2. API Health Check</h3>
          <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: '#64748b', margin: 0 }}>
            Verify local system connectivity by fetching the status endpoint:
          </p>
          <div style={{ position: 'relative' }}>
            <pre style={{ background: '#070a13', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 8, padding: 16, fontSize: '0.8rem', fontFamily: 'monospace', color: '#34d399', overflowX: 'auto', margin: 0 }}>
{`curl http://localhost:3000/api/status`}
            </pre>
            <button 
              onClick={() => handleCopy(`curl http://localhost:3000/api/status`, 'smoke1')}
              style={{ position: 'absolute', right: 10, top: 10, padding: '4px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.68rem', color: '#cbd5e1', cursor: 'pointer' }}
            >
              {copiedText === 'smoke1' ? <Check size={12} style={{ color: '#22c55e' }} /> : 'Copy'}
            </button>
          </div>
          <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: '#64748b', margin: '5px 0 0' }}>
            A correct setup should return a JSON payload with <code style={{ color: 'var(--accent-cyan)' }}>database: true</code>, signifying a validated dual-stack pool connection.
          </p>
        </div>
      )
    },
    {
      id: 'swarm-core',
      category: '2. CORE ENGINE MECHANICS',
      title: 'Autopilot Swarm Core',
      icon: Cpu,
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>Autopilot Swarm Core</h2>
          <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: '#94a3b8', margin: 0 }}>
            Orbit coordinates isolated developer containers utilizing a hierarchical swarm cohort architecture.
          </p>

          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#f1f5f9', margin: '15px 0 5px' }}>Semantic Objective Decomposition</h3>
          <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: '#64748b', margin: 0 }}>
            When you enter an instruction in the search input frame, Orbit parses it semantically. Rather than running a flat prompt chain, the coordinator breaks down requirements into a complex task graph containing node configurations, imports definitions, and test criteria.
          </p>

          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#f1f5f9', margin: '15px 0 5px' }}>Node Cohort Recruitment</h3>
          <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: '#64748b', margin: 0 }}>
            Based on requirements, Orbit automatically hires a team of virtual specialists from our library of 175+ sandboxed configurations (e.g., Auth architects, Postgres administrators, styling layout debuggers). These containers operate concurrently on isolated workspace branches.
          </p>

          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#f1f5f9', margin: '15px 0 5px' }}>Distributed Swarm Synchronization</h3>
          <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: '#64748b', margin: 0 }}>
            Containers communicate asynchronously via custom message routers. A parent coordinator checks execution bounds and resolves code locks, maintaining standard commit protocols before changes are merged back.
          </p>
        </div>
      )
    },
    {
      id: 'consensus-arena',
      category: '2. CORE ENGINE MECHANICS',
      title: 'Consensus Arena & AST',
      icon: Network,
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>Consensus Arena & AST Validation</h2>
          <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: '#94a3b8', margin: 0 }}>
            The Consensus Arena ensures peak code quality by cross-evaluating drafts generated across different model architectures.
          </p>

          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#f1f5f9', margin: '15px 0 5px' }}>AST Structural Mapping</h3>
          <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: '#64748b', margin: 0 }}>
            When draft files are synthesized across Gemini, GPT, and Claude models, Orbit compiles them into Abstract Syntax Trees (AST). The system compares structural definitions rather than raw characters, isolating pure functional changes from minor format differences.
          </p>

          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#f1f5f9', margin: '15px 0 5px' }}>Model Divergence Metrics</h3>
          <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: '#64748b', margin: 0 }}>
            The validator computes divergence metrics. If code blueprints are structurally consistent, the segment scores high. If functional loops or routing arguments diverge, the segment triggers consensus arena debates: the cohort analyzes compiler logs to choose the cleanest, most efficient AST tree.
          </p>

          <div style={{ background: 'rgba(245, 158, 11, 0.04)', border: '1px solid rgba(245, 158, 11, 0.15)', borderRadius: 12, padding: 18, marginTop: 10 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <AlertCircle size={16} style={{ color: '#fbbf24', flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: '0.85rem', color: '#d97706', lineHeight: 1.5 }}>
                <strong>Consensus Score Guard:</strong> The system enforces a strict 95% consensus alignment requirement. If models fail to resolve a stable AST hierarchy, file modifications are blocked, and cohort debuggers are re-dispatched to resolve ambiguities.
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'self-healing',
      category: '2. CORE ENGINE MECHANICS',
      title: 'Self-Healing Loop',
      icon: RefreshCw,
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>The Self-Healing Loop</h2>
          <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: '#94a3b8', margin: 0 }}>
            Orbit guarantees working compilations by running real-time diagnostics inside secure sandbox containers.
          </p>

          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#f1f5f9', margin: '15px 0 5px' }}>1. Diagnostic Compilation</h3>
          <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: '#64748b', margin: 0 }}>
            As soon as draft files are saved, the sandbox compiler executes. It monitors stderr streams and catches syntax issues, typing mismatch, or dependency gaps instantly.
          </p>

          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#f1f5f9', margin: '15px 0 5px' }}>2. Trace Stack Deconstruction</h3>
          <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: '#64748b', margin: 0 }}>
            If the build fails, the compiler stack trace is collected. The system parses error codes, maps them directly to file coordinates (line/character boundaries), and wraps this metadata into a repair prompt package.
          </p>

          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#f1f5f9', margin: '15px 0 5px' }}>3. Autonomous Repair Run</h3>
          <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: '#64748b', margin: 0 }}>
            The debugger container processes the trace metadata, corrects the precise error lines, and re-triggers compilations. This self-healing process iterates automatically until the code compiles with zero errors, keeping active live workspaces completely clean.
          </p>
        </div>
      )
    },
    {
      id: 'realtime-sync',
      category: '3. DATA & NETWORK SECURITY',
      title: 'Postgres Realtime Sync',
      icon: Share2,
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>Postgres Realtime Synchronization</h2>
          <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: '#94a3b8', margin: 0 }}>
            Orbit employs Supabase Realtime broadcast protocols to synchronize data states across active clients instantly.
          </p>

          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#f1f5f9', margin: '15px 0 5px' }}>Publication Channels Configuration</h3>
          <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: '#64748b', margin: 0 }}>
            During migrations, the <code style={{ color: 'var(--accent-cyan)' }}>orbit_blogs</code> table is registered inside the postgres replication channel:
          </p>
          <div style={{ position: 'relative' }}>
            <pre style={{ background: '#070a13', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 8, padding: 16, fontSize: '0.8rem', fontFamily: 'monospace', color: '#34d399', overflowX: 'auto', margin: 0 }}>
{`ALTER PUBLICATION supabase_realtime ADD TABLE orbit_blogs;`}
            </pre>
          </div>

          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#f1f5f9', margin: '15px 0 5px' }}>Realtime Socket Synchronization</h3>
          <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: '#64748b', margin: 0 }}>
            Client applications initialize a direct WebSocket channel. When a developer submits a post, the update is broadcasted and immediately prepended to local component states, producing instant updates with zero manual polls.
          </p>
        </div>
      )
    },
    {
      id: 'network-pooler',
      category: '3. DATA & NETWORK SECURITY',
      title: 'Dual-Stack Pooler Sockets',
      icon: Server,
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>Dual-Stack Pooler Sockets</h2>
          <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: '#94a3b8', margin: 0 }}>
            We implemented a high-performance network routing architecture to ensure stable Postgres database connectivity across restrictive local networks.
          </p>

          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#f1f5f9', margin: '15px 0 5px' }}>The IPv6 Connectivity Challenge</h3>
          <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: '#64748b', margin: 0 }}>
            Many modern cloud database providers configure direct connection strings strictly over IPv6 channels. However, if a developer machine or enterprise workspace operates over an IPv4-only ISP or network proxy layer, database handshakes time out instantly.
          </p>

          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#f1f5f9', margin: '15px 0 5px' }}>AWS IPv4 Region Pooler Integration</h3>
          <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: '#64748b', margin: 0 }}>
            To resolve this network block, Orbit routes standard Postgres pools through active AWS dual-stack pooling endpoints over port <code style={{ color: 'var(--accent-cyan)' }}>6543</code>. These poolers are configured with SSL connection objects to safely ignore self-signed container proxy certificates:
          </p>
          <div style={{ position: 'relative' }}>
            <pre style={{ background: '#070a13', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 8, padding: 16, fontSize: '0.8rem', fontFamily: 'monospace', color: '#34d399', overflowX: 'auto', margin: 0 }}>
{`const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Bypasses SSL certificate blocks
});`}
            </pre>
          </div>
        </div>
      )
    },
    {
      id: 'rls-security',
      category: '3. DATA & NETWORK SECURITY',
      title: 'Row-Level Security (RLS)',
      icon: ShieldAlert,
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>Row-Level Security (RLS)</h2>
          <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: '#94a3b8', margin: 0 }}>
            We protect user data and database transactions by enforcing Row-Level Security policies at the PostgreSQL core level.
          </p>

          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#f1f5f9', margin: '15px 0 5px' }}>RLS Enablement</h3>
          <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: '#64748b', margin: 0 }}>
            The Social Blog table (<code style={{ color: 'var(--accent-cyan)' }}>orbit_blogs</code>) explicitly locks anonymous modifications:
          </p>
          <div style={{ position: 'relative' }}>
            <pre style={{ background: '#070a13', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 8, padding: 16, fontSize: '0.8rem', fontFamily: 'monospace', color: '#34d399', overflowX: 'auto', margin: 0 }}>
{`ALTER TABLE orbit_blogs ENABLE ROW LEVEL SECURITY;`}
            </pre>
          </div>

          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#f1f5f9', margin: '15px 0 5px' }}>Security Policies Definition</h3>
          <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: '#64748b', margin: 0 }}>
            We define two clean access policies:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 10 }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f8fafc', marginBottom: 4 }}>1. Public Read (Select Policy)</div>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>Allows any visitor or authenticated user to fetch published blogs without restriction.</p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f8fafc', marginBottom: 4 }}>2. Authenticated Write (Insert Policy)</div>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>Verifies that database insertions are bound to the verified active user session, blocking manual user-spoofing.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'studio-layout',
      category: '4. VIRTUAL IDE WORKSPACE',
      title: 'IDE Collapsible Drawers',
      icon: Terminal,
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>Collapsible Workspace Drawers</h2>
          <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: '#94a3b8', margin: 0 }}>
            The Orbit Virtual Workspace features collapsible navigation trees and terminal drawers, maximizing available monitor layouts for coding.
          </p>

          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#f1f5f9', margin: '15px 0 5px' }}>Dynamic Grid Adaptability</h3>
          <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: '#64748b', margin: 0 }}>
            The main workspace editor frame is managed by responsive react state toggles. The explore sidebar and Sandbox CLI terminals scale seamlessly:
          </p>
          <div style={{ position: 'relative' }}>
            <pre style={{ background: '#070a13', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 8, padding: 16, fontSize: '0.8rem', fontFamily: 'monospace', color: '#34d399', overflowX: 'auto', margin: 0 }}>
{`gridTemplateColumns: showSidebar ? '260px 1fr' : '1fr',
transition: 'grid-template-columns 0.3s cubic-bezier(0.16, 1, 0.3, 1)'`}
            </pre>
          </div>

          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#f1f5f9', margin: '15px 0 5px' }}>Monaco Container Resizing</h3>
          <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: '#64748b', margin: 0 }}>
            On tree or terminal drawer collapses, the Monaco Editor container undergoes automatic dimensions recalculations. This avoids visual pixel-shifting issues and guarantees a clean, distraction-free editing context.
          </p>
        </div>
      )
    },
    {
      id: 'sdk-ref',
      category: '5. DEVELOPER REFERENCE',
      title: 'TypeScript SDK API',
      icon: Code2,
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>TypeScript SDK API Reference</h2>
          <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: '#94a3b8', margin: 0 }}>
            Programmatically automate Orbit consensus deployments in your serverless deployment pipelines using the SDK package.
          </p>

          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#f1f5f9', margin: '15px 0 5px' }}>Swarm Initialization</h3>
          <div style={{ position: 'relative' }}>
            <pre style={{ background: '#070a13', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 8, padding: 16, fontSize: '0.8rem', fontFamily: 'monospace', color: '#34d399', overflowX: 'auto', margin: 0 }}>
{`import { OrbitSwarm } from "@orbit/sdk";

const swarm = new OrbitSwarm({
  goal: "Provision secure route guards",
  strategy: "hierarchical",
  consensusLevel: 0.95 // Requires 95% multi-model agreement
});`}
            </pre>
          </div>

          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#f1f5f9', margin: '15px 0 5px' }}>Execution & Compilations</h3>
          <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: '#64748b', margin: 0 }}>
            Trigger cohort provisioning and automated self-healing build checks:
          </p>
          <div style={{ position: 'relative' }}>
            <pre style={{ background: '#070a13', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 8, padding: 16, fontSize: '0.8rem', fontFamily: 'monospace', color: '#34d399', overflowX: 'auto', margin: 0 }}>
{`await swarm.provision();

const { success, error, liveUrl } = await swarm.executeSelfHealingTests();

if (success) {
  console.log(\`Orbit deployed! Live build branch URL: \${liveUrl}\`);
}`}
            </pre>
            <button 
              onClick={() => handleCopy(`import { OrbitSwarm } from "@orbit/sdk";\n\nconst swarm = new OrbitSwarm({\n  goal: "Provision secure route guards",\n  strategy: "hierarchical",\n  consensusLevel: 0.95\n});\n\nawait swarm.provision();\nconst { success, liveUrl } = await swarm.executeSelfHealingTests();\n\nif (success) {\n  console.log(\`Orbit deployed! Live build branch URL: \${liveUrl}\`);\n}`, 'sdk2')}
              style={{ position: 'absolute', right: 10, top: 10, padding: '4px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.68rem', color: '#cbd5e1', cursor: 'pointer' }}
            >
              {copiedText === 'sdk2' ? <Check size={12} style={{ color: '#22c55e' }} /> : 'Copy'}
            </button>
          </div>
        </div>
      )
    },
    {
      id: 'api-endpoints',
      category: '5. DEVELOPER REFERENCE',
      title: 'REST API Reference',
      icon: Server,
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>REST API Reference</h2>
          <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: '#94a3b8', margin: 0 }}>
            Integrate with Orbit's backend engines via standard JSON endpoints.
          </p>

          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#f1f5f9', margin: '15px 0 5px' }}>1. GET /api/status</h3>
          <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0 0 10px' }}>Fetches system database validation state, keys status, and currently active developer agents count.</p>
          <div style={{ position: 'relative' }}>
            <pre style={{ background: '#070a13', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 8, padding: 16, fontSize: '0.8rem', fontFamily: 'monospace', color: '#34d399', overflowX: 'auto', margin: 0 }}>
{`// Response Payload
{
  "openai": true,
  "database": true,
  "agentCount": 42
}`}
            </pre>
          </div>

          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#f1f5f9', margin: '15px 0 5px' }}>2. POST /api/mcp</h3>
          <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0 0 10px' }}>MCP JSON-RPC tools execution endpoint for running automated workflows.</p>
          <div style={{ position: 'relative' }}>
            <pre style={{ background: '#070a13', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 8, padding: 16, fontSize: '0.8rem', fontFamily: 'monospace', color: '#34d399', overflowX: 'auto', margin: 0 }}>
{`// Request Payload
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "web_search",
    "arguments": { "query": "Supabase storage keys" }
  },
  "id": 1
}`}
            </pre>
          </div>
        </div>
      )
    },
    {
      id: 'troubleshooting',
      category: '5. DEVELOPER REFERENCE',
      title: 'Troubleshooting Guide',
      icon: HelpCircle,
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>Troubleshooting Guide</h2>
          <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: '#94a3b8', margin: 0 }}>
            Resolve typical connection blocks, migration conflicts, or workspace issues quickly.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 10 }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#ef4444', marginBottom: 6 }}>Database Connection Timeout Errors</div>
              <p style={{ fontSize: '0.84rem', lineHeight: 1.5, color: '#cbd5e1', margin: '0 0 10px' }}>
                This triggers on IPv4-only local network layers when routing Postgres strings directly to IPv6 endpoints.
              </p>
              <div style={{ fontSize: '0.84rem', lineHeight: 1.5, color: '#22c55e', fontWeight: 500 }}>
                <strong>Resolution:</strong> Swap direct credentials with Supabase AWS regional pooler targets over port 6543, and configure SSL ignoring hooks in your Node Client constructor blocks.
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#ef4444', marginBottom: 6 }}>Supabase Realtime Broadcast Blocks</div>
              <p style={{ fontSize: '0.84rem', lineHeight: 1.5, color: '#cbd5e1', margin: '0 0 10px' }}>
                Occurs when the Social Feed does not register postgres insertions dynamically.
              </p>
              <div style={{ fontSize: '0.84rem', lineHeight: 1.5, color: '#22c55e', fontWeight: 500 }}>
                <strong>Resolution:</strong> Confirm database replication publication permissions are active by running: <code style={{ color: 'var(--accent-cyan)' }}>ALTER PUBLICATION supabase_realtime ADD TABLE orbit_blogs;</code> in the database console.
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  // Group sections by category
  const categories = Array.from(new Set(sections.map(s => s.category)));

  const activeSectionObj = sections.find(s => s.id === activeSection) || sections[0];

  return (
    <div style={{ minHeight: '100vh', background: '#070b13', color: '#cbd5e1', fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', flexDirection: 'column' }}>
      
      {/* Sticky Top Navbar */}
      <nav style={{
        height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', background: '#0b0f19', borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <OrbitLogo variant="full" size={24} />
        </Link>
        <Link href="/dashboard" style={{
          padding: '6px 14px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600,
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          color: '#cbd5e1', textDecoration: 'none', transition: 'all 0.15s'
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#cbd5e1'; }}
        >
          Back to Dashboard
        </Link>
      </nav>

      {/* Main Container */}
      <div style={{ flex: 1, display: 'flex', maxWidth: 1200, width: '100%', margin: '0 auto', position: 'relative' }}>
        
        {/* Left-hand Sidebar Navigation */}
        <aside style={{
          width: 280, borderRight: '1px solid rgba(255,255,255,0.06)',
          padding: '30px 16px', display: 'flex', flexDirection: 'column', gap: 24,
          position: 'sticky', top: 60, height: 'calc(100vh - 60px)', overflowY: 'auto'
        }}>
          {categories.map((cat) => (
            <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#475569', letterSpacing: '0.08em', padding: '0 8px' }}>
                {cat}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {sections.filter(s => s.category === cat).map((s) => {
                  const Icon = s.icon;
                  const isActive = activeSection === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setActiveSection(s.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 6,
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '0.84rem',
                        fontWeight: isActive ? 600 : 500,
                        background: isActive ? 'rgba(79, 140, 255, 0.08)' : 'transparent',
                        color: isActive ? '#60a5fa' : '#94a3b8',
                        position: 'relative',
                        transition: 'all 0.15s'
                      }}
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = '#fff'; }}
                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = '#94a3b8'; }}
                    >
                      {isActive && (
                        <div style={{ position: 'absolute', left: 0, top: 8, bottom: 8, width: 2, background: '#4F8CFF', borderRadius: 2 }} />
                      )}
                      <Icon size={14} style={{ opacity: isActive ? 1 : 0.6 }} />
                      {s.title}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </aside>

        {/* Center Main Panel Content */}
        <main style={{
          flex: 1, padding: '40px 48px 80px', minWidth: 0,
          animation: 'fadeIn 0.25s ease-out'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* Header path indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', fontWeight: 650, color: '#475569', letterSpacing: '0.04em' }}>
              <span>DOCS</span>
              <ChevronRight size={10} />
              <span>{activeSectionObj.category}</span>
              <ChevronRight size={10} />
              <span style={{ color: 'var(--accent-blue)' }}>{activeSectionObj.title.toUpperCase()}</span>
            </div>

            {/* Actual dynamic section content render */}
            <div style={{ background: '#0f1524', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '32px 36px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
              {activeSectionObj.content}
            </div>

            {/* Navigation footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 24, marginTop: 20 }}>
              <div style={{ fontSize: '0.74rem', color: '#475569' }}>
                Need help? <a href="mailto:support@orbit.dev" style={{ color: 'var(--accent-blue)', textDecoration: 'none' }}>Contact support</a>
              </div>
              <a href="https://github.com/jishnukeyhack/Orbit" target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.74rem', color: 'var(--accent-blue)', textDecoration: 'none' }}>
                View GitHub Repository <ArrowUpRight size={11} />
              </a>
            </div>

          </div>
        </main>

      </div>

      {/* Global CSS for seamless Butter-Smooth transitions */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
