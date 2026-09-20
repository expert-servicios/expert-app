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

Pendiente:
- IVA: tipos y reglas de consumo, sin convertir exenciones complejas en hardcodes;
- 130/131/202: reglas de obligación/cálculo;
- 180/190/347/349/390;
- integración completa con `AEAT_TAX_CALENDAR_2026`.

## Lote 3 - mercantil

Pendiente:
- CIRCE/PAE/DUE;
- formulación de cuentas: tres meses desde cierre;
- junta ordinaria: seis primeros meses;
- depósito: un mes desde aprobación;
- cierre registral por falta de depósito;
- legalización de libros;
- titular real;
- NIF y obligaciones censales de sociedades.

## Regla de seguridad

Una cifra o plazo no se considera cubierto por estar escrito en un prompt o artículo. Debe existir una fuente oficial y una dependencia explícita cuando su cambio pueda hacer incorrecto un servicio.
