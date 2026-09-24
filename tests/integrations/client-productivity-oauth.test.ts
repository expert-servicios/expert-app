import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

describe('client productivity integrations', () => {
  const state = source('lib/auth/oauth-state.ts');
  const googleStart = source('app/api/auth/productivity/google/route.ts');
  const microsoftStart = source('app/api/auth/productivity/microsoft/route.ts');
  const googleCallback = source('app/api/auth/google-calendar/callback/route.ts');
  const microsoftCallback = source('app/api/auth/ms365/callback/route.ts');
  const storage = source('lib/integrations/productivity/client-productivity-oauth.ts');
  const page = source('app/(protected)/dashboard/integraciones/productividad/page.tsx');
  const docs = source('lib/utils/docs.ts');
  const proxy = source('proxy.ts');

  it('binds OAuth state to an authenticated client and exact entity', () => {
    expect(state).toContain("purpose?: 'default' | 'client_productivity'");
    expect(state).toContain('companyId?: string | null');
    expect(googleStart).toContain('assertClientCompanyMembership(user.id, companyId)');
    expect(microsoftStart).toContain('assertClientCompanyMembership(user.id, companyId)');
    expect(googleStart).toContain("purpose: 'client_productivity'");
    expect(microsoftStart).toContain("purpose: 'client_productivity'");
  });

  it('stores client credentials only through encrypted integration storage', () => {
    expect(storage).toContain("from('client_integration_secrets')");
    expect(storage).toContain('encryptSecret(JSON.stringify');
    expect(storage).toContain("'google_workspace'");
    expect(storage).toContain("'microsoft_365'");
    expect(googleCallback).toContain('saveClientProductivityIntegration');
    expect(microsoftCallback).toContain('saveClientProductivityIntegration');
    expect(googleCallback).not.toContain("from('gmail_tokens')");
    expect(microsoftCallback).toContain("from('ms365_tokens')");
    expect(microsoftCallback).toContain("oauthState.purpose === 'client_productivity'");
  });

  it('keeps the existing staff Microsoft mailbox flow separate', () => {
    expect(microsoftCallback).toContain("profile?.role !== 'admin'");
    expect(microsoftCallback).toContain("id: 'admin'");
    expect(microsoftCallback).toContain("oauthState.purpose !== 'client_productivity'");
  });

  it('offers direct Google and Microsoft connection links per company', () => {
    expect(page).toContain('/api/auth/productivity/google');
    expect(page).toContain('/api/auth/productivity/microsoft');
    expect(page).toContain('companyId=');
    expect(page).toContain('/docs/conectar-google-workspace-expert');
    expect(page).toContain('/docs/conectar-microsoft-365-expert');
  });

  it('publishes both public knowledge guides with direct connection URLs', () => {
    expect(docs).toContain("slug: 'conectar-google-workspace-expert'");
    expect(docs).toContain("slug: 'conectar-microsoft-365-expert'");
    expect(docs).toContain('https://expertconsulting.es/dashboard/integraciones/productividad?provider=google');
    expect(docs).toContain('https://expertconsulting.es/dashboard/integraciones/productividad?provider=microsoft');
  });

  it('preserves provider query parameters through protected-route login', () => {
    expect(proxy).toContain('request.nextUrl.search');
  });
});