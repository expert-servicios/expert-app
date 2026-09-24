import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { isStaffRole } from '@/lib/auth/roles';
import { createKiaContextToken } from '@/lib/ai/kia/kia-context-token';
import { getPublicAppUrl } from '@/lib/utils/app-url';
import { sendEmail } from '@/lib/email/send';

const schema = z.object({
  case_id: z.uuid(),
  scenario: z.enum(['status', 'documents', 'next_step']).default('status'),
}).strict();

const scenarioLabel = {
  status: 'Estado de tu expediente',
  documents: 'Documentación pendiente',
  next_step: 'Siguiente paso de tu expediente',
} as const;

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.email) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_request' }, { status: 400 });

  const admin = getSupabaseAdmin();
  const [{ data: actor, error: actorError }, { data: caseRow, error: caseError }] = await Promise.all([
    admin.from('profiles').select('id,role,status,tenant_id,email').eq('id', user.id).maybeSingle(),
    admin.from('cases')
      .select('id,client_id,company_id,service,service_id,state,status,next_action,closed_at')
      .eq('id', parsed.data.case_id)
      .maybeSingle(),
  ]);

  if (actorError || caseError) return NextResponse.json({ error: 'lookup_failed' }, { status: 503 });
  if (!actor || actor.status === 'inactive' || !isStaffRole(actor.role)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  if (!caseRow || caseRow.closed_at) return NextResponse.json({ error: 'case_unavailable' }, { status: 404 });

  const { data: client, error: clientError } = await admin
    .from('profiles')
    .select('id,full_name,preferred_language')
    .eq('id', caseRow.client_id)
    .maybeSingle();
  if (clientError || !client) return NextResponse.json({ error: 'client_unavailable' }, { status: 404 });

  const { token, expiresAt } = await createKiaContextToken({
    admin,
    tenantId: actor.tenant_id ?? null,
    profileId: actor.id,
    serviceSlug: caseRow.service_id ?? null,
    originType: 'email',
    originRef: `staff-preview:${caseRow.id}:${parsed.data.scenario}`,
    intentHint: parsed.data.scenario,
    metadata: {
      staff_preview: true,
      preview_case_id: caseRow.id,
      preview_client_id: caseRow.client_id,
      preview_scenario: parsed.data.scenario,
    },
  });

  const href = `${getPublicAppUrl().replace(/\/$/, '')}/kia/c/${encodeURIComponent(token)}`;
  const clientName = client.full_name?.trim() || 'cliente';
  const service = caseRow.service || 'tu expediente';
  const nextAction = caseRow.next_action || 'Revisar el estado actualizado con KIA.';

  const detail = parsed.data.scenario === 'documents'
    ? 'Hay documentación o una actuación pendiente dentro del expediente. KIA puede indicarte qué consta ahora mismo y qué falta.'
    : parsed.data.scenario === 'next_step'
      ? `El siguiente paso registrado actualmente es: ${nextAction}`
      : `Tu expediente «${service}» sigue activo. KIA puede explicarte el estado actual y los próximos pasos.`;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#07111d">
      <div style="background:#07111d;color:#fff;padding:18px 22px;border-radius:14px 14px 0 0">
        <strong>EXPERT · KIA</strong>
      </div>
      <div style="border:1px solid #e5ded1;border-top:0;padding:24px;border-radius:0 0 14px 14px">
        <p style="font-size:12px;font-weight:700;color:#9a6700;background:#fff7db;padding:8px 10px;border-radius:8px">
          PRUEBA INTERNA · Vista cliente delegada · Solo lectura
        </p>
        <p>Hola ${clientName},</p>
        <h2 style="font-size:20px">${scenarioLabel[parsed.data.scenario]}</h2>
        <p>${detail}</p>
        <p>Para comprobarlo o preguntarme cualquier duda, abre el expediente conmigo:</p>
        <p style="text-align:center;margin:28px 0">
          <a href="${href}" style="background:#07111d;color:#fff;text-decoration:none;padding:13px 20px;border-radius:12px;font-weight:700">
            Hablar con KIA sobre este expediente
          </a>
        </p>
        <p style="font-size:12px;color:#64748b">
          Esta copia se ha enviado a un miembro del equipo EXPERT para probar la experiencia del cliente. No cambia el expediente ni la identidad del cliente.
        </p>
      </div>
    </div>`;

  await sendEmail({
    to: user.email,
    eventType: 'kia.staff_preview',
    subject: `[PRUEBA KIA] ${scenarioLabel[parsed.data.scenario]} · ${service}`,
    html,
    metadata: {
      kia_author: true,
      kia_contextual_cta: false,
      staff_preview: true,
      preview_case_id: caseRow.id,
      preview_client_id: caseRow.client_id,
      preview_scenario: parsed.data.scenario,
      preview_recipient_user_id: actor.id,
      kia_context_expires_at: expiresAt,
    },
  });

  return NextResponse.json({
    ok: true,
    recipient: user.email,
    scenario: parsed.data.scenario,
    expires_at: expiresAt,
  }, { headers: { 'Cache-Control': 'no-store' } });
}
