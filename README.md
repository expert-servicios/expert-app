# EXPERT Platform

EXPERT es una plataforma operativa digital para asesorias, gestorias y despachos profesionales. Las asesorias son los clientes SaaS: contratan EXPERT para digitalizar y automatizar su operativa — expedientes, documentos, empresas, pagos, comunicaciones y cumplimiento fiscal.

Tenant inicial y caso de uso de referencia: EXPERT ESTUDIOS PROFESIONALES, SLU.

La misma aplicacion sirve tambien la web comercial del tenant EXPERT para clientes finales. Esta superficie B2C/B2B directo no debe confundirse con la oferta SaaS para despachos:

- cliente final EXPERT: web publica general y, progresivamente, `/ru/...` y `/en/...`;
- asesorias/gestorias que contratan la plataforma: `/para-asesorias` y flujos SaaS multi-tenant.

## Datos base

- Dominio canonico: `expertconsulting.es`
- Email publico EXPERT: `info@expertconsulting.es`
- Email profesional Ksenia: `soy@kseniailicheva.com`
- WhatsApp Business: `+34 669 04 55 28`
- Empresa: `EXPERT ESTUDIOS PROFESIONALES, SLU`
- CIF: `B44991776`
- Direccion: `C/ Pintor Agrassot, 19 - 03110 Mutxamel (Alicante)`

## Credenciales y nomenclatura protegida

- `Holded` es nombre propio y debe escribirse siempre exactamente asi; no se traduce, translitera ni declina.
- Credencial: `Holded Solution Partner`.
- Credencial: `Asesoría Holded acreditada`.
- Condicion institucional: `Colaborador social de la Agencia Tributaria`.
- Formacion: `EXPERT Business Academy — formación privada/no reglada` mientras no exista una acreditacion oficial adicional.

La fuente de verdad de estos datos de identidad esta en `config/identity.ts`.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS
- Supabase: Postgres, Auth, Storage y RLS
- Stripe: Checkout, pagos puntuales, suscripciones y webhooks
- Resend: emails transaccionales
- Holded: CRM, proyectos, contactos, presupuestos/facturacion controlada y reporting financiero
- Kia Copiloto: widget flotante in-app con motor IA supervisado (Anthropic)
- Google reCAPTCHA v3: proteccion anti-spam de formularios publicos
- WhatsApp Business: notificaciones salientes

## Estructura

- `app/(public)`: web publica; combina captacion del tenant EXPERT con la superficie SaaS claramente separada en `/para-asesorias`.
- `app/(protected)`: portal operativo (admin y dashboard cliente) con Kia Copiloto flotante.
- `app/api`: endpoints de negocio, webhooks e integraciones.
- `apps/holded-mcp`: conector MCP independiente para Holded.
- `config/identity.ts`: identidad, contactos y credenciales protegidas.
- `lib/ai/kia`: motor Kia, context builder, tools, health checks y auditor.
- `lib/integrations`: adaptadores de Supabase, Stripe, Resend, Holded y WhatsApp.
- `lib/schemas`: validaciones Zod.
- `supabase/migrations`: schema SQL, RLS y buckets.
- `docs/roadmap.md`: roadmap maestro.
- `docs/master-checklist.md`: checklist de cumplimiento.
- `docs/architecture.md`: arquitectura operativa.
- `docs/improvement-plan.md`: plan vivo de mejoras tecnicas priorizadas.

## Flujo operativo core

1. Asesoria contrata EXPERT y se configura su tenant, o un cliente final contrata un servicio/plan del tenant EXPERT.
2. Admin crea o importa expediente para un cliente.
3. Stripe confirma pago cuando aplica.
4. Supabase crea `order` y `case`; Holded sincroniza contacto y factura cuando corresponde.
5. Resend notifica al cliente final por email; WhatsApp envia avisos salientes.
6. Cliente gestiona documentos desde el portal seguro.
7. Admin opera desde la bandeja operativa con NBA (Next Best Actions).
8. Kia Copiloto asiste al operador en cualquier momento desde el widget flotante.

## Comandos

```bash
npm install
npm run typecheck
npm run build
npm run dev
```

## Variables principales

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

RESEND_API_KEY=
RESEND_WEBHOOK_SECRET=
# Configurar solo con un remitente verificado en Resend/DNS.
RESEND_FROM_EMAIL=

HOLDED_API_KEY=
HOLDED_SYNC_ENABLED=true
HOLDED_SYNC_QUOTES=true
HOLDED_CREATE_INVOICES_FROM_STRIPE=false
HOLDED_CRM_FUNNEL_ID=
HOLDED_CRM_DEFAULT_STAGE_ID=
HOLDED_PROJECT_DEFAULT_LIST_ID=
HOLDED_DEFAULT_QUOTE_DOC_TYPE=estimate

NEXT_PUBLIC_RECAPTCHA_SITE_KEY=
RECAPTCHA_SECRET_KEY=
RECAPTCHA_MIN_SCORE=0.5

NEXT_PUBLIC_CAL_REUNION_LINK=expertconsulting/reunion
NEXT_PUBLIC_CAL_DEMO_LINK=expertconsulting/demo
NEXT_PUBLIC_CAL_ONBOARDING_LINK=expertconsulting/onboarding
NEXT_PUBLIC_CAL_FORMACION_LINK=expertconsulting/formacion
CAL_WEBHOOK_SECRET=
CAL_API_KEY=

NEXT_PUBLIC_APP_URL=https://expertconsulting.es
ADMIN_EMAILS=info@expertconsulting.es,soy@kseniailicheva.com
```

## Panel admin

- `/admin`: bandeja operativa con NBA (Next Best Actions).
- `/admin/usuarios`: usuarios, roles y limpieza segura.
- `/admin/presupuestos`: presupuestos y sincronizacion Holded.
- `/admin/expedientes`: expedientes, checklist documental y sincronizacion de proyecto Holded.
- `/admin/saas-leads`: leads de asesorias interesadas en el piloto SaaS.
- `/admin/integraciones`: estado de Holded y eventos de sincronizacion.
- `/admin/kia-health`: health checks y canaries del copiloto Kia.
- `/admin/kia-auditor`: revision de reglas criticas de Kia.

## Estado actual

P0 de seguridad completado. La estrategia de internacionalizacion y la vertical `Holded на русском` se documentan en `docs/holded-ru-academy-strategy.md` y `docs/ru-technical-backlog.md`. La implementacion se realiza mediante PRs pequenos, sin duplicar productos ni precios por idioma y sin modificar produccion sin preflight cuando haya DDL.
