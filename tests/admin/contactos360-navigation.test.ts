import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(path, 'utf8');

describe('Contactos 360 navigation consolidation', () => {
  it('connects existing directory and lead views without replacing their APIs', () => {
    const nav = read('components/admin/Contactos360Navigation.tsx');
    expect(nav).toContain("href: '/admin/directorio'");
    expect(nav).toContain("href: '/admin/leads'");
    expect(nav).toContain("aria-current={active ? 'page' : undefined}");
    expect(read('app/(protected)/admin/directorio/page.tsx')).toContain('<Contactos360Navigation section="directory" />');
    expect(read('app/(protected)/admin/leads/page.tsx')).toContain('<Contactos360Navigation section="leads" />');
  });
  it('keeps server authorization and distinct person/company data stores', () => {
    const directory = read('app/api/admin/directorio/route.ts');
    expect(directory).toContain('supabase.auth.getUser()');
    expect(directory).toContain("['admin', 'owner'].includes(profile.role)");
    expect(directory).toContain(".from('profiles')");
    expect(directory).toContain(".from('companies')");
    expect(directory).toContain(".from('profile_companies')");
    expect(read('components/admin/AdminSidebar.tsx')).toContain('{ label: "Contactos 360", href: "/admin/directorio" }');
  });
});
