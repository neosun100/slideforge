import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TextEditDialog } from '../components/TextEditDialog';

const mockRegion = {
  id: 'r1',
  text: 'Test text',
  boundingBox: { x: 10, y: 20, width: 100, height: 30 },
  fontSize: 14,
  textColor: { r: 0, g: 0, b: 0 },
  confidence: 88,
  language: 'en',
};

describe('TextEditDialog', () => {
  it('renders dialog title', () => {
    render(<TextEditDialog region={mockRegion} onApply={() => {}} onCancel={() => {}} />);
    expect(screen.getByText('Edit Text Region')).toBeTruthy();
  });

  it('renders textarea with region text', () => {
    render(<TextEditDialog region={mockRegion} onApply={() => {}} onCancel={() => {}} />);
    const textarea = screen.getByDisplayValue('Test text');
    expect(textarea).toBeTruthy();
  });

  it('shows confidence', () => {
    render(<TextEditDialog region={mockRegion} onApply={() => {}} onCancel={() => {}} />);
    expect(screen.getByText(/88%/)).toBeTruthy();
  });

  it('renders Cancel and Apply buttons', () => {
    render(<TextEditDialog region={mockRegion} onApply={() => {}} onCancel={() => {}} />);
    expect(screen.getByText('Cancel')).toBeTruthy();
    expect(screen.getByText(/Apply/)).toBeTruthy();
  });

  it('renders font size input with correct value', () => {
    render(<TextEditDialog region={mockRegion} onApply={() => {}} onCancel={() => {}} />);
    const sizeInput = screen.getByDisplayValue('14');
    expect(sizeInput).toBeTruthy();
  });
});
