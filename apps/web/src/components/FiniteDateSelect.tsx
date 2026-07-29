const MONTHS = [
  { value: '01', label: 'Janeiro' },
  { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' },
  { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
] as const;

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function splitDate(value: string): { year: string; month: string; day: string } {
  const [year = '2026', month = '01', day = '01'] = value.split('-');
  return { year, month, day };
}

function buildYearOptions(centerYear: number, selectedYear: number): string[] {
  const start = Math.min(centerYear - 5, selectedYear);
  const end = Math.max(centerYear + 2, selectedYear);
  return Array.from({ length: end - start + 1 }, (_, index) => String(start + index));
}

export function FiniteDateSelect({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (next: string) => void;
  className: string;
}) {
  const { year, month, day } = splitDate(value);
  const yearNumber = Number(year);
  const monthNumber = Number(month);
  const maxDay = daysInMonth(yearNumber, monthNumber);
  const dayOptions = Array.from({ length: maxDay }, (_, index) =>
    String(index + 1).padStart(2, '0'),
  );
  const safeDay = Number(day) > maxDay ? String(maxDay).padStart(2, '0') : day.padStart(2, '0');
  const years = buildYearOptions(new Date().getFullYear(), yearNumber);

  function emit(nextYear: string, nextMonth: string, nextDay: string) {
    const cappedMax = daysInMonth(Number(nextYear), Number(nextMonth));
    const cappedDay = Math.min(Number(nextDay), cappedMax);
    onChange(
      `${nextYear}-${nextMonth}-${String(cappedDay).padStart(2, '0')}`,
    );
  }

  return (
    <div className="mt-1 grid grid-cols-3 gap-2">
      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
        Dia
        <select
          className={className}
          value={safeDay}
          onChange={(event) => emit(year, month, event.target.value)}
        >
          {dayOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
        Mês
        <select
          className={className}
          value={month.padStart(2, '0')}
          onChange={(event) => emit(year, event.target.value, safeDay)}
        >
          {MONTHS.map((entry) => (
            <option key={entry.value} value={entry.value}>
              {entry.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
        Ano
        <select
          className={className}
          value={year}
          onChange={(event) => emit(event.target.value, month, safeDay)}
        >
          {years.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
