import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const reassign = source('app/api/admin/inbox/reassign/route.ts');
const inbox = source('lib/admin/operations-360-inbox.ts');
const route = source('app/api/admin/inbox/route.ts');
const page = source('app/(protected)/admin/inbox/page.tsx');
const telegram = source('app/api/webhooks/telegram/route.ts');

describe('Operations 360 Inbox phase 1d', () => {
  it('derives waiting-client only from explicit KIA next action', () => {
    expect(inbox).toContain("nextAction === 'ask_one_question'");
    expect(inbox).toContain("'waiting_client'");
    expect(route).toContain("'waiting_client'");
    expect(page).toContain('Esperando cliente');
    expect(page).toContain('KIA ha pedido información');
  });

  it('persists Telegram next_action for the same waiting-client contract as dashboard', () => {
    expect(telegram).toContain("next_action: result.decision.nextAction");
  });

  it('requires a real inbox item and active target client before reassignment', () => {
    expect(reassign).toContain('loadOperations360Inbox');
    expect(reassign).toContain("if (!item) return");
    expect(reassign).toContain("client.status === 'inactive'");
  });

  it('prevents changing verified KIA or Telegram identity from Inbox', () => {
    expect(reassign).toContain("item.source === 'kia_conversations' && item.clientId !== clientId");
    expect(reassign).toContain('La identidad verificada de esta conversación no puede cambiarse desde Inbox');
    expect(reassign).toContain(".eq('profile_id', clientId)");
  });

  it('validates company membership and case ownership before changing context', () => {
    expect(reassign).toContain("caseRow.client_id !== clientId");
    expect(reassign).toContain("La empresa no coincide con el expediente seleccionado");
    expect(reassign).toContain("from('profile_companies')");
    expect(reassign).toContain(".eq('profile_id', clientId)");
    expect(reassign).toContain(".eq('company_id', companyId)");
  });

  it('keeps email identity coherent and updates both durable link and inbox cache', () => {
    expect(reassign).toContain('senderEmail !== clientEmail');
    expect(reassign).toContain("from('email_threads').upsert");
    expect(reassign).toContain("from('email_inbox_cache')");
    expect(reassign).toContain(".update({ case_id: caseId })");
    expect(reassign).toContain("from('admin_email_item_state').upsert");
    expect(reassign).toContain("onConflict: 'source_kind,provider,source_key'");
  });

  it('audits reassignment with previous and new scopes', () => {
    expect(reassign).toContain("operations360.context_reassigned");
    expect(reassign).toContain('previous_client_id: item.clientId');
    expect(reassign).toContain('previous_company_id: item.companyId');
    expect(reassign).toContain('previous_case_id: item.caseId');
  });

  it('offers client search and authorized company/case selection in Inbox', () => {
    expect(page).toContain('/api/admin/clients-quick?q=');
    expect(page).toContain('/api/admin/clientes/');
    expect(page).toContain("fetch('/api/admin/inbox/reassign'");
    expect(page).toContain('Reasignar contexto');
    expect(page).toContain('Guardar reasignación');
  });
});
