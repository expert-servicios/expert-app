# EXPERT · Traducciones ES/RU: control previo de guías de extranjería

Fecha: 13/10/2026. Alcance: auditoría **pretraducción**; no publicar traducciones de afirmaciones normativas pendientes de corrección. Prioridad superior: paridad real ES/RU. No modificar plantillas de marketing ni PR #760.

## Despliegue anterior y paridad verificada

Commit de PR #759: `13d00b9f958582636cc0a8bdb3f1546efd9ab007`, despliegue Vercel ksenia-expert READY. Se comprobaron las seis páginas ES/RU de servicio Ucrania, artículo protección temporal y guía EX-11: **HTTP 200**, lang correcto, canonical de la URL y `hrefLang` recíproco ES/RU/x-default. El atributo de Next.js en HTML es `hrefLang` (no minúsculas), por eso la comprobación anterior dio un falso negativo.

## Próxima cohorte detectada en el repositorio

| Documento ES de origen | Estado | Acción previa a RU |
|---|---|---|
| `/docs/permiso-residencia-inicial-vias-y-documentos` | Existe en `lib/utils/docs.ts`. Mezcla varias vías y conserva información heredada potencialmente desactualizada | Corregir ES conforme al RD 1155/2024 y fichas ministeriales vigentes antes de traducir. Diferenciar arraigo social, sociolaboral, familiar, familiares de españoles, otras vías |
| `/docs/renovacion-residencia-temporal-y-larga-duracion` | Existe en `lib/utils/docs.ts`. Abarca renovaciones de autorizaciones diferentes en una guía genérica | Separar condiciones dependientes de tipo de permiso; corregir plazos/tasa/renovación de tarjeta frente a autorización; luego traducir en espejo ES/RU |

### Hallazgos con respaldo normativo

1. **Arraigo sociolaboral:** el documento ES antiguo sigue describiendo «arraigo laboral» como 2 años irregulares y relación no declarada de 6 meses; **no debe trasladarse al ruso como regla actual**. La Hoja 29 del Ministerio, actualizada abril 2026, describe el arraigo sociolaboral con período mínimo de dos años y uno o varios contratos de trabajo, con condiciones específicas.
2. **Arraigo familiar:** el documento ES dice que comprende de forma genérica familiares de españoles. La Hoja 31 vigente de arraigo familiar establece supuestos específicos; la residencia de familiares de españoles dispone de regulación e instrucciones propias. Diferenciar estos procedimientos, evitar prometer vía automática por parentesco.
3. **Residencia inicial / EX-10:** no todas las autorizaciones iniciales utilizan modelo EX-10 ni el mismo régimen de silencio/plazo: separar formularios por procedimiento.
4. **Renovación y larga duración:** evitar afirmar que todas las tarjetas TIE o autorizaciones de larga duración se «renuevan» igual o que cualquier autorización caducada implica irregularidad inmediata. La Hoja 13 de renovación por cuenta ajena permite solicitud en los dos meses anteriores o tres meses posteriores, con efectos y posible sanción según el caso. No generalizarlo a todos los supuestos.
5. **Documentación:** la guía antigua contiene contradicción interna (requisito de 2 años frente a ejemplo de empadronamiento de 3 años); revisar modelos y requisitos según la vía y fecha de tramitación.

### Fuentes oficiales para corrección y traducción

- Hoja 28, arraigo social: https://www.inclusion.gob.es/web/migraciones/w/autorizacion-residencia-temporal-por-circunstancias-excepcionales.-arraigo-social
- Hoja 29, arraigo sociolaboral: https://bibliovirtual.inclusion.gob.es/web/migraciones/w/29.-autorizacion-de-residencia-temporal-por-circunstancias-excepcionales.-arraigo-sociolaboral.
- Hoja 31, arraigo familiar: https://bibliovirtual.inclusion.gob.es/web/migraciones/w/autorizacion-residencia-temporal-por-circunstancias-excepcionales.-arraigo-familiar
- Hoja 13, renovación residencia y trabajo por cuenta ajena: https://www.inclusion.gob.es/web/migraciones/w/renovacion-de-la-autorizacion-de-residencia-temporal-y-trabajo-por-cuenta-ajena
- Reglamento de Extranjería: RD 1155/2024 (BOE), y las hojas específicas por autorización.

Las páginas ministeriales son orientativas; comprobar siempre la normativa y fecha de aplicación al caso.

## Contrato de publicación ES/RU para cada nueva guía

- Corregir primero el ES canónico, respetando las fuentes; separar vías si necesario.
- Traducir RU con mismo número de secciones y hechos materiales, utilizando glosario: «вид на жительство (autorización de residencia)», «подача (presentación de solicitud)», «административное дело (expediente)», «пошлина (tasa)», «решение (resolución)», «карта (TIE)» y nombres oficiales intactos.
- Misma tabla de fuentes oficiales y fecha de revisión en ambos idiomas, enlaces exactos a organismos.
- `canonical` propio, `hrefLang` ES/RU/x-default en ambos sentidos y enlace visible al artículo equivalente; `noindex` RU hasta auditoría de lanzamiento.
- Servicio relacionado y consulta gratuita conforme al contenido vigente, sin reintroducir suscripciones periódicas ni modificar plantilla antes de cerrar traducciones.
- Control de QA: texto, enlaces HTTP, SEO, vocabulario, accesibilidad, móvil, CI, dos despliegues Vercel. No marcar paridad global por la aprobación de dos guías.

**Estado:** solo revisión documental para estas dos guías; no se han publicado versiones rusas nuevas ni se han cambiado afirmaciones normativas del sitio. La corrección ES y traducción RU quedan bloqueadas por la revisión jurídica de cada procedimiento.
