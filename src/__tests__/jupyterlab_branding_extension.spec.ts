import {
  applyHeader,
  applyLogo,
  applySplashLogo,
  applyStage,
  applySystemName,
  computeSvgPadding
} from '../index';

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

describe('applySystemName', () => {
  let spacer: HTMLElement;

  beforeEach(() => {
    spacer = document.createElement('div');
    spacer.className = 'jp-Toolbar-spacer';
    document.body.appendChild(spacer);
  });

  afterEach(() => {
    document.body.removeChild(spacer);
  });

  it('should create span with system name text', () => {
    applySystemName(spacer, 'production');
    const span = spacer.querySelector('span.jp-Branding-systemName');
    expect(span).not.toBeNull();
    expect(span!.textContent).toBe('production');
  });

  it('should be idempotent - second call replaces existing span', () => {
    applySystemName(spacer, 'staging');
    applySystemName(spacer, 'production');
    const spans = spacer.querySelectorAll('span.jp-Branding-systemName');
    expect(spans.length).toBe(1);
    expect(spans[0].textContent).toBe('production');
  });

  it('should not create span for empty name', () => {
    applySystemName(spacer, '');
    const span = spacer.querySelector('span.jp-Branding-systemName');
    expect(span).toBeNull();
  });

  it('should remove existing span when called with empty name', () => {
    applySystemName(spacer, 'production');
    applySystemName(spacer, '');
    const span = spacer.querySelector('span.jp-Branding-systemName');
    expect(span).toBeNull();
  });

  it('should apply inline color style when color is provided', () => {
    applySystemName(spacer, 'production', '#ff8800');
    const span = spacer.querySelector(
      'span.jp-Branding-systemName'
    ) as HTMLElement;
    expect(span.style.color).toBe('rgb(255, 136, 0)');
  });

  it('should not set inline color when color is empty', () => {
    applySystemName(spacer, 'production', '');
    const span = spacer.querySelector(
      'span.jp-Branding-systemName'
    ) as HTMLElement;
    expect(span.style.color).toBe('');
  });

  it('should not set inline color when color is omitted', () => {
    applySystemName(spacer, 'production');
    const span = spacer.querySelector(
      'span.jp-Branding-systemName'
    ) as HTMLElement;
    expect(span.style.color).toBe('');
  });

  it('should add uppercase class when capitalize is true', () => {
    applySystemName(spacer, 'production', undefined, true);
    const span = spacer.querySelector(
      'span.jp-Branding-systemName'
    ) as HTMLElement;
    expect(span.classList.contains('jp-Branding-systemName-uppercase')).toBe(
      true
    );
  });

  it('should not add uppercase class when capitalize is false', () => {
    applySystemName(spacer, 'production', undefined, false);
    const span = spacer.querySelector(
      'span.jp-Branding-systemName'
    ) as HTMLElement;
    expect(span.classList.contains('jp-Branding-systemName-uppercase')).toBe(
      false
    );
  });

  it('should not add uppercase class when capitalize is omitted', () => {
    applySystemName(spacer, 'production');
    const span = spacer.querySelector(
      'span.jp-Branding-systemName'
    ) as HTMLElement;
    expect(span.classList.contains('jp-Branding-systemName-uppercase')).toBe(
      false
    );
  });
});

describe('applyStage', () => {
  let spacer: HTMLElement;

  beforeEach(() => {
    spacer = document.createElement('div');
    spacer.className = 'jp-Toolbar-spacer';
    document.body.appendChild(spacer);
  });

  afterEach(() => {
    document.body.removeChild(spacer);
  });

  it('should create span with the stage text', () => {
    applyStage(spacer, 'PRD', true);
    const span = spacer.querySelector('span.jp-Branding-stage');
    expect(span).not.toBeNull();
    expect(span!.textContent).toBe('PRD');
  });

  it('should set the title to the full value for hover recovery when truncated', () => {
    applyStage(spacer, 'PRODUCTION-EU-WEST-1', true);
    const span = spacer.querySelector('span.jp-Branding-stage') as HTMLElement;
    expect(span.title).toBe('PRODUCTION-EU-WEST-1');
  });

  it('should add the per-stage colour class for known stages', () => {
    const cases: [string, string][] = [
      ['DEV', 'jp-Branding-stage-dev'],
      ['TST', 'jp-Branding-stage-tst'],
      ['STG', 'jp-Branding-stage-stg'],
      ['PRD', 'jp-Branding-stage-prd']
    ];
    for (const [stage, cls] of cases) {
      applyStage(spacer, stage, true);
      const span = spacer.querySelector(
        'span.jp-Branding-stage'
      ) as HTMLElement;
      expect(span.classList.contains(cls)).toBe(true);
    }
  });

  it('should match known stages case-insensitively', () => {
    applyStage(spacer, 'prd', true);
    const span = spacer.querySelector('span.jp-Branding-stage') as HTMLElement;
    expect(span.classList.contains('jp-Branding-stage-prd')).toBe(true);
    expect(span.textContent).toBe('prd');
  });

  it('should not add a colour class for unknown stages', () => {
    applyStage(spacer, 'SANDBOX', true);
    const span = spacer.querySelector('span.jp-Branding-stage') as HTMLElement;
    expect(span.className).toBe('jp-Branding-stage');
  });

  it('should not add a colour class when colours are disabled', () => {
    applyStage(spacer, 'PRD', false);
    const span = spacer.querySelector('span.jp-Branding-stage') as HTMLElement;
    expect(span.classList.contains('jp-Branding-stage-prd')).toBe(false);
  });

  it('should default to coloured when useColors is omitted', () => {
    // The schema default is true, so the function default must agree or a
    // bare call renders the opposite of what the settings UI advertises.
    applyStage(spacer, 'PRD');
    const span = spacer.querySelector('span.jp-Branding-stage') as HTMLElement;
    expect(span.classList.contains('jp-Branding-stage-prd')).toBe(true);
  });

  it('should not create span for empty or whitespace stage', () => {
    applyStage(spacer, '', true);
    expect(spacer.querySelector('span.jp-Branding-stage')).toBeNull();
    applyStage(spacer, '   ', true);
    expect(spacer.querySelector('span.jp-Branding-stage')).toBeNull();
  });

  it('should be idempotent - second call replaces existing badge', () => {
    applyStage(spacer, 'DEV', true);
    applyStage(spacer, 'PRD', true);
    const spans = spacer.querySelectorAll('span.jp-Branding-stage');
    expect(spans.length).toBe(1);
    expect(spans[0].textContent).toBe('PRD');
  });

  it('should remove existing badge when called with empty stage', () => {
    applyStage(spacer, 'PRD', true);
    applyStage(spacer, '', true);
    expect(spacer.querySelector('span.jp-Branding-stage')).toBeNull();
  });

  it('should render alone when the system name is empty', () => {
    // Deployment sets stage but no system_name: applySystemName returns
    // early, so the badge must still be the sole child and survive re-render.
    for (let i = 0; i < 2; i++) {
      applySystemName(spacer, '');
      applyStage(spacer, 'PRD', true);
    }
    expect(spacer.children.length).toBe(1);
    expect(spacer.children[0].className.split(' ')[0]).toBe(
      'jp-Branding-stage'
    );
  });

  it('should end up right of a system name that appears after it', () => {
    // Badge rendered first, system name arrives on a later render - the
    // append-order contract must still put the badge on the right.
    applyStage(spacer, 'PRD', true);
    applySystemName(spacer, 'my lab');
    applyStage(spacer, 'PRD', true);
    const children = Array.from(spacer.children).map(
      c => c.className.split(' ')[0]
    );
    expect(children).toEqual(['jp-Branding-systemName', 'jp-Branding-stage']);
  });

  it('should sit to the right of the system name across re-renders', () => {
    // Both helpers append, so the documented call order must survive a
    // re-render triggered by a settings change.
    for (let i = 0; i < 2; i++) {
      applySystemName(spacer, 'my lab');
      applyStage(spacer, 'PRD', true);
    }
    const children = Array.from(spacer.children).map(
      c => c.className.split(' ')[0]
    );
    expect(children).toEqual(['jp-Branding-systemName', 'jp-Branding-stage']);
  });
});

describe('applyHeader', () => {
  let spacer: HTMLElement;

  beforeEach(() => {
    spacer = document.createElement('div');
    spacer.className = 'jp-Toolbar-spacer';
    document.body.appendChild(spacer);
  });

  afterEach(() => {
    document.body.removeChild(spacer);
  });

  const order = () =>
    Array.from(spacer.children).map(c => c.className.split(' ')[0]);

  it('should place the stage badge right of the system name', () => {
    applyHeader(spacer, 'my lab', 'PRD');
    expect(order()).toEqual(['jp-Branding-systemName', 'jp-Branding-stage']);
  });

  it('should keep that order across repeated renders', () => {
    // A settings change re-runs this; both helpers append, so a swapped call
    // order inside applyHeader would surface here.
    applyHeader(spacer, 'my lab', 'PRD');
    applyHeader(spacer, 'my lab', 'PRD', { stageColors: false });
    applyHeader(spacer, 'my lab', 'PRD', { capitalize: true });
    expect(order()).toEqual(['jp-Branding-systemName', 'jp-Branding-stage']);
    expect(spacer.children.length).toBe(2);
  });

  it('should render the badge alone when only a stage is configured', () => {
    applyHeader(spacer, '', 'PRD');
    expect(order()).toEqual(['jp-Branding-stage']);
  });

  it('should render the name alone when no stage is configured', () => {
    applyHeader(spacer, 'my lab', '');
    expect(order()).toEqual(['jp-Branding-systemName']);
  });

  it('should colour the badge by default and honour the toggle', () => {
    applyHeader(spacer, 'my lab', 'PRD');
    expect(
      spacer
        .querySelector('.jp-Branding-stage')!
        .classList.contains('jp-Branding-stage-prd')
    ).toBe(true);
    applyHeader(spacer, 'my lab', 'PRD', { stageColors: false });
    expect(
      spacer
        .querySelector('.jp-Branding-stage')!
        .classList.contains('jp-Branding-stage-prd')
    ).toBe(false);
  });

  it('should pass colour and capitalize through to the system name', () => {
    applyHeader(spacer, 'my lab', 'PRD', {
      color: '#ff8800',
      capitalize: true
    });
    const name = spacer.querySelector('.jp-Branding-systemName') as HTMLElement;
    expect(name.style.color).toBe('rgb(255, 136, 0)');
    expect(name.classList.contains('jp-Branding-systemName-uppercase')).toBe(
      true
    );
  });

  it('should render nothing when neither is configured', () => {
    applyHeader(spacer, '   ', '   ');
    expect(spacer.children.length).toBe(0);
  });
});

describe('applySplashLogo', () => {
  afterEach(() => {
    const existing = document.getElementById('jp-Branding-splash-style');
    if (existing) {
      existing.remove();
    }
  });

  it('should inject a style element with the splash URL', () => {
    applySplashLogo('/jupyterlab-branding/splash-logo');
    const style = document.getElementById(
      'jp-Branding-splash-style'
    ) as HTMLStyleElement;
    expect(style).not.toBeNull();
    expect(style.tagName).toBe('STYLE');
    expect(style.textContent).toContain(
      "url('/jupyterlab-branding/splash-logo')"
    );
  });

  it('should target #main-logo with background sizing rules', () => {
    applySplashLogo('/jupyterlab-branding/splash-logo');
    const style = document.getElementById(
      'jp-Branding-splash-style'
    ) as HTMLStyleElement;
    expect(style.textContent).toContain('#jupyterlab-splash #main-logo');
    expect(style.textContent).toContain('background-size: contain');
    expect(style.textContent).toContain('background-repeat: no-repeat');
    expect(style.textContent).toContain('background-position: center');
  });

  it('should hide the original inline SVG inside #main-logo', () => {
    applySplashLogo('/jupyterlab-branding/splash-logo');
    const style = document.getElementById(
      'jp-Branding-splash-style'
    ) as HTMLStyleElement;
    expect(style.textContent).toContain('#jupyterlab-splash #main-logo > svg');
    expect(style.textContent).toContain('display: none');
  });

  it('should be idempotent - second call replaces existing style', () => {
    applySplashLogo('/old/url');
    applySplashLogo('/new/url');
    const styles = document.querySelectorAll('#jp-Branding-splash-style');
    expect(styles.length).toBe(1);
    expect(styles[0].textContent).toContain("url('/new/url')");
    expect(styles[0].textContent).not.toContain("url('/old/url')");
  });

  it('should not inject style for empty URL', () => {
    applySplashLogo('');
    const style = document.getElementById('jp-Branding-splash-style');
    expect(style).toBeNull();
  });

  it('should remove existing style when called with empty URL', () => {
    applySplashLogo('/some/url');
    applySplashLogo('');
    const style = document.getElementById('jp-Branding-splash-style');
    expect(style).toBeNull();
  });
});
