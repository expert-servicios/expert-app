# EXPERT RGPD Hub + KIA — Especificación funcional subordinada
Fecha de revisión: 15/10/2026 · Estado: PROPUESTA DE DESARROLLO, NO PUBLICADO.
> **Precedencia 19/10/2026:** el único Plan Maestro rector es [EXPERT/KIA E0–E6](../expert-kia-ecosystem-master-plan-2026-10-10.md); esta ficha conserva detalle RGPD de referencia, sin autorizar publicación ni tratamiento adicional.
Rama: `feat/rgpd-hub-leads-report-plan-20261015` (parte de `feat/rgpd-formacion-aepd-comfiqa-20261015`, PR #779; dependencia explícita).
Página canónica: https://expertconsulting.es/herramientas/rgpd
Caso piloto de origen: reunión con un proyecto emprendedor de marketplace, 14/10/2026. **Anonimizar todos los ejemplos públicos**. No hacer visibles los expedientes, nombres ni las respuestas particulares.

## Propósito comercial y ético
Convertir la URL de la herramienta gratuita **ya enviada a posibles clientes** en un centro de ayuda real:
- Ofrecer **valor gratuito visible sin iniciar sesión**: autoevaluación orientativa con respuesta inmediata en el navegador, herramienta AEPD recomendada con explicación, primeros pasos, FAQ, contenidos y recursos.
- Permitir elegir de forma transparente entre (1) aprendizaje gratuito, (2) formación online de **2 horas por 180 € + IVA**, (3) revisión profesional con presupuesto individual.
- Ofrecer **informe PDF opcional** personalizado, para descarga o envío por correo, registrando un lead con los mínimos datos si la persona lo solicita. No condicionar los recursos básicos a dejar un email ni condicionar el PDF a recibir publicidad.
- Diferenciar herramienta gratuita, formación y auditoría. **No prometer ni «certificar» cumplimiento RGPD** con formularios o IA.

## Inventario verificado y NO duplicar
- Página actual de `main`: breve formulario y guías laterales; **aún no incluye** las mejoras de la PR #779.
- PR #779 (borrador): herramienta orientadora entre Facilita RGPD, Facilita EMPRENDE y Gestiona RGPD; resultados con temas en lenguaje claro; enlaces a 5 artículos y 5 guías; ficha `formacion-rgpd-aepd`, precio, FAQ y CTA; SEO y contenidos.
- `components/tools/RgpdSelfAssessment.tsx`: cuestionario local y resultados básicos, sin lead; `components/tools/RgpdAccountSave.tsx` exige inicio de sesión y consentimiento explícito solo para persistir el expediente completo.
- `@react-pdf/renderer` ya disponible; `lib/leads/ensure-inbound-lead.ts` identifica leads por email con tratamiento de ambiguos; `lib/email/send.ts` registra correos; `lib/utils/spam-guard.ts` y `lib/utils/recaptcha.ts` protegen formularios.
- Issues #778 (datos en URL) y #780 (PDF + captación) ya abiertos. Relación con #776 y PR #777 (QA KIA postreunión). No reutilizar `/api/quotes` para descarga: crearía una propuesta comercial sin solicitarla.
- Fuente pública AEPD: las tres herramientas solo ayudan; *obtener sus documentos no implica cumplimiento automático*.

## Fase 0: visita inmediata y fácil de comprender — prioridad P0
1. Encabezado: «Comprueba por dónde empezar con la protección de datos»; subtítulo sin promesa de certificación.
2. Rutas en 3 pasos enlazadas con anclas: «1. Haz el cuestionario», «2. Entiende tus temas pendientes», «3. Elige cómo continuar».
3. Verificación de enlaces: ninguno roto; nombres legibles; accesibles con teclado y en móvil; externos AEPD claramente identificados.
4. Sección «¿Qué voy a conseguir?» con vista previa de las recomendaciones, sin pedir nombre/email.
5. Bloques visibles de 3 herramientas AEPD con descripciones no intercambiables, enlaces oficiales, comparación; Facilita EMPRENDE para startup; Gestiona RGPD para inventario/riesgos; Facilita RGPD solo bajo riesgo.
6. Bloques de 5 artículos, 5 guías KB y 8 FAQ sin duplicación masiva de textos; diseño mobile-first, acordeón FAQ y enlaces contextuales.
7. CTA primaria **«Hacer evaluación gratuita»**; secundaria **«Formación guiada 2 h · 180 € + IVA»**; terciaria **«Solicitar revisión profesional»**. No interferir con el uso gratuito ni mostrar popups.
8. Rutas de las fichas/guías verificadas en CI y metadatos `canonical`, OpenGraph, `FAQPage` cuando corresponda. ES y RU como requisito para publicación en ambas lenguas, sin hreflang a páginas inexistentes.
9. Si existen problemas de CI en PR #779, no publicar ninguna dependencia antes de corregirlos.

## Fase 1: guía PDF descargable con solicitud transparente — prioridad P1, issue #780
Pantalla final opcional después de **mostrar gratuitamente todo el resumen básico**:
- «Quiero mi guía personalizada PDF» y elección «Descargar» / «Enviarla a mi correo». Campos mínimos nombre y correo, sin NIF, teléfono, razón social, documentos, fotos ni datos de clientes.
- Información básica RGPD clara con enlace a política de privacidad, identificación del responsable, finalidad, base jurídica documentada por revisión legal, conservación y derechos.
- Casilla SEPARADA y desmarcada para comunicaciones comerciales; no exigirla para informe ni incluir publicidad en la entrega sin fundamento.
- Si no quiere identificarse, puede seguir leyendo, consultar enlaces y utilizar resultados básicos gratuitamente. Evaluar alternativa de descarga anónima de versión genérica sin lead para no introducir captación engañosa.
- Servidor revalida la carga limitada y tipada (categorías cerradas); sin texto libre ni adjuntos, longitud limitada; no URL/query, no localStorage no necesario, no analytics de respuestas sensibles.
- Generación PDF con `@react-pdf/renderer` y conocimiento estático verificado primero. KIA solo podrá personalizar redacción cuando existan fuentes oficiales y barreras de salida: nunca declarar cumplimiento ni que una EIPD no es necesaria automáticamente.
- PDF: portada EXPERT + KIA; destinatario y fecha; alcance metodológico; herramienta AEPD recomendada y por qué; 3–8 temas «qué significa / primer paso / guía»; prioridades; urgencias; referencias oficiales; formación y revisión profesional; aviso no certificación; fecha de revisión normativa.
- `Content-Disposition: attachment` en descarga, `Cache-Control: private, no-store`. PDF no público, ni vínculo permanente con respuestas personales en URL. Confirmar que el resultado se renderiza en Android y desktop.

## Fase 2: registro y entrega por correo — prioridad P2, issue #780
- Nuevo endpoint dedicado `/api/rgpd/report-lead`, protegido con rate limit, captcha/honeypot, tamaños máximos, normalización de correo y límites de reintento. Evitar credenciales y URL de acceso.
- Idempotencia/dedupe: intentar actualizar lead inequívoco por email mediante `ensureInboundLead`; si ambiguo, abrir revisión, nunca fusionar identidades sin evidencia.
- Registrar solo nombre, email, fecha, origen `herramienta-rgpd`, tipo de informe y señal de interés general (formación / revisión), consentimiento comercial separado y versionado; nunca almacenar respuestas individuales salvo nueva finalidad informada con consentimiento/base verificada.
- Email transaccional EXPERT: asunto claro, archivo PDF adjunto, instrucciones para continuar, enlace formación 180 € + IVA. Respetar opt-in marketing separado, registrar estado envío, retry seguro.
- Notificación administradores solo para lead nuevo/solicitud relevante, evitando duplicados y reportes de cada respuesta KIA.
- Política de conservación/supresión, roles, accesos y ejercicio de derechos definidos antes de habilitar en producción.
- Métricas agregadas anónimas de uso: inicio/completado/elección AEPD/click enlaces/click formación/solicitud informe/descarga/email/solicitud cita (sin guardar respuestas ni emails en eventos analíticos).

## Fase 3: experimentación y aprendizajes KIA
- Oportunidades: detectar temas más consultados de forma agregada; sugerir a administración nuevos artículos KB o mejoras FAQ en bandeja QA, nunca publicarlos automáticamente ni explotar historiales personales sin autorización.
- Piloto Comfi App: aplicar evaluación simulada con perfil de plataforma y datos ficticios, demostrar que no exige formularios ni detalles privados; revisar orientación, links, seguimiento. No recopilar ni divulgar el contenido del acta.
- Separar campañas con consentimiento del email de entrega. Leads no invitados automáticamente a portal; acceso externo requiere política de permisos.
- Enlaces y CTA contextuales en todos los artículos/guías RGPD, no duplicar 4 veces la misma oferta en una sola pantalla.

## QA de publicación / no-regresión
1. CI lint/tsc/tests + Vercel preview para app y ksenia-expert correctos.
2. Enlaces internos sin 404 y oficiales HTTPS actuales; control de rutas dinámicas/blog/docs/catálogo y documentos legales.
3. Semántica HTML, contraste, focus visible, teclado, formularios con labels/errores, responsive 320–390px, legibilidad 200 %.
4. Resumen orientativo disponible sin cuenta/correo; resultado sin «cumple» o «certificado».
5. Foco en experiencia del lector que acaba de recibir el enlace; fuente clara y ayuda para no expertos.
6. No se filtra score, respuestas, nombre o email en URL, logs, analytics o excepciones.
7. Spam, abuso, repetición de solicitudes, consentimiento de marketing, borrado y reenvío probados E2E.
8. PDF ES correcto, fuentes embebidas con licencia, enlaces activos; RU solo si traducción comprobada, de lo contrario publicar ES sin promesa RU.
9. CI de dependencia PR #779 y coordinación con cambios de #777; no sobrescribir producción ni fusionar PRs sin puertas de calidad.
10. AEPD/BOE/EUR-Lex contrastados y fecha de última revisión en contenidos.

## Dependencias, orden y gobernanza
- Etapa A (esta rama): plan + mejor navegación y recursos públicos; **sin persistencia, sin correo, sin PDF**.
- Etapa B (sub-PR / issue #780): PDF y flujo opt-in + API validada.
- Etapa C: piloto UX y publicación con QA y despliegues correctos. Una rama basada en #779 no estará en producción hasta fusionar y desplegar la rama base y esta rama.
- Responsable final de criterio RGPD: profesional de EXPERT; KIA puede proponer y resumir, nunca certificar.
- Cualquier dato comercial captado debe reflejar su procedencia en hoja registral y trazabilidad, sin generar expedientes o tareas automáticamente por una simple visita.

## Fuentes oficiales
- https://www.aepd.es/guias-y-herramientas/herramientas/facilita-rgpd
- https://www.aepd.es/guias-y-herramientas/herramientas/facilita-emprende
- https://gestiona2.aepd.es/
- https://eur-lex.europa.eu/eli/reg/2016/679/oj/spa
- https://www.aepd.es/derechos-y-deberes/conoce-tus-derechos/derecho-de-informacion

## Fase KIA: orientación conversacional RGPD y derivación segura (incorporada 15/10)
- **Widget ya existente**: `components/site/KiaPublicWidget.tsx` aparece globalmente en el layout público. No crear un segundo chat.
- **Accesos contextuales**: botón «Preguntar a KIA sobre privacidad», «Hacer preguntas guiadas con KIA» y «Consultar a KIA sobre formación», más enlace Telegram. Abren el widget mediante `expert:kia-open` y muestran una pregunta precargada, que el visitante decide si quiere enviar; el cuestionario actual del navegador no se transmite.
- **Conocimiento compartido**: `lib/ai/kia/prompts/kia-rgpd-knowledge.ts` centraliza enlaces, tres herramientas AEPD, límites, dudas frecuentes, precio y reglas de escalado. Se activa en la API pública por tema RGPD o página `/herramientas/rgpd`; el copiloto interno debe integrarse con este módulo en una fase posterior.
- **Preguntas de una en una**: actividad (autónomo/pyme, startup, empresa compleja), formularios, proveedores, datos especiales, perfilado y menores, con «No lo sé». Explicación final orientativa con 1–3 acciones, enlaces AEPD, guía y opción de formación 2 horas / 180 € + IVA.
- **NO hacer**: afirmar que KIA ha rellenado Facilita/Gestiona en el sitio de la AEPD sin integración autorizada; declarar conformidad, pedir datos personales de candidatos, guardar respuestas en el lead por defecto, obligar a comprar formación o generar tareas al iniciar una conversación.
- **Ruta futura**: extracción del cuestionario a un esquema común tipado para uso tanto web como conversación; continuar entre canales solo con elección informada y autenticación; no permitir que la IA modifique directamente los resultados del motor determinista.
- **Pruebas de aceptación**: abrir chat con teclado/móvil, prompt precargado sin envío automático, guía en 3 herramientas con citas, respuesta a caso ambiguo/alto riesgo, no contaminación de otras páginas, límite de datos y ausencia de venta forzada.
- **Estado**: código de accesos y prompt preparado en esta rama; no publicado, pendiente CI, QA real y validación legal.

## Implementación en rama 15/10/2026 (no publicar hasta QA)
**Código realizado:**
- Landing ES: `/herramientas/rgpd` desde PR #779 y flujo guiado, recursos/FAQ, KIA desde #781.
- Landing RU real: `/ru/instrumenty/rgpd` con 13 preguntas, resultados temáticos y herramienta AEPD orientativa; página de formación `/ru/uslugi/obuchenie-rgpd`, 2 artículos y 2 guías RU.
- Cambio de idioma enlaza rutas ES/RU emparejadas (`lib/i18n/rgpd-routes.ts`).
- KIA pública e interna reciben instrucciones del mismo módulo `kia-rgpd-knowledge.ts` cuando el contexto es RGPD. Acceso web con pregunta precargada; sin enviar cuestionario al chat automáticamente.
- PDF PDFKit/React PDF:`components/tools/RgpdReportPdf.tsx` y endpoint `/api/rgpd/report`; en ES y RU se pide nombre/email y se ofrece descarga o correo. Fuente estática Noto Sans para cirílico procedente de Noto fonts (OFL) por URL; **QA de descarga y de disponibilidad del recurso todavía obligatorio**.
- Captación: `ensureInboundLead` con email y origen; categorías del cuestionario solo para generar PDF, **no almacenadas en lead**. Protección antiabuso reCAPTCHA, rate limit, honeypot, longitud de cargas y deduplicación. Opt-in de novedades separado.
- Formulario: `components/tools/RgpdReportLeadForm.tsx`; la información básica sigue disponible sin identificación.
- Tests de render PDF ES/RU, reglas y enrutamiento KIA; resultados de CI y Vercel del último SHA pendientes.

**Gates de publicación estrictos:**
1. CI de PR #781 y ambas previews Vercel VERDE **en el mismo SHA**.
2. Test servidor PDF ES/RU con fuentes cirílicas, extracto de texto legible y enlaces clicables; verificar que el PDF se puede abrir en Android.
3. Revisión técnica de disponibilidad e integridad de los archivos estáticos de fuente Noto Sans antes de activar el endpoint en producción. Si falla, servir error controlado o desactivar la opción RU, no distribuir PDFs corruptos.
4. QA E2E y privacidad: probar fake lead únicamente en staging aislado con DB aislada; nunca ensuciar leads reales; verificar email, adjuntos, reintentos, consentimiento, políticas y supresión.
5. Verificar que la sección de política de privacidad del sitio describe esta captación específica; no basta con casilla genérica; marketing opt-in revisado.
6. Confirmar fuentes jurídicas y fechas, textos y SEO, accesibilidad, 404 y traductor ES/RU.
7. No fusionar ni desplegar hasta cumplir todo y aprobar cambios de escritura de leads; el código por sí solo no prueba comportamiento operacional.

**Dependencias:** PR #779 (CI verde en último control), PR #781 (rama integrada dirigida a main para ejecutar CI), issues #778 y #780. La web actualmente publicada no dispone de estos cambios todavía.

## Auditoría prepublicación RGPD / ES-RU — 15/10/2026
- **Criterio comercial confirmado**: Para AMBAS opciones, descargar PDF y recibir por email, recoger obligatoriamente nombre y correo. El resultado básico gratuito permanece sin registro.
- **Hallazgo BLOQUEANTE**: política pública de privacidad (fecha indicada 08/05/2026) no explica expresamente informe RGPD/lead/retención. Debe revisarse legalmente antes de habilitar.
- **Hallazgo BLOQUEANTE**: `ensureInboundLead` en coincidencia por email sobrescribe `category`, `service`, `message` y `name` de contacto existente: para un informe informativo no debe sustituir clasificación/servicio de un lead ya cualificado. Implementar evento vinculado no destructivo.
- **Hallazgo BLOQUEANTE**: origen generado con `crypto.randomUUID()` no es idempotente por solicitud. Añadir request_id generado en cliente y aceptado bajo reglas antirrepetición, conservación de evidencias y clave email estable; no confundir deduplicación por email con idempotencia de evento.
- **Hallazgo BLOQUEANTE**: tests de PDF ES/RU prueban estructura de archivo pero no legibilidad del cirílico, enlaces, envío real y adjunto; además la fuente PDF no debe depender en producción de URL remota no controlada.
- **Hallazgo BLOQUEANTE**: prueba funcional segura de endpoint en staging y validación RGPD del tratamiento de respuestas categóricas, contratos, consentimiento comercial y plazos; no probar con leads reales sin aislamiento.
- **Hallazgo ES/RU**: contenido email RU parcialmente en ES, KIA chat UI mayormente ES, muchas guías RU no existen. Revisar comportamiento del selector, enlaces y las traducciones ES/RU de la política de privacidad.
- **Medida implantada inmediata**: flags dobles por defecto OFF `RGPD_REPORT_ENABLED` (servidor) y `NEXT_PUBLIC_RGPD_REPORT_ENABLED` (UI). Exigir activación explícita de ambas solo tras QA legal, UI, E2E, seguridad y entrega. No almacenar datos desde la funcionalidad apagada.
- **Alcance KIA**: Chat y copiloto comparten prompt especializado según tema/página; esto no demuestra respuestas de IA reales ni garantiza que preguntas y fuentes oficiales se apliquen. Realizar pruebas conversacionales en ruso y español, con casos de perfilado, discapacidad, Google Tag Manager, brecha y responsabilidad administrador.
- **Decisión de fusión**: NO habilitar los flags ni fusionar/publicar la rama integrada hasta resolver gates. La PR #779 ha pasado CI, pero fusión GitHub fue bloqueada por controles de seguridad de plataforma en la sesión anterior.
