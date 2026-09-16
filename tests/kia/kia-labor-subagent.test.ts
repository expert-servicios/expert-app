import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getKiaSubAgentProfile, selectSubAgentProfile } from '@/lib/ai/kia/kia-sub-agent-router';
import { KIA_INTENTS } from '@/lib/ai/kia/kia-output-schema';

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('KIA labor sub-agent', () => {
  it('registers payroll_diagnostics as an explicit KIA intent', () => {
    expect(KIA_INTENTS).toContain('payroll_diagnostics');
  });

  it('routes payroll diagnostics to the labor sub-agent through the skill registry', () => {
    const selected = selectSubAgentProfile({
      taskType: 'chat_reply',
      detectedIntent: 'payroll_diagnostics',
    });
    expect(selected?.id).toBe('labor');
    expect(selected?.systemPromptAddendum).toContain('run_labor_payroll_diagnostics');
    expect(selected?.systemPromptAddendum).toContain('salary-records');
    expect(selected?.systemPromptAddendum).toContain('No corrijas datos');
  });

  it('keeps the labor profile distinct from accounting Holded', () => {
    expect(getKiaSubAgentProfile('labor')?.id).toBe('labor');
    expect(getKiaSubAgentProfile('holded')?.id).toBe('holded');
    expect(getKiaSubAgentProfile('labor')?.systemPromptAddendum).not.toBe(
      getKiaSubAgentProfile('holded')?.systemPromptAddendum,
    );
  });

  it('teaches the classifier to prefer payroll_diagnostics over accounting anomaly review', () => {
    const classifier = source('lib/ai/kia/kia-intent-classifier.ts');
    expect(classifier).toContain('payroll_diagnostics: revisar o comparar nómina');
    expect(classifier).toContain('no usar para discrepancias de nómina si payroll_diagnostics encaja');
  });
});
