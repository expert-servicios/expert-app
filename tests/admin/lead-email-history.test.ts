import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('Lead email history', () => {
  const route = source('app/api/admin/leads/[id]/communications/route.ts');
  const agent = source('app/api/cron/kia-email-agent/route.ts');
  const clientCommunications = source('app/api/admin/clientes/[id]/communications/route.ts');
  const clientTimeline = source('app/api/admin/clientes/[id]/timeline/route.ts');

  it('stores every human inbound and KIA outbound with CRM scope', () => {
    expect(agent).toContain("event_type: 'email.inbound'");
    expect(agent).toContain("direction: 'in'");
    expect(agent).toContain("direction: 'out'");
    expect(agent).toContain('lead_id: identity.leadId');
    expect(agent).toContain('client_id: identity.clientId');
    expect(agent).toContain('case_id: identity.caseId');
    expect(agent).toContain('company_id: identity.companyId');
  });

  it('creates unknown human senders as email leads without widening first-contact privileges', () => {
    expect(agent).toContain('ensureEmailLead');
    expect(agent).toContain("source: 'email'");
    expect(agent).toContain('const wasKnownContact = Boolean(identity.clientId || identity.leadId)');
    expect(agent).toContain('wasKnownContact ? READ_ONLY_TOOLS : PUBLIC_PROSPECT_TOOLS');
  });

  it('exposes lead communications and related tasks by lead id', () => {
    expect(route).toContain(".contains('metadata', { lead_id: id })");
    expect(route).toContain(".eq('lead_id', id)");
    expect(route).toContain('communications');
    expect(route).toContain('openTasks');
  });

  it('treats persisted inbound email_events as inbound and suppresses only stale inbox duplicates', () => {
    expect(clientCommunications).toContain("metadataDirection === 'in'");
    expect(clientCommunications).toContain('persistedInboundThreadLatest');
    expect(clientCommunications).toContain('if (persistedAt >= new Date(row.date).getTime()) continue');
    expect(clientTimeline).toContain("metadata.direction === 'in' || e.event_type === 'email.inbound'");
    expect(clientTimeline).toContain('persistedInboundThreadLatest');
    expect(clientTimeline).toContain('if (persistedAt >= new Date(e.date).getTime()) continue');
  });

  it('pushes the inbound summary and task creation, not the automatic KIA reply', () => {
    expect(agent).toContain('Correo humano ·');
    expect(agent).toContain('KIA creó una tarea');
    expect(agent).not.toContain('KIA respondió por email');
    expect(agent).not.toContain('KIA atendió un nuevo contacto');
  });
});
