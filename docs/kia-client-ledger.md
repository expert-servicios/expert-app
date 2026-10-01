# KIA — hoja registral del cliente (Client Ledger)

Fecha de diseño: 29/09/2026. Última actualización: 30/09/2026.

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

### Reconciliación operativa

- cursor persistente separado para `profiles` y `leads`;
- orden determinista por UUID para completar el backfill en ciclos sucesivos;
- concurrencia limitada por `KIA_CLIENT_LEDGER_CONCURRENCY` (1–8);
- eventos preparados en memoria y escritos en lotes idempotentes (`source_key` + `ignoreDuplicates`);
- errores parciales abortan el snapshot: nunca se marca como actualizado un ledger incompleto;
- al terminar un recorrido, el cursor vuelve a `null` y comienza un nuevo ciclo para incorporar altas posteriores.

## Seguridad

Las tablas del ledger:
- RLS habilitado;
- sin acceso directo `anon`/`authenticated`;
- service-role/server only;
- `client_registry_events` es append-only para el backend normal: `service_role` solo tiene `SELECT` e `INSERT`;
- los subjects pueden conservarse como identidad huérfana si se elimina el lead/perfil canónico, evitando que una FK `SET NULL` bloquee la baja;
- vistas/endpoint Admin explícitos para lectura;
- KIA cliente solo recibe el fragmento autorizado de su propio subject;
- el contexto filtrado respeta `company_id` y `case_id`;
- conversaciones `staff_preview` no se incorporan al ledger del administrador.

## Retención

El ledger registra hechos de relación profesional y debe respetar la matriz de conservación RGPD.
No marcar “permanent” por defecto.
Los eventos pueden quedar pseudonimizados/eliminados cuando proceda legalmente, manteniendo únicamente evidencias necesarias.

## Criterio de listo

- [x] subject se crea desde lead/cliente/prospect con conflicto de identidad fail-closed;
- [x] lead→cliente puede conservar subject mediante identidad explícita;
- [x] eventos idempotentes y escritura reconciliada por lotes;
- [x] snapshot determinista con errores parciales fail-closed;
- [x] KIA carga contexto registral antes de responder cuando `KIA_CLIENT_LEDGER_ENABLED=true`;
- [x] referencias a fuentes, no duplicación masiva;
- [x] reconciliación periódica con cursor persistente;
- [x] RLS/revokes + ledger append-only para `service_role`;
- [x] Security Advisor ejecutado después del DDL inicial;
- [x] aislamiento de company/case y exclusión de staff preview cubiertos por regresión;
- [ ] backfill de producción activado y observado con `KIA_CLIENT_LEDGER_ENABLED=true`;
- [ ] admin timeline visible en Company 360/cliente.
