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

Se preservan como **documentos auxiliares históricos** los planes de [CIRCE](plans/circe-autogestion-centro-ayuda-20261015.md), [Crea y Crece y facturación](plans/crea-crece-facturacion-oportunidades-kia-20261015.md), [auditoría editorial/Academy Holded](editorial/blog-docs-holded-links-cta-consultation-audit-2026-10-13.md), [reposicionamiento web](expert-public-web-workspace-kia-repositioning-plan-2026-10-10.md), [navegación y futuros créditos](expert-web-v2-navigation-knowledge-ai-credit-plans-2026-10-10.md), [auditoría de proveedores y subagentes](kia-ai-providers-artifacts-subagents-audit-2026-10-10.md), [KIA y Document Studio](kia-unified-core-attachments-document-studio-2026-10-10.md) y [Workspace/KIA](workspace-v2-kia-copilot-parallel-integration-2026-10-10.md). Las propuestas de #707, #708, #709, #760 y #783 quedan preservadas sin fusionar sus ramas antiguas ni alterar la prelación E0–E6. La adenda de #744 ya está integrada en el Plan Maestro. **No adoptar precios, planes por créditos, fechas, claims ni despliegues de esos borradores sin validación actual y aprobación de Dirección.**

### Regla de gobierno

Este anexo **unifica las ramas y las listas de aceptación**, sin crear otro plan rector y sin sustituir prioridades E0–E6. Los issues #780, #791, #795, #796, #797 y PR #798 son las trazas de ejecución. Ningún cambio de producto/SEO queda «publicado» hasta fusión, despliegue, pruebas de HTTP e indexabilidad; y estar en sitemap no garantiza indexación ni posiciones en Google.

