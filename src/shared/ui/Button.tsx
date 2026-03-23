import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

const base = 'px-4 py-2 rounded-lg text-sm font-medium cursor-pointer disabled:opacity-40 disabled:cursor-default';

const variantStyles: Record<Variant, React.CSSProperties> = {
  primary: { background: 'var(--gradient-accent)', color: '#fff', border: 'none' },
  secondary: { background: 'var(--glass-bg)', color: 'var(--text)', border: '1px solid var(--glass-border)' },
  ghost: { background: 'transparent', color: 'var(--text-muted)', border: 'none' },
  danger: { background: 'var(--danger)', color: '#fff', border: 'none' },
};

export function Button({ variant = 'primary', className = '', style, children, ...rest }: Props) {
  return (
    <button
      className={`${base} ${className}`}
      style={{
        ...variantStyles[variant],
        borderRadius: 'var(--radius-sm)',
        transition: 'all var(--transition-fast)',
        ...style,
      }}
      onMouseEnter={e => {
        if (variant === 'primary') e.currentTarget.style.boxShadow = '0 0 16px var(--accent-glow)';
        if (variant === 'secondary') e.currentTarget.style.borderColor = 'var(--border-hover)';
        if (variant === 'ghost') { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = 'var(--glass-bg)'; }
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'translateY(0)';
        if (variant === 'secondary') e.currentTarget.style.borderColor = 'var(--glass-border)';
        if (variant === 'ghost') { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
