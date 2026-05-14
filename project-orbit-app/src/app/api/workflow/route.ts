import { NextRequest, NextResponse } from 'next/server';
import {
  listWorkflows, saveWorkflow, validateWorkflow,
  createCIPipelineTemplate, createReviewPipelineTemplate, createResearchTemplate,
  getParallelGroups,
} from '@/lib/openswarm/workflow';
import type { WorkflowConfig } from '@/lib/openswarm/types';

export async function GET() {
  const workflows = listWorkflows();
  return NextResponse.json({
    workflows: workflows.map(wf => ({
      ...wf,
      validation: validateWorkflow(wf),
      parallelGroups: getParallelGroups(wf.steps).length,
    })),
    total: workflows.length,
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  if (action === 'validate') {
    const workflow = body.workflow as WorkflowConfig;
    const result = validateWorkflow(workflow);
    return NextResponse.json(result);
  }

  if (action === 'template') {
    const { templateType, projectPath, prNumber, topic } = body;
    let workflow: WorkflowConfig;

    switch (templateType) {
      case 'ci':
        workflow = createCIPipelineTemplate(projectPath ?? '/projects/orbit');
        break;
      case 'review':
        workflow = createReviewPipelineTemplate(projectPath ?? '/projects/orbit', prNumber ?? '1');
        break;
      case 'research':
        workflow = createResearchTemplate(projectPath ?? '/projects/orbit', topic ?? 'AI trends');
        break;
      default:
        return NextResponse.json({ error: 'Unknown template type' }, { status: 400 });
    }

    saveWorkflow(workflow);
    return NextResponse.json({ workflow, validation: validateWorkflow(workflow) }, { status: 201 });
  }

  // Create workflow from definition
  const workflow = body as WorkflowConfig;
  if (!workflow.id || !workflow.name || !workflow.steps) {
    return NextResponse.json({ error: 'id, name, and steps are required' }, { status: 400 });
  }

  const validation = validateWorkflow(workflow);
  if (!validation.valid) {
    return NextResponse.json({ error: 'Workflow validation failed', errors: validation.errors }, { status: 400 });
  }

  saveWorkflow(workflow);
  return NextResponse.json({
    workflow,
    validation,
    parallelGroups: getParallelGroups(workflow.steps),
  }, { status: 201 });
}
