import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { fetchLogoConfig, fetchLogoContent } from './handler';

const LOGO_SELECTOR = '#jp-MainLogo';
const SPACER_SELECTOR = '.jp-Toolbar-spacer[data-jp-item-name="spacer"]';
const SYSTEM_NAME_CLASS = 'jp-Branding-systemName';
const SYSTEM_NAME_UPPERCASE_CLASS = 'jp-Branding-systemName-uppercase';

/**
 * Minimum padding ratio threshold. Sides below this are treated as zero.
 */
const MIN_PADDING_RATIO = 0.005;

export interface ISvgPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * Compute padding ratios from SVG viewBox vs content bounding box.
 *
 * Renders the SVG offscreen, calls getBBox() to get the tight content bounds,
 * then compares against the viewBox to derive padding ratios per side.
 * Returns null if no meaningful padding exists (all sides < MIN_PADDING_RATIO).
 */
export function computeSvgPadding(svgText: string): ISvgPadding | null {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.visibility = 'hidden';
  container.style.left = '-9999px';
  container.innerHTML = svgText;

  const svg = container.querySelector('svg');
  if (!svg) {
    return null;
  }

  document.body.appendChild(container);

  try {
    const vbAttr = svg.getAttribute('viewBox');
    if (!vbAttr) {
      return null;
    }
    const vbParts = vbAttr
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    if (vbParts.length !== 4 || vbParts.some(isNaN)) {
      return null;
    }
    const [vbX, vbY, vbW, vbH] = vbParts;
    if (vbW === 0 && vbH === 0) {
      return null;
    }

    const bbox = svg.getBBox();

    const top = (bbox.y - vbY) / vbH;
    const bottom = (vbY + vbH - (bbox.y + bbox.height)) / vbH;
    const left = (bbox.x - vbX) / vbW;
    const right = (vbX + vbW - (bbox.x + bbox.width)) / vbW;

    if (
      top < MIN_PADDING_RATIO &&
      right < MIN_PADDING_RATIO &&
      bottom < MIN_PADDING_RATIO &&
      left < MIN_PADDING_RATIO
    ) {
      return null;
    }

    return {
      top: Math.max(0, top),
      right: Math.max(0, right),
      bottom: Math.max(0, bottom),
      left: Math.max(0, left)
    };
  } finally {
    document.body.removeChild(container);
  }
}

export function applyLogo(
  logoElement: HTMLElement,
  contentType: string,
  text: string,
  url: string
): void {
  logoElement.innerHTML = '';
  logoElement.classList.add('jp-MainLogo-custom');

  if (contentType.includes('svg')) {
    // Compute padding from SVG viewBox geometry BEFORE stripping attributes.
    const padding = computeSvgPadding(text);

    // Use <img> with data URI so the browser treats SVG as a replaced element.
    // Strip explicit width/height so the viewBox alone controls intrinsic size
    // and preserveAspectRatio (default xMidYMid meet) handles scaling.
    const cleaned = text
      .replace(/(<svg[^>]*?)\s+width="[^"]*"/i, '$1')
      .replace(/(<svg[^>]*?)\s+height="[^"]*"/i, '$1');
    const img = document.createElement('img');
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(cleaned);
    img.alt = 'Logo';
    logoElement.appendChild(img);

    // Apply padding derived from SVG geometry as CSS pixels on the container.
    if (padding) {
      const containerWidth = logoElement.getBoundingClientRect().width || 33;
      const containerHeight =
        logoElement.getBoundingClientRect().height || containerWidth;
      const pt = Math.ceil(padding.top * containerHeight);
      const pr = Math.ceil(padding.right * containerWidth);
      const pb = Math.ceil(padding.bottom * containerHeight);
      const pl = Math.ceil(padding.left * containerWidth);
      logoElement.style.padding = `${pt}px ${pr}px ${pb}px ${pl}px`;
    }
  } else {
    const img = document.createElement('img');
    img.src = url;
    img.alt = 'Logo';
    logoElement.appendChild(img);
  }
}

/**
 * Apply system name text to the toolbar spacer element.
 *
 * Idempotent: removes any prior span created by this extension before
 * inserting a new one, so re-activation or HMR does not duplicate nodes.
 * When `color` is provided, sets it as inline style overriding the CSS default.
 */
export function applySystemName(
  spacerElement: HTMLElement,
  name: string,
  capitalize: boolean,
  color?: string
): void {
  const existing = spacerElement.querySelector('.' + SYSTEM_NAME_CLASS);
  if (existing) {
    existing.remove();
  }

  if (!name) {
    return;
  }

  const span = document.createElement('span');
  span.className = SYSTEM_NAME_CLASS;
  if (capitalize) {
    span.classList.add(SYSTEM_NAME_UPPERCASE_CLASS);
  }
  span.textContent = name;
  if (color) {
    span.style.color = color;
  }
  spacerElement.appendChild(span);
}

/**
 * Initialization data for the jupyterlab_branding_extension extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab_branding_extension:plugin',
  description: 'Replace JupyterLab main logo with custom image',
  autoStart: true,
  activate: async (app: JupyterFrontEnd) => {
    console.log(
      'JupyterLab extension jupyterlab_branding_extension is activated!'
    );
    try {
      const config = await fetchLogoConfig();

      if (config.logo_url) {
        const content = await fetchLogoContent(config.logo_url);
        app.restored.then(() => {
          const el = document.querySelector(LOGO_SELECTOR) as HTMLElement;
          if (el) {
            applyLogo(el, content.contentType, content.text, content.url);
          }
        });
      }

      if (config.system_name) {
        app.restored.then(() => {
          const spacer = document.querySelector(SPACER_SELECTOR) as HTMLElement;
          if (spacer) {
            applySystemName(
              spacer,
              config.system_name,
              config.header_capitalize_system_name,
              config.header_system_name_color
            );
          }
        });
      }
    } catch (e) {
      console.warn('[Branding] Failed to load config:', e);
    }
  }
};

export default plugin;
