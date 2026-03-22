export function Footer() {
  return (
    <footer className="text-center py-6 text-sm border-t" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
      © {new Date().getFullYear()} SlideForge · <a href="/changelog" style={{ color: 'var(--accent)' }}>Changelog</a>
    </footer>
  );
}
