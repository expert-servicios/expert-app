# Archivo documental: modelo, limpieza y continuidad

Actualizado: 5 de octubre de 2026. Modelo aprobado y aplicado en Google Drive. La vinculación de estas carpetas con las fichas de EXPERT y su uso integrado desde Kia quedan para una fase posterior; este documento no implementa esa integración.

Este repositorio es público. Los clientes, identificadores personales, enlaces privados, manifiestos y listados de documentos se conservan en el archivo privado de Drive y en la conversación de trabajo. Los ejemplos siguientes son genéricos.

## Punto de continuidad

La reorganización inicial y la limpieza están terminadas y verificadas. El archivo conserva 2.051 documentos de origen con contenido único; se retiraron 123 copias exactamente idénticas, se renombraron 1.997 archivos y se reubicaron 1.034. Hay 51 índices de referencias y 23 documentos con algún dato pendiente de confirmar. Los originales de las carpetas de origen se mantienen.

La comprobación de integridad encontró 2.051 SHA-256 diferentes, todos coincidentes con los contenidos leídos antes de la limpieza. El cotejo final con Drive verificó 2.975 elementos: 862 carpetas y 2.113 archivos, incluidos índices y controles. No hubo faltantes, sobrantes, diferencias de tamaño o cambios de identificador. Los duplicados retirados ya no aparecen en el archivo nuevo. La raíz y los elementos verificados permanecían privados.

Estas cifras son la fotografía del 5 de octubre, no un contador actualizado de la plataforma. No repetir la importación o la limpieza basándose únicamente en ellas.

Para retomar, abrir el archivo privado organizado en Drive desde la conversación original y consultar:

- `LEEME_Archivo_organizado.md`, en la raíz: reglas de trabajo vigentes.
- `00_Control_y_revision/Resultado_limpieza_documental.md`: resultado y dudas concretas, con enlaces privados.
- `00_Control_y_revision/Manifiesto_limpieza_documental.csv`: origen, nombres y ubicaciones anteriores y actuales, huellas, identificadores y copia conservada de cada duplicado.
- `00_Control_y_revision/Documentos_pendientes_de_confirmacion.csv`: 23 documentos y datos que falta confirmar.
- `00_Control_y_revision/Verificacion_limpieza_documental.json`: comprobaciones realizadas.
- `00_Control_y_revision/Historial_importacion_2026-10-05`: informes anteriores, cuyas cifras son históricas.

El manifiesto es el puente para continuar desde otro equipo; no depender de las rutas locales ni de los archivos temporales de la sesión original. Los detalles privados no se adjuntan a issues, PRs o archivos de este repositorio.

## Estructura por cliente

La empresa y cada persona cliente tienen espacios independientes. Estar relacionada con una empresa no convierte la documentación personal en documentación de esa empresa.

```text
Cliente
├── 00_Entrada_pendiente
├── 01_Documentos_generales
│   ├── Identificacion_y_datos
│   ├── Escrituras_y_poderes
│   └── Contratos_y_autorizaciones
├── 02_Ejercicios
│   └── AAAA
│       ├── 00_Anual
│       └── T1–T4
│           └── Materia
│               └── MM, cuando proceda
├── 03_Expedientes
│   └── Asunto_estable
│       ├── 01_Documentacion_base
│       ├── 02_Notificaciones
│       ├── 03_Escritos_y_presentaciones
│       ├── 04_Resoluciones
│       └── 05_Cierre, cuando proceda
└── 04_Bienes_y_contratos
    └── Inmueble_o_bien
        ├── Titularidad
        ├── Contratos_y_anexos
        └── Seguros_y_documentacion_tecnica
```

- **Generales**: identificación, poderes, certificados y contratos generales de vigencia continuada.
- **Ejercicios**: fiscal, contabilidad, laboral, facturas emitidas/recibidas y bancos. Usar el ejercicio de la obligación o el periodo del documento, aunque la presentación o descarga se haya realizado después. Un documento multiperiodo se conserva completo, identificado por su rango, en una ubicación anual adecuada.
- **Expedientes**: permanecen en la misma carpeta aunque atraviesen varios años. Conservar la identidad de cada procedimiento, recurso y referencia, dentro de un asunto común cuando estén relacionados.
- **Bienes y contratos**: titularidad, contratos, anexos, seguros y documentación técnica por inmueble o bien. Las actualizaciones de renta permanecen con su contrato.
- **Entrada pendiente**: documentos nuevos sin clasificar. Si no se conoce el cliente, mantenerlos en control central, sin asignarlos por intuición.

Crear subcarpetas conforme haya documentación; no desplegar años, meses o fases vacíos innecesariamente. En alquileres del personal, identificar además persona y periodo dentro del ejercicio correspondiente.

## Nombres y versiones

Usar `AAAA-MM-DD_Tipo_Asunto_Referencia.ext` cuando la fecha esté comprobada; `AAAA-MM` o `AAAA` si solo se conoce mes o ejercicio. Si falta la fecha, usar tipo, asunto y referencia sin inventarla.

Ejemplos genéricos:

- `2026-03-15_Factura_Proveedor_Referencia.pdf`.
- `2025_Libros_registro_facturas_ingresos_gastos.xlsx`.
- `AEAT_Diligencia_embargo_creditos_Referencia.pdf`.
- `2026-01_a_2026-03_Documentacion_alquiler_Persona.pdf`.

Mantener referencias de factura, expediente, inmueble o presentación que permitan identificar el documento. Registrar el nombre anterior en el manifiesto. No usar la fecha de una fotografía como fecha de emisión sin contrastarla.

Los contenidos diferentes se conservan aunque tengan el mismo nombre o aspecto. `Version_02` distingue contenidos, pero no acredita una versión posterior. Un Word editable, un PDF, un borrador, un documento firmado y un justificante de presentación pueden cumplir funciones distintas y se mantienen por separado.

Una carta de pago no se renombra como justificante de pago sin evidencia. Un representante, presentador, vendedor o cónyuge mencionado no determina por sí solo el titular. Cuando la lectura automática discrepe con el documento, revisar visualmente; si sigue sin ser claro, registrar la duda.

## Copia única y referencias

Para considerar dos archivos duplicados exactos, comparar el contenido completo mediante SHA-256 y comprobar que la copia elegida para conservar existe y coincide. Una coincidencia de nombre, tamaño o texto extraído no basta. Un contenido distinto se conserva; la revisión semántica no autoriza a descartarlo como duplicado exacto.

La limpieza realizada se limitó al archivo nuevo organizado. Mantener las fuentes originales como respaldo hasta que exista una decisión expresa sobre ellas. Registrar toda retirada con ruta anterior, huella y ubicación de la copia conservada.

Si un documento se necesita en varios expedientes, inmuebles o clientes, guardar una copia y referencias desde los demás contextos. Los índices `INDICE_Referencias_documentales.md` del archivo cumplen esa función. Comprobar sus enlaces después de cambios de ubicación o proveedor.

Para documentos conjuntos, registrar las personas relacionadas y sus derechos según el contenido. Conservar documentación familiar y de terceros identificada por separado. Compartir un documento o pertenecer a una empresa no concede automáticamente acceso al resto del archivo.

## Incorporación de nuevos documentos

1. Determinar cliente, asunto y función a partir del documento y su contexto.
2. Comprobar si su contenido ya existe; conservar versiones distintas.
3. Elegir ubicación general, ejercicio y periodo, expediente o bien.
4. Nombrar con datos confirmados y conservar el nombre original en el registro.
5. Mantener relacionados el escrito, sus anexos y el justificante de presentación, cada uno con su identidad.
6. Registrar las dudas y no sobrescribir documentos existentes.
7. Verificar sincronización, contenido, enlaces y permisos; actualizar los registros privados de control.

No importar como documentos ordinarios los registros técnicos de error o archivos de firma destinados al uso interno. No eliminar un archivo dudoso para reducir el contador de pendientes.

## Siguiente fase: asociación con EXPERT y Kia

El usuario acordó organizar primero Drive y asociar las carpetas después de configurar el almacenamiento y la relación con cada cliente. Esa segunda fase sigue pendiente.

1. Revisar el estado actual de la integración documental antes de proponer cambios: [clasificación documental](document-classification-flow.md) y [orquestación de expedientes desde Kia](kia-work-case-orchestration.md).
2. Determinar el proveedor y la estrategia de almacenamiento realmente configurados: enlaces, referencias o copia. No asumir que existe ya una sincronización bidireccional.
3. Confirmar las fichas de la empresa y las personas, sus identificadores estables y las relaciones entre ellas. Las variantes de nombre no justifican crear una ficha duplicada.
4. Asociar cada carpeta con su ficha correspondiente y registrar documentos conjuntos mediante relaciones y acceso explícito, conservando una sola copia.
5. Mapear documento, titular o destinatario, personas relacionadas, tipo, asunto, expediente/inmueble, ejercicio, periodo, fecha, nombre original y actual, identificador del proveedor, huella y estado de revisión. Es una propuesta de mapeo; verificar el esquema vigente antes de implementarla.
6. Excluir de publicación automática los documentos con titular sin confirmar, documentos de terceros y certificados de firma de uso interno. Resolver la lista privada de pendientes sin inventar datos.
7. Verificar con una muestra representativa que se abre el documento correcto desde su ficha y expediente, que no se duplica y que los permisos corresponden a su cliente y despacho.
8. Comprobar que Kia conserva el cliente y expediente activos y distingue un dato confirmado de una duda pendiente. La asociación deberá hacer visible el estado real del documento, sin presentar un borrador o una carta de pago como actuación completada.
9. Registrar en el control privado las asociaciones realizadas, fecha de verificación y pendientes restantes. Actualizar aquí solo el modelo general y el estado de implementación.

No marcar la fase EXPERT como completada hasta verificar la asociación y el acceso real desde la plataforma. Esta documentación no modifica la aplicación ni su configuración.
