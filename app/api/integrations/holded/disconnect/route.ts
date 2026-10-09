import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

const bodySchema = z.object({
  integrationId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'integrationId requerido' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    // Load the integration and verify ownership
    const { data: integration, error: fetchError } = await admin
      .from('client_integrations')
      .select('id,client_id,company_id,status,mode,api_version')
      .eq('id', parsed.data.integrationId)
      .single();

    if (fetchError || !integration) {
      return NextResponse.json({ error: 'Integración no encontrada' }, { status: 404 });
    }

    if (integration.status === 'revoked') {
      return NextResponse.json({ ok: true, message: 'Ya estaba desconectada' });
    }

    // Managed/v2 integrations are controlled from EXPERT Company 360.
    if (integration.mode === 'advisor_managed' || integration.mode === 'expert_account') {
      return NextResponse.json(
        { error: 'Esta integración Holded gestionada por EXPERT no puede modificarse desde el panel de cliente. Contacta con tu asesor para desconectarla.' },
        { status: 409 },
      );
    }

    const { data: profile } = await admin
      .from('profiles')
      .select('role,status')
      .eq('id', user.id)
      .single();
    const isInternalAdmin = profile?.status !== 'inactive'
      && (profile?.role === 'admin' || profile?.role === 'owner');

    let canManageCompany = false;
    if (integration.company_id) {
      const { data: membership } = await admin
        .from('profile_companies')
        .select('role')
        .eq('company_id', integration.company_id)
        .eq('profile_id', user.id)
        .maybeSingle();
      canManageCompany = ['owner', 'admin'].includes(String(membership?.role ?? ''));
    }

    const canManageLegacyOwned = !integration.company_id && integration.client_id === user.id;

    if (!canManageLegacyOwned && !canManageCompany && !isInternalAdmin) {
      return NextResponse.json(
        { error: 'Solo un propietario o administrador puede desconectar Holded.' },
        { status: 403 },
      );
    }

    // Delete the secret first (IMP-002: secret lives in a separate table)
    await admin
      .from('client_integration_secrets')
      .delete()
      .eq('integration_id', parsed.data.integrationId);

    // Revoke: mark as revoked (encrypted_api_key column no longer exists)
    const { error: updateError } = await admin
      .from('client_integrations')
      .update({
        status          : 'revoked',
        disconnected_at : new Date().toISOString(),
        updated_at      : new Date().toISOString(),
      })
      .eq('id', parsed.data.integrationId);

    if (updateError) {
      console.error('[holded/disconnect] update error:', updateError.message);
      return NextResponse.json({ error: 'Error al desconectar' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[holded/disconnect] unexpected error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
