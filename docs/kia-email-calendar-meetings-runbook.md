# EXPERT · Runbook de correo, calendario y reuniones de KIA

Fecha de actualización: **29/09/2026**

Estado de referencia:

- **PR #511 fusionada en `main`**: operador KIA de correo humano y reuniones, Gmail, Calendar/Meet, tareas Admin, trazabilidad CRM y guardas de seguridad.
- **PR #518 en cierre**: activación administrable fail-closed del agente de correo y recuperación/telemetría de PushApp.
- **PR #519 en revisión**: clasificación completa de inbox, aliases funcionales fail-closed y escalado selectivo Push/Telegram/email.
- Este documento describe el comportamiento operativo global. La referencia detallada de inbox, aliases, alertas y checklist de producción es [KIA — operación de correo, clasificación y alertas](kia-email-operations.md).
- La existencia de código no implica activación: los switches, credenciales y health checks deben validarse en producción.

---

## 1. Objetivo

Centralizar la operativa de EXPERT para que KIA pueda:

1. recibir y analizar correo humano entrante;
2. identificar de forma segura cliente, lead, empresa y expediente;
3. responder automáticamente solo cuando el contexto y la confianza lo permitan;
4. consultar disponibilidad real;
5. crear una reunión solo tras confirmación explícita de fecha y hora;
6. crear el evento remoto en Calendar y el enlace de videollamada;
7. registrar la cita en EXPERT;
8. crear o mantener la tarea administrativa asociada;
9. enviar confirmación al cliente con enlace de reunión y archivo ICS;
10. permitir reprogramación y cancelación segura;
11. mantener trazabilidad CRM de correo, cita, lead, expediente y origen comercial;
12. fallar de forma conservadora cuando exista ambigüedad, adjuntos, identidad dudosa o problemas de proveedor.

Principio de diseño: **EXPERT conserva el estado canónico**. Gmail, Google Calendar/Meet y Microsoft 365 son proveedores operativos externos, no la fuente única del estado administrativo.

---

## 2. Arquitectura resumida

Flujo lógico:

```text
Cliente / lead
   |
   +-- Web / artículo / docs / formulario
   |      |
   |      +--> /cita
   |      +--> /consulta-gratuita
   |      +--> /solicitar-presupuesto
   |
   +-- Email -> info@expertconsulting.es
          |
          v
    email-sync
          |
          v
  email_inbox_cache
          |
          v
  kia-email-agent
          |
          +--> identidad / lead / expediente
          +--> KIA decision engine
          +--> respuesta Gmail
          +--> tarea Admin
          +--> disponibilidad
          +--> create_booking_meeting
                         |
                         v
                     appointments
                         |
                         v
             Google Calendar/Meet
                 o Microsoft 365
                         |
                         v
                internal_tasks
                         |
                         v
             email confirmación + ICS
```

Piezas principales:

- `app/api/booking/route.ts`
- `lib/booking/kia-booking-operator.ts`
- `lib/booking/calendar-provider.ts`
- `lib/booking/booking-admin-task.ts`
- `lib/booking/booking-email.ts`
- `app/api/booking/manage/cancel/route.ts`
- `app/api/admin/citas/route.ts`
- `app/api/cron/booking-task-reconcile/route.ts`
- `app/api/cron/kia-email-agent/route.ts`
- `lib/integrations/operational-gmail.ts`
- `lib/ai/kia/kia-tool-definitions.ts`
- `lib/ai/kia/kia-tool-executor.ts`
- `lib/ai/kia/kia-tool-registry.ts`

---

## 3. Proveedor de calendario

La capa común está en `lib/booking/calendar-provider.ts`.

Proveedores soportados:

- `google` -> `google_native`
- `ms365` -> `ms365_native`

Selección:

```env
BOOKING_CALENDAR_PROVIDER=google
```

Si no se define, el proveedor por defecto es Google.

### 3.1 Google

La ruta nativa usa las integraciones de Google Calendar de EXPERT para:

- consultar ventanas ocupadas;
- crear evento;
- generar/recuperar enlace de Google Meet;
- actualizar evento;
- eliminar evento.

El evento remoto conserva:

- asunto de la reunión;
- cliente;
- horario;
- zona horaria;
- recordatorios;
- enlace de reunión;
- identificador persistido en EXPERT.

### 3.2 Microsoft 365

La misma abstracción puede usar Microsoft 365.

Requisitos:

- `MS365_CLIENT_ID`
- `MS365_CLIENT_SECRET`
- conexión OAuth vigente;
- scope `Calendars.ReadWrite`.

Los tokens se leen de `ms365_tokens` y los refresh tokens renovados se persisten.

No habilitar `BOOKING_CALENDAR_PROVIDER=ms365` hasta haber validado de nuevo permisos y conexión.

### 3.3 Regla de consistencia

Cada cita conserva su proveedor real mediante:

- `booking_provider`
- `provider_booking_id`
- `google_event_id` cuando corresponde
- `meeting_url`

Esto evita que una cita creada en Google sea tratada después como una cita MS365, o al revés.

---

## 4. Reserva pública desde la web

Endpoint principal:

`POST /api/booking`

### 4.1 Validación previa

Antes de escribir:

- Zod valida nombre, email, teléfono, servicio, fecha, notas y origen.
- Se valida reCAPTCHA.
- Se aplica control anti-spam/rate-limit.
- Se comprueba que el servicio existe.
- Se valida que la fecha esté dentro de la ventana permitida.
- Se valida día laborable.
- Se valida horario de apertura/cierre.
- Se valida la cuadrícula de minutos.
- Se consulta la ocupación real del calendario remoto.
- Se comprueba solapamiento.

La zona horaria operativa es **Europe/Madrid**.

### 4.2 Lock local

Antes de crear el evento remoto se inserta una fila temporal en `appointments`:

```text
status = pending_calendar
```

Esto actúa como bloqueo local para evitar dos reservas simultáneas del mismo hueco.

Locks temporales antiguos pueden limpiarse cuando superan la ventana prevista.

### 4.3 Creación remota

Una vez reservado el lock local:

1. se crea el evento en Calendar;
2. se genera el Meet/Teams correspondiente;
3. se guardan los identificadores externos;
4. `appointments.status` pasa a `confirmed`.

Si el proveedor devuelve un evento pero EXPERT no consigue completar el estado local, entra la lógica de compensación descrita más abajo.

### 4.4 Datos guardados en EXPERT

La cita conserva, entre otros:

- nombre;
- email;
- teléfono;
- tipo de cita;
- servicio;
- fecha/hora UTC;
- fecha/hora confirmada local;
- proveedor;
- ID remoto;
- enlace de reunión;
- cliente y empresa cuando están identificados;
- notas;
- origen de contenido/CTA cuando existe.

---

## 5. Reserva creada por KIA

Archivo principal:

`lib/booking/kia-booking-operator.ts`

KIA separa dos capacidades:

- `get_booking_availability`
- `create_booking_meeting`

Política:

- consultar disponibilidad = operación de lectura;
- crear reunión = acción externa consecuencial R2.

### 5.1 Servicios que KIA puede reservar

El operador limita las reservas automáticas a servicios públicos expresamente permitidos:

- `consulta-inicial`
- `demo-holded`
- `academy-admision`

Un slug fuera de esa lista se rechaza.

### 5.2 Disponibilidad

KIA no inventa huecos.

Combina:

- ocupación del calendario remoto;
- citas `pending_calendar`;
- citas `confirmed`.

Devuelve slots normalizados con instrucción explícita para el cliente.

### 5.3 Confirmación obligatoria

KIA no puede crear una reunión solo porque en el hilo aparezca una fecha.

La confirmación debe incluir:

- expresión afirmativa;
- fecha exacta;
- hora exacta;
- ausencia de negación;
- ausencia de fecha/hora contradictoria.

Ejemplo válido:

```text
Sí, perfecto. Reserva el 30/09 a las 10:00.
```

Ejemplo no válido:

```text
No, mejor no. En el correo anterior dije 30/09 a las 10:00.
```

La lógica comprueba específicamente negaciones y conflictos.

### 5.4 Protección frente a texto citado

Para correo, la confirmación no se evalúa sobre todo el MIME histórico.

Antes se elimina:

- `<blockquote>`;
- bloques `gmail_quote`;
- líneas de respuesta antigua;
- cabeceras de mensaje original.

Así, una frase antigua como “perfecto, reserva...” no puede autorizar una cita nueva si la respuesta actual dice “no”.

### 5.5 Email ligado a identidad

El ejecutor comprueba que el email usado para reservar corresponda al contacto autorizado del contexto.

KIA no puede cambiar silenciosamente la reserva a otro email.

---

## 6. Tarea Admin asociada a cada reunión

Archivo:

`lib/booking/booking-admin-task.ts`

Cada cita tiene una tarea canónica de tipo:

```text
task_kind = booking_meeting
```

La clave funcional es:

`booking_appointment_id`

Existe control de unicidad para que una cita no cree múltiples tareas de reunión.

### 6.1 Contenido

La tarea incluye:

- servicio;
- persona;
- fecha;
- hora;
- Meet/Teams;
- cliente;
- empresa;
- expediente;
- lead;
- origen de contenido, cuando está disponible;
- metadata operativa.

### 6.2 Regla de refresh

Una reconciliación parcial nunca borra relaciones ya conocidas.

Solo actualiza:

- `client_id` si llega uno válido;
- `company_id` si llega uno válido;
- `case_id` si llega uno válido;
- `lead_id` si llega uno válido.

No desasocia una tarea porque un proceso posterior no sea capaz de reconstruir todo el contexto.

### 6.3 Estados terminales

La reconciliación no reabre automáticamente tareas completadas.

Una cita explícitamente reconfirmada sí puede reabrir una tarea cancelada cuando el flujo lo indica.

---

## 7. Reconciliación periódica de tareas

Cron:

```text
/api/cron/booking-task-reconcile
5,20,35,50 * * * *
```

Función:

`reconcileBookingAdminTasks`

Objetivos:

- crear una tarea si existe una cita confirmada sin tarea;
- refrescar tareas existentes;
- cancelar tarea si la cita fue cancelada/reprogramada;
- cancelar tareas huérfanas si la cita ya no existe;
- paginar para no depender de un límite pequeño de filas.

No modifica históricos financieros.

---

## 8. Confirmación al cliente

Una reserva confirmada envía email al cliente mediante la capa de booking.

Contenido:

- servicio;
- fecha;
- hora;
- enlace Meet/Teams;
- enlace seguro para cancelar;
- enlace seguro para reprogramar;
- archivo `cita-expert.ics`.

El ICS permite añadir la cita al calendario del cliente.

### Regla importante

Si la cita ya quedó correctamente creada pero falla el email de confirmación:

- la cita **se conserva**;
- el error de email se registra;
- no se elimina el evento válido por un fallo del canal de notificación.

---

## 9. Cancelación por el cliente

Ruta:

`app/api/booking/manage/cancel/route.ts`

El enlace usa un token firmado de gestión.

Flujo:

1. validar token;
2. cargar cita;
3. verificar que corresponde al email/servicio esperado;
4. marcar localmente como `cancelled`;
5. borrar evento remoto;
6. cancelar tarea Admin.

Si falla la eliminación remota:

- se restaura la cita a `confirmed`;
- se deja constancia en `admin_notes`;
- no se presenta al usuario una cancelación falsa.

Si la cita ya estaba cancelada, la operación es idempotente y se intenta reconciliar la tarea Admin.

---

## 10. Reprogramación

La reserva usa enlace firmado de gestión.

La nueva cita:

- vuelve a comprobar hueco;
- crea/actualiza el evento remoto;
- marca la anterior como `rescheduled`;
- elimina el evento remoto anterior;
- cancela la tarea anterior;
- crea/refresca la tarea de la nueva cita.

Si la sincronización del evento anterior falla, se restaura el estado coherente en EXPERT.

---

## 11. Edición desde Admin

Endpoint:

`app/api/admin/citas/route.ts`

Solo admin/owner.

Permite:

- cambiar estado;
- fecha;
- hora;
- enlace;
- notas;
- reenviar confirmación cuando corresponda.

### 11.1 Sincronización bidireccional controlada

Si Admin cambia horario o estado:

- EXPERT actualiza Calendar;
- si existe evento remoto, se actualiza;
- si no existe y la cita debe estar confirmada, se crea;
- si se cancela, se elimina.

Si el proveedor requerido no está conectado, EXPERT restaura el estado local anterior.

### 11.2 Fallos parciales

El código distingue:

- evento remoto nunca creado;
- evento remoto creado pero metadata no persistida;
- evento remoto actualizado pero persistencia local fallida;
- borrado remoto realizado pero refresh de token fallido.

Cuando no puede asegurar consistencia, conserva identificadores y añade una nota de reconciliación manual en lugar de fingir éxito.

---

## 12. Compensación de fallos de Calendar

La política es **compensación explícita**, no “best effort” silencioso.

### Caso A · falla antes de crear evento remoto

Se elimina el lock local.

### Caso B · evento remoto creado pero el resto falla

EXPERT intenta borrar el evento remoto.

Si lo consigue:

- cancela tarea si llegó a existir;
- elimina la cita temporal/local cuando procede.

### Caso C · no se puede limpiar el evento remoto

La fila local se conserva como cancelada o pendiente de reconciliación con:

- proveedor;
- ID remoto;
- notas de incidencia.

Objetivo: no dejar un evento remoto invisible para EXPERT.

---

## 13. Flujo de correo de KIA

Cron:

```text
/api/cron/kia-email-agent
2-59/10 * * * *
```

Buzón operativo:

```text
info@expertconsulting.es
```

La sincronización de inbox corre separadamente:

```text
/api/cron/email-sync
*/10 * * * *
```

El agente trabaja sobre `email_inbox_cache`, pero antes de actuar vuelve a inspeccionar el hilo real de Gmail.

---

## 14. Qué considera “correo humano”

KIA excluye automáticamente:

- el propio buzón EXPERT;
- direcciones internas de EXPERT;
- no-reply / do-not-reply;
- mailer-daemon / postmaster;
- bulk/list/junk;
- mensajes con List-Unsubscribe;
- promociones;
- social;
- forums;
- auto-submitted no humano.

Esto reduce bucles y respuestas a sistemas automáticos.

---

## 15. Lectura de Gmail

El agente:

1. lista hilos cacheados como unread;
2. pagina hasta el límite operativo;
3. inspecciona el hilo real;
4. comprueba que el último mensaje siga unread;
5. procesa como máximo un número limitado de inspecciones por ejecución;
6. no marca el hilo leído solo por inspeccionarlo.

La decisión de marcar leído queda separada de la inspección operativa.

---

## 16. Identidad desde correo

Para cada remitente se intenta resolver:

- cliente;
- lead;
- empresa;
- expediente;
- servicio.

Si el remitente no existe y es un contacto humano nuevo:

- se puede crear un lead con origen `email`;
- se usa una `source_key` estable;
- una carrera concurrente se resuelve releyendo el lead canónico.

Crear un lead **no convierte ese contacto automáticamente en contexto privado de confianza**.

La variable:

`wasKnownContact`

se calcula antes de crear el nuevo lead.

Eso evita que un remitente desconocido obtenga herramientas privadas solo porque el sistema acaba de insertarlo en CRM.

---

## 17. Herramientas permitidas en email

Contacto conocido:

- estado de expediente;
- tareas;
- documentos;
- timeline;
- comunicaciones;
- blueprint de servicio;
- knowledge;
- fuentes oficiales;
- servicios;
- disponibilidad;
- creación de reunión bajo guardas.

Prospecto nuevo seguro:

- knowledge público;
- fuentes oficiales;
- servicios;
- disponibilidad;
- creación de reunión solo si pasa la preautorización correspondiente.

No se abre acceso privado a expedientes por el simple hecho de escribir un email.

---

## 18. Respuesta automática: condiciones

Controles operativos:

- `kia.email_agent` — análisis de correo. Debe existir como fila persistida en `automation_settings`; sin fila/timestamp válido el agente falla cerrado.
- `kia.email_auto_send` — autoenvío guardado.
- `kia.email_new_lead_auto_send` — autoenvío a nuevos contactos seguros.

Variables complementarias:

```env
KIA_EMAIL_SEND_AS_ALIASES_ENABLED=false
KIA_EMAIL_MIN_CONFIDENCE=0.88
```

Los antiguos flags de activación/autoenvío no habilitan el agente. La fuente de verdad son las filas persistidas de `automation_settings`.

`KIA_EMAIL_SEND_AS_ALIASES_ENABLED` no se activa hasta que Google Workspace haya creado y verificado los aliases. Mientras tanto la salida permanece en `info@expertconsulting.es`.

La fecha de activación se compara contra `Gmail internalDate`, no contra el encabezado `Date:` aportado por el remitente, para evitar procesar backlog anterior o excluir correo nuevo con fecha RFC incorrecta.

Para enviar automáticamente deben cumplirse, entre otros:

- agente habilitado;
- auto-send habilitado;
- stack IA saludable;
- identidad no ambigua;
- remitente coherente con el expediente;
- Reply-To coherente;
- sin adjuntos relevantes;
- sin fallback de proveedor;
- no `requiresManualReview`;
- `nextAction != needs_review`;
- confianza >= umbral.

Si falla cualquiera de estas condiciones, KIA puede analizar pero no debe ejecutar la respuesta autónoma.

---

## 19. Reply-To y adjuntos

El destinatario real de respuesta es:

`Reply-To || From`

Si `Reply-To` no coincide con el remitente esperado, se bloquea la acción autónoma y se deriva a revisión.

Adjuntos:

- imágenes inline de firma no cuentan como adjunto de riesgo;
- adjuntos reales sí bloquean la respuesta automática en el flujo conservador actual.

---

## 20. Respuesta en el hilo nativo

KIA responde sobre Gmail conservando el thread.

La capa `operational-gmail` usa un único transporte autónomo operativo y conserva la continuidad del hilo.

Antes de escribir en Gmail se reserva una claim idempotente:

```text
kia_email_send:<hash>
```

Estados relevantes:

- `reserved`
- éxito registrado
- `uncertain_failure`

Si la claim ya existe, no se vuelve a enviar.

Esto evita respuestas duplicadas por reintentos del cron.

---

## 21. Persistencia de comunicaciones

Cada correo humano entrante se registra individualmente en `email_events`:

```text
event_type = email.inbound
direction = in
```

Cada respuesta KIA se registra con:

```text
direction = out
```

Metadata cuando está disponible:

- `client_id`;
- `lead_id`;
- `case_id`;
- `company_id`;
- Gmail message ID;
- thread ID;
- transporte;
- fecha.

La vista de comunicaciones/timeline usa esta dirección persistida.

---

## 22. Deduplicación de email

La deduplicación ya no elimina todo un hilo simplemente porque exista un evento persistido para ese thread.

Se compara el momento del mensaje persistido con el mensaje de inbox.

Así:

- mensajes antiguos ya guardados no aparecen duplicados;
- un mensaje nuevo dentro del mismo hilo sí aparece.

La migración:

`20260928203625_email_source_keys_forward_only.sql`

añade `source_key` a:

- `email_events`;
- `internal_tasks`.

Antes de crear índices únicos, la migración aborta si detecta duplicados existentes, para no corregir históricos automáticamente.

---

## 23. Notificaciones Admin de correo

KIA procesa y clasifica todo el inbox, pero **no interrumpe por cada mensaje**.

Comportamiento:

- marketing, newsletters y sistemas rutinarios: etiqueta y silencia;
- proveedor/organismo con señal de plazo, riesgo o acción requerida: prioridad alta/crítica;
- cliente/lead seguro resuelto automáticamente: puede generar push solo si la novedad es importante;
- caso bloqueado, ambiguo, sensible o `needs_review`: escalado humano.

Cuando se requiere intervención de Ksenia, el mismo resumen estructurado se envía por:

- PushApp;
- Telegram Admin configurado;
- `soy@kseniailicheva.com`.

El aviso explica quién escribió, qué hizo KIA, qué quedó bloqueado y qué necesita de Ksenia, con enlace directo al hilo/expediente.

Las tareas creadas por KIA mantienen su propia trazabilidad, pero el objetivo es **señal alta y mínima duplicación**.

---

## 24. Creación de tareas desde email

Si la decisión de KIA produce una acción administrativa que requiere seguimiento, puede crearse una tarea de tipo:

```text
task_kind = email_request
```

La creación exige:

- identidad/lead válido;
- ausencia de ambigüedad;
- Reply-To seguro;
- decisión sin revisión manual;
- confianza suficiente.

También utiliza clave idempotente para no duplicar tareas por el mismo mensaje.

---

## 25. KIA Health y fail-closed

El agente de correo escribe heartbeat en `system_kv`, incluso cuando está deshabilitado.

Estados:

- `disabled`
- `ok`
- `degraded`

El flujo de `email-sync` mantiene una notificación fallback de correos no leídos cuando KIA:

- está deshabilitada;
- está degradada;
- tiene heartbeat antiguo.

Así no se pierde visibilidad humana por una avería del agente autónomo.

---

## 26. Routing IA

KIA puede trabajar con AI Gateway y proveedores directos.

Configuración relevante:

```env
KIA_AI_PROVIDER_ROUTER_ENABLED=true
KIA_DIRECT_PROVIDER_ORDER=google,anthropic,openai
```

El router admite failover entre proveedores cuando aparecen errores de cuota/billing/rate limit configurados.

Un fallback de proveedor impide el auto-send de email en el flujo conservador.

---

## 27. Reuniones solicitadas por email

KIA puede:

1. interpretar que el usuario quiere una reunión;
2. llamar a `get_booking_availability`;
3. proponer slots reales;
4. esperar confirmación explícita;
5. llamar a `create_booking_meeting`;
6. crear cita + Calendar + Meet + tarea + email.

La herramienta `create_booking_meeting` se excluye antes incluso de llamar al modelo cuando la precondición de acción externa no es elegible.

Además se exige el umbral de confianza de acción externa.

---

## 28. Origen comercial y funnel

### Ya en `main`

La reserva web conserva `contentOrigin` y lo propaga a la tarea Admin.

Ejemplos:

```text
blog:<slug>
docs:<slug>
service:<slug>
form:cita
```

El origen se muestra en metadata/descripción de tarea y puede aparecer en push Admin.

### En PR #515

Pendiente de merge al redactar este documento:

- una reunión pública de visitante nuevo crea/reutiliza lead;
- matching de email en consulta gratuita/presupuesto pasa a case-insensitive;
- Telegram conserva origen de blog/docs mediante un fingerprint corto determinista compatible con el límite de deep links;
- el servidor resuelve el fingerprint contra el catálogo canónico y falla cerrado si no hay una única coincidencia;
- si la identidad Telegram ya está vinculada, el origen se persiste incluso en el primer `/start`, creando el sobre de conversación si aún no existía;
- no se crea identidad ni lead a partir de un username/chat anónimo.

---

## 29. Leads en reuniones públicas — PR #515

Regla prevista:

- si existe cliente inequívoco -> vincular cliente;
- si no existe cliente y existe un único lead por email -> usar ese lead;
- si no existe, intentar teléfono;
- si existe ambigüedad -> no autoasignar;
- si no existe ninguno -> crear lead para la reserva pública.

La creación o actualización del lead ocurre después de confirmar la cita y, en reprogramaciones, después de haber completado correctamente la sustitución de la cita anterior.

Cada interacción usa `booking:<appointmentId>` y se actualiza de forma idempotente: un retry no duplica el mismo booking dentro de la metadata del lead. Las carreras por email/teléfono releen el lead canónico y aplican también la interacción de la cita que perdió la carrera.

Un fallo CRM **no puede revertir una reunión ya creada correctamente**.

---

## 30. Cronología de los principales efectos

### Reserva web

```text
validación
-> busy check remoto
-> appointments.pending_calendar
-> Calendar event + Meet
-> appointments.confirmed
-> resolución identidad/lead
-> internal_tasks.booking_meeting
-> email + ICS
```

### Reserva KIA

```text
get_booking_availability
-> propuesta al usuario
-> confirmación textual exacta
-> recheck busy
-> appointments.pending_calendar
-> Calendar event + Meet
-> appointments.confirmed
-> task Admin
-> management token
-> email + ICS
```

### Email humano

```text
email-sync
-> inbox cache
-> inspección Gmail live
-> filtro humano
-> identidad/lead
-> email_events inbound
-> push Admin
-> KIA decision
-> tarea opcional
-> claim de envío
-> reply Gmail
-> email_events outbound
-> heartbeat/watermark
```

---

## 31. Idempotencia y prevención de duplicados

Se usan varias capas.

### Email

- `gmail-inbound:<message-id>`
- `gmail-email:<hash-email>`
- `kia_email_send:<hash-thread-message>`
- `source_key` único en `email_events`
- `source_key` único en `internal_tasks`

### Reuniones

- lock `pending_calendar`;
- restricción de solapamiento;
- `booking_appointment_id` canónico en tarea;
- management token ligado a cita/email/servicio.

### Principio

Un retry debe releer el estado existente, no repetir el efecto externo.

---

## 32. Seguridad

Reglas actuales:

- KIA no usa mensajes históricos citados como consentimiento.
- Un lead recién creado no obtiene contexto privado.
- Una dirección Reply-To sospechosa bloquea autonomía.
- Adjuntos reales bloquean auto-send.
- Ambigüedad de expediente bloquea acciones.
- `requiresManualReview` bloquea acciones.
- `needs_review` bloquea acciones.
- La creación de reunión es acción R2.
- La disponibilidad es lectura.
- El email de la reserva debe concordar con la identidad.
- El enlace de cancelación/reprogramación usa token firmado.
- No se exponen secretos en prompts ni respuestas.

---

## 33. Variables de entorno relevantes

### Booking

```env
NEXT_PUBLIC_NATIVE_BOOKING_ENABLED=true
BOOKING_CALENDAR_PROVIDER=google
BOOKING_ACADEMY_DURATION_MINUTES=30
```

Fallbacks Google Appointment Schedules opcionales:

```env
NEXT_PUBLIC_GOOGLE_BOOKING_REUNION_URL=
NEXT_PUBLIC_GOOGLE_BOOKING_DEMO_URL=
NEXT_PUBLIC_GOOGLE_BOOKING_ONBOARDING_URL=
NEXT_PUBLIC_GOOGLE_BOOKING_FORMACION_URL=
NEXT_PUBLIC_GOOGLE_BOOKING_ACADEMY_URL=
```

### KIA email

La activación se controla exclusivamente mediante filas persistidas en `automation_settings`:

- `kia.email_agent`
- `kia.email_auto_send`
- `kia.email_new_lead_auto_send`

Variables complementarias:

```env
KIA_EMAIL_SEND_AS_ALIASES_ENABLED=false
KIA_EMAIL_MIN_CONFIDENCE=0.88
```

Los antiguos flags `KIA_EMAIL_AGENT_ENABLED` y `KIA_EMAIL_AUTO_SEND_ENABLED` no habilitan producción.

### IA

```env
KIA_AI_PROVIDER_ROUTER_ENABLED=true
KIA_DIRECT_PROVIDER_ORDER=google,anthropic,openai
```

### OAuth

Se requieren las credenciales del proveedor elegido y los callbacks configurados.

No documentar secretos reales en este archivo.

---

## 34. Tablas principales

### `appointments`

Estado canónico de la cita:

- identidad;
- servicio;
- horario;
- status;
- proveedor;
- ID remoto;
- meeting URL;
- notas;
- relaciones CRM.

### `internal_tasks`

Tareas Admin de reunión o petición por email.

### `email_events`

Historial persistido inbound/outbound.

### `email_inbox_cache`

Vista/cache operativa de inbox para procesado.

### `leads`

Prospectos detectados desde web o correo.

### `system_kv`

- watermarks;
- claims de envío;
- heartbeat del agente.

---

## 35. Crons relacionados

Según `vercel.json`:

| Cron | Frecuencia | Función |
|---|---:|---|
| `/api/cron/email-sync` | cada 10 min | sincronizar inbox |
| `/api/cron/kia-email-agent` | cada 10 min, desplazado | analizar/responder tras sync |
| `/api/cron/booking-task-reconcile` | 4 veces/hora | reconciliar citas y tareas |
| `/api/cron/kia-health` | diario | health general KIA |

El desplazamiento del agente respecto al sync reduce la posibilidad de que procese una cache todavía no actualizada.

---

## 36. Checklist de validación antes de producción

### Correo

- [ ] `email-sync` verde.
- [ ] conexión Gmail operativa.
- [ ] inbox real visible.
- [ ] filtros de no-humanos verificados.
- [ ] Reply-To probado.
- [ ] adjunto real bloquea auto-send.
- [ ] firma KIA presente.
- [ ] respuesta permanece en mismo hilo.
- [ ] inbound/outbound visibles en Admin.
- [ ] push solo por inbound humano.
- [ ] tarea genera push independiente.
- [ ] no hay doble respuesta tras retry.
- [ ] heartbeat KIA email actualizado.

### Reuniones

- [ ] disponibilidad coincide con Calendar.
- [ ] slot ocupado se rechaza.
- [ ] confirmación sin fecha exacta se rechaza.
- [ ] confirmación sin hora exacta se rechaza.
- [ ] negación se rechaza.
- [ ] texto citado no autoriza.
- [ ] cita queda en EXPERT.
- [ ] evento remoto existe.
- [ ] enlace Meet/Teams existe.
- [ ] tarea Admin existe una sola vez.
- [ ] confirmación email incluye enlaces gestión.
- [ ] ICS correcto.
- [ ] cancelación elimina evento y cancela tarea.
- [ ] reprogramación mantiene consistencia.
- [ ] Admin edit sincroniza proveedor.

### Funnel

- [ ] origen blog/docs llega a cita.
- [ ] origen llega a tarea Admin.
- [ ] lead nuevo se crea una sola vez.
- [ ] email con mayúsculas no duplica lead.
- [ ] Telegram no inventa identidad.

---

## 37. Tests de regresión relevantes

### Booking

- `tests/booking/booking-admin-task.test.ts`
- `tests/booking/booking-email-delivery.test.ts`
- `tests/booking/booking-final-ux.test.ts`
- `tests/booking/native-booking-flow.test.ts`

### KIA reuniones

- `tests/kia/kia-meeting-operator.test.ts`

Cubre:

- tool R0/R2;
- lista blanca de servicios;
- confirmación exacta;
- negaciones;
- conflicto fecha/hora;
- busy recheck;
- lock local;
- compensación;
- email ligado a identidad;
- tarea + Meet + email;
- retención de cita si solo falla email.

### KIA email

- `tests/kia/kia-email-agent.test.ts`
- `tests/admin/lead-email-history.test.ts`
- `tests/admin/client-communications-operations.test.ts`

Cubre:

- fail-closed;
- humanos vs bots;
- prospectos públicos;
- heartbeat;
- push;
- inbound/outbound;
- permisos;
- claims idempotentes;
- Reply-To;
- adjuntos;
- threading;
- texto citado;
- pre-gate de booking.

### Funnel

- `tests/services/article-intent-irnr-flow.test.ts`
- `tests/content/article-intent-irnr.test.ts`
- `tests/services/irnr-intent-funnel.test.ts`

---

## 38. Diagnóstico de incidencias

### “KIA no responde correos”

Comprobar:

1. fila `kia.email_agent` en `automation_settings`;
2. fila `kia.email_auto_send` en `automation_settings`;
3. fila `kia.email_new_lead_auto_send` si aplica a prospectos;
4. heartbeat en `system_kv`;
4. proveedor IA;
5. Gmail conectado;
6. unread real;
7. si fue clasificado no-humano;
8. ambigüedad de expediente;
9. Reply-To mismatch;
10. adjuntos;
11. confianza;
12. `requiresManualReview`;
13. `needs_review`.

### “KIA responde pero no crea reunión”

Comprobar:

1. servicio permitido;
2. tool disponible;
3. acción externa pre-elegible;
4. confirmación exacta;
5. fecha/hora;
6. slot libre;
7. email de identidad;
8. proveedor Calendar conectado;
9. Meet URL generado.

### “Hay cita en EXPERT pero no Calendar”

Revisar:

- `booking_provider`;
- `provider_booking_id`;
- `google_event_id`;
- `admin_notes`;
- errores de compensación;
- estado del proveedor.

### “Hay evento Calendar pero no cita válida”

No borrar manualmente a ciegas.

Revisar primero la nota de reconciliación y el ID remoto. El código conserva el identificador cuando no puede asegurar el rollback remoto.

### “La tarea de reunión falta”

Ejecutar/verificar:

`/api/cron/booking-task-reconcile`

La reconciliación debe reconstruir la tarea a partir de `appointments`.

---

## 39. Reglas de mantenimiento

Al modificar estos flujos:

1. no crear un segundo sistema paralelo de reservas;
2. mantener `appointments` como registro canónico;
3. usar `calendar-provider.ts` para Google/MS365;
4. conservar la compensación en errores externos;
5. nunca convertir timeout en retry ciego de escritura;
6. mantener claves idempotentes;
7. no rebajar R2 de `create_booking_meeting`;
8. no usar quoted history como consentimiento;
9. no dar contexto privado a un lead recién creado;
10. mantener tarea Admin sincronizada;
11. ejecutar typecheck, lint, build, tests y Vercel;
12. si hay DDL, usar migración y preflight;
13. si se toca seguridad/DDL, ejecutar Security Advisor.

---

## 40. Estado pendiente tras esta documentación

### PR #515

En revisión al 29/09/2026:

- lead para reuniones públicas nuevas;
- email matching case-insensitive en consulta/presupuesto;
- origen blog/docs hacia Telegram;
- persistencia de origen Telegram solo con identidad verificada.

No considerar esos puntos publicados en producción hasta que:

- CI esté verde;
- ambos Vercel estén verdes;
- revisión esté limpia;
- PR esté fusionada.

---

## 41. Referencias internas

- `docs/kia-work-case-orchestration.md`
- `docs/kia-contextual-conversations-roadmap.md`
- `docs/kia-work-connector-runbook.md`
- `.env.example`
- `vercel.json`

### Cambios de referencia

- PR #511: KIA Gmail + reuniones Google/Calendar/Meet + trazabilidad CRM.
- PR #515: atribución del funnel público y cierre de huecos de lead/origen.
