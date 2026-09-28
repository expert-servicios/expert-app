import { createHmac, timingSafeEqual } from 'node:crypto';

type QuoteClaimPayload = {
  quoteId: string;
  email: string;
  exp: number;
};

function signingSecret(): string {
  const secret = process.env.QUOTE_CLAIM_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error('Missing quote claim signing secret');
  return secret;
}

function sign(encodedPayload: string): string {
  return createHmac('sha256', signingSecret())
    .update(`expert:quote-claim:v1:${encodedPayload}`)
    .digest('base64url');
}

export function createQuoteClaimToken(input: {
  quoteId: string;
  email: string;
  expiresInSeconds?: number;
}): string {
  const payload: QuoteClaimPayload = {
    quoteId: input.quoteId,
    email: input.email.trim().toLowerCase(),
    exp: Math.floor(Date.now() / 1000) + (input.expiresInSeconds ?? 30 * 24 * 60 * 60),
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifyQuoteClaimToken(token: string): QuoteClaimPayload | null {
  const [encodedPayload, providedSignature, extra] = token.split('.');
  if (!encodedPayload || !providedSignature || extra) return null;

  const expectedSignature = sign(encodedPayload);
  const actual = Buffer.from(providedSignature);
  const expected = Buffer.from(expectedSignature);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as Partial<QuoteClaimPayload>;
    if (
      typeof parsed.quoteId !== 'string' ||
      !parsed.quoteId ||
      typeof parsed.email !== 'string' ||
      !parsed.email.includes('@') ||
      typeof parsed.exp !== 'number' ||
      parsed.exp < Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    return {
      quoteId: parsed.quoteId,
      email: parsed.email.trim().toLowerCase(),
      exp: parsed.exp,
    };
  } catch {
    return null;
  }
}
