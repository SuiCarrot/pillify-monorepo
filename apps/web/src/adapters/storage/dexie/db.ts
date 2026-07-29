import Dexie, { type EntityTable } from 'dexie';
import type { DoseLog, Medication } from '@pillify/core';

export class PillifyDatabase extends Dexie {
  medications!: EntityTable<Medication, 'id'>;
  doseLogs!: EntityTable<DoseLog, 'id'>;

  constructor(name = 'pillify') {
    super(name);
    this.version(1).stores({
      medications: 'id, active',
      doseLogs: 'id, medicationId, scheduledFor, [medicationId+scheduledFor]',
    });
  }
}

export const db = new PillifyDatabase();
