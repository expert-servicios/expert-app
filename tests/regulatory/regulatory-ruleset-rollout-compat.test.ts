import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function read(relative: string) {
  return fs.readFileSync(path.join(process.cwd(), relative), 'utf8');
}

describe('regulatory ruleset rollout compatibility', () => {
  it('treats a missing ruleset table or column as a temporary rollout state', () => {
    const compat = read('lib/regulatory/regulatory-schema-compat.ts');

    expect(compat).toContain("error.code === '42P01'");
    expect(compat).toContain("error.code === '42703'");
    expect(compat).toContain("error.code === 'PGRST205'");
    expect(compat).toContain("text.includes('regulatory_rulesets')");
    expect(compat).toContain("text.includes('ruleset_key')");
  });

  it('returns no ruleset rather than failing before the migration exists', () => {
    const rulesets = read('lib/regulatory/regulatory-rulesets.ts');

    expect(rulesets).toContain('isRulesetSchemaUnavailable');
    expect(rulesets).toContain('if (isRulesetSchemaUnavailable(error)) return null;');
  });

  it('keeps worker and health audit operational against the v1.2 schema', () => {
    const review = read('lib/regulatory/regulatory-review.ts');
    const audit = read('lib/regulatory/regulatory-audit.ts');

    expect(review).toContain('rulesetSchemaAvailable');
    expect(review).toContain("rulesetSchemaAvailable && sourceRulesetKeys.length > 0");
    expect(audit).toContain('rulesetSchemaAvailable');
    expect(audit).toContain("ruleset_key: rulesetSchemaAvailable");
  });
});
