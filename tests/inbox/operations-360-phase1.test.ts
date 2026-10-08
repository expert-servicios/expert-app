import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const model = source('lib/admin/operations-360-inbox.ts');
const route = source('app/api/admin/inbox/route.ts');
const escalation = source('app/api/admin/inbox/escalate/route.ts');
const page = source('app/(protected)/admin/inbox/page.tsx');
const sidebar = source('components/admin/AdminSidebar.tsx');

describe('Operations 360 Inbox phase 1', () => {
  it('uses existing canonical sources as a server-side read model', () => {
    expect(model).toContain("from('email_inbox_cache')");
    expect(model).toContain("from('kia_conversations')");
    expect(model).toContain("from('kia_conversation_messages')");
    expect(model).toContain("from('leads')");
    expect(model).toContain("from('internal_tasks')");
    expect(model).toContain("from('appointments')");
    expect(model).toContain("mode: 'read_model'");
    expect(model).toContain("persistentEnvelope: 'kia_conversations'");
    expect(model).not.toMatch(/\.insert\s*\(/);
    expect(model).not.toMatch(/\.update\s*\(/);
    expect(model).not.toMatch(/\.delete\s*\(/);
  });

  it('protects the inbox API with the shared admin guard and no-store semantics', () => {
    expect(route).toContain('requireAdminClient(request)');
    expect(route).toContain("status: 403");
    expect(route).toContain("'Cache-Control': 'no-store'");
    expect(route).toContain('loadOperations360Inbox');
  });

  it('supports the canonical filters and company/tax-id search', () => {
    expect(route).toContain("'email'");
    expect(route).toContain("'telegram'");
    expect(route).toContain("'web'");
    expect(route).toContain("'meta'");
    expect(route).toContain("'google'");
    expect(route).toContain("'linkedin'");
    expect(route).toContain("'needs_action'");
    expect(route).toContain("'kia_working'");
    expect(route).toContain("'resolved'");
    expect(model).toContain('company_name');
    expect(model).toContain('company_tax_id');
    expect(model).toContain('cif_nif');
  });

  it('does not duplicate email leads when the canonical email thread exists', () => {
    expect(model).toContain("if (channel === 'email') continue;");
    expect(model).toContain("source: 'email_inbox_cache'");
    expect(model).toContain("source: 'kia_conversations'");
    expect(model).toContain("source: 'leads'");
  });

  it('exposes a compact admin surface with source links and KIA status', () => {
    expect(page).toContain('Inbox unificado');
    expect(page).toContain('Necesita acción');
    expect(page).toContain('KIA trabajando');
    expect(page).toContain('Responder manualmente');
    expect(page).toContain('Escalar a mí');
    expect(page).toContain('selected.sourceHref');
    expect(sidebar).toContain('{ label: "Inbox 360", href: "/admin/inbox" }');
  });

  it('creates one canonical review task only after resolving a real inbox item', () => {
    expect(escalation).toContain('requireAdminClient(request)');
    expect(escalation).toContain('loadOperations360Inbox');
    expect(escalation).toContain("from('internal_tasks')");
    expect(escalation).toContain(".upsert({");
    expect(escalation).toContain("{ onConflict: 'source_key' }");
    expect(escalation).toContain("task_kind: 'operations360_manual_review'");
    expect(escalation).toContain("source: 'kia'");
    expect(escalation).toContain('notifyAdmins');
  });
});
