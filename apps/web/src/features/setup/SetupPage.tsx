import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
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

function blankForm() {
  return {
    medicationId: null as string | null,
    name: '',
    timeOfDay: '08:00',
    cycleStartDate: toLocalDateString(new Date()),
    preset: '21-7' as CyclePreset,
    activeDays: 21,
    breakDays: 7,
    graceMinutes: 60,
  };
}

function applyMedicationToForm(med: Medication) {
  return {
    medicationId: med.id,
    name: med.name,
    timeOfDay: med.timeOfDay,
    cycleStartDate: med.cycleStartDate,
    preset: presetFromCycle(med.cycle),
    activeDays: med.cycle.kind === 'cyclic' ? med.cycle.activeDays : 21,
    breakDays: med.cycle.kind === 'cyclic' ? med.cycle.breakDays : 7,
    graceMinutes: med.graceMinutes,
  };
}

export function SetupPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = useAppStore((state) => state.selectedMedicationId);
  const setSelectedMedicationId = useAppStore((state) => state.setSelectedMedicationId);

  const [medications, setMedications] = useState<Medication[]>([]);
  const [form, setForm] = useState(blankForm);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [isNew, setIsNew] = useState(false);

  async function reloadList(): Promise<Medication[]> {
    const list = await platform.storage.getMedications();
    setMedications(list);
    return list;
  }

  useEffect(() => {
    void (async () => {
      const list = await reloadList();
      const wantsNew = searchParams.get('new') === '1';
      const queryId = searchParams.get('id');

      if (wantsNew || list.length === 0) {
        setIsNew(true);
        setForm(blankForm());
        return;
      }

      const current =
        list.find((med) => med.id === queryId) ??
        list.find((med) => med.id === selectedId) ??
        list[0];

      if (!current) {
        setIsNew(true);
        setForm(blankForm());
        return;
      }

      setIsNew(false);
      setForm(applyMedicationToForm(current));
      setSelectedMedicationId(current.id);
    })();
  }, [searchParams, selectedId, setSelectedMedicationId]);

  function startNewMedication() {
    setIsNew(true);
    setForm(blankForm());
    setError(null);
    setSearchParams({ new: '1' });
  }

  function selectMedication(id: string) {
    const med = medications.find((item) => item.id === id);
    if (!med) {
      return;
    }
    setIsNew(false);
    setForm(applyMedicationToForm(med));
    setSelectedMedicationId(id);
    setError(null);
    setSearchParams({ id });
  }

  async function handleSave() {
    setBusy(true);
    setError(null);

    const cycle = cycleFromPreset(form.preset, form.activeDays, form.breakDays);
    const cycleCheck = validateCycleConfig(cycle);
    if (!cycleCheck.ok) {
      setError(cycleCheck.error.message);
      setBusy(false);
      return;
    }

    const med: Medication = {
      id: isNew || !form.medicationId ? crypto.randomUUID() : form.medicationId,
      name: form.name.trim() || 'Remédio',
      timeOfDay: form.timeOfDay,
      cycle,
      cycleStartDate: form.cycleStartDate,
      graceMinutes: form.graceMinutes,
      active: true,
    };

    try {
      const result = await app.updateMedication(med);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setSelectedMedicationId(med.id);
      await reloadList();
      await refreshDashboard();
      navigate('/');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Falha ao salvar');
    } finally {
      setBusy(false);
    }
  }

  async function handleDeactivate() {
    if (!form.medicationId || isNew) {
      return;
    }
    const current = medications.find((med) => med.id === form.medicationId);
    if (!current) {
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const result = await app.updateMedication({ ...current, active: false });
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      const list = await reloadList();
      const remaining = list.filter((med) => med.active);
      if (remaining[0]) {
        selectMedication(remaining[0].id);
      } else {
        startNewMedication();
      }
      await refreshDashboard();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Falha ao desativar');
    } finally {
      setBusy(false);
    }
  }

  const fieldClass =
    'mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 outline-none focus:border-rose-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100';

  const activeMedications = medications.filter((med) => med.active);

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {isNew ? 'Novo remédio' : 'Configurar remédio'}
        </h1>
        <p className="mt-1 text-slate-600 dark:text-slate-300">
          Gerencie vários remédios; cada um tem ciclo, horário e lembretes próprios.
        </p>
      </div>

      {activeMedications.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">Remédios ativos</p>
          <ul className="space-y-2">
            {activeMedications.map((med) => {
              const selected = !isNew && form.medicationId === med.id;
              return (
                <li key={med.id}>
                  <button
                    type="button"
                    onClick={() => selectMedication(med.id)}
                    className={[
                      'flex min-h-11 w-full items-center justify-between rounded-2xl px-4 text-left text-sm ring-1 transition-colors',
                      selected
                        ? 'bg-rose-600 text-white ring-rose-600'
                        : 'bg-white text-slate-900 ring-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-800',
                    ].join(' ')}
                  >
                    <span className="font-medium">{med.name}</span>
                    <span className={selected ? 'text-rose-100' : 'text-slate-500'}>
                      {med.timeOfDay}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <Button variant="secondary" onClick={startNewMedication}>
            Adicionar remédio
          </Button>
        </div>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="rounded-2xl bg-rose-100 px-4 py-3 text-sm text-rose-900 dark:bg-rose-950 dark:text-rose-100"
        >
          {error}
        </p>
      ) : null}

      <label className="block text-sm font-medium">
        Nome
        <input
          className={fieldClass}
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          placeholder="Ex.: Anticoncepcional, Vitamina D"
        />
      </label>

      <div>
        <p className="text-sm font-medium">Horário</p>
        <FiniteTimeSelect
          value={form.timeOfDay}
          onChange={(timeOfDay) => setForm((prev) => ({ ...prev, timeOfDay }))}
          className={fieldClass}
        />
      </div>

      <div>
        <p className="text-sm font-medium">Início do ciclo</p>
        <FiniteDateSelect
          value={form.cycleStartDate}
          onChange={(cycleStartDate) => setForm((prev) => ({ ...prev, cycleStartDate }))}
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
              checked={form.preset === value}
              onChange={() => setForm((prev) => ({ ...prev, preset: value }))}
            />
            {label}
          </label>
        ))}
      </fieldset>

      {form.preset === 'custom' ? (
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-medium">
            Dias ativos
            <input
              className={fieldClass}
              type="number"
              min={1}
              value={form.activeDays}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, activeDays: Number(event.target.value) }))
              }
            />
          </label>
          <label className="block text-sm font-medium">
            Dias de pausa
            <input
              className={fieldClass}
              type="number"
              min={0}
              value={form.breakDays}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, breakDays: Number(event.target.value) }))
              }
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
          value={form.graceMinutes}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, graceMinutes: Number(event.target.value) }))
          }
        />
      </label>

      <Button onClick={() => void handleSave()} disabled={busy}>
        {busy ? 'Salvando…' : isNew ? 'Criar remédio' : 'Salvar'}
      </Button>

      {!isNew && form.medicationId ? (
        <Button variant="ghost" onClick={() => void handleDeactivate()} disabled={busy}>
          Desativar remédio
        </Button>
      ) : null}
    </section>
  );
}
