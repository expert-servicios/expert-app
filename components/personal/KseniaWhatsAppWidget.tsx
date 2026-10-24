'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { MessageCircle, ExternalLink, X } from 'lucide-react';

const whatsappUrl = (ru: boolean) => 'https://wa.me/34669045528?text=' + encodeURIComponent(ru ? 'Здравствуйте, Ксения! Я посетил(а) ваш сайт и хотел(а) бы с вами связаться.' : 'Hola, Ksenia. He visitado tu web y me gustaría hablar contigo.');

export function KseniaWhatsAppWidget() {
  const [open, setOpen] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const path = usePathname();
  const ru = path.startsWith('/ru') || path.endsWith('-ru');
  useEffect(() => {
    if (window.matchMedia('(max-width: 639px)').matches) return;
    try { if (window.localStorage.getItem('ksenia-whatsapp-intro-dismissed') === '1') return; } catch { /* storage unavailable */ }
    const timer = window.setTimeout(() => setShowIntro(true), 3500);
    return () => window.clearTimeout(timer);
  }, []);
  const dismissIntro = () => {
    setShowIntro(false);
    try { window.localStorage.setItem('ksenia-whatsapp-intro-dismissed', '1'); } catch { /* storage unavailable */ }
  };
  return (
    <aside className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] right-3 z-[60] flex max-w-[calc(100vw-1.5rem)] flex-col items-end gap-3 sm:bottom-6 sm:right-6" aria-label={ru ? 'Связаться через WhatsApp' : 'Contacto por WhatsApp'}>
      {open && (
        <div id="ksenia-whatsapp-panel" className="max-h-[calc(100dvh-7rem)] w-[min(20rem,calc(100vw-1.5rem))] overflow-y-auto rounded-2xl border border-[#DFE6DF] bg-white shadow-[0_12px_44px_rgba(0,0,0,0.2)]">
          <div className="flex items-center gap-3 bg-[#182A32] px-4 py-4 text-white">
            <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-[#D3AD73]"><Image src="/personal/ksenia-avatar-approved.webp" alt="" fill sizes="48px" className="object-cover object-top" /></span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Ksenia Ilicheva</p>
              <p className="mt-0.5 text-xs text-white/85">{ru ? 'Личный контакт' : 'Contacto directo'}</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label={ru ? 'Закрыть WhatsApp' : 'Cerrar contacto por WhatsApp'} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-white/15">
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <div className="p-4">
            <p className="text-sm leading-6 text-[#48585B]">{ru ? 'Здравствуйте! Хотите обсудить наставничество или сотрудничество? Напишите мне.' : 'Hola, soy Ksenia. ¿Hablamos de mentoría, colaboración o alguna consulta?'}</p>
            <a href={whatsappUrl(ru)} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-5 py-3 text-sm font-semibold text-[#113D25] transition hover:bg-[#22c25d]">
              {ru ? 'Открыть WhatsApp' : 'Abrir WhatsApp'} <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
            <p className="mt-3 text-xs leading-5 text-[#667577]">{ru ? 'На вашем устройстве откроется WhatsApp. Сообщение не отправляется автоматически.' : 'Se abrirá WhatsApp en tu dispositivo. No se envía ningún mensaje automáticamente.'}</p>
          </div>
        </div>
      )}
      {!open && showIntro && <div className="hidden max-w-[17rem] items-start gap-2 rounded-xl border border-[#DFD8C9] bg-white p-3 text-sm text-[#182A32] shadow-lg sm:flex"><button type="button" className="text-left" onClick={() => { dismissIntro(); setOpen(true); }}><strong>{ru ? 'Здравствуйте, я Ксения.' : 'Hola, soy Ksenia.'}</strong><span className="mt-1 block text-xs">{ru ? 'Напишете мне?' : '¿Hablamos por WhatsApp?'}</span></button><button type="button" onClick={dismissIntro} aria-label={ru ? 'Скрыть приветствие' : 'Ocultar saludo'} className="flex h-9 w-9 shrink-0 items-center justify-center"><X className="h-4 w-4" /></button></div>}
      <button type="button" aria-label={open ? (ru ? 'Закрыть WhatsApp' : 'Cerrar WhatsApp') : (ru ? 'Открыть WhatsApp' : 'Abrir opciones de WhatsApp')} aria-expanded={open} aria-controls="ksenia-whatsapp-panel" onClick={() => { dismissIntro(); setOpen(value => !value); }} className="inline-flex min-h-12 items-center gap-2 rounded-full border-2 border-white bg-[#182A32] py-1 pl-1 pr-2 text-sm font-bold text-white shadow-[0_8px_28px_rgba(0,0,0,0.2)] transition hover:bg-[#30454B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D1B2A]">
        <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full"><Image src="/personal/ksenia-avatar-approved.webp" alt="" fill sizes="40px" className="object-cover object-top" /></span> <span className="hidden sm:inline">{ru ? "Написать мне" : "Escríbeme"}</span><MessageCircle className="h-5 w-5 text-[#25D366]" aria-hidden="true" />
      </button>
    </aside>
  );
}
