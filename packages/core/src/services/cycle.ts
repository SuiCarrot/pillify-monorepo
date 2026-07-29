import type { DomainError, Result } from '../domain/errors';
import { err, ok } from '../domain/errors';
import type { CycleConfig, Medication } from '../domain/medication';
import { calendarDaysBetween, parseLocalDate, startOfLocalDay } from './dateUtils';

export type CycleDay =
  | { kind: 'active'; dayInCycle: number; totalActive: number }
  | { kind: 'break'; dayInBreak: number; totalBreak: number };

export function validateCycleConfig(cycle: CycleConfig): Result<true> {
  if (cycle.kind === 'continuous') {
    return ok(true);
  }

  if (!Number.isInteger(cycle.activeDays) || cycle.activeDays < 1) {
    return err('INVALID_CYCLE_CONFIG', 'activeDays must be an integer >= 1');
  }

  if (!Number.isInteger(cycle.breakDays) || cycle.breakDays < 0) {
    return err('INVALID_CYCLE_CONFIG', 'breakDays must be an integer >= 0');
  }

  return ok(true);
}

/**
 * Derives the blister/cycle day from cycleStartDate + config + date (ADR-003).
 * Pure: no I/O, no clock access.
 */
export function getCycleDay(med: Medication, date: Date): Result<CycleDay> {
  const configCheck = validateCycleConfig(med.cycle);
  if (!configCheck.ok) {
    return configCheck;
  }

  const start = parseLocalDate(med.cycleStartDate);
  if (!start.ok) {
    return start;
  }

  const localDate = startOfLocalDay(date);
  const daysSinceStart = calendarDaysBetween(localDate, start.value);

  if (daysSinceStart < 0) {
    return err(
      'CYCLE_START_IN_FUTURE',
      `Date ${localDate.toDateString()} is before cycle start ${med.cycleStartDate}`,
    );
  }

  if (med.cycle.kind === 'continuous') {
    const dayInCycle = daysSinceStart + 1;
    return ok({ kind: 'active', dayInCycle, totalActive: dayInCycle });
  }

  const { activeDays, breakDays } = med.cycle;
  const period = activeDays + breakDays;
  const position = daysSinceStart % period;

  if (position < activeDays) {
    return ok({
      kind: 'active',
      dayInCycle: position + 1,
      totalActive: activeDays,
    });
  }

  return ok({
    kind: 'break',
    dayInBreak: position - activeDays + 1,
    totalBreak: breakDays,
  });
}

export function isActiveDoseDay(med: Medication, date: Date): Result<boolean> {
  const day = getCycleDay(med, date);
  if (!day.ok) {
    return day;
  }
  return ok(day.value.kind === 'active');
}

export function cycleDayLabel(day: CycleDay): string {
  if (day.kind === 'active') {
    return `Dia ${day.dayInCycle}/${day.totalActive}`;
  }
  return `Pausa ${day.dayInBreak}/${day.totalBreak}`;
}

export type { DomainError };
