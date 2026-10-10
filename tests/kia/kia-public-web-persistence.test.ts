import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
const persistence=readFileSync('lib/ai/kia/kia-public-web-persistence.ts','utf8');
describe('Public KIA web server-only persistence',()=>{
  it('fails closed and treats the cookie as session continuity, not client identity',()=>{
    expect(persistence).toContain("KIA_PUBLIC_WEB_PERSISTENCE_ENABLED === 'true'");
    expect(persistence).toContain('verifyPublicKiaSession(token)');
    expect(persistence).toContain("sessionTokenHash(randomId)");
    expect(persistence).not.toContain(".from('profiles')");
    expect(persistence).not.toContain(".from('leads')");
  });
  it('isolates history and rejects expired or inactive sessions',()=>{
    expect(persistence).toContain(".eq('token_hash', sessionTokenHash(randomId))");
    expect(persistence).toContain(".eq('session_id', session.id)");
    expect(persistence).toContain(".eq('state', 'active')");
    expect(persistence).toContain(".gt('expires_at', new Date().toISOString())");
    expect(persistence).toContain('.limit(60)');
  });
  it('does not overwrite conflicting messages on retries',()=>{
    expect(persistence).toContain("error.code !== '23505'");
    expect(persistence).toContain("existing.body !== body");
    expect(persistence).toContain('kia_web_reused_message_id_different_body');
  });
});