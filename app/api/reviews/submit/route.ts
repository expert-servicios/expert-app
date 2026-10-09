import { after, NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { checkRateLimit, getClientIp } from '@/lib/utils/spam-guard';
import { sendEmail } from '@/lib/email/send';
import { reviewReceived } from '@/lib/email/templates';
import { moderateReviewByKia } from '@/lib/ai/kia/kia-review-moderation';
import { notifyKiaAdminEscalation } from '@/lib/admin/kia-admin-escalation';

const REVIEW_TOKEN_RE = /^(?:[a-f0-9]{64}|[a-f0-9-]{36})$/i;
const MAX_COMMENT_LENGTH = 800;

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers);
    if (!checkRateLimit(`review-submit:${ip}`)) {
      return NextResponse.json({ error: 'Demasiados intentos. Inténtalo más tarde.' }, { status: 429 });
    }

    const body = await request.json() as {
      token?: string;
      rating?: unknown;
      comment?: unknown;
      allow_publish?: boolean;
      publication_mode?: 'private' | 'anonymous' | 'profile';
      public_name?: string;
      avatar_consent?: boolean;
    };

    const { token, rating, comment, allow_publish } = body;

    if (!token || typeof token !== 'string' || !REVIEW_TOKEN_RE.test(token)) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 400 });
    }
    const parsedRating = Number(rating);
    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return NextResponse.json({ error: 'Valoración entre 1 y 5 requerida' }, { status: 400 });
    }
    const cleanedComment = typeof comment === 'string'
      ? comment.trim().slice(0, MAX_COMMENT_LENGTH)
      : '';

    const admin = getSupabaseAdmin();

    // Validate token
    const { data: req, error: reqErr } = await admin
      .from('review_requests')
      .select('id,case_id,client_id,expires_at,status')
      .eq('token', token)
      .single();

    if (reqErr || !req || req.status !== 'pending') {
      return NextResponse.json({ error: 'Enlace inválido o ya utilizado' }, { status: 400 });
    }

    if (new Date(req.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Este enlace ha expirado. Contacta con nosotros si deseas dejarnos tu opinión.' }, { status: 410 });
    }

    // Check no review already submitted for this token
    const { data: existing } = await admin
      .from('reviews')
      .select('id')
      .eq('case_id', req.case_id)
      .eq('client_id', req.client_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'Ya has enviado tu valoración para este expediente.' }, { status: 409 });
    }

    // Fetch service name from case
    const { data: caseData } = await admin
      .from('cases')
      .select('service')
      .eq('id', req.case_id)
      .single();

    const mode = body.publication_mode === 'anonymous' || body.publication_mode === 'profile' ? body.publication_mode : 'private';
    const publicName = typeof body.public_name === 'string' ? body.public_name.trim().slice(0,80) : '';
    if (mode === 'profile' && (!cleanedComment || publicName.length < 2)) return NextResponse.json({error:'Nombre público y comentario requeridos'},{status:400});
    const mayPublish = mode !== 'private' && Boolean(cleanedComment);
    const { data: profileAvatar } = mode === 'profile' && body.avatar_consent === true ? await admin.from('profiles').select('avatar_url').eq('id',req.client_id).maybeSingle() : {data:null};
    const trustedAvatar = profileAvatar?.avatar_url && /^https:\/\/lh\d+\.googleusercontent\.com\//i.test(profileAvatar.avatar_url) ? profileAvatar.avatar_url : null;

    // Insert review
    const { data: insertedReview, error: insertErr } = await admin.from('reviews').insert({
      case_id: req.case_id,
      client_id: req.client_id,
      rating: parsedRating,
      comment: cleanedComment || null,
      allow_publish: mayPublish,
      publication_mode: mode,
      public_name: mode === 'profile' ? publicName : null,
      public_avatar_url: mode === 'profile' && body.avatar_consent === true ? trustedAvatar : null,
      avatar_consent: mode === 'profile' && body.avatar_consent === true,
      publication_consent_at: mayPublish ? new Date().toISOString() : null,
      service_name: caseData?.service ?? null,
      status: 'pending',
      moderation_status: 'pending',
      comment_publishable: mayPublish,
      review_request_id: req.id,
    }).select('id').single();

    if (insertErr || !insertedReview) {
      console.error('[reviews/submit]', insertErr);
      return NextResponse.json({ error: 'Error al guardar la valoración' }, { status: 500 });
    }

    // Moderate after the response lifecycle so the client never waits on the AI provider.
    // Rating and identity are never sent to KIA.
    after(async () => {
      await moderateReviewByKia(insertedReview.id).catch(async (moderationError) => {
        console.error('[reviews/submit] KIA moderation failed', moderationError);
        await notifyKiaAdminEscalation({
          title: 'Reseña sin moderación automática',
          summary: 'La moderación de un comentario no ha podido completarse.',
          actionTaken: 'Se mantiene el comentario oculto y la puntuación verificada disponible.',
          interventionNeeded: 'Revisar el comentario pendiente desde el panel.',
          url: '/admin/resenas?status=pending',
          eventRef: `review-moderation-error/${insertedReview.id}`,
          priority: 'high',
        }).catch((notificationError) => console.error('[reviews/submit] escalation failed', notificationError));
      });
    });

    // Preserve the request history for auditing; never re-use its token.
    const { error: completeError } = await admin.from('review_requests')
      .update({ status: 'completed', review_id: insertedReview.id })
      .eq('id', req.id).eq('status', 'pending');
    if (completeError) console.error('[reviews/submit] completion update failed', completeError);

    // Confirm receipt to the client — best-effort, doesn't block the response.
    // profiles.email isn't reliably populated (handle_new_user() only sets
    // id/full_name/role) — Auth is the source of truth for the address to
    // actually notify, same pattern as the Stripe webhook's getClientEmail().
    try {
      const { data: profile } = await admin
        .from('profiles')
        .select('full_name')
        .eq('id', req.client_id)
        .maybeSingle();
      const { data: authUser } = await admin.auth.admin.getUserById(req.client_id);
      const email = authUser?.user?.email;
      if (email) {
        const tpl = reviewReceived(profile?.full_name ?? 'cliente');
        await sendEmail({ to: email, eventType: 'review.received', ...tpl });
      }
    } catch (emailErr) {
      console.error('[reviews/submit] confirmation email failed:', emailErr);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[reviews/submit]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
