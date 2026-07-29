import type { PlannedReminder } from '../domain/reminder';
import type { NotificationPort, PermissionState } from '../ports/notification';
import { clone } from './clone';

/** In-memory notification adapter for tests — replaces the full pending set on schedule. */
export class RecordingNotificationPort implements NotificationPort {
  permission: PermissionState = 'granted';
  pending = new Map<string, PlannedReminder>();
  scheduleCalls: PlannedReminder[][] = [];
  cancelCalls: string[][] = [];

  async requestPermission(): Promise<PermissionState> {
    return this.permission;
  }

  async schedule(reminders: PlannedReminder[]): Promise<void> {
    this.scheduleCalls.push(reminders.map((reminder) => clone(reminder)));
    this.pending.clear();
    for (const reminder of reminders) {
      this.pending.set(reminder.id, clone(reminder));
    }
  }

  async cancel(reminderIds: string[]): Promise<void> {
    this.cancelCalls.push([...reminderIds]);
    for (const id of reminderIds) {
      this.pending.delete(id);
    }
  }

  async listPending(): Promise<string[]> {
    return [...this.pending.keys()];
  }

  reset(): void {
    this.pending.clear();
    this.scheduleCalls = [];
    this.cancelCalls = [];
  }
}
