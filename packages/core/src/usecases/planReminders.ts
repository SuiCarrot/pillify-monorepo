import type { ClockPort } from '../ports/clock';
import type { NotificationPort } from '../ports/notification';
import type { StoragePort } from '../ports/storage';
import type { ReminderPolicy } from '../domain/reminder';
import { DEFAULT_REMINDER_POLICY } from '../domain/reminder';
import { addLocalDays, startOfLocalDay } from '../services/dateUtils';
import { buildPlannedReminders } from '../services/scheduler';

export interface PlanRemindersDeps {
  storage: StoragePort;
  notifications: NotificationPort;
  clock: ClockPort;
}

export interface PlanRemindersResult {
  scheduledIds: string[];
  cancelledIds: string[];
}

/**
 * Recomputes the rolling horizon and reconciles pending notifications (ADR-004).
 */
export async function planReminders(
  deps: PlanRemindersDeps,
  policy: ReminderPolicy = DEFAULT_REMINDER_POLICY,
): Promise<PlanRemindersResult> {
  const now = deps.clock.now();
  const medications = await deps.storage.getMedications();
  const from = startOfLocalDay(now);
  const to = addLocalDays(from, policy.horizonDays);
  const doseLogs = await deps.storage.getDoseLogs({ from, to });

  const desired = buildPlannedReminders({
    medications,
    doseLogs,
    now,
    policy,
  });

  const desiredIds = new Set(desired.map((reminder) => reminder.id));
  const pending = await deps.notifications.listPending();
  const cancelledIds = pending.filter((id) => !desiredIds.has(id));

  if (cancelledIds.length > 0) {
    await deps.notifications.cancel(cancelledIds);
  }

  await deps.notifications.schedule(desired);

  return {
    scheduledIds: desired.map((reminder) => reminder.id),
    cancelledIds,
  };
}
