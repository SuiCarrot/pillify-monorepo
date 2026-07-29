import { describe, expect, it } from 'vitest';

import { makeDoseId } from '../domain/dose';
import { DEFAULT_REMINDER_POLICY } from '../domain/reminder';
import { addLocalDays, atLocalWallTime, toLocalDateString, toOffsetIso } from './dateUtils';
import { buildPlannedReminders, wallClockOf } from './scheduler';
import { makeMedication } from '../testing/fixtures';

describe('buildPlannedReminders', () => {
  it('skips break days', () => {
    const med = makeMedication({
      cycle: { kind: 'cyclic', activeDays: 21, breakDays: 7 },
      cycleStartDate: '2026-07-01',
    });
    // Jul 22 2026 is break day 1 (21 active from Jul 1)
    const now = new Date(2026, 6, 22, 7, 0);
    const reminders = buildPlannedReminders({
      medications: [med],
      doseLogs: [],
      now,
      policy: { ...DEFAULT_REMINDER_POLICY, horizonDays: 1 },
    });

    expect(reminders).toEqual([]);
  });

  it('skips taken doses and expands escalation for pending ones', () => {
    const med = makeMedication({ cycleStartDate: '2026-07-01' });
    const now = new Date(2026, 6, 1, 7, 0);
    const takenId = makeDoseId(med.id, '2026-07-01');
    const scheduled = atLocalWallTime(now, '08:00');
    if (!scheduled.ok) {
      throw new Error('bad schedule');
    }

    const reminders = buildPlannedReminders({
      medications: [med],
      doseLogs: [
        {
          id: takenId,
          medicationId: med.id,
          scheduledFor: toOffsetIso(scheduled.value),
          status: 'taken',
          takenAt: toOffsetIso(now),
        },
      ],
      now,
      policy: { ...DEFAULT_REMINDER_POLICY, horizonDays: 2 },
    });

    expect(reminders.every((reminder) => reminder.doseId !== takenId)).toBe(true);
    const day2 = reminders.filter((reminder) => reminder.doseId === makeDoseId(med.id, '2026-07-02'));
    expect(day2).toHaveLength(4);
    expect(day2.map((reminder) => reminder.attempt)).toEqual([0, 1, 2, 3]);
  });

  it('is idempotent for the same inputs', () => {
    const med = makeMedication({ cycleStartDate: '2026-07-01' });
    const now = new Date(2026, 6, 1, 7, 0);
    const input = {
      medications: [med],
      doseLogs: [],
      now,
      policy: DEFAULT_REMINDER_POLICY,
    };

    const first = buildPlannedReminders(input).map((reminder) => reminder.id);
    const second = buildPlannedReminders(input).map((reminder) => reminder.id);
    expect(second).toEqual(first);
  });

  it('keeps wall-clock time across a 14-day horizon (DST-safe construction)', () => {
    const med = makeMedication({
      timeOfDay: '08:00',
      cycle: { kind: 'continuous' },
      cycleStartDate: '2026-03-01',
    });
    // Horizon that includes US spring-forward window when TZ observes DST.
    const now = new Date(2026, 2, 5, 6, 0);
    const reminders = buildPlannedReminders({
      medications: [med],
      doseLogs: [],
      now,
      policy: { ...DEFAULT_REMINDER_POLICY, horizonDays: 14, escalationOffsetsMinutes: [0] },
    });

    expect(reminders.length).toBeGreaterThan(0);

    const attempt0 = reminders.filter((reminder) => reminder.attempt === 0);
    for (const reminder of attempt0) {
      const wall = wallClockOf(reminder.fireAt);
      expect(wall).toEqual({ hours: 8, minutes: 0 });
    }

    for (let i = 1; i < attempt0.length; i += 1) {
      const prev = new Date(attempt0[i - 1]!.fireAt);
      const curr = new Date(attempt0[i]!.fireAt);
      const dayDiffMs = curr.getTime() - prev.getTime();
      // Local calendar day gap: not exactly 23h or 25h wall failure from ms math —
      // consecutive attempt-0 fires must stay on consecutive local dates.
      expect(toLocalDateString(curr)).toBe(toLocalDateString(addLocalDays(prev, 1)));
      expect(dayDiffMs).not.toBe(23 * 60 * 60 * 1000);
      expect(dayDiffMs).not.toBe(25 * 60 * 60 * 1000);
    }
  });

  it('does not schedule inactive medications', () => {
    const med = makeMedication({ active: false, cycleStartDate: '2026-07-01' });
    const reminders = buildPlannedReminders({
      medications: [med],
      doseLogs: [],
      now: new Date(2026, 6, 1, 7, 0),
    });
    expect(reminders).toEqual([]);
  });
});
