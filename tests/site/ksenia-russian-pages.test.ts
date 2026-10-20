import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
const read=(p:string)=>readFileSync(p,'utf8');
describe('Ksenia Russian route and contact UI',()=>{
it('maps three separate pages only on personal hosts',()=>{
const c=read('next.config.ts');
for(const route of ["/ru","/ru/mentorias","/ru/reservar"])expect(c).toContain("source: '"+route+"'");
for(const target of ['/perfil-ksenia-ru','/mentoria-personal-ru','/reserva-ksenia-ru'])expect(c).toContain("destination: '"+target+"'");
});
it('supports Russian contact form and WhatsApp',()=>{
expect(read('components/personal/KseniaPersonalContactForm.tsx')).toContain("locale?: 'es' | 'ru'");
expect(read('components/personal/KseniaWhatsAppWidget.tsx')).toContain("location.pathname.startsWith('/ru')");
});
});