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

Empresa canónica en EXPERT:
- EXPERT ESTUDIOS PROFESIONALES, S.L.U.
- CIF B44991776.
- una sola integración Holded canónica;
- inicialmente read-only sobre la cuenta con contabilidad real.

Sandbox de escritura:
- la cuenta Holded vacía de asesoría se conecta directamente mediante el MCP oficial de Holded;
- no se registra como segunda integración Holded de la misma empresa en EXPERT;
- se usa exclusivamente para probar tools y operaciones de escritura sin riesgo contable.

No activar escrituras sobre la cuenta real de EXPERT durante las primeras fases.

## Fase 0 — saneamiento de entidades

- consolidar duplicados de EXPERT;
- impedir CIF/NIF duplicados normalizados;
- toda alta cliente/admin reutiliza o rechaza la entidad ya existente;
- mantener una única entidad canónica por titular fiscal.

## Fase 1 — conexión Holded canónica simple

Mantener la regla actual: una única conexión Holded activa por empresa.

No introducir multi-conexión mientras no exista un caso de negocio recurrente.

La resolución sigue siendo:
`company_id + provider=holded -> integración activa`.

Para pruebas de escritura se usa el MCP oficial de Holded contra la cuenta vacía de asesoría, fuera de la integración canónica de EXPERT.

Esto evita:
- selector de conexiones;
- ambigüedad de tenant;
- cambios amplios en resolvers y APIs;
- complejidad innecesaria en KIA y EXPERT MCP.

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

Primero solo mediante el MCP oficial de Holded conectado a la cuenta vacía de asesoría.

Una vez validadas las operaciones, se implementan las equivalentes en HoldedGateway/KIA.

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

1. La cuenta real de EXPERT se conecta a HoldedGateway como única integración canónica y permanece read-only.
2. La cuenta vacía de asesoría se conecta al MCP oficial de Holded con permisos de escritura controlados.
3. Se comparan las operaciones de lectura entre MCP oficial y HoldedGateway cuando sea posible.
4. Se ejecuta una write R1 segura en la cuenta vacía.
5. La misma operación se implementa después en HoldedGateway/KIA con preview, confirmación, read-back y auditoría.
6. EXPERT MCP reutiliza HoldedGateway y no almacena credenciales Holded propias.

Después del piloto se habilita DGM como segunda empresa de validación, inicialmente read-only.
