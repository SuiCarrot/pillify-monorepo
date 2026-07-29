export type ReminderId = string;

export interface ReminderPolicy {
  escalationOffsetsMinutes: number[];
  snoozeMinutes: number;
  horizonDays: number;
}

export const DEFAULT_REMINDER_POLICY: ReminderPolicy = {
  escalationOffsetsMinutes: [0, 10, 20, 30],
  snoozeMinutes: 10,
  horizonDays: 14,
};

export interface PlannedReminder {
  id: ReminderId;
  medicationId: string;
  doseId: string;
  attempt: number;
  fireAt: string;
  title: string;
  body: string;
}

export function makeReminderId(doseId: string, attempt: number): ReminderId {
  return `${doseId}#${attempt}`;
}
