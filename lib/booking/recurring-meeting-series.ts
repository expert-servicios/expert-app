import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import {
  createBookingCalendarMeeting,
  deleteBookingCalendarEvent,
  getConfiguredBookingCalendarProvider,
  listBookingCalendarBusyWindows,
} from '@/lib/booking/calendar-provider';
import {
  BOOKING_TIMEZONE,
  type BookingServiceKey,
  formatMadridDate,
  formatMadridTime,
  isMadridWeekday,
  madridLocalToDate,
} from '@/lib/booking/native-booking';
import { ensureBookingAdminTask } from '@/lib/booking/booking-admin-task';
import { createBookingManagementToken, bookingManagementUrls } from '@/lib/booking/booking-management-token';

type AdminClient = ReturnType<typeof getSupabaseAdmin>;

type RecurringSeries = {
  id: string;
  title: string;
  attendee_name: string;
  attendee_email: string;
  attendee_phone: string | null;
  client_id: string | null;
  company_id: string | null;
  lead_id: string | null;
  service_key: string;
  duration_minutes: number;
  day_of_month: number;
  local_time: string;
  timezone: string;
  months_ahead: number;
  start_month: string;
  end_month: string | null;
  weekend_policy: 'next_weekday';
  conflict_policy: 'next_available_weekday' | 'manual_review';
  active: boolean;
  metadata: Record<string, unknown> | null;
};

function monthStart(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function addMonths(date: Date, count: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + count, 1));
}

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function dateForMonth(month: Date, day: number) {
  const max = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0)).getUTCDate();
  const safeDay = Math.min(day, max);
  return `${month.getUTCFullYear()}-${String(month.getUTCMonth() + 1).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;
}

function nextWeekday(localDate: string): string {
  let current = localDate;
  for (let i = 0; i < 7; i += 1) {
    const midday = madridLocalToDate(current, '12:00');
    if (isMadridWeekday(midday)) return current;
    const next = new Date(midday.getTime() + 24 * 60 * 60_000);
    current = formatMadridDate(next);
  }
  return localDate;
}

async function pickAvailableSlot(
  admin: AdminClient,
  series: RecurringSeries,
  localDate: string,
): Promise<{ start: Date; end: Date; localDate: string }> {
  let candidateDate = nextWeekday(localDate);
  for (let attempts = 0; attempts < 10; attempts += 1) {
    const start = madridLocalToDate(candidateDate, series.local_time.slice(0, 5));
    const end = new Date(start.getTime() + series.duration_minutes * 60_000);
    const [busy, localAppointments] = await Promise.all([
      listBookingCalendarBusyWindows(
        start.toISOString(),
        end.toISOString(),
        getConfiguredBookingCalendarProvider(),
      ),
      admin
        .from('appointments')
        .select('id,appointment_date,appointment_end,status')
        .in('status', ['pending_calendar', 'confirmed', 'confirmada'])
        .lt('appointment_date', end.toISOString())
        .gt('appointment_end', start.toISOString()),
    ]);
    if (localAppointments.error) throw localAppointments.error;
    const calendarConflict = busy.some((range) => {
      const rangeStart = new Date(range.start);
      const rangeEnd = new Date(range.end);
      return start < rangeEnd && end > rangeStart;
    });
    const localConflict = (localAppointments.data ?? []).some((row) =>
      Boolean(row.appointment_date && row.appointment_end)
      && start < new Date(row.appointment_end as string)
      && end > new Date(row.appointment_date as string)
    );
    const conflict = calendarConflict || localConflict;
    if (!conflict) return { start, end, localDate: candidateDate };
    if (series.conflict_policy === 'manual_review') {
      throw new Error('recurring_meeting_conflict_manual_review');
    }
    const next = new Date(start.getTime() + 24 * 60 * 60_000);
    candidateDate = nextWeekday(formatMadridDate(next));
  }
  throw new Error('recurring_meeting_no_available_weekday');
}

async function resolveAnchoredLocalDate(
  admin: AdminClient,
  series: RecurringSeries,
  monthKeyValue: string,
  fallbackDate: string,
): Promise<string> {
  const anchorSourceKey = typeof series.metadata?.anchor_source_key === 'string'
    ? series.metadata.anchor_source_key
    : null;
  if (!anchorSourceKey) return fallbackDate;

  const { data: anchorSeries, error: anchorSeriesError } = await admin
    .from('recurring_meeting_series')
    .select('id')
    .eq('source_key', anchorSourceKey)
    .eq('active', true)
    .maybeSingle();
  if (anchorSeriesError) throw anchorSeriesError;
  if (!anchorSeries?.id) throw new Error('recurring_meeting_anchor_series_missing');

  const { data: anchorOccurrence, error: anchorOccurrenceError } = await admin
    .from('recurring_meeting_occurrences')
    .select('appointment_id,status')
    .eq('series_id', anchorSeries.id)
    .eq('month_key', monthKeyValue)
    .eq('status', 'confirmed')
    .maybeSingle();
  if (anchorOccurrenceError) throw anchorOccurrenceError;
  if (!anchorOccurrence?.appointment_id) throw new Error('recurring_meeting_anchor_not_ready');

  const { data: anchorAppointment, error: anchorAppointmentError } = await admin
    .from('appointments')
    .select('appointment_date')
    .eq('id', anchorOccurrence.appointment_id)
    .maybeSingle();
  if (anchorAppointmentError) throw anchorAppointmentError;
  if (!anchorAppointment?.appointment_date) throw new Error('recurring_meeting_anchor_appointment_missing');

  return formatMadridDate(new Date(anchorAppointment.appointment_date));
}

async function recurringSeriesStillEntitled(admin: AdminClient, series: RecurringSeries): Promise<boolean> {
  const subscriptionId = typeof series.metadata?.subscription_id === 'string'
    ? series.metadata.subscription_id
    : null;
  if (!subscriptionId) return true;

  const { data: subscription, error: subscriptionError } = await admin
    .from('subscriptions')
    .select('id,status')
    .eq('id', subscriptionId)
    .in('status', ['active', 'trialing'])
    .maybeSingle();
  if (subscriptionError) throw subscriptionError;
  if (!subscription) return false;

  const entitlementId = typeof series.metadata?.entitlement_id === 'string'
    ? series.metadata.entitlement_id
    : null;
  if (!entitlementId) return true;

  const { data: entitlement, error: entitlementError } = await admin
    .from('subscription_entitlements')
    .select('id,active,valid_from,valid_until')
    .eq('id', entitlementId)
    .eq('active', true)
    .maybeSingle();
  if (entitlementError) throw entitlementError;
  if (!entitlement) return false;

  const now = Date.now();
  if (entitlement.valid_from && new Date(entitlement.valid_from).getTime() > now) return false;
  if (entitlement.valid_until && new Date(entitlement.valid_until).getTime() < now) return false;
  return true;
}

export async function materializeRecurringMeetingSeries(
  admin: AdminClient = getSupabaseAdmin(),
) {
  const { data: seriesRows, error: seriesError } = await admin
    .from('recurring_meeting_series')
    .select('*')
    .eq('active', true);
  if (seriesError) throw seriesError;

  const now = new Date();
  const horizonStart = monthStart(now);
  let planned = 0;
  let confirmed = 0;
  let existing = 0;
  let conflicts = 0;
  const errors: string[] = [];

  const orderedSeriesRows = [...(seriesRows ?? [])].sort((left, right) => {
    const leftAnchored = typeof (left as RecurringSeries).metadata?.anchor_source_key === 'string' ? 1 : 0;
    const rightAnchored = typeof (right as RecurringSeries).metadata?.anchor_source_key === 'string' ? 1 : 0;
    return leftAnchored - rightAnchored;
  });

  for (const raw of orderedSeriesRows) {
    const series = raw as RecurringSeries;
    if (!(await recurringSeriesStillEntitled(admin, series))) {
      await admin.from('recurring_meeting_series').update({
        active: false,
        updated_at: new Date().toISOString(),
      }).eq('id', series.id);
      continue;
    }
    const startMonth = monthStart(new Date(`${series.start_month}T00:00:00Z`));
    const firstMonth = startMonth > horizonStart ? startMonth : horizonStart;
    const endMonth = series.end_month ? monthStart(new Date(`${series.end_month}T00:00:00Z`)) : null;

    for (let offset = 0; offset < series.months_ahead; offset += 1) {
      const month = addMonths(firstMonth, offset);
      if (endMonth && month > endMonth) break;
      const key = monthKey(month);

      const { data: occurrence } = await admin
        .from('recurring_meeting_occurrences')
        .select('id,appointment_id,status')
        .eq('series_id', series.id)
        .eq('month_key', key)
        .maybeSingle();

      if (occurrence?.appointment_id && occurrence.status === 'confirmed') {
        existing++;
        continue;
      }

      let occurrenceId = occurrence?.id as string | undefined;
      try {
        const fallbackDate = dateForMonth(month, series.day_of_month);
        const baseDate = await resolveAnchoredLocalDate(admin, series, key, fallbackDate);
        const slot = await pickAvailableSlot(admin, series, baseDate);
        planned++;

        if (!occurrenceId) {
          const { data: insertedOccurrence, error: occurrenceError } = await admin
            .from('recurring_meeting_occurrences')
            .insert({
              series_id: series.id,
              month_key: key,
              planned_date: slot.localDate,
              status: 'planned',
            })
            .select('id')
            .single();
          if (occurrenceError || !insertedOccurrence?.id) throw occurrenceError ?? new Error('occurrence_insert_failed');
          occurrenceId = insertedOccurrence.id;
        } else {
          await admin.from('recurring_meeting_occurrences').update({
            planned_date: slot.localDate,
            status: 'planned',
            last_error: null,
            updated_at: new Date().toISOString(),
          }).eq('id', occurrenceId);
        }

        let appointmentId: string | null = null;
        let remoteEventId: string | null = null;
        try {
          const { data: appointment, error: appointmentError } = await admin
            .from('appointments')
            .insert({
              name: series.attendee_name,
              email: series.attendee_email.toLowerCase(),
              phone: series.attendee_phone ?? 'No facilitado',
              appointment_type: series.service_key,
              appointment_date: slot.start.toISOString(),
              appointment_end: slot.end.toISOString(),
              notes: 'Cita generada por KIA desde una serie recurrente EXPERT.',
              status: 'pending_calendar',
              preferred_date: slot.localDate,
              preferred_time: formatMadridTime(slot.start),
              confirmed_date: slot.localDate,
              confirmed_time: formatMadridTime(slot.start),
              service: series.title,
              client_id: series.client_id,
              company_id: series.company_id,
              booking_provider: 'google_native',
              admin_notes: `Serie recurrente EXPERT: ${series.id} · ${key}`,
            })
            .select('id')
            .single();
          if (appointmentError || !appointment?.id) throw appointmentError ?? new Error('appointment_insert_failed');
          const confirmedAppointmentId = appointment.id;
          appointmentId = confirmedAppointmentId;

          const managementToken = await createBookingManagementToken({
            appointmentId: confirmedAppointmentId,
            email: series.attendee_email.toLowerCase(),
            service: series.service_key as BookingServiceKey,
            expiresAt: new Date(slot.start.getTime() + 30 * 24 * 60 * 60_000),
          });
          const managementLinks = bookingManagementUrls(managementToken, series.service_key as BookingServiceKey);

          const meeting = await createBookingCalendarMeeting({
            summary: `${series.title} — ${series.attendee_name}`,
            description: [
              'Cita recurrente generada por KIA desde EXPERT.',
              `Cliente: ${series.attendee_name} (${series.attendee_email})`,
              `EXPERT appointment: ${confirmedAppointmentId}`,
              `Cambiar hora: ${managementLinks.rescheduleUrl}`,
            ].join('\n'),
            start: slot.start.toISOString(),
            end: slot.end.toISOString(),
            attendeeEmail: series.attendee_email.toLowerCase(),
            timezone: series.timezone || BOOKING_TIMEZONE,
            reminderMinutesBefore: [1440, 60],
          });
          remoteEventId = meeting.eventId;
          if (!meeting.meetingUrl) throw new Error('recurring_meeting_meet_unavailable');
          const meetingUrl = meeting.meetingUrl;

          const { error: finalizeError } = await admin.from('appointments').update({
            status: 'confirmed',
            booking_provider: meeting.bookingProvider,
            provider_booking_id: meeting.eventId,
            google_event_id: meeting.provider === 'google' ? meeting.eventId : null,
            meeting_url: meetingUrl,
            admin_notes: [
              `Serie recurrente EXPERT: ${series.id} · ${key}`,
              `Reprogramación: ${managementLinks.rescheduleUrl}`,
            ].join('\n'),
            updated_at: new Date().toISOString(),
          }).eq('id', confirmedAppointmentId);
          if (finalizeError) throw finalizeError;

          await ensureBookingAdminTask({
            admin,
            appointmentId: confirmedAppointmentId,
            serviceKey: series.service_key,
            serviceLabel: series.title,
            name: series.attendee_name,
            email: series.attendee_email.toLowerCase(),
            localDate: slot.localDate,
            localTime: formatMadridTime(slot.start),
            meetingUrl,
            clientId: series.client_id,
            companyId: series.company_id,
            leadId: series.lead_id,
          });

          const { error: occurrenceFinalizeError } = await admin.from('recurring_meeting_occurrences').update({
            appointment_id: confirmedAppointmentId,
            status: 'confirmed',
            last_error: null,
            updated_at: new Date().toISOString(),
          }).eq('id', occurrenceId);
          if (occurrenceFinalizeError) throw occurrenceFinalizeError;
          confirmed++;
        } catch (materializeError) {
          if (remoteEventId) {
            await deleteBookingCalendarEvent(
              remoteEventId,
              getConfiguredBookingCalendarProvider(),
            ).catch(() => {});
          }
          if (appointmentId) {
            await admin.from('appointments').delete().eq('id', appointmentId).eq('status', 'pending_calendar');
            await admin.from('appointments').delete().eq('id', appointmentId).eq('status', 'confirmed');
          }
          throw materializeError;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes('conflict')) conflicts++;
        errors.push(`${series.id}:${key}: ${message}`);
        if (occurrenceId) {
          await admin.from('recurring_meeting_occurrences').update({
            status: message.includes('conflict') ? 'conflict' : 'error',
            last_error: message.slice(0, 500),
            updated_at: new Date().toISOString(),
          }).eq('id', occurrenceId);
        }
      }
    }
  }

  return { planned, confirmed, existing, conflicts, errors };
}
