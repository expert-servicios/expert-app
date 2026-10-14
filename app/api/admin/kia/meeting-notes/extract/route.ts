import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireActiveActor } from '@/lib/auth/active-actor';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { discoverCalendarMeetingNoteCandidates } from '@/lib/integrations/google-meeting-notes';
import { extractMeetingReviewCandidates } from '@/lib/ai/kia/kia-meeting-notes-extract';
import { reviewMeetingStatements } from '@/lib/ai/kia/kia-meeting-note-review';

const requestSchema = z.object({
  appointmentId: z.string().uuid(),
  fileId: z.string().regex(/^[a-zA-Z0-9_-]{15,128}$/),
}).strict();

function reply(data: Record<string, unknown>, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } });
}

/** Read-only preview. No email, tasks, client record or accounting changes. */
export async function POST(request: NextRequest) {
  try {
    const actor = await requireActiveActor(request, ['admin', 'owner']);
    if (!actor) return reply({ error: 'No autorizado' }, 403);
    if (Number(request.headers.get('content-length') ?? 0) > 4096) return reply({ error: 'Solicitud demasiado extensa' }, 413);
    const bodyText = await request.text();
    if (bodyText.length > 4096) return reply({ error: 'Solicitud demasiado extensa' }, 413);
    const parsed = requestSchema.safeParse(JSON.parse(bodyText));
    if (!parsed.success) return reply({ error: 'Solicitud inválida' }, 400);

    const admin = getSupabaseAdmin();
    const { data: appointment, error: appointmentError } = await admin.from('appointments')
      .select('id,company_id,client_id,booking_provider,google_event_id,appointment_end,status')
      .eq('id', parsed.data.appointmentId).maybeSingle();
    if (appointmentError) return reply({ error: 'Error consultando la cita' }, 503);
    if (!appointment?.company_id || !appointment.google_event_id
      || appointment.booking_provider !== 'google_native' || appointment.status === 'cancelled') {
      return reply({ error: 'Cita de Google Meet no vinculada' }, 409);
    }
    const end = Date.parse(appointment.appointment_end ?? '');
    if (!Number.isFinite(end) || end > Date.now()) return reply({ error: 'La reunión no ha terminado' }, 409);

    const { data: subject, error: subjectError } = await admin.from('client_registry_subjects')
      .select('id,company_id,merged_into_subject_id')
      .eq('company_id', appointment.company_id)
      .is('merged_into_subject_id', null).maybeSingle();
    const { data: company, error: companyError } = await admin.from('companies')
      .select('id,forma_juridica').eq('id', appointment.company_id).maybeSingle();
    if (subjectError || companyError || !subject || !company || subject.company_id !== company.id) {
      return reply({ error: 'Identidad empresarial no verificada' }, 409);
    }

    const discovery = await discoverCalendarMeetingNoteCandidates(appointment.google_event_id);
    const candidate = discovery.candidates.find((item) => item.fileId === parsed.data.fileId);
    if (!candidate) return reply({ error: 'Documento no vinculado a la reunión' }, 403);

    const email = process.env.GOOGLE_GMAIL_SA_EMAIL;
    const key = process.env.GOOGLE_GMAIL_SA_PRIVATE_KEY;
    if (!email || !key) return reply({ error: 'Google Drive no configurado' }, 503);
    // Read-only, exactly one bound Google Doc. The service account needs
    // explicit Drive authorization; never broaden scopes or discover by title.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { google } = (await import('googleapis')) as any;
    const auth = new google.auth.JWT({
      email, key: key.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
      subject: 'info@expertconsulting.es',
    });
    const drive = google.drive({ version: 'v3', auth });
    const file = await drive.files.get({
      fileId: candidate.fileId,
      fields: 'id,mimeType,trashed,modifiedTime,size',
      supportsAllDrives: true,
    });
    if (file.data.id !== candidate.fileId
      || file.data.mimeType !== 'application/vnd.google-apps.document'
      || file.data.trashed) return reply({ error: 'Documento no disponible' }, 409);

    const exported = await drive.files.export({
      fileId: candidate.fileId,
      mimeType: 'text/plain',
    }, { responseType: 'text' });
    const raw = exported.data;
    if (typeof raw !== 'string' || raw.length > 300_000) {
      return reply({ error: 'Notas demasiado extensas o no disponibles' }, 413);
    }
    const candidates = extractMeetingReviewCandidates(raw);
    const status = reviewMeetingStatements(candidates.map((claim) => ({
      ...claim,
      meetingId: discovery.eventId,
      notesVersion: String(file.data.modifiedTime ?? 'unknown'),
      subjectId: subject.id,
      companyId: company.id,
      legalEntityScope: company.forma_juridica === 'autonomo' ? 'natural_person' as const : 'legal_entity' as const,
      meetingNotesRef: candidate.sourceUrl,
      evidence: [{ ref: candidate.sourceUrl, kind: 'meeting_notes' as const, verified: false }],
      authorityDecisions: [],
    })));
    return reply({
      ok: true,
      previewOnly: true,
      appointmentId: appointment.id,
      companyId: company.id,
      subjectId: subject.id,
      fileId: candidate.fileId,
      notesVersion: file.data.modifiedTime ?? null,
      results: status,
      pendingReviewCount: status.filter((item) => item.status === 'pending_review').length,
      writesPerformed: false,
    });
  } catch (error) {
    if (error instanceof SyntaxError) return reply({ error: 'JSON inválido' }, 400);
    console.error('[admin/kia/meeting-notes/extract]', error);
    return reply({ error: 'No se pudieron extraer las cuestiones' }, 503);
  }
}
