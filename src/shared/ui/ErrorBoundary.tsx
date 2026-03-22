import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center" style={{ color: '#ccc' }}>
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
          <p className="text-sm opacity-70 mb-4 max-w-md">{this.state.error?.message || 'An unexpected error occurred'}</p>
          <button
            className="px-4 py-2 rounded text-sm cursor-pointer"
            style={{ background: 'var(--accent)', color: '#fff' }}
            onClick={() => this.setState({ hasError: false, error: null })}
          >Try Again</button>
        </div>
      );
    }
    return this.props.children;
  }
}
