import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { sendEmail } from '@/lib/email/send';
import { citaConfirmed } from '@/lib/email/templates';
import {
  BookingCalendarCreationError,
  BookingCalendarDeletionError,
  calendarProviderFromBookingProvider,
  createBookingCalendarMeeting,
  deleteBookingCalendarEvent,
  getConfiguredBookingCalendarProvider,
  isBookingCalendarConfigured,
  updateBookingCalendarMeeting,
} from '@/lib/booking/calendar-provider';
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
      .select('id,name,email,service,status,confirmed_date,confirmed_time,meeting_url,admin_notes,google_event_id,appointment_date,appointment_end,booking_provider,provider_booking_id')
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

    {
      const calendarProvider =
        calendarProviderFromBookingProvider(appt.booking_provider) ??
        (appt.google_event_id ? 'google' : getConfiguredBookingCalendarProvider());

      const nativeProvider = calendarProviderFromBookingProvider(appt.booking_provider);
      const requiresRemoteSync = Boolean(
        nativeProvider || appt.google_event_id || appt.provider_booking_id
      );
      const providerConfigured = await isBookingCalendarConfigured(calendarProvider);

      if (!providerConfigured && requiresRemoteSync) {
        await admin
          .from('appointments')
          .update({
            status: current.status,
            confirmed_date: current.confirmed_date,
            confirmed_time: current.confirmed_time,
            appointment_date: current.appointment_date,
            appointment_end: current.appointment_end,
            meeting_url: current.meeting_url,
            admin_notes: current.admin_notes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);
        return NextResponse.json({
          error: 'El proveedor de calendario de esta cita no está conectado. EXPERT ha restaurado el estado anterior.'
        }, { status: 503 });
      }

      if (providerConfigured) {
        let existingRemoteEventUpdated = false;
        let reconciliationMeetingUrl: string | null = null;

        try {
          const eventId = (
            calendarProvider === 'google'
              ? (appt.google_event_id ?? appt.provider_booking_id)
              : appt.provider_booking_id
          ) as string | null;

          if (appt.status === 'confirmed' && appt.appointment_date && appt.appointment_end) {
            const start = new Date(appt.appointment_date as string);
            const end = new Date(appt.appointment_end as string);
            let syncedEventId: string;
            let meetingUrl = appt.meeting_url as string | null;
            let bookingProvider = appt.booking_provider as string | null;

            if (eventId) {
              syncedEventId = await updateBookingCalendarMeeting(eventId, {
                summary: `Cita: ${appt.service ?? 'Consultoría'} — ${appt.name}`,
                description: `Cliente: ${appt.name} (${appt.email})\nServicio: ${appt.service ?? ''}\n${appt.meeting_url ? `Reunión: ${appt.meeting_url}` : ''}`.trim(),
                start: start.toISOString(),
                end: end.toISOString(),
                timezone: 'Europe/Madrid',
                reminderMinutesBefore: [1440, 60],
              }, calendarProvider);
              existingRemoteEventUpdated = true;
            } else {
              const created = await createBookingCalendarMeeting({
                summary: `Cita: ${appt.service ?? 'Consultoría'} — ${appt.name}`,
                description: `Cliente: ${appt.name} (${appt.email})\nServicio: ${appt.service ?? ''}`.trim(),
                start: start.toISOString(),
                end: end.toISOString(),
                attendeeEmail: appt.email as string,
                timezone: 'Europe/Madrid',
                reminderMinutesBefore: [1440, 60],
              }, calendarProvider);
              syncedEventId = created.eventId;
              meetingUrl = created.meetingUrl;
              reconciliationMeetingUrl = created.meetingUrl;
              bookingProvider = created.bookingProvider;
            }

            const syncedBookingProvider = bookingProvider ?? (
              calendarProvider === 'ms365' ? 'ms365_native' : 'google_native'
            );
            const syncedGoogleEventId = calendarProvider === 'google'
              ? syncedEventId
              : null;

            const { error: metadataSyncError } = await admin
              .from('appointments')
              .update({
                google_event_id: syncedGoogleEventId,
                provider_booking_id: syncedEventId,
                booking_provider: syncedBookingProvider,
                meeting_url: meetingUrl,
                updated_at: new Date().toISOString(),
              })
              .eq('id', appt.id);

            if (metadataSyncError) {
              // A newly-created remote meeting must not survive if EXPERT
              // cannot persist its identifiers. Existing remote events already
              // have durable identifiers in the current row.
              if (!eventId) {
                try {
                  await deleteBookingCalendarEvent(syncedEventId, calendarProvider);
                } catch (cleanupError) {
                  if (
                    cleanupError instanceof BookingCalendarDeletionError &&
                    cleanupError.remoteDeleted
                  ) {
                    // Remote deletion succeeded; only refreshed-token
                    // persistence failed. Do not retain a deleted event ID.
                    throw metadataSyncError;
                  }

                  throw new BookingCalendarCreationError(
                    'Calendar metadata persistence failed after event creation and cleanup failed',
                    calendarProvider,
                    syncedEventId,
                    true,
                    cleanupError,
                    meetingUrl
                  );
                }
              }
              throw metadataSyncError;
            }

            // Only advertise fresh values after the metadata write succeeded.
            appt.google_event_id = syncedGoogleEventId;
            appt.provider_booking_id = syncedEventId;
            appt.booking_provider = syncedBookingProvider;
            appt.meeting_url = meetingUrl;
          } else if (appt.status === 'cancelled' && eventId) {
            try {
              await deleteBookingCalendarEvent(eventId, calendarProvider);
            } catch (deleteError) {
              if (
                deleteError instanceof BookingCalendarDeletionError &&
                deleteError.remoteDeleted
              ) {
                console.error('[citas] calendar deleted; token persistence failed:', deleteError);
              } else {
                throw deleteError;
              }
            }
          }
        } catch (calendarError) {
          console.error('[citas] calendar sync:', calendarError);

          const creationError =
            calendarError instanceof BookingCalendarCreationError
              ? calendarError
              : null;
          const reconciliationEventId =
            creationError?.cleanupFailed === true
              ? creationError.eventId
              : null;
          const reconciliationProvider =
            creationError?.cleanupFailed === true
              ? creationError.provider
              : calendarProvider;
          if (creationError?.cleanupFailed === true && creationError.meetingUrl) {
            reconciliationMeetingUrl = creationError.meetingUrl;
          }

          const keepSynchronizedSchedule =
            existingRemoteEventUpdated && !reconciliationEventId;

          const reconciliationNotice = reconciliationEventId
            ? `Evento remoto ${reconciliationEventId} requiere reconciliación tras fallo de sincronización.`
            : null;
          const reconciledAdminNotes = reconciliationNotice
            ? [current.admin_notes?.trim(), reconciliationNotice]
                .filter(Boolean)
                .join('\n\n')
            : current.admin_notes;

          const { error: restoreError } = await admin
            .from('appointments')
            .update({
              status: keepSynchronizedSchedule ? appt.status : current.status,
              confirmed_date: keepSynchronizedSchedule ? appt.confirmed_date : current.confirmed_date,
              confirmed_time: keepSynchronizedSchedule ? appt.confirmed_time : current.confirmed_time,
              appointment_date: keepSynchronizedSchedule ? appt.appointment_date : current.appointment_date,
              appointment_end: keepSynchronizedSchedule ? appt.appointment_end : current.appointment_end,
              meeting_url: reconciliationEventId
                ? (reconciliationMeetingUrl ?? current.meeting_url)
                : (keepSynchronizedSchedule ? appt.meeting_url : current.meeting_url),
              google_event_id: reconciliationEventId && reconciliationProvider === 'google'
                ? reconciliationEventId
                : current.google_event_id,
              provider_booking_id: reconciliationEventId ?? current.provider_booking_id,
              booking_provider: reconciliationEventId
                ? (reconciliationProvider === 'ms365' ? 'ms365_native' : 'google_native')
                : current.booking_provider,
              admin_notes: reconciledAdminNotes,
              updated_at: new Date().toISOString(),
            })
            .eq('id', id);

          if (restoreError) {
            console.error('[citas] failed to persist calendar reconciliation state:', restoreError);

            if (reconciliationEventId) {
              return NextResponse.json({
                error: 'No se pudo persistir el estado de reconciliación de Calendar.',
                recovery: {
                  provider: reconciliationProvider,
                  eventId: reconciliationEventId,
                  meetingUrl: reconciliationMeetingUrl,
                },
              }, { status: 500 });
            }

            return NextResponse.json({
              error: 'Calendar se sincronizó parcialmente, pero EXPERT no pudo persistir el estado de recuperación.'
            }, { status: 500 });
          }

          if (!keepSynchronizedSchedule) {
            return NextResponse.json({
              error: reconciliationEventId
                ? 'Calendar no pudo sincronizarse por completo. EXPERT ha conservado el identificador remoto para reconciliación.'
                : 'Calendar no pudo sincronizarse. EXPERT ha restaurado la cita al estado anterior.'
            }, { status: 502 });
          }

          // Existing remote event and local schedule now agree on the requested
          // time. Continue to the normal confirmation/response path.
          appt.meeting_url = current.meeting_url;
        }
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

    const calendarProvider =
      calendarProviderFromBookingProvider(appt.booking_provider) ??
      (appt.google_event_id ? 'google' : null);
    const remoteEventId = (
      calendarProvider === 'google'
        ? (appt.google_event_id ?? appt.provider_booking_id)
        : appt.provider_booking_id
    ) as string | null;

    if (calendarProvider && remoteEventId) {
      if (!(await isBookingCalendarConfigured(calendarProvider))) {
        return NextResponse.json({
          error: 'El proveedor de calendario de esta cita no está conectado. La cita se conserva en EXPERT.'
        }, { status: 503 });
      }
      try {
        await deleteBookingCalendarEvent(remoteEventId, calendarProvider);
      } catch (calendarError) {
        if (
          calendarError instanceof BookingCalendarDeletionError &&
          calendarError.remoteDeleted
        ) {
          console.error('[admin/citas] DELETE token persistence:', calendarError);
          // The remote event is already gone; continue deleting the local row.
        } else {
          console.error('[admin/citas] DELETE calendar:', calendarError);
          return NextResponse.json({
            error: 'No se pudo eliminar el evento remoto. La cita se conserva en EXPERT para poder reconciliarla.'
          }, { status: 502 });
        }
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
