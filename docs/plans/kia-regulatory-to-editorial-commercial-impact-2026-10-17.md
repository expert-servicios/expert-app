# KIA — Del cambio normativo a conocimiento, servicios y SEO (diseño documental)

**Fecha:** 17/10/2026. **Estado:** DISEÑO / SIN IMPLEMENTACIÓN. Subordinado al [Plan Maestro E0–E6](../expert-kia-ecosystem-master-plan-2026-10-10.md), a la [matriz laboral H4](kia-labor-editorial-seo-opportunity-matrix-2026-10-17.md) y al [motor editorial único](../kia-commercial-editorial-opportunity-engine-2026-10-13.md). No es un nuevo plan rector ni un segundo agente.

**Mandato:** aprovechar una misma evidencia oficial revisada para (a) corregir una respuesta KIA, (b) actualizar procedimientos de trabajo, (c) detectar contenido desactualizado, (d) proponer blog/Docs/FAQ/Academy ES/RU, (e) valorar fichas de servicio, formación o herramienta, y (f) registrar oportunamente las obligaciones reales que afectan a clientes autorizados. **Cada destino tiene permisos y aprobación independientes; nunca se ejecutan todos por defecto.**

## 1. Auditoría del patrimonio existente (verificado en código / sin afirmar operación real)

| Pieza verificable en repo | Capacidad que aporta | Límites que no debemos ocultar |
| --- | --- | --- |
| [Registro regulatorio](../kia-regulatory-registry.md) | Arquitectura y tipos ya definidos: fuentes, snapshots/huellas, cambios, dependencias, valores, revisiones y reglas de bloqueo | El documento declara v1.1; su existencia no prueba que todas las fuentes, jobs y conexiones funcionen hoy sin errores |
| \`lib/regulatory/regulatory-monitor.ts\` | Consultar solo fuentes autorizadas; registrar baseline, huella, cambio y estado \`detected\` | Una variación de HTML o RSS no equivale a norma nueva ni cambio jurídico |
| \`lib/regulatory/regulatory-review.ts\` | Clasificación estructurada de gravedad, efecto, fecha, dependencias y propuestas; revisión humana | Clasificación por IA no equivale a interpretación profesional ni modificación automática de valor/catálogo |
| \`lib/regulatory/regulatory-values.ts\` | Consultar indicadores canónicos versionados; aplicar propuestas revisadas | No reescribir datos previos, fechas ni cálculos sobre supuestos; evitar conflictos de vigencia |
| \`lib/regulatory/regulatory-audit.ts\` y \`app/api/cron/regulatory-monthly-audit/route.ts\` | Auditoría de salud de fuentes/ejecuciones; informe administrativo | Debe verificarse programación real, fuentes activas, permisos y resultados del último run antes de confiar en cobertura |
| \`lib/ai/kia/kia-knowledge-discovery.ts\` | Búsqueda en artículos, Docs, servicios y referencias regulatorias | Recuperación existente no demuestra inventario exhaustivo ni paridad con todas las publicaciones CMS |
| \`lib/utils/blog.ts\`, \`lib/utils/docs.ts\`, \`lib/utils/catalog.ts\`, \`app/sitemap.ts\` | Parte del inventario público y descubrimiento de recursos | Combinar con \`blog_posts\`, Academy, rutas independientes y estado de indexación real |
| [Motor de oportunidades](../kia-commercial-editorial-opportunity-engine-2026-10-13.md) | Flujo \`signal → triaged → verified → proposed → drafted → approved → published\` | Es diseño de coordinación; no asumir canal Editorial Hub o autopublicación ya habilitados |
| [Auditoría de SEO #796](https://github.com/expert-servicios/expert-app/issues/796) | Deficiencias de descubrimiento ES/RU y sitemap pendientes | PR funcional #798 queda draft; la nueva documentación no autoriza fusionarla |

**Brecha a cubrir:** el registro relaciona fuentes y dependencias, pero se necesita una especificación **por recurso afectado y versión exacta** para transformar impacto normativo en un *diff* editorial y una acción comercial opcional. No crear un duplicado de \`regulatory_changes\`; añadir una proyección lógica/cola de propuestas únicamente en una fase autorizada, previa comparación del esquema real.

## 2. Matriz transversal de ámbitos y destinos

Los siguientes son **escenarios hipotéticos para diseñar reglas**, no anuncios de cambios legales vigentes ni afirmaciones de que KIA ya los haya detectado.

| Ámbito | Señal oficial a vigilar | Reutilización editorial / profesional | Servicio o herramienta a valorar | Gate específico |
| --- | --- | --- | --- | --- |
| Fiscalidad empresas/autónomos | AEAT/BOE: plazos, modelos, regímenes, deducciones y tipos | Guías IRPF/IS/IVA/IRNR, FAQs, calculadoras de honorarios, calendario fiscal, instrucciones KIA | Consultas puntuales, declaraciones, revisión de obligaciones | Norma por ejercicio; obligaciones y fechas sin confundir con marketing |
| Facturación electrónica / VeriFactu | AEAT y BOE: obligaciones, formatos, calendario y transitorias | Separar requisitos de software, registros y facturación entre empresas; actualizar fichas y FAQs | Implantación, revisión de facturación y formación | No confundir facturación electrónica B2B con VeriFactu ni fijar fecha sin fuente |
| Constitución SL / CIRCE / Crea y Crece | BOE, PAE/CIRCE, Registro Mercantil y guías oficiales | Actualizar comparativa autónomo/SL, pasos de constitución, documentación y FAQ ES/RU; reutilizar PR #783 | Constitución asistida, formación y certificados digitales | Resolver discrepancias de precios antes de comunicar oferta |
| Laboral y Seguridad Social | BOE, TGSS/RED, SEPE y convenios oficialmente publicados | Matriz LAB-01…LAB-10, Academy Holded y procedimientos internos | Auditoría laboral, revisión jornada, formación y eventual simulador | Centro real, convenio, año, salario vs cotización; V3-24 tras E6 |
| Administradores y familiares | BOE, LGSS/TGSS y AEAT | Checklist de encuadramiento y fiscalidad; guía de preguntas antes de recomendar | Consulta profesional mercantil-fiscal-laboral | Sin inferencias por parentesco, convivencia o cargo aislados |
| Protección de datos | AEPD, EDPB, normativa vigente | Actualización de política, primera capa, auditoría de consentimientos, formación, RGPD gratuito | Evaluación/asesoría por alcance, formación aprobada | Clasificación responsable/encargado, DPA, RAT, retención; no tratar salud |
| No residentes y extranjeros | AEAT, BOE, Migraciones y Administración competente | IRNR, residencia, constitución por extranjeros, NIF/NIE y certificados | Trámites y consultas; precios solo los del catálogo validado | Derechos/condiciones individuales; si fuente HTTP 403, revisión humana |
| Arrendamientos e inmuebles | BOE, autonomías, ayuntamientos, Catastro y tributos locales | Guías impuestos, fianzas, residuos, contratos, trámites y responsabilidades | Gestiones puntuales y revisión documental | Municipio y comunidad correctos; no confundir ordenanza local con norma estatal |
| Turismo, hostelería y PRL | Convenios BOP, calendarios locales, turismo autonómico, INSST | Guías de horarios, festivos, categorías, turismo y seguridad preventiva | Diagnósticos documentales y derivación técnica acreditada | Competencias, establecimiento, actividad y localidad efectivos |
| Gestión empresarial/Academy/Holded | Docs oficiales del proveedor + normativa relevante | Actualizar procedimientos y cursos sin mezclar prestaciones de API con funciones UI | Formación e implantación según oferta existente | Cambios de producto ≠ cambios legales; validar disponibilidad real de API |

**Regla:** cada impacto debe poder quedarse en "informativo / no accionable" y no generar artículo, precio, producto ni solicitud a cliente cuando no aporte valor específico.

## 3. Especificación del motor de propagación *propuesto*

### 3.1 Fase de detección, análisis y atribución

1. \`source_key\` verificada → snapshot previo/nuevo; fingerprint real.
2. Cambios \`detected\` se clasifican por worker existente; cualquier error, fuente caída, bloqueo HTTP o falta de baseline produce advertencia, **no** presunción de «normativa sin cambios».
3. El revisor confirma el documento completo (no solo extractos), autoridad, artículos y contenido modificado. Registrar nivel de confianza y el motivo; evitar prompt injection desde documentos HTML.
4. **Resolver temporalidad:** \`published_at\`, \`announced_at\` si existe, \`effective_from\`, \`effective_to\`, \`transitional\`, \`tax_period\`, \`applicable_to\`. Fechas ausentes permanecen \`needs_review\`; no copiar \`fetched_at\` como fecha de entrada en vigor.
5. **Calificar el tipo:** sin efecto / editorial / operativo / cálculo / servicio / crítico, con prioridad y evidencia.
6. \`regulatory_change_dependencies\`: cruzar *solo* dependencias explícitas a \`service\`, \`blog\`, \`knowledge\`, \`calculator\`, \`course\`, \`seo\`, \`kia_prompt\` y demás tipos existentes. Si no existe relación verificada, proponerla para revisión, nunca asumirla por coincidencia de palabras.
7. Obtener inventario versionado del recurso, actual y futuro, con URLs reales, idioma, propietario editorial, estado de publicación, fuente original y revisor.
8. Elaborar impacto por destino: \`no_action\`, \`verify\`, \`update_existing\`, \`draft_new\`, \`block_promotion\` o \`refer_to_client_case\` (esta última **solo** dentro de entorno privado y permisos).
9. Preparar diferencia de información: «antes decía», «ahora debe explicar», «según norma/artículo», «a partir de cuándo», «qué no cambia», y cómo comunicar la corrección.
10. Pasar revisión jurídica/privacidad/SEO/comercial correspondiente. Publicación, envío, cambio de configuración, precio, cálculo y ejecución de trámites son **decisiones y permisos separados**.

### 3.2 Contrato lógico de la propuesta (NO crear tabla ni API ahora)

- Identificación: \`change_id\` (ID existente), \`source_key\`, \`snapshot_fingerprint\`, \`resource_type\`, \`resource_key\`, \`locale\`, \`proposal_kind\`, \`schema_version\`.
- Prueba: URL primaria autorizada, documento y artículo, acto publicado, copia/huella si procede, fecha de consulta y verificación profesional, citas con versión.
- Efecto: anterior vs nuevo, aplicabilidad por ejercicio/territorio/tipo de usuario, fecha real de entrada en vigor, transitorio y excepciones; no generalizar un cambio local.
- Presentación: título, resumen de cambios, fichero/URL canónica, enlaces a servicios actuales, CTA opcional, ES/RU QA, autor y revisores.
- Riesgo: \`legal_uncertainty\`, \`reidentification\`, \`privacy_gate\`, \`source_staleness\`, \`translation_gate\`, \`sitemap_gate\`, \`approval_required\`.
- Estado y evidencia: reutilizar estados del motor editorial, diff aprobado exacto, SHA/versión, consentimiento cuando aplique, rollback y fecha de nueva revisión.
- Idempotencia recomendada: **una candidatura por** \`change_id + resource_type + resource_key + locale + proposal_kind\`; verificar equivalencias semánticas entre \`change_id\` distintos. Cambiar solo el HTML de cabecera nunca genera una nueva propuesta.
- Consistencia: fecha normativa de entrada en vigor **independiente** de \`lastModified\` del contenido editorial; fecha de publicación original distinta de fecha de revisión.
- Trazabilidad de cliente: identificador/relación privada solo en hoja registral/CRM tras control de tenant, expediente y legitimación. No incrustar en documento público.

### 3.3 Estados de impacto y comunicación

| Estado | KIA puede preparar | KIA no puede realizar |
| --- | --- | --- |
| Sin cambio / irrelevante | Registro auditable «sin novedad sustantiva» | Mensajes masivos, duplicados SEO o publicación cosmética |
| Cambio normativo posible | Propuesta con fuente, afectación y dudas | Declarar obligación vigente o sanción sin verificar |
| Cambio verificado pendiente de fecha | Borrador con aviso de futuro/transitoria | Aplicar regla antes de su vigencia |
| Cambio verificado vigente | Diff de guía, preguntas, checklist, formación, calculadora o servicio | Reemplazar datos canónicos o publicar sin aprobación |
| Cambio crítico sobre recurso identificado | Aviso prioritario al responsable y **bloqueo de promoción solo si la dependencia es explícita** | Despublicar todo el sitio o parar servicios no afectados |
| Corrección validada | Propuesta de aprobación por recurso y enlace a evidencias | Enviar a clientes, presentar trámites, liquidar nóminas o cambiar tarifas automáticamente |

## 4. Palancas de máximo aprovechamiento con mínima duplicación

Una noticia/acto oficial **puede** generar varias propuestas complementarias, pero solo si cada pieza añade función o destinatario distintos:

1. **KIA interna:** nota de criterio jurídico versionado, respuesta ES/RU y preguntas obligatorias para no asumir hechos.
2. **Hoja registral:** tarea sugerida al responsable si un cliente autorizado y su expediente encajan realmente; revisión individual y contacto solo con autorización. La empresa no se deduce de una palabra clave.
3. **Cliente:** borrador de comunicación específico y prudente con «qué cambia / a quién / desde cuándo / qué verificar». Nunca envío autónomo.
4. **Web pública:** preferir actualizar URL existente, sumar tabla de cambios con fecha real y FAQ útil, fuente y CTA apropiada.
5. **Academy:** actualizar capítulo, ejemplo sintético, test de conocimientos y glosario RU si el cambio afecta al programa.
6. **Herramientas y calculadoras:** abrir revisión técnica de regla y tests versionados; no alterar cálculos, precio o resultado sin validación.
7. **Oferta comercial:** estudio de servicio puntual, preguntas de intake, alcance, coste, dependencias y métrica de utilidad; **no** autoalta en Stripe/catálogo.
8. **SEO técnico:** enlazado interno y auditoría de canonical/hreflang/robots/sitemap solo al publicar contenido indexable aprobado. Google no indexa automáticamente por cambiar una huella.
9. **Vigilancia:** tarea de revisión futura cuando se acerque entrada en vigor **solo si norma y calendario están confirmados**; caducidad reabre la evaluación de documentos afectados.

**Antiduplicación por familia de recurso:** una actualización del convenio no genera automáticamente una landing por cada centro de trabajo ni un artículo por cada municipio. El calendario local alimenta el análisis caso a caso; el contenido general explica la metodología y enlaza a la normativa territorial.

## 5. Prioridad de trabajo y retorno esperado (sin puntuaciones inventadas)

**Regla de clasificación:**
- **Urgente jurídico (P0):** obligación vigente o inminente verificada que puede inducir error grave en un servicio o cálculo existente; responsable y recurso afectados identificados. No esperar a una evaluación SEO.
- **P1 servicio actual:** error desactualizado en pieza operativa o comercial utilizada, con fuente primaria y riesgo real.
- **P2 mantenimiento:** actualizar contenido canónico bien posicionado/utilizado o de alto valor para usuarios; priorizar solo con inventario y medidas reales.
- **P3 nueva oportunidad:** propuesta editorial, herramienta, curso o servicio sin evidencia suficiente de demanda o capacidad actual.

**Modelo comparativo de valor esperado** (aplicable por humano, sin asignar coeficientes ficticios):
\`beneficio esperado = reducción de riesgo jurídico + utilidad de clientes + demanda comprobable + posibilidad de servicio compatible - coste de revisión/mantenimiento - riesgo de privacidad\`.
Separar **confianza en la fuente** y **aprobación de Dirección** como gates, no compensables con un alto valor comercial. En P0 no esperar a evidencias de demanda de SEO.

**Límite de capacidad:** recomendar lotes pequeños por profesional/revisor disponible y ámbito. Una señal con diez dependencias no es «diez artículos nuevos» ni «diez oportunidades de venta».

## 6. Tres escenarios de propagación íntegra (ficticios, sin afirmar novedades)

### Escenario A — Modificación futura de un concepto de cotización

1. TGSS/BOE modifica una regla aplicable a un período delimitado; el monitor detecta diferencia.
2. Revisor contrasta acto, período, excepciones y aplicabilidad (trabajadores/empresas/cotización).
3. Mapa de dependencias: KIA laboral, Academy, guía de costes y, **solo si las usa**, calculadoras.
4. Salida editorial: **actualizar** explicación ya existente, con ejemplo sintético y nota de vigencia; no crear un blog duplicado.
5. Salida comercial: revisar material de curso/diagnóstico y proponer oferta puntual si Dirección la aprueba; ninguna regularización de cliente automática.
6. QA: respuestas antiguas vs nuevas por período, caso de régimen no afectado, texto ES/RU, sitemap y enlaces si hay publicación.

### Escenario B — Cambio futuro en obligaciones de facturación

1. Identificar norma oficial exacta y separar **VeriFactu**, requisitos del software y **factura electrónica entre empresas** según obligación y calendario distintos.
2. Revisar transitorios y sujetos obligados; no anunciar una fecha general a partir de una nota informativa.
3. Mapa: artículos, servicios facturación, guías empresariales, comparadores, preguntas KIA, formación y ficha VeriFactu.
4. Propuestas: una guía matriz «qué obligación me afecta» + actualizaciones puntuales y enlaces cruzados; **no** mover datos ni configurar facturación real.
5. QA: contribuyente exento, actividad distinta, ejercicio anterior, norma sin vigencia aún, idioma RU, CTA a servicio correcto.

### Escenario C — Ajuste futuro a un trámite de constitución / CIRCE

1. Validar alcance legal y operativo a través de BOE/PAE/CIRCE/Registradores y documentación oficial.
2. Cruce con PR #783 de centro documental CIRCE: **reutilizar**, no crear segundo catálogo ni duplicar landing.
3. Revisar preguntas sobre diferencias entre empresario individual/SL, socios extranjeros y documentos requeridos.
4. Salida interna: checklist KIA; pública: actualización de guía/FAQ; comercial: consulta o constitución asistida solo con alcance/precio aprobado.
5. QA: variación de forma societaria, representación, NIF, registro, obligaciones posteriores y cambio de tarifas que exige Dirección.

## 7. Registro de decisiones, caducidades y revisión posterior

Diseño de ficha de bitácora que puede recogerse en documento antes de disponer de UI:
- \`decision_date\`, \`legal_reviewer\`, \`source_id\`, \`change_id\`, \`source_validated_at\`.
- \`affected_resource\`, \`old_version\`, \`approved_diff\`, \`new_version\`, \`publication_date\` (si existe).
- \`effective_from\` y \`next_review_trigger\`: cambio normativo, fecha fijada, criterio oficial, caducidad temporal de valor; no asumir revisiones trimestrales para todo.
- \`no_action_reason\`, \`duplicate_target\`, \`client_case_private_reference\` **solo en sistema privado**.
- \`post_publish_check\`: URL/HTTP/canonical/ES-RU/sitemap, revisión GSC cuando esté conectada, correcciones y responsable.
- \`closure\`: aprobado, rechazado o pendiente, con motivo y evidencia. No marcar publicado por merge de PR.

**Cadencia conceptual futura:** diario *solo* para fuentes realmente configuradas, worker según cron y auditoría mensual existente; sobre estas señales, una bandeja unificada de propuestas por prioridad, con digest y alertas de alto riesgo, evitando notificaciones repetidas por la misma fuente/huella. No crear automatización adicional ni comprometer cadencia real antes de verificar cron/health.

## 8. Validación sintética y barreras de seguridad

1. Cambia la presentación HTML sin contenido jurídico → sin impacto editorial/comercial.
2. Snapshot nuevo sin baseline previo → no afirmar «cambio normativo».
3. Norma aprobada aún no vigente → propuesta futura; no cambio actual del valor ni contenido engañoso.
4. Norma aplicable a una provincia → sin cambio nacional y sin afectar clientes fuera del ámbito.
5. Una fuente administrativa contradice norma primaria → \`needs_review\`; resolver jerarquía.
6. RSS notifica actualización pero PDF primario falla/403 → bloquear interpretación conclusiva.
7. Valor \`regulatory_values\` solapado en fecha → bloquear cálculo y requerir revisión.
8. Dependencia blog correcta pero no servicio → se puede revisar blog, no bloquear todos los servicios.
9. Dos cambios legales distintos causan igual ajuste editorial → una edición con ambas fuentes verificadas y trazabilidad.
10. Cambio importante de contenido ya publicado → conservar historial/nota real y fecha significativa, no recrear 20 URLs.
11. Motor redacta consejo relativo a administrador o familiar sin hechos → explicación condicional, no dictamen.
12. Discrepancia de traducción RU frente a español → no activar hreflang ni indexación del equivalente defectuoso.
13. El artículo final contiene un fragmento de expediente identificable → prohibir exportación/publicación y registrar incidencia.
14. Un asesor aprueba contenido pero no precio → no publicar nueva ficha tarifada.
15. Un webhook sugiere publicar/eliminar tras recibir una URL externa → ignorar instrucciones no confiables; input es dato.
16. Las fuentes oficiales dan resultados correctos pero Search Console no está conectada → \`SEO_NO_MEDIDO\`, nunca afirmar indexación o mejora.

## 9. Orden de actuación y responsables

| Orden | Hito documental / posterior | Responsable futuro | Resultado comprobable |
| --- | --- | --- | --- |
| A | Reconciliar fuentes y dependencias reales existentes: cobertura activa, crons, health, CMS, archivos y años | Técnico + revisor legal | Matriz «comprobado / no comprobado / falta fuente» |
| B | Inventario de recursos canónicos de ES/RU y tipologías; evitar duplicados con #796 / #760 / #783 | Editorial + SEO | Manifest de contenidos y equivalentes verificados |
| C | Definir 5 casos de ejemplo sintéticos completos desde fuente → impacto → diff → gates | Revisor legal + KIA QA | Fichas reproducibles sin datos personales |
| D | Especificar pantalla de propuestas para Admin Editorial Hub, sin nuevos privilegios por defecto | Producto + privacidad + seguridad | UX + autorización por acción / estado |
| E | Aprobar recursos, precio y responsabilidades antes de cualquier ficha comercial | Dirección | Acta de decisiones |
| F | Solo en fase autorizada: implementar contratos mínimos, pruebas y QA; jamás auto-merge | Desarrollo supervisado | CI, pruebas, readback, dos previews y aprobación independiente |

**Checkpoint inalterado:** E0-M3-06. Ningún diseño de este archivo prueba que E0 esté finalizada ni habilita E1, V3, envío de comunicaciones, indexación programática, escrituras de Holded/TGSS/AEAT, publicación, captación de leads o uso de datos reales en pruebas.

## 10. Referencias

- [KIA Regulatory Registry](../kia-regulatory-registry.md): esquema y reglas existentes.
- [Motor editorial y comercial](../kia-commercial-editorial-opportunity-engine-2026-10-13.md).
- [Matriz laboral, SEO y oportunidad](kia-labor-editorial-seo-opportunity-matrix-2026-10-17.md).
- [PR #783 — Centro CIRCE futuro](https://github.com/expert-servicios/expert-app/pull/783) y [PR #760 — Academy/CTAs](https://github.com/expert-servicios/expert-app/pull/760).
- [Google Search Central: lastmod y sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap): fecha de modificación significativa y comportamiento orientativo.
- [Google Search Central: contenido generado con IA](https://developers.google.com/search/docs/fundamentals/using-gen-ai-content): la generación masiva de bajo valor puede vulnerar políticas de spam.
- [Google Indexing API](https://developers.google.com/search/apis/indexing-api/v3/quickstart): restringida a páginas JobPosting y BroadcastEvent en VideoObject; no sirve para publicación ordinaria.
