import type { CategorySlug } from './catalog';
import { getGeneratedBatch1KnowledgeDocs } from '@/lib/services/service-generated-content';

export type DocCategorySlug = 'extranjeria-nacionalidad' | 'fiscalidad' | 'empresas' | 'tramites' | 'holded';

export type KnowledgeDoc = {
  slug: string;
  category: DocCategorySlug;
  title: string;
  excerpt: string;
  tags: string[];
  updatedAt: string;
  readTime: string;
  relatedServiceSlugs?: string[];
  relatedServiceCategories?: CategorySlug[];
  seoTitle?: string;
  seoDescription?: string;
  body: string;
};

export const docCategories: { slug: DocCategorySlug; name: string }[] = [
  { slug: 'extranjeria-nacionalidad', name: 'Extranjería y Nacionalidad' },
  { slug: 'fiscalidad', name: 'Fiscalidad' },
  { slug: 'empresas', name: 'Empresas y Autónomos' },
  { slug: 'tramites', name: 'Trámites' },
  { slug: 'holded', name: 'Holded' }
];

export const docs: KnowledgeDoc[] = [
  ...getGeneratedBatch1KnowledgeDocs(),
  {
    slug: 'apellidos-menor-nacionalidad-registro-civil',
    category: 'extranjeria-nacionalidad',
    title: 'Apellidos del menor al adquirir la nacionalidad española',
    excerpt:
      'Guía operativa para decidir entre duplicar un apellido único o acreditar el apellido personal de la madre antes de la inscripción española.',
    tags: ['apellidos', 'nacionalidad española', 'Registro Civil', 'menores', 'apellido materno', 'traducción jurada'],
    updatedAt: '23 sep 2026',
    readTime: '6 min',
    relatedServiceSlugs: ['nacionalidad-espanola-menor-nacido-en-espana'],
    relatedServiceCategories: ['extranjeria-nacionalidad'],
    seoTitle: 'Apellidos del menor al adquirir la nacionalidad española | EXPERT',
    seoDescription:
      'Qué hacer si el menor tiene un solo apellido: duplicarlo o acreditar el apellido personal de la madre. Documentación y traducción jurada.',
    body: `
## Regla operativa

Para un extranjero con filiación determinada que adquiere la nacionalidad española, la regla registral parte de los apellidos derivados de la filiación. La Instrucción de 23 de mayo de 2007 indica que, en principio, se consignan el primer apellido del padre y el primer apellido personal de la madre.

Si el interesado solo venía usando **un apellido** y no se determina otro apellido por la filiación, ese apellido se **duplica**.

## Opción A: duplicar el apellido actual

Es la opción más sencilla cuando la familia no desea aportar documentación adicional sobre el apellido personal de la madre.

Ejemplo: **KONOVA → KONOVA KONOVA**.

## Opción B: incorporar el apellido personal o de nacimiento de la madre

Es posible plantear el segundo apellido a partir del apellido personal/de nacimiento de la madre cuando pueda acreditarse.

No es obligatorio elegir esta opción. Si la familia prefiere la duplicación, no es necesario aportar un certificado de nacimiento de la madre solo por este motivo.

Cuando la madre usa actualmente un apellido adquirido por matrimonio, conviene revisar su documentación de nacimiento para identificar el apellido personal que corresponde a su filiación.

## Documentación

Para acreditar el apellido materno puede utilizarse, entre otros documentos idóneos, el **certificado de nacimiento de la madre**.

Si el documento es extranjero:

- revisar si requiere apostilla o legalización;
- revisar que sea válido y legible;
- si no está en castellano, aportar la traducción oficial correspondiente;
- una traducción de Traductor-Intérprete Jurado nombrado por el Ministerio de Asuntos Exteriores tiene carácter oficial en España.

## Lo que no puede hacerse

La solicitud de nacionalidad no permite escoger arbitrariamente un apellido sin conexión con la filiación. Si se pretende utilizar un apellido distinto, debe existir base jurídica y documental suficiente.

## Antes de firmar la solicitud

EXPERT recomienda confirmar por escrito:

1. si se opta por duplicar el apellido actual;
2. o si se quiere acreditar el apellido personal/de nacimiento de la madre;
3. y, en este segundo caso, revisar el documento acreditativo antes de cerrar el formulario.

**Fuentes oficiales**: [BOE - Instrucción sobre apellidos de extranjeros nacionalizados](https://www.boe.es/buscar/act.php?id=BOE-A-2007-12948) · [Sede del Ministerio de Justicia - Nacionalidad por residencia](https://sede.mjusticia.gob.es/es/tramites/nacionalidad-espanola) · [MAEC - Traducción e interpretación jurada](https://www.exteriores.gob.es/es/ServiciosAlCiudadano/Paginas/Traductores-Interpretes-Jurados.aspx)
    `
  },
  {
    slug: 'nacionalidad-espanola-menor-nacido-en-espana',
    category: 'extranjeria-nacionalidad',
    title: 'Nacionalidad española para menor nacido en España',
    excerpt:
      'Guía completa para familias extranjeras que quieren solicitar la nacionalidad española por residencia para un menor nacido en España.',
    tags: [
      'nacionalidad española',
      'menor nacido en España',
      'residencia legal',
      'Registro Civil',
      'Ministerio de Justicia',
      'tasa 790-026'
    ],
    updatedAt: '13 may 2026',
    readTime: '14 min',
    relatedServiceSlugs: ['nacionalidad-espanola-menor-nacido-en-espana'],
    relatedServiceCategories: ['extranjeria-nacionalidad'],
    seoTitle: 'Nacionalidad española para menor nacido en España | Guía completa',
    seoDescription:
      'Requisitos, documentación, plazo de 1 año de residencia legal, tasa 790-026 y proceso para solicitar la nacionalidad española de un menor nacido en España.',
    body: `
## Resumen del trámite

Si tu hijo o hija ha nacido en España y ya cuenta con residencia legal, puede tener derecho a solicitar la nacionalidad española por residencia con un plazo reducido de **1 año de residencia legal, continuada e inmediatamente anterior a la solicitud**.

Este supuesto no significa que la nacionalidad se obtenga de forma automática por haber nacido en España. El nacimiento en territorio español ayuda a reducir el plazo exigido, pero la solicitud debe prepararse y presentarse correctamente ante el Ministerio de Justicia.

## Para quién es esta guía

Esta guía está pensada para familias extranjeras residentes en España cuyo hijo o hija:

- Ha nacido en España.
- Está inscrito en el Registro Civil español.
- Tiene NIE/TIE o autorización de residencia legal en España.
- Ha cumplido, o está próximo a cumplir, 1 año de residencia legal.
- Es menor de edad.
- Cuenta con progenitores o representantes legales dispuestos a firmar la solicitud.

## Requisito clave: 1 año de residencia legal

El punto más importante es comprobar desde cuándo el menor tiene residencia legal propia. No basta con que los progenitores tengan residencia legal. Hay que acreditar que el menor ha tenido residencia legal, continuada e inmediatamente anterior a la solicitud.

Antes de presentar conviene revisar:

- Fecha de concesión de la autorización inicial.
- Fecha de emisión de la TIE.
- Posible existencia de una tarjeta anterior.
- Resolución administrativa de residencia o protección temporal.
- Continuidad de la residencia.

Presentar antes de cumplir el plazo puede provocar requerimientos, retrasos o incluso una denegación.

## Firma de los progenitores

Si ambos progenitores ejercen la patria potestad, lo recomendable es que firmen ambos como representantes legales del menor.

En menores de 14 años, cuando ambos representantes legales están de acuerdo y firman la solicitud, no debería exigirse la autorización previa del Encargado del Registro Civil en los supuestos ordinarios posteriores a la Ley 8/2021.

Si solo uno de los progenitores puede firmar, hay desacuerdo, o existe una situación familiar especial, el caso debe estudiarse antes de presentar.

## Documentación del menor

Normalmente se revisa y prepara:

- Certificación literal de nacimiento española expedida por el Registro Civil.
- Pasaporte completo y en vigor, con copia de todas las páginas.
- NIE/TIE o documento acreditativo de residencia legal en España.
- Tarjeta de residencia anterior, si existe.
- Resolución inicial de concesión de residencia o protección temporal, si existe.
- Certificado de empadronamiento familiar o colectivo actualizado.
- Certificado del centro escolar o educativo cuando corresponda por la edad y escolarización del menor.

## Documentación de los progenitores

También se revisa:

- Pasaporte completo y en vigor de ambos progenitores.
- NIE/TIE de ambos progenitores por ambas caras.
- Certificado de empadronamiento familiar, si no se aporta por separado.
- Datos de contacto: teléfono, correo electrónico y domicilio actual.
- Intervención, firma o asistencia de los representantes legales según la edad del menor y la patria potestad.

Si solo uno de los progenitores puede firmar, puede ser necesario aportar documentación adicional que justifique representación suficiente.

## Tasa administrativa

La solicitud de nacionalidad española por residencia exige el pago de la tasa administrativa mediante el modelo **790 código 026**.

La tasa administrativa actual indicada para este trámite es de **104,05 €**. En el servicio EXPERT se cobra junto con los honorarios como **suplido obligatorio**, por su importe exacto, para abonarla en nombre y por cuenta del cliente; queda separada de la base de honorarios.

El justificante debe cumplimentarse correctamente a nombre del menor solicitante.

## Cómo funciona el proceso

1. Revisión inicial de viabilidad.
2. Comprobación del plazo de 1 año de residencia legal.
3. Revisión de documentación del menor y progenitores.
4. Preparación del expediente.
5. Pago por EXPERT de la tasa 790-026 como suplido, una vez validado el expediente.
6. Presentación telemática ante el Ministerio de Justicia, cuando proceda.
7. Entrega del justificante y número de expediente.
8. Seguimiento básico inicial.

## Plazos de resolución

El procedimiento de nacionalidad por residencia tiene un plazo legal máximo de resolución de 1 año desde la entrada de la solicitud en el órgano competente. Si transcurre ese plazo sin resolución expresa, la solicitud se entiende desestimada por silencio administrativo, sin perjuicio de las vías de recurso que puedan corresponder.

En la práctica, los tiempos pueden variar según la carga administrativa, la calidad del expediente y la existencia o no de requerimientos.

## Casos en los que conviene revisar antes de contratar

Conviene estudiar el caso antes de presentar si:

- No está claro desde cuándo el menor tiene residencia legal.
- Solo uno de los progenitores puede firmar.
- Hay diferencias de nombres o apellidos entre documentos.
- El pasaporte está caducado.
- No hay certificado literal de nacimiento español.
- La residencia se ha concedido recientemente.
- Hay cambios de domicilio no reflejados en el empadronamiento.
- Hay documentación extranjera sin traducir o sin legalizar.

## Preguntas frecuentes

### ¿Mi hijo obtiene la nacionalidad automáticamente por haber nacido en España?

No. Nacer en España puede reducir el plazo exigido para solicitar la nacionalidad por residencia a 1 año, pero no concede automáticamente la nacionalidad española en todos los casos.

### ¿Sirve la residencia de los padres?

No basta con la residencia legal de los padres. Hay que verificar la residencia legal del menor.

### ¿Hace falta autorización previa del Registro Civil?

Para menores de 14 años, tras la Ley 8/2021 no se exige en el supuesto ordinario la autorización previa del Encargado del Registro Civil cuando existe acuerdo entre los representantes legales. Si no existe acuerdo entre los progenitores, debe revisarse la necesidad de aportar la resolución del expediente de jurisdicción voluntaria correspondiente.

### ¿Quién firma según la edad del menor?

En menores de 14 años actúan sus representantes legales. Entre 14 y 17 años, el menor formula la solicitud asistido por sus representantes legales. La documentación concreta depende de la patria potestad y de la situación familiar.

### ¿El menor tiene que hacer examen CCSE o DELE?

No. Los menores de edad están exentos de la prueba CCSE y los menores de 18 años están exentos del DELE A2 a estos efectos. La integración del menor se acredita mediante la documentación que corresponda a su edad y escolarización.
    `
  },
  {
    slug: 'residencia-legal-menor-nacido-espana-nacionalidad',
    category: 'extranjeria-nacionalidad',
    title: 'Residencia legal del menor nacido en España',
    excerpt:
      'Cómo comprobar la fecha de inicio de residencia legal del menor antes de presentar la nacionalidad española por residencia.',
    tags: ['residencia legal', 'menor nacido en España', 'TIE', 'NIE', 'nacionalidad por residencia'],
    updatedAt: '13 may 2026',
    readTime: '7 min',
    relatedServiceSlugs: ['nacionalidad-espanola-menor-nacido-en-espana'],
    relatedServiceCategories: ['extranjeria-nacionalidad'],
    seoTitle: 'Residencia legal del menor nacido en España para nacionalidad',
    seoDescription:
      'Qué fechas revisar para acreditar el año de residencia legal del menor nacido en España antes de solicitar la nacionalidad española.',
    body: `
## El nacimiento no sustituye a la residencia

En expedientes de nacionalidad para menores nacidos en España, uno de los errores más habituales es pensar que el nacimiento en territorio español basta para presentar.

Para la nacionalidad por residencia debe acreditarse un periodo de residencia legal. El plazo puede ser reducido, pero ese plazo cuenta desde la residencia legal del menor.

## Qué fechas hay que revisar

Antes de presentar conviene comprobar:

- Fecha de concesión de la autorización inicial.
- Fecha de efectos de la resolución, si consta.
- Fecha de expedición de la TIE.
- Existencia de una tarjeta anterior.
- Renovaciones o cambios de autorización.
- Periodos sin cobertura documental.

La fecha de la tarjeta no siempre es la fecha jurídicamente más útil. En muchos casos hay que revisar la resolución administrativa para entender desde cuándo existe autorización.

## Protección temporal y autorizaciones especiales

Si el menor tiene documentación vinculada a protección temporal u otra autorización especial, el expediente debe analizarse caso por caso.

Lo importante es acreditar que existe residencia legal suficiente y que no hay interrupciones relevantes antes de presentar.

## Qué pasa si se presenta demasiado pronto

Una presentación prematura puede generar:

- Requerimiento de documentación adicional.
- Paralización del expediente.
- Necesidad de aportar resoluciones no previstas.
- Mayor riesgo de denegación por falta de plazo.

Cuando hay dudas, es preferible revisar antes que presentar a ciegas.

## Recomendación práctica

Guarda siempre copia de:

1. Resolución inicial de concesión.
2. TIE actual y anteriores.
3. Pasaporte completo.
4. Empadronamiento actualizado.
5. Comunicaciones de Extranjería, si las hay.

Con esa documentación se puede reconstruir la línea temporal del menor y decidir el momento correcto para presentar la solicitud.
    `
  },
  {
    slug: 'documentos-nacionalidad-menor-nacido-espana',
    category: 'extranjeria-nacionalidad',
    title: 'Documentos para nacionalidad de menor nacido en España',
    excerpt:
      'Lista ordenada de documentos del menor y de sus progenitores para preparar el expediente de nacionalidad española por residencia.',
    tags: ['documentación', 'nacionalidad española', 'pasaporte', 'empadronamiento', 'Registro Civil'],
    updatedAt: '13 may 2026',
    readTime: '8 min',
    relatedServiceSlugs: ['nacionalidad-espanola-menor-nacido-en-espana'],
    relatedServiceCategories: ['extranjeria-nacionalidad'],
    seoTitle: 'Documentos para nacionalidad de menor nacido en España',
    seoDescription:
      'Documentación del menor y de los progenitores para preparar la solicitud de nacionalidad española por residencia.',
    body: `
## Documentos del menor

Para preparar el expediente de nacionalidad española por residencia de un menor nacido en España, normalmente se revisa:

- Certificación literal de nacimiento española expedida por el Registro Civil.
- Pasaporte completo y en vigor, con copia de todas las páginas.
- NIE/TIE o documento acreditativo de residencia legal.
- Tarjeta de residencia anterior, si existe.
- Resolución inicial de concesión de residencia, si se conserva.
- Certificado de empadronamiento familiar o colectivo actualizado.
- Certificado de centro escolar o guardería, si procede.

## Documentos de los progenitores

También se necesita revisar:

- Pasaporte completo y en vigor de ambos progenitores.
- NIE/TIE de ambos progenitores por ambas caras.
- Datos de contacto actualizados.
- Domicilio actual.
- Firma de ambos progenitores, salvo que exista causa justificada para otra forma de representación.

Si hay separación, desacuerdo, patria potestad limitada o imposibilidad de firma, el caso debe estudiarse antes de presentar.

## Errores documentales frecuentes

Los problemas más habituales son:

- Pasaporte caducado o incompleto.
- Certificado literal de nacimiento antiguo o ilegible.
- Nombres escritos de forma distinta entre documentos.
- Falta de resolución de residencia.
- Empadronamiento no actualizado.
- Firma de un solo progenitor sin explicación suficiente.

Estos errores no siempre impiden presentar, pero aumentan el riesgo de requerimientos.

## Tasa administrativa

La solicitud exige el pago de la tasa del Ministerio de Justicia mediante el modelo 790 código 026. El justificante debe estar correctamente vinculado al menor solicitante.

Antes de pagar la tasa, conviene tener el expediente revisado para evitar pagar cuando todavía falta un requisito esencial.

## Cómo organizar la documentación

Una forma práctica de preparar el envío es separar los archivos en tres bloques:

1. Documentos del menor.
2. Documentos de los progenitores.
3. Documentos de residencia y empadronamiento.

Los archivos deben verse completos, sin cortes, sombras ni páginas omitidas. Un expediente ordenado no garantiza una resolución rápida, pero reduce el riesgo de requerimientos evitables.
    `
  },

  // ── Extranjería ────────────────────────────────────────────────────────────
  {
    slug: 'residencia-larga-duracion-nacional',
    category: 'extranjeria-nacionalidad',
    title: 'Guía práctica de residencia de larga duración nacional en España',
    excerpt:
      'Guía documental de referencia sobre la autorización de residencia de larga duración nacional: requisitos de los 5 años, reglas de ausencias, documentación, tasa y plazos según el RD 1155/2024.',
    tags: [
      'residencia de larga duración',
      'residencia larga duración nacional',
      'RD 1155/2024',
      'extranjería',
      'TIE',
      'tasa 790-052'
    ],
    updatedAt: '8 jul 2026',
    readTime: '12 min',
    relatedServiceSlugs: ['residencia-larga-duracion-nacional'],
    relatedServiceCategories: ['extranjeria-nacionalidad'],
    seoTitle: 'Residencia de larga duración nacional en España | Guía práctica',
    seoDescription:
      'Requisitos de los 5 años de residencia legal, reglas de ausencias, documentación, tasa 790-052 epígrafe 2.6 y plazos para la residencia de larga duración nacional.',
    body: `
## Qué es la residencia de larga duración nacional

La autorización de residencia de larga duración nacional es el régimen que permite a una persona extranjera residir y trabajar en España de forma **indefinida**, en las mismas condiciones que los españoles en cuanto al acceso al empleo, sin necesidad de renovar periódicamente una autorización sujeta a condiciones.

Se regula en los **artículos 182 a 185 del Reglamento de Extranjería**, aprobado por el **Real Decreto 1155/2024, de 19 de noviembre** (texto consolidado en el BOE), y está descrita también en la **Hoja informativa 49 del Ministerio de Inclusión, Seguridad Social y Migraciones**.

No debe confundirse con la residencia de larga duración-UE, que tiene un régimen y unos efectos de movilidad europea distintos. Esta guía se refiere específicamente a la modalidad **nacional**.

## Diferencia entre residencia temporal, renovación ordinaria y larga duración

| Situación | Vigencia | Condiciones |
|---|---|---|
| Residencia temporal inicial | 1 año | Ligada al motivo de concesión (arraigo, trabajo, familiar, etc.) |
| Renovación ordinaria | 2–5 años según el caso | Debe acreditarse el mantenimiento de los requisitos cada vez que se renueva |
| Residencia de larga duración nacional | Indefinida | Se concede una sola vez; la TIE se renueva periódicamente, pero la autorización no caduca |

La diferencia esencial es que la residencia temporal y sus renovaciones dependen de mantener determinadas condiciones (contrato, vínculo familiar, medios económicos, etc.), mientras que la larga duración nacional, una vez concedida, no está sujeta a esas condiciones para mantenerse: solo se renueva el soporte físico (la TIE).

## Requisito general: 5 años de residencia legal y continuada

El requisito central es haber **residido legal y continuadamente en territorio español durante los 5 años inmediatamente anteriores** a la presentación de la solicitud.

Esto exige revisar con precisión:

- La fecha real de inicio de la residencia legal (no siempre coincide con la fecha de expedición de la TIE).
- Que no haya habido periodos de irregularidad sobrevenida entre autorizaciones.
- Que las distintas autorizaciones y renovaciones encajen sin huecos documentales relevantes.

## Reglas de ausencias del territorio español

Durante esos 5 años se permiten ausencias, pero dentro de límites estrictos:

- **Ausencias de hasta 6 meses continuados**: no interrumpen el cómputo, siempre que no se superen los límites totales indicados a continuación.
- **Límite total de 10 meses en el conjunto de los 5 años**: la suma de todas las ausencias no puede superar este total.
- **Ampliación a 18 meses si las ausencias son por motivos laborales**: cuando las salidas de España responden a razones de trabajo debidamente acreditadas, el límite conjunto se amplía hasta 18 meses dentro del periodo de 5 años.
- **Supuestos de fuerza mayor**: ausencias motivadas por causas de fuerza mayor debidamente justificadas pueden valorarse de forma individualizada por el órgano competente, sin computar necesariamente en contra del solicitante.

Antes de presentar la solicitud conviene reconstruir con detalle el historial de entradas y salidas (sellos de pasaporte, billetes, empadronamiento) para comprobar que ninguna ausencia, ni por separado ni en conjunto, pone en riesgo el expediente.

## Documentación habitual

- Formulario de solicitud (modelo EX-11).
- Pasaporte completo en vigor, con copia de todas las páginas.
- Justificante de pago de la tasa.
- Certificado de antecedentes penales, cuando proceda.
- Certificado de empadronamiento actualizado.
- Documentación acreditativa de la residencia legal continuada durante los 5 años (resoluciones, tarjetas anteriores, renovaciones).
- Certificado de escolarización de los menores a cargo, si los hay.
- Traducción jurada y, en su caso, apostilla o legalización de los documentos extranjeros.

## Presentación telemática

La solicitud puede presentarse por vía telemática a través de la sede electrónica correspondiente (Mercurio), con certificado digital, Cl@ve o representación autorizada. También cabe presentación presencial en la oficina de extranjería competente cuando la solicitud se tramita desde territorio español.

## Plazo de resolución: 3 meses

El plazo legal máximo de resolución es de **3 meses** desde la fecha de entrada de la solicitud en el registro del órgano competente para tramitarla.

## Silencio administrativo positivo

Si transcurre el plazo de 3 meses sin resolución expresa, la solicitud se entiende **estimada por silencio administrativo positivo**. Esto no exime de comprobar que el expediente esté correctamente registrado ni sustituye a la resolución expresa a efectos de tramitar después la TIE.

## Tasa: modelo 790, código 052, epígrafe 2.6

La tasa aplicable a la autorización de residencia de larga duración se abona mediante el **modelo 790, código 052, epígrafe 2.6** ("autorización de residencia de larga duración y autorización de residencia de larga duración-UE"). El justificante de pago debe conservarse y aportarse junto con la solicitud.

## Expedición de TIE tras resolución favorable

Una vez notificada la resolución favorable, debe solicitarse personalmente la Tarjeta de Identidad de Extranjero (TIE) en la comisaría de Policía, dentro del plazo indicado en la notificación.

La renovación posterior de la TIE (no de la autorización, que es indefinida) sigue un calendario propio: primera renovación a los 5 años, renovaciones sucesivas cada 5 años hasta los 30 años de edad del titular, y cada 10 años a partir de esa edad.

## Errores frecuentes

1. **Presentar antes de cumplir los 5 años**: adelantarse a la fecha real de cumplimiento del plazo, calculada de forma incorrecta, es la causa más habitual de requerimientos y denegaciones.
2. **Confundir la fecha de expedición de la TIE con la fecha real de la autorización**: el cómputo de los 5 años se hace sobre la residencia legal, no sobre la fecha en que se recogió la tarjeta.
3. **No revisar las ausencias con detalle**: no sumar correctamente los periodos fuera de España, o no diferenciar ausencias laborales de otras, puede llevar a presentar sin cumplir realmente el requisito.
4. **No aportar el pasaporte completo**: faltan páginas, sellos de entrada/salida o el pasaporte está próximo a caducar.
5. **No comprobar la situación de los menores escolarizados a cargo**: su documentación y continuidad de residencia también debe revisarse cuando forman parte del expediente familiar.

## Checklist previo a contratación del servicio

Antes de iniciar el trámite, conviene confirmar:

1. Han transcurrido 5 años completos de residencia legal y continuada, contados desde la fecha real de inicio, no desde la TIE.
2. Las ausencias del territorio español no superan los límites (6 meses continuados / 10 meses totales, o 18 meses si son laborales).
3. No existen periodos de irregularidad sobrevenida sin justificar entre autorizaciones.
4. El pasaporte está en vigor y completo.
5. Los menores a cargo tienen su documentación y escolarización en orden.
6. Se dispone de toda la documentación acreditativa del histórico de residencia (resoluciones, TIE anteriores, renovaciones).
7. Los documentos extranjeros están traducidos por traductor jurado y, si procede, apostillados o legalizados.

## Honorarios

En EXPERT revisamos tu viabilidad, preparamos el expediente y presentamos la solicitud telemáticamente. Honorarios: 250 € + IVA. Tasas no incluidas.

---

**Fuentes oficiales**: [Real Decreto 1155/2024 (BOE-A-2024-24099)](https://www.boe.es/buscar/doc.php?id=BOE-A-2024-24099) · [Hoja informativa 49 — Ministerio de Inclusión](https://www.inclusion.gob.es/web/migraciones/w/49.-autorizacion-de-residencia-de-larga-duracion-nacional)
    `
  },
  {
    slug: 'arraigo-social-requisitos-y-proceso',
    category: 'extranjeria-nacionalidad',
    title: 'Arraigo social 2026: requisitos, documentación y proceso',
    excerpt: 'Guía actualizada sobre el arraigo social: 2 años de permanencia, vínculos familiares o integración social, EX-10, tasa y pasos del expediente.',
    tags: ['arraigo social', 'residencia temporal', '2 años', 'integración social', 'EX-10', 'tasa 790-052'],
    updatedAt: '19 sep 2026',
    readTime: '12 min',
    relatedServiceSlugs: ['arraigo-social'],
    relatedServiceCategories: ['extranjeria-nacionalidad'],
    seoTitle: 'Arraigo social 2026: requisitos, documentos y proceso | EXPERT',
    seoDescription: 'Guía de arraigo social 2026: 2 años de permanencia, vínculos familiares o informe de integración, EX-10, tasa 38,28 € y plazo de resolución.',
    body: `
## Qué es el arraigo social

El **arraigo social** es una autorización de residencia temporal por circunstancias excepcionales para determinadas personas extranjeras que se encuentran en España y pueden acreditar una permanencia continuada mínima de **2 años**.

La regulación vigente se encuentra en la Ley Orgánica 4/2000 y en el **Real Decreto 1155/2024**. La información oficial del Ministerio fue actualizada en abril de 2026.

## Requisito temporal: 2 años, no 3

El requisito general actual es haber permanecido de forma continuada en España durante **al menos los 2 años inmediatamente anteriores a la solicitud**.

Durante ese periodo:

- las ausencias de España no pueden superar **90 días**;
- debe poder acreditarse la presencia efectiva en España;
- si la persona fue solicitante de protección internacional, el tiempo de permanencia mientras se tramitaba esa solicitud no computa hasta que exista resolución firme administrativa y, en su caso, judicial.

No es correcto seguir aplicando la antigua regla general de 3 años.

## Dos vías para acreditar el arraigo social

### 1. Vínculos familiares y medios económicos

Puede utilizarse esta vía cuando existen determinados vínculos con personas extranjeras titulares de una autorización de residencia:

- cónyuge;
- pareja de hecho registrada;
- familiares de primer grado en línea directa.

Además deben acreditarse medios económicos suficientes. La hoja informativa oficial indica, con carácter general, un mínimo del **100 % del IPREM para el familiar residente y otro 100 % para la persona solicitante**, es decir, un total del 200 % del IPREM con independencia del número de miembros de la unidad de convivencia.

### 2. Informe de integración social

Si no se acreditan los vínculos familiares previstos, puede recurrirse al **informe favorable de integración social** emitido por la Comunidad Autónoma o, cuando corresponda, por el Ayuntamiento del domicilio habitual.

EXPERT no emite este informe. Podemos indicar cuándo procede, revisar la documentación y comprobar que se incorpore correctamente al expediente.

## Documentación básica

La documentación exacta depende del caso, pero normalmente debe revisarse:

- formulario oficial **EX-10**;
- copia completa del pasaporte, cédula de inscripción o título de viaje en vigor;
- pruebas de permanencia continuada durante al menos 2 años;
- certificado de antecedentes penales del país o países en los que se haya residido durante los cinco años anteriores a la entrada en España, cuando proceda;
- documentación acreditativa de los vínculos familiares, si se utiliza esa vía;
- documentación de medios económicos suficientes, cuando corresponda;
- informe favorable de integración social, si se utiliza la vía de integración;
- justificante del abono de la tasa administrativa.

Los documentos públicos extranjeros deben cumplir, cuando proceda, los requisitos de legalización o apostilla y traducción jurada.

## Cómo acreditar los 2 años

El empadronamiento histórico es una prueba muy útil, pero **no es la única**.

La propia Administración indica que pueden valorarse documentos emitidos o registrados por administraciones públicas españolas, por ejemplo:

- empadronamiento;
- hospitalización;
- consultas en la sanidad pública;
- documentación municipal;
- documentación autonómica;
- documentación estatal que permita situar al solicitante en España.

La clave es construir una línea temporal coherente y suficiente.

## Formulario y tasa

El formulario oficial es el **EX-10**.

La tasa aplicable es el **Modelo 790 código 052, epígrafe 2.3.1**, correspondiente a las autorizaciones de residencia temporal por circunstancias excepcionales por arraigo.

La cuantía vigente es **38,28 €**. Esta tasa administrativa no forma parte de los honorarios profesionales de EXPERT.

## Presentación y plazo de resolución

La solicitud se presenta ante la Oficina de Extranjería competente.

El plazo administrativo de resolución es de **3 meses**, contado desde el día siguiente a la entrada de la solicitud en el registro del órgano competente.

Si transcurre ese plazo sin notificación, la solicitud puede entenderse desestimada por silencio administrativo, sin perjuicio de que el procedimiento pueda continuar hasta resolución expresa.

## ¿Se puede trabajar con el arraigo social?

La concesión del arraigo social lleva aparejada autorización para trabajar:

- por cuenta ajena;
- por cuenta propia;
- en todo el territorio español;
- sin limitación de ocupación durante la vigencia de la autorización.

La autorización de arraigo social y sus prórrogas tienen, con carácter general, una vigencia de **1 año**.

## Después de la concesión

Tras la notificación favorable, la persona extranjera debe solicitar personalmente la **TIE** dentro del plazo indicado por la normativa y las instrucciones administrativas aplicables.

## Errores frecuentes

1. Aplicar todavía el requisito antiguo de 3 años.
2. Confundir arraigo social con arraigo sociolaboral y exigir contrato de trabajo.
3. Presentar EX-01 en lugar de EX-10.
4. Aportar solo un volante actual de padrón sin construir prueba suficiente de los 2 años.
5. No revisar las ausencias del territorio español.
6. No comprobar si el tiempo como solicitante de protección internacional puede computarse.
7. Afirmar que un asesor privado puede emitir el informe oficial de integración.
8. No separar la tasa administrativa de los honorarios profesionales.

## Fuentes oficiales

- Ministerio de Inclusión, Seguridad Social y Migraciones — Hoja 28, Arraigo social: https://www.inclusion.gob.es/web/migraciones/w/autorizacion-residencia-temporal-por-circunstancias-excepcionales.-arraigo-social
- Real Decreto 1155/2024: https://www.boe.es/eli/es/rd/2024/11/19/1155
- Orden PJC/617/2025 — tasas de extranjería: https://www.boe.es/eli/es/o/2025/06/13/pjc617/con
    `
  },
  {
    slug: 'arraigo-social-acreditar-dos-anos',
    category: 'extranjeria-nacionalidad',
    title: 'Cómo acreditar los 2 años de permanencia para el arraigo social',
    excerpt: 'Checklist práctico para construir la prueba de permanencia continuada de 2 años exigida actualmente para el arraigo social.',
    tags: ['arraigo social', '2 años', 'permanencia continuada', 'empadronamiento histórico', 'prueba de residencia'],
    updatedAt: '19 sep 2026',
    readTime: '7 min',
    relatedServiceSlugs: ['arraigo-social'],
    relatedServiceCategories: ['extranjeria-nacionalidad'],
    seoTitle: 'Cómo acreditar 2 años para arraigo social | Checklist 2026',
    seoDescription: 'Qué documentos sirven para acreditar los 2 años de permanencia continuada del arraigo social y cómo revisar ausencias y periodos sin padrón.',
    body: `
## El padrón ayuda, pero no es la única prueba

Para el arraigo social vigente se exige acreditar **2 años de permanencia continuada en España**. La Administración da preferencia a documentos que hayan sido emitidos o registrados por organismos públicos españoles.

Un historial de empadronamiento completo es muy útil, pero no debe analizarse de forma aislada.

## Documentos que pueden reforzar la permanencia

La hoja informativa oficial menciona expresamente, entre otros:

- certificados o historiales de empadronamiento;
- documentos de hospitalización;
- consultas médicas en la sanidad pública;
- documentación municipal;
- documentos autonómicos;
- documentos estatales que identifiquen al solicitante y permitan situarlo en España.

También pueden existir otras pruebas útiles según las circunstancias, pero conviene priorizar documentación oficial y construir una cronología clara.

## Cómo preparar la línea temporal

Recomendamos ordenar la prueba por meses:

1. identificar la fecha desde la que deben computarse los 2 años;
2. obtener todos los historiales de padrón de los municipios donde se haya residido;
3. localizar posibles periodos sin padrón;
4. cubrir esos periodos con documentación pública alternativa;
5. revisar sellos del pasaporte y desplazamientos;
6. comprobar que las ausencias acumuladas no superen 90 días;
7. verificar si existió una solicitud de protección internacional y qué periodos pueden computar.

## Cambios de domicilio

Cambiar de Ayuntamiento no impide por sí mismo cumplir el requisito. El problema aparece cuando quedan huecos documentales importantes.

Si has vivido en varios municipios, conviene solicitar los certificados históricos de cada uno y ordenarlos cronológicamente.

## Ausencias de España

Durante los 2 años exigidos, las ausencias no pueden superar **90 días**.

Antes de presentar, revisa:

- sellos de entrada y salida;
- billetes y reservas si fueran relevantes;
- fechas de viajes prolongados;
- cualquier documentación que pueda contradecir la presencia alegada.

## Solicitantes de protección internacional

El tiempo durante el que una solicitud de protección internacional estuvo en tramitación **no computa** para este requisito hasta la resolución firme administrativa y, en su caso, judicial.

Este punto debe revisarse antes de calcular la fecha más temprana de presentación.

## Checklist final

- [ ] 2 años completos inmediatamente anteriores a la solicitud.
- [ ] Ausencias no superiores a 90 días.
- [ ] Historial de padrón de todos los municipios relevantes.
- [ ] Pruebas oficiales para posibles huecos.
- [ ] Pasaporte completo revisado.
- [ ] Periodos de protección internacional correctamente descontados, si existieron.
- [ ] Cronología documental coherente.

## Fuentes oficiales

- Ministerio de Inclusión — Hoja 28, Arraigo social: https://www.inclusion.gob.es/web/migraciones/w/autorizacion-residencia-temporal-por-circunstancias-excepcionales.-arraigo-social
- Real Decreto 1155/2024: https://www.boe.es/eli/es/rd/2024/11/19/1155
    `
  },  {
    slug: 'arraigo-social-vinculos-medios-e-informe-integracion',
    category: 'extranjeria-nacionalidad',
    title: 'Arraigo social: vínculos familiares, medios económicos e informe de integración',
    excerpt: 'Cómo decidir qué vía documental corresponde en el arraigo social y qué debe prepararse si existen vínculos familiares o si se necesita informe de integración.',
    tags: ['arraigo social', 'vínculos familiares', 'medios económicos', 'informe de integración', 'residencia'],
    updatedAt: '19 sep 2026',
    readTime: '8 min',
    relatedServiceSlugs: ['arraigo-social'],
    relatedServiceCategories: ['extranjeria-nacionalidad'],
    seoTitle: 'Arraigo social: vínculos, medios e integración | Guía 2026',
    seoDescription: 'Guía sobre las dos vías documentales del arraigo social: vínculos familiares con medios económicos o informe favorable de integración social.',
    body: `
## Por qué esta elección importa

Cumplir los 2 años de permanencia no basta por sí solo. En el arraigo social actual hay que determinar **qué vía documental justifica el arraigo**.

La estrategia depende de la existencia o no de determinados vínculos familiares con personas extranjeras residentes en España.

## Vía 1: vínculos familiares

Pueden ser relevantes determinados vínculos con:

- cónyuge;
- pareja de hecho registrada;
- ascendientes de primer grado;
- descendientes de primer grado;

siempre que la persona familiar sea titular de una autorización de residencia válida y se cumplan los demás requisitos.

No basta con afirmar el parentesco. Hay que documentarlo correctamente.

## Documentos habituales para acreditar el vínculo

Según el caso pueden ser necesarios:

- certificado de matrimonio;
- certificado de pareja registrada;
- certificado de nacimiento;
- documentación de filiación;
- TIE o resolución de residencia del familiar;
- empadronamiento conjunto cuando sea útil para el expediente.

Si los documentos son extranjeros, debe comprobarse si requieren:

- apostilla;
- legalización;
- traducción jurada.

## Medios económicos

Cuando se utiliza la vía familiar, también deben acreditarse medios económicos suficientes.

La hoja informativa oficial del Ministerio establece como referencia general:

- 100 % del IPREM para el familiar residente;
- 100 % adicional del IPREM para la persona solicitante.

Por tanto, la referencia general es el **200 % del IPREM**, con independencia del número total de miembros de la unidad de convivencia.

Antes de presentar conviene revisar:

- origen de los ingresos;
- estabilidad;
- disponibilidad real;
- titularidad;
- documentación bancaria o laboral que los respalda.

## Vía 2: informe favorable de integración social

Si no existen los vínculos familiares previstos, puede utilizarse el **informe favorable de integración social**.

Este informe no lo emite EXPERT.

Lo emite:

- la Comunidad Autónoma competente;
- o, cuando proceda según la organización territorial, el Ayuntamiento del domicilio habitual.

## Qué puede valorar el informe

La regulación permite valorar, entre otros elementos:

- integración en la sociedad española;
- participación en actividades formativas;
- conocimiento de valores constitucionales;
- derechos y deberes;
- conocimiento lingüístico;
- participación en programas de inserción sociolaboral o cultural.

Los criterios concretos pueden variar según la administración competente.

## Cuándo pedir el informe

No conviene esperar al último momento.

Antes de solicitarlo:

1. confirma que realmente necesitas esta vía;
2. revisa el órgano competente en tu municipio/comunidad;
3. comprueba cita y documentación;
4. solicita el informe con margen suficiente;
5. controla su fecha y contenido antes de incorporarlo al expediente.

## Errores frecuentes

- Pedir informe de integración cuando el expediente encaja mejor por vía familiar.
- Aportar parentesco sin demostrar residencia legal del familiar.
- Confundir medios económicos con una simple transferencia aislada.
- Presentar documentos familiares sin apostilla o traducción cuando son exigibles.
- Pensar que el informe de integración sustituye el requisito de 2 años.
- Presentar sin revisar si existe otro procedimiento migratorio incompatible.

## Checklist de decisión

### Vía familiar
- [ ] Existe vínculo familiar previsto legalmente.
- [ ] El familiar tiene residencia válida en España.
- [ ] El vínculo puede documentarse.
- [ ] Hay medios económicos suficientes y acreditables.

### Vía integración
- [ ] No concurren los vínculos familiares previstos.
- [ ] Se cumplen los 2 años.
- [ ] Puede solicitarse informe favorable de integración social.
- [ ] Se conoce el órgano competente.
- [ ] Se dispone del resto de documentación del expediente.

## Fuentes oficiales

- Ministerio de Inclusión — Arraigo social: https://www.inclusion.gob.es/web/migraciones/w/autorizacion-residencia-temporal-por-circunstancias-excepcionales.-arraigo-social
- Real Decreto 1155/2024: https://www.boe.es/eli/es/rd/2024/11/19/1155
    `
  },

  {
    slug: 'permiso-residencia-inicial-vias-y-documentos',
    category: 'extranjeria-nacionalidad',
    title: 'Permiso inicial de residencia: vías disponibles y documentación',
    excerpt: 'Análisis de las principales vías para obtener el primer permiso de residencia en España, con los documentos necesarios para cada una y los plazos reales.',
    tags: ['permiso de residencia', 'arraigo', 'reagrupación familiar', 'TIE', 'EX-10', 'extranjería'],
    updatedAt: '18 may 2026',
    readTime: '11 min',
    relatedServiceSlugs: ['permiso-residencia-inicial'],
    relatedServiceCategories: ['extranjeria-nacionalidad'],
    seoTitle: 'Permiso inicial de residencia en España: vías y documentos',
    seoDescription: 'Guía completa sobre las vías para obtener el primer permiso de residencia en España: arraigo, reagrupación, trabajo y circunstancias excepcionales.',
    body: `
## ¿Qué es el permiso inicial de residencia?

El permiso inicial de residencia —también llamado autorización de residencia temporal— es el primer documento que permite vivir legalmente en España durante un período determinado.

Sin este permiso, la estancia más allá de 90 días (para quienes lo necesiten) es irregular y puede generar sanciones, expulsión y prohibición de entrada.

## Principales vías de acceso

### Arraigo social
Con carácter general, exige **2 años de permanencia continuada** en España y acreditar vínculos familiares con medios económicos suficientes o, si no concurren esos vínculos, un informe favorable de integración social.

### Arraigo laboral
Requiere acreditar **2 años de estancia irregular** y una relación laboral no declarada de al menos 6 meses. El empresario debe regularizar el contrato.

### Arraigo familiar
Para personas con vínculo de primer grado con ciudadanos españoles o con menores españoles. No requiere tiempo mínimo de estancia.

### Reagrupación familiar
Cuando un familiar con residencia legal en España solicita la reunificación.

### Residencia por circunstancias excepcionales
Incluye colaboración con autoridades, protección internacional, trata de seres humanos, violencia de género.

### Visado de larga duración
Tramitado desde el consulado del país de origen: trabajo, estudios, nómada digital, inversión.

## Documentación base para el arraigo social (vía más común)

- Modelo EX-10 cumplimentado.
- Pasaporte en vigor (copia de todas las páginas).
- Fotografía reciente.
- Tasa modelo 790 código 052.
- Documentación que acredite al menos 2 años de permanencia continuada.
- Antecedentes penales de España.
- Antecedentes penales del país de origen (apostillados + traducción jurada).
- Documentación de vínculos familiares y medios económicos o informe favorable de integración social, según la vía.

## La tasa administrativa

Para la mayoría de autorizaciones de residencia temporal, la tasa se paga mediante el **modelo 790 código 052**. El importe varía según el tipo de autorización. El justificante debe conservarse y aportarse junto con la solicitud.

## Plazos reales

El plazo legal de resolución es de **3 meses** desde la presentación. En la práctica, los tiempos varían mucho por provincia: algunas oficinas resuelven en 6–8 semanas, otras tardan 4–6 meses por acumulación de expedientes.

Si la Administración no resuelve en 3 meses, opera el **silencio administrativo negativo**. Esto no significa denegación automática: la solicitud sigue en tramitación, pero abre la vía de recurso si fuera necesario.

## El TIE: el paso final

Una vez resuelta favorablemente la solicitud, hay **30 días hábiles** para solicitar la Tarjeta de Identidad de Extranjero (TIE) en la comisaría de Policía.

Para el TIE se necesita:
- Resolución favorable de Extranjería.
- Pasaporte original.
- Fotografía en color.
- Tasa modelo 790 código 012.
- Cita previa.

El TIE se entrega habitualmente en 30–45 días desde la solicitud.

## Errores más frecuentes

1. Pasaporte caducado o próximo a caducar.
2. Antecedentes del país de origen sin apostillar o sin traducción jurada.
3. Empadronamiento que no refleja 3 años continuados.
4. Contrato de trabajo que no cumple las horas mínimas.
5. Solicitar en la oficina de la provincia incorrecta.
    `
  },
  {
    slug: 'renovacion-residencia-temporal-y-larga-duracion',
    category: 'extranjeria-nacionalidad',
    title: 'Renovación de residencia: plazos, documentos y paso a larga duración',
    excerpt: 'Cuándo y cómo renovar el permiso de residencia temporal, qué documentos necesitas y cómo acceder a la residencia de larga duración tras 5 años.',
    tags: ['renovación residencia', 'larga duración', 'TIE', 'extranjería', 'vida laboral'],
    updatedAt: '18 may 2026',
    readTime: '8 min',
    relatedServiceSlugs: ['renovacion-residencia'],
    relatedServiceCategories: ['extranjeria-nacionalidad'],
    seoTitle: 'Renovación de residencia en España: plazos y documentación',
    seoDescription: 'Guía sobre cómo renovar el permiso de residencia en España, cuándo hacerlo, qué documentos necesitas y cómo pasar a la residencia de larga duración.',
    body: `
## Cuándo presentar la renovación

La renovación puede presentarse dentro de los **60 días previos** a la caducidad del permiso actual. También se acepta hasta **90 días después** de la caducidad, aunque esto puede conllevar sanción leve.

Lo recomendable es iniciar la reunión de documentación **3–4 meses antes** de la fecha de caducidad para evitar imprevistos.

## ¿Qué pasa si caduca mientras espero resolución?

Si presentaste la solicitud en plazo y la Administración no ha resuelto cuando caduca tu permiso actual, tu situación sigue siendo **regular**: el resguardo de presentación de la solicitud lo acredita. Esta prórroga es automática y no requiere trámite adicional.

## Documentación habitual para la renovación

Los documentos más frecuentemente solicitados son:

- **Pasaporte en vigor** con copia de todas las páginas.
- **Certificado de empadronamiento** actualizado.
- **Informe de vida laboral** (TGSS).
- **Nóminas de los últimos 3–6 meses** o documentación de medios económicos.
- **Contrato de trabajo en vigor** o alta como autónomo.
- **Tasa modelo 790 código 052**.
- En algunos casos, certificado de antecedentes penales (si ha transcurrido mucho tiempo desde el anterior).

## De la residencia temporal a la larga duración

Tras **5 años de residencia legal y continuada** en España se puede solicitar la **autorización de residencia de larga duración**. Esta autorización:

- Se concede por tiempo indefinido.
- Permite trabajar por cuenta propia o ajena sin autorización laboral específica.
- Es renovable cada 5 años sin riesgo de denegación si se mantienen los requisitos.

### Requisitos para la larga duración nacional

1. Haber residido legalmente y de forma continuada en España durante los 5 años previos, salvo los demás supuestos específicos previstos por la normativa.
2. Cumplir los requisitos generales del procedimiento (antecedentes, orden público y demás condiciones aplicables al supuesto).

No debe añadirse un requisito general del 150 % del IPREM ni de seguro médico: esos requisitos pertenecen a otras autorizaciones y no forman parte de la regla general de la larga duración nacional.

## Períodos de desempleo y la renovación

Haber estado en situación de desempleo y haber percibido prestación **no impide renovar**. La prestación por desempleo se considera una situación cotizada. Lo importante es demostrar actividad económica legal durante el período de vigencia del permiso anterior.

## Qué pasa si no se renueva a tiempo

- **Multa** por estancia irregular.
- Posible expediente sancionador.
- Pérdida de continuidad del cómputo de años de residencia, lo que puede retrasar la larga duración o la nacionalidad.

## Consejo práctico

Lleva un control activo de las fechas de caducidad. Una renovación presentada con antelación y bien documentada se resuelve sin sobresaltos. Una renovación urgente o tardía genera estrés, posibles sanciones y, en el peor caso, irregularidad sobrevenida.
    `
  },

  // ── Fiscalidad ─────────────────────────────────────────────────────────────
  {
    slug: 'declaracion-renta-irpf-guia',
    category: 'fiscalidad',
    title: 'Declaración de la Renta (IRPF): guía práctica para residentes en España',
    excerpt: 'Todo lo que necesitas saber sobre la campaña de renta: quién está obligado, qué documentos aportar, deducciones habituales y plazos.',
    tags: ['IRPF', 'declaración de la renta', 'deducciones', 'AEAT', 'campaña de renta'],
    updatedAt: '18 may 2026',
    readTime: '9 min',
    relatedServiceSlugs: ['irpf'],
    relatedServiceCategories: ['declaraciones-impuestos'],
    seoTitle: 'Declaración de la Renta IRPF: guía completa | EXPERT Asesoría',
    seoDescription: 'Guía práctica sobre la declaración de la renta en España: quién declara, deducciones, plazos y qué documentos necesitas reunir.',
    body: `
## ¿Quién está obligado a declarar?

Están obligados a presentar el IRPF los contribuyentes que superen los umbrales establecidos por la normativa. Con carácter general, deben declarar quienes:

- Obtienen **rendimientos del trabajo superiores a 22.000 € anuales** de un único pagador (o 15.000 € si hay varios pagadores y el segundo supera 1.500 €).
- Tienen **rendimientos de capital inmobiliario, ganancias patrimoniales o imputaciones** que superen ciertos límites.
- Son **autónomos** con actividad económica, independientemente del importe.
- Quieren recuperar **retenciones** o aplicar deducciones que generen resultado a devolver.

Aunque no estés obligado, en muchos casos interesa declarar para obtener la devolución de retenciones.

## Campaña de renta: plazos habituales

| Modalidad | Plazo habitual |
|---|---|
| Presentación online (con resultado a ingresar con domiciliación) | Hasta finales de junio |
| Presentación online (a devolver o sin ingreso) | Desde abril hasta finales de junio |
| Con resultado a ingresar fraccionado | Primera parte hasta finales de junio |

La campaña de IRPF arranca habitualmente en **abril** y cierra a finales de **junio**. No esperes al último momento: el volumen de solicitudes en las últimas semanas puede retrasar las gestiones.

## Documentos que necesitas reunir

Antes de empezar conviene tener:

- **DNI o NIE** en vigor.
- **Número de referencia AEAT** (o Cl@ve) para acceder al borrador.
- **Certificados de retenciones** de todos los pagadores (empresa, pensión, SEPE...).
- **Datos de inmuebles** en propiedad o alquiler: referencia catastral, valor catastral, porcentaje de titularidad, días de alquiler.
- **Préstamos hipotecarios**: certificado de intereses pagados (si deducible por antigüedad del préstamo).
- **Datos de inversiones**: fondos, acciones, depósitos — ganancias y pérdidas patrimoniales.
- **Aportaciones a planes de pensiones**.
- **Donaciones** a ONG o partidos (si aplicas deducción).
- **Certificado de rendimientos del extranjero** si has trabajado fuera de España.

## Deducciones más habituales

Las deducciones reducen la cuota a pagar o aumentan la devolución:

- **Deducción por vivienda habitual**: solo para hipotecas anteriores a 2013.
- **Deducción por planes de pensiones**: reducen la base imponible hasta ciertos límites.
- **Deducción por maternidad**: para madres trabajadoras con hijos menores de 3 años.
- **Deducción por familia numerosa o personas con discapacidad**.
- **Deducciones autonómicas**: cada comunidad tiene las suyas (alquiler, nacimiento de hijo, compra de libros de texto...).
- **Deducción por donativos**: 80 % de los primeros 250 € y 35 % o 40 % del resto.

## El borrador de Hacienda: ¿siempre es correcto?

El borrador que prepara la AEAT parte de los datos que ya tiene. Puede no incluir:

- Inmuebles en alquiler.
- Actividades económicas.
- Ganancias y pérdidas de inversiones.
- Rendimientos en el extranjero.
- Deducciones a las que tienes derecho pero Hacienda no conoce.

Confirmar el borrador sin revisarlo puede suponer pagar más de lo que corresponde o no obtener la devolución que te pertenece.

## Resultado de la declaración

La declaración puede salir:

- **A devolver**: Hacienda te ingresa el importe en tu cuenta.
- **A ingresar**: debes pagar. Puedes domiciliar el pago hasta finales de junio o fraccionarlo en dos pagos.
- **Sin resultado**: declaración informativa sin ingreso ni devolución.

## Declaración conjunta o individual

Si estás casado, puedes optar por declaración individual o conjunta. La conjunta aplica una reducción de 3.400 € en la base imponible, pero suma todos los ingresos. Conviene calcular ambas opciones antes de elegir.
    `
  },
  {
    slug: 'regimen-beckham-modelo-151-guia',
    category: 'fiscalidad',
    title: 'Régimen Beckham (Modelo 151): quién puede acogerse y cómo funciona',
    excerpt: 'Guía técnica sobre el régimen especial de impatriados: requisitos de acceso, Modelo 149, tributación especial y diferencias con el IRPF ordinario.',
    tags: ['Modelo 151', 'Régimen Beckham', 'impatriados', 'expatriados', 'Modelo 149'],
    updatedAt: '18 may 2026',
    readTime: '10 min',
    relatedServiceSlugs: ['modelo-151'],
    relatedServiceCategories: ['declaraciones-impuestos'],
    seoTitle: 'Régimen Beckham y Modelo 151: guía completa | EXPERT Asesoría',
    seoDescription: 'Todo sobre el régimen especial de impatriados: quién puede acogerse, cómo solicitar la opción, tributación aplicable y diferencias con el IRPF ordinario.',
    body: `
## ¿Qué es el régimen especial de impatriados?

El régimen especial de impatriados (popularmente llamado **Ley Beckham**) aplica reglas especiales de tributación a determinados contribuyentes que se desplazan a España y cumplen los requisitos del artículo 93 LIRPF. Para los rendimientos sujetos a la escala especial, el 24 % se aplica hasta 600.000 € y el 47 % sobre el exceso; antes de informar o calcular hay que revisar la causa del desplazamiento y el supuesto concreto.

La declaración anual se presenta mediante el **Modelo 151**, distinto del Modelo 100 que usan los residentes ordinarios.

## Requisitos para acogerse

Para aplicar el régimen hay que verificar **todos** los requisitos vigentes del supuesto concreto, entre ellos la residencia previa y la causa legal del desplazamiento:

- **No haber sido residente fiscal en España** durante los 5 años anteriores al desplazamiento.
- Comprobar si el desplazamiento encaja en alguno de los supuestos actualmente admitidos por la norma (laboral, determinados administradores, actividad emprendedora/profesional o teletrabajo internacional, entre otros casos previstos).
- Revisar además los requisitos específicos del supuesto y la documentación que exige la AEAT.

## Cómo solicitar la opción al régimen

La solicitud se presenta mediante el **Modelo 149** ante la AEAT, dentro del plazo de **6 meses** desde la fecha de inicio de la actividad en España (alta en Seguridad Social o inicio del contrato).

Este es un plazo crítico: si se presenta fuera de plazo, el régimen no puede aplicarse.

## Tipo impositivo y bases

| Base imponible | Tipo aplicable |
|---|---|
| Hasta 600.000 € | 24 % |
| Exceso sobre 600.000 € | 47 % |

La determinación de las rentas sometidas a gravamen sigue las reglas especiales del artículo 93 LIRPF y, en lo no previsto, las reglas del IRNR aplicables al régimen. No debe concluirse que una renta extranjera está exenta únicamente por su localización: hay que clasificar el tipo de renta y aplicar las especialidades correspondientes.

## Duración del régimen

El régimen se aplica durante el **año del desplazamiento y los 5 siguientes** (6 años en total). No es prorrogable si se cumplen los requisitos ordinarios.

## ¿Cuándo conviene acogerse?

No siempre resulta más ventajoso que el IRPF ordinario. La escala especial puede resultar más favorable cuando:

- Los rendimientos del trabajo son elevados (superan los tramos altos del IRPF).
- La estructura de rentas y patrimonio hace que las reglas especiales del régimen resulten favorables frente al IRPF ordinario, tras revisar cada fuente de renta.
- No se aplican deducciones personales significativas (hipoteca, hijos, etc.).

Si los ingresos son moderados o hay muchas deducciones personales, el IRPF ordinario puede resultar más beneficioso. **Es imprescindible calcular ambas opciones antes de decidir**.

## Diferencias clave con el IRPF ordinario

| Aspecto | Régimen Beckham | IRPF ordinario |
|---|---|---|
| Tipo impositivo | 24 % (fijo hasta 600.000 €) | 19 %–47 % (progresivo) |
| Rentas extranjeras | Según reglas especiales del art. 93/IRNR y tipo de renta | Tributación mundial con reglas ordinarias |
| Modelo de declaración | Modelo 151 | Modelo 100 |
| Duración | Hasta 6 años | Indefinido |
| Reducción por trabajo | No aplica | Sí aplica |

## Obligaciones durante el régimen

Mientras se esté bajo el régimen Beckham:

- Se presenta el **Modelo 151** anualmente en lugar del Modelo 100.
- Las retenciones a cuenta son del 24 % (no el tipo marginal).
- La inclusión de rentas se determina conforme a las reglas especiales del régimen y al tipo concreto de renta.
- El contribuyente acogido al régimen especial del artículo 93 no está obligado a presentar el **Modelo 720** por bienes y derechos en el extranjero; la situación de cónyuge u otros familiares se analiza separadamente.

## Causas de exclusión del régimen

Se pierde el derecho al régimen si:

- Se deja de cumplir alguno de los requisitos de acceso.
- Se renuncia expresamente al régimen.
- Se obtiene la residencia habitual en otro país.
    `
  },
  {
    slug: 'irnr-no-residentes-guia',
    category: 'fiscalidad',
    title: 'IRNR (No Residentes): obligaciones fiscales en España',
    excerpt: 'Guía sobre el Impuesto sobre la Renta de No Residentes: quién debe declarar, qué modelos se usan, plazos y cómo evitar la doble imposición.',
    tags: ['IRNR', 'no residentes', 'Modelo 210', 'bienes en España', 'doble imposición'],
    updatedAt: '18 may 2026',
    readTime: '9 min',
    relatedServiceSlugs: ['no-residentes'],
    relatedServiceCategories: ['declaraciones-impuestos'],
    seoTitle: 'IRNR — No Residentes en España: modelos, plazos y obligaciones',
    seoDescription: 'Guía del Impuesto sobre la Renta de No Residentes (IRNR): quién declara, Modelos 210, 211 y 213, plazos y convenios de doble imposición.',
    body: `
## ¿Quién es no residente fiscal en España?

Eres no residente fiscal en España si **no cumples ninguno** de los criterios de residencia fiscal española:

- No permaneces más de 183 días en España durante el año natural.
- Tu centro de intereses económicos no está en España.
- Tu cónyuge e hijos menores no residen habitualmente en España.

Si eres no residente pero tienes bienes, rentas o inversiones en España, tributan en España mediante el **Impuesto sobre la Renta de No Residentes (IRNR)**.

## ¿Qué rentas deben declararse?

Las rentas que deben declararse en España como no residente incluyen:

- **Alquileres de inmuebles** situados en España.
- **Imputación de rentas** por inmuebles en España que no se alquilan (entre el 1,1 % y el 2 % del valor catastral).
- **Dividendos y rendimientos de capital** de fuente española.
- **Ganancias patrimoniales** por venta de inmuebles u otros bienes en España.
- **Rendimientos del trabajo** obtenidos en España.

## Modelos y plazos

### Modelo 210 — El más habitual
Se usa para la mayoría de rentas obtenidas por no residentes:

- **Alquileres**: desde 2026 el plazo depende de si se agrupan las rentas del año o se presentan separadamente y de la fecha de devengo. Debe consultarse la transición de la Orden HAC/623/2026 antes de presentar.
- **Imputación de rentas**: el plazo también fue modificado por la Orden HAC/623/2026; para 2026 debe resolverse con la regla transitoria aplicable.
- **Ganancias patrimoniales por venta de inmueble**: dentro de los 3 meses siguientes a la transmisión.

### Modelo 211 — Retención por compraventa de inmueble
Cuando un residente compra un inmueble a un no residente, el comprador está obligado a retener el **3 %** del precio de venta e ingresarlo en Hacienda mediante el Modelo 211. El vendedor no residente puede recuperar el exceso mediante el Modelo 210.

### Modelo 213 — Gravamen especial sobre inmuebles de entidades no residentes
Se aplica a entidades (no personas físicas) no residentes que poseen inmuebles en España.

## Tipo impositivo

| Tipo de renta | Residentes UE/EEE | Resto del mundo |
|---|---|---|
| Rentas generales | 19 % | 24 % |
| Dividendos y similares | 19 % | 19 % |
| Ganancias patrimoniales | 19 % | 19 % |

## Convenios de doble imposición

España tiene convenios con más de 90 países para evitar que las mismas rentas tributen dos veces. El convenio puede reducir o eliminar la tributación en España dependiendo del tipo de renta.

Para aplicar un convenio es necesario aportar un **certificado de residencia fiscal** expedido por las autoridades del otro país.

## Representante fiscal

Si eres no residente **fuera de la UE/EEE** y tienes propiedades o rentas en España, la normativa española puede obligarte a designar un **representante fiscal** en España ante la AEAT.

## Obligación de declarar aunque no haya ingreso

Un error frecuente es pensar que si no se cobra alquiler no hay que declarar. Sin embargo, los **inmuebles en España que no se alquilan** generan igualmente una imputación de rentas que debe declararse anualmente mediante el Modelo 210.
    `
  },

  // ── Trámites especializados ────────────────────────────────────────────────
  {
    slug: 'certificado-digital-camerfirma-guia',
    category: 'tramites',
    title: 'Certificado digital Camerfirma: tipos, usos y cómo obtenerlo',
    excerpt: 'Guía sobre los certificados digitales Camerfirma: diferencias entre persona física y entidad, para qué sirven, cómo se obtienen y qué necesitas para solicitarlo.',
    tags: ['certificado digital', 'Camerfirma', 'firma electrónica', 'AEAT', 'Seguridad Social'],
    updatedAt: '18 may 2026',
    readTime: '8 min',
    relatedServiceSlugs: ['certificado-digital-persona-fisica', 'certificado-digital-entidad', 'pack-certificados-digitales'],
    relatedServiceCategories: ['certificado-digital'],
    seoTitle: 'Certificado digital Camerfirma: guía completa | EXPERT Asesoría',
    seoDescription: 'Cómo obtener el certificado digital Camerfirma para persona física o entidad. Diferencias, usos, proceso y documentación necesaria.',
    body: `
## ¿Para qué sirve el certificado digital?

El certificado digital es un fichero electrónico que identifica de forma segura a una persona física o jurídica en el entorno digital. Es **imprescindible** para:

- Presentar declaraciones y recursos ante la **AEAT** (Hacienda).
- Acceder al **Sistema RED** de la Seguridad Social.
- Realizar trámites en la **sede electrónica** de cualquier Administración Pública.
- Firmar documentos y contratos con **plena validez legal**.
- Acceder al sistema **Cl@ve** y otros servicios digitales del Estado.
- Realizar trámites notariales y registrales de forma electrónica.

## ¿Qué es Camerfirma?

Camerfirma es una **Autoridad de Certificación española acreditada**, perteneciente a las Cámaras de Comercio de España. Sus certificados son reconocidos por todas las Administraciones Públicas españolas y por organismos europeos.

En EXPERT tramitamos certificados Camerfirma y gestionamos la identificación y verificación necesarias para la emisión. Para las modalidades comercializadas por EXPERT, el proceso se realiza online sin necesidad de acudir a una oficina pública.

## Tipos de certificado

### Persona física
Identifica a un individuo en sus relaciones personales y profesionales. Válido para cualquier persona física, incluyendo autónomos que actúan en nombre propio.

**Precio EXPERT: 90 € + IVA** | **Vigencia de la modalidad comercializada: 5 años**

### Entidad (persona jurídica)
Identifica a la organización (empresa, asociación, fundación, comunidad de propietarios...) y permite actuar y firmar en nombre de ella.

**Precio EXPERT: 150 € + IVA** | **Vigencia de la modalidad comercializada: 2 años**

## Diferencias clave

| Aspecto | Persona física | Entidad |
|---|---|---|
| Identifica a | El individuo | La organización |
| Firma en nombre de | Sí mismo | La entidad |
| Documentación | DNI/NIE | CIF + escrituras + DNI del representante |
| Tiempo de tramitación EXPERT | Máximo 24 h laborables desde documentación e identidad validadas | Máximo 24 h laborables desde expediente completo y representante/facultades validados |
| Precio | 90 € | 150 € |

## Documentación necesaria

**Para persona física:**
- DNI o NIE original en vigor.
- Email activo al que tengas acceso durante la sesión.

**Para entidad:**
- CIF de la entidad.
- Escrituras de constitución o estatutos vigentes.
- Poderes de representación (si el solicitante no es administrador único).
- DNI o NIE del representante legal.
- Email corporativo activo.

## Proceso de obtención

1. **Solicitud**: tramitamos la solicitud en el sistema de Camerfirma.
2. **Verificación de identidad**: online en nuestras instalaciones o por videoconferencia (eIDAS).
3. **Tramitación**: en los servicios EXPERT de persona física, entidad mercantil y pack, el plazo máximo es de 24 horas laborables desde que la documentación está completa y la identidad/facultades han quedado validadas.
4. **Instalación**: te ayudamos a instalarlo y configurarlo en tu equipo.
5. **Prueba**: verificamos que funciona correctamente antes de terminar.

## Validez y renovación

La vigencia depende de la modalidad concreta. En el catálogo EXPERT, la modalidad de persona física se ofrece con **5 años** de vigencia y la modalidad de entidad con **2 años**.

Si el certificado caduca sin renovar, es necesario obtener uno nuevo con el mismo proceso de verificación de identidad.

## ¿Debo ir presencialmente?

**Para persona física**: no es necesario desplazarte. La verificación se puede hacer por videoconferencia. Solo necesitas conexión a internet y tu DNI/NIE.

**Para entidad**: el representante legal debe verificar su identidad (también se puede hacer por videoconferencia). Sí es necesario enviar previamente la documentación de la empresa por email para la verificación documental.
    `
  },

  {
    slug: 'certificado-digital-persona-fisica-documentacion-instalacion',
    category: 'tramites',
    title: 'Certificado digital de persona física: documentos, instalación y uso',
    excerpt: 'Qué debes preparar antes de la cita, cómo se instala el certificado Camerfirma y qué revisar para empezar a usarlo correctamente.',
    tags: ['certificado digital persona física', 'Camerfirma', 'DNI', 'TIE', 'instalación certificado'],
    updatedAt: '19 sep 2026',
    readTime: '7 min',
    relatedServiceSlugs: ['certificado-digital-persona-fisica', 'pack-certificados-digitales'],
    relatedServiceCategories: ['certificado-digital'],
    seoTitle: 'Certificado digital persona física: documentos e instalación | EXPERT',
    seoDescription: 'Checklist para obtener e instalar el certificado digital Camerfirma de persona física: documentación, equipo, copia de seguridad y primeros usos.',
    body: `
## Qué debes preparar

Para la modalidad de persona física que tramita EXPERT conviene tener preparado:

- DNI o TIE en vigor, por ambas caras.
- Domicilio completo.
- Un ordenador Windows o macOS en el que quieras instalar el certificado.
- Acceso al correo electrónico que utilices durante el proceso.

## Verificación de identidad

En los servicios EXPERT incluidos en el catálogo de lanzamiento, la identificación y validación se realizan de forma remota dentro del proceso Camerfirma. No es necesario acudir físicamente a una oficina.

## Instalación

Una vez emitido:

1. instalamos el certificado en el equipo elegido;
2. verificamos que el navegador y el sistema lo reconozcan;
3. hacemos una prueba de acceso o firma cuando procede;
4. explicamos cómo conservar una copia de seguridad.

## Copia de seguridad

La copia de seguridad es especialmente importante en certificados software.

Guárdala:
- en un soporte seguro;
- protegida con contraseña;
- fuera del equipo principal cuando sea posible.

No envíes el fichero del certificado ni su contraseña por mensajería insegura.

## Usos habituales

- identificarte ante AEAT;
- realizar trámites con Seguridad Social;
- presentar escritos y solicitudes;
- firmar documentos;
- acceder a sedes electrónicas compatibles.

## Vigencia del servicio EXPERT

La modalidad de persona física comercializada por EXPERT tiene una vigencia de **5 años**.

La renovación o nueva emisión al finalizar la vigencia se contrata aparte.

## Fuente

Camerfirma — certificados digitales:
https://www.camerfirma.com/new-certificados-digitales/
    `
  },
  {
    slug: 'certificado-digital-persona-fisica-seguridad-copia-renovacion',
    category: 'tramites',
    title: 'Cómo proteger tu certificado digital personal: copia, contraseña y renovación',
    excerpt: 'Buenas prácticas para guardar, usar y renovar un certificado digital de persona física sin perder acceso ni comprometer tus claves.',
    tags: ['seguridad certificado digital', 'copia seguridad', 'renovación certificado', 'firma electrónica'],
    updatedAt: '19 sep 2026',
    readTime: '6 min',
    relatedServiceSlugs: ['certificado-digital-persona-fisica'],
    relatedServiceCategories: ['certificado-digital'],
    seoTitle: 'Seguridad del certificado digital: copia y renovación | EXPERT',
    seoDescription: 'Cómo proteger un certificado digital personal: copia segura, contraseña, cambio de equipo, pérdida y renovación.',
    body: `
## El certificado es una credencial sensible

Un certificado digital permite identificarte y firmar electrónicamente. Debe tratarse como una credencial de alto valor.

Nunca compartas el fichero, su contraseña ni las claves privadas.

## Copia de seguridad recomendada

1. crea una copia exportable protegida por contraseña;
2. guárdala en un soporte seguro;
3. evita carpetas compartidas;
4. no la envíes por email sin protección;
5. conserva la contraseña en un gestor seguro.

## Si cambias de ordenador

Exporta y prueba la copia antes de borrar o sustituir el equipo antiguo.

## Si pierdes el certificado

Si existe riesgo de acceso no autorizado hay que valorar la revocación. No sigas utilizando una credencial si no puedes garantizar el control de su clave privada.

## Renovación

La modalidad de persona física comercializada por EXPERT tiene una vigencia de **5 años**. Conviene iniciar la revisión antes del vencimiento para evitar interrupciones.

## Fuente

Camerfirma — certificados digitales:
https://www.camerfirma.com/new-certificados-digitales/
    `
  },
  {
    slug: 'certificado-digital-entidad-documentos-representante',
    category: 'tramites',
    title: 'Certificado digital de entidad: documentación del representante y de la organización',
    excerpt: 'Checklist para preparar la documentación de una sociedad, asociación u otra entidad y acreditar correctamente las facultades del representante.',
    tags: ['certificado digital entidad', 'representante legal', 'Camerfirma', 'empresa', 'poderes'],
    updatedAt: '19 sep 2026',
    readTime: '8 min',
    relatedServiceSlugs: ['certificado-digital-entidad', 'pack-certificados-digitales'],
    relatedServiceCategories: ['certificado-digital'],
    seoTitle: 'Certificado digital de entidad: documentos del representante | EXPERT',
    seoDescription: 'Qué documentos necesita una entidad y su representante para tramitar un certificado digital Camerfirma con EXPERT.',
    body: `
## Dos bloques de documentación

En un certificado vinculado a una organización hay que verificar la identidad de la persona que actúa y la existencia de la entidad y sus facultades de representación.

## Documentación del representante

Normalmente se revisa:

- DNI o TIE en vigor;
- datos de contacto;
- cargo o condición en la que actúa.

## Documentación de la entidad

Según el tipo de organización pueden ser necesarios:

- CIF/NIF de la entidad;
- escritura de constitución;
- nota o certificación registral;
- estatutos;
- acta de nombramiento;
- escritura de poder;
- documento acreditativo de facultades.

## Representante legal y apoderado no son lo mismo

Camerfirma distingue certificados y figuras según las facultades del titular. EXPERT revisa tipo de entidad, cargo, poderes y uso previsto antes de emitir.

## Vigencia

La modalidad de entidad comercializada por EXPERT tiene una vigencia de **2 años**.

## Fuentes

Camerfirma — certificados para empresas:
https://www.camerfirma.com/certificados-digitales-empresas/

Camerfirma — representante legal:
https://www.camerfirma.com/certificado-cualificado-de-representacion/
    `
  },
  {
    slug: 'certificado-digital-entidad-tipos-usos-seguridad',
    category: 'tramites',
    title: 'Certificados digitales para empresa: representación, corporativo y sello electrónico',
    excerpt: 'Cómo distinguir entre certificado de representante, certificado corporativo y sello electrónico antes de contratar una modalidad para tu organización.',
    tags: ['certificado empresa', 'representante legal', 'certificado corporativo', 'sello electrónico', 'Camerfirma'],
    updatedAt: '19 sep 2026',
    readTime: '8 min',
    relatedServiceSlugs: ['certificado-digital-entidad'],
    relatedServiceCategories: ['certificado-digital'],
    seoTitle: 'Certificados digitales para empresa: tipos y diferencias | EXPERT',
    seoDescription: 'Diferencias entre certificado de representante, corporativo y sello electrónico y cómo elegir la modalidad adecuada para una entidad.',
    body: `
## No todos los certificados de empresa son equivalentes

Camerfirma comercializa distintas figuras para organizaciones. Elegir la correcta depende de quién firma y con qué facultades.

## Certificado de representante

Está orientado a personas físicas con facultades para representar legalmente a la organización.

## Certificado corporativo

Acredita la pertenencia de una persona a una organización. Camerfirma indica que el corporativo no otorga por sí mismo poderes generales de representación.

## Sello electrónico

El sello electrónico se utiliza para identificar a la entidad en determinados procesos o documentos automatizados y no equivale a la firma personal de un representante.

## Antes de contratar

Conviene definir:
- quién utilizará el certificado;
- si debe actuar ante Administraciones Públicas;
- si debe firmar contratos en nombre de la entidad;
- si se trata de un empleado sin poderes;
- si se necesita automatización;
- qué facultades constan en los poderes.

## Vigencia

La modalidad de entidad comercializada por EXPERT tiene una vigencia de **2 años**.

## Fuentes

Camerfirma — certificados para empresas:
https://www.camerfirma.com/certificados-digitales-empresas/

Camerfirma — certificado corporativo:
https://www.camerfirma.com/certificados-digitales/certificado-digital-cualificado-corporativo/

Camerfirma — sello electrónico:
https://www.camerfirma.com/certificado-sello-electronico-digital/
    `
  },

  {
    slug: 'pack-certificados-digitales-checklist',
    category: 'tramites',
    title: 'Pack de certificados digitales: checklist completo antes de contratar',
    excerpt: 'Qué necesita preparar un administrador o representante para tramitar online su certificado personal y el de la entidad en un único pedido.',
    tags: ['pack certificados digitales', 'Camerfirma', 'administrador', 'representante legal', 'empresa'],
    updatedAt: '19 sep 2026',
    readTime: '7 min',
    relatedServiceSlugs: ['pack-certificados-digitales'],
    relatedServiceCategories: ['certificado-digital'],
    seoTitle: 'Pack certificados digitales: checklist persona + empresa | EXPERT',
    seoDescription: 'Checklist del pack Camerfirma de EXPERT: certificado personal + entidad por 200 € + IVA, documentación, entidad vinculada, identificación online y plazo.',
    body: `
## Antes de empezar

El pack reúne dos certificados distintos:

- certificado de persona física del titular/representante;
- certificado de la entidad mercantil seleccionada.

Se contratan juntos, pero cada certificado mantiene su propia identidad y función.

## Datos personales

Prepara:

- DNI o TIE en vigor;
- domicilio completo;
- teléfono y correo de contacto;
- equipo en el que se instalarán los certificados.

## Datos de la entidad

La empresa debe estar vinculada a tu cuenta EXPERT.

Revisa:

- razón social;
- NIF/CIF;
- domicilio fiscal;
- forma jurídica;
- datos registrales.

## Documentación societaria

Según el caso pueden ser necesarios:

- escritura de constitución;
- nota mercantil actualizada;
- nombramiento de administrador;
- poder notarial;
- documentación equivalente que permita comprobar la representación.

## Identificación

La tramitación con EXPERT se realiza **100 % online**.

EXPERT gestiona la tramitación dentro del proceso Camerfirma y realiza la identificación y validación remotas necesarias para la emisión.

## Cuándo empieza el plazo de 24 horas

El plazo máximo de 24 horas laborables **no empieza al pagar**.

Empieza cuando:

1. la documentación personal está completa;
2. la documentación de la entidad está completa;
3. la identidad está validada;
4. las facultades de representación están verificadas.

## Precio

- Persona física: 90 € + IVA.
- Entidad: 150 € + IVA.
- Total por separado: 240 € + IVA.
- Pack: **200 € + IVA**.
- Ahorro: **40 €**.

## Después del pago

EXPERT crea un expediente del pack con dos entregables:

1. certificado personal;
2. certificado de entidad.

Ambos se gestionan dentro del mismo pedido, manteniendo trazabilidad separada.

## Vigencia

- persona física: modalidad EXPERT de 5 años;
- entidad: modalidad EXPERT de 2 años.

## Fuente

Camerfirma — certificados digitales:
https://www.camerfirma.com/new-certificados-digitales/

Camerfirma — representante legal:
https://www.camerfirma.com/certificado-cualificado-de-representacion/
    `
  },

  // ── Empresas ───────────────────────────────────────────────────────────────
  {
    slug: 'alta-autonomo-guia-completa',
    category: 'empresas',
    title: 'Alta de autónomo en España: todo lo que debes tramitar',
    excerpt: 'Guía completa sobre el alta de autónomo: pasos en Hacienda y la Seguridad Social, epígrafes del IAE, cuota y obligaciones fiscales desde el primer día.',
    tags: ['alta autónomo', 'RETA', 'Hacienda', 'IAE', 'tarifa plana', 'Modelo 036'],
    updatedAt: '18 may 2026',
    readTime: '9 min',
    relatedServiceSlugs: ['alta-autonomo'],
    relatedServiceCategories: ['empresas-autonomos'],
    seoTitle: 'Alta de autónomo en España: guía completa de trámites',
    seoDescription: 'Cómo darse de alta como autónomo en España: Modelo 036, RETA, elección de epígrafe, cotización 2026 y obligaciones fiscales del primer año.',
    body: `
## ¿Cuándo hay que darse de alta?

En España, debes darte de alta como autónomo **antes de comenzar a ejercer cualquier actividad económica habitual**. Emitir una factura sin estar dado de alta puede generar sanciones de la AEAT y de la Seguridad Social.

## Paso 1: Alta en Hacienda (Modelo 036)

El primer trámite es comunicar a la AEAT el inicio de actividad mediante el **Modelo 036**. El Modelo 037 quedó suprimido con efectos de 3 de febrero de 2025 y su simplificación se integró en las herramientas del Modelo 036.

En este modelo indicarás:

- **Epígrafe del IAE** (Impuesto sobre Actividades Económicas): clasifica la actividad que vas a realizar. Determina el tipo de IVA aplicable y algunas obligaciones específicas.
- **Régimen de IVA**: general, simplificado, recargo de equivalencia o exento según la actividad.
- **Fecha de inicio de la actividad**.
- **Domicilio fiscal**.

### ¿Qué epígrafe elegir?

El epígrafe debe reflejar lo más exactamente posible la actividad que realizarás. Elegir un epígrafe incorrecto puede afectar al tipo de IVA aplicable o a deducciones específicas. En caso de duda, consultar antes de presentar el modelo.

## Paso 2: Alta en la Seguridad Social (RETA)

El **Régimen Especial de Trabajadores Autónomos (RETA)** debe tramitarse en la Seguridad Social, antes de iniciar la actividad o, como máximo, el primer día del mes en que comienzas.

En este trámite elegirás tu **base de cotización**, que determina:

- La **cuota mensual** a pagar.
- Las **prestaciones** a las que tendrás derecho (enfermedad, accidente, jubilación).

## Cotización de autónomos en 2026

En 2026 sigue vigente el sistema de cotización por **rendimientos netos**, con una tabla reducida y una tabla general de bases mínimas y máximas. La base que puedes elegir depende del tramo de rendimientos previsto y puede modificarse, dentro de los periodos habilitados, si cambian tus previsiones.

No usamos una cuota fija genérica: antes del alta comprobamos el tramo 2026, la base elegida y los tipos vigentes. La cifra de **80 €/mes** correspondía a la cuota reducida fijada expresamente para **2023–2025**; para un alta en 2026 debe verificarse la cuantía oficial vigente y si se cumplen los requisitos del beneficio.

## Obligaciones fiscales desde el primer día

Como autónomo en régimen general, tus obligaciones trimestrales son:

- **Modelo 303** (IVA trimestral): diferencia entre IVA repercutido y soportado.
- **Modelo 130** (IRPF trimestral): pago fraccionado a cuenta del IRPF.
- Si tienes empleados: **Modelo 111** (retenciones IRPF empleados) y **Modelo 115** (retenciones alquileres).

Anualmente pueden resultar aplicables, entre otros:

- **Modelo 390**: resumen anual de IVA, cuando no exista exoneración.
- **Modelo 190**: resumen anual de retenciones de trabajo y determinadas actividades.
- **Modelo 100**: declaración anual de IRPF.

Los vencimientos exactos se verifican en el calendario AEAT del ejercicio correspondiente.

## Errores frecuentes en el alta

1. **Epígrafe del IAE incorrecto**: afecta al tipo de IVA y a deducciones.
2. **Alta en el RETA fuera de plazo**: puede generar recargos.
3. **Base de cotización mal calculada**: conviene revisar los rendimientos reales esperados.
4. **No solicitar la tarifa plana**: es opcional, hay que pedirla expresamente.
5. **No informar al banco**: conviene actualizar datos para domiciliar la cuota.

## ¿Qué documentos se generan?

Tras el alta recibirás:

- **Resolución de alta en el RETA** con tu número de afiliación.
- **Confirmación del alta censal** de Hacienda.
- **CCC (Código de Cuenta de Cotización)** si vas a tener empleados.
    `
  },

  // ── Holded ─────────────────────────────────────────────────────────────────
  {
    slug: 'novedades-holded-2026-verifactu-wallet-tpv',
    category: 'holded',
    title: 'Novedades de Holded 2026: Verifactu, Holded Wallet y TPV',
    excerpt:
      'Qué ha cambiado en Holded en 2026: la obligación de Verifactu y sus plazos reales, la nueva cuenta integrada Holded Wallet, el TPV para tienda física y las mejoras de gestión de equipo.',
    tags: ['Holded', 'Verifactu', 'Holded Wallet', 'TPV Holded', 'facturación electrónica', 'AEAT'],
    updatedAt: '10 jul 2026',
    readTime: '9 min',
    relatedServiceSlugs: ['holded-pack-starter', 'holded-migracion-sin-inventario', 'holded-migracion-con-inventario'],
    relatedServiceCategories: ['holded'],
    seoTitle: 'Novedades de Holded 2026: Verifactu, Wallet y TPV | EXPERT',
    seoDescription:
      'Guía actualizada de las novedades de Holded en 2026: plazos reales de Verifactu, Holded Wallet, TPV para tienda física y mejoras de nómina y conciliación.',
    body: `
## Verifactu: la novedad que más preguntas genera

Verifactu es el sistema de la AEAT para verificar facturas en tiempo real y luchar contra el fraude fiscal. Obliga a que los programas de facturación generen, para cada factura, un registro inalterable con hash y firma electrónica, además de un código QR de verificación y la leyenda **"VERI*FACTU"**, para que cualquier receptor pueda comprobar su autenticidad directamente con la AEAT.

**Plazos reales** (no confundir con la fecha de aprobación del reglamento):

- **1 de enero de 2027**: fecha límite para empresas sujetas al Impuesto de Sociedades.
- **1 de julio de 2027**: fecha límite para autónomos, pymes y el resto de contribuyentes.

Holded ya es **colaborador social de la AEAT** para Verifactu y su software cumple los requisitos técnicos del reglamento, por lo que no hace falta ningún cambio de proveedor: el cumplimiento se activa dentro de la propia cuenta.

## Holded Wallet: cuenta de empresa integrada

Holded Wallet es una cuenta bancaria de empresa integrada directamente en la plataforma: permite cobrar con tarjeta y gestionar cobros y pagos sin salir de Holded, con conciliación automática de las facturas asociadas a cada movimiento. Reduce el paso manual de cruzar el banco con la contabilidad que antes había que hacer aparte.

## TPV para tienda física

El TPV de Holded, pensado para tablets, permite gestionar caja, productos y almacenes desde el propio punto de venta. Cada venta registrada en el TPV se refleja automáticamente en la contabilidad y actualiza el stock en tiempo real — relevante sobre todo para quienes ya tienen el módulo de inventario migrado.

## Otras mejoras recientes de producto

- **Nómina colaborativa**: cálculo automático de bruto, neto y retenciones directamente en la plataforma, con generación de PDF y asiento contable.
- **Conciliación de facturas mejorada**: vincular movimientos bancarios a facturas desde una sola vista, sin salir del documento.
- **Gestión de equipo y organigrama**: estructura de la empresa visible de un vistazo, con fichaje y gestión de ausencias centralizados.

## Qué significa esto si estás migrando o ya tienes Holded

Ninguna de estas novedades obliga a rehacer nada si tu cuenta está bien configurada. Verifactu es la que exige más atención por su componente legal — conviene confirmar antes de los plazos indicados que la facturación de tu cuenta ya cumple el reglamento. Holded Wallet y el TPV son opcionales y se activan cuando los necesitas, no cambian el funcionamiento del resto de la cuenta.

Si vienes de otro sistema y no tienes claro cómo queda tu cuenta respecto a estas novedades, es uno de los puntos que revisamos en el onboarding incluido en nuestros servicios de migración e implantación.

---

**Fuentes oficiales**: [Holded — Verifactu](https://www.holded.com/verifactu-invoicing-software) · [Holded — colaborador social AEAT para Verifactu](https://www.holded.com/es/blog/colaborador-social-verifactu-aeat) · [Novedades de producto — news.holded.com](https://news.holded.com/)
    `
  },
  {
    slug: 'holded-conector-claude-ia-que-puede-hacer',
    category: 'holded',
    title: 'Conector Claude para Holded: qué puede hacer la IA con tu cuenta',
    excerpt:
      'Guía técnica del conector MCP de Holded con Claude: qué acciones puede hacer la IA (facturas, contactos, stock, tesorería), cómo funciona la autorización y el modelo de permisos.',
    tags: ['Holded', 'Claude', 'IA', 'MCP', 'conector Holded', 'automatización'],
    updatedAt: '10 jul 2026',
    readTime: '7 min',
    relatedServiceSlugs: ['holded-pack-starter', 'holded-migracion-sin-inventario', 'holded-migracion-con-inventario'],
    relatedServiceCategories: ['holded'],
    seoTitle: 'Conector Claude para Holded: qué puede hacer la IA | EXPERT',
    seoDescription:
      'Cómo funciona el conector MCP de Holded con Claude: capacidades reales, modelo de permisos de tres niveles y seguridad de la conexión OAuth 2.1.',
    body: `
## Qué es el conector Claude para Holded

Holded ofrece un servidor MCP (Model Context Protocol) oficial que permite conectar Claude directamente a tu cuenta. Una vez autorizada la conexión, puedes pedirle a Claude en lenguaje natural que trabaje con tus datos de Holded, sin abrir la plataforma ni buscar manualmente cada dato.

## Qué puede hacer Claude conectado a Holded

- **Facturación**: crear facturas, listarlas por estado, registrar pagos.
- **Contactos**: consultar y gestionar la ficha de clientes y proveedores.
- **Inventario**: consultar stock y disponibilidad de producto.
- **Tesorería**: comprobar saldos y generar resúmenes del estado financiero.

Todo mediante peticiones normales como "lista las facturas pendientes de cobro" o "consulta el stock de este producto" — sin sintaxis técnica.

## Cómo funciona la autorización

La conexión usa **OAuth 2.1 sobre Streamable HTTP**, el estándar habitual para este tipo de integraciones. El usuario autoriza el acceso iniciando sesión en su navegador; los tokens generados se pueden revisar y revocar en cualquier momento desde la sección de desarrolladores de Holded.

## El punto clave de seguridad: Claude nunca hace más de lo que tú puedes hacer

El conector hereda los permisos del usuario que autoriza la conexión. Existen tres niveles:

- **Analista**: solo lectura (consultar facturas, contactos, saldos, stock).
- **Operador**: lectura y escritura (además puede crear facturas, añadir contactos, registrar pagos).
- **Personalizado**: permisos elegidos uno a uno para un control más fino.

Si tu usuario de Holded no tiene permiso para hacer algo, Claude tampoco puede hacerlo a través del conector — la IA no obtiene ningún privilegio adicional al que ya tiene la persona que autoriza la conexión.

## Requisitos para activarlo

- Cuenta Holded activa con acceso a la API habilitado.
- Un cliente compatible con MCP (Claude Desktop, Claude.ai o similar).
- En workspaces de tipo Team o Enterprise, hace falta acceso de administrador para añadir el conector.

## Cuándo tiene sentido activarlo

Tiene más sentido una vez los datos de la cuenta ya están limpios y validados — es lo que dejamos preparado en nuestros servicios de migración e implantación de Holded, para que la IA trabaje sobre datos correctos desde el primer día.

---

**Fuente oficial**: [Holded — Servidor MCP](https://www.holded.com/developers/mcp)
    `
  }
];

export const legacyDocRedirects: Record<string, string> = {
  'nacionalidad-menor-nacido-espana-requisitos': 'nacionalidad-espanola-menor-nacido-en-espana'
};

export function getDoc(slug: string): KnowledgeDoc | undefined {
  return docs.find((doc) => doc.slug === slug);
}

export function getDocRedirectTarget(slug: string): KnowledgeDoc | undefined {
  return docs.find((doc) => doc.slug === (legacyDocRedirects[slug] ?? slug));
}

export function getDocCategory(slug: DocCategorySlug) {
  return docCategories.find((category) => category.slug === slug);
}

export function getAllDocTags(): string[] {
  return Array.from(new Set(docs.flatMap((doc) => doc.tags))).sort((a, b) => a.localeCompare(b, 'es'));
}

export function getDocsForService(serviceSlug: string): KnowledgeDoc[] {
  return docs.filter((doc) => doc.relatedServiceSlugs?.includes(serviceSlug));
}

export function getDocsForCategory(categorySlug: CategorySlug): KnowledgeDoc[] {
  return docs.filter((doc) => doc.relatedServiceCategories?.includes(categorySlug));
}
