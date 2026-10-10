import Link from 'next/link';

type Contactos360Section = 'directory' | 'leads';

const SECTIONS: Array<{ key: Contactos360Section; label: string; href: string; description: string }> = [
  {
    key: 'directory',
    label: 'Personas y empresas',
    href: '/admin/directorio',
    description: 'Identidades, clientes y entidades',
  },
  {
    key: 'leads',
    label: 'Solicitudes y leads',
    href: '/admin/leads',
    description: 'Captación, seguimiento y CRM',
  },
];

/**
 * One navigation entry point; data stores remain separate by design.
 * This component does not merge identities or grant access to new APIs.
 */
export function Contactos360Navigation({ section }: { section: Contactos360Section }) {
  return (
    <nav aria-label="Contactos 360" className="mt-5 flex w-full flex-wrap gap-2">
      {SECTIONS.map((item) => {
        const active = item.key === section;
        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`inline-flex min-w-0 flex-1 flex-col rounded-xl border px-4 py-2.5 text-left transition sm:flex-none ${active
              ? 'border-[#07111d] bg-[#07111d] text-white'
              : 'border-[#d8cbb5] bg-[#fffdf8] text-[#29384a] hover:border-[#c88b25]'}`}
          >
            <span className="text-xs font-bold sm:text-sm">{item.label}</span>
            <span className={`mt-0.5 text-[10px] ${active ? 'text-white/70' : 'text-[#6f665b]'}`}>
              {item.description}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
