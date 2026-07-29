import { describe, expect, it } from 'vitest';

import { getCycleDay } from '../services/cycle';
import { addLocalDays, parseLocalDate } from '../services/dateUtils';
import { makeMedication } from '../testing/fixtures';
import type { Result } from '../domain/errors';

function local(dateStr: string): Date {
  const parsed = parseLocalDate(dateStr);
  if (!parsed.ok) {
    throw new Error(parsed.error.message);
  }
  return parsed.value;
}

function unwrap<T>(result: Result<T>): T {
  if (!result.ok) {
    throw new Error(`${result.error.code}: ${result.error.message}`);
  }
  return result.value;
}

describe('getCycleDay', () => {
  it('derives continuous days across three months', () => {
    const med = makeMedication({
      cycle: { kind: 'continuous' },
      cycleStartDate: '2026-01-01',
    });

    expect(unwrap(getCycleDay(med, local('2026-01-01')))).toEqual({
      kind: 'active',
      dayInCycle: 1,
      totalActive: 1,
    });
    expect(unwrap(getCycleDay(med, local('2026-03-15')))).toMatchObject({
      kind: 'active',
      dayInCycle: 74,
    });
  });

  it('walks a 21+7 cycle across three full periods', () => {
    const med = makeMedication({
      cycle: { kind: 'cyclic', activeDays: 21, breakDays: 7 },
      cycleStartDate: '2026-01-01',
    });

    const samples: Array<[string, unknown]> = [
      ['2026-01-01', { kind: 'active', dayInCycle: 1, totalActive: 21 }],
      ['2026-01-21', { kind: 'active', dayInCycle: 21, totalActive: 21 }],
      ['2026-01-22', { kind: 'break', dayInBreak: 1, totalBreak: 7 }],
      ['2026-01-28', { kind: 'break', dayInBreak: 7, totalBreak: 7 }],
      ['2026-01-29', { kind: 'active', dayInCycle: 1, totalActive: 21 }],
      ['2026-02-05', { kind: 'active', dayInCycle: 8, totalActive: 21 }],
      ['2026-03-05', { kind: 'active', dayInCycle: 8, totalActive: 21 }],
    ];

    for (const [date, expected] of samples) {
      expect(unwrap(getCycleDay(med, local(date))), date).toEqual(expected);
    }

    // Three full 28-day periods from start → day 1 of period 4
    const day85 = addLocalDays(local('2026-01-01'), 84);
    expect(unwrap(getCycleDay(med, day85))).toEqual({
      kind: 'active',
      dayInCycle: 1,
      totalActive: 21,
    });
  });

  it('supports 24+4 cycles', () => {
    const med = makeMedication({
      cycle: { kind: 'cyclic', activeDays: 24, breakDays: 4 },
      cycleStartDate: '2026-06-01',
    });

    expect(unwrap(getCycleDay(med, local('2026-06-24')))).toEqual({
      kind: 'active',
      dayInCycle: 24,
      totalActive: 24,
    });
    expect(unwrap(getCycleDay(med, local('2026-06-25')))).toEqual({
      kind: 'break',
      dayInBreak: 1,
      totalBreak: 4,
    });
    expect(unwrap(getCycleDay(med, local('2026-06-29')))).toEqual({
      kind: 'active',
      dayInCycle: 1,
      totalActive: 24,
    });
  });

  it('survives month and year boundaries', () => {
    const med = makeMedication({
      cycle: { kind: 'cyclic', activeDays: 21, breakDays: 7 },
      cycleStartDate: '2025-12-20',
    });

    expect(unwrap(getCycleDay(med, local('2025-12-31')))).toEqual({
      kind: 'active',
      dayInCycle: 12,
      totalActive: 21,
    });
    expect(unwrap(getCycleDay(med, local('2026-01-01')))).toEqual({
      kind: 'active',
      dayInCycle: 13,
      totalActive: 21,
    });
  });

  it('stays correct after the app is closed for 3 and 40 days', () => {
    const med = makeMedication({
      cycle: { kind: 'cyclic', activeDays: 21, breakDays: 7 },
      cycleStartDate: '2026-07-01',
    });

    const after3 = addLocalDays(local('2026-07-01'), 3);
    const after40 = addLocalDays(local('2026-07-01'), 40);

    expect(unwrap(getCycleDay(med, after3))).toEqual({
      kind: 'active',
      dayInCycle: 4,
      totalActive: 21,
    });
    expect(unwrap(getCycleDay(med, after40))).toEqual({
      kind: 'active',
      dayInCycle: 13,
      totalActive: 21,
    });
  });

  it('rejects dates before cycle start', () => {
    const med = makeMedication({ cycleStartDate: '2026-07-10' });
    const result = getCycleDay(med, local('2026-07-01'));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('CYCLE_START_IN_FUTURE');
    }
  });
});
