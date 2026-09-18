import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolvePostPurchaseGuidance } from '@/lib/ai/kia/kia-surface-guidance';

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('KIA Sprint 5F post-purchase guidance', () => {
  const wizard = source('components/dashboard/PostCompraWizard.tsx');
  const waiting = source('components/dashboard/PostCompraWaiting.tsx');

  it('maps only confirmed post-purchase milestones', () => {
    expect(resolvePostPurchaseGuidance({
      hasActiveSubscription: false,
      onboardingMeetingScheduled: false,
      holdedConnected: false,
    }).state).toBe('pensando');

    expect(resolvePostPurchaseGuidance({
      hasActiveSubscription: true,
      onboardingMeetingScheduled: false,
      holdedConnected: false,
    }).state).toBe('ayuda');

    expect(resolvePostPurchaseGuidance({
      hasActiveSubscription: true,
      onboardingMeetingScheduled: true,
      holdedConnected: false,
    }).state).toBe('explicacion');

    expect(resolvePostPurchaseGuidance({
      hasActiveSubscription: true,
      onboardingMeetingScheduled: true,
      holdedConnected: true,
    }).state).toBe('confianza');
  });

  it('keeps fail-safe milestone precedence', () => {
    expect(resolvePostPurchaseGuidance({
      hasActiveSubscription: false,
      onboardingMeetingScheduled: true,
      holdedConnected: true,
    }).state).toBe('pensando');

    expect(resolvePostPurchaseGuidance({
      hasActiveSubscription: true,
      onboardingMeetingScheduled: false,
      holdedConnected: true,
    }).state).toBe('ayuda');
  });

  it('does not claim final success before human onboarding closure', () => {
    const ready = resolvePostPurchaseGuidance({
      hasActiveSubscription: true,
      onboardingMeetingScheduled: true,
      holdedConnected: true,
    });

    expect(ready.state).toBe('confianza');
    expect(ready.state).not.toBe('exito');
    expect(ready.state).not.toBe('celebracion');
  });

  it('wires the wizard only to structured subscription, meeting and Holded flags', () => {
    expect(wizard).toContain('resolvePostPurchaseGuidance({');
    expect(wizard).toContain('hasActiveSubscription: true');
    expect(wizard).toContain('onboardingMeetingScheduled');
    expect(wizard).toContain('holdedConnected');
    expect(wizard).toContain('<KiaGuidanceCard');
    expect(wizard).toContain('animateOnChange');
    expect(wizard).not.toContain('/api/ai/kia');
    expect(wizard).not.toContain('runKiaDecision');
  });

  it('keeps subscription waiting presentation-only and preserves existing polling', () => {
    expect(waiting).toContain('resolvePostPurchaseGuidance({');
    expect(waiting).toContain('hasActiveSubscription: false');
    expect(waiting).toContain('<KiaGuidanceCard');
    expect(waiting).toContain('const MAX      = 10');
    expect(waiting).toContain('3_000');
    expect(waiting).toContain("router.push('/dashboard')");
    expect(waiting).not.toContain('/api/ai/kia');
    expect(waiting).not.toContain('runKiaDecision');
  });
});
