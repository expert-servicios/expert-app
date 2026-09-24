import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = () => readFileSync(resolve(process.cwd(), 'lib/integrations/google-calendar.ts'), 'utf8');

describe('Google Meet automatic artifacts', () => {
  it('keeps Calendar scope separate from Meet settings scope', () => {
    const calendar = source();
    expect(calendar).toContain("'https://www.googleapis.com/auth/calendar.events'");
    expect(calendar).toContain("'https://www.googleapis.com/auth/meetings.space.settings'");
    expect(calendar).not.toContain("'https://www.googleapis.com/auth/meetings.space.readonly'");
  });

  it('bounds authorization, fetch and response consumption', () => {
    const calendar = source();
    expect(calendar).toContain("auth.authorize(), 'Google Meet authorization'");
    expect(calendar).toContain('MEET_API_TIMEOUT_MS = 5_000');
    expect(calendar).toContain('setTimeout(() => controller.abort(), MEET_API_TIMEOUT_MS)');
    expect(calendar).toContain('const body = await response.text()');
  });

  it('configures transcription and Smart Notes independently and best-effort', () => {
    const calendar = source();
    expect(calendar).toContain("'autoTranscriptionGeneration'");
    expect(calendar).toContain("'autoSmartNotesGeneration'");
    expect(calendar).toContain("[configKey]: { [generationField]: 'ON' }");
    expect(calendar).toContain("configureMeetArtifact(token, space.name, 'transcription')");
    expect(calendar).toContain("configureMeetArtifact(token, space.name, 'smartNotes')");
    expect(calendar).toContain('const results = await Promise.all(operations)');
  });

  it('returns the Calendar event even if optional Meet artifacts cannot be enabled', () => {
    const calendar = source();
    expect(calendar).toContain('const autoArtifacts = await configureMeetAutoArtifactsSA(data.hangoutLink)');
    expect(calendar).toContain('return { eventId: data.id, meetUrl: data.hangoutLink, autoArtifacts }');
    expect(calendar).toContain("return { configured: false, spaceName: null, error: message }");
  });
});
