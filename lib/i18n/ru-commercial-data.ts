import { academyPrograms } from '@/lib/data/academy-catalog';
import { MONTHLY_PLANS_KNOWLEDGE } from '@/lib/data/kia-knowledge/monthly-plans';
import { holdedPackStarterKnowledge } from '@/lib/data/kia-knowledge/holded-pack-starter';
import { holdedMigracionSinInventarioKnowledge } from '@/lib/data/kia-knowledge/holded-migracion-sin-inventario';
import { holdedMigracionConInventarioKnowledge } from '@/lib/data/kia-knowledge/holded-migracion-con-inventario';
import { services } from '@/lib/utils/catalog';
import type { PublicRouteKey } from '@/lib/i18n/public-routes';

export interface RuCommercialOffer {
  title: string;
  description: string;
  price?: string;
  href: string;
  badge?: string;
}

export interface RuCommercialSection {
  title: string;
  text: string;
  items?: string[];
}

export interface RuCommercialPageData {
  offerTitle?: string;
  offerIntro?: string;
  offers?: RuCommercialOffer[];
  sections?: RuCommercialSection[];
  notice?: {
    title: string;
    text: string;
  };
}

function service(slug: string) {
  return services.find((item) => item.slug === slug);
}

const autonomo = service('alta-autonomo');
const sl = service('constitucion-sl');
const irpf = service('irpf');
const irnr = service('no-residentes');
const modelo720 = service('modelo-720');
const academy = academyPrograms.find((program) => program.slug === 'direccion-administracion-gestion-empresarial');

const holdedOffers: RuCommercialOffer[] = [
  {
    title: 'Pack Starter / Onboarding',
    description: 'Настройка новой или существующей учётной записи Holded: данные компании, налоги, счета, банки и базовая структура.',
    price: holdedPackStarterKnowledge.price,
    href: holdedPackStarterKnowledge.publicPath,
    badge: 'Старт с Holded',
  },
  {
    title: 'Миграция без складского учёта',
    description: 'Перенос клиентов, поставщиков и истории счетов в Holded без товаров, остатков и складов.',
    price: holdedMigracionSinInventarioKnowledge.price,
    href: holdedMigracionSinInventarioKnowledge.publicPath,
    badge: 'Смена системы',
  },
  {
    title: 'Миграция со складским учётом',
    description: 'Перенос данных с товарами, вариантами, остатками и складами для бизнеса с полноценным inventory.',
    price: holdedMigracionConInventarioKnowledge.price,
    href: holdedMigracionConInventarioKnowledge.publicPath,
    badge: 'Inventory / e-commerce',
  },
];

const planOffers: RuCommercialOffer[] = [
  {
    title: 'Plan Supervisión',
    description: 'Вы ведёте Holded самостоятельно; EXPERT и Kia помогают контролировать базовые ошибки, состояние и ежемесячную организацию.',
    price: MONTHLY_PLANS_KNOWLEDGE.supervision.price,
    href: '/planes/supervision',
  },
  {
    title: 'Plan Avanzado',
    description: 'Ежемесячная проверка Holded, налоговые предупреждения, квартальное закрытие и базовые налоги в рамках тарифа.',
    price: MONTHLY_PLANS_KNOWLEDGE.avanzado.price,
    href: '/planes/avanzado',
    badge: 'Для большинства autónomos и небольших компаний',
  },
  {
    title: 'Plan Colaborativo',
    description: 'Больше участия EXPERT: ежемесячная проверка и валидация, отчёты, предупреждения и приоритетная поддержка.',
    price: MONTHLY_PLANS_KNOWLEDGE.colaborativo.price,
    href: '/planes/colaborativo',
  },
  {
    title: 'Plan Personalizado',
    description: 'Для payroll, нескольких компаний, большого объёма, e-commerce, inventory и международных операций.',
    price: MONTHLY_PLANS_KNOWLEDGE.personalizado.price,
    href: '/planes/presupuesto-personalizado',
  },
];

const taxOffers: RuCommercialOffer[] = [
  ...(irpf ? [{
    title: 'IRPF — Declaración de la Renta',
    description: 'Подготовка и подача годовой декларации с профессиональной проверкой данных и применимых вычетов.',
    price: irpf.price,
    href: `/servicios/${irpf.categoria}/${irpf.slug}`,
  }] : []),
  ...(irnr ? [{
    title: 'IRNR — No Residentes',
    description: 'Декларации для нерезидентов с недвижимостью или доходами из источников в Испании.',
    price: irnr.price,
    href: `/servicios/${irnr.categoria}/${irnr.slug}`,
  }] : []),
  ...(modelo720 ? [{
    title: 'Modelo 720',
    description: 'Анализ обязанности и подготовка информационной декларации об определённых активах и правах за пределами Испании.',
    price: modelo720.price,
    href: `/servicios/${modelo720.categoria}/${modelo720.slug}`,
  }] : []),
];

export const RU_COMMERCIAL_DATA: Partial<Record<PublicRouteKey, RuCommercialPageData>> = {
  home: {
    sections: [
      {
        title: 'Не просто gestoría',
        text: 'EXPERT строит рабочую систему: Holded хранит и организует данные, Kia помогает контролировать процессы, а специалист EXPERT проверяет профессиональные решения и обязательства.',
        items: [
          'Один рабочий контур вместо Excel, email и разрозненных сообщений.',
          'Объяснения на русском с сохранением официальных испанских терминов.',
          'Переход от полной зависимости от gestoría к осознанному контролю бизнеса.',
        ],
      },
      {
        title: 'Для кого',
        text: 'Подход рассчитан на русскоязычных предпринимателей в Испании независимо от гражданства или страны происхождения.',
        items: [
          'Новый autónomo или будущая SL.',
          'Действующий бизнес, который хочет перейти на Holded.',
          'Компания с сотрудниками, e-commerce, inventory или международными операциями.',
        ],
      },
    ],
  },
  holded: {
    offerTitle: 'Варианты внедрения Holded',
    offerIntro: 'Цены и состав услуг берутся из единого каталога EXPERT: русская версия не создаёт отдельные продукты или тарифы.',
    offers: holdedOffers,
    sections: [
      {
        title: 'Что мы делаем',
        text: 'Мы не продаём только лицензию. Сначала определяем состояние данных и процессов, затем настраиваем или мигрируем Holded и обучаем владельца или команду.',
        items: [
          'Настройка счетов, налогов, банков и структуры данных.',
          'Миграция из Excel, другой программы или старого учёта.',
          'Обучение работе с продажами, расходами, банками и отчётами.',
        ],
      },
      {
        title: 'После внедрения',
        text: 'При необходимости Holded подключается к ежемесячному плану EXPERT. Тогда вы продолжаете работать в системе, а Kia и специалист EXPERT помогают контролировать качество данных, сроки и налоговые процессы.',
      },
    ],
  },
  plans: {
    offerTitle: 'Ежемесячные планы EXPERT',
    offerIntro: 'Во всех планах используется тот же каталог, что и в испанской версии. Holded обязателен; лицензия Holded оплачивается отдельно.',
    offers: planOffers,
    sections: [
      {
        title: 'Принцип цены EXPERT',
        text: 'Чем лучше организован ваш бизнес и чем больше ежедневных операций вы ведёте самостоятельно, тем меньше рутинной работы приходится делегировать asesoría.',
      },
      {
        title: 'Единая рабочая система',
        text: 'Во всех ежемесячных планах используются Plataforma EXPERT и Kia. Holded организует бухгалтерские данные; EXPERT и Kia организуют контроль и сопровождение.',
      },
    ],
  },
  services: {
    offerTitle: 'Популярные направления',
    offers: [...taxOffers],
    sections: [
      {
        title: 'Бизнес и autónomo',
        text: 'Регистрация деятельности, создание SL, сертификаты, налоговые декларации, административные процедуры и последующее сопровождение.',
      },
      {
        title: 'Как выбрать услугу',
        text: 'Если задача понятна, можно перейти к конкретной услуге. Если ситуация сложная или затрагивает несколько налоговых/правовых вопросов, правильнее начать с профессиональной консультации.',
      },
    ],
  },
  academy: {
    offerTitle: 'Основная программа',
    offers: academy ? [{
      title: academy.name,
      description: `${academy.hoursTraining} часов обучения + ${academy.hoursInternship} часов практики. Онлайн, на испанском или русском языке.`,
      price: academy.price,
      href: '/academy',
      badge: academy.priceNote,
    }] : [],
    sections: [
      {
        title: 'Практическая бизнес-подготовка',
        text: 'EXPERT Business Academy — частное нерегулируемое обучение. Цель — дать предпринимателю рабочее понимание управления компанией, налогов, бухгалтерии, труда, цифровых инструментов и процессов в Испании.',
      },
      {
        title: 'Связь с реальной работой',
        text: 'Обучение связано с реальными процессами EXPERT и Holded: документы, расчёты, контроль, организация компании и принятие решений.',
      },
    ],
    notice: {
      title: 'Статус обучения',
      text: 'EXPERT Business Academy предлагает частное обучение. Мы не представляем программу как официальный государственный диплом или регулируемое образование.',
    },
  },
  autonomo: {
    offerTitle: 'Стартовая услуга',
    offers: autonomo ? [{
      title: autonomo.name,
      description: 'Регистрация в Agencia Tributaria и RETA с базовой настройкой обязательств и объяснением дальнейших шагов.',
      price: autonomo.price,
      href: `/servicios/${autonomo.categoria}/${autonomo.slug}`,
    }] : [],
    sections: [
      {
        title: 'После регистрации',
        text: 'Регистрация — только начало. Важно сразу организовать счета, расходы, банковские операции и налоговый календарь. Для этого можно подключить Holded и подходящий ежемесячный план EXPERT.',
      },
    ],
  },
  sl: {
    offerTitle: 'Создание Sociedad Limitada',
    offers: sl ? [{
      title: sl.name,
      description: 'Сопровождение создания SL с подготовкой ключевых этапов и последующей организацией работы компании.',
      price: sl.price,
      href: `/servicios/${sl.categoria}/${sl.slug}`,
    }] : [],
    sections: [
      {
        title: 'Компания должна быть управляемой с первого дня',
        text: 'После регистрации SL мы рекомендуем сразу выстроить фактурирование, банки, документы, роли и налоговый контроль в Holded, а не переносить хаос в новую компанию.',
      },
    ],
  },
  taxes: {
    offerTitle: 'Частые налоговые услуги',
    offerIntro: 'Официальные названия моделей и налогов сохраняются на испанском; объяснение и сопровождение можно получить на русском.',
    offers: taxOffers,
    sections: [
      {
        title: 'Не все налоговые ситуации одинаковы',
        text: 'Резидентность, международные доходы, недвижимость, специальные режимы и структура бизнеса могут менять расчёт и набор обязательств. В сложных случаях EXPERT начинает с анализа документов и фактов.',
      },
    ],
  },
  verifactu: {
    sections: [
      {
        title: 'Что меняется',
        text: 'Речь идёт о требованиях к Sistemas Informáticos de Facturación (SIF). VERI*FACTU — одна из предусмотренных законом моделей работы системы, а не отдельный обязательный тариф или программа EXPERT.',
        items: [
          'Для налогоплательщиков Impuesto sobre Sociedades системы должны быть адаптированы до 1 января 2027 года.',
          'Для остальных затронутых компаний и autónomos, использующих SIF, — до 1 июля 2027 года.',
          'EXPERT помогает проверить текущий процесс, выбрать рабочую схему и подготовить Holded и внутренние процедуры.',
        ],
      },
      {
        title: 'Почему готовиться заранее',
        text: 'Переход затрагивает не только программу: нужно проверить серии счетов, данные компании, процессы исправлений, роли сотрудников и качество исходных данных.',
      },
    ],
    notice: {
      title: 'Важно',
      text: 'Конкретная применимость RRSIF зависит от налогоплательщика, деятельности и используемой системы. Перед изменением процессов EXPERT проверяет исходную ситуацию.',
    },
  },
  consultation: {
    sections: [
      {
        title: 'Когда консультация — правильный первый шаг',
        text: 'Если вопрос касается нескольких налогов, международной ситуации, выбора формы бизнеса, уведомления AEAT или сложного изменения процессов, сначала нужно определить факты и риски, а уже затем выбирать услугу.',
      },
    ],
  },
};
