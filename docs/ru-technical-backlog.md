# Backlog técnico ejecutable — RU-0 y RU-1

Ultima actualización: 2026-09-13

Documento de ejecución para la vertical **Holded на русском** y la internacionalización de EXPERT.

Este backlog desarrolla las fases RU-0 y RU-1 del plan estratégico sin modificar todavía producción.

## 0. Decisiones ya cerradas

Estas decisiones no deben reabrirse durante implementación salvo cambio expreso de producto:

1. La marca principal es **EXPERT**.
2. `Holded` es un nombre propio inmutable. Nunca se traduce, translitera, declina ni adapta.
3. La vertical se denomina **Holded на русском**.
4. EXPERT debe comunicar dos credenciales diferenciadas:
   - **Holded Solution Partner**.
   - **Asesoría Holded acreditada**.
5. EXPERT también puede comunicar su condición de **Colaborador social de la Agencia Tributaria** con wording prudente y sin sugerir aval institucional.
6. EXPERT Business Academy se presenta, por ahora, como formación privada/no reglada.
7. No se crean planes ni precios específicos para idioma ruso.
8. No se duplican productos Stripe por idioma.
9. ES/RU/EN comparten backend, catálogo, lógica de planes, expedientes e integraciones.
10. El idioma nunca se infiere de nacionalidad.
11. Email público de EXPERT: `info@expertconsulting.es`.
12. Email profesional de Ksenia: `soy@kseniailicheva.com`.
13. Cualquier DDL se realiza mediante migración nueva, con preflight y validación posterior.
14. No se modifican registros financieros históricos automáticamente.

---

# RU-0 — Gobierno, inventario y preparación

Objetivo: eliminar ambigüedades antes de introducir i18n o nuevas superficies comerciales.

## RU0-001 — Fuente de verdad de marca

**Prioridad:** P0  
**Tipo:** gobernanza / arquitectura  
**PR recomendado:** PR-RU-001

### Alcance

Crear una configuración central para nombres y credenciales que no deban traducirse libremente.

Debe incluir al menos:

- `EXPERT`;
- `Holded`;
- `Holded Solution Partner`;
- `Asesoría Holded acreditada`;
- `Colaborador social de la Agencia Tributaria`;
- `EXPERT Business Academy`;
- `KIA` / `KIA Copiloto`.

### Regla crítica

`Holded` debe permanecer exactamente como `Holded` en ES, RU y EN.

### Archivos probables

- `config/brand.ts` o equivalente;
- tests de contenido;
- documentación de contribución/copy.

### Criterios de aceptación

- [ ] Existe una única fuente de verdad para nombres protegidos.
- [ ] No se crean traducciones de `Holded`.
- [ ] Los componentes nuevos importan las credenciales desde configuración cuando proceda.
- [ ] Test específico bloquea transliteraciones o variantes prohibidas conocidas.
- [ ] `npm run typecheck`, lint y tests pasan.

---

## RU0-002 — Auditoría de contactos y remitentes

**Prioridad:** P0  
**Tipo:** gobernanza / comunicación  
**PR recomendado:** PR-RU-002

### Fuente de verdad

- EXPERT público: `info@expertconsulting.es`.
- Ksenia profesional: `soy@kseniailicheva.com`.

### Alcance

Inventariar usos actuales de:

- `soy@expertconsulting.es`;
- `info@expertconsulting.es`;
- `soy@kseniailicheva.com`;
- `RESEND_FROM_EMAIL`;
- remitentes de formularios;
- reply-to;
- footer;
- metadata estructurada;
- Stripe/checkout si se muestra email;
- notificaciones de KIA;
- plantillas transaccionales.

### Regla de seguridad

No cambiar remitentes de correo en producción hasta validar SPF/DKIM/DMARC y configuración de Resend. Cambiar copy público y configuración transaccional son operaciones distintas.

### Criterios de aceptación

- [ ] Inventario completo documentado.
- [ ] Web pública usa `info@expertconsulting.es` donde corresponda.
- [ ] El correo personal/profesional de Ksenia solo aparece cuando la comunicación es personal/profesional.
- [ ] No se rompe entrega de email.
- [ ] No se expone ninguna credencial.

---

## RU0-003 — Frontera B2B SaaS vs vertical comercial EXPERT

**Prioridad:** P0  
**Tipo:** arquitectura de producto  
**PR recomendado:** PR-RU-003

### Problema

El roadmap SaaS define EXPERT como plataforma multi-tenant para asesorías, mientras que `/ru` capta empresarios finales para el tenant EXPERT ESTUDIOS PROFESIONALES.

Ambos modelos deben coexistir sin mezclar conceptos.

### Decisión

- La plataforma core continúa siendo multi-tenant y preparada para asesorías.
- `/para-asesorias` y futuras superficies SaaS continúan dirigidas a despachos.
- `/ru` es una superficie comercial del tenant EXPERT para empresarios rusoparlantes.
- Los leads `/ru` entran en el mismo CRM/lead pipeline, etiquetados por locale, origen e intención.
- La lógica multi-tenant no debe hardcodear ruso como propiedad del producto global.

### Criterios de aceptación

- [ ] Arquitectura documenta la convivencia B2B/B2C.
- [ ] El locale RU no queda acoplado al tenant de forma que impida reutilizar i18n en otros tenants.
- [ ] Las rutas SaaS existentes no cambian como efecto colateral.

---

## RU0-004 — Taxonomía de origen, idioma e intención

**Prioridad:** P0  
**Tipo:** analítica / CRM  
**PR recomendado:** PR-RU-004

### Dimensiones mínimas

- `locale`: `es | ru | en`;
- `source`: SEO, Telegram, webinar, referral, direct, paid, partner, etc.;
- `campaign`;
- `intent`:
  - abrir negocio;
  - organizar empresa;
  - migrar sistema/gestoría;
  - Holded;
  - formación;
  - autogestión;
  - consulta puntual;
- `customer_type`: autónomo, SL, asesoría, otro;
- `uses_holded`: yes/no/unknown.

### Principio

Idioma y nacionalidad son datos distintos. No crear campos o automatizaciones que equiparen `ru` con ciudadanía rusa.

### Criterios de aceptación

- [ ] Taxonomía documentada.
- [ ] Puede viajar desde formulario hasta lead/order/case sin duplicar catálogo.
- [ ] Se puede medir conversión por locale e intención.

---

## RU0-005 — Gobierno jurídico y de claims

**Prioridad:** P0  
**Tipo:** compliance / copy  
**PR recomendado:** PR-RU-005

### Claims aprobados

- `Holded Solution Partner`.
- `Asesoría Holded acreditada`.
- `Colaborador social de la Agencia Tributaria`.
- `EXPERT Business Academy — formación privada/no reglada`.

### Reglas

- No sugerir que AEAT recomienda, certifica o avala comercialmente EXPERT.
- No presentar formación privada como titulación oficial.
- No modificar la denominación `Holded` en traducciones.
- No inventar sellos o insignias no autorizados.
- Los logotipos de terceros se usarán solo conforme a derechos y guías de marca aplicables.

### Criterios de aceptación

- [ ] Glosario institucional aprobado.
- [ ] Copy público referencia las credenciales de forma consistente.
- [ ] KIA recibe las mismas reglas de nomenclatura.

---

## RU0-006 — Feature flags y gates de publicación

**Prioridad:** P0  
**Tipo:** despliegue / riesgo  
**PR recomendado:** PR-RU-006

### Objetivo

Permitir implementar i18n sin publicar una vertical incompleta.

### Flags recomendados

- `NEXT_PUBLIC_RU_ENABLED`;
- `NEXT_PUBLIC_EN_ENABLED` cuando proceda.

### Regla

El código puede desplegarse antes que el contenido, pero las rutas RU no deben indexarse ni anunciarse hasta pasar QA de contenido, navegación, SEO, formulario y checkout.

### Criterios de aceptación

- [ ] RU puede activarse/desactivarse sin tocar catálogo ni DB.
- [ ] Rutas desactivadas no se indexan.
- [ ] Existe checklist de go-live.

---

# RU-1 — Infraestructura i18n ES/RU/EN

## Diagnóstico actual

La auditoría inicial muestra:

- Next.js App Router;
- no existe una capa i18n consolidada en el repositorio;
- `public.profiles` no contiene idioma preferido;
- la web española ya tiene URLs y señales SEO que no deben romperse;
- la arquitectura futura debe servir tanto al tenant EXPERT como a otros tenants.

## Decisión de routing

### Fase inicial

Mantener **español sin prefijo** para conservar las URLs actuales.

- ES: `/planes`, `/holded`, `/servicios`, etc.
- RU: `/ru/...`
- EN futuro: `/en/...`

No migrar ahora todo el español a `/es/...`.

### Motivo

Evita una migración masiva de URLs, redirecciones, canonicals y pérdida de señales SEO en el mismo PR que introduce i18n.

---

## RU1-001 — ADR de internacionalización

**Prioridad:** P0  
**Tipo:** arquitectura  
**PR recomendado:** PR-RU-101

### Recomendación

Adoptar `next-intl` para mensajes, Server Components, navegación y routing localizado en Next.js App Router.

La implementación debe validar la versión concreta compatible con la versión actual de Next.js antes de instalar.

### Decisiones del ADR

- locales iniciales: `es`, `ru`, `en`;
- default locale: `es`;
- español sin prefijo;
- ruso con `/ru`;
- inglés con `/en` cuando se active;
- estrategia de cookie;
- estrategia para usuario autenticado;
- estructura de diccionarios;
- metadata/hreflang;
- fallback de traducciones;
- política de términos protegidos.

### Criterios de aceptación

- [ ] ADR aprobado antes de migrar páginas.
- [ ] No se rompe ninguna URL española.
- [ ] No se duplica lógica de negocio por locale.

---

## RU1-002 — Constantes y tipos de locale

**Prioridad:** P0  
**Tipo:** código base  
**PR recomendado:** PR-RU-102

### Fuente de verdad sugerida

```ts
export const SUPPORTED_LOCALES = ['es', 'ru', 'en'] as const;
export const DEFAULT_LOCALE = 'es' as const;
export type SupportedLocale = typeof SUPPORTED_LOCALES[number];
```

### Criterios de aceptación

- [ ] No existen strings de locale dispersos sin tipar en la nueva capa.
- [ ] Zod y TypeScript comparten el mismo conjunto permitido.
- [ ] Tests cubren locale válido e inválido.

---

## RU1-003 — Migración `profiles.preferred_language`

**Prioridad:** P0  
**Tipo:** Supabase / DDL  
**PR recomendado:** PR-RU-103

### Estado actual

`public.profiles` existe pero no dispone de idioma preferido.

### Diseño recomendado

Añadir mediante **nueva migración**:

```sql
preferred_language text not null default 'es'
check (preferred_language in ('es', 'ru', 'en'))
```

Se prefiere inicialmente `text + check` frente a un enum PostgreSQL para facilitar ampliación futura de locales sin acoplar despliegues a cambios de enum.

### Preflight obligatorio

Antes de aplicar en remoto:

- confirmar schema actual de `profiles`;
- revisar políticas RLS relacionadas;
- comprobar triggers de creación de perfil;
- comprobar código que hace `select *` o mapeos estrictos;
- confirmar que no existe ya otro campo equivalente.

### Postflight

- verificar default `es` para perfiles existentes;
- verificar lectura/escritura con RLS;
- ejecutar Security Advisor;
- typecheck/tests/build.

### Criterios de aceptación

- [ ] Solo se añade una migración nueva.
- [ ] Cero modificación de migraciones históricas.
- [ ] Cero actualización destructiva de usuarios existentes.
- [ ] El campo queda validado a ES/RU/EN.
- [ ] Security Advisor sin nueva regresión atribuible al cambio.

---

## RU1-004 — Resolver de idioma

**Prioridad:** P0  
**Tipo:** aplicación  
**PR recomendado:** PR-RU-104

### Orden de prioridad propuesto

Para usuario autenticado:

1. selección explícita actual;
2. `profiles.preferred_language`;
3. locale de ruta;
4. cookie de idioma;
5. idioma de navegador;
6. `es`.

Para visitante público:

1. prefijo de ruta;
2. selección explícita/cookie;
3. `Accept-Language` solo para recomendación o primera visita;
4. `es`.

### Regla

No redirigir silenciosamente a un idioma en función de nacionalidad, IP o país.

### Criterios de aceptación

- [ ] Resolver determinista y testeado.
- [ ] La elección manual prevalece.
- [ ] No se crea loop de redirects.

---

## RU1-005 — Diccionarios de mensajes y términos protegidos

**Prioridad:** P0  
**Tipo:** i18n / contenido  
**PR recomendado:** PR-RU-105

### Estructura sugerida

```text
messages/
  es.json
  ru.json
  en.json
```

Separar por namespaces funcionales:

- common;
- navigation;
- plans;
- services;
- holded;
- academy;
- auth;
- portal;
- kia;
- forms;
- errors.

### Términos que no deben traducirse como marca/nombre oficial

- Holded;
- EXPERT;
- KIA;
- Agencia Tributaria / AEAT cuando sea nombre institucional;
- Modelo 303, Modelo 111, Modelo 115, Modelo 130, etc.;
- RETA;
- Sistema RED;
- SILTRA;
- NIF/NIE cuando sean identificadores oficiales.

Se traduce la **explicación**, no el identificador o marca.

### Criterios de aceptación

- [ ] Fallback controlado a español para contenido no crítico todavía no traducido.
- [ ] Las páginas RU de lanzamiento no muestran mezcla accidental ES/RU en CTA críticos.
- [ ] Holded permanece inmutable.

---

## RU1-006 — Routing público RU sin romper español

**Prioridad:** P0  
**Tipo:** frontend / routing  
**PR recomendado:** PR-RU-106

### MVP

Crear soporte para:

- `/ru`;
- `/ru/holded`;
- `/ru/plany`;
- `/ru/uslugi`;
- `/ru/academy`;
- `/ru/autonomo`;
- `/ru/sl`;
- `/ru/nalogi`;
- `/ru/verifactu`;
- `/ru/konsultatsiya`.

La implementación debe compartir componentes, catálogo y lógica con ES. No copiar páginas completas si eso genera dos fuentes de verdad.

### Criterios de aceptación

- [ ] Las rutas ES actuales responden igual que antes.
- [ ] `/ru` solo se activa mediante flag hasta QA.
- [ ] No hay IDs de producto específicos RU.
- [ ] Links internos conservan locale.
- [ ] 404 correcto para locales no soportados.

---

## RU1-007 — Selector de idioma

**Prioridad:** P1  
**Tipo:** UX  
**PR recomendado:** PR-RU-107

### Requisitos

- ES / RU / EN;
- conservar ruta equivalente cuando exista;
- persistir selección;
- actualizar `preferred_language` para usuario autenticado;
- no borrar parámetros esenciales de campaña/checkout;
- accesible por teclado y lector de pantalla.

### Criterios de aceptación

- [ ] Cambio de idioma no pierde contexto.
- [ ] No cambia productos o precios.
- [ ] El usuario puede volver a ES inmediatamente.

---

## RU1-008 — SEO internacional

**Prioridad:** P0 antes de indexar  
**Tipo:** SEO  
**PR recomendado:** PR-RU-108

### Requisitos

- canonical correcto;
- `hreflang` ES/RU/EN donde exista equivalente;
- sitemap con rutas habilitadas;
- metadata localizada;
- OpenGraph localizado cuando proceda;
- noindex mientras RU esté detrás de gate de prepublicación;
- evitar contenido duplicado;
- mantener URLs ES existentes.

### Criterios de aceptación

- [ ] Cada página RU indexable tiene canonical correcto.
- [ ] Alternates solo apuntan a páginas realmente existentes.
- [ ] No se genera `/es` duplicado por accidente.

---

## RU1-009 — Locale en formularios, leads y contexto comercial

**Prioridad:** P0  
**Tipo:** conversión / CRM  
**PR recomendado:** PR-RU-109

### Requisitos

Todo lead RU debe transportar:

- locale;
- source/campaign si existe;
- intent;
- ruta de origen;
- uso de Holded si se pregunta;
- producto/servicio seleccionado mediante el ID único existente.

### Regla Stripe

La localización cambia textos y experiencia; **no crea un producto Stripe nuevo**.

### Criterios de aceptación

- [ ] Lead RU identificable en admin.
- [ ] Mismo servicio ES/RU resuelve al mismo producto/price interno cuando corresponde.
- [ ] No se altera histórico financiero.

---

## RU1-010 — Contexto i18n para KIA y comunicaciones

**Prioridad:** P1  
**Tipo:** plataforma  
**PR recomendado:** PR-RU-110

### Alcance RU-1

No traducir todavía todas las comunicaciones. Preparar el contrato de contexto:

```ts
{
  locale: 'ru',
  preferredLanguage: 'ru'
}
```

para que RU-2 y RU-3 puedan usar la misma fuente de verdad.

### Reglas KIA

- respetar idioma preferido;
- conservar `Holded` intacto;
- mantener nombres jurídicos españoles cuando son denominaciones oficiales;
- explicar esos conceptos en ruso;
- no inferir marco jurídico ruso por el idioma del usuario.

### Criterios de aceptación

- [ ] Locale disponible en contexto de KIA.
- [ ] No se cambian todavía acciones críticas ni permisos.
- [ ] Las reglas de marca forman parte del prompt/policy de salida.

---

## RU1-011 — QA automático de internacionalización

**Prioridad:** P0  
**Tipo:** CI / calidad  
**PR recomendado:** PR-RU-111

### Tests mínimos

- locales soportados;
- resolver de idioma;
- rutas RU;
- selector;
- ausencia de duplicados de productos por locale;
- claves faltantes en páginas de lanzamiento;
- canonicals/hreflang;
- formularios preservan locale;
- `Holded` inmutable;
- términos protegidos;
- build Next.js.

### Gate CI recomendado

Ningún PR que añada una página RU puede fusionarse si:

- falta una clave crítica;
- aparece una transliteración prohibida de Holded;
- rompe route parity prevista;
- crea un producto/servicio duplicado solo por idioma.

---

## RU1-012 — Go-live controlado de `/ru`

**Prioridad:** P0  
**Tipo:** release  
**PR recomendado:** PR-RU-112

### Preflight funcional

- home RU;
- Holded RU;
- planes;
- servicios;
- Academy;
- consulta;
- formularios;
- login/registro;
- checkout;
- emails de confirmación aplicables;
- mobile;
- analytics;
- SEO;
- KIA context;
- contacto correcto.

### Credenciales visibles

Validar presencia coherente de:

- Holded Solution Partner;
- Asesoría Holded acreditada;
- Colaborador social de la Agencia Tributaria;
- EXPERT Business Academy como formación privada/no reglada.

### Criterio de salida

Activar `NEXT_PUBLIC_RU_ENABLED` solo cuando todos los checks P0 estén en verde.

---

# Orden de ejecución recomendado

## Bloque A — sin DDL

1. RU0-001 — marca.
2. RU0-002 — contactos.
3. RU0-003 — frontera B2B/B2C.
4. RU0-004 — taxonomía.
5. RU0-005 — claims.
6. RU0-006 — feature flags.
7. RU1-001 — ADR i18n.
8. RU1-002 — tipos/constantes.

## Bloque B — DDL controlado

9. RU1-003 — `profiles.preferred_language`.
10. Security Advisor y validación remota.

## Bloque C — infraestructura de aplicación

11. RU1-004 — resolver idioma.
12. RU1-005 — diccionarios.
13. RU1-006 — routing RU.
14. RU1-007 — selector.
15. RU1-008 — SEO.
16. RU1-009 — formularios/leads.
17. RU1-010 — contexto KIA/comunicaciones.
18. RU1-011 — CI/QA.
19. RU1-012 — release gate.

---

# Estrategia de PRs

Para mantener el trabajo conservador, no agrupar todo en un PR gigante.

Propuesta:

- **PR-RU-001:** brand governance + contactos + ADR.
- **PR-RU-002:** tipos/constantes + feature flags.
- **PR-RU-003:** migración `preferred_language` + preflight/postflight.
- **PR-RU-004:** runtime i18n + resolver + diccionarios base.
- **PR-RU-005:** routing RU + selector + SEO base.
- **PR-RU-006:** formularios/leads + analytics locale.
- **PR-RU-007:** KIA locale contract + políticas de terminología.
- **PR-RU-008:** páginas MVP RU.
- **PR-RU-009:** CI de traducciones + QA + release gate.

Cada PR debe ejecutar como mínimo:

- typecheck;
- lint;
- tests relevantes;
- build;
- checks de seguridad cuando haya DDL/security;
- previews de Vercel `app` y `ksenia-expert` cuando correspondan.

---

# Métricas que debe habilitar esta infraestructura

Una vez RU esté activo, medir:

- sesiones RU;
- origen;
- consultas/demos;
- demo Holded;
- conversión a onboarding/migración;
- conversión a plan recurrente;
- compra de formación;
- upgrade de formación a plan EXPERT;
- porcentaje de clientes que ya usaban Holded;
- MRR por cohort RU;
- ingreso puntual por implantación/formación;
- churn por locale;
- horas humanas por cliente;
- escalados KIA -> asesor humano.

El objetivo no es medir tráfico ruso por sí mismo, sino comprobar si la vertical genera clientes rentables y si el modelo de autogestión asistida reduce carga operativa sin reducir calidad.