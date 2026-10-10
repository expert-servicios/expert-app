import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
const route = readFileSync('app/api/ai/kia/public/session/route.ts','utf8');
describe('Anonymous web session API security contract',()=>{
 it('remains disabled by default and never leaks history from arbitrary session IDs',()=>{
  expect(route.match(/if \(!publicWebPersistenceEnabled\(\)\) return blocked\(\);/g)).toHaveLength(2);
  expect(route).toContain('request.cookies.get(PUBLIC_KIA_SESSION_COOKIE)?.value');
  expect(route).toContain('readPublicWebHistory(getSupabaseAdmin(), token)');
  expect(route).not.toContain('leadId');
 });
 it('requires same-origin, rate limiting and CAPTCHA before session creation',()=>{
  expect(route).toContain('origin === request.nextUrl.origin');
  expect(route).toContain("fetchSite === 'same-origin'");
  expect(route).toContain('checkKiaMessageRateLimit');
  expect(route).toContain('verifyRecaptchaToken');
  expect(route.indexOf('verifyRecaptchaToken')).toBeLessThan(route.lastIndexOf('ensurePublicWebSession('));
  expect(route).toContain('publicKiaCookieOptions(session.cookieMaxAge)');
 });
 it('never caches or creates sessions when retrieving history',()=>{
  expect(route).toContain("'Cache-Control', 'no-store, private'");
  const getBlock=route.split('export async function GET')[1].split('export async function POST')[0];
  expect(getBlock).not.toContain('ensurePublicWebSession');
  expect(getBlock).not.toContain('cookies.set(');
 });
});