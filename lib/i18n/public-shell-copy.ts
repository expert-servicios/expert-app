/** Public shell localization only. Never synthesize Russian paths that do not exist. */
export type PublicShellLocale = 'es' | 'ru';

const translatedRoutes: Record<string, string> = {
  '/': '/ru',
  '/servicios': '/ru/uslugi',
  '/holded': '/ru/holded',
  '/planes': '/ru/plany',
  '/academy': '/ru/academy',
  '/cita': '/ru/konsultatsiya',
  '/cita?tipo=consulta-inicial': '/ru/konsultatsiya',
  '/servicios/declaraciones-impuestos': '/ru/nalogi',
  '/servicios/empresas-autonomos': '/ru/autonomo',
  '/servicios/extranjeria-nacionalidad': '/ru/uslugi',
};
const ruText: Record<string, string> = {
  'Inicio': 'Главная',
  'Servicios': 'Услуги',
  'Ver todos los servicios →': 'Все услуги →',
  'Ver todos →': 'Посмотреть все →',
  'Holded': 'Holded',
  'Planes': 'Форматы работы',
  'Formación': 'Обучение',
  'Recursos': 'Материалы',
  'Acceder': 'Войти',
  'Acceder a mi panel': 'Личный кабинет',
  'Cerrar menú': 'Закрыть меню',
  'Abrir menú': 'Открыть меню',
  'Cerrar menu movil': 'Закрыть мобильное меню',
  'Prueba gratuita 14 días →': 'Бесплатная пробная версия 14 дней →',
  'Ver todos los servicios Holded': 'Все услуги Holded',
  'Ver todos los planes': 'Все форматы работы',
  'Prueba Holded 14 días': 'Пробный период Holded 14 дней',
  'Presupuesto personalizado': 'Индивидуальный расчёт стоимости',
  'Para asesorías': 'Для консультационных фирм (asesorías)',
  'Contacto': 'Контакты',
  'Reservar cita': 'Записаться',
  'Mentorías': 'Менторство',
  'Blog': 'Блог',
  'Base de conocimientos': 'База знаний',
  'Autoimplantación RGPD': 'Самостоятельное внедрение RGPD',
  'Navegación': 'Навигация',
  'Guías': 'Инструкции',
  'Sobre mí': 'О нас',
  'Fiscalidad': 'Налоги',
  'Extranjería y Nacionalidad': 'Иммиграционные процедуры (extranjería) и гражданство',
  'Empresas y Autónomos': 'Компании и самозанятые предприниматели (autónomos)',
  'Certificado digital': 'Цифровые сертификаты',
  'Tráfico y Capitanía Marítima': 'Транспорт и морская администрация',
  'Notaría y Propiedades': 'Нотариальное оформление (notaría) и недвижимость',
  'Nacionalidad menor nacido en España': 'Гражданство ребёнка, родившегося в Испании',
  'Residencia legal del menor': 'Законное проживание (residencia legal) ребёнка',
  'Documentos para el expediente': 'Документы для административного дела (expediente)',
  'Todos los derechos reservados.': 'Все права защищены.',
  'Aviso legal': 'Правовая информация',
  'Privacidad': 'Конфиденциальность',
  'Términos': 'Условия',
  'Cookies': 'Cookies',
  'Condiciones': 'Условия оказания услуг',
  'Consulta gratuita · 15 min': 'Бесплатная консультация · 15 мин',
  'Demo Holded gratuita · 30 min': 'Бесплатное демо Holded · 30 мин',
  'Holded Solution Partner certificado': 'Holded Solution Partner',
  'Protegido por reCAPTCHA —': 'Защита reCAPTCHA —',
  'España': 'Испания',
};
export function localizePublicShellHref(locale: PublicShellLocale, href: string): string {
  if (locale !== 'ru' || !href.startsWith('/')) return href;
  // Missing RU destinations deliberately retain their real ES path instead of a fabricated 404.
  return translatedRoutes[href] ?? href;
}
export function localizePublicShellText(locale: PublicShellLocale, text: string): string {
  return locale === 'ru' ? (ruText[text] ?? text) : text;
}
