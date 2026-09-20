# KIA Regulatory Registry v1.4 - Fiscal/Mercantil

Fecha de inicio: 20/09/2026  
Rama: `feat/regulatory-v14-fiscal-mercantil`

## Objetivo

Cerrar la cobertura P1 fiscal y mercantil sobre el baseline v1.3, manteniendo el contrato:

`fuente oficial -> ruleset/value -> dependencia -> KIA/contenido -> test`

Sin publicación regulatoria automática y sin merge automático.

## Lote 1 - fiscal internacional

### Modelo 720
Fuente canónica: AEAT, procedimiento GI34.

Se modela:
- tres categorías legales de información;
- umbral inicial de 50.000 EUR por categoría;
- incremento superior a 20.000 EUR para obligaciones posteriores;
- ventana ordinaria 1 enero - 31 marzo;
- separación expresa frente a monedas virtuales.

### Modelo 721
Fuente canónica: AEAT, procedimiento/FAQ GI55.

Se modela:
- monedas virtuales situadas en el extranjero;
- umbral conjunto de 50.000 EUR;
- incremento superior a 20.000 EUR para ejercicios posteriores;
- pérdidas de condición previamente declarable;
- ventana 1 enero - 31 marzo;
- separación entre cripto y saldo fiat de una cuenta en exchange.

### Régimen especial de desplazados - 149/151
Fuente canónica: AEAT Modelo 149/151.

Se modela:
- duración del régimen;
- finalidades del Modelo 149;
- plazo de opción del contribuyente principal;
- plazo del contribuyente asociado;
- alta censal y documentación previa;
- obligación de declarar mediante Modelo 151;
- revisión individual de elegibilidad.

## Lote 2 - fiscal recurrente

Implementado:
- `IRPF_PAYMENT_FRACTIONS_2026`: Modelos 130/131, reglas de cálculo, excepción del 70 %, módulos y medidas territoriales 2026;
- `MODEL_202_RULES_2026`: modalidades del art. 40 LIS, umbral de 6 M€, obligación y cambio Ceuta RDL 22/2026;
- `INFORMATIVE_RETURNS_2026`: 347/349/390 y enlace operativo a 180/190;
- integración de vencimientos exactos con `AEAT_TAX_CALENDAR_2026`;
- corrección de prompts, blog, docs, catálogo y checklists para evitar fechas/fórmulas estáticas.

Pendiente del bloque fiscal:
- IVA: tipos, exenciones y regímenes que realmente necesiten consumo estructurado;
- revisar si 111/115 necesitan ruleset propio o basta calendario + reglas de retención ya existentes.

## Lote 3 - mercantil

Implementado:
- `ANNUAL_ACCOUNTS_LSC_RULES`: formulación, junta ordinaria, depósito y régimen sancionador;
- `REGISTRY_CLOSURE_RRM_RULES`: cierre registral, excepciones y acreditación de falta de aprobación;
- `BOOK_LEGALIZATION_RULES`: cuatro meses desde el cierre real del ejercicio;
- `CIRCE_PAE_DUE_RULES`: PAE, CIRCE, DUE, escritura pública y coordinación notarial;
- corrección del prompt PAE para no reutilizar 3.000 EUR como capital mínimo ni prometer ausencia de notaría;
- corrección de fechas fijas de julio y simplificaciones del cierre registral.

Pendiente mercantil:
- titular real;
- NIF y obligaciones censales específicas de sociedades;
- revisar apoderamientos mercantiles y poderes como bloque propio.

## Regla de seguridad

Una cifra o plazo no se considera cubierto por estar escrito en un prompt o artículo. Debe existir una fuente oficial y una dependencia explícita cuando su cambio pueda hacer incorrecto un servicio.
