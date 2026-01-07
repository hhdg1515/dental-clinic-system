import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import OptimizedImage from './OptimizedImage';

describe('OptimizedImage', () => {
  it('renders image with correct alt text', () => {
    render(
      <OptimizedImage
        src="/images/test.jpg"
        alt="Test image description"
        className="test-class"
      />
    );

    const img = screen.getByAltText('Test image description');
    expect(img).toBeInTheDocument();
  });

  it('generates WebP source correctly', () => {
    const { container } = render(
      <OptimizedImage src="/images/hero.jpg" alt="Hero image" />
    );

    const source = container.querySelector('source[type="image/webp"]');
    expect(source).toBeInTheDocument();
    expect(source?.getAttribute('srcset')).toBe('/images/hero.webp');
  });

  it('applies loading attribute', () => {
    render(
      <OptimizedImage src="/images/test.jpg" alt="Lazy loaded image" loading="lazy" />
    );

    const img = screen.getByAltText('Lazy loaded image');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('applies custom className', () => {
    render(
      <OptimizedImage src="/images/test.jpg" alt="Styled image" className="custom-class" />
    );

    const img = screen.getByAltText('Styled image');
    expect(img).toHaveClass('custom-class');
  });
});
