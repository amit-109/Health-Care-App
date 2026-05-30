import { apiRequest } from './http';

const normalizePhone = (value = '') => value.replace(/\D/g, '');
const normalizePinCode = (value = '') => value.replace(/\D/g, '');

const appendIfPresent = (params, key, value) => {
  if (value !== undefined && value !== null) {
    params.append(key, String(value));
  }
};

const appendProfileImage = (formData, image) => {
  if (!image) return;

  if (typeof Blob !== 'undefined' && image instanceof Blob) {
    formData.append('UserProfileImageUrl', image);
    return;
  }

  if (typeof image === 'object' && image.uri) {
    const name = image.name || image.fileName || image.uri.split('/').pop() || 'profile.jpg';
    const type = image.mimeType || image.type || 'image/jpeg';

    formData.append('UserProfileImageUrl', {
      uri: image.uri,
      name,
      type
    });
  }
};

export async function updateUserProfile(id, data) {
  const params = new URLSearchParams();
  const formData = new FormData();

  appendIfPresent(params, 'Name', data.name);
  appendIfPresent(params, 'Email', data.email);
  appendIfPresent(params, 'PhoneNumber', normalizePhone(data.phoneNumber || data.phone || ''));
  appendIfPresent(params, 'Address', data.address);
  appendIfPresent(params, 'Landmark', data.landmark || '');
  appendIfPresent(params, 'HouseNumber', data.houseNumber);
  appendIfPresent(params, 'PinCode', normalizePinCode(data.pinCode || data.pincode || ''));
  appendIfPresent(params, 'Gender', data.gender);
  appendIfPresent(params, 'Email', data.email);
  if (data.isActive !== undefined) appendIfPresent(params, 'IsActive', data.isActive);
  appendProfileImage(formData, data.userProfileImageUrl || data.profileImage);

  return apiRequest(`/api/users/${id}?${params.toString()}`, {
    method: 'PUT',
    body: formData
  });
}

export async function registerUser(data) {
  const params = new URLSearchParams();
  const formData = new FormData();

  appendIfPresent(params, 'Name', data.name);
  appendIfPresent(params, 'Email', data.email);
  appendIfPresent(params, 'PhoneNumber', normalizePhone(data.phoneNumber));
  appendIfPresent(params, 'PinCode', normalizePinCode(data.pinCode || data.pincode));
  appendIfPresent(params, 'Password', data.password);
  appendIfPresent(params, 'Address', data.address);
  appendIfPresent(params, 'Landmark', data.landmark || '');
  appendIfPresent(params, 'HouseNumber', data.houseNumber);
  appendIfPresent(params, 'Role', data.role || 'patient');
  appendIfPresent(params, 'Gender', data.gender);
  appendProfileImage(formData, data.userProfileImageUrl || data.profileImage || data.profileImageFile);

  return apiRequest(`/auth/register?${params.toString()}`, {
    method: 'POST',
    body: formData
  });
}

export async function loginWithPassword({ emailOrPhone, password }) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      emailOrPhone: emailOrPhone.includes('@') ? emailOrPhone.trim().toLowerCase() : normalizePhone(emailOrPhone),
      password
    })
  });
}

export async function sendLoginOtp({ phoneNumber }) {
  return apiRequest('/auth/login/send-otp', {
    method: 'POST',
    body: JSON.stringify({
      phoneNumber: normalizePhone(phoneNumber)
    })
  });
}

export async function verifyLoginOtp({ phoneNumber, otp }) {
  return apiRequest('/auth/login/verify-otp', {
    method: 'POST',
    body: JSON.stringify({
      phoneNumber: normalizePhone(phoneNumber),
      otp: otp.trim()
    })
  });
}

export async function verifySignupOtp({ phoneNumber, otp }) {
  return apiRequest('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({
      phoneNumber: normalizePhone(phoneNumber),
      otp: otp.trim()
    })
  });
}

export async function fetchUserProfile(userId) {
  return apiRequest(`/api/users/${userId}`, {
    method: 'GET'
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
