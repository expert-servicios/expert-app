import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getKiaToolDefinition } from '@/lib/ai/kia/kia-tool-definitions';
import { getKiaToolPolicy } from '@/lib/ai/kia/kia-tool-registry';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('KIA journal proposal persistence review gate', () => {
  const service = read('lib/ai/kia/kia-journal-inbox-save.ts');
  const api = read('app/api/admin/empresas/[id]/propuestas-contables/route.ts');
  const executor = read('lib/ai/kia/kia-accounting-tools.ts');
  it('does not expose save to autonomous LLM tools', () => {
    expect(getKiaToolDefinition('save_journal_entry_proposal')).toBeNull();
    expect(getKiaToolPolicy('save_journal_entry_proposal')).toBeNull();
    expect(executor).not.toContain("toolName === 'save_journal_entry_proposal'");
  });
  it('requires authenticated admin API and server-side company scope', () => {
    expect(api).toContain("['owner','admin'].includes(profile.role)");
    expect(api).toContain("const ctx = await authorize(request,id)");
    expect(api).toContain("saveKiaJournalInboxProposal(ctx.admin,ctx.userId,{companyId:id,...parsed.data})");
  });
  it('deduplicates and validates before storage without contacting Holded', () => {
    expect(service).toContain('prepareKiaJournalProposal(input)');
    expect(service).toContain("createHash('sha256')");
    expect(service).toContain("error?.code === '23505'");
    expect(service).toContain("eq('company_id',p.companyId)");
    expect(service).not.toMatch(/createHoldedV2Client|createLedgerEntry|deleteLedgerEntry/);
  });
});
