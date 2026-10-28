import type { Settings } from '../types';

export const STORAGE_KEY = 'pacific-china-time.settings.v1';
export const DEFAULT_SETTINGS: Settings = {
  language: 'zh',
  theme: 'system',
  hourCycle: 24,
  pacificMode: 'auto',
};
export function validateSettings(value: unknown): Partial<Settings> {
  if (!value || typeof value !== 'object') return {};
  const record = value as Record<string, unknown>;
  const result: Partial<Settings> = {};
  if (record.language === 'zh' || record.language === 'en')
    result.language = record.language;
  if (
    record.theme === 'system' ||
    record.theme === 'light' ||
    record.theme === 'dark'
  )
    result.theme = record.theme;
  if (record.hourCycle === 12 || record.hourCycle === 24)
    result.hourCycle = record.hourCycle;
  if (record.pacificMode === 'auto' || record.pacificMode === 'fixed')
    result.pacificMode = record.pacificMode;
  return result;
}
export function readSettings(): Settings {
  try {
    return {
      ...DEFAULT_SETTINGS,
      ...validateSettings(
        JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null'),
      ),
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}
