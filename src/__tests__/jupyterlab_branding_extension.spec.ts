import { applyLogo } from '../index';

describe('applyLogo', () => {
  let logoElement: HTMLElement;

  beforeEach(() => {
    logoElement = document.createElement('div');
    logoElement.id = 'jp-MainLogo';
    logoElement.innerHTML = '<svg>old logo</svg>';
    document.body.appendChild(logoElement);
  });

  afterEach(() => {
    document.body.removeChild(logoElement);
  });

  it('should clear existing content', () => {
    applyLogo(logoElement, 'image/svg+xml', '<svg><circle/></svg>', '');
    expect(logoElement.innerHTML).not.toContain('old logo');
  });

  describe('SVG content', () => {
    const svgContent =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40"/></svg>';

    it('should embed SVG inline when content type includes svg', () => {
      applyLogo(logoElement, 'image/svg+xml', svgContent, '');
      const svg = logoElement.querySelector('svg');
      expect(svg).not.toBeNull();
    });

    it('should not create img element for SVG', () => {
      applyLogo(logoElement, 'image/svg+xml', svgContent, '');
      const img = logoElement.querySelector('img');
      expect(img).toBeNull();
    });
  });

  describe('raster image content', () => {
    it('should create img element for non-SVG content', () => {
      applyLogo(logoElement, 'image/png', '', 'https://example.com/logo.png');
      const img = logoElement.querySelector('img') as HTMLImageElement;
      expect(img).not.toBeNull();
      expect(img.src).toBe('https://example.com/logo.png');
    });

    it('should set alt text on img', () => {
      applyLogo(logoElement, 'image/png', '', 'https://example.com/logo.png');
      const img = logoElement.querySelector('img') as HTMLImageElement;
      expect(img.alt).toBe('Logo');
    });

    it('should not create SVG for raster content', () => {
      applyLogo(logoElement, 'image/png', '', 'https://example.com/logo.png');
      const svg = logoElement.querySelector('svg');
      expect(svg).toBeNull();
    });
  });
});
