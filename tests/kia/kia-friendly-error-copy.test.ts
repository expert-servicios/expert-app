import { describe, expect, it } from 'vitest';
import { kiaFriendlyError } from '@/lib/ai/kia/kia-error-copy';

describe('KIA friendly error copy', () => {
  it('uses light humour for recoverable technical problems', () => {
    expect(kiaFriendlyError('kia_error', 'es')).toContain('😅');
    expect(kiaFriendlyError('network_error', 'es')).toContain('📡');
    expect(kiaFriendlyError('timeout', 'es')).toContain('😄');
  });

  it('keeps security and access errors clear instead of celebratory', () => {
    expect(kiaFriendlyError('policy_denied', 'es')).toContain('🔐');
    expect(kiaFriendlyError('invalid_context_token', 'es')).toContain('🕰️');
    expect(kiaFriendlyError('policy_denied', 'es')).not.toContain('🎉');
  });

  it('supports Russian copy with the same KIA personality', () => {
    expect(kiaFriendlyError('kia_error', 'ru')).toContain('😅');
    expect(kiaFriendlyError('link_rejected', 'ru')).toContain('🔑');
  });
});
