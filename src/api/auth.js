import { apiRequest } from './http';

const normalizePhone = (value = '') => value.replace(/\D/g, '');
const normalizePinCode = (value = '') => value.replace(/\D/g, '');

export async function registerUser(data) {
  return apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: data.name,
      email: data.email,
      phoneNumber: normalizePhone(data.phoneNumber),
      pinCode: normalizePinCode(data.pinCode || data.pincode),
      password: data.password,
      gender: data.gender,
      address: data.address,
      landmark: data.landmark,
      houseNumber: data.houseNumber,
      role: data.role || 'patient'
    })
  });
}

export async function loginWithPassword({ emailOrPhone, password }) {
  return apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      emailOrPhone: emailOrPhone.includes('@') ? emailOrPhone.trim().toLowerCase() : normalizePhone(emailOrPhone),
      password
    })
  });
}

export async function sendLoginOtp({ phoneNumber }) {
  return apiRequest('/api/auth/login/send-otp', {
    method: 'POST',
    body: JSON.stringify({
      phoneNumber: normalizePhone(phoneNumber)
    })
  });
}

export async function verifyLoginOtp({ phoneNumber, otp }) {
  return apiRequest('/api/auth/login/verify-otp', {
    method: 'POST',
    body: JSON.stringify({
      phoneNumber: normalizePhone(phoneNumber),
      otp: otp.trim()
    })
  });
}

export async function verifySignupOtp({ phoneNumber, otp }) {
  return apiRequest('/api/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({
      phoneNumber: normalizePhone(phoneNumber),
      otp: otp.trim()
    })
  });
}

export function getAuthPayloadData(payload) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  return payload.data || payload.result || payload.user || payload;
}

export function extractAuthToken(payload) {
  const source = getAuthPayloadData(payload) || payload;

  if (!source || typeof source !== 'object') {
    return '';
  }

  return source.token || source.accessToken || source.jwt || '';
}

export function extractUser(payload) {
  const source = getAuthPayloadData(payload) || {};
  const user = source.user || source.patient || source.profile || source;

  if (!user || typeof user !== 'object') {
    return null;
  }

  return user;
}
