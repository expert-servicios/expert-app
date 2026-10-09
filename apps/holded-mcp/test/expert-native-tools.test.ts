import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { registerExpertTools } from '../src/tools/expert.ts';

test('EXPERT company discovery is strictly read-only and does not return provider credentials', async () => {
  const registrations: Array<{name:string; annotations:Record<string,unknown>; execute:()=>Promise<unknown>}> = [];
  const fakeServer = {
    tool(name:string, _description:string, _schema:unknown, annotations:Record<string,unknown>, execute:()=>Promise<unknown>) {
      registrations.push({name, annotations, execute});
    },
  };
  registerExpertTools(fakeServer as never, () => ({
    listCompanies: async () => [{ id:'allowed-company', name:'Test EXPERT', role:'owner', active:true }],
  }) as never);
  assert.equal(registrations.length,1);
  assert.equal(registrations[0].name,'list_companies');
  assert.equal(registrations[0].annotations.readOnlyHint,true);
  assert.equal(registrations[0].annotations.destructiveHint,false);
  const response = await registrations[0].execute();
  const content=JSON.stringify(response);
  assert.match(content,/allowed-company/);
  assert.doesNotMatch(content,/holdedApiKey|encrypted_api_key|access_token/);
});

test('EXPERT-native tools are disabled by default and require verified EXPERT user identity', () => {
  const cfg=readFileSync('src/config.ts','utf8');
  const app=readFileSync('src/app.ts','utf8');
  assert.match(cfg,/EXPERT_BACKEND_TOOLS_ENABLED: z\.enum\(\['0', '1'\]\)\.default\('0'\)/);
  assert.match(cfg,/EXPERT_BACKEND_TOOLS_ENABLED=1 requires EXPERT_OAUTH_BRIDGE_ENABLED=1/);
  assert.match(app,/isSupabaseUserId\(record\.userId\)/);
});
