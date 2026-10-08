import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('KIA unified inbox and admin agenda', () => {
  it('routes public contact and Holded forms into canonical leads', () => {
    const contact = source('app/api/contact/route.ts');
    const holded = source('app/api/holded-demo/route.ts');

    expect(contact).toContain('ensureInboundLead({');
    expect(contact).toContain("origin: 'form:contacto'");
    expect(contact).toContain('/admin/leads?focus=');
    expect(contact).toContain("if (body.hp_url) return NextResponse.json({ ok: true });");

    expect(holded).toContain('ensureInboundLead({');
    expect(holded).toContain("origin: 'form:holded-demo'");
    expect(holded).toContain("title: 'Nueva solicitud Holded'");
    expect(holded).toContain("if (String(body.hp_url ?? '').trim())");
  });

  it('always invites the canonical admin owner to booking calendar meetings', () => {
    const provider = source('lib/booking/calendar-provider.ts');
    const owner = source('lib/admin/admin-owner.ts');

    expect(owner).toContain("DEFAULT_ADMIN_OWNER_EMAIL = 'soy@kseniailicheva.com'");
    expect(provider).toContain('getAdminOwnerEmail()');
    expect(provider).toContain('additionalAttendeeEmails');
    expect(provider).toContain('createCalendarMeetingSA(meetingInput)');
    expect(provider).toContain('createMs365TeamsMeeting(stored, meetingInput)');
  });

  it('publishes and refreshes daily tasks and meetings in the canonical admin Google agenda', () => {
    const summary = source('app/api/cron/daily-summary/route.ts');
    const agenda = source('lib/admin/admin-daily-agenda.ts');
    const google = source('lib/integrations/google-calendar.ts');

    expect(summary).toContain('refreshAdminDailyAgenda(admin, now)');
    expect(agenda).toContain('admin_agenda_event:');
    expect(agenda).toContain('upsertAdminAgendaEventSA({');
    expect(agenda).toContain("Panel de tareas: https://expertconsulting.es/admin/tareas");
    expect(google).toContain('export async function createAdminAgendaEventSA');
    expect(google).toContain('export async function upsertAdminAgendaEventSA');
    expect(google).toContain("transparency: 'transparent'");
  });

  it('allows unverified Telegram contacts only in public prospect mode', () => {
    const telegram = source('app/api/webhooks/telegram/route.ts');

    expect(telegram).toContain("source: 'telegram'");
    expect(telegram).toContain("category: 'Consulta Telegram'");
    expect(telegram).toContain('publicProspect: true');
    expect(telegram).toContain('allowTools: false');
    expect(telegram).toContain("task_kind: 'telegram_review'");
    expect(telegram).toContain("if (identity && !adminChat && !telegramClientsEnabled)");
  });
});
