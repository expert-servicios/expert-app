import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { sendEmail } from '@/lib/email/send';
import { citaConfirmed } from '@/lib/email/templates';
import {
  BookingCalendarCreationError,
  BookingCalendarDeletionError,
  BookingCalendarUpdateError,
  calendarProviderFromBookingProvider,
  createBookingCalendarMeeting,
  deleteBookingCalendarEvent,
  ensureBookingCalendarMeetingUrl,
  getConfiguredBookingCalendarProvider,
  isBookingCalendarConfigured,
  updateBookingCalendarMeeting,
} from '@/lib/booking/calendar-provider';
import { formatMadridDate, formatMadridTime, madridLocalToDate } from '@/lib/booking/native-booking';
import { ensureBookingAdminTask, cancelBookingAdminTask } from '@/lib/booking/booking-admin-task';
import { resolveActiveClientIdsByEmails, resolveBookingIdentityByEmail } from '@/lib/admin/onboarding-booking-identity';
import { attributionFromMetadata } from '@/lib/marketing/server-attribution';
import { describeContentOrigin } from '@/lib/marketing/content-origin';

async function requireAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  return (profile?.role === 'admin' || profile?.role === 'owner') ? admin : null;
}

type AppointmentLeadContext = {
  id: string;
  email?: string | null;
  phone?: string | null;
  source: string | null;
  source_key: string | null;
  metadata: unknown;
};

type ActiveClientIndex = Map<string, string[]>;

function latestLeadInteraction(metadata: unknown) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;
  const value = (metadata as Record<string, unknown>).last_acquisition;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  return {
    at: typeof record.at === 'string' ? record.at : null,
    intent: typeof record.intent === 'string' ? record.intent : null,
    action: typeof record.action === 'string' ? record.action : null,
    origin: typeof record.origin === 'string' ? record.origin : null,
    service: typeof record.service === 'string' ? record.service : null,
  };
}

function taskContentOrigin(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;
  const value = (metadata as Record<string, unknown>).content_origin;
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

type LegacyLeadIndex = {
  byEmail: Map<string, AppointmentLeadContext[]>;
  byPhone: Map<string, AppointmentLeadContext[]>;
};

function normalizeEmail(value: string | null | undefined) {
  return (value ?? '').trim().toLowerCase();
}

function normalizePhone(value: string | null | undefined) {
  return (value ?? '').trim();
}

function chunkValues<T>(values: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let offset = 0; offset < values.length; offset += size) {
    chunks.push(values.slice(offset, offset + size));
  }
  return chunks;
}

function indexLead(
  index: LegacyLeadIndex,
  lead: AppointmentLeadContext & { email?: string | null; phone?: string | null },
) {
  const email = normalizeEmail(lead.email);
  if (email) {
    const rows = index.byEmail.get(email) ?? [];
    rows.push(lead);
    index.byEmail.set(email, rows);
  }
  const phone = normalizePhone(lead.phone);
  if (phone) {
    const rows = index.byPhone.get(phone) ?? [];
    rows.push(lead);
    index.byPhone.set(phone, rows);
  }
}

async function loadLegacyLeadIndex(
  admin: ReturnType<typeof getSupabaseAdmin>,
  appointments: Array<{ email: string; phone: string | null }>,
): Promise<LegacyLeadIndex> {
  const index: LegacyLeadIndex = { byEmail: new Map(), byPhone: new Map() };
  const emails = [...new Set(appointments.map((row) => normalizeEmail(row.email)).filter(Boolean))];
  const phones = [...new Set(appointments.map((row) => normalizePhone(row.phone)).filter(Boolean))];

  const rows = new Map<string, AppointmentLeadContext & { email?: string | null; phone?: string | null }>();

  if (emails.length > 0) {
    for (let offset = 0; offset < emails.length; offset += 40) {
      const batch = emails.slice(offset, offset + 40);
      const filter = batch
        .map((email) => `email.ilike.${email.replace(/[%_(),\\]/g, (char) => `\\${char}`)}`)
        .join(',');
      const { data, error } = await admin
        .from('leads')
        .select('id,email,phone,source,source_key,metadata')
        .or(filter);
      if (error) throw error;
      for (const lead of data ?? []) rows.set(lead.id, lead as AppointmentLeadContext & { email?: string | null; phone?: string | null });
    }
  }

  if (phones.length > 0) {
    for (let offset = 0; offset < phones.length; offset += 100) {
      const batch = phones.slice(offset, offset + 100);
      const { data, error } = await admin
        .from('leads')
        .select('id,email,phone,source,source_key,metadata')
        .in('phone', batch);
      if (error) throw error;
      for (const lead of data ?? []) rows.set(lead.id, lead as AppointmentLeadContext & { email?: string | null; phone?: string | null });
    }
  }

  for (const lead of rows.values()) indexLead(index, lead);
  return index;
}

function resolveLegacyAppointmentLead(
  index: LegacyLeadIndex,
  appointment: { email: string; phone: string | null },
): { lead: AppointmentLeadContext | null; ambiguous: boolean } {
  const emailMatches = index.byEmail.get(normalizeEmail(appointment.email)) ?? [];
  const phoneMatches = index.byPhone.get(normalizePhone(appointment.phone)) ?? [];

  if (emailMatches.length > 1 || phoneMatches.length > 1) {
    return { lead: null, ambiguous: true };
  }

  const emailMatch = emailMatches[0] ?? null;
  const phoneMatch = phoneMatches[0] ?? null;
  if (emailMatch && phoneMatch && emailMatch.id !== phoneMatch.id) {
    return { lead: null, ambiguous: true };
  }

  return { lead: emailMatch ?? phoneMatch, ambiguous: false };
}

async function loadClientCompanyMemberships(
  admin: ReturnType<typeof getSupabaseAdmin>,
  clientIds: string[],
): Promise<Set<string>> {
  const memberships = new Set<string>();
  for (const clientIdBatch of chunkValues([...new Set(clientIds)], 100)) {
    const { data, error } = await admin
      .from('profile_companies')
      .select('profile_id,company_id')
      .in('profile_id', clientIdBatch);
    if (error) throw error;
    for (const row of data ?? []) {
      memberships.add(`${row.profile_id}:${row.company_id}`);
    }
  }
  return memberships;
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = admin
      .from('appointments')
      .select('id,name,email,phone,service,appointment_type,appointment_date,appointment_end,booking_provider,provider_booking_id,preferred_date,preferred_time,notes,status,confirmed_date,confirmed_time,meeting_url,admin_notes,google_event_id,created_at,client_id,company_id')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') query = query.eq('status', status);

    const { data, error } = await query;
    if (error) {
      console.error('[admin/citas] GET:', error);
      return NextResponse.json({ error: 'Error al obtener citas' }, { status: 500 });
    }

    const appointments = data ?? [];
    const appointmentIds = appointments.map((appointment) => appointment.id);
    const tasksByAppointment = new Map<string, {
      lead_id: string | null;
      client_id: string | null;
      company_id: string | null;
      metadata: unknown;
    }>();

    for (const appointmentIdBatch of chunkValues(appointmentIds, 100)) {
      const { data: tasks, error: taskError } = await admin
        .from('internal_tasks')
        .select('booking_appointment_id,lead_id,client_id,company_id,metadata')
        .in('booking_appointment_id', appointmentIdBatch);
      if (taskError) throw taskError;
      for (const task of tasks ?? []) {
        if (task.booking_appointment_id) tasksByAppointment.set(task.booking_appointment_id, task);
      }
    }

    const taskLeadIds = [...new Set(
      [...tasksByAppointment.values()].map((task) => task.lead_id).filter(Boolean)
    )] as string[];
    const leadsById = new Map<string, AppointmentLeadContext>();

    for (const leadIdBatch of chunkValues(taskLeadIds, 100)) {
      const { data: taskLeads, error: taskLeadError } = await admin
        .from('leads')
        .select('id,email,phone,source,source_key,metadata')
        .in('id', leadIdBatch);
      if (taskLeadError) throw taskLeadError;
      for (const lead of taskLeads ?? []) leadsById.set(lead.id, lead as AppointmentLeadContext);
    }

    const legacyCandidates = appointments.filter((appointment) => {
      const task = tasksByAppointment.get(appointment.id) ?? null;
      return !task?.lead_id
        && !appointment.client_id
        && !task?.client_id;
    });
    const legacyLeadIndex = await loadLegacyLeadIndex(admin, legacyCandidates);

    const clientLookupCandidates = appointments.filter((appointment) => {
      const task = tasksByAppointment.get(appointment.id) ?? null;
      return !appointment.client_id && !task?.client_id;
    });
    const activeClientIndex = await resolveActiveClientIdsByEmails(
      admin,
      appointments.map((appointment) => appointment.email)
    );
    const fallbackClientIds = clientLookupCandidates.flatMap(
      (appointment) => activeClientIndex.get(normalizeEmail(appointment.email)) ?? []
    );

    const candidateClientIds = [...new Set(
      appointments.flatMap((appointment) => {
        const task = tasksByAppointment.get(appointment.id) ?? null;
        return [appointment.client_id, task?.client_id].filter(Boolean);
      }).concat(fallbackClientIds)
    )] as string[];

    const activeClientIds = new Set<string>();
    for (const clientIdBatch of chunkValues(candidateClientIds, 100)) {
      const { data: profiles, error: profileError } = await admin
        .from('profiles')
        .select('id')
        .in('id', clientIdBatch)
        .eq('role', 'client')
        .eq('status', 'active');
      if (profileError) throw profileError;
      for (const profile of profiles ?? []) activeClientIds.add(profile.id);
    }

    const clientCompanyMemberships = await loadClientCompanyMemberships(admin, candidateClientIds);

    const enriched = appointments.map((appointment) => {
      const task = tasksByAppointment.get(appointment.id) ?? null;

      const clientConflict = Boolean(
        appointment.client_id && task?.client_id && appointment.client_id !== task.client_id
      );
      const companyConflict = Boolean(
        appointment.company_id && task?.company_id && appointment.company_id !== task.company_id
      );
      const sourceIdentityConflict = clientConflict || companyConflict;

      let lead = sourceIdentityConflict
        ? null
        : (task?.lead_id ? (leadsById.get(task.lead_id) ?? null) : null);
      let relationshipSource: 'task' | 'appointment' | 'matched' | 'none' = sourceIdentityConflict
        ? 'none'
        : task
          ? 'task'
          : (appointment.client_id || appointment.company_id ? 'appointment' : 'none');
      let ambiguousLeadMatch = false;

      const rawClientId = sourceIdentityConflict ? null : (appointment.client_id ?? task?.client_id ?? null);
      const verifiedClientId = rawClientId && activeClientIds.has(rawClientId) ? rawClientId : null;
      const invalidClientIdentity = Boolean(rawClientId && !verifiedClientId);
      const fallbackClientMatches = !rawClientId && !sourceIdentityConflict
        ? (activeClientIndex.get(normalizeEmail(appointment.email)) ?? [])
        : [];
      const ambiguousClientMatch = fallbackClientMatches.length > 1;
      const fallbackClientId = fallbackClientMatches.length === 1 ? fallbackClientMatches[0] : null;
      const resolvedClientId = verifiedClientId ?? fallbackClientId;
      const rawCompanyId = sourceIdentityConflict
        ? null
        : (appointment.company_id ?? task?.company_id ?? null);

      if (!lead && !sourceIdentityConflict && !invalidClientIdentity && !ambiguousClientMatch) {
        const resolved = resolveLegacyAppointmentLead(legacyLeadIndex, {
          email: appointment.email,
          phone: appointment.phone,
        });
        lead = resolved.lead;
        ambiguousLeadMatch = resolved.ambiguous;
        if (lead) relationshipSource = 'matched';
      }

      const leadEmail = normalizeEmail(lead?.email);
      const resolvedClientMatches = resolvedClientId
        ? (activeClientIndex.get(normalizeEmail(appointment.email)) ?? [])
        : [];
      const resolvedClientMatchesAppointmentEmail = resolvedClientId
        ? resolvedClientMatches.includes(resolvedClientId)
        : false;
      const leadClientConflict = Boolean(
        resolvedClientId
        && lead
        && leadEmail
        && (
          !resolvedClientMatchesAppointmentEmail
          || leadEmail !== normalizeEmail(appointment.email)
        )
      );
      const clientCompanyConflict = Boolean(
        resolvedClientId
        && rawCompanyId
        && !clientCompanyMemberships.has(`${resolvedClientId}:${rawCompanyId}`)
      );
      const identityConflict = sourceIdentityConflict
        || ambiguousClientMatch
        || leadClientConflict
        || clientCompanyConflict;

      if (identityConflict) {
        lead = null;
        relationshipSource = 'none';
      }

      const latestInteraction = lead ? latestLeadInteraction(lead.metadata) : null;
      const acquisition = lead ? attributionFromMetadata(lead.metadata) : null;
      const taskOrigin = taskContentOrigin(task?.metadata);
      const acquisitionOrigin = acquisition?.originPath?.trim() || null;
      const sourceFallback = lead?.source_key?.trim() || lead?.source?.trim() || null;
      const rawOrigin = latestInteraction?.origin ?? taskOrigin ?? acquisitionOrigin ?? sourceFallback;
      const originLabel = latestInteraction?.origin || taskOrigin
        ? describeContentOrigin(rawOrigin)
        : acquisitionOrigin
          ? `Web · ${acquisitionOrigin}`
          : sourceFallback
            ? `Origen · ${sourceFallback}`
            : null;

      return {
        ...appointment,
        lead_id: identityConflict ? null : (lead?.id ?? task?.lead_id ?? null),
        client_id: identityConflict ? null : resolvedClientId,
        company_id: identityConflict ? null : rawCompanyId,
        crm_context: {
          relationship_source: relationshipSource,
          ambiguous_lead_match: ambiguousLeadMatch,
          ambiguous_client_match: ambiguousClientMatch,
          identity_conflict: identityConflict,
          invalid_client_identity: invalidClientIdentity,
          source: lead?.source ?? null,
          source_key: lead?.source_key ?? null,
          acquisition,
          origin: rawOrigin,
          origin_label: originLabel,
          latest_interaction: latestInteraction,
        },
      };
    });

    return NextResponse.json({ appointments: enriched });
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
      .select('id,name,email,service,appointment_type,status,confirmed_date,confirmed_time,meeting_url,admin_notes,google_event_id,appointment_date,appointment_end,booking_provider,provider_booking_id,client_id,company_id')
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
      .select('id,name,email,service,appointment_type,confirmed_date,confirmed_time,meeting_url,admin_notes,status,google_event_id,appointment_date,appointment_end,booking_provider,provider_booking_id,client_id,company_id')
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
        let meetingUrlRecoveryEventId: string | null = null;

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
              try {
                syncedEventId = await updateBookingCalendarMeeting(eventId, {
                  summary: `Cita: ${appt.service ?? 'Consultoría'} — ${appt.name}`,
                  description: `Cliente: ${appt.name} (${appt.email})\nServicio: ${appt.service ?? ''}\n${appt.meeting_url ? `Reunión: ${appt.meeting_url}` : ''}`.trim(),
                  start: start.toISOString(),
                  end: end.toISOString(),
                  timezone: 'Europe/Madrid',
                  reminderMinutesBefore: [1440, 60],
                }, calendarProvider);
                existingRemoteEventUpdated = true;

                if (!meetingUrl) {
                  try {
                    meetingUrl = await ensureBookingCalendarMeetingUrl(
                      syncedEventId,
                      calendarProvider
                    );
                  } catch (meetingUrlError) {
                    meetingUrlRecoveryEventId = syncedEventId;
                    throw meetingUrlError;
                  }
                }
              } catch (updateError) {
                if (
                  updateError instanceof BookingCalendarUpdateError &&
                  updateError.remoteUpdated
                ) {
                  existingRemoteEventUpdated = true;
                  syncedEventId = updateError.eventId;
                  throw updateError;
                }
                throw updateError;
              }
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
              : meetingUrlRecoveryEventId;
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
          const baseAdminNotes = keepSynchronizedSchedule
            ? appt.admin_notes
            : current.admin_notes;
          const reconciledAdminNotes = reconciliationNotice
            ? [baseAdminNotes?.trim(), reconciliationNotice]
                .filter(Boolean)
                .join('\n\n')
            : baseAdminNotes;

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
          // time. Continue to the normal confirmation/response path with the
          // already-persisted values from the initial Admin update.
        }
      }
    }

    if (appt.status === 'confirmed' && appt.confirmed_date && appt.confirmed_time) {
      let clientId = appt.client_id as string | null;
      let companyId = appt.company_id as string | null;
      if (!clientId && appt.email) {
        const identity = await resolveBookingIdentityByEmail(admin, appt.email as string).catch(() => null);
        clientId = identity?.clientId ?? null;
        companyId = identity?.companyId ?? null;
      }
      await ensureBookingAdminTask({
        admin,
        appointmentId: appt.id,
        serviceKey: (appt.appointment_type as string | null) ?? 'reunion',
        serviceLabel: (appt.service as string | null) ?? 'Reunión',
        name: appt.name as string,
        email: appt.email as string,
        localDate: appt.confirmed_date as string,
        localTime: String(appt.confirmed_time).slice(0, 5),
        meetingUrl: appt.meeting_url as string | null,
        clientId,
        companyId,
        reopenCancelled: current.status === 'cancelled' && appt.status === 'confirmed',
      }).catch((taskError) => console.error('[admin/citas] task sync:', taskError));
    } else if (appt.status === 'cancelled' || appt.status === 'rescheduled') {
      await cancelBookingAdminTask(
        admin,
        appt.id,
        `Cita actualizada desde Admin: ${appt.status}`,
      ).catch((taskError) => console.error('[admin/citas] task cancel:', taskError));
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
      .select('id,google_event_id,booking_provider,provider_booking_id')
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

    await cancelBookingAdminTask(
      admin,
      id,
      'Cita eliminada desde Admin.',
    ).catch((taskError) => console.error('[admin/citas] DELETE task:', taskError));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin/citas]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
