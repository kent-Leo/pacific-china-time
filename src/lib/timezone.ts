import { Temporal } from '@js-temporal/polyfill';
import type { PacificMode } from '../types';

export const CHINA_ZONE = 'Asia/Shanghai';
export const PACIFIC_ZONE = 'America/Los_Angeles';
export const FIXED_PST = '-08:00';
export const MIN_YEAR = 1992;
export const MAX_YEAR = 9999;
export const MIN_DATE = '1992-01-01';
export const MAX_DATE = '9999-12-31';
export const HOUR_MS = 3_600_000;

export const pacificZone = (mode: PacificMode) =>
  mode === 'fixed' ? FIXED_PST : PACIFIC_ZONE;
export const zoned = (instant: number, zone: string) =>
  Temporal.Instant.fromEpochMilliseconds(instant).toZonedDateTimeISO(zone);
export function isSupportedInstant(instant: number): boolean {
  if (!Number.isSafeInteger(instant)) return false;
  try {
    return [PACIFIC_ZONE, FIXED_PST, CHINA_ZONE].every((zone) => {
      const year = zoned(instant, zone).year;
      return year >= MIN_YEAR && year <= MAX_YEAR;
    });
  } catch {
    return false;
  }
}
export function differenceHours(instant: number, mode: PacificMode): number {
  return (
    (zoned(instant, CHINA_ZONE).offsetNanoseconds -
      zoned(instant, pacificZone(mode)).offsetNanoseconds) /
    3_600_000_000_000
  );
}
export function zoneLabel(instant: number, zone: string): string {
  if (zone === FIXED_PST) return 'PST';
  if (zone === CHINA_ZONE) return 'CST';
  return zoned(instant, zone).offset === '-07:00' ? 'PDT' : 'PST';
}
// Day/night is a transparent clock-time convention, not an astronomical estimate.
export const isDaytime = (hour: number) => hour >= 6 && hour < 18;
