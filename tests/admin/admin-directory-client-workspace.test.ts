import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('Admin 360 unified directory and delegated client workspace', () => {
  it('defines a single Directory 360 over profiles and companies', () => {
    const route = source('app/api/admin/directorio/route.ts');
    const page = source('app/(protected)/admin/directorio/page.tsx');

    expect(route).toContain(".from('profiles')");
    expect(route).toContain(".from('companies')");
    expect(route).toContain(".from('profile_companies')");
    expect(route).toContain(".from('client_integrations')");
    expect(page).toContain('Directorio 360');
    expect(page).toContain('Usuarios con acceso');
    expect(page).toContain('Empresas sin persona');
  });

  it('makes Directory 360 the canonical sidebar entry without deleting legacy routes', () => {
    const sidebar = source('components/admin/AdminSidebar.tsx');
    expect(sidebar).toContain('{ label: "Directorio 360", href: "/admin/directorio" }');
    expect(sidebar).not.toContain('{ label: "Clientes", href: "/admin/clientes" }');
    expect(sidebar).not.toContain('{ label: "Usuarios", href: "/admin/usuarios" }');
    expect(sidebar).not.toContain('{ label: "Empresas", href: "/admin/empresas" }');
  });

  it('uses delegated admin context instead of auth impersonation', () => {
    const portal = source('app/(protected)/admin/clientes/[id]/portal/page.tsx');
    const nav = source('app/(protected)/admin/clientes/[id]/ClientOperationsNav.tsx');

    expect(portal).toContain('Modo Admin · Vista cliente delegada');
    expect(portal).toContain('sigues autenticada como Admin');
    expect(portal).toContain('/api/admin/clientes/');
    expect(portal).not.toContain('signInWithPassword');
    expect(portal).not.toContain('admin.generateLink');
    expect(nav).toContain('/portal');
  });

  it('allows company-scoped Holded management without requiring a linked profile', () => {
    const route = source('app/api/admin/empresas/[id]/holded/route.ts');
    const panel = source('app/(protected)/admin/empresas/[id]/integraciones/CompanyHoldedAdminPanel.tsx');

    expect(route).toContain("entity: 'companies'");
    expect(route).toContain("company_id: companyId");
    expect(route).toContain("client_id: null");
    expect(route).toContain('encryptSecret');
    expect(route).toContain('client_integration_secrets');
    expect(route).toContain('laborReadAuthorized');
    expect(route).not.toContain(".from('profile_companies')");
    expect(panel).toContain('aunque no tenga usuario vinculado');
    expect(panel).toContain('Datos laborales:');
  });

  it('extends global search to people and companies', () => {
    const route = source('app/api/admin/search/route.ts');
    const widget = source('components/admin/GlobalSearch.tsx');

    expect(route).toContain("type: 'person'");
    expect(route).toContain("type: 'company'");
    expect(route).toContain(".from('companies')");
    expect(widget).toContain("company:");
    expect(widget).toContain('CIF/NIF');
  });

  it('documents that clients, users and companies are different concepts', () => {
    const plan = source('docs/admin-360-unified-directory-plan.md');
    expect(plan).toContain('Usuario / perfil');
    expect(plan).toContain('Cliente');
    expect(plan).toContain('Empresa / entidad');
    expect(plan).toContain('No se implementará suplantación real de Auth');
  });
});
