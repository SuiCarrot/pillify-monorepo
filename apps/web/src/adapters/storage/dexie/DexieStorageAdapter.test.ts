import 'fake-indexeddb/auto';

import { describe, expect, it, beforeEach } from 'vitest';
import type { Medication } from '@pillify/core';

import { PillifyDatabase } from './db';
import { DexieStorageAdapter } from './DexieStorageAdapter';

describe('DexieStorageAdapter', () => {
  let database: PillifyDatabase;
  let storage: DexieStorageAdapter;

  beforeEach(async () => {
    database = new PillifyDatabase(`pillify-test-${crypto.randomUUID()}`);
    storage = new DexieStorageAdapter(database);
    await database.medications.clear();
    await database.doseLogs.clear();
  });

  it('persists and reads medications', async () => {
    const med: Medication = {
      id: 'med-1',
      name: 'Pílula',
      timeOfDay: '08:00',
      cycle: { kind: 'cyclic', activeDays: 21, breakDays: 7 },
      cycleStartDate: '2026-07-01',
      graceMinutes: 60,
      active: true,
    };

    await storage.saveMedication(med);
    await expect(storage.getMedication('med-1')).resolves.toEqual(med);
    await expect(storage.getMedications()).resolves.toEqual([med]);
  });

  it('filters dose logs by absolute time range', async () => {
    await storage.upsertDoseLog({
      id: 'med-1:2026-07-01',
      medicationId: 'med-1',
      scheduledFor: '2026-07-01T08:00:00-03:00',
      status: 'taken',
      takenAt: '2026-07-01T08:05:00-03:00',
    });
    await storage.upsertDoseLog({
      id: 'med-1:2026-08-01',
      medicationId: 'med-1',
      scheduledFor: '2026-08-01T08:00:00-03:00',
      status: 'pending',
    });

    const logs = await storage.getDoseLogs({
      from: new Date('2026-07-01T00:00:00-03:00'),
      to: new Date('2026-07-31T23:59:59-03:00'),
    });

    expect(logs).toHaveLength(1);
    expect(logs[0]?.id).toBe('med-1:2026-07-01');
  });
});
