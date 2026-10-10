import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminClient } from '@/lib/auth/require-admin';

const uuid = z.string().uuid();
type Event = { id: string; at: string; kind: string; title: string; description: string; href?: string; source: string };

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminClient(request);
    if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    const parsed = uuid.safeParse((await params).id);
    if (!parsed.success) return NextResponse.json({ error: 'Identificador inválido' }, { status: 400 });
    const leadId = parsed.data;
    const { data: lead, error: leadError } = await admin.from('leads').select('id,name,created_at,source,state').eq('id', leadId).maybeSingle();
    if (leadError) throw leadError;
    if (!lead) return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 });

    const [conversations, tasks, actions, quotes] = await Promise.all([
      admin.from('kia_conversations').select('id,channel,topic,status,created_at,last_message_at').eq('lead_id', leadId).order('created_at', { ascending: false }).limit(50),
      admin.from('internal_tasks').select('id,title,status,source,created_at,due_date').eq('lead_id', leadId).order('created_at', { ascending: false }).limit(80),
      admin.from('next_best_actions').select('id,title,status,action_type,created_at,due_at').eq('lead_id', leadId).order('created_at', { ascending: false }).limit(50),
      admin.from('quotes').select('id,title,status,created_at,amount_eur').eq('lead_id', leadId).order('created_at', { ascending: false }).limit(50),
    ]);
    const firstError = [conversations.error, tasks.error, actions.error, quotes.error].find(Boolean);
    if (firstError) throw firstError;
    const events: Event[] = [
      { id: `lead:${lead.id}`, at: lead.created_at, kind: 'lead', title: 'Registro del lead', description: lead.source ?? 'Origen no especificado', source: 'leads' },
      ...(conversations.data ?? []).map(c => ({ id: `kia:${c.id}`, at: c.created_at, kind: 'kia', title: c.topic || 'Conversación KIA', description: `${c.channel} · ${c.status}`, href: '/admin/inbox', source: 'kia_conversations' })),
      ...(tasks.data ?? []).map(t => ({ id: `task:${t.id}`, at: t.created_at, kind: 'task', title: t.title, description: `Estado: ${t.status}`, source: 'internal_tasks' })),
      ...(actions.data ?? []).map(a => ({ id: `action:${a.id}`, at: a.created_at, kind: 'action', title: a.title, description: `Estado: ${a.status}`, source: 'next_best_actions' })),
      ...(quotes.data ?? []).map(q => ({ id: `quote:${q.id}`, at: q.created_at, kind: 'quote', title: q.title ?? 'Presupuesto', description: `Estado: ${q.status}`, href: `/admin/presupuestos/${q.id}`, source: 'quotes' })),
    ];
    events.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
    return NextResponse.json({ lead: { id: lead.id, name: lead.name }, events, limited: { conversations: (conversations.data?.length ?? 0) === 50, tasks: (tasks.data?.length ?? 0) === 80, actions: (actions.data?.length ?? 0) === 50, quotes: (quotes.data?.length ?? 0) === 50 } }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[admin/leads/timeline]', error);
    return NextResponse.json({ error: 'No se pudo cargar el historial' }, { status: 500 });
  }
}
