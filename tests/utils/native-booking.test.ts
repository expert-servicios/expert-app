import { describe, expect, it } from 'vitest';
import {
  BOOKING_SLOT_STEP_MINUTES,
  buildBookingSlots,
  formatMadridDate,
  formatMadridTime,
  madridLocalToDate,
  overlapsBusy,
} from '@/lib/booking/native-booking';

describe('native booking slot engine', () => {
  it('round-trips Europe/Madrid local time', () => {
    const date = madridLocalToDate('2026-09-24', '10:30');
    expect(formatMadridDate(date)).toBe('2026-09-24');
    expect(formatMadridTime(date)).toBe('10:30');
  });

  it('handles Madrid winter offset after DST change', () => {
    const date = madridLocalToDate('2026-11-03', '10:30');
    expect(date.toISOString()).toBe('2026-11-03T09:30:00.000Z');
    expect(formatMadridTime(date)).toBe('10:30');
  });

  it('offers starts on hourly boundaries', () => {
    const from = madridLocalToDate('2026-09-24', '08:00');
    const slots = buildBookingSlots({
      from,
      days: 1,
      durationMinutes: 15,
      busy: [],
      now: madridLocalToDate('2026-09-24', '08:00'),
    });

    expect(BOOKING_SLOT_STEP_MINUTES).toBe(60);
    expect(slots.map((slot) => slot.time).slice(0, 4)).toEqual(['09:00', '10:00', '11:00', '12:00']);
    expect(slots.some((slot) => slot.time.endsWith(':15'))).toBe(false);
    expect(slots.some((slot) => slot.time.endsWith(':30'))).toBe(false);
    expect(slots.some((slot) => slot.time.endsWith(':45'))).toBe(false);
  });

  it('removes slots that overlap busy intervals', () => {
    const from = madridLocalToDate('2026-09-24', '08:00');
    const busyStart = madridLocalToDate('2026-09-24', '10:00');
    const busyEnd = madridLocalToDate('2026-09-24', '11:00');

    const slots = buildBookingSlots({
      from,
      days: 1,
      durationMinutes: 30,
      busy: [{ start: busyStart, end: busyEnd }],
      now: madridLocalToDate('2026-09-24', '08:00'),
    });

    expect(slots.some((slot) => slot.time === '10:00')).toBe(false);
    expect(slots.some((slot) => slot.time === '10:30')).toBe(false);
    expect(slots.some((slot) => slot.time === '11:00')).toBe(true);
  });

  it('uses half-open overlap semantics', () => {
    const aStart = madridLocalToDate('2026-09-24', '09:00');
    const aEnd = madridLocalToDate('2026-09-24', '09:30');
    const bStart = madridLocalToDate('2026-09-24', '09:30');
    const bEnd = madridLocalToDate('2026-09-24', '10:00');

    expect(overlapsBusy(aStart, aEnd, [{ start: bStart, end: bEnd }])).toBe(false);
  });
});
