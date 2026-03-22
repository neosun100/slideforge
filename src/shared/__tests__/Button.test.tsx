import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../ui/Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick', () => {
    let clicked = false;
    render(<Button onClick={() => { clicked = true; }}>Go</Button>);
    fireEvent.click(screen.getByText('Go'));
    expect(clicked).toBe(true);
  });

  it('is disabled when disabled prop set', () => {
    render(<Button disabled>No</Button>);
    expect(screen.getByText('No')).toBeDisabled();
  });

  it('applies variant classes', () => {
    const { container } = render(<Button variant="danger">Del</Button>);
    expect(container.firstChild).toHaveClass('bg-[var(--danger)]');
  });
});
