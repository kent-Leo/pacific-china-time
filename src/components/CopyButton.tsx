import { Check, Copy, Link2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Language } from '../types';
import { tx } from '../lib/i18n';

export function CopyButton({
  value,
  language,
  label,
  share = false,
  disabled = false,
}: {
  value: string | (() => string);
  language: Language;
  label?: string;
  share?: boolean;
  disabled?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [fallback, setFallback] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  async function copy() {
    const text = typeof value === 'function' ? value() : value;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      setFallback(text);
    }
  }
  const Icon = copied ? Check : share ? Link2 : Copy;
  return (
    <>
      <button
        type="button"
        className={`button ${share ? 'button-primary' : 'button-secondary'}`}
        onClick={() => void copy()}
        disabled={disabled}
      >
        <Icon size={15} aria-hidden="true" />
        <span>
          {copied
            ? tx(language, '已复制', 'Copied')
            : (label ?? tx(language, '复制结果', 'Copy result'))}
        </span>
      </button>
      <span className="sr-only" role="status">
        {copied ? tx(language, '已复制到剪贴板', 'Copied to clipboard') : ''}
      </span>
      {fallback !== null && (
        <div
          className="copy-fallback"
          role="region"
          aria-label={tx(language, '手动复制', 'Copy manually')}
        >
          <p>
            {tx(
              language,
              '浏览器未允许自动复制，请选中以下内容复制。',
              'Clipboard access is unavailable. Select and copy the text below.',
            )}
          </p>
          <textarea
            readOnly
            value={fallback}
            aria-label={tx(language, '待复制内容', 'Text to copy')}
            onFocus={(event) => event.target.select()}
          />
          <button
            type="button"
            className="text-button"
            onClick={() => setFallback(null)}
          >
            {tx(language, '关闭', 'Close')}
          </button>
        </div>
      )}
    </>
  );
}
