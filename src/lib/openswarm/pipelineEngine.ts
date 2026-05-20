// ============================================
// Orbit — Pipeline Engine
// Ported from OpenSwarm src/agents/pairPipeline.ts
// Simulated execution mode (no CLI spawning)
// ============================================

import type {
  TaskItem, PipelineConfig, PipelineResult, StageResult, PipelineStage,
  WorkerResult, ReviewResult, TesterResult, DocumenterResult, AuditorResult,
} from './types';
import { saveMemory } from './memoryEngine';

// ============================================
// Session Management
// ============================================

export interface PipelineSession {
  id: string;
  taskId: string;
  taskTitle: string;
  projectPath: string;
  status: 'idle' | 'working' | 'reviewing' | 'testing' | 'approved' | 'failed' | 'cancelled';
  startedAt: number;
  workerAttempts: number;
}

const sessions = new Map<string, PipelineSession>();
const pipelineRuns = new Map<string, PipelineResult>();

export function createSession(task: TaskItem, projectPath: string): PipelineSession {
  const session: PipelineSession = {
    id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    taskId: task.id,
    taskTitle: task.title,
    projectPath,
    status: 'idle',
    startedAt: Date.now(),
    workerAttempts: 0,
  };
  sessions.set(session.id, session);
  return session;
}

export function getSession(id: string): PipelineSession | null {
  return sessions.get(id) ?? null;
}

export function getAllSessions(): PipelineSession[] {
  return Array.from(sessions.values());
}

export function getPipelineRun(id: string): PipelineResult | null {
  return pipelineRuns.get(id) ?? null;
}

export function getAllPipelineRuns(): PipelineResult[] {
  return Array.from(pipelineRuns.values());
}

// ============================================
// Stage Simulators
// ============================================

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function simulateWorker(task: TaskItem): Promise<WorkerResult> {
  await sleep(800 + Math.random() * 400);
  const successRate = 0.85;
  const success = Math.random() < successRate;

  if (!success) {
    return { success: false, error: 'Worker encountered unrecoverable error', confidencePercent: 20 };
  }

  const filePatterns = [
    ['src/lib/auth.ts', 'src/middleware/rateLimit.ts'],
    ['src/api/agents/route.ts', 'src/lib/agents-data.ts'],
    ['src/app/(app)/dashboard/page.tsx'],
    ['src/lib/openswarm/pipelineEngine.ts', 'src/lib/openswarm/types.ts'],
  ];
  const filesChanged = filePatterns[Math.floor(Math.random() * filePatterns.length)];

  return {
    success: true,
    summary: `Implemented: ${task.title}. Applied changes across ${filesChanged.length} file(s).`,
    filesChanged,
    commands: ['npm run lint', 'npm run type-check'],
    confidencePercent: 75 + Math.floor(Math.random() * 20),
    costInfo: {
      model: 'claude-sonnet-4-5',
      inputTokens: 3000 + Math.floor(Math.random() * 5000),
      outputTokens: 800 + Math.floor(Math.random() * 1500),
      costUsd: 0.015 + Math.random() * 0.035,
    },
  };
}

async function simulateReviewer(workerResult: WorkerResult): Promise<ReviewResult> {
  await sleep(500 + Math.random() * 300);
  const confidence = workerResult.confidencePercent ?? 70;
  // Higher confidence → more likely to approve
  const approveRate = confidence > 80 ? 0.88 : 0.65;
  const decision = Math.random() < approveRate ? 'approve' : 'revise';

  return {
    decision,
    feedback: decision === 'approve'
      ? 'Code quality is good. Logic is correct and well-structured. Minor style improvements suggested but non-blocking.'
      : 'Missing error handling in edge cases. Need to add null checks for optional fields. Also add JSDoc comments.',
    issues: decision === 'revise' ? ['Missing null checks', 'No JSDoc on public functions'] : [],
    costInfo: {
      model: 'claude-sonnet-4-5',
      inputTokens: 2000 + Math.floor(Math.random() * 3000),
      outputTokens: 400 + Math.floor(Math.random() * 600),
      costUsd: 0.008 + Math.random() * 0.012,
    },
  };
}

async function simulateTester(workerResult: WorkerResult): Promise<TesterResult> {
  await sleep(600 + Math.random() * 400);
  const fileCount = workerResult.filesChanged?.length ?? 1;
  const testsPassed = 10 + Math.floor(Math.random() * 20 * fileCount);
  const testsFailed = Math.random() < 0.1 ? Math.floor(Math.random() * 3) : 0;

  return {
    success: testsFailed === 0,
    testsPassed,
    testsFailed,
    coverage: 78 + Math.floor(Math.random() * 15),
    output: testsFailed === 0
      ? `✓ ${testsPassed} tests passed`
      : `✓ ${testsPassed} passed, ✗ ${testsFailed} failed`,
    costInfo: {
      model: 'claude-haiku-4-5',
      inputTokens: 1500 + Math.floor(Math.random() * 2000),
      outputTokens: 300 + Math.floor(Math.random() * 400),
      costUsd: 0.003 + Math.random() * 0.005,
    },
  };
}

async function simulateDocumenter(workerResult: WorkerResult): Promise<DocumenterResult> {
  await sleep(300 + Math.random() * 200);
  return {
    success: true,
    docsUpdated: (workerResult.filesChanged ?? []).map(f => f.replace(/\.ts$/, '.md')),
    costInfo: {
      model: 'claude-haiku-4-5',
      inputTokens: 1000 + Math.floor(Math.random() * 1000),
      outputTokens: 500 + Math.floor(Math.random() * 500),
      costUsd: 0.002 + Math.random() * 0.003,
    },
  };
}

async function simulateAuditor(workerResult: WorkerResult): Promise<AuditorResult> {
  await sleep(400 + Math.random() * 300);
  return {
    success: true,
    findings: ['No hardcoded secrets detected', 'SQL injection patterns not found', 'Authentication checks verified'],
    costInfo: {
      model: 'claude-haiku-4-5',
      inputTokens: 2000 + Math.floor(Math.random() * 2000),
      outputTokens: 400 + Math.floor(Math.random() * 300),
      costUsd: 0.004 + Math.random() * 0.004,
    },
  };
}

// ============================================
// PairPipeline
// ============================================

export class PairPipeline {
  private config: PipelineConfig;
  private logListeners: Array<(event: { type: string; data: unknown }) => void> = [];

  constructor(config: PipelineConfig) {
    this.config = {
      continueOnTestFail: false,
      skipDocumenterIfNoChange: true,
      maxIterations: 3,
      ...config,
    };
  }

  onEvent(listener: (event: { type: string; data: unknown }) => void): void {
    this.logListeners.push(listener);
  }

  private emit(type: string, data: unknown): void {
    for (const listener of this.logListeners) {
      listener({ type, data });
    }
  }

  private hasStage(stage: PipelineStage): boolean {
    return this.config.stages.includes(stage);
  }

  async run(
    task: TaskItem,
    projectPath: string,
    onEvent?: (event: { type: string; stage?: string; data?: unknown; line?: string }) => void
  ): Promise<PipelineResult> {
    const startTime = Date.now();
    const session = createSession(task, projectPath);
    const stages: StageResult[] = [];
    const maxIterations = this.config.maxIterations ?? 3;

    const emit = (type: string, stage?: string, data?: unknown, line?: string) => {
      onEvent?.({ type, stage, data, line });
      this.emit(type, { stage, data, line });
    };

    let workerResult: WorkerResult | undefined;
    let reviewResult: ReviewResult | undefined;
    let testerResult: TesterResult | undefined;
    let documenterResult: DocumenterResult | undefined;
    let auditorResult: AuditorResult | undefined;

    try {
      let pipelineSuccess = false;

      for (let iteration = 1; iteration <= maxIterations; iteration++) {
        emit('iteration:start', undefined, { iteration, maxIterations });
        emit('log', undefined, undefined, `🔄 Iteration ${iteration}/${maxIterations}`);

        // === WORKER ===
        if (this.hasStage('worker')) {
          const stageStart = Date.now();
          session.status = 'working';
          session.workerAttempts++;
          emit('stage:start', 'worker', { iteration });
          emit('log', 'worker', undefined, `⚡ Worker starting: "${task.title}"`);

          const result = await simulateWorker(task);
          workerResult = result;

          const stageResult: StageResult = {
            stage: 'worker', success: result.success, result,
            duration: Date.now() - stageStart,
            startedAt: stageStart, completedAt: Date.now(),
          };
          stages.push(stageResult);

          if (!result.success) {
            emit('stage:fail', 'worker', result);
            emit('log', 'worker', undefined, `✗ Worker failed: ${result.error}`);
            break;
          }

          emit('stage:complete', 'worker', result);
          emit('log', 'worker', undefined, `✓ Worker complete — ${result.filesChanged?.length ?? 0} file(s) changed (confidence: ${result.confidencePercent}%)`);
          if (result.filesChanged) {
            for (const f of result.filesChanged) emit('log', 'worker', undefined, `  📄 ${f}`);
          }
        }

        // === REVIEWER ===
        if (this.hasStage('reviewer') && workerResult?.success) {
          const stageStart = Date.now();
          session.status = 'reviewing';
          emit('stage:start', 'reviewer');
          emit('log', 'reviewer', undefined, `🔍 Reviewer analyzing changes...`);

          const result = await simulateReviewer(workerResult);
          reviewResult = result;

          const stageResult: StageResult = {
            stage: 'reviewer', success: result.decision === 'approve', result,
            duration: Date.now() - stageStart,
            startedAt: stageStart, completedAt: Date.now(),
          };
          stages.push(stageResult);

          if (result.decision === 'revise') {
            emit('stage:fail', 'reviewer', result);
            emit('log', 'reviewer', undefined, `↩ Reviewer requested revisions: ${result.issues?.join(', ')}`);
            if (iteration < maxIterations) {
              emit('log', undefined, undefined, `🔄 Sending back to worker for revision...`);
              continue;
            } else {
              emit('log', undefined, undefined, `✗ Max iterations reached, pipeline failed`);
              break;
            }
          } else if (result.decision === 'reject') {
            emit('stage:fail', 'reviewer', result);
            emit('log', 'reviewer', undefined, `✗ Reviewer rejected: ${result.feedback}`);
            break;
          }

          emit('stage:complete', 'reviewer', result);
          emit('log', 'reviewer', undefined, `✓ Reviewer approved the changes`);
        }

        // === TESTER ===
        if (this.hasStage('tester') && workerResult?.success) {
          const stageStart = Date.now();
          session.status = 'testing';
          emit('stage:start', 'tester');
          emit('log', 'tester', undefined, `🧪 Running test suite...`);

          const result = await simulateTester(workerResult);
          testerResult = result;

          const stageResult: StageResult = {
            stage: 'tester', success: result.success, result,
            duration: Date.now() - stageStart,
            startedAt: stageStart, completedAt: Date.now(),
          };
          stages.push(stageResult);

          emit(result.success ? 'stage:complete' : 'stage:fail', 'tester', result);
          emit('log', 'tester', undefined, result.success
            ? `✓ Tests passed: ${result.testsPassed} tests, ${result.coverage}% coverage`
            : `✗ ${result.testsFailed} test(s) failed`);

          if (!result.success && !this.config.continueOnTestFail) {
            if (iteration < maxIterations) { continue; }
            else { break; }
          }
        }

        pipelineSuccess = true;
        emit('iteration:complete', undefined, { iteration });
        break;
      }

      // === DOCUMENTER (post-success, non-blocking) ===
      if (pipelineSuccess && this.hasStage('documenter') && workerResult?.success) {
        if (!this.config.skipDocumenterIfNoChange || (workerResult.filesChanged?.length ?? 0) > 0) {
          const stageStart = Date.now();
          emit('stage:start', 'documenter');
          emit('log', 'documenter', undefined, `📝 Updating documentation...`);
          const result = await simulateDocumenter(workerResult);
          documenterResult = result;
          stages.push({
            stage: 'documenter', success: result.success, result,
            duration: Date.now() - stageStart,
            startedAt: stageStart, completedAt: Date.now(),
          });
          emit('stage:complete', 'documenter', result);
          emit('log', 'documenter', undefined, `✓ Docs updated: ${result.docsUpdated?.join(', ')}`);
        }
      }

      // === AUDITOR (post-success, non-blocking) ===
      if (pipelineSuccess && this.hasStage('auditor') && workerResult?.success) {
        const fileCount = workerResult.filesChanged?.length ?? 0;
        if (fileCount >= 2) {
          const stageStart = Date.now();
          emit('stage:start', 'auditor');
          emit('log', 'auditor', undefined, `🔒 Running security audit...`);
          const result = await simulateAuditor(workerResult);
          auditorResult = result;
          stages.push({
            stage: 'auditor', success: result.success, result,
            duration: Date.now() - stageStart,
            startedAt: stageStart, completedAt: Date.now(),
          });
          emit('stage:complete', 'auditor', result);
          emit('log', 'auditor', undefined, `✓ Audit complete: ${result.findings?.length ?? 0} checks passed`);
        }
      }

      // Compute total cost
      const allCosts = stages
        .map(s => (s.result as { costInfo?: { inputTokens: number; outputTokens: number; costUsd: number; model: string } }).costInfo)
        .filter(Boolean);
      const totalCost = allCosts.length > 0 ? {
        model: allCosts[allCosts.length - 1]!.model,
        inputTokens: allCosts.reduce((s, c) => s + c!.inputTokens, 0),
        outputTokens: allCosts.reduce((s, c) => s + c!.outputTokens, 0),
        costUsd: allCosts.reduce((s, c) => s + c!.costUsd, 0),
      } : undefined;

      const pipelineResult: PipelineResult = {
        success: pipelineSuccess,
        sessionId: session.id,
        stages,
        finalStatus: pipelineSuccess ? 'approved' : 'failed',
        totalDuration: Date.now() - startTime,
        iterations: Math.min(3, stages.filter(s => s.stage === 'worker').length),
        workerResult,
        reviewResult,
        testerResult,
        documenterResult,
        auditorResult,
        taskContext: {
          issueIdentifier: task.issueIdentifier || task.issueId,
          projectPath,
          taskTitle: task.title,
        },
        totalCost,
      };

      session.status = pipelineSuccess ? 'approved' : 'failed';
      pipelineRuns.set(session.id, pipelineResult);

      emit(pipelineSuccess ? 'pipeline:complete' : 'pipeline:fail', undefined, pipelineResult);
      emit('log', undefined, undefined, pipelineSuccess
        ? `✅ Pipeline completed in ${((Date.now() - startTime) / 1000).toFixed(1)}s`
        : `❌ Pipeline failed after ${((Date.now() - startTime) / 1000).toFixed(1)}s`);

      // Save to memory
      if (pipelineSuccess && workerResult?.summary) {
        saveMemory('journal', 'orbit', `Pipeline: ${task.title}`, workerResult.summary, {
          skipDistillation: true,
          metadata: { sessionId: session.id, filesChanged: workerResult.filesChanged },
        });
      }

      return pipelineResult;
    } catch (error) {
      session.status = 'failed';
      const pipelineResult: PipelineResult = {
        success: false,
        sessionId: session.id,
        stages,
        finalStatus: 'failed',
        totalDuration: Date.now() - startTime,
        iterations: 1,
        taskContext: { projectPath, taskTitle: task.title },
      };
      pipelineRuns.set(session.id, pipelineResult);
      emit('pipeline:fail', undefined, { error: String(error) });
      return pipelineResult;
    }
  }
}

// ============================================
// Convenience Factory
// ============================================

export function createPipeline(stages?: PipelineStage[]): PairPipeline {
  return new PairPipeline({
    stages: stages ?? ['worker', 'reviewer', 'tester', 'documenter', 'auditor'],
    maxIterations: 3,
    continueOnTestFail: false,
    skipDocumenterIfNoChange: true,
  });
}
