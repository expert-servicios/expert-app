import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function source(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

const phoneFormPaths = [
  'app/(public)/contacto/ContactForm.tsx',
  'app/(public)/para-asesorias/ParaAsesoriasForm.tsx',
  'app/(public)/planes/gratuito/page.tsx',
  'app/(public)/planes/presupuesto-personalizado/page.tsx',
  'components/holded/RequestProposalModal.tsx',
  'components/site/AcademyLeadForm.tsx',
  'components/site/SolicitudPresupuestoForm.tsx',
] as const;

describe('site polish public forms and navigation', () => {
  it('keeps public phone inputs mobile-friendly and browser-validated', () => {
    for (const relativePath of phoneFormPaths) {
      const file = source(relativePath);
      expect(file).toContain('inputMode="tel"');
      expect(file).toContain('pattern="(?=.*[0-9])[+]?[0-9\\s().-]{7,20}"');
    }
  });

  it('cross-links Academy programs from both Academy page shapes', () => {
    const academyIndex = source('app/(public)/academy/page.tsx');
    const academyDetail = source('app/(public)/academy/[slug]/page.tsx');
    const relatedPrograms = source('components/site/OtherAcademyPrograms.tsx');

    expect(academyIndex).toContain('OtherAcademyPrograms currentSlug={program.slug}');
    expect(academyDetail).toContain('OtherAcademyPrograms currentSlug={program.slug}');
    expect(relatedPrograms).toContain("academyPrograms.filter((program) => program.slug !== currentSlug)");
    expect(relatedPrograms).toContain("'/academy'");
    expect(relatedPrograms).toContain('`/academy/${slug}`');
  });

  it('keeps the public Holded training anchor stable', () => {
    const holded = source('app/(public)/holded/page.tsx');
    expect(holded).toContain('id="formacion"');
    expect(holded).toContain('scroll-mt-24');
  });
});
