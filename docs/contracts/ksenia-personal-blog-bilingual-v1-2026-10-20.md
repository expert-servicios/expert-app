# Contrato propuesto — Blog personal bilingüe ES/RU en EXPERT Admin

**Versión** 1.0 · **Fecha** 20/10/2026 · **Sitio** kseniailicheva.com · **Estado**: diseño, no implementado

## 1. Alcance, fuente de verdad y dependencias

- Un único sistema editorial en EXPERT Admin: sección futura `/admin/editorial/blog-personal` usando auth/Admin existente. El blog personal NO modifica el blog comercial de expertconsulting.es.
- Contenido público esperado: `/blog`, `/blog/[slug]`, `/ru/blog`, `/ru/blog/[slug]`, con routing por host; rutas internas sin colisionar con EXPERT.
- La PR #824 de la web personal es dependencia: permanece DRAFT y debe verificarse/fusionarse por su propio gate. No modificarla con este documento.
- Reutilizar la infraestructura existente de Supabase y Editorial Hub. `social_content_items` es cola de promoción social, NO fuente de verdad de artículos ni releases web.
- El blog EXPERT actual usa contenido en `lib/utils/blog.ts`; no migrarlo ni modificar sus enlaces como parte de este trabajo.

### Lectura real de Supabase, 20/10/2026 (solo consulta)

- Proyecto EXPERT `ybtpqscmqrrjjmuoryap`, activo, con `blog_posts` (9 registros, 5 `publicado`, 4 `borrador`), `social_content_items`, `social_publication_jobs`.
- `blog_posts` tiene `slug` UNIQUE global y valor por defecto `estado='publicado'`. **Riesgo**: no insertar borradores sin establecer estado explícito y un nuevo gate de publicación.
- RLS está habilitada; política histórica admin en `blog_posts` comprueba email específico; para la nueva ruta deben validarse roles/estados en servidor y RLS, sin considerar ese email un permiso suficiente.
- Ninguna lectura del repositorio evidencia que el contenido público dinámico se sirva íntegramente desde `blog_posts`. No confundir estado DB `publicado` con HTTP 200 indexable.
- No se ejecutó migración, escritura ni cambio de política.

## 2. Modelo relacional propuesto (NO SQL ejecutable)

Mantener `blog_posts.id` como raíz y añadir `site_key` (`expert` por defecto para datos legados), `original_locale`, `editorial_revision`, `active_release_id`, `scheduled_at`, `created_by`. Evitar cambiar los registros ya existentes y diferenciar claramente las nuevas publicaciones personales.

**blog_post_localizations**:
- Identidad: `id`, `post_id`, `locale` (`es|ru`), `revision`, `source_revision`.
- Contenido: `slug`, `title`, `excerpt`, `body_markdown`, `tags`, `category`, `image_path`, `image_alt`.
- SEO: `seo_title`, `meta_description`; autor/fecha derivados del post/release.
- QA: `translation_status` (`missing|pending|translated|needs_review|approved|stale`), `reviewed_by`, `reviewed_at`, timestamps.
- Restricciones candidatas: `unique(post_id,locale)`; unicidad de slugs por `site_key + locale + slug` (vía columna desnormalizada validada o índice sobre tabla de slugs auxiliar, no índice por FK cruzada), validación de idioma, límites de campos, FK con políticas de borrado conservadoras.

**blog_publication_releases**: `id`, `post_id`, `revision`, instantáneas inmutables `es_snapshot`/`ru_snapshot`, `status`, `approved_by`, `approved_at`, `published_at`, `previous_release_id`, `checksum`. Rechazar snapshots incompletos o con revisiones divergentes.

**blog_publication_events** append-only: identidad actor, post, release, acción, timestamp, resultado, hash de revisión (no datos sensibles ni HTML completo en log).

*Antes de migrar*: preparar diagrama, backward migration strategy, ledger Supabase, UNIQUE/FK/trigger/RLS/grants; analizar el cambio de default `publicado` sin alterar semántica legacy. No aplicar DDL hasta gate independiente.

## 3. Contrato de acceso

- Anónimo: solo releases `published` del sitio y locale solicitados; nunca tablas de borradores, tokens ni snapshots privados.
- Admin/Owner activo: editar en Admin por sesión verificada, permiso por operación y `site_key` autorizado; `requireAdminClient` es punto de entrada candidato, no sustituye una verificación de ámbito y actor por recurso.
- Traductor automático: solo texto explícitamente aprobado para traducir, no expedientes ni datos personales de clientes; cuota/coste, timeout y registro de versión de modelo.
- Publicador/cron: identidad de servidor acotada, credenciales solo en backend; RPC transaccional con idempotency key, bloqueo de revisión y auditoría.
- Editor/autor ajeno: sin permiso de publicación salvo delegación explícita y auditada. Denegar al usuario inactivo, suspendido, otro tenant, no autenticado y payload de otra web.

## 4. Estados y publicación atómica

`draft -> translating -> review -> approved -> scheduled|published`; `rejected` y `withdrawn` según caso. La transición `published` solo activará **un puntero de release** cuyo snapshot contiene ES y RU aprobados, mediante una transacción PostgreSQL. Las páginas públicas leen SIEMPRE el `active_release_id` y presentan el par consistente.

Preflight: misma revisión origen, traducción completa/no stale, slugs sin colisión, campos SEO, assets existentes, no links rotos críticos, fuentes normativas/consentimiento cuando aplique, revisor autorizado. Publicación programada ejecuta el release aprobado congelado; cambios posteriores obligan a nueva revisión, no mutan la publicación.

Si el commit de la transacción falla, no debe existir release publicado parcialmente. Fallos posteriores de revalidación de caché/HTTP registran incidencia y permiten volver a apuntar al release anterior mediante RPC, con auditoría. La invalidación/ISR no es transaccional: indicar ventana de propagación, comprobación automática y rollback seguro.

## 5. Flujo editorial de interfaz

`/admin/editorial/blog-personal`: lista con búsqueda por estado, categoría, idioma, fecha y responsable; editor de dos pestañas ES/RU; subida controlada de imágenes; títulos/resúmenes/SEO separados; comparación de revisiones y vista previa segura. Acciones `Guardar`, `Traducir`, `Solicitar revisión`, `Aprobar`, `Programar`, `Publicar ES+RU`, `Retirar`, `Restaurar release`.

La aprobación es humana, con excepción explícita futura para contenido de riesgo bajo; no autoaprobar, autopublicar ni automatizar mensajes externos en fase inicial. Permitir importar DOCX solo en etapa posterior bajo conversión segura, no como requisito B1.

## 6. Contrato API candidato (sin rutas activadas)

`GET/POST /api/admin/personal-blog`; `GET/PATCH /api/admin/personal-blog/[id]`; `POST .../[id]/translate`, `review`, `approve`, `schedule`, `publish`, `rollback`.

Todos: permiso por sitio/actor, validación de payload, revisión esperada (`if-match` o revision), limitación de carga y registro. `publish` acepta idempotency key, obtiene lock SQL, verifica aprobaciones, crea release y cambia puntero. Público: lectura SSR cacheada desde vista/RPC solo publicada, evitando service-role indiscriminado.

## 7. Traducción

Traducción bidireccional ES↔RU por revisión; conservar fuentes, marcas, fechas, cifras, citas, enlaces, títulos oficiales y glosario. Comparación de estructura: headings, listas, enlaces, imágenes/alt, meta descriptions, slugs legibles, CTA y keywords. Un cambio de `source_revision` marca RU/ES generado anterior como `stale`; preservar edits humanos y mostrar diff.

Materias jurídicas/fiscales/sensibles y testimonios requieren revisión profesional/consentimiento. No incluir datos reales de expedientes o clientes en proveedores IA.

## 8. SEO y aislamiento por host

Canónicas: `https://kseniailicheva.com/blog/[slug-es]` y `https://kseniailicheva.com/ru/blog/[slug-ru]`; `hreflang` recíproco es/ru y x-default es; JSON-LD BlogPosting con author Person; fecha real, OG/Twitter por locale, sitemap personal solo 200 publicados, robots noindex de preview/borrador; redirigir slug antiguo mediante tabla de aliases sin colisión. Home y banners sociales ya aprobados son diferentes de imagen visible del artículo.

Revalidar y probar reglas `beforeFiles` por host para no interceptar `expertconsulting.es/blog`; el sitemap actual apunta a EXPERT y NO debe usarse sin segmentar por host.

## 9. Pruebas obligatorias y dependencia de lanzamiento

- ES original -> RU; RU original -> ES; diff y stale; permiso por actor/rol/site.
- Anónimo/cliente/lead/owner/inactivo/otro tenant: aislamiento RLS, borradores invisibles.
- Simulación de colisiones slug, cargas maliciosas/XSS, imagen no válida, timeout traducción, fallo IA, dos publicaciones concurrentes, cron repetido, rollback, cambio de revisión después de aprobar.
- Ambas páginas visibles HTTP 200, noindex hasta publicar, canonical/hreflang recíproco, sitemap correctas, OG ES y RU, móvil (375/768), escritorio, accesibilidad.
- 0 regresiones a blog EXPERT ni a los 9 registros anteriores.
- Último SHA: typecheck, lint, tests, build, CI y ambas previews Vercel; Security Advisor/ledger/RLS, revisión independiente, feature flag inicialmente desactivada.

## 10. Orden operativo y límites

B0 diagnóstico -> B1 esquema+RLS documentados -> B2 rendering público -> B3 Admin -> B4 traducciones/revisión -> B5 release transaccional -> B6 SEO/monitorización, difusión social después.

**Freeze actual:** E0 sigue en curso, la propuesta se anota en el Plan Maestro sin activar tareas funcionales. Cualquier migración, PR funcional, cambios de rutas productivas, gasto IA o autopublicación requiere autorización de excepción y gate de seguridad independientes. Este contrato por sí solo no equivale a implementación ni publicación.
