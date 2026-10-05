import { HoldedClient } from './holded-client.js';
import type { HoldedBackend } from './backend.js';

export type McpBackendMode = 'direct';

export function createMcpBackend(input: {
  mode?: McpBackendMode;
  holdedApiKey: string;
}): HoldedBackend {
  const mode = input.mode ?? 'direct';

  switch (mode) {
    case 'direct':
      return new HoldedClient(input.holdedApiKey);
  }
}
