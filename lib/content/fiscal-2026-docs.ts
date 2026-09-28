import type { KnowledgeDoc } from '@/lib/utils/docs';

const AEAT_210_NOTE = 'https://sede.agenciatributaria.gob.es/Sede/todas-gestiones/impuestos-tasas/impuesto-sobre-renta-no-residentes/modelo-210-irnr______a-no-residentes-permanente_/nota-modificaciones-plazos-presentacion-modelo-210.html';

export const fiscal2026KnowledgeDocs: KnowledgeDoc[] = [
  {
    slug: 'calendario-modelo-210-irnr-2026-2027',
    category: 'fiscalidad',
    title: 'Calendario Modelo 210: qué presentar en 2026 y qué pasa a 2027',
    excerpt:
      'Tabla práctica para distinguir rentas imputadas, alquileres agrupados y alquileres declarados por separado tras la Orden HAC/623/2026.',
    tags: ['Modelo 210', 'IRNR', 'plazos', 'no residentes', 'inmuebles'],
    updatedAt: '28 sep 2026',
    readTime: '6 min',
    relatedServiceSlugs: ['no-residentes'],
    seoTitle: 'Calendario Modelo 210 2026 y 2027 para no residentes | EXPERT',
    seoDescription:
      'Consulta los nuevos plazos del Modelo 210 para rentas imputadas y alquileres de inmuebles de no residentes tras la Orden HAC/623/2026.',
    body: `
## Rentas imputadas de inmuebles

| Renta declarada | Plazo |
|---|---|
| Renta imputada correspondiente a 2025 | 1 enero–31 diciembre 2026 |
| Renta imputada correspondiente a 2026 | 1 abril–31 diciembre 2027 |
| Domiciliación de renta imputada 2026 | 1 abril–23 diciembre 2027 |

El cambio de inicio del plazo se aplica por primera vez a las rentas imputadas correspondientes a 2026.

## Alquileres agrupados

Para rentas de alquiler de 2026 declaradas de forma agrupada, el nuevo plazo será del **1 al 20 de abril de 2027**. La domiciliación podrá hacerse del 1 al 15 de abril.

## Alquileres declarados por separado

| Devengo 2026 | Regla transitoria |
|---|---|
| Abril–septiembre | Mantiene durante 2026 los plazos anteriores que correspondan |
| Octubre–diciembre | 1–20 abril 2027 |

## Nuevos datos del Modelo 210

Las autoliquidaciones que se presenten desde el 1 de enero de 2027 incorporan nuevos datos relacionados con días de uso o alquiler y cuota de participación. Para inmuebles arrendados se incorpora además un anexo de desglose de gastos deducibles.

## Fuente oficial

[Nota AEAT sobre modificaciones del Modelo 210](${AEAT_210_NOTE}), revisada el 28/09/2026.
    `,
  },
  {
    slug: 'checklist-irnr-inmueble-no-residente',
    category: 'fiscalidad',
    title: 'Checklist IRNR: datos y documentos por inmueble y titular no residente',
    excerpt:
      'Lista práctica para preparar una declaración Modelo 210 sin mezclar datos de inmuebles, titulares, periodos de alquiler y uso propio.',
    tags: ['IRNR', 'Modelo 210', 'checklist', 'inmuebles', 'no residentes'],
    updatedAt: '28 sep 2026',
    readTime: '5 min',
    relatedServiceSlugs: ['no-residentes'],
    seoTitle: 'Checklist Modelo 210 para inmueble de no residente | EXPERT',
    seoDescription:
      'Qué datos y documentos necesitas para preparar el Modelo 210 de un inmueble en España siendo no residente.',
    body: `
## Datos del titular

- Nombre y apellidos.
- NIE/NIF.
- País de residencia fiscal.
- Domicilio fiscal.
- Porcentaje de titularidad del inmueble.
- Datos bancarios cuando proceda domiciliación o devolución.

## Datos del inmueble

- Dirección completa.
- Referencia catastral.
- Fecha de adquisición.
- Porcentaje de propiedad.
- Valor catastral y, cuando proceda, datos necesarios para determinar si fue revisado.
- Fecha de venta si el inmueble fue transmitido durante el ejercicio.

## Si estuvo a disposición del propietario

Indica los días en los que el inmueble no estuvo alquilado ni afectado a otra situación que altere la imputación.

## Si estuvo alquilado

- Fechas exactas de cada periodo.
- Ingresos cobrados.
- Contrato o exportación de la plataforma de reservas.
- Gastos y justificantes que puedan resultar relevantes.
- Identificación separada de los días alquilados.

## Si hay varios titulares

El presupuesto y la preparación se organizan por unidad declarativa: **un inmueble por cada titular no residente**. No conviene mezclar en una sola ficha la cuota de propiedad o los datos fiscales de titulares diferentes.

## Antes de enviar documentación

Puedes usar la calculadora de la ficha del servicio para conocer los honorarios y, después de solicitar el servicio, completar el cuestionario y subir los documentos al expediente.
    `,
  },
  {
    slug: 'documentos-declaracion-renta-irpf',
    category: 'fiscalidad',
    title: 'Documentos para preparar la Declaración de la Renta (IRPF)',
    excerpt:
      'Checklist por bloques de ingresos para saber qué revisar antes de preparar la declaración y qué hace variar la complejidad del servicio.',
    tags: ['IRPF', 'Renta', 'documentos', 'checklist fiscal', 'declaración de la renta'],
    updatedAt: '28 sep 2026',
    readTime: '6 min',
    relatedServiceSlugs: ['irpf'],
    seoTitle: 'Documentos necesarios para hacer la Renta IRPF | EXPERT',
    seoDescription:
      'Checklist de documentación para preparar la declaración de la renta: trabajo, alquileres, inversiones, inmuebles y deducciones.',
    body: `
## Datos básicos

- DNI/NIE y datos familiares.
- Comunidad autónoma de residencia fiscal.
- IBAN.
- Declaración del ejercicio anterior, si existe.
- Datos fiscales disponibles en la AEAT.

## Trabajo y actividades

Revisa certificados de retenciones, nóminas cuando sean necesarias para comprobar datos y, si existe actividad económica, la información contable y fiscal del ejercicio.

## Inmuebles

- Referencias catastrales.
- Fechas de adquisición y transmisión.
- Periodos de alquiler.
- Ingresos y gastos de inmuebles arrendados.
- Préstamos y datos necesarios para deducciones que sigan siendo aplicables.

## Inversiones y ganancias patrimoniales

- Operaciones con acciones, fondos u otros activos.
- Ventas de inmuebles.
- Criptoactivos cuando proceda.
- Otras ganancias o pérdidas patrimoniales.

## Deducciones

Las deducciones dependen de la situación personal y de la comunidad autónoma. Conviene revisar familia, vivienda, donativos, aportaciones y otros supuestos antes de presentar.

## Cómo se calcula el precio del servicio

La ficha de Renta incorpora una calculadora según la modalidad y los bloques que requieren trabajo adicional. Si el caso no encaja en una configuración estándar, se puede enviar una consulta gratuita a KIA antes de solicitar el servicio.
    `,
  },
];
