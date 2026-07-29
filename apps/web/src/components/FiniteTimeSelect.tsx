const HOURS = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'));

function splitTime(value: string): { hours: string; minutes: string } {
  const [hours = '08', minutes = '00'] = value.split(':');
  return {
    hours: hours.padStart(2, '0'),
    minutes: minutes.padStart(2, '0'),
  };
}

export function FiniteTimeSelect({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (next: string) => void;
  className: string;
}) {
  const { hours, minutes } = splitTime(value);

  return (
    <div className="mt-1 grid grid-cols-2 gap-3">
      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
        Hora
        <select
          className={className}
          value={hours}
          onChange={(event) => onChange(`${event.target.value}:${minutes}`)}
        >
          {HOURS.map((hour) => (
            <option key={hour} value={hour}>
              {hour}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
        Minuto
        <select
          className={className}
          value={minutes}
          onChange={(event) => onChange(`${hours}:${event.target.value}`)}
        >
          {MINUTES.map((minute) => (
            <option key={minute} value={minute}>
              {minute}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
