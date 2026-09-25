import { describe, expect, it } from 'vitest';
import { detectKiaConversationOpportunity } from '@/lib/ai/kia/kia-contextual-opportunity';
import { buildAutomaticKiaVisualResult } from '@/lib/ai/kia/kia-visual-discovery';
import { buildKiaCopilotArtifacts } from '@/lib/ai/kia/kia-copilot-artifacts';
import type { KiaDecision } from '@/lib/ai/kia/kia-output-schema';

function decision(overrides: Partial<KiaDecision> = {}): KiaDecision {
  return {
    version: '1.0',
    taskType: 'chat_reply',
    contactStatus: 'client',
    intent: 'unknown',
    userMessage: 'Respuesta',
    nextAction: 'reply_only',
    quickReplies: [],
    toolRequests: [],
    dataToSave: {},
    confidence: 0.9,
    requiresMeeting: false,
    requiresManualReview: false,
    decisionSummary: 'test',
    rulesApplied: ['test'],
    missingData: [],
    warnings: [],
    ...overrides,
  };
}

describe('KIA assistance-first contextual policy', () => {
  it('allows one contextual service when the user states a concrete unmet need', () => {
    const result = detectKiaConversationOpportunity('No tengo certificado digital y lo necesito para este trámite.');
    expect(result.mode).toBe('service_needed');
    expect(result.allowServiceDiscovery).toBe(true);
    expect(result.allowMeetingSuggestion).toBe(false);
  });

  it('keeps self-service guidance free of commercial discovery', () => {
    const result = detectKiaConversationOpportunity('No tengo certificado digital. Explícame cómo puedo hacerlo por mi cuenta.');
    expect(result.mode).toBe('guidance');
    expect(result.allowServiceDiscovery).toBe(false);
    expect(result.allowMeetingSuggestion).toBe(false);
  });

  it('does not turn an ordinary doubt into a meeting', () => {
    const result = detectKiaConversationOpportunity(
      'Tengo dudas antes de pagar, ¿qué incluye?',
      { intent: 'book_call', nextAction: 'book_call', requiresMeeting: true },
    );
    expect(result.allowMeetingSuggestion).toBe(false);
  });

  it('allows human escalation when the user explicitly asks for it', () => {
    const result = detectKiaConversationOpportunity('Quiero hablar con Ksenia en una reunión.');
    expect(result.mode).toBe('human_escalation');
    expect(result.allowMeetingSuggestion).toBe(true);
  });

  it('returns a visual resource for email-signature questions', () => {
    const result = buildAutomaticKiaVisualResult({
      message: '¿Puedes mostrarme cómo queda la firma de correo de KIA?',
      existingToolResults: [],
    });
    expect(result?.toolName).toBe('visual_resources');
    expect(result?.result?.images).toEqual(expect.arrayContaining([
      expect.objectContaining({ imageUrl: '/kia/visuals/email-signature-preview.svg' }),
    ]));
  });

  it('renders service and booking cards only from already-authorized inputs', () => {
    const serviceArtifacts = buildKiaCopilotArtifacts([
      {
        toolName: 'find_relevant_services',
        ok: true,
        result: {
          services: [{ name: 'Certificado digital', url: '/servicios/certificados/certificado-digital' }],
        },
      },
    ], decision());
    expect(serviceArtifacts).toEqual([
      expect.objectContaining({ type: 'link', title: 'Certificado digital', cta: 'Ver servicio' }),
    ]);

    const noMeeting = buildKiaCopilotArtifacts([], decision());
    expect(noMeeting.some((item) => item.type === 'link' && item.url === '/cita')).toBe(false);

    const meeting = buildKiaCopilotArtifacts([], decision({ nextAction: 'book_call', requiresMeeting: true }));
    expect(meeting).toEqual([
      expect.objectContaining({ type: 'link', url: '/cita', cta: 'Reservar reunión' }),
    ]);
  });
});
