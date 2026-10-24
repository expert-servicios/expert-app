# Cal.com — reactivación de reservas personales (21/10/2026)

**Alcance:** sólo el flujo público personal ES/RU de la rama `feat/ksenia-personal-site-20261020`. No cambiar el proveedor nativo de EXPERT, las citas históricas ni los webhooks de producción.

## Preflight observado
- Proyecto Vercel `kseniailicheva`: ya existe la variable cifrada `cal_ksenia` para Preview y Production (23/10/2026). No se ha leído ni verificado su valor. Siguen sin constar `PERSONAL_CALCOM_BOOKING_URL` ni `PERSONAL_CALCOM_EVENT_TYPE_ID`.
- Proyecto Vercel `ksenia-expert`: permanece una variable antigua `NEXT_PUBLIC_CAL_FORMACION_LINK`, pero su valor no es una URL pública verificable; **no reutilizar** como enlace personal.
- Código heredado `app/api/webhooks/cal/route.ts`: **LEGACY BOOKING COMPATIBILITY ONLY**. No abrir ese webhook para reservas nuevas sin prueba de end-to-end, identidad, firma e idempotencia.
- Dominio `kseniailicheva.com`: todavía asignado a proyecto/redirección EXPERT; la nueva web personal está en preview. El cambio del dominio requiere revisión independiente.

## Configuración para activar Cal.com
1. Recuperar **de la misma cuenta Cal.com** el enlace HTTPS *público y específico del tipo de evento personal*; ejemplo de forma `https://cal.com/<usuario>/<evento>` (no utilizar este ejemplo como enlace real). Comprobar que es el evento correcto y que está publicado.
2. Dentro de Cal.com, verificar conexión con Outlook y cualquier calendario adicional que deba bloquear conflictos. Elegir el calendario donde se crean eventos y el sistema de videoconferencia. Probar cambio horario Europe/Madrid.
3. Crear en Vercel proyecto `kseniailicheva` una variable tipo **Config** `PERSONAL_CALCOM_BOOKING_URL` para Preview y Production (valor = URL pública del evento). No poner token, API key, credenciales ni webhook secret en variables `NEXT_PUBLIC_*`.
4. Desplegar la rama en preview; comprobar ES `/reservar`, RU `/ru/reservar`, visualización móvil, abrir iframe tras acción, reserva real, email de confirmación, videollamada, reprogramación y cancelación.
5. Si se pretende que las nuevas reservas se reflejen también en el expediente/tareas de EXPERT, diseñar y probar sincronización específica antes de declararla operativa. **La UI de este cambio no garantiza por sí sola esa sincronización.**
6. No publicar el dominio personal ni alterar redirecciones de Vercel hasta QA y autorización de la PR personal existente.

## Rollback
Quitar `PERSONAL_CALCOM_BOOKING_URL` o dejarla vacía, redeplegar y se conserva el flujo anterior `KseniaPersonalBookingGate` (nativo cuando está conectado, Microsoft Bookings verificado en caso contrario).

## Ruta alternativa: API v2 de Cal.com (preparada, sin credencial activa)

Cuando no exista `PERSONAL_CALCOM_BOOKING_URL`, la web personal puede obtener el enlace de reserva desde la API usando la variable cifrada **ya existente** `cal_ksenia` (o, si se configura expresamente, `CAL_API_KEY`; ambas sólo en servidor), más `PERSONAL_CALCOM_EVENT_TYPE_ID` (**Config**, id numérico de la consulta personal de 15 minutos). Son obligatorios una credencial válida y el ID explícito. No es necesario duplicar la credencial. El selector es explícito: jamás elige el primer evento disponible. Usa peticiones GET a `https://api.cal.com/v2/event-types` y, cuando se necesite, `https://api.cal.com/v2/me`. Si la cuenta o el tipo de evento no quedan validados, mantiene el flujo de respaldo anterior.

**Hallazgo 23/10/2026:** la clave está almacenada bajo `cal_ksenia`, y el código la admite ahora como alias de servidor. No se ha verificado su autenticación ante Cal.com. Falta identificar de forma inequívoca `PERSONAL_CALCOM_EVENT_TYPE_ID` o configurar el enlace público `PERSONAL_CALCOM_BOOKING_URL`. Hasta entonces permanece el fallback, sin seleccionar automáticamente un evento de otra actividad. Nunca copiar el valor del secreto en GitHub ni en el chat.

Esta fase no crea ni cancela reservas mediante la API, no registra webhooks y no conecta por sí misma las reuniones nuevas con EXPERT/KIA. La sincronización y el uso MCP deberán validarse de manera separada en una PR posterior; el webhook histórico de EXPERT no se reutiliza sin pruebas de seguridad.

## Recuperación automática de reuniones existentes (23/10/2026)
- La web personal consulta la identidad de la cuenta (`GET /v2/me`) y los tipos de reunión guardados (`GET /v2/event-types`) con `cal_ksenia` desde el servidor.
- Cuando no existe una URL ni un ID preferente, ofrece los eventos públicos cuyo enlace pertenece inequívocamente al usuario autenticado. Conserva títulos, duración y enlaces del proveedor; no crea reuniones nuevas.
- Descarta eventos ocultos, URLs de terceros, equipos y datos sin enlace público verificable. No expone la clave ni altera la agenda EXPERT.
- La conexión con Outlook y la sincronización de nuevas reservas hacia EXPERT/KIA no se pueden certificar únicamente con el listado de eventos: requieren prueba operativa posterior.
- Si la API falla o no devuelve eventos públicos verificados, permanece el sistema de respaldo. No inferir que una cita de 15 minutos existe si la API no lo confirma.
