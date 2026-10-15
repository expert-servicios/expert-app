import { RGPD_RU_GLOSSARY } from '@/lib/rgpd/ru-legal-glossary';

/** Expanded bilingual vocabulary for Russian-speaking entrepreneurs in Spain. */
export function RgpdLegalGlossaryRu({ compact = false }: { compact?: boolean }) {
  const items = compact ? RGPD_RU_GLOSSARY.filter(item =>
    ['controller','processor','rat','legal-basis','consent','eipd','privacy-policy','special'].includes(item.id)
  ) : RGPD_RU_GLOSSARY;
  return (
    <section id="slovar-rgpd" aria-labelledby="rgpd-ru-terms" className="border border-[#D4A017]/25 bg-white p-5 md:p-7">
      <h2 id="rgpd-ru-terms" className="font-serif text-2xl font-bold">Словарь: испанские юридические термины (glosario de términos jurídicos)</h2>
      <p className="mt-2 text-sm leading-6">
        В Испании в документах и при обращении в AEPD используются испанские термины.
        Рядом с русским объяснением мы приводим точное испанское название в скобках,
        чтобы вы могли найти нужный раздел и сопоставить понятия.
      </p>
      <dl className="mt-5 grid gap-3 sm:grid-cols-2">
        {items.map(item => (
          <div key={item.id} className="border-b border-[#D4A017]/15 pb-3">
            <dt className="font-semibold">{item.ru} <span lang="es" className="text-[#725A24]">({item.es})</span></dt>
            <dd className="mt-1 text-sm text-[#23364D]">{item.hint}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
