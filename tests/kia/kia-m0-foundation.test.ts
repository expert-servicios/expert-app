import { describe, expect, it } from 'vitest';
import { KIA_TOOL_DEFINITIONS } from '@/lib/ai/kia/kia-tool-definitions';
import {
  assertKiaToolRegistryComplete,
  getKiaToolPolicy,
  getKiaToolRegistry,
  isKiaToolSafeForAutonomousExecution,
} from '@/lib/ai/kia/kia-tool-registry';
import {
  providersForCapability,
  resolveKiaRuntimeProvider,
} from '@/lib/ai/kia/kia-capability-router';
import { redactJson, redactSensitiveText } from '@/lib/ai/kia/kia-redaction';
import { getService } from '@/lib/services/service-registry';

describe('KIA M0 foundation', () => {
  it('requires policy metadata for every exposed KIA tool', () => {
    expect(() => assertKiaToolRegistryComplete()).not.toThrow();
    expect(getKiaToolRegistry()).toHaveLength(KIA_TOOL_DEFINITIONS.length);
  });

  it('keeps read tools autonomous but drafts and consequential tools gated', () => {
    expect(isKiaToolSafeForAutonomousExecution('get_user_expedientes')).toBe(true);
    expect(isKiaToolSafeForAutonomousExecution('get_holded_invoices')).toBe(true);
    expect(isKiaToolSafeForAutonomousExecution('create_internal_task')).toBe(false);
    expect(getKiaToolPolicy('create_internal_task')).toMatchObject({
      effect: 'draft',
      requiresHumanApproval: true,
    });
  });

  it('routes capabilities provider-neutrally with deterministic-first fallback', () => {
    expect(providersForCapability('computer_use')).toEqual(expect.arrayContaining(['openai', 'anthropic']));
    expect(resolveKiaRuntimeProvider({ capability: 'structured_output' })).toBe('deterministic');
    expect(resolveKiaRuntimeProvider({ capability: 'computer_use' })).toBe('openai');
    expect(resolveKiaRuntimeProvider({ capability: 'computer_use', preferredProvider: 'anthropic' })).toBe('anthropic');
  });

  it('redacts certificate, auth and session secrets before persistence', () => {
    const pem = '-----BEGIN PRIVATE KEY-----\nABC123\n-----END PRIVATE KEY-----';
    expect(redactSensitiveText(pem)).toBe('[certificate-secret]');
    expect(redactSensitiveText('certificado cliente.p12')).toContain('[certificate-file]');
    expect(redactSensitiveText('PIN: 123456')).toContain('[auth-code]');

    expect(redactJson({
      password: 'secret-value',
      session_cookie: 'cookie-value',
      nested: { sms_code: '123456' },
    })).toEqual({
      password: '[secret]',
      session_cookie: '[secret]',
      nested: { sms_code: '[secret]' },
    });
  });

  it('allows monthly checkout before Holded connection and treats Holded as onboarding dependency', () => {
    for (const slug of ['plan-supervision', 'plan-avanzado', 'plan-colaborativo']) {
      const service = getService(slug);
      expect(service?.isSubscription).toBe(true);
      expect(service?.requiresHoldedLicense).toBe(true);
      expect(service?.requiresHoldedApi).toBe(true);
      expect(service?.requiresHoldedConnectionBeforeCheckout).toBe(false);
    }
  });
});
