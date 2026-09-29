# KIA — operación de correo, clasificación y alertas

Última revisión: 2026-09-29.

## Objetivo

KIA opera `info@expertconsulting.es` como buzón central de EXPERT. Debe leer y clasificar el correo entrante, resolver automáticamente lo que sea seguro y escalar a Ksenia únicamente cuando exista riesgo, ambigüedad, plazo o necesidad real de aprobación humana.

El buzón no se considera una cola homogénea de “no leídos”. KIA distingue entre personas, organismos oficiales, proveedores, sistemas técnicos, marketing y mensajes internos.

## Identidades previstas

Buzón principal:

- `info@expertconsulting.es` — recepción general y fallback de salida.

Identidades funcionales previstas:

- `kia@expertconsulting.es` — conversaciones atendidas por KIA.
- `documentos@expertconsulting.es` — solicitudes y recepción documental.
- `citas@expertconsulting.es` — reuniones y agenda.
- `facturacion@expertconsulting.es` — facturación y cobros.
- `noreply@expertconsulting.es` — alertas y mensajes transaccionales que no deben recibir respuesta.

Estas direcciones deben crearse como aliases/send-as válidos en Google Workspace antes de usarlas en producción. La aplicación ya soporta seleccionar la identidad funcional según el destinatario original. Gmail rechazará o reescribirá un remitente que no esté autorizado por Workspace. Por seguridad, `KIA_EMAIL_SEND_AS_ALIASES_ENABLED` permanece desactivado hasta verificar los aliases; mientras tanto todas las respuestas salen desde `info@expertconsulting.es`.

## Clasificación

KIA asigna cada mensaje a una de estas clases:

| Clase | Ejemplos | Acción |
|---|---|---|
| Humano | cliente, lead, nuevo contacto | análisis KIA, contexto CRM/expediente, respuesta o revisión |
| Oficial | AEAT, Justicia, TGSS, DGT, registros | detectar plazos/requerimientos y escalar si procede |
| Proveedor | Stripe, Revolut, Google, Holded, Resend, etc. | clasificar; escalar solo si requiere acción |
| Sistema | avisos automáticos no comerciales | clasificar y silenciar salvo señal de riesgo |
| Marketing | newsletters, promociones, listas | clasificar sin interrumpir |
| Interno | EXPERT → EXPERT | clasificar como sistema interno |

Etiquetas operativas:

- `00 KIA/URGENTE`
- `01 KIA/Personas`
- `03 Finanzas/Proveedores`
- `04 KIA/Administración`
- `90 Tecnología/GitHub`
- `91 EXPERT/Sistema`
- `92 Marketing y Newsletters`

## Cuándo responde sola

KIA puede responder automáticamente solo si todos los controles permiten la acción:

1. agente de correo activo;
2. autoenvío activo;
3. stack IA operativo;
4. identidad del contacto suficientemente resuelta;
5. expediente no ambiguo;
6. remitente y Reply-To coherentes;
7. sin adjuntos que requieran revisión humana;
8. no se ha usado fallback de proveedor;
9. `requiresManualReview = false`;
10. `nextAction != needs_review`;
11. confianza igual o superior al umbral;
12. si es un nuevo contacto, la solicitud debe ser comercial, clara y de alta confianza y el switch específico de nuevos leads debe estar activo.

Las respuestas se reservan mediante una clave idempotente antes de enviar para evitar duplicados.

## Corte de activación

KIA no procesa retrospectivamente el backlog anterior a la activación.

El switch `kia.email_agent` debe existir en `automation_settings` y estar activo. Su `updated_at` define el instante de activación. Si no existe un timestamp persistido válido, el agente falla cerrado.

La comparación se hace contra la fecha interna de recepción de Gmail (`internalDate`), no contra el encabezado RFC `Date` controlado por el remitente.

## Alertas

### PushApp

Push se utiliza para novedades importantes y acciones realizadas por KIA. La app resincroniza la suscripción del navegador al abrir el Admin.

`admin_push_health` registra:

- intentos;
- entregas;
- errores;
- endpoints caducados;
- errores de consulta de suscripciones;
- estado `ok`, `degraded`, `no_subscription` o `misconfigured`.

Una entrega parcial nunca se considera `ok`.

### Telegram y correo personal

Cuando KIA necesita intervención real, el mismo resumen se envía por:

- PushApp;
- Telegram al chat Admin configurado;
- `soy@kseniailicheva.com`.

El aviso debe explicar:

- quién escribió;
- prioridad;
- qué hizo KIA;
- qué quedó bloqueado;
- qué necesita de Ksenia;
- enlace directo al hilo/expediente.

No se usa Telegram ni el correo personal para cada mensaje rutinario.

## Casos que requieren intervención

KIA debe escalar, entre otros:

- expediente ambiguo;
- remitente no autorizado para un expediente enlazado;
- Reply-To diferente del remitente;
- adjuntos que requieren revisión;
- fallback de proveedor IA;
- `requiresManualReview`;
- `needs_review`;
- avisos oficiales con plazo, caducidad, subsanación o requerimiento;
- avisos de proveedor con riesgo, pago fallido, suspensión, seguridad o acción requerida.

## Panel Admin

Los controles operativos son:

- `kia.email_agent` — analizar correos;
- `kia.email_auto_send` — responder automáticamente;
- `kia.email_new_lead_auto_send` — responder automáticamente a nuevos contactos seguros.

Los switches faltantes se muestran desactivados. Al activarlos, el estado devuelto por la API se incorpora inmediatamente al panel.

## Seguridad y trazabilidad

- No se exponen secretos ni claves.
- No se responde a marketing, listas o mensajes automáticos como si fueran clientes.
- Cada entrada humana procesada se audita en `email_events`.
- Cada decisión KIA conserva `decision_log_id` cuando está disponible.
- Cada autoenvío registra transporte, modo de autenticación y mensaje de origen.
- Los endpoints push 404/410 se eliminan.
- El agente mantiene heartbeat en `system_kv:kia_email_agent_health`.
- El sistema mantiene salud push en `system_kv:admin_push_health`.

## Checklist antes de “trabajar” en producción

- [ ] Vercel `app` verde.
- [ ] Vercel `ksenia-expert` verde.
- [ ] revisión Codex sin P1/P2 abiertos.
- [ ] PR fusionada en `main`.
- [ ] producción desplegada sobre el SHA fusionado.
- [ ] `kia.email_agent` activado desde Admin.
- [ ] heartbeat `kia_email_agent_health.status = ok`.
- [ ] suscripción push resincronizada y `admin_push_health` sano.
- [ ] Telegram Admin operativo.
- [ ] correo de escalado a `soy@kseniailicheva.com` operativo.
- [ ] prueba controlada de correo humano seguro.
- [ ] prueba controlada de caso bloqueado/revisión.
- [ ] aliases de Workspace creados y verificados.
- [ ] `KIA_EMAIL_SEND_AS_ALIASES_ENABLED=true` solo después de verificar send-as.

## Rollback

Desactivar en Admin, en este orden:

1. `kia.email_new_lead_auto_send`;
2. `kia.email_auto_send`;
3. `kia.email_agent`.

No es necesario borrar datos ni modificar historial para detener la automatización.
