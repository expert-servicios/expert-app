import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const decisionLog = readFileSync('lib/ai/kia/kia-decision-log.ts', 'utf8');
const decisionEngine = readFileSync('lib/ai/kia/kia-decision-engine.ts', 'utf8');
const orchestrator = readFileSync('lib/ai/kia/kia-orchestrator.ts', 'utf8');
const migration = readFileSync(
  'supabase/migrations/20261004152500_kia_subagent_observability.sql',
  'utf8',
);

describe('KIA subagent observability', () => {
  it('stores skill, subagent, intent and selection basis', () => {
    for (const column of ['skill_id', 'sub_agent_id', 'detected_intent', 'selection_basis']) {
      expect(migration).toContain(column);
      expect(decisionLog).toContain(column);
    }
  });

  it('passes orchestration trace into the final decision log', () => {
    expect(orchestrator).toContain('orchestrationMetadata:');
    expect(orchestrator).toContain('skillId: executionTrace.skillId');
    expect(orchestrator).toContain('subAgentId: executionTrace.preferredSubAgentId');
    expect(decisionEngine).toContain('input.orchestrationMetadata?.skillId');
    expect(decisionEngine).toContain('input.orchestrationMetadata?.subAgentId');
  });
});
