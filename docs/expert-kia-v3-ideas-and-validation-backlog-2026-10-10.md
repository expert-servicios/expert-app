# EXPERT KIA — V3 | Banco de ideas y validación futura

**Creado:** 10/10/2026 · **Clase:** propuesta de evolución posterior, **NO plan de ejecución vigente**  
**Estado:** `CAPTURA ABIERTA · TODAS LAS IDEAS SIN APROBAR · IMPLEMENTACIÓN BLOQUEADA`  
**Plan rector activo:** [EXPERT KIA Ecosystem E0–E6](expert-kia-ecosystem-master-plan-2026-10-10.md) · **Fase actual del producto:** E0 · **Desbloqueo V3:** después del acta **E6 COMPLETADA**, una auditoría final y **nueva validación expresa** de Dirección.  
**Alcance:** ideas fuera de E0–E6, evoluciones avanzadas de capacidades existentes, hallazgos de la auditoría que no sean defectos P0/P1 obligatorios y oportunidades que aparezcan durante el desarrollo.

<!-- EXPERT_V3 status=IDEAS_ONLY entry=OPEN implementation=BLOCKED prerequisite=E6_CLOSED approval=REQUIRED scope_E0_E6=FROZEN -->

## 0. Decisión y frontera con el Plan Maestro

Dirección autoriza **proponer, registrar, depurar y priorizar conceptualmente** mejoras V3, incluidas propuestas técnicas del asistente, mientras se desarrolla el ecosistema. **No** autoriza anticipar su construcción, nuevas ramas funcionales, migraciones, contrataciones, gastos, cambios comerciales, pruebas productivas ni PRs de funcionalidades V3 antes del cierre completo de E0–E6.

Por tanto:

1. **E0–E6 es el único tablero de ejecución**: las fases no compiten por recursos ni se interrumpen por ideas.
2. **V3 es un segundo documento, no una octava fase automática**: aquí se escriben ideas sin convertirlas en tickets de ejecución ni estimarlas como compromisos.
3. Antes de añadir una idea, verificar el catálogo de código/planes: si **ya está dentro de E0–E6**, añadir únicamente su aclaración al módulo que corresponda; en V3, como máximo, enlazar una ampliación que vaya **más allá** del compromiso existente.
4. Si se detecta **fallo de seguridad o regresión P0/P1** del producto actual, registrarlo y corregirlo en la fase E0–E6 pertinente, **no esconderlo en V3**.
5. Anotar origen, evidencia y reutilización **sin afirmar que un componente escrito está operativo en producción**. Cualquier propuesta dependiente de funciones de IA, proveedor externo, pagos, datos personales o terceros necesita evaluación de viabilidad, protección de datos, riesgos y coste.
6. Una propuesta pasa de `CAPTURADA` a `CANDIDATA` solo en la **revisión V3 posterior a E6**; únicamente Dirección autoriza `APROBADA`, orden, presupuesto y nuevas PRs.
7. Cerrar una idea por `DESCARTADA` o `ABSORBIDA_EN_E0_E6` conserva su registro y justificación (no borrar historial de decisiones).

**Relación con documentación preexistente:** [auditoría E0](expert-kia-ecosystem-e0-audit-inventory-2026-10-10.md), [Admin V2](expert-admin-v2-plan-maestro-2026-10-09.md), [KIA 2.0](kia-2-strategy.md), [KIA Work](kia-workspace-execution-2026-10-09.md), [conciliación bancaria futura Holded](holded-banking-reconciliation-all-clients-backlog-2026-10-09.md), [Admin 360 compacto](admin-360-compact-redesign-backlog-2026-10-09.md) y PRs [#707](https://github.com/expert-servicios/expert-app/pull/707), [#708](https://github.com/expert-servicios/expert-app/pull/708), [#709](https://github.com/expert-servicios/expert-app/pull/709). **No duplicar sus desarrollos ya incluidos en E0–E6.**

## 1. Ficha normalizada, seguimiento y criterios de decisión

Para cada propuesta utilizar:

| Campo | Significado |
| --- | --- |
| `V3-XX` | ID permanente; nunca reciclar |
| Origen | `AUDITORÍA`, `DIRECCIÓN`, `PROPUESTA IA` o `DOCUMENTO PREVIO`; registrar fecha/evidencia |
| Descripción / usuario beneficiado | Problema real y resultado útil, sin vender una posibilidad como implementada |
| Reutilización comprobable | Módulos/tablas/docs existentes **sin crear un segundo núcleo, Inbox, ledger o CRM** |
| Coste y riesgo tentativos | `Bajo/Medio/Alto/Por estudiar`, más datos/consentimiento, permisos, regulación, dependencia técnica |
| Medida de éxito | Indicador/escenario de validación y criterio de descarte; no meramente «más IA» |
| Dependencia | E0–E6 concretos que han de estar operativos y verificados antes |
| Estado | `CAPTURADA`, `CANDIDATA`, `APROBADA`, `DESCARTADA`, `ABSORBIDA_EN_E0_E6`, `ENTREGADA` |
| Autorización | Solo `APROBADA` por Dirección habilita roadmap V3 y trabajo posterior a E6 |

**Priorización futura, no vinculante:** impacto operativo (1–5), ahorro semanal o conversión demostrable (1–5), grado de reutilización (1–5), complejidad (1–5), riesgo privacidad/fiscal/legal (1–5), coste recurrente medido, incertidumbre técnica y dependencia de proveedor. A mayor beneficio y reutilización, mejor; a mayor complejidad o riesgo, más pruebas antes de aceptar. No puntuar hoy como si existiera telemetría real.

**Estados iniciales:** todas las propuestas siguientes están `CAPTURADAS`, no `APROBADAS`. La columna «potencial» es solo una hipótesis, no un ROI calculado.

## 2. Banco inicial de propuestas V3 — crecimiento sobre lo ya construido

### V3-A — Inteligencia operativa avanzada y control profesional

| ID | Propuesta y valor hipotético | Base existente para reutilizar | Condiciones de validación posterior a E6 |
| --- | --- | --- | --- |
| **V3-01** | **Conciliación bancaria asistida multiempresa**: sugerir emparejamientos movimiento ↔ factura ↔ cobro/pago, identificar partidas ambiguas y preparar revisión humana en Company 360. **No** conciliar ni asentar silenciosamente. | `lib/integrations/holded.ts`, `kia-accounting-tools`, Company 360, ledger, [backlog bancario previo](holded-banking-reconciliation-all-clients-backlog-2026-10-09.md). | Confirmar APIs bancarias reales en tenants autorizados, contratos/consentimiento, exhaustividad y coste de matching, diferencias entre banco y Holded; piloto read-only con importes sintéticos. **Alcance extra:** reconciliación avanzada más allá del acceso financiero base E5. |
| **V3-02** | **Simulador contable-financiero «qué pasaría si»** para tesorería, cobros demorados, costes salariales e impuestos como *escenarios orientativos*. No emitir cálculo fiscal definitivo ni modificar contabilidad. | Lecturas Holded/E5, `kia-cost-tracker`, reportes y plantillas de documentos. | Definir fuente con sello temporal, parámetros, supuestos, variables, validación por asesor y error aceptable con datos sintéticos. |
| **V3-03** | **Motor de impacto normativo por cartera**: ante cambios de normativa oficial, sugerir qué servicios, expedientes, clientes y manuales requieren revisión sin comunicar obligaciones automáticamente. | `regulatory_sources/changes/dependencies`, corpus oficial, Inbox/tareas, hoja registral. | Tasa de falsos positivos, vigencia jurídica y verificación humana; cobertura exacta por territorio, fecha y norma. Es **más que** monitorizar/consultar fuentes E4. |
| **V3-04** | **Predicción de carga del despacho**: estimar semanas críticas por vencimientos, tareas, citas y cargas históricas, con sugerencia de asignación para el equipo. | `internal_tasks`, citas, calendario fiscal, Inbox 360, eventos del ledger. | Medir carga real vs estimada y permisos de equipo; evitar perfiles de productividad invasivos o decisiones laborales automatizadas. |
| **V3-05** | **Simulador de formación/QA de KIA**: banco de casos profesionales sintéticos ES/RU, juego de roles cliente–asesor y evaluación comparada de respuestas. | `tests/kia`, `kia-evals`, `kia-health`, skill router, corpus. | Aislamiento total de producción, pruebas sin datos reales, puntuación explicable y coste por evaluación. No equivale a desplegar agentes gestionados. |

### V3-B — Workspace y productividad ampliada

| ID | Propuesta y valor hipotético | Base existente para reutilizar | Condiciones de validación posterior a E6 |
| --- | --- | --- | --- |
| **V3-06** | **Constructor visual de procesos**, con plantillas de secuencias para expedientes/servicios (pasos, responsables, condiciones y verificaciones), siempre limitado a herramientas autorizadas. | `cases`, `internal_tasks`, KIA Work `workspace-actions`, acciones administrativas, bitácora. | Estándar de estados, simulación, rollback, versionado y control de quien publica procesos; prohibidos workflows sin aprobación para acciones sensibles. |
| **V3-07** | **PWA con captura offline segura**: apuntar una tarea o adjuntar una nota localmente en móvil sin conexión y sincronizarla tras recuperar red. | PWA existente, tareas/expedientes/documentos, Storage autorizado. | Amenaza de robo/pérdida de dispositivo, cifrado local, caducidad, sincronización idempotente y no almacenar expedientes sensibles sin protección adecuada. |
| **V3-08** | **Modo de revisión en lote**: revisar múltiples documentos, facturas o tareas desde una cola única con comparación y aprobar uno a uno o en lote cuando sea legal y seguro. | Listas compactas Admin, catálogo de acciones, vista documentos, Inbox y auditoría. | Alto riesgo de errores masivos: filtros/selección, diff, cancelación, límites por tenant, permisos y recuperación. Es ampliación sobre acciones individuales E2/E5. |
| **V3-09** | **Aprobaciones profesionales escalonadas**: revisión en dos niveles (operador → asesor → dirección), sustituciones justificadas y delegación temporal granular. | KIA Work preview/approval, roles, `audit_logs`, `administrative_actions`. | Matriz de responsabilidades, segregación de funciones, caducidad de poderes, notificaciones e idempotencia. No sustituir la aprobación base de E5. |
| **V3-10** | **Paquete probatorio exportable** por trámite o decisión: cronología, fuentes, versiones, aprobaciones, documentos referenciados e integridad verificable para revisión profesional. | Ledger, `audit_logs`, documentos, acciones administrativas, exportadores existentes. | Firma/sello opcionales solo si jurídicamente viables, control de datos sensibles, límites de acceso y cadena de custodia. |
| **V3-11** | **Centro de autoservicio de exportación y salida de tenant**: migración asistida/exportaciones completas por formato interoperable de clientes, documentos y configuración autorizada. | Tenant, compañía, perfiles, hoja registral, documentos, Stripe/Holded como fuentes externas. | Derechos de terceros y retención obligatoria, portabilidad RGPD, límites de capacidad, borrados selectivos y evidencias; **más allá** de exports de listas estándar E2/E6. |

### V3-C — Evolución técnica, integraciones y comercial

| ID | Propuesta y valor hipotético | Base existente para reutilizar | Condiciones de validación posterior a E6 |
| --- | --- | --- | --- |
| **V3-12** | **API externa limitada + webhooks de EXPERT** para integraciones desarrolladas por asesorías/clientes, con clave/scope por tenant, sandbox y registro de llamadas. | APIs Next.js, `connector_instances`, RLS, action registry, auditoría. | Threat model y API versioning, cuotas, idempotencia, revocación, protección de datos y modelo comercial. No abrir `service_role` ni endpoints internos al público. |
| **V3-13** | **Marketplace curado de adaptadores** (solo conectores con contrato y permisos) para programas de gestión más allá de Holded y de los proveedores E5. | `lib/integrations`, `connector_instances`, capability registry KIA. | Estudio por proveedor, compatibilidad, SLA, licencias, consentimiento y mantenimiento; no construir nuevos conectores ahora. |
| **V3-14** | **Entorno demo/sandbox aislado por asesoría** con datos ficticios para probar procesos, KIA y onboarding sin afectar clientes reales. | `tenants`, onboarding, pruebas de integración, snapshots sintéticos y pruebas KIA. | Coste por tenant, aislamiento fuerte y prohibición de copiar datos productivos; evaluar como producto, no confundir con staging técnico E0–E6. |
| **V3-15** | **Personalización avanzada multi-marca** de portales con temas, dominio propio, plantillas de comunicación y catálogo por asesoría (white-label). | Tenant branding/onboarding, `WorkspaceFrame`, header, catálogo, servicios. | Evitar duplicar core, revisión de identidad legal, pagos, email DNS, soporte y seguridad en dominios; más allá del design system compartido E2. |
| **V3-16** | **Optimización multivendedor de IA basada en evaluaciones reales**: selección adaptativa entre proveedores por dominio/idioma, rendimiento y coste, con umbrales de calidad. | `kia-provider-router`, `kia-evals`, `kia-cost-tracker`, `kia-health`. | Dataset sintético y consentimiento de uso, límites de presupuesto y residencia de datos, rollback del enrutador, sin degradar calidad en tareas fiscales. |
| **V3-17** | **Voice Pro y reuniones multilingües**: interpretación conversacional controlada, diarización, acta y tareas propuestas a partir de transcripción corregible. | KIA audio/voz ES/RU, Meet/Calendar, documentos, tareas. | Consentimiento explícito de participantes, retención, exactitud, interrupciones, costos y rechazo de atribuciones dudosas. No duplicar voz básica E4. |
| **V3-18** | **Growth Lab de experimentos medibles** sobre home, blog y CTAs: ensayos A/B con trazabilidad de consentimiento y conversión real a expediente, no solo clicks. | `AcquisitionTracker`, web/blog/SEO E1, lead → CRM → acción. | Mínimos estadísticos, legalidad de medición/cookies, no segmentación sensible, telemetría válida, rollback editorial. |
| **V3-19** | **Internacionalización adicional** con nuevos idiomas/jurisdicciones solo donde exista asesoría responsable y corpus/regulación verificable. | ES/RU, `kia-locale`, soporte i18n, marco multitenant y corpus. | Estudio de país, profesional habilitado, validación legal, costes de traducción y experiencia accesible. |

### V3-D — Calidad de servicio y relación de confianza

| ID | Propuesta y valor hipotético | Base existente para reutilizar | Condiciones de validación posterior a E6 |
| --- | --- | --- | --- |
| **V3-20** | **Panel de confianza para cliente/asesoría**: historial comprensible de qué acciones realizó KIA, con qué permiso, con qué fuente y quién confirmó, con políticas de retención visibles. | `audit_logs`, `kia_decision_logs`, hoja registral y autorización existente. | No revelar secretos/prompts internos, separación usuario/empresa/tenant, explicaciones verificables y accesibilidad. Extensión de la auditoría técnica E2/E6. |
| **V3-21** | **Centro de calidad de conocimiento** donde el profesional reporta referencias desactualizadas, propone revisión y compara la respuesta anterior/actual de KIA sin contaminar el corpus automático. | `regulatory_sources`, `kia_feedback`, `kia_auditor_reviews`, KIA knowledge. | Procedencia, revisión editorial de fuentes oficiales, trazas, versionado, prueba antes de publicar y control de quién puede corregir. |
| **V3-22** | **Asistente de migración desde herramientas antiguas**: importación guiada con mapeos y reporte de discrepancias para alta de asesorías (sin sobrescribir libros contables). | Migraciones Holded, `external_mappings`, `company_data_resolver`, documentos, onboarding. | Contratos de importadores, validación contable, rollback y consentimiento de exportación por proveedor. Es más que la conexión inicial E5. |

## 3. Distinguir lo ya aprobado de una propuesta verdaderamente V3

| Tema detectado durante auditoría | ¿Dónde debe vivir? | Regla para evitar duplicidades |
| --- | --- | --- |
| Corregir verificación registral falsa, acceso API de usuarios inactivos, RLS/grants, CIF duplicado | **E0, obligatoriamente** | Son defectos/controles necesarios, no propuestas V3. |
| Hero Ksenia + KIA, blog, categorías, SEO, CTAs ES/RU | **E1** | V3-18 solo experimentación estadística posterior, no rediseño actual. |
| Workspace compartido, dock único, Inbox 360, soporte sin suplantación, tareas | **E2** | V3-08/09/15 solo funciones avanzadas fuera del contrato E2. |
| Hoja registral con eventos, hechos, instrucciones, snapshots, permisos y procedencia | **E3** | V3-10/20 son experiencias avanzadas sobre datos consolidados. |
| KIA única, skills, fuentes oficiales, voz y adjuntos existentes, ES/RU | **E4** | V3-03/05/16/17 añaden productos/estudios de carácter avanzado. |
| Integrar Holded, correo, Calendar/Meet, Telegram, Docs y acciones supervisadas | **E5** | V3-01/12/13/22 van más allá de la paridad o integración base. |
| Consumo IA, gobierno de gasto, seguridad multi-tenant, piloto, acceso/precios aprobados | **E6** | V3-14/15/16/19 son nuevas líneas de producto, no exigencias del cierre. |
| Revisión de documentación o propuestas de PR #707/#708/#709 | **E0–E6 según módulo** | No duplicar como «nuevo proyecto V3» lo que ya está comprometido. |

## 4. Protocolo de captura continua (sin desviar la ejecución)

Cada vez que aparezca una idea:

1. **Registrar** fecha, persona/origen y vínculo al archivo, caso de uso, incidente o decisión que la motiva.
2. **Clasificar**: `BUG/SEGURIDAD EN ALCANCE` → Plan Maestro E0–E6; `MEJORA YA APROBADA` → módulo E0–E6; `ALCANCE NUEVO` → este documento con ID V3.
3. **Buscar reutilización** en `main`, documentos históricos, tablas, endpoints y pruebas. Indicar grado de evidencia: `comprobado` / `hipótesis`.
4. **Esbozar valor y coste**, alternativas menos complejas, dependencias, riesgos y criterio de aceptación **sin codear prototipo**.
5. **Guardar un commit documental** en la rama activa del Plan Maestro (si sigue abierta) o mediante la mínima propuesta exclusivamente documental ligada a este archivo; **no crear una PR de implementación V3**.
6. **Volver al checkpoint E0–E6** inmediatamente; ninguna idea V3 altera el paso siguiente ni abre una nueva fase.
7. Al terminar E6, auditar todas las ideas frente a lo realmente construido, eliminar duplicidades conceptuales, revalidar necesidades y seleccionar **con Dirección** cuáles merecen V3. La numeración anterior no implica orden de ejecución.

### Plantilla lista para nuevas propuestas

```markdown
#### V3-XX — Título breve
- Captura UTC y origen:
- Problema actual / beneficiario:
- Resultado propuesto (fuera de E0–E6):
- Evidencia: rutas/archivo/PR/observación validable:
- Componentes existentes que se pueden reutilizar:
- Diferencia explícita respecto al Plan Maestro E0–E6:
- Riesgos y privacidad/seguridad/consentimiento:
- Coste aproximado / dependencia externa: POR ESTUDIAR
- Hipótesis de valor / métrica / condición de descarte:
- Estado: CAPTURADA — NO APROBADA
- Decisión futura de Dirección: PENDIENTE
```

## 5. Índice de estado y bitácora V3

- **Propuestas iniciales:** V3-01 … V3-22 (22). **Todas `CAPTURADAS`, ninguna autorizada para desarrollo.** Al registrar una nueva usar V3-23 en adelante sin renumerar las existentes.
- **Duplicados absorbidos en el plan activo:** no marcados todavía; revisar solo al cierre de E6 o si una comparación objetiva demuestra solapamiento exacto.
- **Ideas descartadas:** ninguna.
- **Siguiente acción en este documento:** **solo registrar nuevas oportunidades con su evidencia**; ninguna validación/implementación V3 en fase E0.
- **Siguiente acción del proyecto principal (NO cambia):** continuar E0-M1-03 (auditoría y P1 de permisos/procedencia), luego E0-M1-04/05 y gates hasta E0 cerrado.

### 2026-10-10 — Apertura documental V3

- Dirección solicita un documento separado de **V3 futura**, donde anotar también propuestas de mejora del asistente que no encajen en el ecosistema aprobado.
- Se aportan **22 hipótesis** organizadas por inteligencia, Workspace, integraciones/comercial y calidad; se citan piezas ya presentes para reutilizar y se evitan duplicaciones de E0–E6.
- **Sin alteraciones de runtime, Supabase, Vercel, servicios conectados, datos financieros, roles, feature flags ni producto.** V3 permanece completamente bloqueada hasta cierre E6 y nueva decisión.
