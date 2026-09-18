# KIA Visual Copilot — Sprint 5I · Visual Auditor y telemetría agregada

Fecha: 2026-09-17
Base: Sprint 5H / PR #285
Tracking: #192

## Objetivo

Cerrar el bloque pendiente de Sprint 5: reglas de Kia Auditor para coherencia visual y telemetría agregada, sin registrar contenido de usuario ni crear un segundo sistema de observabilidad.

## Decisión de arquitectura

No se crean eventos de interacción visual ni una tabla nueva.

La telemetría de este bloque es de **configuración agregada**:

- número de superficies KIA registradas;
- superficies estructuradas vs estáticas;
- estados canónicos cubiertos;
- número de superficies que pueden usar cada estado;
- resultado agregado de las reglas del Visual Auditor.

Por tanto:

- `persistsInteractionEvents = false`;
- `includesPii = false`;
- no DDL;
- no identificadores de usuario, empresa, expediente, sesión ni conversación.

## Registro de superficies

`lib/ai/kia-auditor/kia-visual-auditor.ts` registra explícitamente:

1. lista de expedientes;
2. detalle de expediente;
3. onboarding;
4. integración Holded;
5. perfil;
6. post-compra;
7. calendario fiscal;
8. ayuda autenticada;
9. ayuda pública.

Cada superficie declara:

- ruta;
- fuente `structured` o `static`;
- estados KIA permitidos;
- ausencia de LLM/tools para decidir la presentación.

## Reglas deterministas

El sub-auditor visual comprueba:

- IDs únicos;
- rutas únicas;
- solo estados canónicos;
- ausencia de segundo motor LLM/tools;
- `celebracion` reservada y no habilitada en las superficies actuales;
- `alerta_fiscal` limitada a calendario fiscal;
- `confianza` solo desde fuente estructurada;
- ayuda estática limitada a `explicacion`;
- `empatia` no inferida desde estados operativos.

Las reglas críticas fallan cerrado en tests.

## Integración con métricas admin

`GET /api/admin/kia-metrics` añade `visualGuidance` sin modificar las consultas de telemetría existentes.

El panel `/admin/kia-metrics` muestra:

- superficies registradas;
- estados cubiertos de los 12 canónicos;
- reglas del Visual Auditor superadas/fallidas;
- indicación explícita `0 PII` y `sin eventos persistidos`;
- cobertura agregada por estado.

## Separación respecto al Auditor conversacional

El Auditor existente evalúa decisiones y respuestas de KIA. El Visual Auditor es un sub-auditor determinista de configuración y presentación.

No se añaden reglas visuales al grader conversacional porque no tienen un `KiaDecision` que evaluar y hacerlo mezclaría dos dominios distintos.

## Seguridad

- sin DDL;
- sin nuevas escrituras;
- sin nuevos logs de usuario;
- sin contenido de conversaciones;
- sin datos de perfil;
- sin estados concretos de clientes;
- sin LLM;
- sin tools.

## Validación

Antes de integración:

- TypeScript;
- lint;
- tests;
- Vercel `app` y `ksenia-expert` Ready;
- smoke visual admin del nuevo bloque de métricas.

Con 5E–5I completados, los dos pendientes explícitos de #192 quedan cubiertos: formularios/centro de ayuda y telemetría agregada/Visual Auditor.
