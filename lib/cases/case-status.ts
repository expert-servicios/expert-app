export type CaseStatus =
  | 'nuevo'
  | 'pendiente_cliente'
  | 'en_revision'
  | 'listo_para_presentar'
  | 'presentado'
  | 'finalizado'
  | 'bloqueado';

export type CasePriority = 'baja' | 'media' | 'alta' | 'critica';

export type CaseVisualState =
  | 'nuevo'
  | 'docs_pendientes'
  | 'docs_recibidos'
  | 'en_tramitacion'
  | 'pendiente_externo'
  | 'resolucion_recibida'
  | 'entregado'
  | 'presentado'
  | 'finalizado'
  | 'bloqueado';

export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  nuevo:                 'Nuevo',
  pendiente_cliente:     'Pendiente cliente',
  en_revision:           'En revisión',
  listo_para_presentar:  'Listo para presentar',
  presentado:            'Presentado',
  finalizado:            'Finalizado',
  bloqueado:             'Bloqueado',
};

export const CASE_PRIORITY_LABELS: Record<CasePriority, string> = {
  baja:    'Baja',
  media:   'Media',
  alta:    'Alta',
  critica: 'Crítica',
};

// Transiciones permitidas. key = estado actual, value = estados a los que puede ir.
export const ALLOWED_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  nuevo:                ['pendiente_cliente', 'en_revision', 'bloqueado'],
  pendiente_cliente:    ['en_revision', 'bloqueado'],
  en_revision:          ['pendiente_cliente', 'listo_para_presentar', 'bloqueado'],
  listo_para_presentar: ['presentado', 'en_revision', 'bloqueado'],
  presentado:           ['finalizado', 'bloqueado'],
  finalizado:           [],
  bloqueado:            ['nuevo', 'pendiente_cliente', 'en_revision', 'listo_para_presentar', 'presentado'],
};

// Transiciones que SOLO puede hacer un humano (nunca automáticas)
export const HUMAN_ONLY_TRANSITIONS: Array<{ from: CaseStatus; to: CaseStatus }> = [
  { from: 'listo_para_presentar', to: 'presentado' },
  { from: 'presentado',           to: 'finalizado' },
];

export function canTransition(from: CaseStatus, to: CaseStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function isHumanOnlyTransition(from: CaseStatus, to: CaseStatus): boolean {
  return HUMAN_ONLY_TRANSITIONS.some((t) => t.from === from && t.to === to);
}

export function isTerminalStatus(status: CaseStatus): boolean {
  return status === 'finalizado';
}

export function isActiveStatus(status: CaseStatus): boolean {
  return status !== 'finalizado' && status !== 'bloqueado';
}


export const CASE_STATUS_TO_VISUAL_STATE: Record<CaseStatus, CaseVisualState> = {
  nuevo: 'nuevo',
  pendiente_cliente: 'docs_pendientes',
  en_revision: 'docs_recibidos',
  listo_para_presentar: 'en_tramitacion',
  presentado: 'presentado',
  finalizado: 'finalizado',
  bloqueado: 'bloqueado',
};

export const LEGACY_CASE_STATE_TO_STATUS: Record<string, CaseStatus> = {
  nuevo: 'nuevo',
  docs_pendientes: 'pendiente_cliente',
  pendiente_documentacion: 'pendiente_cliente',
  docs_recibidos: 'en_revision',
  en_revision: 'en_revision',
  en_tramitacion: 'en_revision',
  en_proceso: 'en_revision',
  listo_para_presentar: 'listo_para_presentar',
  pendiente_externo: 'presentado',
  presentado: 'presentado',
  resolucion_recibida: 'presentado',
  entregado: 'presentado',
  finalizado: 'finalizado',
  bloqueado: 'bloqueado',
};

export const CASE_STATUS_FILTER_GROUPS = {
  urgent: ['pendiente_cliente', 'en_revision', 'listo_para_presentar', 'bloqueado'],
  followup: ['nuevo', 'presentado'],
  closed: ['finalizado'],
} as const satisfies Record<string, readonly CaseStatus[]>;

export function isCaseStatus(value: unknown): value is CaseStatus {
  return typeof value === 'string' && value in CASE_STATUS_LABELS;
}

/**
 * Compatibility resolver for pre-canonical rows.
 *
 * Historical rows may still have status='nuevo' while their legacy state
 * contains the real operational progress. We never rewrite those rows during
 * read. Instead, only the default 'nuevo' value yields to an advanced legacy
 * state. As soon as a canonical transition persists a non-default status,
 * that value becomes authoritative.
 */
export function resolveEffectiveCaseStatus(
  status: string | null | undefined,
  legacyState: string | null | undefined,
): CaseStatus {
  const canonical = isCaseStatus(status) ? status : null;
  const legacyFallback = legacyState ? LEGACY_CASE_STATE_TO_STATUS[legacyState] : undefined;

  if (!canonical) return legacyFallback ?? 'nuevo';
  if (canonical === 'nuevo' && legacyFallback && legacyFallback !== 'nuevo') {
    return legacyFallback;
  }
  return canonical;
}

export function caseStatusToVisualState(status: CaseStatus): CaseVisualState {
  return CASE_STATUS_TO_VISUAL_STATE[status];
}
