export type SocialChannel = 'facebook' | 'instagram' | 'linkedin';

export type SocialPostDraft = {
  id: string;
  channel: SocialChannel;
  format: 'educational' | 'problem_solution' | 'cta' | 'expert' | 'comparison' | 'carousel';
  title: string;
  shortCopy: string;
  longCopy: string;
  cta: string;
  destinationPath: string;
  utmCampaign: string;
  supportingContentPath?: string;
  status: 'draft' | 'review' | 'ready' | 'published';
};

export type ServiceLaunchPack = {
  serviceSlug: string;
  locale: 'es';
  status: 'draft' | 'content_ready' | 'channel_ready' | 'published';
  posts: SocialPostDraft[];
};

const arraigoCampaign = 'expert_catalog_launch_arraigo-social';
const personalCertificateCampaign = 'expert_catalog_launch_certificado-digital-persona-fisica';
const entityCertificateCampaign = 'expert_catalog_launch_certificado-digital-entidad';

export const catalogLaunchSocialPacks: ServiceLaunchPack[] = [
  {
    serviceSlug: 'arraigo-social',
    locale: 'es',
    status: 'content_ready',
    posts: [
      {
        id: 'arraigo-social-facebook-educational',
        channel: 'facebook',
        format: 'educational',
        title: 'Arraigo social 2026: ya no son 3 años',
        shortCopy:
          'El arraigo social vigente exige, con carácter general, 2 años de permanencia continuada. También hay que encajar correctamente la vía familiar o de integración social.',
        longCopy:
          'El arraigo social cambió y todavía circula mucha información antigua. La regla general actual es acreditar al menos 2 años de permanencia continuada en España, con ausencias no superiores a 90 días. Además, el expediente debe justificarse por vínculos familiares con medios económicos suficientes o, si no concurren esos vínculos, mediante informe favorable de integración social. El contrato de trabajo no es el requisito específico del arraigo social: esa lógica corresponde al arraigo sociolaboral. En nuestra guía 2026 explicamos requisitos, EX-10, tasa y documentación.',
        cta: 'Consulta la guía completa',
        destinationPath: '/docs/arraigo-social-requisitos-y-proceso',
        utmCampaign: arraigoCampaign,
        supportingContentPath: '/blog/arraigo-social-2025',
        status: 'review',
      },
      {
        id: 'arraigo-social-facebook-problem',
        channel: 'facebook',
        format: 'problem_solution',
        title: '¿Tienes huecos en el padrón?',
        shortCopy:
          'Un hueco en el padrón no significa automáticamente que no puedas acreditar los 2 años. Hay que reconstruir la cronología con documentación válida.',
        longCopy:
          'Uno de los errores más frecuentes en arraigo social es pensar que solo sirve el empadronamiento. El padrón histórico es una prueba muy importante, pero la Administración puede valorar otra documentación oficial que permita situarte en España. Lo importante es construir una línea temporal coherente de 2 años y revisar también las ausencias del territorio español.',
        cta: 'Ver cómo acreditar los 2 años',
        destinationPath: '/docs/arraigo-social-acreditar-dos-anos',
        utmCampaign: arraigoCampaign,
        status: 'review',
      },
      {
        id: 'arraigo-social-facebook-cta',
        channel: 'facebook',
        format: 'cta',
        title: 'Antes de presentar, comprueba la vía correcta',
        shortCopy:
          'Arraigo social, sociolaboral, familiar… elegir mal la vía puede hacerte perder tiempo y documentación.',
        longCopy:
          'Antes de recopilar certificados, traducciones y tasas conviene confirmar qué modalidad de arraigo corresponde realmente. En EXPERT revisamos permanencia, situación migratoria, vínculos familiares, medios económicos, integración social y posibles incidencias antes de preparar el expediente.',
        cta: 'Revisar el servicio de Arraigo Social',
        destinationPath: '/servicios/extranjeria-nacionalidad/arraigo-social',
        utmCampaign: arraigoCampaign,
        supportingContentPath: '/blog/arraigo-social-vs-sociolaboral-2026',
        status: 'review',
      },
      {
        id: 'arraigo-social-instagram-carousel',
        channel: 'instagram',
        format: 'carousel',
        title: 'Arraigo social 2026 en 7 slides',
        shortCopy:
          '2 años · 90 días máximo fuera · EX-10 · vía familiar o integración · tasa 790-052.',
        longCopy:
          'Carrusel propuesto: 1) Arraigo social 2026: qué cambió. 2) Ya no son 3 años: son 2 años de permanencia continuada. 3) Ausencias: máximo 90 días. 4) Vía familiar: vínculos + medios económicos. 5) Sin esos vínculos: informe favorable de integración social. 6) Formulario EX-10 y tasa 790-052. 7) CTA: revisa primero si esta es tu vía correcta.',
        cta: 'Guarda el carrusel y consulta la guía',
        destinationPath: '/docs/arraigo-social-requisitos-y-proceso',
        utmCampaign: arraigoCampaign,
        status: 'review',
      },
      {
        id: 'arraigo-social-instagram-caption',
        channel: 'instagram',
        format: 'educational',
        title: 'No confundas social con sociolaboral',
        shortCopy:
          'El contrato de trabajo no es el requisito específico del arraigo social vigente.',
        longCopy:
          'Si tu principal elemento de regularización es una relación laboral, quizá estés mirando la modalidad equivocada. Arraigo social y arraigo sociolaboral comparten parte del contexto, pero no los mismos requisitos. Antes de presentar, identifica primero la vía y después prepara la documentación.',
        cta: 'Lee la comparativa',
        destinationPath: '/blog/arraigo-social-vs-sociolaboral-2026',
        utmCampaign: arraigoCampaign,
        status: 'review',
      },
      {
        id: 'arraigo-social-instagram-cta',
        channel: 'instagram',
        format: 'cta',
        title: 'Checklist antes de pagar tasas',
        shortCopy:
          'Tiempo en España, ausencias, protección internacional, vínculos, medios, integración y antecedentes.',
        longCopy:
          'Antes de presentar un arraigo social revisa siete puntos: fecha real desde la que puedes acreditar permanencia, ausencias, posibles periodos de protección internacional, situación migratoria actual, vínculos familiares, medios económicos/integración y antecedentes. Una revisión previa evita recopilar documentos para una vía que no corresponde.',
        cta: 'Revisar Arraigo Social',
        destinationPath: '/servicios/extranjeria-nacionalidad/arraigo-social',
        utmCampaign: arraigoCampaign,
        status: 'review',
      },
      {
        id: 'arraigo-social-linkedin-expert',
        channel: 'linkedin',
        format: 'expert',
        title: 'Arraigo social 2026: un cambio que obliga a actualizar procesos',
        shortCopy:
          'Seguir trabajando con la regla de 3 años genera expedientes mal orientados y contenido jurídico obsoleto.',
        longCopy:
          'La actualización del arraigo social no es un simple cambio de plazo. Cambia también la lógica documental del expediente. La referencia general pasa a 2 años de permanencia continuada y cobra especial importancia distinguir entre la vía basada en vínculos familiares con medios económicos y la vía basada en integración social. Para despachos, asesores y equipos de atención esto exige revisar landings, checklists, asistentes IA y materiales de soporte para evitar respuestas contradictorias.',
        cta: 'Ver guía 2026',
        destinationPath: '/docs/arraigo-social-requisitos-y-proceso',
        utmCampaign: arraigoCampaign,
        status: 'review',
      },
      {
        id: 'arraigo-social-linkedin-comparison',
        channel: 'linkedin',
        format: 'comparison',
        title: 'Arraigo social vs. sociolaboral: la confusión más costosa',
        shortCopy:
          'La existencia de una relación laboral no convierte automáticamente el caso en arraigo social.',
        longCopy:
          'En la práctica comercial y en contenidos antiguos se sigue mezclando arraigo social con la vía sociolaboral. Es un error de clasificación que afecta a la documentación, la viabilidad y las expectativas del cliente. La primera decisión debe ser identificar la modalidad correcta; solo después tiene sentido solicitar documentos.',
        cta: 'Consultar comparativa',
        destinationPath: '/blog/arraigo-social-vs-sociolaboral-2026',
        utmCampaign: arraigoCampaign,
        status: 'review',
      },
      {
        id: 'arraigo-social-linkedin-cta',
        channel: 'linkedin',
        format: 'cta',
        title: 'De contenido jurídico a proceso operativo coherente',
        shortCopy:
          'Landing, KIA, viabilidad, guías y marketing deben responder con la misma regla.',
        longCopy:
          'En EXPERT estamos llevando cada servicio del nuevo catálogo a un estándar único: normativa validada, landing ES/RU, base de conocimientos, artículos, asistente KIA, checkout y contenidos de captación alineados. Arraigo Social es el primer caso del lote de extranjería que ya se está cerrando bajo este modelo.',
        cta: 'Ver servicio',
        destinationPath: '/servicios/extranjeria-nacionalidad/arraigo-social',
        utmCampaign: arraigoCampaign,
        status: 'review',
      },
    ],
  },,
  {
    serviceSlug: 'certificado-digital-persona-fisica',
    locale: 'es',
    status: 'content_ready',
    posts: [
      {
        id: 'cert-pf-facebook-educational',
        channel: 'facebook',
        format: 'educational',
        title: 'Qué puedes hacer con tu certificado digital personal',
        shortCopy: 'AEAT, Seguridad Social, escritos, solicitudes y firma electrónica desde un único certificado.',
        longCopy: 'El certificado digital de persona física te permite identificarte electrónicamente y realizar numerosos trámites sin desplazamientos. En EXPERT tramitamos la modalidad Camerfirma de persona física, la instalamos y comprobamos su funcionamiento contigo.',
        cta: 'Ver usos y requisitos',
        destinationPath: '/blog/certificado-digital-persona-fisica-usos-aeat-seguridad-social',
        utmCampaign: personalCertificateCampaign,
        status: 'review',
      },
      {
        id: 'cert-pf-facebook-problem',
        channel: 'facebook',
        format: 'problem_solution',
        title: '¿Cl@ve o certificado digital?',
        shortCopy: 'No son lo mismo: depende de si solo necesitas identificarte o también firmar y trabajar con distintas sedes.',
        longCopy: 'Cl@ve es muy cómoda para muchos trámites personales. El certificado digital añade una capa distinta de identificación y firma. Antes de elegir, conviene pensar qué sedes usas y si necesitas firmar documentos electrónicamente.',
        cta: 'Ver comparativa',
        destinationPath: '/blog/certificado-digital-persona-fisica-vs-clave-dnie',
        utmCampaign: personalCertificateCampaign,
        status: 'review',
      },
      {
        id: 'cert-pf-facebook-cta',
        channel: 'facebook',
        format: 'cta',
        title: 'Certificado Camerfirma de persona física con instalación incluida',
        shortCopy: '90 € + IVA · modalidad EXPERT con 5 años de vigencia.',
        longCopy: 'Tramitamos tu certificado digital Camerfirma de persona física y te ayudamos con la instalación y la prueba de funcionamiento. La modalidad comercializada por EXPERT tiene 5 años de vigencia.',
        cta: 'Solicitar certificado',
        destinationPath: '/servicios/certificado-digital/certificado-digital-persona-fisica',
        utmCampaign: personalCertificateCampaign,
        status: 'review',
      },
      {
        id: 'cert-pf-instagram-carousel',
        channel: 'instagram',
        format: 'carousel',
        title: 'Certificado digital personal en 6 slides',
        shortCopy: 'Qué es · para qué sirve · qué necesitas · instalación · seguridad · vigencia.',
        longCopy: 'Carrusel: 1) Qué es. 2) Usos ante AEAT y Seguridad Social. 3) DNI/TIE y datos necesarios. 4) Instalación en tu equipo. 5) Copia segura. 6) Modalidad EXPERT: 90 € + IVA y 5 años de vigencia.',
        cta: 'Guarda esta guía',
        destinationPath: '/docs/certificado-digital-persona-fisica-documentacion-instalacion',
        utmCampaign: personalCertificateCampaign,
        status: 'review',
      },
      {
        id: 'cert-pf-instagram-security',
        channel: 'instagram',
        format: 'educational',
        title: 'Tu certificado no se comparte',
        shortCopy: 'El fichero y su contraseña son credenciales sensibles.',
        longCopy: 'Después de instalar un certificado digital conviene crear una copia segura, protegerla con contraseña y evitar enviarla por mensajería o email sin protección. La custodia es parte de la seguridad de tu identidad digital.',
        cta: 'Ver guía de seguridad',
        destinationPath: '/docs/certificado-digital-persona-fisica-seguridad-copia-renovacion',
        utmCampaign: personalCertificateCampaign,
        status: 'review',
      },
      {
        id: 'cert-pf-instagram-cta',
        channel: 'instagram',
        format: 'cta',
        title: '¿Necesitas operar online con la Administración?',
        shortCopy: 'Te entregamos el certificado instalado y probado.',
        longCopy: 'Si trabajas con AEAT, Seguridad Social u otras sedes electrónicas, un certificado personal bien instalado evita depender de trámites presenciales y te permite firmar cuando el procedimiento lo admite.',
        cta: 'Solicitar ahora',
        destinationPath: '/servicios/certificado-digital/certificado-digital-persona-fisica',
        utmCampaign: personalCertificateCampaign,
        status: 'review',
      },
      {
        id: 'cert-pf-linkedin-expert',
        channel: 'linkedin',
        format: 'expert',
        title: 'La identidad digital ya es infraestructura básica profesional',
        shortCopy: 'Para autónomos y profesionales, el certificado personal es una herramienta operativa, no un extra.',
        longCopy: 'Cuando una persona trabaja de forma habitual con AEAT, Seguridad Social y sedes electrónicas, la identidad digital se convierte en infraestructura de trabajo. La clave no es solo emitir el certificado: también hay que instalarlo, custodiarlo y planificar su renovación.',
        cta: 'Ver guía práctica',
        destinationPath: '/docs/certificado-digital-persona-fisica-documentacion-instalacion',
        utmCampaign: personalCertificateCampaign,
        status: 'review',
      },
      {
        id: 'cert-pf-linkedin-comparison',
        channel: 'linkedin',
        format: 'comparison',
        title: 'Certificado digital, Cl@ve y DNIe: tres herramientas, tres usos',
        shortCopy: 'Elegir por comodidad sin mirar el trámite genera fricción después.',
        longCopy: 'Cl@ve, DNIe y certificado digital se solapan en algunos trámites, pero no son intercambiables en todos los escenarios. Una buena decisión parte del uso real: identificación, firma, frecuencia y dispositivo.',
        cta: 'Leer comparativa',
        destinationPath: '/blog/certificado-digital-persona-fisica-vs-clave-dnie',
        utmCampaign: personalCertificateCampaign,
        status: 'review',
      },
      {
        id: 'cert-pf-linkedin-cta',
        channel: 'linkedin',
        format: 'cta',
        title: 'Certificado personal Camerfirma: emisión + instalación',
        shortCopy: '90 € + IVA · modalidad EXPERT 5 años.',
        longCopy: 'Nuestro servicio incluye verificación, emisión, instalación y prueba de funcionamiento. La contratación se vincula al perfil personal del titular.',
        cta: 'Ver servicio',
        destinationPath: '/servicios/certificado-digital/certificado-digital-persona-fisica',
        utmCampaign: personalCertificateCampaign,
        status: 'review',
      },
    ],
  },
  {
    serviceSlug: 'certificado-digital-entidad',
    locale: 'es',
    status: 'content_ready',
    posts: [
      {
        id: 'cert-ent-facebook-educational',
        channel: 'facebook',
        format: 'educational',
        title: 'Tu empresa no necesita "cualquier certificado"',
        shortCopy: 'Representante, corporativo y sello electrónico no cumplen la misma función.',
        longCopy: 'Antes de solicitar un certificado para una empresa hay que definir quién lo utilizará y con qué facultades. Camerfirma distingue certificados de representante, corporativos y sellos electrónicos. Elegir bien evita problemas cuando llegue el momento de firmar o actuar ante una Administración.',
        cta: 'Ver tipos y diferencias',
        destinationPath: '/docs/certificado-digital-entidad-tipos-usos-seguridad',
        utmCampaign: entityCertificateCampaign,
        status: 'review',
      },
      {
        id: 'cert-ent-facebook-docs',
        channel: 'facebook',
        format: 'problem_solution',
        title: 'Qué documentos necesita el representante de una empresa',
        shortCopy: 'No basta con el DNI: hay que acreditar entidad y facultades.',
        longCopy: 'En los certificados vinculados a una organización se verifica tanto la identidad del representante como la existencia de la entidad y sus poderes. Escrituras, nombramientos, estatutos o poderes pueden ser necesarios según el tipo de organización.',
        cta: 'Ver checklist',
        destinationPath: '/docs/certificado-digital-entidad-documentos-representante',
        utmCampaign: entityCertificateCampaign,
        status: 'review',
      },
      {
        id: 'cert-ent-facebook-cta',
        channel: 'facebook',
        format: 'cta',
        title: 'Certificado digital de entidad con revisión documental',
        shortCopy: '150 € + IVA · modalidad EXPERT con 2 años de vigencia.',
        longCopy: 'Revisamos documentación de la organización y facultades del representante, emitimos el certificado y ayudamos con la instalación y prueba de funcionamiento.',
        cta: 'Solicitar certificado',
        destinationPath: '/servicios/certificado-digital/certificado-digital-entidad',
        utmCampaign: entityCertificateCampaign,
        status: 'review',
      },
      {
        id: 'cert-ent-instagram-carousel',
        channel: 'instagram',
        format: 'carousel',
        title: 'Certificado de empresa en 7 slides',
        shortCopy: 'Entidad · representante · poderes · tipo de certificado · instalación · seguridad · vigencia.',
        longCopy: 'Carrusel: 1) No todos los certificados empresariales son iguales. 2) Quién representa. 3) Qué documentos acreditan poderes. 4) Representante vs corporativo. 5) Sello electrónico. 6) Custodia interna. 7) Modalidad EXPERT: 150 € + IVA y 2 años.',
        cta: 'Guardar y consultar guía',
        destinationPath: '/docs/certificado-digital-entidad-tipos-usos-seguridad',
        utmCampaign: entityCertificateCampaign,
        status: 'review',
      },
      {
        id: 'cert-ent-instagram-change',
        channel: 'instagram',
        format: 'educational',
        title: '¿Ha cambiado el administrador?',
        shortCopy: 'Revisa certificados y accesos digitales antes de dar el cambio por cerrado.',
        longCopy: 'Cuando cambia un administrador o apoderado hay que revisar qué certificados siguen activos, quién los custodia y si procede revocar o sustituir credenciales.',
        cta: 'Ver checklist de cambio',
        destinationPath: '/blog/certificado-digital-entidad-cambio-administrador-revocacion',
        utmCampaign: entityCertificateCampaign,
        status: 'review',
      },
      {
        id: 'cert-ent-instagram-cta',
        channel: 'instagram',
        format: 'cta',
        title: 'Certificado para tu entidad, con la organización vinculada',
        shortCopy: 'El pedido y la factura se asocian a la entidad, no al perfil personal.',
        longCopy: 'En EXPERT el certificado de entidad se contrata vinculando la organización correspondiente. Así el flujo comercial y documental queda correctamente asociado desde el inicio.',
        cta: 'Ver servicio',
        destinationPath: '/servicios/certificado-digital/certificado-digital-entidad',
        utmCampaign: entityCertificateCampaign,
        status: 'review',
      },
      {
        id: 'cert-ent-linkedin-expert',
        channel: 'linkedin',
        format: 'expert',
        title: 'Gobernanza de certificados digitales en la empresa',
        shortCopy: 'Un certificado empresarial también necesita inventario, responsable y ciclo de revocación.',
        longCopy: 'Muchas empresas gestionan certificados como si fueran archivos sueltos. Es mejor tratarlos como credenciales corporativas: titular, facultades, dispositivo, vencimiento, responsable de custodia y procedimiento de revocación.',
        cta: 'Ver guía de seguridad',
        destinationPath: '/docs/certificado-digital-entidad-tipos-usos-seguridad',
        utmCampaign: entityCertificateCampaign,
        status: 'review',
      },
      {
        id: 'cert-ent-linkedin-comparison',
        channel: 'linkedin',
        format: 'comparison',
        title: 'Representante, corporativo o sello: la decisión previa a la emisión',
        shortCopy: 'La tecnología es la misma familia; las facultades no.',
        longCopy: 'Elegir un certificado de empresa por nombre o precio sin analizar el uso puede generar bloqueos posteriores. La decisión debe partir de la función: representación, pertenencia a la organización o automatización mediante sello.',
        cta: 'Leer comparativa',
        destinationPath: '/blog/certificado-digital-entidad-representante-o-sello',
        utmCampaign: entityCertificateCampaign,
        status: 'review',
      },
      {
        id: 'cert-ent-linkedin-cta',
        channel: 'linkedin',
        format: 'cta',
        title: 'Certificado digital de entidad Camerfirma con revisión previa',
        shortCopy: '150 € + IVA · modalidad EXPERT 2 años.',
        longCopy: 'Revisamos la documentación de la entidad y del representante antes de la emisión para reducir errores de modalidad o representación.',
        cta: 'Ver servicio',
        destinationPath: '/servicios/certificado-digital/certificado-digital-entidad',
        utmCampaign: entityCertificateCampaign,
        status: 'review',
      },
    ],
  }
];

export function getServiceLaunchPack(serviceSlug: string): ServiceLaunchPack | undefined {
  return catalogLaunchSocialPacks.find((pack) => pack.serviceSlug === serviceSlug);
}
