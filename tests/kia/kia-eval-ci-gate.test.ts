import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('KIA eval CI gate', () => {
  it('runs the dedicated KIA contract suite after unit tests', () => {
    const workflow = readFileSync(resolve(process.cwd(), '.github/workflows/ci.yml'), 'utf8');
    expect(workflow).toContain('- name: KIA contract evals');
    expect(workflow).toContain('run: npm run kia:eval');
    expect(workflow.indexOf('run: npm test')).toBeLessThan(workflow.indexOf('run: npm run kia:eval'));
  });
});
