import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const page = readFileSync(
  'app/(protected)/dashboard/integraciones/holded/page.tsx',
  'utf8',
);
const card = readFileSync(
  'components/integrations/HoldedConnectionCard.tsx',
  'utf8',
);

describe('Holded company member UI permissions', () => {
  it('derives a canManage flag from company membership role', () => {
    expect(page).toContain(".select('company_id,role')");
    expect(page).toContain("['owner', 'admin'].includes(String(membership.role ?? ''))");
    expect(page).toContain('canManage={canManageHolded}');
  });

  it('renders mutation controls only for members who can manage the integration', () => {
    expect(card).toContain('canManage  ?: boolean');
    expect(card).toContain('canManage = true');
    expect(card).toContain('!isManagedByExpert && canManage');
    expect(card).toContain('if (!canManage)');
    expect(card).toContain('solo un propietario o administrador de la empresa puede conectar, reconectar o desconectar Holded');
  });
});
