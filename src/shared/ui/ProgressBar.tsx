interface Props {
  progress: number; // 0-100, or -1 for indeterminate
  className?: string;
}

export function ProgressBar({ progress, className = '' }: Props) {
  const indeterminate = progress < 0;
  return (
    <div className={`w-full h-1.5 rounded-full overflow-hidden bg-[var(--border)] ${className}`}>
      {indeterminate ? (
        <div className="h-full w-2/5 rounded-full bg-[var(--accent)] animate-[indeterminate_1.2s_ease-in-out_infinite]" />
      ) : (
        <div
          className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-300"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      )}
    </div>
  );
}
