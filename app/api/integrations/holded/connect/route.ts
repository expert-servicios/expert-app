import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { encryptSecret, keyLast4 } from '@/lib/security/encryption';
import { isEncryptionConfigured } from '@/lib/integrations/holded/holded-client';
import { detectHoldedPermissions } from '@/lib/integrations/holded/holded-permission-probes';
import {
  intersectHoldedReadPermissions,
  normalizeDetectedHoldedPermissions,
  type HoldedPermissions,
} from '@/lib/integrations/holded/holded-permissions';
import { holdedErrorMessage } from '@/lib/integrations/holded/holded-errors';

const permissionsSchema = z.object({
  contacts: z.boolean().default(false),
  salesInvoices: z.boolean().default(false),
  purchaseInvoices: z.boolean().default(false),
  taxes: z.boolean().default(false),
  bankAccounts: z.boolean().default(false),
  bankMovements: z.boolean().default(false),
  inboxDocuments: z.boolean().default(false),
  writeInbox: z.literal(false).optional().default(false),
  accountingReports: z.boolean().default(false),
  accountingEntries: z.boolean().default(false),
  laborEmployeesRead: z.boolean().optional().default(false),
  laborPayrollsRead: z.boolean().optional().default(false),
  laborEmployeesWrite: z.literal(false).optional().default(false),
  laborPayrollsWrite: z.literal(false).optional().default(false),
}).strict();

const bodySchema = z.object({
  apiKey: z.string().min(8).max(256).trim(),
  companyId: z.string().uuid().optional(),
  apiVersion: z.enum(['v1','v2']).default('v2'),
  permissionsEnabled: permissionsSchema.optional(),
  consentVersion: z.string().max(20).optional().default('1.1'),
  consentAt: z.string().datetime().optional(),
}).strict();

const SAFE_COLUMNS = 'id,provider,mode,api_version,api_key_last4,permissions_detected,permissions_enabled,status,sync_mode,last_sync_at,last_success_at,last_error,consent_at,consent_version,created_at,updated_at';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (!isEncryptionConfigured()) {
      console.error('[holded/connect] SECRET_ENCRYPTION_KEY not configured — refusing connection');
      return NextResponse.json(
        { error: 'El servidor no está configurado para almacenar claves de forma segura. Contacta con el administrador.' },
        { status: 503 },
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'API key o permisos inválidos' }, { status: 400 });
    }

    const { apiKey, apiVersion, companyId: bodyCompanyId, permissionsEnabled, consentVersion, consentAt } = parsed.data;
    const admin = getSupabaseAdmin();

    const { data: profile } = await admin
      .from('profiles')
      .select('active_company_id')
      .eq('id', user.id)
      .single();

    const companyId = bodyCompanyId ?? profile?.active_company_id ?? null;
    if (!companyId) {
      return NextResponse.json({ error: 'Selecciona una empresa antes de conectar Holded' }, { status: 409 });
    }

    const { data: membership, error: membershipError } = await admin
      .from('profile_companies')
      .select('role')
      .eq('company_id', companyId)
      .eq('profile_id', user.id)
      .maybeSingle();

    if (membershipError) {
      console.error('[holded/connect] membership error:', membershipError.message);
      return NextResponse.json({ error: 'No se pudo comprobar el acceso a la empresa' }, { status: 500 });
    }
    if (!membership) {
      return NextResponse.json({ error: 'No tienes acceso a esta empresa' }, { status: 403 });
    }
    if (!['owner', 'admin'].includes(String(membership.role ?? ''))) {
      return NextResponse.json(
        { error: 'Solo un propietario o administrador de la empresa puede cambiar la conexión con Holded.' },
        { status: 403 },
      );
    }

    const existing = await admin
      .from('client_integrations')
      .select('id, client_id, mode, api_version')
      .eq('provider', 'holded')
      .eq('company_id', companyId)
      .neq('status', 'revoked')
      .maybeSingle();

    if (existing.error) {
      console.error('[holded/connect] existing integration error:', existing.error.message);
      return NextResponse.json({ error: 'No se pudo comprobar la integración actual' }, { status: 500 });
    }
    if (existing.data && (existing.data.mode === 'advisor_managed' || existing.data.mode === 'expert_account')) {
      return NextResponse.json(
        { error: 'Esta integración Holded v2/gestionada se administra desde EXPERT. Contacta con tu asesor para modificarla.' },
        { status: 409 },
      );
    }

    let testResult;
    try {
      testResult = await detectHoldedPermissions(apiKey, apiVersion);
    } catch (err) {
      return NextResponse.json({ error: `No se pudo verificar Holded: ${holdedErrorMessage(err)}` }, { status: 502 });
    }

    if (!testResult.ok) {
      return NextResponse.json(
        { error: 'La API key de Holded no es válida o no tiene permisos suficientes', warnings: testResult.warnings },
        { status: 422 },
      );
    }

    const detectedPermissions = normalizeDetectedHoldedPermissions(testResult.permissions);

    const requestedPermissions: Partial<HoldedPermissions> = apiVersion === 'v2' ? {
      ...detectedPermissions,
      laborEmployeesRead: permissionsEnabled?.laborEmployeesRead === true,
      laborPayrollsRead: permissionsEnabled?.laborPayrollsRead === true,
    } : permissionsEnabled ?? {
      ...detectedPermissions,
      laborEmployeesRead: false,
      laborPayrollsRead: false,
    };
    const enabledPermissions = intersectHoldedReadPermissions(detectedPermissions, requestedPermissions);

    const encryptedApiKey = encryptSecret(apiKey);
    const last4 = keyLast4(apiKey);

    const now = new Date().toISOString();
    const upsertPayload = {
      provider: 'holded',
      mode: 'client_account',
      api_version: apiVersion,
      api_key_last4: last4,
      permissions_detected: detectedPermissions,
      permissions_enabled: enabledPermissions,
      consent_at: consentAt ?? now,
      consent_version: apiVersion === 'v2' ? 'client-token-v2-scopes' : (consentVersion ?? '1.1'),
      status: 'active',
      sync_mode: 'read_only',
      last_success_at: now,
      last_error: null,
      connected_by: user.id,
      disconnected_at: null,
      updated_at: now,
      company_id: companyId,
      // Company-scoped membership is the authorization boundary. Do not grant
      // durable direct ownership to whichever member happens to reconnect it.
      client_id: existing.data?.client_id ?? null,
    };

    if (existing.data?.id) {
      const { data: previousSecret } = await admin
        .from('client_integration_secrets')
        .select('encrypted_api_key')
        .eq('integration_id', existing.data.id)
        .maybeSingle();

      const { error: secretError } = await admin
        .from('client_integration_secrets')
        .upsert({ integration_id: existing.data.id, encrypted_api_key: encryptedApiKey, updated_at: now });

      if (secretError) {
        console.error('[holded/connect] secret upsert error:', secretError.message);
        return NextResponse.json({ error: 'Error guardando credencial segura' }, { status: 500 });
      }

      const { data: updated, error: updateError } = await admin
        .from('client_integrations')
        .update(upsertPayload)
        .eq('id', existing.data.id)
        .select(SAFE_COLUMNS)
        .single();

      if (updateError || !updated) {
        const rollback = previousSecret?.encrypted_api_key
          ? await admin.from('client_integration_secrets').upsert({
              integration_id: existing.data.id,
              encrypted_api_key: previousSecret.encrypted_api_key,
              updated_at: now,
            })
          : await admin.from('client_integration_secrets').delete().eq('integration_id', existing.data.id);
        if (rollback.error) console.error('[holded/connect] CRITICAL secret rollback error:', rollback.error.message);
        console.error('[holded/connect] update error:', updateError?.message);
        return NextResponse.json({ error: 'Error actualizando integración' }, { status: 500 });
      }

      return NextResponse.json({ ok: true, integration: updated, warnings: testResult.warnings });
    }

    const { data: inserted, error: insertError } = await admin
      .from('client_integrations')
      .insert({ ...upsertPayload, created_at: now })
      .select(SAFE_COLUMNS)
      .single();

    if (insertError || !inserted) {
      console.error('[holded/connect] insert error:', insertError?.message);
      return NextResponse.json({ error: 'Error guardando integración' }, { status: 500 });
    }

    const { error: secretError } = await admin
      .from('client_integration_secrets')
      .insert({ integration_id: inserted.id, encrypted_api_key: encryptedApiKey });

    if (secretError) {
      console.error('[holded/connect] secret insert error:', secretError.message);
      await admin.from('client_integrations').delete().eq('id', inserted.id);
      return NextResponse.json({ error: 'Error guardando credencial segura' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, integration: inserted, warnings: testResult.warnings });
  } catch (err) {
    console.error('[holded/connect] unexpected error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
