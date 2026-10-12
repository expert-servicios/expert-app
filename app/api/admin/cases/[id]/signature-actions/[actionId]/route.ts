import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { requireActiveActor } from '@/lib/auth/active-actor';
import {
  KIA_SIGNATURE_ACTION_TYPE,
  KIA_SIGNATURE_CAPABILITY,
  recordKiaSignatureLifecycle,
} from '@/lib/ai/kia/kia-signature-workflow';
import { getScopedAdminCase } from '../scope';

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; actionId: string }> },
) {
  try {
    const actor = await requireActiveActor(request, ['admin', 'owner']);
    if (!actor) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const { id: caseId, actionId } = await params;
    const admin = getSupabaseAdmin();
    const scopedCase = await getScopedAdminCase(admin, caseId, actor.tenantId);
    if (!scopedCase) {
      return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 });
    }

    let actionQuery = admin
      .from('administrative_actions')
      .select('id')
      .eq('id', actionId)
      .eq('case_id', scopedCase.id)
      .eq('capability', KIA_SIGNATURE_CAPABILITY)
      .eq('action_type', KIA_SIGNATURE_ACTION_TYPE);

    actionQuery = scopedCase.tenant_id
      ? actionQuery.eq('tenant_id', scopedCase.tenant_id)
      : actionQuery.is('tenant_id', null);
    actionQuery = scopedCase.company_id
      ? actionQuery.eq('company_id', scopedCase.company_id)
      : actionQuery.is('company_id', null);

    const { data: scopedAction, error: actionError } = await actionQuery.maybeSingle();
    if (actionError) throw actionError;
    if (!scopedAction) {
      return NextResponse.json(
        { error: 'Solicitud de firma no encontrada en el expediente.' },
        { status: 404 },
      );
    }

    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Payload inválido', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const result = await recordKiaSignatureLifecycle(admin, {
      actionId,
      caseId: scopedCase.id,
      actorId: actor.userId,
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
