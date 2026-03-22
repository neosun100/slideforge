import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from '../../app/routes/HomePage';

describe('HomePage', () => {
  const renderPage = () => render(<MemoryRouter><HomePage /></MemoryRouter>);

  it('renders hero title', () => {
    renderPage();
    expect(screen.getByText(/Edit Presentations/)).toBeInTheDocument();
  });

  it('renders CTA link to editor', () => {
    renderPage();
    const cta = screen.getByText(/Open Editor/);
    expect(cta).toBeInTheDocument();
    expect(cta.closest('a')).toHaveAttribute('href', '/editor');
  });

  it('renders all 4 features', () => {
    renderPage();
    expect(screen.getByText('OCR Text Detection')).toBeInTheDocument();
    expect(screen.getByText('Smart Inpainting')).toBeInTheDocument();
    expect(screen.getByText('Export to PPTX')).toBeInTheDocument();
    expect(screen.getByText('100% Private')).toBeInTheDocument();
  });

  it('renders FAQ section', () => {
    renderPage();
    expect(screen.getByText(/Is SlideForge really free/)).toBeInTheDocument();
  });
});
