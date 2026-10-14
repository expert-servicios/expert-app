import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireActiveActor } from '@/lib/auth/active-actor';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { discoverCalendarMeetingNoteCandidates } from '@/lib/integrations/google-meeting-notes';

const schema = z.object({
  appointmentId: z.string().uuid(),
}).strict();

function response(data: Record<string, unknown>, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { 'Cache-Control': 'private, no-store' },
  });
}

/**
 * Manually invoked, read-only candidate discovery.
 *
 * Only the eventId stored on a canonical, authorized EXPERT appointment can
 * be queried. Never accept an event ID, arbitrary Meet URL or Drive path
 * from the request and never create tasks from attached Google Docs.
 */
export async function POST(request: NextRequest) {
  try {
    const actor = await requireActiveActor(request, ['admin', 'owner']);
    if (!actor) return response({ error: 'No autorizado' }, 403);

    if (Number(request.headers.get('content-length') ?? 0) > 4_096) {
      return response({ error: 'Solicitud demasiado extensa' }, 413);
    }
    const raw = await request.text();
    if (raw.length > 4_096) return response({ error: 'Solicitud demasiado extensa' }, 413);
    const body = schema.safeParse(JSON.parse(raw));
    if (!body.success) return response({ error: 'Solicitud inválida' }, 400);

    const admin = getSupabaseAdmin();
    const { data: appointment, error } = await admin.from('appointments')
      .select('id,company_id,client_id,booking_provider,google_event_id,appointment_end,status')
      .eq('id', body.data.appointmentId).maybeSingle();
    if (error) return response({ error: 'Error consultando la cita' }, 503);
    if (!appointment || !appointment.company_id || !appointment.google_event_id
        || appointment.booking_provider !== 'google_native'
        || appointment.status === 'cancelled') {
      return response({ error: 'No existe una cita Google Meet vinculada a una empresa' }, 409);
    }

    // The meeting must have ended. A future event is not evidence of notes.
    const endedMs = Date.parse(appointment.appointment_end ?? '');
    if (!Number.isFinite(endedMs) || endedMs > Date.now()) {
      return response({ error: 'La reunión no ha finalizado' }, 409);
    }

    const { data: company, error: companyError } = await admin.from('companies')
      .select('id')
      .eq('id', appointment.company_id).maybeSingle();
    if (companyError || !company) return response({ error: 'Empresa no disponible' }, 409);

    const discovery = await discoverCalendarMeetingNoteCandidates(appointment.google_event_id);
    return response({
      ok: true,
      previewOnly: true,
      appointmentId: appointment.id,
      companyId: company.id,
      clientId: appointment.client_id,
      eventId: discovery.eventId,
      meetUrl: discovery.meetUrl,
      candidates: discovery.candidates,
      requiresStaffReview: true,
      writesPerformed: false,
    });
  } catch (error) {
    if (error instanceof SyntaxError) return response({ error: 'JSON inválido' }, 400);
    console.error('[admin/kia/meeting-notes/discover]', error);
    return response({ error: 'No se pudo comprobar el enlace de notas' }, 503);
  }
}
