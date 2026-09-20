export const KIA_AEAT_KNOWLEDGE_PROMPT = `
<aeat_knowledge>
Conocimiento curado de la Agencia Tributaria (AEAT / Hacienda) para orientar a clientes.
EXPERT gestiona estos tramites profesionalmente. Kia orienta; la presentacion oficial la hace EXPERT o el propio cliente desde la sede electronica.
Nota general: plazos y cuantias se actualizan cada ejercicio. Siempre verificar en https://sede.agenciatributaria.gob.es/ para el ano en curso.

<aeat_irpf>
DECLARACION DE LA RENTA (IRPF):

Quien debe presentarla:
- En general, quien haya obtenido rentas del trabajo superiores a 22.000 EUR anuales de un pagador (o 15.000 EUR de dos o mas pagadores si el segundo supera 1.500 EUR).
- Siempre si eres autonomo, tienes rentas de alquiler, ganancias patrimoniales, rendimientos de capital o rentas del extranjero.
- Si has recibido subvenciones o ayudas publicas (ej. ayudas al alquiler, Plan MOVES).
- La obligacion exacta depende de la situacion personal — EXPERT revisa caso a caso.

Campana de la renta (ejercicio anterior):
- Habitualmente se abre a principios de abril y cierra el 30 de junio del ano siguiente al ejercicio.
- La presentacion con resultado a ingresar con domiciliacion bancaria cierra unos dias antes (normalmente el 25 de junio).
- Verificar fechas exactas en: https://sede.agenciatributaria.gob.es/Sede/Renta.html

Como obtener el numero de referencia (para acceder a Renta WEB sin certificado digital):
1. Ve a https://www1.agenciatributaria.gob.es/wlpl/DABJ-REN0/ObtenerReferenciaServlet
2. Opcion A (recomendada): usa Cl@ve Movil — escanea el QR con la app Cl@ve y autentica.
3. Opcion B: introduce DNI/NIE + dato de contraste (IBAN o casilla 505 del ano anterior) y recibe un PIN por SMS.
4. La referencia tiene 6 caracteres y es valida solo para la campana actual. Solo la ultima generada es valida.

Renta WEB: herramienta oficial de la AEAT para hacer y presentar la declaracion online.
Acceso: https://sede.agenciatributaria.gob.es/Sede/Renta.html
</aeat_irpf>

<aeat_iva>
IVA (Impuesto sobre el Valor Anadido):

Quien lo aplica: autonomos y empresas que realizan actividades economicas sujetas a IVA.
Tipos generales: 21% (general), 10% (reducido, ej. hosteleria, transporte), 4% (superreducido, ej. alimentos basicos).
Algunos autonomos en regimen de modulos o en actividades exentas no aplican IVA.

Modelos recurrentes de IVA e informativas:
- Modelo 303 — liquidacion periodica del IVA; para vencimientos exactos consultar AEAT_TAX_CALENDAR_2026.
- Modelo 390 — resumen anual del IVA: consultar INFORMATIVE_RETURNS_2026 para obligacion/exoneraciones y AEAT_TAX_CALENDAR_2026 para fecha exacta.
- Modelo 349 — operaciones intracomunitarias: la periodicidad puede ser mensual o trimestral segun el volumen y las reglas aplicables; consultar INFORMATIVE_RETURNS_2026.
- No inferir periodicidad o fecha exacta solo por el nombre del modelo.
</aeat_iva>

<aeat_autonomos>
AUTONOMOS EN HACIENDA:

Alta en Hacienda (obligatoria antes o al inicio de la actividad):
- Modelo 036 — declaracion censal; las herramientas de asistencia incorporan la simplificacion que antes ofrecía el Modelo 037.
  * Indica la actividad economica (epigrafe IAE), la fecha de inicio, el tipo de IRPF y si eres sujeto pasivo de IVA.
- Si no tienes certificado digital ni Cl@ve PIN, EXPERT puede gestionar el alta.

IRPF pagos fraccionados:
- Modelos 130 y 131: consultar IRPF_PAYMENT_FRACTIONS_2026 antes de calcular o decidir obligacion.
- Modelo 130: estimacion directa; usar acumulado desde 1 de enero, pagos previos, retenciones y excepciones del 70% cuando procedan.
- Modelo 131: estimacion objetiva; el porcentaje depende del tipo de actividad, datos-base/modulos y personal asalariado.
- En 3T y 4T de 2026 existen reglas especiales para actividades que cumplan requisitos en La Palma; no reutilizar porcentajes generales sin comprobar el territorio y el supuesto.
- Para vencimientos exactos consultar AEAT_TAX_CALENDAR_2026.

Retenciones en facturas:
- Autonomos en estimacion directa deben incluir retencion IRPF en sus facturas si el cliente es empresa o profesional (generalmente 15%, reducida al 7% los primeros anos de actividad).
- La retencion la ingresa el pagador a Hacienda via modelo 111 trimestral.

Baja en Hacienda:
- Tambien con modelo 036, indicando la fecha de cese de actividad.
</aeat_autonomos>

<aeat_otros_modelos>
OTROS MODELOS FRECUENTES:

Modelo 720 — bienes y derechos en el extranjero:
- Consultar MODEL_720_RULES antes de decidir si existe obligacion. El umbral no se aplica a todos los activos como una bolsa unica: hay categorias, reglas de valoracion y exenciones.
- La ventana ordinaria es 1 enero - 31 marzo del ano siguiente, pero revisar siempre el ejercicio y los supuestos de declaracion posterior.
- No tratar criptomonedas como Modelo 720 por defecto.

Modelo 721 — monedas virtuales situadas en el extranjero:
- Consultar MODEL_721_RULES. Verificar ubicacion del custodio, exclusiones y saldo conjunto antes de concluir que existe obligacion.
- No confundir saldo fiat en una cuenta extranjera con moneda virtual del Modelo 721.

Modelo 151 / regimen especial de desplazados:
- Consultar IMPARTIATES_149_151_RULES antes de informar requisitos, duracion o plazo.
- El Modelo 149 comunica opcion/renuncia/exclusion/fin del desplazamiento; el plazo de opcion depende de si es contribuyente principal o asociado.
- La declaracion anual del contribuyente acogido al regimen se presenta mediante Modelo 151.
- EXPERT revisa elegibilidad y documentacion antes de tramitar.

IRNR / No Residentes (modelo 210):
- Para personas sin residencia fiscal en Espana que obtienen rentas en Espana (alquiler de inmuebles, dividendos, etc.).
- La Orden HAC/623/2026 modifico los plazos del Modelo 210 y establecio reglas transitorias para devengos de 2026. No responder con una regla atemporal de "alquiler trimestral".
- Para alquileres e imputaciones inmobiliarias, consultar IRNR_210_2026_TRANSITION segun tipo de renta y fecha de devengo.
- EXPERT gestiona el modelo 210 para no residentes con inmuebles en Espana.

Notificaciones electronicas (DEHu / DEHU):
- La AEAT y otras administraciones envian notificaciones electronicas obligatorias.
- Es imprescindible tener certificado digital o Cl@ve activos para recibirlas.
- Portal: https://dehu.redsara.es/
- Si no se accede en plazo, la notificacion se tiene por recibida igualmente.
</aeat_otros_modelos>

<aeat_acceso_digital>
ACCESO A LA SEDE ELECTRONICA:

Opciones de identificacion:
1. Certificado digital (FNMT-RCM, Camerfirma u otros) — el mas completo y recomendado para profesionales y autonomos.
2. Cl@ve PIN — identificacion con movil, valida para muchos tramites.
3. Cl@ve Permanente — registro unico, sin caducidad, para tramites frecuentes.
4. Numero de referencia (solo para declaracion de la renta).
5. DNI electronico (DNIe) con lector de tarjetas.

Sede electronica AEAT: https://sede.agenciatributaria.gob.es/
Renta WEB: https://sede.agenciatributaria.gob.es/Sede/Renta.html
Cl@ve: https://clave.gob.es/
</aeat_acceso_digital>

<aeat_kia_rules>
REGLAS DE KIA PARA PREGUNTAS SOBRE AEAT/HACIENDA:
- Siempre distinguir entre "orientacion" (Kia puede dar pasos generales) y "presentacion de modelos" (EXPERT lo hace, o el cliente directamente con certificado digital).
- Para requerimientos, sanciones, inspecciones, recursos o embargos de Hacienda: orientacion inicial + recomendar llamada de 15 min con EXPERT de forma urgente.
- No inventar plazos ni cuantias exactas si no aparecen en este contexto; indicar que deben verificarse para el ejercicio actual.
- Verificar siempre si el cliente tiene o necesita certificado digital o Cl@ve — es la puerta de entrada a todos los tramites online.
- EXPERT gestiona: renta, IVA trimestral, autonomos, modelo 720, no residentes, modelo 151, recursos y tramites con Hacienda.
</aeat_kia_rules>
</aeat_knowledge>
`.trim();
