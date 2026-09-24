import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const route = source('app/api/admin/rgpd-reviews/[id]/route.ts');
const page = source('app/(protected)/admin/rgpd-revisiones/[id]/page.tsx');

describe('Admin RGPD review detail', () => {
  it('requires the shared admin guard', () => {
    expect(route).toContain("import { requireAdminClient } from '@/lib/auth/require-admin'");
    expect(route).toContain('await requireAdminClient(request)');
  });

  it('loads exactly one saved snapshot without mutation methods', () => {
    expect(route).toContain(".eq('id', id)");
    expect(route).toContain('.maybeSingle()');
    expect(route).not.toContain('export async function PATCH');
    expect(route).not.toContain('export async function DELETE');
  });

  it('renders the snapshot as read-only sections', () => {
    expect(page).toContain('Snapshot de solo lectura');
    expect(page).toContain('Perfil de empresa');
    expect(page).toContain('Tratamientos');
    expect(page).toContain('Proveedores y transferencias');
    expect(page).toContain('Conservación');
    expect(page).toContain('nunca reescribir el snapshot original');
  });
});
