# Cal.com — reactivación de reservas personales (21/10/2026)

**Alcance:** sólo el flujo público personal ES/RU de la rama `feat/ksenia-personal-site-20261020`. No cambiar el proveedor nativo de EXPERT, las citas históricas ni los webhooks de producción.

## Preflight observado
- Proyecto Vercel `kseniailicheva`: configuradas `PERSONAL_MICROSOFT_BOOKINGS_URL` y `BOOKING_CALENDAR_PROVIDER`; sin variables `PERSONAL_CALCOM_BOOKING_URL` ni clave de Cal.com en el proyecto consultado.
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
