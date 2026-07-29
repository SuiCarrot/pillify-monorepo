import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import type { DashboardMedication } from '@pillify/core';

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

function MedicationCard({
  item,
  expanded,
  onExpand,
  busyId,
  onTake,
}: {
  item: DashboardMedication;
  expanded: boolean;
  onExpand: () => void;
  busyId: string | null;
  onTake: (medicationId: string) => void;
}) {
  const isBreak = item.cycleDay.kind === 'break';
  const alreadyTaken = item.todayStatus === 'taken';
  const busy = busyId === item.medication.id;

  return (
    <article className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      <button type="button" onClick={onExpand} className="w-full text-left">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">{item.medication.name}</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {item.cycleDayLabel} · {item.medication.timeOfDay}
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            {statusLabel(item.todayStatus)}
          </span>
        </div>
      </button>

      {expanded ? (
        <div className="mt-4 space-y-4">
          <CycleStrip cycleDay={item.cycleDay} />
          <p className="text-sm text-slate-500">
            Agendada para {formatTime(item.scheduledFor)}
          </p>
        </div>
      ) : null}

      <div className="mt-4 space-y-3">
        {isBreak ? (
          <p className="rounded-2xl bg-slate-200/80 px-4 py-3 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            Hoje é dia de pausa — sem dose e sem lembrete.
          </p>
        ) : alreadyTaken ? (
          <Button variant="secondary" disabled>
            Já tomado hoje
          </Button>
        ) : (
          <>
            <Button onClick={() => onTake(item.medication.id)} disabled={busy}>
              {busy ? 'Salvando…' : 'Marcar como tomado'}
            </Button>
            <Link to={`/confirm/${item.medication.id}`} className="block">
              <Button variant="secondary">Abrir confirmação</Button>
            </Link>
          </>
        )}
        <Link to={`/setup?id=${item.medication.id}`} className="block">
          <Button variant="ghost">Editar remédio</Button>
        </Link>
      </div>
    </article>
  );
}

export function DashboardPage() {
  const loading = useAppStore((state) => state.loading);
  const error = useAppStore((state) => state.error);
  const dashboard = useAppStore((state) => state.dashboard);
  const selectedId = useAppStore((state) => state.selectedMedicationId);
  const setSelectedMedicationId = useAppStore((state) => state.setSelectedMedicationId);
  const items = dashboard?.medications ?? [];
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    void refreshDashboard();
  }, []);

  async function handleTake(medicationId: string) {
    setBusyId(medicationId);
    try {
      const result = await app.takeDose({ medicationId });
      if (!result.ok) {
        useAppStore.getState().setError(result.error.message);
        return;
      }
      await refreshDashboard();
    } finally {
      setBusyId(null);
    }
  }

  if (loading && items.length === 0) {
    return <p className="text-slate-500">Carregando…</p>;
  }

  if (items.length === 0) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Nenhum remédio configurado</h1>
        <p className="text-slate-600 dark:text-slate-300">
          Cadastre o primeiro remédio para começar o ciclo.
        </p>
        <Link to="/setup?new=1">
          <Button>Adicionar remédio</Button>
        </Link>
      </section>
    );
  }

  const expandedId =
    selectedId && items.some((item) => item.medication.id === selectedId)
      ? selectedId
      : items[0]?.medication.id;

  return (
    <section className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Hoje</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-300">
            {items.length} remédio{items.length === 1 ? '' : 's'} em acompanhamento
          </p>
        </div>
        <Link to="/setup?new=1" className="shrink-0">
          <Button variant="secondary" className="min-w-0 px-4">
            + Novo
          </Button>
        </Link>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-2xl bg-rose-100 px-4 py-3 text-sm text-rose-900 dark:bg-rose-950 dark:text-rose-100"
        >
          {error}
        </p>
      ) : null}

      {items.map((item) => (
        <MedicationCard
          key={item.medication.id}
          item={item}
          expanded={item.medication.id === expandedId}
          onExpand={() => setSelectedMedicationId(item.medication.id)}
          busyId={busyId}
          onTake={(id) => void handleTake(id)}
        />
      ))}
    </section>
  );
}
