import { API_BASE_URL } from '../config/env';

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

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers
    });
  } catch {
    throw new Error('Unable to connect to the server. Please check your internet connection.');
  }

  const payload = await parseJsonSafely(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, 'Something went wrong. Please try again.'));
  }

  return payload;
}
