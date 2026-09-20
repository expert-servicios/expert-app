export const KIA_DGT_KNOWLEDGE_PROMPT = `
<dgt_knowledge>
Conocimiento curado de la Dirección General de Tráfico (DGT) para orientar a clientes.
EXPERT gestiona tramites de trafico en toda España. Kia orienta sobre procedimientos; la gestion profesional la hace EXPERT (svc_trafico).
Sede electronica DGT: https://sede.dgt.gob.es/ | App miDGT: disponible en iOS y Android.
Nota: tasas y plazos exactos pueden variar. Verificar en sede.dgt.gob.es para el importe actualizado.

<dgt_transferencia_vehiculo>
TRANSFERENCIA DE VEHICULO (compraventa entre particulares o empresa):

Que es: cambio de titular registral del vehiculo en la DGT.

Documentos necesarios (comprador y vendedor):
- DNI/NIE de ambas partes.
- Permiso de circulacion del vehiculo.
- Ficha tecnica (permiso de vehiculo).
- Contrato de compraventa firmado por ambas partes.
- Certificado de la ITV en vigor (si el vehiculo tiene mas de 4 años).
- Justificante de pago del Impuesto de Transmisiones Patrimoniales (ITP) — modelo 620 o equivalente de la CCAA.
- Comprobar que el IVTM del vehiculo esta al corriente cuando proceda. No confundir IVTM con la plusvalia municipal inmobiliaria.

Proceso:
1. Firmar el contrato de compraventa.
2. Liquidar o acreditar exencion/no sujecion del impuesto autonómico que corresponda. No usar un porcentaje nacional aproximado: resolver la CCAA, modelo y valoracion aplicables.
3. Consultar DGT_VEHICLE_TRANSFER_2026 para condiciones de transferibilidad y plazo.
4. El comprador debe solicitar el cambio de titularidad en la DGT dentro de 30 dias desde la firma del contrato.
5. La DGT emite el nuevo permiso de circulacion a nombre del comprador.

Tasa DGT: consultar DGT_FEES_2026 y aplicar el tipo de tasa del tramite concreto.
EXPERT gestiona todo el proceso por el cliente: ITP + transferencia DGT.
</dgt_transferencia_vehiculo>

<dgt_matriculacion>
MATRICULACION DE VEHICULO NUEVO O IMPORTADO:

Vehiculo nuevo (compra a concesionario):
- El concesionario normalmente gestiona la matriculacion incluida en el precio.
- Si el cliente necesita hacerlo por separado: Jefatura de Trafico de la provincia.

Vehiculo importado (de fuera de España):
- Homologacion tecnica (si el vehiculo no tiene ficha tecnica española).
- Pago del Impuesto de Matriculacion (IEDMT) si aplica (vehiculos con CO2 superiores a ciertos limites).
- Presentacion en Jefatura de Trafico: documentacion del vehiculo, seguro, ITV, justificante de pago de impuestos.
- EXPERT asesora y gestiona matriculaciones de vehiculos importados.
</dgt_matriculacion>

<dgt_canje_permiso>
CANJE DE PERMISO DE CONDUCIR EXTRANJERO:

Convenios de reciprocidad: España tiene acuerdos de canje directo con muchos paises (UE/EEE, y otros como Marruecos, Argentina, Colombia, etc.).

Proceso general para paises con convenio:
1. Solicitar cita previa en la Jefatura Provincial de Trafico: https://sede.dgt.gob.es/
2. Documentos: NIE o TIE vigente, permiso de conducir extranjero original, traduccion jurada si no es de la UE, fotografia, justificante pago tasa.
3. El permiso extranjero queda retenido mientras dura el tramite.
4. Plazo estimado de resolucion: variable (semanas a meses segun provincia y carga).

Paises sin convenio: requieren superar pruebas teorica y practica en España.
UE/EEE: canje directo sin pruebas, tramite simplificado.
EXPERT gestiona el canje de permiso extranjero como parte del servicio de trafico.
</dgt_canje_permiso>

<dgt_otros_tramites>
OTROS TRAMITES DGT HABITUALES:

Informe de puntos del carnet:
- Consultar en: https://sede.dgt.gob.es/ (apartado "Conductores") o app miDGT.
- Necesita certificado digital, Cl@ve o SMS con DNI/NIE + fecha nacimiento + numero permiso.
- Es gratuito y puede consultarse en cualquier momento.

Duplicado del permiso de circulacion:
- Por perdida, robo o deterioro. Tramite online en sede DGT o en Jefatura.
- Requiere denuncia si es por robo.

Baja definitiva de vehiculo (desguace):
- El desguace autorizado realiza la baja automaticamente al recibir el vehiculo.
- Si es baja voluntaria (vehiculo en el extranjero, etc.): tramite en sede DGT con documentacion del vehiculo.

Baja temporal:
- Para vehiculos que no van a circular temporalmente. Tramite en sede DGT.
- Exime del IVTM (impuesto municipal de circulacion) mientras dura la baja.

Cambio de domicilio en el permiso de circulacion:
- Obligatorio notificar a la DGT cuando cambia la direccion del titular.
- Tramite online gratuito en sede.dgt.gob.es.

Notificaciones de trafico (multas, expedientes):
- Las notificaciones se envian a la direccion del titular o al DEHu si el titular es empresa/autonomo con notificaciones electronicas obligatorias.
- Plazo para recurrir una sancion de trafico: 20 dias habiles desde la notificacion.

App miDGT:
- Permite tener el permiso de circulacion y el carnet de conducir en el movil (version digital).
- Informes de puntos, DGT Linea Directa, notificaciones.
- Descarga: App Store / Google Play — buscar "miDGT".
</dgt_otros_tramites>

<dgt_itv>
ITV (Inspeccion Tecnica de Vehiculos):
- Obligatoria periodicamente segun antiguedad del vehiculo: primer ITV a los 4 años desde la matriculacion; luego cada 2 años; a partir de 10 años, anual.
- La ITV es competencia de cada CCAA — las estaciones son concesiones privadas autorizadas.
- Si el vehiculo no pasa la ITV, no se puede realizar la transferencia hasta que supere la inspeccion.
- Para buscar estaciones ITV en cualquier CCAA: https://www.mitma.gob.es/
</dgt_itv>

<dgt_kia_rules>
REGLAS DE KIA PARA PREGUNTAS SOBRE DGT Y TRAFICO:
- Para transferencias: consultar DGT_VEHICLE_TRANSFER_2026; el comprador debe acreditar pago, exencion o no sujecion del impuesto autonómico aplicable antes de completar el cambio de titularidad.
- Para vehiculos de empresa: las transferencias requieren documentacion adicional (escrituras, representante legal).
- Para canje de permiso extranjero: verificar si el pais tiene convenio de reciprocidad con España antes de orientar el proceso.
- Si el cliente pregunta por multas de trafico: orientacion inicial sobre plazos de recurso; si es complejo, derivar a EXPERT (recurso administrativo trafico).
- EXPERT gestiona: transferencias, matriculaciones, canje de permisos, bajas, duplicados y tramites con Capitania Maritima. Servicio: svc_trafico.
- Sede DGT: https://sede.dgt.gob.es/ | App miDGT para consultas rapidas.
</dgt_kia_rules>
</dgt_knowledge>
`.trim();
