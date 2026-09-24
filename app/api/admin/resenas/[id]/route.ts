import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = createServerSupabaseClient(request);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const admin = getSupabaseAdmin();
    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
    if (!['admin', 'owner'].includes(profile?.role ?? '')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json() as {
      status?: 'pending' | 'approved' | 'rejected';
      featured?: boolean;
      published?: boolean;
      comment_publishable?: boolean;
      human_override_reason?: string;
    };

    const { data: current, error: currentError } = await admin
      .from('reviews')
      .select('allow_publish,status,published,comment_publishable,moderation_status')
      .eq('id', id)
      .maybeSingle();

    if (currentError) return NextResponse.json({ error: currentError.message }, { status: 500 });
    if (!current) return NextResponse.json({ error: 'Reseña no encontrada' }, { status: 404 });

    const update: Record<string, unknown> = {};

    if (body.status === 'rejected') {
      return NextResponse.json(
        { error: 'Una reseña verificada no se rechaza por su contenido. Oculta solo el comentario o documenta una incidencia de autenticidad por el canal específico.' },
        { status: 409 },
      );
    }

    if (body.status !== undefined) {
      update.status = body.status;
      if (body.status === 'approved') {
        // Approval publishes only when the client explicitly consented.
        update.published = current.allow_publish === true;
      } else {
        update.published = false;
        update.featured = false;
      }
    }

    if (body.featured !== undefined) {
      const effectiveStatus = body.status ?? current.status;
      if (body.featured && effectiveStatus !== 'approved') {
        return NextResponse.json({ error: 'Solo se puede destacar una reseña aprobada' }, { status: 400 });
      }
      update.featured = body.featured;
    }

    if (body.comment_publishable !== undefined) {
      update.comment_publishable = body.comment_publishable;
      update.moderated_by = 'human';
      update.moderation_status = body.comment_publishable ? 'approved' : 'comment_not_publishable';
      update.moderated_at = new Date().toISOString();
      if (body.human_override_reason?.trim()) update.human_override_reason = body.human_override_reason.trim().slice(0, 500);
    }

    if (body.published !== undefined) {
      const effectiveStatus = body.status ?? current.status;
      if (body.published && current.allow_publish !== true) {
        return NextResponse.json({ error: 'El cliente no ha autorizado la publicación' }, { status: 400 });
      }
      if (body.published && effectiveStatus !== 'approved') {
        return NextResponse.json({ error: 'Solo se puede publicar una reseña aprobada' }, { status: 400 });
      }
      update.published = body.published;
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 });
    }

    if (body.status !== undefined || body.published !== undefined || body.featured !== undefined) {
      update.moderated_by = 'human';
      update.moderated_at = new Date().toISOString();
      if (body.status === 'approved') update.moderation_status = current.comment_publishable === false ? 'comment_not_publishable' : 'approved';
      if (body.human_override_reason?.trim()) update.human_override_reason = body.human_override_reason.trim().slice(0, 500);
    }

    const { error } = await admin.from('reviews').update(update).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin/resenas PATCH]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
