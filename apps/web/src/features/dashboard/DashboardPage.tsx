import { useEffect, useState } from 'react';
import { Link } from 'react-router';

import { app } from '../../composition';
import { Button } from '../../components/Button';
import { CycleStrip } from '../../components/CycleStrip';
import { refreshDashboard, statusLabel } from '../../lib/appActions';
import { useAppStore } from '../../store/useAppStore';

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function DashboardPage() {
  const loading = useAppStore((state) => state.loading);
  const error = useAppStore((state) => state.error);
  const primary = useAppStore((state) => state.primaryMedication);
  const item = primary();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void refreshDashboard();
  }, []);

  async function handleTake() {
    if (!item) {
      return;
    }
    setBusy(true);
    try {
      const result = await app.takeDose({ medicationId: item.medication.id });
      if (!result.ok) {
        useAppStore.getState().setError(result.error.message);
        return;
      }
      await refreshDashboard();
    } finally {
      setBusy(false);
    }
  }

  if (loading && !item) {
    return <p className="text-slate-500">Carregando…</p>;
  }

  if (!item) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Nenhum remédio configurado</h1>
        <p className="text-slate-600 dark:text-slate-300">
          Cadastre o primeiro remédio para começar o ciclo.
        </p>
        <Link to="/setup">
          <Button>Configurar remédio</Button>
        </Link>
      </section>
    );
  }

  const isBreak = item.cycleDay.kind === 'break';
  const alreadyTaken = item.todayStatus === 'taken';

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{item.medication.name}</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-300">
          {item.cycleDayLabel} · horário {item.medication.timeOfDay}
        </p>
      </div>

      {error ? (
        <p role="alert" className="rounded-2xl bg-rose-100 px-4 py-3 text-sm text-rose-900 dark:bg-rose-950 dark:text-rose-100">
          {error}
        </p>
      ) : null}

      <CycleStrip cycleDay={item.cycleDay} />

      <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Dose de hoje</p>
        <p className="mt-2 text-xl font-semibold">{statusLabel(item.todayStatus)}</p>
        <p className="mt-1 text-sm text-slate-500">Agendada para {formatTime(item.scheduledFor)}</p>
      </div>

      {isBreak ? (
        <p className="rounded-2xl bg-slate-200/80 px-4 py-3 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          Hoje é dia de pausa — sem dose e sem lembrete.
        </p>
      ) : alreadyTaken ? (
        <Button variant="secondary" disabled>
          Já tomado hoje
        </Button>
      ) : (
        <div className="space-y-3">
          <Button onClick={() => void handleTake()} disabled={busy}>
            {busy ? 'Salvando…' : 'Marcar como tomado'}
          </Button>
          <Link to={`/confirm/${item.medication.id}`} className="block">
            <Button variant="secondary">Abrir confirmação</Button>
          </Link>
        </div>
      )}
    </section>
  );
}
