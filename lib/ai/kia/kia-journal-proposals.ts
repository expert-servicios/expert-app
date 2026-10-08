/**
 * Validated, non-posting journal proposals for KIA Accounting.
 * All amounts are represented in integer minor units to avoid floating-point drift.
 * This module has no Holded client, database writes, or side effects.
 */
export interface KiaJournalLineInput {
  account: string;
  debitCents: number;
  creditCents: number;
  explanation?: string;
}
export interface KiaJournalProposalInput {
  companyId: string;
  date: string;
  reason: string;
  evidenceRefs: string[];
  lines: KiaJournalLineInput[];
}
export type KiaJournalProposalResult =
  | { ok: false; errors: string[]; holdedMutated: false }
  | {
      ok: true;
      proposal: KiaJournalProposalInput & {
        totalDebitCents: number;
        totalCreditCents: number;
        status: 'pending_human_review';
        requiresHumanApproval: true;
        holdedMutated: false;
      };
      holdedMutated: false;
    };

export function prepareKiaJournalProposal(input: KiaJournalProposalInput): KiaJournalProposalResult {
  const errors: string[] = [];
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.companyId)) {
    errors.push('Se requiere el identificador UUID de la empresa autorizada.');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date) || Number.isNaN(Date.parse(input.date + 'T00:00:00Z')) ||
      new Date(input.date + 'T00:00:00Z').toISOString().slice(0, 10) !== input.date) {
    errors.push('Fecha contable inválida.');
  }
  if (!input.reason.trim() || input.reason.length > 500) errors.push('Debe indicarse el motivo del asiento.');
  if (!input.evidenceRefs.length || input.evidenceRefs.some(ref => !ref.trim() || ref.length > 1024)) {
    errors.push('Debe existir al menos una referencia documental válida.');
  }
  if (input.lines.length < 2 || input.lines.length > 100) errors.push('Un asiento requiere de 2 a 100 líneas.');
  let totalDebitCents = 0;
  let totalCreditCents = 0;
  for (const [index, line] of input.lines.entries()) {
    if (!/^\d{3,12}$/.test(line.account)) errors.push('Cuenta contable inválida en línea ' + (index + 1));
    if (![line.debitCents, line.creditCents].every(n => Number.isSafeInteger(n) && n >= 0)) {
      errors.push('Importe inválido en línea ' + (index + 1));
      continue;
    }
    if ((line.debitCents > 0) === (line.creditCents > 0)) {
      errors.push('Cada línea debe tener importe en debe O haber.');
    }
    totalDebitCents += line.debitCents;
    totalCreditCents += line.creditCents;
  }
  if (!Number.isSafeInteger(totalDebitCents) || !Number.isSafeInteger(totalCreditCents) || totalDebitCents <= 0) {
    errors.push('Totales contables inválidos.');
  }
  if (totalDebitCents !== totalCreditCents) errors.push('El asiento no cuadra: debe y haber difieren.');
  if (errors.length) return { ok: false, errors, holdedMutated: false };
  return {
    ok: true,
    proposal: {
      ...input,
      totalDebitCents,
      totalCreditCents,
      status: 'pending_human_review',
      requiresHumanApproval: true,
      holdedMutated: false,
    },
    holdedMutated: false,
  };
}
