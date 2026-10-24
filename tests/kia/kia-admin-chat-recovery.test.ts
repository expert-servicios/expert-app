import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { isOpenAiStrictToolSchema } from '@/lib/ai/kia/kia-provider-router';
import { KIA_TOOL_DEFINITIONS } from '@/lib/ai/kia/kia-tool-definitions';

const widget = readFileSync(resolve(process.cwd(), 'components/KiaCopilotWidget.tsx'), 'utf8');

describe('KIA chat request recovery', () => {
  it('prevents indefinitely disabled input when the server is slow', () => {
    expect(widget).toContain('KIA_CHAT_TIMEOUT_MS = 45_000');
    expect(widget).toContain('signal: controller.signal');
    expect(widget).toContain("controller.abort('request_timeout')");
    expect(widget).toContain('onClick={cancel}');
    expect(widget).toContain('onClick={handleReviewCurrentPage}');
    expect(widget).not.toContain('reviewedAdminPagesRef');
    expect(widget).not.toMatch(/rows=\{1\}\s+disabled=\{loading\}/);
    expect(widget).toContain('if (!text || loading || contextLoading) return;');
  });

  it('avoids OpenAI strict tool mode for optional properties but preserves it for valid schemas', () => {
    const lookup = KIA_TOOL_DEFINITIONS.find((tool) => tool.name === 'resolve_contact_context');
    const profile = KIA_TOOL_DEFINITIONS.find((tool) => tool.name === 'get_client_profile');
    expect(lookup).toBeDefined();
    expect(profile).toBeDefined();
    expect(isOpenAiStrictToolSchema(lookup!.input_schema)).toBe(false);
    expect(isOpenAiStrictToolSchema(profile!.input_schema)).toBe(true);
  });
});
