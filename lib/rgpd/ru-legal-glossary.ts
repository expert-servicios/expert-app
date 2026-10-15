/**
 * Bilingual legal vocabulary for the EXPERT RGPD user journey.
 * Spanish labels follow standard RGPD / LOPDGDD terminology.
 * Russian explanations are interpretative translations, not separate legal categories.
 */
export const RGPD_RU_GLOSSARY = [
  { id: 'personal-data', ru: 'Персональные данные', es: 'datos personales', hint: 'Сведения, по которым можно определить человека прямо или косвенно.' },
  { id: 'processing', ru: 'Обработка персональных данных', es: 'tratamiento de datos personales', hint: 'Сбор, хранение, передача, просмотр и удаление информации.' },
  { id: 'controller', ru: 'Ответственный за обработку данных', es: 'responsable del tratamiento', hint: 'Тот, кто определяет цели и основные способы обработки.' },
  { id: 'processor', ru: 'Обработчик данных по поручению', es: 'encargado del tratamiento', hint: 'Поставщик, обрабатывающий данные по поручению ответственного.' },
  { id: 'rat', ru: 'Реестр операций обработки', es: 'registro de actividades de tratamiento (RAT)', hint: 'Перечень операций, их целей, категорий данных и других обязательных сведений.' },
  { id: 'legal-basis', ru: 'Правовое основание обработки', es: 'base jurídica del tratamiento', hint: 'Обоснование обработки по статье 6 RGPD; согласие — лишь одно из оснований.' },
  { id: 'consent', ru: 'Согласие', es: 'consentimiento', hint: 'Добровольное, конкретное, информированное и однозначное согласие, когда оно требуется.' },
  { id: 'privacy-policy', ru: 'Политика конфиденциальности', es: 'política de privacidad', hint: 'Информация пользователям о том, как и зачем используются данные.' },
  { id: 'information-duty', ru: 'Обязанность информирования', es: 'deber de información', hint: 'Необходимая информация предоставляется человеку при сборе данных.' },
  { id: 'special', ru: 'Особые категории персональных данных', es: 'categorías especiales de datos personales', hint: 'Например, данные о здоровье, для которых действуют дополнительные правила.' },
  { id: 'profiling', ru: 'Профилирование', es: 'elaboración de perfiles', hint: 'Автоматизированная оценка личных аспектов человека.' },
  { id: 'automated', ru: 'Индивидуальные автоматизированные решения', es: 'decisiones individuales automatizadas', hint: 'Решения без значимого участия человека, подпадающие под специальные правила в установленных случаях.' },
  { id: 'eipd', ru: 'Оценка воздействия на защиту данных', es: 'evaluación de impacto relativa a la protección de datos (EIPD)', hint: 'Специальный анализ, когда обработка может создавать высокий риск.' },
  { id: 'security', ru: 'Меры безопасности', es: 'medidas de seguridad', hint: 'Организационные и технические меры, пропорциональные риску.' },
  { id: 'breach', ru: 'Нарушение безопасности персональных данных', es: 'violación de seguridad de los datos personales', hint: 'Утрата, раскрытие, изменение данных или несанкционированный доступ.' },
  { id: 'retention', ru: 'Срок хранения данных', es: 'plazo de conservación', hint: 'Период хранения, ограниченный целями и обязательствами закона.' },
  { id: 'rights', ru: 'Права субъектов данных', es: 'derechos de los interesados', hint: 'Например, доступ, исправление и удаление данных при наличии условий.' },
  { id: 'transfer', ru: 'Международная передача данных', es: 'transferencia internacional de datos', hint: 'Передача данных в третьи страны, для которой могут требоваться гарантии.' },
  { id: 'dpo', ru: 'Специалист по защите данных', es: 'delegado de protección de datos (DPD)', hint: 'Назначаемый в предусмотренных случаях специалист, консультирующий и контролирующий.' },
  { id: 'autonomo', ru: 'Индивидуальный предприниматель', es: 'autónomo', hint: 'В Испании физическое лицо, осуществляющее деятельность от своего имени.' },
  { id: 'sl', ru: 'Общество с ограниченной ответственностью', es: 'sociedad limitada (SL)', hint: 'Юридическое лицо; регистрация сама по себе не снимает обязанности RGPD.' },
] as const;

export function rgpdRuWithEs(id: typeof RGPD_RU_GLOSSARY[number]['id']): string {
  const entry = RGPD_RU_GLOSSARY.find((item) => item.id === id);
  return entry ? `${entry.ru} (${entry.es})` : id;
}

/** Unified terminology supplied to both public KIA and internal Copilot. */
export const RGPD_RU_KIA_GLOSSARY = RGPD_RU_GLOSSARY
  .map(({ ru, es, hint }) => `- ${ru} (${es}): ${hint}`)
  .join('\n');
