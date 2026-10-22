import type { Article } from '@/lib/utils/blog';
import type { KnowledgeDoc } from '@/lib/utils/docs';

export const certificadoRecoveryArticles: Article[] = [{
  slug: 'he-perdido-certificado-digital-formateado-ordenador',
  category: 'Trámites',
  title: 'He perdido mi certificado digital al formatear el ordenador: qué hacer antes de pedir otro',
  excerpt: 'Comprueba si tienes una copia exportable con clave privada, distingue el emisor y evita tramitar un certificado nuevo sin necesidad.',
  date: '14 oct 2026',
  readTime: '7 min',
  tags: ['certificado digital','certificado perdido','reinstalar certificado','FNMT','Camerfirma','ACCV'],
  relatedServiceSlugs: ['certificado-digital-persona-fisica'],
  body: `## Si has formateado el ordenador, no pidas un certificado nuevo todavía

Lo primero es comprobar si guardaste una **copia de seguridad exportable** del certificado, normalmente un archivo **.p12 o .pfx** con su clave privada y contraseña. Si está vigente y funciona, podrás importarlo en un equipo compatible. Un fichero **.cer** o **.crt** sin clave privada no sirve para firmar.

## Paso 1: busca una copia segura

Revisa un USB personal, el ordenador anterior o tus copias de seguridad privadas. No envíes el certificado ni su contraseña por correo, chat o formularios. Si utilizabas una tarjeta criptográfica, DNIe, certificado en nube o credencial de empleado público, consulta a su administrador: el proceso puede ser distinto.

## Paso 2: identifica al emisor y la finalidad

Mira si era de **FNMT**, **Camerfirma** o **ACCV**, y si era un certificado personal o de **empleado público/corporativo**. Si fue emitido por tu organismo, consulta primero con el departamento informático: EXPERT no debe tramitar por defecto un certificado personal para sustituir una identidad profesional.

## Paso 3: instala y prueba, o solicita otro

Con copia válida y contraseña, utiliza las instrucciones oficiales de importación de tu emisor y verifica el uso en una sede o plataforma compatible. Sin copia con clave privada, normalmente tendrás que obtener un certificado nuevo mediante el procedimiento vigente del emisor. Si hay sospecha de acceso de terceros, consulta la **revocación**.

## ¿Qué emisor elegir?

Consulta nuestras guías específicas de [FNMT](/docs/certificado-digital-nuevo-fnmt), [Camerfirma](/docs/certificado-digital-nuevo-camerfirma) y [ACCV](/docs/certificado-digital-nuevo-accv), con enlaces oficiales y vías de identificación que pueden cambiar. Los certificados gratuitos o públicos y los servicios profesionales de tramitación no son el mismo producto.

## ¿Cuándo puede ayudarte EXPERT?

Si no puedes recuperar tu certificado y prefieres un servicio asistido, EXPERT puede tramitar la **modalidad Camerfirma de persona física** con identificación online, instalación y prueba de funcionamiento según las condiciones publicadas de su catálogo. Es **opcional**: primero intentaremos evitarte una emisión innecesaria.

Servicio: [Certificado digital de persona física](/servicios/certificado-digital/certificado-digital-persona-fisica).

Fuentes: [FNMT](https://www.sede.fnmt.gob.es/certificados/persona-fisica), [Camerfirma](https://www.camerfirma.com/) y [ACCV](https://www.accv.es/).
`
}];

const common = {
 category: 'tramites' as const,
 updatedAt: '14 oct 2026',
 readTime: '6 min',
 relatedServiceSlugs: ['certificado-digital-persona-fisica'],
 relatedServiceCategories: ['certificado-digital' as const],
};
export const certificadoRecoveryDocs: KnowledgeDoc[] = [
 {
  ...common, slug:'certificado-digital-nuevo-fnmt',
  title:'Obtener un certificado digital FNMT: cuándo es necesario y pasos oficiales',
  excerpt:'Si no tienes una copia con clave privada, revisa las vías FNMT y cómo acreditar tu identidad.',
  tags:['FNMT','certificado persona física','reinstalación','certificado nuevo'],
  body:`## Antes de tramitarlo
Si conservas un .p12 o .pfx válido con clave privada, prueba primero la importación. Si el certificado era de empleado público, consulta al órgano emisor y a informática.

## Nueva solicitud FNMT
Accede a la [Sede FNMT — Persona Física](https://www.sede.fnmt.gob.es/certificados/persona-fisica). Elige una de las vías actualmente disponibles (identificación presencial, vídeo identificación u otras modalidades admitidas), revisa requisitos y coste de cada modalidad, prepara el equipo conforme a sus instrucciones, solicita el certificado y completa la identificación. Descárgalo e instala siguiendo las instrucciones del canal elegido. Algunas vías requieren conservar el mismo equipo/usuario usado al solicitar.

## Comprobación y seguridad
Prueba acceso y firma en un servicio compatible; exporta copia de seguridad si el certificado permite hacerlo. No compartas la clave privada ni su contraseña.

**Fuente oficial:** https://www.sede.fnmt.gob.es/certificados/persona-fisica`
 },
 {
  ...common, slug:'certificado-digital-nuevo-camerfirma',
  title:'Camerfirma: recuperar, instalar o emitir un nuevo certificado personal',
  excerpt:'Distingue instalación desde copia, revocación y nueva emisión, con posible acompañamiento EXPERT.',
  tags:['Camerfirma','certificado persona física','pfx','copia de seguridad','instalación'],
  body:`## Recuperar antes que comprar
Si tienes un .p12/.pfx con clave privada y contraseña y el certificado no ha caducado ni sido revocado, consulta las instrucciones oficiales de importación de Camerfirma.

## ¿Sin copia?
Comprueba el tipo de certificado anterior, su estado y las modalidades de emisión vigentes en [Camerfirma](https://www.camerfirma.com/). Completa la identificación que corresponda al producto contratado. No confundas certificado de empleado público/corporativo con certificado personal.

## Alternativa profesional opcional
EXPERT ofrece tramitación de un nuevo certificado Camerfirma de persona física con identificación remota, instalación y prueba de funcionamiento, sujeto al catálogo vigente: [consultar servicio](/servicios/certificado-digital/certificado-digital-persona-fisica). La guía y las alternativas oficiales se proporcionan igualmente aunque no se contrate.

## Seguridad
No envíes la copia ni contraseña por email. Si hubo pérdida con riesgo de uso indebido, solicita información de revocación al emisor.

**Fuente oficial:** https://www.camerfirma.com/`
 },
 {
  ...common, slug:'certificado-digital-nuevo-accv',
  title:'ACCV: certificado de ciudadano, recuperación e identificación',
  excerpt:'Vías oficiales de solicitud ACCV, puntos de registro y opciones de vídeo identificación cuando estén disponibles.',
  tags:['ACCV','certificado ciudadano','certificado digital','video identificación'],
  body:`## Comprueba primero la copia
Una copia exportable válida (.p12/.pfx con clave privada) puede permitir reinstalar el certificado. Si el certificado pertenece a tu puesto de trabajo, habla con el responsable de sistemas antes de solicitar uno de ciudadano.

## Nueva emisión ACCV
Consulta [ACCV](https://www.accv.es/) para elegir el certificado de ciudadano apropiado. Comprueba la posibilidad de obtenerlo en un punto de registro o mediante identificación por vídeo cuando esté disponible para tu caso, junto con la documentación, requisitos y tarifas vigentes. Sigue las instrucciones oficiales de generación, descarga e instalación.

## Después de emitir
Prueba el certificado y guarda una copia de seguridad segura cuando la modalidad lo permita. Si sospechas compromiso de las claves, consulta los canales de revocación de ACCV.

**Fuente oficial:** https://www.accv.es/`
 }
];
