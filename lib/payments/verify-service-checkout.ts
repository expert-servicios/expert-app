import { getStripeClient } from '@/lib/integrations/stripe';

export type ServiceCheckoutVerification = {
  ok: boolean;
  serviceSlugs: string[];
  locale: 'es' | 'ru';
  caseId: string | null;
};

export async function verifyCompletedServiceCheckout(input: {
  sessionId?: string | null;
  userId?: string | null;
  expectedService?: string | null;
}): Promise<ServiceCheckoutVerification> {
  if (!input.sessionId || !input.userId || !input.sessionId.startsWith('cs_')) {
    return { ok: false, serviceSlugs: [], locale: 'es', caseId: null };
  }

  try {
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.retrieve(input.sessionId);

    if (
      session.client_reference_id !== input.userId
      || session.status !== 'complete'
      || session.payment_status !== 'paid'
    ) {
      return { ok: false, serviceSlugs: [], locale: 'es', caseId: null };
    }

    const serviceSlugs = (session.metadata?.service_slugs ?? session.metadata?.service_slug ?? '')
      .split(',')
      .map((slug) => slug.trim())
      .filter(Boolean);

    if (input.expectedService && !serviceSlugs.includes(input.expectedService)) {
      return {
        ok: false,
        serviceSlugs,
        locale: session.metadata?.checkout_locale === 'ru' ? 'ru' : 'es',
        caseId: null,
      };
    }

    const admin = (await import('@/lib/integrations/supabase')).getSupabaseAdmin();
    const paymentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.id;
    const { data: order } = await admin
      .from('orders')
      .select('case_id')
      .eq('stripe_payment_id', paymentId)
      .maybeSingle();

    return {
      ok: true,
      serviceSlugs,
      locale: session.metadata?.checkout_locale === 'ru' ? 'ru' : 'es',
      caseId: typeof order?.case_id === 'string' ? order.case_id : null,
    };
  } catch {
    return { ok: false, serviceSlugs: [], locale: 'es', caseId: null };
  }
}
