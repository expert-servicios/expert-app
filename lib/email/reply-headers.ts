export function gmailReplyHeaders(headers: Array<{ name?: string | null; value?: string | null }>) {
  const get = (name: string) => headers.find(h => h.name?.toLowerCase() === name)?.value?.trim() ?? '';
  const messageId = get('message-id');
  const subject = get('subject');
  const references = get('references');
  if (!/^<[^<>\s]+>$/.test(messageId) || /[\r\n]/.test(subject + references)) throw new Error('Invalid reply headers');
  const ancestors = references.match(/<[^<>\s]+>/g) ?? [];
  return { subject, inReplyTo: messageId, references: [...new Set([...ancestors, messageId])].join(' ') };
}
