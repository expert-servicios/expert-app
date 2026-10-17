// Read-only KIA Admin adapter. Never import a GitHub client or call the Codex runner here.
import manifest from '@/config/kia-dev-agent-tasks.json';
import { buildKiaDevAgentRequestPreview } from './kia-dev-agent-request-contract';
import type { KiaContext } from './kia-context-builder';

type AgentTask = (typeof manifest.tasks)[number];
const SMOKE_RUN = 'https://github.com/expert-servicios/kia-codex-lab/actions/runs/38239318166';

function publicTask(task: AgentTask) {
  return {
    id: task.id,
    title: task.title,
    phase: task.phase,
    status: task.status,
    requiredCheckpoint: task.requiredCheckpoint,
    allowedPaths: [...task.allowedPaths],
  };
}

/** Status in the deployed code revision, not a live GitHub or OpenAI account check. */
export function getKiaDevAgentStatus() {
  return {
    source: 'versioned_manifest',
    mode: 'read_only',
    integrationStage: 'admin_catalog_only',
    executionEnabledInManifest: manifest.executionEnabled === true,
    canDispatchFromKia: false,
    canCreatePullRequests: false,
    canMergeOrDeploy: false,
    requiresIndependentHumanApproval: true,
    limits: {
      maxChangedFiles: manifest.maxChangedFiles,
      maxPatchBytes: manifest.maxPatchBytes,
    },
    laboratoryEvidence: {
      runUrl: SMOKE_RUN,
      verdict: 'isolated_codex_read_only_passed_2026_10_12',
      note: 'Historical smoke run; it does not attest the current task, credentials or execution environment.',
    },
    tasks: manifest.tasks.map(publicTask),
  };
}

/** Preview only: an LLM must not turn this answer into permission to execute. */
export function previewKiaDevAgentTask(taskId: string, actor?: KiaContext['actor']) {
  const task = manifest.tasks.find((item) => item.id === taskId);
  const deniedReason = !task
    ? 'task_not_in_manifest'
    : task.status !== 'sandbox-approved'
      ? 'task_not_approved'
      : manifest.executionEnabled !== true
        ? 'agent_disabled'
        : 'manual_gate_required';

  return {
    taskId,
    found: Boolean(task),
    task: task ? publicTask(task) : null,
    eligibleForDispatch: false,
    dispatched: false,
    draftOnly: true,
    requestReview: buildKiaDevAgentRequestPreview({ taskId, actor }),
    deniedReason,
    nextAction: 'Revisar el checkpoint canonico, manifest, permisos, revision de seguridad y aprobacion humana independiente.',
  };
}
