# EXPERT — Protocolo de paridad ES/RU (13/10/2026)

Estado: propuesta técnica aprobada por Dirección; **no desplegada**. Complementa ADR-0001 sin alterar sus rutas canónicas. Responsable: EXPERT. Referencia: auditoría del árbol main 13/10/2026.

## Diagnóstico verificado
- Inicio ES `app/(public)/page.tsx` + `components/site/Hero.tsx` (portada completa); RU `app/(localized)/ru/[[...slug]]/page.tsx` + `RuPublicPage` (portada resumida).
- ES utiliza `Header`, `Footer`, `KiaPublicWidget`, `CartSidebar`, `LanguageSwitcher` y otros elementos del layout. RU usa encabezado propio y `RuSiteFooter`, sin paridad de todas las superficies.
- El mapa `PUBLIC_ROUTE_MAP` es parcial y `inferPublicRouteKey` devuelve `home` para rutas RU desconocidas: el selector puede perder la página.
- La portada ES todavía contiene copy de planes recurrentes y condiciones históricas; no se debe traducir literalmente contenido comercial retirado, primero se valida el canon actualizado.
- Existen fichas RU específicas y páginas RU de blog/Docs; **no** eliminarlas ni sustituirlas por una plantilla genérica.

## Arquitectura objetivo
1. Una sola fuente de verdad de secciones, orden, imágenes, componentes, CTA, precio y reglas; ES y RU son variantes de contenido, no aplicaciones separadas.
2. Reutilizar los componentes originales refactorizados para recibir `locale` y copy tipado de `next-intl`; prohibidos encabezados y pies paralelos a largo plazo. Eliminar duplicados solo después de pruebas de paridad.
3. Rutas ES sin prefijo, RU bajo /ru; mapa bidireccional de rutas canónicas, sin fallback silencioso a portada. Añadir cobertura de categorías, servicios, landing, blog, Docs, cita, carrito, pago, políticas y agradecimientos cuando exista equivalencia funcional; preservar rutas antiguas mediante redirecciones controladas.
4. Servicio, oferta y precio únicos: `catalog_services` + `commercial_offers`; copy `service_contents` por locale; ninguna traducción altera importes, impuestos, permisos o Stripe IDs.
5. Términos sin equivalencia jurídica (NIE, TIE, IRPF, Seguridad Social, Mercurio, EX-11, Holded) quedan en español, con glosa rusa al primer uso si es útil.
6. Cambios de marketing, normativa o precios: corrección canónica -> actualización simultánea ES/RU -> QA -> release. No publicar URL vacía, contenido obsoleto o CTA con destino distinto.

## Lotes de implementación
- **L0** Auditoría automatizada: mapa completo de rutas/pares, componentes, strings, SEO y CTAs. Registro de faltantes y excepciones.
- **L1** Layout compartido: header, footer, menús, logo, selector, Kia, carrito, avisos; móvil y teclado. No reintroducir WhatsApp.
- **L2** Portada: mismo Hero/fondo, secciones y componentes, con copy ES/RU; revisar primero copy comercial vigente.
- **L3** Catálogo: todas las categorías y fichas; mismas ofertas/precios y embudo.
- **L4** Blog, Docs, Academy, Holded, trámites, legales, formularios y pantallas de pago/éxito; paridad de rutas y contenido.
- **L5** SEO: canonical y hreflang por par real, indexación aprobada, sitemap, OG locales, sin `noindex` inadvertido ni duplicación SEO.
- **L6** E2E: 375/768/1440 px, capturas emparejadas, enlaces, formularios, carritos, accesibilidad, cookies, errores, consentimiento y pago de prueba.

## Gate de cada cambio futuro
Una PR con diff ES/RU, correspondencia de rutas, estado de traducciones, prueba de paridad estructural y visual, revisión legal/editorial, typecheck, lint, test, ambas Vercel previews, seguridad y rollback. No fusionar ni liberar por CI histórico. Si falta traducción, mantener ambas versiones en la versión anterior, o aplicar una excepción temporal documentada y visible para Admin, nunca fallback a página irrelevante.

## Compatibilidad con plan E0
El Plan Maestro canónico `docs/expert-kia-ecosystem-master-plan-2026-10-10.md` congela el alcance durante E0. **Este documento no cambia ese checkpoint**. La implementación progresiva de L1–L6 requiere registrar excepción formal de Dirección y gate por PR en el maestro antes de fusionar código que altere runtime; hasta entonces, diagnóstico, tests y documentación.
