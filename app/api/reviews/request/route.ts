import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/auth/require-admin';
import { sendEmailOnce } from '@/lib/email/send';

const UUID_RE = /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;
const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]!));

export async function POST(request: NextRequest) {
  const admin = await requireAdminClient(request);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  try {
    const input = await request.json() as { caseId?: unknown; locale?: unknown };
    const caseId = typeof input.caseId === 'string' ? input.caseId : '';
    if (!UUID_RE.test(caseId)) return NextResponse.json({ error: 'Expediente inválido' }, { status: 400 });
    const locale = input.locale === 'ru' ? 'ru' : 'es';
    const { data: caseRow, error: caseError } = await admin.from('cases')
      .select('id,client_id,service,status,state').eq('id',caseId).maybeSingle();
    if (caseError || !caseRow) return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 });
    if (!['presentado','finalizado'].includes(caseRow.status ?? caseRow.state ?? '')) {
      return NextResponse.json({ error: 'No se ha alcanzado un hito valorable' }, { status: 409 });
    }
    if (!caseRow.client_id) return NextResponse.json({ error: 'El expediente no tiene cliente vinculado' }, { status: 409 });

    const { data: reviewed } = await admin.from('reviews').select('id').eq('case_id',caseId).eq('client_id',caseRow.client_id).limit(1).maybeSingle();
    if (reviewed) return NextResponse.json({ error: 'Este expediente ya tiene una valoración' }, { status: 409 });

    const { data: user, error: userError } = await admin.auth.admin.getUserById(caseRow.client_id);
    const email = user?.user?.email?.trim();
    if (userError || !email) return NextResponse.json({ error: 'El cliente no tiene correo electrónico verificado en EXPERT' }, { status: 409 });
    const { data: profile } = await admin.from('profiles').select('full_name').eq('id',caseRow.client_id).maybeSingle();
    const name = (profile?.full_name ?? '').trim().slice(0,100) || (locale==='ru'?'клиент':'cliente');
    const service = (caseRow.service ?? 'Servicio EXPERT').trim().slice(0,180);

    const { data: existing, error: existingError } = await admin.from('review_requests')
      .select('id,token,expires_at').eq('case_id',caseId).eq('client_id',caseRow.client_id)
      .eq('status','pending').order('created_at',{ascending:false}).limit(1).maybeSingle();
    if (existingError) throw existingError;
    let token = existing?.token ?? '';
    const expired = !existing?.expires_at || new Date(existing.expires_at).getTime() <= Date.now();
    if (!/^[a-f0-9]{64}$/i.test(token) || expired) {
      token = randomBytes(32).toString('hex');
      const expires_at = new Date(Date.now()+30*24*60*60*1000).toISOString();
      if (existing?.id) {
        const { error } = await admin.from('review_requests').update({token,expires_at}).eq('id',existing.id).eq('status','pending');
        if (error) throw error;
      } else {
        const { error } = await admin.from('review_requests').insert({
          case_id:caseId, client_id:caseRow.client_id, token,expires_at,status:'pending',
        });
        if (error) throw error;
      }
    }

    // The GET page never records votes: email link scanners must not submit reviews.
    const href = `https://expertconsulting.es/gracias/opinion?token=${encodeURIComponent(token)}&lang=${locale}`;
    const title = locale==='ru' ? 'Оцените работу EXPERT' : 'Valora el servicio de EXPERT';
    const intro = locale==='ru'
      ? `Здравствуйте, ${escapeHtml(name)}! Мы завершили подготовку и подачу заявления по услуге «${escapeHtml(service)}». Решение Министерства ещё ожидается; оцените, пожалуйста, только нашу работу на этом этапе.`
      : `Hola, ${escapeHtml(name)}. Hemos completado la preparación y presentación de «${escapeHtml(service)}». Si la Administración aún no ha resuelto, valora únicamente la atención y gestión realizadas hasta ahora.`;
    const optional = locale==='ru'
      ? 'Выберите от 1 до 5 звёзд. Комментарий необязателен. Оценки учитываются в среднем рейтинге услуги; текст публикуется только с Вашего согласия.'
      : 'Elige entre 1 y 5 estrellas. El comentario es opcional. Las estrellas cuentan para la media del servicio; el texto solo se publica con tu autorización.';
    const button = locale==='ru'?'Оценить услугу':'Valorar servicio';
    const html = `<div lang="${locale}" style="font-family:Arial,sans-serif;color:#172232;line-height:1.6"><h2>${title}</h2><p>${intro}</p><p>${optional}</p><p><a href="${href}" style="background:#172232;color:#fff;padding:12px 20px;text-decoration:none;border-radius:8px;display:inline-block">${button}</a></p><p style="font-size:12px;color:#555">${locale==='ru'?'Ссылка действительна 30 дней.':'Enlace válido durante 30 días.'}</p></div>`;
    const idempotencyKey=`case/review-request/${caseId}`;
    const sent = await sendEmailOnce({
      to:email, eventType:'case.review_request', subject:title,
      html, idempotencyKey, metadata:{caseId,case_id:caseId,client_id:caseRow.client_id,preferred_language:locale,kia_author:true,kia_contextual_cta:false},
    });
    return NextResponse.json({ok:true,sent:sent.sent,requestCreated:!existing,idempotent:!sent.sent});
  } catch(error) {
    console.error('[reviews/request]',error);
    return NextResponse.json({error:'No se pudo enviar la solicitud de valoración'},{status:500});
  }
}
