import { describe, expect, it } from 'vitest';

import { makeDoseId, type DoseLog } from '../domain/dose';
import { deriveStatus } from './doseState';
import { atLocalWallTime, toOffsetIso } from './dateUtils';
import { makeMedication } from '../testing/fixtures';

describe('deriveStatus', () => {
  const med = makeMedication({ graceMinutes: 60, timeOfDay: '08:00' });

  it('returns taken for persisted taken facts', () => {
    const scheduled = atLocalWallTime(new Date(2026, 6, 29), '08:00');
    if (!scheduled.ok) {
      throw new Error('bad schedule');
    }

    const log: DoseLog = {
      id: makeDoseId(med.id, '2026-07-29'),
      medicationId: med.id,
      scheduledFor: toOffsetIso(scheduled.value),
      status: 'taken',
      takenAt: toOffsetIso(new Date(2026, 6, 29, 7, 40)),
    };

    expect(deriveStatus(log, med, new Date(2026, 6, 29, 10, 0))).toBe('taken');
  });

  it('keeps snoozed until snoozedUntil elapses', () => {
    const scheduled = atLocalWallTime(new Date(2026, 6, 29), '08:00');
    if (!scheduled.ok) {
      throw new Error('bad schedule');
    }

    const log: DoseLog = {
      id: makeDoseId(med.id, '2026-07-29'),
      medicationId: med.id,
      scheduledFor: toOffsetIso(scheduled.value),
      status: 'snoozed',
      snoozedUntil: toOffsetIso(new Date(2026, 6, 29, 8, 20)),
    };

    expect(deriveStatus(log, med, new Date(2026, 6, 29, 8, 15))).toBe('snoozed');
    expect(deriveStatus(log, med, new Date(2026, 6, 29, 8, 25))).toBe('pending');
  });

  it('marks missed after grace window', () => {
    const scheduled = atLocalWallTime(new Date(2026, 6, 29), '08:00');
    if (!scheduled.ok) {
      throw new Error('bad schedule');
    }

    const log: DoseLog = {
      id: makeDoseId(med.id, '2026-07-29'),
      medicationId: med.id,
      scheduledFor: toOffsetIso(scheduled.value),
      status: 'pending',
    };

    expect(deriveStatus(log, med, new Date(2026, 6, 29, 8, 30))).toBe('pending');
    expect(deriveStatus(log, med, new Date(2026, 6, 29, 9, 1))).toBe('missed');
  });
});
