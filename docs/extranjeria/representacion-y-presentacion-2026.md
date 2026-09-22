# Representación y presentación en Nacionalidad y Extranjería — criterio operativo EXPERT 2026

Última revisión: 22/09/2026.

## Objetivo

Definir un criterio único para web, KIA, expedientes y tareas internas sobre:
- quién está legitimado para presentar cada tipo de solicitud;
- cuándo EXPERT/Ksenia puede presentar en representación del cliente;
- qué documento de representación debe exigirse;
- cuándo debe bloquearse la presentación hasta revisión profesional.

## 1. Nacionalidad por residencia

### Regla EXPERT
La nacionalidad por residencia se gestiona ante el Ministerio de Justicia. Cuando EXPERT realiza la presentación, la representante voluntaria debe ser Ksenia ILICHEVA como persona física y la representación debe acreditarse mediante mandato o poder válido para el procedimiento.

### Menores
En expedientes de menores deben resolverse por separado:
1. la representación legal del menor (progenitores/tutores);
2. el consentimiento y las firmas exigibles;
3. la representación voluntaria de Ksenia para la presentación telemática.

### Gate operativo
No presentar hasta que:
- el mandato/poder esté firmado y archivado;
- las identidades sean coherentes;
- se hayan resuelto patria potestad y firmas de progenitores cuando proceda;
- exista aprobación profesional.

### Automatización
Para nacionalidad sí puede utilizarse un flujo DocuSign para formalizar el mandato privado cuando resulte válido para el procedimiento, manteniendo audit trail y certificado de finalización.

## 2. Régimen general de representación en Extranjería

El artículo 197 del RD 1155/2024 regula presentación, legitimación y representación cuando el sujeto legitimado se encuentra en España.

### Regla general de representación
Cuando una solicitud puede ser presentada por representante:
- con carácter general, la representación por persona física o jurídica debe acreditarse mediante apoderamiento notarial o apud acta en el Registro Electrónico de Apoderamientos;
- también pueden operar habilitaciones derivadas de convenios de representación de terceros;
- debe contemplarse el Registro Electrónico de Colaboradores de Extranjería cuando exista desarrollo y resulte aplicable.

### Consecuencia EXPERT
No utilizar el mandato privado de DocuSign de nacionalidad como documento genérico para procedimientos de Extranjería.

Antes de presentar:
1. identificar autorización exacta;
2. identificar sujeto legitimado;
3. comprobar si admite representación;
4. determinar documento/habilitación de representación exigible;
5. bloquear presentación hasta validación humana.

## 3. Renovación de residencia

### Ejemplos verificados
Las hojas oficiales de renovación de residencia temporal y trabajo por cuenta ajena y por cuenta propia indican que el trabajador puede presentar personalmente o mediante representación.

### Flujo EXPERT
- identificar autorización que se renueva;
- controlar plazo;
- validar sujeto legitimado;
- si EXPERT presenta: exigir y validar apoderamiento notarial, apud acta u otra habilitación válida conforme al régimen aplicable;
- solo después habilitar presentación en Mercurio.

## 4. Reagrupación familiar

La hoja oficial indica que el sujeto legitimado es la persona reagrupante, personalmente o a través de representante.

### Flujo EXPERT
- identificar a la persona reagrupante;
- validar requisitos de reagrupación;
- si EXPERT presenta: acreditar representación válida antes de presentar;
- mantener gate humano antes de Mercurio.

## 5. Permisos iniciales

No existe una regla única.

### Ejemplos
- Autorización inicial de residencia temporal y trabajo por cuenta ajena: el sujeto legitimado es el empleador/empresario, personalmente o mediante quien tenga atribuida la representación legal empresarial.
- Autorización inicial de residencia temporal y trabajo por cuenta propia: la persona extranjera presenta personalmente ante la oficina consular correspondiente.

### Regla EXPERT
El producto "Permiso inicial de residencia" debe funcionar primero como clasificador de vía. No se debe prometer que EXPERT presentará hasta identificar:
- modalidad exacta;
- sujeto legitimado;
- lugar/canal de presentación;
- posibilidad y forma de representación.

## 6. Arraigos

Las hojas oficiales vigentes de arraigo social, arraigo sociolaboral y arraigo familiar identifican como sujeto legitimado a la persona extranjera personalmente y, para menores o personas con discapacidad según el supuesto, a su representante legal/persona de apoyo.

### Regla EXPERT
No anunciar una representación voluntaria genérica de EXPERT para arraigos.

El flujo debe:
- validar modalidad de arraigo;
- identificar sujeto legitimado;
- comprobar la instrucción/hoja vigente y el artículo 197;
- determinar si EXPERT puede presentar y bajo qué habilitación;
- si no, preparar el expediente y guiar la presentación del propio interesado.

## 7. Matriz resumida

| Servicio | Autoridad | Presentación por EXPERT | Documento/regla |
| --- | --- | --- | --- |
| Nacionalidad por residencia | Ministerio de Justicia | Sí, si se acredita representación | Mandato o poder de representante voluntario |
| Nacionalidad menor nacido en España | Ministerio de Justicia | Sí, tras resolver representación legal + mandato voluntario | Mandato/poder + firmas/consentimiento de progenitores según corresponda |
| Renovación residencia | Extranjería | Sí, cuando la vía admite representación | Poder notarial / apud acta / habilitación válida |
| Reagrupación familiar | Extranjería | Sí, por representante del reagrupante | Poder notarial / apud acta / habilitación válida |
| Permiso inicial | Extranjería/Consulado | Depende de la modalidad | Identificar primero sujeto legitimado |
| Arraigo social | Extranjería | No asumir | Validar legitimación específica |
| Arraigo sociolaboral | Extranjería | No asumir | Validar legitimación específica |
| Arraigo familiar | Extranjería | No asumir | Validar legitimación específica |

## 8. Reglas de producto/KIA

- Nunca inferir que "servicio completo" equivale automáticamente a "EXPERT presenta".
- KIA debe consultar la política canónica de representación por slug.
- Toda acción de presentación debe requerir humanApprovalRequired.
- Si falta acreditación de representación, next_action debe ser formalizar/validar representación, no presentar.
- No reutilizar un mandato de nacionalidad en Extranjería.
- Mantener copy ES/RU coherente con la legitimación real.
- Cuando no exista todavía página RU, marcar la paridad como pendiente en el production manifest.

## 9. Fuentes oficiales de referencia

- Real Decreto 1155/2024, art. 197 — presentación, legitimación y representación.
- Ministerio de Inclusión, Hoja 8 — reagrupación familiar.
- Ministerio de Inclusión, Hoja 12 — autorización inicial por cuenta ajena.
- Ministerio de Inclusión, Hoja 13 — renovación por cuenta ajena.
- Ministerio de Inclusión, Hoja 15 — renovación por cuenta propia.
- Ministerio de Inclusión, Hoja 28 — arraigo social.
- Ministerio de Inclusión, Hoja 29 — arraigo sociolaboral.
- Ministerio de Inclusión, Hoja 31 — arraigo familiar.
- Ministerio de Justicia — procedimiento de nacionalidad por residencia.


## 10. Apoder@ / REA-AGE como alternativa a la notaría

### Conclusión operativa

Apoder@ (Registro Electrónico de Apoderamientos de la AGE, REA-AGE) es una vía válida para formalizar un apoderamiento apud acta sin acudir a notaría.

Para personas físicas existen dos caminos:
1. comparecencia electrónica en Apoder@;
2. comparecencia presencial en una Oficina de Asistencia en Materia de Registros (OAMR).

Si el poderdante inscribe el poder, la persona apoderada debe aceptarlo posteriormente. El poder solo es utilizable cuando alcanza el estado **Autorizado**.

### Acceso electrónico y Cl@ve

La información operativa vigente del REA-AGE indica que la identidad para utilizar el servicio se acredita mediante DNI electrónico o certificado digital reconocido en vigor, que califica como requisito imprescindible.

Por tanto, EXPERT no debe diseñar actualmente el flujo suponiendo que Cl@ve PIN sea suficiente para otorgar electrónicamente un poder en Apoder@.

Nota histórica: la antigua Orden HFP/633/2017 contemplaba para personas físicas otros medios incorporados en Cl@ve, pero esa orden fue derogada con efectos de 12/12/2021 por la Orden PCM/1384/2021. La regla operativa actual publicada por la Sede del Punto de Acceso General debe prevalecer en el diseño del flujo.

### Política EXPERT: sin presencialidad

EXPERT no ofrecerá como flujo operativo la comparecencia presencial en OAMR. Aunque jurídicamente exista como alternativa, es contraria al modelo de servicio 100 % online.

Si el cliente no dispone del medio electrónico exigido por Apoder@, el flujo comercial y operativo será ofrecer primero el servicio `certificado-digital-persona-fisica` de EXPERT (90 € + IVA), tramitable online. Una vez emitido e instalado el certificado, se continúa con Apoder@/REA.

### Tipo de poder recomendado

Aplicar principio de mínimo alcance:
- preferir **tipo C** cuando exista en SIA un trámite concreto habilitado para actuación por apoderado;
- utilizar tipo B solo cuando resulte necesario cubrir actuaciones ante un organismo completo;
- evitar tipo A salvo necesidad real y consentimiento informado del cliente.

El REA únicamente permite apoderar para trámites previamente inscritos en SIA con capacidad para ser iniciados por apoderado.

### Extranjería y Mercurio

Existe constancia oficial de integración de Apoder@ con procedimientos de Extranjería y de la opción **ACCESO EN REPRESENTACIÓN** de Mercurio. La comprobación de la representación puede realizarse automatizadamente a través de Apoder@.

El procedimiento SIA 201361, “Extranjería. Autorizaciones de residencia competencia del Ministerio de Inclusión, Seguridad Social y Migraciones”, figura como disponible para tramitación telemática por apoderado.

No todos los trámites de Extranjería son apoderables: por ejemplo, determinados procedimientos policiales (certificados/TIE) figuran en SIA como no disponibles para tramitación telemática por apoderado. Debe comprobarse el código SIA del trámite concreto antes de prometer presentación por EXPERT.

### Flujo EXPERT propuesto con Apoder@

1. KIA identifica autorización y código SIA.
2. KIA comprueba si el trámite admite presentación por apoderado.
3. Se solicita al cliente apoderamiento a favor de **Ksenia ILICHEVA, NIE X3576519L, persona física**.
4. Si el cliente tiene DNIe/certificado reconocido:
   - accede a Apoder@;
   - inscribe preferentemente poder tipo C para el trámite concreto;
   - define una vigencia limitada al expediente o periodo razonable.
5. Ksenia accede con su certificado personal y acepta el poder.
6. EXPERT comprueba que el estado del poder es **Autorizado**.
7. Se guarda justificante/referencia del REA en el expediente.
8. Se desbloquea la acción profesional de presentación en Mercurio.
9. Tras finalización del expediente se recomienda revocación o dejar caducar el poder según su alcance y vigencia.

Si el cliente no dispone de certificado:
- ofrecer automáticamente el servicio de certificado digital de persona física de EXPERT;
- completar emisión/instalación;
- continuar después con Apoder@/REA;
- no usar comparecencia presencial como alternativa comercial estándar;
- no prometer que Cl@ve PIN permitirá completar el alta electrónica en Apoder@ mientras la Sede REA mantenga el requisito de DNIe/certificado.

## 11. Registro Electrónico de Colaboradores de Extranjería (2026)

La Orden ISM/164/2026, vigente desde el 06/03/2026, desarrolla el Registro Electrónico de Colaboradores de Extranjería previsto en el art. 197.4.c del RD 1155/2024.

No es una vía disponible para EXPERT ESTUDIOS PROFESIONALES, S.L.U. como sociedad mercantil. La inscripción está limitada a:
- organizaciones sindicales más representativas;
- entidades sin ánimo de lucro constituidas en España al menos tres años antes y vinculadas al ámbito migratorio o de protección internacional, cumpliendo los requisitos adicionales de la Orden.

Además, la representación realizada al amparo de ese registro debe tener carácter gratuito.

Por tanto, para EXPERT la vía estructural aplicable sigue siendo:
- nacionalidad: mandato/poder del procedimiento de Justicia;
- Extranjería: Apoder@/REA (apud acta) o poder notarial, además de cualquier convenio de habilitación que pudiera resultar aplicable en el futuro.


## 12. ASESORLEX

EXPERT está asociada a ASESORLEX. A fecha de revisión 22/09/2026:
- ASESORLEX publica convenios de colaboración social con AEAT y administraciones tributarias autonómicas, además de CIRCE/PAE y acceso al Sistema RED;
- no se ha localizado en su catálogo público un convenio específico de representación en materia de Extranjería;
- no se ha podido acreditar su presencia en el listado oficial de entidades colaboradoras del Registro Electrónico de Extranjería.

Por tanto, la pertenencia a ASESORLEX no se utilizará como habilitación para presentar expedientes de Extranjería salvo que exista y se verifique posteriormente un convenio específico aplicable.

### Flujo remoto definitivo

1. Identificar trámite y sujeto legitimado.
2. Verificar que admite actuación por apoderado.
3. Preguntar si el cliente dispone de certificado electrónico/DNIe válido para Apoder@.
4. Si no dispone:
   - ofrecer `certificado-digital-persona-fisica` (90 € + IVA);
   - tramitarlo online;
   - ayudar a instalarlo/probarlo.
5. Generar instrucciones Apoder@ con los datos de Ksenia ILICHEVA, NIE X3576519L, y el trámite/SIA.
6. Cliente otorga el poder electrónicamente.
7. Ksenia acepta el poder con su certificado personal.
8. Comprobar estado **Autorizado** y guardar justificante/referencia REA en el expediente.
9. Desbloquear presentación profesional en Mercurio.
10. Al finalizar, revocar o dejar caducar el poder según alcance y vigencia.
