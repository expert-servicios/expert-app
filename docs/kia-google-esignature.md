# Google eSignature — ciclo operativo KIA

## Alcance

KIA integra la firma como un **workflow auditable de expediente**. No ejecuta de forma autónoma el envío a Google eSignature.

### Herramientas

- `get_case_signature_status`: lectura del estado de firma para un expediente autorizado.
- `prepare_signature_request`: Admin/Owner prepara la solicitud y la deja en `needs_review`. No envía nada a Google.

## Evidencia

El documento origen nunca cuenta como documento firmado.

Una firma solo se considera completada cuando:

1. la acción administrativa alcanza `completed`;
2. existe un evento `signature.completed`;
3. ese evento contiene `finalDocumentId`;
4. el documento final pertenece al mismo expediente;
5. no está rechazado ni sustituido;
6. existe una copia accesible en Storage o Drive.

La URL que KIA puede ofrecer es siempre la ruta autenticada:
`/api/documents/{id}/download?redirect=1`.

## Lifecycle

`draft → prepared → needs_review → approved → queued → claimed → running → verifying → completed`

Hitos de dominio:

- `signature.prepared`
- `signature.review_required`
- `signature.requested`
- `signature.partially_signed`
- `signature.verifying`
- `signature.completed`
- `signature.cancelled`

Los estados por firmante son `pending | signed | declined`.

## Reintentos

Una solicitud activa idéntica es idempotente. Una solicitud cancelada, expirada o fallida no bloquea un nuevo intento: el nuevo intento recibe una clave de idempotencia distinta y conserva el histórico anterior.

## Superficie Admin

El detalle del expediente incluye `CaseSignaturePanel`.

El operador puede:

- marcar la solicitud como enviada a firma;
- registrar el estado individual de firmantes;
- seleccionar el documento firmado final;
- finalizar la firma;
- cancelar la solicitud antes de verificación.

La finalización se bloquea si no existe un documento final válido y accesible.

## Seguridad

- preparación: Admin/Owner;
- actualización lifecycle: Admin/Owner;
- el servidor valida `caseId + actionId`;
- KIA staff autoriza expediente por `tenant_id`;
- KIA cliente autoriza por `client_id`;
- ninguna mutación de firma se ejecuta desde navegador sin autenticación staff;
- el sistema no almacena una supuesta firma en metadata libre del documento.
