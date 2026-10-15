/** Plain-language help for RGPD questionnaire results.
 * Titles are business topics, not quotes of risk questions or legal findings.
 * These descriptions are indicative and deliberately do not decide compliance.
 */
export type RgpdTopic = { title:string; why:string; action:string; guide:string; guideTitle:string };

export const RGPD_MODULE_TOPICS: Record<string,RgpdTopic> = {
 rat: {
  title:'Saber dónde utiliza tu negocio datos personales',
  why:'No basta con tener clientes: necesitas saber para qué utilizas nombres, contactos y otros datos.',
  action:'Haz una lista de actividades: clientes, facturación, personal, reservas, candidatos o web. Para cada una, anota qué datos utilizas y con qué finalidad.',
  guide:'/docs/registro-actividades-tratamiento-rat-pymes',guideTitle:'Cómo preparar el registro de tratamientos'
 },
 privacy: {
  title:'Explicar a las personas qué haces con sus datos',
  why:'Quien rellena un formulario o contrata un servicio debe saber quién usa sus datos, para qué y qué derechos tiene.',
  action:'Comprueba qué información aparece al dar de alta un cliente, crear una cuenta, aceptar una candidatura o pedir presupuesto.',
  guide:'/docs/privacidad-formularios-cookies-web',guideTitle:'Guía de textos y formularios'
 },
 processors: {
  title:'Revisar los programas y proveedores que pueden acceder a datos',
  why:'Servicios como alojamiento web, CRM, email y algunos sistemas de analítica pueden tratar datos por tu cuenta.',
  action:'Apunta qué servicios utilizas; comprueba quién accede realmente a datos y si corresponde un contrato de encargado y revisar transferencias.',
  guide:'/blog/proveedores-cloud-ia-rgpd-encargados-tratamiento',guideTitle:'Guía de proveedores y contratos'
 },
 security: {
  title:'Proteger los accesos y los documentos',
  why:'Las medidas deben impedir accesos indebidos, pérdidas y usos no autorizados en proporción al riesgo.',
  action:'Revisa quién puede entrar a cada aplicación, contraseñas, verificación en dos pasos, copias de seguridad y bajas de usuarios.',
  guide:'/docs/checklist-rgpd-autonomos-pymes',guideTitle:'Checklist de seguridad y cumplimiento'
 },
 rights: {
  title:'Saber qué hacer si alguien pide ver o borrar sus datos',
  why:'Las personas pueden ejercer derechos de acceso, rectificación y supresión, entre otros.',
  action:'Define quién recibe solicitudes, cómo verifica la identidad y cómo responde normalmente dentro del plazo de un mes.',
  guide:'/docs/checklist-rgpd-autonomos-pymes',guideTitle:'Derechos de las personas y plazos'
 },
 breaches: {
  title:'Prepararse para una pérdida o filtración de datos',
  why:'Un portátil perdido o el envío de datos al destinatario equivocado puede requerir documentar y evaluar una brecha.',
  action:'Decide a quién se avisa, cómo se registra la incidencia y cuándo corresponde notificar a la AEPD.',
  guide:'/docs/protocolo-brechas-datos-personales-72-horas',guideTitle:'Qué hacer ante una brecha'
 },
 retention: {
  title:'Decidir cuánto tiempo guardas la información',
  why:'Guardar datos indefinidamente puede ser contrario al principio de limitación del plazo de conservación.',
  action:'Define plazos por finalidad y un proceso de borrado o bloqueo cuando corresponda, respetando las obligaciones legales.',
  guide:'/docs/checklist-rgpd-autonomos-pymes',guideTitle:'Conservación y borrado de datos'
 },
 web: {
  title:'Comprobar tu web, los formularios y las cookies',
  why:'Una página puede tratar datos incluso cuando aún no vende: cuentas, formularios, medición de visitas y publicidad.',
  action:'Comprueba qué recoge cada formulario, si utiliza cookies no necesarias y qué ocurre antes de consentirlas.',
  guide:'/docs/privacidad-formularios-cookies-web',guideTitle:'Privacidad de webs y cookies'
 }
};

export const RGPD_SIGNAL_TOPICS: Record<string,RgpdTopic> = {
 special: {
  title:'Datos de salud, discapacidad u otra información delicada',
  why:'Algunos datos tienen una protección reforzada y pueden requerir requisitos adicionales.',
  action:'No añadas estos campos por rutina. Comprueba por qué se necesitan, qué base jurídica y condición del artículo 9 se aplican y quién tendrá acceso.',
  guide:'/blog/rgpd-marketplaces-candidatos-datos-sensibles-responsabilidad',guideTitle:'Datos sensibles en plataformas'
 },
 minors: {
  title:'Datos de menores de edad',
  why:'Los menores requieren especial atención: información comprensible, legitimación y medidas adecuadas.',
  action:'Confirma edades, finalidades y si necesitas comprobar consentimiento o representación según el tratamiento.',
  guide:'/docs/checklist-rgpd-autonomos-pymes',guideTitle:'Checklist RGPD'
 },
 profiling: {
  title:'Clasificar o puntuar personas automáticamente',
  why:'El uso de perfiles, puntuaciones o decisiones automatizadas puede afectar a derechos de candidatos o usuarios.',
  action:'Explica qué calcula el sistema, qué efecto tiene para la persona y si interviene una revisión humana. Evalúa los riesgos y las reglas aplicables.',
  guide:'/blog/rgpd-marketplaces-candidatos-datos-sensibles-responsabilidad',guideTitle:'Perfilado y selección'
 },
 location: {
  title:'Ubicación, cámaras o seguimiento de personas',
  why:'El seguimiento continuado puede afectar especialmente a la privacidad.',
  action:'Comprueba qué se registra, quién puede verlo, con qué finalidad y cuánto tiempo se conserva.',
  guide:'/docs/checklist-rgpd-autonomos-pymes',guideTitle:'Revisión de tratamientos y seguridad'
 },
 largeScale: {
  title:'Volumen elevado de personas o información',
  why:'El número de personas, la frecuencia y el tipo de datos pueden aumentar el riesgo.',
  action:'Estima de forma aproximada el volumen y la frecuencia, sin enviar a EXPERT datos identificativos de tus usuarios.',
  guide:'/docs/rgpd-aepd-ruta-decisiones-para-startups',guideTitle:'Elegir el recorrido de revisión'
 },
 innovative: {
  title:'Inteligencia artificial u otras funciones innovadoras',
  why:'Inferencias o predicciones sobre personas pueden exigir evaluaciones adicionales.',
  action:'Describe la función del sistema, su finalidad y quién revisa sus resultados. Comprueba datos, proveedores y posibles efectos sobre las personas.',
  guide:'/blog/rgpd-marketplaces-candidatos-datos-sensibles-responsabilidad',guideTitle:'RGPD en plataformas tecnológicas'
 },
 breach: {
  title:'Posible filtración o incidente sin resolver',
  why:'Una brecha de datos personales puede exigir una evaluación y una notificación urgente.',
  action:'Si el incidente está ocurriendo, aplica el protocolo de respuesta y valora sin demora si procede notificación, en su caso dentro del plazo legal.',
  guide:'/docs/protocolo-brechas-datos-personales-72-horas',guideTitle:'Protocolo de brechas'
 },
 international: {
  title:'Servicios que pueden tratar datos fuera de Europa',
  why:'El uso de proveedores o subencargados fuera del EEE puede exigir garantías para transferencias internacionales.',
  action:'Comprueba dónde se tratan los datos y qué garantías ofrece el proveedor. No presupongas que usar una marca internacional implica por sí solo una transferencia.',
  guide:'/blog/proveedores-cloud-ia-rgpd-encargados-tratamiento',guideTitle:'Proveedores y transferencias'
 }
};
