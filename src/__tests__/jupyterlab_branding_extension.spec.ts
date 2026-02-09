import { applyLogo, computeSvgPadding } from '../index';

// Mock getBBox on SVGSVGElement prototype for jsdom (not natively supported).
const mockGetBBox = jest.fn();
beforeAll(() => {
  (SVGSVGElement.prototype as any).getBBox = mockGetBBox;
});

afterAll(() => {
  delete (SVGSVGElement.prototype as any).getBBox;
});

beforeEach(() => {
  mockGetBBox.mockReset();
});

describe('computeSvgPadding', () => {
  it('should return padding ratios for SVG with viewBox padding', () => {
    // viewBox="0 0 100 100", content occupies 10,10 to 80,80
    mockGetBBox.mockReturnValue({ x: 10, y: 10, width: 70, height: 70 });
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="10" y="10" width="70" height="70"/></svg>';
    const result = computeSvgPadding(svg);
    expect(result).not.toBeNull();
    expect(result!.top).toBeCloseTo(0.1);
    expect(result!.right).toBeCloseTo(0.2);
    expect(result!.bottom).toBeCloseTo(0.2);
    expect(result!.left).toBeCloseTo(0.1);
  });

  it('should return null for SVG with no meaningful padding', () => {
    // Content fills the entire viewBox
    mockGetBBox.mockReturnValue({ x: 0, y: 0, width: 100, height: 100 });
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100"/></svg>';
    const result = computeSvgPadding(svg);
    expect(result).toBeNull();
  });

  it('should return null for SVG without viewBox', () => {
    mockGetBBox.mockReturnValue({ x: 0, y: 0, width: 50, height: 50 });
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg"><rect width="50" height="50"/></svg>';
    const result = computeSvgPadding(svg);
    expect(result).toBeNull();
  });

  it('should return null for non-SVG input', () => {
    const result = computeSvgPadding('<div>not svg</div>');
    expect(result).toBeNull();
  });

  it('should clamp negative ratios to zero', () => {
    // Content extends beyond viewBox on the left
    mockGetBBox.mockReturnValue({ x: -5, y: 0, width: 110, height: 80 });
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="-5" y="0" width="110" height="80"/></svg>';
    const result = computeSvgPadding(svg);
    expect(result).not.toBeNull();
    expect(result!.left).toBe(0);
    expect(result!.bottom).toBeCloseTo(0.2);
  });

  it('should clean up temporary DOM element', () => {
    mockGetBBox.mockReturnValue({ x: 10, y: 10, width: 80, height: 80 });
    const before = document.body.children.length;
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect/></svg>';
    computeSvgPadding(svg);
    expect(document.body.children.length).toBe(before);
  });
});

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
    mockGetBBox.mockReturnValue({ x: 0, y: 0, width: 100, height: 100 });
    applyLogo(logoElement, 'image/svg+xml', '<svg><circle/></svg>', '');
    expect(logoElement.innerHTML).not.toContain('old logo');
  });

  it('should add jp-MainLogo-custom class', () => {
    mockGetBBox.mockReturnValue({ x: 0, y: 0, width: 100, height: 100 });
    applyLogo(logoElement, 'image/svg+xml', '<svg><circle/></svg>', '');
    expect(logoElement.classList.contains('jp-MainLogo-custom')).toBe(true);
  });

  describe('SVG content', () => {
    const svgContent =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40"/></svg>';

    it('should create img element with data URI for SVG content', () => {
      mockGetBBox.mockReturnValue({ x: 0, y: 0, width: 100, height: 100 });
      applyLogo(logoElement, 'image/svg+xml', svgContent, '');
      const img = logoElement.querySelector('img') as HTMLImageElement;
      expect(img).not.toBeNull();
      expect(img.src).toContain('data:image/svg+xml;charset=utf-8,');
    });

    it('should set alt text on SVG img', () => {
      mockGetBBox.mockReturnValue({ x: 0, y: 0, width: 100, height: 100 });
      applyLogo(logoElement, 'image/svg+xml', svgContent, '');
      const img = logoElement.querySelector('img') as HTMLImageElement;
      expect(img.alt).toBe('Logo');
    });

    it('should apply padding style when SVG has viewBox padding', () => {
      // Content occupies 10,10 to 90,90 in a 0 0 100 100 viewBox
      mockGetBBox.mockReturnValue({ x: 10, y: 10, width: 80, height: 80 });
      // Mock container dimensions (33px wide, 33px tall)
      jest.spyOn(logoElement, 'getBoundingClientRect').mockReturnValue({
        width: 33,
        height: 33,
        top: 0,
        left: 0,
        bottom: 33,
        right: 33,
        x: 0,
        y: 0,
        toJSON: () => ({})
      });
      applyLogo(logoElement, 'image/svg+xml', svgContent, '');
      // top: 10/100 * 33 = 3.3 -> ceil = 4
      // right: 10/100 * 33 = 3.3 -> ceil = 4
      // bottom: 10/100 * 33 = 3.3 -> ceil = 4
      // left: 10/100 * 33 = 3.3 -> ceil = 4
      expect(logoElement.style.padding).toBe('4px 4px 4px 4px');
    });

    it('should not apply padding when SVG has no viewBox padding', () => {
      mockGetBBox.mockReturnValue({ x: 0, y: 0, width: 100, height: 100 });
      applyLogo(logoElement, 'image/svg+xml', svgContent, '');
      expect(logoElement.style.padding).toBe('');
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
