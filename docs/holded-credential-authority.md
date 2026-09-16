# Holded credential authority — EXPERT / MCP

## Decisión HLAB-2

Para el runtime de EXPERT y KIA, la autoridad de conexión Holded es:

1. `client_integrations`: identidad, empresa, estado, modo, permisos detectados/habilitados y consentimiento.
2. `client_integration_secrets`: única fuente de la credencial cifrada utilizada por el runtime EXPERT/KIA para una integración de cliente.

`resolveHoldedAuth(integrationId)` debe resolver una integración activa en `client_integrations` y obtener su secreto exclusivamente desde `client_integration_secrets`.

## `holded_mcp_connections`

`holded_mcp_connections` pertenece al bridge MCP/autorización externa. Puede contener su propia credencial porque ese flujo tiene un propietario y ciclo de vida independientes, pero:

- no es fallback de `resolveHoldedAuth`;
- no sustituye `client_integration_secrets`;
- no debe copiar silenciosamente una credencial MCP a una integración EXPERT;
- la existencia de una conexión MCP no concede capacidades al runtime EXPERT/KIA;
- cualquier futura vinculación MCP -> EXPERT debe ser explícita, auditable y company-scoped.

## Permisos HLAB-2

Capacidades read-only detectadas en Holded API v2:

- `laborEmployeesRead` -> equivalente funcional a `team:employees.read`;
- `laborPayrollsRead` -> equivalente funcional a `accounting:payrolls.read`.

Capacidades de escritura bloqueadas por política:

- `writeInbox = false`;
- `laborEmployeesWrite = false`;
- `laborPayrollsWrite = false`.

No se realizan probes PUT/POST para detectar writes. HLAB-5 será el primer bloque que podrá introducir escrituras laborales, siempre mediante acciones supervisadas y aprobación humana.

## Persistencia

No se necesita DDL. `client_integrations.permissions_detected` y `client_integrations.permissions_enabled` ya son JSONB y pueden almacenar las nuevas capacidades.

La detección de permisos nunca modifica empleados, contratos, nóminas ni registros salariales.
