import { createHash } from 'node:crypto';

export function kiaEmailAgentStateKey(threadId: string) {
  return `kia_email_agent:${createHash('sha256').update(threadId).digest('hex').slice(0, 32)}`;
}
