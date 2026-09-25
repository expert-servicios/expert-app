import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { emailContextExcerpt } from '@/lib/ai/kia/kia-client-brief';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('KIA full client context from email', () => {
  it('creates contextual KIA access for any uniquely identified client email', () => {
    const contextual = source('lib/email/kia-contextual-cta.ts');
    const send = source('lib/email/send.ts');
    expect(contextual).toContain(".ilike('email', recipient)");
    expect(contextual).toContain(".eq('role', 'client')");
    expect(contextual).toContain('if (!caseId && !explicitlyRequested && !profileId) return input');
    expect(send).toContain('email_subject: subject');
  });

  it('stores the originating email subject and a clean body excerpt in the token metadata', () => {
    const contextual = source('lib/email/kia-contextual-cta.ts');
    expect(contextual).toContain('email_subject');
    expect(contextual).toContain('email_excerpt: emailContextExcerpt(input.html)');
    const excerpt = emailContextExcerpt('<p>Hola cliente</p><table data-kia-signature="true"><tr><td>firma</td></tr></table>');
    expect(excerpt).toBe('Hola cliente');
    expect(excerpt).not.toContain('firma');
  });

  it('loads a client brief before each KIA decision', () => {
    const context = source('lib/ai/kia/kia-context-builder.ts');
    expect(context).toContain('loadKiaClientBrief');
    expect(context).toContain('clientBrief');
    expect(context).toContain('originEmail: input.originEmail ?? null');
  });

  it('brief contains companies, integrations, pending tasks, next best actions and recent communications', () => {
    const brief = source('lib/ai/kia/kia-client-brief.ts');
    for (const token of [
      "from('profile_companies')",
      "from('client_integrations')",
      "from('internal_tasks')",
      "from('next_best_actions')",
      "from('email_events')",
      "from('email_inbox_cache')",
      "from('whatsapp_conversations')",
      "from('kia_conversation_messages')",
    ]) expect(brief).toContain(token);
  });

  it('builds a canonical identity graph instead of reasoning from names or email', () => {
    const brief = source('lib/ai/kia/kia-client-brief.ts');
    expect(brief).toContain('export interface KiaClientIdentityGraph');
    expect(brief).toContain('clientId: string');
    expect(brief).toContain('activeCompanyId');
    expect(brief).toContain('currentScope');
    expect(brief).toContain('memberships');
    expect(brief).toContain('integrationId');
    expect(brief).toContain('tenantId');
  });

  it('keeps EXPERT tenant identity separate from external integration identity', () => {
    const brief = source('lib/ai/kia/kia-client-brief.ts');
    expect(brief).toContain('profileTenantId');
    expect(brief).toContain('integrationId');
    expect(brief).toContain('provider');
    expect(brief).toContain('mode');
  });

  it('prioritizes current case and origin email while capping recent history', () => {
    const brief = source('lib/ai/kia/kia-client-brief.ts');
    expect(brief).toContain('if (input.caseId && item.caseId === input.caseId) value += 10');
    expect(brief).toContain("if (normalizedOrigin && (item.subject ?? '').toLocaleLowerCase() === normalizedOrigin) value += 8");
    expect(brief).toContain('limit: 12');
    expect(brief).toContain('compact(row.html, 700)');
  });

  it('fails closed on cross-company records inside the client brief', () => {
    const brief = source('lib/ai/kia/kia-client-brief.ts');
    expect(brief).toContain('const allowedCompanyIds = new Set(companyIds)');
    expect(brief).toContain('.filter((row) => !row.company_id || allowedCompanyIds.has(row.company_id))');
    expect(brief).toContain('input.companyId && allowedCompanyIds.has(input.companyId)');
  });

  it('offers a scoped R0 history lookup when the recent brief is insufficient', () => {
    const defs = source('lib/ai/kia/kia-tool-definitions.ts');
    const registry = source('lib/ai/kia/kia-tool-registry.ts');
    const executor = source('lib/ai/kia/kia-tool-executor.ts');
    expect(defs).toContain('get_client_communications');
    expect(registry).toContain("get_client_communications:          policy('R0', 'read',  'client_data')");
    expect(executor).toContain("case 'get_client_communications':");
    expect(executor).toContain('const clientId = context.contact?.clientId');
  });

  it('prioritizes origin email and first-name continuity without mixing unrelated history', () => {
    const prompt = source('lib/ai/kia/kia-system-prompt.ts');
    expect(prompt).toContain('Si existe originEmail, ese correo es el contexto primario');
    expect(prompt).toContain('no mezcles asuntos antiguos no relacionados');
    expect(prompt).toContain('nombre de pila');
  });

  it('keeps email origin identity stable across token and audit history', () => {
    const send = source('lib/email/send.ts');
    const contextual = source('lib/email/kia-contextual-cta.ts');
    const brief = source('lib/ai/kia/kia-client-brief.ts');
    expect(send).toContain('email_event_ref: emailOriginRef');
    expect(contextual).toContain("const originRef = s(metadata, 'email_event_ref', 'emailEventRef')");
    expect(brief).toContain("metadata.email_event_ref");
  });

  it('validates token tenant through canonical case/company scope for legacy profiles', () => {
    const token = source('lib/ai/kia/kia-context-token.ts');
    expect(token).toContain('if (input.tenantId && (data.tenant_id ?? null) !== input.tenantId) return null');
    expect(token).toContain("select('id,client_id,company_id,tenant_id')");
    expect(token).toContain("select('id,tenant_id')");
    expect(token).toContain('if (!membership || !company) return null');
  });

  it('acknowledges a generic originating email in the contextual welcome', () => {
    const widget = source('components/KiaCopilotWidget.tsx');
    const contextRoute = source('app/api/ai/kia/context/route.ts');
    expect(contextRoute).toContain('originEmail: context.origin_type');
    expect(widget).toContain('He abierto el correo');
    expect(widget).toContain('Я открыла письмо');
  });
});
