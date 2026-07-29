import type { NotificationPort, PermissionState, PlannedReminder } from '@pillify/core';

type TimerHandle = ReturnType<typeof setTimeout>;

/**
 * Browser-only notifications via setTimeout + Notification API.
 * Unreliable with the tab closed — UI must surface `isReliable: false` (D2.3).
 */
export class DevNotificationAdapter implements NotificationPort {
  readonly isReliable = false;

  private timers = new Map<string, TimerHandle>();
  private pending = new Map<string, PlannedReminder>();
  private permissionListeners = new Set<(state: PermissionState) => void>();

  getPermissionState(): PermissionState {
    if (typeof Notification === 'undefined') {
      return 'denied';
    }
    if (Notification.permission === 'granted') {
      return 'granted';
    }
    if (Notification.permission === 'denied') {
      return 'denied';
    }
    return 'prompt';
  }

  onPermissionChange(listener: (state: PermissionState) => void): () => void {
    this.permissionListeners.add(listener);
    return () => {
      this.permissionListeners.delete(listener);
    };
  }

  async requestPermission(): Promise<PermissionState> {
    if (typeof Notification === 'undefined') {
      this.emitPermission('denied');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      this.emitPermission('granted');
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      this.emitPermission('denied');
      return 'denied';
    }

    const result = await Notification.requestPermission();
    const state: PermissionState =
      result === 'granted' ? 'granted' : result === 'denied' ? 'denied' : 'prompt';
    this.emitPermission(state);
    return state;
  }

  async schedule(reminders: PlannedReminder[]): Promise<void> {
    const desiredIds = new Set(reminders.map((reminder) => reminder.id));

    for (const [id, handle] of this.timers) {
      if (!desiredIds.has(id)) {
        clearTimeout(handle);
        this.timers.delete(id);
        this.pending.delete(id);
      }
    }

    const now = Date.now();

    for (const reminder of reminders) {
      const existing = this.timers.get(reminder.id);
      if (existing) {
        clearTimeout(existing);
        this.timers.delete(reminder.id);
      }

      this.pending.set(reminder.id, reminder);
      const fireAt = new Date(reminder.fireAt).getTime();
      const delay = Math.max(0, fireAt - now);

      const handle = setTimeout(() => {
        this.timers.delete(reminder.id);
        this.pending.delete(reminder.id);
        void this.show(reminder);
      }, delay);

      this.timers.set(reminder.id, handle);
    }
  }

  async cancel(reminderIds: string[]): Promise<void> {
    for (const id of reminderIds) {
      const handle = this.timers.get(id);
      if (handle) {
        clearTimeout(handle);
        this.timers.delete(id);
      }
      this.pending.delete(id);
    }
  }

  async listPending(): Promise<string[]> {
    return [...this.pending.keys()];
  }

  /** Fires a visible notification immediately — useful after permission grant / smoke test. */
  async notifyNow(title: string, body: string): Promise<boolean> {
    if (typeof Notification === 'undefined') {
      console.info(`[Pillify] ${title}: ${body}`);
      return false;
    }

    if (Notification.permission !== 'granted') {
      console.info(`[Pillify] ${title}: ${body}`);
      return false;
    }

    new Notification(title, {
      body,
      tag: `pillify-now-${Date.now()}`,
      requireInteraction: true,
    });
    return true;
  }

  private emitPermission(state: PermissionState): void {
    for (const listener of this.permissionListeners) {
      listener(state);
    }
  }

  private async show(reminder: PlannedReminder): Promise<void> {
    const shown = await this.notifyNow(reminder.title, reminder.body);
    if (!shown) {
      console.info(
        `[Pillify] Lembrete agendado não exibido (permissão=${this.getPermissionState()}): ${reminder.title}`,
      );
    }
  }
}
