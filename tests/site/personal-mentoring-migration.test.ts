import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const read = (file: string) => readFileSync(file, 'utf8');

describe('Personal mentoring publication and corporate migration', () => {
  it('gives personal hosts beforeFiles priority over corporate routes', () => {
    const next = read('next.config.ts');
    expect(next).toContain('beforeFiles: [');
    expect(next).toContain("source: '/mentorias'");
    expect(next).toContain("destination: '/mentoria-personal'");
    expect(next).toContain("value: 'kseniailicheva.com'");
    expect(next).toContain("destination: '/perfil-ksenia'");
  });

  it('moves mentorDay, CiberEmprende, formats, methods, metrics and projects to the personal page', () => {
    const p = read('app/(personal)/mentoria-personal/page.tsx');
    for (const item of ['mentorDay','CiberEmprende','Speed Mentoring','Mentoría longitudinal','Mentor Tips','100','13','CasaFix.io','Regala por mí','Kidssmile Educational','Diagnosticar','Priorizar','Ejecutar','Medir','Decidir','/branding/mentorday-logo.png']) {
      expect(p).toContain(item);
    }
    expect(p).toContain('No significan que haya realizado 100 mentorías individuales');
    expect(p).toContain("canonical: mentorsUrl");
  });

  it('retires corporate public mentoring and duplicated personal biography without affecting admin', () => {
    expect(read('app/(public)/mentorias/page.tsx')).toContain("redirect('https://kseniailicheva.com/mentorias')");
    expect(read('app/(public)/sobre-mi/page.tsx')).toContain("redirect('https://kseniailicheva.com/#sobre-mi')");
    const header = read('components/site/header.tsx');
    expect(header).not.toContain("{ label: 'Mentorías', href: '/mentorias' }");
    expect(read('components/site/footer.tsx')).toContain("href: 'https://kseniailicheva.com'");
    expect(read('app/(personal)/perfil-ksenia/page.tsx')).toContain('Conocer mi actividad como mentora');
    expect(read('app/(protected)/admin/mentorias/page.tsx')).toContain('Mentor');
  });
});
