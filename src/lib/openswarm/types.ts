// ============================================
// Orbit — OpenSwarm Type Definitions
// Ported from OpenSwarm src/core/types.ts
// ============================================

export type AgentSession = {
  name: string;
  projectPath: string;
  heartbeatInterval: number;
  linearLabel?: string;
  enabled: boolean;
  paused: boolean;
};

export type AgentStatus = {
  name: string;
  currentIssue?: { id: string; identifier: string; title: string };
  lastHeartbeat?: number;
  lastReport?: string;
  state: 'idle' | 'working' | 'blocked' | 'paused' | 'reviewing';
};

export type LinearComment = { id: string; body: string; createdAt: string; user?: string };
export type LinearProjectInfo = { id: string; name: string; icon?: string; color?: string };

export type LinearIssueInfo = {
  id: string; identifier: string; title: string; description?: string;
  state: string; priority: number; labels: string[];
  comments: LinearComment[]; project?: LinearProjectInfo;
};

export type SwarmEvent = {
  type: 'issue_started' | 'issue_completed' | 'issue_blocked' | 'build_failed' |
        'test_failed' | 'commit' | 'error' | 'ci_failed' | 'ci_recovered' |
        'github_notification' | 'pr_improved' | 'pr_failed' | 'pr_conflict_detected' |
        'pr_conflict_resolving' | 'pr_conflict_resolved' | 'pr_conflict_failed';
  session: string; message: string; issueId?: string; timestamp: number; url?: string;
};

export type SwarmConfig = {
  adapter?: 'claude' | 'codex' | 'gpt' | 'local';
  language: 'en' | 'ko';
  discordToken: string;
  discordChannelId: string;
  discordWebhookUrl?: string;
  linearApiKey: string;
  linearTeamId: string;
  agents: AgentSession[];
  defaultHeartbeatInterval: number;
  githubRepos?: string[];
  githubCheckInterval?: number;
  timeWindow?: TimeWindowConfig;
  pairMode?: PairModeConfig;
  autonomous?: AutonomousStartupConfig;
};

export type TimeRange = { start: string; end: string };
export type TimeWindowConfig = {
  enabled: boolean;
  allowedWindows: TimeRange[];
  blockedWindows: TimeRange[];
  restrictedDays?: number[];
  timezone?: string;
};

export type PairModeConfig = {
  enabled: boolean;
  maxAttempts: number;
  workerTimeoutMs: number;
  reviewerTimeoutMs: number;
  webhookUrl?: string;
  autoLinearUpdate: boolean;
};

export type ModelConfig = { worker: string; reviewer: string };

export type PipelineStage = 'worker' | 'reviewer' | 'tester' | 'documenter' | 'auditor' | 'skill-documenter';

export type RoleConfig = {
  enabled: boolean;
  adapter?: 'claude' | 'codex' | 'gpt' | 'local';
  model: string;
  timeoutMs: number;
  escalateModel?: string;
  escalateAfterIteration?: number;
  maxTurns?: number;
};

export type JobProfile = {
  name: string;
  minMinutes?: number;
  maxMinutes?: number;
  priority?: number;
  roles?: Partial<Record<PipelineStage, string>>;
};

export interface PipelineGuardsConfig {
  qualityGate: boolean;
  fakeDataGuard: boolean;
  conventionalCommits: boolean;
  branchValidation: boolean;
  uncertaintyDetection: boolean;
  haltToLinear: boolean;
  registryCheck: boolean;
  bsDetector: boolean;
}

export type DefaultRolesConfig = {
  worker: RoleConfig;
  reviewer: RoleConfig;
  tester?: RoleConfig;
  documenter?: RoleConfig;
  auditor?: RoleConfig;
  'skill-documenter'?: RoleConfig;
};

export type DecompositionConfig = {
  enabled: boolean;
  thresholdMinutes: number;
  maxDepth?: number;
  maxChildrenPerTask?: number;
  dailyLimit?: number;
  autoBacklog?: boolean;
  plannerModel: string;
  plannerTimeoutMs: number;
};

export type AutonomousStartupConfig = {
  enabled: boolean;
  pairMode: boolean;
  schedule: string;
  maxAttempts: number;
  allowedProjects: string[];
  models?: ModelConfig;
  workerTimeoutMs?: number;
  reviewerTimeoutMs?: number;
  maxConcurrentTasks?: number;
  defaultRoles?: DefaultRolesConfig;
  decomposition?: DecompositionConfig;
  worktreeMode?: boolean;
  guards?: Partial<PipelineGuardsConfig>;
  dailyTaskCap?: number;
  interTaskCooldownMs?: number;
  jobProfiles?: JobProfile[];
};

// ============================================
// Pipeline Types
// ============================================

export type FailureStrategy = 'rollback' | 'retry' | 'skip' | 'abort' | 'notify';
export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export interface WorkflowStep {
  id: string;
  name: string;
  prompt: string;
  dependsOn?: string[];
  onFailure?: FailureStrategy;
  retryCount?: number;
  timeout?: number;
  condition?: string;
  env?: Record<string, string>;
}

export interface WorkflowConfig {
  id: string;
  name: string;
  description?: string;
  projectPath: string;
  steps: WorkflowStep[];
  onFailure?: FailureStrategy;
  trigger?: {
    schedule?: string;
    onIssueStatus?: string[];
    manual?: boolean;
  };
  linearIssue?: string;
}

export interface StepResult {
  stepId: string;
  status: StepStatus;
  startedAt: number;
  completedAt?: number;
  output?: string;
  error?: string;
  changedFiles?: string[];
}

export interface WorkflowExecution {
  workflowId: string;
  executionId: string;
  status: 'running' | 'completed' | 'failed' | 'aborted';
  startedAt: number;
  completedAt?: number;
  stepResults: Record<string, StepResult>;
  checkpoint?: string;
}

export interface ExecutorResult {
  execution: WorkflowExecution;
  success: boolean;
  failedStep?: string;
  rollbackPerformed?: boolean;
  duration: number;
}

// ============================================
// Decision Engine Types
// ============================================

export type TaskSource = 'linear' | 'local' | 'discovered' | 'github_pr' | 'github_pr_review';

export interface LinearProject { id: string; name: string }

export interface TaskItem {
  id: string;
  source: TaskSource;
  title: string;
  description?: string;
  priority: number;        // 1=Urgent, 2=High, 3=Normal, 4=Low
  projectPath?: string;
  linearProject?: LinearProject;
  issueId?: string;
  issueIdentifier?: string;
  linearState?: string;
  parentId?: string;
  topoRank?: number;
  workflowId?: string;
  createdAt: number;
  dueDate?: number;
  blockedBy?: string[];
  estimatedMinutes?: number;
}

export interface DecisionResult {
  action: 'execute' | 'skip' | 'defer' | 'add_to_backlog';
  task?: TaskItem;
  reason: string;
  workflow?: WorkflowConfig;
}

export interface DecisionEngineConfig {
  allowedProjects: string[];
  linearTeamId?: string;
  autoExecute: boolean;
  maxConsecutiveTasks: number;
  cooldownSeconds: number;
  dryRun: boolean;
}

// ============================================
// Pipeline Engine Types
// ============================================

export interface WorkerResult {
  success: boolean;
  summary?: string;
  filesChanged?: string[];
  commands?: string[];
  confidencePercent?: number;
  haltReason?: string;
  error?: string;
  costInfo?: CostInfo;
  output?: string;
}

export interface ReviewResult {
  decision: 'approve' | 'revise' | 'reject';
  feedback?: string;
  issues?: string[];
  costInfo?: CostInfo;
}

export interface TesterResult {
  success: boolean;
  testsPassed?: number;
  testsFailed?: number;
  coverage?: number;
  output?: string;
  costInfo?: CostInfo;
}

export interface DocumenterResult {
  success: boolean;
  docsUpdated?: string[];
  costInfo?: CostInfo;
}

export interface AuditorResult {
  success: boolean;
  findings?: string[];
  costInfo?: CostInfo;
}

export interface CostInfo {
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

export interface PipelineConfig {
  stages: PipelineStage[];
  continueOnTestFail?: boolean;
  skipDocumenterIfNoChange?: boolean;
  maxIterations?: number;
  roles?: Partial<Record<PipelineStage, RoleConfig>>;
  guards?: Partial<PipelineGuardsConfig>;
  jobProfiles?: JobProfile[];
  verbose?: boolean;
}

export interface StageResult {
  stage: PipelineStage;
  success: boolean;
  result: WorkerResult | ReviewResult | TesterResult | DocumenterResult | AuditorResult | { success: false; error: string };
  duration: number;
  startedAt: number;
  completedAt: number;
}

export interface PipelineResult {
  success: boolean;
  sessionId: string;
  stages: StageResult[];
  finalStatus: 'approved' | 'rejected' | 'failed' | 'cancelled' | 'decomposed';
  totalDuration: number;
  iterations: number;
  workerResult?: WorkerResult;
  reviewResult?: ReviewResult;
  testerResult?: TesterResult;
  documenterResult?: DocumenterResult;
  auditorResult?: AuditorResult;
  taskContext?: {
    issueIdentifier?: string;
    projectName?: string;
    projectPath?: string;
    taskTitle?: string;
  };
  totalCost?: CostInfo;
}

// ============================================
// Memory Types
// ============================================

export type CognitiveMemoryType = 'belief' | 'strategy' | 'user_model' | 'system_pattern' | 'constraint';
export type LegacyMemoryType = 'decision' | 'repomap' | 'journal' | 'fact';
export type MemoryType = CognitiveMemoryType | LegacyMemoryType;
export type StabilityLevel = 'low' | 'medium' | 'high';

export interface CognitiveMemoryRecord {
  id: string;
  type: MemoryType;
  content: string;
  importance: number;
  confidence: number;
  createdAt: number;
  lastUpdated: number;
  lastAccessed: number;
  revisionCount: number;
  decay: number;
  stability: StabilityLevel;
  contradicts: string;   // JSON string of id[]
  supports: string;      // JSON string of id[]
  derivedFrom: string;
  repo: string;
  title: string;
  metadata: string;      // JSON string
  trust: number;
  expiresAt: number;
}

export interface MemorySearchResult {
  id: string;
  type: MemoryType;
  repo: string;
  title: string;
  content: string;
  metadata: Record<string, unknown>;
  trust: number;
  createdAt: number;
  score: number;
  freshness: number;
  importance: number;
  confidence: number;
  stability: StabilityLevel;
  revisionCount: number;
  decay: number;
  similarityScore: number;
}

export interface SearchOptions {
  types?: MemoryType[];
  repo?: string;
  minSimilarity?: number;
  minTrust?: number;
  limit?: number;
}

// ============================================
// Agentic Loop Types
// ============================================

export interface AgenticLoopOptions {
  systemPrompt?: string;
  prompt: string;
  cwd: string;
  model: string;
  maxTurns?: number;
  timeoutMs?: number;
  onLog?: (line: string) => void;
  enableTools?: boolean;
  apiKey?: string;
}

export interface AgenticLoopResult {
  text: string;
  toolCallCount: number;
  apiCallCount: number;
  totalTokens: number;
  durationMs: number;
}

// ============================================
// Swarm Types
// ============================================

export interface SwarmDefinition {
  id: string;
  name: string;
  description?: string;
  agentIds: string[];
  model: string;
  status: 'running' | 'paused' | 'idle';
  createdAt: number;
  maxAgents?: number;
  strategy: 'parallel' | 'sequential' | 'hierarchical';
}

export interface SwarmMetrics {
  swarmId: string;
  tasksCompleted: number;
  tasksRunning: number;
  tasksFailed: number;
  avgTaskDurationMs: number;
  tokenUsage: number;
  costUsd: number;
}

// ============================================
// Event Types
// ============================================

export interface PipelineEvent {
  type: 'stage:start' | 'stage:complete' | 'stage:fail' | 'iteration:start' |
        'iteration:complete' | 'pipeline:complete' | 'pipeline:fail' | 'log';
  taskId: string;
  stage?: PipelineStage;
  iteration?: number;
  data?: unknown;
  line?: string;
  timestamp: number;
}
