import {describe,expect,it,vi,afterEach} from 'vitest';
import {regulatoryDevOpsNotificationsEnabled,enqueueRegulatoryDevOpsReview,dispatchRegulatoryDevOpsReviews} from '@/lib/regulatory/regulatory-devops-outbox';
afterEach(()=>vi.unstubAllEnvs());
describe('regulatory outbox schema contract',()=>{
 it('enforces private ACL, version dedupe, and no ambiguous claim retries',async()=>{
  const {readFileSync}=await import('node:fs');
  const sql=readFileSync('supabase/migrations/20261014065405_regulatory_devops_outbox.sql','utf8');
  expect(sql).toContain('unique(change_id,snapshot_id,channel)');
  expect(sql).toContain('enable row level security');
  expect(sql).toContain('for update skip locked');
  expect(sql).toContain("status in ('pending','retry')");
  expect(sql).not.toContain("status in ('processing'");
  expect(sql).toContain('revoke all on public.regulatory_devops_notification_outbox from public, anon, authenticated');
  expect(sql).toContain('grant select,insert,update on public.regulatory_devops_notification_outbox to service_role');
  expect(sql).toContain('security invoker');
  expect(sql).toContain('revoke all on function public.claim_regulatory_devops_notification_batch(integer) from public,anon,authenticated');
  expect(sql).toContain('grant execute on function public.claim_regulatory_devops_notification_batch(integer) to service_role');
  expect(sql).not.toContain('cron.schedule(');
  expect(sql).not.toContain('net.http_post(');

 });
});

describe('regulatory legal Telegram outbox safety',()=>{
 it('requires both independent feature gates',()=>{
  vi.stubEnv('KIA_REGULATORY_DEVOPS_TELEGRAM_ENABLED','true');
  vi.stubEnv('KIA_REGULATORY_DEVOPS_OUTBOX_READY','false');
  expect(regulatoryDevOpsNotificationsEnabled()).toBe(false);
  vi.stubEnv('KIA_REGULATORY_DEVOPS_OUTBOX_READY','true');
  expect(regulatoryDevOpsNotificationsEnabled()).toBe(true);
 });
 it('never touches database or provider while disabled',async()=>{
  vi.stubEnv('KIA_REGULATORY_DEVOPS_TELEGRAM_ENABLED','false');
  vi.stubEnv('KIA_REGULATORY_DEVOPS_OUTBOX_READY','false');
  expect(await enqueueRegulatoryDevOpsReview({changeId:'a',snapshotId:'b'})).toBe('disabled');
  expect(await dispatchRegulatoryDevOpsReviews()).toEqual({disabled:true,claimed:0,sent:0,uncertain:0,retry:0});
 });
});
