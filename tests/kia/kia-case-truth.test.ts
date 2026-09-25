import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('KIA canonical case truth', () => {
  it('loads canonical service, effective status and next action into case context', () => {
    const context = source('lib/ai/kia/kia-context-builder.ts');
    expect(context).toContain("service_id, state, status, next_action");
    expect(context).toContain('resolveEffectiveCaseStatus(c.status, c.state)');
    expect(context).toContain('nextAction: c.next_action');
    expect(context).toContain('serviceSlug: c.service_id');
  });

  it('returns the same next action from the user case read tool', () => {
    const executor = source('lib/ai/kia/kia-tool-executor.ts');
    expect(executor).toContain('service_id, category, status, state, next_action');
    expect(executor).toContain('siguiente_paso: c.next_action');
    expect(executor).toContain('resolveEffectiveCaseStatus(c.status, c.state)');
  });

  it('forces KIA to inspect case evidence before requesting documents again', () => {
    const prompt = source('lib/ai/kia/prompts/kia-client-flow.ts');
    expect(prompt).toContain('usa get_case_timeline');
    expect(prompt).toContain('get_case_tasks');
    expect(prompt).toContain('get_case_documents');
    expect(prompt).toContain('Nunca pidas de nuevo un documento');
    expect(prompt).toContain('automationPolicy');
    expect(prompt).toContain('continua sin escalar a Admin');
  });

  it('preserves the concrete contextual case as the first source of truth', () => {
    const prompt = source('lib/ai/kia/prompts/kia-client-flow.ts');
    expect(prompt).toContain('expediente contextual verificado');
    expect(prompt).toContain('No sustituyas un nextAction real por una inferencia');
  });
});
