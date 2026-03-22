import { useEffect, useState } from 'react';

type ToastType = 'error' | 'success' | 'info';

interface Props {
  message: string;
  type?: ToastType;
  onDismiss: () => void;
  duration?: number;
}

const colors: Record<ToastType, string> = {
  error: 'bg-[var(--danger)]',
  success: 'bg-[var(--success)]',
  info: 'bg-[var(--accent)]',
};

export function Toast({ message, type = 'error', onDismiss, duration = 5000 }: Props) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (duration <= 0) return;
    const t = setTimeout(() => { setVisible(false); onDismiss(); }, duration);
    return () => clearTimeout(t);
  }, [duration, onDismiss]);

  if (!visible) return null;

  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 ${colors[type]} text-white px-5 py-3 rounded-lg shadow-lg flex items-center gap-3 z-[200] max-w-md`}>
      <p className="text-sm flex-1">{message}</p>
      <button onClick={onDismiss} className="text-xs border border-white/40 rounded px-2 py-0.5 bg-transparent text-white cursor-pointer hover:bg-white/10">
        Dismiss
      </button>
    </div>
  );
}
