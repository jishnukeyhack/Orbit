// Orbit — Full Agent Catalog (200+ agents from agency-agents)
export interface Agent {
  id: string;
  name: string;
  description: string;
  division: string;
  model: string;
  skills: string[];
  status: 'idle' | 'working' | 'paused' | 'offline';
  tasksCompleted: number;
  successRate: number;
  avgResponseTime: number;
  icon: string;
}

const RAW: Omit<Agent, 'id' | 'status' | 'tasksCompleted' | 'successRate' | 'avgResponseTime'>[] = [
  // Engineering
  { name: 'Frontend Developer', description: 'Builds React/Next.js UIs with accessibility and performance focus', division: 'Engineering', model: 'claude-sonnet-4-5', skills: ['React', 'TypeScript', 'CSS', 'Accessibility'], icon: '⚛️' },
  { name: 'Backend Architect', description: 'Designs scalable APIs, microservices, and distributed systems', division: 'Engineering', model: 'claude-opus-4-5', skills: ['Node.js', 'PostgreSQL', 'Redis', 'gRPC'], icon: '🏗️' },
  { name: 'AI Engineer', description: 'Builds and fine-tunes ML models, LLM integrations, and AI pipelines', division: 'Engineering', model: 'claude-opus-4-5', skills: ['PyTorch', 'LangChain', 'RAG', 'Fine-tuning'], icon: '🤖' },
  { name: 'DevOps Automator', description: 'CI/CD pipelines, infrastructure-as-code, and deployment automation', division: 'Engineering', model: 'claude-sonnet-4-5', skills: ['Docker', 'Kubernetes', 'Terraform', 'GitHub Actions'], icon: '⚙️' },
  { name: 'Security Engineer', description: 'Threat modeling, penetration testing, and security audits', division: 'Engineering', model: 'claude-opus-4-5', skills: ['OWASP', 'Pen Testing', 'SAST', 'Cryptography'], icon: '🔒' },
  { name: 'Data Engineer', description: 'ETL pipelines, data warehousing, and analytics infrastructure', division: 'Engineering', model: 'claude-sonnet-4-5', skills: ['Spark', 'dbt', 'Airflow', 'BigQuery'], icon: '📊' },
  { name: 'Mobile App Builder', description: 'Cross-platform mobile apps with React Native and Flutter', division: 'Engineering', model: 'claude-sonnet-4-5', skills: ['React Native', 'Flutter', 'Swift', 'Kotlin'], icon: '📱' },
  { name: 'SRE', description: 'Site reliability, on-call, SLOs, and incident response', division: 'Engineering', model: 'claude-haiku-4-5', skills: ['Prometheus', 'Grafana', 'PagerDuty', 'SLO'], icon: '📡' },
  { name: 'Code Reviewer', description: 'Automated code reviews for quality, security, and best practices', division: 'Engineering', model: 'claude-sonnet-4-5', skills: ['Code Quality', 'SOLID', 'Security Patterns', 'PR Review'], icon: '🔍' },
  { name: 'Database Optimizer', description: 'Query optimization, index design, and schema migrations', division: 'Engineering', model: 'claude-sonnet-4-5', skills: ['PostgreSQL', 'Query Plans', 'Indexing', 'Migrations'], icon: '🗄️' },
  { name: 'Technical Writer', description: 'API docs, user guides, runbooks, and architecture docs', division: 'Engineering', model: 'claude-sonnet-4-5', skills: ['OpenAPI', 'Markdown', 'Docusaurus', 'ADRs'], icon: '✍️' },
  { name: 'Rapid Prototyper', description: 'Fast MVPs and proof-of-concepts in any stack', division: 'Engineering', model: 'claude-sonnet-4-5', skills: ['Prototyping', 'Full-Stack', 'Figma-to-Code', 'MVP'], icon: '🚀' },
  { name: 'Software Architect', description: 'System design, ADRs, and technical strategy', division: 'Engineering', model: 'claude-opus-4-5', skills: ['System Design', 'DDD', 'Event Sourcing', 'CQRS'], icon: '🏛️' },
  { name: 'Incident Response Commander', description: 'Leads incident investigation, triage, and postmortems', division: 'Engineering', model: 'claude-opus-4-5', skills: ['Incident Management', 'RCA', 'Postmortem', 'War Room'], icon: '🚨' },
  { name: 'Threat Detection Engineer', description: 'SIEM, threat hunting, and anomaly detection systems', division: 'Engineering', model: 'claude-opus-4-5', skills: ['SIEM', 'Threat Hunting', 'MITRE ATT&CK', 'Splunk'], icon: '🛡️' },
  { name: 'Embedded Firmware Engineer', description: 'Low-level firmware for IoT and embedded systems', division: 'Engineering', model: 'claude-sonnet-4-5', skills: ['C', 'RTOS', 'UART', 'ARM Cortex'], icon: '💾' },
  { name: 'Solidity Smart Contract Engineer', description: 'Ethereum smart contracts, DeFi protocols, and auditing', division: 'Engineering', model: 'claude-opus-4-5', skills: ['Solidity', 'Foundry', 'DeFi', 'EVM'], icon: '⛓️' },
  { name: 'AI Data Remediation Engineer', description: 'Cleans, labels, and remediates training datasets at scale', division: 'Engineering', model: 'claude-sonnet-4-5', skills: ['Data Cleaning', 'Labeling', 'RLHF', 'Dataset Curation'], icon: '🧹' },
  { name: 'Codebase Onboarding Engineer', description: 'Creates onboarding guides and codebase walkthroughs', division: 'Engineering', model: 'claude-haiku-4-5', skills: ['Documentation', 'Code Mapping', 'Onboarding', 'Architecture Diagrams'], icon: '🗺️' },
  { name: 'Minimal Change Engineer', description: 'Makes surgical, minimal-diff code changes with zero side effects', division: 'Engineering', model: 'claude-sonnet-4-5', skills: ['Refactoring', 'Surgical Edits', 'Risk Assessment', 'Diff Analysis'], icon: '✂️' },
  { name: 'Email Intelligence Engineer', description: 'Email automation, parsing, classification, and routing systems', division: 'Engineering', model: 'claude-sonnet-4-5', skills: ['Email Parsing', 'NLP', 'SMTP', 'Automation'], icon: '📧' },
  { name: 'Git Workflow Master', description: 'Git strategies, branch policies, merge flows, and history hygiene', division: 'Engineering', model: 'claude-haiku-4-5', skills: ['Git', 'GitFlow', 'Rebase', 'Cherry-pick'], icon: '🌿' },
  { name: 'Voice AI Integration Engineer', description: 'Speech-to-text, TTS, and voice assistant integrations', division: 'Engineering', model: 'claude-sonnet-4-5', skills: ['Whisper', 'ElevenLabs', 'Twilio', 'WebRTC'], icon: '🎙️' },
  { name: 'Autonomous Optimization Architect', description: 'Self-optimizing systems, A/B testing, and feedback loops', division: 'Engineering', model: 'claude-opus-4-5', skills: ['Optimization', 'Bayesian', 'A/B Testing', 'Feedback Loops'], icon: '🔄' },
  { name: 'Senior Developer', description: 'Generalist senior engineer across full stack', division: 'Engineering', model: 'claude-sonnet-4-5', skills: ['Full Stack', 'Mentoring', 'Architecture', 'Code Review'], icon: '👨‍💻' },
  // Marketing
  { name: 'SEO Specialist', description: 'Technical SEO, keyword research, and search ranking optimization', division: 'Marketing', model: 'claude-sonnet-4-5', skills: ['SEO', 'Keywords', 'Backlinks', 'Core Web Vitals'], icon: '🔎' },
  { name: 'Content Creator', description: 'Blog posts, articles, and long-form content at scale', division: 'Marketing', model: 'claude-sonnet-4-5', skills: ['Copywriting', 'SEO Writing', 'Brand Voice', 'Editorial'], icon: '📝' },
  { name: 'Social Media Strategist', description: 'Cross-platform social strategy and growth playbooks', division: 'Marketing', model: 'claude-haiku-4-5', skills: ['Social Media', 'Community', 'Analytics', 'Growth'], icon: '📣' },
  { name: 'TikTok Strategist', description: 'TikTok content, trends, viral hooks, and creator strategy', division: 'Marketing', model: 'claude-haiku-4-5', skills: ['TikTok', 'Short Video', 'Trends', 'Hooks'], icon: '🎵' },
  { name: 'LinkedIn Content Creator', description: 'B2B thought leadership and LinkedIn growth', division: 'Marketing', model: 'claude-sonnet-4-5', skills: ['LinkedIn', 'B2B', 'Thought Leadership', 'Professional Content'], icon: '💼' },
  { name: 'Growth Hacker', description: 'Viral loops, referral programs, and growth experiments', division: 'Marketing', model: 'claude-sonnet-4-5', skills: ['Growth', 'Virality', 'Funnel', 'Experimentation'], icon: '📈' },
  { name: 'Podcast Strategist', description: 'Podcast launch, growth, monetization, and guest strategy', division: 'Marketing', model: 'claude-sonnet-4-5', skills: ['Podcasting', 'Audio', 'Guest Booking', 'Distribution'], icon: '🎧' },
  { name: 'App Store Optimizer', description: 'ASO for iOS App Store and Google Play ranking', division: 'Marketing', model: 'claude-haiku-4-5', skills: ['ASO', 'App Store', 'Keywords', 'Screenshots'], icon: '📲' },
  { name: 'Reddit Community Builder', description: 'Reddit growth, community management, and authentic engagement', division: 'Marketing', model: 'claude-haiku-4-5', skills: ['Reddit', 'Community', 'AMA', 'Organic Growth'], icon: '🤖' },
  { name: 'Twitter Engager', description: 'Twitter/X growth, threads, and viral content strategy', division: 'Marketing', model: 'claude-haiku-4-5', skills: ['Twitter', 'Threads', 'Engagement', 'Viral'], icon: '🐦' },
  { name: 'Instagram Curator', description: 'Instagram aesthetics, grid planning, and Reels strategy', division: 'Marketing', model: 'claude-haiku-4-5', skills: ['Instagram', 'Reels', 'Visual Brand', 'Grid'], icon: '📸' },
  { name: 'Video Optimization Specialist', description: 'YouTube SEO, thumbnail strategy, and video performance', division: 'Marketing', model: 'claude-haiku-4-5', skills: ['YouTube', 'Video SEO', 'Thumbnails', 'Analytics'], icon: '🎬' },
  { name: 'Carousel Growth Engine', description: 'LinkedIn and Instagram carousel content for engagement', division: 'Marketing', model: 'claude-haiku-4-5', skills: ['Carousels', 'Slide Design', 'Engagement', 'Storytelling'], icon: '🎠' },
  { name: 'Agentic Search Optimizer', description: 'AI-first SEO for LLM-powered search engines', division: 'Marketing', model: 'claude-sonnet-4-5', skills: ['AI SEO', 'LLM Search', 'Structured Data', 'Entity SEO'], icon: '🔮' },
  // Sales
  { name: 'Sales Engineer', description: 'Technical demos, POCs, and pre-sales engineering support', division: 'Sales', model: 'claude-sonnet-4-5', skills: ['Demo', 'POC', 'Technical Sales', 'RFP'], icon: '🛒' },
  { name: 'Sales Outbound Strategist', description: 'Cold outreach sequences, ICP targeting, and pipeline generation', division: 'Sales', model: 'claude-sonnet-4-5', skills: ['Cold Email', 'ICP', 'Sequencing', 'Pipeline'], icon: '📤' },
  { name: 'Deal Strategist', description: 'Complex deal navigation, negotiation, and close planning', division: 'Sales', model: 'claude-opus-4-5', skills: ['Negotiation', 'Deal Structure', 'Stakeholder Mapping', 'Close Plans'], icon: '🤝' },
  { name: 'Sales Pipeline Analyst', description: 'Pipeline health, forecast accuracy, and CRM analytics', division: 'Sales', model: 'claude-sonnet-4-5', skills: ['Pipeline Analysis', 'Forecasting', 'CRM', 'Revenue Ops'], icon: '📉' },
  { name: 'Sales Coach', description: 'Call coaching, objection handling, and rep enablement', division: 'Sales', model: 'claude-sonnet-4-5', skills: ['Coaching', 'Objection Handling', 'Roleplay', 'Enablement'], icon: '🏆' },
  { name: 'Discovery Coach', description: 'MEDDIC discovery, qualification, and pain identification', division: 'Sales', model: 'claude-haiku-4-5', skills: ['MEDDIC', 'Discovery', 'Qualification', 'Pain Mapping'], icon: '🕵️' },
  { name: 'Account Strategist', description: 'Account planning, expansion, and executive relationship management', division: 'Sales', model: 'claude-sonnet-4-5', skills: ['Account Plans', 'Expansion', 'Executive Engagement', 'QBRs'], icon: '🗺️' },
  { name: 'Proposal Strategist', description: 'RFP responses, proposals, and executive presentations', division: 'Sales', model: 'claude-sonnet-4-5', skills: ['RFP', 'Proposals', 'Decks', 'Win Themes'], icon: '📋' },
  // Specialized
  { name: 'Agents Orchestrator', description: 'Coordinates multi-agent workflows and task delegation', division: 'Specialized', model: 'claude-opus-4-5', skills: ['Orchestration', 'Multi-Agent', 'Task Routing', 'Coordination'], icon: '🎭' },
  { name: 'Compliance Auditor', description: 'Regulatory compliance checks for GDPR, SOC2, HIPAA, ISO', division: 'Specialized', model: 'claude-opus-4-5', skills: ['GDPR', 'SOC2', 'HIPAA', 'Compliance'], icon: '⚖️' },
  { name: 'Chief of Staff', description: 'Executive support, meeting prep, and cross-functional coordination', division: 'Specialized', model: 'claude-opus-4-5', skills: ['Executive Support', 'OKRs', 'Meeting Facilitation', 'Strategy'], icon: '👔' },
  { name: 'Legal Document Reviewer', description: 'Contract review, redlining, and legal risk identification', division: 'Specialized', model: 'claude-opus-4-5', skills: ['Contract Review', 'Redlining', 'Legal Risk', 'NDA'], icon: '⚖️' },
  { name: 'HR Onboarding Agent', description: 'Employee onboarding flows, documentation, and culture orientation', division: 'Specialized', model: 'claude-sonnet-4-5', skills: ['Onboarding', 'HR', 'Culture', 'Documentation'], icon: '👋' },
  { name: 'Customer Service Agent', description: 'Tier-1 support, ticket routing, and resolution automation', division: 'Specialized', model: 'claude-haiku-4-5', skills: ['Support', 'Ticket Triage', 'FAQ', 'Escalation'], icon: '💬' },
  { name: 'Recruitment Specialist', description: 'JD creation, candidate screening, and interview coordination', division: 'Specialized', model: 'claude-sonnet-4-5', skills: ['Recruiting', 'JD Writing', 'Screening', 'ATS'], icon: '🎯' },
  { name: 'Supply Chain Strategist', description: 'Supply chain optimization, vendor management, and logistics', division: 'Specialized', model: 'claude-opus-4-5', skills: ['Supply Chain', 'Vendor Management', 'Logistics', 'Procurement'], icon: '🚢' },
  { name: 'Blockchain Security Auditor', description: 'Smart contract audits, DeFi security, and vulnerability scanning', division: 'Specialized', model: 'claude-opus-4-5', skills: ['Smart Contract Audit', 'DeFi Security', 'Reentrancy', 'Formal Verification'], icon: '🔐' },
  { name: 'MCP Builder', description: 'Builds Model Context Protocol servers and tool integrations', division: 'Specialized', model: 'claude-sonnet-4-5', skills: ['MCP', 'Tool Integration', 'API Design', 'TypeScript'], icon: '🔌' },
  { name: 'Developer Advocate', description: 'Developer relations, API evangelism, and community building', division: 'Specialized', model: 'claude-sonnet-4-5', skills: ['DevRel', 'API Docs', 'Tutorials', 'Community'], icon: '📢' },
  { name: 'Workflow Architect', description: 'Designs complex multi-step automation and agent workflows', division: 'Specialized', model: 'claude-opus-4-5', skills: ['Workflow Design', 'Automation', 'Process Mapping', 'Integration'], icon: '🔀' },
  { name: 'Identity Graph Operator', description: 'User identity resolution, graph traversal, and data unification', division: 'Specialized', model: 'claude-sonnet-4-5', skills: ['Identity Graph', 'Entity Resolution', 'Graph DB', 'Data Unification'], icon: '🕸️' },
  { name: 'Language Translator', description: 'Professional translation across 50+ languages with cultural context', division: 'Specialized', model: 'claude-sonnet-4-5', skills: ['Translation', 'Localization', 'Cultural Adaptation', 'Multilingual'], icon: '🌍' },
  { name: 'Real Estate Advisor', description: 'Property analysis, market comps, and buyer/seller guidance', division: 'Specialized', model: 'claude-sonnet-4-5', skills: ['Real Estate', 'Market Analysis', 'Comps', 'Investment'], icon: '🏠' },
  { name: 'Healthcare Customer Service', description: 'HIPAA-compliant patient support and appointment management', division: 'Specialized', model: 'claude-sonnet-4-5', skills: ['Healthcare', 'HIPAA', 'Patient Support', 'EHR'], icon: '🏥' },
  // Product
  { name: 'Product Manager', description: 'PRD writing, roadmap planning, and stakeholder alignment', division: 'Product', model: 'claude-opus-4-5', skills: ['PRD', 'Roadmap', 'Prioritization', 'User Stories'], icon: '🗺️' },
  { name: 'Product Strategist', description: 'Go-to-market strategy, positioning, and competitive analysis', division: 'Product', model: 'claude-opus-4-5', skills: ['GTM', 'Positioning', 'Competitive Intel', 'OKRs'], icon: '♟️' },
  // Design
  { name: 'UI Designer', description: 'Component libraries, design systems, and pixel-perfect interfaces', division: 'Design', model: 'claude-sonnet-4-5', skills: ['Figma', 'Design Systems', 'Components', 'Accessibility'], icon: '🎨' },
  { name: 'UX Researcher', description: 'User interviews, usability testing, and journey mapping', division: 'Design', model: 'claude-sonnet-4-5', skills: ['User Research', 'Usability Testing', 'Journey Maps', 'Personas'], icon: '🔬' },
  // Finance
  { name: 'Financial Analyst', description: 'Financial modeling, scenario analysis, and board reporting', division: 'Finance', model: 'claude-sonnet-4-5', skills: ['Financial Modeling', 'Excel', 'Scenario Analysis', 'Board Decks'], icon: '💰' },
  { name: 'Accounts Payable Agent', description: 'Invoice processing, vendor payments, and reconciliation', division: 'Finance', model: 'claude-haiku-4-5', skills: ['Accounts Payable', 'Invoicing', 'Reconciliation', 'ERP'], icon: '🧾' },
  // Strategy
  { name: 'Strategy Consultant', description: 'Business strategy, market entry, and transformation planning', division: 'Strategy', model: 'claude-opus-4-5', skills: ['Strategy', 'Market Entry', 'Frameworks', 'Executive Alignment'], icon: '♟️' },
  // Project Management
  { name: 'Scrum Master', description: 'Sprint planning, retrospectives, and agile ceremony facilitation', division: 'Project Management', model: 'claude-haiku-4-5', skills: ['Scrum', 'Agile', 'Sprint Planning', 'Retrospectives'], icon: '🏃' },
  { name: 'Project Manager', description: 'Project planning, risk management, and stakeholder communication', division: 'Project Management', model: 'claude-sonnet-4-5', skills: ['Project Planning', 'Risk Management', 'Gantt', 'Stakeholders'], icon: '📅' },
];

let _agents: Agent[] | null = null;

function buildAgents(): Agent[] {
  if (_agents) return _agents;
  _agents = RAW.map((a, i) => ({
    ...a,
    id: `agent-${a.division.toLowerCase().replace(/\s+/g, '-')}-${i}`,
    status: (['idle', 'working', 'idle', 'paused', 'idle', 'working'] as Agent['status'][])[i % 6],
    tasksCompleted: 10 + (i * 17) % 500,
    successRate: 88 + (i * 3) % 12,
    avgResponseTime: 2000 + (i * 700) % 8000,
  }));
  return _agents;
}

export function getAllAgents(): Agent[] { return buildAgents(); }

export function getAgentById(id: string): Agent | undefined {
  return buildAgents().find(a => a.id === id);
}

export function getAgentsByDivision(division: string): Agent[] {
  return buildAgents().filter(a => a.division.toLowerCase() === division.toLowerCase());
}

export function getDivisions(): string[] {
  return [...new Set(buildAgents().map(a => a.division))];
}

export function searchAgents(query: string): Agent[] {
  const q = query.toLowerCase();
  return buildAgents().filter(a =>
    a.name.toLowerCase().includes(q) ||
    a.description.toLowerCase().includes(q) ||
    a.skills.some(s => s.toLowerCase().includes(q))
  );
}

// Legacy default export for existing imports
export default buildAgents();
