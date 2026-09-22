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
      subject: `⏰ Небольшое напоминание: ждём ваш следующий шаг`,
      html: `<p>Здравствуйте! 👋</p>
        <p>Небольшое напоминание от меня: чтобы мы могли двигаться дальше по вашему expediente, нам всё ещё нужен следующий шаг:</p>
        <p><strong>${title}</strong></p>
        <p>Если вы уже всё сделали — спасибо! Тогда ничего дополнительно отправлять не нужно, я увижу обновление в системе.</p>
        <p>Если возник вопрос или что-то не получается, просто ответьте на письмо — команда EXPERT подключится.</p>
        <p><a href="${dashboardUrl}">Открыть личный кабинет EXPERT</a></p>`,
    };
  }

  if (locale === 'en') {
    return {
      subject: `⏰ Quick reminder: we’re waiting for your next step`,
      html: `<p>Hello! 👋</p>
        <p>A quick reminder from me: to keep your case moving, we still need this step from you:</p>
        <p><strong>${title}</strong></p>
        <p>If you have already done it, thank you — there is nothing else you need to send.</p>
        <p>If anything is unclear, simply reply and the EXPERT team will help.</p>
        <p><a href="${dashboardUrl}">Open your EXPERT workspace</a></p>`,
    };
  }

  return {
    subject: `⏰ Un pequeño recordatorio: esperamos tu siguiente paso`,
    html: `<p>¡Hola! 👋</p>
      <p>Te escribo porque para seguir avanzando con tu expediente todavía necesitamos este paso:</p>
      <p><strong>${title}</strong></p>
      <p>Si ya lo has hecho, ¡gracias! No tienes que enviarnos nada más: la actualización quedará registrada.</p>
      <p>Y si algo no te queda claro, responde a este correo y el equipo de EXPERT te ayudará.</p>
      <p><a href="${dashboardUrl}">Abrir mi Espacio EXPERT</a></p>`,
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
