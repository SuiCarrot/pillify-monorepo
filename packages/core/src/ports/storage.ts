import type { DoseLog } from '../domain/dose.js';
import type { Medication } from '../domain/medication.js';

export interface DateRange {
  from: Date;
  to: Date;
}

export interface StoragePort {
  getMedications(): Promise<Medication[]>;
  getMedication(id: string): Promise<Medication | undefined>;
  saveMedication(med: Medication): Promise<void>;
  getDoseLogs(range: DateRange): Promise<DoseLog[]>;
  getDoseLog(id: string): Promise<DoseLog | undefined>;
  upsertDoseLog(log: DoseLog): Promise<void>;
}
