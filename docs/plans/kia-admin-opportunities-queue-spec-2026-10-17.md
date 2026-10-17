# EXPERT Admin — Bandeja única de oportunidades KIA (especificación documental)

**Fecha:** 17/10/2026 · **Estado:** ESPECIFICACIÓN, NO IMPLEMENTADA · **Fase:** futura; E0 sigue activa.

**Jerarquía:** subordinada al [Plan Maestro E0–E6](../expert-kia-ecosystem-master-plan-2026-10-10.md), [Admin V2](../expert-admin-v2-plan-maestro-2026-10-09.md), [motor editorial único](../kia-commercial-editorial-opportunity-engine-2026-10-13.md), [Regulatory Registry](../kia-regulatory-registry.md), [matriz laboral/SEO](kia-labor-editorial-seo-opportunity-matrix-2026-10-17.md) y [propagación regulatoria](kia-regulatory-to-editorial-commercial-impact-2026-10-17.md). No propone un nuevo agente, panel de clientes ni plan de desarrollo prioritario.

## 1. Hallazgos del repositorio que deben guiar el diseño

| Elemento comprobado en \`main\` tras PR #799 | Qué existe | Integración propuesta sin duplicaciones |
| --- | --- | --- |
| \`app/(protected)/admin/editorial/page.tsx\`, \`components/admin/EditorialHubClient.tsx\` | Editorial Hub con tarjetas, estados, red social y calendario de publicación | La futura bandeja es **anterior** a crear una pieza social: solo enlaza o solicita borrador cuando se apruebe un destino |
| \`app/api/admin/editorial/route.ts\` | Consulta y PATCH de \`social_content_items\`; estados \`idea,draft,review,approved,scheduled,published,rejected\` y control de consentimiento | **No reutilizar este PATCH como aprobación jurídica/comercial**: el endpoint permite al Admin proponer un estado directamente, y \`scheduled_at\` puede marcar \`scheduled\`. Exigir máquina de estados, validación server-side por acción, revisión exacta y permisos adicionales antes de usarlo como salida de oportunidad |
| \`app/(protected)/admin/regulatory/page.tsx\`, \`app/api/admin/regulatory/route.ts\` | Regulatory Pulse con cambios pendientes, fuentes, health y operaciones humanas \`apply_values\` / \`resolve_change\` | Mostrar el cambio enlazado y su resolución, **no** replicar ni convertir \`resolve_change\` en «artículo aprobado» |
| \`lib/regulatory/regulatory-monitor.ts\`, \`lib/regulatory/regulatory-review.ts\` | Huellas, snapshots, \`regulatory_changes\`, revisión y dependencias | Consumir señales como hechos técnicos verificables; no rastrear dos veces la misma fuente |
| \`docs/expert-admin-v2-plan-maestro-2026-10-09.md\` | Admin/Client separados; Contactos 360, expedientes, CRM, permisos y Workspace | Propuesta de vista Admin; cualquier enlace a caso privado usa guardia por actor/tenant/company/case |
| \`components/admin/AdminSidebar.tsx\` | Marketing incluye «Editorial» y «Regulatory Pulse»; Operaciones incluye bandeja operativa | Añadir una opción **futura** «Oportunidades KIA» en Marketing o como vista dentro del Editorial Hub; no modificar el menú ahora ni crear segunda «bandeja operativa» |
| \`docs/kia-commercial-editorial-opportunity-engine-2026-10-13.md\` | Flujo de señal a publicación, reutilización de KIA y Editorial Hub | La nueva interfaz es **proyección de revisión** del mismo motor; no redefinir fuentes ni estados canónicos |

**Riesgo de integración prioritario:** el estado \`approved\` de una pieza de redes sociales y la decisión \`approved\` de una oportunidad editorial/jurídica **son autorizaciones diferentes**. No mapear uno a otro de manera automática. Un check visual o el rol «admin» en frontend no son autorización suficiente.

## 2. Objetivo de negocio y alcance

**Pregunta diaria a resolver:** «¿Qué hechos o necesidades verificadas merecen actuación, qué contenido/servicio ya existe, quién debe decidir y qué ha ocurrido después?».

La cola agrupa:
- Cambios normativos con recurso afectado **demostrado**.
- Hallazgos profesionales aptos para reutilización **desidentificada**.
- Preguntas frecuentes y lagunas verificadas de contenido ES/RU.
- Oportunidades de mejora de servicios/herramientas/Academy.
- Incidencias de SEO técnico comprobadas.
- Reclamaciones de contenido, correcciones jurídicas y seguimiento de resultados.

**Exclusiones:** no incluir en la cola pública expediente, contrato, nómina, historial médico, datos bancarios, credenciales o identidad del cliente; no convertir leads privados en recursos editoriales consultables por Marketing. Tareas puramente operativas siguen en Operaciones; la cola comercial/SEO contiene solo propuestas y referencias desidentificadas.

## 3. Estructura de la experiencia de escritorio y móvil (diseño futuro)

Propuesta de navegación: \`Admin → Marketing → Oportunidades KIA\`, como subvista/tab de Editorial Hub o futura ruta \`/admin/oportunidades\` **no existente ni reservada hoy**. No añadir un segundo producto ni ruta pública.

### 3.1 Cabecera

Indicadores, **solo si hay datos reales**, con título, fecha/hora de última actualización y enlace al filtro:
- «Acción urgente verificada», «Pendientes de revisión jurídica», «Pendientes de contenido ES/RU», «Servicios por evaluar», «Duplicados descartados», «Resultados validados».
- Nunca presentar conteos «0» en caso de fallo de consulta; indicar «No disponible / falta conexión».
- Separar «pendientes sin owner» y «fuentes con error» de «no hay cambios».

### 3.2 Bandeja única

| Columna de tarjeta / fila | Información concreta | Interacción |
| --- | --- | --- |
| Tipo | Normativa, auditoría anonimizada, consulta agrupada, SEO, catálogo, PRL, Academy | Filtro |
| Título / pregunta | ¿Qué problema resuelve?, sin dato del cliente | Abrir detalle |
| Situación | Nuevo, verificando, duplicado, listo para propuesta, pendiente de decisión, bloqueado, cerrado | Ver motivo y trazabilidad |
| Riesgo y urgencia | P0 legal actual, P1 operación, P2 contenido, P3 hipótesis | Ordenar sin inventar impacto económico |
| Fuente y vigencia | Organismo, norma/artículo, fecha publicación, vigor, ámbito | Fuente oficial y diff |
| Recurso afectado | Servicio/URL/FAQ/guía/curso/calculadora/KIA | Abrir recurso canónico |
| Idiomas y SEO | ES/RU, canonical, noindex, hreflang, deuda comprobada | Abrir QA |
| Responsable y siguiente paso | Actor asignado, fecha acordada o disparador, revisión obligatoria | Asignar si permitido |
| Estado de control | Fuente, jurídico, privacidad, SEO, traducción, negocio | Ver cada gate, no un único «verde» |
| Resultado | Actualizado, rechazado, aprobado, duplicado, sin efecto, pendiente | Abrir historia |

**Filtros útiles:** mis pendientes, sin responsable, por fecha de vigencia, por materia, severidad, fuente, estado, idioma, tipo de salida, empresa/tenant **solo en vista privada autorizada**, contenido publicado/no publicado, servicio existente, fuente caída, revalidación próxima. Búsqueda limitada a campos editoriales: impedir búsqueda cruzada de clientes.

### 3.3 Panel lateral de detalle

1. **Resumen KIA:** «Qué detectó / por qué puede importar / qué NO está acreditado / qué propone». Declarar claramente \`AI_SUGGESTED\` frente a \`HUMAN_VERIFIED\`.
2. **Evidencia y fechas:** fuente primaria, snapshot, artículo/epígrafe, fecha de publicación, entrada en vigor, transitorios, ámbito y último control.
3. **Antes / después:** comparación del texto/criterio del recurso vinculado, versiones reales, contenido exacto afectado.
4. **Duplicados:** coincidencias con contenido publicado, borrador, CMS, Docs, Academy, servicio y PR; sugerencia de **actualizar**, no crear URL en paralelo.
5. **Impacto sugerido:** pestañas «KIA», «Blog/Docs/FAQ», «Servicio», «Herramienta», «Curso», «SEO» y «Posible actuación individual» **privada** si procede. Cada destino debe poder marcarse «no procede».
6. **Responsables y decisiones:** revisión legal, editorial, SEO, privacidad, RU y negocio; decisión, motivación y firma/auditoría de actor real.
7. **Historial:** evento, antes/después, revisión exacta, timestamp, fuente y verificación posterior.
8. **Acciones permitidas:** «Necesita fuente», «Asignar revisión», «Marcar duplicado», «Preparar borrador», «Enviar a revisión», «Rechazar motivadamente»; botones de publicar, campaña, modificar valor/cálculo o servicio **no aparecen** en fase no habilitada.

### 3.4 Móvil y accesibilidad

- Tarjetas verticales con título, urgencia, actor, vigencia y «Abrir detalle».
- Evitar tablas anchas y acciones destructivas sin confirmación; textos comprensibles, indicadores no dependientes del color.
- Vista previa de diff accesible, enlaces oficiales verificables y estado siempre legible.
- No exponer datos privados en push, metatítulos, previsualizaciones, registros o enlaces compartidos.

## 4. Dos ejes de estado: decisión de oportunidad vs ejecución editorial

### 4.1 Eje de oportunidad (solo especificación)

\`signal → triaged → verified → proposed → drafted → approved → closed\`; alternativas \`needs_review\`, \`duplicate\`, \`rejected\`, \`no_action\`, \`blocked\`.

**Mapa al motor existente:** conservar los estados ya definidos en el motor editorial; \`duplicate\`, \`no_action\`, \`blocked\` y \`closed\` pueden ser **outcomes/razones**, no nuevos estados persistidos obligatorios. Decidir el mapeo sobre el esquema real antes de crear migraciones.

**Importante:** «aprobada la propuesta» ≠ «aprobado el contenido» ≠ «autorizado el precio» ≠ «publicado». El estado de cada destino exige control propio. Una propuesta puede cerrarse «sin acción» aunque el cambio regulatorio siga en revisión, y viceversa.

### 4.2 Eje de entrega

- **Editorial:** preparar/revisar borrador → aprobar contenido con versión exacta → despliegue/publicación autorizada → readback HTTP/SEO; si es social, enlazar a Editorial Hub existente.
- **Jurídico y valores:** resolver cambio regulatorio y aplicar valores únicamente mediante sus flujos humanos propios; no vía CTA SEO.
- **Servicio y precios:** evaluación comercial → revisión jurídica/competencia → decisión Dirección → ficha comercial/checkout mediante procesos de catálogo autorizados; no autoconvertir.
- **Clientes y tareas:** si un cambio afecta a expediente identificado con permiso, generar propuesta de tarea en entorno privado, distinta del evento editorial; no enviar comunicación automática.

**Guardia obligatoria futura:** endpoints que admitan cambios de estado genéricos (p. ej., \`PATCH /api/admin/editorial\`) no sustituyen una máquina de decisiones validada por servidor, control de actor exacto activo, permiso específico, CSRF/protecciones pertinentes, concurrencia/versionado y registro de auditores. En las pruebas negativas se deberá cubrir \`scheduled_at\` como vía alternativa y evitar transiciones no autorizadas.

## 5. Modelo de datos lógico — solo campos, no migración

**Preferencia:** proyección read-only/agregación de registros existentes en el primer MVP aprobado; no crear duplicados de \`regulatory_changes\`, \`social_content_items\`, CRM o \`internal_tasks\`.

| Entidad lógica candidata | Identificador y procedencia | Atributos para interfaz |
| --- | --- | --- |
| Señal/impacto | \`source_kind, source_id/change_id, event_version\` | origen, hechos, fecha, vigencia, confianza, clasificación |
| Propuesta vinculada | \`opportunity_id\` estable o clave determinista; \`resource_type + resource_key + locale\` | intención, salida, propuesta de actualización, prioridad, dependencias y decisión |
| Revisión | \`review_id + proposed_version/sha + reviewer\` | check legal, SEO, privacidad, RU, editorial, negocio, timestamps y motivo |
| Asignación | \`assigned_actor_id + role + expected_review_at?\` | responsable real y plazo/condición expresamente acordado |
| Historial | \`event_id, actor_id, decision, before/after, timestamp, source_version\` | trazabilidad inmutable compatible con auditoría ya existente |
| Entrega | \`target_kind + target_id/url + version + outcome\` | borrador, URL real, commit/PR, estado y pruebas post-publicación |
| Aviso | \`alert_dedupe_key + recipient + class + last_event\` | digest/urgente, leída, reintento, no datos personales |

**No hay confirmación de que todas estas entidades/tablas existan.** Se especifican para verificar solapamientos y diseñar contratos mínimos tras autorización. Cualquier nueva tabla requiere RLS/grants, control tenant, migración revisada, Security Advisor y rollback. La proyección debe garantizar que eliminar un expediente privado no deja metadatos reconstruibles en la vista editorial.

**Clave de deduplicación sugerida:** \`change_id + resource_type + canonical_resource_id + locale + outcome_kind\`, con agrupación semántica revisada y versionado por \`source_fingerprint\`. Dos cambios oficiales relacionados pueden mantener historial separado y una única actualización de contenido; no perder las referencias de ninguno.

## 6. Matriz de permisos para discutir y validar antes de desarrollar

| Perfil conceptual | Ver propuesta desidentificada | Asignar/descartar | Validar legal | Autorizar precio/servicio | Publicar |
| --- | --- | --- | --- | --- | --- |
| Dirección / owner activo | Sí | Sí | Solo si dispone de competencia designada; no por rol informático | Sí, con checklist | Autoriza liberación, no omite otras revisiones |
| Profesional jurídico-laboral/fiscal designado | Sí, en su ámbito | Proponer | Sí, en su materia | Recomendar, no decidir importes | No |
| Editor/SEO | Sí | Proponer | No | No | Preparar; no ejecutar sin gate |
| Responsable de privacidad | Sí, sin datos clínicos ni PII innecesaria | Bloquear por privacidad | No sustituye revisión de norma | No | Veto cuando corresponde |
| KIA/automatismo | Solo datos y fuentes autorizados | Sugerir sin persistir autorización | No | No | Nunca |
| Cliente, lead, tenant_admin o usuario sin permiso Admin | No | No | No | No | No |

**Permisos por servidor**, independientemente de UI. Verificar actor \`exact-active\`, tenant y alcance por objeto **antes** de usar \`service_role\` o proveedores. No reusar una sesión de cliente, ni suplantar identidad mediante Admin. El perfil «editor» o «jurídico» aquí es **futuro/funcional**, no evidencia de roles ya implementados. Una persona puede reunir varios perfiles profesionales, pero la aprobación independiente exigida por riesgo no se suprime por tener varios roles.

## 7. Notificaciones útiles, sin ruido ni divulgación

- **P0 normativo:** aviso priorizado a responsable designado solo tras comprobar cambio + recurso afectado + vigencia y no por simple RSS; si todavía no está verificado, aviso de «revisión urgente», no de «incumplimiento confirmado».
- **Revisión pendiente:** digest agrupado y filtrado por responsable, cambios desde último aviso y disparador claro; no mensaje por cada paso de KIA.
- **Decisión de Dirección:** aviso únicamente si hay una propuesta comercial o publicación lista con todas las revisiones aplicables; nunca requerir aprobación por cada borrador automático.
- **Cambios de estado:** notificación silenciosa dentro de Admin salvo asignación humana, vencimiento explícito, fallo relevante o aprobación pendiente.
- **Privacidad:** push/Telegram/email con tipo, nivel, referencia segura y enlace interno, **sin nombres de empleados, salarios, CIF, expedientes, archivos, secretos, textos clínicos ni URLs privadas reutilizables**.
- **Idempotencia:** alerta deduplicada por evento/versión/destino/destinatario; evitar duplicar en Telegram y push la misma incidencia salvo preferencia o criticidad definida.
- **Inactivo/cerrado:** no reabrir porque una huella de HTML cambie sin cambio sustantivo; reabrir si norma/fuente/versionado lo justifica.

No crear crons, automatizaciones, nuevas notificaciones ni comunicación con usuarios desde este documento.

## 8. Diseño del primer MVP futuro y orden prudente

**MVP-0 (exclusivamente documentación actual):** esta especificación; inventario de campos/estados/permisos y cinco casos sintéticos, sin UI, tablas o APIs.

**MVP-1 (solo tras gate E0/autorización de fase):** vista de lectura, filtros y detalles de cambios regulatorios y de propuestas existentes **sin writes**; accesos sólo Admin autorizados, rechazo intertenant, links internos controlados, estados \`NO_DATOS\` vs \`SIN_RESULTADOS\`.

**MVP-2:** asignar revisión y decisiones con auditoría inmutable, idempotencia, responsables y máquina de estados. Implementación mínima, sin publicación; revisión de rol, fuente e historial exactos.

**MVP-3:** proyección al Editorial Hub, catálogo/servicio, Docs y Academy como **borradores**. Sin paso directo a aprobado, scheduled o published ni elevación de privilegios.

**MVP-4:** gates de publicación/SEO, validación ES/RU y medidas de resultado; workflow separado de autorización y rollback. No iniciar sin pruebas de autorización, privacidad, CI, previews y aprobación profesional.

La secuencia MVP es **conceptual**, no inaugura fases que el Plan Maestro mantiene bloqueadas.

## 9. Criterios de aceptación y pruebas negativas

1. Un RSS cambia su cabecera y no la norma: ninguna propuesta nueva ni aviso P0.
2. Fuente sin baseline o en error: estado «sin verificar», no «todo actualizado».
3. Cambio jurídicamente relevante sin norma primaria o fecha: \`needs_review\`; botón de aprobar indisponible y denegado server-side.
4. Fuente con norma provincial y artículo general: no afectar cliente/recurso fuera de provincia por coincidencia textual.
5. Dos cambios sobre la misma guía: agrupar acciones, conservar ambas fuentes y sus versiones.
6. Hay artículo canónico existente: proponer actualización, no crear slug duplicado.
7. Un editor intenta aprobar cambio legal o fijar precio: 403 y evento de auditoría, no solo botón oculto.
8. KIA intenta aprobar su propio borrador o lanzar publicación: 403; no hay autoaprobación.
9. Se presenta un \`status=published\` directo a endpoint/editorial genérico: propuesta no debe derivar en publicación; bloquear transiciones sin autorización del recurso.
10. Se presenta \`scheduled_at\` para forzar \`scheduled\`: denegar bypass; no programar sin gates.
11. Un usuario con rol Admin pero \`status\` distinto de \`active\`: acceso denegado antes de consulta admin/service role.
12. Admin de tenant A intenta consultar propuesta privada de tenant B: 403/404 sin detalles.
13. Cambio de empresa en Admin: invalidar caché y contexto de las tareas privadas; oportunidad pública desidentificada permanece independiente.
14. Caso laboral incluye nómina/nombre/CIF/salario o combinación reidentificable: rechazar paso a cola editorial.
15. Versión RU no revisada o \`noindex\`: no crear hreflang/publicación RU.
16. Fuente verificada pero sin permiso de publicar: proponer diff, no ejecutar código.
17. El resultado de un cálculo fiscal/laboral cambia: QA por ejercicio, fuente y simulación antes de tocar valores canónicos.
18. Servicio nuevo propuesto sin precio aprobado: permanece en borrador, sin checkout/pago.
19. Aprobación relativa a versión antigua: revocada o revalidada cuando cambia el diff/fuente.
20. Última consulta API fallida: UI dice «No disponible» y conserva la fecha conocida, nunca 0 pendientes.
21. El mismo aviso llega dos veces al worker: una sola tarjeta/aviso deduplicado y dos eventos trazados si procede.
22. Aprobación en Admin no implica que el artículo exista en web o esté indexado: \`NO_PUBLICADO\` hasta readback y \`SEO_NO_MEDIDO\` sin GSC.
23. Un cliente intenta visitar la futura ruta \`/admin/oportunidades\`: 403.
24. Resultado de un caso genera propuesta editorial: sólo hipótesis desidentificada, con aprobación de reutilización de fuente y prueba de reidentificación.

## 10. Indicadores y gobernanza

**Indicadores a medir solo tras datos reales:** nuevas propuestas con evidencia, duplicados evitados, pendiente sin responsable, días desde detección a revisión jurídica, revisiones caducadas, correcciones normativas cerradas, artículos actualizados (no solo creados), paridad ES/RU verificada, gates bloqueados, avisos útiles, solicitudes voluntarias de consulta y facturación atribuible conforme a analítica lícita.

Distinguir backlog (propuestas) de resultados: ninguna métrica de tráfico significa calidad jurídica, ninguna apertura de correo demuestra contratación, y la clasificación \`published\` no sustituye al readback público.

**Responsabilidad futura:** dueño de producto y legal definen reglas, SEO garantiza descubrimiento honesto, privacidad define tratamiento, ingeniería garantiza identidad y trazabilidad, Dirección acepta precios/publicación de servicios. Evitar objetivos cuantitativos ficticios y SLA rígidos sin capacidad asignada.

## 11. Decisiones de Dirección que siguen pendientes

- Forma final de navegación: pestaña en Editorial Hub o ruta Admin propia enlazada; por defecto proponer pestaña/hub unificado, no producto nuevo.
- Matriz formal de actores y roles, autorizaciones independientes y quién cubre cada revisión.
- Línea base de datos real de registro normativo, contenido CMS, CRM, agenda y eventos, más coste de operación.
- Alcance de alertas (solo urgentes + digest) y canal preferido por actor.
- Política jurídica y RGPD para reutilización de aprendizajes profesionales, conservación y borrado.
- Momento autorizado para pasar del documento a MVP tras gates E0–E6, presupuesto y prioridad.

**Restricción final:** ningún endpoint, UI, cron, permiso, regla RLS, tabla, migración, webhook, promesa comercial, precio, publicación, envío o autopromoción queda aprobado por la mera existencia de esta especificación. El checkpoint de implementación **E0-M3-06** permanece inalterado.
