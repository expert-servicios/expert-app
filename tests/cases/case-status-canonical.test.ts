import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  caseStatusToVisualState,
  resolveEffectiveCaseStatus,
} from '@/lib/cases/case-status';

const read = (path: string) => readFileSync(path, 'utf8');

describe('canonical case status compatibility', () => {
  it('uses legacy state only while canonical status is still the default nuevo', () => {
    expect(resolveEffectiveCaseStatus('nuevo', 'en_proceso')).toBe('en_revision');
    expect(resolveEffectiveCaseStatus('nuevo', 'pendiente_documentacion')).toBe('pendiente_cliente');
    expect(resolveEffectiveCaseStatus('nuevo', 'entregado')).toBe('finalizado');
  });

  it('makes a non-default canonical status authoritative over legacy state', () => {
    expect(resolveEffectiveCaseStatus('presentado', 'en_revision')).toBe('presentado');
    expect(resolveEffectiveCaseStatus('finalizado', 'en_proceso')).toBe('finalizado');
    expect(resolveEffectiveCaseStatus('bloqueado', 'presentado')).toBe('bloqueado');
  });

  it('derives the client visual state from canonical status', () => {
    expect(caseStatusToVisualState('pendiente_cliente')).toBe('docs_pendientes');
    expect(caseStatusToVisualState('en_revision')).toBe('docs_recibidos');
    expect(caseStatusToVisualState('listo_para_presentar')).toBe('en_tramitacion');
    expect(caseStatusToVisualState('presentado')).toBe('presentado');
    expect(caseStatusToVisualState('finalizado')).toBe('finalizado');
  });

  it('blocks new writes to legacy state', () => {
    const legacyRoute = read('app/api/cases/[id]/route.ts');
    expect(legacyRoute).toContain('LEGACY_CASE_STATE_WRITE_DISABLED');
    expect(legacyRoute).toContain('El campo state es legado y ya no admite escrituras');
  });

  it('routes admin status changes through the canonical endpoint', () => {
    const card = read('components/cases/AdminCaseCard.tsx');
    expect(card).toContain("fetch(\`/api/admin/cases/\${caseItem.id}\`");
    expect(card).toContain('const payload: Record<string, unknown> = { status }');
    expect(card).not.toContain("fetch(\`/api/cases/\${caseItem.id}\`");
  });

  it('exposes an explicit staff-only KIA preview action on each admin case card', () => {
    const card = read('components/cases/AdminCaseCard.tsx');
    expect(card).toContain("fetch('/api/admin/kia/client-preview-email'");
    expect(card).toContain("body: JSON.stringify({ case_id: caseItem.id, scenario: 'status' })");
    expect(card).toContain('Probar KIA');
    expect(card).toContain('window.confirm');
  });

  it('resolves historical divergence at read time without rewriting data', () => {
    const adminList = read('app/api/admin/cases/route.ts');
    const adminDetail = read('app/api/admin/cases/[id]/route.ts');
    const clientList = read('app/api/cases/route.ts');

    expect(adminList).toContain('resolveEffectiveCaseStatus(c.status, c.state)');
    expect(adminDetail).toContain('resolveEffectiveCaseStatus(current.status, current.state)');
    expect(clientList).toContain('legacy_state: caseRow.state');
    expect(clientList).toContain('state: caseStatusToVisualState(effectiveStatus)');
  });
});
