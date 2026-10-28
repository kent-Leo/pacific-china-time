import { Temporal } from '@js-temporal/polyfill';
import { isSupportedInstant, MAX_YEAR, MIN_YEAR, zoned } from './timezone';

export interface TimeCandidate {
  instant: number;
  offset: string;
}
export type LocalResolution =
  | { kind: 'valid'; candidate: TimeCandidate }
  | { kind: 'ambiguous'; candidates: [TimeCandidate, TimeCandidate] }
  | { kind: 'gap' }
  | { kind: 'invalid' };

export function parseDate(value: string): Temporal.PlainDate | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  try {
    const date = Temporal.PlainDate.from(value, { overflow: 'reject' });
    return date.year >= MIN_YEAR && date.year <= MAX_YEAR ? date : null;
  } catch {
    return null;
  }
}
export function parseTime(value: string): Temporal.PlainTime | null {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return null;
  try {
    return Temporal.PlainTime.from(value, { overflow: 'reject' });
  } catch {
    return null;
  }
}

/** Never silently choose a side of a DST fold or normalize a skipped local time. */
export function resolveLocal(
  date: string,
  time: string,
  zone: string,
): LocalResolution {
  const day = parseDate(date);
  const clock = parseTime(time);
  if (!day || !clock) return { kind: 'invalid' };
  try {
    const local = day.toPlainDateTime(clock);
    const earlier = local.toZonedDateTime(zone, { disambiguation: 'earlier' });
    const later = local.toZonedDateTime(zone, { disambiguation: 'later' });
    if (
      !earlier.toPlainDateTime().equals(local) ||
      !later.toPlainDateTime().equals(local)
    )
      return { kind: 'gap' };
    if (
      ![earlier, later].every((value) =>
        isSupportedInstant(value.epochMilliseconds),
      )
    )
      return { kind: 'invalid' };
    const first = {
      instant: earlier.epochMilliseconds,
      offset: earlier.offset,
    };
    if (earlier.epochMilliseconds === later.epochMilliseconds)
      return { kind: 'valid', candidate: first };
    return {
      kind: 'ambiguous',
      candidates: [
        first,
        { instant: later.epochMilliseconds, offset: later.offset },
      ],
    };
  } catch {
    return { kind: 'invalid' };
  }
}
export function localFields(instant: number, zone: string) {
  const value = zoned(instant, zone);
  return {
    date: value.toPlainDate().toString(),
    time: `${String(value.hour).padStart(2, '0')}:${String(value.minute).padStart(2, '0')}`,
  };
}
export function relativeDay(
  instant: number,
  sourceZone: string,
  targetZone: string,
): number {
  return zoned(instant, sourceZone)
    .toPlainDate()
    .until(zoned(instant, targetZone).toPlainDate()).days;
}
