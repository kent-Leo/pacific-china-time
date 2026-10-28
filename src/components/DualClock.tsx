import { ArrowRightLeft } from 'lucide-react';
import type { TimeProps } from '../types';
import { CHINA_ZONE, differenceHours, pacificZone } from '../lib/timezone';
import { tx } from '../lib/i18n';
import { ClockCard } from './ClockCard';

export function DualClock(props: TimeProps) {
  const difference = differenceHours(props.instant, props.settings.pacificMode);
  return (
    <section
      className="dual-clock"
      aria-label={tx(
        props.settings.language,
        '同步双时钟',
        'Synchronized clocks',
      )}
    >
      <div className="clock-grid">
        <ClockCard {...props} zone={pacificZone(props.settings.pacificMode)} />
        <ClockCard {...props} zone={CHINA_ZONE} china />
        <span className="clock-bridge" aria-hidden="true">
          <ArrowRightLeft size={18} />
        </span>
      </div>
      <div className="time-difference">
        <span className="difference-line" />
        <span>
          {tx(props.settings.language, '北京比太平洋时间快', 'Beijing is')}{' '}
          <strong>
            {difference} {tx(props.settings.language, '小时', 'hours ahead')}
          </strong>
        </span>
        <span className="difference-line" />
      </div>
    </section>
  );
}
