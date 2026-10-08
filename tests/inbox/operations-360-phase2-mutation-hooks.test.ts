import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const dashboard = source('app/api/ai/kia/route.ts');
const telegram = source('app/api/webhooks/telegram/route.ts');
const email = source('app/api/cron/kia-email-agent/route.ts');
const publicBooking = source('app/api/booking/route.ts');
const kiaBooking = source('lib/booking/kia-booking-operator.ts');
const adminAppointments = source('app/api/admin/citas/route.ts');
const clientCancellation = source('app/api/booking/manage/cancel/route.ts');
const recurring = source('lib/booking/recurring-meeting-series.ts');

describe('Operations 360 Phase 2 mutation hooks', () => {
  it('uses one operational task materializer across email, Telegram and authenticated dashboard chat', () => {
    expect(email).toContain('materializeKiaOperationalTask');
    expect(telegram).toContain('materializeKiaOperationalTask');
    expect(dashboard).toContain('materializeKiaOperationalTask');
    expect(dashboard).toContain('!adminCopilotMode && !staffPreview');
  });

  it('separates Telegram operational actions from manual-review tasks', () => {
    expect(telegram).toContain("result.decision.nextAction === 'needs_review'");
    expect(telegram).toContain("task_kind: 'telegram_review'");
    expect(telegram).toContain('prospect:');
    expect(telegram).toContain('private:');
  });

  it('refreshes the canonical agenda after every primary meeting mutation surface', () => {
    expect(publicBooking).toContain('refreshAdminDailyAgenda(admin)');
    expect(kiaBooking).toContain('refreshAdminDailyAgenda(admin)');
    expect(adminAppointments).toContain('refreshAdminDailyAgenda(admin)');
    expect(adminAppointments).toContain('DELETE agenda refresh');
    expect(clientCancellation).toContain('refreshAdminDailyAgenda(admin)');
    expect(recurring).toContain('refreshAdminDailyAgenda(admin)');
  });
});
