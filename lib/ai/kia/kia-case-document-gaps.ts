type DocumentEvidence = {
  id: string;
  state: string | null;
  checklist_item_key: string | null;
  checklist_item_label: string | null;
  replaced_by?: string | null;
};

export function missingKiaCaseDocumentRequirements(
  checklist: unknown,
  documents: DocumentEvidence[],
  linkStore: unknown,
): string[] {
  const requirements = Array.isArray(checklist)
    ? checklist.filter((item): item is string => typeof item === 'string' && Boolean(item.trim()))
    : [];
  const rawLinks = linkStore && typeof linkStore === 'object' && !Array.isArray(linkStore)
    ? linkStore as { version?: unknown; links?: unknown } : null;
  const links = rawLinks?.version === 1 && Array.isArray(rawLinks.links) ? rawLinks.links : [];
  const active = documents.filter((doc) => doc.state !== 'rechazado' && !doc.replaced_by);
  return requirements.filter((label, index) => {
    const key = (`${index + 1}-${label}`.normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '').toLowerCase()
      .replace(/[^a-z0-9а-яё]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 140)) || `item-${index + 1}`;
    return !active.some((doc) => doc.checklist_item_key === key
      || doc.checklist_item_label?.trim() === label.trim()
      || links.some((link: unknown) => {
        if (!link || typeof link !== 'object' || Array.isArray(link)) return false;
        const item = link as { requirement?: unknown; documentId?: unknown };
        return item.requirement === label && item.documentId === doc.id;
      }));
  });
}
