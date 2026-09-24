export const BOOKING_TIMEZONE = 'Europe/Madrid';
export const BOOKING_OPEN_HOUR = 9;
export const BOOKING_CLOSE_HOUR = 18;
export const BOOKING_SLOT_STEP_MINUTES = 15;
export const BOOKING_MAX_DAYS = 21;

export type BookingServiceKey =
  | 'consulta-inicial'
  | 'demo-holded'
  | 'onboarding'
  | 'formacion-holded'
  | 'academy-admision';

export interface BookingServiceDefinition {
  key: BookingServiceKey;
  label: string;
  durationMinutes: number;
  public: boolean;
}

function academyDuration(): number {
  const value = Number(process.env.BOOKING_ACADEMY_DURATION_MINUTES);
  return Number.isInteger(value) && value >= 15 && value <= 240 ? value : 30;
}

export function getBookingServices(): Record<BookingServiceKey, BookingServiceDefinition> {
  return {
    'consulta-inicial': {
      key: 'consulta-inicial',
      label: 'Consulta inicial gratuita',
      durationMinutes: 15,
      public: true,
    },
    'demo-holded': {
      key: 'demo-holded',
      label: 'Demo Holded',
      durationMinutes: 30,
      public: true,
    },
    onboarding: {
      key: 'onboarding',
      label: 'Sesión de onboarding',
      durationMinutes: 60,
      public: false,
    },
    'formacion-holded': {
      key: 'formacion-holded',
      label: 'Formación Holded',
      durationMinutes: 120,
      public: false,
    },
    'academy-admision': {
      key: 'academy-admision',
      label: 'Entrevista Academy',
      durationMinutes: academyDuration(),
      public: true,
    },
  };
}

export function getBookingService(key: string | null | undefined): BookingServiceDefinition | null {
  if (!key) return null;
  const services = getBookingServices();
  return services[key as BookingServiceKey] ?? null;
}

function localParts(date: Date, timeZone = BOOKING_TIMEZONE) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
    second: get('second'),
  };
}

/**
 * Convert a Europe/Madrid wall-clock value to an instant without adding a
 * timezone dependency. A second pass handles DST boundaries.
 */
export function madridLocalToDate(date: string, time: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  if (![year, month, day, hour, minute].every(Number.isFinite)) {
    throw new Error('Invalid local booking datetime');
  }

  const targetAsUtc = Date.UTC(year, month - 1, day, hour, minute, 0);
  let guess = new Date(targetAsUtc);

  for (let i = 0; i < 2; i += 1) {
    const actual = localParts(guess);
    const actualAsUtc = Date.UTC(
      actual.year,
      actual.month - 1,
      actual.day,
      actual.hour,
      actual.minute,
      actual.second
    );
    guess = new Date(guess.getTime() + (targetAsUtc - actualAsUtc));
  }

  return guess;
}

export function formatMadridDate(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: BOOKING_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function formatMadridTime(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: BOOKING_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);
}

export function isMadridWeekday(date: Date): boolean {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: BOOKING_TIMEZONE,
    weekday: 'short',
  }).format(date);
  return weekday !== 'Sat' && weekday !== 'Sun';
}

export interface BusyRange {
  start: Date;
  end: Date;
}

export function overlapsBusy(start: Date, end: Date, busy: BusyRange[]): boolean {
  return busy.some((range) => start < range.end && end > range.start);
}

export interface BookingSlot {
  start: string;
  end: string;
  date: string;
  time: string;
  label: string;
}

export function buildBookingSlots(params: {
  from: Date;
  days: number;
  durationMinutes: number;
  busy: BusyRange[];
  now?: Date;
}): BookingSlot[] {
  const { from, durationMinutes, busy } = params;
  const days = Math.max(1, Math.min(params.days, BOOKING_MAX_DAYS));
  const now = params.now ?? new Date();
  const slots: BookingSlot[] = [];

  for (let dayOffset = 0; dayOffset < days; dayOffset += 1) {
    const cursor = new Date(from.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    const localDate = formatMadridDate(cursor);
    const midday = madridLocalToDate(localDate, '12:00');
    if (!isMadridWeekday(midday)) continue;

    for (
      let minuteOfDay = BOOKING_OPEN_HOUR * 60;
      minuteOfDay + durationMinutes <= BOOKING_CLOSE_HOUR * 60;
      minuteOfDay += BOOKING_SLOT_STEP_MINUTES
    ) {
      const hour = String(Math.floor(minuteOfDay / 60)).padStart(2, '0');
      const minute = String(minuteOfDay % 60).padStart(2, '0');
      const start = madridLocalToDate(localDate, `${hour}:${minute}`);
      const end = new Date(start.getTime() + durationMinutes * 60_000);

      // Public booking requires at least 30 minutes of lead time.
      if (start.getTime() < now.getTime() + 30 * 60_000) continue;
      if (overlapsBusy(start, end, busy)) continue;

      const label = new Intl.DateTimeFormat('es-ES', {
        timeZone: BOOKING_TIMEZONE,
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(start);

      slots.push({
        start: start.toISOString(),
        end: end.toISOString(),
        date: localDate,
        time: `${hour}:${minute}`,
        label,
      });
    }
  }

  return slots;
}
