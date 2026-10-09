import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { describeClientDevice, supportAuditAction, supportAuditActions, supportEventSchema } from '@/lib/workspace/support-audit';

type Params = { params: Promise<{ id: string }> };

async function authorize(request: NextRequest, id: string) {
  if (!z.string().uuid().safeParse(id).success) return null;
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const admin = getSupabaseAdmin();
  const { data: actor, error: actorError } = await admin
    .from('profiles').select('id,role,status').eq('id', user.id).maybeSingle();
  if (actorError || !actor || actor.status === 'inactive' || !['admin', 'owner'].includes(actor.role)) return null;

  const { data: subject, error: subjectError } = await admin
    .from('profiles').select('id').eq('id', id).maybeSingle();
  if (subjectError || !subject) return null;
  return { admin, actorId: user.id };
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const ctx = await authorize(request, id);
    if (!ctx) return NextResponse.json({ error: 'Acceso denegado o cliente no encontrado' }, { status: 403 });
    const { data, error } = await ctx.admin.from('audit_logs')
      .select('id,actor_id,action,metadata,created_at')
      .eq('entity', 'profiles')
      .eq('entity_id', id)
      .in('action', [...supportAuditActions])
      .order('created_at', { ascending: false })
      .limit(40);
    if (error) throw error;
    const actorIds = [...new Set((data ?? []).map((row) => row.actor_id).filter((value): value is string => Boolean(value)))];
    const actorNames = new Map<string, string>();
    if (actorIds.length) {
      const { data: actors, error: actorLookupError } = await ctx.admin.from('profiles')
        .select('id,full_name,email')
        .in('id', actorIds);
      if (actorLookupError) throw actorLookupError;
      for (const actor of actors ?? []) {
        actorNames.set(actor.id, actor.full_name || actor.email || actor.id);
      }
    }
    const events = (data ?? []).map((row) => ({
      id: row.id,
      actorId: row.actor_id,
      actorName: actorNames.get(row.actor_id ?? '') ?? 'Cuenta administrativa',
      action: row.action,
      companyId: (row.metadata as Record<string, unknown> | null)?.company_id ?? null,
      platform: (row.metadata as Record<string, unknown> | null)?.platform ?? 'Desconocido',
      browser: (row.metadata as Record<string, unknown> | null)?.browser ?? 'Desconocido',
      createdAt: row.created_at,
    }));
    return NextResponse.json({ events }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[support-access GET]', error);
    return NextResponse.json({ error: 'No se pudo consultar la auditoría' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    // Browser-originated writes require same-origin requests, in addition to user auth.
    const origin = request.headers.get('origin');
    if (origin && new URL(origin).host !== request.nextUrl.host) {
      return NextResponse.json({ error: 'Origen no autorizado' }, { status: 403 });
    }
    const { id } = await params;
    const ctx = await authorize(request, id);
    if (!ctx) return NextResponse.json({ error: 'Acceso denegado o cliente no encontrado' }, { status: 403 });

    const parsed = supportEventSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Evento inválido' }, { status: 400 });
    const { event, companyId } = parsed.data;

    if (companyId) {
      const { data: linked, error } = await ctx.admin
        .from('profile_companies')
        .select('company_id')
        .eq('profile_id', id)
        .eq('company_id', companyId)
        .maybeSingle();
      if (error) throw error;
      if (!linked) return NextResponse.json({ error: 'Empresa no vinculada a este cliente' }, { status: 403 });
    }

    const device = describeClientDevice(request.headers.get('user-agent'));
    const { data: audit, error } = await ctx.admin.from('audit_logs').insert({
      actor_id: ctx.actorId,
      action: supportAuditAction(event),
      entity: 'profiles',
      entity_id: id,
      metadata: {
        company_id: companyId,
        source: 'admin_client_portal',
        platform: device.platform,
        browser: device.browser,
        user_agent: device.userAgent,
        device_source: 'unverified_user_agent',
      },
    }).select('id,created_at').single();
    if (error) throw error;
    return NextResponse.json({ ok: true, auditId: audit.id, createdAt: audit.created_at }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[support-access POST]', error);
    return NextResponse.json({ error: 'No se pudo registrar el acceso' }, { status: 500 });
  }
}
