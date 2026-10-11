import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { requireActiveActor } from '@/lib/auth/active-actor';
import { recordKiaSignatureLifecycle } from '@/lib/ai/kia/kia-signature-workflow';

const signerSchema = z.object({
  id: z.string().max(200).optional().nullable(),
  name: z.string().max(200).optional().nullable(),
  email: z.string().email().optional().nullable(),
  status: z.enum(['pending', 'signed', 'declined']),
}).strict();

const bodySchema = z.object({
  lifecycle: z.enum(['requested', 'partially_signed', 'completed', 'cancelled']),
  signers: z.array(signerSchema).max(20).optional(),
  finalDocumentId: z.string().uuid().optional().nullable(),
}).strict();

async function requireStaff(request: NextRequest) {
  const actor = await requireActiveActor(request, ['admin', 'owner']);
  if (!actor) return null;
  return { admin: getSupabaseAdmin(), actorId: actor.userId };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; actionId: string }> },
) {
  const ctx = await requireStaff(request);
  if (!ctx) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { id: caseId, actionId } = await params;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Payload inválido', details: parsed.error.flatten() }, { status: 400 });
  }

  const { data: scopedCase, error: caseError } = await ctx.admin
    .from('cases')
    .select('id')
    .eq('id', caseId)
    .maybeSingle();
  if (caseError) return NextResponse.json({ error: caseError.message }, { status: 500 });
  if (!scopedCase) return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 });

  try {
    const result = await recordKiaSignatureLifecycle(ctx.admin, {
      actionId,
      caseId,
      actorId: ctx.actorId,
      lifecycle: parsed.data.lifecycle,
      signers: parsed.data.signers,
      finalDocumentId: parsed.data.finalDocumentId,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 409 });
    return NextResponse.json(result);
  } catch (error) {
    console.error('[admin/signature-actions] lifecycle update failed', error);
    return NextResponse.json({ error: 'No se pudo actualizar el estado de firma.' }, { status: 500 });
  }
}
