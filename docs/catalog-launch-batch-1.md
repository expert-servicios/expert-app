# Catálogo EXPERT — Lote 1 de lanzamiento

Fecha: 19/09/2026
Estado: ejecución
Ámbito: servicios puntuales de gestión/tramitación
Exclusiones: Holded, Formación, Academy, planes y suscripciones mensuales

## Objetivo

Preparar la primera tanda pública del nuevo catálogo EXPERT con un estándar homogéneo de producto, contenido, SEO e infraestructura de marketing.

Cada servicio debe quedar completamente utilizable como:
- landing comercial;
- entrada SEO;
- fuente de conocimiento para KIA;
- activo de captación desde Facebook, Instagram y LinkedIn;
- pieza conectable al catálogo Meta y al panel Admin.

## Lote 1 — 9 servicios

1. Nacionalidad española para menor nacido en España
   - slug: `nacionalidad-espanola-menor-nacido-en-espana`
2. Certificado Digital Persona Física — Camerfirma
   - slug: `certificado-digital-persona-fisica`
3. Certificado Digital de Entidad — Camerfirma
   - slug: `certificado-digital-entidad`
4. Arraigo Social
   - slug: `arraigo-social`
5. Arraigo Familiar
   - slug: `arraigo-familiar`
6. Arraigo Laboral
   - slug: `arraigo-laboral`
7. Renovación de Residencia
   - slug: `renovacion-residencia`
8. Nacionalidad Española
   - slug: `nacionalidad-espanola`
9. Reagrupación Familiar
   - slug: `reagrupacion-familiar`

No se añade un décimo servicio en esta primera tanda hasta que uno de los siguientes candidatos supere auditoría de madurez:
- Alta de Autónomo
- Constitución de SL
- IRPF
- Modelo 720
- Permiso Inicial de Residencia

## Estado editorial inicial

| Servicio | Blog vinculados | Guías vinculadas | Estado |
|---|---:|---:|---|
| Nacionalidad menor | 0 | 3 | completar blog |
| Certificado PF | 3 | 1 | completar 2 guías |
| Certificado entidad | 3 | 1 | completar 2 guías |
| Arraigo Social | 5 | 3 | suelo editorial ES alcanzado; falta RU + QA social |
| Arraigo Familiar | 3 | 0 | completar 3 guías |
| Arraigo Laboral | 0 | 0 | crear 3 + 3 |
| Renovación residencia | 1 | 1 | completar 2 + 2 |
| Nacionalidad española | 1 | 0 | completar 2 + 3 |
| Reagrupación familiar | 1 | 0 | completar 2 + 3 |

Los recuentos son la línea base del 19/09/2026 y deben actualizarse conforme se cierren servicios.

## Definition of Done por servicio

### Producto
- ES jurídicamente/comercialmente validado.
- RU con paridad funcional.
- precio y billing validados.
- checkout o presupuesto correcto.
- documentación, proceso, incluidos y exclusiones completos.
- FAQ y caso complejo.
- CTA de reunión cuando proceda.

### SEO
- meta title;
- meta description;
- canonical;
- hreflang ES/RU;
- Open Graph;
- JSON-LD;
- sitemap;
- enlaces internos;
- mínimo 3 artículos blog;
- mínimo 3 guías KB.

### Conocimiento
- KIA alineada;
- checklist interno alineado;
- viabilidad/readiness alineada cuando proceda;
- ninguna regla obsoleta en prompts o documentos auxiliares.

### Marketing
- paquete Facebook;
- paquete Instagram;
- paquete LinkedIn;
- URL destino;
- UTM por canal;
- activo visual pendiente o definido;
- CTA coherente con landing;
- estado editorial aprobado.

### QA
- tests de contenido crítico;
- tests de paridad ES/RU;
- tests de precio/checkout;
- CI verde;
- preview/Vercel revisado.

## Paquete social estándar

Cada servicio debe producir, como mínimo:

### Facebook
- post educativo largo;
- post problema → solución;
- post CTA al servicio o guía.

### Instagram
- caption largo;
- caption corto;
- carrusel propuesto de 5–7 slides;
- reel/video brief reutilizable para HeyGen más adelante.

### LinkedIn
- post experto;
- post comparativo o cambio normativo;
- post orientado a empresa/profesional cuando el servicio lo permita.

## UTM base

- Facebook:
  - `utm_source=facebook`
  - `utm_medium=social`
- Instagram:
  - `utm_source=instagram`
  - `utm_medium=social`
- LinkedIn:
  - `utm_source=linkedin`
  - `utm_medium=social`

Campaña:
`utm_campaign=expert_catalog_launch_<service_slug>`

## Integración con Meta y LinkedIn

La infraestructura canónica ya dispone de:
- `catalog_services`;
- `service_contents`;
- `commercial_offers`;
- `service_channel_configs`;
- `meta_catalog_items`;
- `meta_catalog_sets`;
- `meta_sync_jobs`;
- `meta_api_logs`.

La primera fase de este lote no publica automáticamente.

Orden:
1. cerrar servicios y contenido;
2. marcar canal como `review`;
3. validar Meta Catalog projection;
4. definir integración editorial de Facebook/Instagram;
5. estudiar y validar publicación LinkedIn;
6. activar publicación solo tras aprobación.

## Orden operativo

1. Arraigo Social — cerrar estándar 3 blog + 3 KB + paquete social.
2. Certificados PF y entidad — completar KB + social.
3. Nacionalidad menor — completar blog + social.
4. Arraigo Familiar.
5. Arraigo Laboral.
6. Renovación de Residencia.
7. Nacionalidad Española general.
8. Reagrupación Familiar.
9. auditoría final de lote y activación de canales.

## Regla de publicación

Ningún servicio entra en la primera campaña de Facebook/Instagram/LinkedIn hasta cumplir el Definition of Done completo.
