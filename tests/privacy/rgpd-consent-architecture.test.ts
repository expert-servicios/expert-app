import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('RGPD consent architecture', () => {
  const layout = source('app/layout.tsx');
  const consent = source('components/privacy/CookieConsent.tsx');
  const privacy = source('lib/privacy/cookie-consent.ts');
  const acquisition = source('lib/marketing/client-attribution.ts');
  const tracker = source('components/marketing/AcquisitionTracker.tsx');
  const footer = source('components/site/footer.tsx');
  const cookies = source('app/(public)/cookies/page.tsx');
  const privacyPage = source('app/(public)/privacidad/page.tsx');
  const conditions = source('app/(public)/condiciones/page.tsx');
  const rgpd = source('components/tools/RgpdWorkspace.tsx');

  it('does not load analytics or marketing trackers from root layout', () => {
    expect(layout).toContain('<CookieConsent />');
    expect(layout).not.toContain('googletagmanager.com/gtm.js');
    expect(layout).not.toContain('googletagmanager.com/ns.html');
    expect(layout).not.toContain('tracker.metricool.com');
    expect(layout).not.toContain('G-NWTGS6DH5E');
  });

  it('loads optional trackers only from accepted consent state', () => {
    expect(consent).toContain("const accepted = consent?.value === 'accepted'");
    expect(consent).toContain('{accepted && (');
    expect(consent).toContain('GTM-MKZ522HP');
    expect(consent).toContain('G-NWTGS6DH5E');
    expect(consent).toContain('tracker.metricool.com');
    expect(consent).not.toContain('noscript');
  });

  it('keeps the accepted state while settings are open and reloads after withdrawal', () => {
    expect(consent).toContain('const [settingsOpen, setSettingsOpen] = useState(false)');
    expect(consent).toContain('const wasAccepted = consent?.value');
    expect(consent).toContain("if (value === 'rejected')");
    expect(consent).toContain('clearAnalyticsCookies()');
    expect(consent).toContain('clearClientAttribution()');
    expect(consent).toContain('if (wasAccepted) window.location.reload()');
    expect(consent).not.toContain('setConsent(null)');
  });

  it('does not let localStorage errors block the privacy choice', () => {
    expect(privacy).toContain('try {');
    expect(privacy).toContain('window.localStorage.setItem');
    expect(privacy).toContain('Privacy choices still apply for the current page');
  });

  it('blocks acquisition attribution at the helper boundary until consent exists', () => {
    expect(acquisition).toContain("readCookieConsent()?.value !== 'accepted'");
    expect(tracker).toContain("readCookieConsent()?.value === 'accepted'");
    expect(tracker).toContain('COOKIE_CONSENT_EVENT');
    expect(acquisition).toContain('clearClientAttribution');
  });

  it('keeps cookie preferences reachable after the banner is closed', () => {
    expect(footer).toContain('CookieSettingsButton');
    expect(consent).toContain('OPEN_COOKIE_SETTINGS_EVENT');
    expect(consent).toContain('Configurar cookies');
  });

  it('keeps a detailed inventory and documents optional measurement accurately', () => {
    expect(cookies).toContain("name: '_ga'");
    expect(cookies).toContain("name: '_gid'");
    expect(cookies).toContain("name: '__stripe_mid'");
    expect(cookies).toContain("name: 'expert_acquisition'");
    expect(cookies).toContain("provider: 'Metricool'");
    expect(cookies).toContain('6 de octubre de 2026');
  });

  it('maps AI providers and transfer safeguards separately', () => {
    expect(privacyPage).toContain('OpenAI Ireland Limited / afiliadas');
    expect(privacyPage).toContain('Anthropic');
    expect(privacyPage).toContain('CCT o decisión de adecuación');
    expect(privacyPage).toContain('DPA y a las salvaguardas de transferencia');
  });

  it('preserves current subscription and billing rules', () => {
    expect(conditions).toContain('mes natural completo');
    expect(conditions).toContain('día 1 de cada mes');
    expect(conditions).toContain('sin prorrateo');
  });

  it('adds AI, productivity integrations and eSignature to the RGPD workspace', () => {
    expect(rgpd).toContain("id: 'ai-assistant'");
    expect(rgpd).toContain("id: 'productivity-integrations'");
    expect(rgpd).toContain("id: 'esignature'");
  });
});
