import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('KIA guarded email agent', () => {
  const route = source('app/api/cron/kia-email-agent/route.ts');
  const helper = source('lib/integrations/operational-gmail.ts');
  const gmail = source('lib/integrations/gmail.ts');
  const vercel = source('vercel.json');

  it('is fail-closed and requires explicit auto-send plus a live communication stack', () => {
    expect(route).toContain('automationEnabled');
    expect(route).toContain("'kia.email_agent'");
    expect(route).toContain("'kia.email_auto_send'");
    expect(route).toContain("'kia.email_new_lead_auto_send'");
    expect(route).toContain("select('enabled,updated_at').eq('key', 'kia.email_agent')");
    expect(route).toContain('KIA_EMAIL_AUTO_SEND_ENABLED');
    expect(route).toContain('isKiaGatewayConfigured');
    expect(route).toContain('getKiaProviderOrder');
    expect(route).toContain("reason: 'no_ai_provider'");
    expect(route).toContain("reason: 'communication_stack_ready'");
  });

  it('only auto-replies to likely humans', () => {
    expect(route).toContain('isLikelyHuman');
    expect(route).toContain('listUnsubscribe');
    expect(route).toContain('autoSubmitted');
    expect(route).toContain('CATEGORY_PROMOTIONS');
    expect(route).toContain('no-?reply');
  });

  it('analyses every unread inbox thread but sends only high-confidence safe replies', () => {
    expect(route).toContain(".eq('unread', true)");
    expect(route).toContain('result.decision.confidence >= confidenceFloor');
    expect(route).toContain('!result.decision.requiresManualReview');
    expect(route).toContain('!result.usedFallback');
    expect(route).toContain('!identity.ambiguousCase');
    expect(route).toContain('!identity.linkedCaseSenderMismatch');
    expect(route).toContain('!replyToMismatch');
    expect(route).toContain('!hasAttachments');
  });

  it('can answer safe new prospects using public-only tools', () => {
    expect(route).toContain('PUBLIC_PROSPECT_TOOLS');
    expect(route).toContain('isSafeUnknownProspect');
    expect(route).toContain('explicitCommercialRequest');
    expect(route).toContain('expertServiceIntent');
    expect(route).toContain('wasKnownContact ? READ_ONLY_TOOLS : PUBLIC_PROSPECT_TOOLS');
    expect(route).toContain('(wasKnownContact || (safeUnknownProspect && newLeadAutoSend))');
    expect(route).toContain('KIA_EMAIL_PROSPECT_MIN_CONFIDENCE');
    expect(route).toContain('KIA_EMAIL_NEW_LEAD_AUTO_SEND_ENABLED');
    expect(route).toContain('new_lead_approval_required');
  });

  it('writes heartbeat state even when the email agent is disabled', () => {
    expect(route).toContain("key: 'kia_email_agent_health'");
    expect(route).toContain("status: 'disabled'");
    expect(route).toContain("status: errors.length === 0 ? 'ok' : 'degraded'");
  });

  it('pushes a summary for each human inbound and separate task notifications', () => {
    expect(route).toContain('Correo humano ·');
    expect(route).toContain('latestReply.slice(0, 150)');
    expect(route).toContain('KIA creó una tarea');
    expect(route).not.toContain('KIA respondió por email');
    expect(route).not.toContain('KIA atendió un nuevo contacto');
    expect(route).toContain('/admin/correo/hilo?provider=gmail&conversationId=');
  });

  it('persists every human inbound and KIA outbound with CRM links', () => {
    expect(route).toContain("event_type: 'email.inbound'");
    expect(route).toContain("direction: 'in'");
    expect(route).toContain("direction: 'out'");
    expect(route).toContain('client_id: identity.clientId');
    expect(route).toContain('lead_id: identity.leadId');
    expect(route).toContain('case_id: identity.caseId');
    expect(route).toContain('company_id: identity.companyId');
    expect(route).toContain('ensureEmailLead');
    expect(route).toContain("source: 'email'");
  });

  it('does not upgrade a newly-created lead to trusted private context', () => {
    expect(route).toContain('const wasKnownContact = Boolean(identity.clientId || identity.leadId)');
    expect(route).toContain('wasKnownContact ? READ_ONLY_TOOLS : PUBLIC_PROSPECT_TOOLS');
    expect(route).toContain('confidenceFloor = wasKnownContact ? minConfidence : prospectMinConfidence');
  });

  it('keeps email tools scoped and allows only the guarded booking external action', () => {
    expect(route).toContain("allowedEffects: ['read', 'external_action']");
    expect(route).toContain("maxRiskTier: 'R2'");
    expect(route).toContain('get_case_status');
    expect(route).toContain('search_knowledge_resources');
    expect(route).toContain('get_booking_availability');
    expect(route).toContain('create_booking_meeting');
    expect(route).toContain("if (input.nextAction !== 'create_task') return null");
    expect(route).toContain("task_kind: 'email_request'");
  });

  it('keeps operational inspection unread until a human or policy changes it', () => {
    expect(helper).toContain('getGmailThreadSA(threadId, false)');
    expect(helper).toContain('getGmailThread(tokens, threadId, false)');
    expect(gmail).toContain('markRead = true');
  });

  it('reserves a unique send claim before any Gmail write', () => {
    expect(route).toContain("kia_email_send:");
    expect(route).toContain("state: 'reserved'");
    expect(route).toContain("claimError.code === '23505'");
    expect(route).toContain("state: 'uncertain_failure'");
  });

  it('paginates unread cache and checks live unread state', () => {
    expect(route).toContain("select('enabled,updated_at').eq('key', 'kia.email_agent')");
    expect(route).toContain('const enabledSince = enabled ? agentSetting.data?.updated_at ?? null : null');
    expect(route).toContain("new Date(latest.date).getTime() < new Date(enabledSince).getTime()");
    expect(route).toContain('pageSize = 200');
    expect(route).toContain('.range(offset, offset + pageSize - 1)');
    expect(route).toContain('!latest.unread');
    expect(route).toContain('maxLiveInspections = 30');
  });

  it('honors Reply-To conservatively and ignores inline signature images', () => {
    expect(gmail).toContain("hdr(headers, 'Reply-To')");
    expect(route).toContain('latest.replyTo || latest.fromEmail');
    expect(route).toContain('latest.attachments.some((attachment) => !attachment.inline)');
  });

  it('threads replies and schedules after inbox sync', () => {
    expect(helper).toContain('sendGmailReplySA');
    expect(helper).toContain('Autonomous writes are deliberately single-transport');
    expect(route).toContain('sendOperationalGmailReply');
    expect(vercel).toContain('/api/cron/kia-email-agent');
    expect(vercel).toContain('2-59/10 * * * *');
  });
  it('keeps coarse unread push while KIA email is disabled, stale or degraded', () => {
    const sync = source('app/api/cron/email-sync/route.ts');
    expect(sync).toContain("eq('key', 'kia_email_agent_health')");
    expect(sync).toContain("heartbeatValue?.status === 'ok'");
    expect(sync).toContain('heartbeatAgeMs <= 20 * 60_000');
    expect(sync).toContain('KIA de correo no está confirmada como saludable');
    expect(sync).toContain('email-unread-fallback');
  });

  it('strips quoted reply history before consequential booking checks', () => {
    expect(route).toContain('latestReplyText');
    expect(route).toContain('gmail_quote');
    expect(route).toContain('<blockquote');
    expect(route).toContain('latestMessage: latestReply');
  });

  it('pre-gates booking writes before tool execution and enforces decision confidence', () => {
    expect(route).toContain('externalActionPreEligible');
    expect(route).toContain("toolName !== 'create_booking_meeting' || externalActionPreEligible");
    expect(route).toContain('externalActionMinConfidence: confidenceFloor');
  });

});
