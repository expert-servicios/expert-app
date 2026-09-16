import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { encryptSecret, keyLast4 } from '@/lib/security/encryption';
import { isEncryptionConfigured, createHoldedClientFromRawKey } from '@/lib/integrations/holded/holded-client';
import { detectHoldedLaborPermissions } from '@/lib/integrations/holded/holded-labor-permissions';
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
  permissionsEnabled: permissionsSchema.optional(),
  consentVersion: z.string().max(20).optional().default('1.1'),
  consentAt: z.string().datetime().optional(),
}).strict();

const SAFE_COLUMNS = 'id,provider,mode,api_key_last4,permissions_detected,permissions_enabled,status,sync_mode,last_sync_at,last_success_at,last_error,consent_at,consent_version,created_at,updated_at';

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

    const { apiKey, companyId: bodyCompanyId, permissionsEnabled, consentVersion, consentAt } = parsed.data;
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

    const client = createHoldedClientFromRawKey(apiKey);
    let testResult;
    let laborPermissions;
    try {
      [testResult, laborPermissions] = await Promise.all([
        client.testConnection(),
        detectHoldedLaborPermissions(apiKey),
      ]);
    } catch (err) {
      return NextResponse.json(
        { error: `No se pudo conectar con Holded: ${holdedErrorMessage(err)}` },
        { status: 502 },
      );
    }

    if (!testResult.ok) {
      return NextResponse.json(
        { error: 'La API key de Holded no es válida o no tiene permisos suficientes', warnings: testResult.warnings },
        { status: 422 },
      );
    }

    const detectedPermissions = normalizeDetectedHoldedPermissions({
      ...testResult.permissions,
      ...laborPermissions,
    } as Partial<HoldedPermissions>);

    const requestedPermissions: Partial<HoldedPermissions> = permissionsEnabled ?? {
      ...detectedPermissions,
      laborEmployeesRead: false,
      laborPayrollsRead: false,
    };
    const enabledPermissions = intersectHoldedReadPermissions(detectedPermissions, requestedPermissions);

    const encryptedApiKey = encryptSecret(apiKey);
    const last4 = keyLast4(apiKey);

    const existing = await admin
      .from('client_integrations')
      .select('id, client_id')
      .eq('provider', 'holded')
      .eq('company_id', companyId)
      .neq('status', 'revoked')
      .maybeSingle();

    const now = new Date().toISOString();
    const upsertPayload = {
      provider: 'holded',
      mode: 'client_account',
      api_key_last4: last4,
      permissions_detected: detectedPermissions,
      permissions_enabled: enabledPermissions,
      consent_at: consentAt ?? now,
      consent_version: consentVersion ?? '1.1',
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
