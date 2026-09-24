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

  it('keeps an explicit draft/review warning and is connected to the flow', () => {
    expect(pack).toContain('Borrador generado por la herramienta gratuita EXPERT');
    expect(pack).toContain('Antes de utilizarlos deben revisarse');
    expect(flow).toContain('RgpdDocumentPack');
  });
});
