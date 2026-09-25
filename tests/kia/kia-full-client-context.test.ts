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

  it('offers a scoped R0 history lookup when the recent brief is insufficient', () => {
    const defs = source('lib/ai/kia/kia-tool-definitions.ts');
    const registry = source('lib/ai/kia/kia-tool-registry.ts');
    const executor = source('lib/ai/kia/kia-tool-executor.ts');
    expect(defs).toContain('get_client_communications');
    expect(registry).toContain("get_client_communications:          policy('R0', 'read',  'client_data')");
    expect(executor).toContain("case 'get_client_communications':");
    expect(executor).toContain('clientId: context.contact?.clientId');
  });

  it('prioritizes origin email and first-name continuity without mixing unrelated history', () => {
    const prompt = source('lib/ai/kia/kia-system-prompt.ts');
    expect(prompt).toContain('Si existe originEmail, ese correo es el contexto primario');
    expect(prompt).toContain('no mezcles asuntos antiguos no relacionados');
    expect(prompt).toContain('nombre de pila');
  });

  it('acknowledges a generic originating email in the contextual welcome', () => {
    const widget = source('components/KiaCopilotWidget.tsx');
    const contextRoute = source('app/api/ai/kia/context/route.ts');
    expect(contextRoute).toContain('originEmail: context.origin_type');
    expect(widget).toContain('He abierto el correo');
    expect(widget).toContain('Я открыла письмо');
  });
});
