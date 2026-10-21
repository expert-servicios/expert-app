import Link from 'next/link';

const notes = {
  es: [
    {
      id: 'decisiones',
      label: 'Emprendimiento',
      title: 'Antes de decidir, identificar el problema',
      text: 'Cuando una empresa empieza, aparecen decenas de tareas: elegir herramientas, fijar precios, organizar documentos y planificar obligaciones. La primera decisión útil suele ser más sencilla: definir qué problema queremos resolver, para quién y con qué recursos. Separar las hipótesis de los hechos ayuda a invertir tiempo y dinero con mayor criterio. Es una forma de trabajar que también aplico a las sesiones de mentoría.',
    },
    {
      id: 'mentoria',
      label: 'Mentoría',
      title: 'Una buena sesión termina con un siguiente paso',
      text: 'En mentoría no se trata de recibir muchas respuestas en poco tiempo. Prefiero terminar una conversación con una prioridad clara, una hipótesis que podamos comprobar y una acción concreta. Documentar lo acordado permite contrastar después qué cambió. Por eso distingo una primera charla de quince minutos de un acompañamiento con objetivos y seguimiento.',
    },
    {
      id: 'tecnologia',
      label: 'Tecnología y gestión',
      title: 'Automatizar sin perder la responsabilidad',
      text: 'La tecnología puede simplificar tareas repetitivas, ordenar información y facilitar el acceso al conocimiento. Pero una herramienta no debería sustituir la comprobación de datos ni la responsabilidad sobre una decisión importante. En EXPERT exploramos estas posibilidades con supervisión humana, poniendo la claridad y la utilidad por delante de automatizar por automatizar.',
    },
  ],
  ru: [
    {
      id: 'decisiones',
      label: 'Предпринимательство',
      title: 'Прежде чем принимать решение, определите задачу',
      text: 'При запуске бизнеса одновременно появляются десятки вопросов: цены, документы, программы и обязательства. Полезно сначала понять, какую задачу вы решаете, для кого и какими средствами. Отделяя проверенные факты от предположений, легче выбирать приоритеты. Этот подход я использую и в работе с предпринимателями.',
    },
    {
      id: 'mentoria',
      label: 'Наставничество',
      title: 'Хорошая встреча заканчивается конкретным шагом',
      text: 'Наставничество — это не попытка получить как можно больше советов за короткое время. Важно выделить главную задачу, выбрать гипотезу для проверки и договориться о следующем действии. Записывая решения, мы можем позднее оценить результат. Именно поэтому первая пятнадцатиминутная беседа отличается от длительной программы сопровождения.',
    },
    {
      id: 'tecnologia',
      label: 'Технологии и управление',
      title: 'Автоматизация не отменяет ответственность',
      text: 'Цифровые инструменты помогают упорядочить информацию, сократить повторяющуюся работу и сделать знания доступнее. Однако важные решения требуют проверки исходных данных и профессиональной ответственности. В проекте EXPERT мы рассматриваем автоматизацию как помощника человеку, а не как замену его суждений.',
    },
  ],
};

export function KseniaPersonalEditorialNotes({ locale }: { locale: 'es' | 'ru' }) {
  const ru = locale === 'ru';
  return (
    <section id="lecturas" aria-label={ru ? 'Идеи и заметки' : 'Ideas y lecturas'} className="scroll-mt-20 bg-[#F7F4EE] px-6 py-16 md:px-10 md:py-20">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7B5929]">{ru ? 'Личные заметки' : 'Apuntes personales'}</p>
        <h2 className="mt-3 font-serif text-3xl text-[#182A32] md:text-4xl">{ru ? 'Идеи, которыми я делюсь' : 'Ideas sobre las que me gusta reflexionar'}</h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-[#536167]">
          {ru ? 'Короткие размышления о предпринимательстве, наставничестве и ответственном применении технологий.' : 'Lecturas breves sobre emprendimiento, mentoría y aplicación responsable de la tecnología. No sustituyen el asesoramiento profesional.'}
        </p>
        <div className="mt-9 grid gap-5 lg:grid-cols-3">
          {notes[locale].map(note => (
            <article id={note.id} key={note.id} className="scroll-mt-24 border border-[#CBB68F]/60 bg-white p-6 md:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#7B5929]">{note.label}</p>
              <h3 className="mt-4 font-serif text-2xl leading-snug text-[#182A32]">{note.title}</h3>
              <p className="mt-4 text-sm leading-7 text-[#536167]">{note.text}</p>
            </article>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link href={ru ? '/ru/mentorias' : '/mentorias'} data-personal-cta="mentoring" data-personal-placement="editorial" className="inline-flex min-h-11 items-center border-b-2 border-[#A57931] text-sm font-semibold text-[#182A32] hover:text-[#946D34]">
            {ru ? 'О моём наставничестве →' : 'Conocer mi actividad como mentora →'}
          </Link>
          <a href="https://expertconsulting.es" target="_blank" rel="noopener noreferrer" data-personal-cta="expert" data-personal-placement="editorial" className="inline-flex min-h-11 items-center border-b-2 border-[#A57931] text-sm font-semibold text-[#182A32] hover:text-[#946D34]">
            {ru ? 'Узнать о проекте EXPERT →' : 'Descubrir EXPERT →'}
          </a>
        </div>
      </div>
    </section>
  );
}
