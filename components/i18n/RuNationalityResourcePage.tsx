import Link from 'next/link';
import type { RuResource } from '@/lib/i18n/ru-nationality-resources';

const SERVICE_HREF = '/ru/uslugi/grazhdanstvo-ispanii-rebenok-rozhdennyy-v-ispanii';

export function RuNationalityResourcePage({ resource }: { resource: RuResource }) {
  return (
    <main className="bg-[#F8F6F1] text-[#0D1B2A]">
      <section className="bg-[#0D1B2A] px-6 py-12 text-[#F8F6F1] md:py-16">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link href={SERVICE_HREF} className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4A017] hover:text-[#F2C14E]">
              ← Услуга
            </Link>
            <Link href={resource.esPath} className="text-xs font-semibold text-white/55 underline underline-offset-4 hover:text-[#D4A017]">
              Español
            </Link>
          </div>
          <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.24em] text-[#D4A017]">
            {resource.kind === 'docs' ? 'База знаний EXPERT' : 'Блог EXPERT'} · {resource.readTime}
          </p>
          <h1 className="mt-3 font-serif text-3xl font-bold leading-tight md:text-4xl">{resource.title}</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-white/65">{resource.description}</p>
        </div>
      </section>

      <div className="mx-auto grid max-w-5xl gap-10 px-6 py-12 lg:grid-cols-[1fr_300px] lg:items-start md:py-16">
        <article className="space-y-9">
          {resource.sections.map((section) => (
            <section key={section.title} className="border-b border-[#D4A017]/15 pb-8 last:border-0">
              <h2 className="font-serif text-2xl font-bold text-[#0D1B2A]">{section.title}</h2>
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph} className="mt-4 text-[15px] leading-7 text-[#23364D]">{paragraph}</p>
              ))}
              {section.bullets && (
                <ul className="mt-4 space-y-2.5">
                  {section.bullets.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-[15px] leading-6 text-[#23364D]">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-[#D4A017]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
              {section.numbered && (
                <ol className="mt-4 space-y-2.5">
                  {section.numbered.map((item, index) => (
                    <li key={item} className="grid grid-cols-[28px_1fr] gap-3 text-[15px] leading-6 text-[#23364D]">
                      <span className="flex h-7 w-7 items-center justify-center bg-[#D4A017]/15 text-xs font-bold text-[#0D1B2A]">{index + 1}</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          ))}
        </article>

        <aside className="space-y-5 lg:sticky lg:top-6">
          <div className="border border-[#D4A017]/30 bg-white p-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#D4A017]">Связанная услуга</p>
            <h2 className="mt-2 font-serif text-xl font-bold">Испанское гражданство для ребёнка</h2>
            <p className="mt-3 text-sm leading-6 text-[#23364D]">
              Полное сопровождение: 302,50 € с IVA + обязательная пошлина 790-026 — 104,05 € как suplido.
            </p>
            <Link href={SERVICE_HREF} className="mt-5 inline-flex min-h-11 w-full items-center justify-center bg-[#D4A017] px-4 text-sm font-bold text-[#0D1B2A] hover:bg-[#F2C14E]">
              Перейти к услуге
            </Link>
          </div>
          <div className="border border-[#D4A017]/20 bg-white p-5 text-sm leading-6 text-[#23364D]">
            Информация носит общий характер. Перед подачей EXPERT проверяет конкретную ситуацию ребёнка и документы семьи.
          </div>
        </aside>
      </div>
    </main>
  );
}
