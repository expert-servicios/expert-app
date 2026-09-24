import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const route = source('app/api/admin/rgpd-reviews/route.ts');
const page = source('app/(protected)/admin/rgpd-revisiones/page.tsx');
const sidebar = source('components/admin/AdminSidebar.tsx');

describe('Admin RGPD review queue', () => {
  it('requires the shared admin guard', () => {
    expect(route).toContain("import { requireAdminClient } from '@/lib/auth/require-admin'");
    expect(route).toContain('await requireAdminClient(request)');
  });

  it('is a read-only queue endpoint', () => {
    expect(route).toContain('export async function GET');
    expect(route).not.toContain('export async function POST');
    expect(route).not.toContain('export async function PATCH');
    expect(route).not.toContain('export async function DELETE');
  });

  it('returns only a summary instead of the full saved payload', () => {
    expect(route).toContain('summary: {');
    expect(route).toContain('treatment_count');
    expect(route).toContain('provider_count');
    expect(route).not.toContain('payload: project.payload');
  });

  it('renders the protected admin page and navigation link', () => {
    expect(page).toContain('Revisiones RGPD');
    expect(page).toContain('/api/admin/rgpd-reviews');
    expect(sidebar).toContain('/admin/rgpd-revisiones');
  });
});
