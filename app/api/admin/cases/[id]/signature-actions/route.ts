import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { requireActiveActor } from '@/lib/auth/active-actor';
import {
  KIA_SIGNATURE_ACTION_TYPE,
  KIA_SIGNATURE_CAPABILITY,
} from '@/lib/ai/kia/kia-signature-workflow';
import { getScopedAdminCase } from './scope';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireActiveActor(request, ['admin', 'owner']);
    if (!actor) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const { id: caseId } = await params;
    const admin = getSupabaseAdmin();
    const scopedCase = await getScopedAdminCase(admin, caseId, actor.tenantId);
    if (!scopedCase) {
      return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 });
    }

    let actionQuery = admin
      .from('administrative_actions')
      .select('id,state,action_snapshot,row_version,created_at,updated_at')
      .eq('case_id', scopedCase.id)
      .eq('capability', KIA_SIGNATURE_CAPABILITY)
      .eq('action_type', KIA_SIGNATURE_ACTION_TYPE);

    actionQuery = scopedCase.tenant_id
      ? actionQuery.eq('tenant_id', scopedCase.tenant_id)
      : actionQuery.is('tenant_id', null);
    actionQuery = scopedCase.company_id
      ? actionQuery.eq('company_id', scopedCase.company_id)
      : actionQuery.is('company_id', null);

    const { data: actions, error: actionError } = await actionQuery
      .order('created_at', { ascending: false })
      .limit(50);
    if (actionError) throw actionError;

    const actionIds = (actions ?? []).map((action) => action.id);
    let events: {
      data: Array<Record<string, unknown>> | null;
      error: { message: string } | null;
    } = { data: [], error: null };

    if (actionIds.length) {
      let eventQuery = admin
        .from('administrative_action_events')
        .select('action_id,event_type,payload,created_at')
        .in('action_id', actionIds)
        .like('event_type', 'signature.%');

      eventQuery = scopedCase.tenant_id
        ? eventQuery.eq('tenant_id', scopedCase.tenant_id)
        : eventQuery.is('tenant_id', null);

      events = await eventQuery.order('created_at', { ascending: true });
    }
    if (events.error) throw events.error;

    const eventMap = new Map<string, Array<Record<string, unknown>>>();
    for (const event of events.data ?? []) {
      const actionId = String(event.action_id ?? '');
      const list = eventMap.get(actionId) ?? [];
      list.push(event);
      eventMap.set(actionId, list);
    }

    return NextResponse.json({
      actions: (actions ?? []).map((action) => {
        const actionEvents = eventMap.get(action.id) ?? [];
        const latest = actionEvents.at(-1) ?? null;
        return {
          id: action.id,
          state: action.state,
          snapshot: action.action_snapshot,
          rowVersion: action.row_version,
          latestEvent: latest,
          events: actionEvents,
          createdAt: action.created_at,
          updatedAt: action.updated_at,
        };
      }),
    });
  } catch (error) {
    console.error('[admin/signature-actions] list failed', error);
    return NextResponse.json({ error: 'No se pudieron cargar las solicitudes de firma.' }, { status: 500 });
  }
}
