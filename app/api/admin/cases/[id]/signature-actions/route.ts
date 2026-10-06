import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { KIA_SIGNATURE_ACTION_TYPE, KIA_SIGNATURE_CAPABILITY } from '@/lib/ai/kia/kia-signature-workflow';

async function requireStaff(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const admin = getSupabaseAdmin();
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('role,status')
    .eq('id', user.id)
    .maybeSingle();
  if (profileError || !profile || profile.status === 'inactive' || !['admin', 'owner'].includes(profile.role)) return null;
  return { admin, actorId: user.id };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireStaff(request);
  if (!ctx) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  const { id: caseId } = await params;

  const { data: scopedCase, error: caseError } = await ctx.admin
    .from('cases')
    .select('id')
    .eq('id', caseId)
    .maybeSingle();
  if (caseError) return NextResponse.json({ error: caseError.message }, { status: 500 });
  if (!scopedCase) return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 });

  const { data: actions, error: actionError } = await ctx.admin
    .from('administrative_actions')
    .select('id,state,action_snapshot,row_version,created_at,updated_at')
    .eq('case_id', caseId)
    .eq('capability', KIA_SIGNATURE_CAPABILITY)
    .eq('action_type', KIA_SIGNATURE_ACTION_TYPE)
    .order('created_at', { ascending: false })
    .limit(50);
  if (actionError) return NextResponse.json({ error: actionError.message }, { status: 500 });

  const actionIds = (actions ?? []).map((action) => action.id);
  const events = actionIds.length
    ? await ctx.admin
        .from('administrative_action_events')
        .select('action_id,event_type,payload,created_at')
        .in('action_id', actionIds)
        .like('event_type', 'signature.%')
        .order('created_at', { ascending: true })
    : { data: [], error: null };
  if (events.error) return NextResponse.json({ error: events.error.message }, { status: 500 });

  const eventMap = new Map<string, Array<Record<string, unknown>>>();
  for (const event of events.data ?? []) {
    const list = eventMap.get(event.action_id) ?? [];
    list.push(event as Record<string, unknown>);
    eventMap.set(event.action_id, list);
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
}
