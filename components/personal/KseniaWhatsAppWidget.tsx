'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircle, ExternalLink, X } from 'lucide-react';

const whatsappUrl = 'https://wa.me/34669045528?text=' + encodeURIComponent('Hola Ksenia, te escribo desde tu página web.');

export function KseniaWhatsAppWidget() {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const ru = path.startsWith('/ru') || path.endsWith('-ru');
  return (
    <aside className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+1rem)] right-4 z-[90] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6" aria-label={ru ? 'Связаться через WhatsApp' : 'Contacto por WhatsApp'}>
      {open && (
        <div id="ksenia-whatsapp-panel" className="w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#DFE6DF] bg-white shadow-[0_12px_44px_rgba(0,0,0,0.2)]">
          <div className="flex items-center gap-3 bg-[#1E7657] px-4 py-4 text-white">
            <MessageCircle aria-hidden="true" className="h-6 w-6 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{ru ? 'WhatsApp Ксении' : 'WhatsApp de Ksenia'}</p>
              <p className="mt-0.5 text-xs text-white/85">{ru ? 'Личный и профессиональный контакт' : 'Contacto personal y profesional'}</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label={ru ? 'Закрыть WhatsApp' : 'Cerrar contacto por WhatsApp'} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-white/15">
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <div className="p-4">
            <p className="text-sm leading-6 text-[#48585B]">{ru ? 'Напишите мне на номер' : 'Puedes escribirme directamente al'} <strong>+34 669 04 55 28</strong>. {ru ? 'Я отвечу, когда будет возможность.' : 'Te responderé cuando esté disponible.'}</p>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-5 py-3 text-sm font-semibold text-[#113D25] transition hover:bg-[#22c25d]">
              {ru ? 'Открыть WhatsApp' : 'Abrir WhatsApp'} <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
            <p className="mt-3 text-xs leading-5 text-[#667577]">{ru ? 'На вашем устройстве откроется WhatsApp. Сообщение не отправляется автоматически.' : 'Se abrirá WhatsApp en tu dispositivo. No se envía ningún mensaje automáticamente.'}</p>
          </div>
        </div>
      )}
      <button type="button" aria-label={open ? (ru ? 'Закрыть WhatsApp' : 'Cerrar WhatsApp') : (ru ? 'Открыть WhatsApp' : 'Abrir opciones de WhatsApp')} aria-expanded={open} aria-controls="ksenia-whatsapp-panel" onClick={() => setOpen(value => !value)} className="inline-flex min-h-14 items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-bold text-[#123B25] shadow-[0_8px_28px_rgba(0,0,0,0.24)] transition hover:bg-[#22c25d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D1B2A]">
        <MessageCircle className="h-6 w-6" aria-hidden="true" /> <span>WhatsApp</span>
      </button>
    </aside>
  );
}
