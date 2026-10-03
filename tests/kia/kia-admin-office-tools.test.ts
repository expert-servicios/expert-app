import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getKiaToolPolicy, resolveKiaToolDefinitions } from '@/lib/ai/kia/kia-tool-registry';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('KIA Admin Office read layer', () => {
  const officeTools = [
    'get_admin_inbox_summary',
    'get_admin_agenda',
    'get_admin_pending_tasks',
    'get_admin_attention_queue',
  ];

  it('registers every Office tool as R1 read and admin-only', () => {
    for (const name of officeTools) {
      expect(getKiaToolPolicy(name)).toMatchObject({
        riskTier: 'R1',
        effect: 'read',
        capability: 'administration',
        requiresHumanApproval: false,
        allowedChannels: ['admin'],
      });
    }
  });

  it('exposes Office tools to Admin but never to client dashboard', () => {
    const adminNames = resolveKiaToolDefinitions({
      channel: 'admin',
      maxRiskTier: 'R1',
      allowedEffects: ['read'],
      autonomousOnly: true,
    }).map((tool) => tool.name);

    const dashboardNames = resolveKiaToolDefinitions({
      channel: 'dashboard',
      maxRiskTier: 'R1',
      allowedEffects: ['read'],
      autonomousOnly: true,
    }).map((tool) => tool.name);

    for (const name of officeTools) {
      expect(adminNames).toContain(name);
      expect(dashboardNames).not.toContain(name);
    }
  });

  it('uses only synchronized read models and current authorized scope', () => {
    const office = source('lib/ai/kia/kia-admin-office-tools.ts');
    expect(office).toContain("from('email_inbox_cache')");
    expect(office).toContain("from('appointments')");
    expect(office).toContain("from('internal_tasks')");
    expect(office).toContain('context.company?.id');
    expect(office).toContain('context.contact.clientId');
    expect(office).toContain('canUseGlobalOfficeScope(context)');
    expect(office).not.toContain('sendEmail');
    expect(office).not.toContain('createEvent');
    expect(office).not.toContain('update(');
    expect(office).not.toContain('insert(');
  });

  it('reserves Office data access to Admin/Owner', () => {
    const office = source('lib/ai/kia/kia-admin-office-tools.ts');
    expect(office).toContain('context.actor.role === ROLES.ADMIN || context.actor.role === ROLES.OWNER');
    expect(office).toContain('La capa Office interna está reservada a roles Admin/Owner');
  });

  it('makes the authenticated actor available independently from the target client', () => {
    const context = source('lib/ai/kia/kia-context-builder.ts');
    expect(context).toContain('actor: {');
    expect(context).toContain('userId: input.userId ?? null');
    expect(context).toContain('role: actorRole');
    expect(context).toContain('tenantId: actorTenantId');
    expect(context).toContain('isStaff: actorIsStaff');
  });

  it('teaches Admin Copilot to use the attention queue for operational review', () => {
    const prompt = source('lib/ai/kia/kia-system-prompt.ts');
    expect(prompt).toContain('get_admin_attention_queue');
    expect(prompt).toContain('correo, agenda, reuniones, pendientes o prioridades');
  });
});
