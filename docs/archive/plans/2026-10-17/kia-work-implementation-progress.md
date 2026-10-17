# Progreso de implementación KIA–Work

Última actualización: 24/09/2026.

## Estado actual confirmado

- La implementación de KIA–Work de la PR #444 está fusionada en `main` mediante `b2d9d0e4353de1b10195363122aee4047c823f67`.
- La PR documental #443 está cerrada y su contenido útil quedó incorporado en #444.
- Después se fusionaron #471 (representación y firmas de nacionalidad) y #427 (consolidación RLS de `user_profiles_ext`). El `main` verificado en esta actualización es `b53155ff1b5795c5b7084ec8fc5036e1a6525c07`.
- CI de `main` #1867: correcto.
- Despliegues de producción `app` y `ksenia-expert`: READY sobre el mismo SHA de `main`.
- No se observaron errores de runtime Vercel en la hora posterior a la actualización ni errores PostgreSQL en la ventana post-despliegue revisada.
- Producción ya registra las migraciones `20260924170000_kia_work_case_orchestration` y `20260924171500_kia_work_result_inbox`.
- Security Advisor confirma las tablas KIA Work como RLS sin policies. La comprobación de ACL verifica que no tienen grants para `anon` ni `authenticated`; el acceso queda restringido a `service_role`, de forma intencional.
- `KIA_WORK_CONNECTOR_ENABLED` sigue siendo una bandera de activación explícita en código. La configuración real del entorno debe verificarse antes del piloto; no asumir activación por el hecho de que el despliegue esté READY.

## Funcionalidad ya implementada

El conector dispone de credenciales limitadas a expediente/tareas, reservas con caducidad, verificación de evidencia, idempotencia por evento y cierre transaccional. Incluye recepción durable mediante inbox, reintentos acotados, recuperación segura, vista de actividad en Admin, continuidad contextual con Telegram/copiloto, firma de KIA en `sendEmail`, cabeceras nativas de respuesta Gmail y soporte para particulares sin empresa ficticia.

Las migraciones canónicas actuales son:

1. `20260924170000_kia_work_case_orchestration.sql`
2. `20260924171500_kia_work_result_inbox.sql`

No reutilizar en documentación ni despliegues los nombres provisionales `20260924093629` o `20260924101525`.

## Pendientes reales

1. Pantalla profesional para delegar y revocar tareas sin configuración técnica.
2. Interfaz guiada para conciliar resultados en estado `review`.
3. Firma y CTA en composición nativa Gmail/MS365, continuidad real del hilo y autorización vinculada al contenido exacto que se ejecutará.
4. Verificar la bandera de producción `KIA_WORK_CONNECTOR_ENABLED` y realizar un piloto controlado con credencial acotada.
5. Registrar el resultado del piloto, incluidos bloqueos, expiraciones, reintentos y revocación.
6. Mantener fuera del conector la autorización de firma, pago y presentación definitiva.

## Límites que deben conservarse

- Una delegación para registrar resultados no autoriza por sí sola envíos, firma, pagos o presentación.
- Usar Chrome para la Sede y entregar el control en identificación, firma, pago y presentación definitiva.
- Remitente/contacto operativo: `info@expertconsulting.es`. KIA se identifica como asistente de IA.
- Documentos originales y datos personales permanecen en almacenamiento privado; usar datos sintéticos en pruebas y documentación versionada.
- Si hay timeout, conciliar el resultado: nunca repetir a ciegas un correo, pago o presentación.
- No publicar como terminado lo que esté preparado, pendiente de aprobación o sin verificar.

## Referencias operativas

- Guía: [KIA–Work: conector de resultados](kia-work-connector-runbook.md)
- Diseño: [orquestación de expedientes](kia-work-case-orchestration.md)
- Endpoint Work: `/api/kia/work`
- Gestión profesional de conexiones: `/api/admin/kia/work-connections`
- Cron de verificación: `/api/cron/kia-work-results`
