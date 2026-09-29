import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/auth/require-admin';

function metadataString(metadata: unknown, key: string): string | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;
  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdminClient(request);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { id } = await params;
  const { data: lead, error: leadError } = await admin
    .from('leads')
    .select('id,name,email')
    .eq('id', id)
    .maybeSingle();

  if (leadError) return NextResponse.json({ error: 'No se pudo cargar el lead' }, { status: 500 });
  if (!lead) return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 });

  const [emailsRes, tasksRes] = await Promise.all([
    admin
      .from('email_events')
      .select('id,event_type,recipient_email,subject,status,html,metadata,created_at')
      .contains('metadata', { lead_id: id })
      .order('created_at', { ascending: false })
      .limit(200),
    admin
      .from('internal_tasks')
      .select('id,title,description,status,priority,due_date,case_id,company_id,metadata,created_at,updated_at')
      .eq('lead_id', id)
      .order('created_at', { ascending: false })
      .limit(200),
  ]);

  if (emailsRes.error || tasksRes.error) {
    return NextResponse.json({ error: 'No se pudo cargar el historial del lead' }, { status: 500 });
  }

  const communications = (emailsRes.data ?? []).map((row) => {
    const direction = metadataString(row.metadata, 'direction') === 'in' || row.event_type === 'email.inbound'
      ? 'in'
      : 'out';
    return {
      id: row.id,
      direction,
      subject: row.subject,
      status: row.status,
      html: row.html,
      createdAt: row.created_at,
      caseId: metadataString(row.metadata, 'case_id'),
      companyId: metadataString(row.metadata, 'company_id'),
      threadId: metadataString(row.metadata, 'thread_id'),
      messageId: metadataString(row.metadata, 'gmail_message_id')
        ?? metadataString(row.metadata, 'inbound_message_id'),
    };
  });

  return NextResponse.json({
    lead,
    communications,
    tasks: tasksRes.data ?? [],
    counts: {
      communications: communications.length,
      inbound: communications.filter((item) => item.direction === 'in').length,
      outbound: communications.filter((item) => item.direction === 'out').length,
      tasks: (tasksRes.data ?? []).length,
      openTasks: (tasksRes.data ?? []).filter((task) => ['pendiente', 'en_progreso'].includes(task.status)).length,
    },
  });
}
