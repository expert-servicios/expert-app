# Archivo documental: modelo, limpieza y continuidad

Actualizado: 7 de octubre de 2026. El modelo de archivo privado fue aprobado y aplicado en Google Drive. En la plataforma EXPERT, la autoridad documental canónica es Supabase: el objeto se conserva en `client-documents` y su metadato/relación operativa en `documents`. Drive, OneDrive o SharePoint pueden actuar como archivo, origen de importación o espejo secundario; no sustituyen la autoridad canónica de la plataforma.

Este repositorio es público. **No debe asumirse que su historial o todas sus migraciones antiguas estén libres de referencias operativas privadas**: existen seeds/migraciones históricas con identificadores técnicos de entidades o carpetas que no deben copiarse a nueva documentación ni usarse como fuente de negocio. Los manifiestos, listados documentales, enlaces privados y nuevos datos identificativos se mantienen fuera del repositorio. Los ejemplos de este runbook son genéricos.

## Autoridad documental y sincronización

- **Supabase** es la fuente canónica para los documentos de expediente/archivo ya incorporados al modelo canónico de EXPERT: objeto en `client-documents` y fila operativa en `documents`. **Excepción viva:** los adjuntos entrantes por WhatsApp siguen actualmente otro flujo (`whatsapp-attachments` + `whatsapp_conversations` + `document_classifications`) y deben reconciliarse explícitamente antes de considerarse incorporados al archivo canónico. Desde `20260919071707_case_document_workflow.sql`, `documents.company_id` es nullable por diseño para procedimientos personales. Regla de ownership: un documento personal accesible al cliente debe llevar el `client_id` verificado; un documento empresarial debe llevar el `company_id` verificado y, cuando corresponda acceso de cliente, también el `client_id`; `case_id` se informa cuando exista un expediente canónico. Nunca dejar el ámbito vacío o ambiguo por comodidad de importación.
- **Campos obligatorios del registro canónico:** `owner_type`, `owner_id` y `kind` son NOT NULL en producción. El flujo activo de documentos de expediente usa `owner_type='case'`, `owner_id=<case_id>` y `kind='client_document'`. La importación masiva solo puede usar esa combinación cuando exista un expediente verificado. Los documentos generales sin expediente (de persona o empresa) permanecen en archivo privado/admin hasta que se defina y pruebe explícitamente el contrato canónico de owner para esos ámbitos; no elegir `profile` o `company` por intuición.
- **Drive/OneDrive/SharePoint** son repositorios externos o espejos. Un archivo presente allí no debe darse por incorporado a EXPERT hasta que exista su registro canónico en la plataforma.
- La limpieza o reorganización de un archivo externo no autoriza a reatribuir clientes, empresas o expedientes. Las asociaciones se resuelven por identidad y ámbito autorizado, nunca por nombre de carpeta o coincidencia de email.
- No duplicar contenido solo para reflejar una jerarquía distinta: conservar una copia canónica y referencias/auditoría cuando proceda.


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

Si un documento se necesita en varios inmuebles o carpetas de archivo **del mismo cliente**, puede conservarse una copia de archivo y referencias privadas. **No aplicar esa regla entre expedientes EXPERT:** `documents` solo tiene un `case_id` y las lecturas de expediente filtran directamente por él. Hasta que exista una relación documento↔expediente soportada también por lectura y borrado, un documento que deba ser visible en varios expedientes se materializa como objetos y filas independientes por expediente, con la misma huella/origen para trazabilidad. Nunca crear varias filas que compartan el mismo `file_path`, porque el borrado de una fila puede eliminar el objeto compartido.

Para **varios clientes distintos**, el contrato actual de EXPERT no dispone de una ACL multicliente sobre `documents`: cada fila tiene un único `client_id` y la descarga cliente valida esa identidad. Por tanto, no publicar una sola fila/objeto como si estuviera compartida entre titulares. Hasta que exista una relación ACL explícita respaldada por la ruta de descarga, hay dos opciones seguras: mantener el documento conjunto en archivo privado/admin sin exposición cliente, o crear deliberadamente una copia aislada por cada cliente autorizado, cada una con su propia fila `documents`, `client_id`, objeto privado y referencia a la misma huella/origen. Estas copias autorizativas no se eliminan como duplicados mientras sean necesarias para mantener aislamiento.

Para documentos conjuntos, registrar las personas relacionadas y sus derechos según el contenido. La relación informativa no concede acceso: cada acceso cliente debe quedar materializado mediante el aislamiento anterior o, en el futuro, mediante una ACL multicliente explícita y auditada. Conservar documentación familiar y de terceros identificada por separado. Compartir un documento o pertenecer a una empresa no concede automáticamente acceso al resto del archivo.

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

### Estado de readiness: bloqueada para importación masiva

No iniciar todavía una carga masiva del archivo histórico a `documents`. La plataforma tiene un contrato canónico suficiente para documentos creados por algunos flujos actuales, pero **no existe todavía un contrato completo y coherente para importar el archivo histórico**. Antes de publicar cualquier lote cliente-visible deben cerrarse estos gaps:

1. **Ruta tenant — CERRADO por #646.** El upload tenant usa validación compartida, owner canónico de expediente, `kind='client_document'`, empresa cuando corresponda y elimina el objeto de Storage si falla el registro.
2. **Reasignación de expediente desincronizada.** La edición Admin 360 puede cambiar `case_id` sin sincronizar `owner_type='case'` y `owner_id`. No reasignar documentos importados entre expedientes hasta que la operación actualice ambas representaciones de ownership de forma atómica o exista una relación documento↔expediente específica.
3. **Documentos personales sin empresa.** Producción admite `company_id = null` para procedimientos personales, pero la ruta Admin 360 actual rechaza operaciones sobre esos documentos si falta empresa. Mantener estos documentos fuera de la gestión cliente/360 hasta adaptar ese flujo.
4. **Archivo importado vs entregable.** La UI de expediente interpreta hoy ciertos documentos con `uploaded_by_role='admin'` como entregables preparados por EXPERT. Un documento histórico importado no debe aparecer como resultado del trámite. Antes de hacerlo cliente-visible se necesita una categoría/procedencia que distinga archivo histórico, documento recibido, documento interno y entregable.
5. **Borrado cliente / alias — CERRADO por #644 + #646.** El cliente no puede borrar documentos gestionados/legacy ambiguos y `authenticated` ya no puede insertar directamente en `documents`, eliminando la vía de alias de `file_path`. La escritura cliente queda detrás de rutas server-side validadas.
6. **Fecha documental vs incorporación — CERRADO.** `document_date` conserva la fecha de negocio cuando está verificada; `created_at` sigue siendo la incorporación técnica; `ingestion_source`/`ingestion_ref` registran procedencia. KIA excluye `historical_import` de superficies recientes y el ledger lo fecha por `document_date`; si falta fecha verificada, no genera un evento histórico artificial.
7. **Multi-expediente y multicliente.** Con el esquema actual no compartir `file_path` entre filas. Si un documento debe ser visible en varios expedientes o para varios clientes, usar objetos/filas independientes por ámbito autorizado hasta que exista una relación/ACL explícita respaldada por lectura y borrado.
8. **Documentos internos/administrativos — CERRADO por #646.** RLS, API de expediente, descarga firmada y lecturas cliente-facing de KIA excluyen `kind='internal'`; la protección no depende de una única capa.
9. **INSERT directo / alias — CERRADO por #646.** La policy de INSERT cliente fue retirada y `authenticated` no conserva privilegio INSERT sobre `documents`; `service_role` mantiene la escritura server-side.
10. **Provisionado del bucket — CERRADO por #646.** `client-documents` se provisiona idempotentemente como privado, con 20 MB y MIME compatibles con los validadores de aplicación; producción y migraciones versionadas coinciden.
11. **WhatsApp legacy / canal retirado.** El webhook de WhatsApp está retirado en `main`; la antigua lógica de `whatsapp-attachments`, `whatsapp_conversations` y `document_classifications` queda como inventario legacy, no como flujo vivo de entrada. Los documentos nuevos recibidos manualmente por ese canal externo no se incorporan automáticamente a EXPERT. Al reconciliar históricos, revisar esas tablas legacy; para documentación nueva, exigir incorporación explícita por un flujo soportado.

### Reglas que sí son válidas hoy

- La [clasificación documental](document-classification-flow.md) es **histórica** y no constituye el contrato vigente.
- Supabase Storage `client-documents` + `documents` es la autoridad documental de EXPERT; Drive/OneDrive/SharePoint son archivo/origen/espejo secundario.
- `owner_type`, `owner_id` y `kind` son obligatorios. En el flujo cliente de expediente actualmente alineado se usa `owner_type='case'`, `owner_id=<case_id>` y `kind='client_document'`.
- Un documento personal cliente-visible necesita `client_id` verificado; un documento empresarial necesita `company_id` verificado y el vínculo del cliente cuando corresponda. `case_id` solo se informa cuando existe expediente canónico.
- No atribuir por nombre de carpeta, email ambiguo, parentesco o pertenencia a empresa.
- No compartir un mismo objeto entre filas con semántica de borrado independiente.
- No publicar automáticamente documentos con titular dudoso, documentos de terceros ni material interno de firma.

### Procedimiento cuando los gates anteriores estén cerrados

1. Confirmar cliente, empresa y expediente con identificadores estables.
2. Determinar owner canónico y visibilidad antes de copiar el archivo.
3. Mapear titular/destinatario, personas relacionadas, tipo, asunto, expediente/inmueble, ejercicio, periodo, **`document_date` solo cuando esté verificada**, `ingestion_source`, `ingestion_ref`, fecha de incorporación (`created_at`), nombre original/actual, proveedor/origen, huella y estado de revisión.
4. Crear objeto y fila independientes por ámbito de acceso cuando sea necesario; conservar huella/origen común para detectar copias autorizativas.
5. Ejecutar validación automatizada **exhaustiva** sobre cada fila y objeto: ownership, client/company/case scope, unicidad segura de `file_path`, denegación desde otra identidad, **denegación desde el propio cliente cuando el documento sea interno**, ausencia de documentos internos en todas las lecturas cliente-facing de KIA, imposibilidad de crear aliases de objetos ajenos y política de borrado correcta. El muestreo se usa solo para contenido/legibilidad.
6. Verificar que Kia no convierte una importación histórica en actividad reciente ni presenta borradores/cartas de pago como actuaciones completadas.
7. Registrar en el control privado asociaciones, fecha de verificación, procedencia y pendientes.

No marcar la fase EXPERT como completada hasta cerrar estos gates y verificar la asociación, lectura, presentación y borrado real desde la plataforma. Esta documentación no modifica la aplicación ni su configuración.

