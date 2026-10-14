import { describe, expect, it } from 'vitest';
import { extractMeetingReviewCandidates } from '../../lib/ai/kia/kia-meeting-notes-extract';

describe('KIA meeting notes: cautious candidate extraction', () => {
  it('extracts a controversial invoice-transfer proposal without approving it', () => {
    const result = extractMeetingReviewCandidates('- Separar las facturas de constitución y mover a autónomo');
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe('legal_or_tax_opinion');
    expect(result[0].title).toContain('Separar las facturas');
  });

  it('treats a disputed tax deduction as requiring professional review', () => {
    const result = extractMeetingReviewCandidates('- Revisar si el IVA de una factura anterior a la constitución es deducible');
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe('legal_or_tax_opinion');
  });

  it('does not invent an IAE or CNAE value', () => {
    const result = extractMeetingReviewCandidates('- Confirmar CNAE e IAE según el modelo 036');
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe('census_attribute');
    expect(result[0].title).not.toMatch(/\b[0-9]{4}\b/);
  });

  it('deduplicates normalized repeated lines', () => {
    const result = extractMeetingReviewCandidates('- Revisar factura PROFORMA\n* Revisar factura PROFORMA');
    expect(result).toHaveLength(1);
  });

  it('ignores generic chatter and size-overflow', () => {
    expect(extractMeetingReviewCandidates('Hola buenos días\nMuchas gracias por venir')).toEqual([]);
    expect(() => extractMeetingReviewCandidates('x'.repeat(96_001))).toThrow('meeting_notes_document_too_large');
  });

  it('adds stable line-specific IDs for source provenance', () => {
    const result = extractMeetingReviewCandidates('- Revisar justificante AEAT del trimestre');
    expect(result[0].claimId).toMatch(/^line-1-[a-f0-9]{16}$/);
    expect(result[0].lineNumber).toBe(1);
  });
});