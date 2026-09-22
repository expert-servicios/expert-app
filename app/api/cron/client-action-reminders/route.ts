import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { enqueueEmail } from '@/lib/email/email-queue';
import { getPublicAppUrl } from '@/lib/utils/app-url';
import { verifyCronRequest } from '@/lib/security/cron';

export const maxDuration = 60;

const TZ = 'Europe/Madrid';

type TaskRow = {
  id: string;
  title: string;
  status: string;
  client_id: string | null;
  case_id: string | null;
  priority: string;
  metadata: Record<string, unknown> | null;
};

function madridDateKey(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function dateFromKey(key: string): Date {
  return new Date(`${key}T12:00:00Z`);
}

function businessDaysElapsed(startIso: string, now = new Date()): number {
  const startKey = madridDateKey(new Date(startIso));
  const endKey = madridDateKey(now);
  let cursor = dateFromKey(startKey);
  const end = dateFromKey(endKey);
  let count = 0;
  while (cursor < end) {
    cursor = new Date(cursor.getTime() + 86_400_000);
    const day = cursor.getUTCDay();
    if (day !== 0 && day !== 6) count += 1;
  }
  return count;
}

function asNumberArray(value: unknown): number[] {
  return Array.isArray(value)
    ? value.filter((v): v is number => typeof v === 'number' && Number.isFinite(v))
    : [];
}

function reminderCopy(locale: string, title: string, day: number, dashboardUrl: string) {
  if (locale === 'ru') {
    return {
      subject: `Напоминание: требуется ваше действие — ${title}`,
      html: `<p>Здравствуйте!</p>
        <p>Напоминаем, что для продолжения вашего expediente требуется ваше действие: <strong>${title}</strong>.</p>
        <p>Это напоминание №${day === 1 ? '1' : day === 3 ? '2' : '3'}. Если вы уже выполнили действие, дополнительный ответ не требуется.</p>
        <p><a href="${dashboardUrl}">Открыть личный кабинет EXPERT</a></p>
        <p>С уважением,<br>EXPERT</p>`,
    };
  }

  if (locale === 'en') {
    return {
      subject: `Reminder: action required — ${title}`,
      html: `<p>Hello,</p>
        <p>We are reminding you that your case is waiting for your action: <strong>${title}</strong>.</p>
        <p>If you have already completed it, no further reply is needed.</p>
        <p><a href="${dashboardUrl}">Open your EXPERT workspace</a></p>
        <p>EXPERT</p>`,
    };
  }

  return {
    subject: `Recordatorio: necesitamos tu acción — ${title}`,
    html: `<p>Hola,</p>
      <p>Tu expediente está pendiente de una acción por tu parte: <strong>${title}</strong>.</p>
      <p>Si ya la has realizado, no necesitas responder de nuevo.</p>
      <p><a href="${dashboardUrl}">Abrir mi Espacio EXPERT</a></p>
      <p>Un saludo,<br>EXPERT</p>`,
  };
}

export async function GET(request: NextRequest) {
  const cronAuth = verifyCronRequest(request.headers, 'cron/client-action-reminders');
  if (!cronAuth.ok) {
    return NextResponse.json({ error: cronAuth.error }, { status: cronAuth.status });
  }

  const admin = getSupabaseAdmin();
  const { data: rows, error } = await admin
    .from('internal_tasks')
    .select('id,title,status,client_id,case_id,priority,metadata')
    .in('status', ['pendiente', 'en_progreso'])
    .contains('metadata', { client_action_required: true });

  if (error) {
    return NextResponse.json({ error: 'No se pudieron cargar las tareas' }, { status: 500 });
  }

  const tasks = (rows ?? []) as TaskRow[];
  const clientIds = [...new Set(tasks.map((t) => t.client_id).filter(Boolean))] as string[];
  const { data: profiles } = clientIds.length
    ? await admin.from('profiles').select('id,email,preferred_language').in('id', clientIds)
    : { data: [] as Array<{ id: string; email: string | null; preferred_language: string | null }> };

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const appUrl = getPublicAppUrl();
  let queued = 0;
  let escalated = 0;

  for (const task of tasks) {
    const metadata = { ...(task.metadata ?? {}) };
    const startedAt = typeof metadata.client_action_started_at === 'string'
      ? metadata.client_action_started_at
      : null;
    if (!startedAt) continue;

    const day = businessDaysElapsed(startedAt);
    const tiers = asNumberArray(metadata.client_reminder_business_days);
    const sentDays = new Set(asNumberArray(metadata.client_reminders_sent_days));
    const profile = task.client_id ? profileMap.get(task.client_id) : null;

    if (profile?.email && tiers.includes(day) && !sentDays.has(day)) {
      const copy = reminderCopy(profile.preferred_language ?? 'es', task.title, day, `${appUrl}/dashboard/expedientes`);
      const nextSentDays = [...sentDays, day].sort((a, b) => a - b);

      const { data: claimed } = await admin
        .from('internal_tasks')
        .update({
          metadata: {
            ...metadata,
            client_reminders_sent_days: nextSentDays,
            last_client_reminder_at: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', task.id)
        .select('id')
        .maybeSingle();

      if (claimed) {
        await enqueueEmail({
          to: profile.email,
          subject: copy.subject,
          html: copy.html,
          eventType: 'case.client_action_reminder',
          metadata: { taskId: task.id, caseId: task.case_id, reminderBusinessDay: day },
        });
        queued += 1;
      }
    }

    const escalationDay = typeof metadata.internal_escalation_business_day === 'number'
      ? metadata.internal_escalation_business_day
      : null;

    if (escalationDay !== null && day >= escalationDay && metadata.internal_escalated_at == null) {
      const escalationTitle = `Seguimiento cliente pendiente — ${task.title}`;
      const { data: existing } = await admin
        .from('internal_tasks')
        .select('id')
        .eq('case_id', task.case_id)
        .eq('title', escalationTitle)
        .in('status', ['pendiente', 'en_progreso'])
        .maybeSingle();

      if (!existing) {
        await admin.from('internal_tasks').insert({
          title: escalationTitle,
          description: 'El cliente sigue pendiente después de los recordatorios automáticos. Revisar contacto y decidir seguimiento manual.',
          status: 'pendiente',
          priority: 'alta',
          case_id: task.case_id,
          client_id: task.client_id,
          due_date: madridDateKey(new Date()),
          source: 'system',
          metadata: {
            task_kind: 'client_action_escalation',
            parent_task_id: task.id,
          },
        });
      }

      await admin
        .from('internal_tasks')
        .update({
          priority: 'critica',
          metadata: {
            ...metadata,
            internal_escalated_at: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', task.id);

      escalated += 1;
    }
  }

  return NextResponse.json({ ok: true, queued, escalated, scanned: tasks.length });
}
