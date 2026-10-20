'use client';

import { usePathname } from 'next/navigation';
import { Facebook, Instagram, Linkedin, Youtube } from 'lucide-react';
import { KSENIA_SOCIAL_PROFILES } from '@/lib/personal/ksenia-social-profiles';

export function KseniaSocialLinks() {
  const pathname = usePathname();
  const ru = pathname.startsWith('/ru') || pathname.endsWith('-ru');

  return (
    <nav aria-label={ru ? 'Профили Ксении в социальных сетях' : 'Perfiles sociales de Ksenia'} className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 md:px-10">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#D3AD73]">{ru ? 'Я в социальных сетях' : 'Sígueme en redes'}</p>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {KSENIA_SOCIAL_PROFILES.map(profile => {
          const Icon = profile.key === 'linkedin' ? Linkedin : profile.key === 'instagram' ? Instagram : profile.key === 'facebook' ? Facebook : profile.key === 'youtube' ? Youtube : null;
          return (
            <a
              key={profile.key}
              href={profile.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={profile.label + (ru ? ' — профиль Ксении' : ' — perfil de Ksenia')}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#D3AD73]/50 px-3 py-2 text-xs font-medium text-white transition hover:border-[#D3AD73] hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D3AD73]"
            >
              {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : <span aria-hidden="true" className="text-base font-bold">X</span>}
              <span className="hidden sm:inline">{profile.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
