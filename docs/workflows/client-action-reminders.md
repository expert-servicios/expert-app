# Recordatorios de acciones y firmas de clientes

Última revisión: 22/09/2026.

## Objetivo

Evitar que un expediente quede bloqueado porque el cliente no firma, no concede una representación, no aporta un documento o no confirma una actuación necesaria.

## Política estándar

Toda tarea del blueprint que tenga `clientActionRequired=true` puede activar recordatorios automáticos.

Cadencia estándar:
- **1 día laborable** desde el inicio de la espera: primer recordatorio.
- **3 días laborables**: segundo recordatorio.
- **5 días laborables**: tercer recordatorio.
- **5 días laborables**: además, escalado interno de la tarea a prioridad crítica y creación de una tarea de seguimiento manual.

El reloj de recordatorios empieza cuando la tarea pasa a `en_progreso`, no cuando se crea el expediente.

Los recordatorios:
- se envían en el idioma preferido guardado en `profiles.preferred_language`;
- se registran en metadata para evitar duplicados;
- utilizan la cola de correo duradera de EXPERT/Resend;
- no se envían después de que la tarea quede completada o cancelada.

## Casos incluidos

La política debe aplicarse, entre otros, a:
- mandato/poder de representación voluntaria;
- modelo oficial que requiere firma del cliente o representantes legales;
- apoderamiento o actuación del cliente en Apoder@/REA;
- autorizaciones o consentimientos necesarios;
- documentos contractuales del servicio;
- cualquier otro paso de blueprint marcado como acción obligatoria del cliente.

## Nacionalidad de menores

Para nacionalidad de menor nacido en España:
1. mandato de representación voluntaria;
2. modelo oficial de solicitud firmado por los progenitores;
3. cualquier subsanación posterior que requiera firma.

Ambas fases 1 y 2 llevan cadencia 1/3/5 días laborables.

## Extranjería

Cuando el procedimiento requiera apoderamiento:
- la tarea de representación se marca como `clientActionRequired`;
- se recuerda al cliente completar Apoder@/REA o la actuación equivalente;
- si no dispone de certificado digital, el flujo puede derivar al servicio de certificado digital de persona física;
- tras el tercer recordatorio se crea seguimiento interno.

## Admin

Cada tarea debe mostrar:
- acción esperada del cliente;
- fecha/hora de inicio;
- recordatorios enviados;
- próxima fecha de recordatorio;
- escalado interno;
- estado de finalización.

## Cron

Endpoint:
`/api/cron/client-action-reminders`

Ejecución diaria.

El cron:
1. carga tareas abiertas con `client_action_required=true`;
2. calcula días laborables transcurridos en `Europe/Madrid`;
3. envía recordatorios pendientes;
4. reclama el tier antes de encolar el correo para evitar duplicados;
5. escala internamente cuando se alcanza el umbral.

## Regla de seguridad

Un recordatorio nunca debe:
- afirmar que un documento está sin firmar si el sistema ya registra su firma;
- reenviar datos sensibles completos innecesariamente;
- volver a pedir una actuación ya completada;
- cambiar el estado jurídico del expediente sin aprobación profesional cuando esta sea exigible.
