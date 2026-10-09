import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
 createEmptyHoldedPermissions,
 intersectHoldedReadPermissions,
} from '@/lib/integrations/holded/holded-permissions';

const load=(p:string)=>readFileSync(resolve(process.cwd(),p),'utf8');

describe('Company Holded Admin opt-in for new read-only v2 accounting scopes',()=>{
 const route=load('app/api/admin/empresas/[id]/holded/route.ts');
 const panel=load('app/(protected)/admin/empresas/[id]/integraciones/CompanyHoldedAdminPanel.tsx');

 it('requires explicit consent, elevated staff role and v2 read-only tenant',()=>{
  expect(route).toContain("action: z.literal('enable_accounting_reads')");
  expect(route).toContain("consentConfirmed: z.literal(true)");
  expect(route).toContain("z.enum(['accountingAccounts', 'accountingPayments'])");
  expect(route).toContain("!['owner', 'admin'].includes(auth.actorRole)");
  expect(route).toContain("integration.api_version !== 'v2' || integration.sync_mode !== 'read_only'");
  expect(route).toContain("detected[capability] !== true");
 });
 it('uses explicit window confirmation; does not auto-enable when testing token',()=>{
  expect(panel).toContain("window.confirm('¿Autorizar a KIA a consultar");
  expect(panel).toContain("action: 'enable_accounting_reads'");
  expect(panel).toContain("consentConfirmed: true");
  expect(panel).toContain("integration.permissions_enabled?.[capability] !== true");
  expect(route).toContain("action: z.literal('test_stored')");
  expect(route).toContain("legacySafeRequestedPermissions(");
 });
 it('preserves existing allowed reads, prevents all write permission escalation',()=>{
  const detected={...createEmptyHoldedPermissions(),contacts:true,accountingEntries:true,accountingAccounts:true,accountingPayments:true};
  const current={...createEmptyHoldedPermissions(),contacts:true,accountingEntries:true};
  const requested={...current,accountingAccounts:true,accountingPayments:true,writeInbox:true,laborEmployeesWrite:true};
  expect(intersectHoldedReadPermissions(detected,requested)).toMatchObject({
   contacts:true,accountingEntries:true,accountingAccounts:true,accountingPayments:true,
   writeInbox:false,laborEmployeesWrite:false,laborPayrollsWrite:false
  });
  const missing={...detected,accountingPayments:false};
  expect(intersectHoldedReadPermissions(missing,requested).accountingPayments).toBe(false);
 });
 it('audits permission request and scopes write to active company integration',()=>{
  expect(route).toContain("holded.admin_company_accounting_reads_requested");
  expect(route).toContain("if (auditError)");
  expect(route).toContain(".eq('id', integration.id).eq('company_id', companyId)");
  expect(route).toContain(".eq('provider', 'holded').eq('status', 'active').eq('sync_mode', 'read_only')");
  expect(route).toContain("holdedMutated: false");
  expect(route).not.toContain("createLedgerEntry(");
 });
});
