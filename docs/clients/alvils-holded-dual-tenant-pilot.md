# ALVILS ESP — piloto de migración contable y formación de KIA

Estado: procedimiento aprobado por administradora, **no ejecutado**. Fuente contable única: tenant Holded de origen, no archivos Excel manuales antiguos.

## Seguridad

- Empresa canónica EXPERT: ALVILS ESP, S.L.U., B56305501; usar su integración `provider=holded` existente como **origen**. No usar la conexión nativa Holded de ChatGPT (tenant laboratorio).
- Guardar token **destino** exclusivamente en campo Admin seguro, cifrado en servidor, como conexión temporal `provider=holded_migration`, sin reemplazar secreto origen. Nunca recibir tokens por chat, log, repositorio o texto en Drive.
- Autenticación y autorización en servidor (`owner`/`admin`); validar roles, empresa, consentimiento y scopes. Durante el inventario, acceso exclusivamente de lectura.
- Exigir comprobación del tenant correcto: token distinto del origen, declaración explícita de cuenta vacía e identidad fiscal de ALVILS verificada por fuente autorizada antes de cualquier escritura.

## Secuencia de aprendizaje / prompts KIA

1. **Detectar origen**: resolución de empresa por NIF y `company_id`. Comprobar `provider=holded`, estado activo, permisos lectura, sin cambiar su configuración.
2. **Inspeccionar apertura**: consultar diarios reales 2023, 2024, 2025 y 2026 vía API Holded V2 con cursores; localizar primer asiento por ejercicio, describir y sumar líneas Debe/Haber. No utilizar ni conciliaciones ni ajustes de Excel históricos como evidencia.
3. **Inventario completo**: plan contable, diario, facturas emitidas/recibidas, rectificativas, contactos, bancos, movimientos, pagos, activos, inmuebles y documentos fiscales. Registrar periodos y número de objetos por recurso, páginas/cursor y errores de scope.
4. **Congelar evidencia**: exportaciones y justificantes, índices por ejercicio, hashes, fechas y enlaces a documentación; originales inmutables.
5. **Conectar destino separado**: introducir la clave mediante formulario de servidor, verificar lectura y datos básicos. Almacenar por separado; no activar KIA contra destino ni realizar sincronización hasta aprobación.
6. **Mapa de transformación**: decidir si Holded permite transferencia de tenant a modalidad asesoría sin importación; si no, mapear cuentas, contactos, ejercicios y facturas. Evitar duplicar contabilización de facturas y asientos.
7. **Ensayo y conciliación**: saldos de apertura/cierre de todas las cuentas, cuentas de tercero, IVA y retenciones por trimestre, impuestos y bancos, bienes y amortizaciones; comparar con Modelo 200 de cada año, Modelo 303 presentado y documentación.
8. **Corte supervisado**: aprobar reconciliación, ejecutar cambio auditable y reversible, comprobar continuidad de KIA y solo entonces cancelar licencia antigua.

**Bloqueos actuales a 10/10/2026:** token destino aún no guardado, ningún dato exportado del diario origen mediante EXPERT, ni conciliación realizada; interfaz de migración no desplegada. Los Excel archivados bajo `99_EXPERT_ALVILS_Excel_Historicos_NO_CONTABLES_NO_KIA_2026-10-10` están fuera del alcance de migración.

## Reglas que KIA debe aplicar siempre

Cuando respondas sobre contabilidad de ALVILS, identifica el tenant y devuelve fuente, ejercicio, fechas, número de registros y si la consulta fue paginada de forma exhaustiva. Nunca equipares una prueba de scopes con revisión de asientos. Distingue fuente Holded real, declaración oficial presentada, documentación probatoria e información histórica no fiable. Toda anomalía requiere referencia a asientos reales y justificación antes de sugerir una corrección. No escribas, no canceles y no anuncies migración terminada sin prueba posterior verificable.
