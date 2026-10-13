import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Anchor, ArrowRight, Award, Briefcase, Calculator, Clock, FileCheck, FileText, Globe2, GraduationCap, Home, MonitorCheck, ShieldCheck } from 'lucide-react';
import { academyPrograms } from '@/lib/data/academy-catalog';
import { getCalAcademyUrl } from '@/lib/utils/cal';
import { CalButton } from '@/components/site/CalButton';
import { localizePublicShellHref } from '@/lib/i18n/public-shell-copy';

type HomeLocale = 'es' | 'ru';
type IconItem = { Icon: LucideIcon };

const serviceAreas: Array<
  IconItem & {
    title: string;
    text: string;
    href: string;
    items: string[];
  }
> = [
  {
    title: 'Fiscalidad',
    text: 'Declaraciones fiscales para residentes, no residentes y contribuyentes con patrimonio o rentas internacionales.',
    href: '/servicios/declaraciones-impuestos',
    items: ['IRPF', 'Modelo 151', 'Modelo 720'],
    Icon: FileText
  },
  {
    title: 'Extranjería y nacionalidad',
    text: 'Acompañamiento documental y fiscal para residir o establecerse en España.',
    href: '/servicios/extranjeria-nacionalidad',
    items: ['Nacionalidad', 'Residencias', 'Renovaciones'],
    Icon: Globe2
  },
  {
    title: 'Empresas y autónomos',
    text: 'Alta de actividad, constitución de sociedades, gestión mensual con Holded y trámites mercantiles.',
    href: '/servicios/empresas-autonomos',
    items: ['Alta autónomos', 'Sociedades', 'Planes mensuales'],
    Icon: Briefcase
  },
  {
    title: 'Holded',
    text: 'Implantación, migración y formación práctica para trabajar con datos ordenados y procesos claros.',
    href: '/holded',
    items: ['Pack Starter', 'Migración', 'Formación Holded'],
    Icon: MonitorCheck
  },
  {
    title: 'Certificado digital',
    text: 'Certificados digitales para personas físicas, entidades mercantiles y entidades sin ánimo de lucro.',
    href: '/servicios/certificado-digital',
    items: ['Persona física', 'Entidad mercantil', 'Sin ánimo de lucro'],
    Icon: FileCheck
  },
  {
    title: 'Tráfico y marítima',
    text: 'Gestiones administrativas de vehículos, embarcaciones y documentación.',
    href: '/servicios/trafico-capitania-maritima',
    items: ['Transferencias', 'Matriculaciones', 'Náutica'],
    Icon: Anchor
  },
  {
    title: 'Notaría y propiedades',
    text: 'Soporte documental en compraventas, escrituras y operaciones patrimoniales.',
    href: '/servicios/notaria-propiedades',
    items: ['Compraventas', 'Escrituras', 'Propiedades'],
    Icon: Home
  },
];

const featuredServices: Array<IconItem & { title: string; text: string; href: string }> = [
  {
    title: 'Declaración de la Renta',
    text: 'Revisión fiscal, preparación documental y presentación del IRPF con criterio profesional.',
    href: '/servicios/declaraciones-impuestos',
    Icon: Calculator
  },
  {
    title: 'Modelo 151',
    text: 'Tributación para profesionales, trabajadores e inversores desplazados a España.',
    href: '/servicios/declaraciones-impuestos',
    Icon: FileCheck
  },
  {
    title: 'Nacionalidad española',
    text: 'Preparación y seguimiento del expediente con control de requisitos y documentación.',
    href: '/servicios/extranjeria-nacionalidad',
    Icon: ShieldCheck
  }
];


const RU_HOME_COPY: Record<string, string> = {
  "Servicios": "Услуги",
  "Una asesoría para resolver, no para complicar.": "Помогаем решать задачи, а не усложнять их.",
  "Fiscalidad, legal, extranjería y gestión administrativa en una experiencia digital, ordenada y cercana.": "Налоговые, юридические, миграционные и административные услуги в удобном цифровом формате.",
  "Ver todos los servicios": "Все услуги",
  "Consultar área": "Узнать об услугах",
  "Explora el catálogo completo, organizado por categoría.": "Откройте полный каталог услуг по категориям.",
  "Explorar": "Подробнее",
  "Fiscalidad": "Налоги",
  "Declaraciones fiscales para residentes, no residentes y contribuyentes con patrimonio o rentas internacionales.": "Налоговые декларации для резидентов, нерезидентов и владельцев активов или доходов за рубежом.",
  "Extranjería y nacionalidad": "Миграционные вопросы и гражданство",
  "Acompañamiento documental y fiscal para residir o establecerse en España.": "Подготовка документов и налоговое сопровождение при переезде или проживании в Испании.",
  "Empresas y autónomos": "Компании и autónomos",
  "Alta de actividad, constitución de sociedades, gestión mensual con Holded y trámites mercantiles.": "Регистрация деятельности и компаний, работа с Holded и корпоративные процедуры.",
  "Implantación, migración y formación práctica para trabajar con datos ordenados y procesos claros.": "Внедрение, перенос данных и обучение работе в Holded с понятными процессами.",
  "Certificado digital": "Цифровой сертификат",
  "Certificados digitales para personas físicas, entidades mercantiles y entidades sin ánimo de lucro.": "Цифровые сертификаты для физических лиц, компаний и некоммерческих организаций.",
  "Tráfico y marítima": "Транспорт и морская администрация",
  "Gestiones administrativas de vehículos, embarcaciones y documentación.": "Административные процедуры для автомобилей, судов и документов.",
  "Notaría y propiedades": "Notaría и недвижимость",
  "Soporte documental en compraventas, escrituras y operaciones patrimoniales.": "Документальное сопровождение сделок купли-продажи, нотариальных актов и операций с имуществом.",
  "IRPF": "IRPF",
  "Modelo 151": "Modelo 151",
  "Modelo 720": "Modelo 720",
  "Nacionalidad": "Гражданство",
  "Residencias": "Вид на жительство",
  "Renovaciones": "Продление разрешений",
  "Alta autónomos": "Регистрация autónomo",
  "Sociedades": "Компании",
  "Planes mensuales": "Ежемесячные планы",
  "Pack Starter": "Pack Starter",
  "Migración": "Перенос данных",
  "Formación Holded": "Обучение Holded",
  "Persona física": "Физическое лицо",
  "Entidad mercantil": "Компания",
  "Sin ánimo de lucro": "Некоммерческая организация",
  "Transferencias": "Переоформление",
  "Matriculaciones": "Регистрация транспорта",
  "Náutica": "Водный транспорт",
  "Compraventas": "Купля-продажа",
  "Escrituras": "Нотариальные акты",
  "Propiedades": "Недвижимость",
  "Servicios destacados": "Популярные услуги",
  "Los trámites más solicitados, listos para empezar online.": "Популярные процедуры, которые можно начать онлайн.",
  "Cada servicio se orienta a un resultado concreto: documentación revisada, trámite presentado y seguimiento claro.": "Каждая услуга ориентирована на конкретный результат: проверку документов, подачу заявления и понятный статус.",
  "Declaración de la Renta": "Декларация о доходах (IRPF)",
  "Revisión fiscal, preparación documental y presentación del IRPF con criterio profesional.": "Налоговая проверка, подготовка документов и подача декларации IRPF.",
  "Tributación para profesionales, trabajadores e inversores desplazados a España.": "Налоговый режим для специалистов, работников и инвесторов, переехавших в Испанию.",
  "Nacionalidad española": "Гражданство Испании",
  "Preparación y seguimiento del expediente con control de requisitos y documentación.": "Подготовка и сопровождение expediente с проверкой требований и документов.",
  "Empezar": "Начать",
  "Formación": "Обучение",
  "Que tu equipo entienda los números, no solo los introduzca.": "Пусть ваша команда понимает цифры, а не просто вводит их.",
  "Programas prácticos de EXPERT Business Academy para trabajar la gestión empresarial y laboral con criterio, no a ciegas.": "Практические программы EXPERT Business Academy по управлению компанией и кадровой работе.",
  "Ver todos los programas": "Все программы",
  "Programa Superior de Dirección, Administración y Gestión Empresarial": "Продвинутая программа по руководству, администрированию и управлению компанией",
  "Formación práctica en gestión integral de empresas, impartida en español o ruso": "Практическое обучение управлению компанией на испанском или русском языке",
  "Programa personalizado de Gestión Laboral Integral": "Индивидуальная программа по кадровому администрированию",
  "De la normativa a la ejecución autónoma": "От изучения норм к самостоятельной работе",
  "prácticas": "практики",
  "tutoría": "тьюторских занятий",
  "Ver programa": "Подробнее о программе",
  "Reservar entrevista de admisión": "Записаться на вступительную консультацию"
};

function tx(locale: HomeLocale, text: string): string {
  return locale === 'ru' ? RU_HOME_COPY[text] ?? text : text;
}

export function SharedHomeServices({ locale = 'es' }: { locale?: HomeLocale }) {
  return (
    <section className="px-6 py-16 md:py-20">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
        <div>
          <SectionTitle
            eyebrow={tx(locale, 'Servicios')}
            title={tx(locale, 'Una asesoría para resolver, no para complicar.')}
            text={tx(locale, 'Fiscalidad, legal, extranjería y gestión administrativa en una experiencia digital, ordenada y cercana.')}
          />
          <Link
            href={localizePublicShellHref(locale, "/servicios")}
            className="mt-7 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-[#D4A017] transition hover:text-[#F2C14E]"
          >
            {tx(locale, 'Ver todos los servicios')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {serviceAreas.map(({ Icon, title, text, href, items }) => (
            <Link
              href={localizePublicShellHref(locale, href)}
              key={tx(locale, title)}
              className="group border border-[#D4A017]/25 bg-[#F8F6F1] p-6 shadow-[0_10px_28px_rgba(13,27,42,0.07)] transition hover:-translate-y-0.5 hover:border-[#D4A017] hover:shadow-[0_18px_40px_rgba(13,27,42,0.11)]"
            >
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center border border-[#D4A017]/25 bg-[#0D1B2A] text-[#D4A017]">
                  <Icon className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="font-serif text-xl font-bold leading-tight text-[#0D1B2A]">{tx(locale, title)}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#23364D]">{tx(locale, text)}</p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {items.map((item) => (
                  <span key={tx(locale, item)} className="border border-[#D4A017]/25 px-2.5 py-1 text-xs font-semibold text-[#23364D]">
                    {tx(locale, item)}
                  </span>
                ))}
              </div>
              <p className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#D4A017]">
                {tx(locale, 'Consultar área')}
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </p>
            </Link>
          ))}

          <Link
            href={localizePublicShellHref(locale, "/servicios")}
            className="group flex flex-col justify-center border border-[#D4A017]/40 bg-[#0D1B2A] p-6 text-[#F8F6F1] transition hover:-translate-y-0.5 hover:border-[#D4A017]"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center border border-[#D4A017]/40 bg-[#D4A017]/10 text-[#D4A017]">
              <ArrowRight className="h-6 w-6" />
            </span>
            <h3 className="mt-5 font-serif text-xl font-bold leading-tight">{tx(locale, 'Ver todos los servicios')}</h3>
            <p className="mt-2 text-sm leading-6 text-[#9CA3AF]">{tx(locale, 'Explora el catálogo completo, organizado por categoría.')}</p>
            <p className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#D4A017]">
              {tx(locale, 'Explorar')}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </p>
          </Link>
        </div>
      </div>
    </section>
  );
}


export function SharedHomeFeaturedServices({ locale = 'es' }: { locale?: HomeLocale }) {
  return (
    <section className="px-6 py-16 md:py-20">
      <div className="mx-auto max-w-7xl">
        <SectionTitle
          eyebrow={tx(locale, 'Servicios destacados')}
          title={tx(locale, 'Los trámites más solicitados, listos para empezar online.')}
          text={tx(locale, 'Cada servicio se orienta a un resultado concreto: documentación revisada, trámite presentado y seguimiento claro.')}
        />

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {featuredServices.map(({ Icon, title, text, href }) => (
            <Link
              href={localizePublicShellHref(locale, href)}
              key={tx(locale, title)}
              className="group border border-[#D4A017]/25 bg-[#F8F6F1] p-7 shadow-[0_10px_28px_rgba(13,27,42,0.07)] transition hover:-translate-y-0.5 hover:border-[#D4A017] hover:shadow-[0_18px_40px_rgba(13,27,42,0.11)]"
            >
              <Icon className="h-9 w-9 stroke-[#D4A017]" strokeWidth={1.7} />
              <h3 className="mt-6 font-serif text-2xl font-bold text-[#0D1B2A]">{tx(locale, title)}</h3>
              <p className="mt-4 min-h-24 text-sm leading-7 text-[#23364D]">{tx(locale, text)}</p>
              <p className="mt-5 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-[#D4A017]">
                {tx(locale, 'Empezar')}
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}


export function SharedHomeAcademy({ locale = 'es' }: { locale?: HomeLocale }) {
  const calAcademyUrl = getCalAcademyUrl();

  return (
    <section className="px-6 py-16 md:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <SectionTitle
            eyebrow={tx(locale, 'Formación')}
            title={tx(locale, 'Que tu equipo entienda los números, no solo los introduzca.')}
            text={tx(locale, 'Programas prácticos de EXPERT Business Academy para trabajar la gestión empresarial y laboral con criterio, no a ciegas.')}
          />
          <Link
            href={localizePublicShellHref(locale, "/academy")}
            className="inline-flex shrink-0 items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-[#D4A017] transition hover:text-[#F2C14E]"
          >
            Ver todos los programas
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {academyPrograms.map((program) => (
            <Link
              href={localizePublicShellHref(locale, program.slug === academyPrograms[0].slug ? '/academy' : `/academy/${program.slug}`)}
              key={program.slug}
              className="group border border-[#D4A017]/25 bg-[#F8F6F1] p-7 shadow-[0_10px_28px_rgba(13,27,42,0.07)] transition hover:-translate-y-0.5 hover:border-[#D4A017] hover:shadow-[0_18px_40px_rgba(13,27,42,0.11)]"
            >
              <span className="flex h-11 w-11 items-center justify-center border border-[#D4A017]/25 bg-[#0D1B2A] text-[#D4A017]">
                <GraduationCap className="h-5 w-5" />
              </span>
              <h3 className="mt-5 font-serif text-xl font-bold leading-tight text-[#0D1B2A]">{tx(locale, program.name)}</h3>
              <p className="mt-2 text-sm leading-6 text-[#23364D]">{tx(locale, program.tagline)}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 border border-[#D4A017]/25 px-2.5 py-1 text-xs font-semibold text-[#23364D]">
                  <Clock className="h-3.5 w-3.5 text-[#D4A017]" />
                  {program.hoursTraining}h + {program.hoursInternship || program.hoursTutoring || 0}h {tx(locale, program.hoursInternship ? 'prácticas' : 'tutoría')}
                </span>
                <span className="inline-flex items-center gap-1.5 border border-[#D4A017]/25 px-2.5 py-1 text-xs font-semibold text-[#23364D]">
                  <Award className="h-3.5 w-3.5 text-[#D4A017]" />
                  {program.price}
                </span>
              </div>
              <p className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#D4A017]">
                {tx(locale, 'Ver programa')}
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-8">
          <CalButton
            url={calAcademyUrl}
            fallbackHref={localizePublicShellHref(locale, "/cita?tipo=academy-admision")}
            className="inline-flex min-h-12 items-center justify-center gap-2 border border-[#D4A017]/60 px-6 py-3 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#D4A017]/10"
          >
            {tx(locale, 'Reservar entrevista de admisión')}
          </CalButton>
        </div>
      </div>
    </section>
  );
}


function SectionTitle({
  eyebrow,
  title,
  text,
  dark = false,
  centered = false
}: {
  eyebrow: string;
  title: string;
  text: string;
  dark?: boolean;
  centered?: boolean;
}) {
  return (
    <div className={centered ? 'mx-auto max-w-3xl text-center' : 'max-w-2xl'}>
      <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#D4A017]">{eyebrow}</p>
      <h2 className={`mt-4 font-serif text-3xl font-bold leading-tight md:text-4xl ${dark ? 'text-[#F8F6F1]' : 'text-[#0D1B2A]'}`}>
        {title}
      </h2>
      <p className={`mt-4 text-sm leading-7 md:text-base ${dark ? 'text-[#9CA3AF]' : 'text-[#23364D]'}`}>{text}</p>
    </div>
  );
}