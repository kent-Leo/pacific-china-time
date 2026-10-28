import { Temporal } from '@js-temporal/polyfill';
import type { Settings } from '../types';
import { isSupportedInstant } from './timezone';
import { validateSettings } from './settings';

const ALLOWED_KEYS = ['at', 'mode', 'lang', 'clock', 'theme'];
export interface SharedState {
  instant?: number;
  settings: Partial<Settings>;
  invalid: boolean;
}
export function parseShareUrl(search: string): SharedState {
  const params = new URLSearchParams(search);
  if (search.length > 2048) return { settings: {}, invalid: true };
  let invalid = false;
  for (const key of params.keys())
    if (!ALLOWED_KEYS.includes(key) || params.getAll(key).length > 1)
      invalid = true;
  const raw = {
    pacificMode: params.get('mode'),
    language: params.get('lang'),
    hourCycle: Number(params.get('clock')),
    theme: params.get('theme'),
  };
  const settings = validateSettings(raw);
  if (params.has('clock') && !['12', '24'].includes(params.get('clock')!))
    invalid = true;
  for (const [param, key] of [
    ['mode', 'pacificMode'],
    ['lang', 'language'],
    ['clock', 'hourCycle'],
    ['theme', 'theme'],
  ] as const) {
    if (params.has(param) && settings[key] === undefined) invalid = true;
  }
  let instant: number | undefined;
  const at = params.get('at');
  if (at !== null) {
    try {
      // Require a UTC suffix. Never accept a local date/time or an offsetless ISO string.
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:[0-5]\d(?:\.\d{1,3})?Z$/.test(at))
        throw new RangeError();
      instant = Temporal.Instant.from(at).epochMilliseconds;
      if (!isSupportedInstant(instant)) throw new RangeError();
    } catch {
      invalid = true;
    }
  }
  // Reject malformed links atomically, rather than reproducing a partially different time.
  return invalid
    ? { settings: {}, invalid: true }
    : { instant, settings, invalid: false };
}
export function makeShareUrl(
  base: string,
  instant: number,
  settings: Settings,
): string {
  if (!isSupportedInstant(instant)) throw new RangeError('Unsupported instant');
  const url = new URL(base);
  if (!['http:', 'https:'].includes(url.protocol))
    throw new TypeError('Invalid URL protocol');
  url.search = '';
  url.hash = '';
  url.searchParams.set(
    'at',
    Temporal.Instant.fromEpochMilliseconds(instant).toString(),
  );
  url.searchParams.set('mode', settings.pacificMode);
  url.searchParams.set('lang', settings.language);
  url.searchParams.set('clock', String(settings.hourCycle));
  url.searchParams.set('theme', settings.theme);
  return url.toString();
}
