# Holded v2 - permisos y despliegue gradual de KIA (2026-10-08)

## Tres niveles distintos
1. El token Holded concede scopes granulares. Un GET exitoso no prueba permiso de escritura.
2. EXPERT detecta recursos con GET limitados y cruza las autorizaciones del operador.
3. KIA aplica controles por empresa y no debe mezclar tenants. Un token full-access NO deroga un bloqueo operacional.

## Alcances de lectura bajo prueba
- Contactos: GET /api/v2/contacts
- Facturas: GET /api/v2/invoices
- Compras: GET /api/v2/purchases
- Diario: GET /api/v2/ledger-entries
- Plan contable: GET /api/v2/accounting-accounts
- Pagos: GET /api/v2/payments
- Bancos: GET /api/v2/treasury/accounts y movimientos por cuenta
- Impuestos: GET /api/v2/taxes

Referencia oficial: https://developers.holded.com/reference
Scopes habituales: accounting:chart-of-accounts.read; accounting:daily-ledger.read; accounting:payments.read; accounting:banks.read; accounting:purchases.read; sales:invoices.read. La disponibilidad se verifica por endpoint y version.

## Escrituras previstas pero no autorizadas
- Crear asiento: POST /api/v2/ledger-entries. No asumir PUT/PATCH para editar.
- Eliminar asiento: DELETE /api/v2/ledger-entries/{id}, solo si expresamente autorizado y nunca automatico.
- Crear cuenta: POST /api/v2/accounting-accounts.
- Facturas, compras y conciliacion: autorizaciones de escritura especificas por modulo.
No lanzar POST de prueba para descubrir permisos: tendria efectos. Antes de escribir se exigen esquema oficial, validacion de partida doble, periodos abiertos, idempotencia, aprobacion humana y auditoria.

## DGM
Integracion advisor_managed, v2, ultimo test 08/10/2026 satisfactorio. Mantener read_only y company_operational_controls.accounting_write_blocked=true. No modificar credenciales, contratos o contabilidad.

## Roadmap
Fase 1: ampliar pruebas GET de plan contable y pagos; conservar los permisos de escritura forzados a false.
Fase 2: añadir lectura de mayores, saldos y propuestas internas de asientos con referencias a las fuentes.
Fase 3: gateway de escritura supervisada en tenant piloto explicito, sin borrado, con aprobacion humana y doble validacion.
DGM: no activar escrituras hasta auditar apertura 2026 y aprobarlas de forma expresa.