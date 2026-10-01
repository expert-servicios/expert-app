# QA - Pagina /planes con Plan Supervision

Fecha: 2026-10-01

## Casos de validacion

1. `/planes` no muestra "Plan Gratuito" como plan EXPERT.
2. La prueba Holded 14 dias aparece como bloque independiente antes de los planes.
3. Plan Supervision aparece con precio 49 EUR/mes + IVA.
4. Plan Supervision incluye preparacion y presentacion de impuestos periodicos basicos dentro de su alcance.
5. Kia diferencia los planes por nivel de revision, cierre fiscal, intervencion y complejidad; no por excluir impuestos del plan Supervision.
6. El checkout de suscripcion no bloquea por falta de Holded; la conexion se resuelve durante el onboarding poscompra.
7. Los CTAs principales usan readiness, portal, Kia, `/cita` con Google Calendar/Meet o presupuesto; no dependen del proveedor legacy.
8. Los planes mensuales usan readiness, no viabilidad.
9. Plan Personalizado se presenta como presupuesto y no tiene checkout directo.
10. Metadata SEO actualizada con "desde 49 EUR/mes".

## Resultado esperado

- Planes visibles: Supervision, Avanzado, Colaborativo y Personalizado.
- Prueba Holded se entiende como software, no como plan EXPERT.
- Pack Starter queda como servicio profesional separado.
- Holded se comunica como obligatorio y no incluido.
- La falta de Holded no bloquea el pago; queda como accion obligatoria del onboarding poscompra.
- Checkout `/api/subscriptions/checkout` exige perfil, entidad y datos fiscales suficientes; no exige Holded activo antes del pago.

## Pruebas automaticas recomendadas

- `npm run typecheck`
- `npx eslint app/(public)/planes/page.tsx components/planes/PlanCtaButton.tsx lib/data/service-readiness-checks.ts lib/services/service-registry.ts app/api/subscriptions/checkout/route.ts`
- `npm run kia:eval`
- `npm run build`

## Validacion ejecutada

- `npm run typecheck` - OK.
- ESLint dirigido sobre planes, readiness, checkout, Kia y emails - OK.
- `npm run kia:eval` - OK, 161 casos pasados.
- `npm run kia:auditor:test` - OK.
- `npm run build` - OK.
- Smoke local `http://localhost:3000/planes` - OK.
- Redirects legacy:
  - `/planes/basico` -> `/planes/avanzado`
  - `/planes/estandar` -> `/planes/colaborativo`
  - `/planes/premium` -> `/planes/presupuesto-personalizado`
