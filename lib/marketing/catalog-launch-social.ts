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
  },
];

export function getServiceLaunchPack(serviceSlug: string): ServiceLaunchPack | undefined {
  return catalogLaunchSocialPacks.find((pack) => pack.serviceSlug === serviceSlug);
}
