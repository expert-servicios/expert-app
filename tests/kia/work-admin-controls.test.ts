import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const route = readFileSync(resolve(process.cwd(), 'app/api/admin/kia/work-connections/route.ts'), 'utf8');
const controls = readFileSync(resolve(process.cwd(), 'components/admin/KiaWorkControls.tsx'), 'utf8');

describe('KIA Work professional controls', () => {
  it('derives workflow dependencies on the server instead of trusting browser input', () => {
    expect(route).toContain('dependencyKeys(task)');
    expect(route).toContain("throw new WorkError('dependency_unresolved'");
    expect(route).toContain("throw new WorkError('work_dependencies_pending'");
    expect(route).toContain('dependencies: dependencies.map');
  });

  it('validates every evidence target against the current case', () => {
    expect(route).toContain("policy.kind === 'document_archived'");
    expect(route).toContain("policy.kind === 'administrative_action_completed'");
    expect(route).toContain("policy.kind === 'email_sent'");
    expect(route.match(/invalid_evidence_target/g)?.length).toBe(3);
  });

  it('retries verification without executing an external action', () => {
    expect(route).toContain("action: z.literal('retry_verification')");
    expect(route).toContain("state: 'pending', attempts: 0");
    expect(route).toContain('await processWorkInbox(admin, row.event_id)');
    expect(route).not.toContain('sendEmail(');
    expect(route).not.toContain('stripe.');
  });

  it('keeps high-impact actions behind human control', () => {
    expect(controls).toContain('no autoriza firma, pago ni presentación');
    expect(controls).toContain('Volver a verificar');
    expect(controls).toContain('Revocar');
  });

  it('never persists the one-time Work token in the UI', () => {
    expect(controls).toContain('La clave solo se muestra en esta sesión');
    expect(controls).not.toContain('localStorage');
    expect(controls).not.toContain('sessionStorage');
  });
});
