import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { verifyCronRequest } from '@/lib/security/cron';
import { notifyKiaAdminEscalation } from '@/lib/admin/kia-admin-escalation';
import { getKiaAiBudgetSnapshot, persistKiaAiBudgetSnapshot, type KiaAiBudgetSnapshot } from '@/lib/ai/kia/kia-ai-budget';

export const maxDuration = 60;

type AlertCandidate = {
  key: string;
  severity: 'high' | 'critical';
  title: string;
  summary: string;
  intervention: string;
  metadata?: Record<string, unknown>;
};

function eur(value: number): string {
  return value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function buildAlerts(snapshot: KiaAiBudgetSnapshot, now: Date): AlertCandidate[] {
  const alerts: AlertCandidate[] = [];
  const add = (alert: AlertCandidate) => alerts.push(alert);

  if (snapshot.spentEur >= snapshot.targetSpendEur) {
    add({
      key: 'global_target',
      severity: 'high',
      title: 'KIA ha alcanzado el presupuesto objetivo de IA',
      summary: `Gasto estimado: ${eur(snapshot.spentEur)} € de un objetivo de ${eur(snapshot.targetSpendEur)} €.`,
      intervention: 'Revisar captación, conversiones y tareas que están consumiendo más IA antes de ampliar el gasto.',
    });
  }

  if (snapshot.spentEur >= snapshot.alertSpendEur) {
    add({
      key: 'global_alert',
      severity: 'high',
      title: 'KIA ha alcanzado el nivel de alerta de gasto',
      summary: `Gasto estimado: ${eur(snapshot.spentEur)} €; alerta configurada en ${eur(snapshot.alertSpendEur)} €.`,
      intervention: 'Mantener modelos económicos como primera línea y reservar razonamiento premium a clientes y casos de valor.',
    });
  }

  for (const threshold of snapshot.thresholds) {
    if (snapshot.spendRatio < threshold) continue;
    add({
      key: `global_${Math.round(threshold * 100)}pct`,
      severity: threshold >= 0.95 ? 'critical' : 'high',
      title: `KIA · gasto IA al ${Math.round(threshold * 100)} % del límite`,
      summary: `Gasto estimado: ${eur(snapshot.spentEur)} € de ${eur(snapshot.hardCapEur)} €. Modo económico: ${snapshot.mode}.`,
      intervention: threshold >= 1
        ? 'El límite global está agotado. Revisar presupuesto antes de reactivar gasto adicional.'
        : 'Revisar el panel de KIA y la rentabilidad por proveedor, servicio y cliente.',
      metadata: { threshold, mode: snapshot.mode },
    });
  }

  for (const [provider, cap] of Object.entries(snapshot.providerCapsEur)) {
    const spend = snapshot.providerSpendEur[provider] ?? 0;
    if (cap <= 0) continue;
    const ratio = spend / cap;
    for (const threshold of snapshot.thresholds) {
      if (ratio < threshold) continue;
      add({
        key: `provider_${provider}_${Math.round(threshold * 100)}pct`,
        severity: threshold >= 0.95 ? 'critical' : 'high',
        title: `KIA · ${provider} al ${Math.round(threshold * 100)} % del límite`,
        summary: `${provider}: ${eur(spend)} € estimados de ${eur(cap)} € configurados.`,
        intervention: threshold >= 1
          ? 'El router dejará de usar este proveedor mientras el periodo siga activo.'
          : 'Vigilar el consumo y comprobar si el tráfico corresponde a leads/clientes con retorno.',
        metadata: { provider, threshold, spend_eur: spend, cap_eur: cap },
      });
    }
  }

  if (snapshot.forecastReliable && snapshot.projectedSpendEur > snapshot.hardCapEur) {
    add({
      key: 'forecast_over_hard_cap',
      severity: 'critical',
      title: 'KIA prevé superar el límite mensual de IA',
      summary: `Proyección: ${eur(snapshot.projectedSpendEur)} € frente a un máximo de ${eur(snapshot.hardCapEur)} €.`,
      intervention: 'Revisar routing, límites de leads y uso de búsquedas/canarios antes de que se consuma la reserva.',
    });
  }

  if (
    snapshot.forecastReliable
    && snapshot.aiToRelatedRevenuePct !== null
    && snapshot.aiToRelatedRevenuePct > snapshot.targetAiRevenuePct
  ) {
    add({
      key: 'profitability_ratio_over_target',
      severity: 'high',
      title: 'KIA · coste IA por encima del objetivo de rentabilidad',
      summary: `Coste IA / ingresos asociados: ${snapshot.aiToRelatedRevenuePct.toFixed(2)} %; objetivo ≤ ${snapshot.targetAiRevenuePct.toFixed(2)} %.`,
      intervention: 'Revisar qué servicios y conversaciones generan coste sin conversión suficiente y ajustar routing o precios.',
    });
  }

  const reviewAt = new Date(`${snapshot.periodEnd}T00:00:00.000Z`);
  reviewAt.setUTCDate(reviewAt.getUTCDate() - 3);
  if (now >= reviewAt) {
    add({
      key: 'next_period_review',
      severity: 'high',
      title: 'KIA · recalcular presupuesto de IA para noviembre',
      summary: snapshot.recommendedNextPeriodBudgetEur === null
        ? 'El periodo llega a revisión. Comprueba gasto, conversiones e ingresos antes de fijar noviembre.'
        : `Referencia calculada para el siguiente periodo: ${eur(snapshot.recommendedNextPeriodBudgetEur)} € (no se aplica automáticamente).`,
      intervention: 'Revisar el forecast y aprobar manualmente el presupuesto del siguiente periodo.',
    });
  }

  if (snapshot.unknownPricingCount > 0) {
    add({
      key: 'unknown_model_pricing',
      severity: 'high',
      title: 'KIA detectó modelos sin tarifa registrada',
      summary: `${snapshot.unknownPricingCount} consumos del periodo no tienen una tarifa conocida y podrían infravalorar el gasto.`,
      intervention: 'Actualizar la tabla de precios antes de confiar en el forecast mensual.',
    });
  }

  return alerts;
}

async function reserveAlert(snapshot: KiaAiBudgetSnapshot, alert: AlertCandidate): Promise<boolean> {
  const admin = getSupabaseAdmin();
  const { error } = await admin.from('kia_ai_budget_alerts').insert({
    budget_period_id: snapshot.policyId,
    alert_key: alert.key,
    severity: alert.severity,
    spend_eur: snapshot.spentEur,
    forecast_eur: snapshot.projectedSpendEur,
    metadata: {
      policy_version: snapshot.policyVersion,
      ...alert.metadata,
    },
  });
  if (!error) return true;
  if (error.code === '23505') return false;
  throw new Error(error.message);
}

export async function GET(request: NextRequest) {
  const auth = verifyCronRequest(request.headers, 'cron/kia-ai-budget');
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const now = new Date();
  const snapshot = await getKiaAiBudgetSnapshot(now);
  if (!snapshot) return NextResponse.json({ ok: true, skipped: true, reason: 'no_active_budget_policy' });

  await persistKiaAiBudgetSnapshot(snapshot);
  const candidates = buildAlerts(snapshot, now);
  const sent: string[] = [];

  for (const alert of candidates) {
    const reserved = await reserveAlert(snapshot, alert);
    if (!reserved) continue;

    await notifyKiaAdminEscalation({
      title: alert.title,
      summary: alert.summary,
      actionTaken: 'KIA ha registrado el umbral y ha actualizado la previsión de gasto/rentabilidad.',
      interventionNeeded: alert.intervention,
      url: '/admin/kia-metrics',
      eventRef: `kia-ai-budget/${snapshot.policyId}/${alert.key}`,
      priority: alert.severity,
    });
    sent.push(alert.key);
  }

  return NextResponse.json({
    ok: true,
    policyVersion: snapshot.policyVersion,
    spentEur: snapshot.spentEur,
    projectedSpendEur: snapshot.projectedSpendEur,
    relatedRevenueEur: snapshot.relatedRevenueEur,
    aiToRelatedRevenuePct: snapshot.aiToRelatedRevenuePct,
    mode: snapshot.mode,
    alertsSent: sent,
  });
}
