import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { sendEmail } from '@/lib/email/send';
import { citaConfirmed } from '@/lib/email/templates';
import { upsertCalendarEventSA, deleteCalendarEventSA, hasCalendarSA } from '@/lib/integrations/google-calendar';
import { formatMadridDate, formatMadridTime, madridLocalToDate } from '@/lib/booking/native-booking';

async function requireAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  return (profile?.role === 'admin' || profile?.role === 'owner') ? admin : null;
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = admin
      .from('appointments')
      .select('id,name,email,phone,service,appointment_type,appointment_date,appointment_end,booking_provider,provider_booking_id,preferred_date,preferred_time,notes,status,confirmed_date,confirmed_time,meeting_url,admin_notes,google_event_id,created_at')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') query = query.eq('status', status);

    const { data, error } = await query;
    if (error) {
      console.error('[admin/citas] GET:', error);
      return NextResponse.json({ error: 'Error al obtener citas' }, { status: 500 });
    }

    return NextResponse.json({ appointments: data ?? [] });
  } catch (err) {
    console.error('[admin/citas]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

const updateSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'cancelled', 'rescheduled']).optional(),
  confirmed_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  confirmed_time: z.string().max(60).optional().nullable(),
  meeting_url: z.string().url().optional().nullable(),
  admin_notes: z.string().max(1000).optional().nullable(),
  send_confirmation: z.boolean().optional()
});

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 });
    }

    const { data: current, error: currentError } = await admin
      .from('appointments')
      .select('id,name,email,service,status,confirmed_date,confirmed_time,meeting_url,google_event_id,appointment_date,appointment_end,booking_provider,provider_booking_id')
      .eq('id', id)
      .single();
    if (currentError || !current) {
      return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 });
    }

    const { send_confirmation, ...fields } = parsed.data;
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      ...Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined)),
    };

    const nextDate = parsed.data.confirmed_date === undefined
      ? current.confirmed_date
      : parsed.data.confirmed_date;
    const nextTime = parsed.data.confirmed_time === undefined
      ? current.confirmed_time
      : parsed.data.confirmed_time;

    let movedStart: Date | null = null;
    let movedEnd: Date | null = null;
    if (nextDate && nextTime && (parsed.data.confirmed_date !== undefined || parsed.data.confirmed_time !== undefined)) {
      movedStart = madridLocalToDate(nextDate, String(nextTime).slice(0, 5));
      const oldStart = current.appointment_date ? new Date(current.appointment_date) : null;
      const oldEnd = current.appointment_end ? new Date(current.appointment_end) : null;
      const durationMs = oldStart && oldEnd && oldEnd > oldStart
        ? oldEnd.getTime() - oldStart.getTime()
        : 60 * 60_000;
      movedEnd = new Date(movedStart.getTime() + durationMs);
      updatePayload.appointment_date = movedStart.toISOString();
      updatePayload.appointment_end = movedEnd.toISOString();
      updatePayload.confirmed_date = formatMadridDate(movedStart);
      updatePayload.confirmed_time = formatMadridTime(movedStart);
    }

    const { data: appt, error } = await admin
      .from('appointments')
      .update(updatePayload)
      .eq('id', id)
      .select('id,name,email,service,confirmed_date,confirmed_time,meeting_url,status,google_event_id,appointment_date,appointment_end,booking_provider,provider_booking_id')
      .single();

    if (error || !appt) {
      console.error('[admin/citas] PATCH:', error);
      if (error?.code === '23P01') {
        return NextResponse.json({ error: 'El nuevo horario se solapa con otra cita.' }, { status: 409 });
      }
      return NextResponse.json({ error: 'No se pudo actualizar' }, { status: 500 });
    }

    if (hasCalendarSA()) {
      try {
        const eventId = (appt.google_event_id ?? appt.provider_booking_id) as string | null;
        if (appt.status === 'confirmed' && appt.appointment_date && appt.appointment_end) {
          const start = new Date(appt.appointment_date as string);
          const end = new Date(appt.appointment_end as string);
          const syncedEventId = await upsertCalendarEventSA(
            {
              summary: `Cita: ${appt.service ?? 'Consultoría'} — ${appt.name}`,
              description: `Cliente: ${appt.name} (${appt.email})\nServicio: ${appt.service ?? ''}\n${appt.meeting_url ? `Reunión: ${appt.meeting_url}` : ''}`.trim(),
              date: formatMadridDate(start),
              startTime: formatMadridTime(start),
              endTime: formatMadridTime(end),
              reminderMinutesBefore: [1440, 60],
            },
            eventId ?? undefined
          );
          if (syncedEventId && syncedEventId !== appt.google_event_id) {
            await admin
              .from('appointments')
              .update({
                google_event_id: syncedEventId,
                provider_booking_id: appt.booking_provider === 'google_native'
                  ? syncedEventId
                  : appt.provider_booking_id,
              })
              .eq('id', appt.id);
          }
        } else if (appt.status === 'cancelled' && eventId) {
          await deleteCalendarEventSA(eventId);
        }
      } catch (calendarError) {
        console.error('[citas] calendar sync:', calendarError);
        return NextResponse.json({
          error: 'La cita se actualizó en EXPERT, pero Calendar no pudo sincronizarse. Requiere reconciliación.'
        }, { status: 502 });
      }
    }

    if (send_confirmation && appt.status === 'confirmed' && appt.confirmed_date && appt.confirmed_time) {
      const confirmedDateFormatted = new Date(appt.confirmed_date + 'T12:00:00').toLocaleDateString('es-ES', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      });
      await sendEmail({
        to: appt.email as string,
        eventType: 'cita.confirmed',
        ...citaConfirmed(
          appt.name as string,
          appt.service as string,
          confirmedDateFormatted,
          appt.confirmed_time as string,
          appt.meeting_url as string | null
        ),
        metadata: { appointment_id: appt.id }
      }).catch((e) => console.error('[cita] confirmation email failed:', e));
    }

    return NextResponse.json({ appointment: appt });
  } catch (err) {
    console.error('[admin/citas]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    const { data: appt, error: fetchError } = await admin
      .from('appointments')
      .select('google_event_id,booking_provider,provider_booking_id')
      .eq('id', id)
      .single();
    if (fetchError || !appt) return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 });

    const remoteEventId = (appt.google_event_id ?? (
      appt.booking_provider === 'google_native' ? appt.provider_booking_id : null
    )) as string | null;

    if (remoteEventId && hasCalendarSA()) {
      try {
        await deleteCalendarEventSA(remoteEventId);
      } catch (calendarError) {
        console.error('[admin/citas] DELETE calendar:', calendarError);
        return NextResponse.json({
          error: 'No se pudo eliminar el evento de Google Calendar. La cita se conserva en EXPERT para poder reconciliarla.'
        }, { status: 502 });
      }
    }

    const { error } = await admin.from('appointments').delete().eq('id', id);
    if (error) return NextResponse.json({ error: 'No se pudo eliminar' }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin/citas]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
