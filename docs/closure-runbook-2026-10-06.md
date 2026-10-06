# EXPERT closure runbook — 2026-10-06

## Regla operativa

No abrir nuevas funcionalidades hasta cerrar seguridad, migraciones, crons, PRs bloqueadas, ramas huérfanas y issues obsoletos.

Una puerta solo se considera cerrada cuando coinciden:
1. código;
2. despliegue;
3. runtime;
4. estado operativo;
5. documentación.

## Estado de cierre

### Cerrado

- PR #542 fusionada: runtime de health checks de KIA.
- Supabase Security Advisor: eliminados los avisos por `SECURITY DEFINER` ejecutable por `anon` y `authenticated`.
- Producción: revocado `EXECUTE` público de `public.reconcile_case_task_lifecycle()`.
- Reparada en rama P0 la migración `20261004111500_case_task_lifecycle_reconciliation.sql`:
  - delimitadores PL/pgSQL `$$`;
  - permisos explícitos de funciones trigger.
- `email-queue` acepta ahora GET y POST en la rama P0 para compatibilidad con Supabase `pg_cron`.

### P0 abiertos

1. Reconciliar el estado `MIGRATIONS_FAILED` de Supabase con el historial remoto.
2. Validar aplicación completa de la segunda función/trigger:
   - `promote_case_after_submission_task()`;
   - `trg_promote_case_after_submission_task`.
3. Unificar scheduler canónico:
   - evitar doble ejecución entre los proyectos Vercel `app` y `ksenia-expert`;
   - mantener un único origen de ejecución para cada cron.
4. Corregir y verificar `holded-sync` 401.
5. Verificar procesamiento real de `email-queue`.
6. Eliminar timeouts intermitentes de `/api/cron/kia-email-agent`.

## PRs abiertas y criterio

- #597 DGM docs/tests: corregir test P1 y fusionar si CI queda verde.
- #610 EXPERT MCP list_companies: corregir registro de tools, perfiles inactivos e identity bridge.
- #576 Admin Office: corregir scoping de empresa/cliente/citas/correo/tareas.
- #581 Assistant orchestration/email delegation: no fusionar hasta cerrar fail-closed, Unicode, deduplicación y provider routing.
- #579 Accounting Phase 2B: no fusionar hasta corregir gateway Holded v1/v2.
- #520 Google eSignature: completar lifecycle real y evidencia firmada.
- #521 RGPD/AEPD: corregir consentimiento, trackers, términos e inventario de cookies.
- #598 Client Registry v2: corregir scope por expediente y retención.

## Limpieza de repositorio

- Ramas detectadas: ~235.
- Ramas no asociadas a PR abierta: ~225.
- Poda solo después de comparar ahead/behind y confirmar que no contienen cambios no integrados.

## Orden de ejecución

1. Supabase seguridad + migraciones.
2. Crons y schedulers.
3. Runtime KIA email.
4. #597.
5. #610.
6. #576.
7. #581.
8. Gateway Holded + #579.
9. #520.
10. #521.
11. #598.
12. Poda de ramas.
13. Cierre/reclasificación de issues.

## Criterios de aceptación P0

- Security Advisor sin warnings de ejecución pública de funciones privilegiadas.
- Branch de Supabase sin estado `MIGRATIONS_FAILED`.
- Cada cron tiene un único scheduler.
- `email-queue` devuelve 2xx desde su scheduler real.
- `holded-sync` deja de registrar 401.
- `kia-email-agent` no excede el runtime configurado en observación reciente.
- Producción principal permanece READY.
