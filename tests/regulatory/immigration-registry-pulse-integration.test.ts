import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
describe('Existing regulatory pulse + immigration ES/RU registry',()=>{
 const sql=readFileSync('supabase/migrations/20261013150000_immigration_regulatory_registry_links.sql','utf8');
 const reg=JSON.parse(readFileSync('docs/i18n/immigration-official-source-registry-2026-10-13.json','utf8'));
 it('keeps original cron and fingerprints without duplicating watcher',()=>{
  expect(sql).toContain("WHERE source_key='boe_rd_1155_2024'");
  expect(sql).not.toMatch(/(?:CREATE|ALTER)\s+(?:EXTENSION|TABLE|FUNCTION)/i);
  expect(sql).not.toMatch(/cron\.schedule|net\.http_post/i);
 });
 it('covers BOE changes, links both languages, preserves manual migration references',()=>{
  for(const id of ['BOE-A-2026-8284','BOE-A-2026-19632','BOE-A-2026-19633']) expect(sql).toContain(id);
  for(const d of reg.reviewedDocs){
   expect(sql).toContain(d.slug);
   expect(sql).toContain(d.localePair.split('/').at(-1));
  }
  expect(sql).toContain("AND NOT active");
  expect(sql).toContain('ON CONFLICT(source_id,dependency_type,dependency_key) WHERE source_id IS NOT NULL');
 });
});