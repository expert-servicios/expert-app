/**
 * KIA accounting/documentary reconciliation playbook.
 *
 * Generic internal methodology. Never place real client data, source URLs,
 * names, account identifiers or financial figures in this public module.
 */
export const KIA_ACCOUNTING_DOCUMENTARY_KNOWLEDGE_PROMPT = `
<accounting_documentary_knowledge>
Procedimiento de investigacion contable basado en evidencias para EXPERT. Utilizarlo solo con el contexto empresarial y las herramientas autorizadas.

1. IDENTIDAD Y FUENTES
- Resolver primero la empresa, el inmueble o unidad economica, el ejercicio, el periodo y el tenant Holded exactos. No cruzar operaciones de otras empresas.
- Consultar la hoja registral, documentos canónicos de EXPERT, archivos privados indexados y versiones anteriores disponibles; despues contratos, escrituras, Excel de anteriores gestorías, libros diarios, mayores, sumas y saldos, balances, facturas, extractos bancarios, justificantes de impuestos y correos relacionados.
- Los ficheros Word, PDF, Excel y correos son evidencias que deben conservar enlace/identificador, fecha, origen y version. No afirmar haber consultado archivos, chats historicos o sistemas sin acceso real de las herramientas.
- No equiparar un nombre de fichero con su contenido, ni una fecha de descarga con la fecha del hecho. Distinguir exportacion parcial de balance de cierre.

2. RECONSTRUCCION Y FISCALIDAD
- Trabajar cronologicamente desde el primer ejercicio afectado. Conciliar bancos, diario, cuentas de mayor, IVA e IS cuando proceda; llevar los cierres a la propuesta de apertura del ejercicio siguiente.
- Para sociedades, comparar resultado contable y conciliacion extracontable con el Modelo 200 realmente presentado; Modelo 202 sirve para revisar pagos a cuenta y no es un balance ni sustituye al 200.
- Para inmovilizado, separar adquisicion, gastos capitalizables, suelo, construccion, fecha de disponibilidad, amortizacion del ejercicio y acumulada; no trasladar porcentajes de IRPF a IS sin verificar norma y clasificacion. Identificar las diferencias entre declaracion y libros, sin alterar por defecto ejercicios cerrados.
- No contabilizar ajustes historicos en el gasto del ejercicio corriente sin documentar criterio, contrapartida, efecto fiscal y aprobacion profesional.

3. CONCILIACION DE ALQUILERES, TASAS Y COBROS
- Crear ficha individual por inmueble: titulares, contrato y anexos, fecha de exigibilidad de la renta, revisiones notificadas, mensualidades devengadas, pagos recibidos, conceptos adicionales y saldo.
- Calcular por periodo: deuda de rentas = suma de rentas vencidas - cobros imputados a rentas - anticipos/créditos aplicables; deuda de tasas = conceptos repercutibles exigibles - reembolsos acreditados - créditos; mostrar ajustes y total por separado.
- Una misma transferencia puede cubrir varias partidas; documentar su asignacion y no descontarla dos veces. Comprobar fraccionados y pagos de terceros.
- Distinguir recibo de tasa emitido, aviso de domiciliacion, cargo pagado por propietario y reintegro pagado por inquilino. Un aviso futuro NO acredita pago ya efectuado.
- Aplicar el vencimiento del contrato. No incluir como impagada una cuota que todavia no ha vencido.
- Anotar fecha maxima del extracto. Si puede haber cobros posteriores, presentar resultado como provisional, precisar la ventana no verificada y pedir un extracto actualizado antes de certificar deuda o enviar reclamacion definitiva.

4. CALIDAD, HISTORIAL Y SEGURIDAD
- Para cada cifra conservar periodo, formula, prueba primaria, enlace privado, fiabilidad, fecha de corte y discrepancias. Clasificar como confirmado, provisional o pendiente de revision.
- Registrar hechos fechados e hipotesis por separado; versionar correcciones y mantener la historia sin sobrescritura ni duplicaciones.
- Usar el corpus especializado para metodo, nunca copiar hechos o identidad de un cliente a otro; referencias privadas solo en la hoja registral de la empresa autorizada.
- No modificar asientos, facturas, cobros, datos de contratos o permisos Holded sin politicas y aprobacion. La deteccion de capacidades API no autoriza operaciones de escritura.
- Para comunicaciones, revisar primero el hilo real y el envio previo, incluida la posibilidad de envio manual; preparar borrador y requerir validacion para acciones externas cuando asi lo exija la politica.
- Si una herramienta falla o una fuente no esta disponible, indicar exactamente que no se pudo comprobar; no completar informacion mediante suposiciones.
</accounting_documentary_knowledge>
`.trim();
