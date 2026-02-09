import { URLExt } from '@jupyterlab/coreutils';
import { ServerConnection } from '@jupyterlab/services';

export interface ILogoConfig {
  logo_url: string;
}

export async function fetchLogoConfig(): Promise<ILogoConfig> {
  const settings = ServerConnection.makeSettings();
  const url = URLExt.join(
    settings.baseUrl,
    'jupyterlab-branding',
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
  // logoUrl may be a relative path - ensure it's a full URL
  let fullUrl = logoUrl;
  if (logoUrl.startsWith('/')) {
    fullUrl = URLExt.join(window.location.origin, logoUrl);
  }
  const response = await ServerConnection.makeRequest(fullUrl, {}, settings);
  if (!response.ok) {
    throw new Error(`Failed to fetch logo: ${response.status}`);
  }
  const contentType = response.headers.get('Content-Type') || '';
  const text = await response.text();
  return { contentType, text, url: fullUrl };
}
