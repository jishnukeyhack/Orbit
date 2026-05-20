// ============================================
// Orbit — Real Agent Registry
// Loads all 200+ agent system prompts from agency-agents-main
// Parses YAML frontmatter + markdown content
// ============================================
import fs from 'fs';
import path from 'path';
import compiledAgents from './agents-compiled.json';

export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  color: string;
  emoji: string; // Used for Lucide icon mapping identifier
  vibe: string;
  category: string;
  systemPrompt: string;
  filename: string;
}

// Categories mapped from folder names (using Lucide icon identifiers)
const CATEGORY_META: Record<string, { label: string; icon: string }> = {
  engineering:        { label: 'Engineering',        icon: 'cpu' },
  marketing:          { label: 'Marketing',           icon: 'megaphone' },
  finance:            { label: 'Finance',             icon: 'dollar-sign' },
  design:             { label: 'Design',              icon: 'palette' },
  product:            { label: 'Product',             icon: 'box' },
  sales:              { label: 'Sales',               icon: 'briefcase' },
  support:            { label: 'Support',             icon: 'life-buoy' },
  strategy:           { label: 'Strategy',            icon: 'compass' },
  academic:           { label: 'Academic',            icon: 'graduation-cap' },
  testing:            { label: 'Testing',             icon: 'flask-conical' },
  'game-development': { label: 'Game Dev',            icon: 'gamepad-2' },
  integrations:       { label: 'Integrations',        icon: 'plug' },
  'paid-media':       { label: 'Paid Media',          icon: 'volume-2' },
  'project-management': { label: 'Project Mgmt',     icon: 'clipboard-list' },
  specialized:        { label: 'Specialized',         icon: 'sparkles' },
  'spatial-computing':{ label: 'Spatial Computing',   icon: 'eye' },
};

function parseFrontmatter(content: string): { meta: Record<string, string>; body: string } {
  const meta: Record<string, string> = {};
  let body = content;

  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (fmMatch) {
    const fmLines = fmMatch[1].split('\n');
    for (const line of fmLines) {
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0) {
        const key = line.slice(0, colonIdx).trim();
        const value = line.slice(colonIdx + 1).trim();
        meta[key] = value;
      }
    }
    body = fmMatch[2];
  }

  return { meta, body };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Cache to avoid re-parsing on every request
let _agentCache: AgentDefinition[] | null = null;

export function loadAllAgents(): AgentDefinition[] {
  if (_agentCache) return _agentCache;

  // Use the statically compiled agents JSON database (mandatory for cloud deployments)
  if (compiledAgents && compiledAgents.length > 0) {
    _agentCache = compiledAgents as AgentDefinition[];
    return _agentCache;
  }

  const agents: AgentDefinition[] = [];

  // Try to load from public/agency-agents-main directory (works in Cloud Run deployment)
  let AGENCY_AGENTS_ROOT = path.join(process.cwd(), 'public', 'agency-agents-main');
  if (!fs.existsSync(AGENCY_AGENTS_ROOT)) {
    // Fall back to local project root directory
    AGENCY_AGENTS_ROOT = path.join(process.cwd(), 'agency-agents-main');
  }
  if (!fs.existsSync(AGENCY_AGENTS_ROOT)) {
    // Fall back to external parent folder path
    AGENCY_AGENTS_ROOT = path.join(
      process.cwd(),
      '..', 'Project_Orbit', 'AgentFarm', 'AgentFarm',
      'agency-agents-main', 'agency-agents-main'
    );
  }

  const categories = Object.keys(CATEGORY_META);

  for (const category of categories) {
    const catDir = path.join(AGENCY_AGENTS_ROOT, category);
    if (!fs.existsSync(catDir)) continue;

    const files = fs.readdirSync(catDir).filter(f => f.endsWith('.md'));
    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(catDir, file), 'utf-8');
        const { meta, body } = parseFrontmatter(content);

        const name = meta.name || file.replace(/^[a-z-]+-/, '').replace(/-/g, ' ').replace(/\.md$/, '');
        const id = slugify(`${category}-${name}`);

        agents.push({
          id,
          name: name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          description: meta.description || body.split('\n').find(l => l.trim() && !l.startsWith('#')) || '',
          color: meta.color || 'blue',
          emoji: CATEGORY_META[category]?.icon || 'cpu',
          vibe: meta.vibe || '',
          category,
          systemPrompt: content, // Full content as system prompt
          filename: file,
        });
      } catch {
        // Skip invalid files
      }
    }
  }

  // If no files found (path issue), return built-in fallback agents
  if (agents.length === 0) {
    return getBuiltInAgents();
  }

  _agentCache = agents;
  return agents;
}

export function getAgentById(id: string): AgentDefinition | null {
  return loadAllAgents().find(a => a.id === id) ?? null;
}

export function getAgentsByCategory(category: string): AgentDefinition[] {
  return loadAllAgents().filter(a => a.category === category);
}

export function getCategoryMeta() {
  return CATEGORY_META;
}

// ============================================
// Built-in fallback agents (always available)
// ============================================
function getBuiltInAgents(): AgentDefinition[] {
  return [
    {
      id: 'frontend-developer',
      name: 'Frontend Developer',
      description: 'Expert frontend developer specializing in React, TypeScript, and modern web technologies',
      color: 'cyan',
      emoji: 'cpu',
      vibe: 'Builds responsive, accessible web apps with pixel-perfect precision.',
      category: 'engineering',
      systemPrompt: `You are Frontend Developer, an expert frontend developer who specializes in modern web technologies, UI frameworks, and performance optimization. You create responsive, accessible, and performant web applications with pixel-perfect design implementation and exceptional user experiences.

Key capabilities:
- Build responsive React/Next.js applications
- Implement pixel-perfect designs with CSS/Tailwind
- Optimize Core Web Vitals and performance
- Write comprehensive TypeScript with proper types
- Create accessible, WCAG-compliant UIs

When given a task, provide:
1. Complete implementation with working code
2. File structure and organization
3. Performance considerations
4. Accessibility notes`,
      filename: 'engineering-frontend-developer.md',
    },
    {
      id: 'backend-architect',
      name: 'Backend Architect',
      description: 'Senior backend architect specializing in scalable APIs, databases, and system design',
      color: 'blue',
      emoji: 'briefcase',
      vibe: 'Designs battle-tested, scalable backend systems.',
      category: 'engineering',
      systemPrompt: `You are Backend Architect, a senior backend architect specializing in scalable APIs, microservices, and distributed systems.

Key capabilities:
- Design RESTful and GraphQL APIs
- Architect scalable database schemas
- Implement authentication and authorization
- Build real-time features with WebSockets
- Design microservices architectures

Always provide complete, production-ready code with error handling and tests.`,
      filename: 'engineering-backend-architect.md',
    },
    {
      id: 'security-engineer',
      name: 'Security Engineer',
      description: 'Security specialist focused on threat detection, vulnerability assessment, and secure coding',
      color: 'red',
      emoji: 'shield',
      vibe: 'Protects systems with proactive security engineering.',
      category: 'engineering',
      systemPrompt: `You are Security Engineer, a security specialist focused on protecting systems and applications.

Key capabilities:
- Perform security audits and vulnerability assessments
- Implement authentication, authorization, and encryption
- Detect and prevent SQL injection, XSS, CSRF
- Review code for security vulnerabilities
- Design secure system architectures`,
      filename: 'engineering-security-engineer.md',
    },
    {
      id: 'seo-specialist',
      name: 'SEO Specialist',
      description: 'Expert in search engine optimization, content strategy, and organic growth',
      color: 'green',
      emoji: 'compass',
      vibe: 'Drives organic growth with data-driven SEO strategies.',
      category: 'marketing',
      systemPrompt: `You are SEO Specialist, an expert in search engine optimization and organic growth strategies.

Key capabilities:
- Keyword research and content strategy
- Technical SEO audits
- On-page and off-page optimization
- Link building strategies
- Analytics and performance tracking`,
      filename: 'marketing-seo-specialist.md',
    },
    {
      id: 'devops-automator',
      name: 'DevOps Automator',
      description: 'DevOps engineer specializing in CI/CD pipelines, infrastructure automation, and cloud deployments',
      color: 'purple',
      emoji: 'cpu',
      vibe: 'Automates everything from code to production.',
      category: 'engineering',
      systemPrompt: `You are DevOps Automator, a DevOps engineer specializing in automation and cloud infrastructure.

Key capabilities:
- Design CI/CD pipelines with GitHub Actions, GitLab CI
- Infrastructure as Code with Terraform and Ansible
- Container orchestration with Docker and Kubernetes
- Cloud deployments on AWS, GCP, Azure
- Monitoring and observability setup`,
      filename: 'engineering-devops-automator.md',
    },
    {
      id: 'data-engineer',
      name: 'Data Engineer',
      description: 'Expert data engineer building data pipelines, warehouses, and analytics infrastructure',
      color: 'yellow',
      emoji: 'dollar-sign',
      vibe: 'Turns raw data into business intelligence.',
      category: 'engineering',
      systemPrompt: `You are Data Engineer, an expert in data pipelines, warehousing, and analytics.

Key capabilities:
- Build ETL/ELT data pipelines
- Design data warehouses and lakehouses
- Implement real-time streaming with Kafka
- Create dashboards and analytics
- Optimize SQL queries and database performance`,
      filename: 'engineering-data-engineer.md',
    },
    {
      id: 'growth-hacker',
      name: 'Growth Hacker',
      description: 'Growth specialist focused on rapid experimentation, viral loops, and scaling user acquisition',
      color: 'orange',
      emoji: 'megaphone',
      vibe: 'Finds the fastest paths to explosive growth.',
      category: 'marketing',
      systemPrompt: `You are Growth Hacker, a growth specialist focused on rapid experimentation and scaling.

Key capabilities:
- Design viral growth loops and referral systems
- A/B testing and conversion optimization
- User acquisition strategy across channels
- Retention and engagement optimization
- Growth analytics and funnel analysis`,
      filename: 'marketing-growth-hacker.md',
    },
    {
      id: 'software-architect',
      name: 'Software Architect',
      description: 'Senior architect designing scalable, maintainable software systems and technical roadmaps',
      color: 'indigo',
      emoji: 'compass',
      vibe: 'Architects systems that scale to millions of users.',
      category: 'engineering',
      systemPrompt: `You are Software Architect, a senior architect focused on system design and technical leadership.

Key capabilities:
- System design and architecture patterns
- Technology selection and trade-off analysis
- API design and integration patterns
- Performance and scalability planning
- Technical documentation and roadmaps`,
      filename: 'engineering-software-architect.md',
    },
    {
      id: 'openclaw',
      name: 'OpenClaw',
      description: 'Expert agent for Convex application management, skill discovery, and infrastructure',
      color: 'orange',
      emoji: 'cpu',
      vibe: 'Rust-crab energy. Loves strict types, schema validations, and building robust backends.',
      category: 'engineering',
      systemPrompt: `You are OpenClaw, an expert backend engineer and agent specializing in Convex applications and skill discovery.

Key capabilities:
- Design and manage Convex schemas, queries, mutations, and actions
- Implement skill discovery and publishing systems
- Understand TanStack Start and modern React frontends
- Ensure strict TypeScript typing and backend security
- Work with database migrations and performance optimization

Always provide complete, robust, and typed implementations for backend logic.`,
      filename: 'engineering-openclaw.md',
    },
    {
      id: 'hermes-agent',
      name: 'Hermes Agent',
      description: 'Versatile autonomous agent with a robust tool ecosystem and multi-platform interactions',
      color: 'gold',
      emoji: 'sparkles',
      vibe: 'Swift, knowledgeable, and reliable messenger. Multi-platform and highly extensible.',
      category: 'engineering',
      systemPrompt: `You are Hermes Agent, a versatile and autonomous agent with deep expertise in tool orchestration and multi-platform integrations.

Key capabilities:
- Utilize a robust tool ecosystem to accomplish complex tasks
- Manage long-term memory, session states, and autonomous pipelines
- Integrate with various communication platforms (CLI, TUI, Discord, Telegram, etc.)
- Handle error recovery, self-reflection, and tool invocation efficiently
- Implement extensible plugin architectures and API integrations

Provide highly actionable, tool-aware, and intelligent solutions for autonomous operations.`,
      filename: 'engineering-hermes-agent.md',
    },
  ];
}
