import { describe, expect, it, vi } from 'vitest';
import { resolveKiaQuickActionCase } from '@/lib/ai/kia/kia-quick-action-case';
import { recordKiaVisibleReply } from '@/lib/ai/kia/kia-visible-decision-log';
import { missingKiaCaseDocumentRequirements } from '@/lib/ai/kia/kia-case-document-gaps';
import type { KiaContext } from '@/lib/ai/kia/kia-context-builder';
import type { KiaDecision } from '@/lib/ai/kia/kia-output-schema';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';

const first = { id: 'other', serviceName: 'Otro', serviceSlug: null, status: 'abierto', nextAction: null };
const context = { contact: { clientId: 'owner' }, cases: [first] } as KiaContext;

describe('KIA quick-action guardrails', () => {
  it('identifies checklist gaps using only current linked evidence', () => {
    const checklist = ['Página 5 firmada', 'DNI'];
    const documents = [
      { id: 'obsolete', state: 'pendiente', checklist_item_key: '1-pagina-5-firmada',
        checklist_item_label: 'Página 5 firmada', replaced_by: 'current' },
      { id: 'current', state: 'pendiente', checklist_item_key: null, checklist_item_label: null },
      { id: 'rejected', state: 'rechazado', checklist_item_key: '2-dni', checklist_item_label: 'DNI' },
    ];
    expect(missingKiaCaseDocumentRequirements(checklist, documents, null)).toEqual(checklist);
    expect(missingKiaCaseDocumentRequirements(checklist, documents, {
      version: 1, links: [{ requirement: 'Página 5 firmada', documentId: 'current' }],
    })).toEqual(['DNI']);
  });

  it('does not use a different case when the contextual lookup fails', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const query = { select: vi.fn(), eq: vi.fn(), maybeSingle };
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    const admin = { from: vi.fn().mockReturnValue(query) } as unknown as ReturnType<typeof getSupabaseAdmin>;
    expect(await resolveKiaQuickActionCase({ admin, context, caseId: 'missing' })).toBeNull();
    expect(query.eq).toHaveBeenCalledWith('client_id', 'owner');
  });

  it('loads an owned older contextual case beyond the context window', async () => {
    const row = { id: 'older', service: 'Trámite', service_id: null, state: 'en_proceso', status: null, next_action: 'Esperar' };
    const query = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn().mockResolvedValue({ data: row, error: null }) };
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    const admin = { from: vi.fn().mockReturnValue(query) } as unknown as ReturnType<typeof getSupabaseAdmin>;
    expect((await resolveKiaQuickActionCase({ admin, context, caseId: 'older' }))?.id).toBe('older');
  });

  it('records the displayed reply for feedback, and suppresses the log ID on failure', async () => {
    const query = { update: vi.fn(), eq: vi.fn(), select: vi.fn(), maybeSingle: vi.fn() };
    query.update.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.select.mockReturnValue(query);
    query.maybeSingle.mockResolvedValueOnce({ data: { id: 'log' }, error: null })
      .mockResolvedValueOnce({ data: null, error: new Error('db') });
    const admin = { from: vi.fn().mockReturnValue(query) } as unknown as ReturnType<typeof getSupabaseAdmin>;
    const input = { admin, decisionLogId: 'log', clientId: 'owner',
      decision: { userMessage: 'Modelo' } as KiaDecision, reply: 'Respuesta visible' };
    expect(await recordKiaVisibleReply(input)).toBe('log');
    expect(query.update).toHaveBeenCalledWith({ output_json: { userMessage: 'Respuesta visible' } });
    expect(await recordKiaVisibleReply(input)).toBeNull();
  });
});
