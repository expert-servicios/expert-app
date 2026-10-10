import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { requireActiveActor } from '@/lib/auth/active-actor';
import { blockedRegistryUpdates } from '@/lib/companies/registry-locks';

const FORMA_JURIDICA = ['autonomo','sl','sa','slne','cb','cooperativa','fundacion','otra'] as const;

const updateSchema = z.object({
  razon_social:     z.string().min(2).max(200).optional(),
  nombre_comercial: z.string().max(200).optional().nullable(),
  cif_nif:          z.string().max(20).optional().nullable(),
  forma_juridica:   z.enum(FORMA_JURIDICA).optional(),
  direccion:        z.string().max(300).optional().nullable(),
  ciudad:           z.string().max(100).optional().nullable(),
  provincia:        z.string().max(100).optional().nullable(),
  codigo_postal:    z.string().max(10).optional().nullable(),
  pais:             z.string().length(2).optional(),
  telefono:         z.string().max(25).optional().nullable(),
  email:            z.string().email().optional().nullable().or(z.literal('')).transform(v => v || null),
  web:              z.string().max(200).optional().nullable()
}).refine(d => Object.keys(d).length > 0, { message: 'Envía al menos un campo' });

// PATCH /api/companies/[id] — update company (owner only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const actor = await requireActiveActor(request);
    if (!actor) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const body = await request.json();
    const parse = updateSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json({ error: parse.error.issues[0]?.message }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    // Verify ownership
    const { data: membership } = await admin
      .from('profile_companies')
      .select('role')
      .eq('company_id', id)
      .eq('profile_id', actor.userId)
      .single();

    if (membership?.role !== 'owner' && actor.role !== 'admin') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    const { data: currentCompany, error: lockLookupError } = await admin
      .from('companies')
      .select('registry_locked_fields')
      .eq('id', id)
      .maybeSingle();
    if (lockLookupError) return NextResponse.json({ error: 'No se pudo validar el origen registral' }, { status: 500 });

    const blocked = blockedRegistryUpdates(currentCompany?.registry_locked_fields, parse.data);
    if (blocked.length > 0) {
      return NextResponse.json({
        error: 'Estos datos proceden de una fuente registral oficial y no se pueden editar desde EXPERT.',
        code: 'registry_fields_locked',
        fields: blocked,
      }, { status: 409 });
    }

    const { data: company, error } = await admin
      .from('companies')
      .update({ ...parse.data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('[companies PATCH]', error);
      return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
    }

    return NextResponse.json({ company });
  } catch (err) {
    console.error('[companies PATCH]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
