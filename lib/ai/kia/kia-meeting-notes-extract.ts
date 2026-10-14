import { createHash } from 'node:crypto';
import type { MeetingAssertionKind } from './kia-meeting-note-review';

/**
 * Candidate extraction, NOT inference or approval.
 * Google Docs contents are untrusted third-party material. Never treat text
 * within minutes as instructions to KIA or as evidence that an action occurred.
 */
export interface MeetingNotesExtractedCandidate {
  claimId: string;
  kind: MeetingAssertionKind;
  title: string;
  lineNumber: number;
}

const MAX_LINE_CHARS = 600;
const MAX_ITEMS = 40;
const BULLET = /^(?:[-*•‣]|\d{1,2}[.)])\s+/u;
const CUE = /(?:pendiente|revisar|verificar|comprobar|confirmar|investigar|acordamos|acordado|decidimos|solicitar|enviar|preparar|separar|mover|presentar|hacer|siguiente|duda|cuesti[oó]n|action items|next steps|to do|follow.up|please check|review|verify)/i;
const QUESTION = /[¿?]|(?:pendiente|revisar|verificar|comprobar|confirmar|investigar|duda|cuesti[oó]n|review|verify)/i;
const CENSUS = /(?:\bCNAE\b|\bIAE\b|ep[ií]grafe|actividad censal|modelo\s*036|modelo\s*037)/i;
const TAX = /(?:\bIVA\b|\bIRPF\b|\bAEAT\b|\bTJUE\b|deducib|factura|constituci[oó]n|capitalizaci[oó]n|modelo\s*(?:111|130|303|349)|impuesto|jurisprudencia|fiscal)/i;
const ACTION = /(?:\b(?:solicitar|enviar|preparar|separar|mover|presentar|realizar|cambiar|modificar|trasladar|pedir|registrar|agendar|reservar|actualizar|archivar|subir|crear)\b|(?:debe|tiene que|hay que|vamos a)\s+\w+)/i;

/** Gemini documents may append a long transcript. Process summary/decisions only. */
export function extractMeetingNotesSection(documentText: string): string {
  const normalized = documentText.replace(/\r\n?/g, '\n');
  const marker = normalized.search(/^Transcripci[oó]n\s*$/mi);
  const notes = marker >= 0 ? normalized.slice(0, marker) : normalized;
  if (notes.length > 96_000) throw new Error('meeting_notes_document_too_large');
  return notes;
}

export function extractMeetingReviewCandidates(documentText: string): MeetingNotesExtractedCandidate[] {
  const notes = extractMeetingNotesSection(documentText);
  const lines = notes.split('\n');
  const items: MeetingNotesExtractedCandidate[] = [];
  const seen = new Set<string>();

  for (let index = 0; index < lines.length && items.length < MAX_ITEMS; index++) {
    const raw = lines[index].trim().replace(/\s+/g, ' ');
    if (raw.length < 16 || raw.length > MAX_LINE_CHARS) continue;

    const bulleted = BULLET.test(raw);
    const statement = raw.replace(BULLET, '').trim();
    if (statement.length < 16) continue;
    // Only extract lines with task/question cues, not every sentence,
    // and never infer an agreement from the appearance of a bullet.
    if (!CUE.test(statement) && !/[¿?]/.test(statement)) continue;
    if (!bulleted && statement.length > 320) continue;

    const normalized = statement.toLocaleLowerCase('es').normalize('NFKC');
    const signature = createHash('sha256').update(normalized).digest('hex').slice(0, 16);
    if (seen.has(signature)) continue;
    seen.add(signature);

    const kind: MeetingAssertionKind = CENSUS.test(statement)
      ? 'census_attribute'
      : TAX.test(statement)
        ? 'legal_or_tax_opinion'
        : QUESTION.test(statement)
          ? 'question'
          : ACTION.test(statement)
            ? 'proposed_action'
            : 'fact';

    items.push({
      claimId: 'line-' + String(index + 1) + '-' + signature,
      kind,
      title: statement.slice(0, 300),
      lineNumber: index + 1,
    });
  }
  return items;
}
