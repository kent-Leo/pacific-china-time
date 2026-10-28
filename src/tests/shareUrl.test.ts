import { describe, expect, it } from 'vitest';
import { makeShareUrl, parseShareUrl } from '../lib/shareUrl';
import { DEFAULT_SETTINGS, validateSettings } from '../lib/settings';

describe('share URL validation', () => {
  it('round trips the UTC instant and all display settings', () => {
    const instant = Date.parse('2026-11-01T09:30:15.123Z');
    const settings = {
      language: 'en',
      pacificMode: 'fixed',
      hourCycle: 12,
      theme: 'dark',
    } as const;
    const url = makeShareUrl(
      'https://example.com/?old=bad#old',
      instant,
      settings,
    );
    expect(parseShareUrl(new URL(url).search)).toEqual({
      instant,
      settings,
      invalid: false,
    });
    expect(new URL(url).hash).toBe('');
    expect(new URL(url).searchParams.has('old')).toBe(false);
  });
  it('accepts an empty URL as live mode', () =>
    expect(parseShareUrl('')).toEqual({
      instant: undefined,
      settings: {},
      invalid: false,
    }));
  it.each([
    '?at=2026-01-01T12:30:00',
    '?at=2026-02-30T12:30:00Z',
    '?at=1990-01-01T12:30:00Z',
    '?at=2026-01-01T12:30:60Z',
    '?at=garbage',
    '?at=',
    '?at=2026-01-01T12:30:00Z&at=2026-01-01T12:30:00Z',
    '?mode=wrong',
    '?clock=13',
    '?clock=2.4e1',
    '?clock=024',
    '?lang=xx',
    '?theme=bad',
    '?at=2026-01-01T12:30:00Z&mode=wrong',
    '?unknown=true',
  ])('rejects malformed URL atomically: %s', (search) =>
    expect(parseShareUrl(search)).toEqual({ settings: {}, invalid: true }),
  );
  it('rejects excessive query size and non-HTTP share bases', () => {
    expect(parseShareUrl('?at=' + 'a'.repeat(3000)).invalid).toBe(true);
    expect(() =>
      makeShareUrl('javascript:alert(1)', Date.now(), DEFAULT_SETTINGS),
    ).toThrow();
  });
  it('does not trust corrupt local preferences', () => {
    expect(
      validateSettings({
        language: 'zh',
        theme: 'bad',
        pacificMode: 'evil',
        hourCycle: 25,
      }),
    ).toEqual({ language: 'zh' });
    expect(validateSettings(null)).toEqual({});
    expect(validateSettings('bad')).toEqual({});
  });
});
