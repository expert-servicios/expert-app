# KIA Contextual Conversations — arquitectura y roadmap

Última revisión: 24/09/2026.

## Actualización de continuidad desde Work

El [contrato de KIA para tramitación y eventos desde Work](kia-work-case-orchestration.md) concreta la siguiente fase: evidencia de ejecución → cierre de tarea → siguiente paso autorizado → comunicación contextual. Incluye firma KIA, correo en hilo, copiloto, Telegram y expedientes personales sin empresa.

La checklist de fases que sigue conserva el plan original del 22/09; no representa un inventario actualizado de despliegue. En main ya hay migración de conversaciones/tokens, resolver contextual y helper de CTA integrado en el envío, con flag y opt-in por mensaje. La matriz del nuevo contrato distingue código verificado de activación pendiente. No marcar toda la fase como terminada solo por existir esos componentes.

Objetivo acordado el 24/09: un CTA contextual en cada correo operativo de expediente y estado consultado de nuevo al responder. Se mantiene el rollout por piloto de la sección 15 hasta verificar todas las vías de envío, autenticación y recuperación. No se activa ningún flag en esta entrega.

## 1. Visión

KIA debe convertirse en una asistente multicanal capaz de continuar una conversación iniciada desde un correo, la aplicación EXPERT, Telegram y otros canales sin obligar al usuario a repetir el contexto.

Objetivo: el cliente pulsa «Hablar con KIA» desde un correo y KIA sabe quién es, sobre qué expediente/empresa/servicio está hablando, cuál es el estado actual real, qué está pagado, qué documentos existen, cuál es el siguiente paso y qué puede hacer por el usuario.

KIA debe dirigirse al usuario por su primer nombre cuando esté identificado, utilizar avatares/emoji coherentes con el estado de la conversación y ser transparente sobre su naturaleza de asistente IA.

## 2. Principios

1. Estado actual, no snapshot del correo. El enlace aporta el tema inicial; antes de responder, KIA vuelve a consultar EXPERT.
2. Identidad antes que contexto. Un token contextual nunca concede acceso por sí mismo.
3. Sin PII en URLs. No incluir nombre, NIE, email, case_id real ni datos del expediente en enlaces.
4. Aislamiento absoluto. Cero respuestas con contexto de otro cliente, empresa o tenant.
5. Read-first. Canales cliente usan inicialmente tools R0/R1 de lectura.
6. Continuidad multicanal. App, Telegram y futuros canales comparten el mismo concepto de conversación/contexto.

## 3. Arquitectura objetivo

### kia_conversations
- id, tenant_id, profile_id
- channel: dashboard / telegram / waba / email
- company_id, case_id, service_slug opcionales
- topic, status, origin_type, origin_ref
- metadata, last_message_at, created_at, updated_at

### kia_conversation_messages
- conversation_id, tenant_id, profile_id, channel
- role: user / assistant / professional / system
- body, intent, avatar_state
- external_message_id, metadata, created_at

### kia_context_tokens
- tenant_id, profile_id
- token_hash único; nunca guardar token plano
- company_id, case_id, service_slug, task_id opcionales
- origin_type, origin_ref, intent_hint, metadata
- expires_at, last_used_at, revoked_at, created_at

## 4. Token contextual

Email objetivo: https://expertconsulting.es/kia/c/<token-opaco>

Flujo:
1. token → hash;
2. localizar token;
3. autenticar usuario;
4. token.profile_id debe coincidir con auth.uid();
5. revalidar pertenencia a company/case;
6. consultar estado actual;
7. crear/reutilizar conversación;
8. abrir KIA con contexto actual.

Si no está autenticado: login → retorno al mismo token → nueva validación.

## 5. Telegram

Enlace objetivo: t.me/<KIA_BOT>?start=ctx_<token-opaco>

Requisitos:
- identidad Telegram vinculada y verificada con EXPERT;
- profile_id del token = profile_id de la identidad Telegram;
- revalidar tenant/company/case;
- cargar estado actual;
- establecer expediente/empresa/tema como contexto activo.

Para no vinculados, CTA «Conectar Telegram con KIA» y flujo /link con código corto temporal.

## 6. Contexto autorizado

KIA debe poder consultar:
- usuario: nombre, idioma, perfil, permisos, tenant;
- empresa: empresas vinculadas, plan, Holded, permisos y datos autorizados;
- expedientes: servicio, estado, next_action, tareas, documentos, plazos, timeline;
- pagos: pedidos, pagos, suscripciones, honorarios, suplidos, tasas e incidencias;
- comunicaciones relevantes.

Tools read-only pendientes:
- get_user_orders
- get_user_payments
- get_user_subscriptions
- get_case_payment_status
- get_case_tasks
- get_case_documents
- get_case_timeline
- get_case_communications

No inferir «pagado», «firmado», «presentado» o «pendiente» desde texto si existe fuente estructurada.

## 7. Knowledge & Content Discovery

KIA debe consultar y compartir contenido EXPERT desde:
- lib/utils/blog.ts
- lib/utils/docs.ts
- service registry/catalog;
- operational blueprints;
- Regulatory Registry;
- fuentes oficiales asociadas a servicios y reglas.

Tool: search_knowledge_resources
- query;
- category opcional;
- serviceSlug opcional;
- type blog/doc/all;
- limit;
- devuelve título, excerpt, URL, tags, relatedServiceSlugs y fecha.

Tool: get_official_sources
- serviceSlug o topic;
- devuelve solo fuentes del Regulatory Registry: autoridad, título, URL oficial, última comprobación y relación con servicio/tema.

Regla: KIA puede ofrecer «Puedes comprobarlo en la fuente oficial» y compartir el enlace. Nunca inventar URLs oficiales.

## 8. Oferta inteligente de servicios EXPERT

KIA puede detectar necesidad/interés comercial, pero debe ser útil antes que comercial.

Tool: find_relevant_services
- query/need;
- category opcional;
- limit máximo 3;
- devuelve slug, nombre, categoría, precio, flowType, hasCheckout y URL.

Reglas:
1. resolver primero la consulta;
2. sugerir servicio solo si existe relación material;
3. normalmente 1 servicio; máximo 2 en conversación normal;
4. explicar por qué encaja;
5. si existe viabilidad/readiness, ofrecer comprobar requisitos antes de comprar;
6. no afirmar que el servicio es legalmente obligatorio salvo fuente oficial;
7. no presionar;
8. no repetir la oferta si fue rechazada o ya se mostró;
9. si hay intención explícita de contratar, mostrar CTA;
10. si no hay servicio adecuado, no inventarlo.

## 9. Respuesta ideal de KIA

Orden recomendado:
1. respuesta directa;
2. siguiente paso;
3. fuente oficial o guía EXPERT para comprobar;
4. servicio EXPERT si procede.

KIA también puede enviar artículos de blog, docs, checklists y enlaces directos al expediente.

## 10. Avatares y tono

Usar KIA_AVATAR_STATES existente:
- bienvenida: primer contacto;
- confianza: contexto conocido;
- seguimiento: expediente en curso;
- celebracion: firma/pago/hito;
- exito: resultado favorable;
- duda: falta información;
- aviso: bloqueo/incidencia;
- alerta_fiscal: riesgo fiscal estructurado;
- pensando: carga.

En app, avatar por respuesta. En Telegram, avatar fijo del bot + emoji contextual; opcionalmente imagen/sticker de avatar en hitos.

KIA debe usar el primer nombre, adaptar idioma, usar emoji moderado, agradecer acciones completadas, explicar el siguiente paso y no fingir revisión humana.

## 11. Escalabilidad: gaps confirmados

- kia_sessions producción sigue esquema legacy WhatsApp;
- dashboard intenta persistir columnas que no existen en producción;
- historial depende parcialmente del navegador;
- rate limit 12 msg/min está en memoria de instancia;
- Telegram cliente sigue feature-flagged;
- no hay identidades Telegram cliente activas;
- falta idempotencia persistente de update_id;
- falta persistencia auditable Telegram;
- faltan tools de pagos/tareas/timeline/comunicaciones.

Solución: nuevas conversaciones multicanal, rate limit distribuido, ledger Telegram, mensajes persistentes, métricas y tests de aislamiento.

## 12. Load & isolation tests

Antes de rollout general: 25 → 50 → 100 conversaciones simultáneas.

Medir p50/p95/p99, errores, coste, tool latency, DB latency, rate-limit y duplicados Telegram.

Criterio crítico: 0 cross-tenant / cross-client / cross-company / cross-case leakage.

## 13. Rollout

### Fase 1 — Foundation
- [ ] migration conversaciones/tokens
- [ ] repository/service de conversaciones
- [ ] resolver token contextual
- [ ] persistencia dashboard
- [ ] rate limit distribuido
- [ ] tests de aislamiento

### Fase 2 — Knowledge & commercial intelligence
- [ ] search_knowledge_resources
- [ ] get_official_sources
- [ ] find_relevant_services
- [ ] payments/orders/subscriptions
- [ ] tasks/docs/timeline/communications
- [ ] prompt de recomendación no invasiva
- [ ] artifacts/enlaces

### Fase 3 — App contextual
- [ ] /kia/c/[token]
- [ ] login return
- [ ] abrir widget automáticamente
- [ ] saludo por nombre
- [ ] case/company/topic context
- [ ] quick replies + avatar
- [ ] botón Hablar con KIA en emails

### Fase 4 — Telegram
- [ ] ledger update_id
- [ ] persistencia inbound/outbound
- [ ] /start ctx_TOKEN
- [ ] identity+context revalidation
- [ ] Operations 360
- [ ] piloto

### Fase 5 — Load/rollout
- [ ] 25/50/100 concurrentes
- [ ] métricas y alertas
- [ ] coste
- [ ] rollout progresivo

## 14. Criterios de aceptación

KIA contextual se considera lista para botones masivos cuando:
- contexto persiste server-side;
- token no expone PII;
- ownership se revalida;
- pagos/expedientes/docs/tareas se consultan estructuradamente;
- knowledge/resources funcionan;
- fuentes oficiales salen del registro canónico;
- servicio relevante puede recomendarse sin spam;
- Telegram es idempotente y auditable;
- rate limiting es distribuido;
- aislamiento y load tests pasan;
- logs/metrics permiten investigar cualquier respuesta.

## 15. Decisión

No añadir todavía botones contextuales a todas las plantillas. Primero Foundation + Knowledge. Después activar CTA en un subconjunto de emails/casos piloto y ampliar tras validar comportamiento.
