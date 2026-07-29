import { describe, expect, it } from 'vitest';

import { createUseCases } from './createUseCases';
import { makeDoseId } from '../domain/dose';
import { DEFAULT_REMINDER_POLICY } from '../domain/reminder';
import { FakeClock } from '../testing/FakeClock';
import { InMemoryStorage } from '../testing/InMemoryStorage';
import { RecordingNotificationPort } from '../testing/RecordingNotificationPort';
import { makeMedication } from '../testing/fixtures';
import { atLocalWallTime, toOffsetIso } from '../services/dateUtils';

function setup(initial = new Date(2026, 6, 1, 7, 0)) {
  const clock = new FakeClock(initial);
  const storage = new InMemoryStorage();
  const notifications = new RecordingNotificationPort();
  const app = createUseCases({ storage, notifications, clock });
  return { clock, storage, notifications, app };
}

describe('usecases', () => {
  it('simulates a full 21+7 cycle day-by-day in memory', async () => {
    const { clock, storage, app } = setup(new Date(2026, 6, 1, 8, 5));
    await storage.saveMedication(
      makeMedication({
        cycle: { kind: 'cyclic', activeDays: 21, breakDays: 7 },
        cycleStartDate: '2026-07-01',
      }),
    );

    for (let day = 0; day < 28; day += 1) {
      clock.set(new Date(2026, 6, 1 + day, 8, 5));
      const dashboard = await app.getDashboard('med-1');
      expect(dashboard.ok).toBe(true);
      if (!dashboard.ok) {
        continue;
      }

      const item = dashboard.value.medications[0]!;
      if (day < 21) {
        expect(item.cycleDay).toEqual({
          kind: 'active',
          dayInCycle: day + 1,
          totalActive: 21,
        });
        const taken = await app.takeDose({ medicationId: 'med-1' });
        expect(taken.ok).toBe(true);
      } else {
        expect(item.cycleDay.kind).toBe('break');
        const taken = await app.takeDose({ medicationId: 'med-1' });
        expect(taken.ok).toBe(false);
        if (!taken.ok) {
          expect(taken.error.code).toBe('DOSE_ON_BREAK_DAY');
        }
      }
    }
  });

  it('allows taking a dose before the scheduled time', async () => {
    const { clock, storage, app } = setup(new Date(2026, 6, 1, 7, 40));
    await storage.saveMedication(makeMedication({ cycleStartDate: '2026-07-01' }));

    const result = await app.takeDose({ medicationId: 'med-1' });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe('taken');
      expect(result.value.takenAt).toBe(toOffsetIso(clock.now()));
    }

    const dashboard = await app.getDashboard('med-1');
    expect(dashboard.ok).toBe(true);
    if (dashboard.ok) {
      expect(dashboard.value.medications[0]?.todayStatus).toBe('taken');
    }
  });

  it('supports snoozing twice in a row', async () => {
    const { clock, storage, notifications, app } = setup(new Date(2026, 6, 1, 8, 0));
    await storage.saveMedication(makeMedication({ cycleStartDate: '2026-07-01' }));

    const first = await app.snoozeDose({ medicationId: 'med-1' });
    expect(first.ok).toBe(true);
    clock.advanceMinutes(10);

    const second = await app.snoozeDose({ medicationId: 'med-1' });
    expect(second.ok).toBe(true);
    if (second.ok) {
      expect(second.value.status).toBe('snoozed');
      expect(second.value.snoozedUntil).toBeDefined();
    }

    const pending = await notifications.listPending();
    expect(pending.some((id) => id.startsWith(makeDoseId('med-1', '2026-07-01')))).toBe(true);
  });

  it('does not schedule reminders on break days via planReminders', async () => {
    const { storage, notifications, app } = setup(new Date(2026, 6, 22, 7, 0));
    await storage.saveMedication(makeMedication({ cycleStartDate: '2026-07-01' }));

    const planned = await app.planReminders({
      ...DEFAULT_REMINDER_POLICY,
      horizonDays: 1,
      escalationOffsetsMinutes: [0],
    });

    expect(planned.scheduledIds).toEqual([]);
    expect(await notifications.listPending()).toEqual([]);
  });

  it('cancels future reminders when medication is deactivated and replanned', async () => {
    const { storage, notifications, app } = setup(new Date(2026, 6, 1, 7, 0));
    const med = makeMedication({ cycleStartDate: '2026-07-01' });
    await storage.saveMedication(med);

    await app.planReminders({
      ...DEFAULT_REMINDER_POLICY,
      horizonDays: 3,
      escalationOffsetsMinutes: [0],
    });
    expect((await notifications.listPending()).length).toBeGreaterThan(0);

    await storage.saveMedication({ ...med, active: false });
    const replanned = await app.planReminders({
      ...DEFAULT_REMINDER_POLICY,
      horizonDays: 3,
      escalationOffsetsMinutes: [0],
    });

    expect(replanned.scheduledIds).toEqual([]);
    expect(await notifications.listPending()).toEqual([]);
  });

  it('replans and drops old timeOfDay reminder ids when the schedule changes', async () => {
    const { storage, notifications, app } = setup(new Date(2026, 6, 1, 7, 0));
    const med = makeMedication({ cycleStartDate: '2026-07-01', timeOfDay: '08:00' });
    await storage.saveMedication(med);

    await app.planReminders({
      ...DEFAULT_REMINDER_POLICY,
      horizonDays: 1,
      escalationOffsetsMinutes: [0],
    });
    const before = await notifications.listPending();
    expect(before).toHaveLength(1);

    const beforeFireAt = notifications.pending.get(before[0]!)?.fireAt;
    await storage.saveMedication({ ...med, timeOfDay: '09:30' });
    await app.planReminders({
      ...DEFAULT_REMINDER_POLICY,
      horizonDays: 1,
      escalationOffsetsMinutes: [0],
    });

    const after = await notifications.listPending();
    expect(after).toHaveLength(1);
    // Same deterministic id (dose/attempt), different fireAt
    expect(after[0]).toBe(before[0]);
    expect(notifications.pending.get(after[0]!)?.fireAt).not.toBe(beforeFireAt);

    const wall = atLocalWallTime(new Date(2026, 6, 1), '09:30');
    if (!wall.ok) {
      throw new Error('bad wall');
    }
    expect(notifications.pending.get(after[0]!)?.fireAt).toBe(toOffsetIso(wall.value));
  });

  it('keeps wall-clock scheduling when FakeClock timezone label changes (travel)', async () => {
    const { clock, storage, notifications, app } = setup(new Date(2026, 6, 1, 7, 0));
    await storage.saveMedication(
      makeMedication({ cycleStartDate: '2026-07-01', timeOfDay: '08:00' }),
    );

    clock.setTimeZone('America/Sao_Paulo');
    await app.planReminders({
      ...DEFAULT_REMINDER_POLICY,
      horizonDays: 1,
      escalationOffsetsMinutes: [0],
    });
    const sp = [...notifications.pending.values()][0]!;

    clock.setTimeZone('America/New_York');
    await app.planReminders({
      ...DEFAULT_REMINDER_POLICY,
      horizonDays: 1,
      escalationOffsetsMinutes: [0],
    });
    const ny = [...notifications.pending.values()][0]!;

    // Wall time is device-local via Date constructor; both plans target 08:00 local.
    expect(new Date(sp.fireAt).getHours()).toBe(8);
    expect(new Date(ny.fireAt).getHours()).toBe(8);
    expect(sp.id).toBe(ny.id);
  });

  it('planReminders is idempotent across repeated calls', async () => {
    const { storage, app } = setup(new Date(2026, 6, 1, 7, 0));
    await storage.saveMedication(makeMedication({ cycleStartDate: '2026-07-01' }));

    const first = await app.planReminders(DEFAULT_REMINDER_POLICY);
    const second = await app.planReminders(DEFAULT_REMINDER_POLICY);
    expect(second.scheduledIds).toEqual(first.scheduledIds);
  });
});
