import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('Admin appointments funnel context', () => {
  const route = source('app/api/admin/citas/route.ts');
  const page = source('app/(protected)/admin/citas/page.tsx');

  it('uses the canonical booking task before legacy contact matching', () => {
    expect(route).toContain(".from('internal_tasks')");
    expect(route).toContain("'booking_appointment_id,lead_id,client_id,company_id,metadata'");
    expect(route).toContain('tasksByAppointment.get(appointment.id)');
    expect(route).toContain('task?.lead_id');
    expect(route).toContain('appointment.client_id ?? task?.client_id ?? null');
    expect(route).toContain('appointment.company_id ?? task?.company_id ?? null');
  });

  it('fails closed when legacy lead identifiers are ambiguous or conflicting', () => {
    expect(route).toContain(".ilike('email', escapedEmail)");
    expect(route).toContain(".eq('phone', normalizedPhone)");
    expect(route).toContain('.limit(2)');
    expect(route).toContain('return { lead: null, ambiguous: true }');
    expect(route).toContain('emailMatch.id !== phoneMatch.id');
    expect(route).toContain('ambiguous_lead_match: ambiguousLeadMatch');
  });

  it('surfaces origin and latest interaction without persisting inferred links', () => {
    expect(route).toContain('latestLeadInteraction(lead.metadata)');
    expect(route).toContain('taskContentOrigin(task?.metadata)');
    expect(route).toContain('describeContentOrigin(rawOrigin)');
    expect(route).toContain("relationship_source: relationshipSource");
    expect(route).not.toContain("appointments').update({ lead_id");
  });

  it('links Admin directly to the resolved client or lead', () => {
    expect(page).toContain('href={`/admin/clientes/${appt.client_id}`}');
    expect(page).toContain('href={`/admin/leads?focus=${appt.lead_id}`}');
    expect(page).toContain('Origen: {appt.crm_context.origin_label}');
    expect(page).toContain('Última interacción');
    expect(page).toContain('Identidad CRM por revisar');
  });

  it('uses canonical client_id before the legacy email search when creating a case', () => {
    expect(page).toContain('let clientId = expedienteTarget.client_id');
    expect(page).toContain('if (!clientId) {');
    expect(page).toContain('/api/admin/clients-quick?q=');
    expect(page).toContain('client_id: clientId');
  });
});
