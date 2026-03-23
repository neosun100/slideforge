export function Footer() {
  return (
    <footer className="mt-auto">
      <div
        className="h-px mx-8"
        style={{ background: 'var(--gradient-primary)', opacity: 0.2 }}
      />
      <div className="text-center py-6 text-sm" style={{ color: 'var(--text-dim)' }}>
        © {new Date().getFullYear()} SlideForge ·{' '}
        <a
          href="/changelog"
          style={{ color: 'var(--text-muted)', transition: 'var(--transition-fast)' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
        >Changelog</a>
      </div>
    </footer>
  );
}
