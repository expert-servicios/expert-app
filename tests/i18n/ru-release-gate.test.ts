import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { EXPERT_IDENTITY, HOLDED_BRAND_NAME } from '@/config/identity';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@/lib/i18n/config';
import { PUBLIC_ROUTE_KEYS, getLocalizedPublicHref } from '@/lib/i18n/public-routes';
import { RU_PUBLIC_CONTENT } from '@/lib/i18n/ru-public-content';

const root = process.cwd();
const source = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

const localizedPage = source('app/(localized)/ru/[[...slug]]/page.tsx');
const ruShell = source('components/i18n/RuPublicPage.tsx');
const ruFooter = source('components/i18n/RuSiteFooter.tsx');
const ruLayout = source('app/(localized)/ru/layout.tsx');
const switcher = source('components/i18n/LanguageSwitcher.tsx');
const languageApi = source('app/api/preferences/language/route.ts');
const featureFlags = source('lib/i18n/feature-flags.ts');
const acquisition = source('lib/marketing/client-attribution.ts');
const quoteApi = source('app/api/quotes/route.ts');
const academyApi = source('app/api/academy/leads/route.ts');
const saasApi = source('app/api/saas-leads/route.ts');
const kiaContext = source('lib/ai/kia/kia-context-builder.ts');
const kiaPolicy = source('lib/ai/kia/prompts/kia-core-policy.ts');
const commercial = source('lib/i18n/ru-commercial-data.ts');

const ruFiles = [
  source('lib/i18n/ru-public-content.ts'),
  commercial,
  ruShell,
  ruFooter,
  source('messages/ru.json'),
].join('\n');

describe('RU release gate', () => {
  it('keeps Spanish unprefixed and RU on the explicit ten-route surface', () => {
    expect(DEFAULT_LOCALE).toBe('es');
    expect(SUPPORTED_LOCALES).toEqual(['es', 'ru', 'en']);
    expect(PUBLIC_ROUTE_KEYS).toHaveLength(10);
    expect(getLocalizedPublicHref('home', 'es')).toBe('/');
    expect(getLocalizedPublicHref('home', 'ru')).toBe('/ru');
    expect(getLocalizedPublicHref('holded', 'ru')).toBe('/ru/holded');
    expect(getLocalizedPublicHref('plans', 'ru')).toBe('/ru/plany');
    expect(getLocalizedPublicHref('consultation', 'ru')).toBe('/ru/konsultatsiya');
  });

  it('requires separate visibility and index gates before RU can be indexed', () => {
    expect(featureFlags).toContain('NEXT_PUBLIC_RU_ENABLED');
    expect(featureFlags).toContain('NEXT_PUBLIC_RU_INDEX_ENABLED');
    expect(featureFlags).toContain("locale === 'es'");
    expect(localizedPage).toContain("shouldIndexLocale('ru')");
    expect(localizedPage).toContain('robots:');
    expect(localizedPage).toContain("'es-ES'");
    expect(localizedPage).toContain("'ru-RU'");
    expect(localizedPage).toContain("'x-default'");
    expect(localizedPage).toContain('canonical:');
  });

  it('persists language preference without inferring it from nationality', () => {
    expect(switcher).toContain('/api/preferences/language');
    expect(languageApi).toContain("COOKIE_NAME = 'expert_locale'");
    expect(languageApi).toContain(".from('profiles')");
    expect(languageApi).toContain('preferred_language');
    expect(languageApi.toLowerCase()).not.toContain('nationality');
    expect(languageApi.toLowerCase()).not.toContain('citizenship');
  });

  it('preserves locale and acquisition context into lead flows', () => {
    expect(acquisition).toContain("ACQUISITION_COOKIE_NAME = 'expert_acquisition'");
    expect(acquisition).toContain("if (pathname === '/ru' || pathname.startsWith('/ru/')) return 'ru'");
    expect(quoteApi).toContain('buildLeadAttributionFields');
    expect(academyApi).toContain('buildLeadAttributionFields');
    expect(saasApi).toContain('readRequestAttribution');
  });

  it('keeps RU prices attached to the canonical EXPERT catalog instead of locale-specific products', () => {
    expect(commercial).toContain('MONTHLY_PLANS_KNOWLEDGE');
    expect(commercial).toContain('holdedPackStarterKnowledge.price');
    expect(commercial).toContain('holdedMigracionSinInventarioKnowledge.price');
    expect(commercial).toContain('holdedMigracionConInventarioKnowledge.price');
    expect(commercial).toContain("services.find((item) => item.slug === slug)");
    expect(commercial).not.toContain('stripePriceId:');
    expect(commercial).not.toContain('priceId:');
  });

  it('protects the Holded spelling across Russian-facing content', () => {
    expect(HOLDED_BRAND_NAME).toBe('Holded');
    expect(ruFiles).not.toMatch(/холд(?:ед|эд)?|холед|хоулдед/iu);
    expect(ruFiles).toContain('Holded');
  });

  it('uses canonical EXPERT credentials and public contact data in the RU shell', () => {
    expect(EXPERT_IDENTITY.publicEmail).toBe('info@expertconsulting.es');
    expect(EXPERT_IDENTITY.phoneDisplay).toBe('+34 669 04 55 28');
    expect(ruShell).toContain("import { EXPERT_IDENTITY } from '@/config/identity'");
    expect(ruShell).toContain('EXPERT_IDENTITY.credentials.aeatSocialCollaborator');
    expect(ruFooter).toContain("import { EXPERT_IDENTITY } from '@/config/identity'");
    expect(ruFooter).toContain('EXPERT_IDENTITY.publicEmail');
    expect(ruFooter).toContain('EXPERT_IDENTITY.phoneDisplay');
    expect(ruLayout).toContain('<RuSiteFooter />');
  });

  it('keeps Academy private/non-regulated and SIF terminology explicit', () => {
    expect(RU_PUBLIC_CONTENT.academy.description).toContain('Частное нерегулируемое обучение');
    expect(ruShell).toContain('RU_MESSAGES.credentials.academyPrivateTraining');
    expect(RU_PUBLIC_CONTENT.verifactu.eyebrow).toContain('SIF');
    expect(RU_PUBLIC_CONTENT.verifactu.description).toContain('VERI*FACTU — одна из предусмотренных моделей');
  });

  it('passes RU preference into Kia context while keeping jurisdiction independent from language', () => {
    expect(kiaContext).toContain('preferred_language');
    expect(kiaContext).toContain('language: resolveKiaLocale');
    expect(kiaPolicy).toContain('IDIOMA: El idioma elegido por el usuario no implica nacionalidad, residencia fiscal ni jurisdiccion');
    expect(kiaPolicy).toContain('JURISDICCION:');
    expect(kiaPolicy).toContain('derecho ruso, ucraniano u otro derecho extranjero');
  });
});
