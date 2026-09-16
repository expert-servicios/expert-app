import type { KiaTaskType } from './kia-output-schema';
import type { KiaToolCapability, KiaToolRiskTier } from './kia-tool-registry';

export type KiaSkillDomain =
  | 'fiscal'
  | 'accounting'
  | 'labor'
  | 'corporate'
  | 'administration'
  | 'documents'
  | 'academy'
  | 'operations';

export interface KiaSkillDefinition {
  id: string;
  version: string;
  domain: KiaSkillDomain;
  description: string;
  intents: string[];
  taskTypes: KiaTaskType[];
  preferredSubAgentId: string | null;
  requiredToolCapabilities: KiaToolCapability[];
  maxRiskTier: KiaToolRiskTier;
  enabled: boolean;
}

const KIA_SKILLS: readonly KiaSkillDefinition[] = [
  {
    id: 'fiscal.viability',
    version: '1.0',
    domain: 'fiscal',
    description: 'Analiza viabilidad fiscal y requisitos previos sin presentar impuestos ni ejecutar tramites.',
    intents: ['viability'],
    taskTypes: ['viability_reasoning'],
    preferredSubAgentId: 'fiscal',
    requiredToolCapabilities: ['client_data', 'case_management', 'documents'],
    maxRiskTier: 'R1',
    enabled: true,
  },
  {
    id: 'accounting.readiness',
    version: '1.0',
    domain: 'accounting',
    description: 'Evalua readiness de Holded, conexion y contexto contable en modo lectura.',
    intents: ['readiness', 'connect_holded', 'accounting_summary', 'anomaly_review'],
    taskTypes: ['readiness_reasoning', 'accounting_anomaly_review', 'company_status_summary'],
    preferredSubAgentId: 'holded',
    requiredToolCapabilities: ['client_data', 'holded_read', 'reporting'],
    maxRiskTier: 'R1',
    enabled: true,
  },
  {
    id: 'documents.case_review',
    version: '1.0',
    domain: 'documents',
    description: 'Revisa expedientes y documentacion asociada sin modificar estado administrativo.',
    intents: ['case_status', 'send_documents', 'document_classification'],
    taskTypes: ['document_classification', 'document_extraction'],
    preferredSubAgentId: 'case',
    requiredToolCapabilities: ['case_management', 'documents'],
    maxRiskTier: 'R1',
    enabled: true,
  },
  {
    id: 'operations.next_best_action',
    version: '1.0',
    domain: 'operations',
    description: 'Propone la siguiente accion operativa sin ejecutar acciones externas.',
    intents: [],
    taskTypes: ['next_best_action'],
    preferredSubAgentId: null,
    requiredToolCapabilities: ['client_data', 'case_management', 'reporting'],
    maxRiskTier: 'R1',
    enabled: true,
  },
] as const;

export function getKiaSkillRegistry(): KiaSkillDefinition[] {
  return KIA_SKILLS.map((skill) => ({
    ...skill,
    intents: [...skill.intents],
    taskTypes: [...skill.taskTypes],
    requiredToolCapabilities: [...skill.requiredToolCapabilities],
  }));
}

export function getKiaSkillDefinition(id: string): KiaSkillDefinition | null {
  const normalized = id.trim();
  if (!normalized) return null;
  const skill = KIA_SKILLS.find((item) => item.id === normalized && item.enabled);
  return skill ? {
    ...skill,
    intents: [...skill.intents],
    taskTypes: [...skill.taskTypes],
    requiredToolCapabilities: [...skill.requiredToolCapabilities],
  } : null;
}

export function selectKiaSkill(params: {
  taskType: KiaTaskType;
  detectedIntent?: string | null;
}): KiaSkillDefinition | null {
  const intent = params.detectedIntent?.trim();
  const byIntent = intent
    ? KIA_SKILLS.find((skill) => skill.enabled && skill.intents.includes(intent))
    : undefined;
  const byTask = KIA_SKILLS.find((skill) => skill.enabled && skill.taskTypes.includes(params.taskType));
  const selected = byIntent ?? byTask;

  return selected ? {
    ...selected,
    intents: [...selected.intents],
    taskTypes: [...selected.taskTypes],
    requiredToolCapabilities: [...selected.requiredToolCapabilities],
  } : null;
}

export function assertKiaSkillRegistryValid(): void {
  const ids = new Set<string>();
  for (const skill of KIA_SKILLS) {
    if (!skill.id.trim()) throw new Error('KIA skill id cannot be empty');
    if (ids.has(skill.id)) throw new Error(`Duplicate KIA skill id: ${skill.id}`);
    ids.add(skill.id);
    if (!skill.version.trim()) throw new Error(`KIA skill ${skill.id} is missing version`);
    if (skill.requiredToolCapabilities.length === 0) {
      throw new Error(`KIA skill ${skill.id} must declare at least one tool capability`);
    }
  }
}
