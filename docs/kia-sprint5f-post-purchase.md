# KIA Visual Copilot — Sprint 5F · Post-compra

Fecha: 2026-09-17
Base: Sprint 5E / PR #282
Superficie: `/dashboard/post-compra`

## Objetivo

Extender la guía visual de KIA al flujo de activación posterior a la compra sin modificar Stripe, suscripciones, citas, Holded ni el cierre humano del onboarding.

## Señales permitidas

KIA consume únicamente tres señales estructuradas ya disponibles en la pantalla:

- existencia de suscripción activa/trialing confirmada por backend;
- reunión de onboarding reservada y no cancelada;
- existencia de una conexión Holded ya detectada por los endpoints actuales.

No recibe datos de tarjeta, importes, identificadores Stripe, API tokens, credenciales, texto libre ni datos personales.

## Mapping

```text
suscripción todavía no confirmada
  -> pensando

suscripción activa + reunión no reservada
  -> ayuda

suscripción activa + reunión reservada + Holded no conectado
  -> explicacion

suscripción activa + reunión reservada + Holded conectado
  -> confianza
```

### Precedencia

```text
suscripción no confirmada
  > reunión pendiente
  > Holded pendiente
  > preparación previa completa
```

La conexión Holded no salta el requisito de reservar onboarding. Una conexión previa puede existir, pero la guía continúa indicando primero el hito pendiente de reunión.

## No se utiliza `exito` ni `celebracion`

Aunque reunión y Holded estén preparados, el alta aún no está cerrada. La propia pantalla establece que después de celebrar la sesión un asesor EXPERT debe validar y marcar el onboarding como completado.

Por tanto:

- `confianza` significa preparación previa completa;
- `exito` queda reservado al cierre real confirmado;
- `celebracion` no se deduce de estos prerrequisitos.

## Estado de espera de suscripción

`PostCompraWaiting` conserva exactamente el polling existente:

- refresco cada 3 segundos;
- máximo 10 intentos;
- redirección al dashboard después del límite.

KIA añade únicamente una explicación visual `pensando`. No ejecuta el polling ni llama a Stripe.

## Arquitectura

```text
flags backend/UI existentes
  -> resolvePostPurchaseGuidance
  -> KiaGuidanceCard
  -> KiaAvatar
```

No se añade una llamada LLM, tool ni endpoint.

## Seguridad

- sin DDL;
- sin cambios de producción;
- sin cambios Stripe;
- sin cambios de estado de suscripción;
- sin cambios de citas/Cal.com;
- sin cambios de permisos, secretos ni conexión Holded;
- sin acciones automáticas;
- sin inferencias desde texto libre.

## Validación

Antes de integración:

- TypeScript;
- lint;
- tests;
- Vercel `app` y `ksenia-expert` Ready;
- smoke visual autenticado desktop/móvil.

Este bloque debe integrarse después de Sprint 5E o consolidarse con él cuando ambos hayan superado sus gates visuales.
