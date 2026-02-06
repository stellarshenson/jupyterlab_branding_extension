import { URLExt } from '@jupyterlab/coreutils';
import { ServerConnection } from '@jupyterlab/services';

export interface ILogoConfig {
  logo_url: string;
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

export interface ILogoContent {
  contentType: string;
  text: string;
  url: string;
}

export async function fetchLogoContent(logoUrl: string): Promise<ILogoContent> {
  const settings = ServerConnection.makeSettings();
  const response = await ServerConnection.makeRequest(logoUrl, {}, settings);
  if (!response.ok) {
    throw new Error(`Failed to fetch logo: ${response.status}`);
  }
  const contentType = response.headers.get('Content-Type') || '';
  const text = await response.text();
  return { contentType, text, url: logoUrl };
}
