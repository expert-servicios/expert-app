# Auditoría de alineación ES — servicios puntuales de gestión

Estado: inventario operativo
Fecha: 19/09/2026
Referencia canónica: `nacionalidad-espanola-menor-nacido-en-espana`
Epic relacionado: #360

## Alcance

Este bloque cubre exclusivamente **servicios puntuales de gestión/tramitación no relacionados con Holded y no formativos** que estén suficientemente definidos para llevarlos a producción con la plantilla canónica ES/RU.

Quedan expresamente fuera:
- todos los servicios Holded, sin excepción;
- todas las formaciones, cursos, sesiones formativas y productos Academy;
- planes y suscripciones mensuales;
- cualquier producto que use otra arquitectura comercial o plantilla.

Holded y Formación tendrán roadmaps y plantillas propios.

La existencia de un CTA de «Hazlo por tu cuenta» dentro de una página de gestión no convierte esa formación en parte de este bloque: el CTA puede enlazar al producto formativo correspondiente, pero la página y el producto de formación se trabajan en su plantilla específica.

## Objetivo

Revisar las páginas españolas de servicios puntuales incluidas en alcance para que sigan el mismo patrón funcional y comercial de la referencia canónica antes de sincronizar cada servicio con ruso.

La auditoría no autoriza a inventar precios, alcance, requisitos ni documentación. Los servicios con datos comerciales o jurídicos pendientes deben seguir en `needs-review` o `blocked`.

## Patrón técnico

La mayoría de servicios puntuales ES usa:

`app/(public)/servicios/[categoria]/[servicio]/page.tsx`

La plantilla genérica ya soporta:
- metadata y canonical;
- JSON-LD de servicio, breadcrumb y FAQ;
- hero;
- checkout directo o presupuesto;
- caso complejo;
- enlace a opción formativa cuando proceda;
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
- bloque de decisión;
- artículos y guías;
- CTA final;
- sidebar sticky.

Por tanto, en la mayoría de servicios el principal hueco no es de layout, sino de contenido estructurado y validación comercial/normativa.

## Producción cerrada / referencia

- `nacionalidad-espanola-menor-nacido-en-espana`
- `certificado-digital-persona-fisica`
- `certificado-digital-entidad`

Nacionalidad de menor se mantiene como referencia canónica. Los dos certificados quedan en fase de cierre de QA de producción ES/RU.

## Candidatos no-Holded y no-formación más maduros

Por completitud actual del catálogo, los siguientes candidatos a auditar son:

1. `arraigo-social`
2. `arraigo-familiar`
3. `arraigo-laboral`
4. `renovacion-residencia`
5. `nacionalidad-espanola`
6. `reagrupacion-familiar`

Antes de promover cualquiera a `production-ready` se debe verificar normativa, alcance, documentación, precio, billing y checkout vigentes.

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

No completar por mera redacción: primero validar alcance, precio y vigencia.

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

Los servicios formativos no aparecen en `needs-review` ni `blocked` porque están **fuera de alcance**, no pendientes dentro de esta plantilla.

## Orden de trabajo

1. Cerrar QA de Certificado digital persona física.
2. Cerrar QA de Certificado digital de entidad.
3. Auditar `arraigo-social` como siguiente candidato por ser la ficha no-Holded/no-formación actualmente más completa.
4. Si supera validación jurídica/comercial, llevarlo a 100 % ES y después RU.
5. Continuar con el siguiente candidato más maduro.
6. No incorporar Holded ni Formación a esta cola.

## Regla de cierre de un servicio

Un servicio solo puede marcarse `production-ready` cuando:
- precio y flujo están confirmados;
- billing persona/empresa está confirmado;
- metadata está completa;
- alcance está descrito;
- documentación está descrita;
- proceso está descrito;
- incluidos y no incluidos están claros;
- existe CTA de caso complejo cuando procede;
- el enlace a formación, si se ofrece, apunta al flujo formativo separado;
- existe reunión informativa cuando aporta valor;
- checkout o presupuesto apunta al flujo correcto;
- JSON-LD no duplica manualmente datos económicos que puedan derivarse;
- artículos/docs relacionados se usan cuando existen;
- si existe RU, ambos idiomas comparten lógica económica y tienen hreflang recíproco;
- tests, CI y preview están verdes.

## Primera corrección aplicada

Para los dos certificados:
- aviso ES explícito de alcance de facturación;
- persona física vinculada al perfil de la persona titular;
- entidad vinculada a la organización;
- hreflang recíproco ES/RU;
- tests de regresión.

Siguiente candidato: `arraigo-social`, sujeto a validación normativa y comercial previa.
