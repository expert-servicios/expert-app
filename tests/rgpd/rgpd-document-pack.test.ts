import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const pack = source('components/tools/RgpdDocumentPack.tsx');
const flow = source('components/tools/RgpdSelfAssessment.tsx');

describe('RGPD local document pack', () => {
  it('generates documents locally from the existing workspace', () => {
    expect(pack).toContain('window.localStorage');
    expect(pack).toContain('Blob');
    expect(pack).toContain('URL.createObjectURL');
    expect(pack).not.toContain('fetch(');
  });

  it('includes the four base documents', () => {
    expect(pack).toContain('Cláusula informativa');
    expect(pack).toContain('Procedimiento de derechos');
    expect(pack).toContain('Registro de brechas');
    expect(pack).toContain('Encargados y transferencias');
  });

  it('offers an extended draft privacy policy without inventing legal bases or DPO details', () => {
    expect(pack).toContain('politica-privacidad-ampliada-borrador.md');
    expect(pack).toContain('extendedPrivacyPolicy');
    expect(pack).toContain('NO PUBLICAR SIN REVISIÓN');
    expect(pack).toContain('Decisiones automatizadas y elaboración de perfiles');
    expect(pack).toContain('Delegado de Protección de Datos');
    expect(pack).toContain('https://www.aepd.es/derechos-y-deberes/conoce-tus-derechos/derecho-de-informacion');
  });

  it('keeps an explicit draft/review warning and is connected to the flow', () => {
    expect(pack).toContain('Borrador generado por la herramienta gratuita EXPERT');
    expect(pack).toContain('Antes de utilizarlos deben revisarse');
    expect(flow).toContain('RgpdDocumentPack');
  });
});
