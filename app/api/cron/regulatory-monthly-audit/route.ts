import { NextRequest, NextResponse } from 'next/server';
import { verifyCronRequest } from '@/lib/security/cron';
import { runRegulatoryPulse } from '@/lib/regulatory/regulatory-monitor';
import { getRegulatoryPulseSummary } from '@/lib/regulatory/regulatory-values';
import { notifyAdminsTelegram, escapeTelegramHtml } from '@/lib/integrations/telegram';

export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const auth = verifyCronRequest(request.headers, 'cron/regulatory-monthly-audit');
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const pulse = await runRegulatoryPulse({
    runType: 'monthly_audit',
    forceAll: true,
  });
  const summary = await getRegulatoryPulseSummary();

  const sourceErrors = summary.sources.filter((source) => source.last_error);
  await notifyAdminsTelegram([
    '<b>KIA · Auditoría regulatoria mensual</b>',
    `Fuentes revisadas: ${pulse.sourcesChecked}`,
    `Fuentes con cambio: ${pulse.sourcesChanged}`,
    `Cambios pendientes: ${summary.pendingChanges.length}`,
    `Fuentes con error: ${sourceErrors.length}`,
    sourceErrors.length
      ? escapeTelegramHtml(sourceErrors.slice(0, 5).map((source) => `${source.authority}: ${source.last_error}`).join('\n'))
      : 'Estado de fuentes: correcto',
  ].join('\n'));

  return NextResponse.json({
    ok: true,
    pulse,
    pendingChanges: summary.pendingChanges.length,
    sourceErrors: sourceErrors.length,
  });
}
