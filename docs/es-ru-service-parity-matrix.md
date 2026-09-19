# Matriz inicial de paridad ES/RU — servicios puntuales

Estado: inventario operativo inicial  
Fecha: 19/09/2026  
Epic: #360  
Plantilla canónica: nacionalidad española para menor nacido en España (ES/RU)

## Criterio de clasificación

- `stable`: precio, alcance y flujo suficientemente cerrados para sincronizar ES/RU ahora.
- `needs-review`: existe servicio publicado, pero conviene revisar precio, alcance, documentación, checkout o copy antes de traducir.
- `blocked`: hay una dependencia funcional/comercial pendiente que impide una traducción segura.

La clasificación es deliberadamente conservadora. No se traduce un servicio por el mero hecho de tener página ES.

## Lote 1 — stable

| Orden | Servicio | Slug | ES | RU | Precio / flujo | Estado |
|---|---|---|---|---|---|---|
| 1 | Nacionalidad española para menor nacido en España | `nacionalidad-espanola-menor-nacido-en-espana` | landing específica completa | landing específica completa | 250 € + IVA + suplido 790-026 104,05 € | stable / referencia |
| 2 | Certificado Digital Persona Física — Camerfirma | `certificado-digital-persona-fisica` | catálogo + página genérica | sin landing RU dedicada | 90 € + IVA, checkout directo validado | stable |
| 3 | Certificado Digital de Entidad — Camerfirma | `certificado-digital-entidad` | catálogo + página genérica | sin landing RU dedicada | 150 € + IVA, checkout directo validado | stable |
| 4 | Pack Starter Holded | `holded-pack-starter` | catálogo / Holded | RU comercial parcial en Holded | 499 € + IVA, checkout directo | stable |
| 5 | Migración Holded — Sin Inventario | `holded-migracion-sin-inventario` | catálogo / Holded | RU comercial parcial en Holded | 899 € + IVA, checkout directo | stable |
| 6 | Migración Holded — Con Inventario | `holded-migracion-con-inventario` | catálogo / Holded | RU comercial parcial en Holded | 1.199 € + IVA, checkout directo | stable |
| 7 | Migración laboral a Holded | `holded-migracion-laboral` | catálogo | sin landing RU dedicada | 50 € + IVA / empleado, mínimo 5, quote-only estructurado | stable |
| 8 | Módulo Formación Holded | `holded-modulo-formacion` | catálogo | sin landing RU dedicada | 180 € + IVA, servicio cerrado | stable |

### Orden de ejecución del lote 1

1. Certificado digital persona física.
2. Certificado digital de entidad.
3. Pack Starter Holded.
4. Migración Holded sin inventario.
5. Migración Holded con inventario.
6. Migración laboral a Holded.
7. Módulo Formación Holded.

La nacionalidad de menor no se rehace: se usa como plantilla y control de calidad.

## Lote 2 — needs-review antes de traducir

| Servicio | Slug | Motivo |
|---|---|---|
| Declaración de la Renta (IRPF) | `irpf` | confirmar que precio/alcance actuales son los definitivos para esta campaña |
| Modelo 720 | `modelo-720` | precio fijo y checkout existente, pero revisar copy normativo/SEO antes de duplicar RU |
| Arraigo Familiar | `arraigo-familiar` | revisar vigencia normativa y documentación antes de traducción |
| Arraigo Laboral | `arraigo-laboral` | revisar vigencia normativa y copy legal |
| Renovación de Residencia | `renovacion-residencia` | validar alcance exacto y supuestos incluidos |
| Nacionalidad Española | `nacionalidad-espanola` | separar bien caso general de la landing específica de menor |
| Reagrupación Familiar | `reagrupacion-familiar` | revisar requisitos y documentación vigente |
| Permiso Inicial de Residencia | `permiso-residencia-inicial` | alcance muy amplio; confirmar vías cubiertas |
| Alta de Autónomo | `alta-autonomo` | validar precio final y alcance con flujo de onboarding actual |
| Constitución de Sociedad Limitada | `constitucion-sl` | revisar precio definitivo y diferencia exacta frente a CIRCE |
| Módulo Laboral Holded | `holded-modulo-laboral` | validar que alcance no se solapa con migración laboral |
| Otras Integraciones API Holded | `holded-integraciones-api` | el alcance puede variar según integración |
| Formación en Holded | `formacion-holded` | revisar si debe quedar como bloque único o modular |

## Lote 3 — blocked / variable

No traducir todavía como landing específica hasta cerrar alcance o precio:

- `modelo-151`
- `no-residentes`
- `iva-trimestral`
- `impuesto-sociedades`
- `modelos-informativos`
- `nie-pasaporte`
- `constitucion-sl-circe` — estructura ya corregida, pero el rollout multilingüe queda después del primer lote stable
- `nif-socio-extranjero` — flujo por cantidad corregido; esperar validación completa del modelo quote-only
- `contabilidad-mensual`
- `impuestos-trimestrales`
- `baja-cese-actividad`
- `cuentas-anuales`
- `apoderamientos-mercantiles`
- `matriculacion`
- `duplicado-permiso`
- `tramites-embarcaciones`
- `herencia`
- `donacion`
- `hipoteca-cancelacion`
- `formacion-laboral-rrhh`
- `formacion-administraciones-publicas`
- `formacion-alta-autonomo-sl`
- `formacion-planificacion-fiscal`

## Estado RU actual

### Ya resuelto
- Landing dedicada de nacionalidad de menor.
- Infraestructura general RU:
  - `app/(localized)/ru/[[...slug]]`
  - `RU_PUBLIC_CONTENT`
  - `RU_COMMERCIAL_DATA`
  - rutas localizadas
  - metadata/hreflang general

### Parcial
- Holded.
- Planes.
- Fiscalidad general.
- Autónomo.
- SL.
- Academy.
- VERI*FACTU.
- Consulta.

### Pendiente
- La mayoría de páginas de servicio puntual no tienen landing RU dedicada.
- Falta una estrategia común para reutilizar datos comerciales ES y traducir únicamente el copy.
- Falta QA automático de paridad por servicio.

## Regla de implementación del lote 1

Para cada servicio:

1. confirmar que el servicio pertenece al lote puntual y no a migraciones/suscripciones;
2. revisar la ficha ES contra la plantilla canónica;
3. mover a constante compartida cualquier dato económico que hoy esté duplicado;
4. crear copy RU;
5. crear/mapping de ruta RU;
6. conectar mismo checkout/presupuesto;
7. añadir enlace ES ↔ RU;
8. revisar canonical/hreflang;
9. añadir tests de paridad;
10. CI + Vercel;
11. merge;
12. pasar al siguiente.

## No hacer durante este bloque

- no rediseñar servicios `needs-review`;
- no cambiar precios para “hacer encajar” la traducción;
- no crear productos Stripe distintos por idioma;
- no traducir masivamente categorías completas;
- no duplicar lógica financiera en páginas RU;
- no publicar páginas RU a medias.
