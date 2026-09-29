import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('privacy, cookies and eSignature public compliance', () => {
  const layout = source('app/layout.tsx');
  const consent = source('components/privacy/CookieConsent.tsx');
  const privacy = source('app/(public)/privacidad/page.tsx');
  const cookies = source('app/(public)/cookies/page.tsx');
  const terms = source('app/(public)/terminos/page.tsx');
  const conditions = source('app/(public)/condiciones/page.tsx');
  const guide = source('app/(public)/docs/firma-google-esignature/page.tsx');
  const docs = source('lib/utils/docs.ts');

  it('does not load optional analytics directly from the root layout', () => {
    expect(layout).toContain('<CookieConsent />');
    expect(layout).not.toContain('googletagmanager.com/gtm.js');
    expect(layout).not.toContain('G-NWTGS6DH5E');
    expect(layout).not.toContain('tracker.metricool.com');
  });

  it('loads GA4, GTM and Metricool only after accepted consent', () => {
    expect(consent).toContain("consent?.value === 'accepted'");
    expect(consent).toContain('gtm-consented');
    expect(consent).toContain('ga4-consented-lib');
    expect(consent).toContain('metricool-consented');
    expect(consent).toContain("save('rejected')");
    expect(consent).toContain("save('accepted')");
    expect(consent).toContain('730 * 24 * 60 * 60 * 1000');
  });

  it('documents KIA transparency and human review', () => {
    expect(privacy).toContain('KIA es una asistente virtual basada en inteligencia artificial');
    expect(privacy).toContain('revisión humana');
    expect(terms).toContain('KIA es una asistente virtual de EXPERT basada en inteligencia artificial');
  });

  it('documents real Google productivity scopes and eSignature', () => {
    expect(privacy).toContain('Gmail (lectura, envío y gestión)');
    expect(privacy).toContain('Google Calendar');
    expect(privacy).toContain('Google Drive');
    expect(privacy).toContain('Google eSignature');
    expect(privacy).toContain('eu-west-2 (Londres)');
  });

  it('states the GDPR rights timing accurately', () => {
    expect(privacy).toContain('dentro de <strong>un mes</strong>');
    expect(privacy).toContain('ampliarse otros dos meses');
  });

  it('removes the obsolete ODR platform as a complaint channel', () => {
    expect(conditions).toContain('antigua plataforma europea ODR dejó de estar operativa');
    expect(conditions).not.toContain('ec.europa.eu/consumers/odr');
  });

  it('publishes a visual Google eSignature guide and signature-level warning', () => {
    expect(docs).toContain("slug: 'firma-google-esignature'");
    expect(guide).toContain('Solicitar firma');
    expect(guide).toContain('Ver detalles');
    expect(guide).toContain('registro de auditoría');
    expect(guide).toContain('no sustituye un certificado electrónico reconocido');
  });

  it('keeps cookie policy aligned with consent-gated analytics', () => {
    expect(cookies).toContain('no se cargan hasta que el usuario acepta');
    expect(cookies).toContain('24 meses');
    expect(cookies).toContain('Configurar cookies');
  });
});
