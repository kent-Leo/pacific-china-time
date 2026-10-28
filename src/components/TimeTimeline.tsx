import { Clock3, Moon, MousePointer2, Sun } from 'lucide-react';
import { useMemo } from 'react';
import type { TimeProps } from '../types';
import {
  CHINA_ZONE,
  isDaytime,
  isSupportedInstant,
  pacificZone,
} from '../lib/timezone';
import { localFields } from '../lib/timeConversion';
import { buildTimeline } from '../lib/timeline';
import { dateAt, formatDate, formatTime } from '../lib/timeFormat';
import { tx } from '../lib/i18n';

export function TimeTimeline({
  instant,
  settings,
  onSelect,
}: TimeProps & { onSelect: (instant: number) => void }) {
  const { language, pacificMode } = settings;
  const zone = pacificZone(pacificMode);
  const date = String(localFields(instant, zone).date);
  const timeline = useMemo(
    () => buildTimeline(date, pacificMode),
    [date, pacificMode],
  );
  const minutes = Math.floor((instant - timeline.start) / 60_000);
  const firstChinaDate = timeline.cells[0]!.china.toPlainDate().toString();
  return (
    <section
      className="panel timeline-section"
      aria-labelledby="timeline-title"
    >
      <div className="section-heading">
        <div className="section-title">
          <span className="section-icon">
            <Clock3 size={18} />
          </span>
          <div>
            <h2 id="timeline-title">
              {tx(language, '一天的交汇', 'A day, connected')}
            </h2>
            <p>
              {formatDate(date)} ·{' '}
              {tx(language, '太平洋当地日', 'Pacific calendar day')} ·{' '}
              {timeline.hours} {tx(language, '个实际小时', 'actual hours')}
            </p>
          </div>
        </div>
        <div className="timeline-legend">
          <span>
            <Sun size={13} />
            {tx(language, '白天', 'Day')}
          </span>
          <span>
            <Moon size={13} />
            {tx(language, '夜晚', 'Night')}
          </span>
        </div>
      </div>
      {timeline.hours !== 24 && (
        <p className="notice dst-notice">
          {timeline.hours === 23
            ? tx(
                language,
                '夏令时开始：跳过 02:00–02:59，今天只有 23 小时。',
                'DST starts: 02:00–02:59 is skipped. This day has 23 hours.',
              )
            : tx(
                language,
                '夏令时结束：01:00 出现两次，已标注各自偏移，今天有 25 小时。',
                'DST ends: 01:00 occurs twice, each offset is labeled. This day has 25 hours.',
              )}
        </p>
      )}
      <div
        className="timeline-scroll"
        tabIndex={0}
        aria-label={tx(
          language,
          '时间轴，可横向滚动',
          'Timeline, scroll horizontally',
        )}
      >
        <div className="timeline-content">
          <div className="timeline-row-label">
            <span>
              <span className="location-dot" />
              {pacificMode === 'fixed' ? 'PST' : 'PT'}
              <small>{formatDate(date)}</small>
            </span>
            <span>{formatTime(instant, zone, settings.hourCycle)}</span>
          </div>
          <div className="timeline-tracks">
            {[false, true].map((china) => (
              <div
                key={String(china)}
                className="timeline-row"
                style={{
                  gridTemplateColumns: `repeat(${timeline.cells.length}, minmax(0, 1fr))`,
                }}
              >
                {timeline.cells.map((cell, index) => {
                  const value = china ? cell.china : cell.pacific;
                  const boundary = index > 0 && value.hour === 0;
                  const repeated =
                    !china && timeline.hours === 25 && value.hour === 1;
                  return (
                    <div
                      key={cell.instant}
                      className={`timeline-cell ${isDaytime(value.hour) ? 'day' : 'night'} ${boundary ? 'date-boundary' : ''}`}
                      title={`${formatDate(value.toPlainDate().toString())} ${String(value.hour).padStart(2, '0')}:00 UTC${value.offset}`}
                    >
                      {boundary && (
                        <span className="boundary-label">
                          {formatDate(value.toPlainDate().toString())}
                        </span>
                      )}
                      <span>{String(value.hour).padStart(2, '0')}</span>
                      {repeated ? (
                        <small>{value.offset}</small>
                      ) : (
                        <i aria-hidden="true" />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
            <input
              className="timeline-range"
              type="range"
              aria-label={tx(
                language,
                '选择时间轴上的时刻',
                'Select a time on the timeline',
              )}
              aria-valuetext={`${dateAt(instant, zone)} ${formatTime(instant, zone, settings.hourCycle)} / ${dateAt(instant, CHINA_ZONE)} ${formatTime(instant, CHINA_ZONE, settings.hourCycle)}`}
              min={0}
              max={timeline.hours * 60 - 1}
              step={1}
              value={minutes}
              onChange={(event) => {
                const selected =
                  timeline.start + Number(event.target.value) * 60_000;
                if (isSupportedInstant(selected)) onSelect(selected);
              }}
            />
          </div>
          <div className="timeline-row-label bottom">
            <span>
              <span className="location-dot china-dot" />
              CST
              <small>
                {formatDate(firstChinaDate)}
                {firstChinaDate !==
                timeline.cells.at(-1)!.china.toPlainDate().toString()
                  ? ` → ${formatDate(timeline.cells.at(-1)!.china.toPlainDate().toString())}`
                  : ''}
              </small>
            </span>
            <span>{formatTime(instant, CHINA_ZONE, settings.hourCycle)}</span>
          </div>
        </div>
      </div>
      <div className="timeline-caption">
        <span>
          <MousePointer2 size={13} />
          {tx(
            language,
            '点击或拖动竖线选择时间 · 键盘方向键精调',
            'Click or drag to explore · Arrow keys adjust by a minute',
          )}
        </span>
        <span>{tx(language, '白天 06:00–18:00', 'Daytime 06:00–18:00')}</span>
      </div>
    </section>
  );
}
