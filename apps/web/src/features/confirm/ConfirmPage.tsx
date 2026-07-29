import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';

import { app } from '../../composition';
import { Button } from '../../components/Button';
import { refreshDashboard } from '../../lib/appActions';
import { useAppStore } from '../../store/useAppStore';

export function ConfirmPage() {
  const { medicationId = '' } = useParams();
  const navigate = useNavigate();
  const item = useAppStore((state) =>
    state.dashboard?.medications.find((entry) => entry.medication.id === medicationId),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!item) {
      void refreshDashboard();
    }
  }, [item]);

  async function handleTake() {
    setBusy(true);
    setError(null);
    try {
      const result = await app.takeDose({ medicationId });
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      await refreshDashboard();
      navigate('/');
    } finally {
      setBusy(false);
    }
  }

  async function handleSnooze() {
    setBusy(true);
    setError(null);
    try {
      const result = await app.snoozeDose({ medicationId });
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      await refreshDashboard();
      navigate('/');
    } finally {
      setBusy(false);
    }
  }

  const name = item?.medication.name ?? 'Remédio';

  return (
    <section className="flex min-h-[70vh] flex-col justify-center gap-6 text-center">
      <div>
        <p className="text-sm font-semibold tracking-[0.18em] text-rose-600 uppercase">Agora</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Tomar {name}?</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          Confirme a dose ou adie por 10 minutos.
        </p>
      </div>

      {error ? (
        <p role="alert" className="rounded-2xl bg-rose-100 px-4 py-3 text-sm text-rose-900 dark:bg-rose-950 dark:text-rose-100">
          {error}
        </p>
      ) : null}

      <div className="space-y-3">
        <Button onClick={() => void handleTake()} disabled={busy} className="min-h-14 text-lg">
          Tomei agora
        </Button>
        <Button variant="secondary" onClick={() => void handleSnooze()} disabled={busy}>
          Adiar 10 min
        </Button>
        <Button variant="ghost" onClick={() => navigate('/')}>
          Voltar
        </Button>
      </div>
    </section>
  );
}
