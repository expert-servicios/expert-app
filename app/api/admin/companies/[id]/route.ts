import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { z } from 'zod';
import { blockedRegistryUpdates } from '@/lib/companies/registry-locks';

const LEGAL_FORMS = ['autonomo', 'sl', 'sa', 'slne', 'cb', 'cooperativa', 'fundacion', 'otra'] as const;

async function requireAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  return (profile?.role === 'admin' || profile?.role === 'owner') ? admin : null;
}

const patchSchema = z.object({
  razon_social:   z.string().min(1).max(200).optional(),
  cif_nif:        z.string().max(20).optional(),
  forma_juridica: z.enum(LEGAL_FORMS).optional(),
  email:          z.string().email().optional().or(z.literal('')),
  phone:          z.string().max(30).optional(),
  ciudad:         z.string().max(100).optional(),
  direccion:      z.string().max(300).optional(),
  stripe_customer_id: z.string().max(120).optional().nullable(),
  status:         z.enum(['active', 'inactive']).optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 });
    }

    const { data: currentCompany, error: lockLookupError } = await admin
      .from('companies')
      .select('registry_locked_fields')
      .eq('id', id)
      .maybeSingle();
    if (lockLookupError) return NextResponse.json({ error: lockLookupError.message }, { status: 500 });

    const blocked = blockedRegistryUpdates(currentCompany?.registry_locked_fields, parsed.data);
    if (blocked.length > 0) {
      return NextResponse.json({
        error: 'Los datos registrales oficiales son de solo lectura. Para modificarlos debe tramitarse el cambio societario/registral correspondiente.',
        code: 'registry_fields_locked',
        fields: blocked,
      }, { status: 409 });
    }

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const [k, v] of Object.entries(parsed.data)) {
      if (v === undefined) continue;
      update[k === 'phone' ? 'telefono' : k] = v === '' ? null : v;
    }

    const { data, error } = await admin
      .from('companies')
      .update(update)
      .eq('id', id)
      .select('id, razon_social, cif_nif, forma_juridica, ciudad, email, telefono, stripe_customer_id, status')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, company: data ? { ...data, phone: data.telefono } : data });
  } catch (err) {
    console.error('[admin/companies PATCH]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const { id } = await params;

    // Keep historical links/mappings intact. Synchronized companies are soft-deleted.
    await admin.from('profiles').update({ active_company_id: null }).eq('active_company_id', id);

    const { error } = await admin
      .from('companies')
      .update({ status: 'inactive', updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin/companies DELETE]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
