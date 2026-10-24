# Ksenia — redes, plantilla de correo y calendario Outlook
Fecha: 20/10/2026
Estado: implantación parcial; reservas y envíos automáticos **no habilitados**.

## Identidad y redes
- Cuenta Outlook verificada con la herramienta del usuario: `soy@kseniailicheva.com`.
- Las variantes `soy@ximilecheva.com` y `soy@kseniailecheva.com` no deben utilizarse sin verificación adicional.
- Cinco redes oficiales en `lib/personal/ksenia-social-profiles.ts`. Diseño accesible en `components/personal/KseniaSocialLinks.tsx`.
- URL canónica personal: `https://kseniailicheva.com`.
- No modificar la marca ni el remitente corporativo de EXPERT.

## Plantilla de correo
- `lib/personal/ksenia-email-template.ts` expone `renderKseniaPersonalEmail({ locale: 'es' | 'ru', subject, recipientName?, paragraphs, cta?, senderEmail? })`.
- Salida HTML + texto plano, firma personal y redes sociales; no envía correos.
- Antes de habilitar un remitente externo: confirmar dominio y buzón en el proveedor de salida y su autorización de `Send As`, SPF, DKIM, DMARC y política de consentimiento.
- No reutilizar `RESEND_FROM_EMAIL` de EXPERT ni adjuntar automáticamente firma KIA a correos personales.
- Para una plantilla de Outlook manual se puede copiar el texto y la firma, sin depender de una API.

## Outlook: estado y activación
- La cuenta Outlook conectada desde ChatGPT muestra calendario «Calendario», zona `Romance Standard Time` y jornada L–V 08:00–17:00; **este acceso del usuario a ChatGPT no concede acceso a la web**.
- El código de EXPERT ya implementa `listBookingCalendarBusyWindows`, validaciones, bloqueo de citas, confirmación y cancelación con `BOOKING_CALENDAR_PROVIDER=ms365`.
- La tabla `ms365_tokens` de la base de datos no tiene actualmente una conexión válida `id=admin`, de acuerdo con la consulta realizada.
- En Vercel `expertapp/kseniailicheva` figuran `BOOKING_CALENDAR_PROVIDER=ms365`, `ADMIN_OWNER_EMAIL=soy@kseniailicheva.com`, `PERSONAL_SITE_DEPLOYMENT=true`. **Todavía NO** figuran las credenciales servidor `MS365_CLIENT_ID`, `MS365_CLIENT_SECRET` ni la configuración Supabase de la aplicación personal.
- La página `/reservar` y `/ru/reservar` muestran, si falta la conexión nativa, el enlace público personal de Microsoft Bookings detectado en correspondencia reciente de Outlook, y como alternativa el correo. El enlace está configurado mediante `PERSONAL_MICROSOFT_BOOKINGS_URL` solo en Vercel `kseniailicheva`, con validación estricta de dominio `bookings.cloud.microsoft`. No se incrustan páginas externas ni se muestran franjas inventadas.
- Este Bookings externo abre su propia página y gestiona disponibilidad con Outlook. Antes de considerarlo finalizado, validar manualmente que tiene configurado el servicio de **15 minutos**, que las reservas efectivamente aparecen en el calendario principal y que el enlace de reunión generado es el deseado.
- Los endpoints de reservas siguen necesitando secreto de base de datos y verificación antispam adecuados, siempre en variables servidor de Vercel. No duplicar las claves privadas de EXPERT sin revisión de alcance.

### Pendiente de la titular
1. Decidir videoconferencia: **Microsoft Teams** al utilizar Microsoft 365 de extremo a extremo, o **Google Meet** (preferencia anterior), lo que requiere separar proveedor de disponibilidad del proveedor de vídeo y comprobar los bloqueos en ambos calendarios.
2. Autorizar la aplicación Microsoft con el usuario `soy@kseniailicheva.com` mediante OAuth administrado. El código existente utiliza `/api/auth/ms365` con verificación de rol admin y consentimiento `Calendars.ReadWrite`. No almacenar tokens en cliente.
3. Instalar credenciales y Supabase en el proyecto personal bajo autorización de seguridad, con `NEXT_PUBLIC_APP_URL` definitivo y callback Microsoft registrado para ese origen, sin exponer secretos.
4. Confirmar de forma real la lectura de busy/free, bloqueos, reserva simultánea, invitación, correo de confirmación, cancelación y reprogramación. Verificar traducciones ES/RU y zona Europe/Madrid.
5. Activar envío personal solo tras verificar el dominio remitente. Evitar cualquier envío automático de prueba a clientes reales.

## Criterios antes de fusionar
- Vercel `kseniailicheva` y controles de GitHub de PR #824 completados.
- Vista móvil ES/RU y widget WhatsApp aprobados.
- Formularios y reservas no muestran un éxito ficticio si faltan credenciales.
- Dominio `kseniailicheva.com` conectado solo tras verificación DNS y de la rama destinada a producción.
