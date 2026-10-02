import type { Article } from '@/lib/utils/blog';

const EU_SANCTIONS = 'https://eur-lex.europa.eu/eli/reg/2014/833/oj';
const EU_DEPOSITS_FAQ = 'https://finance.ec.europa.eu/publications/deposits_en';
const EU_AML_2026_46 = 'https://eur-lex.europa.eu/eli/reg_del/2026/46/oj';
const BOE_LAW_14_2013 = 'https://www.boe.es/buscar/act.php?id=BOE-A-2013-10074';
const RU_ARTICLE = 'https://expertconsulting.es/ru/blog/grazhdane-rossii-vnzh-ispaniya-bankovskie-sankcii-100000';

export const russianResidentBankingBlogArticles: Article[] = [
  {
    slug: 'ciudadanos-rusos-residencia-espana-sanciones-bancarias-100000',
    category: 'Extranjería',
    title: 'Ciudadanos rusos con residencia en España: ¿se aplica el límite bancario de 100.000 euros?',
    excerpt:
      'Un ciudadano ruso con residencia española no siempre está sujeto al límite bancario de 100.000 €. Explicamos la excepción, Compliance y Golden Visa.',
    date: '2 oct 2026',
    readTime: '9 min',
    tags: [
      'ciudadanos rusos',
      'residencia en España',
      'sanciones UE',
      'límite 100.000 euros',
      'Compliance bancario',
      'Golden Visa',
    ],
    body: `
[Читать эту статью по-русски](${RU_ARTICLE}).

## La nacionalidad rusa no es el único dato que debe revisar el banco

Una de las dudas más frecuentes desde la ampliación de las sanciones europeas es si un ciudadano ruso puede mantener más de **100.000 euros** en una entidad bancaria de la Unión Europea.

La respuesta no depende únicamente de la nacionalidad. El [Reglamento (UE) n.º 833/2014](${EU_SANCTIONS}) contiene restricciones específicas para determinados nacionales rusos, pero también prevé una excepción expresa para las personas físicas que dispongan de un **permiso de residencia temporal o permanente válido en un Estado miembro de la UE, el EEE o Suiza**.

Por tanto, a efectos de la prohibición concreta del artículo 5b, no es jurídicamente lo mismo un ciudadano ruso sin residencia europea que un ciudadano ruso con una autorización de residencia española vigente.

## Qué establece el límite de 100.000 euros

El artículo 5b del Reglamento (UE) n.º 833/2014 limita, con carácter general, la aceptación de depósitos cuando el valor total de los depósitos de determinados nacionales rusos o personas residentes en Rusia supera los **100.000 euros por entidad de crédito**.

Sin embargo, el apartado 3 del mismo artículo excluye de esa prohibición, entre otros supuestos, a las personas físicas que tengan un permiso de residencia temporal o permanente en un Estado miembro de la Unión Europea, del Espacio Económico Europeo o en Suiza.

La [Comisión Europea](${EU_DEPOSITS_FAQ}) ha explicado también esta excepción en sus preguntas frecuentes sobre depósitos.

La consecuencia práctica es importante: cuando el banco analiza el límite de 100.000 euros, debe comprobar no solo la nacionalidad, sino también si el cliente dispone de una autorización de residencia válida que encaje en la excepción.

## Residencia fiscal y permiso de residencia son conceptos distintos

Para esta excepción concreta, el dato determinante no es necesariamente que la persona sea residente fiscal en España ni que permanezca más de 183 días al año en territorio español.

Lo relevante es la existencia de un **permiso de residencia temporal o permanente válido**.

Esto es especialmente importante en autorizaciones que históricamente no exigían residencia física continuada en España, como determinadas autorizaciones para inversores.

En la práctica, conviene presentar al banco la TIE y, si existe cualquier duda sobre su vigencia, también la resolución administrativa de concesión o renovación.

## Qué ocurre con las antiguas Golden Visa españolas

España dejó de admitir nuevas autorizaciones para inversores con efectos desde el **3 de abril de 2025**, pero las autorizaciones concedidas con anterioridad no desaparecieron automáticamente.

La [Ley 14/2013](${BOE_LAW_14_2013}) mantiene un régimen transitorio para autorizaciones ya existentes y sus renovaciones en los términos legalmente previstos.

Por tanto, una autorización de residencia para inversores que continúe vigente puede seguir siendo relevante para determinar la aplicación de la excepción del artículo 5b.

## Golden Visa y depósitos superiores a 100.000 euros: informar no es lo mismo que prohibir

El régimen europeo contiene otra regla que puede generar confusión.

El artículo 5g establece determinadas obligaciones de información para las entidades financieras respecto de depósitos superiores a **100.000 euros** de nacionales rusos que hayan adquirido derechos de residencia o ciudadanía mediante determinados programas de inversión.

Eso significa que, en algunos casos, el banco puede estar obligado a **reportar información** sobre el depósito.

Pero una obligación de información no equivale, por sí sola, a una prohibición de aceptar el dinero.

Conviene separar siempre estas dos preguntas:

- ¿La operación está prohibida por una sanción concreta?
- ¿La operación está permitida pero sometida a información, revisión o Compliance reforzado?

Confundir ambas situaciones es una de las causas habituales de problemas en la comunicación entre cliente y entidad bancaria.

## Por qué el banco puede seguir pidiendo mucha documentación

Aunque la excepción del artículo 5b resulte aplicable, la entidad financiera mantiene sus obligaciones de prevención del blanqueo de capitales, conocimiento del cliente y control de sanciones.

Además, la Unión Europea incorporó a Rusia a la lista de **terceros países de alto riesgo en materia de prevención del blanqueo de capitales y financiación del terrorismo** mediante el [Reglamento Delegado (UE) 2026/46](${EU_AML_2026_46}).

Por eso una operación puede ser legalmente admisible y, al mismo tiempo, quedar sometida a una revisión exhaustiva por parte del departamento de Compliance.

El banco puede analizar, entre otras cuestiones:

- identidad y residencia del cliente;
- titularidad real de las cuentas;
- origen inmediato de los fondos;
- origen histórico del patrimonio;
- finalidad económica de la transferencia;
- coherencia con la actividad profesional o empresarial declarada;
- países y entidades financieras que intervienen;
- posibles coincidencias con listas de sanciones.

## Documentos que puede pedir el banco

Antes de realizar una transferencia elevada conviene preparar un expediente documental coherente.

Habitualmente puede ser necesario aportar:

- pasaporte y TIE;
- resolución de concesión o renovación de la residencia;
- extracto de la cuenta bancaria de origen;
- documento que acredite la titularidad de esa cuenta;
- declaraciones fiscales;
- certificados de ingresos;
- nóminas o documentación empresarial;
- contratos de compraventa de inmuebles o participaciones;
- justificantes de dividendos;
- contratos de préstamo;
- documentación de herencias;
- extractos históricos que expliquen la acumulación del patrimonio;
- traducciones al español y, cuando la entidad lo exija, traducciones juradas.

Un error frecuente consiste en acreditar únicamente que el dinero está actualmente depositado en otro banco. Compliance puede pedir además **cómo se generó ese patrimonio**.

## ¿Puede el banco detener temporalmente una transferencia?

Sí.

Que una transferencia no esté prohibida por las sanciones europeas no significa que la entidad deba ejecutarla automáticamente sin controles.

Una transferencia elevada puede quedar pendiente mientras se revisa la documentación, especialmente si concurren factores como:

- nacionalidad rusa;
- importe elevado;
- fondos procedentes del extranjero;
- sociedades vinculadas;
- préstamos entre socio y sociedad;
- inversiones internacionales;
- documentación fiscal extranjera.

El bloqueo temporal para revisión y una prohibición legal definitiva son situaciones diferentes.

## ¿Puede el banco aplicar criterios internos más estrictos?

Las entidades financieras tienen políticas internas de admisión de clientes y gestión del riesgo.

Por eso, cuando una operación se rechaza con una explicación genérica del tipo **«se debe a las sanciones a ciudadanos rusos»**, conviene pedir una aclaración más precisa.

En concreto, es útil preguntar si la decisión responde a:

1. una prohibición concreta del Reglamento europeo;
2. una obligación de prevención del blanqueo;
3. una revisión pendiente del departamento de Compliance;
4. una obligación de información a la autoridad competente;
5. o una política interna de riesgo de la propia entidad.

La respuesta jurídica y las posibles vías de actuación son diferentes en cada caso.

## Tener residencia española no elimina todas las sanciones

La excepción del artículo 5b no supone una exención general del régimen europeo de sanciones.

Pueden seguir existiendo restricciones si, por ejemplo:

- la propia persona está incluida en una lista de sanciones;
- interviene una entidad financiera sancionada;
- participa una sociedad o persona restringida;
- existe una prohibición específica sobre el servicio o la operación;
- la operación puede suponer una elusión de sanciones.

Por eso cada operación debe analizarse atendiendo a todas las personas, entidades y países que intervienen.

## Qué hacer antes de ordenar una transferencia importante

Recomendamos seguir este orden:

1. Confirmar que la autorización de residencia está vigente.
2. Revisar si alguna persona o entidad interviniente está afectada por sanciones.
3. Preparar la trazabilidad bancaria completa del dinero.
4. Preparar la documentación del origen de los fondos y del patrimonio.
5. Traducir previamente la documentación esencial cuando sea extranjera.
6. Informar al banco antes de ordenar la transferencia si el importe es elevado.
7. Pedir por escrito cualquier requerimiento de Compliance para responder de forma ordenada.

Preparar el expediente antes de enviar el dinero suele evitar bloqueos, solicitudes repetitivas y retrasos.

## En resumen

Un ciudadano ruso con una **autorización de residencia temporal o permanente válida en España** puede quedar fuera de la prohibición de depósitos superiores a 100.000 euros prevista en el artículo 5b del Reglamento (UE) n.º 833/2014.

Eso no significa que la entidad bancaria deje de aplicar controles.

Puede existir Compliance reforzado, obligación de justificar el origen del patrimonio, obligaciones de información y otras restricciones independientes del límite de depósitos.

La cuestión correcta no es simplemente «¿es ciudadano ruso?», sino **qué autorización de residencia tiene, qué operación quiere realizar, cuál es el origen de los fondos y qué norma concreta está aplicando el banco**.

## ¿Necesitas revisar tu caso antes de hablar con el banco?

En EXPERT podemos revisar la documentación, identificar la normativa aplicable y ayudarte a preparar una respuesta ordenada para el departamento de Compliance.

Puedes utilizar la consulta gratuita de la web o reservar una reunión informativa de 15 minutos antes de realizar la operación.

**Fuentes oficiales revisadas el 02/10/2026**: [Reglamento (UE) n.º 833/2014](${EU_SANCTIONS}) · [Comisión Europea: depósitos y sanciones](${EU_DEPOSITS_FAQ}) · [Reglamento Delegado (UE) 2026/46](${EU_AML_2026_46}) · [Ley 14/2013](${BOE_LAW_14_2013}).

**Aviso**: este contenido es informativo. La aplicación de sanciones y obligaciones de prevención del blanqueo debe revisarse individualmente según las personas, entidades, bancos, países y operaciones que intervienen.
    `,
  },
];
