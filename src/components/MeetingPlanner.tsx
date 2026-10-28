import { ArrowUpRight, CalendarDays, Check, Info, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { TimeProps } from '../types';
import { CHINA_ZONE, pacificZone } from '../lib/timezone';
import { localFields } from '../lib/timeConversion';
import { planMeeting } from '../lib/meeting';
import type { Occurrence } from '../lib/meeting';
import { conversionText, formatDate, formatZoned } from '../lib/timeFormat';
import { tx } from '../lib/i18n';
import { DateField } from './DateField';
import { CopyButton } from './CopyButton';

export function MeetingPlanner({
  instant,
  settings,
  onSelect,
}: TimeProps & { onSelect: (instant: number) => void }) {
  const { language, pacificMode, hourCycle } = settings;
  const zone = pacificZone(pacificMode);
  const currentDate = String(localFields(instant, zone).date);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const date = selectedDate ?? currentDate;
  const [pacificStart, setPacificStart] = useState('09:00');
  const [pacificEnd, setPacificEnd] = useState('18:00');
  const [chinaStart, setChinaStart] = useState('09:00');
  const [chinaEnd, setChinaEnd] = useState('18:00');
  const [startOccurrence, setStartOccurrence] = useState<
    Occurrence | undefined
  >();
  const [endOccurrence, setEndOccurrence] = useState<Occurrence | undefined>();
  const input = useMemo(
    () => ({
      date,
      mode: pacificMode,
      pacificStart,
      pacificEnd,
      chinaStart,
      chinaEnd,
      startOccurrence,
      endOccurrence,
    }),
    [
      date,
      pacificMode,
      pacificStart,
      pacificEnd,
      chinaStart,
      chinaEnd,
      startOccurrence,
      endOccurrence,
    ],
  );
  const result = useMemo(() => planMeeting(input), [input]);
  const totalMinutes = result.intervals.reduce(
    (sum, interval) => sum + (interval.end - interval.start) / 60_000,
    0,
  );
  const meetingText = result.intervals
    .map(
      (interval) =>
        `${tx(language, '开始', 'Start')}\n${conversionText(interval.start, pacificMode, hourCycle, language)}\n${tx(language, '结束（不含）', 'End (exclusive)')}\n${conversionText(interval.end, pacificMode, hourCycle, language)}`,
    )
    .join('\n\n');
  function resetOccurrence() {
    setStartOccurrence(undefined);
    setEndOccurrence(undefined);
  }
  const controls = [
    {
      title: tx(language, '太平洋工作时间', 'Pacific work hours'),
      start: pacificStart,
      end: pacificEnd,
      setStart: setPacificStart,
      setEnd: setPacificEnd,
    },
    {
      title: tx(language, '中国工作时间', 'China work hours'),
      start: chinaStart,
      end: chinaEnd,
      setStart: setChinaStart,
      setEnd: setChinaEnd,
    },
  ];
  return (
    <section
      className="panel meeting-section"
      id="meeting"
      aria-labelledby="meeting-title"
    >
      <div className="section-heading">
        <div className="section-title">
          <span className="section-icon">
            <Users size={18} />
          </span>
          <div>
            <h2 id="meeting-title">
              {tx(language, '找个时间，聊一聊', 'Find time to connect')}
            </h2>
            <p>
              {tx(
                language,
                '让跨越太平洋的协作，简单一点',
                'Make working across the Pacific a little easier.',
              )}
            </p>
          </div>
        </div>
        <span className="soft-tag">
          {tx(language, '会议规划', 'Meeting planner')}
        </span>
      </div>
      <div className="meeting-layout">
        <div className="meeting-controls">
          <DateField
            label={tx(
              language,
              '会议日期 · 以太平洋当地日为准',
              'Meeting date · Pacific calendar day',
            )}
            value={date}
            onChange={(next) => {
              setSelectedDate(next);
              resetOccurrence();
            }}
          />
          {controls.map((control, index) => (
            <fieldset className="work-hours" key={control.title}>
              <legend>
                <span
                  className={`location-dot ${index === 1 ? 'china-dot' : ''}`}
                />
                {control.title}
              </legend>
              <div className="work-hours-inputs">
                <label className="field">
                  <span className="field-label">
                    {tx(language, '开始 · 24h', 'Start · 24h')}
                  </span>
                  <input
                    type="time"
                    aria-label={`${control.title} · ${tx(language, '开始', 'Start')}`}
                    step="60"
                    value={control.start}
                    onChange={(event) => {
                      control.setStart(event.target.value);
                      resetOccurrence();
                    }}
                  />
                </label>
                <span className="time-dash">—</span>
                <label className="field">
                  <span className="field-label">
                    {tx(language, '结束 · 24h', 'End · 24h')}
                  </span>
                  <input
                    type="time"
                    aria-label={`${control.title} · ${tx(language, '结束', 'End')}`}
                    step="60"
                    value={control.end}
                    onChange={(event) => {
                      control.setEnd(event.target.value);
                      resetOccurrence();
                    }}
                  />
                </label>
              </div>
            </fieldset>
          ))}
          <p className="field-help">
            <Info size={13} />
            {tx(
              language,
              '结束早于开始表示跨午夜；按每日工作时段计算，未排除节假日。',
              'An earlier end means overnight. Daily schedules include weekends and holidays.',
            )}
          </p>
        </div>
        <div
          className={`meeting-result ${result.intervals.length ? 'has-overlap' : ''}`}
        >
          {result.issues.length > 0 ? (
            <div role="alert" className="meeting-message">
              <Info size={25} />
              <h3>{tx(language, '请检查工作时间', 'Check your work hours')}</h3>
              {result.issues.some((issue) => issue.kind === 'invalid') && (
                <p>
                  {tx(
                    language,
                    '请输入有效日期和时间；开始与结束不能相同。两地日期均需在 1992 年及以后。',
                    'Enter a valid date and distinct start/end times. Both local dates must be from 1992 onward.',
                  )}
                </p>
              )}
              {result.issues
                .filter(
                  (issue, index, all) =>
                    all.findIndex(
                      (other) =>
                        other.kind === issue.kind &&
                        other.boundary === issue.boundary,
                    ) === index,
                )
                .map((issue, index) =>
                  issue.kind === 'invalid' ? null : (
                    <div key={index} className="meeting-issue">
                      <p>
                        {issue.date ? formatDate(issue.date) : ''} {issue.time}{' '}
                        ·{' '}
                        {issue.kind === 'gap'
                          ? tx(
                              language,
                              '当地时间不存在，请调整边界。',
                              'This local time does not exist. Adjust the boundary.',
                            )
                          : tx(
                              language,
                              '当地时间重复，请选择偏移。',
                              'This local time repeats. Choose an offset.',
                            )}
                      </p>
                      {issue.kind === 'ambiguous' && (
                        <select
                          aria-label={`${issue.boundary} ${tx(language, '重复时刻', 'Repeated time')}`}
                          value=""
                          onChange={(event) =>
                            (issue.boundary === 'start'
                              ? setStartOccurrence
                              : setEndOccurrence)(
                              event.target.value as Occurrence,
                            )
                          }
                        >
                          <option value="" disabled>
                            {tx(language, '选择一次', 'Choose occurrence')}
                          </option>
                          <option value="earlier">
                            {tx(language, '第一次', 'First')} · UTC−07:00
                          </option>
                          <option value="later">
                            {tx(language, '第二次', 'Second')} · UTC−08:00
                          </option>
                        </select>
                      )}
                    </div>
                  ),
                )}
            </div>
          ) : result.intervals.length === 0 ? (
            <div className="meeting-message">
              <div className="empty-orbit">
                <CalendarDays size={28} />
              </div>
              <span className="eyebrow">
                {tx(language, '共同工作时间', 'SHARED WORK HOURS')}
              </span>
              <h3>{tx(language, '暂时没有交集', 'No shared work hours')}</h3>
              <p>
                {tx(
                  language,
                  '这一天的工作时段没有重叠。试着调整一地的开始或结束时间，让彼此都从容一些。',
                  'Your work hours do not overlap on this day. Try adjusting either schedule to find a time that works for both.',
                )}
              </p>
              <span className="empty-dates">
                {formatDate(date)} ·{' '}
                {pacificMode === 'fixed' ? 'Fixed PST' : 'PT'}
              </span>
            </div>
          ) : (
            <div className="overlap-results">
              <span className="overlap-badge">
                <Check size={14} />
                {totalMinutes}{' '}
                {tx(language, '分钟共同工作时间', 'minutes in common')}
              </span>
              {result.intervals.map((interval, index) => (
                <article className="meeting-slot" key={interval.start}>
                  <h3>
                    {tx(language, '可用时段', 'Available window')} {index + 1}
                  </h3>
                  <p>
                    <strong>{tx(language, '太平洋', 'Pacific')}</strong>
                    <span>
                      {formatZoned(interval.start, zone, hourCycle)}
                      <br />→ {formatZoned(interval.end, zone, hourCycle)}
                    </span>
                  </p>
                  <p>
                    <strong>{tx(language, '北京', 'Beijing')}</strong>
                    <span>
                      {formatZoned(interval.start, CHINA_ZONE, hourCycle)}
                      <br />→ {formatZoned(interval.end, CHINA_ZONE, hourCycle)}
                    </span>
                  </p>
                  <button
                    className="text-button"
                    type="button"
                    onClick={() => onSelect(interval.start)}
                  >
                    {tx(language, '在时钟中查看', 'View on clocks')}
                    <ArrowUpRight size={14} />
                  </button>
                </article>
              ))}
              <CopyButton
                language={language}
                label={tx(language, '复制会议时段', 'Copy meeting windows')}
                value={meetingText}
              />
            </div>
          )}
        </div>
      </div>
      <p className="meeting-footnote">
        <Info size={13} />
        {tx(
          language,
          '日期覆盖一个完整太平洋当地日；北京时间会自动使用对应日期（可能是后一天）。结果为可用区间，不代表已预约。',
          'The selected date covers one Pacific day. Beijing uses its corresponding date, which may be the next day. These are available windows, not booked meetings.',
        )}
      </p>
    </section>
  );
}
