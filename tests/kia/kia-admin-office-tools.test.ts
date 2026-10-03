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

  it('marks Office tools as Admin/Owner-only and never exposes them to client dashboard', () => {
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
      expect(getKiaToolPolicy(name)?.allowedRoles).toEqual(['admin', 'owner']);
    }

    const enforcement = source('lib/ai/kia/kia-policy-enforced-decision.ts');
    expect(enforcement).toContain('toolPolicy.allowedRoles.includes(actor.role)');
  });

  it('uses only synchronized read models and current authorized scope', () => {
    const office = source('lib/ai/kia/kia-admin-office-tools.ts');
    expect(office).toContain("from('email_inbox_cache')");
    expect(office).toContain("from('appointments')");
    expect(office).toContain("from('internal_tasks')");
    expect(office).toContain('context.company?.id');
    expect(office).toContain('context.target?.clientId');
    expect(office).toContain('canUseOffice(context)');
    expect(office).not.toContain('sendEmail');
    expect(office).not.toContain('createEvent');
    expect(office).not.toContain('update(');
    expect(office).not.toContain('insert(');
  });

  it('reserves Office data access to Admin/Owner', () => {
    const office = source('lib/ai/kia/kia-admin-office-tools.ts');
    expect(office).toContain('context.actor?.role === ROLES.ADMIN || context.actor?.role === ROLES.OWNER');
    expect(office).toContain('La capa Office interna está reservada a roles Admin/Owner');
  });

  it('makes the authenticated actor available independently from the target client', () => {
    const context = source('lib/ai/kia/kia-context-builder.ts');
    expect(context).toContain('actor: {');
    expect(context).toContain('userId: input.userId ?? null');
    expect(context).toContain('role: actorRole');
    expect(context).toContain('tenantId: actorTenantId');
    expect(context).toContain('isStaff: actorIsStaff');
    expect(context).toContain('targetClientId');
    expect(context).toContain("input.channel === 'admin' ? null : clientId");
  });

  it('uses canonical Spanish operational states and Madrid task dates', () => {
    const office = source('lib/ai/kia/kia-admin-office-tools.ts');
    expect(office).toContain('"completada","cancelada"');
    expect(office).toContain('"cancelled","canceled","cancelada","rescheduled","reprogramada"');
    expect(office).toContain("['critica', 'urgent']");
    expect(office).toContain("timeZone: 'Europe/Madrid'");
  });

  it('includes authorized email fallbacks for unlinked inbox and legacy appointments', () => {
    const office = source('lib/ai/kia/kia-admin-office-tools.ts');
    expect(office).toContain('from_email.in.');
    expect(office).toContain('email.in.');
    expect(office).toContain("from('profile_companies')");
  });

  it('returns exact section counts plus truncation metadata', () => {
    const office = source('lib/ai/kia/kia-admin-office-tools.ts');
    expect(office).toContain("{ count: 'exact' }");
    expect(office).toContain('truncated: total > items.length');
    expect(office).toContain('unreadEmail: email.total');
    expect(office).toContain('upcomingAppointments: agenda.total');
    expect(office).toContain('pendingTasks: tasks.total');
  });

  it('propagates authenticated actor ids from direct Admin compose routes', () => {
    const compose = source('app/api/admin/whatsapp/ai-compose/route.ts');
    const stream = source('app/api/admin/whatsapp/ai-compose/stream/route.ts');
    for (const route of [compose, stream]) {
      expect(route).toContain('{ admin, actorId: user.id }');
      expect(route).toContain('userId: actorId');
      expect(route).toContain('targetClientId: contactCtx.clientId ?? clientId ?? undefined');
    }
  });

  it('teaches Admin Copilot to use the attention queue for operational review', () => {
    const prompt = source('lib/ai/kia/kia-system-prompt.ts');
    expect(prompt).toContain('get_admin_attention_queue');
    expect(prompt).toContain('correo, agenda, reuniones, pendientes o prioridades');
  });
});
