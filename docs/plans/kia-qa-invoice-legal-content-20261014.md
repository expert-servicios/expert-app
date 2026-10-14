# KIA QA — revisión documental, oportunidades jurídicas y contenido público
Estado: propuesta de implementación, aislada en rama; fecha: 2026-10-14.
Caso origen: Josep Sánchez (autónomo) / SIGMAKNOT SL. No incluir datos personales ni identificadores de cliente en tests, búsquedas públicas o blog.

## Objetivo
Detectar de forma proactiva anomalías documentales, riesgos en afirmaciones fiscales excesivamente categóricas, discrepancias entre hojas registrales y planes de acción, y oportunidades para crear artículos/FAQ/KB públicas revisadas por profesionales. Proponer, nunca ejecutar de oficio, modificaciones fiscales, contables o comunicaciones.

## Reglas QA v1
1. **Numeración de facturas**: si el campo número contiene PROFORMA, PRESUPUESTO u otra etiqueta no correlativa, marcar `DOC_INVOICE_NUMBER_MISSING` (severity high; comprobación humana). El encabezado «FACTURA» no sustituye el número. Art. 6 RD 1619/2012 exige número y en su caso serie, numeración correlativa. Pedir factura definitiva al emisor SIN sobrescribir el original, alterar fecha, NIF o contabilización automáticamente. «Proforma» por sí sola no es factura fiscal justificativa del IVA.
2. **Constitución de sociedad**: cuando factura fechada antes de constitución y dirigida a fundador, jamás aplicar `recipient_mismatch => IVA imposible`. Crear `PREINCORPORATION_EXPENSE_REVIEW`: comprobar naturaleza del servicio, destinatario económico, proyecto de sociedad, derecho de deducción, posible doble deducción, factura exigible, fecha de recepción y período, y tratamiento contable/IS separado del IVA. Referencia TJUE C-280/10 Polski Trawertyn, no generalizar.
3. **Capitalización de prestación**: distinguir aportación dineraria al capital social de gasto corriente deducible. Evidencia documental y afectación empresarial por cada operación; no inferir causalidad automática.
4. **Decisión más reciente**: si instrucciones aprobadas posteriores revocan propuesta anterior, usar la instrucción vigente, conservar procedencia y advertir contradicción. No dar tareas revocadas (p.ej. mover factura de sociedad al autónomo).
5. **Integridad Holded/AEAT**: lectura y contraste con datos actuales, confirmar permisos `permissions_enabled` versus `permissions_detected`; jamás crear movimientos para corregir sin aprobación. Modelo 303 presentado sin justificante: verificar CSV/AEAT, no repetir.
6. **Agenda y comunicación**: consultar calendarios, correo/hilo y provider; empresa usa Google Meet, no Teams ni Zoom para reuniones. No reservar duplicados. Verificar que el correo ya enviado no se reenvía. Distinguir reunión celebrada de tarea pendiente; presencia del evento no confirma asistencia.
7. **Detección contenidos**: sugerir KB/FAQ/SEO solamente tras evaluación de necesidad generalizable, sensibilidad/anónimo, fuentes oficiales y revisión legal y traducción ES/RU; no publicar automáticamente.

## Casos de prueba (fixtures anónimos)
- A1: documento con encabezado FACTURA y número `PROFORMA` por 84,70 EUR => warning numeración; no se registra deducción IVA ni modificación Holded.
- A2: factura en nombre fundador anterior a incorporación => revisión condicionada C-280/10, nunca rechazo ni deducción universal.
- A3: pago de capital social con prestación capitalizada => clasificación capital, no deducción automática.
- A4: transcripción sugiere mover facturas; instrucción posterior dice conservar => priorizar la nueva y alertar conflicto.
- A5: 303 marcado presentado sin CSV => tarea conseguir justificante, prohibición de presentar duplicado.
- A6: registros Holded activos, permisos concedidos y detectados no coinciden => comprobar con lectura real y no declarar desconectado.
- A7: cita Outlook/Teams y Google Meet duplicadas => confirmar canal Meet único para cliente, requerir permisos para cancelar Outlook.
- A8: correo contestado en hilo => sugerencia de respuesta breve contextual sin envíos repetidos.
- A9: contenido público sobre gastos de constitución => exigir citas oficiales y aprobación antes de publicar.
- A10: test multilingüe ES/RU FAQ con claves, importes y matices jurídicos preservados.

## Roadmap / plan nuevo
**P0 (detección y control)**: introducir reglas QA de factura formal + instrucción más reciente + duplicado de declaraciones; sacar métricas falsos positivos. Propietarios propuestos: QA/KIA, fiscal EXPERT; aprobación humana obligatoria.
**P1 (integración)**: lector PDF/XML de documentos, fuente, metadatos, puntuación, propuesta en ficha registral y alertas antes de CTA o presentación. Test de recuperación desde dos personalidades jurídicas sin fuga de contexto.
**P2 (conocimiento)**: fichas internas de C-280/10, requisitos art. 6 RD1619/2012, arts. 95/97 LIVA; crear versiones KB internas revisadas.
**P3 (web)**: propuestas de artículos blog y FAQ para constitución SL, certificados/facturación, diferencias factura-proforma-presupuesto, gastos anteriores a SL, fiscalidad IVA. FAQ Schema.org/JSON-LD sin prometer deducibilidad; autor, fecha normativa y fecha de revisión. Traducción automatizada ES/RU como rama separada pendiente de diseño y QA.
**P4 (retroalimentación)**: comprobar captura de oportunidades por KIA, tasa de respuesta adecuada, número de alertas útiles, duplicidades evitadas, capacidad de citar fuentes y regeneración tras cambios normativos.

## Publicaciones candidatas (propuestas, no publicadas)
1. «¿Puede una sociedad deducir gastos anteriores a su constitución?» (guía y FAQ).
2. «Factura proforma y factura definitiva: diferencias y requisitos de numeración».
3. «Capitalización del paro para crear una SL: aportaciones, gastos y documentación».
4. «Gastos de constitución de una SL: contabilidad, Impuesto sobre Sociedades e IVA».
Cada artículo debe diferenciar ejemplos de reglas generales y enlazar referencias BOE/Curia y AEAT actualizadas.

## Gates de aceptación
CI tests/TS/lint; fixture sin datos personales; revisión EXPERT; prueba real de consulta KIA con datos vigentes; enlaces válidos; validación ES/RU; rechazo de publicación o escrituras contables sin permiso; no fusionar automáticamente.

## Referencias
- https://www.boe.es/eli/es/rd/2012/11/30/1619/
- https://www.boe.es/buscar/act.php?id=BOE-A-1992-28740
- https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:62010CJ0280
