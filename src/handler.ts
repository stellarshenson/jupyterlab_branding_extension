import { URLExt } from '@jupyterlab/coreutils';
import { ServerConnection } from '@jupyterlab/services';

export interface ILogoConfig {
  logo_uri: string;
}

export async function fetchLogoConfig(): Promise<ILogoConfig> {
  const settings = ServerConnection.makeSettings();
  const url = URLExt.join(
    settings.baseUrl,
    'jupyterlab-custom-main-logo',
    'config'
  );
  const response = await ServerConnection.makeRequest(url, {}, settings);
  if (!response.ok) {
    throw new Error(`Failed to fetch logo config: ${response.status}`);
  }
  return response.json();
}
