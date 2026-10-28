import { Info, Radio, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Settings } from './types';
import { readSettings, STORAGE_KEY } from './lib/settings';
import { makeShareUrl, parseShareUrl } from './lib/shareUrl';
import { tx } from './lib/i18n';
import { useCurrentTime } from './hooks/useCurrentTime';
import { useTheme } from './hooks/useTheme';
import { Header } from './components/Header';
import { DualClock } from './components/DualClock';
import { TimeConverter } from './components/TimeConverter';
import { TimeTimeline } from './components/TimeTimeline';
import { MeetingPlanner } from './components/MeetingPlanner';
import { Footer } from './components/Footer';
import { CopyButton } from './components/CopyButton';

export default function App() {
  const [initial] = useState(() => {
    const share = parseShareUrl(window.location.search);
    return { share, settings: { ...readSettings(), ...share.settings } };
  });
  const [settings, setSettings] = useState<Settings>(initial.settings);
  const [manual, setManual] = useState<number | null>(
    initial.share.instant ?? null,
  );
  const [resetKey, setResetKey] = useState(0);
  const [invalidShare, setInvalidShare] = useState(initial.share.invalid);
  const now = useCurrentTime();
  const instant = manual ?? now;
  const { language } = settings;
  useTheme(settings.theme);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      /* Settings still work in memory when storage is blocked. */
    }
    document.documentElement.lang = settings.language === 'zh' ? 'zh-CN' : 'en';
    document.title = tx(
      settings.language,
      'Pacific China Time · 太平洋与北京时间',
      'Pacific China Time · Two places, one moment',
    );
  }, [settings]);
  useEffect(() => {
    const onPopState = () => {
      const shared = parseShareUrl(window.location.search);
      setSettings((previous) => ({ ...previous, ...shared.settings }));
      setManual(shared.instant ?? null);
      setInvalidShare(shared.invalid);
      setResetKey((previous) => previous + 1);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);
  function clearAddress() {
    const url = new URL(window.location.href);
    url.search = '';
    window.history.replaceState(null, '', url);
    setInvalidShare(false);
  }
  function select(instant: number, reset = false) {
    setManual(instant);
    clearAddress();
    if (reset) setResetKey((previous) => previous + 1);
  }
  function returnNow() {
    setManual(null);
    setResetKey((previous) => previous + 1);
    clearAddress();
  }
  function updateSettings(update: Partial<Settings>) {
    setSettings((previous) => ({ ...previous, ...update }));
    clearAddress();
  }
  return (
    <>
      <a className="skip-link" href="#main">
        {tx(language, '跳转到主要内容', 'Skip to content')}
      </a>
      <Header settings={settings} onChange={updateSettings} />
      <main id="main" className="page-width">
        <section className="hero" id="top">
          <div>
            <div className="hero-status">
              <span
                className={`status-dot ${manual !== null ? 'paused' : ''}`}
              />
              {manual === null
                ? tx(language, '此刻，保持同步', 'LIVE & IN SYNC')
                : tx(language, '已选定时间', 'EXPLORING A MOMENT')}
            </div>
            <h1>
              {tx(
                language,
                '同一刻，跨越太平洋。',
                'An ocean apart. A moment together.',
              )}
            </h1>
            <p>
              {tx(
                language,
                '从洛杉矶到北京，让每一次连接，都恰逢其时。',
                'From Los Angeles to Beijing. Make every connection at the right time.',
              )}
            </p>
          </div>
          <div className="hero-actions">
            <button
              className="button button-secondary"
              type="button"
              onClick={returnNow}
              disabled={manual === null}
            >
              <RotateCcw size={15} />
              {tx(language, '返回现在', 'Back to now')}
            </button>
            <CopyButton
              share
              language={language}
              label={tx(language, '分享此刻', 'Share this moment')}
              value={() =>
                makeShareUrl(window.location.href, instant, settings)
              }
            />
          </div>
        </section>
        {invalidShare && (
          <p className="notice warning" role="alert">
            <Info size={16} />
            {tx(
              language,
              '分享链接包含无效参数，已恢复当前时间及本地设置。',
              'The shared link has invalid parameters. Current time and local settings are shown.',
            )}
          </p>
        )}
        <div className="clock-toolbar">
          <span className="toolbar-label">
            <Radio size={14} />
            {manual === null
              ? tx(language, '实时世界时钟', 'Live world clocks')
              : tx(language, '手动时间预览', 'Selected time preview')}
          </span>
          <div
            className="segmented"
            role="group"
            aria-label={tx(
              language,
              '太平洋时区模式',
              'Pacific time zone mode',
            )}
          >
            <button
              type="button"
              aria-pressed={settings.pacificMode === 'auto'}
              onClick={() => updateSettings({ pacificMode: 'auto' })}
            >
              {tx(language, '自动 PT', 'Auto PT')}
              <span>{tx(language, '随夏令时', 'DST-aware')}</span>
            </button>
            <button
              type="button"
              aria-pressed={settings.pacificMode === 'fixed'}
              onClick={() => updateSettings({ pacificMode: 'fixed' })}
            >
              {tx(language, '固定 PST', 'Fixed PST')}
            </button>
          </div>
        </div>
        <DualClock instant={instant} settings={settings} />
        <TimeConverter
          key={`${settings.pacificMode}-${resetKey}`}
          instant={instant}
          settings={settings}
          onSelect={(value) => select(value)}
          onPause={() => {
            setManual(instant);
            clearAddress();
          }}
        />
        <TimeTimeline
          instant={instant}
          settings={settings}
          onSelect={(value) => select(value, true)}
        />
        <MeetingPlanner
          key={settings.pacificMode}
          instant={instant}
          settings={settings}
          onSelect={(value) => {
            select(value, true);
            document
              .querySelector('#top')
              ?.scrollIntoView({
                behavior: window.matchMedia('(prefers-reduced-motion: reduce)')
                  .matches
                  ? 'instant'
                  : 'smooth',
              });
          }}
        />
        <Footer language={language} mode={settings.pacificMode} now={now} />
      </main>
    </>
  );
}
