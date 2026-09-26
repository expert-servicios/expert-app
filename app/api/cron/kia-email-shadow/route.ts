import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { verifyCronRequest } from '@/lib/security/cron';
import { getOperationalGmailThread } from '@/lib/integrations/operational-gmail';
import { runKiaDecision } from '@/lib/ai/kia/kia-decision-engine';

export const maxDuration = 60;

const EXPERT_MAILBOX = 'info@expertconsulting.es';
const READ_ONLY_TOOLS = [
  'get_case_status',
  'get_case_tasks',
  'get_case_documents',
  'get_case_timeline',
  'get_service_operational_blueprint',
  'search_knowledge_resources',
  'get_official_sources',
] as const;

function shadowKey(threadId: string) {
  return `kia_email_shadow:${createHash('sha256').update(threadId).digest('hex').slice(0, 32)}`;
}

function messageText(body: string, bodyType: 'html' | 'text') {
  if (bodyType === 'text') return body.trim().slice(0, 12000);
  return body
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 12000);
}

function isInbound(fromEmail: string) {
  return fromEmail.trim().toLowerCase() !== EXPERT_MAILBOX;
}

export async function GET(request: NextRequest) {
  const cronAuth = verifyCronRequest(request.headers, 'cron/kia-email-shadow');
  if (!cronAuth.ok) {
    return NextResponse.json({ error: cronAuth.error }, { status: cronAuth.status });
  }

  if (process.env.KIA_EMAIL_SHADOW_ENABLED?.toLowerCase() !== 'true') {
    return NextResponse.json({ skipped: true, reason: 'KIA_EMAIL_SHADOW_ENABLED is not true' });
  }

  const admin = getSupabaseAdmin();
  const { data: inbox, error: inboxError } = await admin
    .from('email_inbox_cache')
    .select('thread_id,case_id,subject,from_email,date,unread')
    .eq('provider', 'gmail')
    .eq('unread', true)
    .not('case_id', 'is', null)
    .order('date', { ascending: false })
    .limit(10);

  if (inboxError) {
    return NextResponse.json({ error: 'shadow_inbox_unavailable' }, { status: 503 });
  }

  let evaluated = 0;
  let skipped = 0;
  const errors: Array<{ thread: string; code: string }> = [];

  for (const row of inbox ?? []) {
    if (!row.case_id || !row.thread_id || !row.date) {
      skipped++;
      continue;
    }

    const key = shadowKey(row.thread_id);
    const { data: watermark } = await admin
      .from('system_kv')
      .select('value')
      .eq('key', key)
      .maybeSingle();

    const previous = watermark?.value as Record<string, unknown> | null;
    if (previous?.last_message_at === row.date) {
      skipped++;
      continue;
    }

    try {
      const { data: caseRow, error: caseError } = await admin
        .from('cases')
        .select('id,client_id,company_id,service,service_id,status,state,next_action')
        .eq('id', row.case_id)
        .maybeSingle();
      if (caseError || !caseRow?.client_id) throw new Error('case_unavailable');

      const gmail = await getOperationalGmailThread(admin, row.thread_id);
      const inbound = [...gmail.messages].reverse().find((message) => isInbound(message.fromEmail));
      if (!inbound) {
        skipped++;
        continue;
      }

      const text = messageText(inbound.body, inbound.bodyType);
      if (!text) {
        skipped++;
        continue;
      }

      const recent = gmail.messages.slice(-8).map((message) => ({
        role: isInbound(message.fromEmail) ? 'user' as const : 'assistant' as const,
        text: messageText(message.body, message.bodyType).slice(0, 4000),
        createdAt: message.date,
      }));

      const result = await runKiaDecision({
        taskType: 'chat_reply',
        channel: 'email',
        message: text,
        locale: /[А-Яа-яЁё]/.test(text) ? 'ru' : 'es',
        contextInput: {
          channel: 'email',
          clientId: caseRow.client_id,
          caseId: caseRow.id,
          companyId: caseRow.company_id ?? undefined,
          serviceSlug: caseRow.service_id ?? undefined,
          email: inbound.fromEmail,
          latestMessage: text,
          syntheticRecentMessages: recent,
          currentTask: caseRow.next_action ?? undefined,
        },
        allowTools: true,
        forceToolExecution: true,
        allowedToolNames: [...READ_ONLY_TOOLS],
        toolAuthorization: {
          maxRiskTier: 'R1',
          allowedEffects: ['read'],
          autonomousOnly: true,
        },
      });

      await admin.from('system_kv').upsert({
        key,
        value: {
          mode: 'shadow',
          thread_hash: key.split(':')[1],
          case_id: caseRow.id,
          service_id: caseRow.service_id,
          last_message_at: row.date,
          evaluated_at: new Date().toISOString(),
          auth_mode: gmail.authMode,
          next_action: result.decision.nextAction,
          requires_manual_review: result.decision.requiresManualReview,
          confidence: result.decision.confidence,
          proposed_reply: result.userMessage,
          rules_applied: result.decision.rulesApplied,
          warnings: result.decision.warnings,
          tools_used: result.toolResults.map((tool) => ({ name: tool.toolName, ok: tool.ok })),
          sent: false,
        },
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' });

      evaluated++;
    } catch (error) {
      errors.push({
        thread: createHash('sha256').update(row.thread_id).digest('hex').slice(0, 12),
        code: error instanceof Error ? error.message.slice(0, 160) : 'unknown_error',
      });
    }
  }

  return NextResponse.json({
    ok: errors.length === 0,
    mode: 'shadow',
    evaluated,
    skipped,
    errors,
    sent: 0,
  });
}
