import { Link } from 'react-router-dom';
import { useEditorStore } from '@/stores/editorStore';

export function Header() {
  const { theme, toggleTheme } = useEditorStore();

  return (
    <nav
      className="glass flex items-center justify-between px-8 py-3 sticky top-0 z-50"
      style={{ borderBottom: '1px solid var(--glass-border)' }}
    >
      <Link
        to="/"
        className="flex items-center gap-2 font-bold no-underline text-lg"
        style={{ color: 'var(--text)', transition: 'var(--transition-fast)' }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '0.8'; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
      >
        <span className="text-xl">⚒</span>
        <span className="gradient-text">SlideForge</span>
      </Link>
      <div className="flex items-center gap-6">
        {[
          { to: '/', label: 'Home' },
          { to: '/changelog', label: 'Changelog' },
        ].map(link => (
          <Link
            key={link.to}
            to={link.to}
            className="text-sm no-underline"
            style={{ color: 'var(--text-muted)', transition: 'var(--transition-fast)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
          >{link.label}</Link>
        ))}
        <Link
          to="/editor"
          className="text-sm no-underline px-4 py-1.5 rounded-lg font-medium text-white"
          style={{
            background: 'var(--gradient-accent)',
            borderRadius: 'var(--radius-sm)',
            transition: 'var(--transition-fast)',
          }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 16px var(--accent-glow)'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
        >Open Editor</Link>
        <button
          onClick={toggleTheme}
          className="text-sm px-2 py-1.5 rounded-lg border-none cursor-pointer"
          style={{
            background: 'var(--glass-bg)',
            color: 'var(--text-muted)',
            border: '1px solid var(--glass-border)',
            transition: 'var(--transition-fast)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--glass-bg-hover)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--glass-bg)'; }}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </nav>
  );
}
