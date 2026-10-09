# EXPERT MCP — arquitectura y roadmap

## Estado de prioridad — 09/10/2026

**Reactivado por decisión de dirección el 09/10/2026, exclusivamente para un piloto controlado.** Reutilizar `apps/holded-mcp` y HoldedGateway; no activar puentes OAuth ni escrituras en producción sin pruebas de tenant, aprobación y rollback. La PR #682 se ha fusionado para validar el servidor MCP en CI.

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


## Anexo 09/10/2026 — piloto de copia contable y paridad MCP/KIA

**Escenario real:** EXPERT ESTUDIOS PROFESIONALES SLU es una sola persona jurídica. Su cuenta Holded con contabilidad real (Expert Consulting) está conectada a la aplicación EXPERT con integración API v2 `expert_account` y modo `read_only`. La cuenta Holded de asesoría prácticamente vacía está conectada mediante MCP oficial a ChatGPT, para pruebas. Estas conexiones **no comparten credenciales, tokens OAuth ni permisos**. No asumir que existen dos conectores nativos de ChatGPT.

**Decisión sobre la doble integración:** mantener una única integración Holded canónica productiva en `client_integrations` para la empresa, sin duplicar filas de `companies` ni seleccionar la conexión de prueba por CIF. El entorno de pruebas es una credencial/contexto de **laboratorio separado**, solo utilizable mediante endpoints protegidos y feature flag de prueba; no permitir fallback entre conexiones ni incorporarlo al dashboard financiero oficial. Si para automatizar KIA resulta imprescindible persistir ambas conexiones en EXPERT, diseñar después un `integration_environment`/alias con restricción única (company, provider, environment), selector explícito y pruebas antes de cambiar el modelo canónico. No crear una segunda entidad fiscal.

**Origen y destino:** Expert Consulting = solo lectura para extracción aprobada; cuenta Holded conectada al MCP nativo = destino sandbox. Antes de importar, comprobar identidad de ambas cuentas por una prueba de lectura no destructiva y verificar que el destino no contiene información fiscal real que pueda confundirse. El MCP propio `apps/holded-mcp` está inicialmente en modo standalone y dispone de lecturas y `create_invoice_draft` únicamente. `lib/integrations/holded/holded-v2-client.ts` es actualmente sobre todo lector. Ninguno constituye por sí solo un clonador contable.

**No replicar indiscriminadamente facturas originales:** una duplicación de facturas emitidas o asientos en una cuenta real de Holded puede generar numeración, obligaciones fiscales, VeriFactu, comunicaciones o conciliaciones erróneas. Primero crear una **copia lógica anonimizada** con etiquetas TEST y sin envío/validación fiscal ni datos personales, usando entidades ficticias y borradores no aprobados. La cuenta de destino debe ser formalmente apta para estas pruebas. Si no puede garantizarse, usar fixtures locales de integración en lugar de publicar documentos.

**Matriz de pruebas por etapas:**
1. Verificar perfiles/cuentas y permisos del MCP oficial; inventariar lecturas y escrituras realmente disponibles, sin deducir permisos de la mera presencia de la tool.
2. Leer muestra de origen (número de contactos, facturas, compras, mayor, saldos, impuestos y serie); extraer inventario/manifest con recuentos y checksums sin modificar origen.
3. Seleccionar dataset limitado y desidentificado que ejercite contactos, compras, ventas, pagos simulados, abonos y asientos; comparar capacidad de restauración y efectos en serie y reporting.
4. Crear primero contacto ficticio y borrador de factura por el MCP oficial (aprobación explícita) y verificar read-back. No enviar, aprobar ni contabilizar documento fiscal.
5. Implementar los mismos **servicios de dominio versionados** en HoldedGateway; compartirlos con KIA y EXPERT MCP mediante adapters, sin realizar operaciones externas por SQL, HTTP arbitrario ni prompts.
6. Para KIA, usar política **detected ∩ enabled ∩ actor grant ∩ environment**, con autorización en cada llamada, vista previa de diff, confirmación, idempotencia y log `integration_sync_events`. El usuario puede revocar permisos de lectura existentes; las escrituras deben permanecer desactivadas por defecto hasta añadir un catálogo supervisado por operación.
7. Ejecutar suite comparativa con mismo fixture en MCP nativo y KIA (listado, documento, contacto, draft, invalidación de permisos, retries y errores). Medir igualdad semántica, no igualdad de IDs generados.
8. Después, evaluar importación ampliada **solo si** el sandbox es legal/técnicamente seguro, existe copia de seguridad, plan de borrado y evidencia de no emisión ni envíos; nunca habilitar sincronización bidireccional hacia producción.

**Criterios:** cero escrituras sobre origen; ningún dato de prueba en dashboard cliente real; cero cruces de tenant; los cambios de permisos se reflejan en KIA; toda operación queda auditada; la conexión de prueba no se confunde con la canónica. No se ha iniciado ninguna copia o importación en este anexo.


## Aclaración de alcance aprobada 09/10/2026 — benchmark, no replicación de contabilidad

**Esta sección prevalece sobre el anexo de «copia contable» y cualquier referencia anterior que la presente como requisito.** La dirección ha precisado dos conexiones **con roles independientes**, no dos conexiones a ChatGPT:

1. **MCP nativo de Holded conectado aquí a ChatGPT:** cuenta de laboratorio vacía; sirve como **referencia funcional de comportamiento de sus herramientas y errores**, y para pruebas de lectura/escritura autorizadas en ese laboratorio.
2. **EXPERT App / KIA:** conexión propia API v2 \`expert_account\` a la cuenta Holded con contabilidad original de Expert Consulting; KIA debe alcanzar **paridad funcional** con las capacidades de Holded realmente disponibles y autorizadas para esta cuenta. No debe utilizar el token de la sesión ChatGPT ni conectarse necesariamente al mismo tenant del laboratorio.

**No es necesario copiar o clonar contabilidad para este objetivo.** Una importación sintética o desidentificada será, como mucho, un mecanismo opcional de pruebas de regresión si los casos reales del laboratorio son insuficientes y la operación está fiscalmente controlada. No mover cuentas, facturas, contactos, asientos ni datos personales desde Expert Consulting como paso por defecto. El laboratorio es el oráculo de contrato; la conexión KIA usa su fuente real.

**Sobre «acceso completo»:** la dirección indica que el usuario de ambos entornos dispone de todos los permisos de Holded, incluidos los administrativos. Esto es una afirmación sobre las **credenciales del proveedor**, no un estado de ejecución concedido automáticamente a KIA. Al revisar Supabase el 09/10, la integración EXPERT de la cuenta real figura \`sync_mode=read_only\` con flags de escritura apagados; el gateway v2 existente implementa principalmente lecturas. La herramienta MCP nativa de esta sesión expone herramientas de escritura (contactos, estimaciones y otras), pero **no expone herramientas para enumerar/crear/editar/revocar tokens y scopes**, por lo que no se puede validar programáticamente la administración de tokens con la superficie actual. No afirmar lo contrario.

### Objetivo de paridad (contratos, no replicación de tenants)

- Para cada acción relevante: \`native_tool\` / nombre y contrato → servicio común \`HoldedGateway\` → herramienta KIA / EXPERT MCP → nivel de riesgo, permisos, validación y read-back.
- Diferenciar **capacidad publicitada por el servidor**, **permiso existente en token**, **permiso consentido en EXPERT**, y **autorización de actor/operación**. Se permite diferir acciones de alto riesgo aunque el token técnicamente permita ejecutarlas.
- Para lecturas se comparan esquemas, filtros, paginación, cobertura, divisa y tratamiento de errores; para escrituras, primero contrato unitario sin proveedor, luego ensayo en laboratorio identificado, **y sólo después** aprobación específica de la operación real en KIA.
- Cambios de permisos desde dashboard: revocar / volver a habilitar lecturas ya concedidas al token, detectando en la próxima llamada que KIA deja de tener acceso. Si falta scope del token, KIA enlaza a los controles del proveedor, ya que no existe aquí una herramienta nativa de gestión de tokens.
- KIA debe mostrar herramienta faltante, razón del fallo, vínculo de configuración y estado de sincronización; **sin fingir que una respuesta del chat concedió un scope externo**.
- Las pruebas E2E autenticadas deben ser distintas: a) nativo ChatGPT en lab, b) KIA con rol de cliente/admin en su propio tenant; una prueba contra el nativo no demuestra que el backend de KIA funciona.

### Pruebas read-only verificadas en la sesión del 09/10/2026

El MCP nativo respondió con **0 facturas, 0 asientos del 01/10/2026 al 09/10/2026**, y reporte de uso de octubre **24/7.500** llamadas en el momento de la prueba. Esto **corrobora la disponibilidad de lecturas** de la conexión expuesta en ChatGPT, pero **no verifica identidad del tenant, permisos de escritura ni que esa cuenta esté enlazada a KIA**.

### Prioridad de implementación corregida

1. Completar la revisión de PR #690 y cerrar CI; el cambio de permisos ha de respetar el consentimiento sin reactivar toggles deshabilitados.
2. Crear matriz de correspondencia MCP nativo ↔ KIA/HoldedGateway y suite de contratos con respuestas sintéticas. No requiere segundo tenant ni clonación.
3. Añadir adaptadores write individuales sobre credenciales propias de KIA, con autorizaciones server-side, aprobación, idempotencia y auditoría. Nunca acceso global irrestricto.
4. Validar reversibilidad de permisos con token de prueba en entorno identificado; no desconectar/revocar tokens productivos para probar un caso.
5. Incorporar paridad en dashboards y KIA Work con despliegue gradual y verificación de actividad real.

**Estado actual:** documento ajustado. No se han habilitado escrituras, cambiado tokens, clonado contabilidad ni conectado el MCP nativo de ChatGPT al backend de KIA por la modificación de este plan.
