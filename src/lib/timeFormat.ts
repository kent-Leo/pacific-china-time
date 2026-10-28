import type { HourCycle, Language, PacificMode } from '../types';
import {
  CHINA_ZONE,
  FIXED_PST,
  pacificZone,
  zoned,
  zoneLabel,
} from './timezone';

export function formatDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  return `${year}.${month}.${day}`;
}
export const dateAt = (instant: number, zone: string) =>
  formatDate(zoned(instant, zone).toPlainDate().toString());
export function weekday(
  instant: number,
  zone: string,
  language: Language,
): string {
  // Etc/GMT+8 is a fixed UTC-08:00 alias, supported by older Intl implementations.
  return new Intl.DateTimeFormat(language === 'zh' ? 'zh-CN' : 'en-US', {
    timeZone: zone === FIXED_PST ? 'Etc/GMT+8' : zone,
    weekday: 'long',
  }).format(instant);
}
export function clockParts(instant: number, zone: string, cycle: HourCycle) {
  const value = zoned(instant, zone);
  return {
    main: `${String(cycle === 12 ? value.hour % 12 || 12 : value.hour).padStart(2, '0')}:${String(value.minute).padStart(2, '0')}`,
    seconds: String(value.second).padStart(2, '0'),
    period: cycle === 12 ? (value.hour >= 12 ? 'PM' : 'AM') : '',
  };
}
export function formatTime(
  instant: number,
  zone: string,
  cycle: HourCycle = 24,
  seconds = false,
): string {
  const parts = clockParts(instant, zone, cycle);
  return `${parts.main}${seconds ? `:${parts.seconds}` : ''}${parts.period ? ` ${parts.period}` : ''}`;
}
export function formatZoned(
  instant: number,
  zone: string,
  cycle: HourCycle = 24,
): string {
  return `${dateAt(instant, zone)} ${formatTime(instant, zone, cycle)} ${zoneLabel(instant, zone)} (UTC${zoned(instant, zone).offset})`;
}
export function conversionText(
  instant: number,
  mode: PacificMode,
  cycle: HourCycle,
  language: Language,
): string {
  const pacific =
    language === 'zh'
      ? mode === 'fixed'
        ? '固定 PST'
        : '洛杉矶'
      : mode === 'fixed'
        ? 'Fixed PST'
        : 'Los Angeles';
  return `${pacific}: ${formatZoned(instant, pacificZone(mode), cycle)}\n${language === 'zh' ? '北京' : 'Beijing'}: ${formatZoned(instant, CHINA_ZONE, cycle)}`;
}
