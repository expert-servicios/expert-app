import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const src=(file:string)=>readFileSync(resolve(process.cwd(),file),'utf8');
const sql=src('supabase/migrations/20261014204700_kia_meeting_review_secure_inbox.sql');
const api=src('app/api/admin/kia/meeting-notes/inbox/route.ts');

describe('meeting inbox security contract',()=>{
 it('restricts public Data API access and enables RLS on all new tables',()=>{
  expect(sql).toContain('alter table public.kia_meeting_review_items enable row level security');
  expect(sql).toContain('alter table public.kia_meeting_review_events enable row level security');
  expect(sql).toContain('revoke all on public.kia_meeting_review_items from public,anon,authenticated');
  expect(sql).toContain('revoke all on public.kia_meeting_review_events from public,anon,authenticated');
 });
 it('uses idempotent source keys, optimistic version, and immutable audit',()=>{
  expect(sql).toContain('source_key text not null unique');
  expect(sql).toContain('new.version <> old.version+1');
  expect(sql).toContain('meeting_review_audit_immutable');
 });
 it('requires staff, bound appointment and company, and derives claims server side',()=>{
  expect(api).toContain("requireActiveActor(request,['admin','owner'])");
  expect(api).toContain("appointment.company_id!==input.companyId");
  expect(api).toContain("subject.company_id!==input.companyId");
  expect(api).toContain('extractMeetingReviewCandidates(doc.data)');
  expect(api).toContain('kind:x.kind');
 });
 it('does not create external actions and refuses stale decisions',()=>{
  expect(api).toContain("eq('status','pending_review')");
  expect(api).toContain("eq('version',v.version)");
  expect(api).toContain('externalActions:false');
  expect(api).not.toContain('sendEmail(');
 });
});