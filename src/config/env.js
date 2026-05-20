const DEFAULT_API_BASE_URL = 'https://patientbookingsystem.onrender.com';
const configuredApiBaseUrl = (process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, '');

export const API_BASE_URL = /:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(configuredApiBaseUrl)
  ? DEFAULT_API_BASE_URL
  : configuredApiBaseUrl;
