# KIA — protocolo automatizado de cierre de reuniones (propuesta QA v1)
Fecha: 2026-10-14. Extensión independiente de issue #774.

## Evento disparador y seguridad
Usar `meeting.notes_ready` para Google Meet/Gemini. La recepción de un archivo de notas dispara un job duradero por `provider:meeting_id:notes_version`, no por cada correo duplicado. Descargar notas mediante cuenta autorizada; reconocer organizador, asistentes y empresa de manera fiable; una persona puede tener dos entidades (autónomo y SL). Si el match es ambiguo, pasar a revisión, no atribuir a la entidad equivocada.

## Procesamiento
1. Leer notas, transcripción, historial cliente/empresa, correos recientes, calendario, `client_registry_instructions` vigentes y obligaciones fiscales. Marcar cada afirmación `verified / stated / inferred / disputed / superseded` con fuente, cita y fecha.
2. Extraer decisiones, tareas (responsable, vencimiento, dependencia), acuerdos anulados, compromisos, dudas, documentos, avisos normativos, nuevas reuniones y oportunidades KB/artículo. Nunca inferir CNAE/IAE desde tema de reunión ni desde partidas contables.
3. Proponer cambios de fichas y hoja registral con previsualización. Escrituras internas seguras solo con política y scope correctos: `client_registry_events` append-only `source_key` idempotente, hechos y correcciones con provenance, snapshots mediante flujo canónico; `cases.next_action`, `internal_tasks` deduplicadas y fechadas con zona. No reabrir onboarding terminado ni tomar notas automáticas como prueba de ejecución.
4. Empresa/censo: comprobar IAE y CNAE en 036/037 y documentación oficial/censal; conservar sin cambios o `pendiente_verificacion` si fuente ausente. Datos publicables limitados a información empresarial no sensible autorizada. NO publicar CIF/NIF persona, facturas, modelos, reunión, correo, teléfono personal, acuerdos confidenciales.
5. Vincular Google Calendar: verificar que exista la próxima cita, bloquear horario, no crear duplicado; Google Meet es canal único. Adjuntar enlace a agenda editable/presentación y temario a descripción del evento; compartir enlace por correo solo tras aprobación humana. Comprobar permisos y visibilidad del documento.
6. Generar documentos de preparación (resumen pasado, pendientes, riesgos, agenda con minutos estimados, diapositivas listas para compartir en Meet) y borradores correo cliente/admin, con referencia a evidencia. Envíos externos, presentación de impuestos, cambios contables y alta de nuevas reuniones con invitados requieren gate de aprobación y lectura posterior.
7. KIA internaliza correcciones (fiscal/QA y comunicación) sin entrenar automáticamente desde la transcripción. Solo KB interna tras validación, blog/FAQ/SEO ES/RU por circuito editorial separado.
8. Auditor: comprobaciones contra duplicidades, fuga entre entidades, error de fecha/hora, lecturas de Holded desactualizadas, cambios contra instrucciones vigentes; reintentos idempotentes. Notificar administrador solo novedades accionables en resumen push.

## QA / aceptación
- M1: Gemini recomienda mover facturas; correo posterior revoca acuerdo -> ninguna tarea ni alteración Holded y el criterio posterior prevalece.
- M2: modelo 303 «presentado» sin recibo -> tarea obtener CSV, sin re-presentación.
- M3: notas sin CNAE/IAE -> no inventar; crear tarea de obtención de modelo 036 vigente.
- M4: cita externa Teams coexistente con Google Meet -> enlace único a cliente, registrar cancelación pendiente, no crear tercera cita.
- M5: notas duplicadas/corrección -> mismo `source_key` y versiones, sin multiplicar tareas.
- M6: meeting.notes_ready de autónomo y SL del mismo cliente -> hojas registrales separadas y fuentes exactas.
- M7: agenda con documento: verificar Drive ACL y fecha correcta; no filtrar datos a cualquier asistente.
- M8: trabajo administrativo finaliza sólo con readback; procesado no equivale a enviado/publicado/presentado.
- M9: IVA previo constitución, factura con número PROFORMA, criterios legales -> flags QA, no deducción automática.
- M10: citas futuras: la confirmación del cliente no equivale a aceptación en Google Calendar y se registra como pendiente.

## Caso piloto: 14/10/2026
A) Josep persona física, NIF solo en backend, 303 632,52 EUR marcado presentado por reunión pero justificante AEAT no verificado; revisión de ROI personal y 130 según censo. El día de la sesión se comentó la conexión Stripe/Holded y facturas OpenAI y un equipo móvil: son puntos de seguimiento, NO hechos confirmados como concluidos.
B) SIGMAKNOT sociedad, 303 977,86 EUR a compensar provisional; 111 292,80 EUR; 349 Google 16,61 EUR base. Documento EDAR 84,70 EUR con casilla número PROFORMA: requiere factura definitiva numerada. Comprobación gastos preconstitución C-280/10 y capitalización paro vs capital, sin modificar Holded.
C) Autonomo y sociedad: la reunión 15/10/2026 11:30–12:30 es Google Meet `4292qev4ostl7qseu3r9lk5ct0`; temario a pantalla compartida: `https://drive.google.com/file/d/1yA1HNg60QcTSR9s0UhSGcBPWcMAJcfHb/view`; descripción calendar ya actualizada.
D) Fichas públicas empresariales: actividad genérica por evidencias, código CNAE e IAE ausentes en acta y censo no verificado, no autocompletar.

## Implementación por PR
P0: plan y piloto manual documentado.
P1: listener Google notes_ready + tracker/locks + acciones propuestas y readback.
P2: ledger/facts/cases/tasks/agenda+presentación/lead followup con gate.
P3: tests E2E con fixtures anonimizados, evaluador QA, telemetría.
P4: contenido KB, FAQ y blog (SEO ES, ruso automático solo tras QA).

Pendiente: implementación real del webhook/orquestador y permisos de Google Drive adjuntos nativos; no afirmar automatización viva hasta CI, despliegue y E2E aprobado.

## Decisión de dirección 14/10: NO convertir notas en tareas definitivas
- Toda cuestión debatible queda `pendiente_revision`, aun cuando el profesional la expresó con seguridad. Las notas NO son una autorización de ejecución.
- Clasificar `hecho_verificado`, `acuerdo_ratificado`, `pendiente_revision`, `revocado`. El resumen automático no constituye evidencia externa.
- Para `pendiente_revision`: pregunta, segmento de notas, motivo de incertidumbre, fuente oficial a consultar, responsable de contraste, fecha solo si conocida, y enlace a próxima reunión.
- KIA no ejecuta modificaciones de Holded, AEAT, correos ni crea compromisos con cliente antes de revisión humana. Tampoco interpreta una duda como tarea acordada.
- Si llega corrección posterior, prevalece sobre el acta y el registro histórico queda trazable.
- QA tests: afirmación categórica sin norma verificada => `pendiente_revision`; propuesta de mover factura revocada => no tarea de mover; pregunta debatida sin responsable => no asignar arbitrariamente; reunión con certeza falsa => abrir verificación normativa, no repetir respuesta.
- Lección operativa creada en `kia_operator_lessons`: `meeting_notes_uncertainty_review_first_20261014`, prioridad 100.
