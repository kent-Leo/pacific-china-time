import { Temporal } from '@js-temporal/polyfill';
import type { PacificMode } from '../types';
import { parseDate } from './timeConversion';
import {
  CHINA_ZONE,
  HOUR_MS,
  isSupportedInstant,
  pacificZone,
  zoned,
} from './timezone';

export function dayBounds(date: string, zone: string) {
  const day = parseDate(date);
  if (!day) throw new RangeError('Invalid date');
  const start = day.toZonedDateTime(zone);
  const end = day.add({ days: 1 }).toZonedDateTime(zone);
  return {
    start: start.epochMilliseconds,
    end: end.epochMilliseconds,
    hours: (end.epochMilliseconds - start.epochMilliseconds) / HOUR_MS,
  };
}
export function buildTimeline(date: string, mode: PacificMode) {
  const zone = pacificZone(mode);
  const bounds = dayBounds(date, zone);
  const cells = [];
  for (let instant = bounds.start; instant < bounds.end; instant += HOUR_MS) {
    const pacific = zoned(instant, zone);
    const china = zoned(instant, CHINA_ZONE);
    cells.push({
      instant,
      pacific,
      china,
      supported: isSupportedInstant(instant),
    });
  }
  return { ...bounds, cells };
}
export const instantISO = (instant: number) =>
  Temporal.Instant.fromEpochMilliseconds(instant).toString();
