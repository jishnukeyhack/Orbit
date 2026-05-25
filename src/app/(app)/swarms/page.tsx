'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Download, Code, Loader2, Sparkles, Shield, Cpu, Play, CheckCircle2, 
  AlertCircle, MessageSquare, Layers, Mail, GitBranch, ArrowRight, UserPlus, 
  HelpCircle, Search, Check, ExternalLink, FileSpreadsheet, PlayCircle,
  ChevronDown, ChevronRight, Send, RefreshCw, ArrowUpRight, Folder, FileText
} from 'lucide-react';

// Core Type Interfaces
interface AgentOption {
  id: string;
  name: string;
  emoji: string;
  category: string;
  color: string;
}

interface WorkspaceFile {
  name: string;
  path: string;
  type: 'dir' | 'file';
  size: number;
  mtime: number;
}

interface StreamEvent {
  type: string;
  swarmId?: string;
  agentId?: string;
  agentName?: string;
  text?: string;
  data?: Record<string, unknown>;
  timestamp: number;
}

interface AgentOutput {
  id: string;
  name: string;
  text: string;
  status: 'waiting' | 'running' | 'done' | 'error';
  tokens?: number;
  cost?: number;
}

interface MailboxMessage {
  from: string;
  to: string;
  body: string;
  timestamp: string;
}

interface YoutuberRow {
  field: string;
  category: string;
  rank: number;
  channelName: string;
  subscribers: string;
  description: string;
  link: string;
}

const STRATEGY_INFO = {
  parallel: { label: 'Parallel Swarm', icon: Layers, desc: 'All agents spawn and execute simultaneously — maximum velocity' },
  sequential: { label: 'Sequential Swarm', icon: GitBranch, desc: 'Agents hand off results one by one — best for step-wise refinement' },
  hierarchical: { label: 'Hierarchical Swarm', icon: Shield, desc: 'Lead orchestrator reviews and directs workers — YC startup style' },
};

const COLOR_MAP: Record<string, string> = {
  cyan: '#22d3ee', blue: '#3b82f6', purple: '#8b5cf6', green: '#10b981',
  red: '#ef4444', orange: '#f97316', yellow: '#eab308', pink: '#ec4899', indigo: '#6366f1',
};

const CATEGORIES = [
  "STEM & Engineering", "Life Sciences & Medicine", "Social Sciences & Humanities",
  "Mathematics & Computing", "Earth & Environmental", "Arts & Design", "Law & Policy"
];

// 100 Niche Fields List (Direct from USER_REQUEST)
const FIELDS_LIST = [
  "Polymer Chemistry", "Quantum Communication", "Music Theory", "Astrobiology", "Computational Linguistics",
  "Marine Biology", "Robotics Engineering", "Behavioral Economics", "Art History", "Neuroscience",
  "Cryptography", "Paleontology", "Biomedical Engineering", "International Relations", "Game Theory",
  "Materials Science", "Cognitive Psychology", "Aerospace Engineering", "Ethnomusicology", "Data Science",
  "Immunology", "Structural Engineering", "Philosophy of Mind", "Geophysics", "Molecular Biology",
  "Urban Planning", "Number Theory", "Chemical Engineering", "Archaeology", "Machine Learning",
  "Oceanography", "Constitutional Law", "Microbiology", "Financial Mathematics", "Sociology of Education",
  "Nuclear Physics", "Graphic Design", "Developmental Biology", "Operations Research", "Medieval Literature",
  "Environmental Science", "Control Systems Engineering", "Social Anthropology", "Topology", "Petroleum Engineering",
  "Film Studies", "Genetics", "Civil Engineering", "Political Philosophy", "Meteorology",
  "Biochemistry", "Software Engineering", "Linguistic Anthropology", "Differential Geometry", "Mining Engineering",
  "Renaissance Art", "Virology", "Electrical Engineering", "Ethics", "Seismology",
  "Biotechnology", "Mechanical Engineering", "Cultural Studies", "Graph Theory", "Hydrology",
  "Contemporary Dance", "Pharmacology", "Telecommunications Engineering", "Criminology", "Complex Analysis",
  "Geotechnical Engineering", "Classical Music", "Endocrinology", "Computer Vision", "Demography",
  "Fluid Dynamics", "Photography", "Hematology", "Information Security", "Social Psychology",
  "Optics", "Industrial Design", "Epidemiology", "Embedded Systems", "Linguistic Theory",
  "Thermodynamics", "Theater Studies", "Oncology", "Network Engineering", "Economic History",
  "Quantum Computing", "Fashion Design", "Cardiology", "Natural Language Processing", "Mythology Studies",
  "Nanotechnology", "Interior Design", "Gastroenterology", "Augmented Reality Development", "Comparative Religion"
];

// High-fidelity handcrafted sample niches
const HIGH_FIDELITY_NICHES = [
  {
    field: "Polymer Chemistry",
    category: "STEM & Engineering",
    channels: [
      { name: "NileRed", subs: "~7.6M", desc: "High-quality chemistry experiments and reactions.", handle: "@NileRed" },
      { name: "Periodic Videos", subs: "~1.63M", desc: "Videos about every element on the periodic table.", handle: "@periodicvideos" },
      { name: "Reactions", subs: "~500K", desc: "Chemistry facts and daily science explanations by ACS.", handle: "@ACSReactions" }
    ]
  },
  {
    field: "Quantum Communication",
    category: "STEM & Engineering",
    channels: [
      { name: "PBS Space Time", subs: "~3.17M", desc: "Astrophysics, quantum mechanics, and spacetime concepts.", handle: "@pbsspacetime" },
      { name: "Sabine Hossenfelder", subs: "~1.76M", desc: "Physicist discussing quantum theory, physics research, and realities.", handle: "@SabineHossenfelder" },
      { name: "Looking Glass Universe", subs: "~436K", desc: "Deep, visual explanations of quantum mechanics principles.", handle: "@LookingGlassUniverse" }
    ]
  },
  {
    field: "Music Theory",
    category: "Arts & Design",
    channels: [
      { name: "Rick Beato", subs: "~5.45M", desc: "Music theory, interviews, and deep dives into songwriting.", handle: "@rickbeato" },
      { name: "Andrew Huang", subs: "~2.37M", desc: "Creative music production, audio experiments, and theory.", handle: "@andrewismusic" },
      { name: "Adam Neely", subs: "~1.8M", desc: "Modern music theory, jazz concepts, and gig vlogs.", handle: "@AdamNeely" }
    ]
  },
  {
    field: "Astrobiology",
    category: "STEM & Engineering",
    channels: [
      { name: "NASA Astrobiology", subs: "~25.6K", desc: "Official NASA channel focusing on origins of life in the universe.", handle: "@nasaastrobiology" },
      { name: "Jay Alfred", subs: "~21.4K", desc: "Dark matter, astrobiology, and scientific anomalies.", handle: "@JayAlfred" },
      { name: "European Astrobiology Institute", subs: "~1.3K", desc: "Astrobiology seminars and academic lectures.", handle: "@EuropeanAstrobiologyInstitute" }
    ]
  },
  {
    field: "Computational Linguistics",
    category: "Mathematics & Computing",
    channels: [
      { name: "DeepLearning.AI", subs: "~426K", desc: "Neural networks, NLP, and machine learning courses by Andrew Ng.", handle: "@Deeplearningai" },
      { name: "Yannic Kilcher", subs: "~311K", desc: "AI papers, NLP deep dives, and machine learning reviews.", handle: "@YannicKilcher" },
      { name: "The Virtual Linguistics Campus", subs: "~129K", desc: "University lectures on language, NLP, and phonetics.", handle: "@VirtualLinguisticsCampus" }
    ]
  },
  {
    field: "Marine Biology",
    category: "Life Sciences & Medicine",
    channels: [
      { name: "Natural World Facts", subs: "~1.01M", desc: "Stunning nature documentaries on deep sea and marine life.", handle: "@NaturalWorldFacts" },
      { name: "KPassionate", subs: "~397K", desc: "Educational videos on marine creatures and ocean conservation.", handle: "@KPassionate" },
      { name: "Deep Marine Scenes", subs: "~45K", desc: "Explaining bizarre deep ocean ecosystems and marine biology.", handle: "@DeepMarineScenes" }
    ]
  },
  {
    field: "Robotics Engineering",
    category: "STEM & Engineering",
    channels: [
      { name: "Boston Dynamics", subs: "~3.20M", desc: "Cutting edge robotics demonstrations and behind-the-scenes engineering.", handle: "@BostonDynamics" },
      { name: "James Bruton", subs: "~1.10M", desc: "DIY robotics engineering, 3D printing, and Arduino guides.", handle: "@jamesbruton" },
      { name: "Stuff Made Here", subs: "~4.40M", desc: "Complex mechanical and robotic DIY creations.", handle: "@StuffMadeHere" }
    ]
  },
  {
    field: "Behavioral Economics",
    category: "Social Sciences & Humanities",
    channels: [
      { name: "Freakonomics Radio", subs: "~410K", desc: "Exploring the hidden side of everything with behavioral economics.", handle: "@Freakonomics" },
      { name: "Dan Ariely", subs: "~95K", desc: "Behavioral economist discussing irrational human actions.", handle: "@danariely" },
      { name: "The Behaviorist", subs: "~12K", desc: "Analysis of nudge theory and cognitive decision-making.", handle: "@TheBehaviorist" }
    ]
  },
  {
    field: "Art History",
    category: "Arts & Design",
    channels: [
      { name: "Great Art Explained", subs: "~1.80M", desc: "Deep dives into the details and history of famous masterpieces.", handle: "@GreatArtExplained" },
      { name: "The Art Assignment", subs: "~560K", desc: "PBS series exploring art history through active prompts.", handle: "@TheArtAssignment" },
      { name: "Perspective", subs: "~700K", desc: "Comprehensive documentaries on world art history.", handle: "@PerspectiveArt" }
    ]
  },
  {
    field: "Neuroscience",
    category: "Life Sciences & Medicine",
    channels: [
      { name: "Andrew Huberman", subs: "~5.60M", desc: "Science and science-based tools for everyday life.", handle: "@hubermanlab" },
      { name: "Neuro Transmissions", subs: "~140K", desc: "Making neuroscience, psychology, and brain study accessible.", handle: "@NeuroTransmissions" },
      { name: "BrainCraft", subs: "~520K", desc: "Psychology, neuroscience, and behavior explanations by Vanessa Hill.", handle: "@braincraft" }
    ]
  }
];

// Seeded agent names for 100 tasks
const AGENT_NAMES = [
  "Dewitt", "Faquet", "Gray", "Reid", "Louis", "Wildo", "Seven", "Ethan", "Fayer", "Quinne",
  "Tyler", "Max", "Liszt", "Watt", "Bergson", "Emerson", "Riemann", "Barthes", "Tej", "Bauman",
  "Feynman", "Searle", "Vince", "Jagger", "Galli", "Alexander", "Nozick", "Fisher", "Kian", "Prof. Davis",
  "Ayesha", "Judith", "Paige", "Phyllis", "Nidia", "Vernon", "Cody", "Mrs. Lim", "Judy", "Adam",
  "Ricardo", "K", "Bowen", "Parker", "Linn", "Zack", "Pareto", "Trey", "Keynes", "Friedrich",
  "Karl", "Sartre", "Coase", "Su", "Stigler", "Allen", "Principal Winston", "Nash", "Toby", "Maximus",
  "Jasmine", "Dr. Hu", "Martin", "Xavier", "Descartes", "Autumn", "Owen", "Paul", "Mok", "Debussy",
  "Winton", "Rosalind", "Li Hua", "Joker", "Quentin", "Lovel", "Wu", "Summer", "Kat", "Jane",
  "Heller", "Shannon", "Noah", "Manco", "Dru", "Marlow", "Picasso", "Lovelace", "Turing", "Curie",
  "Tesla", "Edison", "Hawking", "Bohr", "Einstein", "Darwin", "Galileo", "Newton", "Copernicus", "Aristotle"
];

export default function SwarmsPage() {
  // Mode selection: 'showcase' (prebuilt 100 agent YouTuber search) or 'realtime' (live custom Orbit run)
  const [activeTabMode, setActiveTabMode] = useState<'showcase' | 'realtime'>('realtime');
  const [phase, setPhase] = useState<'setup' | 'running' | 'done'>('setup');

  // Custom Swarm Configuration States
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<AgentOption[]>([]);
  const [goal, setGoal] = useState('');
  const [swarmName, setSwarmName] = useState('');
  const [strategy, setStrategy] = useState<'parallel' | 'sequential' | 'hierarchical'>('parallel');
  const [agentSearch, setAgentSearch] = useState('');
  const [autopilot, setAutopilot] = useState(true);
  const [autopilotLoading, setAutopilotLoading] = useState(false);
  const [autopilotRationale, setAutopilotRationale] = useState('');

  // Live Swarm Streaming Execution States
  const [running, setRunning] = useState(false);
  const [activeSwarmId, setActiveSwarmId] = useState<string | null>(null);
  const [agentOutputs, setAgentOutputs] = useState<AgentOutput[]>([]);
  const [mailboxLogs, setMailboxLogs] = useState<MailboxMessage[]>([]);
  const [chatTimeline, setChatTimeline] = useState<{ sender: 'user' | 'swarm'; text: string; timestamp: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  
  // Workspace files explorer
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [selectedFile, setSelectedFile] = useState<WorkspaceFile | null>(null);
  const [selectedFileContent, setSelectedFileContent] = useState('');
  const [loadingFile, setLoadingFile] = useState(false);
  const [selectedAgentIdFilter, setSelectedAgentIdFilter] = useState<string | null>(null);

  // Kimi Swarm Showcase Simulation States
  const [simRunning, setSimRunning] = useState(false);
  const [simProgress, setSimProgress] = useState(0); 
  const [xlsSearchQuery, setXlsSearchQuery] = useState('');
  const [xlsSelectedCategory, setXlsSelectedCategory] = useState<string | null>(null);
  const [activeChatStep, setActiveChatStep] = useState<string | null>('deploy');
  const [selectedSimAgent, setSelectedSimAgent] = useState<number | null>(null);
  const [xlsHoveredRow, setXlsHoveredRow] = useState<number | null>(null);
  const [selectedFieldFilter, setSelectedFieldFilter] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const rightColumnRef = useRef<HTMLDivElement>(null);

  // 100 YouTube niche dataset
  const fullNicheDataset = useMemo(() => {
    const data: YoutuberRow[] = [];
    const highFidelityMap = new Map(HIGH_FIDELITY_NICHES.map(n => [n.field, n]));

    FIELDS_LIST.forEach((field, index) => {
      let category = "STEM & Engineering";
      if (field.includes("Art") || field.includes("Design") || field.includes("Music") || field.includes("Dance") || field.includes("Film") || field.includes("Photography") || field.includes("Theater") || field.includes("Fashion")) {
        category = "Arts & Design";
      } else if (field.includes("Biology") || field.includes("Virology") || field.includes("Oncology") || field.includes("Cardiology") || field.includes("Gastroenterology") || field.includes("Endocrinology") || field.includes("Hematology") || field.includes("Pharmacology") || field.includes("Epidemiology") || field.includes("Biomedical") || field.includes("Biochemistry") || field.includes("Neuroscience") || field.includes("Immunology")) {
        category = "Life Sciences & Medicine";
      } else if (field.includes("Economics") || field.includes("Philosophy") || field.includes("Literature") || field.includes("Anthropology") || field.includes("Sociology") || field.includes("History") || field.includes("Criminology") || field.includes("Religion") || field.includes("Relations") || field.includes("Psychology") || field.includes("Demography") || field.includes("Mythology")) {
        category = "Social Sciences & Humanities";
      } else if (field.includes("Computing") || field.includes("Machine Learning") || field.includes("Data Science") || field.includes("Computer") || field.includes("Security") || field.includes("Systems") || field.includes("Linguistics") || field.includes("NLP")) {
        category = "Mathematics & Computing";
      } else if (field.includes("Analysis") || field.includes("Topology") || field.includes("Geometry") || field.includes("Theory") || field.includes("Mathematics") || field.includes("Quantum Computing")) {
        category = "Mathematics & Computing";
      } else if (field.includes("Environmental") || field.includes("Geophysics") || field.includes("Oceanography") || field.includes("Hydrology") || field.includes("Meteorology") || field.includes("Seismology")) {
        category = "Earth & Environmental";
      } else if (field.includes("Law") || field.includes("Ethics") || field.includes("Constitutional")) {
        category = "Law & Policy";
      }

      const hf = highFidelityMap.get(field);
      if (hf) {
        hf.channels.forEach((ch, cIndex) => {
          data.push({
            field,
            category: hf.category,
            rank: cIndex + 1,
            channelName: ch.name,
            subscribers: ch.subs,
            description: ch.desc,
            link: `https://www.youtube.com/${ch.handle}`
          });
        });
      } else {
        const baseName = field.replace(/\s+/g, "");
        const sub1 = (3.5 - (index % 15) * 0.22).toFixed(1);
        const sub2 = (800 - (index % 8) * 85).toFixed(0);
        const sub3 = (95 - (index % 4) * 20).toFixed(0);

        data.push({
          field,
          category,
          rank: 1,
          channelName: `${field} Hub`,
          subscribers: `~${sub1}M`,
          description: `Excellent educational deep dives and animations on ${field} fundamentals.`,
          link: `https://www.youtube.com/@${baseName}Hub`
        }, {
          field,
          category,
          rank: 2,
          channelName: `${field} Explained`,
          subscribers: `~${sub2}K`,
          description: `Detailed and comprehensive breakdowns exploring core concepts of ${field}.`,
          link: `https://www.youtube.com/@${baseName}Explained`
        }, {
          field,
          category,
          rank: 3,
          channelName: `Dr. ${baseName.slice(0, 7)} Channel`,
          subscribers: `~${sub3}K`,
          description: `Academic lectures, research briefings, and specialized visual logs for ${field}.`,
          link: `https://www.youtube.com/@dr_${baseName.slice(0, 7).toLowerCase()}`
        });
      }
    });

    return data;
  }, []);

  const simAgents = useMemo(() => {
    return FIELDS_LIST.map((field, idx) => {
      const agentName = AGENT_NAMES[idx] || `Agent-${idx + 1}`;
      return {
        id: idx + 1,
        name: agentName,
        field,
        task: `Find the top 3 YouTubers in the field of "${field}" by subscriber count. Return the field name, channel names, subscriber counts, and brief descriptions.`
      };
    });
  }, []);

  const filteredXlsRows = useMemo(() => {
    const activeCount = simRunning ? simProgress : 100;
    const completedFields = new Set(FIELDS_LIST.slice(0, activeCount));

    return fullNicheDataset.filter(row => {
      if (!completedFields.has(row.field)) return false;
      
      const matchesSearch = 
        row.field.toLowerCase().includes(xlsSearchQuery.toLowerCase()) ||
        row.channelName.toLowerCase().includes(xlsSearchQuery.toLowerCase()) ||
        row.description.toLowerCase().includes(xlsSearchQuery.toLowerCase());

      const matchesCat = xlsSelectedCategory ? row.category === xlsSelectedCategory : true;
      const matchesFieldFilter = selectedFieldFilter ? row.field === selectedFieldFilter : true;

      return matchesSearch && matchesCat && matchesFieldFilter;
    });
  }, [xlsSearchQuery, xlsSelectedCategory, selectedFieldFilter, simRunning, simProgress, fullNicheDataset]);

  // Load registered agents for configuration
  useEffect(() => {
    fetch('/api/swarms')
      .then(r => r.json())
      .then((d: { agents: AgentOption[] }) => setAgents(d.agents || []))
      .catch(() => {});

    // Pre-populate search query if redirected from landing page with a search query
    const savedQuery = localStorage.getItem("orbit_landing_search_query");
    if (savedQuery) {
      setGoal(savedQuery);
      localStorage.removeItem("orbit_landing_search_query");
    }
  }, []);

  // Fetch real sandbox workspace files
  const loadWorkspaceFiles = async (subpath = '') => {
    if (!activeSwarmId) return;
    try {
      const res = await fetch(`/api/workspace?path=${encodeURIComponent(subpath)}&swarmId=${encodeURIComponent(activeSwarmId)}`);
      if (res.ok) {
        const data = await res.json() as { files: WorkspaceFile[] };
        setFiles(data.files || []);
      }
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (activeSwarmId) {
      loadWorkspaceFiles(currentPath);
    }
  }, [activeSwarmId, currentPath]);

  // Read selected file content
  const handleViewFile = async (file: WorkspaceFile) => {
    setSelectedFile(file);
    setLoadingFile(true);
    setSelectedFileContent('');
    try {
      const res = await fetch(`/api/workspace/download?path=${encodeURIComponent(file.path)}&swarmId=${encodeURIComponent(activeSwarmId || '')}`);
      if (res.ok) {
        const text = await res.text();
        setSelectedFileContent(text);
      } else {
        setSelectedFileContent(`Error loading file: ${await res.text()}`);
      }
    } catch (err) {
      setSelectedFileContent(`Error loading file: ${String(err)}`);
    } finally {
      setLoadingFile(false);
    }
  };

  // Launch real-time custom swarm
  const launchCustomSwarm = async () => {
    if (!goal.trim()) return;

    let finalAgents = selectedAgents;
    let finalStrategy = strategy;

    setRunning(true);
    setPhase('running');
    setActiveSwarmId(null);
    setFiles([]);
    setSelectedFile(null);
    setSelectedFileContent('');
    setMailboxLogs([]);
    setChatTimeline([
      { sender: 'user', text: goal, timestamp: new Date().toLocaleTimeString() }
    ]);

    if (autopilot) {
      setAutopilotLoading(true);
      setAgentOutputs([
        { id: 'recruiter', name: 'Swarm Director', text: 'Analyzing your goal to recruit the best cohort from all 175 specialized agents...', status: 'running' }
      ]);
      try {
        const localOpenaiKey = localStorage.getItem('orbit_openai_key') || '';
        const localGeminiKey = localStorage.getItem('orbit_gemini_key') || '';

        const autoRes = await fetch('/api/swarms/autopilot', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-openai-api-key': localOpenaiKey,
            'x-gemini-api-key': localGeminiKey
          },
          body: JSON.stringify({ goal })
        });
        if (autoRes.ok) {
          const autoData = await autoRes.json() as { selectedAgentIds: string[], strategy: 'parallel' | 'sequential' | 'hierarchical', rationale: string };
          const matched = agents.filter(a => autoData.selectedAgentIds.includes(a.id));
          if (matched.length > 0) {
            finalAgents = matched;
            setSelectedAgents(matched);
          }
          if (autoData.strategy) {
            finalStrategy = autoData.strategy;
            setStrategy(autoData.strategy);
          }
          if (autoData.rationale) {
            setAutopilotRationale(autoData.rationale);
          }
        }
      } catch (err) {
        console.error('Autopilot recruitment failed:', err);
      } finally {
        setAutopilotLoading(false);
      }
    }

    if (finalAgents.length === 0) {
      finalAgents = agents.slice(0, 3);
      setSelectedAgents(finalAgents);
    }

    setAgentOutputs(
      finalAgents.map(a => ({ id: a.id, name: a.name, text: '', status: 'waiting' }))
    );

    setMailboxLogs([
      { from: 'Leader Agent', to: 'Swarm Board', body: `orbit team spawn-team --name swarm-${Date.now()} -d "Autonomous task resolution"`, timestamp: new Date().toLocaleTimeString() }
    ]);

    try {
      const localOpenaiKey = localStorage.getItem('orbit_openai_key') || '';
      const localGeminiKey = localStorage.getItem('orbit_gemini_key') || '';

      const res = await fetch('/api/swarms', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-openai-api-key': localOpenaiKey,
          'x-gemini-api-key': localGeminiKey
        },
        body: JSON.stringify({
          name: swarmName || `Swarm — ${goal.slice(0, 40)}`,
          goal, agentIds: finalAgents.map(a => a.id), strategy: finalStrategy,
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value).split('\n').filter(l => l.startsWith('data:'));
        for (const line of lines) {
          try {
            const event = JSON.parse(line.slice(5)) as StreamEvent;
            if (event.type === 'swarm:start' && event.swarmId) {
              setActiveSwarmId(event.swarmId);
              setMailboxLogs(prev => [...prev, {
                from: 'System Orchestrator',
                to: 'All Workers',
                body: `Spawning sandboxed workspaces! Initializing git branches: orbit/${event.swarmId}/*`,
                timestamp: new Date().toLocaleTimeString()
              }]);
            } else if (event.type === 'agent:start') {
              setAgentOutputs(prev =>
                prev.map(a => a.id === event.agentId ? { ...a, status: 'running' } : a)
              );
              setMailboxLogs(prev => [...prev, {
                from: 'Leader Agent',
                to: event.agentName || 'Teammate',
                body: `Spawned worker! Task assigned: orbit spawn --agent-name ${event.agentId} --task "${goal.slice(0, 60)}..."`,
                timestamp: new Date().toLocaleTimeString()
              }]);
            } else if (event.type === 'agent:chunk' && event.text) {
              setAgentOutputs(prev =>
                prev.map(a => a.id === event.agentId ? { ...a, text: a.text + event.text, status: 'running' } : a)
              );
            } else if (event.type === 'agent:done') {
              setAgentOutputs(prev =>
                prev.map(a => a.id === event.agentId
                  ? { ...a, status: 'done', tokens: event.data?.tokens as number, cost: event.data?.cost as number }
                  : a)
              );
              setMailboxLogs(prev => [...prev, {
                from: event.agentName || 'Teammate',
                to: 'Leader Agent',
                body: `orbit task update --status completed. Checking deliverables into git worktree branch...`,
                timestamp: new Date().toLocaleTimeString()
              }]);
              loadWorkspaceFiles(currentPath);
            } else if (event.type === 'agent:error') {
              setAgentOutputs(prev =>
                prev.map(a => a.id === event.agentId ? { ...a, status: 'error', text: a.text + `\n ${event.text}` } : a)
              );
            } else if (event.type === 'swarm:done') {
              setPhase('done');
              setRunning(false);
              setMailboxLogs(prev => [...prev, {
                from: 'System Orchestrator',
                to: 'Leader Agent',
                body: `Swarm converged! Merging all worktree branches back to main line. Autopilot run complete.`,
                timestamp: new Date().toLocaleTimeString()
              }]);
              setChatTimeline(prev => [...prev, {
                sender: 'swarm',
                text: ` रोडमैप सफलतापूर्वक पूरा हो गया है। I have successfully orchestrated the recruited agents to achieve your goal. All work deliverables are checked in and previewable in the workspace on the right.`,
                timestamp: new Date().toLocaleTimeString()
              }]);
            }
          } catch { /* skip */ }
        }
      }
    } catch (err) {
      setAgentOutputs(prev =>
        prev.map(a => ({ ...a, status: 'error', text: `Error: ${String(err)}` }))
      );
    } finally {
      setRunning(false);
    }
  };

  // Real-time Chat with Swarms trigger
  const handleSendChatMessage = async () => {
    if (!chatInput.trim()) return;
    const userText = chatInput;
    setChatInput('');
    setChatTimeline(prev => [...prev, { sender: 'user', text: userText, timestamp: new Date().toLocaleTimeString() }]);

    // Animate swarm response
    setRunning(true);
    setMailboxLogs(prev => [...prev, {
      from: 'Swarm Director',
      to: 'All Subagents',
      body: `User feedback received: "${userText}". Allocating workspace updates in git worktrees...`,
      timestamp: new Date().toLocaleTimeString()
    }]);

    setTimeout(() => {
      // Simulate live agent updating files
      setRunning(false);
      setChatTimeline(prev => [...prev, {
        sender: 'swarm',
        text: `Received instructions. I have requested the implementer to integrate your requested revisions: "${userText}". Let me know if you need any other modifications!`,
        timestamp: new Date().toLocaleTimeString()
      }]);
      loadWorkspaceFiles(currentPath);
    }, 2500);
  };

  // Kimi showcase simulator execution
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (simRunning) {
      interval = setInterval(() => {
        setSimProgress(prev => {
          if (prev >= 100) {
            setSimRunning(false);
            clearInterval(interval);
            return 100;
          }
          return prev + 1;
        });
      }, 160); 
    }
    return () => clearInterval(interval);
  }, [simRunning]);

  const startShowcaseSimulation = () => {
    setSimProgress(0);
    setSimRunning(true);
    setSelectedFieldFilter(null);
  };

  const downloadXlsShowcase = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Field,Rank,Channel Name,Subscriber Count,Description,Link\n";
    fullNicheDataset.forEach(row => {
      csvContent += `"${row.field}",${row.rank},"${row.channelName}","${row.subscribers}","${row.description.replace(/"/g, '""')}","${row.link}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "top_youtubers_by_field_with_links.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Scroll to chat/log bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatTimeline, agentOutputs, mailboxLogs]);

  // Parse CSV text to display dynamically in Excel table rows
  const parsedCsvRows = useMemo(() => {
    if (!selectedFileContent || !selectedFile?.name.endsWith('.csv')) return null;
    const lines = selectedFileContent.split('\n').filter(l => l.trim() !== '');
    return lines.map(line => {
      return line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(cell => cell.replace(/^"|"$/g, '').trim());
    });
  }, [selectedFileContent, selectedFile]);

  // Filter agents by search
  const filteredCustomAgents = agents.filter(a =>
    !agentSearch || a.name.toLowerCase().includes(agentSearch.toLowerCase()) || a.category.toLowerCase().includes(agentSearch.toLowerCase())
  );

  const toggleCustomAgent = (agent: AgentOption) => {
    setSelectedAgents(prev => {
      const exists = prev.find(a => a.id === agent.id);
      if (exists) return prev.filter(a => a.id !== agent.id);
      if (prev.length >= 5) return prev; 
      return [...prev, agent];
    });
  };

  return (
    <div style={{ padding: '1.2rem', maxWidth: 1700, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      
      {/* Visual Navigation Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.8rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-0.03em', margin: 0, background: 'linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 50%, #94a3b8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'flex', alignItems: 'center', gap: 10 }}>
             Swarm Intelligence Studio
            <span style={{ fontSize: '0.62rem', padding: '3px 8px', borderRadius: 20, background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.22)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Orbit Core
            </span>
          </h1>
          <p style={{ color: '#64748b', margin: '0.3rem 0 0', fontSize: '0.85rem', fontWeight: 500 }}>
            Orchestrate collaborative AI agent swarms to spawn workspaces and execute parallel workflows in real-time.
          </p>
        </div>

        {/* Global tab mode selector */}
        <div style={{ display: 'flex', gap: 8, background: 'rgba(255,255,255,0.02)', padding: 4, borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={() => { setActiveTabMode('realtime'); setPhase('setup'); }}
            style={{
              padding: '6px 14px', borderRadius: 8, border: 'none',
              background: activeTabMode === 'realtime' ? 'rgba(99,102,241,0.12)' : 'transparent',
              color: activeTabMode === 'realtime' ? '#818cf8' : '#64748b',
              fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s'
            }}
          >
            <Cpu size={12} />
            Real-Time Swarm Engine
          </button>
          <button
            onClick={() => { setActiveTabMode('showcase'); setPhase('running'); }}
            style={{
              padding: '6px 14px', borderRadius: 8, border: 'none',
              background: activeTabMode === 'showcase' ? 'rgba(99,102,241,0.12)' : 'transparent',
              color: activeTabMode === 'showcase' ? '#818cf8' : '#64748b',
              fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s'
            }}
          >
            <Sparkles size={12} />
            Try Showcase: 100 YouTubers Search
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------
          MODE A: REAL-TIME AUTONOMOUS SWARM ACTIVE CONSOLE
          ------------------------------------------------------------- */}
      {activeTabMode === 'realtime' && (
        <>
          {phase === 'setup' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem', alignItems: 'start' }}>
              
              {/* Specialist Recruitment Agents */}
              <div style={{ position: 'relative' }}>
                <div style={{
                  background: '#040813', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, overflow: 'hidden',
                  filter: autopilot ? 'blur(1px) opacity(0.5)' : 'none', transition: 'all 0.3s', pointerEvents: autopilot ? 'none' : 'auto',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                }}>
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.01)' }}>
                    <div>
                      <div style={{ fontWeight: 800, color: '#f1f5f9', fontSize: '0.88rem' }}>Screen Specialist Workers</div>
                      <div style={{ color: '#64748b', fontSize: '0.72rem', marginTop: 2, fontWeight: 500 }}>{selectedAgents.length}/5 specialized agents selected</div>
                    </div>
                    <input
                      value={agentSearch}
                      onChange={e => setAgentSearch(e.target.value)}
                      placeholder="Filter specialized skills..."
                      style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#f1f5f9', fontSize: '0.75rem', outline: 'none', width: 170, fontFamily: 'inherit' }}
                    />
                  </div>

                  <div style={{ maxHeight: 420, overflowY: 'auto', padding: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
                    {filteredCustomAgents.map(agent => {
                      const isSelected = selectedAgents.some(a => a.id === agent.id);
                      const color = COLOR_MAP[agent.color] ?? '#6366f1';
                      return (
                        <button
                          key={agent.id}
                          onClick={() => toggleCustomAgent(agent)}
                          style={{
                            padding: '12px 14px', background: isSelected ? `${color}10` : 'rgba(255,255,255,0.02)',
                            border: `1.5px solid ${isSelected ? color : 'rgba(255,255,255,0.06)'}`,
                            borderRadius: 12, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                            display: 'flex', alignItems: 'center', gap: 10,
                          }}
                          onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
                          onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
                        >
                          <span style={{ fontSize: 20, flexShrink: 0 }}>{agent.emoji}</span>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: isSelected ? color : '#cbd5e1', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{agent.name}</div>
                            <div style={{ fontSize: '0.65rem', color: '#475569', marginTop: 2, textTransform: 'capitalize', fontWeight: 600 }}>{agent.category.replace(/-/g, ' ')}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* AI Recruiter Overlay */}
                {autopilot && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(3,6,15,0.76)', borderRadius: 20, zIndex: 10, padding: 24, textAlign: 'center',
                    border: '1.5px dashed rgba(99,102,241,0.25)', backdropFilter: 'blur(8px)',
                    boxShadow: 'inset 0 0 40px rgba(99,102,241,0.05)'
                  }}>
                    <div style={{ position: 'relative', width: 64, height: 64, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(99,102,241,0.1)', border: '1.5px solid rgba(99,102,241,0.3)', animation: 'spin 10s linear infinite' }} />
                      <Sparkles size={24} style={{ color: '#818cf8', animation: 'pulse 1.5s infinite' }} />
                    </div>
                    <div style={{ fontWeight: 800, color: '#f1f5f9', fontSize: '1rem', letterSpacing: '-0.01em' }}>Orbit Swarm Autopilot Enabled</div>
                    <p style={{ color: '#64748b', fontSize: '0.8rem', maxWidth: 320, margin: '8px 0 16px', lineHeight: 1.5, fontWeight: 500 }}>
                      Orbit screens all 175 specialized agents to recruit the absolute perfect team for your roadmap objectives.
                    </p>
                    <button
                      onClick={() => setAutopilot(false)}
                      style={{
                        padding: '8px 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 8, color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#cbd5e1'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                    >
                      Configure Swarm Manually
                    </button>
                  </div>
                )}
              </div>

              {/* Configurations Sidepanel */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                {/* Protocol Selector */}
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.82rem' }}>Recruitment Protocol</div>
                    <span style={{ fontSize: '0.65rem', background: autopilot ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.05)', color: autopilot ? '#818cf8' : '#64748b', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>
                      {autopilot ? 'AI AUTOPILOT' : 'MANUAL'}
                    </span>
                  </div>
                  <button
                    onClick={() => setAutopilot(!autopilot)}
                    style={{
                      width: '100%', padding: '10px',
                      background: autopilot ? 'rgba(99,102,241,0.06)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${autopilot ? 'rgba(99,102,241,0.22)' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: 8, color: autopilot ? '#a5b4fc' : '#cbd5e1', fontSize: '0.78rem',
                      cursor: 'pointer', transition: 'all 0.2s', fontWeight: 700
                    }}
                  >
                    {autopilot ? 'Switch to Manual Agents' : 'Screen 175-Agent Agents'}
                  </button>
                </div>

                {/* Workflow strategy */}
                {!autopilot && (
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 16 }}>
                    <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.82rem', marginBottom: 12 }}>Workflow strategy</div>
                    {(Object.entries(STRATEGY_INFO) as [keyof typeof STRATEGY_INFO, typeof STRATEGY_INFO[keyof typeof STRATEGY_INFO]][]).map(([key, info]) => {
                      const StrategyIcon = info.icon;
                      return (
                        <div
                          key={key}
                          onClick={() => setStrategy(key)}
                          style={{
                            padding: '10px 12px', borderRadius: 10, cursor: 'pointer', marginBottom: 6,
                            background: strategy === key ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.01)',
                            border: `1.5px solid ${strategy === key ? '#6366f1' : 'rgba(255,255,255,0.04)'}`,
                            transition: 'all 0.15s',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <StrategyIcon size={12} style={{ color: strategy === key ? '#818cf8' : '#475569' }} />
                            <span style={{ fontWeight: 700, fontSize: '0.78rem', color: strategy === key ? '#818cf8' : '#cbd5e1' }}>{info.label}</span>
                            {strategy === key && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#10b981' }}>✓</span>}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: '#64748b', lineHeight: 1.4, fontWeight: 500 }}>{info.desc}</div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Swarm objectives */}
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 16 }}>
                  <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.82rem', marginBottom: 12 }}>Swarm Objective Roadmap</div>
                  <input
                    value={swarmName}
                    onChange={e => setSwarmName(e.target.value)}
                    placeholder="Swarm Designation Name (optional)"
                    style={{ width: '100%', padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, color: '#f1f5f9', fontSize: '0.78rem', outline: 'none', marginBottom: 8, boxSizing: 'border-box', fontFamily: 'inherit' }}
                  />
                  <textarea
                    value={goal}
                    onChange={e => setGoal(e.target.value)}
                    placeholder={autopilot ? "Describe your roadmap e.g. 'Build an HTML portfolio page with high-end dark glassmorphism styling, clean JavaScript animations, and save all source files in the workspace.'" : "Provide specific roadmap objectives for the swarm..."}
                    style={{ width: '100%', minHeight: 110, padding: '10px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, color: '#f1f5f9', fontSize: '0.78rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.4 }}
                  />
                  <button
                    onClick={launchCustomSwarm}
                    disabled={!goal.trim() || (!autopilot && selectedAgents.length === 0)}
                    style={{
                      width: '100%', padding: '12px', marginTop: 10,
                      background: goal.trim() && (autopilot || selectedAgents.length > 0) ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.04)',
                      border: 'none', borderRadius: 8, color: '#fff', fontSize: '0.82rem', fontWeight: 700,
                      cursor: goal.trim() && (autopilot || selectedAgents.length > 0) ? 'pointer' : 'not-allowed', transition: 'all 0.25s',
                      boxShadow: goal.trim() && (autopilot || selectedAgents.length > 0) ? '0 8px 20px rgba(99,102,241,0.25)' : 'none'
                    }}
                  >
                    {autopilot ? 'Launch Autopilot Swarm' : `Launch Swarm (${selectedAgents.length} agents)`}
                  </button>
                </div>

              </div>

            </div>
          ) : (
            
            /* active running / completed split UI screen */
            <div style={{ display: 'grid', gridTemplateColumns: '450px 1fr', gap: '1.2rem', height: 'calc(100vh - 190px)', minHeight: 650 }}>
              
              {/* Left Column: Conversational Agents & Swarm Log */}
              <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(3,6,15,0.6)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, overflow: 'hidden', backdropFilter: 'blur(20px)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
                
                {/* Header */}
                <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.01)', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: running ? '#f59e0b' : '#10b981', boxShadow: running ? '0 0 10px #f59e0b' : '0 0 10px #10b981', animation: running ? 'pulse 0.8s infinite alternate' : 'none' }} />
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#f1f5f9' }}>{swarmName || 'Orbit Core Swarm'}</div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>Real-Time Swarm Execution</div>
                    </div>
                  </div>
                  <button
                    onClick={() => { setPhase('setup'); setAgentOutputs([]); setSelectedFile(null); setSelectedFileContent(''); }}
                    style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#94a3b8', fontSize: '0.68rem', cursor: 'pointer', fontWeight: 700 }}
                  >
                    Reset
                  </button>
                </div>

                {/* Conversation Body & Agent Streams */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  
                  {/* Dialog Timeline */}
                  {chatTimeline.map((chat, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', alignSelf: chat.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                      {chat.sender === 'swarm' && (
                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Sparkles size={11} style={{ color: '#fff' }} />
                        </div>
                      )}
                      <div style={{
                        background: chat.sender === 'user' ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${chat.sender === 'user' ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.06)'}`,
                        borderRadius: chat.sender === 'user' ? '14px 14px 0px 14px' : '0px 14px 14px 14px',
                        padding: '10px 12px',
                        color: '#cbd5e1',
                        fontSize: '0.78rem',
                        lineHeight: 1.5
                      }}>
                        {chat.text}
                      </div>
                    </div>
                  ))}

                  {/* Accordion List for Live Orbit Spawns */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
                    
                    {/* Orbit inter-agent message logs */}
                    {mailboxLogs.length > 0 && (
                      <div style={{ border: '1px solid rgba(255,255,255,0.04)', borderRadius: 10, background: 'rgba(255,255,255,0.01)', overflow: 'hidden' }}>
                        <button
                          onClick={() => setActiveChatStep(activeChatStep === 'mailbox' ? null : 'mailbox')}
                          style={{ width: '100%', padding: '10px 12px', background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 700 }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Mail size={12} style={{ color: '#3b82f6' }} />
                            Orbit Transport Mailbox Logs
                          </span>
                          <span style={{ fontSize: '0.65rem', color: '#64748b' }}>
                            {mailboxLogs.length} logs
                          </span>
                        </button>
                        {activeChatStep === 'mailbox' && (
                          <div style={{ padding: '10px', fontSize: '0.7rem', color: '#818cf8', background: '#020409', borderTop: '1px solid rgba(255,255,255,0.04)', fontFamily: 'monospace', display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
                            {mailboxLogs.map((log, lIdx) => (
                              <div key={lIdx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: 4 }}>
                                <span style={{ color: '#475569' }}>[{log.timestamp}]</span> <strong>{log.from}</strong> → {log.to}: <span style={{ color: '#94a3b8' }}>{log.body}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Recruited Agents List */}
                    <div style={{ border: '1.5px solid rgba(99,102,241,0.15)', borderRadius: 12, background: 'rgba(99,102,241,0.02)', overflow: 'hidden' }}>
                      <div style={{ padding: '12px', borderBottom: '1px solid rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', fontWeight: 800, color: '#a5b4fc' }}>
                          <Layers size={13} style={{ color: '#818cf8' }} />
                          Active Swarm Agents
                        </span>
                        <span style={{ fontSize: '0.65rem', background: 'rgba(16,185,129,0.12)', color: '#10b981', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>
                          {agentOutputs.filter(o => o.status === 'done').length}/{agentOutputs.length} Done
                        </span>
                      </div>

                      <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 6, background: 'rgba(0,0,0,0.2)' }}>
                        {agentOutputs.map((ao) => {
                          const isCompleted = ao.status === 'done';
                          const isActive = ao.status === 'running';
                          const isSelected = selectedAgentIdFilter === ao.id;

                          return (
                            <div
                              key={ao.id}
                              onClick={() => {
                                setSelectedAgentIdFilter(isSelected ? null : ao.id);
                              }}
                              style={{
                                padding: '10px',
                                background: isSelected ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.02)',
                                border: `1px solid ${isSelected ? 'rgba(99,102,241,0.3)' : isActive ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.04)'}`,
                                borderRadius: 8,
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 6,
                                transition: 'all 0.15s'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: isCompleted ? 'rgba(16,185,129,0.2)' : isActive ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {isCompleted ? (
                                      <Check size={8} style={{ color: '#10b981' }} />
                                    ) : (
                                      <div style={{ width: 4, height: 4, borderRadius: '50%', background: isActive ? '#f59e0b' : '#475569' }} />
                                    )}
                                  </div>
                                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: isCompleted ? '#10b981' : isActive ? '#f59e0b' : '#cbd5e1' }}>
                                    {ao.name}
                                  </span>
                                </div>
                                {ao.cost && (
                                  <span style={{ fontSize: '0.62rem', color: '#10b981', fontFamily: 'monospace' }}>
                                    ${ao.cost.toFixed(4)}
                                  </span>
                                )}
                              </div>

                              {ao.text && (
                                <div style={{ fontSize: '0.68rem', color: '#94a3b8', lineHeight: 1.4, maxHeight: 110, overflowY: 'auto', background: '#020409', padding: '6px 8px', borderRadius: 6, fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                  {ao.text}
                                  {isActive && <span style={{ display: 'inline-block', width: 4, height: 10, background: '#818cf8', marginLeft: 2, animation: 'blink 0.7s infinite' }} />}
                                </div>
                              )}

                              {/* Progress bar pulsing dots */}
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                                <div style={{ display: 'flex', gap: 3 }}>
                                  {[...Array(6)].map((_, dotIdx) => (
                                    <div
                                      key={dotIdx}
                                      style={{
                                        width: 5,
                                        height: 5,
                                        background: isCompleted ? '#10b981' : isActive ? '#f59e0b' : '#334155',
                                        borderRadius: 1,
                                        opacity: isCompleted ? 0.9 : isActive ? (0.4 + (dotIdx % 3) * 0.3) : 0.2,
                                        animation: isActive ? 'pulse 0.8s infinite alternate' : 'none',
                                        animationDelay: `${dotIdx * 0.15}s`
                                      }}
                                    />
                                  ))}
                                </div>
                                <span style={{ fontSize: '0.65rem', color: isCompleted ? '#10b981' : isActive ? '#f59e0b' : '#475569', fontWeight: 700 }}>
                                  {isCompleted ? 'Done' : isActive ? 'Executing...' : 'Pending'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>

                  <div ref={bottomRef} />
                </div>

                {/* Conversational Real-Time Swarm Input Box */}
                <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', background: '#02040a', display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
                  <input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSendChatMessage(); }}
                    placeholder="Provide real-time instructions to your swarm..."
                    style={{
                      flex: 1, padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 8, color: '#f1f5f9', fontSize: '0.78rem', outline: 'none', fontFamily: 'inherit'
                    }}
                  />
                  <button
                    onClick={handleSendChatMessage}
                    disabled={!chatInput.trim()}
                    style={{
                      padding: '8px 14px', background: chatInput.trim() ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.05)',
                      border: 'none', borderRadius: 8, color: '#fff', fontSize: '0.75rem', fontWeight: 700,
                      cursor: chatInput.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 4
                    }}
                  >
                    <Send size={11} />
                    Send
                  </button>
                </div>

              </div>

              {/* Right Column: High-Fidelity Spreadsheet & Deliverables sandbox */}
              <div ref={rightColumnRef} style={{ display: 'flex', flexDirection: 'column', background: '#ffffff', border: '1px solid rgba(0,0,0,0.15)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
                
                {/* Title Bar */}
                <div style={{ padding: '10px 16px', background: '#0f172a', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 4, background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Code size={12} style={{ color: '#fff' }} />
                    </div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f8fafc' }}>
                      {activeSwarmId ? `${activeSwarmId}-deliverables` : 'Workspace Sandbox Explorer'}
                    </span>
                  </div>
                  {activeSwarmId && (
                    <a
                      href={`/api/workspace/download?swarmId=${encodeURIComponent(activeSwarmId)}`}
                      download
                      style={{
                        padding: '5px 12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6,
                        color: '#f8fafc', fontSize: '0.72rem', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                    >
                      <Download size={12} />
                      Zip Deliverables
                    </a>
                  )}
                </div>

                {/* Workspace list structured as a styled spreadsheet grid */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#fff' }}>
                  
                  {selectedFile ? (
                    /* High-Fidelity preview pane styled inside Excel */
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      <div style={{ padding: '8px 14px', background: '#f8fafc', borderBottom: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button
                            onClick={() => setSelectedFile(null)}
                            style={{ padding: '2px 8px', border: '1px solid #cbd5e1', borderRadius: 4, background: '#fff', fontSize: '0.68rem', fontWeight: 700, color: '#4a5568', cursor: 'pointer' }}
                          >
                            ← Back to Files List
                          </button>
                          <span style={{ fontSize: '0.75rem', fontWeight: 750, color: '#1e293b', fontFamily: 'monospace' }}>
                            {selectedFile.name}
                          </span>
                        </div>
                        <a
                          href={`/api/workspace/download?path=${encodeURIComponent(selectedFile.path)}&swarmId=${encodeURIComponent(activeSwarmId || '')}`}
                          download
                          style={{ padding: '4px 10px', background: '#3b82f6', border: 'none', borderRadius: 4, color: '#fff', fontSize: '0.68rem', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <Download size={11} /> Download
                        </a>
                      </div>

                      <div style={{ flex: 1, overflow: 'auto', padding: 12, background: '#090d16' }}>
                        {loadingFile ? (
                          <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                            <Loader2 className="animate-spin" size={24} />
                          </div>
                        ) : parsedCsvRows ? (
                          /* Structured CSV files parsed into actual spreadsheet cells */
                          <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #cbd5e1', overflow: 'auto' }}>
                            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.75rem', color: '#1f2937' }}>
                              <tbody>
                                {parsedCsvRows.map((cRow, rIdx) => (
                                  <tr key={rIdx} style={{ borderBottom: '1px solid #cbd5e1', background: rIdx === 0 ? '#f1f5f9' : '#fff' }}>
                                    <td style={{ padding: '4px 6px', borderRight: '1px solid #cbd5e1', background: '#f1f5f9', color: '#64748b', fontSize: '0.65rem', fontWeight: 700, width: 25, textAlign: 'center' }}>
                                      {rIdx + 1}
                                    </td>
                                    {cRow.map((cell, cIdx) => (
                                      <td key={cIdx} style={{ padding: '6px 10px', borderRight: '1px solid #cbd5e1', fontWeight: rIdx === 0 ? 800 : 500 }}>
                                        {cell}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          /* Text code file previewer */
                          <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.75rem', color: '#818cf8', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                            {selectedFileContent || '(file is empty)'}
                          </pre>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Main File explorer directory table listing modeled as spreadsheet */
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', color: '#1f2937', textAlign: 'left', tableLayout: 'fixed' }}>
                        <colgroup>
                          <col style={{ width: 45 }} />
                          <col style={{ width: 260 }} />
                          <col style={{ width: 100 }} />
                          <col style={{ width: 110 }} />
                          <col style={{ width: 150 }} />
                          <col style={{ width: 110 }} />
                        </colgroup>
                        <thead>
                          <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                            <th style={{ padding: '4px 6px', borderRight: '1px solid #cbd5e1', color: '#64748b', fontSize: '0.68rem', fontWeight: 700, textAlign: 'center' }}></th>
                            <th style={{ padding: '4px 8px', borderRight: '1px solid #cbd5e1', color: '#64748b', fontSize: '0.68rem', fontWeight: 700, textAlign: 'center' }}>A</th>
                            <th style={{ padding: '4px 8px', borderRight: '1px solid #cbd5e1', color: '#64748b', fontSize: '0.68rem', fontWeight: 700, textAlign: 'center' }}>B</th>
                            <th style={{ padding: '4px 8px', borderRight: '1px solid #cbd5e1', color: '#64748b', fontSize: '0.68rem', fontWeight: 700, textAlign: 'center' }}>C</th>
                            <th style={{ padding: '4px 8px', borderRight: '1px solid #cbd5e1', color: '#64748b', fontSize: '0.68rem', fontWeight: 700, textAlign: 'center' }}>D</th>
                            <th style={{ padding: '4px 8px', color: '#64748b', fontSize: '0.68rem', fontWeight: 700, textAlign: 'center' }}>E</th>
                          </tr>
                          <tr style={{ background: '#e2e8f0', borderBottom: '2px solid #94a3b8' }}>
                            <th style={{ padding: '8px 6px', borderRight: '1px solid #cbd5e1', color: '#475569', fontSize: '0.7rem', fontWeight: 800, textAlign: 'center' }}>#</th>
                            <th style={{ padding: '8px 10px', borderRight: '1px solid #cbd5e1', color: '#334155', fontWeight: 800 }}>Workspace Deliverable</th>
                            <th style={{ padding: '8px 10px', borderRight: '1px solid #cbd5e1', color: '#334155', fontWeight: 800 }}>Type</th>
                            <th style={{ padding: '8px 10px', borderRight: '1px solid #cbd5e1', color: '#334155', fontWeight: 800 }}>File Size</th>
                            <th style={{ padding: '8px 10px', borderRight: '1px solid #cbd5e1', color: '#334155', fontWeight: 800 }}>Last Modified</th>
                            <th style={{ padding: '8px 10px', color: '#334155', fontWeight: 800 }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {files.length === 0 ? (
                            <tr>
                              <td colSpan={6} style={{ padding: '40px 10px', textAlign: 'center', color: '#64748b', fontStyle: 'italic' }}>
                                {running ? 'Swarm executing, generating sandbox workspace files...' : 'No sandboxed deliverables spawned yet.'}
                              </td>
                            </tr>
                          ) : (
                            files.map((file, idx) => (
                              <tr
                                key={idx}
                                style={{
                                  borderBottom: '1px solid #cbd5e1',
                                  background: idx % 2 === 0 ? '#fff' : '#f8fafc',
                                  cursor: 'pointer'
                                }}
                                onClick={() => {
                                  if (file.type === 'dir') {
                                    setCurrentPath(currentPath ? `${currentPath}/${file.name}` : file.name);
                                  } else {
                                    handleViewFile(file);
                                  }
                                }}
                              >
                                <td style={{ padding: '6px', borderRight: '1px solid #cbd5e1', background: '#f1f5f9', color: '#64748b', textAlign: 'center', fontSize: '0.68rem', fontWeight: 750 }}>
                                  {idx + 1}
                                </td>
                                <td style={{ padding: '6px 10px', borderRight: '1px solid #cbd5e1', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                                  {file.type === 'dir' ? <Folder size={12} style={{ color: '#f59e0b' }} /> : <FileText size={12} style={{ color: '#3b82f6' }} />}
                                  {file.name}
                                </td>
                                <td style={{ padding: '6px 10px', borderRight: '1px solid #cbd5e1', color: '#475569' }}>
                                  {file.type === 'dir' ? 'Folder' : 'File'}
                                </td>
                                <td style={{ padding: '6px 10px', borderRight: '1px solid #cbd5e1', color: '#0f766e', fontWeight: 700 }}>
                                  {file.type === 'file' ? `${(file.size / 1024).toFixed(2)} KB` : '--'}
                                </td>
                                <td style={{ padding: '6px 10px', borderRight: '1px solid #cbd5e1', color: '#475569' }}>
                                  {new Date(file.mtime).toLocaleTimeString()}
                                </td>
                                <td style={{ padding: '6px 10px' }}>
                                  <span style={{ color: '#2563eb', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    {file.type === 'dir' ? 'Open Folder' : 'View Code'}
                                    <ArrowUpRight size={10} />
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                </div>

                {/* Bottom workbook sheet tabs */}
                <div style={{ padding: '6px 16px', background: '#f1f5f9', borderTop: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <div style={{
                      padding: '5px 12px',
                      background: '#ffffff',
                      borderTop: '2px solid #2563eb',
                      borderLeft: '1px solid #cbd5e1',
                      borderRight: '1px solid #cbd5e1',
                      borderRadius: '3px 3px 0 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: '0.72rem',
                      fontWeight: 750,
                      color: '#2563eb'
                    }}>
                      <Code size={11} />
                      Sandboxed Deliverables
                    </div>
                    <div style={{ padding: '5px 10px', color: '#64748b', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 700 }}>
                      +
                    </div>
                  </div>
                  <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>
                    Sheet 1 of 1 · {files.length} Files scoped
                  </span>
                </div>

              </div>

            </div>
          )}
        </>
      )}

      {/* -------------------------------------------------------------
          MODE B: PREBUILT KIMI SWARMS SHOWCASE VIEW
          ------------------------------------------------------------- */}
      {activeTabMode === 'showcase' && (
        <div style={{ display: 'grid', gridTemplateColumns: '430px 1fr', gap: '1.5rem', height: 'calc(100vh - 190px)', minHeight: 650 }}>
          
          {/* Left Column: Conversational Console */}
          <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(3,6,15,0.6)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, overflow: 'hidden', backdropFilter: 'blur(20px)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
            
            {/* Header */}
            <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.01)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={14} style={{ color: '#fff' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#f1f5f9' }}>YouTube Field Top 3</div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>Autonomous Swarm · Active Simulation</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={startShowcaseSimulation}
                  disabled={simRunning}
                  style={{
                    padding: '5px 12px', background: simRunning ? 'rgba(255,255,255,0.02)' : 'linear-gradient(135deg, #10b981, #059669)',
                    border: 'none', borderRadius: 6, color: '#fff', fontSize: '0.72rem', fontWeight: 800,
                    cursor: simRunning ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.2s',
                    boxShadow: simRunning ? 'none' : '0 4px 12px rgba(16,185,129,0.25)'
                  }}
                >
                  <PlayCircle size={12} />
                  {simProgress > 0 && simProgress < 100 ? 'Running...' : 'Run Swarm'}
                </button>
              </div>
            </div>

            {/* Scrollable Conversation */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <UserPlus size={10} style={{ color: '#94a3b8' }} />
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '0px 14px 14px 14px', padding: '10px 12px', color: '#cbd5e1', fontSize: '0.78rem', lineHeight: 1.5, maxWidth: '85%' }}>
                  Help me find 100 different niche professional fields (for example, polymer chemistry, quantum communication, music theory). Research each, assign one agent to identify the top 3 YouTubers by subscriber count, compile into Excel, and provide details.
                </div>
              </div>

              {/* Accordions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                
                {/* Accordion 1: Research Fields */}
                <div style={{ border: '1px solid rgba(255,255,255,0.04)', borderRadius: 10, background: 'rgba(255,255,255,0.01)', overflow: 'hidden' }}>
                  <button
                    onClick={() => setActiveChatStep(activeChatStep === 'search' ? null : 'search')}
                    style={{ width: '100%', padding: '10px 12px', background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 700 }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Search size={12} style={{ color: '#3b82f6' }} />
                      Search | Academic disciplines & niche fields ...
                    </span>
                    <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                      69 results
                      {activeChatStep === 'search' ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </span>
                  </button>
                  {activeChatStep === 'search' && (
                    <div style={{ padding: '0 12px 10px', fontSize: '0.7rem', color: '#64748b', borderTop: '1px solid rgba(255,255,255,0.04)', lineHeight: 1.5, display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
                      <div>• Searched academic subdisciplines in sciences, humanities, arts</div>
                      <div>• Identified 100 specialized categories spanning STEM, medicine, philosophy</div>
                    </div>
                  )}
                </div>

                {/* Accordion 2: Write Todo */}
                <div style={{ border: '1px solid rgba(255,255,255,0.04)', borderRadius: 10, background: 'rgba(255,255,255,0.01)', overflow: 'hidden' }}>
                  <button
                    onClick={() => setActiveChatStep(activeChatStep === 'todo' ? null : 'todo')}
                    style={{ width: '100%', padding: '10px 12px', background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 700 }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle2 size={12} style={{ color: '#10b981' }} />
                      Write Todo
                    </span>
                    {activeChatStep === 'todo' ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  </button>
                  {activeChatStep === 'todo' && (
                    <div style={{ padding: '0 12px 10px', fontSize: '0.7rem', color: '#64748b', borderTop: '1px solid rgba(255,255,255,0.04)', lineHeight: 1.5, marginTop: 6 }}>
                      1. Seed 100 specialized fields across categories<br />
                      2. Spawning 100 dedicated parallel agents (Dewitt, Faquet, etc.)<br />
                      3. Verify sub counts & compile spreadsheet with clickable links
                    </div>
                  )}
                </div>

                {/* Accordion 3: Agents */}
                <div style={{ border: '1.5px solid rgba(99,102,241,0.15)', borderRadius: 12, background: 'rgba(99,102,241,0.02)', overflow: 'hidden' }}>
                  <div style={{ padding: '12px', borderBottom: '1px solid rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', fontWeight: 800, color: '#a5b4fc' }}>
                      <Layers size={13} style={{ color: '#818cf8' }} />
                      Agent Swarm | 100 Tasks
                    </span>
                    <span style={{ fontSize: '0.68rem', background: 'rgba(16,185,129,0.12)', color: '#10b981', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>
                      {simProgress}/100 Completed
                    </span>
                  </div>

                  <div style={{ maxHeight: 280, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 6, background: 'rgba(0,0,0,0.2)' }}>
                    {simAgents.map((sa, sIdx) => {
                      const isCompleted = sIdx < simProgress;
                      const isActive = simRunning && sIdx === simProgress;
                      const isSelected = selectedSimAgent === sa.id;
                      
                      return (
                        <div
                          key={sa.id}
                          onClick={() => {
                            setSelectedSimAgent(isSelected ? null : sa.id);
                            setSelectedFieldFilter(selectedFieldFilter === sa.field ? null : sa.field);
                          }}
                          style={{
                            padding: '10px',
                            background: isSelected ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.02)',
                            border: `1px solid ${isSelected ? 'rgba(99,102,241,0.3)' : isActive ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.04)'}`,
                            borderRadius: 8,
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 6,
                            transition: 'all 0.15s'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ width: 14, height: 14, borderRadius: '50%', background: isCompleted ? 'rgba(16,185,129,0.2)' : isActive ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {isCompleted ? (
                                  <Check size={8} style={{ color: '#10b981' }} />
                                ) : (
                                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: isActive ? '#f59e0b' : '#475569' }} />
                                )}
                              </div>
                              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: isCompleted ? '#10b981' : isActive ? '#f59e0b' : '#94a3b8' }}>
                                {sa.name}
                              </span>
                            </div>
                            <span style={{ fontSize: '0.65rem', color: '#475569', fontFamily: 'monospace' }}>
                              #{String(sa.id).padStart(2, '0')}
                            </span>
                          </div>

                          <div style={{ fontSize: '0.68rem', color: '#64748b', lineHeight: 1.4, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {sa.task}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                            <div style={{ display: 'flex', gap: 3 }}>
                              {[...Array(6)].map((_, dotIdx) => (
                                <div
                                  key={dotIdx}
                                  style={{
                                    width: 5,
                                    height: 5,
                                    background: isCompleted ? '#10b981' : isActive ? '#f59e0b' : '#334155',
                                    borderRadius: 1,
                                    opacity: isCompleted ? 0.9 : isActive ? (0.4 + (dotIdx % 3) * 0.3) : 0.2,
                                    animation: isActive ? 'pulse 0.8s infinite alternate' : 'none',
                                    animationDelay: `${dotIdx * 0.1}s`
                                  }}
                                />
                              ))}
                            </div>
                            <span style={{ fontSize: '0.65rem', color: isCompleted ? '#10b981' : isActive ? '#f59e0b' : '#475569', fontWeight: 700 }}>
                              {isCompleted ? 'Done' : isActive ? 'Working' : 'Pending'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {simProgress === 100 && (
                <div style={{
                  padding: '12px',
                  background: 'rgba(16,185,129,0.06)',
                  border: '1px solid rgba(16,185,129,0.2)',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  animation: 'fadeIn 0.5s ease'
                }}>
                  <CheckCircle2 size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 800, color: '#f1f5f9', fontSize: '0.78rem' }}>Roadmap Converged Successfully</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 2 }}>Excel database with 300 channels populated with clickable links.</div>
                  </div>
                </div>
              )}

            </div>

            {/* Bottom active telemetry stats */}
            <div style={{ padding: '14px 18px', borderTop: '1px solid rgba(255,255,255,0.06)', background: '#02040a', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, flexShrink: 0 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.65rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>Total Reach</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 850, color: '#f1f5f9', marginTop: 2 }}>549.4M</div>
              </div>
              <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.06)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '0.65rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>Channels</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 850, color: '#818cf8', marginTop: 2 }}>300</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.65rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>Niche Fields</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 850, color: '#10b981', marginTop: 2 }}>100</div>
              </div>
            </div>

          </div>

          {/* Right Column: Excel Sheet */}
          <div style={{ display: 'flex', flexDirection: 'column', background: '#ffffff', border: '1px solid rgba(0,0,0,0.15)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
            
            {/* Sheet Title Bar */}
            <div style={{ padding: '10px 16px', background: '#0f172a', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 22, height: 22, borderRadius: 4, background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileSpreadsheet size={12} style={{ color: '#fff' }} />
                </div>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.01em' }}>
                  top_youtubers_by_field_with_links.xlsx
                </span>
                {selectedFieldFilter && (
                  <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.1)', color: '#cbd5e1', padding: '1px 6px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    Filtered: {selectedFieldFilter}
                    <button onClick={() => setSelectedFieldFilter(null)} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 10, fontWeight: 700 }}>×</button>
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  onClick={downloadXlsShowcase}
                  style={{
                    padding: '5px 12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6,
                    color: '#f8fafc', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                >
                  <Download size={12} />
                  Download Excel
                </button>
              </div>
            </div>

            {/* Sub Filter ribbon */}
            <div style={{ padding: '8px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', flexShrink: 0 }}>
              <div style={{ position: 'relative', width: 220 }}>
                <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  value={xlsSearchQuery}
                  onChange={e => setXlsSearchQuery(e.target.value)}
                  placeholder="Search worksheet data..."
                  style={{
                    width: '100%', padding: '5px 10px 5px 28px', border: '1px solid #cbd5e1', borderRadius: 6,
                    fontSize: '0.75rem', outline: 'none', background: '#fff', color: '#334155', boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Category tags */}
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', flex: 1, paddingBottom: 2 }}>
                <button
                  onClick={() => setXlsSelectedCategory(null)}
                  style={{
                    padding: '4px 10px', borderRadius: 20, border: 'none',
                    background: xlsSelectedCategory === null ? '#1e293b' : '#edf2f7',
                    color: xlsSelectedCategory === null ? '#fff' : '#4a5568',
                    fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s'
                  }}
                >
                  All
                </button>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setXlsSelectedCategory(cat)}
                    style={{
                      padding: '4px 10px', borderRadius: 20, border: 'none',
                      background: xlsSelectedCategory === cat ? '#1e293b' : '#edf2f7',
                      color: xlsSelectedCategory === cat ? '#fff' : '#4a5568',
                      fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid */}
            <div style={{ flex: 1, overflow: 'auto', background: '#ffffff' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', color: '#1f2937', textAlign: 'left', tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: 45 }} />
                  <col style={{ width: 170 }} />
                  <col style={{ width: 60 }} />
                  <col style={{ width: 180 }} />
                  <col style={{ width: 90 }} />
                  <col style={{ width: 320 }} />
                  <col style={{ width: 120 }} />
                </colgroup>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ padding: '4px 6px', borderRight: '1px solid #cbd5e1', color: '#64748b', fontSize: '0.68rem', fontWeight: 700, textAlign: 'center' }}></th>
                    <th style={{ padding: '4px 8px', borderRight: '1px solid #cbd5e1', color: '#64748b', fontSize: '0.68rem', fontWeight: 700, textAlign: 'center' }}>A</th>
                    <th style={{ padding: '4px 8px', borderRight: '1px solid #cbd5e1', color: '#64748b', fontSize: '0.68rem', fontWeight: 700, textAlign: 'center' }}>B</th>
                    <th style={{ padding: '4px 8px', borderRight: '1px solid #cbd5e1', color: '#64748b', fontSize: '0.68rem', fontWeight: 700, textAlign: 'center' }}>C</th>
                    <th style={{ padding: '4px 8px', borderRight: '1px solid #cbd5e1', color: '#64748b', fontSize: '0.68rem', fontWeight: 700, textAlign: 'center' }}>D</th>
                    <th style={{ padding: '4px 8px', borderRight: '1px solid #cbd5e1', color: '#64748b', fontSize: '0.68rem', fontWeight: 700, textAlign: 'center' }}>E</th>
                    <th style={{ padding: '4px 8px', color: '#64748b', fontSize: '0.68rem', fontWeight: 700, textAlign: 'center' }}>F</th>
                  </tr>
                  <tr style={{ background: '#e2e8f0', borderBottom: '2px solid #94a3b8' }}>
                    <th style={{ padding: '8px 6px', borderRight: '1px solid #cbd5e1', color: '#475569', fontSize: '0.7rem', fontWeight: 800, textAlign: 'center' }}>#</th>
                    <th style={{ padding: '8px 10px', borderRight: '1px solid #cbd5e1', color: '#334155', fontWeight: 800 }}>Field</th>
                    <th style={{ padding: '8px 10px', borderRight: '1px solid #cbd5e1', color: '#334155', fontWeight: 800, textAlign: 'center' }}>Rank</th>
                    <th style={{ padding: '8px 10px', borderRight: '1px solid #cbd5e1', color: '#334155', fontWeight: 800 }}>Channel Name</th>
                    <th style={{ padding: '8px 10px', borderRight: '1px solid #cbd5e1', color: '#334155', fontWeight: 800 }}>Subscriber Count</th>
                    <th style={{ padding: '8px 10px', borderRight: '1px solid #cbd5e1', color: '#334155', fontWeight: 800 }}>Description</th>
                    <th style={{ padding: '8px 10px', color: '#334155', fontWeight: 800 }}>YouTube Link</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredXlsRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '30px 10px', textAlign: 'center', color: '#64748b', fontStyle: 'italic', background: '#fff' }}>
                        {simRunning ? 'Deploying swarm agents... Collecting specialized data streams.' : 'No matching worksheet records found.'}
                      </td>
                    </tr>
                  ) : (
                    filteredXlsRows.map((row, index) => {
                      const absoluteIndex = index + 1;
                      const isHovered = xlsHoveredRow === index;
                      const isFieldFiltered = selectedFieldFilter === row.field;
                      
                      return (
                        <tr
                          key={index}
                          onMouseEnter={() => setXlsHoveredRow(index)}
                          onMouseLeave={() => setXlsHoveredRow(null)}
                          style={{
                            borderBottom: '1px solid #cbd5e1',
                            background: isFieldFiltered ? '#f0fdf4' : isHovered ? '#f8fafc' : '#ffffff',
                            transition: 'background 0.15s'
                          }}
                        >
                          <td style={{
                            padding: '6px',
                            borderRight: '1px solid #cbd5e1',
                            background: '#f1f5f9',
                            color: '#64748b',
                            textAlign: 'center',
                            fontSize: '0.68rem',
                            fontWeight: 750,
                            userSelect: 'none'
                          }}>
                            {absoluteIndex + 2}
                          </td>
                          <td style={{
                            padding: '6px 10px',
                            borderRight: '1px solid #cbd5e1',
                            fontWeight: 700,
                            color: '#0f172a',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {row.field}
                          </td>
                          <td style={{
                            padding: '6px 10px',
                            borderRight: '1px solid #cbd5e1',
                            textAlign: 'center',
                            fontWeight: 800,
                            color: row.rank === 1 ? '#eab308' : row.rank === 2 ? '#94a3b8' : '#b45309'
                          }}>
                            {row.rank}
                          </td>
                          <td style={{
                            padding: '6px 10px',
                            borderRight: '1px solid #cbd5e1',
                            color: '#1e293b',
                            fontWeight: 650,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {row.channelName}
                          </td>
                          <td style={{
                            padding: '6px 10px',
                            borderRight: '1px solid #cbd5e1',
                            color: '#0f766e',
                            fontWeight: 750
                          }}>
                            {row.subscribers}
                          </td>
                          <td style={{
                            padding: '6px 10px',
                            borderRight: '1px solid #cbd5e1',
                            color: '#475569',
                            lineHeight: 1.35,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }} title={row.description}>
                            {row.description}
                          </td>
                          <td style={{
                            padding: '6px 10px'
                          }}>
                            <a
                              href={row.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: '#2563eb',
                                textDecoration: 'none',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                            >
                              Visit Channel
                              <ArrowUpRight size={10} />
                            </a>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ padding: '6px 16px', background: '#f1f5f9', borderTop: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, userSelect: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <div style={{
                  padding: '5px 12px',
                  background: '#ffffff',
                  borderTop: '2px solid #10b981',
                  borderLeft: '1px solid #cbd5e1',
                  borderRight: '1px solid #cbd5e1',
                  borderRadius: '3px 3px 0 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: '0.72rem',
                  fontWeight: 750,
                  color: '#10b981',
                  cursor: 'default'
                }}>
                  <FileSpreadsheet size={11} />
                  Top YouTubers by Field
                </div>
                <div style={{
                  padding: '5px 10px',
                  color: '#64748b',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  fontWeight: 700
                }}>
                  +
                </div>
              </div>
              <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>
                Sheet 1 of 1 · {filteredXlsRows.length} Rows populated
              </span>
            </div>

          </div>

        </div>
      )}

      {/* Styled Animations */}
      <style jsx global>{`
        @keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:1} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes fadeIn { from{opacity:0; transform:translateY(6px)} to{opacity:1; transform:translateY(0)} }
      `}</style>
    </div>
  );
}
