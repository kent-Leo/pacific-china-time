import { useEffect, useState } from 'react';

/** Sample the device clock on every tick; never accumulate a synthetic second. */
export function useCurrentTime() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => {
      clearTimeout(timer);
      setNow(Date.now());
      timer = setTimeout(refresh, 1000 - (Date.now() % 1000));
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    refresh();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('pageshow', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('pageshow', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);
  return now;
}
