import { getStripeClient } from '@/lib/integrations/stripe';

export type ServiceCheckoutVerification = {
  ok: boolean;
  serviceSlugs: string[];
  locale: 'es' | 'ru';
};

export async function verifyCompletedServiceCheckout(input: {
  sessionId?: string | null;
  userId?: string | null;
  expectedService?: string | null;
}): Promise<ServiceCheckoutVerification> {
  if (!input.sessionId || !input.userId || !input.sessionId.startsWith('cs_')) {
    return { ok: false, serviceSlugs: [], locale: 'es' };
  }

  try {
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.retrieve(input.sessionId);

    if (
      session.client_reference_id !== input.userId
      || session.status !== 'complete'
      || session.payment_status !== 'paid'
    ) {
      return { ok: false, serviceSlugs: [], locale: 'es' };
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
      };
    }

    return {
      ok: true,
      serviceSlugs,
      locale: session.metadata?.checkout_locale === 'ru' ? 'ru' : 'es',
    };
  } catch {
    return { ok: false, serviceSlugs: [], locale: 'es' };
  }
}
