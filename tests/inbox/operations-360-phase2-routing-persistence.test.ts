import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const dashboard = source('app/api/ai/kia/route.ts');
const telegram = source('app/api/webhooks/telegram/route.ts');
const email = source('app/api/cron/kia-email-agent/route.ts');
const inbox = source('lib/admin/operations-360-inbox.ts');
const page = source('app/(protected)/admin/inbox/page.tsx');

describe('Operations 360 Phase 2 routing persistence', () => {
  it('persists the same routing evidence on dashboard and Telegram', () => {
    for (const file of [dashboard, telegram]) {
      expect(file).toContain('resolveKiaOperationalCategory');
      expect(file).toContain('operational_category: operationalCategory');
      expect(file).toContain('skill_id: result.executionTrace.skillId');
      expect(file).toContain('sub_agent_id: result.executionTrace.preferredSubAgentId');
      expect(file).toContain('detected_intent: result.executionTrace.detectedIntent');
    }
  });

  it('persists routing evidence on email state, outbound audit and tasks', () => {
    expect(email).toContain('resolveKiaOperationalCategory');
    expect(email).toContain('operational_category: operationalCategory');
    expect(email).toContain('operational_category: input.operationalCategory');
    expect(email).toContain('skill_id: result.executionTrace.skillId');
    expect(email).toContain('sub_agent_id: result.executionTrace.preferredSubAgentId');
    expect(email).toContain('detected_intent: result.executionTrace.detectedIntent');
    expect(email).toContain('operational_category: envelopeOperationalCategory');
  });

  it('reads email routing from the canonical persisted agent state instead of reclassifying text', () => {
    expect(inbox).toContain('kiaEmailAgentStateKey(row.thread_id)');
    expect(inbox).toContain("from('system_kv').select('key,value')");
    expect(inbox).toContain('isKiaOperationalCategory(emailAgentState.operational_category)');
    expect(inbox).not.toContain('resolveKiaOperationalCategory(');
    expect(inbox).toContain("'system_kv'");
  });

  it('surfaces routing category consistently in Inbox Admin', () => {
    expect(page).toContain('CATEGORY_LABELS');
    expect(page).toContain('item.operationalCategory');
    expect(page).toContain('selected.operationalCategory');
    expect(page).toContain('Facturación / cobro');
    expect(page).toContain('Arrendamientos');
    expect(page).toContain('Otro / revisión manual');
  });
});
