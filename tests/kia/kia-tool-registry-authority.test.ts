import { describe, expect, it } from 'vitest';
import {
  isKiaToolAuthorized,
  resolveKiaToolDefinitions,
} from '@/lib/ai/kia/kia-tool-registry';

describe('KIA authoritative tool registry', () => {
  it('fails closed for unknown or unregistered tool names', () => {
    expect(resolveKiaToolDefinitions({
      channel: 'dashboard',
      requestedNames: ['get_user_expedientes', 'totally_unknown_tool'],
    }).map((tool) => tool.name)).toEqual(['get_user_expedientes']);

    expect(isKiaToolAuthorized('totally_unknown_tool', { channel: 'dashboard' })).toBe(false);
  });

  it('can constrain model-visible tools to autonomous R0/R1 reads', () => {
    const tools = resolveKiaToolDefinitions({
      channel: 'dashboard',
      requestedNames: ['get_user_expedientes', 'get_holded_invoices', 'create_internal_task'],
      maxRiskTier: 'R1',
      allowedEffects: ['read'],
      autonomousOnly: true,
    });

    expect(tools.map((tool) => tool.name)).toEqual([
      'get_holded_invoices',
      'get_user_expedientes',
    ]);
  });

  it('keeps approval-gated draft tools out of autonomous execution', () => {
    expect(isKiaToolAuthorized('create_internal_task', {
      channel: 'dashboard',
      maxRiskTier: 'R1',
      allowedEffects: ['read'],
      autonomousOnly: true,
    })).toBe(false);
  });

  it('supports R5 as a reserved ceiling without granting new tools', () => {
    const r4 = resolveKiaToolDefinitions({ channel: 'dashboard', maxRiskTier: 'R4' });
    const r5 = resolveKiaToolDefinitions({ channel: 'dashboard', maxRiskTier: 'R5' });
    expect(r5.map((tool) => tool.name)).toEqual(r4.map((tool) => tool.name));
  });
});
