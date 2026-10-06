import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { KIA_INTENTS } from '@/lib/ai/kia/kia-output-schema';
import { getKiaSkillDefinition } from '@/lib/ai/kia/kia-skill-registry';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('KIA immigration strategy contract', () => {
  const orchestrator = source('lib/ai/kia/kia-orchestrator.ts');
  const classifier = source('lib/ai/kia/kia-intent-classifier.ts');
  const official = source('lib/integrations/official-sources.ts');

  it('declares immigration advice as a first-class intent and skill', () => {
    expect(KIA_INTENTS).toContain('immigration_advice');
    expect(getKiaSkillDefinition('immigration.advice')?.preferredSubAgentId).toBe('immigration');
  });

  it('classifies inbound email before specialist routing', () => {
    expect(orchestrator).toContain("input.taskType === 'chat_reply'");
    expect(orchestrator).toContain("input.channel === 'email'");
    expect(classifier).toContain('immigration_advice');
    expect(classifier).toContain('protección temporal');
    expect(classifier).toContain('larga duración');
  });

  it('pins the decisive official sources for Ukraine temporary-protection strategy', () => {
    expect(official).toContain('SEM 2/2026');
    expect(official).toContain('2026/1912');
    expect(official).toContain('4 de marzo de 2028');
    expect(official).toContain('eur-lex.europa.eu');
  });
});
