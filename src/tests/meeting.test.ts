import { describe, expect, it } from 'vitest';
import { planMeeting } from '../lib/meeting';
import type { MeetingInput } from '../lib/meeting';

const base: MeetingInput = {
  date: '2026-07-15',
  mode: 'auto',
  pacificStart: '09:00',
  pacificEnd: '18:00',
  chinaStart: '09:00',
  chinaEnd: '18:00',
};
const iso = (ms: number) => new Date(ms).toISOString();
describe('meeting intersections', () => {
  it('default summer work hours do not overlap', () =>
    expect(planMeeting(base)).toEqual({ intervals: [], issues: [] }));
  it('default winter work hours overlap at Pacific 17:00-18:00 / Beijing next day 09:00-10:00', () => {
    const result = planMeeting({ ...base, date: '2026-01-15' });
    expect(result.issues).toEqual([]);
    expect(result.intervals.map((i) => [iso(i.start), iso(i.end)])).toEqual([
      ['2026-01-16T01:00:00.000Z', '2026-01-16T02:00:00.000Z'],
    ]);
  });
  it('uses the next Chinese date for an evening Pacific meeting', () => {
    const result = planMeeting({
      ...base,
      pacificStart: '17:00',
      pacificEnd: '20:00',
    });
    expect(result.issues).toEqual([]);
    expect(result.intervals.map((i) => [iso(i.start), iso(i.end)])).toEqual([
      ['2026-07-16T01:00:00.000Z', '2026-07-16T03:00:00.000Z'],
    ]);
  });
  it('includes China same-day and following-day work windows in one Pacific day', () => {
    const result = planMeeting({
      ...base,
      pacificStart: '00:00',
      pacificEnd: '23:59',
    });
    expect(result.intervals).toHaveLength(2);
    expect(result.intervals.map((i) => [iso(i.start), iso(i.end)])).toEqual([
      ['2026-07-15T07:00:00.000Z', '2026-07-15T10:00:00.000Z'],
      ['2026-07-16T01:00:00.000Z', '2026-07-16T06:59:00.000Z'],
    ]);
  });
  it('handles overnight work and clips to the Pacific calendar day', () => {
    const result = planMeeting({
      ...base,
      pacificStart: '22:00',
      pacificEnd: '02:00',
    });
    expect(result.intervals.map((i) => [iso(i.start), iso(i.end)])).toEqual([
      ['2026-07-15T07:00:00.000Z', '2026-07-15T09:00:00.000Z'],
      ['2026-07-16T05:00:00.000Z', '2026-07-16T07:00:00.000Z'],
    ]);
  });
  it('handles an overnight China schedule', () => {
    const result = planMeeting({
      ...base,
      chinaStart: '22:00',
      chinaEnd: '10:00',
    });
    expect(result.intervals.map((i) => [iso(i.start), iso(i.end)])).toEqual([
      ['2026-07-15T16:00:00.000Z', '2026-07-16T01:00:00.000Z'],
    ]);
  });
  it('rejects equal start/end rather than interpreting it as a 24-hour shift', () =>
    expect(planMeeting({ ...base, pacificEnd: '09:00' }).issues[0]?.kind).toBe(
      'invalid',
    ));
  it('rejects malformed times and dates', () => {
    expect(planMeeting({ ...base, date: '2026-02-30' }).issues[0]?.kind).toBe(
      'invalid',
    );
    expect(planMeeting({ ...base, chinaStart: '24:30' }).issues[0]?.kind).toBe(
      'invalid',
    );
  });
  it('reports nonexistent DST boundary times', () =>
    expect(
      planMeeting({
        ...base,
        date: '2026-03-08',
        pacificStart: '02:30',
      }).issues.some((i) => i.kind === 'gap'),
    ).toBe(true));
  it('counts two actual hours, not three wall-clock hours, across the spring jump', () => {
    const result = planMeeting({
      ...base,
      date: '2026-03-08',
      pacificStart: '01:00',
      pacificEnd: '04:00',
      chinaStart: '00:00',
      chinaEnd: '23:59',
    });
    expect(result.issues).toEqual([]);
    expect(result.intervals[0]!.end - result.intervals[0]!.start).toBe(
      2 * 3_600_000,
    );
  });
  it('requires an explicit choice for repeated meeting boundaries', () =>
    expect(
      planMeeting({
        ...base,
        date: '2026-11-01',
        pacificStart: '01:30',
      }).issues.some((i) => i.kind === 'ambiguous'),
    ).toBe(true));
  it('keeps first and second boundary occurrences one hour apart', () => {
    const input = {
      ...base,
      date: '2026-11-01',
      pacificStart: '01:30',
      pacificEnd: '03:00',
      chinaStart: '00:00',
      chinaEnd: '23:59',
    };
    const first = planMeeting({ ...input, startOccurrence: 'earlier' });
    const second = planMeeting({ ...input, startOccurrence: 'later' });
    expect(first.issues).toEqual([]);
    expect(second.issues).toEqual([]);
    expect(second.intervals[0]!.start - first.intervals[0]!.start).toBe(
      3_600_000,
    );
  });
  it('changes overlap duration between automatic summer time and fixed PST', () => {
    const input = { ...base, pacificStart: '17:00', pacificEnd: '20:00' };
    const summer = planMeeting(input).intervals[0]!;
    const fixed = planMeeting({ ...input, mode: 'fixed' }).intervals[0]!;
    expect(summer.end - summer.start).toBe(2 * 3_600_000);
    expect(fixed.end - fixed.start).toBe(3 * 3_600_000);
  });
});
