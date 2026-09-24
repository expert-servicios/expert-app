import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const helper = readFileSync(resolve(process.cwd(), 'lib/ai/kia/kia-staff-preview.ts'), 'utf8');
const route = readFileSync(resolve(process.cwd(), 'app/api/ai/kia/route.ts'), 'utf8');
const context = readFileSync(resolve(process.cwd(), 'app/api/ai/kia/context/route.ts'), 'utf8');
const widget = readFileSync(resolve(process.cwd(), 'components/KiaCopilotWidget.tsx'), 'utf8');

describe('KIA staff client preview', () => {
  it('requires an active staff identity and an exact client/case pair', () => {
    expect(helper).toContain('metadata.staff_preview !== true');
    expect(helper).toContain('isStaffRole(actor.role)');
    expect(helper).toContain(".eq('id', metadata.preview_case_id)");
    expect(helper).toContain(".eq('client_id', metadata.preview_client_id)");
  });

  it('routes read-only client tools against the preview client while retaining the real actor', () => {
    expect(route).toContain('clientId: staffPreview?.clientId ?? user.id');
    expect(route).toContain("runPolicyEnforcedKiaDecision('client_dashboard'");
    expect(route).toContain('userId      : user.id');
    expect(route).toContain('staff_preview: Boolean(staffPreview)');
  });

  it('reuses one delegated conversation per staff actor and case', () => {
    expect(route).toContain(".eq('profile_id', user.id)");
    expect(route).toContain(".eq('case_id', contextualCaseId)");
    expect(route).toContain(".contains('metadata', { staff_preview: true, preview_client_id: staffPreview.clientId })");
    expect(route).toContain('preview_case_id: staffPreview?.caseRow.id ?? null');
  });

  it('does not require the staff actor to impersonate the client auth identity', () => {
    expect(route).toContain('resolveKiaStaffPreview({ admin, actorId: user.id');
    expect(helper).not.toContain('auth.admin.updateUser');
    expect(helper).not.toContain('impersonate');
  });

  it('uses the preview client name and case in contextual welcome', () => {
    expect(context).toContain('const displayProfile = staffPreview?.client ?? profile');
    expect(context).toContain('effectiveClientId = staffPreview?.clientId ?? user.id');
    expect(context).toContain('staffPreview: Boolean(staffPreview)');
  });

  it('makes the delegated read-only state visible to staff testers', () => {
    expect(widget).toContain('Modo prueba Admin · Vista cliente delegada · Solo lectura');
  });
});

describe('KIA staff preview email endpoint', () => {
  const emailRoute = readFileSync(resolve(process.cwd(), 'app/api/admin/kia/client-preview-email/route.ts'), 'utf8');

  it('sends only to the authenticated staff email and never accepts a recipient field', () => {
    expect(emailRoute).toContain("to: user.email");
    expect(emailRoute).not.toContain("recipient: z.");
    expect(emailRoute).toContain("isStaffRole(actor.role)");
  });

  it('creates a staff-owned opaque token without changing case ownership', () => {
    expect(emailRoute).toContain("profileId: actor.id");
    expect(emailRoute).toContain("preview_case_id: caseRow.id");
    expect(emailRoute).toContain("preview_client_id: caseRow.client_id");
    expect(emailRoute).not.toContain("update({ client_id");
  });
});
