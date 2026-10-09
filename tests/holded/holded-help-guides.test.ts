import { describe, expect, it } from 'vitest';
import { docs } from '@/lib/utils/docs';
import { searchKiaKnowledgeResources } from '@/lib/ai/kia/kia-knowledge-discovery';
import { readFileSync } from 'node:fs';

describe('Holded client support knowledge', () => {
  const slugs = ['conectar-holded-kia-token-api-v2','permisos-holded-kia-lectura-escritura','actualizar-permisos-token-holded-kia'];
  it('publishes all three Holded guides in KB and exposes them to KIA search', () => {
    for (const slug of slugs) {
      const doc = docs.find(item => item.slug === slug);
      expect(doc?.category).toBe('holded');
      expect(doc?.body).toContain('Holded');
    }
    const result = searchKiaKnowledgeResources({ query: 'token Holded KIA permisos', type: 'doc',limit:10 });
    expect(result.some(row => slugs.includes(String(row.slug)))).toBe(true);
  });
  it('links dashboard and permission errors directly to published guides', () => {
    const guide = readFileSync('components/integrations/HoldedConnectionGuide.tsx','utf8');
    const card = readFileSync('components/integrations/HoldedConnectionCard.tsx','utf8');
    const resolver = readFileSync('lib/ai/kia/kia-holded-access.ts','utf8');
    expect(guide).toContain(slugs[0]);
    expect(card).toContain(slugs[1]);
    expect(resolver).toContain(slugs[2]);
  });
  it('keeps client v2 connections self-managed and advisor connections restricted', () => {
    const card = readFileSync('components/integrations/HoldedConnectionCard.tsx','utf8');
    expect(card).toContain("integration?.mode === 'advisor_managed' || integration?.mode === 'expert_account'");
    expect(card).not.toContain("integration?.mode === 'advisor_managed' || integration?.api_version === 'v2'");
  });
});
