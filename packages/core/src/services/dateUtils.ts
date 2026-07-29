import { addDays, differenceInCalendarDays, format, formatISO, parse } from 'date-fns';

import { err, ok, type Result } from '../domain/errors';

const LOCAL_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_OF_DAY_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** Start of the given instant's local calendar day. */
export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

/** YYYY-MM-DD in the device local calendar. */
export function toLocalDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Parses YYYY-MM-DD as a local calendar date (midnight local), never as UTC.
 */
export function parseLocalDate(dateStr: string): Result<Date> {
  if (!LOCAL_DATE_PATTERN.test(dateStr)) {
    return err('INVALID_CYCLE_START_DATE', `Invalid calendar date: ${dateStr}`);
  }

  const parsed = parse(dateStr, 'yyyy-MM-dd', new Date(2000, 0, 1, 0, 0, 0, 0));
  if (Number.isNaN(parsed.getTime()) || toLocalDateString(parsed) !== dateStr) {
    return err('INVALID_CYCLE_START_DATE', `Invalid calendar date: ${dateStr}`);
  }

  return ok(startOfLocalDay(parsed));
}

export function parseTimeOfDay(timeOfDay: string): Result<{ hours: number; minutes: number }> {
  const match = TIME_OF_DAY_PATTERN.exec(timeOfDay);
  if (!match) {
    return err('INVALID_TIME_OF_DAY', `Invalid timeOfDay: ${timeOfDay}`);
  }

  return ok({
    hours: Number(match[1]),
    minutes: Number(match[2]),
  });
}

/**
 * Builds a local wall-clock instant for the calendar day of `date` (ADR-006 / D1.5).
 * Uses the local Date constructor — never UTC string parsing or ms-of-day math.
 */
export function atLocalWallTime(date: Date, timeOfDay: string): Result<Date> {
  const parsed = parseTimeOfDay(timeOfDay);
  if (!parsed.ok) {
    return parsed;
  }

  const { hours, minutes } = parsed.value;
  return ok(
    new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes, 0, 0),
  );
}

/** Advance by calendar days in local time (DST-safe). */
export function addLocalDays(date: Date, amount: number): Date {
  return addDays(date, amount);
}

export function calendarDaysBetween(later: Date, earlier: Date): number {
  return differenceInCalendarDays(startOfLocalDay(later), startOfLocalDay(earlier));
}

/** ISO-8601 with local offset for persisted absolute instants. */
export function toOffsetIso(date: Date): string {
  return formatISO(date);
}

export function fromOffsetIso(value: string): Date {
  return new Date(value);
}
