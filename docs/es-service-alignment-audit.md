# Auditoría de alineación ES — páginas de servicios

Estado: inventario operativo
Fecha: 19/09/2026
Referencia canónica: `nacionalidad-espanola-menor-nacido-en-espana`
Epic relacionado: #360

## Objetivo

Revisar todas las páginas españolas de servicios para que evolucionen hacia el mismo patrón funcional y comercial de la referencia canónica antes de sincronizar cada servicio con ruso.

La auditoría no autoriza a inventar precios, alcance, requisitos ni documentación. Los servicios con datos comerciales o jurídicos pendientes deben seguir en `needs-review` o `blocked`.

## Hallazgo estructural

La mayoría de servicios ES usa:

`app/(public)/servicios/[categoria]/[servicio]/page.tsx`

La plantilla genérica ya soporta:
- metadata y canonical;
- JSON-LD de servicio, breadcrumb y FAQ;
- hero;
- checkout directo o presupuesto;
- caso complejo;
- formación one to one;
- reunión gratuita;
- descripción;
- puntos clave;
- audiencia;
- incluidos;
- documentación;
- proceso;
- no incluido;
- revisión previa;
- modalidades;
- bloque «Elegir vía»;
- artículos y guías;
- CTA final;
- sidebar sticky.

Por tanto, para estos servicios el principal hueco no es de layout: es la falta de contenido estructurado en `lib/utils/catalog.ts`.

Holded tiene además landings dedicadas fuera de la plantilla genérica y debe revisarse página por página.

## Estado por bloques

### Referencia completa

- `nacionalidad-espanola-menor-nacido-en-espana`

No requiere rehacer. Se usa como control de calidad.

### Casi alineados

- `certificado-digital-persona-fisica`
- `certificado-digital-entidad`
- `arraigo-social`
- `arraigo-familiar`
- `arraigo-laboral`
- `renovacion-residencia`
- `nacionalidad-espanola`
- `reagrupacion-familiar`

Acción:
- completar únicamente campos faltantes;
- validar normativa antes de tocar extranjería;
- no alterar precios o checkout sin preflight.

### Servicios puntuales Holded incluidos en este bloque

- `holded-pack-starter`
- `holded-modulo-formacion`

Se tratan como servicios puntuales, no como migración ni suscripción. Antes de RU:
- alinear las cuatro vías comerciales cuando procedan;
- completar audiencia, requisitos, documentación, proceso y límites;
- usar una única fuente económica;
- completar JSON-LD de Service y FAQ;
- mantener paridad entre landing, catálogo y checkout.

### Fuera de alcance de esta plantilla

- `holded-migracion-sin-inventario`
- `holded-migracion-con-inventario`
- `holded-migracion-laboral`
- planes y suscripciones mensuales EXPERT

Estos productos siguen otra lógica operativa y comercial y tendrán una auditoría específica separada.

### Needs-review

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
- `holded-modulo-laboral`
- `holded-integraciones-api`
- `formacion-holded`

No completar por mera redacción: primero validar alcance, precio y vigencia.

### Blocked / variable

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
- `formacion-fiscal-contable`
- `formacion-laboral-rrhh`
- `formacion-administraciones-publicas`
- `formacion-alta-autonomo-sl`
- `formacion-planificacion-fiscal`

## Orden de corrección ES — bloque de producción puntual

1. Certificado digital persona física.
2. Certificado digital de entidad.
3. Pack Starter Holded.
4. Módulo Formación Holded.
5. Auditar y promover a la cola el siguiente servicio puntual más maduro.
6. `needs-review` entra solo después de validar contenido.
7. `blocked` entra solo cuando se cierre previamente su alcance comercial/funcional.

Migraciones Holded y suscripciones mensuales no forman parte de este orden.

## Regla de cierre de un servicio ES

Un servicio solo puede marcarse «alineado» cuando:
- precio y flujo están confirmados;
- billing persona/empresa está confirmado;
- metadata está completa;
- alcance está descrito;
- documentación está descrita;
- proceso está descrito;
- incluidos y no incluidos están claros;
- existe CTA de caso complejo cuando procede;
- existe opción formativa cuando aporta valor;
- existe reunión informativa;
- checkout o presupuesto apunta al flujo correcto;
- JSON-LD no duplica manualmente datos económicos que puedan derivarse;
- artículos/docs relacionados se usan cuando existen;
- si existe RU, ambos idiomas comparten lógica económica y tienen hreflang recíproco;
- tests y CI están verdes.

## Primera corrección aplicada

Para los dos certificados `stable`:
- se añade aviso ES explícito de alcance de facturación;
- persona física queda vinculada al perfil de la persona titular;
- entidad queda vinculada a la organización;
- se añaden hreflang recíprocos ES/RU en la página genérica;
- se añaden tests de regresión.

Siguiente bloque: Pack Starter Holded. Las migraciones Holded y las suscripciones mensuales quedan expresamente fuera de esta plantilla.
