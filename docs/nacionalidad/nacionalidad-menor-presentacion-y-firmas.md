# Nacionalidad por residencia de menor de 14 años — firma, representación y presentación

Última revisión: 22/09/2026.

## 1. Objeto

Criterio operativo EXPERT para expedientes de nacionalidad española por residencia de menores de 14 años, especialmente cuando:
- ambos progenitores ejercen la patria potestad;
- EXPERT/Ksenia ILICHEVA realiza la presentación telemática como representante voluntaria;
- la familia trabaja a distancia;
- se utiliza DocuSign para formalizar el mandato de representación.

Este documento separa tres actos jurídicos distintos:
1. consentimiento/firma de los progenitores en el modelo oficial de solicitud;
2. mandato o poder de representación voluntaria a favor de Ksenia;
3. firma electrónica de la documentación/presentación telemática mediante certificado reconocido.

## 2. Fuentes oficiales

### Normativa
- Real Decreto 1004/2015, de 6 de noviembre, art. 5:
  https://www.boe.es/eli/es/rd/2015/11/06/1004
- Ley 39/2015, arts. 5, 10 y 11:
  https://www.boe.es/eli/es/l/2015/10/01/39

### Ministerio de Justicia
- Nota de 3/09/2021 sobre solicitudes de nacionalidad por residencia de menores de 14 años tras Ley 8/2021:
  https://www.mjusticia.gob.es/es/Ciudadano/Nacionalidad/Documents/Nota%20entrada%20en%20vigor%20Ley%208-2021.pdf
- Modelo/información de solicitud de nacionalidad por residencia:
  https://www.mjusticia.gob.es/es/Ciudadano/TramitesGestiones/Documents/19-01-2022Solicitud%20de%20Nacionalidad%20por%20Residencia.pdf
- Relación de modelos normalizados:
  https://www.mjusticia.gob.es/es/ciudadania/tramites/relacion-descarga-modelos
- Sede de nacionalidad española por residencia:
  https://sede.mjusticia.gob.es/es/tramites/nacionalidad-espanola

## 3. Menores de 14 años: quién formula y firma

Tras la entrada en vigor de la Ley 8/2021, cuando existe acuerdo entre los representantes legales:
- ya no se exige autorización previa del encargado del Registro Civil ni dictamen del Ministerio Fiscal;
- debe aportarse el modelo normalizado firmado por ambos progenitores/representantes legales;
- puede firmar un solo progenitor en los supuestos expresamente admitidos y debidamente acreditados;
- si existe discrepancia entre progenitores, debe aportarse resolución del expediente de jurisdicción voluntaria.

En presentación electrónica se adjunta el mismo modelo normalizado con estos requisitos de firma.

## 4. Regla de firma electrónica del RD 1004/2015

El artículo 5.4 establece dos reglas operativas:

1. Los documentos presentados en formato electrónico que precisen firma del solicitante deben suscribirse mediante certificado electrónico reconocido del interesado, de su representante o del profesional habilitado, según proceda.
2. Cuando en la presentación telemática sean obligatorias varias firmas en un mismo documento, una será electrónica y las demás podrán ser manuscritas y escaneadas en el propio documento.

### Consecuencia para EXPERT

No debe asumirse que una firma electrónica estándar de DocuSign, basada únicamente en un enlace y un campo SignHere, equivale a la firma mediante certificado electrónico reconocido exigida por el art. 5.4.

DocuSign solo podría utilizarse para esa función si el envelope estuviera configurado con un nivel de firma basado en certificado que cumpla el requisito legal aplicable y cuya validez frente al Ministerio estuviera verificada. El envelope estándar actualmente utilizado por EXPERT no cumple esa premisa operativa.

## 5. Flujo de firma recomendado por EXPERT

### A. Mandato de representación
El mandato a favor de Ksenia ILICHEVA puede gestionarse mediante DocuSign con trazabilidad y certificado de finalización, sujeto a revisión profesional.

### B. Modelo oficial de solicitud del menor
Flujo conservador:
1. EXPERT pre-rellena el modelo normalizado oficial.
2. Se envía a los progenitores para revisión.
3. Ambos progenitores firman manuscritamente el mismo documento cuando ambos ejercen la patria potestad.
4. Se devuelve un escaneo/PDF legible del documento completo firmado.
5. EXPERT valida identidad, firmas, coherencia de datos, patria potestad y legibilidad.
6. Ksenia ILICHEVA, como representante voluntaria, aplica su certificado electrónico personal reconocido al PDF/documentación que deba quedar suscrita electrónicamente antes de la presentación.
7. Se conserva el PDF de padres firmado, la versión electrónicamente firmada por Ksenia y la evidencia de validación interna.

### Alternativa
Si uno de los progenitores dispone de un certificado electrónico reconocido compatible, puede utilizarse una firma electrónica basada en ese certificado y dejar la otra firma como manuscrita/escaneada, siempre tras revisión profesional.

## 6. Qué NO hacer

- No sustituir automáticamente las firmas exigidas de los progenitores por el mandato de representación.
- No considerar suficiente el DocuSign estándar para el modelo oficial de solicitud.
- No presentar un formulario del menor sin ambas firmas cuando ambos progenitores ejercen patria potestad y no existe una excepción acreditada.
- No confundir la firma electrónica de Ksenia como presentadora/representante con el consentimiento material de los progenitores.
- No iniciar el SLA de presentación de 24 h hasta disponer del paquete firmado completo definido en este documento.

## 7. Documentos bloqueantes antes de presentación

Para menor de 14 años con ambos progenitores:
- mandato/poder de representación voluntaria a favor de Ksenia;
- certificado/evidencia de finalización del mandato;
- modelo normalizado oficial de solicitud firmado por ambos progenitores;
- versión del documento con firma electrónica reconocida de Ksenia cuando corresponda;
- documentos identificativos de ambos progenitores;
- documentación del menor y residencia;
- tasa 790-026 pagada/registrada;
- justificante de tasa;
- revisión profesional final.

## 8. SLA EXPERT de 24 horas laborables

El compromiso es de **24 horas laborables**, no 24 horas naturales. Para control operativo EXPERT se computa en la zona horaria Europe/Madrid dentro de la jornada 09:00-18:00 de días laborables. El reloj se detiene a las 18:00, permanece pausado fuera de jornada y fines de semana/festivos operativos, y continúa al inicio de la siguiente jornada laborable.

El compromiso operativo comienza únicamente cuando:
- el mandato está firmado y validado;
- el modelo normalizado está firmado por los progenitores y validado;
- están disponibles los documentos obligatorios necesarios para presentar.

Desde ese hito se registra `sla_started_at` y se calcula `sla_due_at` consumiendo únicamente horas laborables hasta completar 24 horas.

Desde ese hito:
1. firma electrónica del documento por Ksenia cuando proceda;
2. pago/registro de tasa 790-026;
3. revisión final;
4. presentación en Sede del Ministerio de Justicia;
5. archivo del justificante y número de expediente;
6. comunicación a la familia.

Si aparece un bloqueo documental o técnico, debe registrarse y comunicarse al cliente antes de vencer el SLA.

## 9. Tareas canónicas Admin

1. Validar requisitos y patria potestad.
2. Revisar documentación.
3. Preparar mandato voluntario.
4. Validar mandato firmado.
5. Pre-rellenar modelo oficial de solicitud.
6. Obtener firmas manuscritas de ambos progenitores.
7. Validar formulario firmado.
8. Aplicar firma electrónica reconocida de Ksenia.
9. Pagar/registrar tasa 790-026.
10. Revisión final.
11. Presentar en Sede.
12. Archivar justificante/número de expediente.
13. Comunicar presentación.
14. Seguimiento.

Cada tarea desbloquea la siguiente, con recordatorio/calendario cuando proceda.

## 10. Correos canónicos

### Mandato completado → solicitud oficial pendiente
Asunto RU: Следующий этап по делу ребёнка — официальный бланк заявления

Contenido mínimo:
- agradecer firmas del mandato;
- explicar que el Ministerio exige además el modelo oficial firmado por los representantes legales;
- informar que EXPERT lo enviará ya pre-rellenado;
- indicar claramente cómo firmarlo manuscritamente y devolverlo completo;
- no afirmar todavía que ha comenzado el plazo de 24 horas para presentar.

### Solicitud oficial firmada y validada
Asunto RU: Документы для подачи получены — начинаем финальную подачу

Contenido mínimo:
- confirmar paquete completo;
- indicar tasa + revisión final + presentación;
- activar compromiso máximo de 24 horas;
- indicar que se enviará justificante y número de expediente tras registro.

### Presentación realizada
Asunto RU: Заявление подано — подтверждение регистрации

Contenido mínimo:
- fecha/hora;
- número de expediente/registro;
- justificante;
- explicación del seguimiento y comunicaciones posteriores.

## 11. Auditoría

En cada expediente conservar:
- versión del modelo oficial utilizada y fecha;
- evidencia de fuente oficial;
- quién rellenó/revisó;
- quién firmó y con qué método;
- hash o identificador del documento final cuando esté disponible;
- fecha/hora de pago de tasa;
- fecha/hora de presentación;
- justificantes;
- correos enviados;
- incidencias y subsanaciones.