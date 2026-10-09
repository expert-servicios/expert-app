import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('EXPERT Workspace persistent KIA dock', () => {
  it('retains an embedded single Admin KIA instance', () => {
    const dock = read('components/admin/AdminRightPanel.tsx');
    const widget = read('components/KiaCopilotWidget.tsx');
    expect(dock).toContain('<KiaCopilotWidget embedded active={open && tab === \'kia\'} />');
    expect(widget).toContain("if (pathname.startsWith('/admin') && !embedded) return null;");
    expect(dock).toContain('mounted.has(id)');
  });

  it('keeps existing user preference and defaults to open on wide screens', () => {
    const dock = read('components/admin/AdminRightPanel.tsx');
    expect(dock).toContain("localStorage.getItem('adminRightPanel')");
    expect(dock).toContain("window.matchMedia('(min-width: 1536px)').matches");
    expect(dock).toContain("localStorage.setItem('adminRightPanel'");
  });

  it('offers a visible close/open trigger, responsive overlay and accessible buttons', () => {
    const dock = read('components/admin/AdminRightPanel.tsx');
    expect(dock).toContain('Cerrar ventana KIA Copiloto');
    expect(dock).toContain('Abrir ventana KIA Copiloto');
    expect(dock).toContain('2xl:sticky');
    expect(dock).toContain('fixed inset-x-3');
    expect(dock).toContain('aria-label="Panel lateral KIA Copiloto y notificaciones"');
  });

  it('retains notifications and inbox entry without a second chat session', () => {
    const dock = read('components/admin/AdminRightPanel.tsx');
    expect(dock).toContain("id: 'notificaciones'");
    expect(dock).toContain('href="/admin/correo"');
    expect(dock).toContain('<NotificacionesTab />');
  });
});
