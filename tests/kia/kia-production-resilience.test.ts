import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const router = readFileSync(resolve(process.cwd(), 'lib/ai/kia/kia-provider-router.ts'), 'utf8');
const preview = readFileSync(resolve(process.cwd(), 'app/api/admin/kia/client-preview-email/route.ts'), 'utf8');

describe('KIA production resilience', () => {
  it('uses Vercel AI Gateway/OIDC before direct provider keys', () => {
    expect(router).toContain('VERCEL_OIDC_TOKEN');
    expect(router).toContain('AI_GATEWAY_API_KEY');
    expect(router).toContain('https://ai-gateway.vercel.sh/v1/chat/completions');
    expect(router.indexOf('callGateway(gatewayToken, request)')).toBeLessThan(router.indexOf('const providers = getKiaProviderOrder()'));
  });

  it('routes normal KIA chat through Gemini first with cross-provider fallbacks', () => {
    expect(router).toContain('google/gemini-3.6-flash');
    expect(router).toContain('google/gemini-3.1-pro-preview');
    expect(router).toContain('openai/gpt-5.6-sol');
    expect(router).toContain('anthropic/claude-sonnet-5');
    expect(router).toContain('if (taskType === "chat_reply" || taskType === "waba_reply") return GEMINI_CHAT_MODEL');
    expect(router).toContain('models: gatewayFallbackModelsForTask(request.taskType)');
  });

  it('fails over when a structured provider returns prose instead of JSON', () => {
    expect(router).toContain('AI Gateway returned a non-JSON response for a structured request');
    expect(router).toContain('${providerName} returned a non-JSON response for a structured request');
    expect(router).toContain('request.responseSchema && !parsedJson && toolCalls.length === 0');
  });

  it('fails over when Anthropic violates a structured response contract', () => {
    expect(router).toContain('anthropic returned a non-JSON response for a structured request');
  });

  it('enforces the persisted monthly AI budget before provider routing', () => {
    expect(router).toContain('getKiaAiBudgetGuard');
    expect(router).toContain("budgetGuard.mode === 'exhausted'");
    expect(router).toContain('budgetGuard.blockedProviders.includes(provider.provider)');
  });

  it('keeps direct providers as fallback only', () => {
    expect(router).toContain('getKiaProviderOrder()');
    expect(router).toContain('provider: "vercel-ai-gateway"');
  });

  it('has an independent direct three-provider pool when Gateway is unavailable', () => {
    expect(router).toContain('GOOGLE_API_KEY');
    expect(router).toContain('GEMINI_API_KEY');
    expect(router).toContain('GOOGLE_GENERATIVE_AI_API_KEY');
    expect(router).toContain('google,anthropic,openai');
    expect(router).toContain('generativelanguage.googleapis.com/v1beta/openai/chat/completions');
    expect(router).toContain('provider.provider === "google"');
    expect(router).toContain('callGoogle(provider, request)');
  });

  it('temporarily cools down failing providers before trying them again', () => {
    expect(router).toContain('providerCooldownUntil');
    expect(router).toContain('providerCoolingDown');
    expect(router).toContain('markProviderFailure');
    expect(router).toContain('HTTP\\s+(401|403)');
    expect(router).toContain('HTTP\\s+429');
    expect(router).toContain('HTTP\\s+402');
    expect(router).toContain('insufficient[_\\s-]?quota');
    expect(router).toContain('credit(?:s)? exhausted');
  });

  it('uses the unified KIA signature for preview email instead of an inline CTA', () => {
    expect(preview).toContain('kia_chat_href: href');
    expect(preview).toContain('kia_telegram_href: telegramHref');
    expect(preview).toContain('https://t.me/kia_expert_bot?start=ctx_');
    expect(preview).not.toContain('Hablar con KIA sobre este expediente');
  });
});
