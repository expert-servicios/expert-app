import type { KiaDecision } from './kia-output-schema';

export type KiaAssistanceMode =
  | 'informational'
  | 'guidance'
  | 'action_needed'
  | 'service_needed'
  | 'human_escalation';

export interface KiaConversationOpportunity {
  mode: KiaAssistanceMode;
  allowServiceDiscovery: boolean;
  allowMeetingSuggestion: boolean;
  reason: string;
}

const SERVICE_SUBJECT = /\b(certificado(?: digital)?|firma digital|declaraci[oó]n|renta|irpf|iva|modelo\s*\d{2,3}|aut[oó]nomo|sociedad|\bsl\b|nacionalidad|residencia|arraigo|reagrupaci[oó]n|holded|contabilidad|n[oó]mina|laboral|registro|notar[ií]a|tr[aá]fico|veh[ií]culo|catastro|licencia|urbanismo|impuesto|herencia|donaci[oó]n)\b/i;

const DIRECT_PROVIDER_REQUEST = /\b(pod[eé]is|pueden|quiero que|necesito que|prefiero que|os encargo|contratar|contratarlo|tramitarlo vosotros|hacerlo vosotros|que lo hag[aá]is|que lo gestion[eé]is|me lo gestion[aá]is)\b/i;

const UNMET_NEED = /\b(no tengo|no dispongo|me falta|necesito obtener|necesito sacar|necesito tramitar|tengo que conseguir|quiero obtener|quiero sacar)\b/i;

const SELF_SERVICE = /\b(por mi cuenta|yo mism[oa]|hacerlo yo|tramitarlo yo|paso a paso|expl[ií]came c[oó]mo|c[oó]mo puedo hacerlo|gu[ií]ame)\b/i;

const EXPLICIT_MEETING = /\b(cita|reuni[oó]n|llamada|videollamada|hablar con ksenia|hablar con una persona|hablar con alguien|necesito humano|atenci[oó]n humana)\b/i;

const COMPLEX_RISK = /\b(sanci[oó]n|requerimiento|inspecci[oó]n|embargo|denegaci[oó]n|denegad[oa]|recurso|alegaciones|providencia de apremio|derivaci[oó]n de responsabilidad|despido|demanda|juicio)\b/i;

const URGENT_OR_BLOCKED = /\b(urgente|vence|vencimiento|plazo|ma[nñ]ana|hoy|bloquead[oa]|no s[eé] c[oó]mo responder|necesito ayuda|me han notificado|he recibido|recib[ií])\b/i;

const ACTION_LANGUAGE = /\b(tengo que|necesito|quiero presentar|quiero enviar|quiero tramitar|debo presentar|debo enviar)\b/i;

/**
 * Product guard for contextual assistance.
 *
 * This deliberately separates "the user needs information" from "the user
 * needs EXPERT to provide a paid service". The model may still explain any
 * relevant service, but service discovery/CTA is only enabled for a concrete,
 * expressed need. Meetings are reserved for explicit requests or materially
 * blocked/high-risk cases.
 */
export function detectKiaConversationOpportunity(
  message: string,
  decision?: Pick<KiaDecision, 'intent' | 'nextAction' | 'requiresMeeting'>,
): KiaConversationOpportunity {
  const text = message.trim();
  const wantsSelfService = SELF_SERVICE.test(text);
  const explicitMeeting = EXPLICIT_MEETING.test(text);
  const materiallyBlocked = COMPLEX_RISK.test(text) && URGENT_OR_BLOCKED.test(text);

  if (explicitMeeting || materiallyBlocked) {
    return {
      mode: 'human_escalation',
      allowServiceDiscovery: false,
      allowMeetingSuggestion: true,
      reason: explicitMeeting ? 'explicit_human_request' : 'materially_blocked_high_risk_case',
    };
  }

  const concreteServiceNeed =
    !wantsSelfService &&
    (
      DIRECT_PROVIDER_REQUEST.test(text) ||
      (UNMET_NEED.test(text) && SERVICE_SUBJECT.test(text))
    );

  if (concreteServiceNeed) {
    return {
      mode: 'service_needed',
      allowServiceDiscovery: true,
      allowMeetingSuggestion: false,
      reason: DIRECT_PROVIDER_REQUEST.test(text)
        ? 'explicit_provider_request'
        : 'concrete_unmet_service_need',
    };
  }

  if (wantsSelfService) {
    return {
      mode: 'guidance',
      allowServiceDiscovery: false,
      allowMeetingSuggestion: false,
      reason: 'self_service_requested',
    };
  }

  if (ACTION_LANGUAGE.test(text)) {
    return {
      mode: 'action_needed',
      allowServiceDiscovery: false,
      allowMeetingSuggestion: false,
      reason: 'action_requested_without_provider_request',
    };
  }

  if (decision?.nextAction === 'book_call' || decision?.requiresMeeting) {
    return {
      mode: 'guidance',
      allowServiceDiscovery: false,
      allowMeetingSuggestion: false,
      reason: 'model_escalation_not_supported_by_user_need',
    };
  }

  return {
    mode: 'informational',
    allowServiceDiscovery: false,
    allowMeetingSuggestion: false,
    reason: 'informational_or_general_guidance',
  };
}
