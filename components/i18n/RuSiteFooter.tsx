import Link from 'next/link';
import { EXPERT_IDENTITY } from '@/config/identity';

export function RuSiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#0D1B2A] px-5 py-9 text-sm text-[#F8F6F1]/70 sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
        <div>
          <p>
            {EXPERT_IDENTITY.credentials.holdedSolutionPartner} ·{' '}
            {EXPERT_IDENTITY.credentials.holdedAccreditedAdvisory}
          </p>
          <a
            href={`mailto:${EXPERT_IDENTITY.publicEmail}`}
            className="mt-1 block hover:text-[#D4A017]"
          >
            {EXPERT_IDENTITY.publicEmail}
          </a>
          <a
            href={`tel:${EXPERT_IDENTITY.phoneE164}`}
            className="mt-1 block hover:text-[#D4A017]"
          >
            WhatsApp / Tel. {EXPERT_IDENTITY.phoneDisplay}
          </a>
        </div>

        <div className="flex flex-wrap gap-4">
          <Link href="/ru" className="hover:text-[#D4A017]">Главная</Link>
          <Link href="/ru/uslugi" className="hover:text-[#D4A017]">Услуги</Link>
          <Link href="/ru/konsultatsiya" className="hover:text-[#D4A017]">Консультация</Link>
          <Link href="/contacto" className="hover:text-[#D4A017]">Контакты</Link>
          <Link href="/aviso-legal" className="hover:text-[#D4A017]">Юридическая информация</Link>
        </div>
      </div>
    </footer>
  );
}
