# Matriz ES/RU — servicios puntuales de gestión

Estado: inventario operativo
Fecha: 19/09/2026
Epic: #360
Plantilla canónica: nacionalidad española para menor nacido en España (ES/RU)

## Alcance

Esta matriz se limita a **servicios puntuales de gestión/tramitación**.

Quedan fuera de este bloque, sin excepción:
- todos los servicios Holded;
- todas las formaciones, cursos, sesiones formativas y Academy;
- planes y suscripciones mensuales;
- cualquier servicio que utilice una plantilla comercial distinta.

Estos grupos tendrán su propio roadmap y plantilla.

## Criterio

- `production-ready`: precio, alcance, flujo, contenido ES/RU y checkout/presupuesto cerrados y validados.
- `stable`: precio, alcance y flujo suficientemente cerrados para completar QA de producción.
- `needs-review`: publicado, pero requiere revisión de precio, alcance, documentación, checkout o normativa antes de traducir/cerrar.
- `blocked`: existe una dependencia funcional o comercial pendiente.

## Producción / referencia

| Orden | Servicio | Slug | Precio / flujo | Estado |
|---|---|---|---|---|
| 1 | Nacionalidad española para menor nacido en España | `nacionalidad-espanola-menor-nacido-en-espana` | 250 € + IVA + suplido 790-026 104,05 € | production-ready / referencia |
| 2 | Certificado Digital Persona Física — Camerfirma | `certificado-digital-persona-fisica` | 90 € + IVA, checkout directo | cierre QA production-ready |
| 3 | Certificado Digital de Entidad — Camerfirma | `certificado-digital-entidad` | 150 € + IVA, checkout directo con entidad vinculada | cierre QA production-ready |

## Próximos candidatos

| Orden | Servicio | Slug | Motivo |
|---|---|---|---|
| 1 | Arraigo Social | `arraigo-social` | ficha ES muy completa; requiere validación normativa/comercial final |
| 2 | Arraigo Familiar | `arraigo-familiar` | ficha avanzada; revisar normativa y documentación |
| 3 | Arraigo Laboral | `arraigo-laboral` | ficha avanzada; revisar normativa y proceso |
| 4 | Renovación de Residencia | `renovacion-residencia` | ficha avanzada; validar alcance y supuestos incluidos |
| 5 | Nacionalidad Española | `nacionalidad-espanola` | separar con precisión del caso específico de menor |
| 6 | Reagrupación Familiar | `reagrupacion-familiar` | ficha avanzada; revisar requisitos vigentes |

Promover solo uno a uno, después de validación.

## Needs-review

- `irpf`
- `modelo-720`
- `arraigo-familiar`
- `arraigo-laboral`
- `renovacion-residencia`
- `nacionalidad-espanola`
- `reagrupacion-familiar`
- `permiso-residencia-inicial`
- `alta-autonomo`
- `constitucion-sl`

## Blocked / variable

- `modelo-151`
- `no-residentes`
- `iva-trimestral`
- `impuesto-sociedades`
- `modelos-informativos`
- `nie-pasaporte`
- `constitucion-sl-circe`
- `nif-socio-extranjero`
- `contabilidad-mensual`
- `impuestos-trimestrales`
- `baja-cese-actividad`
- `cuentas-anuales`
- `apoderamientos-mercantiles`
- `transferencia-vehiculo`
- `matriculacion`
- `duplicado-permiso`
- `tramites-embarcaciones`
- `compraventa-inmueble`
- `herencia`
- `donacion`
- `hipoteca-cancelacion`
- `certificado-digital-sin-animo-lucro`

Holded y Formación no aparecen en estas listas porque están **fuera de alcance**, no bloqueados dentro de este roadmap.

## Regla de implementación

Para cada servicio incluido:

1. confirmar que no pertenece a Holded, Formación ni Suscripciones;
2. cerrar la fuente ES;
3. validar precio, alcance, billing y checkout/presupuesto;
4. revisar normativa vigente cuando proceda;
5. completar metadata, documentación, proceso, incluidos, exclusiones y CTA;
6. mover datos económicos compartibles fuera del copy traducido;
7. crear o sincronizar RU;
8. conectar exactamente el mismo flujo económico;
9. añadir enlace ES ↔ RU y canonical/hreflang;
10. añadir imagen social principal localizada por idioma;
11. añadir compartir visible y reputación verificada;
12. añadir servicios complementarios curados sin Holded/planes/Formación;
13. verificar que no se expone ningún proveedor de marca blanca;
14. añadir tests de paridad;
15. CI + preview;
16. merge;
17. pasar al siguiente.

## No hacer

- no incorporar ningún servicio Holded;
- no incorporar ninguna formación o Academy;
- no incorporar suscripciones mensuales;
- no cambiar precios para facilitar traducciones;
- no crear productos Stripe distintos por idioma;
- no completar servicios `needs-review` o `blocked` con contenido inventado;
- no publicar páginas RU a medias.
