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
