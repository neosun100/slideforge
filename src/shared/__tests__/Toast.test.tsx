import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Toast } from '../ui/Toast';

describe('Toast', () => {
  it('renders message', () => {
    render(<Toast message="Something failed" onDismiss={vi.fn()} />);
    expect(screen.getByText('Something failed')).toBeInTheDocument();
  });

  it('calls onDismiss when dismiss clicked', () => {
    const onDismiss = vi.fn();
    render(<Toast message="err" onDismiss={onDismiss} />);
    fireEvent.click(screen.getByText('Dismiss'));
    expect(onDismiss).toHaveBeenCalled();
  });

  it('auto-dismisses after duration', async () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    render(<Toast message="err" onDismiss={onDismiss} duration={1000} />);
    vi.advanceTimersByTime(1100);
    expect(onDismiss).toHaveBeenCalled();
    vi.useRealTimers();
  });
});
