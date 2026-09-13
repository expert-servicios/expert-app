# ADR-0001 — Internacionalización, routing y gobierno de marca

Estado: Aceptado
Fecha: 2026-09-13

## Contexto

EXPERT incorporará una vertical comercial para empresarios rusoparlantes sin crear una marca, catálogo, backend o pricing separados. El producto mantiene además su línea SaaS multi-tenant para asesorías y gestorías.

La web española existente ya está indexada y no debe migrarse a un prefijo `/es` únicamente para introducir i18n.

## Decisión

### Locales

Locales iniciales:

- `es` — idioma por defecto;
- `ru` — primera expansión;
- `en` — preparado para expansión posterior.

El idioma es una preferencia del usuario y nunca se deriva de nacionalidad.

### Routing

- Español conserva las URLs actuales sin prefijo.
- Ruso usa `/ru/...`.
- Inglés usará `/en/...` cuando se publique.
- No se crea un árbol `/es/...` duplicado.
- Las rutas españolas existentes no se redirigen de forma masiva.

### Superficies comerciales

- La web general y `/ru/...` representan la oferta directa del tenant EXPERT para empresarios, autónomos, sociedades y particulares.
- `/para-asesorias` representa la propuesta SaaS B2B para despachos profesionales.
- La internacionalización es transversal a la plataforma, pero el lanzamiento RU no debe hardcodear reglas de negocio específicas del tenant EXPERT dentro del núcleo multi-tenant.

### Librería i18n

La implementación prevista usará `next-intl`, validando la versión exacta antes de añadir la dependencia. La razón es su encaje con Next.js App Router, routing localizado, Server Components, navegación y metadata SEO.

No se construirá un framework i18n casero salvo bloqueo técnico documentado.

### Marca Holded

`Holded` es un nombre propio protegido dentro del proyecto.

Reglas:

- se escribe siempre `Holded`;
- no se traduce;
- no se translitera al cirílico;
- no se declina ni se adapta morfológicamente;
- puede aparecer dentro de una frase traducida, por ejemplo `Holded на русском`.

Credenciales aprobadas de EXPERT:

- `Holded Solution Partner`;
- `Asesoría Holded acreditada`.

### Otras denominaciones institucionales

- `Colaborador social de la Agencia Tributaria` se usa como denominación funcional de EXPERT y no debe formularse de manera que sugiera pertenencia, patrocinio o aval institucional de la AEAT.
- `EXPERT Business Academy — formación privada/no reglada` se mantiene hasta que exista una acreditación oficial adicional aplicable.

### Contactos canónicos

- contacto público EXPERT: `info@expertconsulting.es`;
- contacto profesional de Ksenia: `soy@kseniailicheva.com`;
- WhatsApp Business: `+34 669 04 55 28`.

`config/identity.ts` es la fuente de verdad de runtime para identidad y copy protegido.

Los remitentes reales de email no se cambiarán en producción únicamente por modificar esta fuente de verdad: cualquier cambio de `RESEND_FROM_EMAIL` exige validación previa de dominio y configuración SPF/DKIM/DMARC.

### Datos y productos

- no se crean productos Stripe RU separados;
- no se cambian precios por idioma;
- no se duplican IDs de servicio por locale;
- no se modifican registros financieros históricos para introducir idioma.

## Consecuencias

Positivas:

- se preserva SEO español;
- la marca Holded se mantiene consistente;
- RU y EN comparten arquitectura;
- el tenant EXPERT puede crecer comercialmente sin contaminar el núcleo SaaS;
- contactos y credenciales tienen una fuente de verdad explícita.

Costes:

- será necesario introducir resolución de locale, diccionarios, selector, metadata localizada y `preferred_language`;
- durante la transición seguirán existiendo algunos literales históricos y duplicados que deberán migrarse progresivamente.

## Cambios posteriores

Cualquier cambio en estas reglas exige un nuevo ADR o una actualización explícita de este documento con justificación.
