import { useEffect, useState } from 'react';

type ToastType = 'error' | 'success' | 'info';

interface Props {
  message: string;
  type?: ToastType;
  onDismiss: () => void;
  duration?: number;
}

const icons: Record<ToastType, string> = { error: '✕', success: '✓', info: 'ℹ' };
const accents: Record<ToastType, string> = { error: 'var(--danger)', success: 'var(--success)', info: 'var(--accent)' };

export function Toast({ message, type = 'error', onDismiss, duration = 5000 }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

  useEffect(() => {
    if (duration <= 0) return;
    const t = setTimeout(() => { setVisible(false); setTimeout(onDismiss, 300); }, duration);
    return () => clearTimeout(t);
  }, [duration, onDismiss]);

  return (
    <div
      className="fixed bottom-6 left-1/2 glass flex items-center gap-3 z-[200] max-w-md"
      style={{
        transform: visible ? 'translate(-50%, 0)' : 'translate(-50%, 20px)',
        opacity: visible ? 1 : 0,
        transition: 'all var(--transition-base)',
        padding: '12px 20px',
        borderRadius: 'var(--radius-md)',
        borderLeft: `3px solid ${accents[type]}`,
      }}
    >
      <span style={{ color: accents[type], fontWeight: 700, fontSize: '14px' }}>{icons[type]}</span>
      <p className="text-sm flex-1" style={{ color: 'var(--text)' }}>{message}</p>
      <button
        onClick={() => { setVisible(false); setTimeout(onDismiss, 300); }}
        className="text-xs rounded px-2 py-0.5 cursor-pointer"
        style={{ background: 'var(--glass-bg)', color: 'var(--text-muted)', border: '1px solid var(--glass-border)', transition: 'var(--transition-fast)' }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
      >
        Dismiss
      </button>
    </div>
  );
}
