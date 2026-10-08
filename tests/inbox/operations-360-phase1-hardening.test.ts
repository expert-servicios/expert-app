import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const inbox = source('lib/admin/operations-360-inbox.ts');
const page = source('app/(protected)/admin/inbox/page.tsx');

describe('Operations 360 Fase 1 hardening', () => {
  it('refuses ambiguous email identity instead of last-write-wins maps', () => {
    expect(inbox).toContain('function uniqueEmailIndex');
    expect(inbox).toContain('const ambiguous = new Set<string>()');
    expect(inbox).toContain('profileEmailIndex.ambiguous.has(senderEmail)');
    expect(inbox).toContain('leadEmailIndex.ambiguous.has(senderEmail)');
    expect(inbox).not.toContain('profiles.filter((row) => row.email).map((row) => [lower(row.email), row])');
  });

  it('prefers an authoritative linked case client over an email match', () => {
    expect(inbox).toContain('const clientId = caseRow?.client_id ?? matchedProfile?.id ?? null');
  });

  it('uses the strongest available task scope without falling through to another client case', () => {
    expect(inbox).toContain('if (item.caseId) return task.case_id === item.caseId');
    expect(inbox).toContain('if (item.leadId) return task.lead_id === item.leadId');
    expect(inbox).toContain('if (item.clientId) return task.client_id === item.clientId');
  });

  it('does not fall back to email for meetings when an explicit client or company scope exists', () => {
    expect(inbox).toContain('if (item.clientId) return meeting.client_id === item.clientId');
    expect(inbox).toContain('if (item.companyId) return meeting.company_id === item.companyId');
  });

  it('refreshes the Admin read model silently every 30 seconds only while visible', () => {
    expect(page).toContain('window.setInterval');
    expect(page).toContain('30_000');
    expect(page).toContain("document.visibilityState === 'visible'");
    expect(page).toContain("load({ silent: true })");
  });

  it('shows persisted next action without bulk AI generation', () => {
    expect(page).toContain('Siguiente acción KIA:');
    expect(page).toContain('nextActionLabel(selected.metadata.next_action)');
    expect(page).not.toContain('/api/ai/kia');
  });
});
