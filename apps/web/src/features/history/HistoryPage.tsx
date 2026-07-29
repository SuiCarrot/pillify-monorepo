import { useEffect, useState } from 'react';
import { deriveStatus, type DoseLog, type Medication } from '@pillify/core';

import { platform } from '../../composition';
import { refreshHistory, statusLabel } from '../../lib/appActions';
import { useAppStore } from '../../store/useAppStore';

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function HistoryRow({
  log,
  medication,
}: {
  log: DoseLog;
  medication: Medication | undefined;
}) {
  const status = medication
    ? deriveStatus(log, medication, platform.clock.now())
    : log.status;

  return (
    <li className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">{medication?.name ?? log.medicationId}</p>
          <p className="text-sm text-slate-500">{formatWhen(log.scheduledFor)}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          {statusLabel(status)}
        </span>
      </div>
    </li>
  );
}

export function HistoryPage() {
  const history = useAppStore((state) => state.history);
  const [medications, setMedications] = useState<Map<string, Medication>>(new Map());

  useEffect(() => {
    void (async () => {
      await refreshHistory();
      const list = await platform.storage.getMedications();
      setMedications(new Map(list.map((med) => [med.id, med])));
    })();
  }, []);

  const taken = history.filter((log) => log.status === 'taken').length;
  const missed = history.filter((log) => {
    const med = medications.get(log.medicationId);
    if (!med) {
      return log.status === 'missed';
    }
    return deriveStatus(log, med, platform.clock.now()) === 'missed';
  }).length;

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Histórico</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-300">
          Últimos 90 dias de doses registradas.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          <p className="text-sm text-slate-500">Tomadas</p>
          <p className="mt-1 text-2xl font-semibold">{taken}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          <p className="text-sm text-slate-500">Esquecidas</p>
          <p className="mt-1 text-2xl font-semibold">{missed}</p>
        </div>
      </div>

      {history.length === 0 ? (
        <p className="text-slate-500">Ainda não há doses registradas.</p>
      ) : (
        <ul className="space-y-3">
          {history.map((log) => (
            <HistoryRow
              key={log.id}
              log={log}
              medication={medications.get(log.medicationId)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
