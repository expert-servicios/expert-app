import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  lead: vi.fn(),
  email: vi.fn(),
  captcha: vi.fn(),
  rate: vi.fn(),
  spam: vi.fn(),
  pdf: vi.fn(),
}));

vi.mock('@/lib/leads/ensure-inbound-lead', () => ({ ensureInboundLead: mocks.lead }));
vi.mock('@/lib/email/send', () => ({ sendEmail: mocks.email }));
vi.mock('@/lib/integrations/supabase', () => ({ getSupabaseAdmin: () => ({ from: vi.fn() }) }));
vi.mock('@/lib/utils/recaptcha', () => ({ verifyRecaptchaToken: mocks.captcha }));
vi.mock('@/lib/utils/spam-guard', () => ({
  getClientIp: () => '127.0.0.1',
  checkRateLimit: mocks.rate,
  checkSpam: mocks.spam,
}));
vi.mock('@react-pdf/renderer', () => ({ pdf: mocks.pdf }));
vi.mock('@/components/tools/RgpdReportPdf', () => ({ RgpdReportPdf: () => null }));

import { POST } from '@/app/api/rgpd/report/route';

const previousFlag = process.env.RGPD_REPORT_ENABLED;
const previousRuFlag = process.env.RGPD_RU_REPORT_ENABLED;
const payload = {
  requestId: '11111111-1111-4111-8111-111111111111',
  name: 'Persona Test',
  email: 'persona@example.test',
  locale: 'es',
  method: 'email',
  marketingConsent: false,
  informed: true,
  recaptchaToken: 'synthetic-captcha',
  answers: {},
};

const request = (input: Record<string, unknown> = {}) =>
  new NextRequest('https://expertconsulting.es/api/rgpd/report', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...payload, ...input }),
  });

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.RGPD_REPORT_ENABLED;
  delete process.env.RGPD_RU_REPORT_ENABLED;
  mocks.rate.mockReturnValue(true);
  mocks.captcha.mockResolvedValue({ ok: true });
  mocks.spam.mockReturnValue({ isSpam: false });
  mocks.lead.mockResolvedValue({ leadId: 'synthetic-lead', created: true });
  mocks.email.mockResolvedValue('synthetic-provider-id');
  mocks.pdf.mockReturnValue({
    toBlob: async () => new Blob([Buffer.from('%PDF-1.7\n' + 'example'.repeat(100))], { type: 'application/pdf' }),
  });
});
afterEach(() => {
  if (previousFlag === undefined) delete process.env.RGPD_REPORT_ENABLED;
  else process.env.RGPD_REPORT_ENABLED = previousFlag;
  if (previousRuFlag === undefined) delete process.env.RGPD_RU_REPORT_ENABLED;
  else process.env.RGPD_RU_REPORT_ENABLED = previousRuFlag;
});

describe('RGPD report delivery HTTP contract: isolated, no real DB or email', () => {
  it('fails closed by default without preparing a lead or sending email', async () => {
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ error: 'feature_unavailable' });
    expect(mocks.lead).not.toHaveBeenCalled();
    expect(mocks.email).not.toHaveBeenCalled();
  });

  it('keeps Russian PDF disabled even when the general report flag is on', async () => {
    process.env.RGPD_REPORT_ENABLED = 'true';
    const response = await POST(request({ locale: 'ru' }));
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ error: 'russian_pdf_pending_font_qa' });
    expect(mocks.lead).not.toHaveBeenCalled();
    expect(mocks.email).not.toHaveBeenCalled();
  });

  it('rejects unchecked information and malformed payload before creating leads', async () => {
    process.env.RGPD_REPORT_ENABLED = 'true';
    const response = await POST(request({ informed: false }));
    expect(response.status).toBe(400);
    expect(mocks.lead).not.toHaveBeenCalled();
    expect(mocks.email).not.toHaveBeenCalled();
  });

  it('sends the requested PDF by email with marketing opt-out and stable request identity', async () => {
    process.env.RGPD_REPORT_ENABLED = 'true';
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, delivery: 'email' });
    expect(mocks.lead).toHaveBeenCalledTimes(1);
    expect(mocks.lead).toHaveBeenCalledWith(expect.objectContaining({
      sourceKey: 'rgpd-report:11111111-1111-4111-8111-111111111111',
      preserveExistingClassification: true,
      metadata: expect.objectContaining({
        marketing_consent: false,
        privacy_notice_version: 'rgpd-report-2026-10-15',
      }),
    }));
    expect(mocks.email).toHaveBeenCalledTimes(1);
    const email = mocks.email.mock.calls[0][0];
    expect(email.to).toBe('persona@example.test');
    expect(email.idempotencyKey).toBe('rgpd/report/11111111-1111-4111-8111-111111111111');
    expect(email.attachments).toHaveLength(1);
    expect(email.attachments[0].filename).toBe('guia-rgpd-expert.pdf');
    expect(email.attachments[0].type).toBe('application/pdf');
    expect(Buffer.from(email.attachments[0].content, 'base64').subarray(0, 4).toString()).toBe('%PDF');
  });

  it('falls back to a private PDF if the email provider fails without retrying lead creation', async () => {
    process.env.RGPD_REPORT_ENABLED = 'true';
    mocks.email.mockRejectedValueOnce(new Error('synthetic provider failure'));
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/pdf');
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(response.headers.get('X-RGPD-Delivery')).toBe('email-failed-download');
    expect(Buffer.from(await response.arrayBuffer()).subarray(0,4).toString()).toBe('%PDF');
    expect(mocks.lead).toHaveBeenCalledTimes(1);
    expect(mocks.email).toHaveBeenCalledTimes(1);
  });

  it('offers a private no-store download without sending any email', async () => {
    process.env.RGPD_REPORT_ENABLED = 'true';
    const response = await POST(request({ method: 'download' }));
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/pdf');
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(mocks.email).not.toHaveBeenCalled();
  });
});
