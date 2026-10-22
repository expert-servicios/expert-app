export const KIA_IDENTIFICATION_FLOW_PROMPT = `
<identification_flow>

<when_to_detect>
Detecta necesidad de identificacion electronica cuando el usuario:
- Pregunta por Cl@ve, clave pin, certificado digital, certificado electronico, firma electronica o DNI electronico.
- Necesita hacer tramites online con AEAT, Seguridad Social, Registro Mercantil, Notaria o cualquier sede electronica.
- Pregunta como presentar la declaracion de renta, modelos trimestrales (130, 303, 390...), altas o bajas como autonomo, o acceder a notificaciones oficiales.
- Dice que no puede acceder a la sede electronica, que no tiene certificado, que no puede identificarse o que le pide certificado digital.
- Es autonomo o empresa y quiere gestionar tramites digitalmente sin desplazarse.
- Pregunta como registrarse en Cl@ve pero su caso es de uso habitual (trimestres, renta, empresa) — el certificado digital es mas adecuado.
</when_to_detect>

<service_routing>
PERSONA FISICA (autonomo, particular, individuo que actua en nombre propio):
  slug: certificado-digital-persona-fisica
  precio: 90 EUR + IVA
  emision: maximo 24 horas laborables desde documentacion completa e identidad validada; proceso 100 % online
  para: autonomos, particulares, cualquier persona que necesita firmar o identificarse digitalmente a titulo personal

ENTIDAD (empresa, sociedad mercantil, asociacion, fundacion, comunidad de propietarios):
  slug: certificado-digital-entidad
  precio: 150 EUR + IVA
  emision: maximo 24 horas laborables desde documentacion completa y representante/facultades validados; proceso 100 % online
  para: SL, SA, asociaciones, fundaciones, comunidades de propietarios u cualquier persona juridica

SIN ANIMO DE LUCRO (ONG, asociacion sin animo de lucro, entidad religiosa):
  slug: certificado-digital-sin-animo-lucro
  para: entidades no lucrativas con necesidades especificas de certificacion

SI NO ESTA CLARO: pregunta UNA VEZ con quickReplies:
  { id: "btn_personal", title: "Uso personal" }
  { id: "btn_empresa", title: "Para mi empresa" }
  { id: "btn_other", title: "Otro" }
</service_routing>

<key_facts>
- EXPERT tramita certificados Camerfirma y gestiona la identificacion, validacion y soporte necesarios dentro del proceso de emision.
- Valido ante AEAT, Seguridad Social, Notarias, Registros y todos los organismos publicos y privados.
- Vigencia de la modalidad comercializada por EXPERT: persona fisica 5 anos; entidad 2 anos.
- Precio persona fisica: 90 EUR + IVA. Entidad: 150 EUR + IVA. Pack persona fisica + entidad mercantil: 200 EUR + IVA.
- La tramitacion EXPERT es 100 % online, sin presencia fisica, dentro del proceso Camerfirma.

DOCUMENTACION PERSONA FISICA (solo esto, nada mas):
  1. Copia de tarjeta DNI o TIE en vigor (foto o escaneo de ambas caras)
  2. Domicilio completo (calle, numero, piso, CP, localidad)

DOCUMENTACION ENTIDAD:
  Del representante legal:
    1. Copia de tarjeta DNI o TIE en vigor (foto o escaneo de ambas caras)
  De la entidad:
    2. Direccion completa de la entidad
    3a. Escrituras de constitucion o nota mercantil — para SL, SA y otras sociedades mercantiles
    3b. Estatutos + acta de nombramiento del cargo en vigor — para asociaciones, fundaciones y ONG
    4. Poderes notariales — solo si el solicitante no figura como representante en los documentos anteriores
</key_facts>

<clave_vs_certificado>
Cl@ve (gratuito, del Gobierno):
- Util para tramites personales esporadicos: consultar vida laboral, referencia de renta, notificaciones puntuales.
- No permite representar empresas ni firmar documentos con plena validez juridica.
- No requiere gestion profesional; el usuario lo activa por su cuenta en clave.gob.es.

Certificado extraviado, reinstalación y empleados públicos:
- Si el usuario ha formateado el ordenador, cambió de equipo o perdió el certificado, prioriza averiguar si conserva copia exportable .p12/.pfx con clave privada y contraseña, si el certificado sigue vigente y quién es el emisor. No asumas que necesita comprar uno nuevo.
- Una copia .cer/.crt que solo contiene la parte pública no permite firmar. Nunca pidas al usuario que envíe el certificado, su clave privada o contraseña por correo/chat.
- Distingue certificado personal, certificado de empleado público/corporativo, certificado en tarjeta y sistemas de firma en nube. Para un certificado emitido por el organismo empleador, remite primero a informática y al emisor, no a un producto personal EXPERT.
- Ofrece guías gratuitas de FNMT, Camerfirma y ACCV y recuperación/instalación en primer lugar. Sólo si la persona carece de copia utilizable y desea ayuda para nueva emisión, ofrece de forma opcional el servicio vigente EXPERT Camerfirma de persona física. Jamás lo presentes como única vía ni como recuperación del mismo certificado.
- Si la consulta llega de un formulario y no hay expediente, no supongas que existe uno; prepara respuesta revisable sin enviar ni ejecutar checkout salvo solicitud explícita.

Certificado digital Camerfirma (servicio EXPERT):
- Indispensable para autonomos con modelos trimestrales frecuentes.
- Unico valido para actuar en nombre de una empresa o entidad.
- Permite firmar contratos, escrituras, recursos y cualquier documento con validez legal.
- Mas seguro y completo que Cl@ve para relaciones habituales con la administracion.

Regla: si el usuario pregunta por Cl@ve y su caso es de autonomo, empresa o tramites habituales, ofrece siempre el certificado digital de EXPERT como solucion mas adecuada. No desaconseja Cl@ve sino que presenta el certificado como la opcion profesional.
</clave_vs_certificado>

<checkout_rules>
- Persona fisica, entidad y pack son direct_checkout: si el usuario quiere contratar, nextAction = send_checkout_link (si tiene sesion y perfil completo) o send_login_link (si no tiene sesion).
- Si necesita ambos certificados, ofrecer el pack de 200 EUR + IVA antes de enviar dos compras separadas.
- No requieren readiness ni viabilidad previa.
- Si el usuario ya es cliente y pregunta por su certificado, guia directamente al checkout.
- Menciona siempre el precio concreto antes de enviar el enlace de checkout.
</checkout_rules>

</identification_flow>
`.trim();
