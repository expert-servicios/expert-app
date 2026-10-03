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


## Cuentas de Asesoría y API v2 — 03/10/2026

EXPERT trabaja con tres modos de cuenta Holded claramente separados:

- `expert_account`: cuenta propia de EXPERT. Mantiene compatibilidad con la conexión global existente mientras se migra gradualmente.
- `client_account`: tenant contratado por el cliente y compartido con EXPERT en modelo colaborativo.
- `advisor_managed`: licencia de gestión contable creada y pagada por EXPERT desde el portal de Asesorías. Debe usar API v2 Bearer.

Las pruebas reales con Holded confirmaron que el token del tenant raíz de Asesorías no expone las cuentas gestionadas. Cada licencia gestionada funciona como una cuenta API independiente y requiere su propia credencial.

### Regla de secretos

No se crean variables Vercel por cada cliente.

Para cualquier `client_account` o `advisor_managed`:

1. La identidad, empresa, modo y versión viven en `client_integrations`.
2. La credencial cifrada vive exclusivamente en `client_integration_secrets`.
3. `resolveHoldedAuth(integrationId)` es la única autoridad de lectura del secreto.
4. `HoldedGateway` selecciona el adaptador v1/v2 a partir de `api_version`.
5. KIA y Accounting nunca reciben el token ni deciden cómo autenticarse.

Variables temporales como `HOLDED_DGM_API_TOKEN` solo se permiten para pruebas controladas de Preview y deben retirarse después de migrar el secreto a la integración canónica.

### Dirección técnica

Las nuevas cuentas deben preferir API v2. La API v1 queda únicamente para conexiones legacy mientras exista compatibilidad.

Toda capacidad nueva se incorpora primero en modo read-only. Las escrituras contables, cobros, rectificativas, anulaciones o pagos deben entrar mediante herramientas específicas, risk tier y aprobación humana.
