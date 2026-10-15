import { describe, expect, it, vi } from 'vitest';
import { ensureInboundLead } from '../../lib/leads/ensure-inbound-lead';

type Interaction = { source_key: string; [key: string]: unknown };
type LeadState = {
  id: string;
  name: string;
  email: string;
  category: string;
  service: string;
  message: string;
  updated_at: string;
  metadata: { inquiries: Interaction[]; last_acquisition?: unknown };
};

function existingLeadFixture() {
  const state: LeadState = {
    id: 'lead-existing',
    name: 'Contacto cualificado',
    email: 'existing@example.test',
    category: 'Asesoramiento fiscal',
    service: 'servicio-contable',
    message: 'Solicitud original importante',
    updated_at: '2026-10-15T10:00:00.000Z',
    metadata: {
      inquiries: [{ source_key: 'form:contact:old' }],
      last_acquisition: { channel: 'contacto' },
    },
  };
  const updates: Array<Record<string, unknown>> = [];
  const from = vi.fn(() => ({
    select: (columns: string) => {
      if (columns === 'id,email') {
        return { eq: () => ({ eq: () => ({ limit: async () => ({ data: [], error: null }) }) }) };
      }
      if (columns === 'id') {
        return { ilike: () => ({ limit: async () => ({ data: [{ id: state.id }], error: null }) }) };
      }
      if (columns === 'metadata,message,updated_at') {
        return { eq: () => ({ single: async () => ({
          data: { metadata: structuredClone(state.metadata), message: state.message, updated_at: state.updated_at },
          error: null,
        }) }) };
      }
      throw new Error('Unexpected projection: ' + columns);
    },
    update: (payload: Record<string, unknown>) => {
      updates.push(payload);
      let expectedTimestamp: string | null = null;
      return {
        eq: (_column: string, value: string) => {
          if (_column === 'updated_at') expectedTimestamp = value;
          return {
            eq: (column: string, timestamp: string) => ({
              select: () => ({
                maybeSingle: async () => {
                  if (column !== 'updated_at' || timestamp !== state.updated_at) return { data: null, error: null };
                  Object.assign(state, payload);
                  return { data: { id: state.id }, error: null };
                },
              }),
            }),
            select: () => ({
              maybeSingle: async () => {
                if (expectedTimestamp && expectedTimestamp !== state.updated_at) return { data: null, error: null };
                Object.assign(state, payload);
                return { data: { id: state.id }, error: null };
              },
            }),
          };
        },
      };
    },
  }));
  return { state, updates, admin: { from } as unknown as Parameters<typeof ensureInboundLead>[0]['admin'] };
}

const request = (admin: Parameters<typeof ensureInboundLead>[0]['admin']) => ({
  admin,
  name: 'Persona informada',
  email: 'existing@example.test',
  source: 'website',
  sourceKey: 'rgpd-report:11111111-1111-4111-8111-111111111111',
  category: 'Recurso gratuito',
  service: 'rgpd-informe-gratuito',
  message: 'Descarga de una guía',
  channel: 'rgpd_report',
  origin: 'herramienta-rgpd',
  preserveExistingClassification: true,
  metadata: { language: 'es', delivery_method: 'download', marketing_consent: false },
});

describe('RGPD lead integration with isolated in-memory records', () => {
  it('preserves an existing qualified lead and records only the informational event', async () => {
    const { admin, state, updates } = existingLeadFixture();
    const result = await ensureInboundLead(request(admin));
    expect(result).toEqual({ leadId: 'lead-existing', created: false });
    expect(state.name).toBe('Contacto cualificado');
    expect(state.category).toBe('Asesoramiento fiscal');
    expect(state.service).toBe('servicio-contable');
    expect(state.message).toBe('Solicitud original importante');
    expect(state.metadata.last_acquisition).toEqual({ channel: 'contacto' });
    expect(state.metadata.inquiries).toHaveLength(2);
    expect(state.metadata.inquiries[1].source_key).toContain('rgpd-report:');
    expect(updates).toHaveLength(1);
    expect(updates[0]).not.toHaveProperty('category');
    expect(updates[0]).not.toHaveProperty('service');
  });

  it('does not append a duplicate event for a retry of the same request ID', async () => {
    const { admin, state, updates } = existingLeadFixture();
    const first = await ensureInboundLead(request(admin));
    const second = await ensureInboundLead(request(admin));
    expect(first.leadId).toBe(second.leadId);
    expect(updates).toHaveLength(1);
    expect(state.metadata.inquiries).toHaveLength(2);
  });
});
