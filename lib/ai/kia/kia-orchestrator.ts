import { buildKiaContext } from './kia-context-builder';
import { runKiaDecision } from './kia-decision-engine';
import { classifyKiaIntent, type KiaIntentClassification } from './kia-intent-classifier';
import type { KiaTaskType } from './kia-output-schema';
import {
  buildKiaSkillExecutionTrace,
  resolveKiaSkillAuthorization,
  type KiaSkillExecutionTrace,
} from './kia-skill-execution';
import { selectSubAgentProfile, type KiaSubAgentProfile } from './kia-sub-agent-router';
import type { KiaToolAuthorizationContext } from './kia-tool-registry';
import { buildMemorySummary, storeKiaMemory } from './kia-memory-store';

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
  return classification?.suggestedTaskType && classification.suggestedTaskType !== 'waba_reply'
    ? classification.suggestedTaskType
    : requestedTaskType;
}

function selectionBasis(params: {
  requestedTaskType: KiaTaskType;
  resolvedTaskType: KiaTaskType;
  detectedIntent: string | null;
}): KiaSkillExecutionTrace['selectionBasis'] {
  if (params.detectedIntent) return 'resolved_intent';
  if (params.resolvedTaskType !== params.requestedTaskType) return 'resolved_task';
  return 'requested_task';
}

export async function runKiaOrchestratedDecision(params: {
  input: Parameters<typeof runKiaDecision>[0];
  policyAuthorization: KiaToolAuthorizationContext;
  policyToolNames: string[];
}): Promise<Awaited<ReturnType<typeof runKiaDecision>> & { executionTrace: KiaSkillExecutionTrace }> {
  const { input } = params;
  let classification: KiaIntentClassification | null = null;

  if (input.channel === 'waba' && input.taskType === 'waba_reply') {
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

  // If classification is still ambiguous, keep the original waba task so the
  // decision engine can produce its existing clarification response. No tools
  // are exposed while the domain remains ambiguous.
  const needsClarification = classification?.needsClarify === true && classification.ambiguityScore >= 0.7;
  const effectiveTaskType = needsClarification ? input.taskType : plan.resolvedTaskType;
  const effectiveToolNames = needsClarification ? [] : plan.toolNames;
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
    selectionBasis: selectionBasis(plan),
    resolution: {
      ...skillResolution,
      authorization: effectiveAuthorization,
      toolNames: [...effectiveToolNames],
    },
    lateClassificationFailClosed: needsClarification,
  });

  console.info('[KIA orchestration]', executionTrace);

  const result = await runKiaDecision({
    ...input,
    taskType: effectiveTaskType,
    channel: effectiveAuthorization.channel,
    allowedToolNames: effectiveToolNames,
    toolAuthorization: {
      maxRiskTier: effectiveAuthorization.maxRiskTier,
      allowedEffects: effectiveAuthorization.allowedEffects
        ? [...effectiveAuthorization.allowedEffects]
        : undefined,
      autonomousOnly: effectiveAuthorization.autonomousOnly,
    },
  });

  // The engine normally stores WABA memory only when taskType remains
  // waba_reply. Post-classification orchestration replaces that task with the
  // resolved task, so preserve the existing memory behavior here.
  if (
    input.channel === 'waba' &&
    input.taskType === 'waba_reply' &&
    effectiveTaskType !== 'waba_reply' &&
    !result.usedFallback &&
    result.decision.confidence >= 0.6 &&
    result.decision.nextAction !== 'needs_review'
  ) {
    const openAiKey = process.env.OPENAI_API_KEY?.trim() ?? '';
    if (openAiKey) {
      buildMemorySummary({
        userMessage: input.message.slice(0, 300),
        kiaReply: result.decision.userMessage,
        intent: result.decision.intent,
        nextAction: result.decision.nextAction,
      }).then((content) =>
        storeKiaMemory({
          content,
          memoryType: 'conversation_summary',
          channel: input.channel,
          clientId: result.context.contact.clientId,
          leadId: result.context.contact.leadId,
          phone: result.context.contact.phone,
          openAiApiKey: openAiKey,
        }),
      ).catch(() => {});
    }
  }

  return {
    ...result,
    executionTrace,
  };
}
