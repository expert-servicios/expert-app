/**
 * Google Meet REST API helper for native EXPERT bookings.
 *
 * Calendar remains responsible for creating the event + Meet link. This module
 * configures Meet-only settings afterwards so a missing Meet API scope cannot
 * break the core booking flow.
 */

const MEET_SETTINGS_SCOPE = 'https://www.googleapis.com/auth/meetings.space.settings';
const MEET_API_BASE = 'https://meet.googleapis.com/v2';
const MEET_SA_IMPERSONATE = 'info@expertconsulting.es';

type MeetAutoArtifact = 'recording' | 'transcription' | 'smart_notes';

function requestedArtifacts(): MeetAutoArtifact[] {
  const raw = process.env.GOOGLE_MEET_AUTO_ARTIFACTS?.trim().toLowerCase();
  if (raw === 'off' || raw === 'false' || raw === 'none') return [];

  const requested = (raw || 'off')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  const allowed = new Set<MeetAutoArtifact>(['recording', 'transcription', 'smart_notes']);
  return [...new Set(requested.filter((value): value is MeetAutoArtifact =>
    allowed.has(value as MeetAutoArtifact)
  ))];
}

function meetingCodeFromUrl(meetUrl: string): string {
  const url = new URL(meetUrl);
  if (url.hostname.toLowerCase() !== 'meet.google.com') {
    throw new Error('Unsupported Google Meet URL');
  }

  const meetingCode = url.pathname.split('/').filter(Boolean)[0]?.trim();
  if (!meetingCode) throw new Error('Google Meet URL does not contain a meeting code');
  return meetingCode;
}

async function getMeetSettingsSAClient() {
  if (!process.env.GOOGLE_GMAIL_SA_EMAIL || !process.env.GOOGLE_GMAIL_SA_PRIVATE_KEY) {
    throw new Error('Google Meet service account is not configured');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { google } = (await import('googleapis')) as any;
  return new google.auth.JWT({
    email: process.env.GOOGLE_GMAIL_SA_EMAIL,
    key: process.env.GOOGLE_GMAIL_SA_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: [MEET_SETTINGS_SCOPE],
    subject: MEET_SA_IMPERSONATE,
  });
}

export async function configureGoogleMeetAutoArtifactsSA(meetUrl: string): Promise<boolean> {
  const artifacts = requestedArtifacts();
  if (artifacts.length === 0) return false;

  const auth = await getMeetSettingsSAClient();
  const meetingCode = meetingCodeFromUrl(meetUrl);

  const spaceResponse = await auth.request({
    url: `${MEET_API_BASE}/spaces/${encodeURIComponent(meetingCode)}`,
    method: 'GET',
  });

  const space = spaceResponse.data as { name?: string };
  if (!space.name?.startsWith('spaces/')) {
    throw new Error('Google Meet API did not return a meeting space name');
  }

  const artifactConfig: Record<string, { autoGenerationType: 'ON' }> = {};
  const updateMask: string[] = [];

  if (artifacts.includes('recording')) {
    artifactConfig.recordingConfig = { autoGenerationType: 'ON' };
    updateMask.push('config.artifactConfig.recordingConfig.autoGenerationType');
  }
  if (artifacts.includes('transcription')) {
    artifactConfig.transcriptionConfig = { autoGenerationType: 'ON' };
    updateMask.push('config.artifactConfig.transcriptionConfig.autoGenerationType');
  }
  if (artifacts.includes('smart_notes')) {
    artifactConfig.smartNotesConfig = { autoGenerationType: 'ON' };
    updateMask.push('config.artifactConfig.smartNotesConfig.autoGenerationType');
  }

  await auth.request({
    url: `${MEET_API_BASE}/${space.name}?updateMask=${encodeURIComponent(updateMask.join(','))}`,
    method: 'PATCH',
    data: {
      config: {
        artifactConfig,
      },
    },
  });

  return true;
}

export async function configureGoogleMeetAutoArtifactsBestEffort(meetUrl: string): Promise<boolean> {
  try {
    return await configureGoogleMeetAutoArtifactsSA(meetUrl);
  } catch (error) {
    console.error('[Google Meet] auto-artifact configuration failed:', error);
    return false;
  }
}
