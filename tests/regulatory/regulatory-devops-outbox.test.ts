import {describe,expect,it,vi,afterEach} from 'vitest';
import {regulatoryDevOpsNotificationsEnabled,enqueueRegulatoryDevOpsReview,dispatchRegulatoryDevOpsReviews} from '@/lib/regulatory/regulatory-devops-outbox';
afterEach(()=>vi.unstubAllEnvs());
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
