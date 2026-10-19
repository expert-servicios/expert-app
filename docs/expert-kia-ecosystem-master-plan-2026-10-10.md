# EXPERT KIA Ecosystem — Plan Maestro canónico y registro de ejecución

**Fecha de aprobación del marco:** 10/10/2026 · **Versión:** 1.0 · **Propietario funcional:** Dirección EXPERT · **Repositorio:** `expert-servicios/expert-app` · **Rama base:** `main`  
**Estado global:** EN EJECUCIÓN · **ÚNICA FASE ACTIVA: E0** · **Última fase cerrada:** ninguna · **Transición a E1:** BLOQUEADA · **Congelación de alcance:** ACTIVA.  
**Naturaleza de este documento:** fuente canónica de orden de trabajo, definición de entregables, criterios de cierre y bitácora. No certifica funcionalidades en producción.

<!-- ECOSYSTEM_CHECKPOINT phase=E0 phase_status=IN_PROGRESS next=E0-M3-06-admin-users-tenant-object-scope-audit closed_phase=NONE scope_frozen=true production_flags=UNCHANGED -->

## 0. Mandato aprobado y reglas innegociables

Dirección EXPERT autoriza la ejecución progresiva del ecosistema aprobado, **E0 → E1 → E2 → E3 → E4 → E5 → E6**, sin abrir funcionalidades, líneas de trabajo o rediseños ajenos. Cada fase se subdivide en módulos verificables. **No iniciar desarrollo de la siguiente fase hasta que la actual esté finalizada, auditada, probada, con evidencias y cierre registrado en este archivo.** Las PRs documentales previas no equivalen a funcionalidades entregadas.

**Reglas de gobierno:**

1. **Una sola KIA** (orquestación común), con adaptadores y permisos efectivos específicos por web, cliente, Admin, soporte y Telegram; no crear cerebros paralelos.
2. **Un Workspace compartido** (patrón de componentes/layout y modelos coherentes) con **vistas Admin y Cliente diferentes por RBAC/RLS**, más modo soporte delegado que conserva el actor real. Compartir plantilla no significa compartir datos ni autorización.
3. **Una hoja registral operativa por sujeto autorizado**: ledger append-only + snapshot compacto, no reemplaza expedientes, contabilidad, correos ni fuentes vivas. No unir identidades por homonimia.
4. **No nuevas funcionalidades ni nuevas tareas de producto** hasta completar E6. Las correcciones de defectos, regresiones, vulnerabilidades y bloqueos estrictamente necesarias para superar un criterio aprobado son mantenimiento dentro de la fase; registrar causa, evidencia y alcance mínimo. Las ideas nuevas se anotan como **rechazadas/pospuestas fuera del alcance**, no se implementan ni se convierten en PR.
5. **No fusionar por intuición**. Exigir último `head_sha`, revisión de diff, typecheck, lint, build, tests, pruebas de seguridad y autorización, evaluación KIA cuando proceda, SQL/RLS cuando proceda, CI y ambas previews Vercel en verde. Ningún check verde histórico sustituye el del último commit.
6. **Sin cambios de datos de producción por defecto.** Las migraciones Supabase son forward-only, con preflight del ledger, aprobación de dependencias, plan de recuperación, aislamiento, RLS/grants y readback; conservar historial financiero y no ejecutar escrituras Holded sin permiso efectivo y aprobación/confirmación según riesgo.
7. **Feature flags apagadas** hasta el gate específico de activación (incluye privacidad, consentimiento, retención, seguridad, smoke en entorno autorizado y rollback ensayado). Merge de código ≠ migración ≠ activación ≠ entrega a usuarios.
8. Cada sesión de trabajo inicia leyendo **Checkpoint** y **Bitácora** de este archivo y comparándolos con la realidad de `main`, PRs y CI. Actualizar los estados **en el mismo PR o inmediatamente después de comprobar un resultado**. Nunca marcar completada una tarea sin evidencia enlazada.

**Aclaración operativa de Dirección (10/10/2026) — conexiones Holded de clientes de la asesoría:** Dirección confirma que ha configurado personalmente las conexiones Holded de sus cinco clientes y que no exige conservar ininterrumpidamente esas vinculaciones durante la recomposición. **Se permite contemplar desconexión y posterior reconexión cuando sea realmente necesaria para probar la arquitectura**, sin tratar la continuidad de las conexiones como bloqueo del proyecto. No implica orden de desconexión inmediata, ni autorización para borrar contabilidades, clientes, empresas, documentos o históricos, ni para operar con cuentas cruzadas. Antes de una desconexión real: (i) mapear cliente/empresa/tenant/conexión y diferenciar las filas actuales (cuatro activas y una revocada en la fotografía inicial) de los cinco clientes declarados; (ii) documentar permisos, identificadores no secretos, dependencias, sincronizaciones/automatizaciones y efectos; (iii) verificar que se puede volver a autenticar y que los datos de Holded permanecen íntegros; (iv) elegir ventana de pruebas y coordinación con Dirección si hay impacto operativo; (v) registrar evento, detener procesos dependientes, realizar desconexión acotada y probar posterior reconexión/readback; (vi) no eliminar históricos ni exponer tokens en la bitácora. Si basta simular una desconexión en pruebas, preferirlo. Aplicar gates E5 y seguridad E0; no alterar integraciones productivas en la fase E0.

9. Cerrar cada módulo con pruebas y resultados; cerrar la fase tras auditoría transversal, QA funcional ES/RU y móvil cuando corresponda, documentación, seguridad, regresiones, deploy, rollback y bitácora de cierre. **La fase cerrada se identifica por commit/PR y fecha.**
10. No sustituir la identidad humana ni prometer capacidades no operativas. KIA puede preparar, proponer y ejecutar solo lo que su actor y conector permiten; en actuaciones críticas requiere supervisión y trazabilidad.

### Definiciones de estado y formato de seguimiento

- `[ ] PENDIENTE`: no ejecutada; `[ ] BLOQUEADA`: falta dependencia o gate; `[ ] EN CURSO`: empezada sin completar verificación; `[x] HECHA`: evidencia objetiva enlazada.
- `[x]` **no equivale a aceptado en producción**: una fase requiere acta de salida además de todas sus tareas.
- El código de tarea es estable: `E#-M#-NN`. No renumerar después de comenzar. En cada PR incluir `fase/módulo/tareas`, cambios, evidencias, riesgos, aprobación y estado posterior.
- No se permite abrir `E(n+1)` si hay P0/P1 funcional, privacidad, acceso, contabilidad o prueba obligatoria sin resolver en `E(n)`.

### Anexo oficial de ideas V3 (sin permiso de ejecución)

Por petición de Dirección el 10/10/2026, las ideas que **sí** supongan nuevo alcance se registran exclusivamente en el documento independiente **[EXPERT KIA V3 — Banco de ideas y validación futura](expert-kia-v3-ideas-and-validation-backlog-2026-10-10.md)**. Se admiten propuestas de Dirección y del asistente, con ID, evidencia, reutilización, coste/riesgo hipotéticos, dependencias y criterios de validación.

**Regla de prioridad:** se permite **documentar y depurar ideas V3 durante E0–E6** pero se prohíbe ejecutarlas, abrir PR de runtime V3, activar integraciones, cambiar condiciones comerciales o adelantar fases. La aprobación anterior de *congelación de alcance* se mantiene íntegra. V3 se revisará **solo después del acta E6 COMPLETADA** y necesitará nueva decisión expresa de Dirección. Los defectos P0/P1 y mejoras ya comprendidas en E0–E6 deben resolverse en el Plan Maestro, no posponerse a V3.

## 1. Objetivo, arquitectura y límites del producto

**Objetivo:** un recorrido coherente **descubrimiento → consulta → solicitud → colaboración → tramitación → seguimiento → historial → automatización supervisada** sin fracturas entre web, cliente, Admin y KIA.

| Capa | Superficie / contrato | Fuente de verdad y barreras |
| --- | --- | --- |
| Pública | `expertconsulting.es`: home, servicios puntuales, KIA pública, blog, guías, FAQs, plataforma, contacto y acceso | Solo información pública/consentida, sin lecturas de expedientes. La conversación anónima no crea lead ni vincula identidades automáticamente. |
| Operativa | Workspace V2: Cliente, Admin y modo soporte. Componentes y diseño comunes Kiranism-inspirado, no transplantar la app/Clerk | Supabase Auth, permisos comprobados en servidor, RLS, tenant/company/case scope y trazabilidad de actor original. |
| Inteligencia | Un núcleo KIA; enrutamiento a skills/subagentes existentes y adaptadores por canal; propuesta/preview/aprobación/readback para efectos | Política efectiva por rol, canal, empresa y nivel R0–R5. Sin permisos inferidos de mensajes, identidad o UI. |
| Memoria | Hoja registral (eventos probados + snapshot), conversaciones y resúmenes tipados | Contexto rápido, con fuente, versión, vigencia, discrepancias y acceso limitado; nunca sustituye consulta actual a AEAT/TGSS/Holded cuando se exigen datos vivos. |
| Conocimiento | Catálogo, FAQ, artículos, guías, fuentes oficiales y corpus privado autorizado | Proveniencia/fecha, separación público-privado, respuesta verificable ES/RU, abstención cuando no se puede comprobar. |
| Integraciones | Holded, correo, calendario/Meet, documentos, Telegram, Stripe y conectores ya previstos | Conexión real, permisos por tenant, consentimiento, idempotencia, auditoría, coste y políticas de datos. |

**Decisiones acotadas:** el hero Ksenia + KIA y la reorganización editorial pertenecen a **E1**; no autorizar generación/publicación antes. La hoja registral pertenece a **E3** aunque ya existan piezas; se auditan antes de declarar paridad. Las propuestas de Studio, PPTX, agentes gestionados o paquetes de créditos de otros documentos **no amplían por sí mismas** el alcance aprobado: en E5/E6 solo se implementan los entregables originalmente descritos y validados.

## 2. Documentos existentes: precedencia y dependencias

Este documento **prevalece en orden, límites, bloqueos y estado de ejecución**, sin borrar especificaciones técnicas previas. En caso de contradicción, registrar decisión antes de código; no sobrescribir decisiones históricas ni asumir que planes equivalen a código.

| Documento / PR existente | Papel en E0–E6 | Estado verificado 10/10/2026 |
| --- | --- | --- |
| [Plan Admin V2](expert-admin-v2-plan-maestro-2026-10-09.md) y [PR #708](https://github.com/expert-servicios/expert-app/pull/708) | Contrato de Workspace/mode soporte para E2, con componentes Kiranism, Inbox 360, auditoría y aislamiento | Documento en main + PR abierta, **no son entrega E2**. |
| [KIA 2.0](kia-2-strategy.md), [KIA Work](kia-workspace-execution-2026-10-09.md) y [PR #707](https://github.com/expert-servicios/expert-app/pull/707) | Reutilizar orquestador, políticas, herramientas y subagentes en E4; integración visual transversal se especifica E0 y se monta en E2 | Especificaciones y PR abierta; capacidades nuevas no activadas. |
| [Hoja registral](kia-client-ledger.md) | Contrato ledger/snapshot, identidad estable, uso por KIA, versionado, RLS para E3 | Existe documentación y parte de implementación; falta auditoría integral E3. |
| [PR #709](https://github.com/expert-servicios/expert-app/pull/709) | Auditoría pública, diseño del hero, ES/RU, SEO, CTAs, contenidos y navegación E1; monetización solo E6 | PR abierta solo documental. |
| [Roadmap histórico](roadmap.md) y [Arquitectura histórica](architecture.md) | Referencias de contexto. **No habilitan iniciar fases o canales en paralelo**, ni revertir decisiones recientes (WhatsApp, catálogo, ICP, etc.). | No son plan de ejecución activo. |
| [PR #704](https://github.com/expert-servicios/expert-app/pull/704), [#706](https://github.com/expert-servicios/expert-app/pull/706), [#705](https://github.com/expert-servicios/expert-app/pull/705) | Subsistema KIA público existente: conservar #704/#706; decidir #705 con su QA/activación separada antes de usar persistencia | #704 y #706 fusionadas; #705 abierta en verificación. |
| [PR #683](https://github.com/expert-servicios/expert-app/pull/683) | Incidencia anterior de botones públicos; clasificar regresión y resolver dentro del gate aplicable E1 | PR abierta; no es fase nueva. |

**Divergencias a resolver dentro de E0:** (a) público B2B asesorías frente a clientes finales: dos recorridos claros sin dos productos; (b) catálogo de servicios puntuales frente a páginas antiguas de suscripciones, sin alterar contratos existentes; (c) Telegram + chat web como canales activos, no reintroducir WhatsApp Business; (d) KIA única, no múltiples bots autónomos; (e) «misma plantilla» = design system compartido, autorización separada; (f) el enriquecimiento de leads propuesto en Admin V2 no se inicia antes del módulo aprobado E2; (g) ningún diseño de planes/precios de #709 es precio comercial aprobado.

## 3. Secuencia de fases y dependencia estricta

| Orden | Fase | Resultado verificable | Estado |
| --- | --- | --- | --- |
| E0 | **Definición canónica y freeze** | Modelo de producto, permisos, identidad, fuente de verdad, inventario y plan único firmado en git | **EN CURSO** |
| E1 | **Identidad y web pública** | Hero Ksenia+KIA, posicionamiento, arquitectura editorial, navegación/CTAs, ES/RU, pruebas y accesibilidad | **BLOQUEADA por E0** |
| E2 | **Workspace unificado** | Shell compartido Admin/Cliente, vistas por permisos, soporte delegado, copiloto contextual, módulos y responsive | **BLOQUEADA por E1** |
| E3 | **Hoja registral** | Ledger y snapshot verificados, eventos/actores/proveniencia, integración por sujeto, privacidad y recuperación | **BLOQUEADA por E2** |
| E4 | **KIA Intelligence** | Un núcleo/capabilities/skills por contexto, fuentes fiables, proactividad justificada, continuidad, ES/RU | **BLOQUEADA por E3** |
| E5 | **Integraciones y operaciones** | Holded, agenda, correo, documentación, expedientes y acciones acotadas con auditoría, idempotencia y permisos | **BLOQUEADA por E4** |
| E6 | **Monetización y escalado** | Consumo IA medible, políticas económicas, condiciones de acceso, coste, seguridad, piloto y cierre global | **BLOQUEADA por E5** |

### Gate obligatorio al finalizar **cada módulo**

`G-M1` cambios concretos con IDs y PR; `G-M2` QA de aceptación y regresión pertinente; `G-M3` accesibilidad y ES/RU + móvil si hay UI; `G-M4` autorización/aislamiento/privacidad; `G-M5` evidencia adjunta y lectura posterior; `G-M6` incidencias P0/P1 = 0. Si un gate no aplica, justificar «N/A» con evidencia.

### Gate obligatorio al finalizar **cada fase**

`G-F1` todos los módulos HECHOS; `G-F2` CI verde último SHA (typecheck/lint/build/tests/evals); `G-F3` ambas previews Vercel verdes; `G-F4` pruebas reales en entorno autorizado + no regresión y seguridad; `G-F5` migración/RLS/operación Holded: preflight, readback, no alteración financiera y rollback, o N/A razonado; `G-F6` revisión de privacidad, retención y costes; `G-F7` acta de cierre con commit, fecha, evidencias, defectos 0, siguiente fase desbloqueada. No declarar «HECHA» por redactar un plan ni por tener CI parcial.

## 4. Backlog congelado y tareas con evidencia

### E0 — Definición canónica (única fase activa)

**Módulo E0-M1 — Inventario y recuperación**
- [x] `E0-M1-01` Confirmar repositorio canónico `expert-servicios/expert-app` y `main`. Evidencia: consulta GitHub del 10/10/2026.
- [x] `E0-M1-02` Identificar y comparar fuentes relevantes: Admin V2, KIA 2.0, Client Ledger, Workspace Work, roadmap histórico y PR #705/#707/#708/#709/#683. Evidencia: documentos y metadatos citados en §2.
- [ ] `E0-M1-03` Auditar exhaustivamente contratos de código y determinar qué es ya operativo, parcial o exclusivamente plan (rutas, datos, grants y UX).
  - **Avance 10/10:** primera y segunda pasadas guardadas en [inventario de auditoría E0](expert-kia-ecosystem-e0-audit-inventory-2026-10-10.md); hallazgos P1 de procedencia registral y control de usuarios inactivos en APIs. **NO marcar completada hasta pruebas y corrección.**
- [ ] `E0-M1-04` Registrar matriz de dependencias con cada PR abierta: fusionar después de gates, detener o trasladar a su fase, **sin código paralelo**.
- [ ] `E0-M1-05` Conciliar **cinco clientes Holded declarados** con filas técnicas de integración (cuatro activas/una revocada en la fotografía del 10/10), asignar empresa/tenant y dependencias; redactar protocolo reversible de desconexión/reconexión **sin ejecutarlo en E0**.

**Módulo E0-M2 — Decisiones arquitectónicas**
- [ ] `E0-M2-01` Congelar mapa de actores (visitante, lead, cliente, operador, Admin, soporte), scopes y matriz read/draft/write por canal.
- [ ] `E0-M2-02` Validar sistema visual y navegación compartidos, módulos exclusivos, soporte sin impersonación, y único dock KIA.
- [ ] `E0-M2-03` Congelar contratos de ledger, fuentes vivas, KIA única, corpus público/privado, ES/RU e historial.
- [ ] `E0-M2-04` Validar journeys web público: servicios puntuales, usuarios/empresas y asesores, sin prometer capacidades no entregadas.
- [ ] `E0-M2-05` Congelar control de scope y criterios de aceptación medibles por fase, cobertura y reversión.

**Módulo E0-M3 — Auditoría y cierre de fase**
- [ ] `E0-M3-01` Actualizar y cruzar PR #707/#708/#709 con las decisiones canónicas, sin ampliar alcance.
- [ ] `E0-M3-02` Revisión crítica independiente de coherencia, riesgos, dependencias, privacidad, autorización y definición de pruebas.
- [x] `E0-M3-05` Cerrar P1 de procedencia registral no atestada en servidor en altas de empresa (rutas `/api/companies` y `/api/company/associate`), mediante patch mínimo, tests negativos y validación sin modificar históricos. Evidencia: PR #712 / merge `a72f8795b153441b23eed40d5154f71550800b8e`, CI #3480, ambas previews Vercel y auditoría agregada de producción del 11/10/2026 (7 empresas; 0 fuentes, 0 verificaciones, 0 snapshots y 0 bloqueos registrales).
- [ ] `E0-M3-06` Cerrar P1 de rutas mutadoras con `getSupabaseAdmin()` sin `profiles.status` activo ni scope por objeto; comprobar por rol/tenant/empresa/expediente, HTTP y RLS en entorno de prueba.
  - **Avance parcial 11/10/2026:** PR #715 cerró cuatro rutas administrativas y 11 handlers; PR #716, cuatro mutaciones de Operations 360; PR #717, Team/Directorio/Company 360; PR #718, subida documental aislada por `cases.tenant_id`; PR #719, lectura y ciclo de vida de acciones de firma; PR #720, intake empresarial e informes financieros; PR #721, capacidades KIA, perfiles de política y dashboard; PR #722, revocación exact-active de KIA Work antes de leer expedientes y dentro de transacciones; PR #723, tenant canónico y scope por objeto en altas/listados/intake empresariales y revocación del listado financiero; PR #724, revocación exact-active previa a lecturas privilegiadas en detalle y exportes de informes; PR #725, revocación exact-active previa a lecturas y mutaciones de la cesta KIA; PR #726, revocación exact-active previa a la lectura privilegiada de notificaciones fiscales; PR #727, revocación exact-active previa a la lectura privilegiada del feedback KIA, conservando scope por cliente y canal; PR #728, revocación exact-active previa a listar o crear tenants; PR #729, revocación exact-active previa a generar el estado OAuth de Microsoft 365; PR #730, revocación exact-active previa a leer agregados administrativos y financieros del dashboard; PR #732, revocación exact-active previa a los ocho agregados de reportes administrativos; PR #731, revocación exact-active en la guardia administrativa compartida y sus consumidores; PR #733, revocación exact-active previa a la lectura externa de facturas y agregados Holded; PR #739, alcance tenant/cliente/empresa/membresía y vinculación de acción en las acciones de firma de expedientes; PR #740, actor exact-active, alcance tenant/empresa/membresía y vinculación de objeto en propuestas contables; PR #741, actor exact-active y alcance tenant/empresa/membresía antes de leer el índice documental o invocar Google Drive. Los lotes reutilizan controles existentes y pasaron CI/Vercel, pruebas negativas y gates PostgreSQL aplicables. La tarea permanece abierta hasta completar el inventario restante y la matriz de scope por objeto.
- [ ] `E0-M3-07` Evaluar P2 del lookup CIF limitado y divulgación de identificadores ajenos; corregir sin duplicar entidad ni adelantar módulos.
- [ ] `E0-M3-03` Verificar CI, lint Markdown/enlaces/estructura (si disponible), revisión de PR y previews del último SHA.
- [ ] `E0-M3-04` Acta E0: lista de artefactos, evidencia de QA, cero bloqueos P0/P1, commit de cierre y cambio explícito del checkpoint a E1.

### E1 — Identidad y capa pública (**no iniciar hasta gate E0**)

**Módulo E1-M1 — Identidad visual y hero**
- [ ] `E1-M1-01` Auditar identidad visual real, assets autorizados de Ksenia/avatar KIA y estado actual de la home.
- [ ] `E1-M1-02` Diseñar e implementar hero conjunto Ksenia+KIA, texto y CTAs contrastados y accesibles.
- [ ] `E1-M1-03` Revisar desktop/tablet/móvil, tamaños, rendimiento y SEO/social share.

**Módulo E1-M2 — Navegación, servicios y conocimiento**
- [ ] `E1-M2-01` Unificar navegación Soluciones/Servicios/Plataforma/Recursos/Contacto/Acceso/KIA sin duplicar rutas.
- [ ] `E1-M2-02` Clasificar blog, FAQ, base de conocimiento, guías, Academy y herramientas; evitar contenido duplicado.
- [ ] `E1-M2-03` Revisar fichas y CTAs con catálogo puntual vigente; no introducir nuevas suscripciones/precios por interpretación.
- [ ] `E1-M2-04` Verificar ES/RU, fuentes, SEO, redirecciones, legal, consentimiento y captación de origen con evidencias.
- [ ] `E1-M2-05` Evaluar chat público existente, botones, adjuntos, voz y persistencia #705 con gate separado de activación; no asumir que están habilitados.

**Módulo E1-M3 — QA y salida pública**
- [ ] `E1-M3-01` Pruebas E2E de navegación, CTA, formulario, reserva, KIA, enlaces y accesibilidad en ambos idiomas.
- [ ] `E1-M3-02` Auditoría de seguridad, privacidad, reCAPTCHA/rate limit, métricas, CI/previews, deploy controlado y rollback.
- [ ] `E1-M3-03` Acta de cierre E1 y habilitación documentada de E2.

### E2 — Workspace único (**bloqueada**)

**Módulo E2-M1 — Shell y permisos**
- [ ] `E2-M1-01` Inventariar pantallas y desplegar tokens, navegación y componentes Kiranism-inspirados (sin sustituir Supabase Auth).
- [ ] `E2-M1-02` Diferenciar rutas/acciones Cliente, Admin, soporte; actor real y autorización en servidor/RLS.
- [ ] `E2-M1-03` Compactar UI y resolver dock KIA único, solapes, móvil, foco y accesibilidad.

**Módulo E2-M2 — Operación modular**
- [ ] `E2-M2-01` Unificar Resumen, Perfil, Empresas, Expedientes, Documentos, Comunicaciones, Agenda, Tareas, Facturación e Integraciones reutilizando endpoints seguros.
- [ ] `E2-M2-02` Modo soporte cliente completo sin impersonación: configuración, conexiones, actividad y consentimiento/aprobaciones según efecto.
- [ ] `E2-M2-03` Auditoría de accesos, cambios, dispositivos/sesiones, relaciones, origen de leads e Inbox 360.
- [ ] `E2-M2-04` Copiloto contextual único integrado en shell con empresa/expediente y política de proactividad.

**Módulo E2-M3 — QA y cierre**
- [ ] `E2-M3-01` Matriz E2E de rol, tenant, soporte, permisos revocados, sesiones, responsive ES/RU y regresión.
- [ ] `E2-M3-02` Auditoría final, CI/previews, pilotos y rollback.
- [ ] `E2-M3-03` Acta cierre E2 → E3.

### E3 — Hoja registral (**bloqueada**)

**Módulo E3-M1 — Modelo y datos**
- [ ] `E3-M1-01` Auditar tablas/ledger/snapshot presentes y cerrar contrato sujeto persona/empresa/expediente, fuente, fecha, vigencia y relaciones.
- [ ] `E3-M1-02` Eventos inmutables y proyecciones idempotentes; origen/actor/consentimiento; evitar entidades duplicadas.
- [ ] `E3-M1-03` Migraciones necesarias solo con preflight y aislamiento de tenants, RLS, retención y borrado.

**Módulo E3-M2 — Continuidad verificable**
- [ ] `E3-M2-01` Ingesta de comunicaciones/tareas/expedientes/integraciones autorizadas, sin copiar secretos ni adjuntos íntegros.
- [ ] `E3-M2-02` Contexto compacto para KIA con fuentes y abstención, snapshots versionados y reconciliación con fuente viva.
- [ ] `E3-M2-03` UI de hoja registral y trazas por persona/empresa/expediente, accesible solo al rol permitido.

**Módulo E3-M3 — QA y cierre**
- [ ] `E3-M3-01` Pruebas de IDOR, RLS, pertenencia, revocación, duplicados, reconexión, datos obsoletos, concurrencia, borrado y recuperación.
- [ ] `E3-M3-02` Acta cierre E3 → E4.

### E4 — KIA Intelligence (**bloqueada**)

**Módulo E4-M1 — Núcleo único**
- [ ] `E4-M1-01` Consolidar `kia-orchestrator`, skill registry, subagent router y adaptadores existentes sin duplicarlos.
- [ ] `E4-M1-02` Política por actor/canal/empresa/expediente y nivel de riesgo; confirmación antes de efectos sensibles.
- [ ] `E4-M1-03` KIA coherente en widget/Cliente/Admin/soporte/Telegram; ES/RU, formato legible, voz existente y adjuntos con controles.

**Módulo E4-M2 — Conocimiento y proactividad**
- [ ] `E4-M2-01` Retrieval con jerarquía ledger → contexto → corpus autorizado → fuente viva, respetando finalidad y acceso.
- [ ] `E4-M2-02` Fuentes oficiales/KB/blog curados, fecha de vigencia y referencias; pruebas de incertidumbre y no invención.
- [ ] `E4-M2-03` Skills/subagentes fiscal, laboral, contable, documental, comunicaciones, comercial y marketing **dentro del alcance existente**; sin sistemas autónomos añadidos.
- [ ] `E4-M2-04` Proactividad contextual con justificación, capacidad real y consentimiento; sin suposiciones sobre expedientes.

**Módulo E4-M3 — QA y cierre**
- [ ] `E4-M3-01` Evals ES/RU, prompt-injection, permisos, fidelidad a fuentes, contexto, coste/latencia, concurrencia y continuidad.
- [ ] `E4-M3-02` Acta cierre E4 → E5.

### E5 — Integraciones y operaciones (**bloqueada**)

**Módulo E5-M1 — Integraciones autorizadas**
- [ ] `E5-M1-01` Holded company-scoped: lectura, capability discovery, paridad efectiva de operaciones autorizadas, límites explícitos.
- [ ] `E5-M1-04` Si una prueba exige reset de integración, ejecutar desconexión/reconexión **selectiva y reversible** por cliente, con revisión de efectos, control de tareas/sync, coordinación operativa, trazabilidad y readback; no sacrificar históricos financieros.
- [ ] `E5-M1-02` Correo/Inbox 360, calendario, citas/Meet y Telegram enlazados a identidad real y tareas.
- [ ] `E5-M1-03` Documentos, expedientes, artefactos y borradores sin automatizar escrituras externas sin aprobación.

**Módulo E5-M2 — Ejecución y control**
- [ ] `E5-M2-01` Propuesta → preview → aprobación → acción → readback → auditoría → compensación/rollback cuando aplica.
- [ ] `E5-M2-02` Idempotencia, revocación, rotación, aislamiento, reintentos, errores, límites/costes y trazabilidad por actor.
- [ ] `E5-M2-03` Piloto supervisado con datos sintéticos/entorno autorizado y contabilidad sin alterar históricos.

**Módulo E5-M3 — QA y cierre**
- [ ] `E5-M3-01` E2E de lectura/escritura según permisos, notificaciones, cancelación, integridad documental y fallos de proveedores.
- [ ] `E5-M3-02` Acta cierre E5 → E6.

### E6 — Monetización, límites y escalado (**bloqueada**)

**Módulo E6-M1 — Gobierno económico**
- [ ] `E6-M1-01` Inventario de accesos/servicios comerciales aprobados; evitar inferir precios o suscripciones desde documentos de diseño.
- [ ] `E6-M1-02` Medir consumo real IA por provider/tenant/tarea con coste, margen, trazabilidad, alertas, cuota y protección contra abuso.
- [ ] `E6-M1-03` Diseñar y revisar mecanismos de acceso/crédito/top-ups solo como concreción del alcance económico aprobado, sujetos a evaluación legal/fiscal, sin lanzar planes no aprobados.

**Módulo E6-M2 — Preparación de escala**
- [ ] `E6-M2-01` Seguridad multi-tenant, límites, observabilidad, backups/DR, retención, protección de datos y operación comercial.
- [ ] `E6-M2-02` Piloto completo del viaje público → cliente → soporte → hoja registral → KIA → integraciones → trazabilidad de coste.

**Módulo E6-M3 — Cierre integral**
- [ ] `E6-M3-01` Auditoría global de seguridad, UI ES/RU, accesibilidad, procesos, documentación, migraciones, costes y regressions.
- [ ] `E6-M3-02` Registrar verificación en producción, incidentes, rollback probado, acta global y estado ECOSISTEMA COMPLETADO.

## 5. Plantilla obligatoria de evidencia para cada tarea

```text
Tarea: E#-M#-NN | Estado: PENDIENTE/EN CURSO/BLOQUEADA/HECHA
Fecha UTC / Responsable / PR / HEAD_SHA / Commit fusionado
Alcance exacto y archivos modificados:
CI: typecheck / lint / build / tests / evals / SQL (N/A fundamentado)
Vercel app / ksenia-expert: URLs, HEAD y resultado
Seguridad: actor, RBAC/RLS, tenants, auditoría, privacidad, retención
QA: manual/E2E, móvil, idiomas, escenarios negativos
Migración: ninguna o preflight + id + readback + rollback
Incidencias abiertas: prioridad, acción correctiva, responsable
Resultado y siguiente tarea autorizada:
```

**Definition of Done:** cambios verificables, sin regresión P0/P1, verificación positiva/negativa, política de acceso, evidencia y actualización de esta lista. Si hay errores, **no cerrar la tarea**; corregir dentro del mismo módulo.

## 6. Bitácora cronológica y checkpoint de continuidad

### 2026-10-10 — Alta del Plan Maestro E0

- **Decisión:** adoptar un solo plan canónico, fases E0–E6 secuenciales, freeze de scope, checkpoints persistentes y pruebas antes de transiciones. Aprobación funcional por Dirección en conversación del 10/10/2026.
- **Evidencia inicial:** repositorio `expert-servicios/expert-app` accesible; fuentes actuales de Admin V2, KIA 2.0, Client Ledger y KIA Work identificadas. PR #707, #708, #709 (documentales), #705 (KIA web persistente) y #683 (botones públicos) aún abiertas en comprobación inicial. #704 y #706 estaban fusionadas.
- **Estado real:** E0-M1-01 y E0-M1-02 verificados. Todo lo demás permanece pendiente hasta auditoría. Ningún cambio de feature flag, migración o producción autorizado por este documento.
- **Siguiente paso inequívoco:** `E0-M1-03` — auditar realidad de código, UI, fuentes y permisos; después `E0-M1-04` — registrar disposición de PRs abiertas y dependencias. **No comenzar E1.**
- **Regla de recuperación:** en cualquier nueva sesión: abrir este archivo desde `main` (o PR activa si no fusionada), leer cabecera y bitácora, validar estado GitHub/CI/Deploy contra último SHA, continuar con «Siguiente paso», actualizar lista y esta bitácora. Si hay contradicción, detener transición y resolverla dentro de E0.

### 2026-10-10 — Aclaración de Holded en auditoría E0

- Dirección confirma **cinco clientes de asesoría** con conexiones Holded configuradas por ella y acepta desconexión temporal/revinculación **cuando sea necesario** para integración y pruebas. Es una instrucción de flexibilidad operativa, no una solicitud de desconexión inmediata.
- Inventario técnico previo: cinco **filas de integración** (cuatro activas y una revocada). No afirmar que correspondan una a una a cinco clientes sin conciliar identidad y empresa.
- **Decisión de riesgo:** no bloquear arquitectura para preservar tokens/conexiones; sí preservar datos y fiscalidad en Holded, permisos, consentimientos, históricos, tareas y trazabilidad. Probar con simulación antes de intervenir en conexiones reales.
- **Siguiente paso E0:** avanzar E0-M1-03 (auditoría endpoints, capacidades y dependencias) y E0-M1-05 (conciliación técnica). No activar ni desconectar servicios ahora.

### 2026-10-10 — Segunda pasada de seguridad y eficiencia E0

- Registro objetivo: [auditoría E0 del código, esquema y propuestas](expert-kia-ecosystem-e0-audit-inventory-2026-10-10.md), actualizada en commit `c3797fe423b0c410e38999101b54417c9bb2959f`.
- **Mejoras propuestas dentro del alcance:** P1 procedencia empresarial de servidor, P1 comprobación de usuario activo en APIs mutadoras, P2 deduplicación CIF sin filtros limitados ni divulgar IDs; ampliar cobertura de pruebas negativas y matriz de evidencias.
- **Decisión:** no cerrar E0 ni iniciar E1 mientras P1 sin pruebas/corrección; no modificar producción, Holded, RLS, facturación ni flags sin gate.
- **Siguiente paso:** completar inventario de endpoints por actor, diseñar cambios mínimos y tests de seguridad; verificar última CI/preview de PR #710; documentar cierre únicamente con evidencia real.

### 2026-10-10 — Banco de ideas de evolución V3, sin afectar a E0

- Documento creado: [V3 — ideas y validación futura](expert-kia-v3-ideas-and-validation-backlog-2026-10-10.md), commit `ba8aa940d794538e5e6d3d3c19ad56fd20ae51df`.
- 22 propuestas hipotéticas V3 documentadas (inteligencia, operaciones, integraciones y calidad). No están aprobadas ni activas. Toda nueva propuesta se añade ahí con ID y evidencia, **sin sustituir ni acelerar ninguna fase E0–E6**.
- Se confirma congelación E0–E6, E0 sigue siendo única fase activa. Próximo paso continúa siendo auditoría de autorización/procedencia y sus pruebas.

### 2026-10-10 — Cierre acotado #711 y comienzo del segundo bloqueo #712

- **PR #711 fusionada** con commit `f15b859db65b3aa82b8b79ec75bbc74c4203f19e`. CI y ambas previews verdes en último HEAD previo a la fusión; se añadió `requireActiveActor` y pruebas negativas de usuario inactivo para endpoints de empresas/expedientes. **La auditoría del resto de APIs y aislamiento de entidades permanece abierta**; no declarar resuelto E0-M3-06 integralmente.
- **PR #712 en borrador**: mitigación fail-safe del origen registral: no aceptar aserciones `_registryOfficial` ni nombres de fuentes enviados por el navegador como certificación; no crear bloqueos automáticos desde sugerencias y no modificar datos existentes. **Pruebas y CI pendientes**. La verificación positiva server-side de procedencia y la auditoría histórica de registros aún son necesarias antes de cerrar E0-M3-05.
- **Siguiente paso inequívoco:** CI/QA y tests negativos #712; revisar proveedor/flujo para atestación server-side sin confiar en `company_data_suggestions` editable por usuario; continuar E0-M1-03/M3-05/M3-06; mantener E1/V3 bloqueadas.

### 2026-10-10 — Continuidad fuera del chat y estado de PR #712

- Se verificó acceso al repositorio y estado de #712 en el último HEAD `491a98e5e11841bd6df50792a1605357c1df052e`: **CI GitHub Actions completo success; Vercel app y ksenia-expert success**, sin hilos/reviews pendientes. **Permanece DRAFT/NO MERGED**, porque las pruebas añadidas son principalmente inspecciones estáticas: falta QA HTTP negativa con payload falsificado y flujo real de alta, revisión del comportamiento UI, y criterio de tratamiento de datos registrales marcados previamente.
- Revisión de código: tanto `/api/companies` como `/api/company/associate` establecen un fail-safe `registryOfficial = false`, evitando crear nueva verificación o bloqueo registral a partir de claims de navegador. El flujo conserva precarga manual; la atestación server-only genuina aún no está diseñada/validada. No se modificaron datos ni permisos productivos en esta revisión.
- **Seguimiento fuera del chat:** hay tarea recurrente de ChatGPT `Ejecución EXPERT KIA` **habilitada**, diaria aproximadamente a las 08:00 Europe/Madrid, que toma este checkpoint como fuente; **no equivale** a un controlador de ejecución continua en GitHub ni garantiza que los conectores permanezcan disponibles. La tarea no ha tenido todavía ninguna ejecución y sus avisos push/email aparecen deshabilitados en la configuración actual; no prometer notificaciones hasta que se activen desde ajustes.
- **No se necesita mantener el chat abierto.** No se ejecuta nada fuera de las sesiones salvo las tareas programadas reales. Toda continuación debe dejar evidencia en GitHub antes de declarar cambios hechos; producción, migraciones, Holded y E1–E6 permanecen protegidos por sus gates.
- **Siguiente acción concreta:** pruebas HTTP de #712 (no solo tests que leen archivos), pruebas de flujo manual y sugerencia, revisar registros históricos ya marcados, y completar gates antes de fusionar; continuar E0-M1-03/E0-M3-05. No pasar a E1 ni abrir V3.

### 2026-10-11 — Continuidad Workspace V2: integración documental de pilotos

- Se fusionó [PR #714](https://github.com/expert-servicios/expert-app/pull/714), exclusivamente documental, con commit `773dde979895a3fdf1add3fa34da191b7d7c75d7`. El HEAD aprobado `20f6dbb525423420268a56fdfd1d79d67d8da77f` pasó CI (run 38125582044) y ambas previews Vercel; se corrigió la prueba de higiene `public-docs-no-production-stripe-ids` eliminando IDs Stripe de la documentación. Seis pilotos documentados, sin crear conexiones, mover datos contables ni modificar facturación.
- E0 sigue **EN CURSO**: no se han satisfecho los requisitos de cierre E0-M3-05/E0-M3-06 ni existe acta de salida a E1; E2 Workspace V2 permanece bloqueada por diseño secuencial. Esta fusión no cambia fase, flags ni nivel de madurez de KIA.
- Siguiente paso de implementación dentro del alcance vigente: terminar QA HTTP de [PR #712](https://github.com/expert-servicios/expert-app/pull/712), contrastar casos negativos de atribución oficial falsa, verificar readback e historial de registros, cerrar auditoría de APIs privilegiadas, adjuntar evidencia por SHA y decidir fusión. No publicar nuevas funcionalidades E2 antes del acta E0 y la finalización E1.

### 2026-10-11 — QA HTTP y actualización de base de PR #712

- Revisión sobre HEAD `f8928f9538d4a0d7f4560578d0432d76003fb2b7`: el patch continúa siendo fail-safe y acotado; impide que claims `_registryOfficial`, snapshots o nombres de fuente controlados por navegador creen verificación/bloqueos registrales. No contiene migraciones ni escrituras sobre datos existentes.
- Evidencia automática: workflow CI [#3474](https://github.com/expert-servicios/expert-app/actions/runs/38118745467) completado correctamente en el HEAD citado: typecheck, lint, build, tests, MCP, baseline Supabase, KIA evals e integraciones PostgreSQL. Las nuevas pruebas ejecutan ambos handlers HTTP con Supabase sintético y cubren 401 sin escritura, claim oficial falsificado, alta manual, falta de confirmación, fuentes manipuladas y reutilización de empresa realmente vinculada.
- La rama se actualizó sobre `main`; tras el merge de base, el HEAD `b7431de3d28e6fc5d5076e50012a5b1fad22dfaa` pasó CI [#3476](https://github.com/expert-servicios/expert-app/actions/runs/38126269400) completo y ambas previews Vercel: [app](https://vercel.com/expertapp/app/HU8ofEN2Rdc6hEEEiEZh2Zr8dM2Y) y [ksenia-expert](https://vercel.com/expertapp/ksenia-expert/39by9xzvjJqsXrD3R1shUuqQUSWh). Sin hilos de revisión pendientes.
- Mientras corrían los gates, `main` avanzó con la PR documental #714 y su checkpoint; se integra de nuevo esa base sin alterar el runtime de #712 y se exige otro CI/Vercel sobre el nuevo HEAD exacto antes de fusionar.
- **Alcance pendiente de E0-M3-05:** el merge de la mitigación no certifica atestación registral positiva. Sigue pendiente diseñar/validar evidencia server-side no escribible por usuario y auditar el tratamiento de filas históricas ya marcadas, sin limpieza masiva ni modificación productiva. E0-M3-05 continúa EN CURSO y E1 permanece bloqueada.
- **Gate final y fusión:** el HEAD `9662db251fcb177abe912bf79911ed1102873b9a` pasó CI [#3480](https://github.com/expert-servicios/expert-app/actions/runs/38126757411) completo (typecheck, lint, build, tests, KIA evals y jobs PostgreSQL/Supabase) y ambas previews Vercel: [app](https://vercel.com/expertapp/app/3sUifxBrmn3BU1j139GQnuhxikPM) y [ksenia-expert](https://vercel.com/expertapp/ksenia-expert/5vBV47gX5fRxsCzENpXX3p8FNsB9). La rama estaba actualizada, sin hilos y el merge usó lease sobre ese SHA.
- [PR #712](https://github.com/expert-servicios/expert-app/pull/712) fusionada en `main` con commit `a72f8795b153441b23eed40d5154f71550800b8e`. Queda cerrada la vía de creación de nuevas marcas/bloqueos registrales desde claims de navegador; no se ejecutaron migraciones, cambios de flags ni escrituras sobre registros productivos.
- **Auditoría histórica no destructiva:** consulta agregada de solo lectura del 11/10/2026 sobre `public.companies`: 7 filas; 0 con `registry_source`, 0 con `registry_verified_at`, 0 con snapshot no vacío y 0 con campos bloqueados. No se extrajeron identificadores ni se ejecutaron escrituras.
- **Decisión de cierre E0-M3-05:** el contrato actual de `company-data-resolver` clasifica expresamente todas las salidas como sugerencias y ningún proveedor integrado aporta hoy una atestación registral positiva con evidencia server-only. Se mantiene la verificación positiva deshabilitada por diseño. Cualquier futura habilitación exigirá contrato de proveedor, evidencia no escribible por usuario, RLS/grants, migración y gate explícito; no se presupone en E0.
- **Siguiente acción concreta:** E0-M3-06 — completar inventario de rutas privilegiadas/mutadoras, estado activo y scope por objeto con pruebas HTTP/RLS. E0 sigue EN CURSO; no abrir E1 ni V3.

### 2026-10-11 — Merge de mitigación registral #712 y continuación E0

- PR [#712](https://github.com/expert-servicios/expert-app/pull/712) **fusionada** con commit `a72f8795b153441b23eed40d5154f71550800b8e` tras CI [#3480](https://github.com/expert-servicios/expert-app/actions/runs/38126757411) success para HEAD `9662db251fcb177abe912bf79911ed1102873b9a` (typecheck, lint, build, tests, KIA eval, integración PostgreSQL y migraciones); Vercel app y ksenia-expert success; sin hilos de revisión pendientes. La suite añadió pruebas de petición con mocks para rechazo de claims registrales de navegador, alta manual, confirmación humana y autenticación.
- Inspección read-only de Supabase: 7 empresas, 0 registros con `registry_verified_at`, 0 bloqueos registrales, 0 snapshots no vacíos; `company_data_suggestions` vacía. No se corrigieron ni eliminaron filas.
- **E0-M3-05 permanece EN CURSO**: mitigación de falsa autoridad implementada, pero atestación positiva exclusivamente server-side y QA real/browser/roles requieren evidencia adicional; no certificar datos del resolver solo por nombre de fuente.
- **E0-M3-06 permanece EN CURSO**: hay rutas admin que rechazan `inactive` en vez de exigir `status === 'active'`; auditar y parchear sistemáticamente sin ampliar funcionalidades.
- E0 continúa única fase activa; E1–E6 bloqueadas, sin cambios de flags o migraciones de datos.

### 2026-10-11 — Primer lote de rutas privilegiadas E0-M3-06

- [PR #715](https://github.com/expert-servicios/expert-app/pull/715) **fusionada** con commit `ca94386279f858bde0db3f8adf10d79c608a15a2` mediante squash y lease sobre HEAD `1644a96a5c9d4bb611a38eca1d287b480ceda19a`, sin desfase respecto de `main`.
- El cambio reutiliza `requireActiveActor(request, ['admin', 'owner'])` en Holded, hoja registral, personas vinculadas y beneficios de suscripción; elimina cuatro guardas locales que solo rechazaban `inactive`.
- Evidencia: CI [#3488](https://github.com/expert-servicios/expert-app/actions/runs/38128025458) success (typecheck, lint, build, MCP, baseline, 411 archivos/2.248 tests, KIA evals, integración PostgreSQL/RLS y contrato de reparación de migraciones); pruebas HTTP negativas sobre 11 handlers para estados no activos, rol cliente y llamada no autenticada.
- Previews exactas verdes: [app](https://vercel.com/expertapp/app/B43Mi58vpg1ezs6xGPjvmx26rRPC) y [ksenia-expert](https://vercel.com/expertapp/ksenia-expert/6ao9FHUkb1H5qBTG8yK6E5V6ZcAA). Sin hilos de revisión pendientes.
- No se ejecutaron migraciones, despliegues manuales, escrituras financieras, desconexiones ni cambios de configuración de producción.
- **Estado:** avance parcial; `E0-M3-06` permanece EN CURSO. Siguiente acción concreta: completar el inventario de rutas privilegiadas/mutadoras y cubrir scope por rol/tenant/empresa/expediente con pruebas HTTP/RLS. E1–E6 y V3 continúan bloqueadas.

### 2026-10-11 — Segundo lote de rutas privilegiadas E0-M3-06

- [PR #716](https://github.com/expert-servicios/expert-app/pull/716) **fusionada** con commit `fd793ec0ef06e320f80f32decd94c47e24951783` mediante squash y lease sobre HEAD `60cda89299d5e593f1ab36733ddfe654a716d02d`, sin desfase respecto de `main`.
- El cambio reutiliza `requireActiveActor(request, ['admin', 'owner'])` en cuatro mutaciones de Operations 360: control de conversación, control de email, respuesta manual Telegram y reasignación de contexto. Conserva las comprobaciones existentes de conversación, identidad, cliente, empresa y expediente.
- Evidencia: CI [#3492](https://github.com/expert-servicios/expert-app/actions/runs/38128783323) success (typecheck, lint, build, MCP, baseline, 412 archivos/2.258 tests, KIA evals, integración PostgreSQL/RLS y contrato de reparación de migraciones); pruebas HTTP negativas para estados no activos, rol cliente y llamada no autenticada.
- Previews exactas verdes: [app](https://vercel.com/expertapp/app/9Jsk4R1wfyhGznvkAzSbNw6Db4gF) y [ksenia-expert](https://vercel.com/expertapp/ksenia-expert/7a4uqLVKYKp2FAckK3RBHz8RJFcY). Sin hilos o reviews pendientes.
- La primera ejecución de CI detectó una función local de normalización absorbida por la refactorización; se restauró en `60cda892...` y se repitieron todos los gates. No se ejecutaron mensajes Telegram, migraciones, flags, credenciales ni escrituras productivas.
- **Estado:** avance parcial; `E0-M3-06` permanece EN CURSO. Siguiente acción concreta: continuar el inventario de rutas privilegiadas/mutadoras, priorizando documentos, firmas, propuestas contables y facturación, y completar scope por rol/tenant/empresa/expediente con pruebas HTTP/RLS. E1–E6 y V3 siguen bloqueadas.

### 2026-10-11 — Tercer y cuarto lote de rutas privilegiadas E0-M3-06

- [PR #717](https://github.com/expert-servicios/expert-app/pull/717) **fusionada** con commit `1cef1be4455b99878993f5696952dca2e166e9e7` tras validar HEAD `87eb2e220939b71889edb540f17c1d3f5011470e`: guard compartido de actor activo para Team, Directorio y Company 360. CI [#3499](https://github.com/expert-servicios/expert-app/actions/runs/38129629840) success (413 archivos/2.261 tests) y previews [app](https://vercel.com/expertapp/app/52ojRZWXbpCXFnWv7NeCuZ2Y3rjF) / [ksenia-expert](https://vercel.com/expertapp/ksenia-expert/7qeN1s13yq9jpyQTodYuqGKeWzNp) Ready; sin hilos pendientes.
- [PR #718](https://github.com/expert-servicios/expert-app/pull/718) **fusionada** con commit `99c6d36f9a6a4687564395c595104afb27651ee3` mediante squash y lease sobre HEAD `26f244247986c162d2737bb7f35a419836f6e3db`, 0 commits detrás de `main`.
- #718 exige actor activo `tenant_admin` y valida `cases.tenant_id` antes de leer el perfil cliente, el formulario multipart o Storage; conserva la segunda comprobación del tenant del cliente. Casos ajenos devuelven 404 para no revelar existencia.
- Evidencia #718: CI [#3501](https://github.com/expert-servicios/expert-app/actions/runs/38129972663) success (typecheck, lint, build, MCP, baseline, 414 archivos/2.264 tests, KIA evals, integración PostgreSQL/RLS y contrato de reparación de migraciones); previews [app](https://vercel.com/expertapp/app/6Tbn8J3TNaQtXjrLCwR9QXiDidzw) y [ksenia-expert](https://vercel.com/expertapp/ksenia-expert/He9GE9raWgoeRqN1x57PcVCMymCJ) Ready.
- No se ejecutaron migraciones, cargas reales a Storage, despliegues manuales, flags, credenciales ni escrituras productivas.
- **Estado:** `E0-M3-06` permanece EN CURSO. Siguiente acción concreta: continuar el inventario de rutas privilegiadas/mutadoras, priorizando documentos, firmas, propuestas contables y facturación, y verificar scope por rol/tenant/empresa/expediente con pruebas HTTP/RLS. E1–E6 y V3 siguen bloqueadas.

### 2026-10-11 — Quinto lote de rutas privilegiadas E0-M3-06

- [PR #719](https://github.com/expert-servicios/expert-app/pull/719) **fusionada** con commit `86fabf6836d345cb14800ec9b56ae800b140a5ea` mediante squash y lease sobre HEAD `154e11a809fadeeb696360dece16f0132423b0de`, partiendo de `main` `9c9af77bbd8c3ce5ae246f93405c117c4a271502`.
- Las rutas Admin de lectura y actualización del ciclo de vida de firmas reutilizan `requireActiveActor(request, ['admin', 'owner'])`, por lo que solo aceptan perfiles exactamente `active`. Se conservan el filtro de listado por expediente/capability/tipo y la comprobación conjunta de `actionId` + `caseId` antes de mutar.
- Evidencia: CI [#3507](https://github.com/expert-servicios/expert-app/actions/runs/38132437615) success (typecheck, lint, build, suite, KIA evals, integración PostgreSQL/RLS y contrato de reparación de migraciones); prueba HTTP negativa de 403 antes de abrir el cliente service-role y pruebas de scope de expediente/acción.
- Previews exactas verdes: [app](https://vercel.com/expertapp/app/3Xtme5PdfkAgL8juD6o1C2hP7iyM) y [ksenia-expert](https://vercel.com/expertapp/ksenia-expert/4C9Dsev31PLUpXa4xd2RQN6fPNoW). El primer preview del commit de prueba detectó una referencia TypeScript incorrecta dentro del test; se corrigió y se repitieron todos los gates sobre el HEAD final. Sin hilos o reviews pendientes.
- No se ejecutaron migraciones, acciones de firma reales, despliegues manuales, escrituras financieras, cambios de configuración ni credenciales de producción.
- **Estado:** `E0-M3-06` permanece EN CURSO. Siguiente acción concreta: continuar el inventario restante de rutas privilegiadas/mutadoras, priorizando propuestas contables y facturación, y completar la matriz de scope por rol/tenant/empresa/expediente con pruebas HTTP/RLS. E1–E6 y V3 continúan bloqueadas.


### 2026-10-11 — Sexto lote de rutas privilegiadas E0-M3-06

- [PR #720](https://github.com/expert-servicios/expert-app/pull/720) **fusionada** con commit `4255bc9fb28c63c8f733cc36f932e0617268bf77` mediante squash y lease sobre HEAD `694baa226ad9674a8d5d622d3f52d634ca661268`, con base exacta `3b8dcfb8d6d962a94b890fcbed0917d9d39c9e11`.
- Company 360 intake exige actor exactamente activo, pertenencia a la empresa y coincidencia de `companies.tenant_id` cuando hay tenant; un `tenant_admin` sin tenant queda denegado antes de leer o escribir con `service_role`.
- La generación, lectura y exportación de informes financieros rechaza perfiles no activos; un cliente activo solo opera sobre sí mismo y únicamente `admin`/`owner` internos activos pueden actuar sobre otro cliente.
- Evidencia: CI [#3516](https://github.com/expert-servicios/expert-app/actions/runs/38138913709) success (typecheck, lint, build, MCP, baseline Supabase, 419 archivos/2.287 tests, 182 evaluaciones KIA, integración PostgreSQL/RLS y contrato de reparación); pruebas HTTP/unitarias para actor no activo, membresía ausente, tenant ajeno, `tenant_admin` sin tenant, cliente ajeno y flujos legítimos.
- Previews exactas verdes: [app](https://vercel.com/expertapp/app/BjJDyDfXTF93MkC855nAADwfN4oe) y [ksenia-expert](https://vercel.com/expertapp/ksenia-expert/HWSkiDsJdZvdJmkgGTvdivoc6iSm). Sin hilos o reviews pendientes.
- No se ejecutaron migraciones, generación real de informes, escrituras financieras, despliegues manuales, cambios de configuración, flags ni credenciales productivas.
- **Estado:** `E0-M3-06` permanece EN CURSO. Siguiente lote en secuencia: revisar y actualizar la PR #721 sobre capacidades KIA de perfiles activos contra el nuevo `main`, repetir tests/CI/Vercel y continuar la matriz de scope. E1–E6 y V3 permanecen bloqueadas.

### 2026-10-11 — Séptimo lote de rutas privilegiadas E0-M3-06

- [PR #721](https://github.com/expert-servicios/expert-app/pull/721) **fusionada** con commit `428c171586a32368208e1466abcfbd8f7fdc02fe` mediante squash y lease sobre HEAD `7f504e41561cdff8247c6e01e64f4f2a553342dd`, con base exacta `e7101c920e5ee508a61727fd1c083ed535ee8ff4`.
- El resolvedor de capacidades KIA corta tras la lectura canónica de `profiles`: estados `inactive`, `pending`, `suspended` o perfil ausente no consultan membresías, cobertura comercial ni grants privilegiados y no reciben capacidades o scopes.
- Las políticas `client_dashboard`, `admin_copilot` y `shadow_read_only` exigen `kia:authenticated`; `POST /api/ai/kia` deniega perfiles no activos antes del límite de coste, tokens de contexto, modo Admin y lecturas de empresa/expediente.
- Evidencia: CI [#3529](https://github.com/expert-servicios/expert-app/actions/runs/38144081214) success (typecheck, lint, build, MCP, baseline Supabase, 421 archivos/2.303 tests, 182 evaluaciones KIA, integración PostgreSQL/RLS y contrato de reparación); pruebas unitarias, de contrato y HTTP negativas para los cuatro estados no activos.
- Previews exactas verdes: [app](https://vercel.com/expertapp/app/6ioRrwZqxLCZh5LGu9nNGah1mjYG) y [ksenia-expert](https://vercel.com/expertapp/ksenia-expert/8dR8Nggyjm83xcLdpLVepwpsig57). Sin hilos o reviews pendientes.
- La primera ejecución CI del lote detectó una aserción estática obsoleta; se corrigió en el mismo branch y la repetición completa quedó verde. No se ejecutaron migraciones, escrituras financieras, despliegues manuales, cambios de configuración, flags ni credenciales productivas.
- **Estado:** `E0-M3-06` permanece EN CURSO. Siguiente lote en secuencia: revisar la PR #722 sobre revocación exact-active de KIA Work, incluida su migración/RLS/rollback solo en entorno de prueba; no aplicar migraciones en producción. E1–E6 y V3 permanecen bloqueadas.

### 2026-10-11 — Octavo lote de rutas privilegiadas E0-M3-06

- [PR #722](https://github.com/expert-servicios/expert-app/pull/722) **fusionada** con commit `ae5b8017cdb720d6e947ed31f84d47cb896d9732` mediante squash y lease sobre HEAD `654b2f8c5f07ccda360f385d6c3275c1ab0e632f`, con base exacta `4e0274a531f0f1a1ea62bfef2d46449f53b0d29d`.
- `authorizeWorkCase` exige perfil exactamente `active` antes de leer `cases`; perfil ausente, `inactive`, `pending` o `suspended` queda denegado sin consulta privilegiada al expediente.
- La migración forward-only `20261011135500_kia_work_active_scope_guard.sql` redefine `kia_work_lock_scope` para revalidar el mismo estado dentro de las transacciones de claim, recepción y cierre. Continúa como `SECURITY INVOKER`, sin ejecución para `anon`/`authenticated` y con ejecución para `service_role`.
- Evidencia: CI [#3536](https://github.com/expert-servicios/expert-app/actions/runs/38145229344) success (typecheck, lint, build, MCP, baseline Supabase, 421 archivos/2.307 tests, 182 evaluaciones KIA, integración web PostgreSQL/RLS, reparación y gate PostgreSQL KIA Work); [Ledger Preflight #1505](https://github.com/expert-servicios/expert-app/actions/runs/38145229365) success en lectura/dry-run con remoto 150, local 151 y una migración pendiente.
- El gate PostgreSQL verificó actor activo legítimo, revocación para tres estados no activos, rollback transaccional, RLS y ACL de función. Previews exactas verdes: [app](https://vercel.com/expertapp/app/AxcyWSAgZdD3WdfUyxR1ZfEB6ALa) y [ksenia-expert](https://vercel.com/expertapp/ksenia-expert/PxwHqSidtEvHgEQbKLf5Gkx4CaiH). Sin hilos o reviews pendientes.
- La migración **no se aplicó en producción**; no hubo DML financiero, cambios de flags/configuración, credenciales ni despliegues manuales. Rollback seguro: conservar el guard restrictivo y revertir código si fuese necesario; no restaurar el predicado permisivo sin autorización expresa.
- **Estado:** `E0-M3-06` permanece EN CURSO. Siguiente lote en secuencia: revisar y actualizar la PR #723, que corrige el tenant heredado y la revocación del listado financiero de #720, contra el nuevo `main`; repetir pruebas/CI/Vercel y preservar históricos. E1–E6 y V3 permanecen bloqueadas.

### 2026-10-11 — Noveno lote de rutas privilegiadas E0-M3-06

- [PR #723](https://github.com/expert-servicios/expert-app/pull/723) **fusionada** con commit `2046d3f3a7583e0fbf04fb0629408d2ca1e6be32` mediante squash y lease sobre HEAD `172b81ea8e2ee1910e50115f50bf0f31e71dad00`, con base exacta `438b2dfb71144a460b0035eeb0835557c3310f25`.
- Las altas de empresa exigen actor exactamente activo y tenant canónico para clientes y `tenant_admin`; las filas nuevas reciben el tenant verificado. `GET /api/companies` corta perfiles revocados antes de `service_role` y filtra cada objeto por tenant.
- Las compañías heredadas con `tenant_id = null` solo aparecen o permiten intake cuando existe membresía y todos los propietarios registrados pertenecen al tenant del actor; ausencia, error, propietario sin tenant o tenant cruzado falla cerrado. No se modificaron históricos.
- `GET /api/reports` exige perfil activo y coincidencia con la sesión antes de listar únicamente `client_id = user.id`. El primer pase de revisión detectó el scope incompleto del listado empresarial; se corrigió, repitió la revisión en el HEAD final y se resolvió el único hilo P1.
- Evidencia: CI [#3547](https://github.com/expert-servicios/expert-app/actions/runs/38151919126) success (typecheck, lint, build, MCP, baseline Supabase, 423 archivos/2.324 tests, 182 evaluaciones KIA y tres gates PostgreSQL); previews exactas verdes: [app](https://vercel.com/expertapp/app/GHMayibDpm3v8s3gHYWTxbVNsQg1) y [ksenia-expert](https://vercel.com/expertapp/ksenia-expert/Cf5cmdUd9vUjKm1EgpKvotEgqagQ).
- No hubo migraciones, DML financiero, despliegues manuales, cambios de configuración, flags ni credenciales productivas. La próxima ruptura anunciada de Supabase para nuevas tablas `public` el 30/10/2026 no afecta este lote, que no crea tablas ni cambia grants.
- **Estado:** `E0-M3-06` permanece EN CURSO. Siguiente lote autorizado: re-auditar el inventario restante de rutas `service_role`, completar la matriz actor/tenant/empresa/expediente y abrir solo el siguiente parche P1 acotado si existe. E1–E6 y V3 permanecen bloqueadas.

### 2026-10-11 — Décimo lote de rutas privilegiadas E0-M3-06

- [PR #724](https://github.com/expert-servicios/expert-app/pull/724) **fusionada** con commit `cd94e8892e15f8fc0d41ea6c45b285dde89cd45d` mediante squash y lease sobre HEAD `4a6e5ce72a11a8b3f51ab71474946462adb4b9d2`, con base exacta `cb0af210932d2dcde5f0a91025ecf5e0e348c26e` y 0 commits de desfase.
- Las rutas de detalle y exportación PDF, Word y Excel de informes financieros exigen ahora actor exactamente activo y coincidencia con la sesión antes de instanciar `service_role` o leer `kia_financial_reports`. Se conserva después el control existente de propietario o staff.
- La cobertura HTTP parametrizada verifica que sesiones revocadas y actores discordantes reciben 403 antes de cualquier lectura privilegiada en los cuatro handlers; la regresión positiva confirma acceso del propietario activo y actualización posterior de `viewed_at`.
- Evidencia: CI [#3550](https://github.com/expert-servicios/expert-app/actions/runs/38152978388) success (typecheck, lint, build, MCP, baseline Supabase, 424 archivos/2.333 tests, 182 evaluaciones KIA y tres gates PostgreSQL); revisión de seguridad completada sobre el HEAD exacto sin hallazgos ni hilos abiertos.
- Previews exactas verdes: [app](https://vercel.com/expertapp/app/4232BTwtatNjmPLmytQL8vX4kiPp) y [ksenia-expert](https://vercel.com/expertapp/ksenia-expert/ATh1oYAtTqT42X6UgSfJ8csicDe7).
- No se ejecutaron migraciones, generación real de informes, DML financiero, despliegues manuales, cambios de configuración, flags ni credenciales productivas.
- **Estado:** `E0-M3-06` permanece EN CURSO. Siguiente lote autorizado: continuar el inventario restante de rutas `service_role` y corregir solo la siguiente ruptura P1 demostrada, completando la matriz actor/tenant/empresa/expediente. E1–E6 y V3 permanecen bloqueadas.

### 2026-10-11 — Undécimo lote de rutas privilegiadas E0-M3-06

- [PR #725](https://github.com/expert-servicios/expert-app/pull/725) **fusionada** con commit `ff8c3e7b22a78d129305a4dd014e934dcba47cdf` mediante squash y lease sobre HEAD `aec8a4422fd6b3d6859592a811e327fdaa3188e7`, con base exacta `12b8b853f292a24a72e4de53b7d18074d3713594` y 0 commits de desfase.
- `GET /api/kia/cart`, `DELETE /api/kia/cart` y `POST /api/kia/cart/add` exigen ahora actor exactamente activo y coincidencia con la sesión antes de instanciar `service_role` o acceder a `kia_cart_items`. Se conserva el scope existente por `client_id` y el alta deriva el sujeto exclusivamente de la sesión.
- La cobertura HTTP verifica 403 para sesión revocada o actor discordante antes de acceso privilegiado en los tres handlers, 401 sin sesión y regresión positiva de alta para cliente activo con `client_id` no controlable por la petición.
- Evidencia: CI [#3553](https://github.com/expert-servicios/expert-app/actions/runs/38156329760) success (typecheck, lint, build, MCP, baseline Supabase, 425 archivos/2.341 tests, 182 evaluaciones KIA y tres gates PostgreSQL); revisión de seguridad completada sobre el HEAD exacto sin hallazgos ni hilos abiertos.
- Previews exactas verdes: [app](https://vercel.com/expertapp/app/6Cx2egW4SP9B3CVR82wH98fzUQRr) y [ksenia-expert](https://vercel.com/expertapp/ksenia-expert/GscCXRy3sjcSLnC612VXjzXFBqp3).
- No se ejecutaron migraciones, pagos, generación de pedidos, despliegues manuales, cambios de configuración, flags ni credenciales productivas.
- **Estado:** `E0-M3-06` permanece EN CURSO. Siguiente lote autorizado: continuar el inventario restante de rutas `service_role` desde la siguiente frontera no auditada y corregir solo la siguiente ruptura P1 demostrada, completando la matriz actor/tenant/empresa/expediente. E1–E6 y V3 permanecen bloqueadas.

### 2026-10-11 — Duodécimo lote de rutas privilegiadas E0-M3-06

- [PR #726](https://github.com/expert-servicios/expert-app/pull/726) **fusionada** con commit `0dcc4591fa842a7aa71e737a5c07083ef1b61a7b` mediante squash y lease sobre HEAD `bd2c409710d2500fe883b8da64e3cd03c986da9e`, con base exacta `e8a18a166c189cee83f4c818f274e9b3481d8140` y 0 commits de desfase.
- `GET /api/notifications` exige actor exactamente activo y coincidencia con la sesión antes de instanciar el cliente `service_role` o leer `fiscal_obligations`. Se conservan el filtro por `user_id`, el estado pendiente y la respuesta anónima histórica vacía.
- La cobertura HTTP verifica 403 para sesión revocada o actor discordante antes de cualquier lectura privilegiada, regresión positiva del cliente activo con scope por usuario y compatibilidad anónima sin abrir el cliente administrativo.
- Evidencia: CI [#3556](https://github.com/expert-servicios/expert-app/actions/runs/38164079241) success (typecheck, lint, build, MCP, baseline Supabase, 426 archivos/2.345 tests, 182 evaluaciones KIA y tres gates PostgreSQL/RLS); revisión de seguridad completada sobre el HEAD exacto sin hallazgos ni hilos abiertos.
- Previews exactas verdes: [app](https://vercel.com/expertapp/app/FrKax8x6v4295KYtWUyUF53hSiVk) y [ksenia-expert](https://vercel.com/expertapp/ksenia-expert/DeCiYMqtFErqjU4kHdEZySDiusF5).
- No se ejecutaron migraciones, consultas o escrituras productivas, despliegues manuales, cambios de configuración, flags ni credenciales. El cambio de Supabase anunciado para el 30/10/2026 no afecta este lote porque no crea tablas ni altera grants.
- **Estado:** `E0-M3-06` permanece EN CURSO. Siguiente frontera del inventario: auditar `POST /api/ai/kia/feedback` y corregir solo una ruptura P1 demostrada, manteniendo actor, cliente, canal y objeto antes de cualquier lectura privilegiada. E1–E6 y V3 permanecen bloqueadas.

### 2026-10-11 — Decimotercer lote de rutas privilegiadas E0-M3-06

- [PR #727](https://github.com/expert-servicios/expert-app/pull/727) **fusionada** con commit `5e903d45fe75a1210591a7379b5becdeea3d9d45` mediante squash y lease sobre HEAD `808223dc193e5bad55dbfe051c5ec69b2008a93d`, con base exacta `a570afbd6ed43c0b5db796d7019fbf0f39accd1d` y 0 commits de desfase.
- `POST /api/ai/kia/feedback` exige ahora actor exactamente activo y coincidencia con la sesión antes de instanciar el cliente `service_role` o leer `kia_decision_logs`. Después conserva la autorización de objeto por `client_id`, canal `dashboard` y respuesta canónica server-side.
- La cobertura HTTP verifica revocación y actor discordante antes de acceso privilegiado, 401 sin sesión, denegación de decision log de otro cliente o canal, y regresión positiva que persiste la identidad de sesión y la respuesta canónica.
- Evidencia: CI [#3559](https://github.com/expert-servicios/expert-app/actions/runs/38165388865) success (typecheck, lint, build, MCP, baseline Supabase, 427 archivos/2.351 tests, 182 evaluaciones KIA y tres gates PostgreSQL/RLS); revisión de seguridad completada sobre el HEAD exacto sin hallazgos ni hilos abiertos.
- Previews exactas verdes: [app](https://vercel.com/expertapp/app/DtouYw7hVdNAG9PeTtYWpA4f9LjD) y [ksenia-expert](https://vercel.com/expertapp/ksenia-expert/9GiHyLmMLq2vcRvNLh2bZRAR2NS3).
- No se ejecutaron migraciones, feedback real, escrituras productivas/financieras, mensajes, despliegues manuales, cambios de configuración, flags ni credenciales. El cambio de Supabase anunciado para el 30/10/2026 no afecta este lote porque no crea tablas ni altera grants.
- **Estado:** `E0-M3-06` permanece EN CURSO. Siguiente frontera demostrada: auditar `GET /api/auth/ms365`, que hoy solo rechaza `inactive`; corregirla para exigir actor exactamente activo `admin`/`owner` antes de generar estado OAuth, sin iniciar conexiones ni cambiar credenciales. E1–E6 y V3 permanecen bloqueadas.

### 2026-10-11 — Decimocuarto lote de rutas privilegiadas E0-M3-06

- [PR #728](https://github.com/expert-servicios/expert-app/pull/728) **fusionada** con commit `1fbebcfbea191e2b3f725460ddb9ed1b65736866` mediante squash y lease sobre HEAD `bc039e42be509476602cc795c906608cc0f2fde0`, con base exacta `cbca05d898581a1929ed4b81d76f2a1922356cad` y 0 commits de desfase.
- `GET/POST /api/admin/tenants` exige ahora actor exactamente activo con rol `admin` u `owner` antes de instanciar `service_role`, listar tenants o ejecutar el alta. Se conserva el contrato existente y no se amplían roles ni scopes.
- La cobertura HTTP verifica denegación previa a lecturas/altas protegidas y regresiones positivas para listado de admin activo y creación por owner activo; el guard compartido conserva la cobertura unitaria de perfil ausente, `inactive`, `pending`, `suspended` y rol no permitido.
- Evidencia: CI [#3563](https://github.com/expert-servicios/expert-app/actions/runs/38170406605) success (typecheck, lint, build, MCP, baseline Supabase, 428 archivos/2.355 tests, 182 evaluaciones KIA y tres gates PostgreSQL); revisión de seguridad completada sobre el HEAD exacto sin hallazgos ni hilos abiertos.
- Previews exactas verdes: [app](https://vercel.com/expertapp/app/GWaqH9PsPK4q2pBnqWapzZFii2wD) y [ksenia-expert](https://vercel.com/expertapp/ksenia-expert/EtA4fof7aeTEwigeUFXtZaiBGJG7).
- No se ejecutaron migraciones, altas reales de tenants, escrituras financieras, despliegues manuales, cambios de configuración, flags ni credenciales. El cambio de Supabase anunciado para el 30/10/2026 no afecta este lote porque no crea tablas ni altera grants.
- **Estado:** `E0-M3-06` permanece EN CURSO. Siguiente frontera demostrada: auditar `GET /api/auth/ms365`, que solo rechaza `inactive`; exigir actor exactamente activo `admin`/`owner` antes de generar estado OAuth, sin iniciar conexiones ni cambiar credenciales. E1–E6 y V3 permanecen bloqueadas.

### 2026-10-11 — Decimoquinto lote de rutas privilegiadas E0-M3-06

- [PR #729](https://github.com/expert-servicios/expert-app/pull/729) **fusionada** con commit `917b709cc1196167bc34c7875d9f9e9be90e9c5d` mediante squash y lease sobre HEAD `e4ea3cf98433dfb53accfd543939a0c214935c35`, con base exacta `c80e352ce67b1369846d1e31e732d1dc2e26dc27` y 0 commits de desfase.
- `GET /api/auth/ms365` exige actor exactamente activo con rol `admin` u `owner` y coincidencia con la sesión antes de crear el estado OAuth, construir la URL de autorización o escribir su cookie. Se eliminó la lectura local de perfil mediante `service_role` y no se amplían roles ni permisos.
- La cobertura HTTP verifica redirección a login sin sesión y a dashboard para perfil revocado/no aprobado o actor discordante, siempre antes de estado, URL y cookie; las regresiones positivas cubren admin y owner activos.
- Evidencia: CI [#3566](https://github.com/expert-servicios/expert-app/actions/runs/38173408492) success (typecheck, lint, build, MCP, baseline Supabase, 429 archivos/2.360 tests, 182 evaluaciones KIA y tres gates PostgreSQL/RLS); revisión de seguridad completada sobre el HEAD exacto sin hallazgos mayores ni hilos abiertos.
- Previews exactas verdes: [app](https://vercel.com/expertapp/app/6a4UUm7Q3uFYmEiL4amoCiTpTp7d) y [ksenia-expert](https://vercel.com/expertapp/ksenia-expert/GjtKBkAxTNQKAHi4v1MS95HiBwqL).
- No se inició OAuth real, intercambio de tokens ni conexión; tampoco hubo acceso a secretos, cambios de credenciales/configuración, migraciones, escrituras productivas o financieras ni despliegues manuales. El cambio de Supabase anunciado para el 30/10/2026 no afecta este lote porque no crea tablas ni altera grants.
- **Estado:** `E0-M3-06` permanece EN CURSO. Siguiente frontera demostrada: auditar `GET /api/admin/stats`, que valida rol pero no estado exact-active antes de leer perfiles, presupuestos, expedientes e importes pagados mediante `service_role`; corregir solo este P1 acotado y conservar el contrato de solo lectura. E1–E6 y V3 permanecen bloqueadas.

### 2026-10-12 — Decimosexto lote de rutas privilegiadas E0-M3-06

- [PR #730](https://github.com/expert-servicios/expert-app/pull/730) **fusionada** con commit `2dc26f0408fcb2409444da3c6a3d0e340bab243a` mediante squash y lease sobre HEAD `efb26a672ddd41a9c3160ca550bf4fc551c21ebc`, con base exacta `463cd0521f075951b8644916ff735dfc7fdcdf51` y 0 commits de desfase.
- `GET /api/admin/stats` exige actor exactamente activo con rol `admin` u `owner` y coincidencia con la sesión antes de instanciar el cliente de agregados `service_role` o leer perfiles, presupuestos, pedidos pagados y expedientes. Se conservan respuestas, cálculos y contrato de solo lectura.
- La cobertura HTTP verifica 401 sin sesión, 403 para perfil revocado/no aprobado o actor discordante antes de abrir el cliente privilegiado, y regresiones positivas para admin y owner activos limitadas a las cuatro tablas previstas.
- Evidencia: CI [#3571](https://github.com/expert-servicios/expert-app/actions/runs/38180406306) success (typecheck, lint, build, MCP, baseline Supabase, 430 archivos/2.365 tests, 182 evaluaciones KIA y tres gates PostgreSQL/RLS); revisión de seguridad completada sobre el HEAD exacto sin hallazgos ni hilos abiertos.
- Previews exactas verdes: [app](https://vercel.com/expertapp/app/HmZ13rmsL6NmHFcQADZDE6TNeX7k) y [ksenia-expert](https://vercel.com/expertapp/ksenia-expert/FgAfb2TkEUyy1JTH6oYeVDBS13vw).
- No se ejecutaron consultas ni escrituras productivas, DML financiero, migraciones, despliegues manuales, cambios de configuración, flags o credenciales. El cambio de Supabase anunciado para el 30/10/2026 no afecta este lote porque no crea tablas ni altera grants.
- **Estado:** `E0-M3-06` permanece EN CURSO. Siguiente frontera demostrada: auditar `GET /api/admin/reports`, que valida rol pero no estado exact-active antes de leer ocho agregados operativos, comerciales y financieros mediante `service_role`; corregir solo este P1 acotado y conservar el contrato de solo lectura. E1–E6 y V3 permanecen bloqueadas.

### 2026-10-12 — Decimoséptimo lote de rutas privilegiadas E0-M3-06

- [PR #732](https://github.com/expert-servicios/expert-app/pull/732) **fusionada** con commit `55180f3d1298ea1403a872722f1519c5a7cc7609` mediante squash y lease sobre HEAD `0d33b55fda4aa1611f1b3c7517dfc27b2c5988d4`, con base exacta `c9acad906681c098227b9f103198fc30b765050c` y 0 commits de desfase.
- `GET /api/admin/reports` exige actor exactamente activo con rol `admin` u `owner` y coincidencia con la sesión antes de instanciar `service_role` o leer los ocho agregados de pedidos, expedientes, presupuestos, eventos de email, suscripciones, mensajes, leads y newsletter. Se conservan límites, cálculos y contrato de respuesta del dashboard.
- La cobertura HTTP verifica 401 sin sesión, 403 para perfil revocado/no aprobado o actor discordante antes del cliente privilegiado, y regresiones positivas para admin y owner activos limitadas a los ocho orígenes previstos.
- Evidencia: CI [#3574](https://github.com/expert-servicios/expert-app/actions/runs/38183132998) success (typecheck, lint, build, MCP, baseline Supabase, 431 archivos/2.370 tests, 182 evaluaciones KIA y tres gates PostgreSQL/RLS); revisión de seguridad completada sobre el HEAD exacto sin hallazgos ni hilos abiertos.
- Previews exactas verdes: [app](https://vercel.com/expertapp/app/F4AVZxDo5UkrtMnn5U5MoPXXosds) y [ksenia-expert](https://vercel.com/expertapp/ksenia-expert/8c9gfV1WP6ZgQTMSJSXhn6tWwpa4).
- No se ejecutaron consultas ni escrituras productivas, DML financiero, migraciones, cambios de RLS/grants, despliegues manuales, configuración, flags o credenciales. El cambio de Supabase anunciado para el 30/10/2026 no afecta este lote porque no crea tablas ni altera grants.
- **Estado:** `E0-M3-06` permanece EN CURSO. Siguiente lote en secuencia: actualizar la [PR #731](https://github.com/expert-servicios/expert-app/pull/731) sobre la guardia administrativa compartida contra el nuevo `main` (actualmente 3 commits por detrás) y corregir su fallo de test en el mock encadenado `order().limit()`; repetir CI, revisión y ambos Vercel antes de considerar la fusión. E1–E6 y V3 permanecen bloqueadas.

### 2026-10-12 — Decimoctavo lote de rutas privilegiadas E0-M3-06

- [PR #731](https://github.com/expert-servicios/expert-app/pull/731) **fusionada** con commit `772b5a2aa44eed9fa67b9bbfac94c2f3ef54cb3e` mediante squash y lease sobre HEAD `cdc3a05f3ebf35d23beae57a813397034c683cba`, con base exacta `55735f5317cc76360409b7d63f6884287f8fd722` y 0 commits de desfase.
- La guardia compartida `requireAdminClient()` ahora falla cerrada para cualquier estado distinto de `active`, mantiene exclusivamente los roles `admin` y `owner`, y preserva el contrato de cliente privilegiado utilizado por sus consumidores.
- La cobertura HTTP sobre `GET /api/admin/kia/health/runs` verifica diez casos: sesión ausente, perfil nulo, estados `inactive`, `pending` y `suspended`, roles `client`, `tenant_admin` y nulo, y positivos `admin`/`owner`. El doble de consulta reproduce la cadena real `order().limit()`, corrigiendo el único fallo del intento anterior.
- Evidencia: CI [#3577](https://github.com/expert-servicios/expert-app/actions/runs/38184300925) success (typecheck, lint, build, MCP, baseline Supabase, 432 archivos/2.380 tests, 182 evaluaciones KIA, cuatro jobs y tres gates PostgreSQL/RLS); revisión de seguridad completada sobre el HEAD exacto sin incidencias ni hilos abiertos.
- Previews exactas verdes: [app](https://vercel.com/expertapp/app/GAaJNVSSSie7iNGqjDcQVjaVYKUL) y [ksenia-expert](https://vercel.com/expertapp/ksenia-expert/2afG2HJHXP5MfJ8JCivMNDaVssH1).
- No se ejecutaron consultas ni escrituras productivas, DML financiero, migraciones, cambios de RLS/grants, despliegues manuales, configuración, flags o credenciales.
- **Estado:** `E0-M3-06` permanece EN CURSO. Siguiente lote en secuencia: auditar y corregir de forma acotada `GET /api/admin/holded-charts`, que valida rol pero no estado exact-active antes de poder leer facturas mediante la credencial Holded; las pruebas deberán simular el conector, demostrar revocación previa a cualquier llamada externa y conservar el contrato de solo lectura. E1–E6 y V3 permanecen bloqueadas.

### 2026-10-12 — Decimonoveno lote de rutas privilegiadas E0-M3-06

- [PR #733](https://github.com/expert-servicios/expert-app/pull/733) **fusionada** con commit `4758e9243d139456bae3320155082c6e4878e995` mediante squash y lease sobre HEAD `07fb35a22e57466d841da66f7a460a923960df49`, con base exacta `4bfbf187166544dc0d88e0691970904cceead512` y 0 commits de desfase.
- `GET /api/admin/holded-charts` exige actor exactamente activo con rol `admin` u `owner` y coincidencia con la sesión antes de consultar la configuración o llamar al API de Holded. Se elimina la comprobación local de rol con `service_role` y se conservan el contrato y todos los cálculos de solo lectura consumidos por la página de reportes.
- La cobertura HTTP verifica seis casos: sesión ausente, actor revocado/no aprobado, actor discordante, configuración ausente y positivos `admin`/`owner`; el conector Holded está completamente simulado y se demuestra que los casos denegados no realizan ninguna llamada externa.
- Evidencia: CI [#3580](https://github.com/expert-servicios/expert-app/actions/runs/38185618081) success (typecheck, lint, build, MCP, baseline Supabase, 433 archivos/2.386 tests, 182 evaluaciones KIA, cuatro jobs y tres gates PostgreSQL/RLS); revisión de seguridad completada sobre el HEAD exacto sin incidencias ni hilos abiertos.
- Previews exactas verdes: [app](https://vercel.com/expertapp/app/8ittqcfpcngi7xSRKHWXpgfNkPnK) y [ksenia-expert](https://vercel.com/expertapp/ksenia-expert/E1VPdawKuVkRzHyAL2k4ravCaE4Z).
- No se ejecutaron lecturas ni escrituras productivas, DML financiero, migraciones, cambios de RLS/grants, despliegues manuales, configuración, flags o credenciales. El cambio de grants de Supabase anunciado para el 30/10/2026 no afecta este lote porque no crea tablas ni altera permisos.
- **Estado:** `E0-M3-06` permanece EN CURSO. Siguiente lote en secuencia: auditar y corregir de forma acotada `GET /api/admin/search`, que valida rol pero no estado exact-active antes de agregar perfiles, usuarios Auth, empresas, expedientes, citas, presupuestos y documentos; conservar el contrato de búsqueda y demostrar revocación antes de cualquier lectura privilegiada. E1–E6 y V3 permanecen bloqueadas.

### 2026-10-12 — Vigésimo lote de rutas privilegiadas E0-M3-06

- [PR #734](https://github.com/expert-servicios/expert-app/pull/734) **fusionada** con commit `7ce3445a48206731b63f1712cbe772a240f0bd44` mediante squash y lease sobre HEAD `d3ecd30a5f364e7be6703366b32858d718054525`, con base exacta `adce9870c1ac0815986c0abedec50b360d3fbea7` y 0 commits de desfase.
- `GET /api/admin/search` exige actor exactamente activo con rol `admin` u `owner` y coincidencia con la sesión antes de instanciar `service_role`, enumerar usuarios Auth o leer perfiles, empresas, expedientes, citas, presupuestos y documentos. Las consultas de menos de dos caracteres tampoco abren esos clientes privilegiados. Se conservan el `403` existente, la respuesta vacía y la forma de resultados.
- La cobertura HTTP verifica seis casos: sesión ausente, actor revocado/no aprobado, actor discordante, consulta corta sin lecturas privilegiadas y positivos `admin`/`owner`; además limita las consultas positivas a los seis orígenes previstos.
- Evidencia de PR: CI [#3583](https://github.com/expert-servicios/expert-app/actions/runs/38191467715) success (typecheck, lint, build, MCP, baseline Supabase, tests, 182 evaluaciones KIA y tres gates PostgreSQL/RLS); revisión de seguridad completada sobre el HEAD exacto sin problemas importantes ni hilos abiertos. Evidencia posterior a fusión: CI de `main` [#3584](https://github.com/expert-servicios/expert-app/actions/runs/38191710417) success.
- Verificaciones Vercel exactas de `main@7ce3445a48206731b63f1712cbe772a240f0bd44`: [app](https://vercel.com/expertapp/app/FArvwDf4QLhJLqKANHXxsimcUh7r) READY y [ksenia-expert](https://vercel.com/expertapp/ksenia-expert/2mM477UwNp5r42QEUoJWBZbi2cLZ) READY.
- No se realizaron consultas ni escrituras productivas, DML financiero, migraciones, cambios de RLS/grants, configuración, flags, credenciales o despliegues manuales. Los despliegues automáticos vinculados a la fusión completaron READY sin intervención de configuración. El cambio de grants de Supabase anunciado para el 30/10/2026 no afecta este lote porque no crea tablas ni altera permisos.
- **Estado:** `E0-M3-06` permanece EN CURSO. Siguiente lote en secuencia: auditar y corregir de forma acotada `GET/POST /api/admin/cases`, cuya guardia compartida valida rol pero no estado exact-active antes de lecturas PII, alta de expediente y sincronización externa. Exigir coincidencia de sesión, comprobar el alcance cliente/empresa/objeto y simular por completo Supabase/Holded en pruebas; no ejecutar altas, sincronizaciones ni escrituras reales. E1–E6 y V3 permanecen bloqueadas.

### 2026-10-12 — Vigesimoprimer lote de rutas privilegiadas E0-M3-06

- [PR #735](https://github.com/expert-servicios/expert-app/pull/735) **fusionada** por squash con commit `60589aa49192f8e0c204eebc202ed4b2ffbbbdea`, usando lease sobre HEAD exacto `c6bdde314033c05219c2565bf6f5ac13df9f206f`; base `70bac3036c352237c69a93725f26f02c2741db1c`, 3 commits por delante, 0 por detrás y dos archivos acotados.
- `GET/POST /api/admin/cases` exige ahora sesión válida y actor exacto activo `admin`/`owner`, con coincidencia de identidad, antes de instanciar `service_role`. `POST` valida además que el destino sea un perfil `client` activo y que la empresa pertenezca a ese cliente antes del alta o de cualquier sincronización Holded.
- La cobertura HTTP añade diez casos: ausencia de sesión, revocación, discordancia actor/sesión, contratos positivos `admin`/`owner`, cliente ausente/inactivo/no cliente, empresa fuera de alcance y altas válidas. Supabase y Holded se simularon por completo; no se realizaron altas ni sincronizaciones reales.
- Gates del HEAD de PR: CI #3586 / run `38196105855` con 4/4 jobs `success`; revisión Codex completada sin incidencias importantes y 0 hilos abiertos; Vercel `app` `dpl_EN5pAfTXWbuj9gAXd527GHJ4QG5S` y `ksenia-expert` `dpl_HGURRF5xP9gx8fVCs7Y4vFVyyW3v`, ambos `READY` y ligados a `c6bdde314033c05219c2565bf6f5ac13df9f206f`.
- Gates postfusión de `main`: CI push #3587 / run `38196492452` con 4/4 jobs `success`; Vercel `app` `dpl_ExFxGYw2iPyJJDLUoN1tbk5uRqqg` y `ksenia-expert` `dpl_ChJJvU7Jz52n17ViV37XrESJgmR9`, ambos `READY` y ligados a `60589aa49192f8e0c204eebc202ed4b2ffbbbdea`.
- No se ejecutaron consultas o escrituras productivas, DML financiero, migraciones, cambios de RLS/grants, configuración, flags, credenciales ni despliegues manuales. El cambio de grants de Supabase anunciado para el 30/10/2026 no afecta este lote porque no crea tablas ni altera permisos.
- **Estado:** `E0-M3-06` permanece EN CURSO. Siguiente frontera demostrada: auditar y corregir de forma acotada `GET/PATCH /api/admin/cases/[id]`, que hoy valida rol pero no estado exact-active antes de leer PII, documentos y URLs firmadas o de mutar expedientes y activar notificaciones/integraciones. Exigir coincidencia de sesión y scope por expediente/cliente/empresa/tenant antes de efectos; simular íntegramente correo, push, calendario y persistencia. E1–E6 y V3 permanecen bloqueadas.


### 2026-10-12 — Vigesimosegundo lote de rutas privilegiadas E0-M3-06

- **Entrega:** PR [#736](https://github.com/expert-servicios/expert-app/pull/736) fusionada por squash en `main` como `8b6c6c6ba55402258e497b66567509a61abd4104`. La rama partió de `50fc9a9cabb7a6fd9334e73ad88953482f67dd67`; el último HEAD revisado fue `16b23e5211a31e14b930c674139ed857bca14fc4` (6 commits por delante, 0 por detrás, 2 archivos).
- **Alcance autorizado:** `GET/PATCH /api/admin/cases/[id]` exige actor admin/owner exacto activo antes de acceso privilegiado; resuelve el expediente dentro de `tenant/client/company`, valida pertenencia cliente-empresa y acota documentos/notas antes de PII, Auth, Storage o URLs firmadas. Las mutaciones reaplican todos los predicados, incluido `tenant_id IS NULL` para filas heredadas.
- **Efectos seguros:** una transición de estado confirma que una fila fue actualizada antes de correo, push, calendario, notificaciones, rentabilidad o snapshot; cero filas devuelve conflicto y no ejecuta efectos. La atribución usa el actor exacto validado.
- **Pruebas:** 11 casos HTTP cubren revocación, cruces de tenant/cliente/empresa, pertenencia, GET admin/owner, alcance de documentos/notas, PATCH bloqueado, mutación no-status, tenant heredado nulo, carrera de cero filas y transición válida. Supabase/Auth/Storage y todos los proveedores de efectos están simulados; no hubo lecturas, escrituras ni llamadas reales.
- **Revisión:** tres rondas de revisión de seguridad. Se corrigieron cinco hallazgos concretos (tenant de cliente/empresa, documentos, confirmación de fila actualizada, preservación de tenant nulo y notas); la ronda final no detectó incidencias importantes y quedaron 0 conversaciones abiertas.
- **Gates de PR:** CI #3593 (`38198488244`) verde 4/4; Vercel `app` `dpl_4Jh8b5PsMmqrkZzi5kmNCERNPSRc` y `ksenia-expert` `dpl_5NzCdEpSH3AhJsvBKunF99YLXHif`, ambos `READY` y ligados al HEAD revisado.
- **Gates posfusión:** CI #3594 (`38198950303`) verde 4/4 sobre `8b6c6c6ba55402258e497b66567509a61abd4104`; Vercel `app` `dpl_JDUotqEjYN1LCVgtyjnqHvYth1gP` y `ksenia-expert` `dpl_2MnFNF1FiScGVmVt5RNs1Hd58Ddd`, ambos `READY` y ligados al mismo SHA.
- **Producción:** no se ejecutaron consultas ni DML de producción, migraciones, escrituras financieras, cambios RLS/grants, configuración, flags, credenciales ni despliegues manuales. El cambio anunciado por Supabase para el 30-10-2026 sobre grants implícitos no afecta a este lote, que no modifica esquema ni grants.
- **Estado y secuencia:** E0-M3-06 permanece `IN_PROGRESS`. Siguiente tarea exacta: auditar `POST /api/admin/cases/[id]/ai` para exigir actor exacto activo y alcance de objeto antes de service role y proveedores AI, con proveedores simulados y sin llamadas/escrituras reales. E1-E6 y V3 siguen bloqueadas.


### 2026-10-12 — Vigesimotercer lote de rutas privilegiadas E0-M3-06

- **Entrega:** PR [#737](https://github.com/expert-servicios/expert-app/pull/737) fusionada por squash en `main` como `57c7b0ce5904f7b1108fdb5e103311f50589d4dd`. La rama partió de `33190ee2ca733afa155f5fa2e22f59b4ec17bf17`; el HEAD revisado `29916f8a54638bea00ef2cff8d31e981ef76750c` quedó 3 commits por delante y 0 por detrás, con 2 archivos.
- **Alcance autorizado:** `POST /api/admin/cases/[id]/ai` sustituyó el control local de rol por `requireActiveActor` para admin/owner exactos activos. Antes de parsear la acción o invocar cualquier helper AI, resuelve el expediente dentro del tenant efectivo, valida tenant de cliente y empresa y confirma `profile_companies`.
- **Comportamiento preservado:** continúan las acciones `summary`, `missing-docs` y `draft` sin nueva funcionalidad. Los helpers reciben únicamente el ID del expediente ya autorizado y, cuando corresponde, el servicio o el objetivo validado.
- **Pruebas:** 12 casos HTTP cubren actor revocado, expediente de otro tenant, cliente/empresa fuera de tenant, membresía ausente, acción inválida tras el scope, tres caminos positivos, draft sin objetivo, owner global y expediente heredado sin tenant. Supabase y los tres helpers AI están simulados; no hubo lecturas, escrituras ni llamadas reales a proveedores.
- **Revisión:** revisión inicial y revisión de seguridad manual completadas sobre `29916f8a54638bea00ef2cff8d31e981ef76750c` sin hallazgos importantes; 0 conversaciones abiertas.
- **Gates de PR:** CI #3596 (`38201829248`) verde 4/4; Vercel `app` `dpl_JUq465WRoetYcKf5yHALuXtafVJ2` y `ksenia-expert` `dpl_EENGRHPp6FBFQRJRjoMaVgckNMPU`, ambos `READY` y ligados al HEAD revisado.
- **Gates posfusión:** CI #3597 (`38202447069`) verde 4/4 sobre `57c7b0ce5904f7b1108fdb5e103311f50589d4dd`; Vercel `app` `dpl_BaG1upsihyp7yxjgvbmd939yBppm` y `ksenia-expert` `dpl_FUSy669EARqHw8sHCBoyNgPCt4XN`, ambos `READY` y ligados al mismo SHA.
- **Producción:** no se ejecutaron consultas ni DML de producción, migraciones, escrituras financieras, cambios RLS/grants, configuración, flags, credenciales ni despliegues manuales. El cambio anunciado por Supabase para el 30-10-2026 sobre grants implícitos no afecta este lote, que no modifica esquema ni permisos.
- **Estado y secuencia:** E0-M3-06 permanece `IN_PROGRESS`. Siguiente tarea exacta: auditar `GET /api/admin/cases/[id]/drive-files`, que aún usa control de rol local y consulta perfil/Auth/Google Drive sin alcance tenant/cliente/empresa; exigir actor exacto activo y objeto autorizado antes del acceso externo, con Drive/Auth simulados. E1-E6 y V3 siguen bloqueadas.


### 2026-10-12 — Vigesimocuarto lote de rutas privilegiadas E0-M3-06

- **Entrega:** PR [#738](https://github.com/expert-servicios/expert-app/pull/738) fusionada por squash en `main` como `a5948df1e44e1563d2c23baa0352af337c6811d2`. La rama partió de `2eda06fa7e5a6fcd1e0d2db9961204f5f1bbb3eb`; el HEAD revisado `8c88e9e015599e9f65dacbbd95e0bd38be2958fe` quedó 7 commits por delante y 0 por detrás, con 2 archivos.
- **Alcance autorizado:** `GET /api/admin/cases/[id]/drive-files` sustituyó el control local de rol por `requireActiveActor` para admin/owner exactos activos. Antes de consultar Supabase Auth o Google Drive resuelve el expediente dentro del tenant efectivo, valida tenant de cliente y empresa y confirma `profile_companies`.
- **Comportamiento preservado:** se conservan el campo HTTP histórico `serviceName`, el fallback de identidad perfil → prefijo de email → `Cliente` y la consulta de solo lectura a Drive. No se añadió funcionalidad. Un cambio intermedio del fixture que rompía TypeScript se detectó en Vercel, se corrigió antes de fusionar y toda evidencia anterior quedó descartada.
- **Pruebas:** 11 casos HTTP cubren actor revocado, expediente de otro tenant, cliente/empresa fuera de tenant, membresía ausente, éxito y contrato de respuesta, fallback de email, owner global, expediente heredado sin tenant, expediente sin empresa y sanitización de errores. Supabase Auth y Google Drive están simulados; no hubo lecturas, escrituras ni llamadas reales.
- **Revisión:** revisión de seguridad manual completada sobre `8c88e9e015599e9f65dacbbd95e0bd38be2958fe` sin hallazgos; 0 conversaciones abiertas.
- **Gates de PR:** CI [#3604](https://github.com/expert-servicios/expert-app/actions/runs/38205293466) verde 4/4; Vercel `app` `dpl_D7zyvGy3ergzWhZbkBXxuKNTRai2` y `ksenia-expert` `dpl_53Y427X3pgXDGxoubLHZzfXi4zZm`, ambos `READY` y ligados al HEAD revisado.
- **Gates posfusión:** CI [#3605](https://github.com/expert-servicios/expert-app/actions/runs/38205570699) verde 4/4 sobre `a5948df1e44e1563d2c23baa0352af337c6811d2`; Vercel `app` `dpl_6usYnpPMvdVeuYVXdQPo2Tw7euXm` y `ksenia-expert` `dpl_ZsLejCYzkPbS2nYtG1E4iEpRkFdC`, ambos `READY` y ligados al mismo SHA.
- **Producción:** no se ejecutaron consultas ni DML de producción, migraciones, escrituras financieras, cambios RLS/grants, configuración, flags, credenciales ni despliegues manuales. Los despliegues automáticos vinculados a Git completaron sin cambios manuales de configuración. El cambio anunciado por Supabase para el 30-10-2026 sobre grants implícitos no afecta este lote, que no modifica esquema ni permisos.
- **Estado y secuencia:** E0-M3-06 permanece `IN_PROGRESS`. Siguiente tarea exacta: auditar conjuntamente `GET /api/admin/cases/[id]/signature-actions` y `PATCH /api/admin/cases/[id]/signature-actions/[actionId]`. Ambas rutas ya exigen actor exacto activo, pero resuelven el expediente solo por ID; deben aplicar tenant/cliente/empresa/membresía antes de leer acciones/eventos o mutar el ciclo de firma, vincular `actionId` al expediente autorizado y validar objeto antes del payload/efectos. Supabase y el helper de firma deberán quedar simulados; E1-E6 y V3 siguen bloqueadas.

### 2026-10-12 — Vigesimoquinto lote de rutas privilegiadas E0-M3-06

- **Entrega:** PR [#739](https://github.com/expert-servicios/expert-app/pull/739) fusionada por squash en `main` como `66781310e71ecbf9442df31dd3ffb63a2fc0f19f`. La rama partió de `6775daed0b338a5082472b43d42ecac51d5f547a`; el HEAD revisado `e904503476d23ac7cd9301639ee587b99857eae9` quedó 5 commits por delante y 0 por detrás, con 5 archivos.
- **Alcance autorizado:** `GET /api/admin/cases/[id]/signature-actions` y `PATCH /api/admin/cases/[id]/signature-actions/[actionId]` reutilizan una resolución común del expediente que valida tenant efectivo, cliente, empresa y `profile_companies`. Las acciones se limitan por expediente, capability, tipo, tenant y empresa; los eventos se limitan a las acciones autorizadas. PATCH vincula `actionId` al expediente y autoriza el objeto antes de analizar el payload o invocar el helper de ciclo de vida.
- **Comportamiento preservado:** se mantienen el actor admin/owner exacto activo, la compatibilidad del owner global y de filas heredadas sin tenant, el helper de ciclo de vida existente y el contrato HTTP; se sustituyó la divulgación de mensajes internos de base de datos por error genérico. No se añadió funcionalidad.
- **Pruebas:** 12 casos HTTP cubren actor revocado, tenant/cliente/empresa ajenos, membresía ausente, scoping exacto de acciones/eventos, acción inexistente antes de payload inválido, payload inválido tras autorización, helper con IDs autorizados, owner global y compatibilidad con tenant/empresa nulos. El contrato estático de integración también se actualizó. Supabase y el helper permanecieron simulados; no hubo llamadas ni efectos reales.
- **Revisión:** revisión de seguridad sobre `e904503476d23ac7cd9301639ee587b99857eae9` completada sin hallazgos; 0 conversaciones abiertas. La primera CI [#3607](https://github.com/expert-servicios/expert-app/actions/runs/38210127749) detectó únicamente una aserción estática obsoleta; se corrigió en la misma rama y toda evidencia anterior quedó descartada.
- **Gates de PR:** CI [#3608](https://github.com/expert-servicios/expert-app/actions/runs/38210598627) verde 4/4; Vercel `app` `dpl_FtAFRkcX8YSmXGDoTRioXyEcZrFW` y `ksenia-expert` `dpl_GVdpLpcDdYixVsvCuhQvBrv32YWD`, ambos `READY` y ligados al HEAD revisado.
- **Gates posfusión:** CI [#3609](https://github.com/expert-servicios/expert-app/actions/runs/38211068857) verde 4/4 sobre `66781310e71ecbf9442df31dd3ffb63a2fc0f19f`; Vercel `app` `dpl_6LEACL81QhyJaHCADZmhcfa6x4VA` y `ksenia-expert` `dpl_BFnxtgJMFq4oT3Y4a1YNzFYbm5Xj`, ambos `READY` y ligados al mismo SHA.
- **Producción:** no se ejecutaron consultas ni DML de producción, migraciones, escrituras financieras, cambios RLS/grants, configuración, flags, credenciales ni despliegues manuales. Los despliegues automáticos vinculados a Git completaron sin cambios manuales de configuración. El cambio anunciado por Supabase para el 30-10-2026 sobre grants implícitos no afecta este lote, que no modifica esquema ni permisos.
- **Estado y secuencia:** E0-M3-06 permanece `IN_PROGRESS`. Siguiente tarea exacta: auditar conjuntamente `GET/POST/PATCH /api/admin/empresas/[id]/propuestas-contables`, cuya guardia acepta cualquier estado distinto de `inactive` y resuelve la empresa solo por ID antes de leer, crear o revisar propuestas contables con `service_role`. Debe exigir actor exacto activo, tenant/empresa/membresía y vinculación de la propuesta antes del payload/efecto, con Supabase y el helper simulados y sin mutar Holded ni datos reales. E1-E6 y V3 siguen bloqueadas.


### 2026-10-12 — Vigesimosexto lote de rutas privilegiadas E0-M3-06

- **Entrega:** PR [#740](https://github.com/expert-servicios/expert-app/pull/740) fusionada por squash en `main` como `db70e20360110af08e6b848134c521434c834821`, usando lease sobre HEAD exacto `c6132b5aa88b409080ac6ef17530acd8f58aef98`. La rama partió de `24503eb7c9dbac5880f2bbf359031ea93458125d`, quedó 8 commits por delante y 0 por detrás, con 5 archivos.
- **Alcance autorizado:** `GET/POST/PATCH /api/admin/empresas/[id]/propuestas-contables` exige actor `admin` u `owner` exactamente activo antes de instanciar `service_role`; resuelve la empresa dentro del tenant efectivo y confirma al menos una membresía válida del actor. Listado y alta usan el `companyId` autorizado. PATCH vincula propuesta + empresa + estado `pending` antes de analizar la decisión y repite los predicados en la mutación. Se conserva `holdedMutated: false`.
- **Pruebas:** nueva suite HTTP con 13 casos negativos/positivos para revocación, tenant, empresa, conjunto de membresías, listado/alta acotados, validación después del objeto, errores de preflight, estado y actualización exacta; además se ajustaron tres contratos estáticos KIA. Supabase y el helper de guardado quedaron simulados; no hubo llamadas ni escrituras reales. La primera ejecución CI de rama (#3611) descubrió tres aserciones estáticas obsoletas y se descartó como evidencia. La revisión detectó selección arbitraria de una sola membresía y un error de BD confundido con ausencia; ambos defectos se corrigieron, se añadieron regresiones y quedaron 0 hilos abiertos. La revisión final sobre `c6132b5aa88b409080ac6ef17530acd8f58aef98` no señaló incidencias mayores.
- **Gates de rama:** CI #3615 (run `38216190030`) verde 4/4 sobre el HEAD final, incluidas typecheck, lint, build, tests, MCP, baseline de migraciones e integraciones PostgreSQL/RLS. Vercel exacto del HEAD: `app` `dpl_B5CbkrZzu3h6Wb6S9CLpWhsfvFrS` y `ksenia-expert` `dpl_Aq9zvqqbfjKB9b7NttXzbiBMhxc1`, ambos `READY`.
- **Gates posfusión:** CI [#3616](https://github.com/expert-servicios/expert-app/actions/runs/38217152993) verde 4/4 sobre `db70e20360110af08e6b848134c521434c834821`; Vercel `app` `dpl_CbrkbippzoZvEiya73yh5z4Sc8cZ` y `ksenia-expert` `dpl_223K4y6zuMyy1HZtADDkTxmHT5HC`, ambos `READY` y ligados al mismo SHA.
- **Producción:** no se ejecutaron consultas ni DML de producción, migraciones, escrituras financieras/Holded, cambios de RLS/grants, configuración, flags, credenciales o despliegues manuales. Los despliegues automáticos vinculados a Git completaron sin cambios manuales de configuración. El cambio anunciado por Supabase para el 30-10-2026 sobre grants implícitos no afecta a este lote, que no crea tablas ni modifica permisos.
- **Estado y secuencia:** E0-M3-06 permanece `IN_PROGRESS`. Siguiente tarea exacta: auditar conjuntamente `GET/POST /api/admin/empresas/[id]/documents/index`, cuya guardia acepta cualquier estado distinto de `inactive`; GET lee el índice documental solo por `company_id` y POST valida la empresa únicamente por ID antes de invocar Google Drive y escribir auditoría. Debe exigir actor exacto activo, tenant/empresa/membresía y autorización de objeto antes de cualquier lectura o acceso externo, con Supabase/Drive simulados y sin indexar datos reales. E1-E6 y V3 siguen bloqueadas.


### 2026-10-12 — Vigesimoséptimo lote de rutas privilegiadas E0-M3-06

- **Entrega:** PR [#741](https://github.com/expert-servicios/expert-app/pull/741) fusionada por squash en `main` como `e3876e620dcd4e099184ed159413c6124f8cff32`, usando lease sobre HEAD exacto `b49faa5c1525e8e4154666c2ab104804ea0fc7ba`. La rama partió de `8d9f8e858393f44e53325e5e340b8778e0c874db`, quedó 4 commits por delante y 0 por detrás, con 2 archivos.
- **Alcance autorizado:** `GET/POST /api/admin/empresas/[id]/documents/index` exige actor `admin` u `owner` exactamente activo antes de instanciar `service_role`. Resuelve la empresa dentro del tenant efectivo y confirma membresía cliente-empresa antes de leer `company_document_index`/`company_document_roots` o invocar Google Drive. GET usa exclusivamente el `companyId` autorizado; POST pasa ese mismo ID al indexador y conserva la auditoría del actor. El propietario global y las empresas heredadas sin tenant requieren igualmente pertenencia verificable.
- **Pruebas y revisión:** suite HTTP de 10 casos para revocación previa a `service_role`, cruce de tenant, membresía ausente/ajena/error, filtros exactos, resumen, auditoría, propietario global/legacy y fallo de Drive. La CI inicial #3618 sobre `7950993f7d3711d0dca52fd32cf81beb7536947a` detectó que el doble de Supabase no reproducía las consultas thenable; se corrigió y esa ejecución no se usa como evidencia. La CI final ejecutó 440 archivos/2.469 tests; Codex revisó `b49faa5c1525e8e4154666c2ab104804ea0fc7ba` sin incidencias mayores y quedaron 0 hilos abiertos.
- **Gates de rama:** CI [#3620](https://github.com/expert-servicios/expert-app/actions/runs/38219045765) verde 4/4 sobre el HEAD final; Vercel `app` `dpl_hJ4yaMQqXRhD87iUqP3RD6EQZGui` y `ksenia-expert` `dpl_7kFftiN39G27pz5tm8akUuG8S1Nq`, ambos `READY`.
- **Gates posfusión:** CI [#3623](https://github.com/expert-servicios/expert-app/actions/runs/38220329177) verde 4/4 sobre `e3876e620dcd4e099184ed159413c6124f8cff32`; Vercel `app` `dpl_9nkBEuhiivVX9Vj3uAquKUSdCgew` y `ksenia-expert` `dpl_8fHem8ixxdEncFKMFDbwhRn8RqCC`, ambos `READY` y ligados al mismo SHA.
- **Producción:** no se ejecutaron consultas ni DML de producción, indexación real de Google Drive, migraciones, escrituras financieras/Holded, cambios de RLS/grants, configuración, flags, credenciales o despliegues manuales. Los despliegues automáticos vinculados a Git completaron sin cambios manuales de configuración. El cambio anunciado por Supabase para el 30-10-2026 sobre grants implícitos no afecta a este lote, que no crea tablas ni modifica permisos.
- **Estado y secuencia:** E0-M3-06 permanece `IN_PROGRESS`. Siguiente tarea exacta: auditar conjuntamente `GET/PATCH/DELETE /api/admin/users`, cuya guardia comprueba rol pero no estado exact-active ni tenant; GET agrega perfiles, Auth, empresas, presupuestos y expedientes sin alcance tenant, mientras PATCH puede cambiar rol/perfil/estado y DELETE elimina Auth basándose solo en el ID objetivo y dependencias globales. Debe exigir actor exacto activo, resolver el usuario objetivo dentro del tenant/empresa autorizado antes del payload o efecto y proteger jerarquía/autodesactivación, con Auth/Supabase simulados y sin mutar usuarios reales. E1-E6 y V3 siguen bloqueadas.

### 2026-10-12, 23:32 (Europe/Madrid) — Sincronización verificable de commits y tareas DevOps

**Fotografía, no acta de cierre ni permiso de ejecución.** Base `main f26613cc334e03dd253086793b10aefc7481d832` (último cambio documental tras la PR #741); ningún lote E0 adicional se ha acreditado en `main` en esta revisión. La fase **E0 continúa IN_PROGRESS**, checkpoint `E0-M3-06`; E1–E6 continúan bloqueadas. La única siguiente auditoría autorizada de E0 es `GET/PATCH/DELETE /api/admin/users` con aislamiento por actor exact-active, tenant, empresa y usuario objetivo, pruebas negativas y readback; no cerrar por inferencia.

| Referencia | HEAD revisado | Estado verificado | Tarea sincronizada / condición para avanzar |
| --- | --- | --- | --- |
| [PR #742](https://github.com/expert-servicios/expert-app/pull/742) · base del agente bajo KIA | `d1b82574128ef9f7c0a5d20a090607d4fa96f3a6` | **En rama, DRAFT y sin fusionar**; CI de PR #38301684204 SUCCESS. Contratos, workflow limitado, estado, diseño de cola y tests no equivalen a agente operativo. | Mantener agente **OFF**. Revisar independencia humana, barreras de autorizaciones, persistencia de cola y vínculo con E0; verificar CI y ambas previews del mismo HEAD antes de cualquier eventual fusión autorizada. |
| [PR #743](https://github.com/expert-servicios/expert-app/pull/743) · avisos privados Telegram | `738a8c7d70fcb1e423f30188a24c8aee73c4ff3a` | **DRAFT, sin fusionar**; CI #38299233137 SUCCESS (4/4 jobs; 2.475 tests, 6 offline del workflow). Ambas previews Vercel READY verificadas previamente para ese SHA. El workflow **no existe en main** a esta fecha. | **Pendiente revisión/aprobación independiente y fusión separadamente autorizada**; después, prueba real `workflow_dispatch / test_delivery` desde main, comprobación de recepción privada y evidencia del resultado. No presentar mocks como entrega Telegram. Avisos automáticos OFF. |
| [PR #744](https://github.com/expert-servicios/expert-app/pull/744) · adenda Claude/Gemini en Plan Maestro | `0df2ceaccd49b8c7f4828ade095f82c61ad582d4` | **DRAFT, sin fusionar**, CI #38300506885 SUCCESS. Documento de revisión Codex → Claude (seguridad) → Gemini (funcionalidad) → CI → validación humana; no acredita agentes ejecutados. | Revisar coherencia con E0, presupuesto y privilegios de AI Gateway. No asumir previews sin evidencia fresca; mantener habilitación y automatismos OFF. |
| [PR #745](https://github.com/expert-servicios/expert-app/pull/745) · smoke Claude/Gemini por AI Gateway | `624e2f851bf192e7c1c8daaefb0939574e7fe21a` | **DRAFT, sin fusionar. CI #38310709413 FAILURE**: falló `tests/infra/kia-ai-review-gateway-smoke.test.ts` en simulación aislada ("Claude: SMOKE_OK / Gemini gateway request failed"); 2.473/2.474 tests correctos. Tres jobs de integración correctos; Typecheck/Lint/Test fallido. **No es prueba real de Claude/Gemini.** | **Bloqueo prioritario del subflujo:** corregir mock/contrato Gemini sin reducir fail-closed, repetir suite y CI 4/4 sobre HEAD nuevo; verificar ambas previews SHA exacto y después, solo con autorización, plantear prueba real acotada y presupuestada. |

**Otras PR aún abiertas, sin adelantar fase:** [#713](https://github.com/expert-servicios/expert-app/pull/713) (migración ALVILS/dual Holded), [#705](https://github.com/expert-servicios/expert-app/pull/705) (persistencia KIA web), [#683](https://github.com/expert-servicios/expert-app/pull/683) (botones públicos) y [#707](https://github.com/expert-servicios/expert-app/pull/707), [#708](https://github.com/expert-servicios/expert-app/pull/708), [#709](https://github.com/expert-servicios/expert-app/pull/709) (especificaciones). **NO** marcarlas terminadas ni iniciar E1–E6. Decidir dependencia/cierre sólo con gates de su fase.

**Regla de sincronización de tareas:** una PR DRAFT o verde en CI no significa tarea completada, entregada ni activada; diferenciar *documentado*, *implementado en rama*, *CI validada*, *preview READY*, *fusionado en main*, *prueba real* y *producción*. Ningún cambio de estado puede omitir SHA, evidencia, responsable y aprobación correspondiente. No se han fusionado PR, leído secretos, ejecutado pruebas externas de Telegram/Claude/Gemini ni activado agentes en esta actualización.

### Actas de cierre

| Fase | Fecha | Commit/PR | Tests, QA, seguridad, despliegue | Conclusión |
| --- | --- | --- | --- | --- |
| E0 | — | — | Pendientes | ABIERTA |
| E1 | — | — | No iniciada | BLOQUEADA |
| E2 | — | — | No iniciada | BLOQUEADA |
| E3 | — | — | No iniciada | BLOQUEADA |
| E4 | — | — | No iniciada | BLOQUEADA |
| E5 | — | — | No iniciada | BLOQUEADA |
| E6 | — | — | No iniciada | BLOQUEADA |

**Norma final:** la ejecución continua es una sucesión de sesiones verificadas y commits durables; no presupone trabajo en segundo plano. **No saltar fases, no abrir otros frentes, no marcar terminado sin pruebas.**

### 2026-10-12 — Adenda de gobierno: revisión técnica multimodelo Claude + Gemini (sin activación)

**Decisión de Dirección:** complementar el desarrollo Codex/KIA con dos verificadores técnicos de proveedores distintos: **Claude (Anthropic)** para seguridad, amenazas, autorización, aislamiento tenant, integridad y arquitectura, y **Gemini (Google)** para regresiones funcionales, casos límite, coherencia de contratos y comprobación de tests. Esto es **seguridad/calidad del pipeline E0–E6**, no un nuevo módulo de producto, una segunda KIA ni permiso de adelantar E4/E5. E0 permanece única fase activa; checkpoint y feature flags sin cambios.

**Fuentes/alcance:** PR [#742](https://github.com/expert-servicios/expert-app/pull/742) (base Dev Agent) y [#743](https://github.com/expert-servicios/expert-app/pull/743) (notificaciones DevOps Telegram) siguen *draft*, sin fusionar ni activar. No se considerará aprobada ninguna de ellas por crear este anexo. En una ejecución anterior, el test de notificaciones de #743 presentó un fallo de simulación; fue corregido y después CI #38299233137 quedó SUCCESS 4/4 sobre `738a8c7d70fcb1e423f30188a24c8aee73c4ff3a`, con ambas previews READY en ese SHA. Esto sigue sin probar una entrega real de Telegram ni habilita la fusión de #743. El workflow de Telegram solo podrá hacer una entrega real cuando exista en `main` revisado y con una ejecución explícita de prueba; la simulación no prueba conectividad.

**Contrato de roles y autoridad:**

| Actor | Función | Límite |
| --- | --- | --- |
| Codex / agente KIA de desarrollo | Analiza tarea, propone cambios en rama y PR; autocorrección dentro de alcance autorizado | No puede aprobarse a sí mismo; nunca merge automático, migraciones ni producción |
| Claude auditor | Revisión independiente **entre modelos** de amenazas, secretos, SSRF, autorización, RLS, scopes, supply chain y arquitectura | Solo lectura del diff y pruebas; informe reproducible; ninguna aprobación GitHub humana ni escritura de código |
| Gemini auditor | Revisión funcional independiente **entre modelos**, invariantes, casos negativos, compatibilidad, ES/RU y criterios de aceptación | Solo lectura; no puede sustituir tests ni aprobación humana |
| GitHub CI / Vercel | Typecheck, lint, build, tests, checks PostgreSQL aplicables y **ambas** previews exactas al HEAD | Los fallos o checks no concluyentes bloquean; el resultado anterior al último push caduca |
| Dirección EXPERT y revisor humano genuinamente independiente cuando aplica | Validación de negocio y aprobación humana según criticidad, con trazabilidad | Las cuentas `expertestudiospro` y `kiabusiness2025` de la misma persona no equivalen a independencia humana; las IA tampoco |

**Integración técnica prevista (desactivada):** preferir **Vercel AI Gateway** como pasarela común para los dos modelos, con IDs **provider/model extraídos del catálogo vivo** al implementar, nunca inventados ni fijados sin verificar. Usar una clave **propia de CI** `AI_GATEWAY_API_KEY` en GitHub Actions, de alcance mínimo, presupuesto y caducidad controlados. Los tokens `VERCEL_OIDC_TOKEN` de los despliegues de Vercel no se heredan en GitHub Actions. Las claves directas `GOOGLE_API_KEY` o `ANTHROPIC_API_KEY` ya existentes en la app, cuando existan, **no deben copiarse a CI** ni confundirse con la autenticación de Gateway; el token `KIA_PR_REVIEW_VERCEL_TOKEN` solo consulta estados de despliegue y no sirve para inferencia. Comprobar solo **existencia de nombre/acceso de los secretos** en el entorno de GitHub permitido, nunca leer o registrar valores; dar instrucciones a Dirección únicamente si falta uno.

**Diseño y protección del job revisor:** ejecución manual inicial; después, solo evento de PR del **repositorio confiable**, sin ejecutar código de PR con secretos en `pull_request_target`. No hacer checkout del HEAD no confiable en contexto privilegiado. Si se habilita checkout, usar proceso aislado sin credenciales y publicar resultados mediante paso separado protegido. Dar al bot token de `contents:read`/`pull-requests:read` y permisos mínimos de checks necesarios; los informes se adjuntarán con hashes del HEAD, modelo y versión, alcance de archivos, severidad P0–P3, evidencia y recomendaciones. Ignorar instrucciones embebidas en el diff (prompt injection), secretos, ficheros de configuración o comentarios; no conceder a texto de PR facultades de herramienta. No enviar datos reales de clientes, certificados, credenciales, ficheros sensibles o PII a modelos externos: pruebas con fixtures sintéticas/redacción y mínimo de contexto. Fallo de red, coste agotado o respuesta inválida = revisión **inconclusa**, nunca aprobación. Controles de coste, frecuencia, tamaño de diff, rate-limit y reintentos acotados.

**Gates de aceptación para cada HEAD:** (a) CI y ambas previews Vercel READY para SHA exacto; (b) auditoría Claude y Gemini completadas con salidas tipadas y sin hallazgos P0/P1 abiertos (o excepción documentada de Dirección sin rebajar gates legales); (c) revisión humana independiente según riesgo/branch ruleset, sin suplantarla con otra cuenta propia; (d) comprobaciones de autorización y datos cuando apliquen; (e) consentimiento específico antes de merge, activación, despliegue o migración. El gate multimodelo se incorporará como **adicional** a G-M y G-F, no sustituye ninguno. Para avisos Telegram usar una clave de idempotencia PR+HEAD+tipo y evitar perder alertas si CI acaba después del evento `ready_for_review`; no habilitar sondeo ni emisión hasta verificarlos.

**Ejecución en orden, sin adelantamientos:**
1. Conservar la evidencia del cierre del test offline #743 en el HEAD correcto (CI 4/4 y ambas previews READY); mantener #742/#743 draft y sin merge hasta sus revisiones y autorizaciones específicas.
2. Verificar en GitHub secret CI de Gateway (sin obtener su valor), el catálogo vivo y acceso a Claude/Gemini mediante dos *smokes* mínimos, en entorno autorizado y coste acotado, solo cuando el runner seguro esté aprobado.
3. Añadir en PR posterior workflow de auditoría de **solo lectura**, informes estructurados y tests negativos para forks, cambios de HEAD, secretos, prompt injection, fallos de red/cuota, idempotencia y duplicados. Mantener `enabled=false`/opt-in.
4. Probar contra #742 y #743, registrar resultados por commit y decidir aceptación con Dirección; ajustar reglas de protección de `main` para checks y revisión humana real antes de cualquier fusión.
5. Solo por orden expresa, activar notificaciones y los checks como obligatorios una vez probado rollback y entrega privada.

**Configuración declarada por Dirección (12/10/2026):** `AI_GATEWAY_API_KEY` dedicada ya creada en GitHub Actions, con presupuesto máximo 5 USD y caducidad de 30 días. Esta declaración no acredita acceso por un job ni autoriza inferencia; nunca leer, copiar o registrar el valor. No se solicitan por defecto claves nuevas directas de Anthropic o Google. Validar coste previsto y autorizaciones de datos antes del primer smoke pagado. `KIA_PR_REVIEW_VERCEL_TOKEN` y credenciales Telegram se gestionan por separado.

**Estado de este registro:** acuerdo documentado, **no implementado ni operativo**; sin escritura productiva, flags, secretos, merge, migraciones o gastos de API autorizados por esta adenda.


---

# Consolidación documental transversal · 17/10/2026

**Único plan rector vigente:** este documento E0–E6. La consolidación no certifica ninguna función desplegada ni levanta la congelación de alcance. Este apartado recoge las decisiones aprobadas de documentación, enlaza las fuentes y clasifica otros planes sin volver a duplicarlos.

**Mapa de documentos e iniciativas:**

| Área | Documento / registro | Estado verificado y relación con E0–E6 |
| --- | --- | --- |
| Herramientas gratuitas y SEO | [PR #798](https://github.com/expert-servicios/expert-app/pull/798), [issue #796](https://github.com/expert-servicios/expert-app/issues/796), anexo siguiente | Página funcional en PR draft, **no en main**; la documentación se consolida aparte. Mantener aprobación de despliegue independiente. |
| Diagnóstico laboral gratuito con lead/PDF | [issue #795](https://github.com/expert-servicios/expert-app/issues/795) | Propuesta sin implementación. Fase cuestionario sin datos de empleados; descarga/envío tras transparencia; marketing no ligado. |
| RGPD PDF/lead reutilizable | [issue #780](https://github.com/expert-servicios/expert-app/issues/780), [PR #782](https://github.com/expert-servicios/expert-app/pull/782) | Patrón reutilizable pendiente de QA jurídico y de permisos; no copiarlo sin verificación. |
| Auditoría laboral y conocimiento KIA | [#785](https://github.com/expert-servicios/expert-app/issues/785), [#797](https://github.com/expert-servicios/expert-app/issues/797), [procedimiento KIA en Drive](https://docs.google.com/document/d/1K7_pYaHpw5FweC9Ga2FOD5ieRoSvCL2aY-PozIEJR8I/edit) | Instrucción documental y oportunidades editoriales, no funcionamiento autónomo. Desidentificación, supervisión y fuentes oficiales obligatorias. |
| Agente de desarrollo supervisado | [#791](https://github.com/expert-servicios/expert-app/issues/791), [documento auditoría de preparación](audits/kia-autonomous-development-readiness-2026-10-17.md) | Preparación y controles previos; no ejecución automática ni autoaprobación. |
| Subagentes KIA | [#789](https://github.com/expert-servicios/expert-app/issues/789), [auditoría de subagentes](plans/kia-post-e6-subagents-audit-and-parity-2026-10-17.md) | Inventario y diseño posterior a E6; no confirmar capacidades productivas sin pruebas. |
| Motor de oportunidades editorial | [documento vigente](kia-commercial-editorial-opportunity-engine-2026-10-13.md), [#768](https://github.com/expert-servicios/expert-app/issues/768) | Reutilizar motor único; no crear motores paralelos. |
| Funciones documentales avanzadas | [V3-23](expert-kia-v3-ideas-and-validation-backlog-2026-10-10.md), [#786](https://github.com/expert-servicios/expert-app/issues/786) | Idea posterior a E6, preservar permisos por archivo y fuente. |
| Simulación coste laboral / nóminas | [V3-24](expert-kia-v3-ideas-and-validation-backlog-2026-10-10.md), [#785](https://github.com/expert-servicios/expert-app/issues/785) | Se diferencia del diagnóstico gratuito; pos-E6, requiere cálculos jurídicos verificados. |

**Reconciliación de documentación y PRs:** propuestas V3-23 (#787) y V3-24 (#788) comparten archivo y no deben fusionarse sin integrar ambos fragmentos en una sola versión; sus capturas se consolidan de manera conjunta. Los informes de agente (#792) y subagentes (#790) se incorporan como documentos independientes bajo este índice. Las PRs de contenido normativo y CIRCE/RGPD (#783, #771, #772, #769, #779, #782) requieren revisión editorial-jurídica y de privacidad por separado; NO fusionar por mera semejanza documental ni incorporar datos de leads reales al repositorio público.

**Punto detectado sobre la página de herramientas:** la primera evaluación de siete utilidades contaba formación Holded por existir una `UnitPriceCalculator` en el catálogo, pero su página pública redirige y no ofrece el acceso esperado. La ficha se excluyó de la oferta hasta corregir la navegación. Inventario verificable inicial: **seis** (RGPD, IRPF, IRNR, Patrimonio, NIF extranjero, migración laboral Holded).

**Criterios adicionales para cualquier PR de contenido público:** (a) fuente de URL canónica indexable, (b) validez de información y fechas reales, (c) evaluación robots/sitemap/hreflang, (d) contenido valioso y CTA contextual, (e) review técnico/editorial, (f) pruebas de CI/preview, y (g) autorización de Dirección. La inclusión en un sitemap no garantiza aparición ni mejora de posición en Google.

## ANEXO 17/10/2026 — Plan unificado de herramientas gratuitas, sitemap, SEO y oportunidades KIA

**Estado:** planificación consolidada y PR #798 de producto EN BORRADOR; consolidación documental independiente. Sigue activa la congelación de alcance E0–E6: este anexo no abre una fase ni autoriza fusionar, publicar, activar IA, recoger datos nuevos o ampliar producción. **Fuente rectora:** este mismo Plan Maestro; los issues son listas de trabajo relacionadas, no planes alternativos. Siguiente checkpoint E0 no cambia.

### Rama H1 — Catálogo público de herramientas (PR #798; #796)

**Inventario validado contra rutas reales, no solo definiciones de catálogo (17/10/2026):**

| Recurso | Disponibilidad / ruta de destino | Estado sitemap |
| --- | --- | --- |
| Autoevaluación RGPD | `/herramientas/rgpd` en `main` | URL individual incluida en PR #798; falta aprobación y comprobación en preview |
| Calculadora de honorarios IRPF | `/servicios/declaraciones-impuestos/irpf#calculadora-honorarios` | Página de servicio ya proyectada por `serviceRoutes` |
| Calculadora de honorarios IRNR | `/servicios/declaraciones-impuestos/no-residentes#calculadora-honorarios` | Página de servicio ya proyectada |
| Calculadora de honorarios Patrimonio | `/servicios/declaraciones-impuestos/impuesto-patrimonio#calculadora-honorarios` | Página de servicio ya proyectada |
| Calculadora honorarios NIF socio extranjero | `/servicios/empresas-autonomos/nif-socio-extranjero#calculadora-honorarios` | Página de servicio ya proyectada |
| Calculadora migración laboral Holded | **`/holded/migracion-laboral#calculadora-honorarios`** (ruta autónoma; no usar `/servicios/holded/holded-migracion-laboral`, que redirige) | Página autónoma ya proyectada en rutas estáticas |
| Calculadora formación Holded | `UnitPriceCalculator` definida en `lib/utils/catalog.ts` para `formacion-holded`, pero ruta `/servicios/formacion/formacion-holded` redirige a `/holded#formacion`, donde no se ha verificado calculadora equivalente | **NO DISPONIBLE como enlace directo a calculadora; retirada de la lista activa de #798**. Requiere página o montaje funcional validado antes de anunciar |

**Conclusión corregida:** PR #798 centraliza inicialmente **6 herramientas utilizables verificadas** (RGPD + IRPF + IRNR + Patrimonio + NIF + migración laboral Holded). La calculadora de formación es reutilizable en código pero no publicable como herramienta accesible hasta solucionar la redirección. No contar «calculadoras integradas en componentes» como páginas separadas para sitemap; URL canónica del servicio/landing es la que se indexa, el fragmento `#calculadora-honorarios` sirve para navegación, no constituye otra URL rastreable.

**Alcance PR #798:** nueva `/herramientas` agrupada por protección de datos, fiscalidad, empresas y Holded; inventario tipado `lib/tools/public-tools.ts`, enlaces a rutas reales y anclas, CTA relacionados desde fichas de servicio y `ArticleIntentCTA` de Blog/Docs, navegación y footer, metadatos SEO y JSON-LD verídico. `/herramientas` y `/herramientas/rgpd` añadidas al sitemap en la rama; no en `main` hasta merge. Requiere confirmar acceso HTTP 200/robots/canonical, enlaces y UX móvil en preview y una segunda revisión de coherencia de llamadas CTA.

**Checklist H1 (para revisión de PR):**
- [x] Catalogar rutas conocidas y diferenciar precio de honorarios de cálculo de impuesto
- [x] Crear página/hub ES y fichas por categorías en PR draft
- [x] Incorporar rutas del hub y RGPD a sitemap de la PR
- [x] Poner enlaces desde header, footer, servicios, blog/Docs cuando exista relación
- [x] Corregir enlace migración laboral al landing autónomo y su ancla; retirar formación Holded de lista de herramientas activas
- [ ] CI SHA exacto: typecheck, lint, tests, build; pruebas de enlaces/anclas reales
- [ ] Vercel app + ksenia-expert previews READY para HEAD final y revisión visual responsive
- [ ] Aprobación expresa de Dirección y del gate del Plan Maestro para merge/deploy

### Rama H2 — Integridad global de indexación (issue #796)

Inventario realizado sobre árbol `main` (238 `page.tsx`, 139 páginas/plantillas públicas ES/RU). La ausencia de una ruta en el generador no es defecto si es `noindex`, privada, redirección o transaccional. Distinguir **indexación real GSC**, **candidatura sitemap**, **CMS publicado**, **rutas resolubles** y **código aún no publicado**.

- [ ] Reconciliar 3 artículos fiscales 2026 que constan en `lib/content/fiscal-2026-blog.ts` pero no en `blogArticles` servido.
- [ ] Reconciliar 5 artículos `blog_posts.estado=publicado` de Supabase que no figuran en `blogArticles`; no indexar antes de confirmar página pública 200.
- [ ] Completar `/categoria` y sus 6 rutas `/categoria/[tema]` si todas son indexables.
- [ ] Incluir guías independientes indexables (AutoFirma) que están fuera de `docs`, sin duplicar la guía de nacionalidad que sí está catalogada.
- [ ] Revisar `/servicios/extranjeria-nacionalidad/renovacion-residencia-inversor` y otros landings autónomos indexables.
- [ ] Revisar `/consulta-gratuita` y `/presupuesto/aclaraciones` según valor SEO y privacidad; no incluir automáticamente páginas de formulario.
- [ ] Corregir incoherencia de 4 servicios RU con `indexable:true` sin `shouldIndexLocale('ru')` y añadir blog/docs/herramientas RU solo tras gate y QA de traducción.
- [ ] Definir condición de publicación para 2 guías laborales Academy `access=public, status=review`; mantener 14 privadas `student` fuera.
- [ ] Usar fechas reales de revisión/publicación en `lastModified`, nunca «ahora» indiscriminado.
- [ ] Auditar canonical, robots, hreflang recíproco, enlaces internos, metadatos, imágenes sociales, URLs 200/301/404, HTML renderizado, sitemap desplegado y GSC antes de afirmar indexación o resultados.
- [ ] Añadir tests de manifest completo de URLs indexables (static + CMS + archivos independientes + locales) y exclusión negativa automática.

### Rama H3 — Nuevas herramientas y protección de datos (issues #795, #780)

- [ ] Especificar diagnóstico laboral gratuito fase cuestionario SIN datos nominales de empleados, conclusiones preliminares con fuentes oficiales actualizadas.
- [ ] Mostrar resultado básico gratis antes de identificarse; ofrecer **descargar PDF** o **recibir por correo**, con nombre/email para solicitar el informe personalizado e información transparente sobre creación del lead; no condicionar a marketing.
- [ ] Captar origen, idioma, consentimiento opcional específico y eventos mínimos, con idempotencia, antiabuso y conservación aprobada.
- [ ] Reutilizar registro/leads/pdf/email ya diseñados en #780; no crear canales paralelos.
- [ ] Condicionar fase documental (nóminas/contratos, posibles datos de terceros) a evaluación RGPD, roles responsables/encargados, medidas técnicas, acuerdos de proveedores de IA, seguridad RLS/tenants y aprobación humana.
- [ ] Crear página o montaje realmente operativo de calculadora formación Holded, solo si se autoriza y se comprueba que no redirige; registrar su URL canónica/sitemap y enlaces.

### Rama H4 — Generación de conocimientos KIA y SEO de contenidos (issues #797, #768, #785)

- [ ] Convertir hallazgos de auditorías privadas en **patrones desidentificados** (nunca publicar empresa/empleados/nominas/expedientes), con deduplicación contra Blog, Docs, Academy y CMS.
- [ ] Proponer artículos, guías, FAQs y oportunidades de servicio ES/RU, con norma y vigencia real, enlaces oficiales, intención de búsqueda, propietario editorial, fuente y CTA al servicio/herramienta adecuada.
- [ ] Crear/editar solo borradores con revisión jurídica/editorial/comercial; no autopublicar ni inventar importes o normativas.
- [ ] Tras publicar páginas aprobadas, pasar obligatoriamente test SEO/sitemap y actualizar interlinking.

### Rama H5 — Agente autónomo de desarrollo seguro (issue #791)

- [ ] Al crear/modificar ruta pública, calcular manifest de URLs **indexables** y actualizar sitemap en la misma PR. No añadir por el mero hecho de existir `page.tsx`.
- [ ] Excluir `noindex`, drafts, noindex RU, auth, dashboards, recibos, rutas con token, redirecciones y documentos privados.
- [ ] Verificar sitemap, metadata/robots, canonicals, hreflang, fechas, respuesta HTTP, enlaces y cobertura de páginas CMS servidas; si hay discrepancia **bloquear PR**.
- [ ] Cambios en rama aislada y PR draft, con CI determinista, previews del SHA exacto, revisión humana y aprobación de Dirección; ninguna fusión o deploy autónomos.

### Dependencias y orden autorizado

| Secuencia propuesta | Dependencias | Responsable funcional | Salida validable |
| --- | --- | --- | --- |
| 0. Continuar E0 original | Plan Maestro vigente; no desplazar checkpoint | Dirección / equipo EXPERT | Fase E0 conforme a sus propios gates |
| 1. Validación pasiva de #798 | Excepción de alcance si se decide fusionar durante E0 | Desarrollo / QA | Informe de CI + preview + URL manifest |
| 2. Catálogo gratuito ES | Aprobación de PR #798 y despliegue explícito | Producto + SEO | Ruta pública, enlaces funcionales, sitemap 200 |
| 3. Corregir brechas SEO | Inventario #796, revisión editorial y locales | SEO + desarrollo | Cobertura sin rutas privadas, GSC verificada |
| 4. Leads/PDF RGPD/laboral | RGPD, antiabuso, #780, #795, KIA | Privacidad + desarrollo | Pruebas sintéticas E2E y aceptación Dirección |
| 5. KIA editorial y agente autónomo | #797 y #791, gates E0–E6, pruebas seguridad | KIA / producto | Propuestas desidentificadas y PRs supervisadas |

### Ampliación documental H4 — matriz operativa laboral y SEO (17/10/2026)

Se conserva como documento auxiliar la [matriz de oportunidades laborales, aprendizaje KIA y validación SEO](plans/kia-labor-editorial-seo-opportunity-matrix-2026-10-17.md): LAB-01 a LAB-10, clasificación editorial/servicios/herramientas, deduplicación ES/RU, fuentes primarias, SEO técnico y pruebas sintéticas. Su contenido **no autoriza ejecución ni publicación**, no abre una nueva fase y no crea un segundo motor de oportunidades. Documento subordinado al Plan Maestro; E0 permanece en curso y su checkpoint no cambia.

### Ampliación H4 — bandeja de oportunidades en Admin (17/10/2026)

Diseño futuro de una [bandeja unificada de oportunidades KIA](plans/kia-admin-opportunities-queue-spec-2026-10-17.md), como proyección de Editorial Hub, Regulatory Pulse y los módulos existentes. Define filtros, trazabilidad, revisión profesional por destino, privacidad, permisos y pruebas de transiciones prohibidas. **Solo documentación**: no existe aún la nueva interfaz ni se han creado endpoints, tablas o publicaciones; E0-M3-06 no cambia.

### Consolidación de planes documentales históricos (17/10/2026)

Se preservan como **documentos auxiliares históricos** los planes de [CIRCE](plans/circe-autogestion-centro-ayuda-20261015.md), [Crea y Crece y facturación](plans/crea-crece-facturacion-oportunidades-kia-20261015.md), [auditoría editorial/Academy Holded](editorial/blog-docs-holded-links-cta-consultation-audit-2026-10-13.md), [reposicionamiento web](expert-public-web-workspace-kia-repositioning-plan-2026-10-10.md), [navegación y futuros créditos](expert-web-v2-navigation-knowledge-ai-credit-plans-2026-10-10.md), [auditoría de proveedores y subagentes](kia-ai-providers-artifacts-subagents-audit-2026-10-10.md), [KIA y Document Studio](kia-unified-core-attachments-document-studio-2026-10-10.md) y [Workspace/KIA](workspace-v2-kia-copilot-parallel-integration-2026-10-10.md). Las propuestas de #707, #708, #709, #760 y #783 quedan preservadas sin fusionar sus ramas antiguas ni alterar la prelación E0–E6. El [suplemento Admin V2 de soporte y KIA](plans/admin-v2-support-and-kia-contract-pr708-consolidated-2026-10-17.md) preserva las ratificaciones de #708 sin sustituir el Plan Admin canónico. La adenda de #744 ya está integrada en el Plan Maestro. **No adoptar precios, planes por créditos, fechas, claims ni despliegues de esos borradores sin validación actual y aprobación de Dirección.**

### Regla de gobierno

Este anexo **unifica las ramas y las listas de aceptación**, sin crear otro plan rector y sin sustituir prioridades E0–E6. Los issues #780, #791, #795, #796, #797 y PR #798 son las trazas de ejecución. Ningún cambio de producto/SEO queda «publicado» hasta fusión, despliegue, pruebas de HTTP e indexabilidad; y estar en sitemap no garantiza indexación ni posiciones en Google.



## Gobierno documental único — Auditoría y limpieza del 17/10/2026

**Decisión de Dirección:** **este archivo es el único Plan Maestro activo de EXPERT/KIA**. Toda nueva rama, requisito, prioridad, modificación, decisión, checkpoint y cierre se registra primero aquí, mediante PR documental con SHA, fecha, owner y gate. No crear otros ficheros que se atribuyan autoridad de «plan maestro», «roadmap vigente» o «backlog ejecutable» independiente. Los documentos auxiliares son **referencia histórica o técnica**, nunca permiso de ejecución. E0 permanece `IN_PROGRESS`; checkpoint `E0-M3-06-admin-users-tenant-object-scope-audit`; E1–E6 y V3 continúan bloqueados según gates existentes.

### Regla de conservación, archivo y revisión

1. **ARCHIVADO:** el contenido histórico se ha copiado sin alterarlo a `docs/archive/plans/2026-10-17/`; su ruta original se conserva como marcador de lectura con referencia a este Plan Maestro y al archivo para evitar enlaces rotos. La copia no equivale a contenido vigente. No aplicar instrucciones comerciales, WhatsApp/WABA, automatismos, credenciales ni precios históricos.
2. **INTEGRAR tras revisión:** candidato a extraer requisitos verificables a esta misma rama temática, sin ejecutarlos. Contrastar código, normas, duplicados y fuentes; abrir propuesta al Plan Maestro por su PR de documentación. Solo tras confirmación se marca integrada y puede archivarse su archivo auxiliar.
3. **REVISAR:** pendiente de decisión sobre mantener o descartar; no iniciar tareas de implementación. Necesita comprobación técnica o normativa actual, dueño y resolución motivada.
4. **CONSERVAR técnico:** runbooks, protocolos, pruebas y normativa mantienen detalle consultable. Pueden permanecer como referencias, pero nunca fijan prioridades o estados frente al Maestro.
5. **SEPARAR de planificación:** material de clientes o casos privados debe permanecer en CRM/expediente conforme a permisos, no como fuente general del roadmap ni contenido reutilizable identificable.
6. **Versiones y referencias:** la documentación histórica forma parte del registro de evidencias; no modificar ni eliminar historiales financieros o migraciones SQL. Al mover un archivo auxiliar en el futuro, dejar compatibilidad en su ruta y revisar los enlaces entrantes.
7. **Actualización única:** cada PR futura añade/edita el bloque pertinente **aquí**, incluyendo oportunidad/requisito, impacto, prioridad, fase, dependencias, riesgo, responsables, alcance, aceptación, estado `IDEA / VERIFICAR / APROBADA / EN CURSO / CERRADA / DESCARTADA`, prueba de CI y fecha. **Nunca dos planes rectores**. Ni `APROBADA` implica despliegue ni `CERRADA` equivale a producción sin readback.

### Registro documental revisado — 54 documentos de planificación

La decisión de esta tabla es una **clasificación de gobernanza**, no un dictamen de ejecución. No se da por comprobada la vigencia normativa ni funcional de los documentos aún en revisión.

| Ruta documental | Decisión de gobierno | Motivo y acción siguiente |
| --- | --- | --- |
| `docs/admin-360-compact-redesign-backlog-2026-10-09.md` | **INTEGRAR tras revisión** | UX compacta de Admin 360; contrastar con Workspace V2 y gates E0 |
| `docs/admin-360-unified-directory-plan.md` | **INTEGRAR tras revisión** | Modelo persona/empresa/lead sin identidades ficticias; deduplicar Admin V2 |
| `docs/admin-improvement-plan.md` | **ARCHIVADO** | Segundo plan de mejoras fechado en septiembre; requiere solo consulta histórica. |
| `docs/admin-meta-catalog-manager-plan-2026-10-03.md` | **REVISAR** | Estado Meta, inventario y consentimientos requieren comprobación actual |
| `docs/audit-2026-07-01-plan.md` | **ARCHIVADO** | Remediación de julio y decisiones antiguas MCP/WABA, no vigente. |
| `docs/business-academy-implementation-plan.md` | **ARCHIVADO** | Plan anterior con claims formativos y precios que requieren validación. |
| `docs/compliance/rgpd-expert-estudios-profesionales-implantacion.md` | **CONSERVAR técnico** | Guía o prueba especializada; conservar como referencia, no como plan de desarrollo. |
| `docs/editorial/marketing-execution-roadmap-2026-10-02.md` | **REVISAR** | Calendario de campañas antiguo; no asumir autorización de publicar |
| `docs/editorial/social-content-strategy.md` | **INTEGRAR tras revisión** | Reglas editoriales y opt-in sin duplicar motor Editorial Hub |
| `docs/expert-admin-v2-plan-maestro-2026-10-09.md` | **INTEGRAR tras revisión** | Especificación extensa Admin/Cliente; E0–E6 prevalece sin fase paralela |
| `docs/expert-kia-ecosystem-master-plan-2026-10-10.md` | **MAESTRO** | Única fuente de estado, prioridades y decisiones E0–E6. |
| `docs/expert-kia-v3-ideas-and-validation-backlog-2026-10-10.md` | **INTEGRAR tras revisión** | Ideas V3-23/24 en rama de ideas del Plan Maestro; ejecución solo pos-E6 |
| `docs/expert-mcp-roadmap-2026-10-05.md` | **REVISAR** | Permisos MCP y Holded sujetos a control E0 y autorizaciones |
| `docs/expert-os-roadmap.md` | **ARCHIVADO** | Roadmap de mayo con supuestos de clientes y planes mensuales superados. |
| `docs/expert-public-web-workspace-kia-repositioning-plan-2026-10-10.md` | **INTEGRAR tras revisión** | Mensajes de producto y SEO sin prometer capacidades futuras |
| `docs/expert-web-v2-navigation-knowledge-ai-credit-plans-2026-10-10.md` | **REVISAR** | Créditos y planes de IA no aprobados; validar modelo comercial |
| `docs/google-workspace-api-roadmap.md` | **REVISAR** | APIs y scopes dependen de uso real, permisos y coste |
| `docs/holded-banking-reconciliation-all-clients-backlog-2026-10-09.md` | **INTEGRAR tras revisión** | Conciliación por empresa, sin escrituras antes de gates |
| `docs/holded-company-billing-contact-plan.md` | **CONSERVAR contrato técnico** | Identidad fiscal de facturación multiempresa; no roadmap activo |
| `docs/holded-labor-v2-plan.md` | **REVISAR** | Capacidades Holded v2 laborales deben verificarse con API efectiva |
| `docs/holded-official-mcp-sandbox-test-plan-2026-10-05.md` | **CONSERVAR técnico** | Guía o prueba especializada; conservar como referencia, no como plan de desarrollo. |
| `docs/holded-ru-academy-strategy.md` | **REVISAR** | Estrategia RU/Academy extensa; comprobar precios y contenido vigente |
| `docs/holded-sync-action-plan.md` | **REVISAR** | Sincronización y cobros históricos; riesgo de duplicados |
| `docs/implementation-plan.md` | **ARCHIVADO** | Fases históricas, WABA y suscripciones de alcance anterior. |
| `docs/improvement-plan.md` | **ARCHIVADO** | Plan vivo de julio sustituido por el registro de ejecución E0–E6. |
| `docs/kia-2-strategy.md` | **INTEGRAR tras revisión** | Arquitectura y políticas de herramientas KIA; resolver doble canonicidad |
| `docs/kia-ai-evaluation-plan.md` | **CONSERVAR QA** | Fixtures/evaluación técnica, no priorización ejecutiva |
| `docs/kia-contextual-conversations-roadmap.md` | **INTEGRAR tras revisión** | Mensajería contextual Work y KIA; deduplicar comunicaciones |
| `docs/kia-e2e-test-plan-2026-09-25.md` | **CONSERVAR técnico** | Guía o prueba especializada; conservar como referencia, no como plan de desarrollo. |
| `docs/kia-implementation-progress.md` | **ARCHIVADO** | Bitácora histórica de mayo-julio, no informe vigente de despliegue. |
| `docs/kia-segmented-newsletter-plan.md` | **REVISAR** | Necesita RGPD, opt-in y validación de canales |
| `docs/kia-supabase-admin-future-plan.md` | **ARCHIVADO** | Hipótesis y fallos de junio de entorno Supabase ya reestudiados. |
| `docs/kia-web-anonymous-sessions-phase-plan-2026-10-10.md` | **CONSERVAR contrato técnico** | Seguridad de sesión anónima sin nuevas fases |
| `docs/kia-work-implementation-progress.md` | **ARCHIVADO** | Fotografía de septiembre sobre PR antiguas. |
| `docs/master-checklist.md` | **ARCHIVADO** | Checklist de mayo con estados que no reflejan gates actuales. |
| `docs/mentoring/mentorday-operating-and-publication-plan.md` | **CONSERVAR técnico** | Guía o prueba especializada; conservar como referencia, no como plan de desarrollo. |
| `docs/migration-history/production-ledger-transition-plan-2026-09-12.md` | **CONSERVAR técnico** | Guía o prueba especializada; conservar como referencia, no como plan de desarrollo. |
| `docs/monthly-plan-holded-requirements.md` | **ARCHIVADO** | Política de suscripción mensual obsoleta frente al catálogo de servicios puntuales. |
| `docs/multi-entity-stripe-reconciliation-plan-2026-09-07.md` | **INTEGRAR tras revisión** | Identidad fiscal Stripe, aislamiento y conciliación verificables |
| `docs/p0-implementation-subplan.md` | **ARCHIVADO** | Subplan P0 antiguo que no sustituye el nuevo gate E0. |
| `docs/plans/admin-v2-support-and-kia-contract-pr708-consolidated-2026-10-17.md` | **INTEGRAR tras revisión** | Requisitos de soporte Admin/KIA, sin suplantación ni doble Workspace |
| `docs/plans/circe-autogestion-centro-ayuda-20261015.md` | **REVISAR** | Validar fuentes y precios; no publicar antecedentes sin contraste |
| `docs/plans/crea-crece-facturacion-oportunidades-kia-20261015.md` | **REVISAR** | Validar legislación y vigencia; distinguir B2B de VeriFactu |
| `docs/plans/kia-admin-opportunities-queue-spec-2026-10-17.md` | **INTEGRAR tras revisión** | Vista de propuestas en Admin con gates y revisión humana |
| `docs/plans/kia-comfiapp-rgpd-content-qa-20261015.md` | **SEPARAR de planificación** | Caso privado: revisar retirada hacia CRM y minimización de PII; no copiar al Maestro |
| `docs/plans/kia-labor-editorial-seo-opportunity-matrix-2026-10-17.md` | **INTEGRAR tras revisión** | LAB-01…10, SEO, desidentificación y control jurídico |
| `docs/plans/kia-post-e6-subagents-audit-and-parity-2026-10-17.md` | **INTEGRAR tras revisión** | Subagentes existentes y propuestas solo posteriores a E6 |
| `docs/plans/kia-regulatory-to-editorial-commercial-impact-2026-10-17.md` | **INTEGRAR tras revisión** | Propagación de impacto y propuestas, sin segunda vigilancia |
| `docs/plans/rgpd-hub-lead-pdf-rollout-20261015.md` | **REVISAR** | Herramienta RGPD y leads bloqueados hasta control privacidad |
| `docs/qa/planes-page-supervision-plan-qa.md` | **CONSERVAR técnico** | Guía o prueba especializada; conservar como referencia, no como plan de desarrollo. |
| `docs/roadmap.md` | **ARCHIVADO** | Antiguo «roadmap maestro» de septiembre desplazado por E0–E6. |
| `docs/ru-technical-backlog.md` | **REVISAR** | RU/i18n con QA y fechas anteriores; evitar ejecución paralela |
| `docs/service-catalog-scale-roadmap.md` | **REVISAR** | Crecimiento de catálogo sin objetivos arbitrarios ni suscripciones retiradas |
| `docs/supabase-migration-ledger-recovery-plan-2026-09-08.md` | **CONSERVAR técnico** | Guía o prueba especializada; conservar como referencia, no como plan de desarrollo. |

### Orden de revisión de las 33 referencias no archivadas ni técnicas

**Bloque 1 — Alta prioridad de coherencia:** Admin V2 / KIA 2.0 / banco V3; verificar que sus secciones no establecen un segundo plan rector ni abren fases y capturar requisitos no repetidos. El caso privado RGPD se deriva a su expediente, sin exportar datos a este Plan.

**Bloque 2 — Revisión profesional y normativa:** CIRCE, Crea y Crece, RGPD, laboral/Holded, formación/Academy, contabilidad/Stripe/MCP y traducciones RU. Exigir normas con vigencia y fecha, permisos y titularidad de cada acto. Precios, calendarios y prestaciones no se aprueban por copiar un plan antiguo.

**Bloque 3 — Diseño y comunicación:** web pública, créditos IA, catálogo/Marketing, newsletter, SEO, bandeja de oportunidades y supervisión de agentes. Capturar solo diferencias útiles, desduplicar y reservar propuestas fuera de alcance para después de E6.

**Criterio para cerrar cada fila:** registrar `fecha + resultado + fundamento + evidencia GitHub/fuente oficial + decisión Dirección cuando corresponda + sección del Plan Maestro actualizada`. La limpieza documental **no modifica software**, ni activa automatismos, ni valida contenido público.

## Auditoría transversal de pendientes — PR, issues, documentación e instrucciones (18/10/2026)

**Naturaleza:** registro de clasificación y propuestas a revisar antes de fusionar la limpieza documental #801. **No es autorización de merge funcional, despliegue, migración, publicación, escritura a clientes ni levantamiento de E0**. Fotografía comprobada contra la API de GitHub el 18/10/2026. El estado vivo de las PR/CI puede cambiar; prevalecen los resultados del SHA consultado al ejecutar la decisión.

### A. Registro de 20 PR abiertas: orden y condiciones de revisión

**Regla:** solo #801 contiene limpieza documental sin runtime. Las 19 PR restantes son código, contenido publicable o pruebas/infraestructura. No usar «abierta», «no draft» o checks históricos como permiso de merge. Revisión y cierre por gate, una PR a la vez, sin fusionar ramas apiladas por separado.

| PR | Clase y prioridad | Rama/dependencia observada | Decisión inmediata |
| --- | --- | --- | --- |
| [#801](https://github.com/expert-servicios/expert-app/pull/801) | **G0** · READY (no implica aprobación) | `docs/consolidate-single-master-20261017` | Integrar solo documentación, tras revisión de enlaces/CI/Vercel y SHA final; no adelantar ningún gate. |
| [#798](https://github.com/expert-servicios/expert-app/pull/798) | **POS-E0** · DRAFT | `feat/public-tools-hub-es-draft-20261017` | Borrador funcional: conflicto con main y recuento descriptivo 7 vs 6; mantener separado y exigir aprobación de excepción. |
| [#794](https://github.com/expert-servicios/expert-app/pull/794) | **DEPENDIENTE #793** · DRAFT | `test/kia-gateway-smoke-isolated-20261017` · base `fix/kia-openai-schema-compat-e0-20261017` | PR apilada sobre rama #793, no sobre main; smoke sintético sin ejecución real acreditada; no fusionar independiente. |
| [#793](https://github.com/expert-servicios/expert-app/pull/793) | **E0/P1** · DRAFT | `fix/kia-openai-schema-compat-e0-20261017` | Validar respuestas OpenAI JSON Schema con pruebas, revisión de seguridad y dos previews antes de incorporar. |
| [#784](https://github.com/expert-servicios/expert-app/pull/784) | **E0/P1** · DRAFT | `fix/kia-mail-notices-spam-20261016` | Revisión de avisos fiscales/email y permisos Outlook; sin autoenvíos ni tratar el caso privado en público. |
| [#782](https://github.com/expert-servicios/expert-app/pull/782) | **RGPD/BLOQUEADO** · DRAFT | `fix/rgpd-report-leads-idempotency-20261015` | Mantener flags apagadas; idempotencia, retención, consentimiento y E2E antes de informes/leads. |
| [#779](https://github.com/expert-servicios/expert-app/pull/779) | **COMERCIAL/BLOQUEADO** · READY (no implica aprobación) | `feat/rgpd-formacion-aepd-comfiqa-20261015` | PR no draft con conflicto; revisar precio formación, vigencia legal, RGPD y ES/RU antes de publicar. |
| [#777](https://github.com/expert-servicios/expert-app/pull/777) | **E0/BLOQUEADO** · DRAFT | `feat/kia-qa-invoice-knowledge-20261014` | Notas de reuniones y datos sensibles; comparte dos migraciones con #764: reconciliar SQL y RLS antes de merge. |
| [#772](https://github.com/expert-servicios/expert-app/pull/772) | **EDITORIAL/BLOQUEADO** · DRAFT | `feat/sl-autonomo-fiscal-iae-seo-es-ru-20261014` | Validar fuentes 2026, precios, CTA y paridad ES/RU; solapa lib/utils y i18n con #771. |
| [#771](https://github.com/expert-servicios/expert-app/pull/771) | **EDITORIAL/BLOQUEADO** · DRAFT | `feat/rgpd-servicios-contenidos-es-ru-20261014` | Contenidos de servicios RGPD ES/RU; solapamiento con #772 y revisión de política/consentimiento. |
| [#769](https://github.com/expert-servicios/expert-app/pull/769) | **RGPD/BLOQUEADO** · DRAFT | `feat/rgpd-privacy-policy-draft-20261014` | Borrador jurídico descargable; debe ser revisado por profesional y no fingir política aprobada. |
| [#767](https://github.com/expert-servicios/expert-app/pull/767) | **E0/REVISAR** · DRAFT | `feat/kia-certificado-perdido-fnmt-camerfirma-accv-20261014` | Recuperación certificados y clasificación de contactos; separar lead/cliente y revisar privacidad, sin publicar sin QA. |
| [#765](https://github.com/expert-servicios/expert-app/pull/765) | **LEGAL/REVISAR** · DRAFT | `fix/i18n-regulatory-editorial-gate-20261013` | Cambios de extranjería ES/RU con efectos temporales; confirmar fuentes BOE y QA jurídico antes de fusionar. |
| [#764](https://github.com/expert-servicios/expert-app/pull/764) | **E0/P0-LEGAL** · READY (no implica aprobación) | `fix/regulatory-impact-explicit-boolean-20261013` | Falsos impactos jurídicos; reconciliar cambios correctivos y 2 migraciones compartidas con #777; preflight obligatorio. |
| [#745](https://github.com/expert-servicios/expert-app/pull/745) | **AGENTES/BLOQUEADO** · DRAFT | `ci/kia-multimodel-gateway-smoke-20261012` | Workflow Gateway manual; secret/budget y modelo actual sin operación ni merge automático. |
| [#743](https://github.com/expert-servicios/expert-app/pull/743) | **AGENTES/BLOQUEADO** · DRAFT | `feat/kia-pr-review-telegram-optin-20261012` | Notificación Telegram de PR desactivada; revisar secretos, privacidad y permisos. No autorizar mensajes aún. |
| [#742](https://github.com/expert-servicios/expert-app/pull/742) | **AGENTES/BLOQUEADO** · DRAFT | `feat/kia-dev-agent-sandbox-foundation-20261012` | Infraestructura de agente de desarrollo bajo flag OFF; declarar excepción no sustituye autorización del Plan Maestro. |
| [#713](https://github.com/expert-servicios/expert-app/pull/713) | **HOLDED/BLOQUEADO** · DRAFT | `feat/holded-migration-destination-pilot-20261010` | Token destino y piloto empresarial; revisar cifrado/tenant, origen intacto, rollback y mandato antes de activar. |
| [#705](https://github.com/expert-servicios/expert-app/pull/705) | **E0/SEGURIDAD** · READY (no implica aprobación) | `feat/kia-web-persist-turns-20261010` | Persistencia web y migración; revisar sesión/retención/RLS/recuperación, preflight y flag OFF. |
| [#683](https://github.com/expert-servicios/expert-app/pull/683) | **E0/P1 UX** · READY (no implica aprobación) | `fix/public-booking-links-native-20261009` | Arreglo acotado de enlaces de reservas: comparar con UI actual, comprobar pruebas y previews; posible cierre si quedó integrado. |

**Dependencias y conflictos que hay que resolver antes de fusionar otras PR:**
1. **#794 → #793:** #794 usa como base la rama de #793 y su workflow `workflow_dispatch` no sustituye CI en `main`. Primero revisión/validación de #793; después reorientar/verificar #794 con el SHA correcto, si procede. No afirmar smoke realizado.
2. **#764 ↔ #777:** ambas incorporan `supabase/migrations/20261014065341_regulatory_positive_impact_qa_cleanup.sql` y `20261014065405_regulatory_devops_outbox.sql`. **No** fusionarlas de modo independiente sin comparar hashes y preflight de ledger; evitar migraciones divergentes/duplicadas. La #777 añade otra migración con información de reuniones y revisión humana.
3. **#771 ↔ #772:** comparten `lib/i18n/ru-nationality-resources.ts`; #772 también usa `lib/utils/blog.ts`, `lib/utils/catalog.ts`, `lib/utils/docs.ts`, rutas y sitemap en dominios con otras PR. Consolidar recursos, revisar paridad RU y noindex antes de publicar.
4. **#784 ↔ #767:** coinciden en `app/api/cron/kia-email-agent/route.ts` y pruebas de email; unificar clasificación, consentimiento, prioridades y permisos Outlook/Gmail.
5. **#782 ↔ #705 ↔ #742:** comparten `.github/workflows/ci.yml` (en combinaciones); conciliar seguridad CI y migraciones de cada PR con `main` actual, sin abrir flags de captura/IA.
6. **#798 ↔ maestro #801:** #798 cambia el mismo Plan Maestro y `app/sitemap.ts`; base antigua y conflicto. La descripción «7 utilidades» no cuadra con los 6 enlaces públicos verificables. Requiere rebase/revisión y autorización de excepción explícita a E0, no merge automático.
7. **#779 ↔ #771/#769/#782:** misma familia RGPD pero destinos jurídicos diferentes (oferta, textos, herramienta, informe/leads). Distinguir formación, asesoramiento, privacidad, información gratuita y consentimiento; #779 está en conflicto de Git y su estado no-draft no autoriza publicar.
8. **#713 y #705:** cualquier integración/retención o token requiere tenant/actor exactos, preflight, garantías de privacidad y despliegue separado, no aprobación documental.
9. **#764 (normativa), #765 (fuentes extranjería), #793 (esquemas), #683 (booking):** candidatos de calidad/corrección a revisar por riesgo efectivo y pruebas. La prioridad no implica que estén validados en `main`.
10. **#742/#743/#745:** infraestructura de agente y comunicación, por defecto sin activación. Cualquier excepción requiere decision de Dirección, presupuesto/seguridad y checkpoint E0 documentado.

### B. 28 issues abiertos: relación con el Plan Maestro, sin cerrar aún

No convertir issues en «planes de ejecución». La hoja de seguimiento ejecutiva es esta; los issues son evidencias y tareas **solo cuando una fase y un responsable los autoricen**. Cerrar duplicados (#775/#776 u otros) únicamente tras confrontar requisitos y dejar referencias cruzadas.

| Issue | Área | Revisión/decisión que corresponde |
| --- | --- | --- |
| [#797](https://github.com/expert-servicios/expert-app/issues/797) | KIA LEARN | Oportunidad editorial desde auditoría desidentificada; consolidar H4, no publicar. |
| [#796](https://github.com/expert-servicios/expert-app/issues/796) | SEO | Hub ES/RU y sitemap; PR #798 funcional bloqueada, revisar primero inventario real. |
| [#795](https://github.com/expert-servicios/expert-app/issues/795) | LABORAL/RGPD | Diagnóstico mínimo sin PII fase A; fase documental no hasta RGPD. |
| [#791](https://github.com/expert-servicios/expert-app/issues/791) | AGENTES | Gobierno del agente KIA pre-E0; integrar requisitos seguros, no ejecutar hasta autorización. |
| [#789](https://github.com/expert-servicios/expert-app/issues/789) | POS-E6 | Paridad subagentes; mantener ideas y auditoría en V3 sin adelantar fase. |
| [#786](https://github.com/expert-servicios/expert-app/issues/786) | DOCUMENTOS | Búsqueda/informe solo con permisos por tenant/caso, confirmación y trazabilidad. |
| [#785](https://github.com/expert-servicios/expert-app/issues/785) | LABORAL | Fuentes versionadas, convenio local y evidencia; evitar inferir de nóminas de 30 días. |
| [#780](https://github.com/expert-servicios/expert-app/issues/780) | RGPD | Informe PDF y captación; bloqueado por consentimientos, retención, datos y #782. |
| [#778](https://github.com/expert-servicios/expert-app/issues/778) | RGPD | Prediagnóstico guiado; reconciliar alcance con #780 y herramienta gratuita. |
| [#776](https://github.com/expert-servicios/expert-app/issues/776) | REUNIONES | Procesamiento de notas, revisión humana y tareas: comparar con #775 y #777. |
| [#775](https://github.com/expert-servicios/expert-app/issues/775) | REUNIONES | Posible duplicación de #776, comparar criterios y consolidar issue madre antes de cerrar. |
| [#774](https://github.com/expert-servicios/expert-app/issues/774) | REUNIONES/QA | Lecciones facturas y KIA: no divulgar casos ni llevar a asesoramiento automático. |
| [#773](https://github.com/expert-servicios/expert-app/issues/773) | I18N | ES→RU supervisada, no activación; QA semántica y SEO por idioma. |
| [#770](https://github.com/expert-servicios/expert-app/issues/770) | RGPD/I18N | Paridad RGPD ES/RU y herramienta, enlazar con #771/#779/#782. |
| [#768](https://github.com/expert-servicios/expert-app/issues/768) | KIA LEARN | Oportunidades de casos reales: anonimizadas y en motor editorial existente. |
| [#654](https://github.com/expert-servicios/expert-app/issues/654) | OPERACIONES | Inbox omnicanal con Operations 360; evitar CRM/bandeja duplicada. |
| [#475](https://github.com/expert-servicios/expert-app/issues/475) | KIA WORK | Autopilot con actor/mandato, E0 y pruebas negativas; solapa #654/#353. |
| [#388](https://github.com/expert-servicios/expert-app/issues/388) | SEGURIDAD | Hardening Supabase E0, preflight, RLS y security advisor; revisar gravedad vigente. |
| [#360](https://github.com/expert-servicios/expert-app/issues/360) | I18N | Paridad de servicios, rutas RU y noindex; aprobación humana. |
| [#353](https://github.com/expert-servicios/expert-app/issues/353) | ADMIN 360 | Épica de arquitectura Admin; requisitos útiles al maestro, no otra fase. |
| [#352](https://github.com/expert-servicios/expert-app/issues/352) | EDITORIAL | Redes/Meta/HeyGen/LinkedIn; permisos, RGPD y publicación separada. |
| [#279](https://github.com/expert-servicios/expert-app/issues/279) | HOLDED | Smoke company-scoped de Labor, con datos autorizados y límites de API. |
| [#180](https://github.com/expert-servicios/expert-app/issues/180) | KIA SOPORTE | Suscripciones y onboarding históricos; reevaluar catálogo sin suscripciones periódicas. |
| [#161](https://github.com/expert-servicios/expert-app/issues/161) | HOLDED | Factura histórica: impedir duplicado y cruce tenant antes de importación. |
| [#135](https://github.com/expert-servicios/expert-app/issues/135) | STRIPE | Identidad de cobro por entidad, contratos y trazabilidad; coherencia de facturación. |
| [#134](https://github.com/expert-servicios/expert-app/issues/134) | TELEGRAM | Bidireccional Operations 360, fases y privilegios; deduplicar #654. |
| [#133](https://github.com/expert-servicios/expert-app/issues/133) | CATÁLOGO | Modalidades de servicio puntual/guiado; precios solo tras Dirección. |
| [#64](https://github.com/expert-servicios/expert-app/issues/64) | STRIPE | Checkouts concurrentes por entidad; idempotencia, seguridad, no doble cobro. |

### C. Cobertura de los 213 documentos del árbol `docs/` (fotografía anterior al archivo de #801)

- **54 ficheros de planificación**: clasificación individual en la tabla del apartado «Registro documental revisado» precedente (13 archivados, 1 rector, 7 referencias técnicas conservadas y 33 en revisión). «Archivado» significa copia histórica + compatibilidad en el PR; no equivale a borrado irreversible.
- **159 documentos adicionales**: inventariados en la tabla siguiente; esta ronda verifica **ubicación y carácter inicial**, pero NO certifica haber contrastado cada afirmación, norma jurídica, estado de implementación o enlace externo de su contenido. Por tanto no se eliminan en bloque. La PR #801 añade 13 copias de archivo, elevando los ficheros bajo `docs/` de 213 a 226 al fusionarse, precisamente para preservar evidencia.
- Manuales, protocolos, runbooks, ADR, QA, corpus legal, código de contenido y registros SQL permanecen subordinados al Plan Maestro. La revisión de contenido se hará cuando el módulo entre en gate, con dueño, fecha y prueba, no por borrar ficheros para reducir el recuento.

| Documento adicional inventariado | Tratamiento previo a su eventual integración |
| --- | --- |
| `docs/admin-email-folders-next.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/admin-email-folders-progress.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/admin-email-folders-security.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/admin-email-folders.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/admin-production-gaps-2026-09-06.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/adr/0001-i18n-routing-and-brand-governance.md` | EVIDENCIA · Preservar fuente y fecha; no confundir hallazgo con entrega |
| `docs/architecture.md` | REFERENCIA · Conservar hasta revisión semántica; no constituye un plan activo |
| `docs/audits/kia-autonomous-development-readiness-2026-10-17.md` | EVIDENCIA · Preservar fuente y fecha; no confundir hallazgo con entrega |
| `docs/batch1-operational-automation.md` | REFERENCIA · Conservar hasta revisión semántica; no constituye un plan activo |
| `docs/blog-drafts/renovar-residencia-inversor-inmuebles-sl-2026.md` | SENSIBLE/LEGAL · Revisar privacidad y vigencia; no borrar ni convertir en entrenamiento público |
| `docs/bridge-endpoints-holded-claude.md` | REFERENCIA · Conservar hasta revisión semántica; no constituye un plan activo |
| `docs/case-status-workflow.md` | REFERENCIA · Conservar hasta revisión semántica; no constituye un plan activo |
| `docs/catalog-launch-batch-1.md` | REFERENCIA · Conservar hasta revisión semántica; no constituye un plan activo |
| `docs/changelog.md` | REFERENCIA · Conservar hasta revisión semántica; no constituye un plan activo |
| `docs/client-company-status-dashboard.md` | REFERENCIA · Conservar hasta revisión semántica; no constituye un plan activo |
| `docs/client-subscription-onboarding-flow.md` | REFERENCIA · Conservar hasta revisión semántica; no constituye un plan activo |
| `docs/clients/dgm-accounting-rebuild-2025-2026.md` | SENSIBLE/LEGAL · Revisar privacidad y vigencia; no borrar ni convertir en entrenamiento público |
| `docs/clients/kia-accounting-pilot-cohort-2026-10-10.md` | SENSIBLE/LEGAL · Revisar privacidad y vigencia; no borrar ni convertir en entrenamiento público |
| `docs/closure-runbook-2026-10-06.md` | REFERENCIA · Conservar hasta revisión semántica; no constituye un plan activo |
| `docs/company-open-data-ckan-audit.md` | REFERENCIA · Conservar hasta revisión semántica; no constituye un plan activo |
| `docs/compliance/rgpd-expert-checklist-humano.md` | CONTROL · Conservar auditoría, seguridad y ledger; ejecución solo por gate |
| `docs/courses/gestion-laboral/CAPTURE_MANIFEST.md` | CONTENIDO/QA · Mantener como referencia; revisar cuando afecte el módulo |
| `docs/courses/gestion-laboral/CAPTURE_VALIDATION_RUNBOOK.md` | CONTENIDO/QA · Mantener como referencia; revisar cuando afecte el módulo |
| `docs/courses/gestion-laboral/CONTENT_AND_KNOWLEDGE_BASE.md` | CONTENIDO/QA · Mantener como referencia; revisar cuando afecte el módulo |
| `docs/courses/gestion-laboral/IMPLEMENTATION_CHECKLIST.md` | CONTENIDO/QA · Mantener como referencia; revisar cuando afecte el módulo |
| `docs/courses/gestion-laboral/MASTER_IMPLEMENTATION_PROMPT.md` | CONTENIDO/QA · Mantener como referencia; revisar cuando afecte el módulo |
| `docs/courses/gestion-laboral/PRODUCT_SPEC.md` | CONTENIDO/QA · Mantener como referencia; revisar cuando afecte el módulo |
| `docs/courses/gestion-laboral/PROGRAMACION_V2_HERRAMIENTAS.md` | CONTENIDO/QA · Mantener como referencia; revisar cuando afecte el módulo |
| `docs/courses/gestion-laboral/README.md` | CONTENIDO/QA · Mantener como referencia; revisar cuando afecte el módulo |
| `docs/courses/gestion-laboral/SEO_ANALYTICS_QA.md` | CONTENIDO/QA · Mantener como referencia; revisar cuando afecte el módulo |
| `docs/courses/gestion-laboral/SOURCE_REGISTRY.md` | CONTENIDO/QA · Mantener como referencia; revisar cuando afecte el módulo |
| `docs/courses/gestion-laboral/STRIPE_AND_CONVERSION.md` | CONTENIDO/QA · Mantener como referencia; revisar cuando afecte el módulo |
| `docs/courses/gestion-laboral/TECHNICAL_ARCHITECTURE.md` | CONTENIDO/QA · Mantener como referencia; revisar cuando afecte el módulo |
| `docs/deploy-holded-mcp-vercel.md` | REFERENCIA · Conservar hasta revisión semántica; no constituye un plan activo |
| `docs/document-archive-runbook.md` | REFERENCIA · Conservar hasta revisión semántica; no constituye un plan activo |
| `docs/document-classification-flow.md` | REFERENCIA · Conservar hasta revisión semántica; no constituye un plan activo |
| `docs/editorial/api-first-publishing-architecture.md` | CONTENIDO/QA · Mantener como referencia; revisar cuando afecte el módulo |
| `docs/editorial/blog-docs-holded-links-cta-consultation-audit-2026-10-13.md` | CONTENIDO/QA · Mantener como referencia; revisar cuando afecte el módulo |
| `docs/editorial/channel-account-linking-guide.md` | CONTENIDO/QA · Mantener como referencia; revisar cuando afecte el módulo |
| `docs/es-ru-service-parity-matrix.md` | REFERENCIA · Conservar hasta revisión semántica; no constituye un plan activo |
| `docs/es-service-alignment-audit.md` | REFERENCIA · Conservar hasta revisión semántica; no constituye un plan activo |
| `docs/executive-dashboard.md` | REFERENCIA · Conservar hasta revisión semántica; no constituye un plan activo |
| `docs/expert-kia-ecosystem-e0-audit-inventory-2026-10-10.md` | REFERENCIA · Conservar hasta revisión semántica; no constituye un plan activo |
| `docs/expert-os-data-model.md` | REFERENCIA · Conservar hasta revisión semántica; no constituye un plan activo |
| `docs/extranjeria/nacionalidad-apellidos-documentacion.md` | SENSIBLE/LEGAL · Revisar privacidad y vigencia; no borrar ni convertir en entrenamiento público |
| `docs/extranjeria/renovacion-inversor-inmuebles-persona-juridica.md` | SENSIBLE/LEGAL · Revisar privacidad y vigencia; no borrar ni convertir en entrenamiento público |
| `docs/extranjeria/renovacion-inversor-service-implementation.md` | SENSIBLE/LEGAL · Revisar privacidad y vigencia; no borrar ni convertir en entrenamiento público |
| `docs/extranjeria/renovacion-residencia-inversor-ley-14-2013.md` | SENSIBLE/LEGAL · Revisar privacidad y vigencia; no borrar ni convertir en entrenamiento público |
| `docs/extranjeria/representacion-y-presentacion-2026.md` | SENSIBLE/LEGAL · Revisar privacidad y vigencia; no borrar ni convertir en entrenamiento público |
| `docs/google-workspace-booking-meet-migration.md` | REFERENCIA · Conservar hasta revisión semántica; no constituye un plan activo |
| `docs/holded-accounting-integration-audit.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/holded-brand-governance.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/holded-claude-mcp-integration.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/holded-credential-authority.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/holded-labor-live-readiness.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/holded-v2-kia-accounting-permission-matrix.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/i18n/es-ru-parity-and-change-protocol-2026-10-13.md` | CONTENIDO/QA · Mantener como referencia; revisar cuando afecte el módulo |
| `docs/i18n/next-immigration-translation-legal-audit-2026-10-13.md` | CONTENIDO/QA · Mantener como referencia; revisar cuando afecte el módulo |
| `docs/i18n/ru-es-legal-terminology-policy-2026-10-13.md` | CONTENIDO/QA · Mantener como referencia; revisar cuando afecte el módulo |
| `docs/kia-accounting-agent.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/kia-ai-architecture-audit.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/kia-ai-architecture-qa.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/kia-ai-architecture.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/kia-ai-output-schemas.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/kia-ai-providers-artifacts-subagents-audit-2026-10-10.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/kia-ai-qa.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/kia-ai-tool-use.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/kia-auditor-audit.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/kia-auditor-rules.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/kia-auditor.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/kia-avatar-response-sprint2-approval.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/kia-avatar-response-sprint2.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/kia-avatar-response-sprint3.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/kia-avatar-response-sprint4.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/kia-avatar-response-sprint5-trusted-signals.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/kia-avatar-response-sprint5.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/kia-avatar-response-system.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/kia-checkout-call-flow-qa.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/kia-civil-registry-nationality-corpus.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/kia-client-ledger.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/kia-commercial-editorial-opportunity-engine-2026-10-13.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/kia-commercial-flow-audit.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/kia-conversation-behavior-audit.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/kia-copilot-holded-dashboard-audit.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/kia-decision-logs.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/kia-email-calendar-meetings-runbook.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/kia-email-operations.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/kia-f1-f8-intelligence.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/kia-google-esignature.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/kia-google-search.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/kia-health-anomaly-rules.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/kia-health-canary-tests.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/kia-health-check.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/kia-health-metrics.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/kia-health-qa.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/kia-immigration-nationality-corpus.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/kia-internal-operator.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/kia-labor-reconstruction-runbook.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/kia-lead-client-thread-flow.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/kia-lead-client-thread-qa.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/kia-operator-learning-loop.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/kia-pilot-rollout.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/kia-provider-router.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/kia-public-best-practices.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/kia-public-widget.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/kia-regulatory-coverage-audit-v13.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/kia-regulatory-registry.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/kia-regulatory-v14-fiscal-mercantil.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/kia-regulatory-v15-property-dgt.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/kia-shadow-sampling.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/kia-sprint5f-post-purchase.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/kia-sprint5g-fiscal-calendar.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/kia-sprint5h-help-center.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/kia-sprint5i-visual-auditor.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/kia-unified-core-attachments-document-studio-2026-10-10.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/kia-voice.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/kia-web-persistence-migration-checklist-2026-10-10.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/kia-web-persistence-proposed-schema-2026-10-10.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/kia-work-case-orchestration.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/kia-work-connector-runbook.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/kia-workspace-execution-2026-10-09.md` | TÉCNICO/OPERATIVO · Revisar vigencia por módulo; sin autoridad sobre E0 |
| `docs/mcp-event-contract.md` | REFERENCIA · Conservar hasta revisión semántica; no constituye un plan activo |
| `docs/meta-marketing-hub-c2.md` | REFERENCIA · Conservar hasta revisión semántica; no constituye un plan activo |
| `docs/migration-history/final-fresh-validation-2026-09-12.md` | CONTROL · Conservar auditoría, seguridad y ledger; ejecución solo por gate |
| `docs/migration-history/fresh-baseline-validation-2026-09-11.md` | CONTROL · Conservar auditoría, seguridad y ledger; ejecución solo por gate |
| `docs/migration-history/production-ledger-checkpoint-2026-09-17.md` | CONTROL · Conservar auditoría, seguridad y ledger; ejecución solo por gate |
| `docs/migration-history/production-ledger-checkpoint-2026-09-18.md` | CONTROL · Conservar auditoría, seguridad y ledger; ejecución solo por gate |
| `docs/migration-history/production-ledger-cli-contract-validation-2026-09-12.md` | CONTROL · Conservar auditoría, seguridad y ledger; ejecución solo por gate |
| `docs/migration-history/production-ledger-cli-runbook-2026-09-12.md` | CONTROL · Conservar auditoría, seguridad y ledger; ejecución solo por gate |
| `docs/migration-history/production-ledger-cli-runbook-v2-2026-09-12.md` | CONTROL · Conservar auditoría, seguridad y ledger; ejecución solo por gate |
| `docs/migration-history/production-ledger-repair-manifest-2026-09-18.md` | CONTROL · Conservar auditoría, seguridad y ledger; ejecución solo por gate |
| `docs/migration-history/production-ledger-transition-amendment-2026-09-12.md` | CONTROL · Conservar auditoría, seguridad y ledger; ejecución solo por gate |
| `docs/migration-history/recovery-phase1-2026-09-10.md` | CONTROL · Conservar auditoría, seguridad y ledger; ejecución solo por gate |
| `docs/migration-history/recovery-phase1-checkpoint-2026-09-11.md` | CONTROL · Conservar auditoría, seguridad y ledger; ejecución solo por gate |
| `docs/nacionalidad/nacionalidad-menor-presentacion-y-firmas.md` | SENSIBLE/LEGAL · Revisar privacidad y vigencia; no borrar ni convertir en entrenamiento público |
| `docs/next-best-actions.md` | REFERENCIA · Conservar hasta revisión semántica; no constituye un plan activo |
| `docs/onboarding-operations-2026-09-06.md` | REFERENCIA · Conservar hasta revisión semántica; no constituye un plan activo |
| `docs/product-decisions-2026-09-07.md` | REFERENCIA · Conservar hasta revisión semántica; no constituye un plan activo |
| `docs/production-gap-audit-2026-09-05.md` | REFERENCIA · Conservar hasta revisión semántica; no constituye un plan activo |
| `docs/products/holded-migracion-laboral.md` | CONTENIDO/QA · Mantener como referencia; revisar cuando afecte el módulo |
| `docs/qa/holded-migracion-con-inventario-qa.md` | CONTENIDO/QA · Mantener como referencia; revisar cuando afecte el módulo |
| `docs/qa/holded-migracion-sin-inventario-qa.md` | CONTENIDO/QA · Mantener como referencia; revisar cuando afecte el módulo |
| `docs/qa/holded-pack-starter-qa.md` | CONTENIDO/QA · Mantener como referencia; revisar cuando afecte el módulo |
| `docs/regulatory-global-audit-preflight-2026-09-20.md` | REFERENCIA · Conservar hasta revisión semántica; no constituye un plan activo |
| `docs/regulatory-immigration-pulse-integration-2026-10-13.md` | REFERENCIA · Conservar hasta revisión semántica; no constituye un plan activo |
| `docs/rgpd-consent-architecture.md` | REFERENCIA · Conservar hasta revisión semántica; no constituye un plan activo |
| `docs/ru-006-validation-notes.md` | REFERENCIA · Conservar hasta revisión semántica; no constituye un plan activo |
| `docs/ru-008-content-sources.md` | REFERENCIA · Conservar hasta revisión semántica; no constituye un plan activo |
| `docs/ru-release-checklist.md` | REFERENCIA · Conservar hasta revisión semántica; no constituye un plan activo |
| `docs/scheduler-ownership.md` | REFERENCIA · Conservar hasta revisión semántica; no constituye un plan activo |
| `docs/security/expert-end-to-end-security-audit-2026-06-02.md` | CONTROL · Conservar auditoría, seguridad y ledger; ejecución solo por gate |
| `docs/service-flow-audit-2026-09-23.md` | REFERENCIA · Conservar hasta revisión semántica; no constituye un plan activo |
| `docs/service-page-template-guidelines.md` | REFERENCIA · Conservar hasta revisión semántica; no constituye un plan activo |
| `docs/service-production-pipeline-v1.md` | REFERENCIA · Conservar hasta revisión semántica; no constituye un plan activo |
| `docs/service-profitability.md` | REFERENCIA · Conservar hasta revisión semántica; no constituye un plan activo |
| `docs/supabase-no-docker-workflow.md` | REFERENCIA · Conservar hasta revisión semántica; no constituye un plan activo |
| `docs/suplidos-checkout-expert.md` | REFERENCIA · Conservar hasta revisión semántica; no constituye un plan activo |
| `docs/telegram-operations360-e2e-runbook.md` | REFERENCIA · Conservar hasta revisión semántica; no constituye un plan activo |
| `docs/workspace-v2-kia-copilot-parallel-integration-2026-10-10.md` | REFERENCIA · Conservar hasta revisión semántica; no constituye un plan activo |

### D. Instrucciones y archivos de automatización revisados

| Ruta | Alcance comprobado | Decisión de gobierno |
| --- | --- | --- |
| `README.md` | Mapa del repositorio, stack y flujo operativo descriptivo; en #801 se corrige el enlace al Maestro y las referencias a planes de archivo. | Es guía técnica, **no** tablero de ejecución ni evidencia de que WhatsApp, suscripciones o todas las integraciones estén activas. Verificar contra código/catálogo real; no seguir antiguos planes. |
| `.github/workflows/ci.yml` | Calidad: typecheck, lint, build, MCP, baseline migraciones, tests, KIA evals; dispara en PR con base `main` y push `main`. | Exigir CI completo del último `head_sha`; las PR apiladas en otra base pueden no disparar el mismo flujo. Prohibido forzar merge con check pendiente o fallido. |
| `.github/workflows/holded-sync.yml` | Cron cada 15 min y disparo manual del endpoint de sincronización. | Es automatización **ya definida en código**; esta auditoría no demuestra ejecuciones exitosas ni autoriza cambiarla. Cualquier efecto en clientes exige permisos y readback. |
| `.github/workflows/supabase-ledger-preflight.yml` | Preflight solo lectura para cambios SQL y casos relevantes. | No equivale a permiso para migrar; exigir evidencia por SHA y ledger exacto, RLS/grants y rollback. |
| `.github/workflows/supabase-production-migrations.yml` | En `push main` que toque migraciones o despacho manual, despliega SQL con entorno protegido. | **Alto impacto:** ninguna PR que incluya `supabase/migrations/**` se fusiona por limpieza; las PR #764/#777/#705 necesitan validación y autorización de despliegue real. |
| `docs/courses/gestion-laboral/MASTER_IMPLEMENTATION_PROMPT.md` | Prompt imperativo para implementar un programa Academy; menciona alias antiguo del repositorio. | **Instrucción histórica: NO EJECUTAR**. Requiere reconciliación con producto, honorarios, contenido jurídico, licencias y gate de fase. |
| `docs/kia-regulatory-registry.md` | Descripción de regulación, indicadores, dependencias y revisión. | Es contrato/registro de evidencias; no un plan rector ni evidencia de que todo cron esté funcionando. |
| `docs/kia-commercial-editorial-opportunity-engine-2026-10-13.md` | Motor de oportunidades editoriales/comerciales. | Mantener solo como especificación, sin motor paralelo, autopublicación ni decisiones legales por IA. |
| `config/`, `supabase/migrations/`, `tests/`, `app/`, `lib/` | Código, datos de configuración, migraciones y pruebas. | **Fuera de la limpieza de Markdown**; no se modifican ejecutables, credenciales ni registros productivos por esta PR. |

En el árbol examinado **no se encontró** `AGENTS.md`, `CLAUDE.md` ni `.github/copilot-instructions.md` como instrucciones activas. Ello no prueba la ausencia de reglas externas en GitHub, organizaciones o servicios conectados.

### E. Orden de revisión documental sin implementar capacidades

1. **Gate 0:** finalizar #801 como única limpieza documental, corregir comentarios P2, validar contenido, permisos, CI y Vercel sobre el SHA final; solo después fusionar con autorización.
2. **Gate 1:** resolver autoridad y duplicidad de Admin V2, KIA 2.0 y banco V3; conservar requisitos singulares, no importarlos todos como aprobados. Registrar decisión por documento y sección en el Maestro.
3. **Gate 2:** agrupación de issues duplicados (#775/#776; #654/#134; y derivaciones #780/#778/#770) y dependencias de PR sin cerrar evidencias útiles.
4. **Gate 3:** correcciones E0 de riesgo real, una por una: impacto normativo #764, compatibilidad AI #793 y smoke apilado #794, privacidad de chat #705, email #784 y UX citas #683, siempre con scope exacto.
5. **Gate 4:** RGPD, contenidos ES/RU, captación, Academy y herramientas sin publicaciones prematuras; revisión legal, privacidad, pricing y SEO por separado.
6. **Gate 5:** propuestas pos-E6 (subagentes/agent dev, nuevas simulaciones, nuevos canales) como ideas bloqueadas; no activar workflows ni adelantar cron.

**Formato de resolución:** para cada PR/issue/documento conservar `ID + estado observado + duplicado/contradicción + motivo + propuesta de incorporar/archivar/descartar + fase del Plan Maestro + fuentes/evidencia + decisión humana cuando corresponda + validación de CI si hay código`. Este registro se actualiza **en este único Plan Maestro**; GitHub issues/PR son tickets de ejecución o evidencias, nunca un roadmap competidor.



## ANEXO E0-WEB-P — Línea paralela de contenidos, copy y arquitectura pública de autogestión (19/10/2026)

**Decisión funcional de Dirección 19/10/2026.** EXPERT se posiciona como **«Tu plataforma de autogestión inteligente»**. Mensaje principal: **«Hazlo tú mismo, aprende con nosotros o contrata ayuda profesional. Tú decides.»** Propósito: reducir dependencia de gestiones externas innecesarias, reforzar control y conocimiento del propio negocio y ofrecer transparencia de costes. No afirmar «primera plataforma de España» sin prueba objetiva de exclusividad. La oferta profesional permanece disponible por elección, nunca como requisito de acceso a recursos gratuitos.

**Gobierno:** este anexo forma parte del Plan Maestro único, NO es un nuevo plan rector. La rama técnica separada de documentación es \`docs/web-publica-autogestion-paralela-20261019\`. La nueva línea **WEB-P (web pública y contenido)** se prepara y ejecuta independientemente de las pantallas, RLS, roles y migraciones del **dashboard E0–E6**, sin modificar su checkpoint ni cerrar anticipadamente hitos. Actualización de alcance **propuesta por Dirección**: se autoriza planificación y diseño editorial WEB-P en paralelo; las modificaciones a código público requieren PR propios, QA jurídico/idiomas/SEO/CI y comprobación de independencia. Los módulos compartidos (KIA, autenticación, checkout, analítica, Supabase, permisos y datos privados) siguen sujetos a los gates E0–E6 y no se tocan por esta excepción. Esta regla especial deberá integrarse en la próxima revisión de la congelación de alcance del §0; hasta entonces **no implica un desbloqueo técnico general**.

### A. Inventario técnico y reutilización constatada (main, 19/10/2026)

- Menús ES/RU: \`components/site/header.tsx\`, \`lib/i18n/public-shell-copy.ts\`; locales de servicios mediante \`lib/services/service-localized-content.ts\`.
- Catálogo de servicios: \`lib/utils/catalog.ts\` (7 categorías visibles: Fiscalidad, Extranjería y Nacionalidad, Empresas y Autónomos, Holded, Certificado digital, Tráfico y Capitanía Marítima, Notaría y Propiedades; Formación actualmente auxiliar/oculta).
- Agrupación transversal ya implementada: \`lib/utils/taxonomy.ts\` (6 temas: fiscalidad, extranjería-nacionalidad, empresas, Holded, trámites, formación).
- Contenidos: \`lib/utils/blog.ts\`, \`lib/utils/docs.ts\`; interfaces \`/blog\`, \`/docs\`, \`/categoria/[tema]\`, fichas \`/servicios/[categoria]/[servicio]\`; FAQ y enlazado de contenidos parcialmente existentes.
- Planes EXPERT Supervisión/Avanzado/Colaborativo permanecen **contratables**: no confundir proyección del feed de Meta con disponibilidad en la web.
- PR #803 es el **lote CIRCE y autogestión**, con instrucciones KIA/FAQ y dos artículos en revisión; no duplicar trabajo ni prometer publicación mientras esté en borrador.
- Documentos históricos \`docs/expert-public-web-workspace-kia-repositioning-plan-2026-10-10.md\` y \`docs/expert-web-v2-navigation-knowledge-ai-credit-plans-2026-10-10.md\` quedan como referencias de inventario subordinadas a este anexo. Sus aseveraciones de retirada de suscripciones están SUPERADAS por la aclaración expresa del 19/10/2026.

### B. Arquitectura editorial definitiva de navegación (no migrar URLs)

**Navegación principal objetivo ES:** Inicio · Trámites · Conocimientos · Herramientas · Formación · Servicios · Planes · KIA · Acceder. Las vistas móvil/desktop pueden agrupar opciones para usabilidad, pero las mismas áreas han de ser accesibles. **Menú RU:** Главная · Процедуры · База знаний · Инструменты · Обучение · Услуги · Тарифы · KIA · Войти. English reservado como tercer locale futuro, NO publicar páginas EN sin traducción validada.

**Categoría canónica = tema legal/funcional**, no formato (blog, guía, servicio). Taxonomía conceptual aprobada, a mapear sin alterar slugs existentes:
1. **Empresas y autónomos:** formas jurídicas, creación de SL/CIRCE, altas y bajas, socios, administración, responsabilidad, gestión propia, planes empresariales.
2. **Fiscalidad y contabilidad:** IRPF, IS, IVA, IRNR, libros, cuentas, obligaciones periódicas, calendario, calculadoras.
3. **Laboral y Seguridad Social:** contratos, nóminas, convenio, cotizaciones, trabajadores, RETA, bajas y trámites TGSS.
4. **Mercantil, notaría y registros:** sociedades, poderes, acuerdos, Registro Mercantil, notarías, operaciones inmobiliarias, herencias y donaciones.
5. **Trámites administrativos y certificados:** certificados de persona física/empresa, GVA/CCAA, ayuntamientos, SUMA, Catastro, DGT, Capitanía, otros organismos.
6. **Protección de datos y cumplimiento:** RGPD, LOPDGDD, AEPD, formularios, cookies, RAT, EIPD, proveedores y seguridad.
7. **Extranjería y nacionalidad:** NIE, TIE, arraigo, autorizaciones, nacionalidad, Registro Civil y asuntos de residencia.
8. **Herramientas de gestión y digitalización:** Holded, facturación, automatización, firmas, integraciones, VeriFactu y herramientas tecnológicas.
**Formación** es una modalidad transversal (no categoría jurídico-temática exclusiva); un curso de fiscalidad pertenece también a Fiscalidad. Admitir categoría primaria y etiquetas secundarias. No transformar una categoría comercial existente en otra sin tabla de equivalencias.

**Registro de contenido estructurado a implementar:** \`content_id\`, \`canonical_slug\`, \`primary_topic\`, \`secondary_topics[]\`, \`content_type\` (landing/servicio/guía/blog/FAQ/calculadora/curso/norma/fuente), \`related_service_slugs[]\`, \`official_sources[]\` con URL y fecha de eficacia, \`reviewed_at\`, \`next_review_at\`, \`editorial_owner\`, \`locale\`, \`translation_status\`, \`legal_status\`, \`publication_status\`, \`canonical_url\`, \`content_version\`. Primero contrato documental y mapeo, después migración controlada si necesaria; no duplicar persistencia.

### C. Plantilla transversal de «Página pilar del trámite»

Hero de lenguaje sencillo y pregunta concreta; qué resuelve; quién puede hacerlo solo; diagnóstico orientativo sin datos personales; comparativa de alternativas; preparación y checklist; pasos y enlaces a sedes oficiales; guías y artículos con explicaciones EXPERT; preguntas frecuentes; normativa con fecha/vigencia; herramientas pertinentes; formación voluntaria; gestión profesional con precio/alcance; Holded/planes si pertinentes; KIA contextual. **Ruta de decisión:** (1) informarse gratis; (2) autogestionar; (3) formación; (4) contratar ayuda o servicio. En una comunicación basta un **enlace EXPERT**, que centraliza los demás. No hacer pasar por disponibles herramientas documentadas o recursos aún no desplegados.

**SEO:** conservar enlaces existentes de /blog, /docs, /servicios; relaciones internas y canonical; redirección 301 solo con inventario y prueba; schema de FAQ sin prometer resultados enriquecidos de Google; titles/metas útiles; fuentes oficiales visibles; fechas. Evitar canibalización entre página pilar (intención de decidir) y guía (paso a paso), artículo (explicación) o ficha (contratación).

### D. Plan por entregas independientes y listo para ejecución controlada

| ID | Entrega | Dependencias | Aceptación |
| --- | --- | --- | --- |
| WEB-P0 | Inventario de páginas/menús, categorías, contenidos, URLs, idiomas y CTAs; clasificar existentes, duplicados y huecos | Lectura main y #803 | Matriz revisada ES/RU, sin cambios productivos |
| WEB-P1 | Contrato de taxonomía con mapeo de slugs actuales y jerarquía única; bocetos navegación pública desktop/móvil | WEB-P0 | No perder enlaces; menús y filtros por mismo tema |
| WEB-P2 | Guía de estilo y copy ES/RU; home, navegación y bloque «cuatro opciones»; revisión legal de propuestas «autogestión» | WEB-P1 | Copy validado por Dirección en ambos idiomas, sin claim «primera» |
| WEB-P3 | Biblioteca estructurada por temas: servicios/blog/docs/normativa/herramientas; plantillas y enlaces bidireccionales | WEB-P1, revisión SEO | Relación completa y sin huérfanos; 0 enlaces inexistentes |
| WEB-P4 | Lote pilar CIRCE #803 y RGPD existente, FAQ, decisiones, Holded opcional y KIA con fuentes | Contenidos revisados y gate KIA si cambia runtime | Respuesta y navegación coherente, QA jurídico y ES/RU |
| WEB-P5 | Publicación iterativa por categorías (autónomos, certificados, fiscalidad, trámites, laboral, registros...) | WEB-P3/4 aprobados | Release por lote con rollback y checklist documental |
| WEB-P6 | Calculadoras y simuladores, suscripciones futuras a uso KIA con créditos | Motor determinista, privacidad, condiciones contractuales y aprobación | NO implementar ni cobrar antes de aprobar viabilidad/reglas |

**Separación de ramas:** \`docs/web-publica-autogestion-paralela-20261019\` solo documentación rectora; futuras ramas \`feat/web-pN-...\` para web pública y copy, y ramas existentes de E0–E6 solo dashboard/permisos. Dependencias transversales se registran como bloqueos acotados, nunca se asume permiso para modificar KIA core, checkout o RLS desde una PR editorial. Las PR deben pasar CI/ambas previews sobre head SHA, accesibilidad, seguridad, ES/RU, fuentes, SEO y verificación de funcionalidad real. No fusionar a ciegas.

### E. Idiomas, accesibilidad y protección del usuario

- ES y RU tienen la misma prioridad de calidad y actualización. Traducción jurídico-administrativa nativa revisada; conservar términos de administración española con glosas en ruso. No inferir ciudadanía ni estatus de residencia por idioma.
- EN se deja preparado a nivel de claves y contrato de contenidos, sin rutas accesibles ni hreflang hasta revisión y aprobación.
- Explicar los costes oficiales frente a honorarios; incluir instrucciones de verificación de expedientes y advertencias sobre errores/estafas de gestión sin acusaciones contra colectivos o profesionales.
- Guías disponibles sin registro ni pago. Al pasar a un trámite con documentos, verificar identidad, permisos y seguridad sin recopilar datos innecesarios. KIA informa y acompaña; no ejecuta trámites con efectos jurídicos sin acceso y autorización.
- Monetización futura de acceso ampliado a KIA mediante límites/créditos: **solo hipótesis**, sin bloquear el conocimiento público básico, añadir cuotas ni crear productos Stripe ahora.

### F. Próxima ejecución recomendada

Primero **WEB-P0**: inventario y matriz de clasificación (sin tocar aplicación). Seguir con WEB-P1 y WEB-P2 en PRs delimitadas. En paralelo mantener el plan E0–E6 de dashboard con su checkpoint sin cambios. **Estado hoy:** anexo preparado; no afirmar que todo WEB-P está implementado, que los idiomas están traducidos o que se ha publicado en web. Separación autorizada como planificación, ejecución del código público aún condicionada a revisión del §0.


### WEB-P0 — Inventario de contenidos y correspondencia temática (19/10/2026)

**Fuente y naturaleza de la evidencia:** lectura estática del código de `main` en `lib/utils/catalog.ts`, `lib/utils/blog.ts`, `lib/utils/docs.ts`, sus módulos importados y los generadores `service-generated-content.ts` / `service-operational-blueprints.ts`. No constituye una verificación de despliegue ni prueba de vigencia jurídica. Los borradores de #803 quedan **fuera** de este corte. Los artículos con redirección de blog a docs no cuentan como artículos listados.

**Fotografía contabilizada:** **52 servicios**, **108 artículos con entrada al listado de blog**, **49 guías/entradas de conocimiento**. Incluye **11 fichas operativas que originan 33 artículos y 11 guías de forma dinámica**; no cuentan como archivos fuente independientes. Clasificación editorial propuesta y reversible: no cambia ningún slug, URL, categoría original o estado publicado.

| Categoría temática de destino | Servicios | Artículos blog | Guías/docs |
| --- | ---: | ---: | ---: |
| Empresas y autónomos | 9 | 5 | 3 |
| Fiscalidad y contabilidad | 10 | 12 | 6 |
| Laboral y Seguridad Social | 4 | 8 | 1 |
| Mercantil, notaría y registros | 6 | 0 | 0 |
| Trámites y certificados | 8 | 23 | 9 |
| Protección de datos | 1 | 10 | 7 |
| Extranjería y nacionalidad | 8 | 31 | 18 |
| Herramientas de gestión | 6 | 18 | 5 |
| Por revisar | 0 | 1 | 0 |

**Inventario de slugs agrupados por categoría de destino.** Las asignaciones temáticas son propuestas de WEB-P0, no cambios en `taxonomy.ts`. En casos transversales (ej. nóminas en Holded) la categoría principal se fija por obligación predominante y la secundaria queda para WEB-P1.

#### Empresas y autónomos

**Servicios (9)**: `alta-autonomo`, `baja-cese-actividad`, `constitucion-sl`, `constitucion-sl-circe`, `contabilidad-mensual`, `formacion-administraciones-publicas`, `formacion-alta-autonomo-sl`, `impuestos-trimestrales`, `nif-socio-extranjero`

**Artículos (5)**: `alta-autonomo-espana`, `baja-autonomo-y-cese-actividad`, `constitucion-sociedad-limitada-espana`, `impuestos-trimestrales-autonomos`, `plan-supervision-avanzado-colaborativo-comparativa`

**Guías (3)**: `alta-autonomo-guia-completa`, `conectar-google-workspace-expert`, `conectar-microsoft-365-expert`

#### Fiscalidad y contabilidad

**Servicios (10)**: `formacion-fiscal-contable`, `formacion-planificacion-fiscal`, `impuesto-patrimonio`, `impuesto-sociedades`, `irpf`, `iva-trimestral`, `modelo-151`, `modelo-720`, `modelos-informativos`, `no-residentes`

**Artículos (12)**: `declaracion-renta-expatriados`, `donaciones-fiscalidad-espana`, `impuestos-compraventa-vivienda`, `ley-antifraude-software-contable`, `modelo-151-beckham-guia`, `modelo-720-bienes-extranjero-guia`, `no-residentes-documentos-y-errores-frecuentes`, `no-residentes-proceso-paso-a-paso`, `no-residentes-requisitos-operativos-2026`, `referencia-renta-clave-paso-a-paso`, `regularizacion-fiscal-requerimientos-hacienda`, `verifactu-facturacion-electronica`

**Guías (6)**: `calendario-modelo-210-irnr-2026-2027`, `checklist-irnr-inmueble-no-residente`, `declaracion-renta-irpf-guia`, `documentos-declaracion-renta-irpf`, `irnr-no-residentes-guia`, `regimen-beckham-modelo-151-guia`

#### Laboral y Seguridad Social

**Servicios (4)**: `arraigo-laboral`, `formacion-laboral-rrhh`, `holded-migracion-laboral`, `holded-modulo-laboral`

**Artículos (8)**: `arraigo-laboral-documentos-y-errores-frecuentes`, `arraigo-laboral-proceso-paso-a-paso`, `arraigo-laboral-requisitos-operativos-2026`, `arraigo-social-vs-sociolaboral-2026`, `certificado-digital-persona-fisica-usos-aeat-seguridad-social`, `formacion-laboral-rrhh-para-no-especialistas`, `holded-nominas-limites-seguridad-social-2026`, `seguridad-social-sepe-contratos-altas-cotizaciones-2026`

**Guías (1)**: `arraigo-laboral-requisitos-checklist`

#### Mercantil, notaría y registros

**Servicios (6)**: `apoderamientos-mercantiles`, `compraventa-inmueble`, `cuentas-anuales`, `donacion`, `herencia`, `hipoteca-cancelacion`

**Artículos (0)**: sin fichas clasificadas

**Guías (0)**: sin fichas clasificadas

#### Trámites y certificados

**Servicios (8)**: `certificado-digital-entidad`, `certificado-digital-persona-fisica`, `certificado-digital-sin-animo-lucro`, `duplicado-permiso`, `matriculacion`, `pack-certificados-digitales`, `tramites-embarcaciones`, `transferencia-vehiculo`

**Artículos (23)**: `cancelacion-hipoteca-registro-propiedad`, `certificado-digital-empresas`, `certificado-digital-entidad-cambio-administrador-revocacion`, `certificado-digital-entidad-documentos-y-errores-frecuentes`, `certificado-digital-entidad-proceso-paso-a-paso`, `certificado-digital-entidad-representante-o-sello`, `certificado-digital-entidad-requisitos-operativos-2026`, `certificado-digital-persona-fisica-documentos-y-errores-frecuentes`, `certificado-digital-persona-fisica-proceso-paso-a-paso`, `certificado-digital-persona-fisica-requisitos-operativos-2026`, `certificado-digital-persona-fisica-vs-clave-dnie`, `clave-movil-app-guia`, `como-gestionar-herencia-espana`, `como-registrarse-en-clave`, `duplicados-trafico-dgt`, `matriculacion-vehiculo-espana`, `pack-certificados-digitales-documentos-y-errores-frecuentes`, `pack-certificados-digitales-persona-empresa`, `pack-certificados-digitales-proceso-paso-a-paso`, `pack-certificados-digitales-requisitos-operativos-2026`, `que-es-clave-identificacion-electronica`, `tramites-embarcaciones-capitania-maritima`, `transferencia-vehiculo-dgt`

**Guías (9)**: `certificado-digital-camerfirma-guia`, `certificado-digital-entidad-documentos-representante`, `certificado-digital-entidad-requisitos-checklist`, `certificado-digital-entidad-tipos-usos-seguridad`, `certificado-digital-persona-fisica-documentacion-instalacion`, `certificado-digital-persona-fisica-requisitos-checklist`, `certificado-digital-persona-fisica-seguridad-copia-renovacion`, `pack-certificados-digitales-checklist`, `pack-certificados-digitales-requisitos-checklist`

#### Protección de datos

**Servicios (1)**: `formacion-rgpd-aepd`

**Artículos (10)**: `brecha-datos-personales-72-horas-aepd`, `facilita-rgpd-facilita-emprende-gestiona-rgpd-diferencias`, `familias-ucranianas-espana-proteccion-temporal-residencia-estable`, `no-hay-que-inscribir-empresa-aepd-rgpd`, `proteccion-temporal-ucrania-asilo-arraigo-diferencias-2026`, `proteccion-temporal-ucranianos-cambio-residencia-espana-2026`, `proveedores-cloud-ia-rgpd-encargados-tratamiento`, `rgpd-autonomos-pymes-espana-2026`, `rgpd-marketplaces-candidatos-datos-sensibles-responsabilidad`, `web-formularios-cookies-rgpd-lssi-espana`

**Guías (7)**: `alta-inscripcion-aepd-tramites-empresa`, `checklist-rgpd-autonomos-pymes`, `formacion-rgpd-criterios-cumplimiento-y-evidencias`, `privacidad-formularios-cookies-web`, `protocolo-brechas-datos-personales-72-horas`, `registro-actividades-tratamiento-rat-pymes`, `rgpd-aepd-ruta-decisiones-para-startups`

#### Extranjería y nacionalidad

**Servicios (8)**: `arraigo-familiar`, `arraigo-social`, `nacionalidad-espanola`, `nacionalidad-espanola-menor-nacido-en-espana`, `nie-pasaporte`, `permiso-residencia-inicial`, `reagrupacion-familiar`, `renovacion-residencia`

**Artículos (31)**: `apellidos-menor-nacionalidad-espanola-registro-civil`, `arraigo-espana-reforma-2026-tipos-requisitos`, `arraigo-familiar-documentos-y-errores-frecuentes`, `arraigo-familiar-guia`, `arraigo-familiar-proceso-paso-a-paso`, `arraigo-familiar-requisitos-operativos-2026`, `arraigo-social-2025`, `arraigo-social-documentos-y-errores-frecuentes`, `arraigo-social-proceso-paso-a-paso`, `arraigo-social-requisitos-operativos-2026`, `ciudadanos-rusos-residencia-espana-sanciones-bancarias-100000`, `documentos-permiso-residencia-espana`, `nacionalidad-espanola-documentos-y-errores-frecuentes`, `nacionalidad-espanola-menor-nacido-en-espana-documentos-y-errores-frecuentes`, `nacionalidad-espanola-menor-nacido-en-espana-proceso-paso-a-paso`, `nacionalidad-espanola-menor-nacido-en-espana-requisitos-operativos-2026`, `nacionalidad-espanola-por-residencia`, `nacionalidad-espanola-proceso-paso-a-paso`, `nacionalidad-espanola-requisitos-operativos-2026`, `nuevo-reglamento-extranjeria-cambios-2026`, `permiso-residencia-inicial-guia-2025`, `permiso-residencia-inversores`, `reagrupacion-familiar-documentos-y-errores-frecuentes`, `reagrupacion-familiar-espana`, `reagrupacion-familiar-proceso-paso-a-paso`, `reagrupacion-familiar-requisitos-operativos-2026`, `renovacion-permiso-residencia-espana`, `renovacion-residencia-documentos-y-errores-frecuentes`, `renovacion-residencia-proceso-paso-a-paso`, `renovacion-residencia-requisitos-operativos-2026`, `residencia-larga-duracion-nacional-requisitos`

**Guías (18)**: `apellidos-menor-nacionalidad-registro-civil`, `arraigo-familiar-requisitos-checklist`, `arraigo-social-acreditar-dos-anos`, `arraigo-social-requisitos-checklist`, `arraigo-social-requisitos-y-proceso`, `arraigo-social-vinculos-medios-e-informe-integracion`, `documentos-nacionalidad-menor-nacido-espana`, `firmar-solicitud-nacionalidad-menor-progenitores`, `nacionalidad-espanola-menor-nacido-en-espana`, `nacionalidad-espanola-menor-nacido-en-espana-requisitos-checklist`, `nacionalidad-espanola-requisitos-checklist`, `no-residentes-requisitos-checklist`, `permiso-residencia-inicial-vias-y-documentos`, `reagrupacion-familiar-requisitos-checklist`, `renovacion-residencia-requisitos-checklist`, `renovacion-residencia-temporal-y-larga-duracion`, `residencia-larga-duracion-nacional`, `residencia-legal-menor-nacido-espana-nacionalidad`

#### Herramientas de gestión

**Servicios (6)**: `formacion-holded`, `holded-integraciones-api`, `holded-migracion-con-inventario`, `holded-migracion-sin-inventario`, `holded-modulo-formacion`, `holded-pack-starter`

**Artículos (18)**: `ahorra-horas-ia-conectada-holded`, `casos-reales-claude-holded-facturas-tesoreria-stock`, `checklist-cierre-2t-holded-julio-2026`, `como-empezar-con-holded`, `como-empezar-con-holded-paso-a-paso`, `es-seguro-conectar-ia-contabilidad-holded`, `holded-autonomos-pequenas-empresas`, `holded-autonomos-vale-la-pena`, `holded-contabilidad-pymes`, `holded-inventario-guia-completa`, `holded-migracion-sin-inventario-guia`, `holded-modulos-autonomos-pymes`, `migracion-holded-guia-practica`, `migrar-contaplus-a-holded`, `migrar-inventario-a-holded`, `modelos-303-130-111-preparar-datos-holded`, `pack-starter-holded-vs-migracion`, `pack-starter-vs-migracion-holded`

**Guías (5)**: `actualizar-permisos-token-holded-kia`, `conectar-holded-kia-token-api-v2`, `holded-conector-claude-ia-que-puede-hacer`, `novedades-holded-2026-verifactu-wallet-tpv`, `permisos-holded-kia-lectura-escritura`

#### Por revisar

**Servicios (0)**: sin fichas clasificadas

**Artículos (1)**: `formacion-fiscal-autonomos-pymes`

**Guías (0)**: sin fichas clasificadas

#### Arquitectura de navegación y páginas observadas

- **Catálogo actual:** 7 categorías visibles y `formacion` como categoría auxiliar; 52 fichas en la colección de servicios. **Taxonomía transversal actual:** 6 temas (`fiscalidad`, `extranjeria-nacionalidad`, `empresas`, `holded`, `tramites`, `formacion`). No hay temas transversales propios de RGPD y Laboral; el tema `tramites` agrupa varios dominios diferentes.
- **Web pública:** `/servicios`, `/blog`, `/docs`, `/categoria/[tema]`, `/planes`, `/holded`, `/academy`; `/herramientas/rgpd` es la única ruta de herramienta concreta encontrada en el directorio público de `main`. **No hay página índice `/herramientas`** en ese árbol. La página CIRCE `/herramientas/crear-sociedad-limitada` está propuesta en #803, no publicada por este inventario.
- **ES/RU:** existe `app/(localized)/ru`, con rutas rusas para servicios, blog, docs y RGPD. `public-shell-copy.ts` mapea solo determinadas rutas: si falta equivalencia RU conserva la URL real ES. **No asumir paridad editorial ni traducciones de todas las páginas**. Inglés es solo reserva futura, sin locale/rutas liberadas.
- **Blog:** `/blog` usa `getPublishedBlogArticles()` y los filtros propios del componente BlogExplorer. Tres slugs legacy se filtran del listado por redirección a docs: `nacionalidad-menor-nacido-espana-requisitos`, `residencia-legal-menor-nacido-espana-nacionalidad`, `documentos-nacionalidad-menor-nacido-espana`. Las categorías de artículo no comparten un ID canónico con las categorías de servicios.
- **Base de conocimientos:** `/docs` usa los filtros de DocsExplorer, seis categorías (`extranjeria-nacionalidad`, `fiscalidad`, `empresas`, `proteccion-datos`, `tramites`, `holded`); existe además una equivalencia legacy de `nacionalidad-menor-nacido-espana-requisitos` hacia `nacionalidad-espanola-menor-nacido-en-espana`. Verificar canónicas, canonical/hreflang y redirecciones HTTP antes de cambios de índice.
- **Hallazgo editorial verificable:** `lib/content/fiscal-2026-blog.ts` define **3 artículos** (`modelo-210-nuevo-plazo-no-residentes-inmuebles-2026-2027`, `modelo-210-alquiler-no-residente-transicion-2026`, `impuesto-patrimonio-2025-plazo-modelo-714-2026`), pero `lib/utils/blog.ts` los **importa y no los incorpora** al array `articles`. **No contarlos como publicados**; resolver en WEB-P1/P3 con verificación de contenido, redirecciones y SEO; no activar por accidente.
- **Seguridad de clasificación:** documentar temática principal y etiquetas secundarias sin renombrar ni reescribir rutas existentes; completar revisión manual de materias ambiguas, links/fuentes, vínculos relacionados, duplicidades semánticas y caducidad normativa antes de habilitar navegación dinámica.

#### Resultado WEB-P0 y siguiente paso

**Inventario estático realizado; validación de navegación real, cobertura RU, SEO y enlaces en preview pendiente.** Esta matriz alimenta exclusivamente **WEB-P1**: mapa reversible de categorías, componente común de filtros, rutas del menú desktop/móvil y contenido enlazado. No tocar dashboard E0–E6, checkout/Stripe, KIA privado, migraciones, esquemas RLS o producción. Mantener #803 como lote editorial separado sin fusionar por arrastre.


### WEB-P1 — Taxonomía y contrato de navegación (avance 19/10/2026)

**Rama técnica independiente:** `feat/web-p1-taxonomia-navegacion-contract-20261019` (parte de `main` y NO depende de #803 ni del dashboard). **Todavía no cambia menús en producción.**

**Contrato creado:** `lib/content/public-autogestion-taxonomy.ts`; ocho categorías estables, con etiquetas y descripciones ES/RU y mapeadores de servicios, blog y docs. No modifica `lib/utils/catalog.ts`, `blog.ts`, `docs.ts` ni los slugs existentes. Sobrescrituras temáticas controladas para Laboral, RGPD, cuentas anuales y cursos.

**Menú conceptual:** Inicio · Trámites · Conocimientos · Herramientas · Formación · Servicios · Planes · Acceder, con KIA como widget/entrada destacada. En ruso: Главная · Процедуры · Материалы · Инструменты · Обучение · Услуги · Тарифы · Войти. La llegada a una categoría/menú ahora se formula como contrato de rutas existentes (sin enlaces a índices de herramientas aún inexistentes). Algunas rutas rusas redirigen a un índice general y se identifican como `broader-hub`; no declararlas traducciones exactas ni generar `hreflang` a partir de estas equivalencias.

**Gates WEB-P1 posteriores:** comprobar mapeos completos con `tests/content/public-autogestion-taxonomy.test.ts`, revisar semántica de registros transversales, adaptar menús reales desktop/móvil bajo otra PR con QA visual y accesibilidad, crear los índices temáticos/idiomas que falten, verificar SEO y fuentes, evitar reintroducir canal WhatsApp. Ningún control se declara pasado por el mero hecho de crear el test.

**Estado:** contrato escrito en rama técnica, inventario WEB-P0 guardado en PR #804, publicación y navegación visual NO REALIZADAS. Los cambios de E0–E6 mantienen su checkpoint y autorización.


### WEB-P1/WEB-P2 — Dirección integral de diseño público y consultas gratuitas (19/10/2026)

**Decisión de Dirección y alcance de esta revisión.** Priorizar en TODO el sitio la autogestión de trámites, guías verificadas, fuentes oficiales, biblioteca de conocimiento, herramientas y KIA. Reservar a los servicios profesionales y planes una ubicación visual secundaria: accesibles cuando el visitante los busca, pero no como primer relato ni CTA dominante. WEB-P conserva identidad EXPERT (azul marino, dorado, fondos claros), coherencia visual entre formatos y una sola KIA; no crear micrositios ni componentes de contacto duplicados. Esta sección es especificación aprobada de producto/diseño, **no prueba de publicación, ejecución o funcionamiento automático**.

#### P2-A. Principios de producto, mensaje y prioridades visuales

- **Posicionamiento:** «EXPERT — Tu plataforma de autogestión inteligente». Mensaje de hero propuesto: «Resuelve tus gestiones en España con ayuda de KIA. Aprende, consulta y realiza trámites con guías claras y fuentes oficiales». CTA primario: «Pregunta gratis a KIA». Secundario: «Explora las guías y trámites». Tercero discreto: «¿Prefieres ayuda profesional?».
- **Primero resolver, luego vender:** accesos públicos sin cuenta a FAQ, guías, artículos, herramientas orientativas, fuentes oficiales y chat general; no bloquear el resultado por pago ni exigir consentimiento de marketing. Sin anuncios emergentes para contratar o presión comercial artificial.
- **Distribución orientativa de la atención visual en la home:** KIA + preguntas/consulta 40 %, aprender/autogestión 45 %, servicios + soporte profesional 15 %. Son prioridades de jerarquía y orden, NO cuotas rígidas de píxeles o límite a obligaciones legales.
- **Marca unificada:** tokens reutilizables (colores, sombras discretas, tipografía legible también en cirílico, elevaciones, radios, iconos, separadores), misma familia de cabeceras, breadcrumbs, tarjetas, fuentes normativas, alertas, FAQ, botones y estados. Evitar que página de trámite, blog y ficha comercial parezcan productos diferentes. No copiar el diseño del dashboard Kiranism ni mezclar permisos Admin/Cliente.
- **Credibilidad:** cada contenido normativo declara última verificación, fuente, jurisdicción, vigencia, excepciones relevantes y naturaleza orientativa. No prometer «cumplimiento garantizado», resultados ante Hacienda, plazos absolutos o asesoramiento ilimitado sin controles.

#### P1/P2-B. Arquitectura de navegación y páginas públicas

**Cabecera objetivo de baja fricción (desktop):** EXPERT | Trámites | Guías y conocimiento | Herramientas | KIA (destacado) | Más (Formación, Servicios, Planes, Holded, Acerca de) | ES/RU | Acceder. **Mobile:** búsqueda/pregunta a KIA inmediatamente visible y cinco accesos accesibles por menú; nunca tapar el contenido con botones flotantes. Este menú COMPACTA el inventario más amplio de la sección B: ningún área se elimina y el mapa de 8 temas sigue presente en un explorador temático común.

**Navegación por tarea, no por formato:** búsqueda transversal por palabra, tema, organismo y acción; resultados agrupados en «Guía paso a paso», «Trámite oficial», «Artículo», «Herramienta», «Pregunta frecuente», «Formación» y, al final, «Servicio EXPERT». Ocho temas de WEB-P0 compartidos por los formatos; mantener slug existente, canonical y breadcrumbs; futuras nuevas rutas solo tras inventario SEO.

**Plantillas visuales del mismo sistema:**
1. Home: hero de KIA con introducción de pregunta, acceso a chat real sin registro, temas habituales, buscador/guías populares verificadas, tarjetas de «Aprender / Tramitar / Preguntar», biblioteca por tema, mapa de cómo hacer un trámite, fuentes oficiales, contacto por correo, y bloque final pequeño de ayuda profesional.
2. Explorador por tema: intro breve, búsqueda, objetivos del visitante, filtrado por tipo de recurso, guías y enlaces a sedes; KIA contextual y consulta escrita. Servicios solo al pie o en bloque plegable accesible.
3. Página pilar del trámite: «Qué vas a conseguir / ¿puedes hacerlo tú? / antes de empezar / documentos / pasos numerados / enlaces oficiales / comprobación de justificantes / preguntas frecuentes / errores comunes / KIA». Citar cuando requiere notaría, identificación, representación o pago a tercero.
4. Guía/KB: título, resumen, nivel, tiempo orientativo, fecha/fuentes, índice lateral accesible, pasos, FAQ, enlaces oficiales, contenido relacionado, KIA + consulta por email; botón de contratación nunca preponderante.
5. Artículo: lectura fluida, explicación, fuentes y datos con fecha, enlaces a guías ejecutables y KIA; evitar que el CTA de servicio interrumpa el artículo.
6. Herramienta/calculadora: inputs mínimos, método y supuestos, resultados orientativos sin persistir por defecto, enlace al trámite real y KIA; sin registrar a nadie automáticamente.
7. Página KIA pública: presentación clara de capacidades actuales, ejemplos fiscal/AEAT, Seguridad Social, laboral, sociedades, extranjería, protección de datos, trámites de sedes, acciones permitidas, idiomas y límites; abrir mismo chat público, no generar un segundo asistente.
8. Consulta gratuita: pregunta breve con opción chat inmediato O consulta escrita; entrada sin crear empresa/expediente; respuesta en el mismo idioma y canal, trazabilidad y confirmación. Revisión humana cuando la complejidad/riesgo lo requiera.
9. Servicios y planes: mantener rutas y contratos existentes; bloque «¿puedes hacerlo por tu cuenta?» con guía gratuita primero, precios y límites visibles, contratar solo como opción voluntaria.

**Identidad visual de KIA:** componente ancho e integrado en home y páginas temáticas (no solo burbuja), avatar único actual, prompt visible, sugerencias temáticas contextuales y acceso flotante discreto persistente. El chat directo y el asistente del área privada comparten orquestación pero tienen permisos diferentes. La identidad gráfica debe distinguir respuesta IA de revisión profesional sin presentarlas como intercambiables.

#### P2-C. Repositorio único de CTA e intención del usuario

**Hallazgos actuales sobre main comprobados 19/10:** hay CTAs redundantes en 'components/site/Hero.tsx', 'components/site/header.tsx', 'components/site/footer.tsx', 'components/content/ArticleIntentCTA.tsx', calculadoras de servicios, guías/docs, y 'app/(public)/consulta-gratuita/page.tsx'. 'components/site/KiaPublicWidget.tsx' ya existe en layout público. La tarjeta «Abrir chat» de 'ArticleIntentCTA' enlaza a '/dashboard?kia=open', que no representa inequívocamente chat público anónimo. 'app/api/consultas-gratuitas/route.ts' registra lead, envía aviso a administradores y notificación push, pero en el código inspeccionado **no** realiza respuesta automática de KIA al remitente. Corregir esas diferencias antes de anunciar atención multicanal autónoma.

**Contrato canónico de CTA propuesto** (registro único reutilizable; nombres de implementación no obligatorios):
- Intenciones: 'ask_kia_now', 'ask_by_email', 'open_guide', 'start_official_procedure', 'view_tool', 'book_free_intro', 'request_human_review', 'request_paid_service'.
- Contexto no sensible: 'locale' (es/ru, en futuro), 'topic', 'content_id', 'source_type', 'source_slug', 'origin', 'service_slug' opcional, 'channel' (web_chat/web_form/email/telegram). Los query params NO llevan respuestas de formularios, documentos, datos íntimos ni tokens de autorización; normalización y sanitización server-side.
- Orden visual: KIA y guía/trámite, consulta escrita en segundo lugar, reserva humana cuando aporta valor, contratación al final. Evitar triple CTA repetitivo idéntico en el mismo viewport.
- Resolver la apertura del widget público mediante un trigger público accesible y probado (botón compartido / estado de URL controlado), sin redirigir visitantes anónimos al dashboard o forzar autenticación para una consulta general.
- Componentes fuente reutilizables: tarjeta KIA/consulta, enlace oficial, navegación a guía, pie de artículo y página pilar. Los tres CTA críticos disponibles desde home, header, footer, blog, docs, herramientas, tema y página de trámite, con variante compacta adecuada a cada contexto.
- Medición: 'cta_id', 'source_type', 'source_slug', 'locale', 'intent', 'channel', 'conversation/request_id' NOPII y estado ('opened'/'submitted'/'answered'/'escalated'); limitar analytics por privacidad, no registrar contenido de preguntas o identificadores personales en analítica pública; sin atribuir expediente por visitar o chatear.

#### P2-D. KIA gratuita en vivo y por correo: flujos separados verificables

**Principio comercial:** cualquier visitante puede solicitar orientación informativa sobre fiscalidad española, Seguridad Social, trámites administrativos, mercantil, laboral, extranjería, facturación y otras materias cubiertas por fuentes fiables. **Gratuidad del uso general** ≠ garantía de respuesta ilimitada, comprobación profesional individual, presentación oficial o cobertura total de casuística. Conservar límites de coste, disponibilidad, abuso y precisión; si KIA desconoce algo, informar y ofrecer fuente oficial o revisión humana.

**Canal A — chat público (objetivo):** entrar desde cualquiera de los CTA, mantener tema/origen no sensible, responder al momento si servicio disponible, citar fuente oficial y vigencia cuando el caso lo requiera. No pedir email para responder una duda general. Sesión anónima con controles de seguridad y privacidad; los servicios privados nunca accesibles sin autenticación. Si requiere datos delicados o capacidad no disponible, formular pregunta mínima o ofrecer canal seguro y revisión.
**Canal B — consulta escrita/email (objetivo):** usar '/consulta-gratuita' existente, capturar correo solo porque es imprescindible para devolver respuesta; mostrar finalidad, conservación, enlace privacidad y consentimiento comercial independiente (no marcado). Registrar consulta con idempotencia, confirmación clara al usuario y cola de respuesta. KIA prepara respuesta con fuentes/fecha, estado 'auto_answered' solo para orientación general segura y con QA; riesgo jurídico/fiscal alto, falta de datos, ambigüedad, información privada o acciones ante sede pasan a 'needs_review' para respuesta humana. Enviar por 'info@expertconsulting.es' conservando hilo y 'Reply-To' correcto, idempotencia, entregabilidad y opt-out de marketing separado; nunca afirmar «ya contestado» sin acuse de envío. Guardar resultado y eventos permitidos en el historial del lead, sin crear expediente porque alguien escribió.
**Canal C — Telegram:** continuidad de consulta pública no sensible; Telegram no confiere identidad EXPERT. Vincular solo con consentimiento y autenticación, sin enviar expediente a chat no verificado.
**Canal D — encuentro humano gratuito:** orientación inicial delimitada según agenda real, sin prometer auditoría, dictamen o trámite profesional gratis. Verificar confirmación, calendario, enlace, cancelación/cambio y notificaciones antes de mostrar la reserva como disponible.

**Criterios de seguridad:** verificar normativa con fuentes oficiales, fecha y supuestos; evitar instrucciones categóricas no contrastadas; transparencia de IA, base legal y retención; evitar crear relaciones comerciales/consentimientos publicitarios implícitos; revisar RGPD/AEPD, LSSI, DSA y privacidad del canal cuando corresponda. Soportar 'needs_review' y auditoría de decisiones; bloquear escrituras en AEAT, TGSS, bancos, email de terceros, Holded, registros o archivos sin mandato y permisos. No incluir identidad personal en la base pública ni entrenar IA sobre consultas privadas sin base.

**Corrección comunicacional prioritaria:** la página '/consulta-gratuita' hoy dice «KIA y el equipo revisarán» y genera lead/alerta. No presentarla como respuesta automatizada por email hasta tener cola, procesamiento, evidencias de entrega, escalado y trazabilidad desplegados y probados. No prometer plazos sin SLA aprobado. No crear un autoresponder separado si ya existe orquestación de KIA: reutilizar su motor con un adaptador de canal y autorización explícita.

#### P2-E. Sistema UI y copy coordinados ES/RU, EN preparado

- Tokens: navy '#0D1B2A' / oro '#D4A017' como acentos de marca actuales, base cálida '#F8F6F1', blancos y grises neutros; contrastes AA y estados accesibles. Jerarquía única H1/H2/H3, espaciado 8 pt, componentes para alertas jurídicas, origen oficial, migas, checklist, botones, tarjetas de recurso y navegación. Reducir tarjetas decorativas y secciones comerciales repetidas.
- Cabecera sticky sobria y búsqueda; hero con KIA integrada, no imagen de asesoría genérica como dominante. Diseño responsive-first (320/375/768/1024/1440), navegación mediante teclado, foco y cierre dialog, aria-labels, paneles que no tapen CTA/campo de texto, Lighthouse CWV y rendimiento controlado.
- ES/RU desde la misma clave semántica y fuente editorial. Traducciones jurídicas revisadas, etiquetas que no se corten en cirílico, RU auténtico y sin textos ES mezclados. EN reservado en claves, nunca hreflang de rutas inexistentes. Tests de equivalencia de rutas, CTA, accesibilidad y significado.
- Ejemplo de microcopy ES «Pregunta a KIA — gratis», «Ver cómo hacerlo paso a paso», «Ir al trámite oficial», «Enviar consulta por correo», «¿Necesitas revisión profesional?». RU equivalentes revisados antes de publicar: «Спросить KIA бесплатно», «Пошаговая инструкция», «Перейти к официальной процедуре», «Отправить вопрос по электронной почте», «Нужна профессиональная проверка?».
- Evitar reclamaciones comerciales no verificadas (atención ilimitada, cualquier trámite resuelto garantizado, firma automática, análisis completo sin intervención) y mensajes heredados de suscripciones como si fueran portada del producto.

#### P2-F. Auditoría de deuda real y secuencia implementable

| Orden | Evidencia / alcance | Acción de implementación en PR futura | Gate y aceptación |
| --- | --- | --- | --- |
| 0 | 'app/(public)/page.tsx' + 'Hero.tsx' priorizan planes/gestión mensual y copys antiguos; incluye 'JulyCampaignBanner'. | Retirar promoción caducada, sustituir relato de home y H1 por autogestión/KIA; conservar funcionalidad y SEO | Copys ES/RU, canonical/metas, enlaces, mobile, accesibilidad |
| 1 | Header/footer públicos: menús Servicios/Planes/Holded protagonistas; '/herramientas' no ofrece índice coherente | Introducir IA temática + búsqueda de recursos + menú «Más» con servicios secundarios | 0 rutas rotas, 301 solo justificados, no borrar planes/contratos |
| 2 | 'ArticleIntentCTA.tsx' envía «Abrir chat» a dashboard | Enlace/trigger real al KIA público, reutilizable en todas las plantillas | Smoke anónimo desktop/móvil ES/RU sin sesión |
| 3 | '/consulta-gratuita' ya almacena leads y notifica Admin, pero no hay auto-respuesta de KIA al remitente | Diseñar/implementar adaptador correo bajo revisión seguridad; idempotencia, envío, estado y reply mismo hilo | Integración E2E real con cuenta de prueba, privacidad, anti-spam, SLA no asumido; gate E0 KIA/email |
| 4 | Contenidos blog/docs/catálogo con CTA distintos y clasificaciones incompletas | Registro único de CTA + layout compartido «guía/trámite/KIA/ayuda» sin duplicar fuente ni rutas | 8 temas x 3 tipos; métricas noPII; legal/SEO |
| 5 | Las páginas RU y ES no poseen todavía equivalencia plena | Localización visual/terminológica y pruebas de traducciones, estados de error y CTA | RU revisado, sin fallback ilegible ni rutas inventadas |
| 6 | Servicios/planes/checkout actuales siguen operativos | Reposicionar en menú y sección final; no tocar pagos, precios o clientes por diseño | 0 regresiones de checkout y condiciones |
| 7 | KIA chat público tiene feature flag y rate limiting | Lanzamiento con métricas de coste/resolución, escalado y fallbacks legibles | No activar flag ni exponer documentos sin seguridad y QA |

**Verificación integral obligatoria antes de publicación:** test flujo visitante sin login -> guía -> sede oficial -> KIA -> pregunta -> respuesta, formulario -> lead -> respuesta por correo/humano, seguimiento del mismo hilo, privacidad/cookies, origen atribuible, 404, mobile, ES/RU, SEO, CI y previews Vercel en mismo SHA. Restringir acciones con identidad/adjuntos privados y asegurar rol real. PRs de web pública separados por alcance, con feature flags reversibles y rollback. La presente actualización **solo documenta el diseño y su backlog** en la rama de #804; no cambia aplicación, envía correos, fusiona PR o despliega.

**Coordinación con el Plan Maestro E0–E6:** WEB-P1/P2 puede avanzar en diseño, taxonomía y composición editorial; los cambios en widget KIA, API de consultas, email, CRM, RLS, consentimientos o persistencia requieren el gate de E0/seguridad correspondiente, incluso si se exponen en web pública. No abrir PR de aplicación que vulnere la congelación del §0. Proteger PR #803 CIRCE, #782 RGPD y #804 documentación como ámbitos diferenciados hasta reconciliación de dependencias.


### WEB-P2-G — Identidad contextual, reconocimiento y recorridos de KIA por usuario (19/10/2026)

**Aprobación funcional:** adaptar arquitectura, diseño, CTAs, bienvenida y conversaciones según el vínculo **verificado** del interlocutor con EXPERT. Dirección solicita expresamente documentar primero y **no implementar cambios en la aplicación, activar automatizaciones, despliegues, migraciones ni mensajes salientes** durante este paso. Mantener la misma KIA y la rama documental #804, sin crear otro plan rector.

#### G1. Modelo de identidad y relación; no confundir CRM con autenticación

La presentación se decide mediante **dos ejes independientes**:

1. **Identidad y confianza**: visitante anónimo (sesión efímera); persona que aporta voluntariamente un canal de respuesta sin autenticar; persona autenticada en EXPERT mediante sesión validada por servidor y perfil activo; canal externo vinculado y verificado (Telegram); remitente de email comprobado en hilo, sin equipararlo a sesión privada. Una cookie del chat público, una coincidencia de nombre, email sin validación, teléfono declarado o parámetros URL NO son pruebas para abrir datos de cliente.
2. **Relación con EXPERT**: visitante sin relación; contacto/lead en CRM; usuario con cuenta EXPERT sin empresa o servicio; cliente con permisos efectivos sobre una o varias empresas/expedientes; staff EXPERT (incluido soporte delegado). Puede existir más de un vínculo: usuario registrado y lead, cliente y antiguo lead, representante de varias empresas, staff con vista cliente. Nunca clasificar «cliente» solo porque el correo aparece en 'profiles': comprobar relación y alcance vigentes.

**Prioridad de autorización:** autenticación -> perfil activo -> tenant y rol -> membresía empresa/expediente, y solo después snapshot mínimo para interfaz. «Lead conocido» es un dato de CRM, no un permiso de acceso a historial o datos privados. Resolver colisiones/duplicados/homonimias con resultado 'identity_conflict'/'needs_review', sin unir fichas ni mostrar información que confirme existencia de terceros.

**Observaciones técnicas verificadas en main:** 'components/site/KiaPublicWidget.tsx' solo utiliza 'supabase.auth.getSession()' para un booleano y muestra saludo genérico; 'components/KiaCopilotWidget.tsx' ya dispone de 'contextualWelcome(context)' con 'firstName' e idioma y 'app/api/ai/kia/context/route.ts' obtiene nombre del perfil verificado; 'lib/auth/active-actor.ts' usa 'auth.getUser()' y perfil activo; 'lib/ai/kia/kia-channel-identity.ts' requiere identidad Telegram activa y verificada; 'lib/ai/kia/kia-client-ledger.ts' rechaza conflictos de identidad; 'lib/ai/kia/kia-public-web-persistence.ts' distingue sesión pública de identidad. Reutilizar contratos, no duplicar reglas.

#### G2. Matriz integral de experiencias públicas y privadas

| Perfil / señal autorizada | Mensaje de entrada (ES, ejemplo) | Acciones iniciales | Límites explícitos |
| --- | --- | --- | --- |
| Anónimo sin sesión EXPERT | «Hola, soy KIA. ¿Qué necesitas resolver hoy?» | Preguntar, buscar trámite, abrir guía, consulta escrita | Nada de nombres, historias previas ni expedientes por cookie pública |
| Anónimo con formulario enviado | «¿Quieres resolver otra duda o consultar nuestras guías?» | Nueva pregunta; continuidad por email al remitente verificado | No anunciar «he visto tu solicitud anterior» en navegador no autenticado |
| Usuario registrado con perfil activo, sin vínculo comercial confirmado | «Hola, {nombre}. ¿En qué puedo ayudarte hoy?» | Biblioteca, preferencias elegidas, trámites, preguntas gratuitas | No presumir que es cliente o que tiene expedientes |
| Lead reconocido **con vínculo acreditado** a sesión/canal | «Hola, {nombre}. ¿Quieres retomar tu consulta o comenzar otra?» | Retomar conversación realmente vinculada; consultar respuesta; nueva duda | Solo historial con autorización y continuidad demostrada; no cruzar hilos por email similar |
| Cliente con relación activa verificada | «Hola, {nombre}. ¿Quieres revisar tus gestiones o consultar otra cuestión?» | Resumen autorizado, documentos pendientes, empresa seleccionada, chat, guías | Empresa y caso expresamente validados; no inferir un expediente |
| Cliente con varias empresas | «Hola, {nombre}. ¿Sobre cuál de tus empresas quieres consultar?» | Selector de empresas autorizadas, opción general | No mezclar datos entre empresas; no elegir automáticamente si puede causar confusión |
| Staff EXPERT / modo soporte delegado | «Hola, {nombre}. Estás en tu espacio de gestión.» | Trabajo según rol, contexto de empresa/cliente seleccionado | Mostrar indicador de soporte delegado y registrar actor real; nunca hacerse pasar por el cliente |
| Identidad ambigua, sesión caducada o perfil inactivo | «Hola, soy KIA. Puedo ayudarte con una consulta general.» | Información pública, iniciar sesión o verificar identidad | No revelar coincidencias ni motivo de fallo interno |

**Nombres:** obtener 'preferred_name' si el usuario lo define y es válido; si no, nombre de pila seguro del perfil activo. No usar apellidos completos en chat público, datos de empresa sensibles, direcciones de correo como sustituto de nombre, ni derivar el nombre del parámetro URL; si falta nombre, bienvenida neutra. Releer identidad en servidor; inicializar la interfaz con estado «comprobando identidad» breve sin parpadeo de un nombre ajeno. Tras cierre de sesión, eliminar inmediatamente de la vista cualquier mensaje/shortcut privado. No mostrar una bienvenida nominal en terminal/dispositivo público si la sesión ha vencido.

**ES/RU:** ejemplo en ruso «Здравствуйте, {имя}! Чем могу помочь?»; tratamiento natural según preferencia lingüística verificada y texto real del usuario, sin transliterar automáticamente nombres propios. Mensajes contextuales localizados y revisados, sin copiar literales españoles a RU; EN preparado pero apagado. No usar tonos excesivamente familiares en asuntos administrativos.

#### G3. Flujo de entrada y enrutamiento único

1. **Entrada**: página origen + acción (guía, artículo, pregunta, formulario, Telegram, email, área cliente) con referencias de contenido no sensibles.
2. **Resolución segura**: determinar canal, sesión, perfil/rol activo si existe, relación CRM solo con enlace verificable, pertenencias a empresas y ámbitos autorizados. Evitar consultas cruzadas de datos personales mediante herramientas privilegiadas.
3. **Contexto mínimo y explicación**: KIA recibe 'identity_status', 'relationship_status', 'locale', 'capabilities', 'authorized_company_ids' y 'origin_context' tras filtrado server-side; no enviar toda la ficha CRM ni información de expediente para una bienvenida genérica.
4. **Presentación**: saludo una sola vez por apertura de conversación, botones y preguntas iniciales **pertinentes**; «Continuar consulta anterior» únicamente si hay hilo autorizado; «Ver expedientes» solo cuando existen y están permitidos; «Preguntar gratis» visible siempre.
5. **Respuesta**: KIA general sin autenticación; consultas privadas tras autorización; respuesta con normativa/fuentes/fechas cuando procede; si se requiere decisión jurídica/fiscal delicada o acción sensible, revisión humana.
6. **Seguimiento**: conversación y fuente identificadas con ids no adivinables; estado 'received' / 'kia_answered' / 'awaiting_user' / 'needs_review' / 'human_answered' / 'closed', sujeto a modelo existente. Persistir lo mínimo permitido; evitar crear expediente/cliente al saludar o preguntar.
7. **Cambio de estado**: al iniciar/cerrar sesión, completar verificación, adquirir relación de cliente, cambiar empresa, activar soporte delegado o retirar consentimiento, invalidar contexto, volver a resolver permisos y renovar acciones.

**Regla UX de bienvenida:** el saludo personalizado **no debe incluir hechos privados no solicitados** («tu deuda», «tu inspección», «tus documentos», «te escribimos por X») ni presuponer objetivo del usuario. La personalización visible se limita al nombre y a opciones útiles; un mensaje contextual de un expediente solo aparece cuando el usuario lo abre expresamente en un canal autenticado. Evitar repetición del saludo en cada página.

#### G4. CTA, continuidad de canal y experiencia progresiva

- **CTA global primario** «Preguntar gratis a KIA»: mismo motor público para todos, sin exigir registro. En usuario autenticado, KIA puede ofrecer «Continuar con mi cuenta» y enriquecer contexto con permisos tras confirmación.
- **CTA contextual de contenido** «Ayúdame con este trámite»: enviar únicamente identificador público de guía/página, no contenido privado ni query con PII; KIA conoce fuente, pero no asume intención comercial.
- **CTA de consulta escrita** «Recibir respuesta por correo»: pedir email para responder, explicar finalidad, política de privacidad y opción de consentimiento comercial separada; confirmar recepción, rastrear estado sin abrir expediente automático. No incluir detalles sensibles de preguntas en la URL.
- **CTA «Retomar conversación»** en chat/web/Telegram/email solo si hay vínculo explícito seguro y el canal tiene derecho a ese historial. Un email entrante de una dirección conocida permite responder a ese mismo hilo bajo controles, no revelar información del área privada solo por coincidencia.
- **CTA «Ver mis gestiones»** exclusivo de cliente autenticado con permisos: selector de empresa cuando corresponda, estado verificable y acciones por rol, sin prometer acceso desde widget público.
- **CTA profesional** discreto y contextual; no promocionar contratación al detectar a un lead o mostrar la misma oferta en todos los niveles del embudo.
- **Handoff**: chat -> consulta por correo -> respuesta -> posible reserva o expediente, con conservación de fuente solo cuando el usuario autorice el enlace; no importar automáticamente chats anónimos a fichas personales.

**Separación de funciones:** identidad web, elegibilidad para enviar email, autorización de respuesta automática y permisos de documentos son contratos distintos. Adaptador único de KIA por canal, con límites y QA; no crear motor paralelo. El flujo actual de 'app/api/consultas-gratuitas/route.ts' almacena lead y alerta al Admin, **pero no demuestra autorrespuesta por correo**; el agente email existente tiene settings de autosend y controles, pero no se debe asumir que está habilitado o enlazado al formulario.

#### G5. Componentes de diseño, estados, métricas y protección de datos

**Piezas a diseñar conjuntamente (no implementar hoy):** bloque KIA grande en portada, saludo contextual con skeleton, selector de contexto (General / Mi empresa), centro unificado de recursos, preguntas sugeridas por tema, barra de consulta persistente sin interferir móvil, panel de respuesta con fuentes oficiales, aviso de IA, CTA de correo y estado de respuesta, accesos a historial privado autenticado, pantalla de verificación y perfil, switch ES/RU, estados de error/offline/limite de uso.

**Estados de UI:** 'anonymous', 'identity_loading', 'authenticated_profile', 'verified_lead', 'verified_client', 'support_delegated', 'conflict', 'expired' y 'fallback_public'; no exponer una etiqueta interna 'lead' al visitante por defecto. Diferenciar «te responderá KIA» (IA) de «requiere revisión» (especialista).

**Privacidad por diseño:** minimización, no revelar existencia de cuentas/expedientes mediante mensajes personalizados a identidad no verificada, no vincular por cookies de analítica, no exponer datos sensibles en bienvenida o preview de notificación, evitar persistencia por defecto del chat público, no usar consulta privada para entrenamiento sin base y consentimiento aplicable. Revisar cookies, conservación, trazabilidad, finalidad y derecho de supresión antes de enlazar canales. La calidad de identidad prevalece sobre marketing personalizado.

**Control de rendimiento/negocio:** medir anónimamente tiempos de aparición del chat y resolución del estado de identidad, respuesta útil, clics en guía oficial, repetición de consultas, porcentaje de respuesta autónoma segura, escalados humanos, entregabilidad y coste IA; sin logs con PII. No dar a todos los usuarios la misma «bienvenida comercial».

#### G6. Secuencia documental y gates para futura implementación

| Fase | Alcance documental ahora | Prueba exigida antes de implementar/publicar |
| --- | --- | --- |
| WEB-P2.G-01 | Contrato de identidad de dos ejes y precedencias de confianza | Tabla de casos anónimo, registrado, lead, cliente, multiempresa, staff, homónimos, sesión caducada |
| WEB-P2.G-02 | Biblioteca de saludos y preguntas sugeridas ES/RU | Nombre solo servidor verificado, copy jurídico/privacidad revisado, sin presunción de expediente |
| WEB-P2.G-03 | Wireframes home + KIA grande + CTA y estados móviles | Accesibilidad, foco, overlay sin tapar contenido, navegación y ES/RU |
| WEB-P2.G-04 | Matriz de canales y continuidad: web, email, Telegram y dashboard | Flujo autorizar/desautorizar, hilo sin mezclar, historial minimizado, fallback a revisión |
| WEB-P2.G-05 | Mapa de módulos y reutilización del stack actual | No duplicación de motores, integraciones ni clientes; gates E0 pertinentes |
| WEB-P2.G-06 | Plan E2E y medición de calidad | 0 cruces de perfiles/tenants, sin revelar nombres anónimos, origen trazable, rollback, CI/previews |

**Estado:** DISEÑO DOCUMENTADO / ejecución no autorizada. PR #804 permanece en borrador y solo debe contener la propuesta de WEB-P. Los componentes, APIs, base de datos, automatizaciones, textos publicados, flags, email real, Telegram, derechos de acceso y pagos quedan intactos. Cualquier desarrollo futuro requiere PR acotado, autorización de alcance, revisión jurídica/privacidad/idiomas/SEO, validación CI y previews, y gates del Plan Maestro E0-E6.


## Acta de conciliación documental R1 — Admin V2, KIA 2.0 y V3 (18/10/2026)

**Decisión documental, sin implementación:** el Plan Maestro E0–E6 es la única fuente de prioridad, estado de tareas, autorizaciones y cierre. Los tres documentos examinados se conservan como especificaciones o banco histórico; ninguna de sus secuencias propias reemplaza E0–E6. Esta resolución no acredita que las capacidades estén activas ni aprueba nuevas propuestas.

| Fuente evaluada | Resolución | Requisitos a conservar en el único Plan Maestro | Estado de ejecución |
| --- | --- | --- | --- |
| `docs/expert-admin-v2-plan-maestro-2026-10-09.md` | **INTEGRAR como especificación subordinada de E2/E3**; dejar sin efecto su autoridad de «plan maestro» y la propuesta de iniciar su «fase 0» independiente. | Un solo Workspace visual con rutas, actores, autorizaciones y flags separados Admin/Cliente; soporte delegado sin suplantación; Contactos/Inbox 360; adquisición `first_touch` y `last_touch` separadas de OAuth; datos Holded por empresa/integración/período; RLS, revocación y pruebas negativas; instrucciones registrales en E3. | **E2 y E3 bloqueadas**, se conserva detalle técnico como referencia. |
| `docs/kia-2-strategy.md` | **INTEGRAR como contrato técnico de seguridad E0/E4/E5**, no como estrategia canónica paralela. | Una KIA y una jerarquía de permisos R0–R5; `permissions_enabled` y actor exact-active por encima de permisos detectados; aislamiento empresa/expediente; acciones preview→aprobación→ejecución→readback; trazas, fuente, fallback y presupuesto IA. | Solo la auditoría de seguridad dentro de E0 puede continuar; **E4/E5 bloqueadas**. |
| `docs/expert-kia-v3-ideas-and-validation-backlog-2026-10-10.md` | **INCORPORAR la rama V3 como banco de ideas, NO como segundo backlog activo**. Mantener los 24 IDs V3-01…V3-24 y su descripción detallada en referencia histórica. | Ideas avanzadas, entre ellas archivo multiarchivo V3-23 y simulador laboral/nóminas V3-24. No confundir funciones básicas E5 con evoluciones V3, ni diagnóstico informativo H3 con nóminas. | Todas **capturadas y no aprobadas**; ningún desarrollo antes del cierre E6 y aprobación nueva. |

**Contradicciones resueltas por precedencia:** (1) «listo para iniciar fase 0» en Admin V2 y «primera implementación aprobada» no permiten saltar la fase E0 del Maestro; (2) el calificativo «estrategia canónica» de KIA 2.0 deja de determinar prioridades; (3) la propuesta V3 de mantener un documento de captura separado ya no constituye un circuito decisorio independiente. Cuando se editen documentos secundarios, sustituir esos encabezados por avisos de precedencia sin alterar hechos históricos.

**Verificación:** las cifras, estados «implementado», integraciones, créditos, herramientas y proveedores descritos en esas versiones de octubre **no se consideran vigentes por inferencia**. Confirmar código/CI, permisos, expediente, fuente oficial y readback antes de pasar una propuesta a ejecución.

**Privacidad:** no replicar nombres, correos, identificadores o datos de casos históricos contenidos en especificaciones anteriores. Los ejemplos de QA deben ser sintéticos o mantenerse en expedientes autorizados, no en documentación pública del Maestro.

**Siguiente bloque:** reconciliar los issues #775/#776 (reuniones), #654/#134 (Inbox/Telegram) y #778/#780/#770 (RGPD). No cerrar issues, PR funcionales ni cambiar prioridades de E0 antes de comparar requisitos y evidencias.

**Checkpoint inalterado:** `E0-M3-06-admin-users-tenant-object-scope-audit`; E0 `IN_PROGRESS`, E1–E6 y V3 bloqueadas.


## ANEXO KIA-A — Tercera línea coordinada de arquitectura KIA y subagentes (19/10/2026)

**Mandato de Dirección 19/10/2026 — solo documentación, SIN implementación.** Organizar la transformación integral EXPERT en **tres vías coordinadas**: (A) WEB-P para la web pública de autogestión, conocimiento y consulta gratuita; (B) WORKSPACE E0–E6 para panel Admin y Cliente, modo soporte delegado y experiencia de usuario; (C) KIA-A para la arquitectura transversal de una sola KIA, subagentes/skills, razonamiento, fuentes, adaptadores, memoria autorizada, revisión y QA. Los tres workstreams son ramas documentales/de revisión separadas, NO tres cerebros ni tres planes maestros. No alterar el checkpoint E0, congelación de alcance, permisos, datos productivos ni habilitar trabajos E4/post-E6 por esta decisión.

### KIA-A.1 Repositorio y coordinación sin planes duplicados

| Línea | Autoridad / rama de referencia | Lo que posee | Lo que NO puede modificar autónomamente |
| --- | --- | --- | --- |
| WEB-P | PR #804, 'docs/web-publica-autogestion-paralela-20261019' | Narrativa, rutas públicas, búsqueda, plantillas, CTA/entrada KIA, guía y conocimiento | Motor KIA, permisos, datos de clientes, correo, RLS, checkout |
| WORKSPACE | Plan E0–E6 de este mismo Maestro en 'main'; los documentos Admin V2 y contrato Workspace×KIA quedan como referencias, no planes rectores | Diseño Admin/Cliente, paneles, visibilidad autorizada, soporte delegado, contexto UI | Prompts globales y herramientas no aprobadas, cron, email exterior, datos ajenos |
| KIA-A | Rama documental 'docs/kia-architecture-subagents-parallel-20261019' | Router, subagentes/skills, matriz de capacidades, política de IA, recuperación de fuentes, QA, contratos con web y dashboard | Activar agentes nuevos, cambiar IAM/RLS sin gate, ejecutar herramientas externas ni migrar base de datos |

**Único registro canónico:** 'docs/expert-kia-ecosystem-master-plan-2026-10-10.md'. La rama KIA-A mantiene un anexo separado en **este mismo archivo** para revisión; una futura fusión exige reconciliar sobre 'main' el anexo WEB-P de #804 y cualquier avance WORKSPACE. No sobrescribir una rama desde otra, evitar cherry-pick a ciegas y actualizar checkpoint únicamente con evidencia de ejecución real. Referencias existentes: 'docs/kia-2-strategy.md'; 'docs/plans/kia-post-e6-subagents-audit-and-parity-2026-10-17.md' (issue #789); 'docs/kia-unified-core-attachments-document-studio-2026-10-10.md'; 'docs/workspace-v2-kia-copilot-parallel-integration-2026-10-10.md'; 'docs/kia-accounting-agent.md'. PR #707 y #708 cerradas sin fusionar, no ramas de ejecución vigentes.

### KIA-A.2 Principio de orquestación

**ÚNICA KIA VISIBLE:** una interfaz conversacional coherente en web pública, dashboard Cliente, Admin, soporte delegado, email y Telegram; adaptadores de canal sin duplicar el núcleo. Flujo lógico futuro:

'Entrada por canal' → 'Verificación de sesión/identidad/actor y relación' → 'Resolución de contexto y permisos efectivos' → 'Clasificación de intención y sensibilidad' → 'Plan de acción mínimo' → 'Enrutamiento a skill/subagente autorizado' → 'Consulta de datos permitidos y fuentes oficiales' → 'Evaluación/confianza/consentimiento' → 'Respuesta, borrador o propuesta de acción' → 'Confirmación humana cuando proceda' → 'Ejecución idempotente permitida' → 'Readback, auditoría, continuidad y aprendizaje supervisado'.

Sin agente «autónomo» que herede credenciales superiores del Admin por pertenecer al catálogo. Los prompts describen conducta, nunca elevan privilegios ni convierten una tool ausente en herramienta disponible.

### KIA-A.3 Inventario verificado de reutilización y cartera funcional

Lectura de 'lib/ai/kia/kia-sub-agent-router.ts', 'lib/ai/kia/kia-skill-registry.ts' y auditoría documental 17/10/2026: hay **siete perfiles de subagente en el código** ('assistant', 'fiscal', 'immigration', 'holded', 'accounting', 'labor', 'case') y **ocho skills habilitadas en el registro de código**, incluida 'operations.next_best_action' sin perfil propio. Esto no constituye prueba de ejecución satisfactoria ni de que funcionen plenamente en producción.

| Unidad actual/propuesta | Objetivo y lugar de uso | Prioridad de revisión / límite |
| --- | --- | --- |
| 'assistant' — Comunicación y agenda | Emails, bandeja unificada, citas, cambios de tareas, correspondencia y seguimiento para Admin/Cliente | Continuidad de hilo, idempotencia, identidad y correo saliente condicionado |
| 'fiscal' — Fiscal y normativa | Guías públicas gratuitas, IRPF/IVA/IS, tributos, interpretación documental autorizada | Recuperación normativa y vigencia reales: la skill fiscal actual no declara 'regulatory'/'knowledge' |
| 'immigration' — Extranjería | Recursos públicos, normativa de residencia/nacionalidad y expedientes privados | Garantía de fuentes, fecha, documentos mínimos; no revelar situaciones sensibles |
| 'holded' — Integración ERP | Conexión, readiness, permisos, migración, diagnóstico técnico | No confundir con operaciones contables ni conceder escrituras |
| 'accounting' — Controller contable | Facturas, cobros, pagos, conciliación, anomalías, cierre y reportes | Holded por compañía; borradores/escrituras sujetos a aprobación y readback |
| 'labor' — Laboral y Seguridad Social | Convenios, contratos, nóminas, altas, cotizaciones, guía y diagnóstico | Fuentes oficiales/tablas temporales; skill actual centrada en lectura 'holded_hr_read' |
| 'case' — Expedientes/documentos | Checklist, documentos, estado de solicitudes y trámites, seguimiento | No equivaler metadatos de ficheros con lectura íntegra o facultad para presentar |
| 'operations.next_best_action' — Skill transversal | Propone qué hacer a continuación sin actuar | No contar como octavo subagente |
| Mercantil/constitución SL/notaría/registros (propuesta) | Páginas pilar CIRCE, obligaciones sociedades, DUE, gestión registral | Analizar reutilización de fiscal + case + fuentes antes de crear agente nuevo |
| Marketing, contenidos y SEO (propuesta) | Artículos ES/RU, FAQ, bibliotecas, enlaces, oportunidades de publicación y campañas | Human-in-the-loop, origen y revisión legal, sin autopublicación |
| Comercial y onboarding (propuesta) | Leads, consultas gratuitas, elección de autogestión/formación/servicio | Sin upsell forzado; no confundir lead y cliente, no acceder a expedientes |
| Dev/QA y agente de desarrollo supervisado (propuesta) | Analizar PRs, tests, planes, propuestas y riesgos de código | No ejecutar cambios, merges ni despliegues sin autorización y gates; posterior a E6 salvo auditoría defensiva ya aprobada |
| Academy/formación y operaciones de sector (propuesta) | Tutores de contenidos fiscales, laborales, trámites, gestión de inmuebles | Primero skills reutilizables; subagente independiente solo por criterios medibles |

**Criterios para crear un nuevo subagente:** (i) misión separada estable; (ii) conjunto de herramientas y permisos específicos que difiere de otros; (iii) evidencias medibles de necesidad, calidad/coste/seguridad; (iv) propietario de QA y fuentes; (v) matriz de no solapamiento. Si falla alguno, proponer skill, plantilla o herramienta del orquestador común en lugar de nuevo perfil.

### KIA-A.4 Contratos con WEB-P y WORKSPACE

**WEB-P → KIA-A:** entrada pública anónima, pregunta libre, fuente de la guía/tema, idioma, herramientas de consulta R0 autorizadas, orientación gratuita y fuentes oficiales, con límites antiabuso y preservación de privacidad. La web no invoca directamente tools privadas; no crea historial CRM a partir de una cookie. CTA «Pregunta gratis a KIA» debe abrir el mismo widget público; email de formulario no debe presentarse como contestado automáticamente si no lo está.

**WORKSPACE → KIA-A:** identidad de actor autenticado, rol/tenant, empresa seleccionada y autorizada, contexto de la pantalla, expediente explícitamente abierto, perfil y preferencias verificadas. KIA propone y ejecuta según riesgo; el modo Admin soporte conserva actor real y alcance delegado, nunca suplanta al cliente. El mensaje inicial puede dirigirse al nombre de pila verificado en ES/RU, pero no presupone razón de visita o expediente. Cliente multiempresa exige selector antes de divulgar detalles.

**KIA-A → ambas:** contratos comunes de respuesta estructurada (texto natural, fuentes, versión normativa, confidence razonada, acciones sugeridas, requiere revisión, tipo de artefacto) y eventos de telemetría sin datos personales. La capa de presentación elige tarjeta web, chat, panel lateral, email, checklist, enlace oficial o documento según canal, sin dos lógicas de decisión contradictorias.

**Email/Telegram:** el canal de entrada no equivale a login web; verificación/continuidad explícita. Autorespuesta por email solo tras autorización de política, contenido acotado y QA; firma/órdenes/pagos/AEAT/TGSS/Holded se tratan como herramientas de riesgo con confirmación real. Nada de envíos sin evidencia de entrega.

### KIA-A.5 Matriz de capacidades por identidad, canal, riesgo y subagente

- **Público anónimo:** respuesta informativa general, conocimiento público y enlaces oficiales; sin leads privados, empresas, expedientes, documentos ni herramientas de escritura.
- **Registrado sin relación de cliente:** saludo por nombre de sesión validada y guía/consulta gratuita; no se supone empresa o expediente.
- **Lead vinculado mediante prueba suficiente:** referencia a solicitud previa solo dentro de hilo/sesión autorizado, sin elevar privilegios por coincidencia de email o nombre.
- **Cliente autenticado:** lectura de sus datos **únicamente** con RLS/tenant/company/case scope y fines permitidos. Riesgo creciente para escritura, envío, presentación, firma y borrado; aprobación específica, auditoría y readback.
- **Admin/empleado:** tools internas limitadas por rol y autorización de operaciones; soporte delegado registra identidad del operador, consentimiento/mandato y empresa.
- **Especialistas:** capacidades efectivas resultan de la intersección 'actor × canal × empresa/expediente × skill × herramienta × riesgo'; si la intersección es vacía, explicar limitación o escalar, no forzar la herramienta.

**Fuente y QA:** corpus regulatorio oficial con organismo, norma/artículo, versión, vigencia, ámbito autonómico/municipal y fecha de comprobación; citar origen. Distinguir resumen de metadata y lectura exhaustiva de documento; no afirmar cumplimiento, impuestos exactos, trámites completados o documentos procesados sin evidencia.

### KIA-A.6 Tres vías, un protocolo de integración y revisión

| Dependencia | Dueño de la definición | Revisión cruzada obligatoria |
| --- | --- | --- |
| Header, navegación, contenidos, CTA público | WEB-P | KIA-A valida trigger del chat, payload noPII, acceso anónimo y fuentes |
| Saludos y comportamiento por tipo de usuario | KIA-A | WEB-P y WORKSPACE validan diseño/copy/idiomas, Supabase/Auth controla identidad |
| Layout Admin/Cliente, dock KIA, selector empresa | WORKSPACE | KIA-A revisa contexto y privilegios; WEB-P no toca datos privados |
| CRM, ciclo lead → usuario → cliente, historial | WORKSPACE/data y KIA-A como consumidores | Identificación, consentimiento, vinculación trazable, borrado y no exposición |
| Skills, agentes, herramientas y routing | KIA-A | Políticas E0–E6 y security owner; no bypass de fase |
| Fuentes/guías y SEO | WEB-P editorial | KIA-A valida retrieval/citas, fecha, error y conocimientos desactualizados |
| Correo/citas/Telegram y respuestas automáticas | Integraciones E5 + KIA-A | Gate identidad, entregabilidad, antiabuso, revisión humana y auditoría |
| Evolución contable/ERP Holded | WORKSPACE/E5 + KIA-A accounting | Mandato, operación permitida, preview/confirmación, idempotencia/readback |
| Agent Dev y QA autónomo | KIA-A como futuro | Seguridad, sandbox, coste, CI, approvals, sin merge automático |

**Cadencia de coordinación documental:** un único registro de decisiones (ADR) y dependencias en este Maestro; cada propuesta indica 'owner', 'estado', 'prerequisito', 'gate E0–E6' y 'prueba de aceptación'. Tres PRs separados pueden documentar simultáneamente; ninguna ejecuta código fuera de su gate. Para integración, una PR de contrato compartido pequeña tras consenso de las tres vías; evitar modificar las mismas líneas por tres ramas.

### KIA-A.7 Backlog documental y secuencia futura bloqueada

| ID | Entregable | Verificación esperada |
| --- | --- | --- |
| KIA-A0 | Inventario de perfiles/skills/policies/tools y mapeo con canales | Diagrama + matriz de capacidades real, casos negativos, código vs producción separado |
| KIA-A1 | Contrato de contexto/identidad (incluye lead, registrado, cliente, multiempresa, delegado) | Sin cruces de personas/empresas, saludos personalizados autorizados ES/RU |
| KIA-A2 | Modelo de orquestación, selección de especialistas y fallbacks por intención | Tests de routing, skills efectivamente autorizadas, casos de incertidumbre |
| KIA-A3 | Fuentes, conocimiento, versiones y generación de informes/artefactos | Fuente oficial efectiva, trazabilidad, control de caducidad y documentos |
| KIA-A4 | Email/chat/Telegram, seguimiento, handoff humano y notificaciones | Idempotencia, continuidad verificada, estado real de respuesta |
| KIA-A5 | UX KIA grande en web y panel lateral de Workspace | Una KIA visible, saludo adaptado, estados claros y móvil accesible |
| KIA-A6 | Observabilidad, presupuestos, seguridad, evaluación ES/RU y QA de subagentes | Evaluaciones de regresión, no invención, costes, alertas, RLS, red-team |
| KIA-A7 | Revisión de candidatos a nuevos subagentes y agent dev | Decisiones basadas en evidencia; no activar nuevas capacidades antes de su gate |

**Gates de ejecución:** (1) primero resolver defectos bloqueantes del E0 activo si realmente pertenecen a su alcance; (2) las mejoras aprobadas que ya aparecen en E4/E5 se ejecutarán solo cuando se abran legalmente esas fases; (3) las expansiones genuinamente post-E6 (nuevos subagentes, agentes de desarrollo, autonomía ampliada) permanecerán propuestas hasta acta E6 y aprobación de Dirección. No fusionar ramas documentales en conflicto sin rebase controlado y CI; no cambiar secretos, servicios, clientes, producción, web, DB ni condiciones comerciales desde KIA-A. Las PRs de documentación no certifican trabajo implementado.




## ACTA DE CONCILIACIÓN Y LIMPIEZA DOCUMENTAL — 19/10/2026

**Decisión y límite:** Una sola fuente de planificación y estado de ejecución: este documento. Las tres vías WEB-P, WORKSPACE E0–E6 y KIA-A son ámbitos coordinados, no tres planes rectores ni autorizaciones de desarrollo simultáneo. Esta auditoría es documental, **no** autoriza implementar, fusionar código funcional, cambiar pagos, tocar datos privados, activar IA, migrar bases ni desplegar. El checkpoint E0 sigue 'IN_PROGRESS', E1–E6 bloqueadas y congelación activa. Este anexo se preparó reconciliando íntegramente los textos de las PR documentales #802, #804 y #808, en una rama independiente que conserva todas sus decisiones previas.

### C1. Alcance, método y fiabilidad del inventario

**Fotografía directa de la API GitHub (19/10/2026):** 'main' tiene 26 PR abiertas y 28 issues abiertas (GET /issues devuelve 54 elementos porque incluye PR), 'docs/' presenta 170 entradas de primer nivel, 'docs/plans/' nueve archivos y 'docs/archive/plans/2026-10-17/' trece archivos archivados. Son cifras de la fotografía y **no** un recuento recursivo completo de archivos del repositorio. La auditoría previa recogida en el Maestro abarcó 213 documentos bajo 'docs/' antes de archivar planes; no transferir ese recuento a otra fecha. Se inspeccionaron listados completos de las 26 PR y 28 issues, diffs relevantes de PR de gobierno, WEB-P, E0, IA, RGPD y seguridad, títulos y contenido seleccionado de issues, y cabeceras/superficies de planificación. No se ejecutó CI ni se hizo una inspección línea por línea de cada archivo recursivo; los candidatos a archivo que carezcan de análisis de referencias quedan **EN REVISIÓN**, no declarados obsoletos definitivamente.

**Limpieza acreditada:** PR #801 fusionada archivó trece planes antiguos en 'docs/archive/plans/2026-10-17' y dejó stubs en rutas originales. Verificados 'docs/roadmap.md', 'docs/master-checklist.md', 'docs/implementation-plan.md', 'docs/admin-improvement-plan.md' y 'docs/kia-implementation-progress.md'. No repetir movimiento ni borrar stubs: protegen enlaces desde README, documentación y commits anteriores.

**Clases canónicas de material:** (i) este Maestro = planificación, dependencias, decisiones y checkpoint; (ii) documentos secundarios de arquitectura / especificaciones / contratos = referencias técnicas subordinadas; (iii) evidencias, QA, ADR, seguridad y runbooks = documentación operativa que se conserva; (iv) históricos = archivo de solo consulta; (v) ideas V3/post-E6 = propuestas no aprobadas, sin cola de ejecución paralela. No equiparar «un solo plan» con «un solo archivo de todo el repositorio».

### C2. Autoridad de las tres vías y conciliación de planes

| Vía / contenido | Fuente y resolución | Dependencia y límite |
| --- | --- | --- |
| WEB-P / autogestión, navegación, guías, consulta gratuita, identidad del visitante, ES/RU | Texto completo incorporado de PR #804 (WEB-P0–P6, WEB-P2 y WEB-P2-G); mantener #805 → #806 → #807 como **código borrador apilado**, no publicado | SEO, copy, privacidad, disponibilidad real KIA; no modificar datos privados ni checkout por rediseñar web |
| WORKSPACE / Admin, Cliente, soporte delegado y gestión multiempresa | E0–E6 en este Maestro. 'docs/expert-admin-v2-plan-maestro-2026-10-09.md' y 'docs/plans/admin-v2-support-and-kia-contract-pr708-consolidated-2026-10-17.md' son especificaciones subordinadas | No iniciar E2 antes del gate E0/E1; conservar actor real y permisos, ledger autorizado y expediente |
| KIA-A / orquestador, subagentes, skills, fuentes y QA | Texto completo de PR #808 integrado; referencias 'docs/kia-2-strategy.md' y 'docs/plans/kia-post-e6-subagents-audit-and-parity-2026-10-17.md' | Siete perfiles y ocho skills registradas en código, sin presumir operación en producción. Expandir perfiles nuevos solo en fase aprobada |
| Precedencia Admin V2, KIA 2.0 y banco V3 | Acta R1 de PR #802 incorporada íntegra | V3 es banco de ideas bloqueadas hasta E6 completada y autorización nueva |
| Antiguas PR documentales #707, #708, #790 | Cerradas **sin fusionar**, pero su material técnico útil se conserva en el árbol main/documentos de referencia ya identificados | No reabrir «plan maestro Admin», «plan KIA 2.0» o «plan V3» por su título antiguo |
| WEB antigua / precio, créditos, catálogo | 'docs/expert-public-web-workspace-kia-repositioning-plan-2026-10-10.md' y 'docs/expert-web-v2-navigation-knowledge-ai-credit-plans-2026-10-10.md': contexto histórico subordinado | No anunciar créditos IA ni alterar condiciones comerciales/planes vigentes basándose en una propuesta |
| Nueve archivos bajo 'docs/plans/' | Contratos e investigaciones para CIRCE, RGPD, fiscalidad/CREA-CRECE, laboral, impacto editorial, oportunidades, soporte y subagentes | Mantener como anexos técnicos hasta analizar dependencias; no tratarlos como planes ejecutivos |

**Regla de conflictos:** checkpoint del Maestro + decisiones de Dirección fechadas y alcance del gate > hechos comprobados de código/CI/deploy y normativa vigente > documentos técnicos subordinados > ideas/históricos. Las ramas #802, #804 y #808 modificaban por separado el mismo archivo Maestro partiendo de 'main': se reconcilian **sin elegir una y descartar las otras**, evitando pérdida silenciosa.

### C3. Registro de las 26 PR abiertas y acción de limpieza recomendada

| PR | Programa y estado documental | Salida necesaria |
| --- | --- | --- |
| #808 | KIA-A; duplicación documental de edición del Maestro | Requisitos integrados; marcar como sustituida **solo después** de que esta conciliación esté fusionada y verificada |
| #807 | WEB-P1 hubs; apilada sobre #806 | Mantener borrador hasta gates WEB-P, SEO, enlaces y ES/RU |
| #806 | WEB-P1 navegación; apilada sobre #805 | Mantener borrador; no publicar shell sin revisión |
| #805 | WEB-P1 taxonomía; base de pila | Contrato en revisión; no confundir archivo técnico de código con plan rector |
| #804 | WEB-P; duplicación documental | Requisitos integrados; sustituible después del merge seguro |
| #803 | WEB-P4 CIRCE/PAE Virtual | Borrador de contenidos; revisión normativa, fuentes oficiales, costes/notaría e indexación |
| #802 | Precedencia documental | Acta incorporada; sustituible después del merge seguro |
| #798 | WEB-P3 herramientas gratuitas | Borrador de hub; validar que recursos existan, licencias, costes e idiomas |
| #794 | E0 prueba sintética AI Gateway; apilada sobre #793 | Validación aislada, sin exponer credenciales ni activar proveedor |
| #793 | E0 compatibilidad JSON Schema IA | Diagnosticar defecto real y gates de la fase actual |
| #784 | Comunicación / E0–E5 | Riesgo de notificaciones, requerimientos, filtro spam y privacidad |
| #782 | RGPD / leads | QA idempotencia y privacidad, no crear fichas duplicadas |
| #779 | RGPD / formación | Revisión comercial, normativa y traducción antes de publicación |
| #777 | KIA QA reuniones | Depende de issues #775/#776 y evidencia de acciones autorizadas |
| #772 | WEB-P contenido SL/autónomo ES/RU | Verificar fuentes y evitar duplicar #803 |
| #771 | WEB-P RGPD/FAQ ES/RU | Revisar paridad, exactitud y consentimientos |
| #769 | RGPD borrador de política | No vender plantilla como conformidad jurídica garantizada |
| #767 | Certificados digitales | Mantener contenido y límites; nunca acceder a certificados/secretos por la web |
| #765 | Normativa traducciones ES/RU | Vigencia jurídica y revisión humana, no publicar locales incompletos |
| #764 | E0 normativa / impacto legal | Changes API + SQL, revisión legal y autorización estricta |
| #745 | KIA QA multimodelo | CI/AI Gateway manual y desactivado, presupuesto/gates |
| #743 | Telegram avisos de revisión | Feature desactivada; integrar con issue #134 e identidad |
| #742 | Agent Dev, diseños/CI/SQL draft | Post-E6 para nuevos agentes, salvo hardening E0; sin ejecución |
| #713 | Holded empresa piloto, migración | Integridad financiera, permisos, reversibilidad y readback |
| #705 | Persistencia KIA anónima | E1, cookies, retención, RLS, sesión ≠ persona, revisión privacidad |
| #683 | Botones nativos de reserva | Verificar proveedor actual, móvil, confirmación y accesibilidad |

**Dos pilas de dependencias detectadas:** #805 → #806 → #807 (WEB-P1) y #793 → #794 (E0 AI Gateway). No reorientar ni fusionar ciegamente; ejecutar CI final contra SHA resultante de la integración, no checks de base intermedia. **PR #801 ya fusionada** y su archivo histórico no se repite. No cerrar PR de funcionalidad por limpieza del Maestro.

### C4. Matriz de las 28 issues abiertas

| Responsable del requisito | Issues | Tratamiento |
| --- | --- | --- |
| WEB-P / conocimiento, SEO, idioma y autogestión | #797, #796, #795, #773, #770, #360, #133 | Consolidar requisitos de visibilidad, fuentes, guías, ES/RU, diagnóstico orientativo y servicio opcional |
| WORKSPACE / CRM, operaciones, expedientes, soporte | #353, #475, #654, #180 | Diferenciar usuario/lead/cliente, dirección de caso, comunicaciones y trazabilidad; una sola cola operativa |
| KIA-A / meeting, aprendizaje, QA | #775, #776, #774, #768 | #775 y #776 parecen duplicar disparador 'meeting.notes_ready'; revisar criterios y evidencias antes de cerrar |
| KIA-A / documental, subagentes, normas y futuro | #789, #786, #785, #791 | No confundir 7 perfiles registrados con 7 agentes productivos; lectura integral de documentos y Agent Dev requieren gate |
| RGPD / datos mínimos | #780, #778 | Cuidado con indicadores sensibles en query params, pdf, retención, consentimiento y leads; #782 relacionado |
| Telegram | #134 | Subtarea de Inbox #654, sin duplicar identidad ni canales |
| Marketing / contenido automático | #352 | Motor editorial único con autorización humana, no publicación automática |
| Seguridad Supabase | #388 | Password protection, actualización PostgreSQL, Security Advisor, hardening E0 |
| Laboral Holded | #279 | Smoke company-scoped, no inferir identidad de empresa por nombre |
| Facturación, entidades y Stripe | #161, #135, #64 | Facturas históricas, un usuario/múltiples empresas, checkout único por entidad |

**Posibles solapamientos que requieren una comprobación antes de cerrar:** #775/#776; #654/#134 no son idénticos (epic vs canal), #778/#780 tratan pasos distintos de RGPD, #796/#798 son diseño vs código y #785/#786 son especialidades complementarias. No cerrar por similitud semántica ni marcar «resuelto» al registrar en el Maestro.

### C5. Requisitos olvidados que deben estar en las tres vías

1. **Cliente sin usuario registrado:** el contacto comercial y la autorización a datos son distintos del login (Admin 360). Empresa/persona, lead y cuenta deben tener relación comprobable; un email compartido no basta (#135/#161).
2. **Seguridad transversal Supabase y GRC:** leaked-password protection, PostgreSQL security patching, RLS/grants y Security Advisor (#388). Ningún plan visual cancela mantenimiento prioritario E0.
3. **Privacidad del origen de lead:** no enviar resultados de cuestionario RGPD o indicadores sensibles en URL/UTM; canal de correo gratuito con consentimiento específico y datos mínimos; sin marketing obligatorio (#778/#780).
4. **KIA verdaderamente multicanal:** mismo motor con permisos por canal; email entrante, saliente, Telegram y chat tienen autenticaciones diferentes, deben registrar origen y estado de entrega. El formulario actual alerta a Admin pero no acredita respuesta automática por email.
5. **Traducciones completas ES/RU:** paridad jurídica, catálogo, FAQ, navegación, KIA, notificaciones y exportables; no asumir traducción en vivo ni publicar hreflang de rutas inexistentes (#360/#773/#765).
6. **Fuentes oficiales vivas y fechas:** CRECE y CRECE vs e-factura vs VERI*FACTU, CIRCE, convenios laborales, impuestos y otras fuentes: no inventar obligación, plazo o régimen; registro de vigencia, huella y revalidación.
7. **Lectura documental auténtica:** metadatos del expediente no equivalen al texto completo de PDF/Word; control de permisos, hash, citas página/versión y resultados reproducibles (#786/#785).
8. **Calidad real de subagentes:** 7 perfiles, 8 skills y permisos de herramienta distintos. Una instrucción de prompt no habilita 'regulatory' si la skill fiscal/laboral no la declara. QA multicanal/idioma y fallbacks antes de prometer cobertura total (#789).
9. **Separación Admin/Cliente dentro de una UI común:** accesibilidad, tenant/company scope, modo soporte delegado sin suplantar la identidad, auditoría de acciones Holded y selección de empresa si varias (#353/#180).
10. **Protección de decisiones financieras:** facturas antiguas, Stripe por entidad, cartera de clientes y contratos vigentes, reintentos/idempotencia, pagos y abonos no editables por simple rediseño (#64/#135/#161/#713).
11. **Handoff de reuniones y notas:** deduplicar trigger Google Meet/Gemini, contrastar hechos confirmados en email posterior antes de crear tareas, nada de envíos o expedientes supuestos (#775/#776/#777).
12. **Contenidos reutilizables con IA supervisada:** una fuente oficial verificada debe alimentar respuesta KIA/guía/FAQ/SEO/oportunidad, con distintos permisos y revisión; no crear segundo motor marketing (#352/#797).
13. **Diseño accesible y enlaces operativos:** #805–#807 exigen keyboard, mobile, ES/RU, rutas reales, canonical/301, no romper reuniones ni acceso público (#683).
14. **PR/branch governance:** mantener un registro de 'estado/fuente/owner/dependencia/riesgo/fase/QA'. Documentación en paralelo autorizada; desarrollos E1–E6 y capacidades post-E6 bloqueados sin gate.

### C6. Plan definitivo de limpieza, con puntos de parada seguros

**1. Esta PR de conciliación:** registrar en un único archivo Maestro el texto de #802 + #804 + #808 y la auditoría de 26 PR / 28 issues, sin edición de código de aplicación. Al estar basada en WEB-P #804, su diff incluye ese trabajo más las otras dos adiciones.

**2. Verificación previa al merge:** comparar secciones con las tres PR origen, comprobar longitud/hash, inexistencia de borrados del Maestro, links del README, plan de archivos, docs/QA y CI. Rebase/reconciliación sobre último 'main' y uso de SHA actual. NO ejecutar la fusión mientras los gates de aprobación sigan pendientes.

**3. Tras merge confirmado a main:** cerrar #802, #804, #808 como PR documentales sustituidas, con referencia a la consolidación y sin borrar ramas por defecto. Las PR de contenido/código permanecen abiertas.

**4. Archivo secundario en otro lote documental:** comparar semánticamente antiguos «planes» de Admin V2, KIA 2.0, web v2 y nueve referencias de 'docs/plans/'. Mantener en main documentación técnica que contenga contratos vigentes; archivar solo planes duplicados tras asegurar enlaces/stubs, jamás los runbooks operativos o historial de seguridad.

**5. Dedupe de issues uno por uno:** empezar por #775/#776, después #654/#134 y #778/#780/#770; relación canónica y confirmación de criterios antes de cerrar duplicados. Las issues de producción/seguridad no se cierran solo por estar en Maestro.

**6. Futuras PR por programa:** WEB-P (público), WORKSPACE (interno), KIA-A (núcleo), todas con QA de interfaz, seguridad, fuentes oficiales, RGPD, idioma, CI y previews. Un solo checkpoint rector E0–E6.

**Limitación importante:** este informe constituye una clasificación y conciliación, no certifica que todo el árbol recursivo haya sido comprobado a nivel de línea o que las PR estén listas para merge. No se han modificado datos, expedientes, cobros, clientes ni despliegues.


## ACTA DE LIMPIEZA L2 — Precedencia y duplicados comprobados (19/10/2026)

**Alcance:** documentación únicamente. No modificar código, cliente, correo, migraciones, permisos, producción ni checkpoint E0. El único documento rector sigue siendo este Plan Maestro; WORKSPACE, WEB-P y KIA-A son tres líneas coordinadas. La PR #809 ya está fusionada en main; #802, #804 y #808 están cerradas por sustitución.

### Autoridad aclarada

- `docs/expert-admin-v2-plan-maestro-2026-10-09.md`: se ha sustituido el título que inducía a segundo Plan Maestro y el estado histórico «listo para iniciar fase 0» por referencia subordinada a E2/E3, que siguen bloqueadas.
- `docs/plans/admin-v2-support-and-kia-contract-pr708-consolidated-2026-10-17.md`: identificado expresamente como contrato técnico de soporte delegado/Workspace y KIA, no otro plan.
- `docs/kia-2-strategy.md`: identificada como referencia de arquitectura, no estrategia canónica ejecutiva. Las decisiones de seguridad y herramientas siguen referenciadas sin activar nuevas funciones.
- Conservar detalles técnicos y enlaces históricos; no borrar estos documentos, pues contienen requisitos y contratos no trasladados íntegramente al Maestro.

### Conciliación detallada de issues (sin marcar capacidad implementada)

**#776 = issue canónica para proceso `meeting.notes_ready`; #775 = descripción duplicada, cerrar como `duplicate` SOLO tras copiar al cuerpo de #776 sus criterios singulares.** Contrato unificado: disparador idempotente de nota Google Meet/Gemini; resolver si es persona física/autónomo o sociedad; comparar instrucciones confirmadas, correos posteriores y reuniones; registrar en hoja append-only fuente/fecha/autor; extraer acuerdos separando hechos, propuestas, obligaciones futuras y acciones revocadas; deduplicar tareas, calendario y citas; elaborar borradores email y documentación de agenda/presentación; no inferir CNAE/IAE sin fuente censal; generar oportunidades de FAQ, KB y blog solo desidentificadas y bajo QA ES/RU; revisión humana obligatoria antes de envíos, escrituras, citas irreversibles o presentación ante sede; prueba E2E de listener, idempotencia, aislamiento tenant/company, pruebas y readback. El piloto mencionado en #776 es una evidencia histórica, no una certificación de automatización general.

**#654 / #134 — conservar ambas:** #654 es objetivo omnicanal Inbox 360; #134 es integración específica Telegram y smoke real pendiente. No duplicar tareas de emisión ni cerrar hasta evidencias de Telegram webhook/E2E y autenticación.

**#778 / #780 / #770 — conservar:** (a) diagnóstico RGPD mínimo, privacidad de URL y minimización; (b) descarga/envío PDF, lead voluntario e idempotencia; (c) paridad editorial ES/RU y revisión legal. Son criterios distintos, no duplicados. No crear contacto/expediente ni captar marketing por responder a una autoevaluación.

**#796 / PR #798 — conservar:** issue de diseño/SEO vs PR de código del hub público; no publicar hasta validar enlaces reales y RU. **#785 / #786 — conservar:** auditoría laboral específica vs recuperación documental e informes generalistas. **#789** permanece en post-E6 y no autoriza siete agentes nuevos.

### Criterios para cerrar esta limpieza

Los tres documentos de referencia han de mostrar de inmediato que no son planes rectores; la PR deberá cambiar solo Markdown, completar checks CI y previews, y ser leída de vuelta en main después de la fusión. Las issues no se cierran por mención documental: primero conservar criterios en el ticket superviviente y registrar vínculo de duplicado. Ningún cierre de issue equivale a trabajo funcional completado.


## ACTA DE LIMPIEZA L3 — Referencias web, RGPD, comunicaciones e IA histórica (19/10/2026)

**Solo gobierno documental.** El Plan Maestro E0–E6 es único; WEB-P, WORKSPACE y KIA-A son vías de diseño coordinadas, no planes independientes. No se autoriza implementación, publicación, migración o cambio de permiso. Se conservaron los textos técnicos y se corrigieron exclusivamente encabezados/avisos de cinco referencias auxiliares.

- `docs/plans/rgpd-hub-lead-pdf-rollout-20261015.md`: deja de titularse «PLAN MAESTRO». Es especificación de RGPD/lead/PDF que requiere verificación legal, consentimiento, minimización, idempotencia y QA; no certifica publicación.
- `docs/kia-contextual-conversations-roadmap.md`: contexto histórico de canales y WABA; no convierte WhatsApp en canal público vigente ni sustituye KIA web, Telegram y correo con identidades verificadas.
- `docs/kia-ai-architecture.md`: memoria histórica de arquitectura WABA y flags; requisitos y proveedores actuales deben verificarse en código y política de Plan Maestro.
- `docs/expert-web-v2-navigation-knowledge-ai-credit-plans-2026-10-10.md`: investigación histórica de créditos/planes IA; ninguna cuota, monetización o nuevo checkout aprobados por su contenido.
- `docs/expert-public-web-workspace-kia-repositioning-plan-2026-10-10.md`: referencia histórica de reposicionamiento; no precede decisiones WEB-P publicadas en este Maestro.

**Estado de issues:** #775 cerrada como duplicada, criterios incorporados a #776 que sigue abierta; #654/#134 y #778/#780/#770 continúan separados por poseer entregables distintos. No repetir cierre o producir efectos comerciales por limpieza.

**Gate:** confirmar diff limitado a Markdown, CI obligatorio, previews de ambos despliegues y lectura de los cinco documentos más el Maestro en `main` después de merge. Ninguna evidencia funcional nueva se deduce de documentación.

## ACTA L4 — Integridad transversal WEB-P × WORKSPACE × KIA-A (19/10/2026)

**Naturaleza:** conciliación documental adicional sobre \`main\`, posterior a L1 (#801), conciliación de las tres vías (#809), L2 (#810) y L3 (#812), todas ya fusionadas. Único Plan Maestro: este archivo. Las especificaciones, evidencias y runbooks siguen subordinados; no crear nuevos planes rectores. **Sin cambios en código, permisos, datos, proveedores, pagos o despliegue.**

**Fotografía GitHub comprobada:** 24 PR abiertas al comienzo de esta revisión; #813 es el borrador nuevo de mitigación E0. Las fotografías de 26 PR / 28 issues de C1-C4 son históricas y NO se deben usar como conteos actuales. Releer PR/issues cada vez que se planifique una fusión. **Fase activa E0, checkpoint E0-M3-06**, con E1-E6 bloqueadas, freeze intacto y V3 solo capturada; no existe acta de cierre E0.

### L4.1 Orden normativo y excepción editorial bien delimitada

- El §0 prevalece: ninguna línea paralela puede **implementar, fusionar o desplegar código funcional** de E1-E6 fuera de su gate, ampliar alcance, cambiar checkout, esquema de identidad, integraciones o permisos. La expresión histórica WEB-P «prepara y ejecuta independientemente» significa aquí **investigación, inventario, redacción, prototipos aislados, especificaciones, revisión y PR draft**, pero NO publicación ni fusión de runtime antes de autorización y fase habilitada. Una excepción funcional futura necesita acta expresa en este Maestro, alcance, riesgo y QA; no se presupone por abrir la PR.
- WEB-P, WORKSPACE y KIA-A son **tres propietarios de diseño**, no calendarios de ejecución simultáneos. Solo **E0-M3-06** puede consumir trabajo correctivo actual, además del gobierno documental y mitigaciones de mantenimiento P0/P1 demostradas que no alteren la fase.
- Los anexos antiguos de #802/#804/#808 contienen instrucciones de conciliación ya superadas por la fusión de #809. No reabrir esas PR ni aplicar sus ramas sobre \`main\`. La bitácora cronológica preserva lo sucedido y esta acta corrige el estado vigente.

### L4.2 Interfaces obligatorias y ownership de las tres vías

| Contrato | Sistema de verdad / dueño | Consumidor | Integridad y aceptación mínima |
| --- | --- | --- | --- |
| A. Catálogo/URL/guía/FAQ/fuente/idioma/versiones | WEB-P, contenidos revisados; normativa oficial versionada | KIA-A y WORKSPACE | URL canónica ES/RU solo si traducción real; fuente fechada; servicio opcional no se confunde con trámite oficial; no publicar cobertura ficticia |
| B. Entrada pública en KIA | WEB-P controla widget/CTA y copy; KIA-A controla decisión y herramientas públicas | KIA-A, futuro CRM | \`sourcePage/contentId/locale\` sin PII ni privilegios, reCAPTCHA/rate limit; cookie o email sin prueba NO crea cliente ni expediente |
| C. Identidad y selección del sujeto | WORKSPACE/Auth/relación empresa/tenant; validación de servidor y RLS | KIA-A y soporte | \`actorId, role, tenantId, subjectType, subjectId, companyId, caseId, mode\` contrastados; ausencia de empresa/expediente NO habilita inferencia; usuario multiempresa debe seleccionar alcance |
| D. Modo soporte delegado | WORKSPACE, actor original y mandato/capabilities efectivos | KIA-A e integraciones | Reutiliza panel real del cliente sin suplantar JWT; cliente no ve controles de staff; acciones sensibles con preview, aprobación, idempotencia y readback |
| E. Decisión/respuesta/acción KIA | KIA-A orquestador único + skills + política por riesgo/canal | WEB-P y WORKSPACE | \`text, citations, sourceVersion, language, proposedActions, requiresReview, artifact\`; presentación diferenciada, no lógica ni tool paralela; no afirmar envío/escritura sin resultado |
| F. Hoja registral e historial | WORKSPACE E3, ledger por sujeto + eventos fuente/fecha/actor | KIA-A y operaciones E5 | Una identidad/empresa verificada; snapshot no sustituye la fuente viva; aislamiento, consentimiento, minimización, retención y auditoría |
| G. Correos, Telegram, Google Meet/Calendar y documentos | Integraciones E5 + KIA-A, bajo autorización del actor | WORKSPACE/Admin, eventualmente web | Canal externo no equivale a sesión web; continuidad hilo-caso/tarea basada en evidencia, recepción y entrega probadas; Meet \`notes_ready\` deduplicado (#776) |
| H. Seguridad, costes y CI | E0 seguridad transversal; E6 gobernanza económica | Las tres | Tests negativos por rol/tenant/company/case, revocación exact-active, revisión independiente y 2 previews por HEAD; presupuestos IA sin autopermisos |

**Contrato de evento común (documental, no API existente):** \`eventId\` idempotente, \`correlationId\`, \`actorId\` o visitante anónimo, \`verifiedSubjectId\` opcional, \`companyId\` y \`caseId\` opcionales solo si autorizados, \`channel\`, \`intent\`, \`sourceRef\`, \`locale\`, \`occurredAt\`, \`consentScope\`, \`riskTier\`, \`status\`, \`evidenceRef\`. No crear tablas ni transportar contenido sensible para cumplir esta especificación sin diseño y autorización de su fase.

### L4.3 Matriz de divergencias y decisiones registradas

| Nº | Divergencia | Decisión segura / gate | Estado |
| --- | --- | --- | --- |
| L4-01 | WEB-P se describe «en paralelo» y el freeze E0-E6 prohíbe runtime adelantado | Trabajo documental simultáneo permitido; #805→#806→#807 y #803/#798 siguen PR draft funcionales, **sin merge/deploy** mientras E1 no esté habilitada | Resuelta en gobierno; implementación bloqueada |
| L4-02 | Referencias antiguas #802/#804/#808 como ramas por conciliar | #809 contiene la integración ya fusionada; L2 #810 y L3 #812 también integradas, no volver a fusionar ni duplicar Plan Maestro | Resuelta |
| L4-03 | Interfaz Admin/Cliente «la misma» puede interpretarse como suplantación o acceso a otro tenant | Una UI reutilizada, **dos permisos efectivos**; soporte delegado con actor real y scope explícito; certificación E2 pendiente | Contrato definido, no implementado |
| L4-04 | KIA-A enumera siete perfiles y ocho skills pero su cobertura práctica no está acreditada | Reutilizar router/registry actuales, validar tool por actor/canal/empresa/riesgo; no crear un octavo subagente por contar ocho skills | Definición documentada, QA E4 pendiente |
| L4-05 | Alcance de altas/gestión de usuarios no cerrado en E0 | #813 DRAFT: exact-active + sesión vinculada, CI y ambas previews verdes sobre SHA \`61eb025c7e60247247b45b4a20e01a2f0f1d8ac4\`; falta jerarquía, usuario-objeto/tenant, borrado Auth, concurrencia y pruebas adversariales; **NO fusionar** ni cambiar checkpoint | Bloqueo E0 P1 |
| L4-06 | Prueba AI Gateway se confunde con llamada exitosa a proveedor | #793 con CI/previews verdes pero revisión pendiente; #794 job preflight correcto y petición sintética externa \`skipped\`, no acreditar OpenAI/Gemini operativos por ello | QA incompleta |
| L4-07 | Flujo de captación pública puede confundir visita/cookie/email con identidad o CRM | Consentimiento de finalidad y verificación, relación lead→usuario→empresa separada; KIA no adivina expediente; #778/#780/#782 bajo QA RGPD | Bloqueada por gate |
| L4-08 | Traducciones RU amplias se presentan como páginas equivalentes | #805 distingue \`broader-hub\` de páginas temáticas; QA editorial ES/RU, hreflang, canonical, sitemap y rutas antes de publicar | QA WEB-P pendiente |
| L4-09 | CORREO/Meet/Telegram vs KIA única e historial | #654 coordina Inbox, #134 integra Telegram, #776 agrupa notas Meet; Outlook/no-recepción y seguimiento real no se presumen por KIA-A o página de contacto | Integración E5 pendiente |
| L4-10 | Catálogo puntual, formación, planes y suscripciones han tenido decisiones comerciales fechadas que parecen contradictorias | **No inferir catálogo contratado a partir de documentos antiguos**: comparar web/código/Stripe y aprobación comercial vigente antes de cambiar páginas o precios; contratos existentes no se cancelan por diseño | Decisión comercial de publicación pendiente |
| L4-11 | Lectura de metadatos documentales confundida con inspección de PDF/Word o fuente oficial | #785/#786: validar descarga autorizada, contenido real, hash, página, versión, fuente y generación de artefacto, con abstención ante acceso fallido | QA y capacidades pendientes |
| L4-12 | Agencia de desarrollo supervisada tratada como ya ejecutora autónoma | #742/#743/#745 y #791: propuestas/laboratorio restringido; jamás auto-merge, migraciones, acciones sobre clientes, consumo no autorizado ni despliegue; gate independiente | Desactivada |

### L4.4 Aceptación de integridad antes de un merge futuro

1. **Dependencias:** todo PR funcional incluye programa \`WEB-P|WORKSPACE|KIA-A\`, fase E0-E6, propietario, contratos que consume, riesgo, datos que toca y permiso expreso si cruza superficies. PRs apiladas se integran en orden y se repiten tests en SHA final.
2. **Identidad y privacidad:** pruebas negativas anónimo/lead/cliente/admin/tenant_admin/revocado y multiempresa; sin identificación por email o cookie, sin fuga PII, sin autopublicación ni envío al margen de la herramienta.
3. **Fuentes/idiomas/SEO:** fuente oficial vigente, versión y localización; traducciones reales ES/RU, enlaces/canonicals, accesibilidad móvil/teclado y no duplicación editorial.
4. **Operación:** integración KIA y documentos con readback de entrega/escritura, auditable e idempotente; sin prometer capacidad por un prompt o pantalla.
5. **Release:** CI typecheck/lint/build/test/evals/SQL aplicables + Vercel \`app\` y \`ksenia-expert\` en último HEAD, revisión de seguridad y aprobación, sin P0/P1; acta posterior a merge sobre \`main\` y check de checkpoint. Merge documental ≠ finalización de E0 o funcionalidad publicada.

### L4.5 Salida autorizada de esta acta y siguiente trabajo

- **Esta acta es solo documentación**: se puede fusionar separadamente de #813 para que quede en \`main\` la matriz de dependencias, riesgos y autoridad. No fusionar el código inseguro para «fusionar el plan».
- **Siguiente tarea de ejecución:** resolver #813 y E0-M3-06 con guardia de actor activo, autorización por usuario objeto/tenant, jerarquía de roles, borrado seguro y pruebas de concurrencia; revisar rutas hermanas de Admin usuarios/empresas. Mantener E1-E6 y V3 bloqueados.
- **Control de integridad posterior a la fusión documental:** leer el último HEAD de \`main\` y confirmar este anexo, la cabecera de checkpoint intacta, no pérdida de L1-L3 ni de los anexos WEB-P, WORKSPACE y KIA-A, y la clasificación de PR funcionales como pendientes.

