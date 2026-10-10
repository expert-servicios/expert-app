import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { isWorkspaceRouteActive } from '../../components/workspace/workspaceRouteMatch';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('Kiranism-inspired shared EXPERT Workspace shell', () => {
  it('selects exactly one active nav item for similar routes', () => {
    expect(isWorkspaceRouteActive('/admin/kia-health', '/admin/kia')).toBe(false);
    expect(isWorkspaceRouteActive('/admin/kia-health', '/admin/kia-health')).toBe(true);
    expect(isWorkspaceRouteActive('/admin/kia-health/details', '/admin/kia-health')).toBe(true);
    expect(isWorkspaceRouteActive('/dashboard', '/dashboard', true)).toBe(true);
    expect(isWorkspaceRouteActive('/dashboard/servicios', '/dashboard', true)).toBe(false);
    expect(isWorkspaceRouteActive('/dashboard/servicios-extra', '/dashboard/servicios')).toBe(false);
  });

  it('keeps client component directives before imports to avoid Next.js build failures', () => {
    const adminNav = source('components/admin/AdminSidebar.tsx');
    const clientNav = source('components/dashboard/DashboardNav.tsx');
    expect(adminNav.trimStart().startsWith('"use client";')).toBe(true);
    expect(clientNav.trimStart().startsWith("'use client';")).toBe(true);
  });

  it('uses the same frame for Admin and Client but distinct auth and data loaders', () => {
    const admin = source('app/(protected)/admin/layout.tsx');
    const client = source('app/(protected)/dashboard/layout.tsx');
    expect(admin).toContain('<WorkspaceFrame');
    expect(admin).toContain('area="admin"');
    expect(client).toContain('<WorkspaceFrame');
    expect(client).toContain('area="client"');
    expect(admin).toContain("profile?.role !== 'admin'");
    expect(client).toContain("fetchWithCookies('/api/companies')");
  });

  it('reuses branding and navigation without exposing admin links to clients', () => {
    const client = source('components/dashboard/DashboardNav.tsx');
    const admin = source('components/admin/AdminSidebar.tsx');
    expect(client).toContain('<WorkspaceBrand area="client"');
    expect(client).toContain('<WorkspaceNavLink');
    expect(admin).toContain('<WorkspaceBrand area="admin"');
    expect(admin).toContain('<WorkspaceNavLink');
    expect(client).not.toContain('href: "/admin/directorio"');
  });

  it('keeps the dock, admin alerts, company selection and client mobile navigation intact', () => {
    const admin = source('app/(protected)/admin/layout.tsx');
    const client = source('app/(protected)/dashboard/layout.tsx');
    expect(admin).toContain('AdminRightPanel');
    expect(admin).toContain('AdminMobileNav');
    expect(client).not.toContain('CompanySwitcher');
    expect(client).toContain('DashboardNav');
    expect(client).toContain('MobileNav');
  });

  it('keeps common visuals presentational only', () => {
    const frame = source('components/workspace/WorkspaceFrame.tsx');
    const nav = source('components/workspace/WorkspaceNavLink.tsx');
    expect(frame).not.toContain('getSupabaseAdmin');
    expect(nav).not.toContain('service_role');
    expect(frame).toContain('data-workspace-area={area}');
  });
});
