import type { Medication } from '../domain/medication';

export function makeMedication(overrides: Partial<Medication> = {}): Medication {
  return {
    id: 'med-1',
    name: 'Anticoncepcional',
    timeOfDay: '08:00',
    cycle: { kind: 'cyclic', activeDays: 21, breakDays: 7 },
    cycleStartDate: '2026-07-01',
    graceMinutes: 60,
    active: true,
    ...overrides,
  };
}
