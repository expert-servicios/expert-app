import { buildKiaContext } from './kia-context-builder';
import { runKiaDecision } from './kia-decision-engine';
import { classifyKiaIntent, type KiaIntentClassification } from './kia-intent-classifier';
import type { KiaTaskType } from './kia-output-schema';
import {
  buildKiaSkillExecutionTrace,
  resolveKiaSkillAuthorization,
  type KiaSkillExecutionTrace,
} from './kia-skill-execution';
import { getKiaSkillDefinition } from './kia-skill-registry';
import { selectSubAgentProfile, type KiaSubAgentProfile } from './kia-sub-agent-router';
import type { KiaToolAuthorizationContext } from './kia-tool-registry';

export interface KiaOrchestrationPlan {
  requestedTaskType: KiaTaskType;
  resolvedTaskType: KiaTaskType;
  detectedIntent: string | null;
  skillId: string | null;
  skillVersion: string | null;
  subAgent: KiaSubAgentProfile | null;
  authorization: KiaToolAuthorizationContext;
  toolNames: string[];
}

export function resolveKiaOrchestrationPlan(params: {
  requestedTaskType: KiaTaskType;
  resolvedTaskType: KiaTaskType;
  detectedIntent?: string | null;
  policyAuthorization: KiaToolAuthorizationContext;
  policyToolNames: string[];
}): KiaOrchestrationPlan {
  const skillAuthorization = resolveKiaSkillAuthorization({
    taskType: params.resolvedTaskType,
    detectedIntent: params.detectedIntent,
    policyAuthorization: params.policyAuthorization,
    policyToolNames: params.policyToolNames,
  });

  const subAgent = selectSubAgentProfile({
    taskType: params.resolvedTaskType,
    detectedIntent: params.detectedIntent ?? undefined,
    channel: params.policyAuthorization.channel,
  });

  return {
    requestedTaskType: params.requestedTaskType,
    resolvedTaskType: params.resolvedTaskType,
    detectedIntent: params.detectedIntent ?? null,
    skillId: skillAuthorization.skill?.id ?? null,
    skillVersion: skillAuthorization.skill?.version ?? null,
    subAgent,
    authorization: {
      ...skillAuthorization.authorization,
      requestedNames: skillAuthorization.authorization.requestedNames
        ? [...skillAuthorization.authorization.requestedNames]
        : undefined,
      allowedEffects: skillAuthorization.authorization.allowedEffects
        ? [...skillAuthorization.authorization.allowedEffects]
        : undefined,
    },
    toolNames: [...skillAuthorization.toolNames],
  };
}

function resolveTaskAfterClassification(
  requestedTaskType: KiaTaskType,
  classification: KiaIntentClassification | null,
): KiaTaskType {
  if (!classification?.suggestedTaskType) return requestedTaskType;
  if (classification.suggestedTaskType === 'waba_reply') return 'chat_reply';
  return classification.suggestedTaskType;
}

function selectionBasis(params: {
  requestedTaskType: KiaTaskType;
  resolvedTaskType: KiaTaskType;
  detectedIntent: string | null;
  skillId: string | null;
}): KiaSkillExecutionTrace['selectionBasis'] {
  const skill = getKiaSkillDefinition(params.skillId ?? '');
  if (skill && params.detectedIntent && skill.intents.includes(params.detectedIntent)) {
    return 'resolved_intent';
  }
  if (skill?.taskTypes.includes(params.resolvedTaskType) && params.resolvedTaskType !== params.requestedTaskType) {
    return 'resolved_task';
  }
  return 'requested_task';
}

function shouldClassifyChat(input: Parameters<typeof runKiaDecision>[0]): boolean {
  return input.taskType === 'chat_reply'
    && (input.channel === 'dashboard' || input.channel === 'telegram' || input.channel === 'email');
}

export function shouldFailClosedChatOrchestration(params: {
  chatEntrypoint: boolean;
  classificationResolved: boolean;
  skillId: string | null;
  needsClarification: boolean;
  allowResolvedUnskilled?: boolean;
}): boolean {
  if (params.needsClarification) return true;
  if (!params.chatEntrypoint) return false;
  if (!params.classificationResolved) return true;
  return params.skillId === null && params.allowResolvedUnskilled !== true;
}

export async function runKiaOrchestratedDecision(params: {
  input: Parameters<typeof runKiaDecision>[0];
  policyAuthorization: KiaToolAuthorizationContext;
  policyToolNames: string[];
}): Promise<Awaited<ReturnType<typeof runKiaDecision>> & { executionTrace: KiaSkillExecutionTrace }> {
  const { input } = params;
  let classification: KiaIntentClassification | null = null;

  if (shouldClassifyChat(input)) {
    const classificationContext = await buildKiaContext({
      ...input.contextInput,
      channel: input.channel,
      latestMessage: input.message,
    });
    input.onProgress?.({ type: 'classifying' });
    classification = await classifyKiaIntent({
      message: input.message,
      recentMessages: classificationContext.conversation.recentMessages,
      contactStatus: classificationContext.contact.status,
      channel: input.channel,
    }).catch(() => null);
  }

  const resolvedTaskType = resolveTaskAfterClassification(input.taskType, classification);
  const plan = resolveKiaOrchestrationPlan({
    requestedTaskType: input.taskType,
    resolvedTaskType,
    detectedIntent: classification?.detectedIntent,
    policyAuthorization: params.policyAuthorization,
    policyToolNames: params.policyToolNames,
  });

  const needsClarification = classification?.needsClarify === true && classification.ambiguityScore >= 0.7;
  const orchestrationFailClosed = shouldFailClosedChatOrchestration({
    chatEntrypoint: shouldClassifyChat(input),
    classificationResolved: classification !== null,
    skillId: plan.skillId,
    needsClarification,
    allowResolvedUnskilled: input.channel === 'email',
  });
  const effectiveTaskType = needsClarification ? 'chat_reply' : plan.resolvedTaskType;
  const effectiveToolNames = orchestrationFailClosed ? [] : plan.toolNames;
  const effectiveAuthorization: KiaToolAuthorizationContext = {
    ...plan.authorization,
    requestedNames: [...effectiveToolNames],
  };

  const skillResolution = resolveKiaSkillAuthorization({
    taskType: plan.resolvedTaskType,
    detectedIntent: plan.detectedIntent,
    policyAuthorization: params.policyAuthorization,
    policyToolNames: params.policyToolNames,
  });
  const executionTrace = buildKiaSkillExecutionTrace({
    taskType: input.taskType,
    resolvedTaskType: plan.resolvedTaskType,
    detectedIntent: plan.detectedIntent,
    selectionBasis: selectionBasis({
      requestedTaskType: plan.requestedTaskType,
      resolvedTaskType: plan.resolvedTaskType,
      detectedIntent: plan.detectedIntent,
      skillId: plan.skillId,
    }),
    resolution: {
      ...skillResolution,
      authorization: effectiveAuthorization,
      toolNames: [...effectiveToolNames],
    },
    lateClassificationFailClosed: orchestrationFailClosed,
  });

  console.info('[KIA orchestration]', executionTrace);

  // The classifier runs before the policy/skill selection. Preserve that
  // resolved intent as task context for the final decision prompt so dashboard
  // and Telegram do not lose the labor/accounting specialization when the
  // underlying task type remains the generic chat_reply. An explicit page task
  // always wins over the classifier-derived context.
  const decisionContextInput = {
    ...input.contextInput,
    currentTask: input.contextInput.currentTask ?? plan.detectedIntent ?? undefined,
  };

  const result = await runKiaDecision({
    ...input,
    contextInput: decisionContextInput,
    taskType: effectiveTaskType,
    channel: effectiveAuthorization.channel,
    allowedToolNames: effectiveToolNames,
    detectedIntentOverride: plan.detectedIntent,
    orchestrationMetadata: {
      skillId: executionTrace.skillId,
      subAgentId: executionTrace.preferredSubAgentId,
      detectedIntent: executionTrace.detectedIntent,
      selectionBasis: executionTrace.selectionBasis,
    },
    toolAuthorization: {
      maxRiskTier: effectiveAuthorization.maxRiskTier,
      allowedEffects: effectiveAuthorization.allowedEffects
        ? [...effectiveAuthorization.allowedEffects]
        : undefined,
      autonomousOnly: effectiveAuthorization.autonomousOnly,
    },
  });

  return {
    ...result,
    executionTrace,
  };
}
