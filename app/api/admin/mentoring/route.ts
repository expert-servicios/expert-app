import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/auth/require-admin';

const PUBLICATION_STATUSES = ['private', 'consent_pending', 'publishable', 'published'] as const;
const ENGAGEMENT_STATUSES = ['prospect', 'active', 'paused', 'completed', 'closed'] as const;

function clean(value: unknown, max = 8000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminClient(request);
    if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const [{ data: engagements, error: engagementsError }, { data: publications, error: publicationsError }] =
      await Promise.all([
        admin
          .from('mentoring_engagements')
          .select('id,lead_id,program,project_name,mentee_name,mentee_email,country,engagement_type,status,started_at,ended_at,source_label,current_focus,next_action,publication_status,publication_consent_at,metadata,created_at,updated_at')
          .order('status', { ascending: true })
          .order('started_at', { ascending: false }),
        admin
          .from('mentoring_publications')
          .select('id,engagement_id,publication_type,title,slug,status,summary,publication_url,published_at,created_at,updated_at')
          .order('created_at', { ascending: false })
          .limit(100),
      ]);

    if (engagementsError) throw engagementsError;
    if (publicationsError) throw publicationsError;

    const engagementIds = (engagements ?? []).map((item) => item.id);
    let sessions: Record<string, unknown>[] = [];
    if (engagementIds.length > 0) {
      const { data, error } = await admin
        .from('mentoring_sessions')
        .select('id,engagement_id,occurred_at,duration_minutes,session_number,objective,summary,decisions,next_actions,evidence,created_at')
        .in('engagement_id', engagementIds)
        .order('occurred_at', { ascending: false })
        .limit(250);
      if (error) throw error;
      sessions = data ?? [];
    }

    const { count: mentorTipsContacts, error: contactsError } = await admin
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .contains('metadata', { source_group: 'mentorday', program: 'Mentor Tips / Speed Mentoring' });
    if (contactsError) throw contactsError;

    return NextResponse.json({
      engagements: engagements ?? [],
      sessions,
      publications: publications ?? [],
      stats: {
        total: engagements?.length ?? 0,
        active: (engagements ?? []).filter((item) => item.status === 'active').length,
        completed: (engagements ?? []).filter((item) => item.status === 'completed').length,
        consent_pending: (engagements ?? []).filter((item) => item.publication_status === 'consent_pending').length,
        mentor_tips_contacts: mentorTipsContacts ?? 0,
      },
    });
  } catch (error) {
    console.error('[admin/mentoring] GET error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminClient(request);
    if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Solicitud no válida' }, { status: 400 });
    }

    if (body.kind === 'session') {
      const engagementId = clean(body.engagement_id, 80);
      if (!engagementId) return NextResponse.json({ error: 'Mentoría requerida' }, { status: 400 });

      const occurredAt = clean(body.occurred_at, 80) || new Date().toISOString();
      const duration = Number(body.duration_minutes);
      const sessionNumber = Number(body.session_number);

      const { data, error } = await admin
        .from('mentoring_sessions')
        .insert({
          engagement_id: engagementId,
          occurred_at: occurredAt,
          duration_minutes: Number.isInteger(duration) && duration > 0 ? duration : null,
          session_number: Number.isInteger(sessionNumber) && sessionNumber > 0 ? sessionNumber : null,
          objective: clean(body.objective),
          summary: clean(body.summary),
          decisions: clean(body.decisions),
          next_actions: clean(body.next_actions),
          evidence: clean(body.evidence),
          private_notes: clean(body.private_notes),
        })
        .select('id')
        .single();

      if (error) throw error;
      await admin
        .from('mentoring_engagements')
        .update({
          next_action: clean(body.next_actions) || undefined,
          updated_at: new Date().toISOString(),
        })
        .eq('id', engagementId);

      return NextResponse.json({ ok: true, session: data });
    }

    if (body.kind === 'publication') {
      const engagementId = clean(body.engagement_id, 80);
      const title = clean(body.title, 300);
      if (!engagementId || !title) {
        return NextResponse.json({ error: 'Mentoría y título requeridos' }, { status: 400 });
      }

      const { data, error } = await admin
        .from('mentoring_publications')
        .insert({
          engagement_id: engagementId,
          publication_type: clean(body.publication_type, 40) || 'blog',
          title,
          summary: clean(body.summary),
          status: 'idea',
        })
        .select('id')
        .single();
      if (error) throw error;
      return NextResponse.json({ ok: true, publication: data });
    }

    return NextResponse.json({ error: 'Operación no soportada' }, { status: 400 });
  } catch (error) {
    console.error('[admin/mentoring] POST error:', error);
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

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (typeof body.status === 'string') {
      if (!ENGAGEMENT_STATUSES.includes(body.status as (typeof ENGAGEMENT_STATUSES)[number])) {
        return NextResponse.json({ error: 'Estado no válido' }, { status: 400 });
      }
      patch.status = body.status;
    }
    if (typeof body.current_focus === 'string') patch.current_focus = clean(body.current_focus);
    if (typeof body.next_action === 'string') patch.next_action = clean(body.next_action);

    if (typeof body.publication_status === 'string') {
      if (!PUBLICATION_STATUSES.includes(body.publication_status as (typeof PUBLICATION_STATUSES)[number])) {
        return NextResponse.json({ error: 'Estado de publicación no válido' }, { status: 400 });
      }

      if (body.publication_status === 'publishable' || body.publication_status === 'published') {
        const { data: current, error: currentError } = await admin
          .from('mentoring_engagements')
          .select('publication_consent_at')
          .eq('id', id)
          .maybeSingle();
        if (currentError) throw currentError;
        if (!current?.publication_consent_at) {
          return NextResponse.json(
            { error: 'No se puede publicar sin consentimiento registrado.' },
            { status: 409 },
          );
        }
      }
      patch.publication_status = body.publication_status;
    }

    const { data, error } = await admin
      .from('mentoring_engagements')
      .update(patch)
      .eq('id', id)
      .select('id,status,current_focus,next_action,publication_status')
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Mentoría no encontrada' }, { status: 404 });
    return NextResponse.json({ ok: true, engagement: data });
  } catch (error) {
    console.error('[admin/mentoring] PATCH error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
