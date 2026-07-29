import type { DoseLog, DateRange, Medication, StoragePort } from '@pillify/core';
import type { PillifyDatabase } from './db';

export class DexieStorageAdapter implements StoragePort {
  constructor(private readonly database: PillifyDatabase) {}

  async getMedications(): Promise<Medication[]> {
    return this.database.medications.toArray();
  }

  async getMedication(id: string): Promise<Medication | undefined> {
    return this.database.medications.get(id);
  }

  async saveMedication(med: Medication): Promise<void> {
    await this.database.medications.put(med);
  }

  async getDoseLogs(range: DateRange): Promise<DoseLog[]> {
    const fromMs = range.from.getTime();
    const toMs = range.to.getTime();
    // Compare absolute instants — scheduledFor may carry local offsets (ADR-006).
    const logs = await this.database.doseLogs.toArray();
    return logs.filter((log) => {
      const scheduledMs = new Date(log.scheduledFor).getTime();
      return scheduledMs >= fromMs && scheduledMs <= toMs;
    });
  }

  async getDoseLog(id: string): Promise<DoseLog | undefined> {
    return this.database.doseLogs.get(id);
  }

  async upsertDoseLog(log: DoseLog): Promise<void> {
    await this.database.doseLogs.put(log);
  }
}
