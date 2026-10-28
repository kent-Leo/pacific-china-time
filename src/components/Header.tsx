import { ArrowUpRight } from 'lucide-react';
import type { Settings } from '../types';
import { tx } from '../lib/i18n';
import { ThemeToggle } from './ThemeToggle';

export function Header({
  settings,
  onChange,
}: {
  settings: Settings;
  onChange: (update: Partial<Settings>) => void;
}) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <a className="brand" href="#top" aria-label="Pacific China Time">
          <span className="brand-mark" aria-hidden="true">
            <i />
            <i />
          </span>
          <span>
            Pacific<span className="brand-light"> China Time</span>
          </span>
        </a>
        <nav
          className="header-controls"
          aria-label={tx(settings.language, '显示设置', 'Display settings')}
        >
          <ThemeToggle
            value={settings.theme}
            language={settings.language}
            onChange={(theme) => onChange({ theme })}
          />
          <span className="control-divider" />
          <button
            className="header-button numeric"
            type="button"
            aria-label={tx(
              settings.language,
              '切换 12/24 小时制',
              'Toggle 12/24-hour clock',
            )}
            onClick={() =>
              onChange({ hourCycle: settings.hourCycle === 24 ? 12 : 24 })
            }
          >
            {settings.hourCycle}h
          </button>
          <button
            className="header-button language-button"
            type="button"
            aria-label={tx(
              settings.language,
              '切换为英文',
              'Switch to Chinese',
            )}
            onClick={() =>
              onChange({ language: settings.language === 'zh' ? 'en' : 'zh' })
            }
          >
            中<span>/</span>EN
          </button>
        </nav>
      </div>
      <div className="subnav page-width">
        <span className="eyebrow">TWO PLACES. ONE MOMENT.</span>
        <a href="#meeting">
          {tx(
            settings.language,
            '找到合适的会面时间',
            'Find a time to connect',
          )}
          <ArrowUpRight size={13} />
        </a>
      </div>
    </header>
  );
}
