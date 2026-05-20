import { API_BASE_URL } from '../config/env';

let authToken = '';

const isLocalhostApi = /:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(API_BASE_URL);

export function setAuthToken(token) {
  authToken = token || '';
}

const parseJsonSafely = async (response) => {
  const text = await response.text();

  if (!text) return null;

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const getErrorMessage = (payload, fallbackMessage) => {
  if (!payload) {
    return fallbackMessage;
  }

  if (typeof payload === 'string') {
    return payload;
  }

  return payload.message || payload.error || payload.details || payload.title || fallbackMessage;
};

export async function apiRequest(path, options = {}) {
  let response;
  const headers = {
    Accept: '*/*',
    ...(options.headers || {})
  };

  if (authToken && !headers.Authorization && !headers.authorization) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers
    });
  } catch {
    if (isLocalhostApi) {
      throw new Error(
        'Unable to reach API at localhost. On a phone, use your computer IP address in EXPO_PUBLIC_API_BASE_URL.'
      );
    }

    throw new Error('Unable to connect to the server. Please check your internet connection.');
  }

  const payload = await parseJsonSafely(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, 'Something went wrong. Please try again.'));
  }

  return payload;
}
