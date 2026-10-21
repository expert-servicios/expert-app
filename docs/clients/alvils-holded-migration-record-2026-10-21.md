# ALVILS — Registro del traspaso contable y aprendizaje para KIA

**Corte documental:** 21/10/2026.
**Tipo de entrega:** registro operativo y metodología; documentación únicamente.
**Identificador de continuidad:** `ALVILS-TRASPASO-20261021`.
**Estado de producto:** no modifica el checkpoint E0, las banderas, los permisos ni el runtime de KIA.

## 1. Alcance y separación documental

Este documento registra el trabajo realizado con ALVILS como caso piloto de migración y gestión contable supervisada: recopilación de fuentes, traslado de diarios, datos maestros, reconstrucción documental y bancaria, comprobación de declaraciones, revisión final y lecciones operativas.

El repositorio es público. La bitácora íntegra con cifras, números de asiento, identificadores de operaciones, fuentes privadas, contrapartes y comprobantes queda en el archivo privado de ALVILS, bajo el mismo identificador de continuidad. No se incorporan aquí PDFs, extractos, datos personales, credenciales, referencias internas de acceso ni enlaces al expediente privado.

La versión privada tiene 21 apartados: mandato, identidad y entornos, respaldo, diarios, contactos, inmueble, ventas/compras y banco por ejercicio, última conciliación, modelos trimestrales, retenciones e IS, segunda revisión, pendientes, mejoras, procedimiento KIA, estado real de EXPERT, evidencias y aceptación. Conserva los controles numéricos y los bloques exactos autorizados.

Este registro diferencia cuatro estados:

- **Ejecutado y verificado:** existe lectura posterior o comparación cuantitativa del resultado.
- **Preparado:** hay fichero, propuesta o código local, sin publicación ni ejecución acreditadas.
- **Pendiente original:** incidencia que ya existía en la fuente y se conserva identificada.
- **Pospuesto por Dirección:** siguiente actuación que dejó de ejecutarse al cambiar el encargo.

Un documento de diseño no acredita una funcionalidad operativa. Una migración cuadrada no certifica la corrección material de todos los criterios fiscales heredados.

## 2. Mandato y decisiones que condicionan el trabajo

1. Continuar desde un control guardado, sin reiniciar ni repetir cargas.
2. Incluir los contactos y completar el traslado operativo.
3. Reconstruir facturas y cobros/pagos, sustituyendo sus asientos importados identificados para evitar duplicar la contabilidad.
4. Trabajar mediante el navegador para las operaciones de Holded.
5. Confirmar de forma específica cada bloque de borrado definitivo.
6. Revisar primero 2025 y después 2026.
7. Comprobar la coincidencia trimestral con las declaraciones efectivamente presentadas.
8. Conservar 2025 como estaba: no alterar sus criterios, liquidaciones o declaraciones de IVA e IS para reproducir un cálculo automático del destino.
9. Dar una segunda pasada al diario, banco, cierre, apertura y documentación fiscal.
10. Incorporar el modelo de IS presentado cuando Dirección lo facilitó y resolver el cotejo que estaba pendiente.
11. Preparar el aprendizaje de gestión completa para KIA sin confundir conocimiento, herramientas disponibles y autorización efectiva.
12. **Última decisión:** elaborar primero este registro Markdown y subir la documentación al repositorio. Se posponen las nuevas modificaciones de ficha/hoja registral y la publicación de los cambios de runtime preparados.

La decisión de conservar un ejercicio prevalece sobre una propuesta anterior de recalcular sus modelos. Las propuestas anteriores se mantienen como historia, con su estado superado o no ejecutado.

## 3. Identidad y segregación de fuentes

Antes de leer o escribir se identificaron la empresa jurídica, el ejercicio, el tenant de origen y el de destino. La empresa canónica de EXPERT ya existía: no se creó otra por semejanza de nombre, contacto o dominio.

Se mantuvieron separados:

- ALVILS y sus contrapartes;
- entorno de asesoría y contabilidad propia de EXPERT;
- origen Holded y destino Holded;
- datos actuales y reconstrucciones históricas;
- ficha fiscal trasladada y certificación registral oficial;
- hoja registral KIA, como memoria operativa, y hoja mercantil oficial.

Las coincidencias de contacto o de persona relacionada no justifican compartir facturas, préstamos, bancos o acceso entre empresas.

## 4. Inventario, fuentes y respaldo

### Trabajo realizado

Se localizaron e inventariaron diarios, mayores, balances, cuentas anuales, declaraciones presentadas, documentos del inmueble, préstamo, facturas y movimientos bancarios. Se amplió el respaldo de originales y se calcularon huellas de contenido.

Se conservaron los archivos originales y las versiones con contenido distinto. La existencia de un nombre parecido o un texto extraído coincidente no se utilizó para declarar duplicación exacta.

Un mayor histórico parcial que omitía cuentas saldadas no se trató como diario completo. Se reconstruyeron ejercicios anteriores a partir de mayores, contrapartidas documentadas y soporte fiscal, dejando identificada la procedencia y la numeración reconstruida.

### Controles reutilizables

- Fecha del documento, fecha del hecho y fecha de descarga son magnitudes distintas.
- Un modelo de otra empresa o de otro ejercicio no suple el que falta.
- Un balance parcial no equivale al cierre anual.
- Una versión reconstruida no es una copia del diario original.
- La paginación debe agotarse; el recuento mostrado en una sola página no acredita integridad.
- La copia conservada debe existir y coincidir en contenido antes de utilizarla como respaldo.

## 5. Carga de diarios y protección frente a duplicados

Los diarios de los ejercicios incluidos en el traslado se cargaron una única vez, después de comprobar el estado del destino y de identificar las fuentes.

Después de cada carga se leyeron las páginas completas y se contrastaron fechas, cuentas, debe/haber, saldos y equilibrio de asientos. Las reconstrucciones históricas se distinguieron de los diarios completos recibidos.

Cuando se eligió reconstruir documentos operativos, no se superpusieron nuevas facturas y pagos a sus asientos existentes: se prepararon relaciones exactas por bloque, se guardó respaldo y se sustituyó únicamente el alcance aprobado.

La renumeración de Holded obligó a conservar la correspondencia por ejercicio, fecha, cuentas, importe y referencia; no se utilizó el número de asiento aislado como identidad estable.

## 6. Contactos, preferencias, banco e inmovilizado

### Contactos

Se trasladaron los contactos existentes y se cotejaron sus identificadores fiscales, tipo y cuentas asociadas. Las cuentas históricas que podían colisionar con el cliente se mapearon de forma explícita.

Se conservaron campos incompletos del origen sin inventar teléfonos o códigos postales. Las preferencias no vacías de compras y forma de pago se restituyeron y se comprobaron al reabrir.

### Ficha bancaria

Se corrigió la vinculación de la ficha al código contable ya existente. Una cuenta auxiliar creada por el sistema quedó sin utilizar; no se eliminó automáticamente por considerarla innecesaria.

### Inmueble

Se corrigió una descripción de unidad/local con apoyo documental y se mantuvieron coste, fecha, acumulada y neto. La configuración de la ficha se verificó por reapertura.

Los ejercicios históricos ya amortizados no se volvieron a contabilizar desde la ficha del activo. El ejercicio siguiente conservó el estado que tenía en origen.

Las discrepancias históricas de reparto suelo/construcción, coste, acumulada y memoria se registraron como cuestiones separadas. No se corrigieron para aprovechar el traspaso.

## 7. Reconstrucción operativa de ventas y cobros

Se prepararon las facturas por ejercicio, se aprobaron y se restauraron los cobros históricos, incluidos anticipos, cobros fraccionados y varias aplicaciones de una mensualidad cuando así constaba.

Antes de eliminar cada bloque se verificaron sus identificadores exactos y la selección de apuntes. Después se comprobó la conservación de los apuntes ajenos y la ausencia de diferencias financieras.

Se mantuvieron las fechas contables documentadas del origen, incluso cuando no coincidían con la emisión. Un ingreso que correspondía a una mensualidad posterior no se aplicó por segunda vez a una factura ya cobrada.

En un ejercicio fue necesario restituir la cuenta histórica de retenciones desde el mayor. Un impuesto específico preparado durante la investigación no se aplicó: el registro explica el ajuste realmente ejecutado y diferencia esa alternativa no utilizada.

**Control obligatorio:** la aprobación de la factura no demuestra su cobro; el cobro requiere su registro y evidencia. La coincidencia del total anual no acredita que se conserve la distribución temporal.

## 8. Reconstrucción de compras, pagos y adjuntos

Se prepararon las compras desde el soporte original y se recuperaron sus pagos y conciliaciones históricas, sin inventar un movimiento bancario para documentos cancelados contra socios.

Se conservaron gastos brutos del diario importado durante la reconstrucción. El desglose de base y cuota dentro de una misma cuenta de gasto produjo líneas adicionales sin aumentar el importe. Por ello se compararon agregados por fecha y cuenta, además de los controles de saldo.

Los documentos sin IVA permanecieron diferenciados. El tratamiento aplicado para preservar una migración no constituye criterio automático para nuevas operaciones: una cuota no deducida en una declaración no demuestra que sea legalmente no deducible.

Los originales existentes se adjuntaron y se comprobó su presencia. Cuando un recibo no tenía adjunto en origen se dejó constancia de ello, sin presentar un documento inventado como original.

Se registraron diferencias entre fecha del PDF y fecha contable. Los suplidos respaldados por otro documento no se duplicaron como gasto.

## 9. Extracto y conciliación bancaria

Se obtuvo el extracto original y se contrastó con la plantilla de importación. Se verificaron filas, identificadores, fecha valor, concepto, importe y continuidad de saldos.

La importación se realizó una sola vez. Las conciliaciones originales se recuperaron mediante enlaces a facturas/cobros/pagos o asientos manuales equivalentes, con bloques de sustitución independientes.

Se mantuvieron los pendientes que ya existían en origen; no se conciliaron por conveniencia para igualar banco y contabilidad. Su suma neta explicó la diferencia residual documentada.

### Dos fechas de una misma operación

La plantilla del banco admitía una fecha. Se conservó la fecha valor bancaria y se protegió por separado la fecha contable.

La última sustitución autorizada se utilizó como comprobación específica: respaldo, selección exacta, borrado acotado, nueva conciliación, edición de la fecha contable del asiento y lectura posterior de ambas fechas. Los apuntes ajenos y saldos se compararon otra vez.

### Diferencias que KIA debe reconocer

- Movimiento bancario frente a factura.
- Cobro frente a anticipo.
- Cancelación contra socios frente a pago bancario.
- Domiciliación prevista frente a cargo efectivo.
- Solicitud de devolución frente a ingreso recibido.
- Saldo contable al cierre frente a resultado de una declaración.

## 10. Fiscalidad presentada y segunda revisión

Se localizaron los justificantes presentados y se comprobaron identidad, ejercicio y período. La investigación tuvo un punto explícitamente pendiente cuando solo estaba disponible el IS de un ejercicio anterior; no se declaró completado ese cotejo.

Se contrastaron las liquidaciones trimestrales de IVA con los PDFs y con el diario final. Para los trimestres disponibles del ejercicio siguiente también se leyó el resumen fiscal del destino.

La revisión distinguió:

1. cuotas de ventas y compras;
2. cuotas efectivamente deducidas;
3. ajustes o compensaciones de la declaración;
4. liquidación contabilizada;
5. pago o devolución efectiva;
6. resultado que produciría un nuevo cálculo del módulo fiscal.

La coincidencia contable no se utilizó para afirmar que el módulo de modelos del destino reproducía automáticamente todas las casillas.

### Decisión de preservar 2025

Dirección dispuso conservar el ejercicio para evitar cambios en declaraciones de IVA e IS. Se mantuvieron los importes, fechas, cuentas, amortización y ajustes heredados; la propuesta previa de configurar modelos históricos no se ejecutó.

La segunda pasada incluyó nueva lectura íntegra del diario, comparación por fecha/cuenta/debe/haber, distribución trimestral, equilibrio de asientos, resultado anual, amortización neta, banco y enlace cuenta a cuenta con la apertura del ejercicio siguiente.

Se volvieron a comprobar las conciliaciones bancarias y los modelos de retenciones periódicos y anuales pertinentes.

### IS facilitado posteriormente

Cuando Dirección guardó el modelo presentado, se verificó su contenido, se conservó el PDF completo, se revisaron visualmente páginas relevantes y se contrastaron resultado, base, retenciones, resultado de autoliquidación y balance con el cierre trasladado.

El cotejo documental pendiente quedó resuelto en las magnitudes comprobadas. Se mantuvo la distinción entre devolución solicitada y cobrada. No se modificó la contabilidad ni se presentó otra declaración.

## 11. Mejoras aplicadas y mecanismos de control

| Mejora | Mecanismo aplicado | Criterio de verificación |
| --- | --- | --- |
| Respaldo y alcance | Fichero previo y relación exacta por bloque | Identificadores seleccionados iguales a los autorizados |
| Ausencia de duplicación | Una carga por diario/extracto y sustitución acotada | Comparación financiera antes/después |
| Recuperación operativa | Documentos y cobros/pagos enlazados | Estado documental y lectura de diario/banco |
| Integridad temporal | Emisión, contabilidad y valor diferenciadas | Comparación por fecha y trimestre |
| Desglose sin gasto nuevo | Agregación de base/cuota dentro de cuenta | Mismos importes por fecha/cuenta |
| Protección de terceros apuntes | Conjunto de identificadores ajenos | Ningún faltante ni modificación financiera |
| Datos maestros | Cuenta, preferencia y ficha reabiertas | Persistencia de valores guardados |
| Soporte documental | Originales adjuntos y hashes de respaldo | Presencia comprobada y procedencia conservada |
| Fiscalidad histórica | PDF, libro, liquidación y pago separados | Puente numérico y límites explícitos |
| Cierre y apertura | Comparación cuenta a cuenta | Saldos iguales con signo inverso |
| Continuidad | Controles por fase y estado final fechado | Los cortes antiguos no reemplazan la última lectura |

### Incidencias de interfaz resueltas

Hubo formularios en blanco, descargas pendientes de guardar y selectores de archivo que interrumpieron el control. Se observaron los estados y se solicitó asistencia puntual de Dirección cuando fue necesaria. No se contabilizó una acción intentada como realizada.

Cuando una pestaña dejó de responder se verificó el inventario del navegador y se recuperó la pantalla. No se obtuvieron secretos ni datos privados del navegador para suplir la interfaz.

## 12. Pendientes: migración frente a corrección de la fuente

El expediente privado conserva las operaciones pendientes, documentos ausentes, diferencias de fechas y cuestiones de inmovilizado, préstamo e intereses. No se publican aquí sus importes ni contrapartes.

La migración preservó esas situaciones y sus explicaciones. No se registraron gastos sin soporte, no se inventaron pagos y no se corrigieron ejercicios preservados como efecto lateral del traslado.

**Un cierre de migración histórico no equivale a:** cerrar el ejercicio corriente, resolver todas las incidencias de origen, validar el criterio material de cada declaración o completar las fases de producto de EXPERT/KIA.

## 13. Procedimiento reutilizable de gestión completa para KIA

### A. Preparación y contexto

Resolver la empresa autorizada, tenant, ejercicio y período; cargar la decisión vigente, la hoja registral y las fuentes; declarar el alcance y corte. Si no hay lectura real, registrar qué falta en lugar de inventarlo.

### B. Gestión contable ordinaria

Inventariar documentos y versiones; contrastar emisor/destinatario, fechas, cuentas y estado; detectar duplicados y documentos incompletos; comparar diario y mayores; preparar propuestas con soporte verificable.

### C. Conciliación

Relacionar documento, cobro/pago y extracto por identificadores. Separar anticipos, parciales, pagos de terceros y cancelaciones. Conservar un registro de asignación para impedir doble aplicación.

### D. Ajustes y regularizaciones

Cada propuesta debe incluir motivo, fuente primaria, ejercicio/trimestre, fecha, cuentas, debe/haber, efecto en resultado e impuestos, asientos afectados, respaldo, decisión requerida y control posterior. Diferenciar propuesta, aprobación, ejecución y readback.

### E. Revisión trimestral

1. Verificar cobertura documental y paginación.
2. Comparar por fecha/cuenta y trimestre, no solo por año.
3. Revisar bancos, clientes, proveedores, anticipos y retenciones.
4. Revisar inmovilizado, amortización y operaciones vinculadas cuando proceda.
5. Construir el puente fiscal de base, cuota, deducción, ajuste, liquidación y pago.
6. Separar modelo presentado de estimación o cálculo nuevo.
7. Elaborar acta con diferencias, pendientes y propuestas.
8. Aplicar la decisión profesional vigente y registrar la evidencia.

### F. Cierre anual

Revisar resultado, amortización, ajustes, impuesto y saldo final; comprobar el enlace con la apertura siguiente; proteger cierres y amortizaciones ya trasladados. El IS requiere su modelo presentado para acreditar el cotejo directo.

### G. Memoria y aprendizaje

Actualizar mediante herramientas autorizadas hechos, instrucciones y eventos con fuente, fecha, versión e idempotencia. Mantener el historial; no sustituir documentos por recuerdos libres. El corpus compartido recibe método y casos sintéticos; la hoja privada conserva los hechos de la empresa.

### H. Límites de ejecución

Una habilidad no concede permisos. El actor, canal, empresa, herramienta y política efectiva determinan lo que KIA puede ejecutar. No ampliar accesos, activar automatizaciones, borrar asientos, modificar datos financieros o presentar/rectificar declaraciones por el solo hecho de documentar el procedimiento.

## 14. Estado real de EXPERT y de KIA al terminar esta entrega

| Frente | Estado acreditado |
| --- | --- |
| Empresa canónica y raíz documental | Identificadas y comprobadas mediante conexión autorizada |
| Respaldo previo de ficha/hoja | Guardado antes de cualquier mutación nueva |
| Documentación reciente | Archivada en la carpeta privada existente |
| Nuevas notas/datos de ficha | Pospuestos por la última decisión de Dirección |
| Hechos/instrucciones/eventos/snapshot nuevos | Pospuestos; no se ejecutó escritura SQL en esos registros |
| Indexación completa del archivo en la plataforma | No acreditada por subir archivos a Drive |
| Ampliación de instrucciones contables | Preparada localmente; fuera de esta entrega documental |
| Pruebas de la preparación local | Cinco suites y treinta pruebas de contrato/autorización aprobadas |
| Despliegue o activación de nuevas capacidades | No realizados por esta entrega |
| Evaluación real de respuestas KIA con el caso | Pendiente; los tests de contrato no la sustituyen |

No se incorporan a este cambio los ficheros de runtime preparados. No se crea una nueva empresa, se cambia facturación, se desconecta una integración ni se ejecuta un nuevo cierre.

## 15. Casos de aceptación para la continuación

- Ejercicio preservado: no reabrirlo para imitar el cálculo de un modelo.
- Total anual igual pero trimestre diferente: detectar la discrepancia temporal.
- Más líneas por desglose: explicar y comprobar el agregado, sin asumir gasto nuevo.
- Factura cobrada y anticipo posterior: impedir doble imputación.
- Pago sin compra: no inventar documento, gasto o IVA.
- Cancelación contra socios: no crear banco ficticio.
- Devolución solicitada: no afirmar cobro efectivo.
- Falta de modelo presentado: mantener pendiente el cotejo directo.
- Contexto de otra empresa: denegar acceso y evitar hechos cruzados.
- Capacidad de lectura existente: no inferir permiso de escritura.
- Evento de hoja registral: conservar fuente y versión y evitar duplicarlo al repetir el proceso.
- Documento subido a Drive: no afirmar indexación o uso por KIA sin comprobarlos.

## 16. Próximos pasos, sin ejecución por este documento

1. Incorporar las decisiones y hechos del registro privado a la ficha y hoja registral canónicas, conservando historia y aislando la empresa.
2. Verificar los enlaces documentales y la indexación real, sin tratar una copia local como lectura de nube.
3. Revisar por separado los cambios de instrucciones de KIA preparados, con tests, evaluación y gates correspondientes.
4. Validar consultas reales del piloto con fuentes correctas, criterios de abstención y pruebas de aislamiento.
5. Tramitar las incidencias originales del ejercicio corriente con soporte y decisión profesional, sin tocar el ejercicio preservado por defecto.

## 17. Referencias de arquitectura y gobierno

- [Plan Maestro EXPERT/KIA](../expert-kia-ecosystem-master-plan-2026-10-10.md).
- [Cohorte piloto contable](kia-accounting-pilot-cohort-2026-10-10.md).
- [KIA Accounting](../kia-accounting-agent.md).
- [Hoja registral del cliente](../kia-client-ledger.md).
- [Archivo documental privado](../document-archive-runbook.md).
- Registro íntegro privado: `ALVILS-TRASPASO-20261021`, en el archivo de la empresa; no se publica en GitHub.

La ejecución futura debe respetar el checkpoint, las políticas efectivas y los gates del Plan Maestro. Publicar esta documentación no desbloquea fases ni acredita funciones en producción.
