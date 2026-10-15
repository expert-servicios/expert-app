import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatDevOpsLegalReviewMessage, notifyDevOpsRegulatoryHumanReview } from '@/lib/regulatory/regulatory-devops-telegram';

const input = {
  changeId: '17e6667f-9c87-47c9-ba50-dff5046bec71',
  authority: 'BOE',
  title: 'Official regulatory source',
  sourceUrl: 'https://www.boe.es/buscar/doc.php?id=BOE-A-2026-21254',
  summary: 'Review <legal> & operational changes',
  severity: 'medium',
  effectiveDate: '2026-10-13',
  proposalUrl: null,
};
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
describe('Expert DevOps Bot · legal review notification', () => {
  it('escapes official source content and never generates an approval button', () => {
    const body = formatDevOpsLegalReviewMessage(input);
    expect(body).toContain('&lt;legal&gt; &amp;');
    expect(body).toContain('NO aprobado');
    expect(body).not.toContain('Aprobar ahora');
  });

  it('is disabled by default and never falls back to customer Telegram', async () => {
    vi.stubEnv('KIA_REGULATORY_DEVOPS_TELEGRAM_ENABLED', '');
    const fetcher = vi.fn();
    vi.stubGlobal('fetch', fetcher);
    expect(await notifyDevOpsRegulatoryHumanReview(input)).toBe('disabled');
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('rejects a different bot and does not send message', async () => {
    vi.stubEnv('KIA_REGULATORY_DEVOPS_TELEGRAM_ENABLED', 'true');
    vi.stubEnv('KIA_PR_REVIEW_TELEGRAM_BOT_TOKEN', 'synthetic');
    vi.stubEnv('KIA_PR_REVIEW_TELEGRAM_CHAT_ID', '123456789');
    const fetcher = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({
      ok: true, result: { username: 'kia_expert_bot' },
    }), { status: 200 }));
    vi.stubGlobal('fetch', fetcher);
    await expect(notifyDevOpsRegulatoryHumanReview(input)).rejects.toThrow('devops_telegram_wrong_bot_identity');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('verifies private chat identity and only sends review links (no callback actions)', async () => {
    vi.stubEnv('KIA_REGULATORY_DEVOPS_TELEGRAM_ENABLED', 'true');
    vi.stubEnv('KIA_PR_REVIEW_TELEGRAM_BOT_TOKEN', 'synthetic');
    vi.stubEnv('KIA_PR_REVIEW_TELEGRAM_CHAT_ID', '123456789');
    const ok = (value: unknown) => new Response(JSON.stringify({ ok: true, result: value }), { status: 200 });
    const fetcher = vi.fn().mockResolvedValueOnce(ok({ username: 'expert_devops_bot' }))
      .mockResolvedValueOnce(ok({ id: 123456789, type: 'private' }))
      .mockResolvedValueOnce(ok({ message_id: 42 }));
    vi.stubGlobal('fetch', fetcher);
    expect(await notifyDevOpsRegulatoryHumanReview(input)).toBe('sent');
    expect(fetcher).toHaveBeenCalledTimes(3);
    const body = JSON.parse(String(fetcher.mock.calls[2]?.[1]?.body));
    expect(body.reply_markup.inline_keyboard[0][0].url).toContain('/admin/regulatory?changeId=');
    expect(JSON.stringify(body)).not.toContain('callback_data');
  });

  it('blocks group chats before sending the legal content', async () => {
    vi.stubEnv('KIA_REGULATORY_DEVOPS_TELEGRAM_ENABLED', 'true');
    vi.stubEnv('KIA_PR_REVIEW_TELEGRAM_BOT_TOKEN', 'synthetic');
    vi.stubEnv('KIA_PR_REVIEW_TELEGRAM_CHAT_ID', '123456789');
    const ok = (value: unknown) => new Response(JSON.stringify({ ok: true, result: value }), { status: 200 });
    const fetcher = vi.fn().mockResolvedValueOnce(ok({ username: 'expert_devops_bot' }))
      .mockResolvedValueOnce(ok({ id: 123456789, type: 'group' }));
    vi.stubGlobal('fetch', fetcher);
    await expect(notifyDevOpsRegulatoryHumanReview(input)).rejects.toThrow('devops_telegram_private_chat_required');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
