import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { fetchLogoConfig } from './handler';

const LOGO_SELECTOR = '#jp-MainLogo';

function applyLogo(logoUri: string): void {
  const logoElement = document.querySelector(LOGO_SELECTOR);
  if (!logoElement || !logoUri) {
    return;
  }

  logoElement.innerHTML = '';

  const img = document.createElement('img');
  img.src = logoUri;
  img.alt = 'Logo';
  img.style.maxHeight = '100%';
  img.style.maxWidth = '100%';
  logoElement.appendChild(img);
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
      if (config.logo_uri) {
        app.restored.then(() => applyLogo(config.logo_uri));
      }
    } catch (e) {
      console.warn('[CustomMainLogo] Failed to load config:', e);
    }
  }
};

export default plugin;
