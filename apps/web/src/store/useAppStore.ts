import { create } from 'zustand';
import type { Dashboard, DashboardMedication, DoseLog, PermissionState } from '@pillify/core';

interface AppUiState {
  loading: boolean;
  error: string | null;
  dashboard: Dashboard | null;
  history: DoseLog[];
  selectedMedicationId: string | null;
  notificationPermission: PermissionState;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setDashboard: (dashboard: Dashboard | null) => void;
  setHistory: (history: DoseLog[]) => void;
  setSelectedMedicationId: (id: string | null) => void;
  setNotificationPermission: (state: PermissionState) => void;
  primaryMedication: () => DashboardMedication | undefined;
}

export const useAppStore = create<AppUiState>((set, get) => ({
  loading: true,
  error: null,
  dashboard: null,
  history: [],
  selectedMedicationId: null,
  notificationPermission: 'prompt',
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setDashboard: (dashboard) => set({ dashboard }),
  setHistory: (history) => set({ history }),
  setSelectedMedicationId: (selectedMedicationId) => set({ selectedMedicationId }),
  setNotificationPermission: (notificationPermission) => set({ notificationPermission }),
  primaryMedication: () => {
    const { dashboard, selectedMedicationId } = get();
    if (!dashboard) {
      return undefined;
    }
    if (selectedMedicationId) {
      return dashboard.medications.find((item) => item.medication.id === selectedMedicationId);
    }
    return dashboard.medications[0];
  },
}));
