import { describe, it, expect } from 'vitest';
import { kiaVoiceLocale, kiaTextForSpeech, chooseKiaBrowserVoice, KIA_DEFAULT_VOICE } from '@/lib/ai/kia/kia-voice-presentation';
import { readFileSync } from 'node:fs';
describe('KIA bilingual voice and safe playback',()=>{
 it('selects language from the actual response',()=>{
   expect(kiaVoiceLocale('Здравствуйте!')).toBe('ru');
   expect(kiaVoiceLocale('Hola, puedo ayudarte.')).toBe('es');
   expect(kiaVoiceLocale('IVA modelo 303','ru')).toBe('ru');
 });
 it('selects correct installed voice without exposing voices of other locales',()=>{
   const voices=[{lang:'en-US',name:'English'},{lang:'ru-RU',name:'Russian'},{lang:'es-ES',name:'Spanish'}];
   expect(chooseKiaBrowserVoice(voices,'ru')?.name).toBe('Russian');
   expect(chooseKiaBrowserVoice(voices,'es')?.name).toBe('Spanish');
   expect(chooseKiaBrowserVoice(voices.slice(0,1),'es')).toBeUndefined();
 });
 it('removes unsafe and awkward written markup from spoken output',()=>{
   const speech=kiaTextForSpeech('**Importante:** [AEAT](https://sede.agenciatributaria.gob.es)\n- Paso 1\n<em>hola</em>');
   expect(speech).toContain('Importante:');
   expect(speech).toContain('AEAT');
   expect(speech).not.toContain('https:');
   expect(speech).not.toContain('<em>');
   expect(speech).not.toContain('**');
 });
 it('sets a documented consistent provider voice and browser playback without public paid API calls',()=>{
   const audio=readFileSync('lib/ai/kia/kia-audio.ts','utf8');
   const publicWidget=readFileSync('components/site/KiaPublicWidget.tsx','utf8');
   const copilot=readFileSync('components/KiaCopilotWidget.tsx','utf8');
   expect(KIA_DEFAULT_VOICE).toBe('coral');
   expect(audio).toContain('|| KIA_DEFAULT_VOICE');
   expect(publicWidget).toContain('new SpeechSynthesisUtterance');
   expect(publicWidget).toContain('window.speechSynthesis.cancel()');
   expect(copilot).toContain('kiaVoiceLocale(text, uiLocale)');
 });
});
