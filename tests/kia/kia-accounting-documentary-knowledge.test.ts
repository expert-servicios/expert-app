import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { KIA_ACCOUNTING_DOCUMENTARY_KNOWLEDGE_PROMPT } from '@/lib/ai/kia/prompts/kia-accounting-documentary-knowledge';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('KIA documentary accounting knowledge', () => {
  const router = source('lib/ai/kia/kia-sub-agent-router.ts');

  it('is wired into the existing accounting sub-agent', () => {
    expect(router).toContain('KIA_ACCOUNTING_DOCUMENTARY_KNOWLEDGE_PROMPT');
    expect(router).toContain('ACCOUNTING_ADDENDUM =');
    expect(router).toContain("+ '\\n\\n' + KIA_ACCOUNTING_DOCUMENTARY_KNOWLEDGE_PROMPT");
  });

  it('reconciles expenses and receipts without asserting unverified payments', () => {
    expect(KIA_ACCOUNTING_DOCUMENTARY_KNOWLEDGE_PROMPT).toContain('aviso de domiciliacion');
    expect(KIA_ACCOUNTING_DOCUMENTARY_KNOWLEDGE_PROMPT).toContain('extracto actualizado');
    expect(KIA_ACCOUNTING_DOCUMENTARY_KNOWLEDGE_PROMPT).toContain('Modelo 200');
    expect(KIA_ACCOUNTING_DOCUMENTARY_KNOWLEDGE_PROMPT).toContain('Modelo 202');
    expect(KIA_ACCOUNTING_DOCUMENTARY_KNOWLEDGE_PROMPT).toContain('no descontarla dos veces');
  });

  it('does not include client-specific case data or permit accounting writes', () => {
    expect(KIA_ACCOUNTING_DOCUMENTARY_KNOWLEDGE_PROMPT).not.toMatch(/DGM|DISEÑO GLOBAL|Frank|Liliana|Ricardo|Zoe|ensen|B42700427/i);
    expect(KIA_ACCOUNTING_DOCUMENTARY_KNOWLEDGE_PROMPT).toContain('No modificar asientos');
    expect(KIA_ACCOUNTING_DOCUMENTARY_KNOWLEDGE_PROMPT).toContain('nunca copiar hechos o identidad de un cliente a otro');
  });
});
