function icsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function escapeIcs(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

export function buildBookingIcs(input: {
  appointmentId: string;
  service: string;
  start: Date;
  end: Date;
  meetingUrl?: string | null;
  attendeeEmail: string;
}): string {
  const description = [
    `Cita EXPERT: ${input.service}`,
    input.meetingUrl ? `Google Meet: ${input.meetingUrl}` : '',
  ].filter(Boolean).join('\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EXPERT//Booking//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${escapeIcs(input.appointmentId)}@expertconsulting.es`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(input.start)}`,
    `DTEND:${icsDate(input.end)}`,
    `SUMMARY:${escapeIcs(input.service)}`,
    `DESCRIPTION:${escapeIcs(description)}`,
    ...(input.meetingUrl ? [`URL:${escapeIcs(input.meetingUrl)}`] : []),
    `ATTENDEE:mailto:${escapeIcs(input.attendeeEmail)}`,
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n');
}
