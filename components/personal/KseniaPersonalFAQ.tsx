type Locale = 'es' | 'ru';

const questions = {
  es: [
    { q: '¿Para qué sirve la reunión inicial de 15 minutos?', a: 'Es una conversación breve y gratuita para conocer el motivo de contacto, valorar si podemos colaborar y acordar el siguiente paso. No sustituye un diagnóstico fiscal, laboral o jurídico.' },
    { q: '¿Ofreces mentoría para emprendedores?', a: 'Comparto experiencia en formación y mentoría mediante sesiones breves y programas de acompañamiento. El formato y la disponibilidad dependen del proyecto y de los programas en los que participe.' },
    { q: '¿Cómo puedo enviarte una propuesta de colaboración?', a: 'Puedes escribir a soy@kseniailicheva.com y explicar la idea, los objetivos y el tipo de colaboración. Cuando el formulario esté conectado de forma segura, también podrás utilizarlo desde esta página.' },
    { q: '¿Dónde solicito servicios fiscales, contables o laborales?', a: 'Esos servicios se gestionan en la plataforma EXPERT CONSULTING, separada de esta página personal. Puedes consultar allí el catálogo y las condiciones de cada servicio.' },
    { q: '¿En qué idiomas podemos comunicarnos?', a: 'Puedes comunicarte en español o en ruso. Esta web también ofrece una versión de sus páginas principales en ambos idiomas.' },
  ],
  ru: [
    { q: 'Для чего нужна первая встреча на 15 минут?', a: 'Это короткий бесплатный разговор, чтобы понять причину обращения, обсудить возможность сотрудничества и выбрать следующий шаг. Он не заменяет полноценную налоговую, трудовую или юридическую консультацию.' },
    { q: 'Проводите ли вы наставничество для предпринимателей?', a: 'Я делюсь практическим опытом через краткие встречи и программы наставничества. Формат и доступность зависят от проекта и программы.' },
    { q: 'Как отправить предложение о сотрудничестве?', a: 'Напишите на soy@kseniailicheva.com: расскажите об идее, целях и предлагаемом формате. После безопасного подключения формы её также можно будет использовать на сайте.' },
    { q: 'Где заказать налоговые, бухгалтерские и кадровые услуги?', a: 'Профессиональные услуги оформляются отдельно, через платформу EXPERT CONSULTING. Там опубликованы предложения и условия.' },
    { q: 'На каких языках можно общаться?', a: 'Со мной можно связаться на русском и испанском языках. Основные страницы этого сайта также доступны на обоих языках.' },
  ],
} satisfies Record<Locale, { q: string; a: string }[]>;

export function KseniaPersonalFAQ({ locale }: { locale: Locale }) {
  const ru = locale === 'ru';
  return (
    <section id="preguntas" aria-labelledby="ksenia-faq-heading" className="scroll-mt-20 bg-white px-6 py-16 md:px-10 md:py-20">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7B5929]">{ru ? 'Перед обращением' : 'Antes de contactar'}</p>
        <h2 id="ksenia-faq-heading" className="mt-3 font-serif text-3xl text-[#182A32] md:text-4xl">{ru ? 'Частые вопросы' : 'Preguntas frecuentes'}</h2>
        <div className="mt-8 divide-y divide-[#182A32]/15 border-y border-[#182A32]/15">
          {questions[locale].map(item => (
            <details key={item.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-[#182A32] focus-visible:outline-2 focus-visible:outline-offset-2">
                <span>{item.q}</span><span aria-hidden="true" className="text-xl text-[#946D34] group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#536167]">{item.a}</p>
            </details>
          ))}
        </div>
        <p className="mt-6 text-sm text-[#536167]">
          {ru ? 'Остались вопросы? ' : '¿Tienes otra pregunta? '}
          <a href="mailto:soy@kseniailicheva.com" className="font-semibold underline underline-offset-4">soy@kseniailicheva.com</a>
        </p>
      </div>
    </section>
  );
}
