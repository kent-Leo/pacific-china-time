import { CalendarDays } from 'lucide-react';
import { useId } from 'react';
import { formatDate } from '../lib/timeFormat';
import { parseDate } from '../lib/timeConversion';
import { MAX_DATE, MIN_DATE } from '../lib/timezone';

function normalizeDateInput(value: string): string {
  const match = /^(\d{4})\.(\d{1,2})\.(\d{1,2})$/.exec(value);
  if (!match) return value;
  const iso = `${match[1]}-${match[2]!.padStart(2, '0')}-${match[3]!.padStart(2, '0')}`;
  return parseDate(iso) ? iso : value;
}
export function DateField({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  const id = useId();
  return (
    <label className="field" htmlFor={id}>
      <span className="field-label">{label}</span>
      <span className="date-field">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          maxLength={10}
          autoComplete="off"
          spellCheck={false}
          placeholder="YYYY.M.D"
          value={parseDate(value) ? formatDate(value) : value}
          onChange={(event) => onChange(normalizeDateInput(event.target.value))}
        />
        <span className="calendar-trigger">
          <CalendarDays size={17} aria-hidden="true" />
          <input
            type="date"
            aria-label={`${label} · Calendar`}
            min={MIN_DATE}
            max={MAX_DATE}
            value={parseDate(value) ? value : ''}
            onChange={(event) => onChange(event.target.value)}
          />
        </span>
      </span>
    </label>
  );
}
