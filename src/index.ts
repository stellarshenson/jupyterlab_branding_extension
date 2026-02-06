import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { fetchLogoConfig, fetchLogoContent } from './handler';

const LOGO_SELECTOR = '#jp-MainLogo';

function applyLogo(
  logoElement: HTMLElement,
  contentType: string,
  text: string,
  url: string
): void {
  logoElement.innerHTML = '';

  if (contentType.includes('svg')) {
    // Inline SVG - matches default JupyterLab logo approach
    const container = document.createElement('div');
    container.innerHTML = text;
    const svg = container.querySelector('svg');
    if (svg) {
      svg.setAttribute('width', '16px');
      svg.setAttribute('height', 'auto');
      svg.style.margin = '2px 2px 2px 8px';
      logoElement.appendChild(svg);
    }
  } else {
    // Raster image fallback
    const img = document.createElement('img');
    img.src = url;
    img.alt = 'Logo';
    img.setAttribute('width', '16');
    img.setAttribute('height', 'auto');
    img.style.margin = '2px 2px 2px 8px';
    logoElement.appendChild(img);
  }
}

/**
 * Initialization data for the jupyterlab_custom_main_logo_extension extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab_custom_main_logo_extension:plugin',
  description: 'Replace JupyterLab main logo with custom image',
  autoStart: true,
  activate: async (app: JupyterFrontEnd) => {
    try {
      const config = await fetchLogoConfig();
      if (!config.logo_url) {
        return;
      }
      const content = await fetchLogoContent(config.logo_url);
      app.restored.then(() => {
        const el = document.querySelector(LOGO_SELECTOR) as HTMLElement;
        if (el) {
          applyLogo(el, content.contentType, content.text, content.url);
        }
      });
    } catch (e) {
      console.warn('[CustomMainLogo] Failed to load config:', e);
    }
  }
};

export default plugin;
