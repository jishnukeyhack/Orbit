// ============================================
// Orbit — DAG Workflow Engine
// Ported from OpenSwarm src/orchestration/workflow.ts
// ============================================

import type { WorkflowStep, WorkflowConfig, StepResult, WorkflowExecution } from './types';

// ============================================
// DAG Utilities
// ============================================

/**
 * Topological Sort using Kahn's Algorithm.
 * Returns steps ordered so all dependencies come before dependents.
 */
export function topologicalSort(steps: WorkflowStep[]): WorkflowStep[] {
  const graph = new Map<string, Set<string>>();
  const inDegree = new Map<string, number>();
  const stepMap = new Map<string, WorkflowStep>();

  for (const step of steps) {
    stepMap.set(step.id, step);
    graph.set(step.id, new Set());
    inDegree.set(step.id, 0);
  }

  for (const step of steps) {
    if (step.dependsOn) {
      for (const dep of step.dependsOn) {
        if (!graph.has(dep)) {
          throw new Error(`Step "${step.id}" depends on unknown step "${dep}"`);
        }
        graph.get(dep)!.add(step.id);
        inDegree.set(step.id, (inDegree.get(step.id) || 0) + 1);
      }
    }
  }

  const queue: string[] = [];
  const result: WorkflowStep[] = [];

  for (const [id, degree] of inDegree) {
    if (degree === 0) queue.push(id);
  }

  while (queue.length > 0) {
    const current = queue.shift()!;
    result.push(stepMap.get(current)!);
    for (const neighbor of graph.get(current)!) {
      inDegree.set(neighbor, inDegree.get(neighbor)! - 1);
      if (inDegree.get(neighbor) === 0) queue.push(neighbor);
    }
  }

  if (result.length !== steps.length) {
    throw new Error('Workflow contains circular dependencies');
  }

  return result;
}

/**
 * Find steps that can currently be executed (all dependencies completed).
 */
export function getExecutableSteps(
  steps: WorkflowStep[],
  results: Record<string, StepResult>
): WorkflowStep[] {
  return steps.filter(step => {
    if (results[step.id]) return false;
    if (step.dependsOn) {
      for (const depId of step.dependsOn) {
        const depResult = results[depId];
        if (!depResult || depResult.status !== 'completed') return false;
      }
    }
    return true;
  });
}

/**
 * Find groups of steps that can run in parallel.
 * Returns ordered groups where each group can execute simultaneously.
 */
export function getParallelGroups(steps: WorkflowStep[]): WorkflowStep[][] {
  const sorted = topologicalSort(steps);
  const groups: WorkflowStep[][] = [];
  const completed = new Set<string>();

  while (completed.size < sorted.length) {
    const group: WorkflowStep[] = [];
    for (const step of sorted) {
      if (completed.has(step.id)) continue;
      const depsCompleted = !step.dependsOn ||
        step.dependsOn.every(dep => completed.has(dep));
      if (depsCompleted) group.push(step);
    }
    if (group.length === 0) break;
    groups.push(group);
    group.forEach(s => completed.add(s.id));
  }

  return groups;
}

// ============================================
// Validation
// ============================================

export function validateWorkflow(workflow: WorkflowConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!workflow.id) errors.push('Workflow ID is required');
  if (!workflow.name) errors.push('Workflow name is required');
  if (!workflow.steps || workflow.steps.length === 0) {
    errors.push('Workflow must have at least one step');
  }

  const stepIds = new Set<string>();
  for (const step of workflow.steps || []) {
    if (!step.id) { errors.push('Each step must have an ID'); continue; }
    if (stepIds.has(step.id)) errors.push(`Duplicate step ID: ${step.id}`);
    stepIds.add(step.id);
    if (!step.prompt) errors.push(`Step "${step.id}" must have a prompt`);

    if (step.dependsOn) {
      for (const dep of step.dependsOn) {
        if (!workflow.steps.some(s => s.id === dep)) {
          errors.push(`Step "${step.id}" depends on unknown step "${dep}"`);
        }
      }
    }
  }

  if (workflow.steps && workflow.steps.length > 0) {
    try { topologicalSort(workflow.steps); } catch (e) { errors.push((e as Error).message); }
  }

  return { valid: errors.length === 0, errors };
}

// ============================================
// Workflow Templates
// ============================================

export function createCIPipelineTemplate(projectPath: string): WorkflowConfig {
  return {
    id: `ci-pipeline-${Date.now()}`,
    name: 'CI Pipeline',
    description: 'Lint → Test → Build → PR',
    projectPath,
    onFailure: 'rollback',
    steps: [
      { id: 'lint', name: 'Lint & Format', prompt: 'Run linting and fix any issues. Report what was fixed.', onFailure: 'abort' },
      { id: 'test', name: 'Run Tests', prompt: 'Run all tests and report results. Fix any failing tests if possible.', dependsOn: ['lint'], onFailure: 'abort' },
      { id: 'build', name: 'Build Check', prompt: 'Run build and verify it succeeds. Fix any build errors.', dependsOn: ['test'], onFailure: 'abort' },
      { id: 'pr', name: 'Create PR', prompt: 'Create a pull request with all changes made. Include a summary of fixes.', dependsOn: ['build'], onFailure: 'notify' },
    ],
  };
}

export function createReviewPipelineTemplate(projectPath: string, prNumber: string): WorkflowConfig {
  return {
    id: `review-pipeline-${Date.now()}`,
    name: 'Code Review Pipeline',
    description: 'Security → Quality → Tests → Approve',
    projectPath,
    onFailure: 'notify',
    steps: [
      { id: 'security', name: 'Security Review', prompt: `Review PR #${prNumber} for security vulnerabilities. Check for injection, auth issues, data exposure.` },
      { id: 'quality', name: 'Code Quality', prompt: `Review PR #${prNumber} for code quality. Check naming, structure, SOLID principles.` },
      { id: 'tests', name: 'Test Coverage', prompt: `Check if PR #${prNumber} has adequate test coverage. Suggest missing tests.`, dependsOn: ['security', 'quality'] },
      { id: 'summary', name: 'Review Summary', prompt: 'Compile all review findings and create a summary comment on the PR.', dependsOn: ['tests'] },
    ],
  };
}

export function createResearchTemplate(projectPath: string, topic: string): WorkflowConfig {
  return {
    id: `research-${Date.now()}`,
    name: `Research: ${topic}`,
    description: 'Gather → Analyze → Synthesize → Report',
    projectPath,
    steps: [
      { id: 'gather', name: 'Gather Sources', prompt: `Search and gather relevant information about: ${topic}` },
      { id: 'analyze', name: 'Analyze Data', prompt: `Analyze the gathered information about ${topic}. Identify key insights and patterns.`, dependsOn: ['gather'] },
      { id: 'synthesize', name: 'Synthesize Findings', prompt: `Synthesize analysis into actionable conclusions about ${topic}.`, dependsOn: ['analyze'] },
      { id: 'report', name: 'Write Report', prompt: `Write a comprehensive report summarizing findings about ${topic}.`, dependsOn: ['synthesize'] },
    ],
  };
}

// ============================================
// In-Memory Workflow Store
// ============================================

const workflows = new Map<string, WorkflowConfig>();
const executions = new Map<string, WorkflowExecution>();

export function saveWorkflow(workflow: WorkflowConfig): void {
  workflows.set(workflow.id, workflow);
}

export function loadWorkflow(id: string): WorkflowConfig | null {
  return workflows.get(id) ?? null;
}

export function listWorkflows(): WorkflowConfig[] {
  return Array.from(workflows.values());
}

export function deleteWorkflow(id: string): boolean {
  return workflows.delete(id);
}

export function saveExecution(execution: WorkflowExecution): void {
  executions.set(execution.executionId, execution);
}

export function loadExecution(executionId: string): WorkflowExecution | null {
  return executions.get(executionId) ?? null;
}

export function listExecutions(workflowId?: string): WorkflowExecution[] {
  const all = Array.from(executions.values());
  if (workflowId) return all.filter(e => e.workflowId === workflowId);
  return all;
}

// Seed with a few example workflows on load
const SEED_WORKFLOWS: WorkflowConfig[] = [
  {
    id: 'wf-ci-default', name: 'CI Pipeline', description: 'Default CI: Lint → Test → Build → PR',
    projectPath: '/projects/orbit', onFailure: 'rollback',
    steps: [
      { id: 'lint', name: 'Lint & Format', prompt: 'Run linting', onFailure: 'abort' },
      { id: 'test', name: 'Run Tests', prompt: 'Run all tests', dependsOn: ['lint'], onFailure: 'abort' },
      { id: 'build', name: 'Build', prompt: 'Run build', dependsOn: ['test'], onFailure: 'abort' },
      { id: 'pr', name: 'Create PR', prompt: 'Create PR with changes', dependsOn: ['build'], onFailure: 'notify' },
    ],
  },
  {
    id: 'wf-research', name: 'Research Pipeline', description: 'Gather → Analyze → Report',
    projectPath: '/projects/research',
    steps: [
      { id: 'gather', name: 'Gather Sources', prompt: 'Gather relevant information' },
      { id: 'analyze', name: 'Analyze', prompt: 'Analyze gathered data', dependsOn: ['gather'] },
      { id: 'report', name: 'Write Report', prompt: 'Write comprehensive report', dependsOn: ['analyze'] },
    ],
  },
  {
    id: 'wf-review', name: 'Code Review Pipeline', description: 'Security → Quality → Approve',
    projectPath: '/projects/orbit',
    steps: [
      { id: 'security', name: 'Security Review', prompt: 'Check for security issues' },
      { id: 'quality', name: 'Code Quality', prompt: 'Check code quality' },
      { id: 'summary', name: 'Summary', prompt: 'Compile review findings', dependsOn: ['security', 'quality'] },
    ],
  },
];

SEED_WORKFLOWS.forEach(wf => workflows.set(wf.id, wf));
