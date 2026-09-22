import { after, NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { resolveVerifiedTelegramIdentity } from '@/lib/ai/kia/kia-channel-identity';
import { consumeTelegramLinkCode } from '@/lib/ai/kia/kia-telegram-linking';
import {
  getEnabledKiaPolicyFeatureFlags,
  resolveKiaActorCapabilities,
} from '@/lib/ai/kia/kia-actor-capability-resolver';
import {
  resolveKiaPolicyToolNames,
  runPolicyEnforcedKiaDecision,
} from '@/lib/ai/kia/kia-policy-enforced-decision';
import { checkKiaDailyCostCap, checkKiaMessageRateLimit } from '@/lib/ai/kia/kia-rate-limit';
import { safeErrorMessage } from '@/lib/ai/kia/kia-redaction';
import { getServiceOperationalBlueprint } from '@/lib/services/service-operational-blueprints';
import { serviceProductionManifest } from '@/lib/services/service-production-manifest';
import { runRegulatoryPulse } from '@/lib/regulatory/regulatory-monitor';
import { getCurrentRegulatoryValue, getRegulatoryPulseSummary } from '@/lib/regulatory/regulatory-values';
import { resolveKiaLocale } from '@/lib/ai/kia/kia-locale';
import {
  escapeTelegramHtml,
  isConfiguredTelegramAdminChat,
  isTelegramWebhookAuthorized,
  parseTelegramInboundMessage,
  sendTelegramMessage,
} from '@/lib/integrations/telegram';

const SECRET_HEADER = 'x-telegram-bot-api-secret-token';

export async function POST(request: NextRequest) {
  if (!isTelegramWebhookAuthorized(request.headers.get(SECRET_HEADER))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const inbound = parseTelegramInboundMessage(payload);
  if (!inbound) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const admin = getSupabaseAdmin();
  const parts = inbound.text.split(/\s+/);
  const command = parts[0]?.toLowerCase();
  const telegramToolsEnabled = process.env.KIA_TELEGRAM_TOOLS_ENABLED?.toLowerCase() === 'true';
  const telegramClientsEnabled = process.env.KIA_TELEGRAM_CLIENTS_ENABLED?.toLowerCase() === 'true';
  const adminChat = isConfiguredTelegramAdminChat(inbound.chatId);

  if (!adminChat && !telegramClientsEnabled) {
    await sendTelegramMessage({
      chatId: inbound.chatId,
      text: 'El canal KIA para clientes en Telegram todavía no está habilitado. Usa el portal EXPERT mientras se completa el despliegue.',
    });
    return NextResponse.json({ ok: true, ignored: true, reason: 'client_telegram_disabled' });
  }

  if (command === '/link') {
    const code = parts[1]?.trim();
    if (!code) {
      await sendTelegramMessage({
        chatId: inbound.chatId,
        text: 'Falta el código de vinculación. Genera uno desde tu sesión EXPERT y envía /link CÓDIGO.',
      });
      return NextResponse.json({ ok: true, linked: false, reason: 'missing_link_code' });
    }

    try {
      await consumeTelegramLinkCode({
        admin,
        code,
        externalUserId: inbound.userId,
        externalChatId: inbound.chatId,
        externalUsername: inbound.username,
      });
      await sendTelegramMessage({
        chatId: inbound.chatId,
        text: '✅ Telegram vinculado y verificado con tu identidad EXPERT. Ya puedes hablar con KIA en este chat.',
      });
      return NextResponse.json({ ok: true, linked: true });
    } catch (err) {
      console.warn('[Telegram link] consumption failed:', safeErrorMessage(err));
      await sendTelegramMessage({
        chatId: inbound.chatId,
        text: 'No se ha podido completar la vinculación. El código puede ser inválido, haber caducado, estar usado o pertenecer a otra identidad. Genera un código nuevo desde EXPERT.',
      });
      return NextResponse.json({ ok: true, linked: false, reason: 'link_rejected' });
    }
  }

  const identity = await resolveVerifiedTelegramIdentity({
    admin,
    externalUserId: inbound.userId,
    externalChatId: inbound.chatId,
  }).catch(() => null);

  if (command === '/start' || command === '/help') {
    await sendTelegramMessage({
      chatId: inbound.chatId,
      text: [
        '<b>KIA · EXPERT</b>',
        'Canal Telegram conectado en modo seguro.',
        '/status — comprobar conexión, identidad y tools',
        '/link CÓDIGO — vincular este Telegram con una sesión EXPERT autenticada',
        '/servicio SLUG — ver requisitos, documentos y pasos del servicio',
        ...(adminChat ? ['/lote1 — ver estado operativo del lote 1', '/legal status|cambios|valor|revisar — Regulatory Pulse'] : []),
        identity
          ? `Identidad EXPERT verificada. Chat KIA: activo. Tools R0/R1 read: ${telegramToolsEnabled ? 'activadas' : 'bloqueadas por feature flag'}.`
          : 'Identidad EXPERT aún no vinculada o no verificada. KIA permanece bloqueada.',
      ].join('\n'),
    });
    return NextResponse.json({ ok: true, identityLinked: Boolean(identity) });
  }

  if (command === '/status') {
    await sendTelegramMessage({
      chatId: inbound.chatId,
      text: identity
        ? `✅ Telegram e identidad EXPERT verificados. Chat KIA: activo. Tools R0/R1 read: ${telegramToolsEnabled ? 'activadas' : 'bloqueadas'}.`
        : '⚠️ Telegram operativo, pero esta identidad no está vinculada y verificada en EXPERT. KIA: bloqueada.',
    });
    return NextResponse.json({ ok: true, identityLinked: Boolean(identity) });
  }

  if (!identity) {
    await sendTelegramMessage({
      chatId: inbound.chatId,
      text: 'Mensaje recibido. KIA permanece bloqueada porque esta identidad Telegram no está vinculada y verificada en EXPERT. Genera un código en EXPERT y usa /link CÓDIGO.',
    });
    return NextResponse.json({ ok: true, identityLinked: false, routed: false });
  }

  if (!checkKiaMessageRateLimit(identity.profileId)) {
    await sendTelegramMessage({ chatId: inbound.chatId, text: 'Has alcanzado temporalmente el límite de mensajes de KIA. Inténtalo más tarde.' });
    return NextResponse.json({ ok: true, identityLinked: true, routed: false, reason: 'rate_limited' });
  }

  const costCap = await checkKiaDailyCostCap(identity.profileId);
  if (!costCap.ok) {
    await sendTelegramMessage({ chatId: inbound.chatId, text: 'KIA ha alcanzado el límite diario de uso configurado.' });
    return NextResponse.json({ ok: true, identityLinked: true, routed: false, reason: 'daily_cost_cap_reached' });
  }

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('active_company_id,preferred_language')
    .eq('id', identity.profileId)
    .maybeSingle();

  if (profileError) {
    console.error('[Telegram KIA] profile lookup failed:', profileError.message);
    await sendTelegramMessage({ chatId: inbound.chatId, text: 'No he podido cargar el contexto EXPERT de forma segura.' });
    return NextResponse.json({ ok: true, identityLinked: true, routed: false, reason: 'profile_lookup_failed' });
  }

  const companyId = profile?.active_company_id ?? null;
  const profileLocale = profile?.preferred_language === 'ru' ? 'ru' : 'es';
  const responseLocale = resolveKiaLocale({ latestMessage: inbound.text, preferredLanguage: profileLocale });
  let actor;
  try {
    actor = await resolveKiaActorCapabilities({
      admin,
      userId: identity.profileId,
      clientId: identity.profileId,
      companyId,
      featureFlags: getEnabledKiaPolicyFeatureFlags(),
    });
  } catch (err) {
    console.error('[Telegram KIA] actor capability resolution failed:', safeErrorMessage(err));
    await sendTelegramMessage({ chatId: inbound.chatId, text: 'No he podido validar tus permisos EXPERT de forma segura.' });
    return NextResponse.json({ ok: true, identityLinked: true, routed: false, reason: 'policy_context_failed' });
  }

  if (!actor.active || actor.tenantId !== identity.tenantId) {
    await sendTelegramMessage({ chatId: inbound.chatId, text: 'La identidad EXPERT vinculada ya no está activa o no coincide con el tenant autorizado.' });
    return NextResponse.json({ ok: true, identityLinked: true, routed: false, reason: 'actor_inactive_or_tenant_mismatch' });
  }

  if (command === '/legal' && adminChat) {
    const action = parts[1]?.toLowerCase() ?? 'status';

    if (action === 'status') {
      const summary = await getRegulatoryPulseSummary();
      const lastRun = summary.lastRun;
      const sourceErrors = summary.sources.filter((source) => source.last_error);
      await sendTelegramMessage({
        chatId: inbound.chatId,
        text: [
          '<b>KIA Regulatory Pulse</b>',
          lastRun
            ? `Última ejecución: ${escapeTelegramHtml(lastRun.run_type)} · ${escapeTelegramHtml(lastRun.status)} · ${escapeTelegramHtml(lastRun.started_at)}`
            : 'Sin ejecuciones registradas.',
          `Cambios pendientes: ${summary.pendingChanges.length}`,
          `Fuentes activas: ${summary.sources.length}`,
          `Fuentes con error: ${sourceErrors.length}`,
        ].join('\n'),
      });
      return NextResponse.json({ ok: true, command: 'legal_status' });
    }

    if (action === 'cambios') {
      const summary = await getRegulatoryPulseSummary();
      const rows = summary.pendingChanges.slice(0, 10).map((change) => {
        const source = Array.isArray(change.source) ? change.source[0] : change.source;
        return `• [${change.severity ?? 'pending'}] ${source?.authority ?? 'Fuente'} — ${change.summary ?? change.change_type ?? 'Pendiente de clasificación'}`;
      });
      await sendTelegramMessage({
        chatId: inbound.chatId,
        text: ['<b>Cambios regulatorios pendientes</b>', ...(rows.length ? rows.map(escapeTelegramHtml) : ['Sin cambios pendientes.'])].join('\n'),
      });
      return NextResponse.json({ ok: true, command: 'legal_changes', count: rows.length });
    }

    if (action === 'valor') {
      const valueKey = parts[2]?.trim();
      if (!valueKey) {
        await sendTelegramMessage({ chatId: inbound.chatId, text: 'Uso: /legal valor SMI_MONTHLY' });
        return NextResponse.json({ ok: true, command: 'legal_value', found: false });
      }
      const value = await getCurrentRegulatoryValue(valueKey);
      await sendTelegramMessage({
        chatId: inbound.chatId,
        text: value
          ? [
              `<b>${escapeTelegramHtml(value.label)}</b>`,
              `Valor: ${escapeTelegramHtml(String(value.numeric_value ?? value.text_value ?? '—'))} ${escapeTelegramHtml(value.unit ?? '')}`,
              `Periodo: ${escapeTelegramHtml(value.period_key)}`,
              value.availability_mode === 'latest_published'
                ? `Disponibilidad: último dato oficial publicado (periodo ${escapeTelegramHtml(value.period_key)})`
                : `Vigencia: ${escapeTelegramHtml(value.valid_from)} → ${escapeTelegramHtml(value.valid_to ?? 'sin fecha fin')}`,
              `Verificado: ${escapeTelegramHtml(value.verified_at)}`,
            ].join('\n')
          : `No existe un valor vigente para ${escapeTelegramHtml(valueKey)}.`,
      });
      return NextResponse.json({ ok: true, command: 'legal_value', found: Boolean(value) });
    }

    if (action === 'revisar') {
      const scopeType = parts[2]?.toLowerCase();
      const scopeValue = parts.slice(3).join(' ').trim();
      const validScope = ['source', 'authority', 'topic', 'service'].includes(scopeType ?? '');
      const hasScope = validScope && Boolean(scopeValue);

      await sendTelegramMessage({
        chatId: inbound.chatId,
        text: hasScope
          ? `Revisión regulatoria iniciada · ${escapeTelegramHtml(scopeType!)}: ${escapeTelegramHtml(scopeValue)}.`
          : 'Revisión regulatoria completa iniciada.',
      });

      after(async () => {
        const result = await runRegulatoryPulse({
          runType: 'manual',
          forceAll: !hasScope,
          sourceKey: scopeType === 'source' ? scopeValue : undefined,
          authority: scopeType === 'authority' ? scopeValue : undefined,
          topic: scopeType === 'topic' ? scopeValue : undefined,
          serviceKey: scopeType === 'service' ? scopeValue : undefined,
        }).catch((error) => ({
          sourcesChecked: 0,
          sourcesChanged: 0,
          errors: [{ sourceKey: hasScope ? scopeValue : 'manual', error: safeErrorMessage(error) }],
        }));

        await sendTelegramMessage({
          chatId: inbound.chatId,
          text: [
            '<b>Revisión regulatoria terminada</b>',
            `Fuentes revisadas: ${result.sourcesChecked}`,
            `Cambios detectados: ${result.sourcesChanged}`,
            `Errores: ${result.errors.length}`,
          ].join('\n'),
        });
      });

      return NextResponse.json({
        ok: true,
        command: 'legal_review_started',
        scope: hasScope ? { type: scopeType, value: scopeValue } : 'all',
      });
    }

    await sendTelegramMessage({
      chatId: inbound.chatId,
      text: 'Comandos: /legal status · /legal cambios · /legal valor SMI_MONTHLY · /legal revisar [source|authority|topic|service] VALOR',
    });
    return NextResponse.json({ ok: true, command: 'legal_help' });
  }

  if (command === '/servicio') {
    const slug = parts[1]?.trim();
    const blueprint = slug ? getServiceOperationalBlueprint(slug) : null;
    if (!blueprint) {
      await sendTelegramMessage({
        chatId: inbound.chatId,
        text: 'Indica un slug válido del servicio. Ejemplo: /servicio arraigo-social',
      });
      return NextResponse.json({ ok: true, identityLinked: true, routed: false, reason: 'service_blueprint_not_found' });
    }

    const requirements = blueprint.requirements.map((item) => `• ${item.label}`).join('\n');
    const documents = blueprint.documents
      .filter((item) => item.required)
      .map((item) => `• ${item.label}`)
      .join('\n');
    const steps = blueprint.steps.map((item, index) => `${index + 1}. ${item.title}`).join('\n');

    await sendTelegramMessage({
      chatId: inbound.chatId,
      text: [
        `<b>${escapeTelegramHtml(blueprint.canonicalName)}</b>`,
        '',
        '<b>Requisitos</b>',
        escapeTelegramHtml(requirements),
        '',
        '<b>Documentación obligatoria</b>',
        escapeTelegramHtml(documents),
        '',
        '<b>Pasos</b>',
        escapeTelegramHtml(steps),
      ].join('\n'),
    });

    return NextResponse.json({ ok: true, identityLinked: true, routed: true, command: 'servicio', serviceSlug: blueprint.slug });
  }

  if (command === '/lote1' && adminChat) {
    const rows = serviceProductionManifest.map((entry) => `• ${entry.slug}: ${entry.stage}`);
    await sendTelegramMessage({
      chatId: inbound.chatId,
      text: ['<b>Lote 1 · estado de producción</b>', ...rows.map(escapeTelegramHtml)].join('\n'),
    });
    return NextResponse.json({ ok: true, identityLinked: true, routed: true, command: 'lote1' });
  }

  const telegramPolicy = resolveKiaPolicyToolNames('telegram_verified', actor);
  if (!telegramPolicy.ok) {
    console.warn('[Telegram KIA] policy denied:', telegramPolicy.reason);
    await sendTelegramMessage({ chatId: inbound.chatId, text: 'Tu perfil EXPERT no tiene autorización para usar KIA desde Telegram.' });
    return NextResponse.json({ ok: true, identityLinked: true, routed: false, reason: 'policy_denied' });
  }

  try {
    const result = await runPolicyEnforcedKiaDecision('telegram_verified', actor, {
      taskType: 'chat_reply',
      channel: 'telegram',
      message: inbound.text,
      locale: responseLocale,
      allowTools: telegramToolsEnabled,
      forceToolExecution: telegramToolsEnabled,
      contextInput: {
        channel: 'telegram',
        userId: identity.profileId,
        clientId: identity.profileId,
        companyId: companyId ?? undefined,
        currentPage: '/telegram',
        latestMessage: inbound.text,
      },
    });

    await sendTelegramMessage({
      chatId: inbound.chatId,
      text: escapeTelegramHtml(result.userMessage),
    });

    return NextResponse.json({
      ok: true,
      identityLinked: true,
      routed: true,
      intent: result.decision.intent,
      toolsEnabled: telegramToolsEnabled,
    });
  } catch (err) {
    console.error('[Telegram KIA] orchestrator failed:', safeErrorMessage(err));
    await sendTelegramMessage({
      chatId: inbound.chatId,
      text: 'KIA ha encontrado un problema técnico y no ha ejecutado ninguna acción. Inténtalo de nuevo.',
    });
    return NextResponse.json({ ok: true, identityLinked: true, routed: false, reason: 'kia_error' });
  }
}
