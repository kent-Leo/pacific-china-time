export type Language = 'zh' | 'en';
export type PacificMode = 'auto' | 'fixed';
export type ThemePreference = 'system' | 'light' | 'dark';
export type HourCycle = 12 | 24;
export interface Settings {
  language: Language;
  pacificMode: PacificMode;
  theme: ThemePreference;
  hourCycle: HourCycle;
}
export interface TimeProps {
  instant: number;
  settings: Settings;
}
