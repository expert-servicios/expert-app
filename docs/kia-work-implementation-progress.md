# Progreso de implementación KIA–Work

Última actualización: 24/09/2026. Continuar sobre la rama `feat/kia-work-case-orchestration` y la [PR #444](https://github.com/expert-servicios/expert-app/pull/444). No empezar de nuevo ni modificar el repositorio de trabajo personal del usuario.

## Punto de recuperación confirmado

Commit funcional: `157fc153`. Implementa credenciales limitadas a expediente/tareas, reservas, evidencia y cierre transaccional; continuidad Telegram/copiloto; firma de KIA en `sendEmail`; cabeceras de respuesta Gmail; documentos e identidades de particulares sin empresa ficticia.

Validación de ese commit: CI Linux **222 archivos de pruebas / 1.232 pruebas aprobadas**, tipos y lint aprobados, comprobación del historial de migraciones de solo lectura aprobada y ambas compilaciones Vercel aprobadas. Pruebas adicionales de las funciones SQL en PostgreSQL WASM aprobadas. No se enviaron mensajes reales ni se presentó o pagó ningún expediente.

La PR tiene incorporación automática preparada, pero `main` exige revisión aprobada. La PR documental #443 sigue abierta y su contenido está incluido en #444; comprobar ambas antes de incorporar cambios para evitar conflictos entre ellas. No eludir las protecciones de `main`.

La migración `20260924093629_kia_work_case_orchestration.sql` y la bandera `KIA_WORK_CONNECTOR_ENABLED` requieren despliegue/configuración. Una compilación de prueba aprobada no acredita que la migración esté aplicada ni que el piloto esté operativo. Detalle: [guía operativa](kia-work-connector-runbook.md).

## Continuación autorizada

Segundo incremento: recepción durable y cron de verificación implementados en `20260924101525_kia_work_result_inbox.sql`, `work-inbox.ts` y `/api/cron/kia-work-results`. El receptor guarda antes de verificar; reintenta errores temporales hasta cinco veces y recupera cierres ya confirmados. No prolonga permisos o reservas originales ni repite efectos externos. HTTP 202 y salida 2 del adaptador distinguen pendiente de completado. Pruebas locales: 23 pruebas del conector/cron aprobadas y SQL real aprobado, incluida exclusión de trabajadores y recuperación de una reserva interrumpida. Pendiente de CI de este nuevo incremento y de aplicación de la nueva migración en staging.

Tercer incremento: vista «Actividad de KIA» en el expediente de Admin, bajo la misma bandera. Muestra los últimos 50 resultados y distingue recibido, verificado, tarea pendiente y revisión. La API de lectura vuelve a comprobar acceso profesional al expediente; no devuelve credenciales ni metadatos internos completos. Es una vista de consulta, no un botón para saltarse la verificación o dar una tarea por terminada. La delegación visual y resolución guiada de incidencias siguen pendientes. Revisión React: componente de servidor, carga con Suspense, sin estado cliente ni duplicación de peticiones, claves estables, fechas explícitas Europe/Madrid y texto de estado accesible.

La usuaria ha pedido guardar y subir el progreso y continuar la implementación mientras quede uso disponible. No consumir créditos de reinicio sin autorización específica. No reactivar seguimientos nocturnos pausados.

Orden de trabajo:

1. Recepción durable y reintentos: implementados; validar el nuevo incremento en CI y staging. Añadir una interfaz para los resultados que pasan a revisión.
2. Pantalla profesional para delegar y revocar tareas sin configuración técnica.
3. Firma y CTA en composición nativa Gmail/MS365, continuidad real del hilo y autorización ligada al contenido exacto.
4. Ensayo con esquema completo en staging y piloto desplegado; registrar pruebas y bloqueos reales.

## Límites que deben conservarse

- Una delegación para registrar resultados no autoriza por sí sola envíos, firma, pagos o presentación.
- Usar Chrome para la Sede y entregar el control en identificación, firma, pago y presentación definitiva.
- Remitente/contacto operativo: `info@expertconsulting.es`. KIA se identifica como asistente de IA.
- Documentos originales y datos personales permanecen en almacenamiento privado; usar datos sintéticos en pruebas y documentación versionada.
- Si hay timeout, conciliar el resultado: nunca repetir a ciegas un correo, pago o presentación.
- No publicar como terminado lo que esté preparado, pendiente de aprobación o sin verificar.

## Entorno de validación local

Windows: dependencias compartidas mediante junction en el worktree; no modificar las del repositorio personal. Para comprobar tipos se utilizó una configuración temporal externa con `next-intl` de la versión declarada, porque faltaba en las dependencias locales compartidas. Lint terminó sin errores. Dos diferencias de pruebas locales se debieron a saltos de línea y zona horaria; CI Linux pasó todas. No introducir normalizaciones masivas de archivos como parte de esta implementación.

El script `scripts/test-kia-work-sql.mjs` tiene instrucciones en la guía operativa y utiliza un paquete PGlite instalado fuera del repositorio. Los controles SQL son representativos y no sustituyen staging.
