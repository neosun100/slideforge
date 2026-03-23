interface Props {
  progress: number; // 0-100, or -1 for indeterminate
  className?: string;
}

export function ProgressBar({ progress, className = '' }: Props) {
  const indeterminate = progress < 0;
  return (
    <div
      className={`w-full h-1.5 rounded-full overflow-hidden ${className}`}
      style={{ background: 'var(--border)' }}
    >
      {indeterminate ? (
        <div
          className="h-full w-2/5 rounded-full animate-[indeterminate_1.2s_ease-in-out_infinite]"
          style={{ background: 'var(--gradient-accent)' }}
        />
      ) : (
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.min(100, Math.max(0, progress))}%`,
            background: 'var(--gradient-accent)',
            transition: 'width 300ms cubic-bezier(0.4,0,0.2,1)',
          }}
        />
      )}
    </div>
  );
}
