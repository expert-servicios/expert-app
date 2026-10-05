import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { encryptSecret, keyLast4 } from '@/lib/security/encryption';
import { createHoldedV2ClientFromRawKey } from '@/lib/integrations/holded/holded-v2-client';
import { detectHoldedLaborPermissions } from '@/lib/integrations/holded/holded-labor-permissions';
import {
  createEmptyHoldedPermissions,
  intersectHoldedReadPermissions,
  normalizeDetectedHoldedPermissions,
  type HoldedPermissions,
} from '@/lib/integrations/holded/holded-permissions';
import {
  createHoldedGatewayForIntegration,
  listHoldedBankAccounts,
  listHoldedContacts,
  listHoldedDocuments,
} from '@/lib/integrations/holded/holded-gateway';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const COMPANY_ID = '188a1871-0ea8-4b11-adac-c9acc41c4a4b';

async function detect(rawToken: string) {
  const client = createHoldedV2ClientFromRawKey(rawToken);
  const permissions = createEmptyHoldedPermissions();
  const checks: Array<[keyof HoldedPermissions, () => Promise<unknown>]> = [
    ['contacts', () => client.listContacts({ limit: 1 })],
    ['salesInvoices', () => client.listInvoices({ limit: 1 })],
    ['purchaseInvoices', () => client.listPurchases({ limit: 1 })],
    ['taxes', () => client.listTaxes({ limit: 1 })],
    ['bankAccounts', () => client.listTreasuryAccounts({ limit: 1 })],
    ['accountingEntries', () => client.listLedgerEntries({ limit: 1 })],
  ];
  const settled = await Promise.all(checks.map(async ([permission, probe]) => {
    try {
      await probe();
      return [permission, true] as const;
    } catch {
      return [permission, false] as const;
    }
  }));
  for (const [permission, allowed] of settled) permissions[permission] = allowed;
  permissions.bankMovements = permissions.bankAccounts;

  const labor = await detectHoldedLaborPermissions(rawToken).catch(() => ({
    laborEmployeesRead: false,
    laborPayrollsRead: false,
    laborEmployeesWrite: false,
    laborPayrollsWrite: false,
  }));

  const detected = normalizeDetectedHoldedPermissions({ ...permissions, ...labor });
  const enabled = intersectHoldedReadPermissions(detected, {
    ...detected,
    laborEmployeesRead: false,
    laborPayrollsRead: false,
  });
  const coreReadOk = settled.some(([, allowed]) => allowed);
  return { detected, enabled, coreReadOk };
}

export async function GET(request: Request) {
  const deploymentHost = process.env.VERCEL_URL?.trim().toLowerCase();
  const requestHost = new URL(request.url).host.trim().toLowerCase();
  if (
    process.env.VERCEL_ENV !== 'production'
    || !deploymentHost
    || requestHost !== deploymentHost
  ) {
    return new NextResponse(null, { status: 404 });
  }

  const rawToken = process.env.HOLDED_DGM_API_TOKEN?.trim();
  if (!rawToken) {
    return NextResponse.json({ ok: false, stage: 'env', error: 'DGM token no disponible en Preview.' }, { status: 503 });
  }

  const admin = getSupabaseAdmin();
  const { data: company } = await admin
    .from('companies')
    .select('id,razon_social,cif_nif')
    .eq('id', COMPANY_ID)
    .maybeSingle();
  if (!company) {
    return NextResponse.json({ ok: false, stage: 'company', error: 'DGM no existe en EXPERT.' }, { status: 404 });
  }

  const { data: existing } = await admin
    .from('client_integrations')
    .select('id,mode,api_version,status,sync_mode,permissions_detected,permissions_enabled,last_success_at')
    .eq('provider', 'holded')
    .eq('company_id', COMPANY_ID)
    .neq('status', 'revoked')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    try {
      const gateway = await createHoldedGatewayForIntegration(existing.id);
      const checks = await Promise.allSettled([
        listHoldedContacts(gateway, { maxItems: 1 }),
        listHoldedDocuments(gateway, 'sales', { startDate: '2026-01-01', endDate: '2026-10-05', maxItems: 1 }),
        listHoldedDocuments(gateway, 'purchase', { startDate: '2026-01-01', endDate: '2026-10-05', maxItems: 1 }),
        listHoldedBankAccounts(gateway, 1),
      ]);
      return NextResponse.json({
        ok: true,
        alreadyConnected: true,
        integration: existing,
        canonicalRuntime: checks.map((r) => r.status === 'fulfilled'),
      });
    } catch (error) {
      return NextResponse.json({
        ok: false,
        stage: 'existing_runtime',
        error: error instanceof Error ? error.message : 'Error verificando integración existente.',
      }, { status: 502 });
    }
  }

  const detected = await detect(rawToken);
  if (!detected.coreReadOk) {
    return NextResponse.json({
      ok: false,
      stage: 'probe',
      error: 'El token v2 no permite leer ningún recurso contable básico.',
      permissions: detected.detected,
    }, { status: 422 });
  }

  const now = new Date().toISOString();
  const { data: integration, error: integrationError } = await admin
    .from('client_integrations')
    .insert({
      provider: 'holded',
      mode: 'advisor_managed',
      api_version: 'v2',
      company_id: COMPANY_ID,
      client_id: null,
      api_key_last4: keyLast4(rawToken),
      permissions_detected: detected.detected,
      permissions_enabled: detected.enabled,
      status: 'active',
      sync_mode: 'read_only',
      last_success_at: now,
      last_error: null,
      connected_by: null,
      consent_at: now,
      consent_version: 'admin-company-360-v2',
      channel: 'admin_company_360',
      disconnected_at: null,
      created_at: now,
      updated_at: now,
    })
    .select('id,mode,api_version,status,sync_mode,api_key_last4,permissions_detected,permissions_enabled,last_success_at')
    .single();

  if (integrationError || !integration) {
    return NextResponse.json({ ok: false, stage: 'integration_insert', error: integrationError?.message ?? 'No se pudo crear la integración.' }, { status: 500 });
  }

  let encrypted: string;
  try {
    encrypted = encryptSecret(rawToken);
  } catch (error) {
    await admin.from('client_integrations').delete().eq('id', integration.id);
    return NextResponse.json({
      ok: false,
      stage: 'encrypt',
      error: error instanceof Error ? error.message : 'No se pudo cifrar la credencial.',
    }, { status: 503 });
  }

  const { error: secretError } = await admin
    .from('client_integration_secrets')
    .insert({ integration_id: integration.id, encrypted_api_key: encrypted });

  if (secretError) {
    await admin.from('client_integrations').delete().eq('id', integration.id);
    return NextResponse.json({ ok: false, stage: 'secret_insert', error: secretError.message }, { status: 500 });
  }

  try {
    const gateway = await createHoldedGatewayForIntegration(integration.id);
    const checks = await Promise.allSettled([
      listHoldedContacts(gateway, { maxItems: 1 }),
      listHoldedDocuments(gateway, 'sales', { startDate: '2026-01-01', endDate: '2026-10-05', maxItems: 1 }),
      listHoldedDocuments(gateway, 'purchase', { startDate: '2026-01-01', endDate: '2026-10-05', maxItems: 1 }),
      listHoldedBankAccounts(gateway, 1),
    ]);
    const canonicalRuntime = checks.map((r) => r.status === 'fulfilled');

    if (!canonicalRuntime.some(Boolean)) {
      await admin.from('client_integration_secrets').delete().eq('integration_id', integration.id);
      await admin.from('client_integrations').delete().eq('id', integration.id);
      return NextResponse.json({ ok: false, stage: 'canonical_runtime', error: 'La credencial se guardó pero el gateway canónico no pudo leer Holded; se revirtió la migración.' }, { status: 502 });
    }

    const { data: controls } = await admin
      .from('company_operational_controls')
      .select('external_communication_blocked,portal_activation_blocked,accounting_write_blocked')
      .eq('company_id', COMPANY_ID)
      .maybeSingle();

    await admin.from('audit_logs').insert({
      actor_id: null,
      action: 'holded.admin_company_connected',
      entity: 'companies',
      entity_id: COMPANY_ID,
      metadata: {
        integration_id: integration.id,
        source: 'vercel_preview_canonical_migration',
        mode: 'advisor_managed',
        api_version: 'v2',
        sync_mode: 'read_only',
        labor_read_authorized: false,
      },
    }).then(() => {});

    return NextResponse.json({
      ok: true,
      alreadyConnected: false,
      integration,
      canonicalRuntime,
      controls,
    });
  } catch (error) {
    await admin.from('client_integration_secrets').delete().eq('integration_id', integration.id);
    await admin.from('client_integrations').delete().eq('id', integration.id);
    return NextResponse.json({
      ok: false,
      stage: 'canonical_runtime',
      error: error instanceof Error ? error.message : 'Fallo verificando el gateway canónico; migración revertida.',
    }, { status: 502 });
  }
}
