# KIA Accounting — Controller financiero operativo

Fecha: 02/10/2026

## Objetivo

Separar la operativa contable y financiera de EXPERT del sub-agente tecnico de Holded.

KIA sigue siendo la unica interfaz visible. El orquestador deriva cada consulta al especialista adecuado:

- `holded`: conexion, permisos, readiness, incidencias tecnicas y configuracion.
- `accounting`: facturacion, cobros, pagos, conciliacion, pendientes, anomalias y cierres.
- `fiscal`: tratamiento tributario, modelos, retenciones e interpretacion fiscal.

## Alcance inicial de KIA Accounting

### Lectura y diagnostico

Accounting debe poder:

- revisar facturas emitidas y recibidas;
- detectar facturas vencidas, parcialmente cobradas o sin evidencia de cobro;
- detectar documentos pendientes de contabilizar;
- revisar saldos y conciliacion cuando el dato exista;
- detectar duplicados, importes incoherentes y documentos sin mapping;
- revisar diario y cuentas contables;
- preparar resumen de pendientes de cierre;
- detectar pagos/cobros sin factura asociada;
- detectar factura sin pago asociado;
- detectar discrepancias EXPERT / Stripe / Holded / banco.

### Facturacion

Accounting podra:

1. leer factura y estado;
2. preparar borrador de factura;
3. preparar factura rectificativa / abono;
4. preparar propuesta de anulacion/correccion;
5. comprobar que exista causa y trazabilidad;
6. enviar la operacion a aprobacion humana cuando tenga efecto contable o legal.

No debe:

- borrar una factura emitida silenciosamente;
- eliminar asientos para ocultar una correccion;
- marcar documentos como cobrados sin evidencia;
- finalizar documentos legales de forma autonoma mientras la politica de permisos no lo autorice.

### Cobros e impagados

Accounting debe mantener una cola operativa:

- pendiente;
- vence pronto;
- vencido;
- reclamacion 1;
- reclamacion 2;
- escalado humano;
- acuerdo de pago;
- cobrado;
- incobrable/cierre manual.

Para cada impagado podra:

- identificar cliente y factura;
- calcular antiguedad;
- comprobar comunicaciones anteriores;
- preparar recordatorio;
- preparar requerimiento de pago;
- crear tarea interna;
- proponer reunion o llamada;
- registrar la siguiente accion.

El envio automatico debe estar protegido por una politica especifica y auditable.

### Pagos

Accounting podra:

- leer pagos registrados;
- detectar pagos sin asociacion;
- proponer conciliacion;
- crear tareas internas;
- preparar instrucciones de pago.

Nunca debe ejecutar movimiento de dinero de forma autonoma.

## EXPERT como primera empresa operativa

La primera implantacion real debe ser la contabilidad de EXPERT ESTUDIOS PROFESIONALES, S.L.U.

Panel recomendado:

### Hoy

- facturas por emitir;
- facturas vencidas;
- cobros pendientes;
- pagos pendientes;
- documentos sin contabilizar;
- conciliaciones pendientes;
- incidencias;
- tareas financieras.

### Este mes

- facturacion;
- cobrado;
- pendiente de cobro;
- gastos;
- margen;
- impuestos estimados;
- documentos pendientes;
- cierre del mes.

### Alertas

- factura vencida;
- cobro recibido sin factura/mapping;
- factura duplicada;
- gasto sin justificante;
- saldo bancario no conciliado;
- documento con tratamiento fiscal dudoso;
- suscripcion Stripe sin factura Holded enlazada;
- cancelacion solicitada sin documento correctivo.

## Matriz de permisos

| Accion | Nivel | Politica inicial |
| --- | --- | --- |
| Leer facturas / diario / cuentas | R1 | Autonomo |
| Analizar anomalias | R1 | Autonomo |
| Crear tarea interna | R1 | Permitido segun policy |
| Preparar email de cobro | R1 | Borrador |
| Crear borrador factura Holded | R2 | Confirmacion |
| Preparar rectificativa | R2 | Confirmacion |
| Registrar cobro | R3 | Revision humana |
| Enviar requerimiento de pago | R3 | Revision humana inicial |
| Finalizar/emitir documento | R3 | Revision humana |
| Cancelar/anular con efecto legal | R4 | Revision humana obligatoria |
| Ejecutar pago bancario | R5 | No habilitado |
| Borrar asiento/factura | R5 | No habilitado |

## Integracion Holded actual

Ya disponible:

- facturas;
- contactos;
- cuentas;
- diario;
- tesoreria/balance segun tenant;
- documentos;
- borrador de factura.

Pendiente de exponer de forma controlada:

- pagos;
- conciliacion ampliada;
- rectificativas como accion especializada;
- actualizacion de estado documental;
- anulaciones/cancelaciones;
- reglas de reclamacion de deuda;
- ejecucion de recordatorios;
- cierre contable guiado.

## Siguiente fase tecnica

1. Mantener lectura financiera en R0/R1.
2. Crear herramientas KIA explicitas:
   - `get_accounts_receivable`
   - `get_accounts_payable`
   - `get_overdue_invoices`
   - `get_unreconciled_transactions`
   - `draft_payment_reminder`
   - `draft_credit_note`
   - `create_holded_invoice_draft`
3. Añadir `accounting_write` como capability separada de `holded_read`.
4. Aplicar confirmacion humana por risk tier.
5. Registrar toda accion financiera en decision log y audit log.
6. Implementar primero en la empresa EXPERT.
7. Extender despues a empresas cliente con aislamiento estricto por `company_id`.

## Principio de diseño

Holded es el ERP / libro operativo.

EXPERT App es la capa de contexto, control, alertas y workflow.

KIA Accounting es el controller inteligente que detecta lo que falta, propone la siguiente accion y ejecuta solo aquello que la politica permita.


## Fase 2 implementada — 03/10/2026

Primera superficie operativa segura:

- `get_accounts_receivable` — R1 read;
- `get_accounts_payable` — R1 read;
- `get_overdue_invoices` — R1 read;
- `get_unreconciled_transactions` — R1 read, resultado derivado y marcado como tal;
Esta fase queda deliberadamente en solo lectura (`accounting_read`). Los borradores de reclamación y rectificativa pasan a la siguiente fase, donde tendrán una ruta Admin explícita y aprobación humana.

Ninguna herramienta de esta fase ejecuta pagos, envía reclamaciones, crea rectificativas en Holded, borra documentos ni altera asientos.

Para la empresa legal EXPERT (CIF canónico de `EXPERT_IDENTITY`), KIA Accounting utiliza la cuenta global de Holded configurada con `HOLDED_API_KEY`. Para cualquier otra empresa, el acceso continúa aislado por `client_integrations` y sus permisos habilitados.


## Actualización operativa — 08/10/2026 (PR #668, #669 y #670)

### Cerrado y fusionado

| Entrega | Estado | Evidencia |
| --- | --- | --- |
| Método contable documental de KIA | Fusionado | PR #668 — validación de fuentes, modelos fiscales y conciliación |
| Holded v2: detección de permisos de consulta | Fusionado | PR #669 — GET plan contable y pagos; escrituras no activadas |
| KIA: propuestas de asientos no contabilizadas | Fusionado | PR #670 — validación de partidas, fuentes, fecha y revisión humana |

La herramienta `prepare_journal_entry_proposal` devuelve un resultado `pending_human_review`, sin envío a Holded y sin registro persistente. **No es todavía una bandeja de aprobaciones.**

### Plan actualizado, priorizado

| Fase | Objetivo | Criterio de cierre |
| --- | --- | --- |
| 3A — Consulta contable autorizada | KIA Admin consulta plan de cuentas y asientos de un periodo con token v2 de la empresa exacta | Paginación, rango explícito, permisos efectivos, prueba de aislamiento por empresa y consultas GET sin efectos |
| 3B — Bandeja de propuestas | Guardar propuestas con empresa, debe/haber, justificantes, estado, autor y revisión | RLS, historial, prevención de duplicados, API Admin y pruebas de aprobación/rechazo |
| 3C — Saldos y conciliación histórica | Comparar diario completo y saldos por cuenta con bancos, facturas y cierres 2023-2025 | Señalar periodos incompletos, documentar fuentes e inconsistencias, no afirmar balance certificado desde una sola página API |
| 4 — Escritura supervisada | En un tenant piloto explícito, crear asientos después de aprobación | Scope write efectivamente verificado, periodo abierto, idempotencia, doble validación, auditoría; sin borrados automáticos |
| 5 — DGM 2026 | Regularizar apertura y comenzar explotación controlada | Reconstrucción 2023-2025 y conciliación con IS 200, asiento de apertura aprobado; levantar bloqueo solo con autorización independiente |

### Decisiones inalterables hasta autorización

- DGM continúa en `read_only` y `accounting_write_blocked=true`.
- Una API key Holded con acceso total **no anula** el permiso efectivo de EXPERT ni los controles por empresa.
- No usar una conexión Holded genérica para acceder a DGM: resolver integración de `client_integrations` por `company_id`.
- Lectura del diario con `startDate` y `endDate` explícitos; `has_more=true` impide marcar un mayor como completo.
- Toda corrección histórica exige trazabilidad, justificación contable/fiscal y revisión humana.
- Las pruebas de CI y los dos despliegues Vercel son obligatorios antes de fusionar.


## Revisión de seguridad y plan de pruebas — 08/10/2026, PR #673

### Estado implementado
- PR #668: método de reconstrucción documental; PR #669: permisos de lectura Holded v2; PR #670: validación de propuestas; PR #671: consultas contables v2; PR #672: bandeja de propuestas y eventos de auditoría. Estas PR ya están fusionadas.
- PR #673: servicio compartido \`saveKiaJournalInboxProposal\` para almacenar propuestas validadas desde la **API Admin autenticada** en \`kia_journal_proposals\` y recuperar duplicados por \`(company_id, fingerprint)\`.
- Tras la segunda revisión, **KIA NO dispone de herramienta LLM \`save_journal_entry_proposal\`**. Una marca \`requiresHumanApproval\` en el catálogo no equivale a una confirmación inequívoca del usuario. El guardado debe permanecer fuera de la ejecución autónoma.
- La herramienta \`prepare_journal_entry_proposal\` sigue siendo solo cálculo y validación; devuelve \`pending_human_review\`, sin persistencia ni llamadas Holded.
- La API \`POST /api/admin/empresas/{id}/propuestas-contables\` exige sesión EXPERT y rol owner/admin, resuelve la empresa desde la ruta y valida que existe antes de guardar. Nunca toma el identificador de empresa desde un argumento de KIA.
- La bandeja \`CompanyJournalProposalsPanel\` muestra propuestas y permite aprobar/rechazar internamente. **La interfaz actual no incorpora todavía un botón/formulario para guardar una propuesta generada por KIA**; el POST del Admin es el único ingreso disponible en esta etapa. No anunciar un flujo extremo a extremo hasta probarlo.
- La aprobación interna actualiza \`status\` y genera evento de auditoría, **pero no escribe, modifica ni elimina asientos de Holded**.

### Matriz de pruebas obligatorias

| ID | Prueba | Criterio de aceptación |
| --- | --- | --- |
| T01 | Compilación, tipado y lint de PR #673 | CI y ambos despliegues de Vercel en verde |
| T02 | Visibilidad de herramientas IA | \`save_journal_entry_proposal\` no existe en catálogo ni executor LLM; \`prepare_journal_entry_proposal\` permanece |
| T03 | Control Admin y aislamiento por empresa | POST/PATCH/GET accesibles exclusivamente por sesión válida owner/admin y \`company_id\` resuelto por ruta/contexto |
| T04 | Asiento equilibrado | Suma Debe = Haber en céntimos, fecha válida, al menos dos líneas y soporte documental |
| T05 | Asiento inválido | Falta de fuentes, fecha errónea, descuadre o importes no válidos se rechazan sin insertar |
| T06 | Idempotencia | Segundo guardado del mismo documento/empresa devuelve ID de propuesta existente sin duplicar eventos |
| T07 | Revisión | Transición de pendiente a aprobado/rechazado crea evento; modificación posterior o segunda revisión se rechaza |
| T08 | Seguridad de BD | RLS, privilegios no públicos, acceso exclusivo mediante API del servidor |
| T09 | Reversión | Las pruebas transaccionales dejan tablas de propuestas y eventos con los conteos iniciales |
| T10 | No efectos en Holded | No invocaciones POST/PATCH/DELETE de Holded; bloqueo contable de DGM permanece activo |
| T11 | E2E con sesión Admin real | Crear, consultar y revisar propuesta ficticia desde EXPERT; pendiente hasta ejecutar con autenticación en interfaz |

### Procedimiento para pruebas con datos sensibles
1. Utilizar exclusivamente empresa y usuario Admin autorizados y propuesta ficticia sin documentos de clientes.
2. En pruebas SQL usar transacción o subtransacción con rollback; comprobar que no quedan filas.
3. Comprobar el bloqueo \`company_operational_controls.accounting_write_blocked\` para DGM antes y después.
4. No mostrar credenciales, archivos privados ni datos personales de inquilinos en repositorio o logs.
5. No fusionar PR con CI rojo, ni afirmar que la bandeja es operativa extremo a extremo sin T11.

### Siguiente desarrollo
Añadir a Company 360 una acción explícita \`Guardar propuesta preparada\` con confirmación visible por Admin (mostrando fecha, empresas, líneas, importe y justificantes). La acción debe llamar al POST autenticado, no a un tool autónomo de KIA, y permitir revisar/rechazar antes de una fase separada de contabilización supervisada.
