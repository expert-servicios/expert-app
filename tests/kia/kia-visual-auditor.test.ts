import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  KIA_VISUAL_SURFACES,
  auditKiaVisualGuidanceRegistry,
  getKiaVisualGuidanceTelemetry,
} from '@/lib/ai/kia-auditor/kia-visual-auditor';

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('KIA Sprint 5I Visual Auditor', () => {
  it('passes the current visual registry', () => {
    const audit = auditKiaVisualGuidanceRegistry();
    expect(audit.status).toBe('passed');
    expect(audit.failedRules).toBe(0);
    expect(audit.passedRules).toBe(audit.totalRules);
  });

  it('registers all current contextual surfaces explicitly', () => {
    expect(KIA_VISUAL_SURFACES.map((surface) => surface.id)).toEqual([
      'case-list',
      'case-detail',
      'onboarding',
      'holded-integration',
      'profile',
      'post-purchase',
      'fiscal-calendar',
      'help-dashboard',
      'help-public',
    ]);
  });

  it('keeps reserved states scoped', () => {
    const celebration = KIA_VISUAL_SURFACES.filter((surface) => surface.allowedStates.includes('celebracion'));
    const fiscalAlerts = KIA_VISUAL_SURFACES.filter((surface) => surface.allowedStates.includes('alerta_fiscal'));
    const confidence = KIA_VISUAL_SURFACES.filter((surface) => surface.allowedStates.includes('confianza'));

    expect(celebration).toHaveLength(0);
    expect(fiscalAlerts.map((surface) => surface.id)).toEqual(['fiscal-calendar']);
    expect(confidence.every((surface) => surface.source === 'structured')).toBe(true);
  });

  it('does not infer empathy from operational surfaces', () => {
    expect(KIA_VISUAL_SURFACES.some((surface) => surface.allowedStates.includes('empatia'))).toBe(false);
  });

  it('provides aggregate configuration telemetry without persisted interaction events or PII', () => {
    const telemetry = getKiaVisualGuidanceTelemetry();
    expect(telemetry.mode).toBe('configuration_aggregate');
    expect(telemetry.surfacesTotal).toBe(KIA_VISUAL_SURFACES.length);
    expect(telemetry.persistsInteractionEvents).toBe(false);
    expect(telemetry.includesPii).toBe(false);
    expect(telemetry.auditor.status).toBe('passed');
    expect(telemetry.stateCoverage.every((item) => item.surfaces > 0)).toBe(true);
  });

  it('fails closed when a static surface attempts a reserved confidence state', () => {
    const invalid = [
      ...KIA_VISUAL_SURFACES,
      {
        id: 'invalid-static-confidence',
        route: '/invalid-static-confidence',
        source: 'static' as const,
        allowedStates: ['confianza'] as const,
        usesLlm: false as const,
        usesTools: false as const,
      },
    ];
    const audit = auditKiaVisualGuidanceRegistry(invalid);
    expect(audit.status).toBe('failed');
    expect(audit.rules.find((rule) => rule.id === 'visual_confidence_structured_only')?.passed).toBe(false);
  });

  it('fails closed when fiscal alert leaks to a non-fiscal surface', () => {
    const invalid = KIA_VISUAL_SURFACES.map((surface) => surface.id === 'profile'
      ? { ...surface, allowedStates: [...surface.allowedStates, 'alerta_fiscal' as const] }
      : surface);
    const audit = auditKiaVisualGuidanceRegistry(invalid);
    expect(audit.status).toBe('failed');
    expect(audit.rules.find((rule) => rule.id === 'visual_fiscal_alert_scoped')?.passed).toBe(false);
  });

  it('exposes only aggregate visual metrics from the existing admin metrics endpoint', () => {
    const api = source('app/api/admin/kia-metrics/route.ts');
    const page = source('app/(protected)/admin/kia-metrics/page.tsx');

    expect(api).toContain('getKiaVisualGuidanceTelemetry');
    expect(api).toContain('visualGuidance');
    expect(api).not.toContain('visual_guidance_events');
    expect(page).toContain('Kia Visual Copilot — Auditor');
    expect(page).toContain('sin eventos persistidos');
  });
});
