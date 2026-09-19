import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

const noteSchema = z.object({
  itemKey: z.string().min(1).max(160),
  itemLabel: z.string().min(1).max(500),
  comment: z.string().max(2000).optional().default(''),
});

async function resolveCaseAccess(caseId: string, userId: string) {
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', userId).maybeSingle();
  const isAdmin = profile?.role === 'admin' || profile?.role === 'owner';
  const { data: caseData, error } = await admin
    .from('cases')
    .select('id,client_id,service')
    .eq('id', caseId)
    .maybeSingle();
  if (error || !caseData) return { admin, caseData: null, isAdmin, authorized: false };
  return { admin, caseData, isAdmin, authorized: isAdmin || caseData.client_id === userId };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: caseId } = await params;
    const supabase = createServerSupabaseClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const { admin, authorized } = await resolveCaseAccess(caseId, user.id);
    if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const { data: notes, error } = await admin
      .from('case_document_notes')
      .select('id,item_key,item_label,comment,updated_at,updated_by')
      .eq('case_id', caseId)
      .order('updated_at', { ascending: false });

    if (error) return NextResponse.json({ error: 'Error al cargar comentarios' }, { status: 500 });
    return NextResponse.json({ notes: notes ?? [] });
  } catch (err) {
    console.error('[case document notes GET]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: caseId } = await params;
    const supabase = createServerSupabaseClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const parsed = noteSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Comentario no válido' }, { status: 400 });

    const { admin, caseData, authorized } = await resolveCaseAccess(caseId, user.id);
    if (!authorized || !caseData) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const { data: note, error } = await admin
      .from('case_document_notes')
      .upsert({
        case_id: caseId,
        client_id: caseData.client_id,
        item_key: parsed.data.itemKey,
        item_label: parsed.data.itemLabel,
        comment: parsed.data.comment.trim() || null,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'case_id,item_key' })
      .select('id,item_key,item_label,comment,updated_at,updated_by')
      .single();

    if (error || !note) return NextResponse.json({ error: 'No se pudo guardar el comentario' }, { status: 500 });
    return NextResponse.json({ note });
  } catch (err) {
    console.error('[case document notes PATCH]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
