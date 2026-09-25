/**
 * IMP-022: Kia copiloto in-app — endpoint de chat para el widget flotante.
 *
 * POST /api/ai/kia
 * Body: { message, sessionId?, currentPage?, currentTask?, pageData?, companyId?, history? }
 * Auth: usuario autenticado (cookie de sesión Supabase SSR).
 */

import { after, NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import {
  getEnabledKiaPolicyFeatureFlags,
  resolveKiaActorCapabilities,
} from '@/lib/ai/kia/kia-actor-capability-resolver';
import {
  resolveKiaPolicyToolNames,
  runPolicyEnforcedKiaDecision,
} from '@/lib/ai/kia/kia-policy-enforced-decision';
import { checkKiaDailyCostCap, checkKiaMessageRateLimit } from '@/lib/ai/kia/kia-rate-limit';
import { resolveKiaAvatarState } from '@/lib/ai/kia/kia-avatar-state';
import { buildKiaCopilotArtifacts } from '@/lib/ai/kia/kia-copilot-artifacts';
import {
  buildKiaAvatarDecision,
  buildKiaPresentationContext,
} from '@/lib/ai/kia/kia-presentation-context-builder';
import { loadKiaAuthoritativeCaseStatuses } from '@/lib/ai/kia/kia-authoritative-case-status';
import {
  appendKiaFiscalNotice,
  loadKiaAuthoritativeFiscalSignal,
  shouldLoadKiaFiscalSignal,
} from '@/lib/ai/kia/kia-authoritative-fiscal-signal';
import { buildKiaSystemPrompt } from '@/lib/ai/kia/kia-system-prompt';
import { KIA_DECISION_JSON_SCHEMA } from '@/lib/ai/kia/kia-output-schema';
import { KIA_TOOL_DEFINITIONS } from '@/lib/ai/kia/kia-tool-definitions';
import { redactSensitiveText, safeErrorMessage, stableHash } from '@/lib/ai/kia/kia-redaction';
import { runSampledKiaShadow } from '@/lib/ai/kia/evals/kia-shadow-sampler';
import { resolveKiaLocale } from '@/lib/ai/kia/kia-locale';
import { resolveKiaContextToken } from '@/lib/ai/kia/kia-context-token';
import { loadKiaConversation, persistKiaConversationTurn } from '@/lib/ai/kia/kia-conversation-store';
import { findCaseConversation } from '@/lib/ai/kia/kia-telegram-context';
import { buildAutomaticKiaKnowledgeResult, findKiaRelevantServices } from '@/lib/ai/kia/kia-knowledge-discovery';
import { buildAutomaticKiaVisualResult } from '@/lib/ai/kia/kia-visual-discovery';
import { detectKiaConversationOpportunity } from '@/lib/ai/kia/kia-contextual-opportunity';
import { resolveKiaStaffPreview } from '@/lib/ai/kia/kia-staff-preview';
import { kiaFriendlyError } from '@/lib/ai/kia/kia-error-copy';

const historyItemSchema = z.object({
  role: z.enum(['user', 'assistant']),
  text: z.string().min(1).max(1200),
}).strict();

const requestSchema = z.object({
  message     : z.string().min(1).max(4000),
  sessionId   : z.string().uuid().optional(),
  currentPage : z.string().max(200).optional(),
  currentTask : z.string().max(200).optional(),
  pageData    : z.record(z.string(), z.unknown()).optional(),
  companyId   : z.string().uuid().optional(),
  history     : z.array(historyItemSchema).max(8).optional(),
  contextToken: z.string().min(16).max(200).optional(),
}).strict();

function sessionCompanyId(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const value = (data as Record<string, unknown>).company_id;
  return typeof value === 'string' ? value : null;
}


export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (!checkKiaMessageRateLimit(user.id)) {
    return NextResponse.json({ error: 'rate_limited', reply: kiaFriendlyError('rate_limited', 'es'), avatarState: 'aviso', artifacts: [] }, { status: 429 });
  }
  const costCap = await checkKiaDailyCostCap(user.id);
  if (!costCap.ok) {
    return NextResponse.json({ error: 'daily_cost_cap_reached', reply: kiaFriendlyError('daily_cost_cap_reached', 'es'), avatarState: 'aviso', artifacts: [] }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_request', details: parsed.error.flatten() }, { status: 400 });
  }
  const { message, sessionId, currentPage, currentTask, pageData, companyId, history = [], contextToken } = parsed.data;

  const admin = getSupabaseAdmin();
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('tenant_id, active_company_id, preferred_language')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    console.error('[KiaCopilot] profile lookup failed:', profileError.message);
    return NextResponse.json({ error: 'profile_lookup_failed', reply: kiaFriendlyError('profile_lookup_failed', 'es'), avatarState: 'aviso', artifacts: [] }, { status: 500 });
  }

  let contextualCaseId: string | undefined;
  let contextualServiceSlug: string | undefined;
  let contextualTask: string | undefined;
  let contextualCompanyId: string | undefined;
  let staffPreview: Awaited<ReturnType<typeof resolveKiaStaffPreview>> = null;

  if (contextToken) {
    const contextual = await resolveKiaContextToken({
      admin,
      token: contextToken,
      profileId: user.id,
      tenantId: profile?.tenant_id ?? null,
    }).catch(() => null);

    if (!contextual) {
      return NextResponse.json({ error: 'invalid_context_token', reply: kiaFriendlyError('invalid_context_token', 'es'), avatarState: 'aviso', artifacts: [] }, { status: 403 });
    }

    staffPreview = await resolveKiaStaffPreview({ admin, actorId: user.id, metadata: contextual.metadata }).catch(() => null);
    contextualCaseId = staffPreview?.caseRow.id ?? contextual.case_id ?? undefined;
    contextualServiceSlug = staffPreview?.serviceSlug ?? contextual.service_slug ?? undefined;
    contextualTask = contextual.intent_hint ?? undefined;
    contextualCompanyId = staffPreview?.companyId ?? contextual.company_id ?? undefined;

    if (contextualCaseId && !contextualServiceSlug) {
      const { data: contextualCase } = await admin
        .from('cases')
        .select('service_id')
        .eq('id', contextualCaseId)
        .eq('client_id', staffPreview?.clientId ?? user.id)
        .maybeSingle();
      contextualServiceSlug = contextualCase?.service_id ?? undefined;
    }
  }

  const resolvedCompanyId = staffPreview
    ? (staffPreview.companyId ?? undefined)
    : (companyId ?? contextualCompanyId ?? profile?.active_company_id ?? undefined);
  const effectivePreferredLanguage = staffPreview?.client.preferred_language ?? profile?.preferred_language ?? null;
  const profileLocale = effectivePreferredLanguage === 'ru' ? 'ru' : 'es';
  const responseLocale = resolveKiaLocale({ latestMessage: message, preferredLanguage: profileLocale });

  if (resolvedCompanyId && !staffPreview) {
    const { data: membership, error: membershipError } = await admin
      .from('profile_companies')
      .select('company_id')
      .eq('profile_id', user.id)
      .eq('company_id', resolvedCompanyId)
      .maybeSingle();

    if (membershipError) {
      console.error('[KiaCopilot] company membership lookup failed:', membershipError.message);
      return NextResponse.json({ error: 'company_membership_check_failed', reply: kiaFriendlyError('company_membership_check_failed', responseLocale), avatarState: 'aviso', artifacts: [] }, { status: 500 });
    }

    if (!membership) {
      return NextResponse.json(
        {
          error: companyId ? 'company_forbidden' : 'active_company_invalid',
          reply: companyId
            ? kiaFriendlyError('company_forbidden', responseLocale)
            : kiaFriendlyError('active_company_invalid', responseLocale),
          avatarState: 'aviso',
          artifacts: [],
        },
        { status: companyId ? 403 : 409 },
      );
    }
  }

  const companyScope = resolvedCompanyId ?? null;
  let actor;
  try {
    actor = await resolveKiaActorCapabilities({
      admin,
      userId: user.id,
      clientId: staffPreview?.clientId ?? user.id,
      companyId: companyScope,
      featureFlags: getEnabledKiaPolicyFeatureFlags(),
    });
  } catch (err) {
    console.error('[KiaCopilot] actor capability resolution failed:', safeErrorMessage(err));
    return NextResponse.json({ error: 'policy_context_failed', reply: kiaFriendlyError('policy_context_failed', responseLocale), avatarState: 'aviso', artifacts: [] }, { status: 500 });
  }

  if (!actor.active) {
    return NextResponse.json({ error: 'account_inactive', reply: kiaFriendlyError('account_inactive', responseLocale), avatarState: 'aviso', artifacts: [] }, { status: 403 });
  }

  const dashboardPolicy = resolveKiaPolicyToolNames('client_dashboard', actor);
  if (!dashboardPolicy.ok) {
    console.warn('[KiaCopilot] client dashboard policy denied:', dashboardPolicy.reason);
    return NextResponse.json({ error: 'policy_denied', reply: kiaFriendlyError('policy_denied', responseLocale), avatarState: 'aviso', artifacts: [] }, { status: 403 });
  }

  const contextualPersistenceEnabled =
    process.env.KIA_CONTEXTUAL_CONVERSATIONS_ENABLED?.toLowerCase() === 'true';
  let effectiveSessionId = sessionId;
  let effectiveHistory = history;

  if (!sessionId && contextualPersistenceEnabled && contextualCaseId) {
    let stored = null;
    if (staffPreview) {
      const previewQuery = admin.from('kia_conversations')
        .select('id')
        .eq('profile_id', user.id)
        .eq('case_id', contextualCaseId)
        .eq('status', 'active')
        .contains('metadata', { staff_preview: true, preview_client_id: staffPreview.clientId });
      const { data: previewConversation, error: previewError } = await (
        actor.tenantId ? previewQuery.eq('tenant_id', actor.tenantId) : previewQuery.is('tenant_id', null)
      ).order('updated_at', { ascending: false }).limit(1).maybeSingle();
      if (previewError) {
        console.error('[KiaCopilot] staff preview conversation lookup failed:', previewError.message);
      } else if (previewConversation) {
        stored = await loadKiaConversation({
          admin,
          conversationId: previewConversation.id,
          profileId: user.id,
          companyId: companyScope,
        });
      }
    } else {
      stored = await findCaseConversation(admin, user.id, profile?.tenant_id ?? null, contextualCaseId, companyScope);
    }
    if (stored) {
      effectiveSessionId = stored.conversation.id;
      effectiveHistory = stored.messages.map(item => ({ role: item.role, text: item.text }));
    }
  }

  if (sessionId && contextualPersistenceEnabled) {
    const stored = await loadKiaConversation({
      admin,
      conversationId: sessionId,
      profileId: user.id,
      companyId: companyScope,
    }).catch((err) => {
      console.error('[KiaCopilot] contextual conversation lookup failed:', safeErrorMessage(err));
      return null;
    });

    if (!stored) {
      effectiveSessionId = undefined;
      effectiveHistory = [];
    } else {
      effectiveHistory = stored.messages.map((item) => ({ role: item.role, text: item.text }));
    }
  } else if (sessionId) {
    const { data: existingSession, error: sessionError } = await admin
      .from('kia_sessions')
      .select('id, data')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (sessionError) {
      console.error('[KiaCopilot] session scope lookup failed:', sessionError.message);
      return NextResponse.json({ error: 'session_scope_check_failed', reply: kiaFriendlyError('session_scope_check_failed', responseLocale), avatarState: 'aviso', artifacts: [] }, { status: 500 });
    }

    if (!existingSession || sessionCompanyId(existingSession.data) !== companyScope) {
      effectiveSessionId = undefined;
      effectiveHistory = [];
    }
  }

  const historyTimestamp = new Date().toISOString();
  const syntheticRecentMessages = effectiveHistory.map((item) => ({
    role: item.role,
    text: item.text,
    createdAt: historyTimestamp,
  }));

  let result;
  try {
    result = await runPolicyEnforcedKiaDecision('client_dashboard', actor, {
      taskType   : 'chat_reply',
      channel    : 'dashboard',
      message,
      locale     : responseLocale,
      allowTools : true,
      forceToolExecution: process.env.KIA_COPILOT_TOOLS_ENABLED?.toLowerCase() !== 'false',
      contextInput: {
        channel     : 'dashboard',
        userId      : user.id,
        clientId    : staffPreview?.clientId ?? user.id,
        companyId   : resolvedCompanyId,
        currentPage : currentPage ?? '/',
        currentTask : currentTask ?? contextualTask,
        pageData    : pageData,
        caseId      : contextualCaseId,
        serviceSlug : contextualServiceSlug,
        latestMessage: message,
        syntheticRecentMessages,
      },
    });
  } catch (err) {
    console.error('[KiaCopilot] runPolicyEnforcedKiaDecision failed:', safeErrorMessage(err));
    return NextResponse.json(
      {
        error: 'kia_error',
        reply: kiaFriendlyError('kia_error', responseLocale),
        avatarState: 'aviso',
        artifacts: [],
      },
      { status: 500 },
    );
  }

  if (!result.usedFallback && result.providerResult) {
    const shadowTaskType = result.decision.taskType;
    const allowedShadowToolNames = new Set(dashboardPolicy.toolNames);
    const shadowTools = KIA_TOOL_DEFINITIONS.filter((tool) => allowedShadowToolNames.has(tool.name));
    const shadowRequest = {
      taskType: shadowTaskType,
      systemPrompt: buildKiaSystemPrompt({
        locale: responseLocale,
        channel: 'dashboard',
        taskType: shadowTaskType,
      }),
      responseSchema: KIA_DECISION_JSON_SCHEMA,
      tools: shadowTools,
      messages: [{ role: 'user' as const, content: redactSensitiveText(message) }],
      maxTokens: 900,
      temperature: 0.2,
    };
    const shadowSampleKey = stableHash({
      userId: user.id,
      companyScope,
      sessionId: effectiveSessionId ?? null,
      message,
    });

    after(async () => {
      try {
        await runSampledKiaShadow({
          request: shadowRequest,
          baselineDecision: result.decision,
          baselineProviderResult: result.providerResult,
          sampleKey: shadowSampleKey,
        });
      } catch (err) {
        console.warn('[KiaCopilot] shadow sampling failed:', safeErrorMessage(err));
      }
    });
  }

  const authoritativeCaseStatuses = result.decision.intent === 'case_status'
    ? await loadKiaAuthoritativeCaseStatuses(admin, staffPreview?.clientId ?? user.id, companyScope)
    : null;

  const fiscalSignal = shouldLoadKiaFiscalSignal({
    message,
    currentPage,
    intent: result.decision.intent,
  })
    ? await loadKiaAuthoritativeFiscalSignal(admin, staffPreview?.clientId ?? user.id, companyScope)
    : null;

  const presentationContext = buildKiaPresentationContext(
    result.toolResults,
    authoritativeCaseStatuses,
    fiscalSignal?.risk ?? null,
  );
  const avatarDecision = buildKiaAvatarDecision(
    result.decision,
    result.toolResults,
    authoritativeCaseStatuses,
  );
  const avatarState = resolveKiaAvatarState({
    decision: avatarDecision,
    userMessage: message,
    presentationContext,
  });
  const automaticKnowledgeResult = buildAutomaticKiaKnowledgeResult({
    message,
    intent: result.decision.intent,
    serviceSlug: contextualServiceSlug,
    existingToolResults: result.toolResults,
  });
  const opportunity = detectKiaConversationOpportunity(message, result.decision);
  const automaticVisualResult = buildAutomaticKiaVisualResult({
    message,
    existingToolResults: result.toolResults,
  });
  const alreadyDiscoveredService = result.toolResults.some((item) => item.toolName === 'find_relevant_services');
  const automaticServiceResult = opportunity.allowServiceDiscovery && !alreadyDiscoveredService
    ? {
        toolName: 'find_relevant_services',
        ok: true,
        result: {
          services: findKiaRelevantServices({ query: message, limit: 1 }),
          opportunityReason: opportunity.reason,
        },
      }
    : null;
  const artifactToolResults = automaticKnowledgeResult
    ? [...result.toolResults, automaticKnowledgeResult]
    : [...result.toolResults];
  if (automaticVisualResult) artifactToolResults.push(automaticVisualResult);
  if (automaticServiceResult?.result.services.length) artifactToolResults.push(automaticServiceResult);
  const artifacts = buildKiaCopilotArtifacts(artifactToolResults, result.decision);
  const reply = appendKiaFiscalNotice(result.userMessage, fiscalSignal);

  try {
    if (contextualPersistenceEnabled) {
      effectiveSessionId = await persistKiaConversationTurn({
        admin,
        conversationId: effectiveSessionId,
        tenantId: actor.tenantId,
        profileId: user.id,
        companyId: companyScope,
        caseId: contextualCaseId ?? null,
        serviceSlug: contextualServiceSlug ?? null,
        topic: contextualTask ?? currentTask ?? null,
        originType: contextToken ? 'email' : 'dashboard',
        channel: 'dashboard',
        userMessage: message,
        assistantMessage: reply,
        intent: result.decision.intent,
        avatarState,
        metadata: {
          next_action: result.decision.nextAction,
          contextual: Boolean(contextToken),
          staff_preview: Boolean(staffPreview),
          preview_client_id: staffPreview?.clientId ?? null,
          preview_case_id: staffPreview?.caseRow.id ?? null,
        },
      });
    } else {
      const sessionData = {
        last_message: message,
        last_reply  : reply,
        intent      : result.decision.intent,
        next_action : result.decision.nextAction,
        avatar_state: avatarState,
        company_id  : companyScope,
      };

      if (effectiveSessionId) {
        await admin
          .from('kia_sessions')
          .update({ data: sessionData, updated_at: new Date().toISOString() })
          .eq('id', effectiveSessionId)
          .eq('user_id', user.id);
      } else {
        const { data: createdSession } = await admin
          .from('kia_sessions')
          .insert({
            channel  : 'dashboard',
            user_id  : user.id,
            phone    : null,
            data     : sessionData,
          })
          .select('id')
          .single();
        effectiveSessionId = createdSession?.id ?? undefined;
      }
    }
  } catch (err) {
    console.warn('[KiaCopilot] session save failed:', err);
  }

  const response = NextResponse.json({
    reply,
    quickReplies: (result.decision.quickReplies ?? []).map((replyItem) => replyItem.title),
    intent     : result.decision.intent,
    nextAction : result.decision.nextAction,
    avatarState,
    artifacts,
  });
  if (effectiveSessionId) response.headers.set('x-kia-session-id', effectiveSessionId);
  return response;
}
