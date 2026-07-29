import { addLocalDays, startOfLocalDay, type DoseStatus } from '@pillify/core';

import { app, platform } from '../composition';
import { useAppStore } from '../store/useAppStore';

export async function refreshDashboard(): Promise<void> {
  const { setLoading, setError, setDashboard, setSelectedMedicationId, selectedMedicationId } =
    useAppStore.getState();

  setLoading(true);
  setError(null);

  try {
    const result = await app.getDashboard();
    if (!result.ok) {
      setError(result.error.message);
      setDashboard(null);
      return;
    }

    setDashboard(result.value);
    if (!selectedMedicationId && result.value.medications[0]) {
      setSelectedMedicationId(result.value.medications[0].medication.id);
    }
  } catch (error) {
    setError(error instanceof Error ? error.message : 'Falha ao carregar o dashboard');
  } finally {
    setLoading(false);
  }
}

export async function refreshHistory(): Promise<void> {
  const { setHistory, setError } = useAppStore.getState();
  const now = platform.clock.now();
  const from = addLocalDays(startOfLocalDay(now), -90);
  const to = addLocalDays(startOfLocalDay(now), 1);

  try {
    const logs = await platform.storage.getDoseLogs({ from, to });
    logs.sort((a, b) => new Date(b.scheduledFor).getTime() - new Date(a.scheduledFor).getTime());
    setHistory(logs);
  } catch (error) {
    setError(error instanceof Error ? error.message : 'Falha ao carregar o histórico');
  }
}

export async function enableNotifications(): Promise<boolean> {
  const state = await platform.notifications.requestPermission();
  useAppStore.getState().setNotificationPermission(state);
  if (state === 'granted') {
    await app.planReminders();
    return true;
  }
  return false;
}

export function statusLabel(status: DoseStatus): string {
  switch (status) {
    case 'taken':
      return 'Tomado';
    case 'snoozed':
      return 'Adiado';
    case 'missed':
      return 'Esquecido';
    case 'pending':
      return 'Pendente';
  }
}
