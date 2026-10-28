import { describe, expect, it } from 'vitest';
import { Temporal } from '@js-temporal/polyfill';
import {
  CHINA_ZONE,
  FIXED_PST,
  PACIFIC_ZONE,
  differenceHours,
  isSupportedInstant,
  zoned,
} from '../lib/timezone';
import {
  localFields,
  parseDate,
  parseTime,
  relativeDay,
  resolveLocal,
} from '../lib/timeConversion';
import { buildTimeline, dayBounds } from '../lib/timeline';
import { clockParts, dateAt, formatDate, weekday } from '../lib/timeFormat';

const epoch = (iso: string) => Temporal.Instant.from(iso).epochMilliseconds;
const valid = (date: string, time: string, zone = PACIFIC_ZONE) => {
  const result = resolveLocal(date, time, zone);
  if (result.kind !== 'valid')
    throw new Error(`Expected valid time, got ${result.kind}`);
  return result.candidate.instant;
};

describe('specified zones and absolute instants', () => {
  it('Beijing is 16 hours ahead of winter PST', () =>
    expect(differenceHours(epoch('2026-01-15T12:00:00Z'), 'auto')).toBe(16));
  it('Beijing is 15 hours ahead of summer PDT', () =>
    expect(differenceHours(epoch('2026-07-15T12:00:00Z'), 'auto')).toBe(15));
  it.each(['01', '04', '07', '10'])(
    'fixed PST remains -08:00 during month %s',
    (month) => {
      const instant = epoch(`2026-${month}-15T12:00:00Z`);
      expect(zoned(instant, FIXED_PST).offset).toBe('-08:00');
      expect(differenceHours(instant, 'fixed')).toBe(16);
    },
  );
  it('spring transition jumps from 01:59:59 PST to 03:00 PDT on 2026.3.8', () => {
    expect(zoned(epoch('2026-03-08T09:59:59Z'), PACIFIC_ZONE).hour).toBe(1);
    const after = zoned(epoch('2026-03-08T10:00:00Z'), PACIFIC_ZONE);
    expect(after.hour).toBe(3);
    expect(after.offset).toBe('-07:00');
  });
  it('autumn transition repeats 01:00 on 2026.11.1', () => {
    expect(zoned(epoch('2026-11-01T08:59:59Z'), PACIFIC_ZONE).offset).toBe(
      '-07:00',
    );
    const after = zoned(epoch('2026-11-01T09:00:00Z'), PACIFIC_ZONE);
    expect(after.hour).toBe(1);
    expect(after.offset).toBe('-08:00');
  });
  it('rejects nonexistent spring local times without normalization', () =>
    expect(resolveLocal('2026-03-08', '02:30', PACIFIC_ZONE)).toEqual({
      kind: 'gap',
    }));
  it('returns both repeated times with their exact offsets', () => {
    expect(resolveLocal('2026-11-01', '01:30', PACIFIC_ZONE)).toEqual({
      kind: 'ambiguous',
      candidates: [
        { instant: epoch('2026-11-01T08:30:00Z'), offset: '-07:00' },
        { instant: epoch('2026-11-01T09:30:00Z'), offset: '-08:00' },
      ],
    });
  });
  it('fixed PST has neither gaps nor folds on transition dates', () => {
    expect(resolveLocal('2026-03-08', '02:30', FIXED_PST).kind).toBe('valid');
    expect(resolveLocal('2026-11-01', '01:30', FIXED_PST).kind).toBe('valid');
  });
  it('crosses day and year into Beijing correctly', () => {
    const instant = valid('2026-12-31', '18:30');
    expect(localFields(instant, CHINA_ZONE)).toEqual({
      date: '2027-01-01',
      time: '10:30',
    });
    expect(dateAt(instant, CHINA_ZONE)).toBe('2027.1.1');
    expect(relativeDay(instant, PACIFIC_ZONE, CHINA_ZONE)).toBe(1);
    expect(relativeDay(instant, CHINA_ZONE, PACIFIC_ZONE)).toBe(-1);
  });
  it('handles leap days and month boundaries', () => {
    expect(localFields(valid('2028-02-29', '20:00'), CHINA_ZONE)).toEqual({
      date: '2028-03-01',
      time: '12:00',
    });
    expect(
      localFields(valid('2028-02-29', '10:00', CHINA_ZONE), PACIFIC_ZONE),
    ).toEqual({ date: '2028-02-28', time: '18:00' });
  });
  it.each(['UTC', 'Asia/Tokyo', 'Europe/Berlin', 'Pacific/Auckland'])(
    'ignores device timezone %s',
    (deviceZone) => {
      const original = process.env.TZ;
      try {
        process.env.TZ = deviceZone;
        expect(localFields(valid('2026-07-15', '12:30'), CHINA_ZONE)).toEqual({
          date: '2026-07-16',
          time: '03:30',
        });
        expect(weekday(epoch('2026-07-15T19:30:00Z'), FIXED_PST, 'en')).toBe(
          'Wednesday',
        );
      } finally {
        if (original === undefined) delete process.env.TZ;
        else process.env.TZ = original;
      }
    },
  );
  it.each([
    '2026-01-15T20:30:00Z',
    '2026-07-15T19:30:00Z',
    '2026-11-01T08:30:00Z',
    '2026-11-01T09:30:00Z',
  ])('round trips %s without changing UTC', (iso) => {
    const instant = epoch(iso);
    const china = localFields(instant, CHINA_ZONE);
    expect(valid(china.date, china.time, CHINA_ZONE)).toBe(instant);
    const pacific = localFields(instant, PACIFIC_ZONE);
    const resolved = resolveLocal(pacific.date, pacific.time, PACIFIC_ZONE);
    if (resolved.kind === 'valid')
      expect(resolved.candidate.instant).toBe(instant);
    else if (resolved.kind === 'ambiguous')
      expect(resolved.candidates.map((c) => c.instant)).toContain(instant);
    else throw new Error('Invalid round trip');
  });
});

describe('strict input validation and supported range', () => {
  it.each([
    '2026-02-29',
    '2026-13-01',
    '2026-04-31',
    '1991-12-31',
    '2026-1-1',
    '',
    '2026-01-01junk',
    '10000-01-01',
  ])('rejects date %s', (value) => expect(parseDate(value)).toBeNull());
  it.each(['24:00', '12:60', '1:30', '-1:00', '', '12:30:45', '12:30junk'])(
    'rejects time %s',
    (value) => expect(parseTime(value)).toBeNull(),
  );
  it('supports the agreed first year and leap year', () => {
    expect(parseDate('1992-01-01')).not.toBeNull();
    expect(parseDate('2028-02-29')).not.toBeNull();
  });
  it('rejects invalid local dates and zones', () => {
    expect(resolveLocal('2026-02-30', '12:00', PACIFIC_ZONE).kind).toBe(
      'invalid',
    );
    expect(resolveLocal('2026-02-28', '12:00', 'no/such-zone').kind).toBe(
      'invalid',
    );
  });
  it('requires both displayed dates to be inside the range', () => {
    expect(isSupportedInstant(epoch('1992-01-01T07:59:59Z'))).toBe(false);
    expect(isSupportedInstant(epoch('1992-01-01T08:00:00Z'))).toBe(true);
    expect(isSupportedInstant(NaN)).toBe(false);
    expect(isSupportedInstant(1.5)).toBe(false);
  });
  it('uses unpadded display dates and correct midnight/noon 12-hour notation', () => {
    expect(formatDate('2026-03-08')).toBe('2026.3.8');
    expect(clockParts(epoch('2026-03-08T08:00:00Z'), PACIFIC_ZONE, 12)).toEqual(
      { main: '12:00', seconds: '00', period: 'AM' },
    );
    expect(clockParts(epoch('2026-03-08T19:00:00Z'), PACIFIC_ZONE, 12)).toEqual(
      { main: '12:00', seconds: '00', period: 'PM' },
    );
  });
});

describe('actual-day timeline', () => {
  it.each([
    ['2026-03-08', 23],
    ['2026-11-01', 25],
    ['2026-07-15', 24],
  ] as const)('%s contains %d actual hours', (date, hours) => {
    const timeline = buildTimeline(date, 'auto');
    expect(timeline.hours).toBe(hours);
    expect(timeline.cells).toHaveLength(hours);
    expect(new Set(timeline.cells.map((c) => c.instant)).size).toBe(hours);
  });
  it('skips spring 02:00 and labels both autumn offsets', () => {
    expect(
      buildTimeline('2026-03-08', 'auto').cells.map((c) => c.pacific.hour),
    ).not.toContain(2);
    expect(
      buildTimeline('2026-11-01', 'auto')
        .cells.filter((c) => c.pacific.hour === 1)
        .map((c) => c.pacific.offset),
    ).toEqual(['-07:00', '-08:00']);
  });
  it('fixed PST always gives a 24-hour day', () =>
    expect(buildTimeline('2026-11-01', 'fixed').hours).toBe(24));
  it('marks the Beijing date rollover at midnight', () => {
    const cell = buildTimeline('2026-07-15', 'auto').cells.find(
      (c) => c.china.hour === 0,
    )!;
    expect(cell.pacific.hour).toBe(9);
    expect(cell.china.toPlainDate().toString()).toBe('2026-07-16');
  });
  it('rejects invalid timeline dates', () =>
    expect(() => dayBounds('2026-02-30', PACIFIC_ZONE)).toThrow());
});
