# Holded MCP oficial — protocolo de pruebas sandbox

Fecha: 2026-10-05

## Objetivo

Usar la cuenta Holded vacía de asesoría como laboratorio seguro para:
- aprender capacidades reales del MCP oficial de Holded;
- validar operaciones de escritura sin riesgo contable;
- comparar lecturas con EXPERT HoldedGateway;
- convertir operaciones validadas en tools equivalentes de KIA/EXPERT MCP.

## Regla de seguridad

La cuenta sandbox NO es la integración canónica de EXPERT.

La cuenta real de EXPERT:
- se conecta a HoldedGateway;
- permanece read-only durante el piloto.

La cuenta vacía:
- se conecta directamente al MCP oficial de Holded;
- puede recibir permisos de escritura para pruebas controladas.

## Fase A — identificación

Confirmar:
1. nombre de empresa/tenant conectado;
2. usuario Holded que concedió autorización;
3. scopes/permisos efectivos;
4. módulos disponibles;
5. si el MCP expone separación read/write por tool.

No continuar si la identidad del tenant no es inequívoca.

## Fase B — lecturas base

Ejecutar y guardar fixture saneado de:
- contactos;
- facturas emitidas;
- compras/facturas recibidas;
- impuestos;
- series de numeración;
- plan contable;
- diario/asientos;
- tesorería/cuentas;
- movimientos bancarios si hay datos;
- proyectos si están disponibles;
- empleados solo si el sandbox tiene módulo laboral y se decide probar.

Para cada tool registrar:
- nombre;
- schema;
- paginación;
- filtros;
- campos devueltos;
- errores esperables;
- latencia aproximada;
- permisos requeridos;
- si la respuesta es completa o resumida.

## Fase C — dataset mínimo de prueba

Crear manualmente o mediante tools seguras:
- 1 contacto cliente: TEST EXPERT MCP CLIENTE;
- 1 contacto proveedor: TEST EXPERT MCP PROVEEDOR;
- 1 servicio/producto de prueba si procede;
- 1 cuenta/serie solo si Holded permite alta segura y reversible.

Usar prefijo `TEST EXPERT MCP` en toda entidad creada.

## Fase D — primera escritura

Primera write recomendada:
- crear factura de venta en BORRADOR;
- nunca aprobar/emitir automáticamente;
- importe pequeño ficticio;
- usar exclusivamente contacto/producto TEST.

Validar:
1. preview de argumentos;
2. confirmación explícita;
3. creación;
4. lectura posterior por ID;
5. estado realmente borrador;
6. numeración/serie;
7. importes e impuestos;
8. trazabilidad.

## Fase E — modificaciones

Solo después de validar D:
- modificar borrador si la tool oficial lo permite;
- comprobar cambios por read-back.

No probar todavía:
- borrado de documentos reales;
- conciliación;
- pagos;
- asientos históricos;
- emisión definitiva;
- nómina;
- operaciones fiscales irreversibles.

## Fase F — comparación A/B

Cuando la cuenta real EXPERT esté conectada al HoldedGateway en read-only:

Comparar MCP oficial vs HoldedGateway para:
- contactos;
- ventas;
- compras;
- impuestos;
- plan contable;
- diario;
- tesorería.

No comparar solo recuentos. Revisar:
- IDs;
- campos;
- fechas;
- signos;
- moneda;
- impuestos;
- paginación;
- estados;
- tratamiento de nulos.

## Fase G — traslado a EXPERT

Por cada operación validada:

1. definir contrato de tool EXPERT;
2. mapear a HoldedGateway;
3. añadir capability check;
4. añadir company scope;
5. añadir operational controls;
6. clasificar riesgo R0/R1/R2;
7. preview;
8. confirmación si write;
9. ejecución;
10. read-back;
11. audit log;
12. tests cross-tenant.

## Criterio para permitir escritura real

No activar writes en la contabilidad real de EXPERT hasta que:
- la operación funcione en sandbox;
- exista test automatizado;
- exista read-back;
- exista auditoría;
- exista bloqueo por company_id;
- exista control de permisos;
- exista confirmación explícita;
- se haya probado el fallo/reintento/idempotencia.

## Nomenclatura de fixtures

Toda entidad de laboratorio:
`TEST EXPERT MCP — <tipo> — <fecha>`

Ejemplo:
`TEST EXPERT MCP — Factura borrador — 2026-10-05`

Así se pueden localizar y limpiar fácilmente sin confundirlas con datos reales.
