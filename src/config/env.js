import Constants from 'expo-constants';

const env = (Constants.expoConfig && Constants.expoConfig.extra) || (Constants.manifest && Constants.manifest.extra) || {};
const rawApiUrl = env.EXPO_PUBLIC_API_BASE_URL || '';
let configuredApiBaseUrl = rawApiUrl;
while (configuredApiBaseUrl.endsWith('/')) {
  configuredApiBaseUrl = configuredApiBaseUrl.slice(0, -1);
}

// Use a default or warn if not configured
if (!configuredApiBaseUrl) {
  console.warn('[ENV WARNING] EXPO_PUBLIC_API_BASE_URL is not configured. API requests will fail. Set it in .env or EAS build environment.');
  configuredApiBaseUrl = 'https://api.homecarenursing.cloud/api';
}

export const API_BASE_URL = configuredApiBaseUrl;

export function normalizeImageUri(uri) {
  if (!uri) return null;
  const value = typeof uri === 'object' && uri.uri ? uri.uri : String(uri).trim();
  if (!value) return null;

  if (/^http:\/\//i.test(value)) {
    return `https://${value.slice(7)}`;
  }
  if (/^\/\//.test(value)) {
    return `https:${value}`;
  }
  if (/^https?:\/\//i.test(value)) {
    return value;
  }
  if (/^(file|content|data|blob):/i.test(value)) {
    return value;
  }
  if (value.startsWith('/')) {
    return `${API_BASE_URL}${value}`;
  }
  return `${API_BASE_URL}/${value}`;
}

export function withImageCacheBuster(uri, version) {
  const normalized = normalizeImageUri(uri);
  if (!normalized || !version || normalized.startsWith('file:')) return normalized;
  const separator = normalized.includes('?') ? '&' : '?';
  return `${normalized}${separator}v=${encodeURIComponent(String(version))}`;
}

console.log('[API CONFIG] EXPO_PUBLIC_API_BASE_URL from extra:', env.EXPO_PUBLIC_API_BASE_URL);
console.log('[API CONFIG] Configured API_BASE_URL:', API_BASE_URL);
console.log('[API CONFIG] Using normalizeImageUri to resolve image URIs');
