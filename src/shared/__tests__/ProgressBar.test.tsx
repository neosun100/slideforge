import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ProgressBar } from '../ui/ProgressBar';

describe('ProgressBar', () => {
  it('renders determinate bar at given width', () => {
    const { container } = render(<ProgressBar progress={50} />);
    const fill = container.querySelector('[style*="width"]');
    expect(fill).toBeTruthy();
    expect(fill?.getAttribute('style')).toContain('50%');
  });

  it('clamps progress to 0-100', () => {
    const { container } = render(<ProgressBar progress={150} />);
    const fill = container.querySelector('[style*="width"]');
    expect(fill?.getAttribute('style')).toContain('100%');
  });

  it('renders indeterminate when progress < 0', () => {
    const { container } = render(<ProgressBar progress={-1} />);
    const fill = container.querySelector('.animate-\\[indeterminate_1\\.2s_ease-in-out_infinite\\]');
    expect(fill).toBeTruthy();
  });
});
