import {describe,it,expect} from 'vitest';
import {planRgpdReportRetention} from '../../lib/rgpd/report-retention';
const now=new Date('2026-10-15T10:00:00Z');
const old={at:'2025-09-01T10:00:00Z',channel:'rgpd_report',source_key:'rgpd-report:old',details:{marketing_consent:false}};
const current={at:'2026-10-01T10:00:00Z',channel:'rgpd_report',source_key:'rgpd-report:new'};
const other={at:'2025-01-01T10:00:00Z',channel:'telegram',source_key:'telegram:conversation'};
describe('RGPD selective retention planner: no writes',()=>{
 it('does not delete a lead shared with other services',()=>{
 const p=planRgpdReportRetention({now,metadata:{inquiries:[old,current,other],customer_note:'preserve'},sourceKey:'telegram:conversation'});
 expect(p.action).toBe('prune_interactions');
 if(p.action==='prune_interactions'){expect(p.expired).toBe(1);expect(p.nextMetadata.inquiries).toEqual([current,other]);expect(p.nextMetadata.customer_note).toBe('preserve');}
 });
 it('requires human review before deleting any report-only lead',()=>{expect(planRgpdReportRetention({now,metadata:{inquiries:[old]},sourceKey:'rgpd-report:old'}).action).toBe('review_delete_lead')});
 it('holds marketing consent evidence',()=>{expect(planRgpdReportRetention({now,metadata:{inquiries:[{...old,details:{marketing_consent:true}}]}}).action).toBe('manual_review')});
 it('holds legal preservation and invalid dates',()=>{
 expect(planRgpdReportRetention({now,metadata:{inquiries:[old],legal_hold:true}}).action).toBe('manual_review');
 expect(planRgpdReportRetention({now,metadata:{inquiries:[{...old,at:'not-a-date'}]}}).action).toBe('manual_review');
 });
 it('keeps a newer interaction even if its source key matches an expired event',()=>{
 const reused={...current,source_key:old.source_key};
 const p=planRgpdReportRetention({now,metadata:{inquiries:[old,reused,other]},sourceKey:'telegram:conversation'});
 expect(p.action).toBe('prune_interactions');
 if(p.action==='prune_interactions')expect(p.nextMetadata.inquiries).toEqual([reused,other]);
 });
 it('does not expire newer reports',()=>{expect(planRgpdReportRetention({now,metadata:{inquiries:[current]}}).action).toBe('none')});
});