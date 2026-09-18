import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  KIA_CAN_DO,
  KIA_CANNOT_DO,
  KIA_SECURITY_PRINCIPLES,
} from '@/lib/ai/kia-auditor/kia-auditor-public-guidelines';

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('KIA Sprint 5H help center consistency', () => {
  const protectedHelp = source('app/(protected)/dashboard/kia-ayuda/page.tsx');
  const publicHelp = source('app/(public)/ayuda/kia/page.tsx');

  it('removes the obsolete claim that Kia cannot see authorized case context', () => {
    expect(protectedHelp).not.toContain('Kia no ve tus documentos, estado de expediente ni información de cuenta');
    expect(protectedHelp).toContain('estado de expedientes y documentación pendiente');
    expect(publicHelp).toContain('estado de expedientes o documentación pendiente');
  });

  it('explains authentication and company boundaries on both help surfaces', () => {
    expect(protectedHelp).toContain('autenticación, permisos ni separación entre empresas');
    expect(publicHelp).toContain('autenticación, permisos ni separación entre clientes o empresas');
    expect(KIA_CANNOT_DO.some((item) => item.includes('Saltarse autenticación'))).toBe(true);
  });

  it('keeps secrets out of conversational channels', () => {
    expect(protectedHelp).toContain('API keys, contraseñas, códigos 2FA, tokens');
    expect(publicHelp).toContain('contraseñas, claves API, códigos de verificación, tokens');
    expect(KIA_SECURITY_PRINCIPLES.some((item) => item.includes('claves API'))).toBe(true);
  });

  it('does not promise unconfirmed completion or automatic tax filing', () => {
    expect(protectedHelp).toContain('Dar por realizada una operación sin confirmación');
    expect(publicHelp).toContain('completado un trámite si el sistema autorizado no lo confirma');
    expect(KIA_CANNOT_DO.some((item) => item.includes('sin confirmación del sistema autorizado'))).toBe(true);
  });

  it('exposes the authenticated-context capability to the auditor policy', () => {
    expect(KIA_CAN_DO.some((item) => item.includes('contexto autenticado y autorizado'))).toBe(true);
  });

  it('uses KIA visually without adding a second decision engine', () => {
    expect(protectedHelp).toContain('<KiaGuidanceCard');
    expect(protectedHelp).toContain('state="explicacion"');
    expect(publicHelp).toContain('<KiaGuidanceCard');
    expect(publicHelp).toContain('state="explicacion"');
    expect(protectedHelp).not.toContain('/api/ai/kia');
    expect(publicHelp).not.toContain('/api/ai/kia');
    expect(protectedHelp).not.toContain('runKiaDecision');
    expect(publicHelp).not.toContain('runKiaDecision');
  });
});
