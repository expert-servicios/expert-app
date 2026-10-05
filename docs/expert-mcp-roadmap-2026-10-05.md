# EXPERT MCP — arquitectura y roadmap

Fecha: 2026-10-05

## Visión

Convertir el proyecto actual `expert-holded-mcp` en **EXPERT MCP**, el servidor MCP remoto oficial de EXPERT.

EXPERT MCP no almacena credenciales específicas de Holded ni decide tenants por su cuenta.
Toda autorización empresarial se resuelve en EXPERT mediante `company_id`, políticas, permisos y auditoría.

Arquitectura objetivo:

```
ChatGPT / Claude / otros clientes MCP
                |
           EXPERT MCP
                |
        EXPERT authorization
                |
   provider gateways / tools
      |       |       |
    Holded   Drive   Calendar ...
      |
 client_integrations
      |
 encrypted secrets
```

KIA usa los mismos gateways internos que EXPERT MCP. No se implementa una segunda lógica de negocio para agentes externos.

## Principios

1. EXPERT es autoridad de identidad, tenant, permisos y auditoría.
2. Ningún cliente MCP recibe o almacena tokens de proveedores finales.
3. Toda tool empresarial requiere contexto inequívoco de empresa.
4. Las operaciones de lectura son separadas de las de escritura.
5. Escrituras financieras siguen: preparar -> validar -> confirmar -> ejecutar -> auditar.
6. El MCP oficial de cada proveedor se usa como referencia de interoperabilidad y testing, no como fuente de verdad de EXPERT.
7. Las tools tienen contratos estables y versionados.

## Piloto

Empresa piloto:
- EXPERT ESTUDIOS PROFESIONALES, S.L.U.
- CIF B44991776.

Dos cuentas Holded previstas:
- `asesoria_sandbox`: cuenta vacía para pruebas controladas;
- `contabilidad_real`: cuenta con la contabilidad actual de EXPERT.

No activar escrituras sobre `contabilidad_real` durante las primeras fases.

## Fase 0 — saneamiento de entidades

- consolidar duplicados de EXPERT;
- impedir CIF/NIF duplicados normalizados;
- toda alta cliente/admin reutiliza o rechaza la entidad ya existente;
- mantener una única entidad canónica por titular fiscal.

## Fase 1 — multi-conexión por proveedor

El modelo actual permite una única conexión viva `company_id + provider`.
Debe evolucionar a conexiones nombradas.

Añadir a `client_integrations`:
- `connection_key text not null default 'default'`;
- `display_name text`;
- `purpose text`;
- `environment text` (sandbox/production);
- `is_primary boolean not null default false`.

Nueva identidad lógica:
`company_id + provider + connection_key`.

Reglas:
- máximo una conexión primaria activa por empresa/proveedor;
- múltiples conexiones secundarias activas permitidas;
- resolver por `integration_id` o `connection_key` cuando haya más de una;
- nunca escoger “la última” si existen varias activas;
- callers legacy solo pueden usar resolución automática cuando haya exactamente una conexión activa o una primary inequívoca.

Antes de eliminar el índice antiguo, actualizar todos los resolvers y tests.

## Fase 2 — Holded v2 común

Unificar acceso en `HoldedGateway`.

EXPERT MCP no llama directamente a la API de Holded.
Debe llamar a servicios internos EXPERT que usan el mismo gateway que KIA.

Primeras capacidades R0:
- list companies available to current EXPERT user;
- list Holded connections for company;
- connection status/capabilities;
- invoices;
- purchases;
- contacts;
- chart of accounts;
- journal/ledger;
- taxes;
- bank/treasury accounts.

Todos los resultados incluyen:
- company context;
- connection context;
- source/provider;
- permission/capability metadata cuando aplique.

## Fase 3 — EXPERT MCP read-only

Reutilizar la infraestructura del proyecto Vercel `expert-holded-mcp`:
- transporte MCP HTTPS;
- OAuth;
- metadata/discovery;
- rate limiting;
- logging;
- tests.

Renombrar funcionalmente a EXPERT MCP.

OAuth autoriza contra EXPERT.
El usuario selecciona empresa y conexión disponible según sus memberships/permisos.

Tools iniciales:
- `list_companies`
- `list_integrations`
- `get_company_snapshot`
- `holded_list_invoices`
- `holded_get_invoice`
- `holded_list_purchases`
- `holded_list_contacts`
- `holded_get_chart_of_accounts`
- `holded_get_journal`
- `holded_list_treasury_accounts`
- `search_company_documents`
- `get_case_status`

No exponer escrituras en la primera publicación.

## Fase 4 — laboratorio oficial Holded

Conectar en paralelo el MCP oficial de Holded a una cuenta propia de EXPERT en modo lectura.

Objetivo:
- comparar resultados oficiales vs `HoldedGateway`;
- detectar diferencias de campos, paginación y permisos;
- construir regression fixtures;
- no usar esta conexión para operar clientes.

Suite comparativa:
- invoices;
- purchases;
- contacts;
- chart of accounts;
- journal;
- treasury;
- taxes.

## Fase 5 — writes controlados

Primero solo en `asesoria_sandbox`.

Categoría R1:
- crear borrador de factura;
- crear borrador de contacto si la API lo admite y se decide exponer;
- operaciones no destructivas adicionales evaluadas individualmente.

Nunca en esta fase:
- borrar documentos;
- emitir/finalizar factura;
- conciliar automáticamente;
- ejecutar pagos;
- modificar asientos históricos;
- operaciones destructivas.

Toda write tool:
1. resolve company;
2. resolve connection;
3. verify capability;
4. verify operational control;
5. generate preview;
6. require explicit confirmation;
7. execute;
8. read-back verify;
9. audit.

## Fase 6 — ChatGPT

Publicar inicialmente como app MCP personalizada del workspace.

Estrategia:
- read-only primero;
- contratos de tools estables antes de publicación;
- no cambiar breaking schemas sin nueva revisión/publicación;
- separar tools de lectura y escritura por permisos;
- evaluar Apps SDK/UI cuando el flujo conversacional esté estable.

## Fase 7 — Claude

Mantener compatibilidad con remote MCP estándar.

Claude debe usar el mismo endpoint y OAuth EXPERT, sin credencial compartida de Holded.
Cada usuario accede exclusivamente a las empresas que EXPERT autoriza.

## Fase 8 — producto externo

Preparar EXPERT MCP para distribución más amplia:
- branding;
- términos;
- privacidad/DPA;
- soporte;
- onboarding OAuth;
- scopes documentados;
- rate limits;
- tenant isolation tests;
- security review;
- observabilidad;
- versionado de tool schemas;
- portal para revocar conexiones.

## Seguridad obligatoria

- no enviar tokens Holded por chat/email;
- secretos cifrados exclusivamente server-side;
- `company_id` no es suficiente: comprobar membership/grant;
- `integration_id` debe pertenecer a la empresa autorizada;
- no permitir fallback silencioso entre conexiones;
- read/write capability matrix;
- bloqueos operativos por empresa;
- auditoría de actor, empresa, integración, tool, argumentos saneados, resultado y timestamp;
- idempotency keys para writes;
- tests contra cross-tenant access y confused deputy;
- prompt injection no puede elevar permisos de tools.

## Criterio de éxito del piloto

EXPERT ESTUDIOS PROFESIONALES debe poder:

1. seleccionar `asesoria_sandbox`;
2. consultar Holded desde KIA y desde EXPERT MCP;
3. obtener resultados equivalentes;
4. ejecutar una write R1 segura solo en sandbox;
5. cambiar a `contabilidad_real` y quedar read-only;
6. demostrar que ninguna tool puede cruzar ambas conexiones sin selección explícita.

Después del piloto se habilita DGM como segunda empresa de validación, inicialmente read-only.
