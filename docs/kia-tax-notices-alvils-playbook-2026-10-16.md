# KIA · Requerimientos y notificaciones relevantes (caso de aprendizaje, 16/10/2026)

## Ejemplo operativo anonimizado: fiscalidad inmobiliaria y AJD

Un representante de una sociedad compradora remite desde su correo habitual (Outlook) un requerimiento tributario autonómico referente a la aplicación del 2 % de AJD. El correo está en ruso, mientras que la escritura, facturas, modelos tributarios y comunicación con la administración están en español. Es una notificación **urgente aunque el emisor no sea el organismo público**, porque se reenvía por persona autorizada.

El procedimiento seguro fue:
1. Leer el **mensaje completo** y su hilo. Detectar organismo, número de expediente, fecha de descarga y plazo, sin fijar un vencimiento sin acreditar recepción/notificación.
2. Identificar empresa, representante, trámite, inmueble y vincular con expediente autorizado, sin inferir un expediente no confirmado.
3. Buscar primero documentación existente en carpetas y mensajes con adjuntos de Outlook/Gmail antes de pedir algo al remitente. Mantener registro de procedencia.
4. Leer el requerimiento y escritura íntegros. Extraer la renuncia a la exención del IVA en escritura, la inversión del sujeto pasivo, el alquiler sujeto al 21 % de IVA y la aplicación del AJD 2 %. **Distinguir el arrendador sujeto pasivo del IVA del operador hotelero**. No afirmar que existe un modelo 303 de 2023 si no se ha localizado.
5. Contrastar legislación vigente y fuentes oficiales; distinguir documentación localizada de la pendiente.
6. Preparar **borrador de alegaciones en español**, índice de anexos y borrador de correo en idioma preferido del interlocutor. No repetir hechos que la persona ya ha relatado.
7. Solicitar revisión de la administradora de EXPERT; redactar respuesta en el hilo con el borrador Word; efectuar el envío solo después de autorización expresa.
8. Esperar confirmación de la persona interesada; **no presentar alegaciones**, firmar electrónicamente, usar certificados digitales ni modificar datos tributarios sin aprobación humana y acreditación de representación.
9. Mantener tarea única de seguimiento, copia del correo original, borradores, justificantes y trazas; cuando se autorice la presentación, revisar plazo, representación y anexos, y guardar justificante de registro.

## Diagnóstico real de conectores y avisos (16/10/2026)

- El cron `/api/cron/email-sync` sincroniza Gmail operativo y usa antes un contador general `email_unread_count` para notificaciones de respaldo sin examinar relevancia de mensajes.
- El cron `/api/cron/kia-email-agent` **filtra `provider='gmail'`**; los mensajes Outlook no se procesan. En producción `ms365_tokens` administrativo no devolvió filas; no suponer que existe integración OAuth lista.
- Producción registra 3777 hilos en `email_inbox_cache`, 3743 marcados no leídos; último heartbeat de KIA: agente activo/OK, 30 omitidos, 0 evaluados; el estado saludable solo demuestra que el cron respondió, **no** que haya cobertura eficaz.
- Tráfico abundante de `github.com` y sistemas técnicos. Las actualizaciones rutinarias PR/CI no deben generar push individual; alertas de seguridad o incidencias críticas sí.
- La política nueva evita alertas por variaciones brutas del contador; muestra avisos solo de mensajes recientes y relevantes. No elimina ni marca mensajes, por lo que es reversible.

## Protocolo de escalado y permisos

| Categoría | Acción KIA | Push |
| --- | --- | --- |
| Requerimiento fiscal, embargo, notificación legal, plazo cierto, remitido por organismo **o reenviado por cliente** | Capturar, clasificar, extraer, preparar borrador y tarea, revisión humana obligatoria | Crítico |
| Persona conocida con nueva consulta normal | Contextualizar, preparar/responder según permisos | Solo si hay intervención |
| SPAM, newsletters y promociones | Registrar etiqueta; no responder, no crear tarea | Ninguno |
| GitHub PR/CI rutinario | Clasificar, consolidar resumen técnico | Ninguno |
| Suspensión real, acceso comprometido, alertas de seguridad, pago fallido | Escalado técnico/financiero con evidencia | Alto |
| Error de conexión de correo, KIA no saludable, cron sin cobertura | Aviso operativo agregado y deduplicado | Solo si afecta comunicaciones relevantes |

## Pendientes explícitos antes del despliegue completo

1. Conectar y validar Outlook administrado (`soy@kseniailicheva.com`) mediante autorización Microsoft 365 efectiva, con scopes mínimos y política de datos. No reutilizar tokens de clientes.
2. Añadir sincronización cron Outlook y procesador de hilos `ms365` **en modo análisis**, sin autoenvíos hasta pruebas.
3. Corregir starvation del límite de 30 inspecciones: priorizar mensajes nuevos y formales sobre hilos antiguos, cursor persistente y métricas `examined/eligible/backlog_by_provider`.
4. Cambiar indicador de salud: no declarar sistema OK por cron exitoso si 0 mensajes analizados y backlog reciente crece.
5. Probar push a Admin, Telegram y correo, con deduplicación y enlace al hilo correcto de Outlook/Gmail; no reenviar datos fiscales a canales no autorizados.
6. Añadir documental real: búsqueda Outlook, Google Drive, verificación PDF/escritura y fuentes oficiales; permisos de acceso por compañía; audit trail. No se considera automatizado simplemente por tener este runbook.
7. Pruebas unitarias, E2E, typecheck, lint, CI, despliegues app + ksenia-expert; no fusionar sin controles.

**Estado**: guía de entrenamiento y hardening inicial en PR, no flujo integral de presentación electrónica autónoma.


## Revisión documental adicional 16/10/2026 — inscripción turística y libro de inversiones
- Cuando el vendedor era operador de hostal, una resolución de inscripción turística anterior a la venta puede acreditar actividad previa; **NO** es equivalente al libro registro de bienes de inversión del vendedor, y se cita con su denominación exacta.
- Distinguir siempre: registro histórico del vendedor anterior a transmisión, registro de facturas recibidas y contabilidad del comprador, y libro de bienes de inversión del comprador en ejercicios posteriores.
- El art. 65 del Reglamento del IVA supedita el libro específico a regularizaciones de deducciones por inversión; no presumir que el transmitente debía tener un libro si no era sujeto a regularización. Exigir comprobación de prorrata y período de regularización antes de marcar un anexo como obligatorio.
- La plantilla AEAT LSIJ revisada corresponde al **diseño de 2026**, no a un libro 2023 ya llevado. Un fichero cumplimentado hoy debe señalarse de forma inequívoca como **reconstrucción documental** y contener únicamente campos contrastados; dejar deducibilidad/prorrata/regularización sin cumplimentar si no hay modelo 303 o evidencia suficiente.
- El inmueble de caso se desglosaba contablemente como suelo 49 % / construcción 51 % y venta con inversión del sujeto pasivo. No equiparar la cuota devengada por ISP con cuota efectivamente deducida sin cotejar el 303 original.
- Antes de remitir a la administración: verificar documento auténtico de notificación, plazo efectivo, representante actual, anexos y confirmación expresa del cliente. No presentar de forma autónoma.

Fuentes normativas generales: https://sede.agenciatributaria.gob.es/Sede/iva/facturacion-registro/libros-registro-iva/libro-registro-bienes-inversion.html y https://sede.agenciatributaria.gob.es/Sede/iva/facturacion-registro/preguntas-frecuentes/libro-registro-bienes-inversion-iva-irpf.html
