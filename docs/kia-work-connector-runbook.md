# KIA–Work: conector de resultados

Estado: fusionado y desplegado en producción el 24/09/2026; migraciones aplicadas. La activación funcional y el piloto siguen pendientes. No es un webhook nativo de Work. Diseño completo: [orquestación de expedientes](kia-work-case-orchestration.md).

## Implementado

- Delegación profesional de un expediente y hasta 50 tareas: credencial de 256 bits almacenada como hash, revocable y con vigencia máxima de 24 horas. Cada petición revalida rol, estado, titular, empresa y tenant. Se admiten particulares con empresa y tenant nulos.
- Reserva de tarea durante 15 minutos. PostgreSQL valida versión, dependencias y evidencia; registra el resultado, completa la tarea y actualiza el siguiente paso en una transacción. Un resultado bloqueado, fallido o cancelado devuelve la tarea a pendiente; no cancela el expediente.
- El mismo evento con idéntico contenido devuelve su resultado anterior. Un contenido distinto con el mismo identificador se rechaza. Una edición humana invalida la reserva; un segundo trabajador no puede tomar una reserva activa.
- Documentos: propiedad, checklist, vigencia y SHA-256 de los bytes privados. Correos: aceptación registrada por el proveedor, expediente y tarea exactos. Actuaciones: registro canónico `administrative_actions` ya completado; el conector no aprueba ni ejecuta actuaciones administrativas.
- `sendEmail` con `metadata.kia_author=true`: firma «KIA · EXPERT 💼», identificación como asistente de IA, respuesta a `info@expertconsulting.es` y CTA contextual cuando su bandera está activa. El enlace exige un único destinatario coincidente con el perfil; no se duplica. Los correos humanos conservan su autoría.
- Gmail: respuestas con asunto original, `In-Reply-To` y `References` obtenidos del proveedor.
- Telegram: registro durable por actualización, chat privado, identidad vinculada y confirmación del proveedor. Con persistencia contextual activa, `/start ctx_TOKEN` abre el expediente autorizado y comparte historial con el copiloto. Las respuestas preparadas y no confirmadas no cuentan como entregadas en el historial.
- Vinculación Telegram y archivo de adjuntos de correo para particulares sin empresa ficticia. Se conserva proveedor, cuenta, hilo, mensaje, adjunto y fecha de origen.

## Configuración

1. Producción ya contiene `20260924170000_kia_work_case_orchestration.sql` y `20260924171500_kia_work_result_inbox.sql`. Para un entorno nuevo, aplicarlas en ese orden después de las migraciones anteriores. No cambian estados de expedientes ni envían mensajes.
2. Activar `KIA_WORK_CONNECTOR_ENABLED=true`. Para historial y CTA, usar las banderas existentes `KIA_CONTEXTUAL_CONVERSATIONS_ENABLED`, `KIA_CONTEXTUAL_EMAIL_CTA_ENABLED` y las de Telegram. Se mantienen sus credenciales existentes.
3. Desde una sesión profesional, `POST /api/admin/kia/work-connections` con `case_id`, `ttl_hours` y `tasks:[{id,policy}]`. El secreto se devuelve una sola vez, con `Cache-Control: no-store`. Guardarlo en el entorno local del adaptador; nunca en chats, URLs o archivos versionados.
4. Configurar `KIA_WORK_URL` (origen HTTPS) y `KIA_WORK_TOKEN` en el proceso de Work. Usar `node scripts/kia-work.mjs context`, `claim TASK_ID RUN_ID` y `report EVENT_JSON_FILE`. No hace falta una clave de servicio de Supabase en Work.
5. Revocar con `DELETE /api/admin/kia/work-connections`, cuerpo `{case_id,connection_id}`. Sigue disponible con el conector desactivado.

| Política `kind` | `target` | Evidencia |
| --- | --- | --- |
| `document_archived` | Clave exacta del checklist | `{type:"document",id,sha256}` |
| `email_sent` | Tipo exacto de `email_events` | `{type:"email",id}`; requiere metadatos `case_id` y `task_id` |
| `administrative_action_completed` | UUID de actuación existente | `{type:"administrative_action",id}` |

Cada política incluye `dependencies`, UUID de tareas del mismo expediente. Se rechazan referencias ajenas y ciclos. Delegar permite **registrar resultados**; no equivale a autorizar envíos, pagos o presentaciones.

## Resultados y recuperación

El evento incluye `schema_version:1`, `event_id` UUID estable, `task_id`, `run_id`, `claim_version`, `occurred_at` ISO con zona horaria y `result`. `succeeded` exige `evidence`; `blocked`, `failed` y `cancelled` exigen `reason`. Los eventos nuevos deben tener menos de 15 minutos. Un evento ya aplicado puede repetirse mientras la conexión siga autorizada.

Un timeout no acredita ni niega una actuación. Conservar el fichero y repetir el **mismo resultado**, nunca la actuación externa. La migración `20260924171500_kia_work_result_inbox.sql` añade recepción durable antes de verificar, reservas de procesamiento de dos minutos y un máximo de cinco intentos ante errores temporales. El cron autenticado `/api/cron/kia-work-results` se programa cada cinco minutos y solo trabaja con el conector activado. Verifica resultados; no reenvía correos ni repite actuaciones.

HTTP 202 significa guardado, todavía pendiente de verificación; el adaptador termina con código 2. HTTP 200 devuelve el resultado aplicado. HTTP 409 con estado `review` exige conciliación. La revocación, caducidad, cambio de ámbito o edición humana no se eluden con reintentos. Si caduca la reserva original de la tarea, el resultado pasa a revisión. Consultar contexto y conciliar antes de reservar de nuevo. Si la aplicación del resultado se confirmó en la base de datos pero faltó actualizar la bandeja, el trabajador recupera el resultado del registro existente sin verificar ni ejecutar otra vez la acción.

En Telegram, los registros `failed` y `received` sin `processed_at` requieren conciliación. No borrar sus identificadores para forzar reenvíos: el proveedor puede haber aceptado un mensaje aunque se perdiera la respuesta. La aceptación no garantiza entrega al destinatario.

## Pendientes del diseño completo

Pantalla de delegación sin configuración técnica; firma/CTA en composición nativa Gmail/MS365 (el helper actual corresponde a `sendEmail`); interfaz para conciliación de casos que requieren revisión; asociación de autorizaciones con el contenido exacto que se ejecutará; piloto desplegado. Identificación, firma, pago y presentación siguen bajo control humano, utilizando Chrome. No se reactiva seguimiento nocturno pausado.

## Validación

Producción verificada el 24/09/2026 sobre `main` `b53155ff1b5795c5b7084ec8fc5036e1a6525c07`: CI de `main` correcto, despliegues `app` y `ksenia-expert` en estado READY, sin errores de runtime Vercel en la hora posterior y sin errores PostgreSQL en la ventana post-despliegue. Las tablas `kia_work_connections`, `kia_work_claims`, `kia_work_events` y `kia_work_inbox` mantienen RLS activo, cero policies y grants exclusivos para `service_role`, de forma deliberada.

Vitest: `tests/kia/work-auth.test.ts`, `work-orchestration.test.ts`, `telegram-context-delivery.test.ts`, `tests/email/gmail-reply-headers.test.ts` y regresiones existentes.

`scripts/test-kia-work-sql.mjs` ejecuta las funciones en PostgreSQL WASM con tablas representativas y datos sintéticos. Instalar `@electric-sql/pglite@0.5.8` en un directorio temporal externo; `KIA_SQL_TEST_PACKAGE_JSON` apunta al `package.json` de ese paquete. Ejecutar desde la raíz del repositorio. Verifica dependencias, reservas exclusivas, rollback, replay, conflictos, versión obsoleta, revocación, roles y vinculación particular de Telegram. No sustituye el ensayo del esquema completo en staging. Las pruebas no envían mensajes reales.

Fuentes: [Gmail: hilos](https://developers.google.com/workspace/gmail/api/guides/threads), [Telegram: enlaces](https://core.telegram.org/bots/features#deep-linking), [Telegram: envío](https://core.telegram.org/bots/api#sendmessage), [Supabase: funciones y permisos](https://supabase.com/docs/guides/database/functions).
