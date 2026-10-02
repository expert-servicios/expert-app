import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/auth/require-admin';

const STATUSES = ['idea','draft','review','approved','scheduled','published','rejected'] as const;
const CONSENT = ['not_required','pending','granted','denied'] as const;

function clean(value: unknown, max = 12000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminClient(request);
    if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const url = new URL(request.url);
    const status = clean(url.searchParams.get('status'), 40);
    const pillar = clean(url.searchParams.get('pillar'), 120);

    let query = admin
      .from('social_content_items')
      .select('*')
      .order('priority', { ascending: true })
      .order('created_at', { ascending: false });

    if (status && STATUSES.includes(status as (typeof STATUSES)[number])) query = query.eq('status', status);
    if (pillar) query = query.eq('pillar', pillar);

    const { data, error } = await query.limit(250);
    if (error) throw error;

    const items = data ?? [];
    const pillars = Array.from(new Set(items.map((item) => item.pillar))).sort();

    return NextResponse.json({
      items,
      pillars,
      stats: {
        total: items.length,
        draft: items.filter((item) => item.status === 'draft').length,
        review: items.filter((item) => item.status === 'review').length,
        approved: items.filter((item) => item.status === 'approved').length,
        scheduled: items.filter((item) => item.status === 'scheduled').length,
        published: items.filter((item) => item.status === 'published').length,
        consent_pending: items.filter((item) => item.consent_status === 'pending').length,
      },
    });
  } catch (error) {
    console.error('[admin/editorial] GET error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdminClient(request);
    if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Solicitud no válida' }, { status: 400 });
    }

    const id = clean(body.id, 80);
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    const { data: current, error: currentError } = await admin
      .from('social_content_items')
      .select('id,consent_required,consent_status')
      .eq('id', id)
      .maybeSingle();
    if (currentError) throw currentError;
    if (!current) return NextResponse.json({ error: 'Contenido no encontrado' }, { status: 404 });

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (typeof body.status === 'string') {
      if (!STATUSES.includes(body.status as (typeof STATUSES)[number])) {
        return NextResponse.json({ error: 'Estado no válido' }, { status: 400 });
      }
      if (
        current.consent_required &&
        ['approved','scheduled','published'].includes(body.status) &&
        current.consent_status !== 'granted'
      ) {
        return NextResponse.json({ error: 'No se puede aprobar o publicar sin consentimiento.' }, { status: 409 });
      }
      patch.status = body.status;
      if (body.status === 'published') patch.published_at = new Date().toISOString();
    }

    if (typeof body.consent_status === 'string') {
      if (!CONSENT.includes(body.consent_status as (typeof CONSENT)[number])) {
        return NextResponse.json({ error: 'Estado de consentimiento no válido' }, { status: 400 });
      }
      patch.consent_status = body.consent_status;
    }

    for (const field of ['hook','master_copy','linkedin_copy','facebook_copy','instagram_copy','cta_label','cta_url','asset_brief']) {
      if (typeof body[field] === 'string') patch[field] = clean(body[field]);
    }

    if (typeof body.scheduled_at === 'string') {
      patch.scheduled_at = body.scheduled_at || null;
      if (body.scheduled_at) patch.status = 'scheduled';
    }

    const { data, error } = await admin
      .from('social_content_items')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;

    return NextResponse.json({ ok: true, item: data });
  } catch (error) {
    console.error('[admin/editorial] PATCH error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
