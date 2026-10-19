import type { Article } from '@/lib/utils/blog';

// Articulos propuestos; sujetos a revision juridico-editorial antes de fusionar.
export const circeEditorialArticles: Article[] = [
  {
    slug: 'autonomo-vs-sociedad-limitada-impuestos-costes-2026',
    category: 'Empresas',
    title: 'Autónomo o sociedad limitada en 2026: impuestos, costes y responsabilidad',
    excerpt: 'Cómo comparar IRPF e Impuesto sobre Sociedades, cuotas de Seguridad Social, dividendos, reinversión y costes fijos sin simplificaciones.',
    date: '19 oct 2026',
    readTime: '9 min',
    tags: ['autónomo', 'Sociedad Limitada', 'IRPF', 'Impuesto sobre Sociedades', 'RETA', 'dividendos'],
    relatedServiceSlugs: ['constitucion-sl', 'constitucion-sl-circe', 'alta-autonomo'],
    body: `
## La diferencia no depende de una cifra mágica de facturación

La elección entre ejercer como **persona física autónoma** o mediante **sociedad limitada** depende del beneficio, del riesgo asumido, de la forma de cobrar los socios, de los beneficios que se reinvertirán y de las obligaciones recurrentes. No hay un umbral universal de ingresos que haga más rentable la SL.

## Autónomo: IRPF progresivo

En estimación directa, el rendimiento neto de la actividad se integra en la imposición personal conforme a las reglas aplicables. El resultado depende de la escala estatal y autonómica, de otras rentas, de las deducciones y de las circunstancias personales. También hay que considerar la cotización a la Seguridad Social y el régimen de IVA.

## Sociedad: Impuesto sobre Sociedades, pagos a socios y dividendos

Para períodos iniciados en 2026, la [AEAT publica los tipos de gravamen](https://sede.agenciatributaria.gob.es/Sede/impuesto-sobre-sociedades/que-base-imponible-se-determina-sociedades/tipo-impositivo.html):

| Régimen | Tipo en 2026 |
|---|---|
| General | 25 % |
| Microempresa, primeros 50.000 € de base imponible | 19 % |
| Microempresa, resto de base imponible | 21 % |
| Empresa de reducida dimensión (régimen transitorio) | 23 % |
| Nueva creación con requisitos del art. 29 LIS | 15 % |

El tipo del 15 % exige cumplir los requisitos de entidad de nueva creación que realice actividad económica; se aplica, con las condiciones legales, en el primer período de base imponible positiva y el siguiente. Ser una SL recién registrada no garantiza ese tipo.

**Si la sociedad paga dividendos, estos también se declaran por los socios personas físicas**, conforme a las reglas del IRPF. Si remunera funciones de trabajo o administración, hay que analizar retenciones, deducibilidad, estatutos y encuadramiento. El dinero societario no puede retirarse libremente como si fuese dinero particular.

## Seguridad Social y responsabilidad

La situación del socio trabajador y del administrador depende de funciones, control efectivo, participación directa o familiar y otras circunstancias; superar el 25 % de participación no es una regla universal suficiente. Revisar [artículo 305 LGSS](https://www.boe.es/buscar/act.php?id=BOE-A-2015-11724). La responsabilidad limitada separa patrimonios, pero no elimina los deberes ni la posible responsabilidad personal del administrador.

## Costes anuales y ejemplo de decisión

La SL debe llevar contabilidad mercantil, legalizar libros, formular y depositar cuentas y presentar los impuestos que correspondan. Puede haber obligaciones aunque no facture.

Imagina 50.000 € de beneficio **antes de remunerar** a la persona que dirige el negocio. No basta con multiplicar esa cantidad por un tipo fijo: hay que modelizar al menos tres escenarios, con sus cuotas y costes: retirar la mayor parte para gastos personales, reinvertirla y contratar o incorporar nuevos socios.

## Recursos y fuentes

- [Constituye tu SL por CIRCE: guía gratuita](https://expertconsulting.es/herramientas/crear-sociedad-limitada)
- [Manual EXPERT del DUE](https://expertconsulting.es/docs/constituir-sl-circe-pae-virtual)
- [Alta de autónomo: primeros pasos](https://expertconsulting.es/blog/alta-autonomo-espana)
- [Ley del Impuesto sobre Sociedades](https://www.boe.es/buscar/act.php?id=BOE-A-2014-12328)
- [AEAT: tipos 2026](https://sede.agenciatributaria.gob.es/Sede/impuesto-sobre-sociedades/que-base-imponible-se-determina-sociedades/tipo-impositivo.html)

Revisado: 19/10/2026. Orientación general, no cálculo personalizado.
`
  },
  {
    slug: 'costes-constitucion-y-mantenimiento-sl-2026',
    category: 'Empresas',
    title: 'Cuánto cuesta crear una SL y cuánto cuesta mantenerla después',
    excerpt: 'Aranceles de constitución, capital social, honorarios opcionales y obligaciones fiscales y contables recurrentes.',
    date: '19 oct 2026',
    readTime: '7 min',
    tags: ['constitución SL', 'notaría', 'Registro Mercantil', 'CIRCE', 'gastos anuales'],
    relatedServiceSlugs: ['constitucion-sl', 'constitucion-sl-circe'],
    body: `
## Costes iniciales y gastos anuales son dos presupuestos distintos

Constituir por PAE Virtual permite rellenar el DUE sin contratar una gestoría, pero **no convierte la escritura, la inscripción registral o la denominación en gestiones gratuitas**. El capital aportado pertenece a la sociedad: no es una tasa.

## Aranceles reducidos: cuándo se aplican

El [artículo 5 del Real Decreto-ley 13/2010](https://www.boe.es/buscar/act.php?id=BOE-A-2010-18651) contempla en ciertos supuestos de constitución telemática **150 € de notario y 100 € de registrador**, y para sociedades con capital no superior a 3.100 € y estatutos tipo aplicables, **60 € y 40 €**, respectivamente. Las condiciones deben comprobarse caso por caso; los importes no equivalen a un presupuesto global cerrado, y pueden existir otros conceptos.

La [certificación negativa de denominación](https://www.rmc.es/) y los aranceles, suplidos e impuestos que correspondan se verifican con el proveedor oficial. No confundirlos con los honorarios comerciales de EXPERT.

## Capital social desde 1 euro

El capital mínimo legal de una SL es 1 €. Mientras no llegue a 3.000 €, existen reglas especiales de reserva legal y responsabilidad en determinados supuestos de liquidación. Elegir estatutos tipo o personalizados depende de la estructura real de socios.

## Qué tramita CIRCE y qué no debes repetir

El DUE integra las comunicaciones iniciales de Hacienda y Seguridad Social que correspondan, coordinadas con notaría e inscripción mercantil. **No se debe pedir el NIF provisional ni presentar un 036 duplicado por sistema** cuando CIRCE ya los está gestionando. Se debe comprobar el estado del expediente y subsanar las incidencias.

## Qué sigue costando después

Una sociedad puede necesitar contabilidad, legalización de libros, cuentas anuales, Impuesto sobre Sociedades, IVA, retenciones, nóminas, seguros o licencias según su actividad. Si todavía no factura, eso no elimina automáticamente sus obligaciones.

## Tres vías para el emprendedor

- **Autogestión:** guía gratuita de EXPERT y trámite en PAE Virtual; costes externos por cuenta del interesado.
- **Formación guiada:** ayuda a preparar y entender el DUE, sin presentación del trámite por EXPERT.
- **Gestión integral:** EXPERT realiza el expediente según el alcance del servicio elegido, con honorarios y costes de terceros separados.

[Consulta nuestra guía CIRCE de siete pasos](https://expertconsulting.es/herramientas/crear-sociedad-limitada) y la [ficha de constitución de SL](https://expertconsulting.es/servicios/empresas-autonomos/constitucion-sl).

Fuentes: [PAE Electrónico](https://paeelectronico.es/), [RDL 13/2010](https://www.boe.es/buscar/act.php?id=BOE-A-2010-18651), [Ley de Sociedades de Capital](https://www.boe.es/buscar/act.php?id=BOE-A-2010-10544). Revisado: 19/10/2026.
`
  }
];
