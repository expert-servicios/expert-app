import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
const read = (p: string) => readFileSync(p, 'utf8');
describe('Personal to EXPERT cross-links', () => {
  it('links editorial mentions, company logo and direct service CTAs on personal home', () => {
    const home = read('app/(personal)/perfil-ksenia/page.tsx');
    expect(home).toContain('href="https://expertconsulting.es/servicios"');
    expect(home).toContain('Ver los servicios de EXPERT');
    expect(home).toContain('Solicitar un servicio de EXPERT');
    expect(home).toContain('aria-label="Ir a la web de EXPERT CONSULTING"');
    expect(home).toContain('href="https://expertconsulting.es" target="_blank" rel="noopener noreferrer"');
  });
  it('makes appropriate professional-services links available on mentoring and booking', () => {
    const mentoring = read('app/(personal)/mentoria-personal/page.tsx');
    const booking = read('app/(personal)/reserva-ksenia/page.tsx');
    expect(mentoring).toContain('Ver servicios de EXPERT');
    expect(mentoring).toContain('https://expertconsulting.es/servicios');
    expect(booking).toContain('https://expertconsulting.es/servicios');
    expect(read('components/personal/KseniaPersonalContactForm.tsx')).toContain('href="https://expertconsulting.es"');
  });
});
