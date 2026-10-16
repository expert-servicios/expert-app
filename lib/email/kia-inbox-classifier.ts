import type { GmailMessage, GmailSummary } from '@/lib/integrations/gmail';

export type KiaInboxKind =
  | 'human'
  | 'official'
  | 'provider'
  | 'system'
  | 'marketing'
  | 'internal';

export type KiaInboxPriority = 'low' | 'normal' | 'high' | 'critical';

export interface KiaInboxClassification {
  kind: KiaInboxKind;
  priority: KiaInboxPriority;
  gmailLabel: string;
  requiresAttention: boolean;
  recipientPurpose: 'general' | 'kia' | 'documents' | 'appointments' | 'billing' | 'noreply' | 'other';
  reasons: string[];
}

const OFFICIAL_DOMAIN = /(?:^|\.)(?:mjusticia\.es|agenciatributaria\.gob\.es|aeat\.es|seg-social\.es|dgt\.es|boe\.es|administracion\.gob\.es|notificaciones\.060\.es|registradores\.org|gva\.es|hacienda\.gob\.es)$/i;
const PROVIDER_DOMAIN = /(?:^|\.)(?:stripe\.com|revolut\.com|google\.com|github\.com|vercel\.com|docusign\.com|holded\.com|resend\.com|supabase\.com|openai\.com|anthropic\.com|microsoft\.com|einforma\.com)$/i;

const URGENT_SIGNAL = /\b(?:acción requerida|accion requerida|action required|requerimiento|subsanaci[oó]n|caducidad|caduca|plazo|deadline|vence|vencimiento|suspensi[oó]n|bloquead[oa]|payment failed|pago fallido|chargeback|dispute|contracargo|incumplimiento|security alert|alerta de seguridad|suspicious|inicio de sesi[oó]n sospechoso)\b/i;
const CRITICAL_OFFICIAL_SIGNAL = /\b(?:requerimiento|subsanaci[oó]n|caducidad|caduca|plazo|notificaci[oó]n electr[oó]nica|comparecencia|sanci[oó]n|embargo)\b/i;
// A notice forwarded by a client is still a formal notice, even when the sender is not an authority.
// Spanish and Russian subjects are common in EXPERT's correspondence.
const FORMAL_NOTICE_SIGNAL = /(?:\b(?:requerimiento|subsanaci[oó]n|liquidaci[oó]n provisional|propuesta de liquidaci[oó]n|procedimiento de comprobaci[oó]n|notificaci[oó]n electr[oó]nica|acta de inspecci[oó]n|plazo de alegaciones)\b|запрос\s+(?:из\s+)?налогов|налогов[а-яё]*\s+запрос|требовани[ея]\s+налогов|уведомлени[ея]\s+налогов)/i;
const STRONG_RISK_SIGNAL = /\b(?:security alert|account compromised|suspicious sign.in|vulnerability alert|payment failed|chargeback|dispute|contracargo|suspensi[oó]n|pago fallido|alerta de seguridad)\b/i;
const TECHNICAL_SIGNAL = /\b(?:build|deploy|deployment|commit|pull request|github|vercel|ci|workflow|cron|webhook|api|release)\b/i;

function normalizedSignalBody(body: string): string {
  return body
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 8000);
}

function emailDomain(email: string) {
  const normalized = email.trim().toLowerCase();
  const at = normalized.lastIndexOf('@');
  return at >= 0 ? normalized.slice(at + 1) : '';
}

export function inboxRecipientPurpose(to: string): KiaInboxClassification['recipientPurpose'] {
  const normalized = to.toLowerCase();
  if (normalized.includes('noreply@expertconsulting.es')) return 'noreply';
  if (normalized.includes('documentos@expertconsulting.es')) return 'documents';
  if (normalized.includes('citas@expertconsulting.es')) return 'appointments';
  if (normalized.includes('facturacion@expertconsulting.es')) return 'billing';
  if (normalized.includes('kia@expertconsulting.es')) return 'kia';
  if (normalized.includes('info@expertconsulting.es')) return 'general';
  return 'other';
}

export function classifyInboundEnvelope(message: GmailMessage): KiaInboxClassification {
  const sender = message.fromEmail.trim().toLowerCase();
  const domain = emailDomain(sender);
  const local = sender.split('@')[0] ?? '';
  const labels = new Set(message.labelIds ?? []);
  const signal = `${message.subject} ${normalizedSignalBody(message.body)}`;
  const hasActionableAttachment = (message.attachments ?? []).some((attachment) => !attachment.inline);
  const reasons: string[] = [];
  const recipientPurpose = inboxRecipientPurpose(message.to);

  if (sender.endsWith('@expertconsulting.es')) {
    return {
      kind: 'internal',
      priority: 'low',
      gmailLabel: '91 EXPERT/Sistema',
      requiresAttention: false,
      recipientPurpose,
      reasons: ['sender_internal'],
    };
  }

  const knownOfficial = OFFICIAL_DOMAIN.test(domain);
  const knownProvider = PROVIDER_DOMAIN.test(domain);
  const urgentSignal = URGENT_SIGNAL.test(signal);
  const formalNotice = FORMAL_NOTICE_SIGNAL.test(signal);
  const criticalOfficial = knownOfficial && (CRITICAL_OFFICIAL_SIGNAL.test(signal) || formalNotice);
  const marketing =
    labels.has('SPAM')
    || Boolean(message.listUnsubscribe)
    || /^(bulk|list|junk)$/i.test(message.precedence?.trim() ?? '')
    || labels.has('CATEGORY_PROMOTIONS')
    || labels.has('CATEGORY_SOCIAL')
    || labels.has('CATEGORY_FORUMS');

  // Lists and automated PR/CI traffic must not trigger urgent alerts just
  // because they quote an official deadline or say 'action required'.
  if (marketing && !(knownOfficial && formalNotice) && !STRONG_RISK_SIGNAL.test(signal)) {
    return {
      kind: 'marketing',
      priority: 'low',
      gmailLabel: '92 Marketing y Newsletters',
      requiresAttention: false,
      recipientPurpose,
      reasons: ['bulk_or_marketing'],
    };
  }
  const routineGithub = domain === 'github.com' && !STRONG_RISK_SIGNAL.test(signal);

  if (knownOfficial && (criticalOfficial || urgentSignal || hasActionableAttachment)) {
    reasons.push('official_sender');
    if (criticalOfficial) reasons.push('deadline_or_formal_notice');
    else if (urgentSignal) reasons.push('action_signal');
    if (hasActionableAttachment) reasons.push('official_attachment_requires_review');
    return {
      kind: 'official',
      priority: criticalOfficial ? 'critical' : 'high',
      gmailLabel: criticalOfficial ? '00 KIA/URGENTE' : '04 KIA/Administración',
      requiresAttention: true,
      recipientPurpose,
      reasons,
    };
  }

  if (knownProvider && urgentSignal && !routineGithub) {
    reasons.push('known_provider', 'action_signal');
    return {
      kind: 'provider',
      priority: 'high',
      gmailLabel: '00 KIA/URGENTE',
      requiresAttention: true,
      recipientPurpose,
      reasons,
    };
  }

  const noReply = /^(?:no-?reply|do-?not-?reply|notifications?|mailer-daemon|postmaster|bounce|alerts?)\b/i.test(local)
    || Boolean(message.autoSubmitted && message.autoSubmitted.toLowerCase() !== 'no');

  if (knownOfficial) {
    const critical = CRITICAL_OFFICIAL_SIGNAL.test(signal);
    reasons.push('official_sender');
    if (critical) reasons.push('deadline_or_formal_notice');
    return {
      kind: 'official',
      priority: critical ? 'critical' : URGENT_SIGNAL.test(signal) ? 'high' : 'normal',
      gmailLabel: critical ? '00 KIA/URGENTE' : '04 KIA/Administración',
      requiresAttention: critical || URGENT_SIGNAL.test(signal) || hasActionableAttachment,
      recipientPurpose,
      reasons,
    };
  }

  if (knownProvider || noReply) {
    const urgent = URGENT_SIGNAL.test(signal) && !routineGithub;
    reasons.push(knownProvider ? 'known_provider' : 'automated_sender');
    if (urgent) reasons.push('action_signal');
    return {
      kind: knownProvider ? 'provider' : 'system',
      priority: urgent ? 'high' : 'normal',
      gmailLabel: urgent ? '00 KIA/URGENTE' : TECHNICAL_SIGNAL.test(signal) ? '90 Tecnología/GitHub' : '03 Finanzas/Proveedores',
      requiresAttention: urgent,
      recipientPurpose,
      reasons,
    };
  }

  // Tax and administrative notices often arrive forwarded by the human client.
  // Never silently treat them as routine or grant autonomous send permission.
  if (formalNotice) {
    return {
      kind: 'human',
      priority: 'critical',
      gmailLabel: '00 KIA/URGENTE',
      requiresAttention: true,
      recipientPurpose,
      reasons: ['human_forwarded_formal_notice'],
    };
  }

  return {
    kind: 'human',
    priority: 'normal',
    gmailLabel: '01 KIA/Personas',
    requiresAttention: false,
    recipientPurpose,
    reasons: ['human_candidate'],
  };
}

export function humanPriority(input: {
  knownClient: boolean;
  knownLead: boolean;
  safeProspect: boolean;
  requiresManualReview: boolean;
  nextAction: string;
  blockReason: string | null;
  createdTask: boolean;
  sent: boolean;
}): KiaInboxPriority {
  if (input.requiresManualReview || input.nextAction === 'needs_review') return 'high';
  if (input.blockReason && [
    'ambiguous_case',
    'linked_case_sender_mismatch',
    'reply_to_requires_review',
    'attachment_requires_review',
    'provider_fallback',
  ].includes(input.blockReason)) return 'high';
  if (input.safeProspect || input.knownLead || input.createdTask) return 'high';
  if (input.knownClient && input.sent) return 'normal';
  return 'normal';
}

/** Coarse Gmail-sync alert when the full KIA agent is unhealthy. Never notify for bulk/no-reply/CI traffic. */
export function shouldNotifyEmailSyncFallback(mail: GmailSummary): boolean {
  if (!mail.unread) return false;
  const classification = classifyInboundEnvelope({
    id: mail.id,
    conversationId: mail.conversationId,
    subject: mail.subject,
    from: mail.from,
    fromEmail: mail.fromEmail,
    to: 'info@expertconsulting.es',
    date: mail.date,
    body: mail.snippet,
    bodyType: 'text',
    unread: mail.unread,
    attachments: mail.hasAttachment ? [{ id: 'summary', name: '', mimeType: '', size: 0, inline: false }] : [],
    labelIds: [],
  });
  return classification.kind === 'human' || classification.requiresAttention;
}
