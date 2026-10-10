# EXPERT KIA Ecosystem — Plan Maestro canónico y registro de ejecución

**Fecha de aprobación del marco:** 10/10/2026 · **Versión:** 1.0 · **Propietario funcional:** Dirección EXPERT · **Repositorio:** `expert-servicios/expert-app` · **Rama base:** `main`  
**Estado global:** EN EJECUCIÓN · **ÚNICA FASE ACTIVA: E0** · **Última fase cerrada:** ninguna · **Transición a E1:** BLOQUEADA · **Congelación de alcance:** ACTIVA.  
**Naturaleza de este documento:** fuente canónica de orden de trabajo, definición de entregables, criterios de cierre y bitácora. No certifica funcionalidades en producción.

<!-- ECOSYSTEM_CHECKPOINT phase=E0 phase_status=IN_PROGRESS next=E0.04 closed_phase=NONE scope_frozen=true production_flags=UNCHANGED -->

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
- [ ] `E0-M3-05` Cerrar P1 de procedencia registral no atestada en servidor en altas de empresa (rutas `/api/companies` y `/api/company/associate`), mediante patch mínimo, tests negativos y validación sin modificar históricos.
- [ ] `E0-M3-06` Cerrar P1 de rutas mutadoras con `getSupabaseAdmin()` sin `profiles.status` activo ni scope por objeto; comprobar por rol/tenant/empresa/expediente, HTTP y RLS en entorno de prueba.
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
