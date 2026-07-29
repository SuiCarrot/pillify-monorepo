export type DoseId = string;

export type DoseStatus = 'pending' | 'taken' | 'snoozed' | 'missed';

export interface DoseLog {
  id: DoseId;
  medicationId: string;
  /** ISO datetime with offset — absolute instant of the planned dose. */
  scheduledFor: string;
  status: DoseStatus;
  takenAt?: string;
  snoozedUntil?: string;
}

export function makeDoseId(medicationId: string, localDate: string): DoseId {
  return `${medicationId}:${localDate}`;
}
