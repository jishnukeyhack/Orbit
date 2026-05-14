// ============================================
// Orbit — Decision Engine
// Ported from OpenSwarm src/orchestration/decisionEngine.ts
// ============================================

import type {
  TaskItem, TaskSource, WorkflowConfig, DecisionResult, DecisionEngineConfig,
} from './types';
import { loadWorkflow, listWorkflows, createCIPipelineTemplate } from './workflow';

// ============================================
// State
// ============================================

interface EngineState {
  lastRunAt: number;
  consecutiveTasksRun: number;
  lastTaskId?: string;
  totalTasksCompleted: number;
  totalTasksFailed: number;
}

const DEFAULT_CONFIG: DecisionEngineConfig = {
  allowedProjects: [],
  autoExecute: false,
  maxConsecutiveTasks: 5,
  cooldownSeconds: 300,
  dryRun: false,
};

// ============================================
// Decision Engine Class
// ============================================

export class DecisionEngine {
  private config: DecisionEngineConfig;
  private state: EngineState = {
    lastRunAt: 0,
    consecutiveTasksRun: 0,
    totalTasksCompleted: 0,
    totalTasksFailed: 0,
  };

  constructor(config: Partial<DecisionEngineConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Main heartbeat — select the best task to execute.
   */
  heartbeat(tasks: TaskItem[]): DecisionResult {
    // 1. Cooldown check
    const now = Date.now();
    const timeSinceLastRun = (now - this.state.lastRunAt) / 1000;
    if (this.state.lastRunAt > 0 && timeSinceLastRun < this.config.cooldownSeconds) {
      return {
        action: 'defer',
        reason: `Cooldown: ${Math.ceil(this.config.cooldownSeconds - timeSinceLastRun)}s remaining`,
      };
    }

    // 2. Consecutive task limit
    if (this.state.consecutiveTasksRun >= this.config.maxConsecutiveTasks) {
      this.state.consecutiveTasksRun = 0;
      return { action: 'defer', reason: 'Max consecutive tasks reached, taking a break' };
    }

    // 3. Filter executable tasks
    const executableTasks = this.filterExecutableTasks(tasks);
    if (executableTasks.length === 0) {
      return { action: 'skip', reason: 'No executable tasks in backlog' };
    }

    // 4. Priority sort
    const sorted = this.prioritizeTasks(executableTasks);
    const selectedTask = sorted[0];

    // 5. Scope validation
    const scopeCheck = this.validateScope(selectedTask);
    if (!scopeCheck.valid) {
      return { action: 'skip', reason: `Scope violation: ${scopeCheck.reason}` };
    }

    // 6. Workflow mapping
    const workflow = this.taskToWorkflow(selectedTask);
    if (!workflow) {
      return { action: 'skip', task: selectedTask, reason: 'No matching workflow for task' };
    }

    return {
      action: this.config.autoExecute ? 'execute' : 'defer',
      task: selectedTask,
      workflow,
      reason: this.config.autoExecute
        ? `Auto-executing: ${selectedTask.title}`
        : `Ready to execute (requires approval): ${selectedTask.title}`,
    };
  }

  /**
   * Multi-task heartbeat for parallel processing.
   */
  heartbeatMultiple(tasks: TaskItem[], maxTasks = 3): {
    action: 'execute' | 'skip' | 'defer';
    tasks: Array<{ task: TaskItem; workflow: WorkflowConfig }>;
    reason: string;
    skippedCount: number;
  } {
    const executableTasks = this.filterExecutableTasks(tasks);
    if (executableTasks.length === 0) {
      return { action: 'skip', tasks: [], reason: 'No executable tasks', skippedCount: tasks.length };
    }

    const sorted = this.prioritizeTasks(executableTasks);
    const selectedTasks: Array<{ task: TaskItem; workflow: WorkflowConfig }> = [];
    let skippedCount = 0;

    for (const task of sorted) {
      if (selectedTasks.length >= maxTasks) break;
      const scopeCheck = this.validateScope(task);
      if (!scopeCheck.valid) { skippedCount++; continue; }
      const workflow = this.taskToWorkflow(task);
      if (!workflow) { skippedCount++; continue; }
      selectedTasks.push({ task, workflow });
    }

    if (selectedTasks.length === 0) {
      return { action: 'skip', tasks: [], reason: 'No tasks passed validation', skippedCount: sorted.length };
    }

    return {
      action: this.config.autoExecute ? 'execute' : 'defer',
      tasks: selectedTasks,
      reason: `${selectedTasks.length} tasks selected`,
      skippedCount,
    };
  }

  markCompleted(taskId: string): void {
    this.state.lastRunAt = Date.now();
    this.state.consecutiveTasksRun++;
    this.state.lastTaskId = taskId;
    this.state.totalTasksCompleted++;
  }

  markFailed(taskId: string): void {
    this.state.lastRunAt = Date.now();
    this.state.lastTaskId = taskId;
    this.state.totalTasksFailed++;
    this.state.consecutiveTasksRun = 0; // Reset on failure
  }

  updateAllowedProjects(paths: string[]): void {
    this.config.allowedProjects = paths;
  }

  getStats() {
    return {
      totalCompleted: this.state.totalTasksCompleted,
      totalFailed: this.state.totalTasksFailed,
      consecutiveRun: this.state.consecutiveTasksRun,
      lastRunAt: this.state.lastRunAt,
    };
  }

  // ============================================
  // Private Helpers
  // ============================================

  private filterExecutableTasks(tasks: TaskItem[]): TaskItem[] {
    return tasks.filter(task => {
      // Project path filter
      if (task.projectPath && this.config.allowedProjects.length > 0) {
        const allowed = this.config.allowedProjects.some(p =>
          task.projectPath!.includes(p) || p.includes(task.projectPath!)
        );
        if (!allowed) return false;
      }
      // Blocker check
      if (task.blockedBy && task.blockedBy.length > 0) return false;
      return true;
    });
  }

  private prioritizeTasks(tasks: TaskItem[]): TaskItem[] {
    return [...tasks].sort((a, b) => {
      const topoA = a.topoRank ?? Number.MAX_SAFE_INTEGER;
      const topoB = b.topoRank ?? Number.MAX_SAFE_INTEGER;
      if (topoA !== topoB) return topoA - topoB;
      if (a.priority !== b.priority) return a.priority - b.priority;
      if (a.dueDate && b.dueDate) return a.dueDate - b.dueDate;
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return a.createdAt - b.createdAt;
    });
  }

  private validateScope(task: TaskItem): { valid: boolean; reason?: string } {
    if (task.source !== 'linear' && task.source !== 'local' && task.source !== 'discovered') {
      return { valid: false, reason: `Task source "${task.source}" not allowed` };
    }
    if (!task.issueId && !task.workflowId && !task.id) {
      return { valid: false, reason: 'Task must have an ID' };
    }
    return { valid: true };
  }

  private taskToWorkflow(task: TaskItem): WorkflowConfig | null {
    if (task.workflowId) return loadWorkflow(task.workflowId);

    const workflows = listWorkflows();
    const matching = workflows.find(w =>
      w.projectPath === task.projectPath ||
      w.linearIssue === task.issueId
    );
    if (matching) return matching;

    if (task.projectPath) return createCIPipelineTemplate(task.projectPath);

    return createCIPipelineTemplate('/projects/orbit');
  }
}

// ============================================
// Singleton
// ============================================

let engineInstance: DecisionEngine | null = null;

export function getDecisionEngine(config?: Partial<DecisionEngineConfig>): DecisionEngine {
  if (!engineInstance || config) {
    engineInstance = new DecisionEngine(config);
  }
  return engineInstance;
}

// ============================================
// Sample Tasks (seeded data)
// ============================================

export const SAMPLE_TASKS: TaskItem[] = [
  {
    id: 'task-1', source: 'local', title: 'Add rate limiting to API endpoints',
    description: 'Implement token bucket rate limiting for all public API routes',
    priority: 2, projectPath: '/projects/orbit',
    issueId: 'ORB-142', issueIdentifier: 'ORB-142',
    createdAt: Date.now() - 86400000 * 2, estimatedMinutes: 45,
  },
  {
    id: 'task-2', source: 'local', title: 'Fix memory leak in agent runner',
    description: 'Memory grows unbounded when agents are spawned rapidly',
    priority: 1, projectPath: '/projects/orbit',
    issueId: 'ORB-143', issueIdentifier: 'ORB-143',
    createdAt: Date.now() - 86400000, estimatedMinutes: 30,
  },
  {
    id: 'task-3', source: 'local', title: 'Improve vector search performance',
    description: 'Optimize embedding search with approximate nearest neighbor index',
    priority: 3, projectPath: '/projects/orbit',
    issueId: 'ORB-144', issueIdentifier: 'ORB-144',
    createdAt: Date.now() - 3600000 * 3, estimatedMinutes: 120,
  },
  {
    id: 'task-4', source: 'local', title: 'Write integration tests for pipeline',
    description: 'Cover Worker → Reviewer → Tester pipeline with end-to-end tests',
    priority: 3, projectPath: '/projects/orbit',
    issueId: 'ORB-145', issueIdentifier: 'ORB-145',
    createdAt: Date.now() - 3600000, estimatedMinutes: 90,
  },
  {
    id: 'task-5', source: 'discovered', title: 'Add webhook notifications for pipeline events',
    description: 'Send POST to configured webhooks on stage completion/failure',
    priority: 4, projectPath: '/projects/orbit',
    issueId: 'ORB-146', issueIdentifier: 'ORB-146',
    createdAt: Date.now(), estimatedMinutes: 60,
  },
];

export function linearIssueToTask(issue: {
  id: string; identifier: string; title: string; description?: string;
  priority: number; dueDate?: string; state?: string;
  project?: { id: string; name: string }; parentId?: string; blockedBy?: string[];
}): TaskItem {
  return {
    id: issue.id, source: 'linear', title: issue.title,
    description: issue.description, priority: issue.priority || 3,
    issueId: issue.id, issueIdentifier: issue.identifier,
    linearState: issue.state, parentId: issue.parentId, blockedBy: issue.blockedBy,
    linearProject: issue.project ? { id: issue.project.id, name: issue.project.name } : undefined,
    createdAt: Date.now(),
    dueDate: issue.dueDate ? new Date(issue.dueDate).getTime() : undefined,
  };
}
