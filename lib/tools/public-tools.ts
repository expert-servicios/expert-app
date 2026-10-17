/**
 * Inventario curado de herramientas públicas verificadas en el catálogo EXPERT.
 * "Gratuito" se refiere al uso de la herramienta, NO a los servicios presupuestados.
 * No incluir ideas, funcionalidades con gate ni rutas noindex.
 */
export type PublicToolCategory = 'proteccion-datos' | 'fiscalidad' | 'empresas' | 'holded';
export type PublicToolType = 'diagnostico' | 'calculadora';

export type PublicTool = {
  id: string;
  title: string;
  description: string;
  category: PublicToolCategory;
  type: PublicToolType;
  href: string;
  action: string;
  relatedServiceSlugs: string[];
};

export const publicToolCategories: Array<{ id: PublicToolCategory; title: string; description: string }> = [
  {
    id: 'proteccion-datos',
    title: 'Protección de datos',
    description: 'Identifica los aspectos de privacidad que conviene revisar en tu actividad.',
  },
  {
    id: 'fiscalidad',
    title: 'Fiscalidad y declaraciones',
    description: 'Calcula los honorarios orientativos de trámites fiscales habituales.',
  },
  {
    id: 'empresas',
    title: 'Empresas y trámites',
    description: 'Prepara una estimación según las gestiones que necesita tu empresa.',
  },
  {
    id: 'holded',
    title: 'Holded, nóminas y formación',
    description: 'Estima el alcance económico de servicios de migración y formación.',
  },
];

export const publicTools: PublicTool[] = [
  {
    id: 'rgpd',
    title: 'Autoevaluación RGPD',
    description: 'Cuestionario gratuito para identificar áreas de privacidad, obtener orientación inicial y consultar recursos oficiales de la AEPD. No constituye una certificación.',
    category: 'proteccion-datos',
    type: 'diagnostico',
    href: '/herramientas/rgpd',
    action: 'Iniciar autoevaluación',
    relatedServiceSlugs: ['formacion-rgpd-aepd'],
  },
  {
    id: 'irpf',
    title: 'Calculadora de honorarios IRPF',
    description: 'Estima el coste de preparar la declaración de la Renta según modalidad y rendimientos adicionales. No calcula la cuota del impuesto.',
    category: 'fiscalidad',
    type: 'calculadora',
    href: '/servicios/declaraciones-impuestos/irpf#calculadora-honorarios',
    action: 'Calcular honorarios',
    relatedServiceSlugs: ['irpf'],
  },
  {
    id: 'irnr',
    title: 'Calculadora de honorarios IRNR',
    description: 'Estima el precio de las declaraciones de no residentes según inmuebles, titulares y ejercicios. No calcula el impuesto a pagar.',
    category: 'fiscalidad',
    type: 'calculadora',
    href: '/servicios/declaraciones-impuestos/no-residentes#calculadora-honorarios',
    action: 'Calcular honorarios',
    relatedServiceSlugs: ['no-residentes'],
  },
  {
    id: 'patrimonio',
    title: 'Calculadora de honorarios de Patrimonio',
    description: 'Obtén una estimación del precio de preparación del Modelo 714 y conoce los supuestos que necesitan revisión previa.',
    category: 'fiscalidad',
    type: 'calculadora',
    href: '/servicios/declaraciones-impuestos/impuesto-patrimonio#calculadora-honorarios',
    action: 'Calcular honorarios',
    relatedServiceSlugs: ['impuesto-patrimonio'],
  },
  {
    id: 'nif-socios',
    title: 'Calculadora de NIF para socios extranjeros',
    description: 'Consulta el precio estimado de la gestión según el número de socios o administradores que necesitan NIF.',
    category: 'empresas',
    type: 'calculadora',
    href: '/servicios/empresas-autonomos/nif-socio-extranjero#calculadora-honorarios',
    action: 'Calcular honorarios',
    relatedServiceSlugs: ['nif-socio-extranjero'],
  },
  {
    id: 'migracion-laboral',
    title: 'Calculadora de migración laboral a Holded',
    description: 'Calcula los honorarios orientativos de migración por empleado, conforme al mínimo de unidades del servicio. No es una auditoría laboral automática.',
    category: 'holded',
    type: 'calculadora',
    href: '/holded/migracion-laboral#calculadora-honorarios',
    action: 'Calcular migración',
    relatedServiceSlugs: ['holded-migracion-laboral'],
  },
];

export function getPublicToolsForService(serviceSlug: string): PublicTool[] {
  return publicTools.filter((tool) => tool.relatedServiceSlugs.includes(serviceSlug));
}
