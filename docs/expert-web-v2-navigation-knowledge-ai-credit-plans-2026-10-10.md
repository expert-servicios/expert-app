# EXPERT Web V2 — Diseño, navegación, contenidos y modelo de créditos KIA
**Fecha:** 10/10/2026 · **Estado:** propuesta comercial y UX para evaluación; solo documentación.
**Depende de:** [Web Pública V2](expert-public-web-workspace-kia-repositioning-plan-2026-10-10.md), [Workspace V2 PR #708](https://github.com/expert-servicios/expert-app/pull/708) y [KIA Intelligence PR #707](https://github.com/expert-servicios/expert-app/pull/707).
**Objetivo:** un sitio web de captación y conocimiento claro, una sola KIA multicanal, un Workspace único y una monetización de IA sostenible SIN confundir servicio profesional con uso de modelos.

## 1. Decisión comercial: planes y créditos de IA, no cerebros diferentes

**Recomendación:** estructurar los servicios en **tres productos comerciales diferentes pero compatibles**:
1. **Servicios profesionales puntuales**: declaración, consulta, certificado, migración, formación, revisión y trámites; precio/alcance de encargo específico y profesional responsable. **Sin obligar** a comprar un plan mensual por solicitar un trámite.
2. **Acceso / servicio Workspace + KIA**: experiencia de trabajo y herramientas con cuota incluida de IA según modalidad, cuando exista una oferta de acceso por suscripción formalmente aprobada. La cuota paga servicio/soporte/infraestructura, no determina qué cliente/empresa puede leer sin autorización.
3. **Créditos KIA adicionales opcionales**: compra puntual de paquetes de uso que se consumen **después** de lo incluido, con tope y autorización. No recarga automática ni deuda implícita de forma predeterminada.

**Importante — conflicto comercial identificado:** Dirección había decidido retirar del catálogo las suscripciones generales recurrentes el 23/09/2026; la nueva idea del 10/10/2026 reabre *solo* el estudio de planes de acceso/uso de IA y su monetización. **No revivir automáticamente el Plan Supervisión / Avanzado / Colaborativo de 49/99/199 €/mes ni las promesas de contabilidad/tributos y SLA del catálogo actual.** Esos precios siguen codificados en main; su sustitución exige decisión comercial, auditoría de contratos existentes/Stripe, facturas y revisión legal. Se pueden diseñar **planes de IA/Workspace separadamente** y mantener servicios profesionales puntuales.

**Principio técnico:** un solo cerebro y registro de skills; el perfil define límites de volumen, disponibilidad de **herramientas** y nivel de soporte humano, pero nunca “KIA básico / KIA premium” como motores separados. El pago no concede scopes de seguridad ni permisos sobre datos de otras empresas. Tampoco existe obligación de uso de cuenta ChatGPT/Claude/Gemini del cliente.

### Diseño de modalidades (nombres y cuotas por decidir tras benchmark)

| Modalidad propuesta | Destinatario / acceso | Uso IA incluido (a calibrar) | Servicios y permisos |
| --- | --- | --- | --- |
| **KIA Público** | visitante sin autenticar | Cuota gratuita acotada por sesión/IP con antiabuso, no monedero nominal | Orientación sobre fuentes públicas y servicios; sin datos personales de cliente, sin herramientas de escritura |
| **Workspace Esencial** | cliente con acceso, con o sin encargo puntual | Bolsa pequeña de créditos incluida solo si la oferta lo prevé | Información propia, expedientes y documentos autorizados, orientación; colaboración profesional sujeta a encargo |
| **Workspace Colaborativo** | autónomo/empresa con flujo recurrente contratado | Bolsa media, visualización de consumo de la empresa y límites por miembro | Documentos, Holded company-scoped según token, tareas y revisiones profesionales **según contrato**, no por consumir más IA |
| **Workspace Intensivo** | empresa/equipo con alto uso | Bolsa alta, controles por empresa/equipo, límites y aprobación de gastos | Análisis avanzados y herramientas habilitadas; precio de trabajo humano no se sustituye por créditos |
| **Paquetes KIA** | clientes elegibles en cualquier modalidad privada | Bolsa adicional prepagada y separada, sin salto de plan | Exactamente las capacidades que ya permite su rol/mandato; solo aumenta consumo |

**No aprobar** nombres finales, € por mes, crédito por paquete, cantidad de mensajes ni SLA con esta PR. Sujeta a valoración real de coste por operación, márgenes, impuestos, soporte y riesgo.

### Por qué crédito ponderado y no “X mensajes”
Una pregunta breve no tiene el mismo coste que:
- recuperar fuentes oficiales y citarlas;
- analizar 10 PDF con varias páginas OCR/visión;
- colaborar fiscal+laboral+contable con subagentes;
- generar DOCX/XLSX/PDF/PPTX, gráficos o artefactos;
- transcribir/sintetizar audio durante varios minutos.

**Experiencia visible:** crédito de EXPERT KIA (unidad normalizada con tabla pública de costes por operación), saldo inicial, créditos incluidos, recargas, historial, coste estimado antes de tarea compleja y gasto final. Para consultas habituales se pueden mostrar “consultas aproximadas” a modo educativo, **sin prometer número fijo**.

**Libro de coste interno**: uso técnico del proveedor por tokens entrada/caché/salida, llamadas búsqueda, procesamiento PDF/imagen, audio por minuto, almacenamiento, generación en sandbox, reintentos, precios y tipo de cambio. Transformar en *unidades KIA* por versión de tarifario auditable. El precio de venta corresponde a EXPERT, no a los “credits” ni suscripciones personales de OpenAI, Anthropic o Google; esos sistemas **no financian** la API de EXPERT por defecto.

**Ejemplo SOLO de ponderación piloto, sujeto a medición:**
- Orientación textual ordinaria: coste base bajo.
- Consulta con fuentes oficiales verificadas: mayor carga que una respuesta sencilla.
- Análisis de archivo largo / imagen / escaneado: depende del tamaño y coste de procesamiento.
- Simulación y documentos: cotizar o preautorizar margen de créditos por proceso y conciliar al finalizar.
No fijar factor 1/3/10 ni token→crédito hasta testear treinta casos de uso representativos en ES/RU y varios proveedores. El saldo nunca puede ocultar costes adicionales de terceros ni generar cargos sorpresivos.

### Reglas operativas del wallet / consumo
- Titularidad: bolsa por **empresa/cliente contratante**; miembros consumen contra ámbito autorizado y pueden disponer de sublímites. Un usuario con dos empresas elige cuenta antes de cualquier cargo; no transferir saldos por alias/email.
- Separar **included grant** por ciclo contractual, **purchased top-up** por compra y **promotional grant** con condiciones transparentes. Definir caducidad y posibles devoluciones con revisión jurídica; visualizarla antes del pago. Orden FIFO por vencimiento, con reglas de asignación claras.
- En una llamada: comprobar permiso y saldo -> reservar estimación máxima autorizada de manera transaccional -> ejecutar dentro de límite -> conciliar consumo real -> liberar reserva no usada o reembolsar el importe si falla. Dos solicitudes simultáneas no pueden gastar el mismo saldo; refund ante errores propios/timeout según política. Idempotencia por turno + hash de adjuntos/operación, no cobrar dos veces por replay.
- Separar consumo del usuario de operaciones **internas de EXPERT**: no cargar al cliente llamadas de KIA usadas por Admin para cumplir el encargo profesional sin estipulación expresa; la actividad gratuita de ayuda proactiva no debe agotar su bolsa silenciosamente. Mostrar en panel el origen y autorizador del consumo.
- Respetar consentimiento y mandato por operación, no cobrar por consultas automáticas ocultas. Bloqueo seguro al acabar el saldo con opciones: recargar, esperar renovación, seleccionar operación más ligera o solicitar profesional. **No** degradar autorización ni privacidad por falta de saldo.
- Avisos a 50/80/100%, máximo de gasto mensual, bloqueo por presupuesto y recarga automática **solo opt-in**, con límite y cancelación. En evento de coste inusual notificar al Admin y proteger costes de proveedor.
- Imposibilidad de coste exacto a priori en tareas arbitrarias: mostrar **estimación/rango + máximo autorizable**, resumir la factura real y no iniciar operación sin la preautorización correspondiente.
- Medidas antifraude: límites IP/usuario/tenant, payload/parsers seguros, cuota de recursos (archivos/tamaño), protección abuso/abono, rate-limits, webhook verificado y conciliación.
- Exención de saldo nunca implica exención de trazabilidad. Admin puede ajustar crédito mediante acción administrativa auditada, no editando un entero manualmente.

### Arquitectura y facturación verificable
**Estado main:** lib/ai/kia/kia-usage-log.ts recoge tokens y coste USD estimado en telemetría; NO ledger facturable, wallet, holds transaccionales, pricing versionado ni top-ups. El checkout de suscripciones y Stripe están operativos para planes codificados, pero no para créditos KIA. **No reusar el registro de telemetría como fuente de cobro sin ledger.**

**Objetos canónicos propuestos (sin crear aún tablas):**
- kia_credit_product (sku, unidad, tarifario, versión, vigencia, precio con impuestos);
- kia_credit_grant (tenant/company, clase incluido/compra/promoción, unidades originales, vencimiento, fuente Stripe);
- kia_credit_ledger (append-only: grant, reserve, settle, release, adjustment, refund, actor, session, turn, job, idempotencyKey, creditRateVersion, proveedor/coste);
- kia_credit_allowance (limites y periodo de uso, miembros, soft/hard limit, contrato y mandato);
- kia_usage_event (operación real, datos de costo técnico, tokens/acciones/archivos, provider route, estimation quality, provenance, outcome);
- kia_credit_quote (estimationMin/Max, expiresAt, approveToken y UI-visible);
- kia_credit_audit (staff access, manual changes y reconciliación proveedor/Stripe).

Implementar permisos por empresa/organización con RLS + autorización en servidor; constraints e invariantes saldo >= 0 salvo ajustes controlados, dedupe; nunca almacenar secretos de tarjetas ni PII innecesaria en el ledger. Reconciliar pagos y abonos Stripe y reintentos webhooks antes de asignar créditos. Evaluar Stripe metered billing/credit grants o venta simple de paquetes prepagados; **recomiendo MVP de paquetes prepagados** por previsibilidad y ausencia de facturación a final de mes inesperada. Stripe podrá ser recaudador; el ledger de acceso en EXPERT será fuente operativa, conciliado con Stripe (evitar doble contabilización). Diseñar IVA y condiciones de prepago con profesional responsable y confirmar encaje del crédito virtual, caducidad y desistimiento con asesoría legal.

### Presupuesto/márgenes — datos a medir antes del precio
- Caso medido = modelo + tokens entrada/salida/caché + nº calls + búsqueda + archivos + almacenamiento + render/documentos + voice + errores/reintentos + tiempo + supervisión.
- Calculadora interna coste real medio y P95 por cada tarea, por rol y por canal, tipos ES/RU.
- Precio sostenible de planes = coste de infraestructura/almacenamiento + uso IA P75/P95 + administración/pagos + soporte humano **contratado** + margen objetivo + provisión de abuso/errores. Recarga debe cubrir coste marginal por tipo de tarea, soporte y comisiones; benchmark vs valor aportado.
- Dashboard financiero Admin: costo IA por tenant/empresa/plan/skill/modelo, ingresos de top-ups, margen bruto aproximado, anomalías, reintegros y tickets. Dashboard Cliente: saldo, cuota, historial, estimación, recargas y opt-in de presupuesto.
- Política de actualización de tarifas versionada, aviso previo y no cambiar condiciones de bolsas ya adquiridas sin soporte legal/contractual.

## 2. Comparativa oficial de patrones de mercado (consultada 10/10/2026)

| Proveedor | Patrón a imitar | Lo que NO debemos copiar |
| --- | --- | --- |
| OpenAI ChatGPT | Cuota incluida que se consume antes de créditos adicionales para funciones compatibles, historial de uso y controles de recarga | Créditos de ChatGPT NO son créditos API ni son transferibles a KIA automáticamente; no copiar tarifas por modelo para facturar a ciegas |
| Anthropic Claude | Créditos tras límites incluidos, compras y paquetes, límite mensual configurado | No prometer "mensajes ilimitados": depende de modelo/contexto/esfuerzo y superficie |
| Google AI | Créditos adicionales para funciones/planes compatibles y recarga automática | Sus créditos son del producto Google AI, no equivalentes universales para Gemini API |
| Stripe Billing | Metros de uso, precio fijo+exceso o crédito prepago con caducidad/threshold | No aplicar overages automáticos sin consentimiento ni contrato claro |

Fuentes oficiales de investigación (consultar de nuevo al fijar precios):
- https://help.openai.com/es-es/articles/12642688-using-credits-for-flexible-usage-in-chatgpt-personal-plans
- https://support.claude.com/es/articles/12429409-gestionar-creditos-de-uso-para-planes-claude-pagos
- https://support.claude.com/en/articles/14246112-buy-usage-bundles
- https://support.google.com/googleone/answer/17103110?hl=es-419
- https://docs.stripe.com/billing/subscriptions/usage-based/pricing-models
- https://developers.openai.com/api/docs/pricing

## 3. Una arquitectura pública organizada por necesidades, no por formatos

El sistema existente ya dispone de:
- menú y dropdowns en components/site/header.tsx;
- pie en components/site/footer.tsx;
- un **Blog** con filtro de categorías y tags en app/(public)/blog/page.tsx y BlogExplorer;
- una **Base de conocimientos** con docs y filtros en app/(public)/docs/page.tsx y DocsExplorer;
- landing **pilares temáticos** /categoria/[tema] mediante lib/utils/taxonomy.ts, que agrupan servicios, guías y artículos;
- servicios por categorías, fichas con FAQ, fuentes, calculadoras, reseñas y CTAs; Academy y /para-asesorias; KIA pública transversal.

**No borrar ni hacer una migración masiva de URLs**: mantener el SEO de blog/docs/categoria, y cambiar primero menús, taxonomía interna, filtros y enlaces. Deduplicar snippets visuales, navegación/CTA/analytics compartidos, no colapsar las páginas que cumplen objetivos distintos.

### Menú principal propuesto — desktop y móvil
**Inicio** · **Soluciones** · **Servicios** · **Plataforma EXPERT** · **Recursos** · **Contacto** · [Acceder] · [Preguntar a KIA]

- **Soluciones:** «Autónomos», «Empresas/SL», «No residentes y expatriados», «Asesorías (futuro/piloto)»; landing por problema, no crear una página por keyword sin valor.
- **Servicios:** Fiscal y contable; Notaría y Registros; Administrativos (Ayuntamiento/CCAA/Catastro/SUMA/Tráfico/Turismo); Certificados digitales; Extranjería/Nacionalidad según clasificación existente (no eliminar categorías en uso); Holded (migración, implantación, formación). Ver catálogo completo y presupuesto.
- **Plataforma EXPERT:** «Cómo funciona el Workspace», «KIA, tu copiloto», «Trabajo contable colaborativo», «Integraciones / Holded», «Planes y créditos» **solo cuando la oferta y billing estén aprobados y habilitados**; si no, «Consultar disponibilidad» o solicitud de presupuesto.
- **Recursos:** «Guías y base de conocimientos», «Blog y actualidad», «Academy / Formación», «Herramientas y calculadoras», «Preguntas frecuentes». Un buscador general y filtros por tema y formato.
- **Contacto:** canales KIA web/Telegram, formulario, cita sin duraciones de demos no acordadas, correo.

**Navigation UX:** 6 items, menú multi-columna simple y teclado-accesible; móvil acordeón compacto; acceso cliente prominente; KIA flotante sólo en web pública sin tapar otros CTAs; header sticky liviano. El dashboard autenticado **no** reutiliza este navbar; usa Kiranism/adaptación EXPERT. Footer alineado y agrupado por Soluciones, Servicios, Plataforma, Recursos, Legales; no enlazar un checkout deshabilitado.

### Mapa editorial (tipo distinto por intención)
| Tipo | Qué resuelve | Criterio y llamada a la acción |
| --- | --- | --- |
| **Solución** /soluciones/... | necesidad comercial y recorrido | ejemplos de problema; CTA servicio / Workspace |
| **Servicio** /servicios/... | trámite/precio/requisitos y contratación | alcance legal, precio o calculadora, presupuesto; no pedir archivos prematuramente |
| **Producto** /plataforma y /kia | valor de la tecnología y permisos | demo sintética, roles, funcionalidades realmente disponibles |
| **Blog** /blog/... | actualidad/análisis/criterio profesional, noticias normativas y comparativas | fecha publicación/revisión, enlaces a fuente oficial y a guía permanente; KIA con contexto del artículo |
| **Guía** /docs/... | procedimiento duradero paso a paso | requisitos, autoridad competente, portal oficial, fecha comprobada, versiones y FAQ; CTA «Resolver mi duda con KIA» |
| **Hub temático** /categoria/... | agrupar solución+servicio+guía+blog por tema | navegación SEO, sin duplicar el texto de páginas hijas |
| **Glosario/FAQ** dentro de guías | explicación breve de concepto | respuestas cortas con fundamento y enlace a guía |
| **Academy** /academy/... | cursos, formación y materiales pedagógicos | separar formación comprable de contenido editorial y fuente regulatoria |
| **Ayuda de KIA** /ayuda/kia | política, uso y seguridad IA | explicar permisos y cambios de capacidades, privacidad y límites |

## 4. Rediseño editorial y visual de la web pública

**Estilo:** conservar azul marino EXPERT + crema/blanco cálido + acentos dorados; tipografía profesional; sombras discretas; screenshots reales SOLO después de revisión de PII o maquetas sintéticas marcadas; ilustrar colaboración, no tres chatbots separados. Fotografía del equipo/experiencia profesional sin inventar. Mantener contraste, a11y y velocidad, versión ES/RU.

**Página de inicio propuesta:**
1. Hero con propuesta de valor «Cliente, KIA y tu asesoría colaborando en un mismo espacio»; CTA «Preguntar a KIA» y «Cómo funciona» (despliegues verificados).
2. Franja de confianza: experiencia/credenciales exactas y prueba de trabajo con empresas (sin logos/clientes sin permiso).
3. Demostración compacta del Workspace con el lateral KIA; **modo Admin soporte** ilustrado sin enseñar datos ajenos.
4. Tres recorridos profesionales: «Tengo una consulta», «Quiero organizar mi contabilidad y Holded», «Necesito un trámite».
5. Módulo «Así gestionamos una factura» (documento → propuesta KIA → validación EXPERT → estado en portal), términos «propuesta» y «contabilizado» distintos.
6. Tarjetas Servicios/Certificados/Holded con precios y alcance verificados; sin empujar suscripción no disponible.
7. Hub editorial: **Guías prácticas** y **Artículos recientes** en pestañas o bloques diferenciados, enlazados a categorías.
8. Credenciales, atención profesional y FAQ; CTA último «Consultar con KIA / Solicitar servicio».

**Páginas producto:** /plataforma combina roles Cliente/Admin/Soporte y colaboración. /kia explica único cerebro con especialistas internos y acceso público/autenticado; /trabajo-colaborativo (opcional: sección de plataforma si canibaliza SEO) demuestra gestión de facturas, plazos y tareas; /planes solo si decisión comercial efectiva y métricas aprobadas. Cada producto se diferencia de una guía o de un servicio.

**Componentes reutilizables públicos:** PublicHeader/NavMegaMenu, PublicSearch, TopicHub, ContentCard, ContentMeta (autor, publicado, revisado, fuente), ActionCTAs with origin, ScenarioWalkthrough, KIA contextual CTA (sin login forzado para público), PlanUsageEstimator, CreditsBalancePreview (solo privado), SiteBreadcrumb, relatedLinks. Un design-token system compatible con Workspace, pero no plantilla Kiranism para la home.

**Blog vs base de conocimientos:**
- Blog: lectura editorial, autor, fecha y actualidad, contexto/impacto, cita y enlace a la guía de referencia.
- Base: checklist, paso a paso real, requisitos y enlaces oficiales, última revisión, cambios en normativa, errores habituales, ejemplos anonimizados y versionado.
- Evitar duplicar «cómo hacer modelo 210» íntegro en Blog y Docs. Blog narra la novedad e impacto; la guía mantiene el procedimiento actual.
- Un solo buscador transversal: resultados etiquetados «Servicio / Guía / Artículo / Curso» y filtrados por categorías y ES/RU.
- RAG de KIA indexa contenido curado con fuente oficial verificable; **no** tomar una entrada de blog sin actualizar como autoridad normativa. Indicar vigencia/fecha y escalado a especialista humano si información está incierta.
- Slugs canónicos y hreflang ES/RU; enlaces entre fuente / artículo / guía / servicio, sin directorio de páginas huérfanas ni 301 masivos.

### Matriz de temáticas compartida (taxonomy canónica)
Áreas principales: Fiscal e impuestos; Contabilidad/finanzas/Holded; Laboral y Seguridad Social; Mercantil/empresas; Extranjería y nacionalidad; Notaría/Registros/Propiedades; Trámites públicos/certificados; IA empresarial/KIA/Workspace; Formación. Los **servicios** pueden agruparse según las categorías del catálogo existente aunque el hub editorial tenga temas más amplios. Establecer mapeo de IDs y aliases, no inferir categoría por substring del slug.

### Ciclo de publicación y gobierno editorial
Proponer en Admin Workspace (con KIA como copiloto) **una sola ficha de contenido** con:
- canonicalContentId, kind (blog/doc/service/help), lang, relatedTopicIds, linkedServiceIds, expertOwner, author/reviewer, audience, status (draft/reviewed/scheduled/published/archived), version, firstPublishedAt, lastReviewedAt, lastOfficialVerificationAt;
- evidencia/URL oficial/artículo/norma/vigencia y fecha de comprobación; caducidad/regulatory-review-due; estado de no confirmado. Enlaces a fuentes con permiso/licencia y sin copiar artículos protegidos íntegros;
- SEO title/description, canonical, hreflang mapping, OG/imagen social ES/RU, FAQ Schema solo contenido real visible, enlaces internos y CTA con origen/atribución;
- control de calidad KIA: legibilidad, ES/RU, actualidad, fuentes, PII, CTA y duplicidad, pero **no publicación automática sin revisión** de materia fiscal, laboral o jurídica;
- reutilizar artículos y docs actuales; migración de datos/content sólo después de detectar dónde vive cada tipo de contenido. No inventar una CMS nueva si el actual admin ya cubre el caso.

**Radar regulatorio mensual existente** alimenta la cola de revisión. Distinguir «sugerencia de KIA», «validado por EXPERT», «publicado» y «confirmado por sede oficial».

## 5. Plan conjunto de ejecución, entregables y gates

| Bloque | Entrega propuesta | Responsables | Gate |
| --- | --- | --- | --- |
| **C0 — Pricing discovery** | 30 casos KIA reales anonimizados/sintéticos ES/RU, coste proveedor y horas soporte, simulador unidad crédito; auditar 49/99/199 € activos y contratos/Stripe | KIA Core + Finanzas + Legal | decidir oferta nueva sin reactivar antiguas suscripciones |
| **C1 — Contrato de créditos** | pricing versionado, wallet ledger append-only, idempotencia, cuentas multiempresa, roles, limites, preautorización, Stripe reconciliation | Billing + Seguridad | test de concurrencia, fraud, refunds, saldo exacto |
| **C2 — UX créditos** | saldo/consumo/estimación/recarga, facturas y alertas en Workspace Cliente y Admin, pricing table pública una vez aprobado | Workspace V2 + Web | no cargos ocultos; i18n ES/RU; a11y |
| **C3 — Piloto** | paquetes bajo flag para empresa laboratorio y algunos usuarios autorizados, sin activación de cobro accidental | Producto + QA | consumo, coste, margen, P95, retención, permisos, audit |
| **N0 — Sitemap/taxonomía** | inventario de todos los URLs /blog /docs /categoria /servicios /academy, canónicas, ES/RU, status, link depth, redirecciones | Web/SEO | sin pérdidas de URL, sin cruces de idioma |
| **N1 — Navbar + Site Design** | nuevo menú 6 ítems, footer, search/TopicHub y nuevos componentes de hero, módulos por necesidad | Web/Diseño | responsive, Core Web Vitals, keyboard, AA contrast |
| **N2 — Contenido** | reordenar Blog/Docs/soluciones por temas; contenido tipo y relación fuente→guía→blog→servicio; editor/QA de Admin | Content/KIA/Legal | actualidad, enlaces oficiales, no PII, no canibalización |
| **N3 — Nuevas landings** | /plataforma, /kia, «cómo trabajamos», contabilidad compartida; acceso público KIA real | Web + Workspace/KIA | no promesas de funcionalidad sin QA |
| **N4 — Pricing + CTA** | solo tras C0–C3 y revisión de contratos/legales: nueva tabla de planes/créditos, FAQs y checkout auditado | Producto/Finance/Legal | Stripe/payment/rollback y consentimiento |
| **N5 — Final QA** | ES/RU, 390–1920 px, staging, SEO, rutas, tiempos KIA, citas, origen lead, a11y, seguridad | QA | typecheck/lint/tests, Vercel ambos proyectos, no regression |

**Dependencias:** las mejoras visuales/editoriales N0–N3 pueden ir en paralelo a KIA/Workspace bajo feature flags, sin fingir disponibilidad. El cobro de créditos C1–C3 es una línea técnica **separada del checkout de servicios vigente** y no debe depender de un único navegador/sesión. Se puede empezar la investigación C0 sin modificar ventas ni precios. Referenciar las tres líneas en PR #707 y #708.

## 6. Criterios de cierre global
1. Ningún usuario cree que existen varios cerebros KIA según el plan; los datos de clientes no se convierten en públicos por pagar.
2. Se puede usar un servicio puntual sin suscripción Workspace salvo que el servicio lo justifique contractual y técnicamente.
3. Los créditos vendidos son medibles, comprensibles, previstos antes de tareas costosas y auditables; fallos y replays no se cobran dos veces.
4. Admin no consume silenciosamente cuota del cliente al prestar asistencia profesional.
5. Menú/Blog/Docs usan taxonomía enlazada y búsqueda única por tipo/tema, con respuesta oficial verificable.
6. La web no anuncia tipos de archivo, acciones o automatizaciones no implementados ni versiones «pro» de una mente distinta.
7. Sin cambios a planes históricos, suscripciones, calendarios de cobro o retención legal sin evaluación y aprobación comercial/jurídica.
8. CI, seguridad, QA visual y mecanismos de rollback completados antes de cada fusión/deploy.

**Esta especificación NO implementa wallet, no fija tarifas ni crea rutas, contenido de venta o cobros.**
