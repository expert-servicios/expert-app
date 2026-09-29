import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('Admin appointments funnel context', () => {
  const route = source('app/api/admin/citas/route.ts');
  const page = source('app/(protected)/admin/citas/page.tsx');
  const casesRoute = source('app/api/admin/cases/route.ts');

  it('uses the canonical booking task before legacy contact matching', () => {
    expect(route).toContain(".from('internal_tasks')");
    expect(route).toContain("'booking_appointment_id,lead_id,client_id,company_id,metadata'");
    expect(route).toContain('tasksByAppointment.get(appointment.id)');
    expect(route).toContain('task?.lead_id');
    expect(route).toContain('const rawClientId = sourceIdentityConflict ? null : (appointment.client_id ?? task?.client_id ?? null)');
    expect(route).toContain('const verifiedClientId = rawClientId && activeClientIds.has(rawClientId) ? rawClientId : null');
    expect(route).toContain('if (!lead && !sourceIdentityConflict && !invalidClientIdentity && !ambiguousClientMatch)');
    expect(route).toContain('client_id: identityConflict ? null : resolvedClientId');
    expect(route).toContain('company_id: identityConflict ? null : rawCompanyId');
  });

  it('batches legacy lead candidates and fails closed when identifiers are ambiguous', () => {
    expect(route).toContain('loadLegacyLeadIndex(admin, legacyCandidates)');
    expect(route).toContain(".or(filter)");
    expect(route).toContain(".in('phone', batch)");
    expect(route).toContain('chunkValues(appointmentIds, 100)');
    expect(route).toContain('chunkValues(taskLeadIds, 100)');
    expect(route).toContain('chunkValues(candidateClientIds, 100)');
    expect(route).toContain("email.replace(/[%_(),\\\\]/g");
    expect(route).toContain('return { lead: null, ambiguous: true }');
    expect(route).toContain('emailMatch.id !== phoneMatch.id');
    expect(route).toContain('ambiguous_lead_match: ambiguousLeadMatch');
  });

  it('validates client-company membership before exposing canonical appointment identity', () => {
    expect(route).toContain('loadClientCompanyMemberships(admin, candidateClientIds)');
    expect(route).toContain(".from('profile_companies')");
    expect(route).toContain(".select('profile_id,company_id')");
    expect(route).toContain('clientCompanyMemberships.has(`${resolvedClientId}:${rawCompanyId}`)');
    expect(route).toContain('clientCompanyConflict');
    expect(route).toContain('client_id: identityConflict ? null : resolvedClientId');
    expect(route).toContain('company_id: identityConflict ? null : rawCompanyId');
  });

  it('fails closed when legacy lead identity diverges from the active client email', () => {
    expect(route).toContain('resolveActiveClientIdsByEmails');
    expect(route).toContain("activeClientIndex.get(normalizeEmail(appointment.email))");
    expect(route).toContain('ambiguousClientMatch');
    expect(route).toContain('leadClientConflict');
    expect(route).toContain('leadEmail !== appointmentEmail');
    expect(route).toContain('identityConflict = sourceIdentityConflict');
    expect(route).toContain('ambiguous_client_match: ambiguousClientMatch');
  });

  it('surfaces origin and latest interaction without persisting inferred links', () => {
    expect(route).toContain('latestLeadInteraction(lead.metadata)');
    expect(route).toContain('taskContentOrigin(task?.metadata)');
    expect(route).toContain('acquisition?.originPath');
    expect(route).toContain('sourceFallback');
    expect(route).toContain("relationship_source: relationshipSource");
    expect(route).not.toContain("appointments').update({ lead_id");
  });

  it('links Admin directly to the resolved client or lead', () => {
    expect(page).toContain('href={`/admin/clientes/${appt.client_id}`}');
    expect(page).toContain('href={`/admin/leads?focus=${appt.lead_id}`}');
    expect(page).toContain('Origen: {appt.crm_context.origin_label}');
    expect(page).toContain('Última interacción');
    expect(page).toContain('Identidad CRM por revisar');
    expect(page).toContain("meetingUrl.includes('meet.google.com')");
    expect(page).toContain("meetingUrl.includes('teams.microsoft.com')");
    expect(page).toContain("meetingUrl.includes('zoom.us')");
    expect(page).toContain("if (!meetingUrl) return provider === 'google_native'");
  });

  it('uses canonical client_id before the legacy email search when creating a case', () => {
    expect(page).toContain('let clientId = expedienteTarget.client_id');
    expect(page).toContain('identity_conflict');
    expect(page).toContain('invalid_client_identity');
    expect(page).toContain('ambiguous_lead_match');
    expect(page).toContain("setCaseError('La identidad de esta cita requiere revisión antes de crear un expediente.')");
    expect(page.indexOf('identity_conflict')).toBeLessThan(page.indexOf('let clientId = expedienteTarget.client_id'));
    expect(page).toContain('if (!clientId) {');
    expect(page).toContain('/api/admin/clients-quick?q=');
    expect(page).toContain('client_id: clientId');
    expect(page).toContain('company_id: expedienteTarget.company_id');
    expect(casesRoute).toContain('company_id: z.string().uuid().nullable().optional()');
    expect(casesRoute).toContain(".from('profile_companies')");
    expect(casesRoute).toContain(".eq('profile_id', client_id)");
    expect(casesRoute).toContain(".eq('company_id', company_id)");
    expect(casesRoute).toContain('company_id: company_id ?? null');
  });
});
