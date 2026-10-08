# Telegram + Operations 360 — smoke E2E de cierre

Fecha prevista de cierre: 08/10/2026.

Este runbook valida el flujo real sin endpoints de test ni secretos dentro del repositorio.

## Precondiciones

- Producción o preview autorizado con Telegram y KIA configurados.
- Un usuario EXPERT de prueba con Telegram vinculado mediante código de un solo uso.
- Un expediente activo del usuario para la prueba documental.
- Acceso Admin a /admin/inbox, /admin/tareas y al expediente.

## Escenario A — prospecto público → lead → KIA

1. Desde un Telegram no vinculado, enviar una consulta pública de texto.
2. Verificar: respuesta KIA, lead creado o reutilizado con source=telegram, sin expediente automático.
3. Si KIA decide create_task, verificar tarea operativa idempotente; si requiere revisión, verificar telegram_review.
4. Reenviar la misma consulta y comprobar que no se duplica el lead ni una acción equivalente abierta.

## Escenario B — cliente vinculado → KIA → Operations 360

1. Vincular Telegram usando el enlace o código generado desde una sesión EXPERT.
2. Ejecutar /status y comprobar identidad verificada.
3. Enviar una consulta vinculada a un expediente o contexto válido.
4. Verificar en /admin/inbox: canal Telegram, cliente, empresa, expediente, categoría operativa, resumen KIA, siguiente acción y timeline inbound/outbound.

## Escenario C — takeover humano

1. En Operations 360 abrir el hilo Telegram del escenario B.
2. Pulsar Tomar yo.
3. Enviar otro mensaje desde Telegram.
4. Verificar que KIA no responde automáticamente, el mensaje aparece en timeline y el control permanece humano.
5. Responder desde Admin.
6. Verificar mensaje recibido en Telegram, timeline con mensaje professional, delivery_state=sent, telegram_message_id y audit operations360.manual_reply.
7. Pulsar Dejar a KIA y verificar operations360.control_changed.

## Escenario D — documento Telegram → Documents 360

1. Con identidad y expediente verificados, enviar un PDF o imagen permitido de menos de 10 MB.
2. Verificar confirmación Telegram y fila documents con owner_type=case, IDs correctos, kind=client_document, state=pendiente, uploaded_by_role=client, ingestion_source=telegram e ingestion_ref determinista.
3. Reprocesar el mismo evento y verificar que no se duplica el documento.
4. Enviar documento sin expediente contextual y verificar que no se sube a Storage.

## Escenario E — audit e idempotencia

Comprobar al final:
- kia_telegram_updates: update procesado una vez.
- kia_conversation_messages: inbound, outbound y professional coherentes.
- internal_tasks: sin duplicados semánticos.
- audit_logs: takeover, reply manual y documento cuando aplique.
- Operations 360 refleja el mismo estado que las tablas canónicas.

## Criterio de cierre

#134 puede cerrarse cuando A–E estén validados sobre un entorno conectado real y no exista discrepancia entre Telegram, Operations 360, tareas, Documents 360 y audit.

No son requisitos de cierre: /asignar, /cerrar, /cliente o /expediente. Esas operaciones pertenecen a Operations 360, donde disponen de scope, permisos y auditoría.