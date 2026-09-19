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
    };

    const { data: current, error: currentError } = await admin
      .from('reviews')
      .select('allow_publish,status,published')
      .eq('id', id)
      .maybeSingle();

    if (currentError) return NextResponse.json({ error: currentError.message }, { status: 500 });
    if (!current) return NextResponse.json({ error: 'Reseña no encontrada' }, { status: 404 });

    const update: Record<string, unknown> = {};

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

    const { error } = await admin.from('reviews').update(update).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin/resenas PATCH]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
