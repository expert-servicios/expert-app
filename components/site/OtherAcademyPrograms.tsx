import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { academyPrograms } from '@/lib/data/academy-catalog';

function programHref(slug: string): string {
  return slug === academyPrograms[0]?.slug ? '/academy' : `/academy/${slug}`;
}

export function OtherAcademyPrograms({ currentSlug }: { currentSlug: string }) {
  const programs = academyPrograms.filter((program) => program.slug !== currentSlug);
  if (programs.length === 0) return null;

  return (
    <section className="px-6 py-14">
      <div className="mx-auto max-w-6xl">
        <div className="mb-7">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#D4A017]">EXPERT Business Academy</p>
          <h2 className="mt-2 font-serif text-2xl font-bold text-[#0D1B2A]">Otros programas que pueden interesarte</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {programs.map((program) => (
            <Link
              key={program.slug}
              href={programHref(program.slug)}
              className="group border border-[#D4A017]/20 bg-white p-5 shadow-sm transition hover:border-[#D4A017]/50 hover:shadow-md"
            >
              <p className="font-serif text-lg font-bold text-[#0D1B2A]">{program.name}</p>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#23364D]">{program.shortDescription}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[#9a6a17]">
                Ver programa <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
