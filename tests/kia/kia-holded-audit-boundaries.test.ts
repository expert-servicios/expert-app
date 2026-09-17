import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('audited Holded/KIA boundaries', () => {
  it('treats enabled permissions as the model-facing Holded permission map', () => {
    const context = source('lib/ai/kia/kia-context-builder.ts');
    expect(context).toContain(".select('status, permissions_detected, permissions_enabled')");
    expect(context).toContain('holdedPermissions: enabled');
    expect(context).toContain('holdedPermissionsDetected: detected');
    expect(context).toContain('holdedPermissionsEnabled: enabled');
    expect(context).toContain(".neq('status', 'revoked')");
    expect(context).toContain('integration?.permissions_enabled ?? legacyRequested');
    expect(context).toContain('laborEmployeesRead: false');
    expect(context).toContain('laborPayrollsRead: false');
    expect(context).toContain('intersectHoldedReadPermissions');
  });

  it('makes null the only global-account selector for Holded auth', () => {
    const auth = source('lib/integrations/holded/holded-auth.ts');
    expect(auth).toContain('if (integrationId === null) return getExpertAccountAuth()');
    expect(auth).toContain('const normalizedIntegrationId = integrationId.trim()');
    expect(auth).toContain("if (!normalizedIntegrationId)");
    expect(auth).toContain("data.provider !== 'holded'");
    expect(auth).not.toContain('if (!integrationId) return getExpertAccountAuth()');
  });

  it('requires separate labor-data authorization in admin Client 360', () => {
    const route = source('app/api/admin/clientes/[id]/holded/route.ts');
    const panel = source('app/(protected)/admin/clientes/[id]/integraciones/ClientHoldedAdminPanel.tsx');
    expect(route).toContain('laborReadAuthorized: z.boolean().default(false)');
    expect(route).toContain('intersectHoldedReadPermissions');
    expect(route).toContain("consent_version: 'admin-client-360-v2'");
    expect(panel).toContain('laborReadAuthorized: laborConsent');
    expect(panel).toContain('Datos laborales:');
    expect(panel).toContain('permissions_enabled');
  });

  it('keeps the legacy v1 Holded client read-only and concurrency-safe', () => {
    const client = source('lib/integrations/holded/holded-client.ts');
    expect(client).toContain("from './holded-permissions'");
    expect(client).toContain('export type { HoldedPermissions }');
    expect(client).toContain('let nextRequestAt = 0');
    expect(client).toContain('const reservedAt = Math.max(now, nextRequestAt)');
    expect(client).not.toContain("key: 'writeInbox', probe:");
    expect(client).toContain('createEmptyHoldedPermissions()');
  });
});
