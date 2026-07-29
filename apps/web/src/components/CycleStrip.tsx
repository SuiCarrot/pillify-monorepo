import type { CycleDay } from '@pillify/core';

export function CycleStrip({ cycleDay }: { cycleDay: CycleDay }) {
  if (cycleDay.kind === 'break') {
    return (
      <div className="rounded-3xl bg-slate-200/80 p-5 dark:bg-slate-800">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Pausa da cartela</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight">
          {cycleDay.dayInBreak}/{cycleDay.totalBreak}
        </p>
      </div>
    );
  }

  const cells = Array.from({ length: cycleDay.totalActive }, (_, index) => index + 1);

  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Dia da cartela</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight">
        {cycleDay.dayInCycle}/{cycleDay.totalActive}
      </p>
      <div className="mt-4 grid grid-cols-7 gap-2">
        {cells.map((day) => {
          const isCurrent = day === cycleDay.dayInCycle;
          const isPast = day < cycleDay.dayInCycle;
          return (
            <div
              key={day}
              aria-current={isCurrent ? 'step' : undefined}
              className={[
                'flex aspect-square items-center justify-center rounded-full text-xs font-semibold',
                isCurrent
                  ? 'bg-rose-600 text-white'
                  : isPast
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
              ].join(' ')}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
}
