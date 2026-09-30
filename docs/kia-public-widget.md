# KIA pública — widget web + Telegram

Fecha: 30/09/2026

## Objetivo

Sustituir el launcher flotante público de WhatsApp por un único acceso a KIA en la web de EXPERT.

El widget ofrece:

- chat web KIA para visitantes no identificados;
- búsqueda de información oficial vigente mediante Gemini + Google Search cuando la consulta lo requiere;
- enlaces a guías/artículos EXPERT y fuentes oficiales;
- detección de necesidad comercial sin venta forzada;
- CTA contextual a servicio, identificación, viabilidad/readiness o reunión;
- acceso a Telegram KIA;
- acceso al copiloto autenticado cuando ya existe sesión EXPERT.

## Regla de identidad

### Visitante no identificado

KIA puede:

- orientar;
- responder preguntas informativas;
- buscar fuentes oficiales;
- compartir artículos y guías públicas;
- localizar servicios cuando existe una necesidad concreta;
- indicar el siguiente paso comercial seguro.

KIA no puede:

- consultar expedientes;
- mostrar documentos;
- consultar datos personales o empresariales;
- ejecutar acciones privadas;
- crear checkout directo saltándose login/readiness/viabilidad.

### Usuario identificado

Desde la web pública puede:

- abrir KIA con su contexto completo en `/dashboard?kia=open`;
- vincular Telegram mediante el endpoint seguro de código de un solo uso.

## Búsqueda oficial

El endpoint público usa `runKiaDecision()` con `includeOfficialSourceContext=true`.

Cadena:

1. Gemini Interactions API + `google_search`;
2. OpenAI web search como fallback;
3. fuentes oficiales estáticas.

El buscador Gemini solo acepta un resultado grounded cuando todas las citas pertenecen a dominios oficiales permitidos.

## Herramientas públicas autorizadas

Solo R0/read/autonomous:

- `search_knowledge_resources`;
- `get_official_sources`;
- `find_relevant_services`.

No se expone ninguna tool de expediente, documento, pago, Holded privado ni escritura.

## Acción comercial

La respuesta de KIA manda. El widget traduce únicamente acciones ya validadas:

- `send_login_link` / `send_profile_link` → identificación segura;
- `run_viability` / `run_readiness` + service slug → ficha/requisitos;
- `book_call` + `requiresMeeting=true` → cita;
- `send_checkout_link` en visitante anónimo → login seguro antes de continuar;
- servicios detectados por `find_relevant_services` → enlaces de servicio.

No se muestra CTA comercial por mera afinidad temática.

## Protección antiabuso

- reCAPTCHA v3 por mensaje;
- rate limit por IP;
- filtro anti-spam;
- longitud máxima de mensaje e historial;
- historial limitado a seis turnos;
- feature flag `KIA_PUBLIC_CHAT_ENABLED`.

## Telegram

- visitante anónimo: abre `https://t.me/kia_expert_bot`;
- usuario autenticado: genera deep-link de vinculación seguro mediante `/api/ai/kia/telegram-link`.

Telegram mantiene sus propias reglas de identidad: el chat privado con datos de cliente no se habilita hasta tener identidad EXPERT verificada.

## Archivos

- `components/site/KiaPublicWidget.tsx`
- `app/api/ai/kia/public/route.ts`
- `app/(public)/layout.tsx`
- `lib/integrations/official-sources.ts`
- `tests/kia/kia-public-widget.test.ts`
