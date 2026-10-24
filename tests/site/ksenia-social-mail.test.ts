import { describe, expect, it } from 'vitest';
import { KSENIA_SOCIAL_PROFILES } from '@/lib/personal/ksenia-social-profiles';
import { renderKseniaPersonalEmail } from '@/lib/personal/ksenia-email-template';

describe('Ksenia personal social profiles and email template', () => {
  it('contains five real social destinations and keeps them on the personal site', () => {
    expect(KSENIA_SOCIAL_PROFILES.map(p => p.key)).toEqual(['linkedin','instagram','facebook','x','youtube']);
    for (const p of KSENIA_SOCIAL_PROFILES) {
      expect(p.url.startsWith('https://')).toBe(true);
    }
  });
  it('renders a safe bilingual personal email without auto sending', () => {
    const es = renderKseniaPersonalEmail({ locale:'es', subject:'Propuesta', recipientName:'Ana', paragraphs:['Nos vemos pronto.','Gracias por escribir.'] });
    expect(es.from).toBe('soy@kseniailicheva.com');
    expect(es.html).toContain('Hola, Ana');
    expect(es.html).toContain('LinkedIn');
    expect(es.text).toContain('https://kseniailicheva.com');
    const ru = renderKseniaPersonalEmail({ locale:'ru', subject:'Предложение', paragraphs:['Благодарю за письмо.'] });
    expect(ru.html).toContain('Здравствуйте!');
    expect(ru.html).toContain('Благодарю за письмо.');
    const unsafe = renderKseniaPersonalEmail({ locale:'es', subject:'Saludos', recipientName:'<script>x</script>', paragraphs:['<img src=x onerror=alert(1)>'] });
    expect(unsafe.html).not.toContain('<script>');
    expect(unsafe.html).not.toContain('<img src=x');
    expect(() => renderKseniaPersonalEmail({ locale:'es', subject:'X', paragraphs:['Y'], cta:{label:'Enlace',url:'javascript:alert(1)'} })).toThrow();
  });
});
