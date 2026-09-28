import type { Article } from '@/lib/utils/blog';

const AEAT_210_NOTE = 'https://sede.agenciatributaria.gob.es/Sede/todas-gestiones/impuestos-tasas/impuesto-sobre-renta-no-residentes/modelo-210-irnr______a-no-residentes-permanente_/nota-modificaciones-plazos-presentacion-modelo-210.html';
const BOE_HAC_623 = 'https://www.boe.es/eli/es/o/2026/06/12/hac623';
const AEAT_PATRIMONIO_2025 = 'https://sede.agenciatributaria.gob.es/Sede/ayuda/calendario-contribuyente/calendario-contribuyente-2026/recuerde/fechas-campana-renta-patrimonio.html';

export const fiscal2026BlogArticles: Article[] = [
  {
    slug: 'modelo-210-nuevo-plazo-no-residentes-inmuebles-2026-2027',
    category: 'Fiscalidad',
    title: 'Modelo 210: nuevo plazo para no residentes con inmuebles en España desde 2027',
    excerpt:
      'La Orden HAC/623/2026 cambia el calendario del Modelo 210, pero no todas las declaraciones cambian a la vez. Te explicamos qué sigue igual en 2026 y qué pasa desde 2027.',
    date: '28 sep 2026',
    readTime: '7 min',
    tags: ['Modelo 210', 'IRNR', 'no residentes', 'inmuebles', 'plazos fiscales 2027'],
    relatedServiceSlugs: ['no-residentes'],
    body: `
## El cambio existe, pero no afecta al Modelo 210 de 2025

La [Agencia Tributaria](${AEAT_210_NOTE}) aclara expresamente que la renta imputada correspondiente al año 2025 mantiene su calendario anterior: puede presentarse entre el **1 de enero y el 31 de diciembre de 2026**.

Por tanto, si eres no residente y en 2025 tuviste un inmueble urbano en España a tu disposición, no debes esperar a abril de 2027 para presentar esa declaración.

## Qué cambia para las rentas imputadas de 2026

La [Orden HAC/623/2026](${BOE_HAC_623}) retrasa el inicio del plazo para las rentas imputadas de inmuebles urbanos. Para las rentas correspondientes a 2026, el Modelo 210 se presentará entre el **1 de abril y el 31 de diciembre de 2027**.

Cuando el resultado sea a ingresar y se quiera domiciliar el pago, la domiciliación podrá hacerse desde el 1 de abril hasta el 23 de diciembre.

## También cambia la información del modelo

La reforma no modifica solo fechas. Para las declaraciones presentadas desde el 1 de enero de 2027 se incorporan nuevos datos relacionados con inmuebles, como el número de días y la cuota de participación. En inmuebles arrendados se incorpora además un anexo de desglose de gastos deducibles.

Esto hace todavía más importante separar correctamente, para cada titular, los días de uso propio, los días alquilados y la cuota de propiedad.

## Qué ocurre si el inmueble estuvo alquilado

Para rendimientos de inmuebles arrendados o subarrendados con resultado a ingresar, el nuevo calendario concentra la presentación en los **20 primeros días naturales de abril del año siguiente al devengo**.

La transición de 2026 tiene reglas específicas. Si se declara de forma agrupada, las rentas de 2026 entran en el nuevo calendario. Si se declara cada renta por separado, el nuevo plazo se aplica a los devengos del último trimestre de 2026; los devengos anteriores mantienen durante 2026 los plazos transitorios indicados por la AEAT.

## Qué datos conviene preparar ya

- Número de inmuebles en España.
- Titulares no residentes y porcentaje de cada uno.
- Fecha de adquisición.
- Referencia catastral.
- Días en que el inmueble estuvo a disposición del titular.
- Periodos de alquiler, si los hubo.
- Ingresos y gastos relacionados con el alquiler.
- País de residencia fiscal de cada titular.

## Calcula el coste antes de enviar documentación

En EXPERT el precio de la gestión IRNR se calcula por **unidad declarativa: inmueble × titular no residente**. La primera unidad son 80 € + IVA y cada unidad adicional añade 30 € + IVA.

El hecho de que el inmueble haya estado alquilado no cambia por sí solo esta tarifa. Esa información se solicita después porque sí cambia el cálculo tributario y la documentación necesaria.

**Fuentes oficiales revisadas el 28/09/2026**: [nota AEAT sobre los nuevos plazos](${AEAT_210_NOTE}) · [Orden HAC/623/2026](${BOE_HAC_623}).
    `,
  },
  {
    slug: 'modelo-210-alquiler-no-residente-transicion-2026',
    category: 'Fiscalidad',
    title: 'Modelo 210 y alquileres de no residentes: cómo funciona la transición de 2026',
    excerpt:
      'Julio-septiembre y octubre-diciembre de 2026 pueden tener calendarios distintos si declaras las rentas de alquiler por separado. Esta es la transición que ha publicado la AEAT.',
    date: '28 sep 2026',
    readTime: '6 min',
    tags: ['Modelo 210', 'alquiler no residente', 'IRNR 2026', 'inmueble alquilado', 'AEAT'],
    relatedServiceSlugs: ['no-residentes'],
    body: `
## El punto clave es cómo declaras el alquiler

La [Agencia Tributaria](${AEAT_210_NOTE}) distingue entre declarar las rentas de alquiler de forma agrupada por año o declarar cada renta de forma separada.

Desde los devengos de 2024, el periodo de agrupación de rentas derivadas del arrendamiento de inmuebles es anual.

## Si agrupas las rentas de 2026

Cuando se opta por la agrupación anual, las rentas devengadas durante 2026 se presentan en el nuevo plazo: del **1 al 20 de abril de 2027**.

Si se domicilia el pago, la ventana indicada por la AEAT es del 1 al 15 de abril.

## Si declaras las rentas por separado

La transición es diferente. Los devengos de abril a septiembre de 2026 mantienen los plazos anteriores que correspondan durante 2026.

En cambio, los devengos de octubre, noviembre y diciembre de 2026 pasan al nuevo calendario: se presentan del **1 al 20 de abril de 2027**.

## Un ejemplo práctico

La propia AEAT utiliza el ejemplo de una persona residente en Noruega que alquila un inmueble en Alicante. Si declara separadamente las rentas, julio, agosto y septiembre de 2026 se presentan durante los primeros veinte días de octubre de 2026; octubre, noviembre y diciembre pasan a abril de 2027.

## Qué cambia en la documentación

Las declaraciones presentadas desde 2027 incorporan más información del inmueble. Si se deducen gastos, el nuevo Modelo 210 incorpora un anexo específico de desglose.

Por eso recomendamos conservar por inmueble y titular:

- contrato o datos de la plataforma de alquiler;
- fechas exactas de ocupación;
- ingresos cobrados;
- facturas y justificantes de gastos;
- porcentaje de titularidad;
- referencia catastral.

**Fuente oficial revisada el 28/09/2026**: [nota AEAT sobre la Orden HAC/623/2026](${AEAT_210_NOTE}).
    `,
  },
  {
    slug: 'impuesto-patrimonio-2025-plazo-modelo-714-2026',
    category: 'Fiscalidad',
    title: 'Impuesto sobre el Patrimonio 2025: plazo del Modelo 714 y qué revisar antes de presentarlo',
    excerpt:
      'La campaña de Patrimonio 2025 terminó el 30 de junio de 2026. Repasamos el calendario oficial y los datos que conviene revisar si necesitas comprobar o regularizar tu situación.',
    date: '28 sep 2026',
    readTime: '7 min',
    tags: ['Impuesto sobre el Patrimonio', 'Modelo 714', 'Patrimonio 2025', 'AEAT', 'declaración patrimonial'],
    relatedServiceSlugs: ['impuesto-patrimonio'],
    body: `
## Cuál fue el plazo de Patrimonio 2025

La [Agencia Tributaria](${AEAT_PATRIMONIO_2025}) fijó para Renta y Patrimonio 2025 el periodo de presentación por Internet entre el **8 de abril y el 30 de junio de 2026**.

Cuando el resultado era a ingresar con domiciliación bancaria, la fecha límite fue el 25 de junio de 2026.

## El plazo no determina por sí solo si estabas obligado

La obligación de presentar Patrimonio depende de la composición y valor del patrimonio, de las reglas estatales y de la normativa autonómica aplicable.

Antes de sacar conclusiones por una sola cifra hay que revisar, entre otros elementos, inmuebles, cuentas, inversiones, participaciones societarias, seguros, derechos y deudas deducibles.

## Por qué una calculadora de honorarios sí tiene sentido

El cálculo tributario de Patrimonio puede ser complejo, pero el presupuesto del servicio puede ser transparente. En EXPERT la declaración estándar parte de **250 € + IVA por titular/declaración**.

Si existen elementos que requieren una valoración especial —por ejemplo sociedades no cotizadas, usufructo y nuda propiedad o determinados bienes en el extranjero— no cerramos automáticamente un precio que podría ser incorrecto: el caso pasa primero a revisión.

## Documentos que conviene reunir

- DNI/NIE y comunidad autónoma de residencia.
- Recibos de IBI y datos de inmuebles.
- Saldos bancarios relevantes a la fecha de devengo.
- Carteras de valores e inversiones.
- Participaciones en sociedades.
- Seguros de vida y otros derechos cuando proceda.
- Deudas que puedan resultar deducibles.
- Declaraciones de ejercicios anteriores, si existen.

**Fuente oficial revisada el 28/09/2026**: [calendario de Renta y Patrimonio 2025](${AEAT_PATRIMONIO_2025}).
    `,
  },
];
