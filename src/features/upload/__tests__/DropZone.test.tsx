import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DropZone } from '../components/DropZone';

describe('DropZone', () => {
  it('renders drop hint text', () => {
    render(<DropZone onFile={vi.fn()} onError={vi.fn()} />);
    expect(screen.getByText(/Drop a file here/)).toBeInTheDocument();
  });

  it('renders supported formats', () => {
    render(<DropZone onFile={vi.fn()} onError={vi.fn()} />);
    expect(screen.getByText(/PDF/)).toBeInTheDocument();
  });

  it('has file input hidden', () => {
    const { container } = render(<DropZone onFile={vi.fn()} onError={vi.fn()} />);
    const input = container.querySelector('input[type="file"]');
    expect(input).toBeTruthy();
    expect(input?.className).toContain('hidden');
  });

  it('calls onError for unsupported file via input change', () => {
    const onError = vi.fn();
    const onFile = vi.fn();
    const { container } = render(<DropZone onFile={onFile} onError={onError} />);
    const input = container.querySelector('input[type="file"]')!;
    const file = new File(['test'], 'test.doc', { type: 'application/msword' });
    fireEvent.change(input, { target: { files: [file] } });
    expect(onError).toHaveBeenCalled();
    expect(onFile).not.toHaveBeenCalled();
  });

  it('calls onFile for valid PDF via input change', () => {
    const onError = vi.fn();
    const onFile = vi.fn();
    const { container } = render(<DropZone onFile={onFile} onError={onError} />);
    const input = container.querySelector('input[type="file"]')!;
    const file = new File(['%PDF-'], 'test.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });
    expect(onFile).toHaveBeenCalledWith(file);
    expect(onError).not.toHaveBeenCalled();
  });
});
