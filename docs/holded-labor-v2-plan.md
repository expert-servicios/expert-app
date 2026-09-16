# Holded Labor v2 — plan de integración EXPERT

## Objetivo

Añadir lectura laboral de Holded a EXPERT sin romper la integración v1 existente y sin habilitar escrituras automáticas.

La primera entrega (`HLAB-1`) incorpora un cliente interno para Holded API v2 orientado a:

- empleados;
- contrato activo;
- nóminas calculadas por el motor de Holded;
- registros salariales manuales;
- PDFs de nóminas y registros salariales.

## Preflight 2026-09-16

Producción Supabase `EXPERT` (`ybtpqscmqrrjjmuoryap`) confirma:

- `client_integrations` ya dispone de `company_id`, `client_id`, `api_version`, `permissions_detected`, `permissions_enabled`, `status`, `sync_mode`, consentimiento y canal;
- `client_integration_secrets` existe y contiene la credencial cifrada separada de la fila de integración;
- `holded_mcp_connections` existe como superficie independiente del conector MCP;
- actualmente existe 1 integración Holded activa, vinculada a empresa, con su secreto canónico presente;
- no hay conexiones MCP persistidas actualmente;
- no hay integración Holded activa sin secreto.

Por tanto HLAB-1 no necesita DDL ni modificación de datos productivos.

## Arquitectura

### Cliente v1 existente

Se conserva para facturación, compras, contactos, impuestos, tesorería y contabilidad ya desplegados.

### Nuevo cliente v2

`lib/integrations/holded/holded-v2-client.ts`

Características:

- `https://api.holded.com/api/v2`;
- autenticación `Authorization: Bearer <api-key>`;
- reutiliza `resolveHoldedAuth(integrationId)` para obtener la credencial cifrada canónica;
- únicamente métodos `GET`;
- timeout de 20 segundos;
- paginación por cursor;
- límite máximo de página 200;
- reutiliza los errores tipados existentes para 401, 403 y 429;
- nunca registra ni devuelve la API key.

### Superficie HLAB-1

- `listEmployees`
- `getEmployee`
- `getActiveContract`
- `listPayslips`
- `getPayslip`
- `getPayslipPdf`
- `listSalaryRecords`
- `getSalaryRecord`
- `getSalaryRecordPdf`

## Diferencia obligatoria de dominio

Holded separa dos recursos:

1. `payslips`: nóminas calculadas por el motor de Nóminas/RRHH de Holded;
2. `salary-records`: registros salariales contables introducidos manualmente.

EXPERT no debe mezclarlos. Esta distinción es necesaria para migraciones históricas y para diagnosticar casos como una nómina de septiembre a cero frente a históricos importados de meses anteriores.

## Permisos previstos

HLAB-1 no gestiona scopes ni permisos todavía. HLAB-2 deberá detectar y persistir al menos:

- `team:employees.read`;
- `accounting:payrolls.read`.

No activar:

- `team:employees.write`;
- `accounting:payrolls.write`.

## Roadmap

### HLAB-1 — cliente API v2 read-only

Estado: implementación inicial en PR independiente.

Sin DDL. Sin KIA tools. Sin writes.

### HLAB-2 — permisos y autoridad de conexión

- ampliar detección de capacidades;
- resolver de forma explícita la relación entre `holded_mcp_connections`, `client_integrations` y `client_integration_secrets`;
- mantener una sola autoridad de credenciales para runtime EXPERT;
- preflight antes de cualquier DDL;
- Security Advisor después de cualquier cambio de schema.

### HLAB-3 — Tool Registry KIA

Añadir herramientas laborales read-only company-scoped y capacidad específica (`holded_hr_read` o equivalente), sin reutilizar de forma indiscriminada la capacidad contable general.

### HLAB-4 — Skill y subagente laboral

Añadir `labor.payroll_diagnostics` y subagente `labor` para analizar:

empleado -> contrato -> jornada -> salario -> nómina -> bases -> IRPF -> incidencias.

La IA explica; Holded es fuente de datos.

### HLAB-5 — escrituras supervisadas

Fuera del alcance inicial. Cualquier PUT/POST laboral deberá pasar por el modelo de acciones administrativas, snapshot, aprobación humana y policy R2+.

## Smoke test funcional previsto

Primer caso: Oksana Kukhar.

EXPERT deberá poder leer, sin modificar Holded:

- ficha del empleado;
- contrato activo;
- jornada semanal;
- salario y periodicidad;
- número de pagas;
- nómina de septiembre;
- estado borrador/aprobado;
- desglose de devengos/deducciones cuando exista;
- históricos de `salary-records` separados de `payslips`.

El diagnóstico debe devolver hechos y huecos de configuración, nunca corregir automáticamente el contrato o la nómina.
