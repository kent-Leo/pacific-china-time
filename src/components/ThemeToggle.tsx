import { Monitor, Moon, Sun } from 'lucide-react';
import type { Language, ThemePreference } from '../types';
import { tx } from '../lib/i18n';

export function ThemeToggle({
  value,
  language,
  onChange,
}: {
  value: ThemePreference;
  language: Language;
  onChange: (value: ThemePreference) => void;
}) {
  const Icon = value === 'system' ? Monitor : value === 'dark' ? Moon : Sun;
  return (
    <label className="theme-control">
      <Icon size={16} aria-hidden="true" />
      <select
        aria-label={tx(language, '外观主题', 'Appearance')}
        value={value}
        onChange={(event) => onChange(event.target.value as ThemePreference)}
      >
        <option value="system">{tx(language, '跟随系统', 'System')}</option>
        <option value="light">{tx(language, '浅色', 'Light')}</option>
        <option value="dark">{tx(language, '深色', 'Dark')}</option>
      </select>
    </label>
  );
}
