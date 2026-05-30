import { apiRequest } from './http';

const getList = (value) => (Array.isArray(value) ? value : []);

const STATUS_LABELS = {
  0: 'Pending',
  1: 'Approved',
  2: 'Cancelled',
  3: 'Completed'
};

export async function getPatientDashboard() {
  return apiRequest('/patient-dashboard', {
    method: 'GET'
  });
}

export function getAppointmentStatusLabel(status) {
  return STATUS_LABELS[status] || String(status || 'Pending');
}

export function extractPatientDashboard(payload) {
  const data = payload?.data || payload?.result || payload || {};

  return {
    userSummary: data.userSummary || {},
    upcomingAppointment: data.upcomingAppointment || null,
    services: getList(data.services),
    staffs: getList(data.staffs),
    recentAppointments: getList(data.recentAppointments),
    lastAppointment: data.lastAppointment || null
  };
}
