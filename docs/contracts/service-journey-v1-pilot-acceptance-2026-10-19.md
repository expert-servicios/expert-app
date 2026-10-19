# Contrato técnico subordinado: ServiceJourney v0.1 y pilotos integrales

**19/10/2026 · ESTADO: PROPUESTA PARA QA · Única autoridad ejecutiva:** `docs/expert-kia-ecosystem-master-plan-2026-10-10.md`, anexos L4/L5. Documento de especificación, no segundo plan ni implementación. No DB DDL, API nueva, pagos reales ni modificaciones de expedientes.

## 1. Inventario de fuentes actuales y adaptación

- `lib/utils/catalog.ts` — identidad comercial y copy legacy.
- `lib/services/service-registry.ts` — modalidad de viabilidad, readiness, checkout y presupuesto. Hay servicios sin Stripe identificados como `direct_checkout`: CTA debe depender además de precio y capacidad comercial.
- `lib/services/service-operational-blueprints.ts` — requisitos, documentos, pasos, tareas y política KIA. `lib/utils/service-checklists.ts` — segunda fuente a conciliar, no borrar sin comparar.
- `lib/payments/service-billing-scope.ts`, `lib/integrations/service-checkout.ts` y `app/api/services/checkout/route.ts` — pagador, precio/suplidos y cobro.
- `lib/payments/service-order-fulfillment.ts` — pedido→expediente→tareas (replays secuenciales; garantizar concurrencia antes de escalar).
- `lib/services/service-production-manifest.ts` y `docs/service-production-pipeline-v1.md` — madurez editorial por slug, distinta del QA operacional real.
- `app/(protected)/dashboard/servicios/page.tsx`, KIA pública `app/api/ai/kia/public/route.ts` y KIA privada `lib/ai/kia/kia-context-builder.ts` son proyecciones de la misma identidad del servicio con diferentes permisos.
- Academy usa catálogo, checkout y matrícula **propios**. Enlazar sin sustituir su fulfillment.

**Fuente de verdad objetivo:** resolver el servicio por slug + versión en un adaptador servidor que reconcilie catalog_services / commercial_offers / bindings con las fuentes legacy verificadas. No usar `public.services` como si ya fuese la tabla comercial sincronizada: en la lectura agregada de la conexión EXPERT había cero filas; no sembrar ni migrar sin inventario y preflight.

## 2. Contrato versionado lógico — NO es API desplegada

```typescript
type ServiceJourneyContractV1 = {
  contractVersion: 'service-journey/1';
  serviceSlug: string;
  serviceVersion: string;
  locale: 'es' | 'ru';
  offerType: 'professional_service' | 'guided_training' | 'academy_program';
  modes: ('self_guided' | 'full_service' | 'guided_training' | 'free_consultation' | 'quote_request')[];
  purchase: {
    flow: 'none' | 'quote' | 'fixed_checkout' | 'computed_quote' | 'academy_checkout';
    priceBindingRef?: string; // only server-side, verified commercial policy
    requiresPayerChoice: boolean;
    requiredDisbursements?: string[];
  };
  source: { kind: 'service' | 'blog' | 'guide' | 'kia' | 'dashboard'; ref: string };
  verifiedContext?: {
    actorId: string;
    subjectId: string;
    tenantId: string | null;
    companyId: string | null;
    caseId: string | null;
    supportActorId?: string;
  }; // resolved afresh by server; NEVER trust user input
  workflow: {
    kind: 'informational' | 'service_request' | 'paid_order' | 'case' | 'academy_enrollment';
    state: string; // domain-specific state, never reuse a generic state as an authority
    orderId?: string;
    caseId?: string;
    enrollmentId?: string;
    correlationId: string;
  };
  evidence: { sourceVersion?: string; officialReference?: string; requiresHumanReview: boolean };
};
```

**Invariantes:** slug y precio únicos por producto, traducciones como proyección; visitante/consulta/viabilidad ≠ expediente ni lead consentido; entidad no constituida ≠ CIF ficticio; solicitud de presupuesto ≠ compra; Academy ≠ prestación profesional; KIA pública nunca recibe IDs privados; servidor verifica actor/tenant/empresa/expediente y rol en cada acción; eventos idempotentes y auditables; presentación/entrega solo con evidencia y aprobación.

**CTA único a diseñar:** `resolveServiceNextAction(serviceSlug, mode, actorScope, commercialAvailability)`: `leer_guia | consultar_kia | iniciar_borrador | pedir_presupuesto | abrir_checkout | reservar_formacion | abrir_expediente_existente`. Un servicio sin oferta pagable jamás muestra `Contratar` como botón definitivo; KIA devuelve enlaces, no inserta órdenes ni confirma pagos.

## 3. Tres pilotos de máximo reúso

| Piloto | Slug real | Evidencia de estado (19/10/2026) | Prueba integral de aceptación |
| --- | --- | --- | --- |
| A. Nacionalidad española de menor nacido en España | `nacionalidad-espanola-menor-nacido-en-espana` | La base EXPERT contiene un expediente `presentado`, abierto el 18/09, con pedido vinculado, 22 documentos y 13 tareas. **No finalizado**. En código, manifiesto `content_ready`, página ES/RU, precio/suplido diferenciados, blueprint y pasos KIA | Copia sintética anonimizada: ficha ES/RU → orientación pública KIA → elección guiada / full service → pagador → checkout TEST → un pedido/caso/tareas → documentos → revisión → evidencia de presentación. Nunca reejecutar actuaciones del expediente real |
| B. Certificado digital PF | `certificado-digital-persona-fisica` | `production_ready` en manifiesto de código; un lead asociado al slug, **sin expediente pagado verificado en la muestra** | Landing ES/RU → selección persona física → checkout TEST → pedido/caso → documentos e identidad → revisión y entrega; verificar diferencia entre estado editorial y capacidad operativa |
| C. Certificado digital entidad o pack PF+entidad | `certificado-digital-entidad` / `pack-certificados-digitales` | Ambos `production_ready` en manifiesto; contratos de entidad y bundle existen en catálogo. No hay expediente real de estos slugs en la muestra de `cases` | Selector empresa/representante y pagador → checkout TEST → pedido/expediente por producto sin mezcla de sujetos, doble compra ni reutilización indebida de datos PF; KIA company-scoped |

**Piloto de bifurcación adicional sin abrir cuarta línea:** desde A ofrecer formación guiada y Academy como continuidad informativa; validar por separado matrícula/reserva y su `enrollmentId`, sin expediente profesional ni doble cobro. Constitución de SL/CIRCE queda como siguiente vertical una vez cerrado el patrón identidad de entidad futura.

## 4. Preparación QA sin efectos operativos

1. Crear **fixtures sintéticos** para visitante, lead consentido, cliente una empresa, cliente multiempresa, admin, tenant_admin, cuenta revocada y gestor delegado. No reproducir nombres, documentos, correos o números de expediente reales.
2. **Contrato read-only:** `serviceSlug` y version resuelven mismo precio/alcance comercial en web, panel y KIA; ausencia de price binding lleva a presupuesto; ES/RU mismo producto.
3. **Seguridad negativa:** otro tenant/company/case = 403/404; KIA no infiere expediente; no se expone source private por URL/cookie; administrativo revocado = denegación.
4. **Checkout TEST:** idempotencia Stripe, eventos duplicados/concurrentes, fallo de webhook, cancelación, reembolso, suplidos no ingreso, correlación y readback. Cero operaciones sobre historial real.
5. **Operación:** blueprint único, checklist completo, estado de caso legítimo, petición documental consentida, evidencia de revisión, presentación manual autorizada y cierre con justificante.
6. **Formación:** reservar/matricular con confirmación externa y correlación; no generar caso de trámite desde una simple matrícula.
7. **UX:** móvil, teclado y ES/RU, SEO/canonicals, fuente oficial vigente, enlaces de autogestión, error recuperable y no exponer proveedores internos de marca blanca.

## 5. Integración y gates

- **PR C0 (solo contrato/tests):** una sola capa de tipos y fixtures, sin tablas ni cambio de checkout. Dependencia del cierre de E0-M3-06 o excepción formal del freeze para revisión/merge funcional.
- **PR WEB-P:** páginas/CTA/SEO, sin cambios directos a módulos de pagos o autenticación.
- **PR WORKSPACE:** solicitud/borrador/expediente, permisos reales, sin clonar lógica de catálogo o transacciones.
- **PR KIA-A:** adaptador público R0 y contexto privado autorizado, nunca herramientas financieras o externas por defecto.
- **PR de integración por piloto:** E2E sintético; CI exact HEAD, ambos Vercel, RLS, revisión jurídica y financiera, sin P0/P1. Solo publicar una vertical al superar sus gates y el checkpoint rector.
- **Cierre:** estado por piloto = `inventariado → contrato listo → pruebas sintéticas → integración validada → habilitado por fase → producción verificada`; no derivar `production_ready` operativo únicamente del manifiesto editorial.

**Registro de decisiones:** maestro L5. Documento técnico auxiliar no sustituye su secuencia.
