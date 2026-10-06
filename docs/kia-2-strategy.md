# KIA 2.0 — estrategia y arquitectura vigente

Última actualización: 2026-10-06.

Este documento es la referencia estratégica canónica de KIA. Describe lo que existe hoy en `main`, los límites de seguridad que no deben relajarse y el roadmap que todavía no debe presentarse como funcionalidad disponible.

## 1. Posición de producto

KIA es el copiloto operativo de EXPERT. No es un chatbot aislado ni una fuente de verdad autónoma.

Su función es:

- reunir contexto autorizado de cliente, empresa, expediente y operación;
- orientar y responder con conocimiento profesional y fuentes oficiales cuando corresponda;
- ejecutar herramientas solo dentro de la capacidad real del actor;
- preparar borradores o propuestas cuando una acción no puede ejecutarse de forma autónoma;
- mantener trazabilidad de decisiones, herramientas, evidencias y resultados;
- reducir trabajo manual sin sustituir controles humanos, normativa ni fuentes canónicas.

Fuentes de verdad principales:

- Supabase: identidad, empresas, expedientes, tareas, documentos, acciones, evidencias y memoria operativa;
- Holded: datos contables/financieros y otras capacidades habilitadas por integración;
- Stripe: cobros y suscripciones;
- Google/Microsoft: proveedores conectados de correo, calendario, reuniones y archivos cuando estén autorizados;
- fuentes oficiales: normativa y datos regulatorios;
- KIA: capa de razonamiento, orquestación y presentación sobre esas fuentes.

## 2. Superficie canónica

La superficie in-app canónica es `components/KiaCopilotWidget.tsx`, montada desde el layout protegido.

Endpoint principal:

- `POST /api/ai/kia`.

La arquitectura no debe reintroducir un panel paralelo de KIA ni duplicar la conversación en otro widget. Los tests de `kia-canonical-copilot-only` y `kia-e2e-readiness-contract` protegen esta regla.

En Admin, el mismo copiloto puede operar con contexto profesional y superficies complementarias de trabajo, pero la conversación sigue pasando por la arquitectura KIA común.

Telegram es un canal KIA adicional para identidades verificadas. Correo y calendario forman parte de la operación contextual. WhatsApp no es la interfaz canónica de KIA.

## 3. Identidad, actor y autorización

KIA no decide permisos a partir del texto del usuario.

Flujo de autorización:

1. resolver identidad y contexto;
2. construir `KiaActorCapabilitySnapshot` mediante `kia-actor-capability-resolver`;
3. cargar grants autoritativos cuando correspondan;
4. resolver el perfil de política;
5. calcular herramientas autorizadas;
6. ejecutar mediante `runPolicyEnforcedKiaDecision`.

La superficie expuesta al modelo es siempre una intersección de:

- capacidades detectadas;
- capacidades explícitamente habilitadas;
- rol y canal;
- scope de tenant/empresa/cliente/expediente;
- riesgo y efecto de la herramienta;
- feature flags vigentes.

Una capacidad detectada nunca equivale por sí sola a una autorización.

## 4. Herramientas y niveles de efecto

Las herramientas KIA están tipadas y registradas en:

- `lib/ai/kia/kia-tool-definitions.ts`;
- `lib/ai/kia/kia-tool-registry.ts`;
- `lib/ai/kia/kia-tool-executor.ts`.

Principio operativo:

- lectura segura: puede ser autónoma cuando la política lo permite;
- preparación/borrador: no equivale a ejecución externa;
- escritura o acción externa: exige la política, identidad, scope y aprobación requeridos;
- acciones de mayor riesgo: deben fallar cerradas.

No añadir herramientas directamente al prompt ni ejecutar funciones fuera del registro/policy layer.

## 5. Contexto y aislamiento multi-entidad

El contexto de KIA es company-scoped y case-scoped cuando existe una empresa o expediente activo.

Reglas:

- nunca inferir empresa activa por similitud de nombre;
- no mezclar empresas de un mismo usuario;
- no mezclar resúmenes históricos de expedientes distintos;
- no usar una integración Holded de otra empresa;
- un usuario con varias empresas debe trabajar sobre una entidad explícita/activa autorizada;
- staff puede trabajar por tenant y expediente dentro de su ámbito;
- cliente final se limita a sus propios datos autorizados.

La Hoja Registral v2 conserva:

- detalle operativo reciente;
- hechos estructurales confirmados;
- instrucciones operativas confirmadas;
- histórico resumido por scope de empresa/expediente;
- procedencia auditable y reemplazo/versionado de hechos.

La memoria operativa no sustituye normativa ni fuentes vivas.

## 6. Artifacts y presentación

KIA no debe producir CTAs o artefactos accionables basándose únicamente en texto generado.

`buildKiaCopilotArtifacts` deriva artifacts de:

- resultados de herramientas autorizadas;
- conocimiento canónico seguro;
- decisión final validada.

Los artifacts de acción quedan condicionados por la decisión final y el scope vigente.

Las señales visuales de presentación están separadas de la decisión LLM. `kia-presentation-context.ts` y el auditor visual mantienen señales confiables para estados como alertas fiscales, celebración o atención contextual.

Una alerta fiscal visible debe venir de señales estructuradas y autorizadas, no de una frase arbitraria del modelo.

## 7. Sistema visual KIA

El avatar y las respuestas contextuales están integrados en el copiloto y protegidos por tests de estado, lifecycle y auditor visual.

Estado actual:

- sistema de avatar semántico y lifecycle de respuesta consolidado;
- motion por respuesta y protección contra reanimación de mensajes históricos;
- presentación contextual y señales fiscales confiables integradas;
- superficies principales cubiertas.

No considerar finalizada toda la expansión visual: el epic de superficies adicionales de Sprint 5 sigue siendo roadmap hasta que sus criterios estén cerrados.

## 8. Holded

Holded debe resolverse por empresa.

Reglas:

- la integración EXPERT/KIA y una conexión MCP son autoridades distintas;
- una conexión MCP no concede automáticamente permisos a KIA;
- credenciales EXPERT se resuelven mediante la integración company-scoped;
- `permissions_detected` describe lo que la conexión parece soportar;
- `permissions_enabled` expresa lo que EXPERT autoriza usar;
- el runtime utiliza permisos habilitados, nunca solo detectados.

Para capacidades contables y financieras:

- lecturas R0/R1 pueden ser autónomas según policy;
- propuestas de recordatorio o rectificativa son preparación, no envío/creación;
- no tocar históricos financieros mediante backfills o correcciones implícitas.

Para Labor/Holded HR:

- la capacidad debe estar habilitada explícitamente;
- no inferir consentimiento laboral de la mera existencia de datos;
- cualquier futura escritura laboral exige un gate de consentimiento/autorización específico además de la policy general.

## 9. Correo, calendario, reuniones y Telegram

KIA mantiene contexto entre canales cuando existe identidad verificable.

Correo:

- preservar threading del proveedor;
- registrar entrega real, no confundir borrador con envío;
- KIA firma como asistente IA cuando actúa como autora;
- no pedir documentación innecesaria antes de iniciar una consulta.

Calendario/reuniones:

- disponibilidad y acciones dependen de cuentas autorizadas;
- tareas posteriores a reunión deben quedar trazables;
- no inventar reuniones ni confirmar acciones que el proveedor no haya aceptado.

Telegram:

- webhook verificado;
- idempotencia por update;
- identidad vinculada antes de usar contexto privado;
- contexto de expediente mediante token autorizado;
- entrega confirmada por proveedor.

Pendiente de producto: Operations 360 / bandeja Admin unificada para Telegram y reply manual.

## 10. Work, evidencia y acciones administrativas

KIA Work coordina tareas de expediente con claims, dependencias y evidencia.

Componentes vigentes:

- `kia_work_connections`, claims, inbox y events;
- políticas de evidencia por tarea;
- documentos, correos y acciones administrativas como witnesses;
- lifecycle de tareas separado del lifecycle de `administrative_actions`;
- cierre idempotente y verificación antes de avanzar el expediente.

`administrative_actions` y su servicio de aprobación ya existen y se usan en flujos concretos, por ejemplo eSignature.

No interpretar esto como una autorización genérica para ejecutar cualquier trámite administrativo. Cada capability necesita:

- implementación específica;
- policy;
- aprobación/autenticación cuando corresponda;
- evidencia;
- scope;
- verificación.

## 11. eSignature

La firma electrónica usa un lifecycle auditable sobre acciones administrativas.

Reglas:

- documento origen != documento firmado final;
- solo `signature.completed` con `finalDocumentId` válido permite mostrar una firma como completada;
- todos los firmantes requeridos deben constar firmados;
- el documento final debe pertenecer al expediente y estar vigente/accesible;
- preparar una solicitud no equivale a enviarla.

## 12. Orquestación y subagentes

La orquestación puede seleccionar skills/subagentes especializados, pero la policy común sigue siendo la autoridad.

Especialización actual/prevista:

- operaciones/administración;
- fiscal-contable;
- laboral;
- extranjería;
- comercial/servicios;
- comunicaciones;
- documentación/conocimiento.

Un subagente no puede ampliar permisos: hereda el actor, scope, tools autorizadas y límite de riesgo.

## 13. Health, presupuesto IA y proveedores

Los proveedores IA son sustituibles; KIA no depende semánticamente de uno solo.

El router puede trabajar con OpenAI, Anthropic y Gemini según configuración y fallback.

Health:

- comprobar disponibilidad real, no solo presencia de una API key;
- diferenciar fallo de proveedor, configuración, cuota y lógica KIA;
- evitar duplicar alertas globales de health;
- registrar anomalías accionables.

Coste:

- límites y budgets son guardrails operativos;
- los fallos de presupuesto deben cerrar de forma segura o degradar funcionalidad sin ejecutar acciones de mayor riesgo.

## 14. Restricciones por historial de migraciones

La recuperación de migraciones #143 estableció una regla permanente: el historial remoto de Supabase puede contener versiones distintas o aplicaciones semánticas duplicadas respecto a archivos locales.

Por tanto:

- migraciones nuevas: forward-only;
- no alterar el historial remoto salvo una reconciliación explícita, verificada y documentada cuando el esquema ya esté materializado;
- no asumir que un nombre local identifica de forma única una aplicación remota;
- validar esquema/funciones/triggers reales antes de reparar; una reparación de ledger no debe reejecutar SQL ya materializado;
- evitar backfills históricos salvo necesidad explícita;
- ejecutar Security/Performance Advisor después de DDL relevante;
- documentar reconciliaciones semánticas.

Los checkpoints de `docs/migration-history/` forman parte de la evidencia operativa.

## 15. Qué está implementado y qué sigue siendo roadmap

### Implementado

- KiaCopilotWidget como superficie canónica;
- chat in-app y contexto enriquecido;
- actor capabilities y policy-enforced decision;
- grants autoritativos y autorización por rol/canal/scope;
- artifacts derivados de resultados autorizados;
- visual/contextual system en superficies principales;
- trusted presentation signals y alertas fiscales estructuradas;
- Telegram KIA con identidad verificada;
- correo/calendario/reuniones contextuales;
- Hoja Registral v2;
- Admin Office read layer;
- Work connector y evidence-based task lifecycle;
- administrative_actions + approval service;
- eSignature auditable;
- Holded company-scoped con detected/enabled permissions;
- herramientas contables read/preparation;
- health/providers y presupuestos operativos;\n- operator lessons validadas y aplicadas al prompt final;\n- gates company-scoped para impedir comunicación/acciones externas cuando una empresa esté marcada como internal-only.

### Roadmap / no vender como disponible de forma general

- Local Connector genérico de escritorio fuera del conector Work controlado;
- ejecución automática general de trámites en sedes públicas;
- expansión completa de KIA Administración a todas las capacidades;
- Telegram Operations 360 y reply manual unificado;
- expansión visual completa de Sprint 5;
- escrituras Holded amplias sin gates específicos;
- escritura laboral sin consentimiento explícito;
- automatización autónoma de acciones R2+ sin aprobación;
- cobertura completa multi-tenant de todas las superficies;
- todos los subagentes especializados como servicios independientes.

## 16. Criterio para nuevas capacidades

Antes de añadir una capacidad a KIA deben existir respuestas afirmativas y verificables a:

1. ¿Cuál es la fuente de verdad?
2. ¿Quién es el actor?
3. ¿Cuál es el tenant/company/case scope?
4. ¿Qué tool/capability se habilita?
5. ¿Cuál es el riesgo y efecto?
6. ¿Qué aprobación o consentimiento exige?
7. ¿Qué evidencia demuestra el resultado?
8. ¿Cómo se revoca o corrige?
9. ¿Qué datos se registran y cuánto tiempo?
10. ¿Cómo falla de forma segura?

Si alguna respuesta no existe, la capacidad debe permanecer como roadmap o borrador, no como acción autónoma.
