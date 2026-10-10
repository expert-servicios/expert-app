# EXPERT Web pública — Reposicionamiento hacia Workspace V2 + KIA única
**Fecha de auditoría:** 10/10/2026
**Estado:** nuevo plan de contenidos y experiencia pública; NO activa funcionalidades ni cambia contratos.
**Dependencias principales:** PR #707 (KIA Intelligence), PR #708 (EXPERT Workspace V2 / soporte Admin) y PRs de hardening #683 / #705.
**Fuente de verdad:** código vigente en main de expert-servicios/expert-app, documentos maestros y páginas públicas indexadas de expertconsulting.es. El indexado externo puede retrasarse: comprobar staging y producción visualmente antes de afirmar qué está desplegado.

## 1. Decisión estratégica

El relato público debe pasar de «asesoría con catálogo y planes» a **EXPERT: colaboración operativa entre cliente, profesionales y KIA**, sin abandonar la prestación profesional, los servicios puntuales ni Holded. EXPERT Workspace V2 es un único producto operativo con vistas cliente/Admin y soporte delegado auditado; KIA es un único cerebro con subagentes y capacidades permitidas por contexto. El chat público y Telegram son canales de entrada de KIA, no otro asistente distinto.

**Propuesta de valor:**
- El cliente conoce qué tiene pendiente, aporta o consulta documentación, sigue el expediente y coopera con EXPERT desde su espacio.
- KIA explica el siguiente paso, propone ayuda contextual y consulta datos autorizados; un especialista EXPERT revisa decisiones y ejecuta actuaciones profesionales permitidas.
- El administrador usa el **mismo workspace funcional** en modo soporte, con su identidad real, para configurar conexiones, organizar expedientes, consultar contabilidad y operar conforme a mandato y permisos efectivos.
- Holded sigue siendo el origen de datos contables cuando la empresa lo conecta; EXPERT coordina documentación, operaciones, colaboración y trazabilidad.
- Público recibe orientación general; cliente autenticado sólo su contexto; Admin dispone de vistas/acciones legítimas extra. **No son tres cerebros ni tres ediciones técnicas de KIA**.

**No cambiar la web pública por el dashboard Kiranism**: Kiranism está reservado al Workspace autenticado. Mantener branding, estructura comercial, categorías y SEO existentes. La web pública puede mostrar maquetas honestas del mismo design system, sin duplicar panel ni prometer funcionalidades no desplegadas.

## 2. Auditoría factual de páginas y código

| Superficie | Evidencia en código / indexado | Desajuste | Prioridad |
| --- | --- | --- | --- |
| Inicio / | app/(public)/page.tsx, components/site/Hero.tsx | Mensajes de «planes desde 49 €», vigilancia diaria de números y sección recurrente; KIA y colaboración no se explican como sistema único. | P0 |
| Campaña | JulyCampaignBanner en home, planes y algunas fichas | Campaña de julio/urgencia fiscal sigue referenciada en octubre; retirar o reemplazar por configuración de campaña con fecha de caducidad. | P0 |
| Planes /planes | app/(public)/planes/page.tsx y subrutas | Tres suscripciones, precios, promesas «KIA básico/fiscal/avanzado», checkout y referencias en menú, SEO y condiciones. **Contradice decisión comercial del 23/09 de priorizar servicios puntuales y retirar suscripciones del catálogo**: antes de alterar contratación, comprobar clientes activos, pagos, condiciones y decisión comercial canónica. No cancelar ni borrar históricos. | P0 |
| Servicios /servicios | app/(public)/servicios/page.tsx y plantilla [categoria]/[servicio] | Catálogo ya contiene categorías, calculadoras, reseñas, ES/RU, FAQs, contenido y CTA; demasiado énfasis transversal en planes. Reutilizar la plantilla dinámica, no duplicarla. | P1 |
| Para asesorías /para-asesorias | app/(public)/para-asesorias/page.tsx | Posiciona piloto SaaS externo. Falta distinguir con claridad Workspace para clientes EXPERT de futura licencia multi-despacho. Menciona WhatsApp como canal necesario. | P1 |
| Holded /holded y packs | app/(public)/holded/page.tsx y páginas pack/migración | Formación, migración y ERP bien explicados; oportunidad de mostrar trabajo colaborativo y permisos. Menciona demo 30 min visible, incompatible con decisión de no publicar duración de demo (bloqueo de calendario sí puede ser 1 h). | P0–P1 |
| KIA pública | app/(public)/layout.tsx y /ayuda/kia | KIA widget existe. Falta una página de producto accesible y unificada de KIA y una ruta clara desde artículo/servicio sin forzar login. Aclarar adjuntos y artefactos como roadmap; ayuda existente explica límites por permisos. | P1 |
| Blog y guías | app/(public)/blog/[slug]/page.tsx, docs/[slug], ArticleIntentCTA | Buena base SEO, citas/servicios y Telegram. CTA «Abrir chat» enlaza a /dashboard?kia=open y puede no abrir chat público a un anónimo. No perder la atribución articulo -> lead -> chat -> servicio. Artículos centrados en «Claude + Holded» deben aclarar que EXPERT KIA funciona sin conexión separada a ChatGPT/Claude del cliente. | P0–P2 |
| Contacto y reservas | /contacto, /solicitar-presupuesto, /cita | Rutas y orígenes de contacto reutilizables. Enfoque de KIA como primer punto de consulta y escalación humana cuando proceda. Verificar confirmación Meet/email/cancelación y no mostrar CTA roto. | P1 |
| Pie/legales | components/site/footer.tsx; /condiciones, /privacidad, /terminos, /aviso-legal, /cookies | Hay WhatsApp, planes, preaviso de suscripción y textos de tratamiento previos. Revisar jurídicamente cambios de oferta, conservación, asistencia IA, subencargados, consentimientos y política de cookies antes del cambio comercial. | P0 |
| Idiomas | rutas ES y localized RU, hreflang de plantillas, docs/ru-technical-backlog.md | Necesario publicar nuevas páginas, FAQs, disclaimers, etiquetas e interacciones ES/RU con correspondencia semántica; EN no entra en MVP salvo documentación. | P1–P2 |

**Evidencias web consultadas:** https://expertconsulting.es/, /planes, /holded, /para-asesorias, /holded/pack-starter, /condiciones; comprobación contra rutas de main. La web indexada puede mostrar una versión previa distinta de main. Los dominios profesionaledu.com y robotcontable.com no respondieron a la inspección externa: no afirmar su estado ni tocar contenido hasta inventariar destino, propiedad, despliegue y audiencia.

## 3. Incoherencias a resolver antes de publicar (P0)

1. **Política comercial y catálogo:** la dirección indicó retirar suscripciones del catálogo el 23/09/2026, pero main sigue exponiendo /planes, checkout, 49/99/199 €, home, blog, FAQ, emails, esquema SEO y condiciones de cancelación. Elaborar matriz comercial «nuevo cliente / contratación vigente / oferta temporal / servicio puntual». Priorizar nuevos servicios puntuales y presupuestos personalizados, conservar servicio contratado y obligaciones con clientes ya suscritos; cambios a compras existentes sólo con decisión de Dirección y revisión contractual.
2. **KIA única, no tiers de inteligencia:** retirar lenguaje «KIA básico/fiscal/avanzado/premium» como si hubiera motores distintos. Si existen niveles comerciales, describir **servicios humanos y herramientas habilitadas por plan/rol**, no cerebros separados ni acceso a datos no autorizados.
3. **Promesas sin prueba:** expresiones «KIA vigila todos los días», «detecta todas las anomalías», «prepara cierres», «procesa cualquier archivo», «crea cualquier Office» solo cuando exista cobertura, calendario, fuente y smoke real. Distinguir «disponible», «en piloto» y «en desarrollo» en inventario interno; texto público solo promete disponible, o marca explicitamente «próximamente».
4. **Canales:** eliminar restos de «Escríbenos por WhatsApp» como CTA principal cuando no sea canal operativo elegido. KIA web + Telegram + correo + cita verificada como flujo canónico; no eliminar prueba contractual/canal histórico sin revisar caso.
5. **Campaña y reserva:** retirar Julio/temporadas expiradas; mantener CTA de demo Holded pero **no publicar duración** y comprobar tiempos reales en Calendar/Bookings. Evitar mencionar compatibilidad de Claude/ChatGPT como requisito externo para usar KIA.
6. **Legales/RGPD:** revisar la precisión de autorización, IA, retención, ficheros, consentimientos marketing, subencargados, citas, accesibilidad y términos contractuales antes de editar «planes» o prometer automatización contable. Ningún texto de marketing concede permiso de escritura Holded ni presentación administrativa.

## 4. Arquitectura de información propuesta (sin pérdida SEO)

**Menú público compacto**: Inicio · Cómo trabajamos · Servicios · Workspace EXPERT · Holded · Recursos · Contacto; KIA como acceso fijo y visible, «Acceder» diferenciado. Formación y «Para asesorías» accesibles en Recursos/producto o menús secundarios; no abrir 10 entradas.

**Rutas principales:**
- / — Home renovada orientada a resultado y colaboración, CTA «Consulta a KIA» / «Ver Workspace» / «Solicitar servicio».
- /plataforma (nueva) — Workspace V2 explicado con tres vistas: cliente, profesional EXPERT y modo soporte, sin enseñar datos reales. Demostración con casos/simulaciones, privacidad y qué está realmente disponible.
- /kia (nueva) — identidad única, subagentes especializados internos, chat público vs chat privado vs Telegram, límites, idiomas, intervención humana, herramientas por permisos; enlaza a /ayuda/kia actual.
- /como-trabajamos (nueva o sección de /plataforma según SEO) — pasos recepción → clasificación → revisión → colaboración → confirmación → entrega/historial; caso factura, consulta fiscal y expediente.
- /servicios y categoría/servicio — mantener categorías y plantillas canónicas; CTAs coherentes «Pedir revisión», «Solicitar servicio», «Hablar con KIA», calculadoras cuando existan.
- /holded — implantación + conexión privada + circuito cliente–KIA–asesor. No describir a KIA como tenant externo obligatorio; aclarar software/licencia distintos cuando proceda.
- /para-asesorias — mantener como **producto futuro/piloto** para otros despachos y no confundirlo con disponibilidad del Workspace de clientes EXPERT.
- /blog y /docs — arquitectura de contenidos orientada a intención real + solución + CTA contextual; enlazar a Workspace y KIA cuando relevante.
- /planes — transición condicionada a la decisión comercial confirmada en datos; mientras se resuelve, **no reescribir términos ni eliminar el checkout de suscripciones activas**.
- Páginas RU equivalentes, canonical/hreflang/breadcrumb/FAQ/OG coherentes. Preservar URLs SEO y redirect 301 sólo con mapeo, no crear cadenas/404.

## 5. Home nueva — propuesta editorial

### Hero
**Etiqueta:** EXPERT · Asesoramiento profesional y gestión colaborativa con IA
**Titular de trabajo:** «Tu empresa, tus trámites y tu asesoría, trabajando en el mismo espacio.»
**Subtítulo:** «Organiza documentación y gestiones, consulta a KIA y trabaja con profesionales EXPERT desde un entorno conectado. Cada persona ve sus datos y las herramientas que tiene autorizadas.»
**CTA principal:** «Conocer Workspace EXPERT» (explicación, no promesa de acceso a piloto)
**CTA secundario:** «Preguntar a KIA» (abre chat público sin forzar sesión)
**CTA profesional:** «Solicitar servicio» (catálogo y presupuesto).
**Pruebas:** solo acreditaciones legalmente verificadas + demo sintética veraz. No testimonios o métricas ficticias.

### Storyboard home (orden móvil y desktop)
1. Problema real: no perder facturas, mensajes, requisitos ni tiempo entre asesoría, correo y ERP.
2. Tres roles colaborando: **tú (cliente)** aportas/revisas; **KIA** orienta según permisos; **EXPERT** valida y opera con trazabilidad.
3. Experiencia ilustrada: screenshot sintético de Workspace con KIA a la derecha; marcar «Vista ilustrativa» cuando no esté desplegado.
4. Tres recorridos: (a) contabilidad con Holded y facturas, (b) trámites y expedientes, (c) consultas profesionales puntuales.
5. Cómo funciona: consulta inicial → permiso/contexto → tarea/documento → revisión → entrega e historial.
6. Catálogo puntual existente con precios/alcance verificados; opción presupuesto sin obligar a subir documentos sensibles al principio.
7. KIA pública como entrada principal + áreas de ayuda, atención humana/cita.
8. Credenciales/privacidad, Blog/guías y CTA final específico.

## 6. Contenido de colaboración contable (propuesta central)

Publicar un recorrido didáctico **«Así trabajamos una factura»**:
- Cliente carga una factura desde flujo seguro o conecta Holded.
- KIA clasifica/sugiere comprobaciones **solo si están disponibles** y muestra pendientes, origen y grado de confianza.
- EXPERT ve la misma operación desde modo soporte, revisa y completa acciones autorizadas.
- Cliente recibe un estado confirmado, siguiente paso y trazabilidad; no se confunde sugerencia IA con contabilización.
- Para balances, impuestos, pagos y retenciones: distinguir valores oficiales, provisionales, de Holded y cálculos bajo revisión.

Probar tres casos sintéticos representativos: autónomo con 3 facturas, SL con dos empresas vinculadas a un usuario, empresa sin usuario (configurada por Admin). Nunca usar facturas reales ni información de clientes en marketing.

## 7. KIA como canal de adquisición y ayuda, no un popup decorativo

- **Widget público** visible y usable móvil: consulta sin login, contenido ES/RU, fuentes, opciones relevantes. Para contexto privado o descarga reservada, invitar a autenticarse sin fingir acceso.
- **Un único núcleo** con respuesta pública / Cliente / Admin; mostrar diferencia de permisos, no crear tres personajes KIA ni hacer que cliente instale ChatGPT/Claude.
- Atribución: first_touch_source + landing + article/service CTA + campaña consentida -> lead -> chat -> presupuesto/cita -> expediente; no deducir origen Google orgánico del proveedor OAuth.
- Captura prudente: sin pedir documentación/sensible antes de que exista necesidad; KIA ofrece guía y deriva con resúmenes revisables.
- CTA blog: arreglar «Abrir chat» enlazado desde ArticleIntentCTA a /dashboard?kia=open para anónimo. Enlace público interno debe abrir KIA web; cliente identificado puede continuar en portal con contexto verificado.
- Telegram es continuidad con vinculación voluntaria cuando se exige contexto privado, no una fuente de permisos por conocimiento del alias.
- Futuros múltiples adjuntos/Word/Excel/PDF/artefactos solo anunciar tras pruebas reales de API, privacidad y UI.

## 8. Plan de implantación incremental con PRs

| Fase | PR/acoplamiento | Entregables | Gate |
| --- | --- | --- | --- |
| W0. Inventario 360 | docs independiente | rutas ES/RU + OG/SEO + CTAs + legal + banners + catálogo + estados de función; snapshots staging/prod; decisiones comerciales ratificadas | matriz copy «disponible/piloto/roadmap», lista de URLs/redirects |
| W1. Higiene P0 | PR frontend pequeña | retirar campañas caducadas, duración demo, enlaces a WhatsApp obsoletos, CTA KIA roto; ajustar afirmaciones no demostradas; no tocar suscripciones sin análisis | tests no regressions y tracking; revisión legal/ventas |
| W2. Narrativa Home | PR página | nueva jerarquía con KIA, cliente, EXPERT y 3 rutas de valor; demo sintética compartida; fotos/brand sin cambiar identidad | visual QA ES/RU, mobile, consentimiento, Core Web Vitals |
| W3. Páginas plataforma/KIA | PR páginas | /plataforma y /kia, onboarding explicado, permisos, seguridad, FAQ, enlaces a ayuda | no prometer IA avanzada no operativa, revisión KIA #707 y Workspace #708 |
| W4. Catálogo y Holded | PR de contenidos | ajustar /servicios, páginas de área y /holded; mapa servicio → onboarding → expediente; CTA de contabilidad colaborativa | sin checkout roto; estado legal /planes documentado |
| W5. Blog/Academy/SEO | PR contenido + navegación | clusters sobre colaboración contable, AI fiscal responsable, KIA, Holded, expedientes; ES/RU, hreflang, metadata, schema correctos | pruebas SEO, enlaces, links de fuentes y cifras |
| W6. Legal+analítica | PR tras revisión humana | privacidad IA, cookies, contratación, RGPD, textos de canales, origen de leads, métricas | asesoría valida contratos, derechos de clientes, consentimientos |
| W7. E2E y publicación | cutover gradual | staging, pruebas escritorio/móvil ES/RU, test KIA / lead / reserva / login / colaboración, deploy dos proyectos | CI typecheck/lint/test, seguridad, Vercel verdes, rollback por componente |

**Dependencias cruzadas:** PR #707 entrega contrato KIA y capacidades reales; PR #708 entrega rutas, estructura y screenshots de Workspace. W2 puede usar ilustración sintética sin esperar finalización UI; CTAs que abren funcionalidades privadas deben esperar verificación. No modificar core KIA, Supabase, billing ni permisos desde PR de marketing.

## 9. Definición de terminado y KPIs

**Correctitud**: no campaña vencida; una sola definición KIA; cada promesa implementada y verificada o etiquetada futuro; catálogo/condiciones/FAQ/precios/checkout alineados; sin texto/links WhatsApp obsoletos; rutas ES/RU coherentes y sin 404; no confundir consultoría puntual con licencia SaaS para terceros.

**Conversión medible** (sin inventar resultados): clic hero KIA → primera consulta útil; consulta → servicio/cita; solicitud → expediente; artículo → CTA; form abandonado; % visitas móviles con KIA usable; tiempo hasta primera respuesta; fallos en reservas; cobertura de fuentes en guías. Segmentar público vs cliente, con atribución respetuosa del consentimiento y sin tracking invasivo.

**Despliegue:** screenshots a 390/768/1280/1440/1920, teclado/accesibilidad, contraste, SEO structured data, canonical/hreflang, eventos de medición reales, privacidad. Feature flags o control de publicación de nuevos hero/páginas; rollback inmediato al copy actual si hay regresión.

## 10. Fuentes del diagnóstico y límites

Código auditado en main: app/(public)/page.tsx, /planes/page.tsx, /servicios/page.tsx, /servicios/[categoria]/[servicio]/page.tsx, /para-asesorias/page.tsx, /holded/page.tsx, /ayuda/kia/page.tsx, /condiciones/page.tsx, /layout.tsx; components/site/Hero.tsx, JulyCampaignBanner.tsx, WhatsAppChatWidget.tsx y ArticleIntentCTA.tsx. Planes #707 y #708.

Páginas indexadas: https://expertconsulting.es/, https://expertconsulting.es/planes, https://expertconsulting.es/holded, https://expertconsulting.es/para-asesorias, https://expertconsulting.es/condiciones. **No se han probado clicks, pagos, reservas ni autenticación de producción de extremo a extremo**. Distinguir fuentes indexadas de versión compilada. Los dominios alternativos no accesibles externamente quedan fuera de afirmaciones operativas hasta validación.

**Esta PR sólo crea un plan:** no cambia copy publicado, ofertas contratadas, campañas activas, datos de clientes, pipelines KIA ni política de contratos.
