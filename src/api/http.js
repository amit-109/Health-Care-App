import { API_BASE_URL } from '../config/env';

let authToken = '';

const isLocalhostApi = /:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(API_BASE_URL);

export function setAuthToken(token) {
  authToken = token || '';
}

const parseResponseDetailed = async (response) => {
  const rawText = await response.text();
  const contentType = response.headers.get('content-type') || '';
  let payload = null;

  if (rawText && contentType.includes('application/json')) {
    try {
      payload = JSON.parse(rawText);
    } catch (e) {
      payload = null;
    }
  }

  return { payload, rawText, contentType };
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

  const fullUrl = `${API_BASE_URL}${path}`;

  // Prepare a safe preview of the body for logs
  let bodyPreview = options.body;
  try {
    if (options.body instanceof FormData) {
      bodyPreview = '[FormData]';
    } else if (typeof options.body === 'string') {
      try {
        bodyPreview = JSON.parse(options.body);
      } catch {
        bodyPreview = options.body;
      }
    } else if (typeof options.body === 'object' && options.body !== null) {
      bodyPreview = options.body;
    }
  } catch (e) {
    bodyPreview = '[unserializable body]';
  }

  try {
    console.log('[API REQUEST]', options.method || 'GET', fullUrl, { headers, body: bodyPreview });
  } catch {}

  try {
    response = await fetch(fullUrl, {
      ...options,
      headers
    });
  } catch (err) {
    if (isLocalhostApi) {
      throw new Error(
        'Unable to reach API at localhost. On a phone, use your computer IP address in EXPO_PUBLIC_API_BASE_URL.'
      );
    }

    throw new Error('Unable to connect to the server. Please check your internet connection.');
  }

  const { payload, rawText, contentType } = await parseResponseDetailed(response);

  // Log response details
  try {
    const headersObj = {};
    try {
      for (const [k, v] of response.headers.entries()) headersObj[k] = v;
    } catch {}
    console.log('[API RESPONSE]', response.status, response.statusText, fullUrl, { headers: headersObj, contentType, body: rawText });
  } catch {}

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, 'Something went wrong. Please try again.'));
  }

  return payload;
}
