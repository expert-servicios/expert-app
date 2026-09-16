import { describe, expect, it } from 'vitest';
import {
  assertKiaSkillRegistryValid,
  getKiaSkillDefinition,
  getKiaSkillRegistry,
  selectKiaSkill,
} from '@/lib/ai/kia/kia-skill-registry';

describe('KIA M6.1 skill registry', () => {
  it('is internally valid and has unique enabled skills', () => {
    expect(() => assertKiaSkillRegistryValid()).not.toThrow();
    const skills = getKiaSkillRegistry();
    expect(skills.length).toBeGreaterThanOrEqual(4);
    expect(new Set(skills.map((skill) => skill.id)).size).toBe(skills.length);
  });

  it('prefers explicit intent matches over task fallback', () => {
    const selected = selectKiaSkill({
      taskType: 'document_classification',
      detectedIntent: 'viability',
    });
    expect(selected?.id).toBe('fiscal.viability');
  });

  it('selects accounting readiness skills for Holded reasoning', () => {
    const selected = selectKiaSkill({ taskType: 'readiness_reasoning' });
    expect(selected).toMatchObject({
      id: 'accounting.readiness',
      preferredSubAgentId: 'holded',
      maxRiskTier: 'R1',
    });
    expect(selected?.requiredToolCapabilities).toContain('holded_read');
  });

  it('keeps operational skills read-oriented and below R2', () => {
    const skill = getKiaSkillDefinition('operations.next_best_action');
    expect(skill).not.toBeNull();
    expect(skill?.maxRiskTier).toBe('R1');
    expect(skill?.requiredToolCapabilities).toEqual(expect.arrayContaining([
      'client_data',
      'case_management',
      'reporting',
    ]));
  });

  it('returns null for unknown skill ids or unmatched tasks', () => {
    expect(getKiaSkillDefinition('missing.skill')).toBeNull();
    expect(selectKiaSkill({ taskType: 'checkout_decision' })).toBeNull();
  });
});
