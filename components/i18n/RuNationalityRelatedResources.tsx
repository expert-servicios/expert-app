import Link from 'next/link';
import { BookOpen, Newspaper } from 'lucide-react';
import { RU_NATIONALITY_RESOURCES } from '@/lib/i18n/ru-nationality-resources';

export function RuNationalityRelatedResources() {
  const docs = RU_NATIONALITY_RESOURCES.filter((resource) => resource.kind === 'docs');
  const blog = RU_NATIONALITY_RESOURCES.filter((resource) => resource.kind === 'blog');

  return (
    <section className="bg-[#F8F6F1] px-6 pb-16 text-[#0D1B2A]">
      <div className="mx-auto max-w-5xl border-t border-[#D4A017]/25 pt-12">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4A017]">Полезные материалы</p>
        <h2 className="mt-2 font-serif text-2xl font-bold md:text-3xl">Подробнее о процедуре</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[#23364D]">
          Руководства и статьи EXPERT по сроку легальной резиденции, документам и подготовке заявления на гражданство ребёнка, родившегося в Испании.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-[#D4A017]" />
              <h3 className="font-serif text-xl font-bold">База знаний</h3>
            </div>
            <div className="space-y-3">
              {docs.map((resource) => (
                <Link
                  key={resource.slug}
                  href={`/ru/docs/${resource.slug}`}
                  className="block border border-[#D4A017]/20 bg-white p-5 transition hover:border-[#D4A017] hover:shadow-sm"
                >
                  <p className="font-semibold text-[#0D1B2A]">{resource.title}</p>
                  <p className="mt-2 text-sm leading-6 text-[#23364D]/75">{resource.description}</p>
                  <p className="mt-3 text-xs font-semibold text-[#D4A017]">{resource.readTime} →</p>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-center gap-2">
              <Newspaper className="h-5 w-5 text-[#D4A017]" />
              <h3 className="font-serif text-xl font-bold">Статьи</h3>
            </div>
            <div className="space-y-3">
              {blog.map((resource) => (
                <Link
                  key={resource.slug}
                  href={`/ru/blog/${resource.slug}`}
                  className="block border border-[#D4A017]/20 bg-white p-5 transition hover:border-[#D4A017] hover:shadow-sm"
                >
                  <p className="font-semibold text-[#0D1B2A]">{resource.title}</p>
                  <p className="mt-2 text-sm leading-6 text-[#23364D]/75">{resource.description}</p>
                  <p className="mt-3 text-xs font-semibold text-[#D4A017]">{resource.readTime} →</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
