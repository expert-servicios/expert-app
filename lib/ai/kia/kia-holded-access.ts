import type { getSupabaseAdmin } from '@/lib/integrations/supabase';
import type { HoldedPermissions } from '@/lib/integrations/holded/holded-permissions';
import type { KiaContext } from './kia-context-builder';

export type KiaHoldedPermission = keyof HoldedPermissions;

type AdminClient = ReturnType<typeof getSupabaseAdmin>;

export interface KiaHoldedAccess {
  integrationId: string;
  companyId: string;
  permissionsDetected: Partial<HoldedPermissions>;
  permissionsEnabled: Partial<HoldedPermissions>;
}

export type KiaHoldedAccessResult =
  | { ok: true; access: KiaHoldedAccess }
  | { ok: false; error: string };

/**
 * Canonical KIA -> Holded access boundary.
 *
 * Security invariants:
 * - a company must already be resolved and authorized in KiaContext;
 * - integration lookup is always company-scoped (never client fallback);
 * - the integration must be active;
 * - optional capability checks use permissions_enabled, not merely detected;
 * - credentials are resolved later by integration id through holded-auth.
 */
export async function resolveKiaCompanyHoldedAccess(
  admin: AdminClient,
  context: KiaContext,
  requiredPermission?: KiaHoldedPermission,
): Promise<KiaHoldedAccessResult> {
  const companyId = context.company?.id ?? null;
  if (!companyId) {
    return { ok: false, error: 'No hay una empresa activa y autorizada en el contexto de KIA.' };
  }

  const { data, error } = await admin
    .from('client_integrations')
    .select('id, status, permissions_detected, permissions_enabled')
    .eq('provider', 'holded')
    .eq('company_id', companyId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return { ok: false, error: 'No se pudo comprobar la integración Holded de la empresa.' };
  }
  if (!data?.id) {
    return { ok: false, error: 'Holded no está conectado para la empresa activa.' };
  }

  const permissionsDetected = (data.permissions_detected ?? {}) as Partial<HoldedPermissions>;
  const permissionsEnabled = (data.permissions_enabled ?? {}) as Partial<HoldedPermissions>;

  if (requiredPermission && permissionsEnabled[requiredPermission] !== true) {
    return {
      ok: false,
      error: `La integración Holded no tiene habilitada la capacidad ${requiredPermission} para la empresa activa.`,
    };
  }

  return {
    ok: true,
    access: {
      integrationId: data.id as string,
      companyId,
      permissionsDetected,
      permissionsEnabled,
    },
  };
}
