import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { loadOperations360Inbox } from '@/lib/admin/operations-360-inbox';

async function requireAdminContext(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles')
    .select('role,status')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile || profile.status === 'inactive' || !['admin','owner'].includes(profile.role)) return null;
  return { admin, user };
}

function normalizeEmail(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireAdminContext(request);
    if (!ctx) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const body = await request.json().catch(() => ({}));
    const itemId = typeof body.itemId === 'string' ? body.itemId.trim().slice(0, 300) : '';
    const clientId = typeof body.clientId === 'string' ? body.clientId.trim() : '';
    const requestedCompanyId = typeof body.companyId === 'string' && body.companyId.trim() ? body.companyId.trim() : null;
    const requestedCaseId = typeof body.caseId === 'string' && body.caseId.trim() ? body.caseId.trim() : null;
    if (!itemId || !clientId) return NextResponse.json({ error: 'itemId y clientId son obligatorios' }, { status: 400 });

    const inbox = await loadOperations360Inbox(ctx.admin, { q: itemId, limit: 20 });
    const item = inbox.items.find((candidate) => candidate.id === itemId);
    if (!item) return NextResponse.json({ error: 'Entrada no encontrada' }, { status: 404 });

    const { data: client, error: clientError } = await ctx.admin
      .from('profiles')
      .select('id,email,full_name,status')
      .eq('id', clientId)
      .maybeSingle();
    if (clientError) throw clientError;
    if (!client || client.status === 'inactive') {
      return NextResponse.json({ error: 'Cliente no válido' }, { status: 404 });
    }

    if (item.source === 'email_inbox_cache') {
      const senderEmail = normalizeEmail(item.actor.email);
      const clientEmail = normalizeEmail(client.email);
      if (!senderEmail || !clientEmail || senderEmail !== clientEmail) {
        return NextResponse.json({ error: 'El remitente no coincide con el cliente seleccionado' }, { status: 409 });
      }
    }

    if (item.source === 'kia_conversations' && item.clientId !== clientId) {
      return NextResponse.json({ error: 'La identidad verificada de esta conversación no puede cambiarse desde Inbox' }, { status: 409 });
    }

    let companyId = requestedCompanyId;
    const caseId = requestedCaseId;

    if (caseId) {
      const { data: caseRow, error: caseError } = await ctx.admin
        .from('cases')
        .select('id,client_id,company_id')
        .eq('id', caseId)
        .maybeSingle();
      if (caseError) throw caseError;
      if (!caseRow || caseRow.client_id !== clientId) {
        return NextResponse.json({ error: 'El expediente no pertenece al cliente seleccionado' }, { status: 409 });
      }
      if (companyId && (caseRow.company_id ?? null) !== companyId) {
        return NextResponse.json({ error: 'La empresa no coincide con el expediente seleccionado' }, { status: 409 });
      }
      companyId = caseRow.company_id ?? null;
    }

    if (companyId) {
      const { data: membership, error: membershipError } = await ctx.admin
        .from('profile_companies')
        .select('company_id')
        .eq('profile_id', clientId)
        .eq('company_id', companyId)
        .maybeSingle();
      if (membershipError) throw membershipError;
      if (!membership) {
        return NextResponse.json({ error: 'La empresa no está vinculada al cliente seleccionado' }, { status: 409 });
      }
    }

    if (item.source === 'email_inbox_cache') {
      const provider = typeof item.metadata.provider === 'string' ? item.metadata.provider : 'gmail';
      const { error: threadError } = await ctx.admin.from('email_threads').upsert({
        thread_id: item.threadId,
        case_id: caseId,
        subject: item.subject,
        client_email: client.email,
        last_message_at: item.lastActivityAt,
      }, { onConflict: 'thread_id' });
      if (threadError) throw threadError;

      const { error: cacheError } = await ctx.admin
        .from('email_inbox_cache')
        .update({ case_id: caseId })
        .eq('thread_id', item.threadId);
      if (cacheError) throw cacheError;

      const { error: stateError } = await ctx.admin.from('admin_email_item_state').upsert({
        source_kind: 'inbox_thread',
        provider,
        source_key: item.threadId,
        client_id: clientId,
        company_id: companyId,
        case_id: caseId,
        assigned_by: ctx.user.id,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'source_kind,provider,source_key' });
      if (stateError) throw stateError;
    } else if (item.source === 'kia_conversations' && item.threadId) {
      const { data: conversation, error: conversationError } = await ctx.admin
        .from('kia_conversations')
        .select('id,metadata,status')
        .eq('id', item.threadId)
        .eq('profile_id', clientId)
        .maybeSingle();
      if (conversationError) throw conversationError;
      if (!conversation || conversation.status !== 'active') {
        return NextResponse.json({ error: 'Conversación no disponible' }, { status: 404 });
      }
      const metadata = conversation.metadata && typeof conversation.metadata === 'object' && !Array.isArray(conversation.metadata)
        ? conversation.metadata as Record<string, unknown>
        : {};
      const { error: updateError } = await ctx.admin
        .from('kia_conversations')
        .update({
          company_id: companyId,
          case_id: caseId,
          metadata: {
            ...metadata,
            operations360_reassigned_by: ctx.user.id,
            operations360_reassigned_at: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.threadId)
        .eq('profile_id', clientId)
        .eq('status', 'active');
      if (updateError) throw updateError;
    } else {
      return NextResponse.json({ error: 'Esta fuente todavía no admite reasignación persistente' }, { status: 400 });
    }

    const { error: auditError } = await ctx.admin.from('audit_logs').insert({
      actor_id: ctx.user.id,
      action: 'operations360.context_reassigned',
      entity: item.source,
      entity_id: item.threadId ?? item.id,
      metadata: {
        inbox_item_id: item.id,
        client_id: clientId,
        company_id: companyId,
        case_id: caseId,
        previous_client_id: item.clientId,
        previous_company_id: item.companyId,
        previous_case_id: item.caseId,
      },
    });
    if (auditError) throw auditError;

    return NextResponse.json({
      ok: true,
      clientId,
      clientName: client.full_name ?? client.email ?? client.id,
      companyId,
      caseId,
    });
  } catch (error) {
    console.error('[admin/inbox/reassign] failed', error);
    return NextResponse.json({ error: 'No se pudo reasignar el contexto' }, { status: 500 });
  }
}
