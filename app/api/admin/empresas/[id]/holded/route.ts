import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { isStaffRole } from '@/lib/auth/roles';
import { encryptSecret, decryptSecret, keyLast4 } from '@/lib/security/encryption';
import { createHoldedClientFromRawKey, isEncryptionConfigured } from '@/lib/integrations/holded/holded-client';
import { detectHoldedLaborPermissions } from '@/lib/integrations/holded/holded-labor-permissions';
import {
  intersectHoldedReadPermissions,
  normalizeDetectedHoldedPermissions,
  type HoldedPermissions,
} from '@/lib/integrations/holded/holded-permissions';
import { holdedErrorMessage } from '@/lib/integrations/holded/holded-errors';

const bodySchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('connect'),
    apiKey: z.string().trim().min(8).max(256),
    consentConfirmed: z.literal(true),
    laborReadAuthorized: z.boolean().default(false),
  }).strict(),
  z.object({ action: z.literal('test_stored') }).strict(),
  z.object({ action: z.literal('disconnect') }).strict(),
]);

const SAFE_COLUMNS = 'id,client_id,company_id,provider,mode,api_key_last4,permissions_detected,permissions_enabled,status,sync_mode,last_sync_at,last_success_at,last_error,consent_at,consent_version,created_at,updated_at,channel';

async function requireStaff(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from('profiles')
    .select('role,status')
    .eq('id', user.id)
    .single();

  if (!profile || profile.status === 'inactive' || !isStaffRole(profile.role)) return null;
  return { admin, actorId: user.id };
}

async function getCompany(admin: ReturnType<typeof getSupabaseAdmin>, companyId: string) {
  const { data, error } = await admin
    .from('companies')
    .select('id,razon_social,nombre_comercial,cif_nif,status')
    .eq('id', companyId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function getIntegration(admin: ReturnType<typeof getSupabaseAdmin>, companyId: string) {
  const { data, error } = await admin
    .from('client_integrations')
    .select(SAFE_COLUMNS)
    .eq('provider', 'holded')
    .eq('company_id', companyId)
    .neq('status', 'revoked')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function detectAllPermissions(rawApiKey: string) {
  const client = createHoldedClientFromRawKey(rawApiKey);
  const [testResult, laborPermissions] = await Promise.all([
    client.testConnection(),
    detectHoldedLaborPermissions(rawApiKey),
  ]);
  return {
    ...testResult,
    permissions: normalizeDetectedHoldedPermissions({
      ...testResult.permissions,
      ...laborPermissions,
    } as Partial<HoldedPermissions>),
  };
}

function legacySafeRequestedPermissions(
  detected: HoldedPermissions,
  enabled: Record<string, boolean> | null | undefined,
): Partial<HoldedPermissions> {
  if (enabled) return enabled as Partial<HoldedPermissions>;
  return { ...detected, laborEmployeesRead: false, laborPayrollsRead: false };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireStaff(request);
    if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const { id: companyId } = await params;
    if (!z.string().uuid().safeParse(companyId).success) {
      return NextResponse.json({ error: 'companyId inválido' }, { status: 400 });
    }

    const company = await getCompany(auth.admin, companyId);
    if (!company) return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });

    return NextResponse.json({
      company: {
        ...company,
        name: company.nombre_comercial ?? company.razon_social ?? company.cif_nif ?? company.id,
        nif: company.cif_nif,
      },
      integration: await getIntegration(auth.admin, companyId),
    });
  } catch (error) {
    console.error('[admin/company/holded GET]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireStaff(request);
    if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const { id: companyId } = await params;
    if (!z.string().uuid().safeParse(companyId).success) {
      return NextResponse.json({ error: 'companyId inválido' }, { status: 400 });
    }

    const company = await getCompany(auth.admin, companyId);
    if (!company) return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });

    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });

    const { admin, actorId } = auth;

    if (parsed.data.action === 'connect') {
      if (!isEncryptionConfigured()) {
        return NextResponse.json({ error: 'Cifrado de credenciales no configurado' }, { status: 503 });
      }

      let testResult;
      try {
        testResult = await detectAllPermissions(parsed.data.apiKey);
      } catch (error) {
        return NextResponse.json(
          { error: `No se pudo conectar con Holded: ${holdedErrorMessage(error)}` },
          { status: 502 },
        );
      }

      if (!testResult.ok) {
        return NextResponse.json(
          {
            error: 'La API key de Holded no es válida o no tiene permisos suficientes',
            warnings: testResult.warnings,
          },
          { status: 422 },
        );
      }

      const now = new Date().toISOString();
      const encryptedApiKey = encryptSecret(parsed.data.apiKey);
      const existing = await getIntegration(admin, companyId);
      const enabledPermissions = intersectHoldedReadPermissions(testResult.permissions, {
        ...testResult.permissions,
        laborEmployeesRead: parsed.data.laborReadAuthorized,
        laborPayrollsRead: parsed.data.laborReadAuthorized,
      });

      const payload = {
        provider: 'holded',
        mode: 'client_account',
        company_id: companyId,
        api_key_last4: keyLast4(parsed.data.apiKey),
        permissions_detected: testResult.permissions,
        permissions_enabled: enabledPermissions,
        status: 'active',
        sync_mode: 'read_only',
        last_success_at: now,
        last_error: null,
        connected_by: actorId,
        consent_at: now,
        consent_version: 'admin-company-360-v1',
        channel: 'admin_company_360',
        disconnected_at: null,
        updated_at: now,
      };

      let integration;
      if (existing?.id) {
        const { data: previousSecret } = await admin
          .from('client_integration_secrets')
          .select('encrypted_api_key')
          .eq('integration_id', existing.id)
          .maybeSingle();

        const { error: secretError } = await admin
          .from('client_integration_secrets')
          .upsert({
            integration_id: existing.id,
            encrypted_api_key: encryptedApiKey,
            updated_at: now,
          });

        if (secretError) {
          return NextResponse.json({ error: 'No se pudo guardar la credencial cifrada' }, { status: 500 });
        }

        const { data, error } = await admin
          .from('client_integrations')
          .update({ ...payload, client_id: existing.client_id ?? null })
          .eq('id', existing.id)
          .select(SAFE_COLUMNS)
          .single();

        if (error || !data) {
          const rollback = previousSecret?.encrypted_api_key
            ? await admin.from('client_integration_secrets').upsert({
                integration_id: existing.id,
                encrypted_api_key: previousSecret.encrypted_api_key,
                updated_at: now,
              })
            : await admin.from('client_integration_secrets').delete().eq('integration_id', existing.id);

          if (rollback.error) {
            console.error('[admin/company/holded] CRITICAL secret rollback error:', rollback.error.message);
          }
          return NextResponse.json({ error: 'No se pudo actualizar la integración' }, { status: 500 });
        }
        integration = data;
      } else {
        const { data, error } = await admin
          .from('client_integrations')
          .insert({ ...payload, client_id: null, created_at: now })
          .select(SAFE_COLUMNS)
          .single();

        if (error || !data) {
          return NextResponse.json({ error: 'No se pudo crear la integración' }, { status: 500 });
        }

        const { error: secretError } = await admin
          .from('client_integration_secrets')
          .insert({ integration_id: data.id, encrypted_api_key: encryptedApiKey });

        if (secretError) {
          await admin.from('client_integrations').delete().eq('id', data.id);
          return NextResponse.json({ error: 'No se pudo guardar la credencial cifrada' }, { status: 500 });
        }
        integration = data;
      }

      await admin.from('audit_logs').insert({
        actor_id: actorId,
        action: 'holded.admin_company_connected',
        entity: 'companies',
        entity_id: companyId,
        metadata: {
          integration_id: integration.id,
          sync_mode: 'read_only',
          labor_read_authorized: parsed.data.laborReadAuthorized,
        },
      }).then(() => {});

      return NextResponse.json({ ok: true, integration, warnings: testResult.warnings });
    }

    const integration = await getIntegration(admin, companyId);
    if (!integration) {
      return NextResponse.json(
        { error: 'No existe una integración Holded activa para esta empresa' },
        { status: 404 },
      );
    }

    if (parsed.data.action === 'disconnect') {
      await admin.from('client_integration_secrets').delete().eq('integration_id', integration.id);
      const now = new Date().toISOString();
      const { data, error } = await admin
        .from('client_integrations')
        .update({ status: 'revoked', disconnected_at: now, updated_at: now })
        .eq('id', integration.id)
        .select(SAFE_COLUMNS)
        .single();

      if (error) {
        return NextResponse.json({ error: 'No se pudo desconectar Holded' }, { status: 500 });
      }

      await admin.from('audit_logs').insert({
        actor_id: actorId,
        action: 'holded.admin_company_disconnected',
        entity: 'companies',
        entity_id: companyId,
        metadata: { integration_id: integration.id },
      }).then(() => {});

      return NextResponse.json({ ok: true, integration: data });
    }

    const { data: secret, error: secretError } = await admin
      .from('client_integration_secrets')
      .select('encrypted_api_key')
      .eq('integration_id', integration.id)
      .maybeSingle();

    if (secretError || !secret?.encrypted_api_key) {
      return NextResponse.json({ error: 'No se encontró la credencial cifrada de Holded' }, { status: 409 });
    }

    let result;
    try {
      const rawApiKey = decryptSecret(secret.encrypted_api_key);
      result = await detectAllPermissions(rawApiKey);
    } catch (error) {
      const message = holdedErrorMessage(error);
      await admin
        .from('client_integrations')
        .update({ last_error: message, updated_at: new Date().toISOString() })
        .eq('id', integration.id);
      return NextResponse.json({ ok: false, error: message }, { status: 502 });
    }

    const now = new Date().toISOString();
    const enabledPermissions = intersectHoldedReadPermissions(
      result.permissions,
      legacySafeRequestedPermissions(
        result.permissions,
        integration.permissions_enabled as Record<string, boolean> | null | undefined,
      ),
    );

    const { data: updated } = await admin
      .from('client_integrations')
      .update({
        permissions_detected: result.permissions,
        permissions_enabled: enabledPermissions,
        last_success_at: result.ok ? now : integration.last_success_at,
        last_error: result.ok ? null : result.warnings.join('; '),
        updated_at: now,
      })
      .eq('id', integration.id)
      .select(SAFE_COLUMNS)
      .single();

    return NextResponse.json({
      ok: result.ok,
      integration: updated ?? integration,
      permissions: result.permissions,
      warnings: result.warnings,
    });
  } catch (error) {
    console.error('[admin/company/holded POST]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
