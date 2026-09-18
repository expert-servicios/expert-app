import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  resolveCaseDetailGuidance,
  resolveCaseListGuidance,
  resolveHoldedIntegrationGuidance,
  resolveOnboardingGuidance,
} from '@/lib/ai/kia/kia-surface-guidance';

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('KIA contextual guidance surfaces', () => {
  const card = source('components/kia/KiaGuidanceCard.tsx');
  const casesPage = source('app/(protected)/dashboard/expedientes/page.tsx');
  const caseDetailPage = source('app/(protected)/dashboard/expedientes/[id]/page.tsx');
  const onboardingPage = source('app/(protected)/dashboard/onboarding/page.tsx');
  const holdedCard = source('components/integrations/HoldedConnectionCard.tsx');
  const holdedForm = source('components/integrations/HoldedApiKeyForm.tsx');

  it('keeps the guidance card presentation-only', () => {
    expect(card).toContain('data-kia-guidance-state={state}');
    expect(card).toContain('<KiaAvatar');
    expect(card).not.toContain("fetch('");
    expect(card).not.toContain('runKiaDecision');
    expect(card).not.toContain('getSupabaseAdmin');
  });

  it('maps expediente counts deterministically', () => {
    expect(resolveCaseListGuidance(2, 1).state).toBe('seguimiento');
    expect(resolveCaseListGuidance(0, 3).state).toBe('exito');
    expect(resolveCaseListGuidance(0, 0).state).toBe('ayuda');
  });

  it('maps expediente detail from trusted state and document counts only', () => {
    expect(resolveCaseDetailGuidance({ caseState: 'nuevo', checklistCount: 0, uploadedCount: 0, reviewedCount: 0 }).state).toBe('ayuda');
    expect(resolveCaseDetailGuidance({ caseState: 'docs_pendientes', checklistCount: 3, uploadedCount: 1, reviewedCount: 0 }).state).toBe('aviso');
    expect(resolveCaseDetailGuidance({ caseState: 'pendiente_documentacion', checklistCount: 1, uploadedCount: 1, reviewedCount: 0 }).state).toBe('duda');
    expect(resolveCaseDetailGuidance({ caseState: 'en_revision', checklistCount: 2, uploadedCount: 2, reviewedCount: 1 }).state).toBe('seguimiento');
    expect(resolveCaseDetailGuidance({ caseState: 'presentado', checklistCount: 2, uploadedCount: 2, reviewedCount: 2 }).state).toBe('confianza');
    expect(resolveCaseDetailGuidance({ caseState: 'resolucion_recibida', checklistCount: 2, uploadedCount: 2, reviewedCount: 2 }).state).toBe('confianza');
    expect(resolveCaseDetailGuidance({ caseState: 'entregado', checklistCount: 0, uploadedCount: 2, reviewedCount: 2 }).state).toBe('exito');
    expect(resolveCaseDetailGuidance({ caseState: 'finalizado', checklistCount: 0, uploadedCount: 2, reviewedCount: 2 }).state).toBe('exito');
    expect(resolveCaseDetailGuidance({ caseState: 'estado_desconocido', checklistCount: 0, uploadedCount: 0, reviewedCount: 0 }).state).toBe('seguimiento');
  });

  it('does not promote presented/resolution states to celebration', () => {
    expect(resolveCaseDetailGuidance({ caseState: 'presentado', checklistCount: 0, uploadedCount: 0, reviewedCount: 0 }).state).not.toBe('celebracion');
    expect(resolveCaseDetailGuidance({ caseState: 'resolucion_recibida', checklistCount: 0, uploadedCount: 0, reviewedCount: 0 }).state).not.toBe('celebracion');
  });

  it('maps Holded connection state deterministically with fail-safe precedence', () => {
    expect(resolveHoldedIntegrationGuidance({ integrationStatus: null, phase: 'idle', hasUiError: false }).state).toBe('ayuda');
    expect(resolveHoldedIntegrationGuidance({ integrationStatus: null, phase: 'testing', hasUiError: false }).state).toBe('pensando');
    expect(resolveHoldedIntegrationGuidance({ integrationStatus: null, phase: 'verified', hasUiError: false }).state).toBe('confianza');
    expect(resolveHoldedIntegrationGuidance({ integrationStatus: 'pending', phase: 'idle', hasUiError: false }).state).toBe('pensando');
    expect(resolveHoldedIntegrationGuidance({ integrationStatus: 'active', phase: 'idle', hasUiError: false }).state).toBe('confianza');
    expect(resolveHoldedIntegrationGuidance({ integrationStatus: 'active', phase: 'disconnecting', hasUiError: false }).state).toBe('pensando');
    expect(resolveHoldedIntegrationGuidance({ integrationStatus: 'failed', phase: 'idle', hasUiError: false }).state).toBe('aviso');
    expect(resolveHoldedIntegrationGuidance({ integrationStatus: 'active', phase: 'testing', hasUiError: true }).state).toBe('aviso');
    expect(resolveHoldedIntegrationGuidance({ integrationStatus: 'disabled', phase: 'idle', hasUiError: false }).state).toBe('ayuda');
  });

  it('keeps onboarding precedence safe', () => {
    expect(resolveOnboardingGuidance({ step: 'done', loading: false, hasError: true, companySkipped: false }).state).toBe('aviso');
    expect(resolveOnboardingGuidance({ step: 'done', loading: true, hasError: false, companySkipped: false }).state).toBe('pensando');
    expect(resolveOnboardingGuidance({ step: 'done', loading: false, hasError: false, companySkipped: false }).state).toBe('exito');
    expect(resolveOnboardingGuidance({ step: 'company', loading: false, hasError: false, companySkipped: true }).state).toBe('duda');
    expect(resolveOnboardingGuidance({ step: 'company', loading: false, hasError: false, companySkipped: false }).state).toBe('explicacion');
    expect(resolveOnboardingGuidance({ step: 'profile', loading: false, hasError: false, companySkipped: false }).state).toBe('bienvenida');
  });

  it('wires expediente guidance without adding an LLM call', () => {
    expect(casesPage).toContain('resolveCaseListGuidance(active.length, closed.length)');
    expect(casesPage).toContain('<KiaGuidanceCard');
    expect(casesPage).not.toContain('/api/ai/kia');
    expect(casesPage).not.toContain('runKiaDecision');
  });

  it('wires expediente detail guidance to authorized case and document state only', () => {
    expect(caseDetailPage).toContain('resolveCaseDetailGuidance({');
    expect(caseDetailPage).toContain('caseState: caseItem.state');
    expect(caseDetailPage).toContain('checklistCount: checklist.length');
    expect(caseDetailPage).toContain('uploadedCount');
    expect(caseDetailPage).toContain('reviewedCount');
    expect(caseDetailPage).toContain('<KiaGuidanceCard');
    expect(caseDetailPage).not.toContain('/api/ai/kia');
    expect(caseDetailPage).not.toContain('runKiaDecision');
  });

  it('wires onboarding guidance to local UI state only', () => {
    expect(onboardingPage).toContain('resolveOnboardingGuidance({');
    expect(onboardingPage).toContain('hasError: Boolean(error)');
    expect(onboardingPage).toContain('companySkipped: companyData.skip');
    expect(onboardingPage).toContain('animateOnChange');
    expect(onboardingPage).not.toContain('/api/ai/kia');
    expect(onboardingPage).not.toContain('runKiaDecision');
  });

  it('wires Holded guidance to existing integration and UI phases only', () => {
    expect(holdedCard).toContain('resolveHoldedIntegrationGuidance({');
    expect(holdedCard).toContain('integrationStatus: integration?.status ?? null');
    expect(holdedCard).toContain("phase: disconnecting ? 'disconnecting' : phase");
    expect(holdedCard).toContain('hasUiError: Boolean(error)');
    expect(holdedCard).toContain('<KiaGuidanceCard');
    expect(holdedForm).toContain("onPhaseChange?.('testing')");
    expect(holdedForm).toContain("onPhaseChange?.(result.ok ? 'verified' : 'error')");
    expect(holdedCard).not.toContain('/api/ai/kia');
    expect(holdedCard).not.toContain('runKiaDecision');
    expect(holdedForm).not.toContain('/api/ai/kia');
    expect(holdedForm).not.toContain('runKiaDecision');
  });
});
