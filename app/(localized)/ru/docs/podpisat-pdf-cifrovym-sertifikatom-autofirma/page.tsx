import type { Metadata } from 'next';
import Link from 'next/link';

const PAGE_URL = 'https://expertconsulting.es/ru/docs/podpisat-pdf-cifrovym-sertifikatom-autofirma';
const ES_URL = 'https://expertconsulting.es/docs/firmar-pdf-certificado-digital-autofirma';

export const metadata: Metadata = {
  title: 'Как подписать PDF цифровым сертификатом через AutoFirma | EXPERT',
  description: 'Пошаговая инструкция на русском языке: как подписать PDF личным цифровым сертификатом через AutoFirma и не повредить электронную подпись.',
  alternates: {
    canonical: PAGE_URL,
    languages: { 'es-ES': ES_URL, 'ru-RU': PAGE_URL, 'x-default': ES_URL }
  },
  robots: { index: false, follow: true },
  openGraph: {
    type: 'article',
    locale: 'ru_RU',
    title: 'Как подписать PDF цифровым сертификатом через AutoFirma | EXPERT',
    description: 'Пошаговая инструкция по электронной подписи PDF в AutoFirma.',
    url: PAGE_URL
  }
};

export default function Page() {
  return (
    <main className="bg-[#F8F6F1] text-[#0D1B2A]">
      <section className="bg-[#0D1B2A] px-6 py-14 text-[#F8F6F1]">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#D4A017]">EXPERT Docs</p>
          <h1 className="mt-3 font-serif text-3xl font-bold leading-tight md:text-5xl">Как подписать PDF цифровым сертификатом через AutoFirma</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[#D1D5DB]">
            Пошаговая инструкция для подписи PDF личным цифровым сертификатом в Испании и сохранения действительности электронной подписи.
          </p>
          <div className="mt-6 text-sm text-[#D1D5DB]">
            <Link href={ES_URL} className="underline decoration-[#D4A017] underline-offset-4 hover:text-[#D4A017]">Versión en español</Link>
          </div>
        </div>
      </section>

      <article className="mx-auto max-w-4xl space-y-10 px-6 py-12">
        <section>
          <h2 className="font-serif text-2xl font-bold">Что нужно до начала</h2>
          <ul className="mt-4 list-disc space-y-2 pl-6 leading-7 text-[#23364D]">
            <li>Нужен действующий личный цифровой сертификат, установленный или доступный на компьютере.</li>
            <li>Установите AutoFirma с официального портала электронной подписи Испании.</li>
            <li>Подписывайте только окончательную версию PDF: изменение документа после подписи может сделать подпись недействительной.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-bold">Как подписать PDF</h2>
          <ol className="mt-4 list-decimal space-y-3 pl-6 leading-7 text-[#23364D]">
            <li>Сохраните PDF на компьютере и проверьте его содержание.</li>
            <li>Откройте <strong>AutoFirma</strong>.</li>
            <li>Выберите подпись файла и укажите нужный PDF.</li>
            <li>Когда появится список сертификатов, выберите свой личный сертификат.</li>
            <li>Подтвердите подпись. Если требуется пароль или PIN сертификата, введите его.</li>
            <li>Сохраните новый подписанный PDF.</li>
            <li>Отправляйте именно этот подписанный файл, а не распечатку и не фотографию.</li>
          </ol>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-bold">Если должны подписать два человека</h2>
          <p className="mt-4 leading-7 text-[#23364D]">
            Второй подписант должен подписывать <strong>тот же PDF, в котором уже находится первая электронная подпись</strong>.
          </p>
          <ol className="mt-4 list-decimal space-y-3 pl-6 leading-7 text-[#23364D]">
            <li>Первый человек подписывает PDF и сохраняет полученный файл.</li>
            <li>Этот подписанный файл передаётся второму человеку.</li>
            <li>Второй человек открывает AutoFirma и подписывает именно этот файл.</li>
            <li>Сохраняется и отправляется итоговый PDF с обеими подписями.</li>
          </ol>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-bold">Что нельзя делать после электронной подписи</h2>
          <ul className="mt-4 list-disc space-y-2 pl-6 leading-7 text-[#23364D]">
            <li>Не редактируйте содержимое PDF.</li>
            <li>Не конвертируйте его в Word и обратно.</li>
            <li>Не используйте сервисы сжатия, которые пересоздают PDF.</li>
            <li>Не печатайте и не сканируйте файл заново, если нужно сохранить электронную подпись.</li>
            <li>Не вставляйте изображение подписи вместо подписи сертификатом.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-bold">Как проверить подпись</h2>
          <p className="mt-4 leading-7 text-[#23364D]">
            Откройте PDF в программе, которая умеет проверять электронные подписи, например Adobe Acrobat Reader. Убедитесь, что подпись отображается и программа не сообщает об изменении документа после подписания.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-bold">Официальные источники</h2>
          <ul className="mt-4 list-disc space-y-2 pl-6 leading-7 text-[#23364D]">
            <li><a className="underline decoration-[#D4A017] underline-offset-4" href="https://firmaelectronica.gob.es/Home/Descargas.html">Официальная страница загрузки AutoFirma</a></li>
            <li><a className="underline decoration-[#D4A017] underline-offset-4" href="https://firmaelectronica.gob.es/">Официальный портал электронной подписи Испании</a></li>
          </ul>
        </section>

        <section className="border-l-4 border-[#D4A017] bg-white p-5">
          <p className="font-semibold">Важно</p>
          <p className="mt-2 leading-7 text-[#23364D]">
            Интерфейс может немного отличаться в зависимости от операционной системы и версии AutoFirma. Если документ должны подписать несколько человек, для следующей подписи всегда используется последняя подписанная версия файла.
          </p>
        </section>
      </article>
    </main>
  );
}
