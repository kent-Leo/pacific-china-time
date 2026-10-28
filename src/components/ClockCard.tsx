import { Moon, Sun } from 'lucide-react';
import type { TimeProps } from '../types';
import { clockParts, dateAt, weekday } from '../lib/timeFormat';
import { isDaytime, zoned, zoneLabel } from '../lib/timezone';
import { tx } from '../lib/i18n';

export function ClockCard({
  instant,
  settings,
  zone,
  china = false,
}: TimeProps & { zone: string; china?: boolean }) {
  const value = zoned(instant, zone);
  const day = isDaytime(value.hour);
  const parts = clockParts(instant, zone, settings.hourCycle);
  const Icon = day ? Sun : Moon;
  const city = china
    ? tx(settings.language, '北京', 'Beijing')
    : tx(settings.language, '洛杉矶', 'Los Angeles');
  return (
    <article
      className={`clock-card ${china ? 'china-card' : 'pacific-card'}`}
      aria-label={city}
    >
      <div className="clock-top">
        <div>
          <span className="eyebrow">
            {china
              ? 'CHINA STANDARD TIME'
              : settings.pacificMode === 'fixed'
                ? 'FIXED PACIFIC STANDARD TIME'
                : 'PACIFIC TIME'}
          </span>
          <h2>
            {city}
            <span className="city-code">{china ? 'CN' : 'US'}</span>
          </h2>
        </div>
        <div className={`day-indicator ${day ? 'is-day' : 'is-night'}`}>
          <Icon size={17} />
          <span>
            {day
              ? tx(settings.language, '白天', 'Daytime')
              : tx(settings.language, '夜晚', 'Nighttime')}
          </span>
        </div>
      </div>
      <div
        className="clock-display"
        aria-label={`${parts.main}:${parts.seconds} ${parts.period}`}
      >
        <span className="clock-main">{parts.main}</span>
        <span className="clock-seconds">:{parts.seconds}</span>
        <span className="clock-period">{parts.period}</span>
      </div>
      <p className="clock-date">
        {dateAt(instant, zone)}
        <span>·</span>
        {weekday(instant, zone, settings.language)}
      </p>
      <div className="clock-bottom">
        <span className="zone-pill">
          {zoneLabel(instant, zone)}
          <span>UTC{value.offset.replace('-', '−')}</span>
        </span>
        <span className="zone-description">
          {china
            ? 'Asia / Shanghai'
            : settings.pacificMode === 'fixed'
              ? tx(
                  settings.language,
                  '固定偏移 · 无夏令时',
                  'Fixed offset · No DST',
                )
              : 'America / Los Angeles'}
        </span>
      </div>
    </article>
  );
}
