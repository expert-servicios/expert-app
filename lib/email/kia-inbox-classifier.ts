import type { GmailMessage } from '@/lib/integrations/gmail';

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

const OFFICIAL_DOMAIN = /(?:^|\.)(?:mjusticia\.es|agenciatributaria\.gob\.es|aeat\.es|seg-social\.es|dgt\.es|boe\.es|administracion\.gob\.es|notificaciones\.060\.es|registradores\.org)$/i;
const PROVIDER_DOMAIN = /(?:^|\.)(?:stripe\.com|revolut\.com|google\.com|github\.com|vercel\.com|docusign\.com|holded\.com|resend\.com|supabase\.com|openai\.com|anthropic\.com|microsoft\.com)$/i;

const URGENT_SIGNAL = /\b(?:acción requerida|accion requerida|action required|requerimiento|subsanaci[oó]n|caducidad|caduca|plazo|deadline|vence|vencimiento|suspensi[oó]n|bloquead[oa]|payment failed|pago fallido|chargeback|dispute|contracargo|incumplimiento|security alert|alerta de seguridad|suspicious|inicio de sesi[oó]n sospechoso)\b/i;
const CRITICAL_OFFICIAL_SIGNAL = /\b(?:requerimiento|subsanaci[oó]n|caducidad|caduca|plazo|notificaci[oó]n electr[oó]nica|comparecencia|sanci[oó]n|embargo)\b/i;
const TECHNICAL_SIGNAL = /\b(?:build|deploy|deployment|commit|pull request|github|vercel|ci|workflow|cron|webhook|api|release)\b/i;

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
  const signal = `${message.subject} ${message.body.slice(0, 1600)}`;
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

  const marketing =
    Boolean(message.listUnsubscribe)
    || /^(bulk|list|junk)$/i.test(message.precedence?.trim() ?? '')
    || labels.has('CATEGORY_PROMOTIONS')
    || labels.has('CATEGORY_SOCIAL')
    || labels.has('CATEGORY_FORUMS');

  if (marketing) {
    return {
      kind: 'marketing',
      priority: 'low',
      gmailLabel: '92 Marketing y Newsletters',
      requiresAttention: false,
      recipientPurpose,
      reasons: ['bulk_or_marketing'],
    };
  }

  const noReply = /^(?:no-?reply|do-?not-?reply|notifications?|mailer-daemon|postmaster|bounce|alerts?)\b/i.test(local)
    || Boolean(message.autoSubmitted && message.autoSubmitted.toLowerCase() !== 'no');

  if (OFFICIAL_DOMAIN.test(domain)) {
    const critical = CRITICAL_OFFICIAL_SIGNAL.test(signal);
    reasons.push('official_sender');
    if (critical) reasons.push('deadline_or_formal_notice');
    return {
      kind: 'official',
      priority: critical ? 'critical' : URGENT_SIGNAL.test(signal) ? 'high' : 'normal',
      gmailLabel: critical ? '00 KIA/URGENTE' : '04 KIA/Administración',
      requiresAttention: critical || URGENT_SIGNAL.test(signal),
      recipientPurpose,
      reasons,
    };
  }

  if (PROVIDER_DOMAIN.test(domain) || noReply) {
    const urgent = URGENT_SIGNAL.test(signal);
    reasons.push(PROVIDER_DOMAIN.test(domain) ? 'known_provider' : 'automated_sender');
    if (urgent) reasons.push('action_signal');
    return {
      kind: PROVIDER_DOMAIN.test(domain) ? 'provider' : 'system',
      priority: urgent ? 'high' : 'normal',
      gmailLabel: urgent ? '00 KIA/URGENTE' : TECHNICAL_SIGNAL.test(signal) ? '90 Tecnología/GitHub' : '03 Finanzas/Proveedores',
      requiresAttention: urgent,
      recipientPurpose,
      reasons,
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
