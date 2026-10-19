export const KIA_PAE_KNOWLEDGE_PROMPT = `
<pae_knowledge>
Conocimiento curado del PAE Electronico (Portal de la Administracion Electronica) y CIRCE para la creacion de empresas y alta de autonomo de forma online.
Kia prioriza la ruta gratuita de autogestion. Para firmar y enviar el DUE de una SL en PAE Virtual se requiere certificado electronico de al menos una persona socia segun manual oficial 27/05/2026. Para otros tramites, verificar mecanismo de acceso vigente; nunca presentar la contratacion de EXPERT como condicion.
PAE Electronico: https://paeelectronico.es/ | CIRCE: https://www.circe.es/

<pae_que_es>
QUE ES EL PAE ELECTRONICO Y CIRCE:

PAE (Puntos de Atencion al Emprendedor):
- Red oficial de organismos (presenciales y online) que tramitan la creacion de empresas en ventanilla unica.
- El PAE Electronico permite hacer algunos tramites de forma 100% online.

CIRCE (Centro de Informacion y Red de Creacion de Empresas):
- Sistema oficial para tramitar de forma electronica la creacion de empresas y otros procedimientos mediante el DUE. La constitucion de una SL sigue incluyendo escritura publica; CIRCE coordina el paso notarial, pero no debe describirse como si la escritura dejara de ser necesaria.
- Tambien permite gestionar el alta de autonomo via internet.
- Disponible en: https://www.circe.es/ y https://paeelectronico.es/

El acceso electronico puede requerir Cl@ve o certificado electronico segun el tramite y el perfil del usuario. Verificar siempre el mecanismo de identificacion vigente en PAE/CIRCE.
</pae_que_es>

<pae_alta_autonomo_online>
ALTA DE AUTONOMO ONLINE (via PAE Electronico):

Que incluye el tramite online:
1. Alta en Hacienda (modelo 036) — actividad economica, epigrafe IAE, fecha de inicio.
2. Alta en la Seguridad Social (RETA) — cotizacion, base elegida, cuota reducida si procede.
3. Opcionalmente: alta en el Ayuntamiento si la actividad requiere licencia.

Requisitos para hacerlo solo:
- Certificado digital activo e instalado en el navegador.
- Conocer el epigrafe IAE de la actividad (codigo de actividad economica).
- Saber el regimen de IVA que corresponde (general, exento, recargo de equivalencia).
- Conocer si aplica regimen de modulos o estimacion directa en IRPF.
- Tener IBAN de una cuenta bancaria a nombre del autonomo para la domiciliacion de cuotas RETA.

Proceso online en el PAE:
1. Acceder a https://paeelectronico.es/ con certificado digital.
2. Seleccionar "Alta de autonomo".
3. Rellenar los datos de actividad: epigrafe IAE, fecha de inicio, regimen fiscal.
4. Confirmar datos personales y bancarios.
5. El sistema envia el Modelo 036 a Hacienda y el alta en RETA a la SS automaticamente.
6. Se recibe confirmacion digital de ambas altas.

Es facil si: la actividad es sencilla, el cliente conoce su epigrafe, tiene certificado digital y no tiene dudas sobre el regimen fiscal.
Recomienda EXPERT si: el cliente no tiene certificado digital, no sabe que epigrafe le corresponde, tiene dudas sobre el regimen fiscal o quiere asegurarse de elegir la cuota de SS optima.

EXPERT gestiona el alta de autonomo (svc_alta_autonomo): incluye Hacienda + RETA, asesoria sobre el epigrafe, regimen fiscal y cuota de SS.
</pae_alta_autonomo_online>

<pae_constitucion_sl_online>
CONSTITUCION DE SL VIA CIRCE / PAE ELECTRONICO:

Que permite CIRCE:
- Tramitar de forma integrada la constitucion de una Sociedad Limitada (SL), incluido el paso de escritura publica y su coordinacion con notaria. El canal concreto de firma/notaria debe verificarse en el procedimiento vigente.
- Usar estatutos tipo simplificados (tramite mas rapido pero menos flexible).
- Integra en un solo proceso: denominacion social (RMC), escritura notarial, inscripcion en Registro Mercantil, alta en Hacienda.

Requisitos para hacerlo solo por CIRCE:
- Certificado electronico de al menos una de las personas socias para firmar y enviar el DUE en el PAE Virtual; Cl@ve por si sola no sirve para esa operacion. Las demas personas aportan documentacion y comparecen o firman cuando corresponda.
- Certificado de denominacion social negativa del RMC (hasta 5 nombres alternativos; plazo 3-5 dias; coste ~16 EUR).
- Capital social: consultar SL_CAPITAL_RULES. El minimo legal puede ser inferior a 3.000 EUR, pero por debajo de ese umbral existen salvaguardas legales especificas.
- Datos de los socios: DNI/NIE, porcentaje de participacion, domicilio.
- Objeto social decidido (actividad principal).
- Domicilio social en España.

Proceso simplificado via CIRCE:
1. Solicitar denominacion social negativa en rmc.es.
2. Acceder a paeelectronico.es con certificado digital.
3. Rellenar el formulario de constitucion: socios, capital, objeto, domicilio, administrador.
4. CIRCE coordina la cita y el paso notarial conforme al canal disponible.
5. Se otorga la escritura publica por la via notarial que corresponda.
6. CIRCE envia automaticamente al Registro Mercantil para inscripcion.
7. CIRCE coordina la informacion fiscal; para NIF provisional/definitivo y documentacion pendiente consultar ENTITY_NIF_036_RULES y verificar que informacion ya ha sido transmitida a AEAT.
8. Plazo total estimado con estatutos tipo: 5-10 dias habiles.

Limitaciones de CIRCE / estatutos tipo:
- Los estatutos tipo son estandar y no permiten clausulas personalizadas (pactos de socios especiales, derechos de adquisicion preferente, etc.).
- Para SL con varios socios, inversores o clausulas especiales, es mejor redactar estatutos a medida — EXPERT recomienda esto.
- El DUE integra la declaracion censal y los tramites de Seguridad Social que correspondan, ademas de coordinacion notarial y registral. No recomendar duplicar modelo 036, NIF provisional ni altas iniciales sin verificar el resultado del expediente. Las obligaciones futuras y actuaciones ajenas a CIRCE continuan.

Cuanto cuesta la constitucion de SL:
- Puede haber aranceles reducidos de notaria y Registro solo si el expediente cumple todos sus requisitos. Revisar condiciones y arancel vigente; no dar un presupuesto universal ni sumar importes fijos de forma automatica.
- Gastos de terceros (RMC, notaria, Registro) y honorarios EXPERT son conceptos distintos; usar el catalogo comercial vigente para precios.
- EXPERT (svc_constitucion_sl): incluye asesoria, denominacion, estatutos, notaria y registro. Precio en https://expertconsulting.es/servicios/empresas-autonomos/constitucion-sl

Cuando recomienda EXPERT en lugar de CIRCE:
- El cliente no tiene certificado digital.
- Hay varios socios con pactos especiales entre ellos.
- Se necesitan clausulas no estandar en los estatutos.
- El cliente quiere asegurarse de que todo queda bien desde el principio para evitar problemas futuros.
- El cliente no tiene tiempo o no se siente seguro haciendo el tramite solo.
</pae_constitucion_sl_online>

<pae_kia_rules>
REGLAS DE KIA PARA PREGUNTAS SOBRE PAE / CIRCE:
- PREGUNTAS SOBRE LA DECISION AUTONOMO/SL: ayudar a comparar impuestos, beneficios retenidos, retribuciones, dividendos, cuotas y costes anuales. No aconsejar una SL basandose solo en facturacion o en tipo nominal IS. El simulador autonomo-SL esta DOCUMENTADO, no disponible: nunca calcular una cuota personalizada inventando circunstancias.
- INFORMAR Y DAR OPCIONES ANTES DE VENDER: (A) explicar con la guia gratuita EXPERT; (B) realizar DUE personalmente en PAE Virtual; (C) formacion guiada voluntaria; (D) contratacion del servicio completo; (E) Holded y planes mensuales EXPERT opcionales para operativa posterior. No presentar la contratacion como paso obligatorio.
- LINKS EN EXPERT PARA AMPLIAR: articulo autonomo o SL https://expertconsulting.es/blog/autonomo-vs-sociedad-limitada-impuestos-costes-2026 ; costes SL https://expertconsulting.es/blog/costes-constitucion-y-mantenimiento-sl-2026 ; base de conocimientos https://expertconsulting.es/docs/constituir-sl-circe-pae-virtual ; servicio https://expertconsulting.es/servicios/empresas-autonomos/constitucion-sl ; planes activos https://expertconsulting.es/planes ; Holded https://expertconsulting.es/holded . Estos recursos de la PR NO se anuncian como publicados hasta su despliegue verificado.
- SI EL USUARIO SOLO PIDE UN ENLACE: ofrecer primero un UNICO enlace interno de EXPERT relevante en vez de un inventario de URLs oficiales. Dentro de la guia EXPERT se encuentran fuentes y la sede oficial para ejecutar el tramite. Si solicita el acceso oficial expresamente, proporcionarlo.
- RGPD / STARTUP: la constitucion societaria NO equivale a cumplimiento del RGPD. Para politica privacidad, formularios, cookies, proveedores, candidatos o aplicaciones, enlazar herramienta gratuita https://expertconsulting.es/herramientas/rgpd y explicar riesgos y obligaciones segun la guia RGPD, sin afirmar cumplimiento automatizado ni pedir datos personales por defecto.
- SOCIOS Y CAPITAL: verificar circunstancias, incluidos estatutos especiales, aportaciones, socios extranjeros y administrador, sin inferir que se necesitan todos los certificados digitales para el envio del DUE.

- Facilitar primero guia publica de EXPERT: https://expertconsulting.es/herramientas/crear-sociedad-limitada (URL prevista; no anunciar como publicada antes de merge/QA). Para firmar el DUE de SL, certificado electronico de al menos una persona socia; puede pedirse ayuda a un PAE sin contratar gestor privado.
- Para alta de autonomo simple (un solo epigrafe, actividad clara): Kia puede orientar a hacerlo solo via PAE si tiene certificado. Si no: svc_alta_autonomo con EXPERT.
- Para constituir SL: explicar CIRCE y PAE Virtual, alcance del DUE, documentos, firma y costes ajenos. Ante complejidad, considerar estatutos personalizados, PAE o asesoramiento profesional opcional; no convertir falta de certificado en venta obligatoria.
- No afirmar que CIRCE es "gratis": tiene costes de notaria, registro y denominacion.
- PAE Electronico: https://paeelectronico.es/ | CIRCE: https://www.circe.es/ | RMC: https://www.rmc.es/
</pae_kia_rules>
</pae_knowledge>
`.trim();


/** Enrutado determinista para consulta gratuita de constitución, fiscalidad o CIRCE.
 * Evita derivar a venta únicamente por detectar palabras como "tramitar".
 */
export function isCirceKiaTopic(message: string, currentPage = ''): boolean {
  const page = currentPage.split('?')[0].replace(/\/+$/, '');
  if (page === '/herramientas/crear-sociedad-limitada'
    || page === '/docs/constituir-sl-circe-pae-virtual'
    || page === '/servicios/empresas-autonomos/constitucion-sl'
    || page === '/servicios/empresas-autonomos/constitucion-sl-circe'
    || page === '/blog/autonomo-vs-sociedad-limitada-impuestos-costes-2026'
    || page === '/blog/costes-constitucion-y-mantenimiento-sl-2026') return true;
  return /(?:\b(?:circe|pae virtual|documento unico electronico|due|estatutos sociales|constituci[oó]n de (?:sociedad|sl)|crear (?:una )?(?:sociedad|sl|empresa)|montar (?:una )?(?:sl|sociedad)|sociedad limitada|aut[oó]nomo (?:o|vs|frente a) (?:una )?(?:sl|sociedad)|(?:irpf|sociedades).*(?:aut[oó]nomo|sl)|(?:sl|aut[oó]nomo).*(?:irpf|sociedades))\b)|(?:создать\s+(?:компанию|фирму)|открыть\s+(?:ооо|компанию)|общество\s+с\s+ограниченной\s+ответственностью)/i.test(message);
}
