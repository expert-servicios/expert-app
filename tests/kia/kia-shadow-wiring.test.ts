import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('KIA shadow wiring', () => {
  const route = source('app/api/ai/kia/route.ts');

  it('runs the shadow comparison after the primary response lifecycle', () => {
    expect(route).toContain("import { after, NextRequest, NextResponse } from 'next/server'");
    expect(route).toContain('after(async () => {');
    expect(route).toContain('await runSampledKiaShadow({');
  });

  it('keeps the shadow fail-silent and separate from the user response', () => {
    expect(route).toContain("console.warn('[KiaCopilot] shadow sampling failed:'");
    expect(route).toContain('const reply = appendKiaFiscalNotice(result.userMessage, fiscalSignal);');
    expect(route).toContain('last_reply  : reply');
    expect(route).toContain('reply,');
    expect(route).not.toContain('reply      : shadow');
  });

  it('redacts the sampled message and hashes sampling identity material', () => {
    expect(route).toContain('content: redactSensitiveText(message)');
    expect(route).toContain('const shadowSampleKey = stableHash({');
  });

  it('never exposes the candidate result as an executable tool path', () => {
    expect(route).not.toContain('executeKiaToolCall(shadow');
    expect(route).not.toContain('shadowResult.toolCalls');
  });
});
