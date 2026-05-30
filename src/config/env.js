import Constants from 'expo-constants';

const env = (Constants.expoConfig && Constants.expoConfig.extra) || (Constants.manifest && Constants.manifest.extra) || {};
const rawApiUrl = env.EXPO_PUBLIC_API_BASE_URL || '';
let configuredApiBaseUrl = rawApiUrl;
while (configuredApiBaseUrl.endsWith('/')) {
  configuredApiBaseUrl = configuredApiBaseUrl.slice(0, -1);
}

if (!configuredApiBaseUrl) {
  throw new Error('EXPO_PUBLIC_API_BASE_URL is required in your .env file and must be exposed via app.config.js.');
}

export const API_BASE_URL = configuredApiBaseUrl;
console.log('[API CONFIG] API_BASE_URL =', API_BASE_URL);
