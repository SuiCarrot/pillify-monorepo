import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import type { CycleConfig, Medication } from '@pillify/core';
import { toLocalDateString, validateCycleConfig } from '@pillify/core';

import { app, platform } from '../../composition';
import { Button } from '../../components/Button';
import { FiniteDateSelect } from '../../components/FiniteDateSelect';
import { FiniteTimeSelect } from '../../components/FiniteTimeSelect';
import { refreshDashboard } from '../../lib/appActions';
import { useAppStore } from '../../store/useAppStore';

type CyclePreset = 'continuous' | '21-7' | '24-4' | 'custom';

function presetFromCycle(cycle: CycleConfig): CyclePreset {
  if (cycle.kind === 'continuous') {
    return 'continuous';
  }
  if (cycle.activeDays === 21 && cycle.breakDays === 7) {
    return '21-7';
  }
  if (cycle.activeDays === 24 && cycle.breakDays === 4) {
    return '24-4';
  }
  return 'custom';
}

function cycleFromPreset(
  preset: CyclePreset,
  activeDays: number,
  breakDays: number,
): CycleConfig {
  switch (preset) {
    case 'continuous':
      return { kind: 'continuous' };
    case '21-7':
      return { kind: 'cyclic', activeDays: 21, breakDays: 7 };
    case '24-4':
      return { kind: 'cyclic', activeDays: 24, breakDays: 4 };
    case 'custom':
      return { kind: 'cyclic', activeDays, breakDays };
  }
}

export function SetupPage() {
  const navigate = useNavigate();
  const selectedId = useAppStore((state) => state.selectedMedicationId);
  const [name, setName] = useState('Anticoncepcional');
  const [timeOfDay, setTimeOfDay] = useState('08:00');
  const [cycleStartDate, setCycleStartDate] = useState(toLocalDateString(new Date()));
  const [preset, setPreset] = useState<CyclePreset>('21-7');
  const [activeDays, setActiveDays] = useState(21);
  const [breakDays, setBreakDays] = useState(7);
  const [graceMinutes, setGraceMinutes] = useState(60);
  const [medicationId, setMedicationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      const medications = await platform.storage.getMedications();
      const current =
        medications.find((med) => med.id === selectedId) ?? medications[0] ?? undefined;
      if (!current) {
        return;
      }
      setMedicationId(current.id);
      setName(current.name);
      setTimeOfDay(current.timeOfDay);
      setCycleStartDate(current.cycleStartDate);
      setGraceMinutes(current.graceMinutes);
      setPreset(presetFromCycle(current.cycle));
      if (current.cycle.kind === 'cyclic') {
        setActiveDays(current.cycle.activeDays);
        setBreakDays(current.cycle.breakDays);
      }
    })();
  }, [selectedId]);

  async function handleSave() {
    setBusy(true);
    setError(null);

    const cycle = cycleFromPreset(preset, activeDays, breakDays);
    const cycleCheck = validateCycleConfig(cycle);
    if (!cycleCheck.ok) {
      setError(cycleCheck.error.message);
      setBusy(false);
      return;
    }

    const med: Medication = {
      id: medicationId ?? crypto.randomUUID(),
      name: name.trim() || 'Remédio',
      timeOfDay,
      cycle,
      cycleStartDate,
      graceMinutes,
      active: true,
    };

    try {
      const result = await app.updateMedication(med);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      useAppStore.getState().setSelectedMedicationId(med.id);
      await refreshDashboard();
      navigate('/');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Falha ao salvar');
    } finally {
      setBusy(false);
    }
  }

  const fieldClass =
    'mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 outline-none focus:border-rose-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100';

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configurar remédio</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-300">
          Defina o ciclo, o horário e a data de início da cartela.
        </p>
      </div>

      {error ? (
        <p role="alert" className="rounded-2xl bg-rose-100 px-4 py-3 text-sm text-rose-900 dark:bg-rose-950 dark:text-rose-100">
          {error}
        </p>
      ) : null}

      <label className="block text-sm font-medium">
        Nome
        <input className={fieldClass} value={name} onChange={(event) => setName(event.target.value)} />
      </label>

      <div>
        <p className="text-sm font-medium">Horário</p>
        <FiniteTimeSelect value={timeOfDay} onChange={setTimeOfDay} className={fieldClass} />
      </div>

      <div>
        <p className="text-sm font-medium">Início do ciclo</p>
        <FiniteDateSelect
          value={cycleStartDate}
          onChange={setCycleStartDate}
          className={fieldClass}
        />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Tipo de ciclo</legend>
        {(
          [
            ['21-7', '21 ativos + 7 de pausa'],
            ['24-4', '24 ativos + 4 de pausa'],
            ['continuous', 'Contínuo'],
            ['custom', 'Personalizado'],
          ] as const
        ).map(([value, label]) => (
          <label key={value} className="flex min-h-11 items-center gap-3 text-sm">
            <input
              type="radio"
              name="cycle"
              checked={preset === value}
              onChange={() => setPreset(value)}
            />
            {label}
          </label>
        ))}
      </fieldset>

      {preset === 'custom' ? (
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-medium">
            Dias ativos
            <input
              className={fieldClass}
              type="number"
              min={1}
              value={activeDays}
              onChange={(event) => setActiveDays(Number(event.target.value))}
            />
          </label>
          <label className="block text-sm font-medium">
            Dias de pausa
            <input
              className={fieldClass}
              type="number"
              min={0}
              value={breakDays}
              onChange={(event) => setBreakDays(Number(event.target.value))}
            />
          </label>
        </div>
      ) : null}

      <label className="block text-sm font-medium">
        Tolerância (minutos)
        <span className="mt-0.5 block text-xs font-normal text-slate-500 dark:text-slate-400">
          Quanto tempo após o horário a dose ainda conta como pendente antes de virar
          esquecida. A soneca do botão “Adiar” continua sendo 10 minutos.
        </span>
        <input
          className={fieldClass}
          type="number"
          min={0}
          value={graceMinutes}
          onChange={(event) => setGraceMinutes(Number(event.target.value))}
        />
      </label>

      <Button onClick={() => void handleSave()} disabled={busy}>
        {busy ? 'Salvando…' : 'Salvar'}
      </Button>
    </section>
  );
}
