# KIA + Google eSignature — firma documental en EXPERT

Última revisión: 2026-09-29.

## Objetivo

Reducir dependencia de DocuSign utilizando Google Workspace eSignature cuando el nivel jurídico de firma requerido lo permita, manteniendo EXPERT/Supabase como fuente canónica del expediente y Google Drive como almacenamiento/copia operativa.

## Qué soporta Google eSignature

Google Workspace eSignature permite preparar PDFs o Google Docs, añadir hasta 10 firmantes, campos de firma/iniciales/texto/fecha, enviar solicitudes, recordatorios automáticos y consultar el estado desde Drive.

Al completar la firma:
- Google genera un PDF final;
- el solicitante conserva la copia final en la carpeta del documento original o en Mi unidad según permisos;
- los firmantes reciben su propia copia;
- el PDF final incluye una página de registro de auditoría con eventos y marcas de tiempo, además de nombre/email del solicitante y firmantes.

Fuente oficial:
- https://support.google.com/drive/answer/12315692?hl=es

## Limitación de automatización

La integración Drive/Docs disponible para EXPERT permite crear, mover, leer y sincronizar archivos, pero no expone actualmente una acción API soportada para iniciar una solicitud Google eSignature.

Por tanto:

- KIA puede preparar el documento y el contexto de firma;
- KIA puede decir quién debe firmar y con qué nivel de firma;
- KIA puede consultar el estado persistido del expediente;
- KIA puede ofrecer el documento firmado mediante enlace seguro cuando exista;
- KIA puede crear/escalar la tarea para que una persona pulse «Solicitar firma» en Google Drive;
- KIA NO puede afirmar que la solicitud fue enviada hasta que exista evidencia persistida del envío;
- el clic «Solicitar firma» en Drive sigue siendo acción humana.

## Niveles de firma

### Firma electrónica simple / trazable

Google eSignature es una alternativa preferente a DocuSign para:
- mandatos de representación;
- autorizaciones;
- aceptaciones;
- contratos y documentos internos que no exijan certificado electrónico reconocido;
- documentos para los que sea suficiente firma electrónica simple con evidencia y trazabilidad.

El PDF final con auditoría debe archivarse como documento firmado.

### Firma con certificado reconocido

Google eSignature NO se trata como equivalente a una firma con certificado electrónico reconocido cuando la normativa o la sede exigen ese nivel.

Para estos casos:
- certificado digital reconocido;
- AutoFirma;
- firma desde la propia sede;
- u otro mecanismo específicamente admitido.

KIA debe consultar el blueprint/requisito jurídico y no elegir el nivel de firma por conveniencia.

## Fuente de verdad

- EXPERT/Supabase: expediente, tareas, estados, documento canónico y permisos.
- Google Drive: espejo/copia operativa y superficie de eSignature.
- No inferir «firmado» solo porque exista un archivo en Drive.
- La finalización se acredita con documento final y/o metadata persistida del flujo.

## Estados operativos recomendados

En `internal_tasks.metadata`:

```json
{
  "signature_provider": "google_esignature",
  "signature_level": "simple",
  "signature_status": "prepared | requested | partially_signed | completed | cancelled | failed",
  "signature_requested_at": null,
  "signature_completed_at": null,
  "signature_source_document_id": null,
  "signature_final_document_id": null,
  "human_approval_required": true
}
```

No hace falta DDL para el piloto.

## Capacidades KIA

KIA usa `get_case_signature_status` antes de responder preguntas como:
- «¿Ya está firmado?»
- «¿Quién falta por firmar?»
- «Descargar documento firmado»
- «¿Ya enviaron la firma?»
- «Mandato firmado»
- equivalentes ES/RU.

KIA puede devolver:
- tareas de firma;
- estado persistido;
- documentos firmados;
- enlace seguro de descarga desde EXPERT;
- enlace al expediente/documentos.

KIA no debe exponer `drive_file_id` ni URLs internas no autorizadas.

## Flujo recomendado

1. EXPERT genera o recibe el documento canónico.
2. Se archiva en expediente y se sincroniza a Drive.
3. KIA identifica firmantes y nivel de firma requerido.
4. KIA prepara/escalada tarea «Solicitar firma en Google».
5. Humano abre el PDF/Doc de Drive y pulsa eSignature → Solicitar firma.
6. Se persiste `signature_status=requested` + fecha + firmantes.
7. Google envía notificaciones y recordatorios.
8. Al completarse, se obtiene el PDF final con auditoría.
9. EXPERT archiva el PDF final y actualiza `signature_status=completed`.
10. KIA puede informar y ofrecer «Descargar documento firmado».

## Correo y Telegram

Si un cliente pregunta por firma:
- consultar estado real;
- no reenviar solicitud si está activa;
- si completada, ofrecer documento final;
- si pendiente de envío humano, explicar que EXPERT la está preparando y escalar internamente;
- si hay incidencia, pedir intervención solo cuando proceda.

## Migración desde DocuSign

No borrar ni reescribir evidencias históricas de DocuSign.

Para nuevas firmas:
- usar Google eSignature cuando el nivel jurídico sea suficiente;
- conservar DocuSign solo si existe una razón operativa concreta;
- usar certificado/AutoFirma cuando el nivel jurídico lo exija.

Los expedientes ya firmados por DocuSign conservan su sobre, documento final y certificado de finalización como evidencia histórica.

## Checklist para considerar el flujo listo

- [ ] documento canónico registrado en EXPERT;
- [ ] copia Drive accesible al operador;
- [ ] firmantes y orden definidos;
- [ ] nivel de firma jurídico definido;
- [ ] tarea de firma con metadata;
- [ ] solicitud lanzada manualmente en Drive;
- [ ] estado `requested` persistido;
- [ ] PDF final recibido;
- [ ] auditoría incluida o verificada;
- [ ] PDF final archivado en EXPERT;
- [ ] KIA ofrece descarga segura;
- [ ] tests de permisos impiden acceso cruzado.
