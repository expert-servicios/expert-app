import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { verifyCronRequest } from '@/lib/security/cron';
import { sendEmailOnce } from '@/lib/email/send';
import { monthlySubscriptionMeetingInvitationEmail } from '@/lib/email/onboarding-templates';
import { createPrivateBookingAuthorization, withPrivateBookingAuthorization } from '@/lib/booking/private-booking-authorization';
import { getBookingMonthlyAutonomoUrl, getBookingMonthlyCompanyUrl } from '@/lib/utils/cal';
import {
  listActiveSubscriptionMeetingEntitlements,
  listActiveSubscriptionTaxEntitlements,
  monthlyMeetingServiceKey,
} from '@/lib/subscriptions/meeting-entitlements';
import { notifyAdmins } from '@/lib/integrations/push';

export const maxDuration = 60;

function madridParts(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return { year: get('year'), month: get('month'), day: get('day') };
}

function monthKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

function endOfMonthDate(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
}

function monthLabel(year: number, month: number) {
  return new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric', timeZone: 'Europe/Madrid' })
    .format(new Date(Date.UTC(year, month - 1, 15)));
}

export async function GET(request: NextRequest) {
  const cronAuth = verifyCronRequest(request.headers, 'cron/subscription-monthly-meetings');
  if (!cronAuth.ok) return NextResponse.json({ error: cronAuth.error }, { status: cronAuth.status });

  const now = new Date();
  const { year, month, day } = madridParts(now);

  // Invitations are intentionally generated only in the last part of the month.
  if (day < 20) {
    return NextResponse.json({ ok: true, skipped: 'before_monthly_planning_window' });
  }

  const admin = getSupabaseAdmin();
  const [entitlements, taxEntitlements] = await Promise.all([
    listActiveSubscriptionMeetingEntitlements(admin),
    listActiveSubscriptionTaxEntitlements(admin),
  ]);
  const key = monthKey(year, month);
  const dueDate = endOfMonthDate(year, month);
  const label = monthLabel(year, month);

  let created = 0;
  let emailed = 0;
  let existing = 0;
  const errors: string[] = [];

  for (const entitlement of entitlements) {
    const recurringSeriesKey = `subscription:${entitlement.subscriptionId}:${entitlement.companyId}`;
    const { data: recurringSeries } = await admin
      .from('recurring_meeting_series')
      .select('id')
      .eq('source_key', recurringSeriesKey)
      .eq('active', true)
      .maybeSingle();
    if (recurringSeries?.id) {
      existing++;
      continue;
    }

    const sourceKey = `monthly-review:${key}:${entitlement.subscriptionId}:${entitlement.companyId}`;
    const { data: previous, error: lookupError } = await admin
      .from('internal_tasks')
      .select('id')
      .eq('source_key', sourceKey)
      .maybeSingle();

    if (lookupError) {
      errors.push(`${entitlement.companyId}: ${lookupError.message}`);
      continue;
    }
    if (previous?.id) {
      existing++;
      continue;
    }

    const service = monthlyMeetingServiceKey(entitlement);
    const bookingBase = entitlement.kind === 'autonomo'
      ? getBookingMonthlyAutonomoUrl()
      : getBookingMonthlyCompanyUrl();

    if (!bookingBase) {
      errors.push(`${entitlement.companyId}: booking URL not configured`);
      continue;
    }

    const { data: authUser } = await admin.auth.admin.getUserById(entitlement.clientId);
    const email = authUser.user?.email?.trim().toLowerCase();
    if (!email) {
      errors.push(`${entitlement.companyId}: client email missing`);
      continue;
    }

    const { data: profile } = await admin
      .from('profiles')
      .select('full_name')
      .eq('id', entitlement.clientId)
      .maybeSingle();

    const token = await createPrivateBookingAuthorization({
      service,
      email,
      clientId: entitlement.clientId,
      companyId: entitlement.companyId,
      source: 'admin',
      sourceRef: sourceKey,
    });
    const bookingUrl = withPrivateBookingAuthorization(bookingBase, token);

    const { data: task, error: taskError } = await admin
      .from('internal_tasks')
      .insert({
        title: `Revisión mensual ${entitlement.durationMinutes} min — ${entitlement.companyName}`,
        description: [
          `Revisión mensual incluida correspondiente a ${label}.`,
          `Duración incluida: ${entitlement.durationMinutes} minutos.`,
          'Comprobar que el cliente reserve la reunión y revisar cierre, incidencias, documentación y siguientes pasos.',
          entitlement.quarterlyTaxFiling && [3, 6, 9, 12].includes(month)
            ? 'Mes de cierre trimestral: revisar además las obligaciones fiscales del calendario y preparar las presentaciones que correspondan.'
            : '',
        ].filter(Boolean).join('\n'),
        status: 'pendiente',
        priority: [3, 6, 9, 12].includes(month) ? 'alta' : 'media',
        client_id: entitlement.clientId,
        company_id: entitlement.companyId,
        due_date: dueDate,
        source: 'system',
        source_key: sourceKey,
        metadata: {
          task_kind: 'subscription_monthly_review',
          subscription_id: entitlement.subscriptionId,
          company_id: entitlement.companyId,
          meeting_service: service,
          duration_minutes: entitlement.durationMinutes,
          month: key,
          quarterly_tax_review: entitlement.quarterlyTaxFiling && [3, 6, 9, 12].includes(month),
          booking_url: bookingUrl,
        },
      })
      .select('id')
      .single();

    if (taskError || !task?.id) {
      if (taskError?.code === '23505') {
        existing++;
        continue;
      }
      errors.push(`${entitlement.companyId}: ${taskError?.message ?? 'task create failed'}`);
      continue;
    }
    created++;

    const template = monthlySubscriptionMeetingInvitationEmail({
      name: profile?.full_name?.trim() || email.split('@')[0],
      companyName: entitlement.companyName,
      durationMinutes: entitlement.durationMinutes,
      bookingUrl,
      monthLabel: label,
    });

    try {
      await sendEmailOnce({
        to: email,
        eventType: 'subscription.monthly_meeting.invitation',
        ...template,
        metadata: {
          task_id: task.id,
          subscription_id: entitlement.subscriptionId,
          company_id: entitlement.companyId,
          month: key,
          duration_minutes: entitlement.durationMinutes,
        },
        idempotencyKey: `subscription/monthly-review/${sourceKey}`,
      });
      emailed++;
    } catch (error) {
      errors.push(`${entitlement.companyId}: email ${error instanceof Error ? error.message : String(error)}`);
    }

    await notifyAdmins({
      title: 'Revisión mensual planificada',
      body: `${entitlement.companyName} · ${entitlement.durationMinutes} min · ${label}`,
      url: '/admin/tareas',
      tag: `monthly-review-${task.id}`,
    }).catch(() => {});

  }

  let quarterTasks = 0;
  if ([3, 6, 9, 12].includes(month)) {
    const quarter = Math.ceil(month / 3);
    for (const entitlement of taxEntitlements) {
      const taxSourceKey = `quarter-close:${year}-Q${quarter}:${entitlement.subscriptionId}:${entitlement.companyId}`;
      const { error: quarterTaskError } = await admin
        .from('internal_tasks')
        .insert({
          title: `Cierre fiscal Q${quarter} — ${entitlement.companyName}`,
          description: [
            `Preparar el cierre del trimestre Q${quarter} de ${year}.`,
            'Revisar contabilidad y documentación pendiente.',
            'Validar las obligaciones y fechas exactas contra el calendario fiscal de EXPERT antes de presentar impuestos.',
            `Preparar y presentar los modelos que correspondan al alcance de ${entitlement.planName}.`,
          ].join('\n'),
          status: 'pendiente',
          priority: 'alta',
          client_id: entitlement.clientId,
          company_id: entitlement.companyId,
          due_date: dueDate,
          source: 'system',
          source_key: taxSourceKey,
          metadata: {
            task_kind: 'subscription_quarter_close',
            subscription_id: entitlement.subscriptionId,
            company_id: entitlement.companyId,
            plan_name: entitlement.planName,
            quarter,
            year,
            requires_fiscal_calendar_validation: true,
          },
        });

      if (!quarterTaskError) {
        quarterTasks++;
      } else if (quarterTaskError.code !== '23505') {
        errors.push(`${entitlement.companyId}: quarter task ${quarterTaskError.message}`);
      }
    }
  }

  return NextResponse.json({
    ok: errors.length === 0,
    month: key,
    meetingEntitlements: entitlements.length,
    taxEntitlements: taxEntitlements.length,
    created,
    emailed,
    existing,
    quarterTasks,
    errors,
  });
}
