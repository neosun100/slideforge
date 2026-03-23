import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Toast } from '../ui/Toast';

describe('Toast', () => {
  it('renders message', () => {
    render(<Toast message="Something failed" onDismiss={vi.fn()} />);
    expect(screen.getByText('Something failed')).toBeInTheDocument();
  });

  it('calls onDismiss when dismiss clicked', () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    render(<Toast message="err" onDismiss={onDismiss} />);
    fireEvent.click(screen.getByText('Dismiss'));
    // onDismiss is delayed 300ms for fade-out animation
    vi.advanceTimersByTime(400);
    expect(onDismiss).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('auto-dismisses after duration', () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    render(<Toast message="err" onDismiss={onDismiss} duration={1000} />);
    // duration + 300ms fade-out delay
    vi.advanceTimersByTime(1400);
    expect(onDismiss).toHaveBeenCalled();
    vi.useRealTimers();
  });
});
