import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
const read=(p:string)=>readFileSync(p,'utf8');
describe('Russian booking widget',()=>{
it('accepts locale and translates key labels',()=>{
const s=read('components/booking/NativeBookingForm.tsx');expect(s).toContain("locale?: 'es' | 'ru'");expect(s).toContain('Встреча подтверждена');expect(s).toContain('Имя *');expect(s).toContain('Проверяем свободное время');
});
it('Russian reservation uses Russian booking widget',()=>{expect(read('app/(personal)/reserva-ksenia-ru/page.tsx')).toContain('locale="ru"');});
});