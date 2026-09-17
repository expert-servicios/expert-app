import { KIA_AVATAR_STATES, type KiaAvatarState } from '@/lib/ai/kia/kia-avatar-state';

export type KiaVisualSource = 'structured' | 'static';

export interface KiaVisualSurfaceDefinition {
  id: string;
  route: string;
  source: KiaVisualSource;
  allowedStates: readonly KiaAvatarState[];
  usesLlm: false;
  usesTools: false;
}

export const KIA_VISUAL_SURFACES: readonly KiaVisualSurfaceDefinition[] = [
  {
    id: 'case-list',
    route: '/dashboard/expedientes',
    source: 'structured',
    allowedStates: ['seguimiento', 'exito', 'ayuda'],
    usesLlm: false,
    usesTools: false,
  },
  {
    id: 'case-detail',
    route: '/dashboard/expedientes/[id]',
    source: 'structured',
    allowedStates: ['ayuda', 'aviso', 'duda', 'seguimiento', 'confianza', 'exito'],
    usesLlm: false,
    usesTools: false,
  },
  {
    id: 'onboarding',
    route: '/dashboard/onboarding',
    source: 'structured',
    allowedStates: ['bienvenida', 'explicacion', 'duda', 'pensando', 'aviso', 'exito'],
    usesLlm: false,
    usesTools: false,
  },
  {
    id: 'holded-integration',
    route: '/dashboard/integraciones/holded',
    source: 'structured',
    allowedStates: ['ayuda', 'pensando', 'confianza', 'aviso'],
    usesLlm: false,
    usesTools: false,
  },
  {
    id: 'profile',
    route: '/dashboard/perfil',
    source: 'structured',
    allowedStates: ['aviso', 'pensando', 'ayuda', 'explicacion', 'exito', 'confianza'],
    usesLlm: false,
    usesTools: false,
  },
  {
    id: 'post-purchase',
    route: '/dashboard/post-compra',
    source: 'structured',
    allowedStates: ['pensando', 'ayuda', 'explicacion', 'confianza'],
    usesLlm: false,
    usesTools: false,
  },
  {
    id: 'fiscal-calendar',
    route: '/dashboard/calendario-fiscal',
    source: 'structured',
    allowedStates: ['alerta_fiscal', 'seguimiento', 'confianza', 'ayuda'],
    usesLlm: false,
    usesTools: false,
  },
  {
    id: 'help-dashboard',
    route: '/dashboard/kia-ayuda',
    source: 'static',
    allowedStates: ['explicacion'],
    usesLlm: false,
    usesTools: false,
  },
  {
    id: 'help-public',
    route: '/ayuda/kia',
    source: 'static',
    allowedStates: ['explicacion'],
    usesLlm: false,
    usesTools: false,
  },
] as const;

export interface KiaVisualAuditRuleResult {
  id: string;
  passed: boolean;
  severity: 'critical' | 'warning';
  message: string;
}

export interface KiaVisualAuditResult {
  status: 'passed' | 'failed';
  totalRules: number;
  passedRules: number;
  failedRules: number;
  rules: KiaVisualAuditRuleResult[];
}

export function auditKiaVisualGuidanceRegistry(
  surfaces: readonly KiaVisualSurfaceDefinition[] = KIA_VISUAL_SURFACES,
): KiaVisualAuditResult {
  const ids = surfaces.map((surface) => surface.id);
  const routes = surfaces.map((surface) => surface.route);
  const canonical = new Set<string>(KIA_AVATAR_STATES);

  const rules: KiaVisualAuditRuleResult[] = [
    {
      id: 'visual_surface_ids_unique',
      severity: 'critical',
      passed: new Set(ids).size === ids.length,
      message: 'Cada superficie visual debe tener un identificador único.',
    },
    {
      id: 'visual_surface_routes_unique',
      severity: 'warning',
      passed: new Set(routes).size === routes.length,
      message: 'Cada definición debe apuntar a una ruta visual distinta.',
    },
    {
      id: 'visual_states_canonical',
      severity: 'critical',
      passed: surfaces.every((surface) => surface.allowedStates.every((state) => canonical.has(state))),
      message: 'Todas las superficies deben usar únicamente estados canónicos de KiaAvatar.',
    },
    {
      id: 'visual_no_second_decision_engine',
      severity: 'critical',
      passed: surfaces.every((surface) => !surface.usesLlm && !surface.usesTools),
      message: 'La capa visual contextual no puede ejecutar LLM ni tools para elegir el estado.',
    },
    {
      id: 'visual_celebration_reserved',
      severity: 'critical',
      passed: surfaces.every((surface) => !surface.allowedStates.includes('celebracion')),
      message: 'Celebración permanece reservada y no está permitida en las superficies contextuales actuales.',
    },
    {
      id: 'visual_fiscal_alert_scoped',
      severity: 'critical',
      passed: surfaces.every((surface) => !surface.allowedStates.includes('alerta_fiscal') || surface.id === 'fiscal-calendar'),
      message: 'Alerta fiscal solo puede aparecer en la superficie fiscal autorizada.',
    },
    {
      id: 'visual_confidence_structured_only',
      severity: 'critical',
      passed: surfaces.every((surface) => !surface.allowedStates.includes('confianza') || surface.source === 'structured'),
      message: 'Confianza requiere una señal estructurada; no puede derivarse de una página explicativa estática.',
    },
    {
      id: 'visual_static_surfaces_explanatory',
      severity: 'warning',
      passed: surfaces
        .filter((surface) => surface.source === 'static')
        .every((surface) => surface.allowedStates.length === 1 && surface.allowedStates[0] === 'explicacion'),
      message: 'Las superficies estáticas de ayuda deben permanecer explicativas.',
    },
    {
      id: 'visual_empathy_not_inferred',
      severity: 'critical',
      passed: surfaces.every((surface) => !surface.allowedStates.includes('empatia')),
      message: 'Empatía no se infiere desde estados operativos o páginas estáticas.',
    },
  ];

  const failedRules = rules.filter((rule) => !rule.passed).length;
  return {
    status: failedRules === 0 ? 'passed' : 'failed',
    totalRules: rules.length,
    passedRules: rules.length - failedRules,
    failedRules,
    rules,
  };
}

export interface KiaVisualGuidanceTelemetry {
  mode: 'configuration_aggregate';
  surfacesTotal: number;
  structuredSurfaces: number;
  staticSurfaces: number;
  statesCovered: KiaAvatarState[];
  statesCoveredCount: number;
  stateCoverage: Array<{ state: KiaAvatarState; surfaces: number }>;
  uncoveredStates: KiaAvatarState[];
  persistsInteractionEvents: false;
  includesPii: false;
  auditor: Pick<KiaVisualAuditResult, 'status' | 'totalRules' | 'passedRules' | 'failedRules'>;
}

export function getKiaVisualGuidanceTelemetry(
  surfaces: readonly KiaVisualSurfaceDefinition[] = KIA_VISUAL_SURFACES,
): KiaVisualGuidanceTelemetry {
  const stateCounts = new Map<KiaAvatarState, number>();
  for (const surface of surfaces) {
    for (const state of new Set(surface.allowedStates)) {
      stateCounts.set(state, (stateCounts.get(state) ?? 0) + 1);
    }
  }

  const statesCovered = KIA_AVATAR_STATES.filter((state) => stateCounts.has(state));
  const audit = auditKiaVisualGuidanceRegistry(surfaces);

  return {
    mode: 'configuration_aggregate',
    surfacesTotal: surfaces.length,
    structuredSurfaces: surfaces.filter((surface) => surface.source === 'structured').length,
    staticSurfaces: surfaces.filter((surface) => surface.source === 'static').length,
    statesCovered: [...statesCovered],
    statesCoveredCount: statesCovered.length,
    stateCoverage: statesCovered.map((state) => ({ state, surfaces: stateCounts.get(state) ?? 0 })),
    uncoveredStates: KIA_AVATAR_STATES.filter((state) => !stateCounts.has(state)),
    persistsInteractionEvents: false,
    includesPii: false,
    auditor: {
      status: audit.status,
      totalRules: audit.totalRules,
      passedRules: audit.passedRules,
      failedRules: audit.failedRules,
    },
  };
}
