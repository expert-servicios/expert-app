import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveFiscalCalendarGuidance } from '@/lib/ai/kia/kia-surface-guidance';

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('KIA Sprint 5G fiscal calendar guidance', () => {
  const calendarPage = source('app/(protected)/dashboard/calendario-fiscal/page.tsx');

  it('maps authorized calendar counts deterministically', () => {
    expect(resolveFiscalCalendarGuidance({ obligationCount: 5, pendingCount: 3, overdueCount: 2 }).state).toBe('alerta_fiscal');
    expect(resolveFiscalCalendarGuidance({ obligationCount: 5, pendingCount: 3, overdueCount: 0 }).state).toBe('seguimiento');
    expect(resolveFiscalCalendarGuidance({ obligationCount: 5, pendingCount: 0, overdueCount: 0 }).state).toBe('confianza');
    expect(resolveFiscalCalendarGuidance({ obligationCount: 0, pendingCount: 0, overdueCount: 0 }).state).toBe('ayuda');
  });

  it('prioritizes overdue deadlines over the general pending state', () => {
    const guidance = resolveFiscalCalendarGuidance({ obligationCount: 8, pendingCount: 4, overdueCount: 1 });
    expect(guidance.state).toBe('alerta_fiscal');
    expect(guidance.detail).toContain('4 pendientes');
    expect(guidance.detail).toContain('1 vencida');
  });

  it('does not infer debt, penalties or an omitted filing from a calendar deadline', () => {
    const guidance = resolveFiscalCalendarGuidance({ obligationCount: 2, pendingCount: 1, overdueCount: 1 });
    expect(guidance.message).toContain('no interpreta este estado como deuda, sanción ni presentación omitida');
    expect(guidance.state).not.toBe('exito');
    expect(guidance.state).not.toBe('celebracion');
  });

  it('wires the fiscal surface only to counts already computed by the authorized page', () => {
    expect(calendarPage).toContain('resolveFiscalCalendarGuidance({');
    expect(calendarPage).toContain('obligationCount: obligations.length');
    expect(calendarPage).toContain('pendingCount: pending');
    expect(calendarPage).toContain('overdueCount: overdue');
    expect(calendarPage).toContain('<KiaGuidanceCard');
    expect(calendarPage).not.toContain('/api/ai/kia');
    expect(calendarPage).not.toContain('runKiaDecision');
    expect(calendarPage).not.toContain('notes: o.notes');
    expect(calendarPage).not.toContain('description: o.description');
  });
});
