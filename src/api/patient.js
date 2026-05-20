import { apiRequest } from './http';

const formatDateTime = (value) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString();
};

const appendFormValue = (formData, key, value) => {
  if (value === undefined || value === null || value === '') {
    return;
  }

  formData.append(key, value);
};

export async function getServices() {
  return apiRequest('/api/Service', {
    method: 'GET'
  });
}

export async function getAvailableStaff(date, slot) {
  const params = new URLSearchParams({
    date,
    slot
  });

  return apiRequest(`/api/staff/available?${params.toString()}`, {
    method: 'GET'
  });
}

export async function createPatientAppointment(data) {
  const formData = new FormData();

  appendFormValue(formData, 'UserId', String(data.userId ?? 0));
  appendFormValue(formData, 'DiseaseName', data.diseaseName);
  appendFormValue(formData, 'SlotTime', data.slotTime);
  appendFormValue(formData, 'AppointmentDate', formatDateTime(data.appointmentDate));
  appendFormValue(formData, 'NoOfDays', String(data.noOfDays ?? 0));
  appendFormValue(formData, 'ServiceId', String(data.serviceId ?? 0));
  appendFormValue(formData, 'DischargeDate', formatDateTime(data.dischargeDate));
  appendFormValue(formData, 'DoctorPrescription', data.doctorPrescription);
  appendFormValue(formData, 'Latitude', data.latitude);
  appendFormValue(formData, 'Longitude', data.longitude);
  appendFormValue(formData, 'StaffId', String(data.staffId ?? 0));

  if (data.diseaseImage?.uri) {
    formData.append('DiseaseImage', {
      uri: data.diseaseImage.uri,
      name: data.diseaseImage.name || 'disease-image.jpg',
      type: data.diseaseImage.type || 'image/jpeg'
    });
  }

  if (data.doctorPrescriptionImage?.uri) {
    formData.append('DoctorPrescriptionImage', {
      uri: data.doctorPrescriptionImage.uri,
      name: data.doctorPrescriptionImage.name || 'doctor-prescription-image.jpg',
      type: data.doctorPrescriptionImage.type || 'image/jpeg'
    });
  }

  return apiRequest('/api/patient', {
    method: 'POST',
    headers: {
      Accept: '*/*'
    },
    body: formData
  });
}

export async function getPatientAppointmentsByUser(userId) {
  return apiRequest(`/api/patient/user/${userId}`, { method: 'GET' });
}

export function extractAppointments(payload) {
  const list = Array.isArray(payload) ? payload
    : Array.isArray(payload?.data) ? payload.data
    : Array.isArray(payload?.result) ? payload.result
    : [];

  return list.map((a) => {
    const d = a.appointmentDate ? new Date(a.appointmentDate) : null;
    const validDate = d && !Number.isNaN(d.getTime()) && d.getFullYear() > 100;
    const startTime = a.startTime || a.StartTime || '';
    const endTime = a.endTime || a.EndTime || '';
    const slotTime = a.slotTime || a.SlotTime || (startTime && endTime ? `${startTime} - ${endTime}` : '');
    return {
      id: `APPT-${a.id}`,
      type: a.diseaseName || 'Booked Visit',
      date: validDate ? d.toISOString().slice(0, 10) : 'Pending',
      time: slotTime || 'Pending',
      doctor: a.doctorPrescription || 'To be assigned',
      status: a.status || 'Pending',
      diseaseImageUrl: a.diseaseImageUrl || null
    };
  });
}

export function extractServices(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.result)) {
    return payload.result;
  }

  return [];
}

export function extractAvailableStaff(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.result)) {
    return payload.result;
  }

  if (Array.isArray(payload?.staff)) {
    return payload.staff;
  }

  if (Array.isArray(payload?.staffs)) {
    return payload.staffs;
  }

  return [];
}
