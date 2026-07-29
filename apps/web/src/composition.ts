import {
  createUseCases,
  toLocalDateString,
  type Medication,
  type UseCases,
} from '@pillify/core';

import { SystemClock } from './adapters/clock/SystemClock';
import { BrowserLifecycleAdapter } from './adapters/lifecycle/BrowserLifecycleAdapter';
import type { LifecyclePort } from './adapters/lifecycle/LifecyclePort';
import { DevNotificationAdapter } from './adapters/notifications/DevNotificationAdapter';
import { db } from './adapters/storage/dexie/db';
import { DexieStorageAdapter } from './adapters/storage/dexie/DexieStorageAdapter';
import { useAppStore } from './store/useAppStore';

function isNativePlatform(): boolean {
  const capacitor = (
    globalThis as {
      Capacitor?: { isNativePlatform?: () => boolean };
    }
  ).Capacitor;
  return capacitor?.isNativePlatform?.() === true;
}

function createNotificationAdapter(): DevNotificationAdapter {
  // Phase 3: return CapacitorNotificationAdapter when isNativePlatform() is true.
  if (isNativePlatform()) {
    return new DevNotificationAdapter();
  }
  return new DevNotificationAdapter();
}

const storage = new DexieStorageAdapter(db);
const clock = new SystemClock();
const notifications = createNotificationAdapter();
const lifecycle: LifecyclePort = new BrowserLifecycleAdapter();

export const app: UseCases = createUseCases({ storage, clock, notifications });

export const platform = {
  storage,
  clock,
  notifications,
  lifecycle,
  isNotificationReliable: notifications.isReliable,
};

const SEED_MEDICATION: Medication = {
  id: 'seed-pill',
  name: 'Anticoncepcional',
  timeOfDay: '08:00',
  cycle: { kind: 'cyclic', activeDays: 21, breakDays: 7 },
  cycleStartDate: toLocalDateString(clock.now()),
  graceMinutes: 60,
  active: true,
};

let bootstrapped = false;

export async function bootstrapApp(): Promise<void> {
  if (bootstrapped) {
    return;
  }

  const existing = await storage.getMedications();
  if (existing.length === 0) {
    await storage.saveMedication(SEED_MEDICATION);
  }

  useAppStore.getState().setNotificationPermission(notifications.getPermissionState());
  notifications.onPermissionChange((state) => {
    useAppStore.getState().setNotificationPermission(state);
  });

  await app.planReminders();
  bootstrapped = true;
}

export function startLifecycleReconciliation(): () => void {
  return lifecycle.onBecameActive(() => {
    void app.planReminders();
  });
}
