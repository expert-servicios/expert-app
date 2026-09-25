import type { Metadata } from 'next';
import Link from 'next/link';

const PAGE_URL = 'https://expertconsulting.es/ru/docs/podpisat-zayavlenie-grazhdanstvo-rebenka-roditeli';
const ES_URL = 'https://expertconsulting.es/docs/firmar-solicitud-nacionalidad-menor-progenitores';

export const metadata: Metadata = {
  title: 'Как подписать заявление на гражданство ребёнка | EXPERT',
  description:
    'Инструкция на русском: где должны подписываться родители в заявлении на гражданство Испании по резиденции и чем отличается законный представитель от добровольного представителя.',
  alternates: {
    canonical: PAGE_URL,
    languages: { 'es-ES': ES_URL, 'ru-RU': PAGE_URL, 'x-default': ES_URL }
  },
  robots: { index: false, follow: true },
  openGraph: {
    type: 'article',
    locale: 'ru_RU',
    title: 'Как подписать заявление на гражданство ребёнка | EXPERT',
    description:
      'Где ставят подписи родители и как исправить подпись, случайно поставленную в поле добровольного представителя.',
    url: PAGE_URL
  }
};

export default function Page() {
  return (
    <main className="bg-[#F8F6F1] text-[#0D1B2A]">
      <section className="bg-[#0D1B2A] px-6 py-14 text-[#F8F6F1]">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#D4A017]">EXPERT Docs</p>
          <h1 className="mt-3 font-serif text-3xl font-bold leading-tight md:text-5xl">
            Как подписать заявление на гражданство ребёнка
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[#D1D5DB]">
            Практическая инструкция, чтобы не перепутать поля «Representante legal» и «Representante voluntario» на странице подписей.
          </p>
          <div className="mt-6 text-sm text-[#D1D5DB]">
            <Link href={ES_URL} className="underline decoration-[#D4A017] underline-offset-4 hover:text-[#D4A017]">
              Versión en español
            </Link>
          </div>
        </div>
      </section>

      <article className="mx-auto max-w-4xl space-y-10 px-6 py-12">
        <section>
          <h2 className="font-serif text-2xl font-bold">Основное правило</h2>
          <p className="mt-4 leading-7 text-[#23364D]">
            Если заявитель младше 14 лет и оба родителя осуществляют родительские полномочия, стандартная форма заявления должна быть подписана обоими как <strong>законными представителями</strong>, кроме случаев, когда право действовать одному родителю подтверждено юридически.
          </p>
          <p className="mt-3 leading-7 text-[#23364D]">
            При электронной подаче само заявление в системе может подать один из представителей, но при наличии нескольких законных представителей к делу прилагается стандартная форма с необходимыми подписями всех представителей.
          </p>
        </section>

        <section className="border-l-4 border-[#D4A017] bg-white p-5">
          <h2 className="font-serif text-2xl font-bold">Где должен подписываться каждый</h2>
          <ul className="mt-4 list-disc space-y-3 pl-6 leading-7 text-[#23364D]">
            <li>
              <strong>Отец и мать / родители:</strong> в поле <strong>«Representante legal (si procede)»</strong>.
            </li>
            <li>
              <strong>«Representante voluntario (si procede)»:</strong> это не место для второй подписи родителя. Поле предназначено для представителя по доверенности или мандату, например уполномоченного специалиста.
            </li>
            <li>
              <strong>«Interesado»:</strong> ребёнок младше 14 лет обычно здесь не подписывается. Для несовершеннолетнего старше 14 лет правило другое: он подписывает заявление вместе со своими законными представителями.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-bold">Если оба родителя подписывают от руки</h2>
          <ol className="mt-4 list-decimal space-y-3 pl-6 leading-7 text-[#23364D]">
            <li>Распечатайте страницы формы, которые требуется подписать.</li>
            <li>Перед подписью проверьте имя, фамилии и остальные заполненные данные.</li>
            <li>В строке «Lugar y fecha» укажите фактическое место и дату подписи.</li>
            <li>Оба родителя ставят подписи внутри поля <strong>Representante legal</strong>.</li>
            <li>Не используйте поле <strong>Representante voluntario</strong> для подписи второго родителя.</li>
            <li>Отсканируйте документ в один читаемый PDF, без обрезанных краёв и подписей.</li>
            <li>Сохраните бумажный оригинал до завершения подачи и проверки дела.</li>
          </ol>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-bold">Если подпись поставили не в том поле</h2>
          <p className="mt-4 leading-7 text-[#23364D]">
            Не стоит зачеркивать, вырезать или переносить подпись в редакторе PDF. Надёжнее заново распечатать страницу с подписями и оформить её правильно.
          </p>
          <ol className="mt-4 list-decimal space-y-3 pl-6 leading-7 text-[#23364D]">
            <li>Оставьте остальные страницы формы без изменений.</li>
            <li>Если все данные верны, повторите только страницу с ошибкой.</li>
            <li>Поставьте обе подписи родителей в поле <strong>Representante legal</strong>.</li>
            <li>Оставьте поле <strong>Representante voluntario</strong> для уполномоченного представителя, если его подпись потребуется.</li>
            <li>Снова соберите все страницы в один PDF в исходном порядке.</li>
          </ol>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-bold">Электронная и смешанная подпись</h2>
          <p className="mt-4 leading-7 text-[#23364D]">
            При электронной подаче испанские правила допускают, что если один документ требует нескольких подписей, одна из них может быть электронной, а остальные — рукописными и отсканированными в этом же документе.
          </p>
          <p className="mt-3 leading-7 text-[#23364D]">
            Если оба подписывают электронным сертификатом, второй человек должен подписывать именно тот PDF, в котором уже находится первая подпись.
          </p>
          <p className="mt-3 leading-7 text-[#23364D]">
            Отдельная инструкция:{' '}
            <Link href="/ru/docs/podpisat-pdf-cifrovym-sertifikatom-autofirma" className="underline decoration-[#D4A017] underline-offset-4">
              как подписать PDF цифровым сертификатом через AutoFirma
            </Link>.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-bold">Когда подпись обоих родителей может не требоваться</h2>
          <p className="mt-4 leading-7 text-[#23364D]">
            Иной порядок возможен в неполной семье, при лишении или индивидуальном осуществлении родительских полномочий, документально подтверждённом отсутствии одного из родителей или наличии судебного решения. Основание необходимо подтвердить до подачи.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-bold">Официальные источники</h2>
          <ul className="mt-4 list-disc space-y-3 pl-6 leading-7 text-[#23364D]">
            <li>
              <a className="underline decoration-[#D4A017] underline-offset-4" href="https://sede.mjusticia.gob.es/es/tramites/nacionalidad-espanola">
                Ministerio de Justicia — Nacionalidad española por residencia
              </a>
            </li>
            <li>
              <a className="underline decoration-[#D4A017] underline-offset-4" href="https://www.boe.es/buscar/act.php?id=BOE-A-2016-9314#a4">
                Orden JUS/1625/2016 — artículo 4
              </a>
            </li>
            <li>
              <a className="underline decoration-[#D4A017] underline-offset-4" href="https://www.boe.es/buscar/act.php?id=BOE-A-2016-9314#a5">
                Orden JUS/1625/2016 — artículo 5
              </a>
            </li>
            <li>
              <a className="underline decoration-[#D4A017] underline-offset-4" href="https://www.mjusticia.gob.es/es/Ciudadano/TramitesGestiones/Documents/19-01-2022Solicitud%20de%20Nacionalidad%20por%20Residencia.pdf">
                Ministerio de Justicia — documentación adicional según los casos
              </a>
            </li>
          </ul>
          <p className="mt-4 text-sm leading-6 text-[#6B7280]">Источники проверены 25.09.2026.</p>
        </section>
      </article>
    </main>
  );
}
