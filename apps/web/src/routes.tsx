import { Navigate, Route, Routes } from 'react-router';

import { AppShell } from './components/AppShell';
import { ConfirmPage } from './features/confirm/ConfirmPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { HistoryPage } from './features/history/HistoryPage';
import { SetupPage } from './features/setup/SetupPage';

export function AppRoutes() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/setup" element={<SetupPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/confirm/:medicationId" element={<ConfirmPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
