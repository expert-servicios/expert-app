# KIA — hoja registral del cliente (Client Ledger)

Fecha de diseño: 29/09/2026.

## Decisión

La “hoja registral” se implementa como dos capas:

1. **ledger append-only** de eventos verificables;
2. **snapshot de contexto** compacto para que KIA lo lea antes de responder.

No sustituye las tablas canónicas de expedientes, documentos, facturas o comunicaciones.

## Por qué no usar solo memoria RAG

KIA ya dispone de `kia_memories` para memoria semántica. Esa memoria sirve para recuperar hechos y conversaciones relevantes, pero no es un registro cronológico exhaustivo.

La hoja registral añade:
- trazabilidad;
- idempotencia;
- continuidad desde lead hasta cliente;
- referencias a la fuente original;
- timeline completo;
- contexto compacto años después.

La memoria RAG puede derivarse del ledger, pero el ledger no se deriva de recuerdos libres del modelo.

## Identidad estable

Se crea un `client_registry_subject` estable.

Puede empezar con:
- `lead_id`;
- email/teléfono normalizados.

Cuando el lead se convierte en cliente:
- se añade `client_id` al mismo subject;
- no se crea una historia nueva;
- todos los eventos anteriores permanecen vinculados.

Si aparecen duplicados:
- nunca fusionar automáticamente por semejanza débil;
- usar identidad canónica y revisión cuando haya conflicto.

## Eventos

Ejemplos de `event_type`:
- `lead.created`
- `lead.updated`
- `quote.created`
- `quote.accepted`
- `order.created`
- `payment.succeeded`
- `invoice.issued`
- `case.opened`
- `case.status_changed`
- `document.received`
- `document.signed`
- `email.inbound`
- `email.outbound`
- `chat.user`
- `chat.kia`
- `telegram.inbound`
- `telegram.outbound`
- `appointment.booked`
- `appointment.completed`
- `meeting.notes_ready`
- `task.created`
- `task.completed`
- `service.started`
- `service.completed`

Cada evento guarda:
- subject estable;
- lead/client/company/case si existen;
- fecha efectiva;
- tipo/canal/dirección;
- título/resumen;
- referencia a tabla/origen;
- idempotency key;
- metadata mínima;
- importancia.

No duplicar:
- cuerpo completo de correos;
- PDFs;
- secretos;
- facturas completas;
- prompts internos.

Se guarda la referencia; la fuente canónica sigue donde corresponde.

## Snapshot

Una fila por subject con:
- identidad;
- etapa lead/cliente;
- idioma;
- empresas;
- servicios históricos y activos;
- expedientes activos/cerrados;
- documentos clave;
- presupuestos/pedidos/facturas resumidos;
- tareas abiertas;
- próximos hitos;
- preferencias verificadas;
- último contacto;
- últimos eventos importantes;
- instrucciones operativas confirmadas;
- alertas/conflictos de identidad.

El snapshot no es verdad absoluta: incluye `as_of` y referencias de versión.

## Cómo lo usa KIA

Orden antes de responder:

1. resolver identidad;
2. cargar hoja registral snapshot;
3. cargar eventos recientes relevantes;
4. cargar memoria RAG semántica;
5. si la pregunta requiere un dato vivo/exacto, usar la tool canónica correspondiente;
6. responder.

Regla:
> Ledger para continuidad; tools canónicas para exactitud operativa actual.

## Escritura

La escritura debe ser idempotente.

Fuentes inmediatas:
- chat KIA;
- Telegram;
- correo procesado;
- documentos recibidos;
- citas;
- firma.

Fuentes reconciliadas:
- leads;
- quotes;
- orders;
- invoices;
- cases;
- tasks;
- appointments;
- documents;
- email events;
- conversations.

Un cron de reconciliación cubre eventos omitidos sin bloquear transacciones de negocio.

## Seguridad

Las tablas del ledger:
- RLS habilitado;
- sin acceso directo `anon`/`authenticated`;
- service-role/server only;
- vistas/endpoint Admin explícitos para lectura;
- KIA cliente solo recibe el fragmento autorizado de su propio subject;
- no mezclar companies/cases fuera de alcance.

## Retención

El ledger registra hechos de relación profesional y debe respetar la matriz de conservación RGPD.
No marcar “permanent” por defecto.
Los eventos pueden quedar pseudonimizados/eliminados cuando proceda legalmente, manteniendo únicamente evidencias necesarias.

## Criterio de listo

- [ ] subject se crea desde lead;
- [ ] lead→cliente conserva subject;
- [ ] eventos idempotentes;
- [ ] snapshot determinista;
- [ ] KIA carga snapshot antes de responder;
- [ ] referencias a fuentes, no duplicación masiva;
- [ ] reconciliación periódica;
- [ ] RLS/revokes;
- [ ] Security Advisor;
- [ ] pruebas de aislamiento de clientes/empresas;
- [ ] admin timeline visible en Company 360/cliente.
