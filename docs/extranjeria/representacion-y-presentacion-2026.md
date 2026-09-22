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
