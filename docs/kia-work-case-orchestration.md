# KIA: tramitación desde Work y continuidad del expediente

Fecha: 24/09/2026. Estado: **diseño aprobado por producto; implementación pendiente**.

Esta entrega modifica documentación exclusivamente. No instala webhooks, activa bots, cambia permisos, envía comunicaciones ni habilita presentaciones. Extiende [Conversaciones contextuales](kia-contextual-conversations-roadmap.md) y [Operador interno](kia-internal-operator.md).

## 1. Objetivo y responsabilidad

KIA será la asistente IA de EXPERT encargada de coordinar la tramitación. Ksenia podrá ordenar desde Work «KIA, responde este correo», «ejecuta esta tarea» o «prepara la presentación». KIA identificará el expediente autorizado, consultará su estado, ejecutará dentro del permiso recibido, registrará evidencia y actualizará tareas y siguiente paso sin exigir que Ksenia duplique el trabajo en Admin.

Work es una superficie de trabajo de KIA; EXPERT conserva el estado canónico. Copiloto, correo y Telegram comparten expediente y conversación, pero no permisos: una instrucción del cliente no otorga autoridad profesional. KIA se identifica como asistente IA, habla en femenino y no suplanta a Ksenia ni firma jurídicamente en su nombre.

«Presenta ya la solicitud» debe resolverse contra una acción concreta y su versión. No autoriza cambios posteriores de datos, nuevos cargos ni futuras presentaciones. Para la operativa acordada de extranjería/nacionalidad se usa Chrome; identificación con certificado, firma, pago y presentación final requieren detenerse y ceder el control a la representante. Tras su intervención, KIA puede verificar el resultado y registrar el hito automáticamente. El registro de una presentación ya comprobada no equivale a ejecutar la presentación.

## 2. Últimas piezas verificadas en main

Revisión de código sobre `f6023d36` (24/09/2026). «Existe código» no implica activación ni prueba completa en producción.

| Pieza | Evidencia del repositorio | Consecuencia |
|---|---|---|
| Conversaciones y tokens | `lib/ai/kia/kia-context-token.ts`; migración `20260923063614_kia_contextual_conversations.sql` | Reutilizar persistencia y autorización; no crear otra memoria paralela de Work. |
| CTA de correo | `lib/email/kia-contextual-cta.ts`, integrado en `lib/email/send.ts` | Ya existe, condicionado a flag y metadata; verificar cada vía de envío. |
| Acciones administrativas | `lib/ai/kia/kia-administrative-action.ts`, `kia-administrative-action-service.ts`, `kia-administrative-approval-service.ts` | Reutilizar estados, snapshot de aprobación, versión de fila y correlación. |
| Telegram | `app/api/webhooks/telegram/route.ts`, `lib/ai/kia/kia-telegram-linking.ts` | Conservar identidad vinculada y política por canal; no presumir completado el recorrido contextual. |
| Personalidad y contenido | `lib/ai/kia/prompts/kia-core-policy.ts`, PR #428, merge `38b5da8c` | Contexto real antes de afirmar que existe expediente; recursos pertinentes, sin spam editorial. |
| Documentos y proveedores | `6542a642`, `5a72f396` | Supabase es canónico; Drive/OneDrive/SharePoint son copias. Conexión y activación se comprueban por separado. |
| Calendario e identidad cliente/entidad | `fca0cfa7`, `baa083c1`, `7f27fbb2`, `f6023d36` | Reutilizar proveedores y ámbito personal/empresa, sin exigir una empresa ficticia. |

Se revisaron las decisiones recientes de las conversaciones «Mejorar respuesta de KIA» y «Capas Google Microsoft en EXPERT». Los PR abiertos no se consideran publicados. La documentación contextual del 22/09 conserva una checklist histórica con piezas que ya tienen código; esta matriz actualiza únicamente lo verificado, no certifica todo el rollout.

La base visual del email ya está en `lib/email/templates.ts`. Se encontró identidad/firma de KIA en los canales conversacionales; **no se ha acreditado una firma de correo KIA única aplicada a todos los proveedores**. Inventariar plantillas y configuración de buzón antes de crear una variante; reutilizar la existente cuando se encuentre y evitar doble firma.

## 3. Enlace Work → EXPERT

Decisión: un adaptador autenticado (herramienta MCP/API de EXPERT) recibe resultados explícitos de Work. El mismo servicio acepta eventos normalizados de proveedores. No se da por existente un webhook nativo de fin de tarea de la aplicación Work.

Herramientas propuestas, todavía no implementadas:

- `get_case_work_context`: expediente, tareas, autorizaciones, versiones, documentos y últimas comunicaciones permitidas.
- `claim_case_task`: reserva temporal de una tarea elegible y devuelve versión, condiciones y evidencia requerida.
- `report_case_task_result`: comunica resultado y referencias; el servidor verifica antes de cerrar.
- `get_case_task_result`: consulta por identificador de operación para resolver timeouts sin repetir efectos.
- `release_or_block_case_task`: libera reserva o registra bloqueo con causa y siguiente responsable.

El conector usa identidad profesional delegada, permisos mínimos por acción y expediente, credenciales almacenadas fuera del prompt y revocación. No entrega una service-role key al modelo ni autoriza a escribir arbitrariamente tablas. No usa búsquedas sobre todos los chats personales como mecanismo de sincronización.

Un resultado de modelo finalizado solo acredita que terminó esa ejecución, no que se envió un correo, se pagó una tasa o se presentó un expediente. Los [webhooks de OpenAI API](https://developers.openai.com/api/docs/guides/webhooks) pueden servir en una ejecución API propia; no prueban que el turno de Work emita esos eventos. La integración concreta de Work debe validarse en su entorno antes del piloto.

## 4. Contrato propuesto de eventos

Endpoint lógico propuesto: `POST /api/integrations/work/events` (no existe por esta documentación). Todos los campos se validan en servidor. Los identificadores son referencias internas; no se incluyen datos personales ni documentos en el evento.

```json
{
  "schema_version": 1,
  "event_id": "evt_example_001",
  "event_type": "task.result_reported",
  "occurred_at": "2026-09-24T10:00:00Z",
  "source": "work_connector",
  "run_id": "run_example_001",
  "correlation_id": "operation_example_001",
  "case_id": "<authorized-case-id>",
  "task_id": "<claimed-task-id>",
  "action_id": "<administrative-action-id>",
  "expected_version": 7,
  "reported_result": "succeeded",
  "evidence_refs": [
    { "type": "email_message", "provider": "gmail", "id": "<message-id>" }
  ]
}
```

`reported_result`: `succeeded`, `blocked`, `failed` o `cancelled`. `received_at`, actor, cliente, tenant y empresa los resuelve el servidor desde la credencial y las relaciones; no confía en los campos declarados por el emisor. `company_id = null` es válido para expediente personal. Un tenant ausente en un registro legacy no significa permiso global: resolver contexto autorizado o bloquear hasta corregir el ámbito, sin inventar tenant.

Recepción: comprobar autenticidad sobre cuerpo original, fecha/ventana de replay y esquema; insertar en una bandeja persistente con unicidad `(source, event_id)` antes del acuse. Reenvío idéntico devuelve el resultado ya conocido; mismo ID con contenido distinto se rechaza. Cada proveedor usa su propia verificación oficial; no reutilizar la firma HMAC de Meta para OpenAI, Telegram o Work.

Procesamiento: verificar pertenencia y reserva; consultar evidencia; aplicar transición con comparación de versión. En una transacción guardar evento aplicado, cierre de tarea, cambio permitido de expediente y mensajes pendientes de salida. Conflicto de versión exige releer, no sobrescribir. Responder `202` significa recibido, no completado; el adaptador consulta hasta resultado persistido. Fallos de autenticación no se reintentan como efectos de negocio.

Una cola persistente procesa reintentos con backoff, límite y cola de incidencias. La reserva caduca si Work se interrumpe, sin marcar completada la tarea. La reconciliación periódica consulta operaciones inciertas antes de repetir envío/cargo/presentación. Mismo efecto de negocio tiene clave única aunque llegue por Work y webhook a la vez. Objetivo: efectos idempotentes con entrega repetible, no promesa de entrega «exactamente una vez».

## 5. Evidencia, cierre y siguiente paso

| Tarea | Evidencia suficiente para cerrar | Lo que no la cierra |
|---|---|---|
| Archivar documento | Objeto privado legible, huella, dueño y expediente correctos; registro de origen | Archivo solo en Descargas o enlace temporal caducable |
| Enviar correo | ID del proveedor y confirmación de envío, destinatarios/hilo/adjuntos exactos, versión enviada | Borrador, texto generado o acuse de la cola |
| Obtener firmas | Versión correcta firmada por todos los requeridos y verificación del tipo de firma exigido | Sobre creado, email invitando a firmar o una firma de dos |
| Registrar tasa pagada | Justificante identificado con sujeto, concepto, importe, fecha y referencia | Pago de honorarios o visita a pasarela |
| Registrar presentación | Justificante oficial y referencia/fecha verificadas, vinculados a acción autorizada | Borrador guardado, PDF preparado, clic o frase «ya está» |
| Confirmar dato del cliente | Respuesta atribuida al interlocutor y alcance requeridos; acuerdo de ambos cuando aplique | Silencio, una inferencia o preferencia histórica sustituida |

Tras verificación, usar la máquina existente (`verifying → completed`); estados de `internal_tasks` se mantienen en español. Calcular siguientes tareas por el blueprint versionado del servicio y dependencias satisfechas. Encolar solo pasos ya autorizados; si corresponde respuesta del cliente, autenticación o aprobación, fijar ese pendiente sin volver a pedir documentos ya recibidos. No encadenar ciegamente todas las tareas.

Registrar quién realizó la acción: KIA, proveedor o persona. Una intervención manual verificada puede cerrar automáticamente la tarea con actor humano y verificador KIA. Las rectificaciones no borran el historial: sustituyen evidencia vigente, invalidan aprobaciones de versiones anteriores y reabren tareas dependientes que ya no sean válidas.

Un trigger de base de datos puede insertar un evento en la cola transaccional; no debe llamar al modelo ni hacer envíos externos dentro de la transacción. El cierre automático no depende del texto de un chat ni de un trigger sobre cualquier actualización de `internal_tasks`.

## 6. Documentos y expediente personal

Cada archivo debe conservar fecha del documento, fecha real de recepción (si consta), fecha de archivado, canal, remitente, proveedor, mensaje/hilo y adjunto originales, ID estable del archivo, huella y relación original/copia preparada. Fechas desconocidas permanecen desconocidas. Nunca sustituir fecha de recepción por fecha de Drive o del importador.

El cliente consulta copias autorizadas y enlaces de descarga temporales generados al solicitarlos. Los IDs estables se guardan; las URLs firmadas no son referencias permanentes. Los originales grandes permanecen preservados, con ubicación recuperable y relación con copias optimizadas. Un espejo fallido no borra el archivo canónico.

Hallazgos del piloto que debe resolver la implementación: `email_attachment_documents` exige empresa aunque existan expedientes personales; los documentos solo enlazados a Drive pueden carecer de `file_path` descargable; el checklist usa claves derivadas de etiquetas. Diseñar procedencia personal y claves estables antes de generalizar, con migración y compatibilidad; no asociar empresa ficticia ni alterar esquemas en esta entrega.

## 7. Correo firmado por KIA y continuidad

Reutilizar diseño EXPERT y firma existente validada. Firma objetivo: **«KIA · Asistente IA de EXPERT»**, `info@expertconsulting.es`; en ruso **«KIA · ИИ-ассистентка EXPERT»**. La firma de correo es identidad comunicativa, no firma electrónica. No añadir firma de Ksenia ni afirmar revisión humana sin evidencia. Remitente visible KIA · EXPERT solo desde un buzón autorizado; distinguir remitente técnico, Reply-To y autor registrado.

Tono alegre, cercano y preciso; 1–2 emojis pertinentes (😊, 📄, ✅), adaptados al idioma. Evitar celebración ante errores o un resultado aún no confirmado. Estructura: saludo por nombre, hecho comprobado, siguiente paso con responsable, CTA y firma. No afirmar conocimiento de un expediente si no está verificado; no llenar cada correo de recomendaciones comerciales.

Objetivo de producto: **cada correo operativo de expediente incorpora un único CTA contextual** «💬 Hablar con KIA sobre mi expediente» / «💬 Обсудить моё дело с KIA». Usar `/kia/c/<token-opaco>` existente, ligado a destinatario, expediente, tarea y origen. El enlace exige login/identidad, revalida acceso y consulta el estado actual. No incluir NIE, email, nombre, case_id ni credenciales en la URL del CTA. Para varios destinatarios, emitir copias con contexto individual o resolver permisos compartidos explícitos; nunca reutilizar el token de un cliente para otro.

Actualmente el helper exige `KIA_CONTEXTUAL_EMAIL_CTA_ENABLED=true` y `metadata.kia_contextual_cta=true`, además de `profile_id`/equivalente y ámbito validado. No cambiar flags en esta entrega. Antes de habilitar cobertura universal, comprobar Resend, cola, respuestas Gmail/Graph y envíos desde Work: pasar por el mismo compositor o registrar explícitamente por qué el CTA no pudo generarse. Nunca fabricar un token ni enviar un enlace roto. Correo sin expediente usa tema genérico seguro, sin fingir expediente. Mensajes esenciales no quedan bloqueados por un fallo del CTA: incluir acceso autenticado al panel y crear incidencia de cobertura.

Responder por email conserva el hilo nativo: cuenta + thread/conversation ID, `Message-ID`, `In-Reply-To` y `References` según proveedor. No basta conservar asunto. Guardar destinatarios, adjuntos, ID externo, versión, estado enviado y relación con `kia_conversations`/expediente. Si se confirma envío y falla el registro local, reconciliar por ID antes de reenviar. El envío autorizado explícitamente no necesita una segunda autorización idéntica; uno nuevo no se deduce de archivar documentos.

Entrada: usar referencias del proveedor y validar identidad/participantes; no asociar por nombre o asunto solamente. Ambigüedad entre expedientes → revisión sin exponer datos. Adjuntos → archivo y procedencia; mensaje → conversación; dato confirmado → tarea correspondiente; KIA vuelve a consultar el estado antes de responder. Respuestas automáticas, bounces y mensajes propios no provocan bucles. El correo reenviado o sus instrucciones no son una autorización para ejecutar acciones.

## 8. Copiloto y Telegram

Reutilizar `kia_conversations` y `kia_conversation_messages`; mostrar historial autorizado y eventos del expediente, no prompts internos ni notas profesionales. Mantener contexto activo por identidad/canal y expediente; cambiarlo expresamente cuando existan varios. KIA no promete recordar información no disponible en EXPERT.

Telegram usa identidad previamente vinculada y verificada. El enlace propuesto `https://t.me/<bot>?start=ctx_<token>` debe respetar [el límite oficial de 64 caracteres](https://core.telegram.org/bots/features#deep-linking) y nunca sustituye la autenticación. Sin vinculación, completar primero el enlace seguro de identidad y volver a validar; token expirado/revocado o de otro cliente no revela el expediente. Deduplicar `update_id` persistentemente, registrar mensajes entrantes/salientes y evitar doble respuesta entre canales.

Notificaciones solo por canales consentidos; agrupar cambios de una misma operación para no enviar tres avisos. Respetar pausas y horario configurado. Una preferencia de tono o canal no autoriza difundir documentos a grupos ni a otra identidad Telegram. No reactivar seguimientos pausados al importar historial.

## 9. Plan de implementación y aceptación

1. **Contrato y ámbito:** inventario real de firma/CTA/proveedores; compatibilidad de tenant y expediente personal; catálogo de tareas y evidencia. Entrega: diseño revisado y fixtures sintéticos.
2. **Adaptador Work:** autenticación, herramientas, recepción persistente, deduplicación, reserva y consulta de resultado. Entrega: tarea de archivo completada sin edición manual de Admin, con hash y auditoría.
3. **Motor de continuidad:** transacción, verificación, dependencias y cola de salida; recuperación tras fallo. Entrega: avanzar solo pasos autorizados sin duplicados.
4. **Correo:** firma única, CTA y respuesta en hilo para cada proveedor utilizado. Entrega: ida/vuelta correo → expediente → copiloto con contexto actualizado y adjuntos recuperables.
5. **Telegram:** vínculo seguro, token contextual y ledger de actualizaciones. Entrega: mismo tema en otro canal, permisos revalidados y sin mensajes duplicados.
6. **Piloto y ampliación:** casos personales y de empresa; medir latencia, reintentos, pendientes e intervención manual. Probar concurrencia 25/50/100 con datos sintéticos antes de prometer volumen.

Casos obligatorios de aceptación:

- Resultado repetido o llegado por dos canales: un cierre, un siguiente paso y como máximo una comunicación autorizada.
- Worker interrumpido después del envío: recuperar ID, no reenviar.
- Archivo recibido pero no validado: no marcar requisito jurídico satisfecho.
- Cambio de documento tras aprobación: invalidar aprobación; no usar la versión antigua.
- Pago de honorarios: no cerrar tarea de tasa; tasa pagada: no volver a cobrar.
- Work finaliza conversación sin evidencia: tarea sigue pendiente/verificando.
- Expediente personal con empresa nula y aislamiento de cliente/tenant: funciona sin empresa ficticia; otro cliente no accede.
- Email con CTA reenviado, caducado o manipulado: no filtración; recuperación mediante login seguro.
- Madre/padre o varios representantes: comprobar acuerdo/firma requeridos, no inferir consentimiento compartido.
- Presentación final: intervención humana, recibo verificado y registro automático; sin recibo, no presentado.
- Importación histórica: sin email nuevo, sin reactivar monitor pausado y sin alterar fechas reales.
- Apagado del conector: detener nuevas ejecuciones; preservar cola/evidencia y permitir control manual.

Métricas: retraso evento→estado visible; tareas bloqueadas y motivo; conflictos de versión; efectos duplicados (objetivo 0); fallos de firma/autorización; porcentaje de correos con CTA válido; procedencia documental completa; descargas autorizadas; operaciones inciertas y antigüedad; horas de intervención manual. Registrar IDs y estados, no cuerpos privados ni tokens en logs generales.

## 10. Resultado esperado del piloto

Ksenia ordena una tarea una vez. Work registra el resultado por el adaptador, EXPERT verifica y actualiza su estado, KIA explica al cliente el siguiente paso con su identidad y enlace contextual. Las acciones que requieran control humano quedan listas para ese control; después se documentan automáticamente. La finalización técnica de una ejecución nunca se confunde con el resultado administrativo.
