import { ArrowUpRight, Code2, Globe2 } from 'lucide-react';
import type { Language, PacificMode } from '../types';
import { GITHUB_URL } from '../lib/config';
import { tx } from '../lib/i18n';
import { zoned, CHINA_ZONE } from '../lib/timezone';

export function Footer({
  language,
  mode,
  now,
}: {
  language: Language;
  mode: PacificMode;
  now: number;
}) {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <span className="footer-brand">
          <Globe2 size={17} />
          Pacific China Time
        </span>
        {GITHUB_URL && (
          <a href={GITHUB_URL} target="_blank" rel="noreferrer">
            <Code2 size={15} />
            GitHub
            <ArrowUpRight size={13} />
          </a>
        )}
      </div>
      <p>
        {mode === 'fixed'
          ? tx(
              language,
              '固定 PST：UTC−08:00，不切换夏令时。',
              'Fixed PST: UTC−08:00, with no daylight saving changes.',
            )
          : tx(
              language,
              '自动 PT：America/Los_Angeles，按日期使用 PST / PDT。',
              'Automatic PT: America/Los_Angeles, using PST / PDT for the selected date.',
            )}{' '}
        {tx(
          language,
          '北京：Asia/Shanghai，UTC+08:00。支持 1992 年起的日期。',
          'Beijing: Asia/Shanghai, UTC+08:00. Dates from 1992 onward are supported.',
        )}
      </p>
      <div className="footer-bottom">
        <span>© {zoned(now, CHINA_ZONE).year} Pacific China Time</span>
        <span>
          {tx(
            language,
            '时间来自设备时钟 · 时区规则随浏览器更新',
            'Time from your device · Time zone rules provided by your browser',
          )}
        </span>
      </div>
    </footer>
  );
}
