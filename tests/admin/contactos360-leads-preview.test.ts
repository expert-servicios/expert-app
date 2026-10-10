import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
const api=readFileSync('app/api/admin/directorio/route.ts','utf8');
const page=readFileSync('app/(protected)/admin/directorio/page.tsx','utf8');
describe('Contactos 360 read-only lead preview',()=>{
  it('keeps leads separate and does not construct portal users or identities',()=>{
    expect(api).toContain("kind: 'lead'");
    expect(api).toContain("hasPortalAccess: false");
    expect(api).toContain("isClient: false");
    expect(api).toContain('/admin/leads?focus=');
    expect(api).not.toContain("auth.admin.createUser");
  });
  it('caps the preview and warns when more leads might exist',()=>{
    expect(api).toContain('.limit(200)');
    expect(api).toContain('leadsPreviewLimited: leads.length === 200');
    expect(page).toContain('data.summary.leadsPreviewLimited');
    expect(page).toContain('/admin/leads?segment=all');
    expect(page).toContain("filter === 'leads'");
  });
  it('retains admin-only authorization',()=>{
    expect(api).toContain('supabase.auth.getUser()');
    expect(api).toContain("['admin', 'owner'].includes(profile.role)");
  });
});
