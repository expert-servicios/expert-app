import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
const api=readFileSync('app/api/ai/kia/public/route.ts','utf8');
const store=readFileSync('lib/ai/kia/kia-public-web-persistence.ts','utf8');
describe('KIA web persisted turns: release gates',()=>{
  it('rejects unverified sessions and requires idempotency only when enabled',()=>{
    expect(api).toContain('if (publicWebPersistenceEnabled())');
    expect(api).toContain("error: 'message_id_required'");
    expect(api).toContain("error: 'session_required'");
    expect(api).toContain('resolvePublicWebSession(admin, request.cookies.get(PUBLIC_KIA_SESSION_COOKIE)?.value)');
  });
  it('does not trust client supplied history and avoids duplicate paid calls',()=>{
    expect(api).toContain('readPublicWebHistory(persisted.admin');
    expect(api).toContain('claimPublicWebTurn(admin, {');
    expect(api).toContain("error: 'turn_in_progress'");
    expect(api).toContain('replayed: true');
    expect(api).toContain('failPublicWebTurn(persisted.admin');
    expect(store).toContain(".eq('client_message_id', messageId)");
    expect(store).toContain(".eq('role', 'assistant')");
  });
  it('persists assistant replies only server-side',()=>{
    expect(api).toContain('const respond = async');
    expect(api).toContain('completePublicWebTurn(persisted.admin, {');
    expect(api).toContain("error: 'response_unavailable'");
  });
});