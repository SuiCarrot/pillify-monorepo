import { describe, expect, it } from 'vitest';

import {
  addLocalDays,
  atLocalWallTime,
  parseLocalDate,
  parseTimeOfDay,
  toLocalDateString,
} from './dateUtils';

describe('dateUtils', () => {
  it('parses local dates without UTC shift', () => {
    const parsed = parseLocalDate('2026-07-29');
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(toLocalDateString(parsed.value)).toBe('2026-07-29');
      expect(parsed.value.getHours()).toBe(0);
    }
  });

  it('rejects invalid calendar dates', () => {
    expect(parseLocalDate('2026-02-30').ok).toBe(false);
    expect(parseTimeOfDay('25:00').ok).toBe(false);
  });

  it('builds wall-clock instants with the local Date constructor', () => {
    const day = parseLocalDate('2026-11-01');
    if (!day.ok) {
      throw new Error('bad day');
    }

    const at = atLocalWallTime(day.value, '08:00');
    expect(at.ok).toBe(true);
    if (at.ok) {
      expect(at.value.getFullYear()).toBe(2026);
      expect(at.value.getMonth()).toBe(10);
      expect(at.value.getDate()).toBe(1);
      expect(at.value.getHours()).toBe(8);
      expect(at.value.getMinutes()).toBe(0);
    }
  });

  it('advances calendar days without assuming 86400000 ms', () => {
    const start = parseLocalDate('2026-03-07');
    if (!start.ok) {
      throw new Error('bad start');
    }

    const next = addLocalDays(start.value, 1);
    expect(toLocalDateString(next)).toBe('2026-03-08');
  });
});
