import { describe, expect, it } from 'vitest';
import { inferKiaEmailMood, kiaEmailSignatureHtml } from '@/lib/email/kia-signature';
import { welcomeEmail, caseDocsReceived, caseBlocked } from '@/lib/email/templates';

describe('KIA email identity', () => {
  it('renders a transparent AI signature with a production avatar', () => {
    const html = kiaEmailSignatureHtml({ mood: 'celebracion', locale: 'es', appUrl: 'https://expertconsulting.es' });

    expect(html).toContain('data-kia-signature="true"');
    expect(html).toContain('/avatars/kia/kia-celebracion.webp');
    expect(html).toContain('KIA');
    expect(html).toContain('Asistente IA de EXPERT');
    expect(html).toContain('automáticamente');
    expect(html).toContain('info@expertconsulting.es');
  });

  it('uses client-friendly subjects for common lifecycle messages', () => {
    expect(welcomeEmail('Ana').subject).toMatch(/^👋/);
    expect(caseDocsReceived('Ana', 'Servicio', null, '').subject).toMatch(/^👏/);
    expect(caseBlocked('Ana', 'Servicio', null).subject).toMatch(/^⚠️/);
  });

  it('maps positive and follow-up contexts to appropriate moods', () => {
    expect(inferKiaEmailMood('🎉 ¡Documento firmado!')).toBe('celebracion');
    expect(inferKiaEmailMood('⏰ Recordatorio de firma')).toBe('seguimiento');
    expect(inferKiaEmailMood('⚠️ Necesitamos tu atención')).toBe('aviso');
  });
});
