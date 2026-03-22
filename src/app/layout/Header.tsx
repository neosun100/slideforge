import { Link } from 'react-router-dom';
import { useEditorStore } from '@/stores/editorStore';

export function Header() {
  const { theme, toggleTheme } = useEditorStore();

  return (
    <nav className="flex items-center justify-between px-8 py-3 border-b" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <Link to="/" className="flex items-center gap-2 font-semibold no-underline" style={{ color: 'var(--text)' }}>
        <span className="text-xl">⚒</span>
        <span>SlideForge</span>
      </Link>
      <div className="flex items-center gap-6">
        <Link to="/" className="text-sm no-underline" style={{ color: 'var(--text-muted)' }}>Home</Link>
        <Link to="/changelog" className="text-sm no-underline" style={{ color: 'var(--text-muted)' }}>Changelog</Link>
        <Link to="/editor" className="text-sm no-underline" style={{ color: 'var(--text-muted)' }}>Open Editor</Link>
        <button
          onClick={toggleTheme}
          className="text-sm px-2 py-1 rounded border-none cursor-pointer"
          style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </nav>
  );
}
