import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { fetchLogoConfig, fetchLogoContent } from './handler';

const LOGO_SELECTOR = '#jp-MainLogo';

export function applyLogo(
  logoElement: HTMLElement,
  contentType: string,
  text: string,
  url: string
): void {
  logoElement.innerHTML = '';

  // Let logo fill the entire tile area
  logoElement.style.display = 'flex';
  logoElement.style.alignItems = 'center';
  logoElement.style.justifyContent = 'center';
  logoElement.style.padding = '0';
  logoElement.style.boxSizing = 'border-box';

  if (contentType.includes('svg')) {
    const container = document.createElement('div');
    container.innerHTML = text;
    const svg = container.querySelector('svg');
    if (svg) {
      svg.style.display = 'block';
      svg.style.width = 'auto';
      svg.style.height = 'auto';
      svg.style.margin = '6px';
      logoElement.appendChild(svg);
    }
  } else {
    const img = document.createElement('img');
    img.src = url;
    img.alt = 'Logo';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'contain';
    logoElement.appendChild(img);
  }
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
      console.warn('[Branding] Failed to load config:', e);
    }
  }
};

export default plugin;
