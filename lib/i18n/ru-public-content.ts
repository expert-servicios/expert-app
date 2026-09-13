import type { PublicRouteKey } from '@/lib/i18n/public-routes';

export interface RuPublicPageContent {
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  primaryCta: string;
  primaryRoute: PublicRouteKey;
  secondaryCta?: string;
  secondaryRoute?: PublicRouteKey;
}

export const RU_PUBLIC_CONTENT: Record<PublicRouteKey, RuPublicPageContent> = {
  home: {
    eyebrow: 'EXPERT · бизнес в Испании на русском',
    title: 'Налоги и управление бизнесом в Испании на русском',
    description: 'EXPERT объединяет профессиональное сопровождение, Holded, обучение и Kia, чтобы предприниматель понимал цифры, процессы и следующий шаг.',
    bullets: ['Налоги и бухгалтерский контроль в Испании', 'Внедрение и сопровождение Holded', 'Практическое обучение и помощь специалиста'],
    primaryCta: 'Посмотреть Holded на русском',
    primaryRoute: 'holded',
    secondaryCta: 'Записаться на консультацию',
    secondaryRoute: 'consultation',
  },
  holded: {
    eyebrow: 'Holded на русском',
    title: 'Внедрение, миграция и обучение работе с Holded',
    description: 'Настраиваем Holded под реальный бизнес в Испании, переносим данные и обучаем владельца и команду работать в системе самостоятельно.',
    bullets: ['Аудит перед миграцией', 'Настройка процессов и данных', 'Обучение на русском и профессиональное сопровождение'],
    primaryCta: 'Посмотреть варианты работы',
    primaryRoute: 'plans',
    secondaryCta: 'Обсудить внедрение',
    secondaryRoute: 'consultation',
  },
  plans: {
    eyebrow: 'EXPERT + Holded',
    title: 'Форматы сопровождения бизнеса',
    description: 'Подбираем уровень участия EXPERT в зависимости от того, сколько процессов вы хотите вести самостоятельно в Holded.',
    bullets: ['Контроль и профессиональная проверка', 'Сопровождение текущей деятельности', 'Индивидуальный формат для более сложных компаний'],
    primaryCta: 'Обсудить подходящий формат',
    primaryRoute: 'consultation',
  },
  services: {
    eyebrow: 'Услуги EXPERT',
    title: 'Налоги, бизнес и административные вопросы в Испании',
    description: 'Помогаем предпринимателям и частным клиентам решать задачи в рамках испанского налогового, трудового и административного регулирования.',
    bullets: ['Налоги и декларации', 'Autónomo и компании', 'Административные и документальные процедуры'],
    primaryCta: 'Выбрать направление',
    primaryRoute: 'consultation',
  },
  academy: {
    eyebrow: 'EXPERT Business Academy',
    title: 'Практическое обучение управлению бизнесом в Испании',
    description: 'Частное нерегулируемое обучение для предпринимателей, которые хотят понимать расчёты, обязанности и процессы своей компании.',
    bullets: ['Практика на бизнес-кейсах', 'Связь теории с Holded и рабочими процессами', 'Поддержка специалиста EXPERT'],
    primaryCta: 'Узнать о программах',
    primaryRoute: 'consultation',
  },
  autonomo: {
    eyebrow: 'Autónomo в Испании',
    title: 'Открытие и ведение деятельности autónomo',
    description: 'Помогаем организовать старт и дальнейшее управление деятельностью autónomo: от регистрации до текущего налогового контроля и Holded.',
    bullets: ['Проверка исходной ситуации', 'Регистрация и основные обязанности', 'Организация учёта и контроля'],
    primaryCta: 'Обсудить мой случай',
    primaryRoute: 'consultation',
  },
  sl: {
    eyebrow: 'Sociedad Limitada',
    title: 'Создание и управление компанией SL в Испании',
    description: 'Сопровождаем создание компании и выстраиваем понятную систему дальнейшего управления, документов, учёта и налогового контроля.',
    bullets: ['Подготовка к созданию SL', 'Организация бухгалтерских и административных процессов', 'Holded и сопровождение после запуска'],
    primaryCta: 'Обсудить создание SL',
    primaryRoute: 'consultation',
  },
  taxes: {
    eyebrow: 'Налоги в Испании',
    title: 'Налоговые вопросы для предпринимателей и частных клиентов',
    description: 'Разбираем ситуацию по правилам Испании и объясняем решение на русском, сохраняя официальные испанские термины и формы.',
    bullets: ['IRPF и другие декларации', 'Резиденты и нерезиденты', 'Международные доходы и специальные режимы'],
    primaryCta: 'Записаться на консультацию',
    primaryRoute: 'consultation',
  },
  verifactu: {
    eyebrow: 'VERI*FACTU 2027',
    title: 'Подготовка бизнеса к новым требованиям к системам выставления счетов',
    description: 'Помогаем оценить текущий процесс счетов, подготовить переход и организовать работу в Holded с учётом требований, применимых к вашему бизнесу в Испании.',
    bullets: ['Аудит текущего процесса', 'План перехода', 'Настройка Holded и обучение'],
    primaryCta: 'Подготовиться к VERI*FACTU',
    primaryRoute: 'consultation',
    secondaryCta: 'Holded на русском',
    secondaryRoute: 'holded',
  },
  consultation: {
    eyebrow: 'Профессиональная консультация',
    title: 'Разберём вашу ситуацию и определим следующий шаг',
    description: 'Консультация EXPERT подходит, когда нужно принять решение по налогам, бизнесу, Holded или административной процедуре в Испании.',
    bullets: ['Разбор исходных данных', 'Объяснение вариантов и рисков', 'Понятный план дальнейших действий'],
    primaryCta: 'Перейти к записи',
    primaryRoute: 'consultation',
  },
};
