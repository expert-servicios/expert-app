# EXPERT · Auditoría editorial de enlaces, recursos relacionados y consultas gratuitas

> **Consolidación documental 17/10/2026 · propuesta histórica #760:** documento auxiliar subordinado al [Plan Maestro E0–E6](../expert-kia-ecosystem-master-plan-2026-10-10.md). Sus auditorías de fechas anteriores requieren revalidación contra `main`, fuentes oficiales y estado real antes de cualquier ejecución. **No autoriza implementación, publicación, cambios comerciales ni activación de servicios o KIA.**


**Fecha:** 13/10/2026  
**Tipo:** diagnóstico / backlog; **ninguna modificación de UI ni publicación**  
**Prioridad histórica al 13/10:** paridad y traducciones ES/RU. **Reconciliación 17/10:** PR #758 y #759 ya fusionadas; esto no demuestra paridad total actual. Revalidar CMS, rutas y SEO antes de ejecución editorial.  
**Ámbito:** blog, base de conocimientos (docs), contenidos ES/RU, enlaces a Holded Academy, CTAs comerciales y KIA.

## 1. Hallazgos contrastados con código

| Superficie | Existe | Hueco / riesgo | Referencia |
|---|---|---|---|
| Blog ES, artículo | `ArticleIntentCTA`: consulta gratis, solicitud, cita de 15 minutos, KIA/Telegram; además 2 artículos de la misma categoría | La coincidencia por **categoría** no garantiza relevancia; lateral «Servicios relacionados» hardcodeado (Nacionalidad/Fiscalidad/Extranjería/Empresas), sin curación por artículo. | `app/(public)/blog/[slug]/page.tsx` |
| Docs ES, artículo | `ArticleIntentCTA`, servicios vinculados mediante `relatedServiceSlugs`; tres guías por categoría o etiquetas; demo Holded cuando procede | En ausencia de `relatedServiceSlugs` aparece una solicitud genérica; la categoría sola tampoco garantiza pertinencia; no hay enlace contextual obligatorio a Holded Academy. | `app/(public)/docs/[slug]/page.tsx` |
| CTA común ES | Guarda origen `blog:slug` o `docs:slug`; calculadora de precios cuando está configurada; accesos a Telegram y KIA | «Abrir chat» dirige a `/dashboard?kia=open`; validar experiencia anónima y evitar que un usuario sin cuenta termine en login innecesariamente. | `components/content/ArticleIntentCTA.tsx` |
| Blog/guías RU | Algunas fichas y recursos con enlaces ES y CTA, pero componentes distintos de la plantilla ES | No se acredita paridad global de CTAs, formulario de consulta, relacionados ni rutas localizadas. No inyectar directamente CTA español en RU. | `components/i18n/RuNationalityResourcePage.tsx`, `components/content/UkraineLongTermPage.tsx`, `app/(localized)/ru/blog/**` |
| Academy de gestión laboral | Existe base de conocimientos pública y manuales restringidos a matriculados | **Respetar acceso privado**; enlazar solo el contenido público, no desbloquear recursos internos como «relacionados». | `app/(public)/docs/laboral/[slug]/page.tsx` |
| Documentación Holded integrada | Algunos documentos incorporan enlaces directos oficiales a API, permisos y configuración | No existe garantía sistemática de enlace a la guía oficial de Holded por función citada. | `lib/content/holded-integration-docs.ts` |

**Alcance real de la auditoría:** contratos de renderizado y revisión de módulos principales del repositorio. El corpus incluye contenidos importados de generadores, módulos separados y material con acceso restringido. No se ha ejecutado un crawler completo URL por URL, ni pruebas visuales en los dos idiomas; por tanto NO declarar «todos comprobados».

## 2. Fuentes de Holded verificadas y enlazado propuesto

Distinguir la autoridad: **Holded Academy documenta el uso del producto**, mientras que la normativa y los actos obligatorios se acreditan con BOE, TGSS, SEPE y AEAT según el caso.

| Tema del artículo o guía | Enlace externo correcto | Uso |
|---|---|---|
| Formación general Holded | https://www.holded.com/es/aprende | Tutoriales, webinars y vídeos oficiales |
| Centro de ayuda Holded Academy | https://help.holded.com/es/ | Búsqueda y categorías |
| Nóminas | https://help.holded.com/es/collections/17871034-nominas | Índice de contenido laboral |
| Primeras nóminas | https://help.holded.com/es/articles/15888009-como-crear-una-nomina-en-holded | Pasos y requisitos de configuración |
| Flujo laboral en Holded | https://help.holded.com/es/articles/13386213-paso-a-paso-del-contrato-a-la-nomina-automatizada | Del contrato a la nómina |
| Ficheros SILTRA | https://help.holded.com/es/articles/14321260-como-gestionar-los-ficheros-siltra-desde-holded | Flujo documentado de generación/envío/verificación (confirmar alcance de plan y permisos) |
| Contabilizar nóminas manualmente | https://help.holded.com/es/articles/6904564-como-registrar-y-contabilizar-una-nomina-de-forma-manual | Separar registro contable de cálculo de nómina |
| Recursos RRHH | https://help.holded.com/es/collections/2479910-rrhh | Jornada, ausencias y personal |

**Regla editorial:** insertar 1–3 enlaces Holded oficiales relevantes dentro del texto donde se describe la funcionalidad; presentar un bloque final «Aprender más en Holded Academy» cuando proceda. No enlazar a una landing comercial genérica si hay una guía funcional más precisa. No prometer compatibilidad, precios, gemas activas ni presentación oficial de cotizaciones sin verificar la cuenta, documentación y el procedimiento.

## 3. Relaciones semánticas: artículos, guías y servicios

Diseño previsto para una fase POST-traducciones, no para implementar ahora:

1. Registrar relaciones editoriales explícitas por artículo y locale: `relatedArticleSlugs`, `relatedDocSlugs`, `relatedServiceSlugs`, `officialSources`, `holdedSources`; usar slugs existentes, no enlaces inventados.
2. Mostrar debajo de cada artículo/guía **hasta tres lecturas útiles** priorizando el mismo trámite, pregunta o etapa y la misma lengua. Rechazar autoenlace, duplicados, recursos privados y enlaces inexistentes.
3. Mostrar el CTA del **servicio puntual** pertinente solo si existe y su situación comercial lo permite. Nunca reintroducir contabilidad mensual ni presentación periódica de modelos como productos puntuales; planes y Meta siguen en decisión separada.
4. Si no existe servicio apropiado, CTA neutro `Consulta gratuita`; evitar tarjetas comerciales irrelevantes.
5. Preservar `origen=blog:slug` / `docs:slug`, `servicio` y trazabilidad del lead, cuidando idioma y consentimiento.
6. ES/RU: relaciones y CTA deben ser equivalentes; solo enlazar a la versión rusa si existe y pasó QA. En su defecto, informar explícitamente que el recurso enlazado está en español.

## 4. Módulo localizado: consultas gratuitas

Rutas y componentes actuales:

- `/consulta-gratuita` — `app/(public)/consulta-gratuita/page.tsx`
- `components/site/FreeConsultationForm.tsx`: nombre, email, teléfono opcional, pregunta y origen/servicio; requiere reCAPTCHA.
- `POST /api/consultas-gratuitas`: valida, antispam/rate limit, asocia por email/teléfono si no hay ambigüedad, crea/actualiza **lead**, registra procedencia e interacción, avisa a administradores por email y push.
- `components/content/ArticleIntentCTA.tsx`: ya enlaza al formulario desde artículos y guías ES.

**Límite comprobado:** el endpoint registra y notifica, pero no contiene una invocación directa a KIA ni demuestra una respuesta automática efectiva al visitante. La frase de interfaz «KIA y el equipo revisarán» es una expectativa de revisión, no evidencia de respuesta entregada.

**Validaciones pendientes** (sin construir ahora): recorrido usuario anónimo → consulta → KIA Inbox → clasificación → respuesta contextual aprobada → historial, control de duplicados, feedback visible al usuario; versiones RU y ES del formulario; protección de datos y rate limit; verificación de correo/entrega; CTA «Preguntar a KIA» que realmente abra el widget público, no exclusivamente `/dashboard`; tratamiento de consultas no respondibles por IA y derivación humana.

## 5. Orden de implementación después del cierre ES/RU

- **P0 antes de lanzamiento:** auditoría exhaustiva de URLs publicadas, evitar 404, links a servicios retirados, acceso privado indebido, claims no respaldados y CTAs sin camino funcional.
- **P1:** fuente editorial estructurada, enlaces oficiales (norma + documentación Holded por rol), relaciones curadas, CTA coherente, formulario ES/RU y origen del lead.
- **P2:** componente visual coherente «Lecturas relacionadas» al pie del contenido y bloque «Aprende Holded» donde proceda; no duplicar barras laterales en móvil.
- **P3:** recomendaciones KIA semánticas y métricas de CTR, consultas y contratación; atribución sin exponer datos personales.

**Gate:** no fusionar rediseños de plantilla mientras falte la paridad lingüística; aprobar después typecheck, lint, tests, CI, ambas Vercel, pruebas ES/RU anónimas y controles de acceso.

## 6. Matriz de control por cada URL (futuro crawler)

Campos: `url_es`, `url_ru`, `kind`, `status`, `language`, `relevant_service_slug`, `service_cta`, `free_consultation_cta`, `kia_public_cta`, `related_articles`, `related_docs`, `holded_official_links`, `regulatory_official_links`, `sources_reviewed_at`, `hreflang_reciprocal`, `robots`, `valid_internal_links`, `mobile_qa`, `owner`, `evidence`.

La matriz exige comprobar URL/renderizado efectivo y no solo presencia de componentes en código. **No marcar «auditado» si solo se inspeccionó una plantilla.**
