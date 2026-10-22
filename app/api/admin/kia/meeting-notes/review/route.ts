import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireActiveActor } from '@/lib/auth/active-actor';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { reviewMeetingStatements } from '@/lib/ai/kia/kia-meeting-note-review';

/**
 * Manual preview gateway for Gemini/Google Meet extracts.
 *
 * This endpoint deliberately DOES NOT accept client-provided "verified",
 * "approved", "authorityDecisions", "evidence" or write-action fields.
 * Verification and execution will be separate, audited server workflows.
 */
const reviewRequestSchema = z.object({
  meetingId: z.string().trim().min(1).max(160),
  notesVersion: z.string().trim().min(1).max(100),
  notesRef: z.string().url().max(1200).refine((raw) => {
    const url = new URL(raw);
    return url.protocol === 'https:' && [
      'docs.google.com',
      'drive.google.com',
    ].includes(url.hostname);
  }, 'Notas deben proceder de Google Drive'),
  subjectId: z.string().uuid(),
  companyId: z.string().uuid(),
  claims: z.array(z.object({
    claimId: z.string().trim().min(1).max(160),
    title: z.string().trim().min(1).max(300),
    kind: z.enum(['fact', 'question', 'proposed_action', 'legal_or_tax_opinion', 'census_attribute']),
  }).strict()).min(1).max(40),
}).strict();

function noStore(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store' },
  });
}

export async function POST(request: NextRequest) {
  try {
    // Never parse meeting content before verifying that this is an Admin.
    const actor = await requireActiveActor(request, ['admin', 'owner']);
    if (!actor) return noStore({ error: 'No autorizado' }, 403);

    if (Number(request.headers.get('content-length') ?? 0) > 65_536) {
      return noStore({ error: 'Contenido demasiado extenso' }, 413);
    }

    const rawBody = await request.text();
    if (rawBody.length > 65_536) return noStore({ error: 'Contenido demasiado extenso' }, 413);
    const body = reviewRequestSchema.safeParse(JSON.parse(rawBody));
    if (!body.success) return noStore({ error: 'Datos inválidos' }, 400);

    const admin = getSupabaseAdmin();
    const [{ data: subject, error: subjectError }, { data: company, error: companyError }] =
      await Promise.all([
        admin.from('client_registry_subjects')
          .select('id,company_id,merged_into_subject_id')
          .eq('id', body.data.subjectId).maybeSingle(),
        admin.from('companies').select('id,forma_juridica')
          .eq('id', body.data.companyId).maybeSingle(),
      ]);
    if (subjectError || companyError) return noStore({ error: 'No se pudo verificar la identidad' }, 500);
    if (!subject || subject.merged_into_subject_id || !company || subject.company_id !== company.id) {
      return noStore({ error: 'La hoja registral no corresponde a la empresa indicada' }, 409);
    }

    const scope = company.forma_juridica === 'autonomo' ? 'natural_person' : 'legal_entity';
    const reviewed = reviewMeetingStatements(body.data.claims.map((claim) => ({
      meetingId: body.data.meetingId,
      notesVersion: body.data.notesVersion,
      meetingNotesRef: body.data.notesRef,
      subjectId: subject.id,
      legalEntityScope: scope,
      companyId: company.id,
      claimId: claim.claimId,
      kind: claim.kind,
      title: claim.title,
      // A source document is NEVER proof that an assertion is true.
      evidence: [{ kind: 'meeting_notes' as const, ref: body.data.notesRef, verified: false }],
      authorityDecisions: [],
    })));

    return noStore({
      ok: true,
      previewOnly: true,
      subjectId: subject.id,
      companyId: company.id,
      results: reviewed,
      pendingReviewCount: reviewed.filter((item) => item.status === 'pending_review').length,
      // No inserts, edits, tasks, emails or appointments are performed.
      writesPerformed: false,
    });
  } catch (error) {
    if (error instanceof SyntaxError) return noStore({ error: 'JSON inválido' }, 400);
    console.error('[admin/kia/meeting-notes/review] POST', error);
    return noStore({ error: 'No se pudo revisar las notas' }, 500);
  }
}
