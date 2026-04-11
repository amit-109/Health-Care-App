export const defaultUser = {
  name: 'Rahul ',
  fullName: 'Rahul Kumar',
  email: 'patient@demo.com',
  phone: '+91 98765 43210',
  password: 'patient123',
  address: 'Pin code 800001',
  age: 31,
  gender: 'Male',
  bloodGroup: 'O+',
  city: 'Delhi',
  lastVisit: '2026-04-05',
  nextAppointment: '2026-04-26',
  message: 'Your doctor is ready for follow-up and your health summary is updated.'
};

export const appointments = [
  {
    id: 'APPT-001',
    type: 'General Checkup',
    date: '2026-04-26',
    time: '10:00 AM',
    doctor: 'Dr. Meera Singh',
    status: 'Confirmed'
  },
  {
    id: 'APPT-002',
    type: 'Cardiology Review',
    date: '2026-05-09',
    time: '03:30 PM',
    doctor: 'Dr. Rajesh Patel',
    status: 'Pending'
  },
  {
    id: 'APPT-003',
    type: 'Nutrition Counseling',
    date: '2026-05-20',
    time: '11:15 AM',
    doctor: 'Dr. Neha Verma',
    status: 'Confirmed'
  }
];

export const prescriptions = [
  {
    id: 'RX-101',
    title: 'Blood Pressure Control',
    date: '2026-04-05',
    medicine: 'Atenolol 50mg',
    notes: 'After breakfast, once daily'
  },
  {
    id: 'RX-102',
    title: 'Vitamin Support',
    date: '2026-03-30',
    medicine: 'Multivitamin',
    notes: 'Take with water after lunch'
  },
  {
    id: 'RX-103',
    title: 'Digestive Care',
    date: '2026-04-10',
    medicine: 'Probiotic Tablets',
    notes: 'Twice daily for 7 days'
  }
];
