export type CycleConfig =
  | { kind: 'continuous' }
  | { kind: 'cyclic'; activeDays: number; breakDays: number };

export interface Medication {
  id: string;
  name: string;
  /** Wall-clock time in local timezone, e.g. "08:00" (ADR-006). */
  timeOfDay: string;
  cycle: CycleConfig;
  /** ISO calendar date (YYYY-MM-DD) used as derivation anchor (ADR-003). */
  cycleStartDate: string;
  /** After scheduled time + grace, pending is read as missed. */
  graceMinutes: number;
  active: boolean;
}
