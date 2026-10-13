import { describe, expect, it } from 'vitest';
import { detectEditorialOpportunities } from '@/lib/marketing/kia-opportunity-triage';
describe('KIA opportunity pre-triage', () => {
  it('does not classify an unverified regulatory mention as a legal update', () => {
    const [proposal] = detectEditorialOpportunities([{sourceKey:'boe:123',headline:'Nuevo plazo de cotización'}],[],[]);
    expect(proposal.kind).toBe('needs_review');
    expect(proposal.status).toBe('needs_review');
  });
  it('avoids creating a second service for existing catalog entries', () => {
    const [proposal] = detectEditorialOpportunities([{sourceKey:'client:consultation',headline:'Nacionalidad española',observedCount:3}],['Nacionalidad española'],[]);
    expect(proposal.kind).toBe('knowledge_update');
  });
  it('deduplicates matching signals and produces bilingual proposals', () => {
    const proposals=detectEditorialOpportunities([
      {sourceKey:'lead:42',headline:'Residencia de larga duración'},
      {sourceKey:'lead:42',headline:'Residencia de larga duración'},
    ],[],[]);
    expect(proposals).toHaveLength(1);
    expect(proposals[0].kind).toBe('new_service');
    expect(proposals[0].locales).toEqual(['es','ru']);
    expect(proposals[0].status).toBe('needs_review');
  });
  it('keeps a verified regulatory signal as a draft, not published', () => {
    const [p]=detectEditorialOpportunities([{sourceKey:'boe:123',headline:'Procedimiento EX-11',evidenceUrl:'https://www.boe.es/boe',verified:true}],[],[]);
    expect(p.kind).toBe('article');
    expect(p.status).toBe('draft');
  });
});
