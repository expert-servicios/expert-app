# EXPERT / KIA — lectura bancaria y conciliación Holded multiempresa (backlog futuro)

**Decisión:** 09/10/2026. **Estado:** DOCUMENTADO, NO IMPLEMENTAR AHORA. **Prioridad actual:** finalizar reseñas de expertconsulting.es, PR #675, y solicitud de valoración de Vyacheslav sobre la fase de presentación de la nacionalidad de Ruslana. **No ejecutar escrituras bancarias o contables ni crear cron de conciliación en esta fase.**

## Objetivo

Reutilizar para todos los clientes con integración Holded autorizada la capacidad de ver bancos, movimientos, cobros y pagos, cruzarlos con facturas de venta/compra, detectar discrepancias y enviar avisos contextualizados a KIA y al gestor. Entregar una vista compacta, interactiva y filtrable desde Company 360 / Cliente 360 con accesos al registro original, no otra aplicación o CRM.

### Separación imprescindible de empresas y tenants

- **EXPERT Asesorías:** cuenta de asesoría usada para contabilidad de clientes como DISEÑO GLOBAL MERIDIANO y, cuando se vincule, ALVILS ESP; no equivale a la contabilidad propia de EXPERT.
- **Expert Consulting:** tenant que contiene la contabilidad propia de **EXPERT ESTUDIOS PROFESIONALES, S.L.U.**; la conexión de EXPERT en Company 360 debe utilizar su ficha canónica y jamás datos de Empresa Demo.
- **Clientes con tenant individual:** leer solo el tenant y empresas expresamente autorizados por el cliente.
- Resolver la entidad canónica (CIF/NIF, empresa, client_integration_id, tenant y permisos) antes de consultar o asociar ningún movimiento. Prohibido cruzar información de tenants por coincidencia de nombre o email.
- En tenants de asesoría que gestionen varias entidades, preservar atribución estricta por compañía y validar que la API y el documento permiten distinguirlas antes de ofrecer conciliación.

## Capacidades previstas, por etapas

**Fase 0 — Inventario y consentimiento**
- Inventario de integraciones Holded activas por cliente/empresa, tipo de licencia, permisos detectados/habilitados, cuenta y fecha real de última sincronización.
- Identificar cuentas de tipo bank, card, gateway y cash; consentimiento de acceso bancario/documental y nivel de permisos por cliente; visualizar ausencias o caducidad sin asumir que cero cuentas equivale a banco desconectado.
- Establecer reglas de tratamiento RGPD, conservación, minimización, cifrado, registro de acceso y prohibición de mostrar IBAN completo fuera de pantallas autorizadas.

**Fase 1 — Lectura bancaria fiable y reconciliación propuesta**
- GET read-only de cuentas bancarias y movimientos (fecha contable/valor, importe, moneda, descripción, referencia, saldo si existe, origen y estado de conciliación); paginación, incrementales e idempotencia.
- GET de pagos y facturas emitidas/recibidas, notas de crédito y cobros para crear un conjunto de fuentes verificables; histórico auditable con última sincronización y estado de fuente.
- Motor de coincidencia sugerida por importe, divisa, fecha, contrapartida, número de documento, referencia bancaria y pago parcial; distinguir coincidencia exacta, probable, parcial, dudosa, y no asociada.
- Evitar una inferencia automática de 'pagado' ante un email, una factura emitida o una coincidencia ambigua. La conciliación confirmada solo se declara si Holded/banco devuelve correspondencia verificada.
- Diferenciar gasto devengado, factura, pago iniciado, movimiento bancario, conciliado, devolución y deuda pendiente. Soportar múltiples pagos por factura y cobros agrupados.
- Alertas de facturas vencidas sin movimiento, movimientos sin factura, importes distintos, duplicados, transferencias internas, cargos devueltos, pagos a proveedor recurrente y sincronización detenida.
- La vista Company 360 podrá filtrar por empresa, banco, fecha, conciliación, proveedor, moneda y expediente; exportar Excel autorizado con trazabilidad.

**Fase 2 — KIA contable con acciones supervisadas**
- KIA produce resumen diario/semana de excepciones y acciones sugeridas con enlace directo a factura y movimiento; evita alarmas antiguas ya regularizadas.
- La propuesta de asiento, asignación o conciliación será revisable por un humano, mostrando documentos de soporte y explicación, nunca ejecutada silenciosamente.
- Enviar avisos al responsable de la empresa (y notificación push Admin cuando proceda), con política anti-duplicados y severidad; comunicaciones al cliente solo según autorización y contexto.
- Si se habilita escritura en el futuro: alcance explícito por tenant y operación, idempotencia y simulación previa, aprobación humana, límites de importe, audit log, rollback cuando exista y bloqueo de periodos cerrados. Prohibidas modificaciones de históricos financieros por defecto.

**Fase 3 — Integración de gastos de software / IA**
- En EXPERT propia, contrastar cargos OpenAI API, ChatGPT Business, Anthropic, Gemini/Google Cloud con sus facturas y con movimientos bancarios; distinguir API vs suscripción.
- Incluir también proveedores recurrentes de clientes cuando el contrato y la autorización permitan su control.
- La API de costes de un proveedor no certifica por sí misma un pago; usar además dato bancario, factura y estado real de suscripción si está accesible.

## UI futura (no implementar ahora)

- Vista compacta 'Bancos y conciliación' en ficha 360, una fila por movimiento; cuentas como filtros, resumen de pendientes y última sincronización.
- Pulsar proveedor abre ficha de proveedor, pulsar factura abre factura, pulsar movimiento abre conciliación/documento, pulsar banco abre su libro; mantener entidad/filtros.
- Botones contextuales según rol: ver, descargar, vincular, proponer conciliación, marcar para revisión, crear tarea, exportar Excel. Conciliar/escribir/borrar únicamente con permiso y confirmación.
- El panel de KIA será colapsable; no debe tapar tablas. Evitar grandes tarjetas y desplazamiento vertical largo.

## Riesgos y medidas preventivas

- Cero registros devueltos por el plugin Holded de ChatGPT **no prueba** cero registros en la conexión empresarial de EXPERT App; son ámbitos de autorización distintos.
- Una integración con bankAccounts/bankMovements=true y last_success_at **no prueba** sincronización bancaria; debe leerse cuenta real y su synced_at.
- Movimiento pendiente no implica factura impagada: puede existir pago por otra cuenta, en proceso, por tarjeta o agrupado.
- Prohibido automatizar escrituras de prueba. Nunca reescribir asientos antiguos, ni eliminar historial de conciliación, ni mezclar datos de DGM/ALVILS/EXPERT.
- Consultas y datos company-scoped, RLS y RBAC servidor, secretos cifrados, logging seguro sin IBAN completo ni referencias sensibles; controles de exportación.

## Criterios de aceptación antes del despliegue futuro

1. Conexión correcta a EXPERT propia devuelve bancos y fecha synced_at verificable; si la fuente responde cero, la UI declara 'sin datos disponibles' sin inventar estado.
2. DGM y EXPERT propia ven conjuntos disjuntos de movimientos; ALVILS no hereda los bancos de DGM.
3. Una factura con dos pagos parciales muestra saldo correcto; un cargo duplicado no se concilia automáticamente.
4. Factura pagada después de un email de fallo deja de provocar una alerta por deuda anterior.
5. Movimientos sin factura generan propuestas/revisión, no escrituras automáticas.
6. Cada operación y exportación se audita; roles sin permiso no visualizan datos bancarios.
7. Pruebas unitarias, integración, datos simulados multitenant, CI, Vercel, Security Advisor y pruebas manuales con usuario de asesoría antes de activar en clientes.

**No crear PR funcional ni modificar datos por este documento. Reanudar solo cuando la dirección lo priorice tras cerrar la PR #675 y el correo a Vyacheslav.**
