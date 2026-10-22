# KIA — protocolo de requerimientos oficiales y calidad de avisos
Fecha: 16/10/2026. Caso patrón: ALVILS ESP, S.L.U., expediente ATV TP/EH0324/2023/3369.
Este documento es un protocolo general; NO contiene datos privados, adjuntos ni textos de clientes.

## Detección multicanal
- Vigilar Gmail operativo y, **solo con conexión y permisos válidos**, Outlook Admin; no confundir la disponibilidad del conector ChatGPT con la conexión de la aplicación.
- Un cliente puede reenviar un requerimiento oficial: remitente humano NO implica baja prioridad.
- Buscar señales en español y ruso; también adjuntos y plazos. Distinguir recepción de correo, descarga de notificación y fecha jurídica de notificación; nunca asumir vencimiento.
- Enlazar por identificadores verificados contacto → empresa → expediente. Si existe ambigüedad, intervención humana. No inventar expediente ni representación.
- Avisar en Push/Telegram de requerimientos auténticos una sola vez, con remitente, empresa, materia, plazo verificado o «pendiente de verificar» y enlace directo.
- Mensajes de promociones, SPAM y avisos rutinarios CI/GitHub → clasificación y resumen, no Push inmediato. Las alertas de seguridad/cambios de permisos del proveedor sí son relevantes.

## Procedimiento documental (ejemplo ALVILS)
1. Leer íntegro correo y notificación adjunta; extraer órgano, identificación, acto, petición documental, fecha de puesta a disposición, acceso efectivo y plazo real si verificable.
2. Buscar primero el expediente y documentación existente en Drive y comunicaciones Gmail/Outlook: escritura, contrato, facturas, libros, declaraciones y acreditaciones; documentar procedencia y distinguir «localizado» de «incorporado a carpeta».
3. Delimitar el argumento jurídico correcto sin confundir propiedad/arrendamiento del local con explotación hotelera del arrendatario.
4. Verificar fuentes oficiales vigentes y que correspondan al devengo; clasificar evidencia probada, pendiente o inconsistente. Nunca atribuir a un documento no revisado una afirmación verificada.
5. Generar un borrador editable de alegaciones y un índice de documentos efectivamente disponibles; no afirmar que estén adjuntos o presentados antes de comprobarlo.
6. Revisar idioma, destinatario, hilo original y ausencia de repeticiones. Comunicar al remitente únicamente solicitud de revisión del borrador; no volver a pedir hechos o documentos ya facilitados.
7. Enviar el correo **únicamente** con autorización explícita de la administradora EXPERT, verificar adjunto y registrar entrega e historial.
8. Esperar conformidad del interlocutor; comprobar representante vigente, certificado digital correcto, documento final y anexos, registro de salida en sede y justificante. La presentación ante Administración requiere orden explícita y permiso específico, nunca una inferencia por recibir un «ok» del cliente.
9. Actualizar estado, tareas y plazo; evitar nuevos avisos si ya se ha respondido o presentado. Mantener justificante y enlace a expediente.

## Política de acciones
- Análisis y propuestas (lectura) autónomos dentro del contexto autorizado.
- Alertas de vencimiento real y revisión profesional prioritaria.
- Un correo jurídico no se autoenvía por el interruptor genérico de «correo seguro».
- Los expedientes fiscales requieren aprobación humana; envío y presentación se distinguen como autorizaciones independientes.
- Toda notificación externa tiene clave de deduplicación por proveedor + id mensaje + tipo evento.
- El contenido documental o tributario del cliente nunca se copia al repositorio, logs ni analítica.

## Hallazgos de producción 16/10/2026
- Se localizó el requerimiento de ALVILS en Outlook personal. El cron `kia-email-agent` solo inspecciona `email_inbox_cache` para `provider='gmail'`.
- `ms365_tokens` Admin carecía de conexión. No afirmar que KIA haya supervisado Outlook: requiere conexión y sincronización posterior.
- Gmail contaba con una cola considerable de no leídos y remitentes técnicos abundantes (GitHub).
- El cron `email-sync` notificaba por incremento bruto del contador de no leídos; la corrección propuesta usa clasificación + deduplicación por identificador de mensaje.
- El estado `ok` de heartbeat no garantiza que se hayan procesado correos relevantes si hubo 0 evaluados; instrumentar cobertura, retraso, tasa de omisiones y fallos reales por proveedor.
- Pendiente habilitar Outlook Admin, inventariar sus buzones/alias, sincronizar de forma incremental sin marcar como leído, añadir paridad de adjuntos/gestión documental, verificar tests E2E y desplegar. Hasta entonces NO marcar cobertura Outlook como completa.

## Casos de prueba
- Correo de Ilya «Запрос из Налоговой Валенсии по Алвилсу» → requerimiento crítico, alerta y revisión humana; no autoenviar respuesta ni presentar.
- Requerimiento oficial GVA/ATV y AEAT → crítico aunque no figure la palabra «urgente».
- Aviso GitHub PR / build rutinario → sin alerta instantánea.
- Publicidad/spam con «plazo» o «acción requerida» → silenciar, salvo señal de riesgo verificable.
- Proveedor con auténtica alerta de seguridad/pago → notificación.
- Repetición del mismo mensaje y reinicio cron → cero duplicados.
- 30 hilos técnicos antes del mensaje importante → el mensaje importante no debe quedar fuera del muestreo de inspección.
- En respuesta humana ya enviada, respetar historial y no enviar segunda respuesta.

## Activación Microsoft 365 Admin — bloqueo verificado 16/10/2026

La tabla `ms365_tokens` no tiene fila Admin y las variables `MS365_CLIENT_ID` / `MS365_CLIENT_SECRET` no están configuradas en el proyecto Vercel `app` consultado. El botón actual `/api/auth/ms365` no puede completar OAuth hasta registrar la aplicación en Microsoft Entra, configurar credenciales en el proyecto que sirve `/api/auth/ms365`, y autorizar la cuenta real de Outlook desde una sesión Admin. El ChatGPT connector no sustituye este consentimiento.

**Redirect URI** calculada actualmente por `absoluteAppUrl`: `https://expertconsulting.es/api/auth/ms365/callback` cuando `NEXT_PUBLIC_APP_URL` no existe. Verificar que la URL sirve realmente el callback en producción antes de registrar la URI; el dominio `expertconsulting.es` figura asociado al proyecto `ksenia-expert` y el proyecto `app` tiene otro dominio. No asumir que ambos comparten configuración. Tras el consentimiento, comprobar correo de `ms365_tokens`, leer mensajes, asegurar que KIA procesa provider `ms365` (actualmente el cron KIA solo procesa `gmail`) y ejecutar prueba de alerta controlada. No activar envío automático de escritos jurídicos ni presentar requerimientos.
