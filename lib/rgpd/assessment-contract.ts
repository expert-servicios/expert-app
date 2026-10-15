/** Single audited RGPD assessment contract used by ES/RU web and KIA.
 * Contains only categorical answers; no personal information or documents.
 */
export type RgpdAnswer = boolean | 'ordinary' | 'startup' | 'multiple' | 'unknown' | 'none' | 'basic' | 'advanced';
export type RgpdAnswers = Record<string, RgpdAnswer | undefined>;
export type RgpdLanguage = 'es' | 'ru';
export const RGPD_QUESTIONS = [
  { id: 'businessType', kind: 'business', title: { es: "¿Qué tipo de actividad describe mejor tu negocio?", ru: "Какой у вас бизнес?" }, weight: 0, hardRisk: false, options: [{ value: "ordinary", es: "Autónomo o pyme con tratamientos habituales", ru: "Autónomo (индивидуальный предприниматель) или небольшая компания" }, { value: "startup", es: "Startup, app o plataforma digital", ru: "Стартап, приложение или онлайн-платформа" }, { value: "multiple", es: "Empresa con muchos procesos o tratamientos diferentes", ru: "Компания с множеством процессов обработки" }, { value: "unknown", es: "No lo sé", ru: "Не знаю" }] },
  { id: 'employees', kind: 'boolean', title: { es: "¿Tienes empleados o colaboradores con acceso a datos personales?", ru: "Есть ли у работников или подрядчиков доступ к персональным данным (datos personales)?" }, weight: 1, hardRisk: false, options: [{ value: true, es: "Sí", ru: "Да" }, { value: false, es: "No", ru: "Нет" }, { value: "unknown", es: "No lo sé", ru: "Не знаю" }] },
  { id: 'website', kind: 'boolean', title: { es: "¿Tu web recoge datos mediante formularios, reservas, newsletter o cuentas de usuario?", ru: "Собирает ли сайт персональные данные через формы, записи, рассылки или личные кабинеты?" }, weight: 1, hardRisk: false, options: [{ value: true, es: "Sí", ru: "Да" }, { value: false, es: "No", ru: "Нет" }, { value: "unknown", es: "No lo sé", ru: "Не знаю" }] },
  { id: 'cookies', kind: 'cookies', title: { es: "¿Utilizas analítica, publicidad, píxeles o cookies no necesarias?", ru: "Какие технологии анализа или рекламы используются на сайте?" }, weight: 1, hardRisk: false, options: [{ value: "none", es: "No / solo técnicas", ru: "Нет, только технически необходимые cookies" }, { value: "basic", es: "Analítica básica", ru: "Базовая аналитика посещений" }, { value: "advanced", es: "Publicidad, píxeles o personalización", ru: "Реклама, пиксели или персонализация" }, { value: "unknown", es: "No lo sé", ru: "Не знаю" }] },
  { id: 'processors', kind: 'boolean', title: { es: "¿Usas proveedores que acceden a datos (gestoría, CRM, cloud, email marketing, soporte, IA)?", ru: "Используете ли вы подрядчиков с доступом к данным (CRM, облако, почта, ИИ)?" }, weight: 1, hardRisk: false, options: [{ value: true, es: "Sí", ru: "Да" }, { value: false, es: "No", ru: "Нет" }, { value: "unknown", es: "No lo sé", ru: "Не знаю" }] },
  { id: 'international', kind: 'boolean', title: { es: "¿Algún proveedor o subencargado trata datos fuera del EEE?", ru: "Могут ли ваши подрядчики обрабатывать данные вне Европейской экономической зоны (EEE)?" }, weight: 2, hardRisk: false, options: [{ value: true, es: "Sí", ru: "Да" }, { value: false, es: "No", ru: "Нет" }, { value: "unknown", es: "No lo sé", ru: "Не знаю" }] },
  { id: 'special', kind: 'boolean', title: { es: "¿Tratas datos de salud u otras categorías especiales del artículo 9 RGPD?", ru: "Обрабатываете ли вы данные о здоровье или особые категории данных (categorías especiales de datos personales)?" }, weight: 4, hardRisk: true, options: [{ value: true, es: "Sí", ru: "Да" }, { value: false, es: "No", ru: "Нет" }, { value: "unknown", es: "No lo sé", ru: "Не знаю" }] },
  { id: 'minors', kind: 'boolean', title: { es: "¿Tratas datos de menores de forma relevante para el servicio?", ru: "Обрабатываете ли вы данные несовершеннолетних в рамках услуги?" }, weight: 4, hardRisk: true, options: [{ value: true, es: "Sí", ru: "Да" }, { value: false, es: "No", ru: "Нет" }, { value: "unknown", es: "No lo sé", ru: "Не знаю" }] },
  { id: 'profiling', kind: 'boolean', title: { es: "¿Realizas perfiles, scoring, decisiones automatizadas o publicidad basada en comportamiento individual?", ru: "Создаёте ли вы профили (elaboración de perfiles), рейтинги людей или автоматизированные решения?" }, weight: 4, hardRisk: true, options: [{ value: true, es: "Sí", ru: "Да" }, { value: false, es: "No", ru: "Нет" }, { value: "unknown", es: "No lo sé", ru: "Не знаю" }] },
  { id: 'location', kind: 'boolean', title: { es: "¿Recoges geolocalización, monitorización sistemática, audio o videovigilancia avanzada?", ru: "Используете ли вы геолокацию, систематическое наблюдение, запись звука или видеоконтроль?" }, weight: 4, hardRisk: true, options: [{ value: true, es: "Sí", ru: "Да" }, { value: false, es: "No", ru: "Нет" }, { value: "unknown", es: "No lo sé", ru: "Не знаю" }] },
  { id: 'largeScale', kind: 'boolean', title: { es: "¿Tratas datos a gran escala o de un número muy elevado de personas?", ru: "Обрабатываете ли вы данные большого количества людей?" }, weight: 4, hardRisk: true, options: [{ value: true, es: "Sí", ru: "Да" }, { value: false, es: "No", ru: "Нет" }, { value: "unknown", es: "No lo sé", ru: "Не знаю" }] },
  { id: 'innovative', kind: 'boolean', title: { es: "¿Tu producto usa IA u otra tecnología innovadora para inferir, clasificar o predecir información sobre personas?", ru: "Использует ли ваш продукт ИИ для классификации людей или прогнозов о них?" }, weight: 4, hardRisk: true, options: [{ value: true, es: "Sí", ru: "Да" }, { value: false, es: "No", ru: "Нет" }, { value: "unknown", es: "No lo sé", ru: "Не знаю" }] },
  { id: 'breach', kind: 'boolean', title: { es: "¿Tienes ahora una brecha o incidente de datos personales sin cerrar?", ru: "Есть ли сейчас нерешённая утечка персональных данных (violación de seguridad de los datos personales)?" }, weight: 5, hardRisk: true, options: [{ value: true, es: "Sí", ru: "Да" }, { value: false, es: "No", ru: "Нет" }, { value: "unknown", es: "No lo sé", ru: "Не знаю" }] },
] as const;
export const RGPD_MODULES = [
 ['rat','Registro de Actividades de Tratamiento (RAT)'],
 ['privacy','Cláusulas informativas y política de privacidad'],
 ['processors','Contratos y revisión de encargados'],
 ['security','Medidas de seguridad y control de accesos'],
 ['rights','Procedimiento para ejercicio de derechos'],
 ['breaches','Registro y protocolo de brechas'],
 ['retention','Conservación, bloqueo y supresión'],
 ['web','Web, formularios, cookies y comunicaciones'],
] as const;

export function getRgpdQuestion(index: number, locale: RgpdLanguage) {
  const item=RGPD_QUESTIONS[index];
  if(!item)return null;
  return {id:item.id,title:item.title[locale],options:item.options.map(v=>({value:v.value,label:v[locale]})),kind:item.kind,hardRisk:item.hardRisk,weight:item.weight};
}

export function validateRgpdAnswers(raw: Record<string,unknown>, step: number): raw is RgpdAnswers {
 if(!Number.isInteger(step) || step<0 || step>RGPD_QUESTIONS.length || Object.keys(raw).length!==step)return false;
 return RGPD_QUESTIONS.every((q,i)=>i>=step?!Object.hasOwn(raw,q.id):q.options.some(o=>o.value===raw[q.id]));
}

export function evaluateRgpdAssessment(answers: RgpdAnswers, hourlyRateEur?: number) {
 let score=0;
 const hardFlags:string[]=[];
 const uncertainHardFlags:string[]=[];
 for(const question of RGPD_QUESTIONS){
  const answer=answers[question.id];
  if(answer===true || answer==='advanced'){
   score+=question.weight;
   if(question.hardRisk)hardFlags.push(question.title.es);
  }
  if(question.hardRisk && answer==='unknown')uncertainHardFlags.push(question.title.es);
 }
 const modules=['rat','privacy','security','rights','breaches','retention'];
 if(answers.processors===true || answers.international===true || answers.innovative===true)modules.push('processors');
 if(answers.website===true || answers.cookies==='basic' || answers.cookies==='advanced')modules.push('web');
 const moduleIds=RGPD_MODULES.filter(([id])=>modules.includes(id)).map(([id])=>id);
 const moduleLabels=RGPD_MODULES.filter(([id])=>modules.includes(id)).map(([,label])=>label);
 let tier='Autoimplantación guiada';
 let level:'low'|'medium'|'high'='low';
 let message='Tu perfil encaja, a priori, con un recorrido guiado de bajo riesgo. La herramienta puede ayudarte a ordenar la documentación y tareas, pero no certifica cumplimiento.';
 if(hardFlags.length>0 || uncertainHardFlags.length>0 || score>=8){
  tier='Revisión profesional recomendada';level='high';
  message='Hay señales que requieren analizar el tratamiento con más detalle. No conviene cerrar la implantación únicamente con un asistente automático.';
 }else if(score>=4){
  tier='Autoimplantación + revisión final';level='medium';
  message='Puedes completar gran parte del trabajo con la herramienta, pero recomendamos una revisión final de coherencia, proveedores, web y medidas de seguridad.';
 }
 const estimatedHours=level==='low'?{min:0,max:2}:level==='medium'?{min:3,max:5}:hardFlags.length>=3||score>=14?{min:8,max:12}:{min:5,max:8};
 const estimatedPrice=hourlyRateEur&&hourlyRateEur>0?{min:estimatedHours.min*hourlyRateEur,max:estimatedHours.max*hourlyRateEur}:null;
 return {score,hardFlags,uncertainHardFlags,moduleIds,moduleLabels,tier,level,message,estimatedHours,estimatedPrice};
}
