import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

const LEGACY_STATES = [
  'nuevo',
  'docs_pendientes',
  'docs_recibidos',
  'en_tramitacion',
  'pendiente_externo',
  'resolucion_recibida',
  'entregado',
  'finalizado',
  'pendiente_documentacion',
  'en_revision',
  'en_proceso',
  'presentado',
] as const;

const caseUpdateSchema = z.object({
  state: z.enum(LEGACY_STATES).optional(),
  admin_note: z.string().max(2000).optional(),
  docs_checklist: z.array(z.string()).optional(),
}).strict();

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const sessionSupabase = createServerSupabaseClient(request);
    const { data: { user }, error: authError } = await sessionSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const admin = getSupabaseAdmin();
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || (profile?.role !== 'admin' && profile?.role !== 'owner')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const parseResult = caseUpdateSchema.safeParse(await request.json());
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 },
      );
    }

    const { state, admin_note, docs_checklist } = parseResult.data;

    if (state !== undefined) {
      return NextResponse.json(
        {
          error: 'El campo state es legado y ya no admite escrituras. Usa el workflow canónico de status.',
          code: 'LEGACY_CASE_STATE_WRITE_DISABLED',
        },
        { status: 409 },
      );
    }

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (admin_note !== undefined) updatePayload.admin_note = admin_note;
    if (docs_checklist !== undefined) updatePayload.docs_checklist = docs_checklist;

    if (Object.keys(updatePayload).length === 1) {
      return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 });
    }

    const { data: updatedCase, error: updateError } = await admin
      .from('cases')
      .update(updatePayload)
      .eq('id', id)
      .select('id,state,status,opened_at,closed_at,category,service,client_id,admin_note,docs_checklist')
      .single();

    if (updateError || !updatedCase) {
      console.error('Case update failed:', updateError);
      return NextResponse.json({ error: 'No se pudo actualizar el expediente' }, { status: 500 });
    }

    await admin.from('audit_logs').insert({
      actor_id: user.id,
      action: 'case.metadata_updated',
      entity: 'cases',
      entity_id: id,
      metadata: {
        admin_note_updated: admin_note !== undefined,
        docs_checklist_updated: docs_checklist !== undefined,
      },
    }).then(() => {});

    return NextResponse.json({ case: updatedCase });
  } catch (error) {
    console.error('Case PATCH error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
