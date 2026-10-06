import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('KIA immigration corpus', () => {
  const prompt = source('lib/ai/kia/prompts/kia-immigration-knowledge.ts');
  const system = source('lib/ai/kia/kia-system-prompt.ts');
  const skillRegistry = source('lib/ai/kia/kia-skill-registry.ts');
  const signature = source('lib/email/kia-signature.ts');
  const emailAgent = source('app/api/cron/kia-email-agent/route.ts');

  it('covers the core Spanish immigration and nationality regimes', () => {
    for (const marker of [
      'Ley Orgánica 4/2000',
      'Real Decreto 1155/2024',
      'Real Decreto 240/2007',
      'Ley 12/2009',
      'Real Decreto 1325/2003',
      'Código Civil',
      'Real Decreto 1004/2015',
      'Ley 14/2013',
      'SEM 2/2026',
    ]) {
      expect(prompt).toContain(marker);
    }
  });

  it('separates legal regimes that must not be conflated', () => {
    expect(prompt).toContain('larga duración nacional de larga duración-UE');
    expect(prompt).toContain('No confundir solicitante de protección internacional');
    expect(prompt).toContain('No mezcles tarjeta de familiar UE');
    expect(prompt).toContain('NIE es número identificativo; TIE es tarjeta física');
  });

  it('loads immigration knowledge contextually and routes it across channels', () => {
    expect(system).toContain('KIA_IMMIGRATION_KNOWLEDGE_PROMPT');
    expect(system).toContain('includeImmigration');
    expect(system).toContain('IMMIGRATION_CONTEXT_RE');
    expect(skillRegistry).toContain("id: 'immigration.advice'");
    expect(skillRegistry).toContain("preferredSubAgentId: 'immigration'");
  });

  it('enforces consultation-first data minimization', () => {
    expect(prompt).toContain('no pidas documentos por defecto');
    expect(prompt).toContain('mínimo documental necesario');
  });

  it('keeps KIA authorship and visual signature on automated client email', () => {
    expect(emailAgent).toContain('kia_author: true');
    expect(emailAgent).toContain('appendKiaSignature');
    expect(emailAgent).toContain("KIA · EXPERT <info@expertconsulting.es>");
    expect(signature).toContain('KIA · EXPERT');
    expect(signature).toContain('asistente virtual de EXPERT');
  });
});
