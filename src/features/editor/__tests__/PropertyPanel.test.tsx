import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PropertyPanel } from '../components/PropertyPanel';

const mockRegion = {
  id: 'r1',
  text: 'Hello World',
  boundingBox: { x: 10, y: 20, width: 100, height: 30 },
  fontSize: 16,
  textColor: { r: 255, g: 255, b: 255 },
  confidence: 95,
  language: 'en',
};

describe('PropertyPanel', () => {
  it('renders text content label', () => {
    render(<PropertyPanel region={mockRegion} onApply={() => {}} onCancel={() => {}} />);
    expect(screen.getByText('Text Content')).toBeTruthy();
  });

  it('renders textarea with region text', () => {
    render(<PropertyPanel region={mockRegion} onApply={() => {}} onCancel={() => {}} />);
    const textarea = screen.getByDisplayValue('Hello World');
    expect(textarea).toBeTruthy();
  });

  it('renders Apply and Cancel buttons', () => {
    render(<PropertyPanel region={mockRegion} onApply={() => {}} onCancel={() => {}} />);
    expect(screen.getByText(/Apply/)).toBeTruthy();
    expect(screen.getByText(/Cancel/)).toBeTruthy();
  });

  it('shows confidence percentage', () => {
    render(<PropertyPanel region={mockRegion} onApply={() => {}} onCancel={() => {}} />);
    expect(screen.getByText('95%')).toBeTruthy();
  });

  it('renders font size slider', () => {
    render(<PropertyPanel region={mockRegion} onApply={() => {}} onCancel={() => {}} />);
    expect(screen.getByText('Font Size')).toBeTruthy();
  });

  it('renders text color section', () => {
    render(<PropertyPanel region={mockRegion} onApply={() => {}} onCancel={() => {}} />);
    expect(screen.getByText('Text Color')).toBeTruthy();
  });
});
