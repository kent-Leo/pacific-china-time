import {
  ArrowRightLeft,
  ArrowUpRight,
  CircleAlert,
  Repeat2,
} from 'lucide-react';
import { useState } from 'react';
import type { TimeProps } from '../types';
import { CHINA_ZONE, pacificZone } from '../lib/timezone';
import { localFields, relativeDay, resolveLocal } from '../lib/timeConversion';
import { conversionText, dateAt } from '../lib/timeFormat';
import { tx } from '../lib/i18n';
import { DateField } from './DateField';
import { CopyButton } from './CopyButton';

type Side = 'pacific' | 'china';
interface Draft {
  side: Side;
  date: string;
  time: string;
}
export function TimeConverter({
  instant,
  settings,
  onSelect,
  onPause,
}: TimeProps & { onSelect: (instant: number) => void; onPause: () => void }) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [source, setSource] = useState<Side>('pacific');
  const zone = pacificZone(settings.pacificMode);
  const { language } = settings;
  const resolution = draft
    ? resolveLocal(
        draft.date,
        draft.time,
        draft.side === 'pacific' ? zone : CHINA_ZONE,
      )
    : null;
  const dayDifference = relativeDay(
    instant,
    source === 'pacific' ? zone : CHINA_ZONE,
    source === 'pacific' ? CHINA_ZONE : zone,
  );
  function edit(side: Side, update: Partial<Draft>) {
    onPause();
    setSource(side);
    const next = {
      ...(draft?.side === side
        ? draft
        : {
            side,
            ...localFields(instant, side === 'pacific' ? zone : CHINA_ZONE),
          }),
      ...update,
    };
    const result = resolveLocal(
      next.date,
      next.time,
      side === 'pacific' ? zone : CHINA_ZONE,
    );
    if (result.kind === 'valid') {
      onSelect(result.candidate.instant);
      setDraft(null);
    } else setDraft(next);
  }
  return (
    <section
      className="panel converter"
      id="converter"
      aria-labelledby="converter-title"
    >
      <div className="section-heading">
        <div className="section-title">
          <span className="section-icon">
            <Repeat2 size={18} />
          </span>
          <div>
            <h2 id="converter-title">
              {tx(language, '时间转换', 'Time converter')}
            </h2>
            <p>
              {tx(
                language,
                '修改任意一侧，两地时间即刻同步',
                'Change either side. Stay in sync.',
              )}
            </p>
          </div>
        </div>
        <CopyButton
          language={language}
          disabled={draft !== null}
          value={() =>
            conversionText(
              instant,
              settings.pacificMode,
              settings.hourCycle,
              language,
            )
          }
        />
      </div>
      <div className="converter-grid">
        {(['pacific', 'china'] as const).map((side, index) => {
          const fields =
            draft?.side === side
              ? draft
              : localFields(instant, side === 'pacific' ? zone : CHINA_ZONE);
          const name =
            side === 'china'
              ? tx(language, '北京时间', 'Beijing time')
              : settings.pacificMode === 'fixed'
                ? tx(language, '固定 PST', 'Fixed PST')
                : tx(language, '太平洋时间', 'Pacific time');
          return (
            <div key={side} className={`converter-side ${side}`}>
              {index === 1 && (
                <span className="convert-arrow" aria-hidden="true">
                  <ArrowRightLeft size={17} />
                </span>
              )}
              <div className="converter-side-title">
                <span className="location-dot" />
                <h3>{name}</h3>
                <span className="small-label">
                  {side === 'china' ? 'BEIJING' : 'LOS ANGELES'}
                </span>
              </div>
              <div className="converter-fields">
                <DateField
                  label={`${name} · ${tx(language, '日期', 'Date')}`}
                  value={fields.date}
                  onChange={(date) => edit(side, { date })}
                />
                <label className="field">
                  <span className="field-label">
                    {tx(language, '当地时间 · 24h', 'Local time · 24h')}
                  </span>
                  <input
                    type="time"
                    step="60"
                    aria-label={`${name} · ${tx(language, '时间', 'Time')}`}
                    value={fields.time}
                    onChange={(event) =>
                      edit(side, { time: event.target.value })
                    }
                  />
                </label>
              </div>
            </div>
          );
        })}
      </div>
      {resolution && resolution.kind !== 'valid' ? (
        <div className="notice warning" role="alert">
          <CircleAlert size={17} />
          <div>
            {resolution.kind === 'gap'
              ? tx(
                  language,
                  '这个当地时间因夏令时跳变而不存在。请选择有效时间；时钟保留上一个有效结果。',
                  'This local time does not exist because of daylight saving time. Choose a valid time; clocks still show the last valid result.',
                )
              : resolution.kind === 'invalid'
                ? tx(
                    language,
                    '请输入 1992 年及以后的有效日期和时间（YYYY.M.D、00:00–23:59）；两地日期均须在支持范围内。',
                    'Enter a valid date from 1992 onward (YYYY.M.D) and time (00:00–23:59). Both local dates must be supported.',
                  )
                : tx(
                    language,
                    '这个时间出现两次。请选择对应的 UTC 偏移：',
                    'This time occurs twice. Choose its UTC offset:',
                  )}
            {resolution.kind === 'ambiguous' && (
              <div className="ambiguity-options">
                {resolution.candidates.map((candidate, index) => (
                  <button
                    type="button"
                    className="button button-secondary"
                    key={candidate.instant}
                    onClick={() => {
                      onSelect(candidate.instant);
                      setDraft(null);
                    }}
                  >
                    {index === 0
                      ? tx(language, '第一次', 'First occurrence')
                      : tx(language, '第二次', 'Second occurrence')}{' '}
                    · UTC{candidate.offset}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="converter-summary">
          <ArrowUpRight size={15} />
          <span>
            {source === 'pacific'
              ? tx(language, '北京', 'Beijing')
              : tx(language, '太平洋地区', 'Pacific')}
            <strong>
              {dayDifference === 0
                ? tx(language, '当天', 'Same day')
                : dayDifference > 0
                  ? tx(language, '后一天', 'Next day')
                  : tx(language, '前一天', 'Previous day')}
            </strong>
            · {dateAt(instant, source === 'pacific' ? CHINA_ZONE : zone)}
          </span>
          <span className="summary-hint">
            {tx(language, '支持双向转换', 'Works both ways')}
          </span>
        </div>
      )}
    </section>
  );
}
