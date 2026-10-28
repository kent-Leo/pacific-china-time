import { Temporal } from '@js-temporal/polyfill';
import type { PacificMode } from '../types';
import { CHINA_ZONE, isSupportedInstant, pacificZone, zoned } from './timezone';
import { parseDate, parseTime, resolveLocal } from './timeConversion';
import { dayBounds } from './timeline';

export type Occurrence = 'earlier' | 'later';
export interface MeetingInput {
  date: string;
  mode: PacificMode;
  pacificStart: string;
  pacificEnd: string;
  chinaStart: string;
  chinaEnd: string;
  startOccurrence?: Occurrence;
  endOccurrence?: Occurrence;
}
export interface MeetingInterval {
  start: number;
  end: number;
}
export interface MeetingIssue {
  kind: 'invalid' | 'gap' | 'ambiguous';
  boundary?: 'start' | 'end';
  date?: string;
  time?: string;
}
export type MeetingResult = {
  intervals: MeetingInterval[];
  issues: MeetingIssue[];
};

/** Intersect actual UTC intervals inside the selected Pacific calendar day.
 * China workdays are derived from that window, including the following date.
 * Overnight schedules include the tail of the previous local workday.
 */
export function planMeeting(input: MeetingInput): MeetingResult {
  const day = parseDate(input.date);
  if (
    !day ||
    ![
      input.pacificStart,
      input.pacificEnd,
      input.chinaStart,
      input.chinaEnd,
    ].every(parseTime) ||
    input.pacificStart === input.pacificEnd ||
    input.chinaStart === input.chinaEnd
  ) {
    return { intervals: [], issues: [{ kind: 'invalid' }] };
  }
  const zone = pacificZone(input.mode);
  const window = dayBounds(input.date, zone);
  const issues: MeetingIssue[] = [];

  function schedules(
    dates: Temporal.PlainDate[],
    start: string,
    end: string,
    timeZone: string,
  ): MeetingInterval[] {
    const intervals: MeetingInterval[] = [];
    for (const date of dates) {
      const endDate = end < start ? date.add({ days: 1 }) : date;
      const endpoints: number[] = [];
      for (const [dateValue, time, boundary] of [
        [date, start, 'start'],
        [endDate, end, 'end'],
      ] as const) {
        const resolution = resolveLocal(dateValue.toString(), time, timeZone);
        const occurrence =
          boundary === 'start' ? input.startOccurrence : input.endOccurrence;
        if (resolution.kind === 'valid')
          endpoints.push(resolution.candidate.instant);
        else if (resolution.kind === 'ambiguous' && occurrence)
          endpoints.push(
            resolution.candidates[occurrence === 'earlier' ? 0 : 1].instant,
          );
        else
          issues.push({
            kind: resolution.kind,
            boundary,
            date: dateValue.toString(),
            time,
          });
      }
      const [first, last] = endpoints;
      if (endpoints.length === 2 && first !== undefined && last !== undefined) {
        if (last <= first) issues.push({ kind: 'invalid' });
        else if (last > window.start && first < window.end)
          intervals.push({
            start: Math.max(first, window.start),
            end: Math.min(last, window.end),
          });
      }
    }
    return intervals;
  }
  const pacificDays =
    input.pacificEnd < input.pacificStart
      ? [day.subtract({ days: 1 }), day]
      : [day];
  const firstChinaDay = zoned(window.start, CHINA_ZONE).toPlainDate();
  const lastChinaDay = zoned(window.end - 1, CHINA_ZONE).toPlainDate();
  const chinaDays = [];
  for (
    let cursor =
      input.chinaEnd < input.chinaStart
        ? firstChinaDay.subtract({ days: 1 })
        : firstChinaDay;
    Temporal.PlainDate.compare(cursor, lastChinaDay) <= 0;
    cursor = cursor.add({ days: 1 })
  )
    chinaDays.push(cursor);
  const pacific = schedules(
    pacificDays,
    input.pacificStart,
    input.pacificEnd,
    zone,
  );
  const china = schedules(
    chinaDays,
    input.chinaStart,
    input.chinaEnd,
    CHINA_ZONE,
  );
  if (issues.length) return { intervals: [], issues };
  const overlaps = pacific
    .flatMap((left) =>
      china.map((right) => ({
        start: Math.max(left.start, right.start),
        end: Math.min(left.end, right.end),
      })),
    )
    .filter(
      (interval) =>
        interval.start < interval.end &&
        isSupportedInstant(interval.start) &&
        isSupportedInstant(interval.end - 1),
    )
    .sort((a, b) => a.start - b.start);
  const merged: MeetingInterval[] = [];
  for (const next of overlaps) {
    const previous = merged.at(-1);
    if (previous && next.start <= previous.end)
      previous.end = Math.max(previous.end, next.end);
    else merged.push({ ...next });
  }
  return { intervals: merged, issues: [] };
}
