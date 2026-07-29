import type { DoseLog } from '../domain/dose';
import type { Medication } from '../domain/medication';
import type { DateRange, StoragePort } from '../ports/storage';
import { clone } from './clone';

export class InMemoryStorage implements StoragePort {
  private medications = new Map<string, Medication>();
  private doseLogs = new Map<string, DoseLog>();

  async getMedications(): Promise<Medication[]> {
    return [...this.medications.values()].map((med) => clone(med));
  }

  async getMedication(id: string): Promise<Medication | undefined> {
    const med = this.medications.get(id);
    return med ? clone(med) : undefined;
  }

  async saveMedication(med: Medication): Promise<void> {
    this.medications.set(med.id, clone(med));
  }

  async getDoseLogs(range: DateRange): Promise<DoseLog[]> {
    const from = range.from.getTime();
    const to = range.to.getTime();
    return [...this.doseLogs.values()]
      .filter((log) => {
        const scheduled = new Date(log.scheduledFor).getTime();
        return scheduled >= from && scheduled <= to;
      })
      .map((log) => clone(log));
  }

  async getDoseLog(id: string): Promise<DoseLog | undefined> {
    const log = this.doseLogs.get(id);
    return log ? clone(log) : undefined;
  }

  async upsertDoseLog(log: DoseLog): Promise<void> {
    this.doseLogs.set(log.id, clone(log));
  }

  clear(): void {
    this.medications.clear();
    this.doseLogs.clear();
  }
}
