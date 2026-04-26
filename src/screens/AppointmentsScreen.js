import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { createPatientAppointment, extractAppointments, extractServices, getPatientAppointmentsByUser, getServices } from '../api/patient';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (n) => String(n).padStart(2, '0');

const toIso = (date) => {
  if (!date) return '';
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T00:00:00.000Z`;
};

const parseDateValue = (value) => {
  if (!value) return new Date();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const parseTimeValue = (value) => {
  const base = new Date();
  base.setSeconds(0, 0);

  if (!value) {
    base.setHours(10, 0, 0, 0);
    return base;
  }

  const match = value.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) {
    base.setHours(10, 0, 0, 0);
    return base;
  }

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3].toUpperCase();

  if (meridiem === 'PM' && hour !== 12) hour += 12;
  if (meridiem === 'AM' && hour === 12) hour = 0;

  base.setHours(hour, minute, 0, 0);
  return base;
};

const formatDisplay = (isoStr) => {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return isoStr;
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};

const formatTimeDisplay = (value) => {
  const date = typeof value === 'string' ? parseTimeValue(value) : value;
  const hours24 = date.getHours();
  const hours12 = hours24 % 12 || 12;
  const minutes = pad(date.getMinutes());
  const meridiem = hours24 >= 12 ? 'PM' : 'AM';
  return `${pad(hours12)}:${minutes} ${meridiem}`;
};

const buildSlotTimeRange = (startTime, endTime) => {
  if (!startTime || !endTime) return '';
  return `${startTime} - ${endTime}`;
};

const formatAppointmentCard = (booking, serviceLabel) => {
  const appointmentDate = booking.appointmentDate ? new Date(booking.appointmentDate) : null;
  const validDate = appointmentDate && !Number.isNaN(appointmentDate.getTime()) ? appointmentDate : null;
  return {
    id: `BOOK-${Date.now()}`,
    type: booking.diseaseName || serviceLabel || 'Booked Visit',
    date: validDate ? validDate.toISOString().slice(0, 10) : 'Pending',
    time: booking.slotTime || 'Pending',
    doctor: booking.doctorPrescription || 'To be assigned',
    status: 'Pending'
  };
};

function DateField({ label, value, onChange, disabled }) {
  const [showIosPicker, setShowIosPicker] = useState(false);
  const minimumDate = new Date();
  minimumDate.setHours(0, 0, 0, 0);

  const openPicker = () => {
    if (disabled) return;

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: parseDateValue(value),
        mode: 'date',
        minimumDate,
        onChange: (_, selectedDate) => {
          if (selectedDate) onChange(toIso(selectedDate));
        }
      });
      return;
    }

    setShowIosPicker((current) => !current);
  };

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity disabled={disabled} style={styles.pickerButton} onPress={openPicker}>
        <MaterialIcons name="calendar-today" size={18} color="#4f7cff" />
        <Text style={[styles.pickerText, !value && styles.placeholderText]}>
          {value ? formatDisplay(value) : 'Select date'}
        </Text>
        <MaterialIcons name={showIosPicker ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} size={20} color="#66708a" />
      </TouchableOpacity>
      {Platform.OS === 'ios' && showIosPicker ? (
        <View style={styles.nativePickerWrap}>
          <DateTimePicker
            value={parseDateValue(value)}
            mode="date"
            display="spinner"
            minimumDate={minimumDate}
            onChange={(_, selectedDate) => {
              if (selectedDate) onChange(toIso(selectedDate));
            }}
          />
        </View>
      ) : null}
    </View>
  );
}

function TimeField({ label, value, onChange, disabled }) {
  const [showIosPicker, setShowIosPicker] = useState(false);

  const openPicker = () => {
    if (disabled) return;

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: parseTimeValue(value),
        mode: 'time',
        is24Hour: false,
        onChange: (_, selectedDate) => {
          if (selectedDate) onChange(formatTimeDisplay(selectedDate));
        }
      });
      return;
    }

    setShowIosPicker((current) => !current);
  };

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity disabled={disabled} style={styles.pickerButton} onPress={openPicker}>
        <MaterialIcons name="access-time" size={18} color="#4f7cff" />
        <Text style={[styles.pickerText, !value && styles.placeholderText]}>
          {value || 'Select time'}
        </Text>
        <MaterialIcons name={showIosPicker ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} size={20} color="#66708a" />
      </TouchableOpacity>
      {Platform.OS === 'ios' && showIosPicker ? (
        <View style={styles.nativePickerWrap}>
          <DateTimePicker
            value={parseTimeValue(value)}
            mode="time"
            display="spinner"
            onChange={(_, selectedDate) => {
              if (selectedDate) onChange(formatTimeDisplay(selectedDate));
            }}
          />
          <View style={styles.timePreview}>
            <MaterialIcons name="access-time" size={16} color="#4f7cff" />
            <Text style={styles.timePreviewText}>{formatTimeDisplay(value || parseTimeValue('10:00 AM'))}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

export default function AppointmentsScreen({ user, onAppointmentCreated }) {
  const { width } = useWindowDimensions();
  const compact = width < 380;

  const [view, setView] = useState('list');
  const [formTab, setFormTab] = useState(0);
  const [appointments, setAppointments] = useState([]);
  const [apptLoading, setApptLoading] = useState(true);
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [serviceMenuOpen, setServiceMenuOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [diseaseName, setDiseaseName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [noOfDays, setNoOfDays] = useState('1');
  const [dischargeDate, setDischargeDate] = useState('');
  const [doctorPrescription, setDoctorPrescription] = useState('');
  const [staffId, setStaffId] = useState('0');
  const [diseaseImage, setDiseaseImage] = useState(null);

  useEffect(() => {
    let active = true;
    const loadAll = async () => {
      if (!user?.id) {
        if (active) {
          setAppointments([]);
          setApptLoading(false);
          setServicesLoading(false);
          setError('Unable to load appointments for this user.');
        }
        return;
      }

      try {
        const [apptPayload, svcPayload] = await Promise.all([getPatientAppointmentsByUser(user.id), getServices()]);
        if (active) {
          setAppointments(extractAppointments(apptPayload));
          setServices(extractServices(svcPayload));
        }
      } catch (e) {
        if (active) setError(e.message || 'Unable to load data.');
      } finally {
        if (active) {
          setApptLoading(false);
          setServicesLoading(false);
        }
      }
    };

    loadAll();
    return () => {
      active = false;
    };
  }, [user?.id]);

  const selectedService = useMemo(
    () => services.find((s) => String(s.id || s.serviceId || s.ServiceId) === String(selectedServiceId)),
    [selectedServiceId, services]
  );

  const selectedServiceLabel =
    selectedService?.serviceName || selectedService?.name || selectedService?.ServiceName ||
    (selectedServiceId ? `Service #${selectedServiceId}` : 'Select service');

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setError('Permission to access photos is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8
    });

    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setDiseaseImage({ uri: asset.uri, name: asset.fileName || 'disease-image.jpg', type: asset.mimeType || 'image/jpeg' });
    }
  };

  const resetForm = () => {
    setSelectedServiceId('');
    setDiseaseName('');
    setStartTime('');
    setEndTime('');
    setAppointmentDate('');
    setNoOfDays('1');
    setDischargeDate('');
    setDoctorPrescription('');
    setStaffId('0');
    setServiceMenuOpen(false);
    setDiseaseImage(null);
    setError('');
    setFormTab(0);
  };

  const validateTimeRange = () => {
    if (!startTime.trim() || !endTime.trim()) {
      setError('Please select both start time and end time.');
      return false;
    }

    const start = parseTimeValue(startTime);
    const end = parseTimeValue(endTime);

    if (end <= start) {
      setError('End time must be after start time.');
      return false;
    }

    return true;
  };

  const handleBook = async () => {
    setError('');

    if (!selectedServiceId || !diseaseName.trim() || !appointmentDate.trim()) {
      setError('Please select a service and fill the required fields.');
      return;
    }

    if (!validateTimeRange()) {
      return;
    }

    const slotTime = buildSlotTimeRange(startTime.trim(), endTime.trim());

    setLoading(true);
    try {
      await createPatientAppointment({
        userId: user?.id || 0,
        diseaseName: diseaseName.trim(),
        slotTime,
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        appointmentDate: appointmentDate.trim(),
        noOfDays: Number(noOfDays) || 0,
        serviceId: Number(selectedServiceId),
        dischargeDate: dischargeDate.trim() || appointmentDate.trim(),
        doctorPrescription: doctorPrescription.trim(),
        staffId: Number(staffId) || 0,
        diseaseImage
      });

      const card = formatAppointmentCard({ diseaseName, slotTime, appointmentDate, doctorPrescription }, selectedServiceLabel);
      setAppointments((prev) => [card, ...prev]);
      onAppointmentCreated(card);
      resetForm();
      setView('list');
    } catch (e) {
      setError(e.message || 'Unable to book appointment.');
    } finally {
      setLoading(false);
    }
  };

  if (view === 'list') {
    return (
      <ScrollView style={styles.page} contentContainerStyle={[styles.content, compact && styles.contentCompact]} showsVerticalScrollIndicator={false}>
        <View style={styles.listHeader}>
          <Text style={[styles.title, compact && styles.titleCompact]}>My Appointments</Text>
          <TouchableOpacity style={styles.bookBtn} onPress={() => setView('form')}>
            <MaterialIcons name="add" size={18} color="#fff" />
            <Text style={styles.bookBtnText}>Book Appointment</Text>
          </TouchableOpacity>
        </View>

        {apptLoading ? (
          <ActivityIndicator color="#4f7cff" style={{ marginTop: 32 }} />
        ) : appointments.length ? (
          appointments.map((item) => (
            <View key={item.id} style={[styles.card, compact && styles.cardCompact]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIconWrap}>
                  <MaterialIcons name="event-note" size={20} color="#4f7cff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.type}</Text>
                  <Text style={styles.cardSub}>{item.doctor}</Text>
                </View>
                <Text style={[styles.status, item.status === 'Confirmed' ? styles.confirmed : styles.pending]}>{item.status}</Text>
              </View>
              <View style={styles.cardFooter}>
                <MaterialIcons name="calendar-today" size={13} color="#8a91a7" />
                <Text style={styles.cardMeta}>  {item.date}</Text>
                <MaterialIcons name="access-time" size={13} color="#8a91a7" style={{ marginLeft: 10 }} />
                <Text style={styles.cardMeta}>  {item.time}</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={[styles.emptyCard, compact && styles.cardCompact]}>
            <MaterialIcons name="event-busy" size={40} color="#c5cbe8" />
            <Text style={styles.emptyTitle}>No appointments yet</Text>
            <Text style={styles.emptyHint}>Tap "Book Appointment" to schedule your first visit.</Text>
          </View>
        )}
      </ScrollView>
    );
  }

  const TABS = ['Basic Info', 'Schedule'];

  const handleNext = () => {
    if (!selectedServiceId || !diseaseName.trim()) {
      setError('Please select a service and enter a disease/reason.');
      return;
    }
    setError('');
    setFormTab(1);
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={[styles.content, compact && styles.contentCompact]} showsVerticalScrollIndicator={false}>
      <View style={styles.formHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => { resetForm(); setView('list'); }}>
          <MaterialIcons name="arrow-back-ios" size={18} color="#4f7cff" />
        </TouchableOpacity>
        <Text style={[styles.title, { marginBottom: 0 }]}>Book Appointment</Text>
      </View>

      <View style={styles.tabBar}>
        {TABS.map((label, i) => (
          <TouchableOpacity
            key={label}
            style={[styles.tabItem, formTab === i && styles.tabItemActive]}
            onPress={() => { setError(''); setFormTab(i); }}
          >
            <Text style={[styles.tabLabel, formTab === i && styles.tabLabelActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.formCard, compact && styles.cardCompact]}>
        {formTab === 0 ? (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Service *</Text>
              <TouchableOpacity
                disabled={servicesLoading || loading}
                style={styles.dropdownButton}
                onPress={() => setServiceMenuOpen((p) => !p)}
              >
                <Text style={[styles.dropdownText, !selectedServiceId && styles.placeholderText]}>
                  {servicesLoading ? 'Loading services...' : selectedServiceLabel}
                </Text>
                <MaterialIcons name={serviceMenuOpen ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} size={20} color="#66708a" />
              </TouchableOpacity>
              {serviceMenuOpen && !servicesLoading ? (
                <View style={styles.dropdownMenu}>
                  {services.length ? services.map((s) => {
                    const sid = String(s.id || s.serviceId || s.ServiceId);
                    const lbl = s.serviceName || s.name || s.ServiceName || `Service #${sid}`;
                    return (
                      <TouchableOpacity key={sid} style={styles.dropdownItem} onPress={() => { setSelectedServiceId(sid); setServiceMenuOpen(false); }}>
                        <Text style={styles.dropdownItemText}>{`${lbl} (${sid})`}</Text>
                      </TouchableOpacity>
                    );
                  }) : <Text style={styles.emptyText}>No services available.</Text>}
                </View>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Disease / Reason *</Text>
              <TextInput style={styles.input} placeholder="Enter disease name" value={diseaseName} onChangeText={setDiseaseName} editable={!loading} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Doctor Prescription (optional)</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="Optional notes"
                value={doctorPrescription}
                onChangeText={setDoctorPrescription}
                editable={!loading}
                multiline
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Disease Image (optional)</Text>
              <TouchableOpacity style={styles.imagePicker} onPress={pickImage} disabled={loading}>
                {diseaseImage ? (
                  <Image source={{ uri: diseaseImage.uri }} style={styles.imagePreview} resizeMode="cover" />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <MaterialIcons name="add-a-photo" size={28} color="#4f7cff" />
                    <Text style={styles.imagePlaceholderText}>Tap to upload image</Text>
                  </View>
                )}
              </TouchableOpacity>
              {diseaseImage ? (
                <TouchableOpacity style={styles.removeImage} onPress={() => setDiseaseImage(null)}>
                  <MaterialIcons name="close" size={14} color="#fff" />
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Staff ID</Text>
              <TextInput style={styles.input} placeholder="0" value={staffId} onChangeText={setStaffId} editable={!loading} keyboardType="numeric" />
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity style={styles.submitBtn} onPress={handleNext}>
              <Text style={styles.submitBtnText}>Next: Schedule</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <DateField label="Appointment Date *" value={appointmentDate} onChange={setAppointmentDate} disabled={loading} />
            <TimeField label="Start Time *" value={startTime} onChange={setStartTime} disabled={loading} />
            <TimeField label="End Time *" value={endTime} onChange={setEndTime} disabled={loading} />
            {startTime && endTime ? (
              <View style={styles.rangeSummary}>
                <MaterialIcons name="schedule" size={16} color="#4f7cff" />
                <Text style={styles.rangeSummaryText}>{buildSlotTimeRange(startTime, endTime)}</Text>
              </View>
            ) : null}
            <DateField label="Discharge Date" value={dischargeDate} onChange={setDischargeDate} disabled={loading} />

            <View style={styles.inputGroup}>
              <Text style={styles.label}>No. of Days</Text>
              <TextInput style={styles.input} placeholder="1" value={noOfDays} onChangeText={setNoOfDays} editable={!loading} keyboardType="numeric" />
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity disabled={loading || servicesLoading} style={[styles.submitBtn, (loading || servicesLoading) && styles.btnDisabled]} onPress={handleBook}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Confirm Booking</Text>}
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f5f7ff' },
  content: { padding: 16, paddingBottom: 32 },
  contentCompact: { padding: 12 },

  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '800', color: '#232b42', marginBottom: 14 },
  titleCompact: { fontSize: 19 },

  bookBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4f7cff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9, gap: 4 },
  bookBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  card: { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 12, shadowColor: '#2f3a4a', shadowOpacity: 0.06, shadowRadius: 12, elevation: 5 },
  cardCompact: { padding: 13 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  cardIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1f2d55' },
  cardSub: { fontSize: 12, color: '#6b7591', marginTop: 2 },
  status: { fontSize: 11, fontWeight: '700', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10, color: '#fff', alignSelf: 'flex-start' },
  confirmed: { backgroundColor: '#4f7cff' },
  pending: { backgroundColor: '#f8b334' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f0f2fa', paddingTop: 10 },
  cardMeta: { fontSize: 12, color: '#8a91a7' },

  emptyCard: { backgroundColor: '#fff', borderRadius: 18, padding: 32, alignItems: 'center', shadowColor: '#2f3a4a', shadowOpacity: 0.05, shadowRadius: 10, elevation: 4 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#3a4060', marginTop: 12 },
  emptyHint: { fontSize: 13, color: '#8a91a7', textAlign: 'center', marginTop: 6, lineHeight: 19 },

  formHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  backBtn: { padding: 4 },

  tabBar: { flexDirection: 'row', backgroundColor: '#eef2ff', borderRadius: 14, padding: 4, marginBottom: 16 },
  tabItem: { flex: 1, paddingVertical: 9, borderRadius: 11, alignItems: 'center' },
  tabItemActive: { backgroundColor: '#4f7cff', shadowColor: '#4f7cff', shadowOpacity: 0.25, shadowRadius: 6, elevation: 3 },
  tabLabel: { fontSize: 13, fontWeight: '600', color: '#6b7aaa' },
  tabLabelActive: { color: '#fff' },

  formCard: { backgroundColor: '#fff', borderRadius: 20, padding: 18, shadowColor: '#2f3a4a', shadowOpacity: 0.06, shadowRadius: 14, elevation: 6 },

  inputGroup: { marginBottom: 14 },
  label: { fontSize: 13, color: '#5a5f6e', marginBottom: 7, fontWeight: '600' },
  input: { backgroundColor: '#f3f5ff', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1f2540' },
  multilineInput: { minHeight: 80, textAlignVertical: 'top' },

  pickerButton: { backgroundColor: '#f3f5ff', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  pickerText: { flex: 1, fontSize: 15, color: '#1f2540' },
  placeholderText: { color: '#8a91a7' },
  nativePickerWrap: { marginTop: 10, borderWidth: 1, borderColor: '#e6ebff', borderRadius: 18, overflow: 'hidden', backgroundColor: '#fff' },
  timePreview: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#eef2ff' },
  timePreviewText: { fontSize: 18, fontWeight: '700', color: '#1f2d55' },
  rangeSummary: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#eef4ff', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14 },
  rangeSummaryText: { color: '#24408f', fontSize: 14, fontWeight: '700' },

  dropdownButton: { backgroundColor: '#f3f5ff', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dropdownText: { flex: 1, color: '#1f2540', fontSize: 15, paddingRight: 8 },
  dropdownMenu: { backgroundColor: '#fff', borderRadius: 14, marginTop: 8, borderWidth: 1, borderColor: '#e6ebff', overflow: 'hidden' },
  dropdownItem: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eef2ff' },
  dropdownItemText: { color: '#243156', fontSize: 14 },

  submitBtn: { marginTop: 8, backgroundColor: '#4f7cff', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  btnDisabled: { opacity: 0.75 },

  emptyText: { color: '#707995', fontSize: 13, padding: 12 },
  error: { color: '#c94a59', marginTop: 4, marginBottom: 6, fontSize: 12 },

  imagePicker: { borderRadius: 14, overflow: 'hidden', borderWidth: 1.5, borderColor: '#d0d8ff', borderStyle: 'dashed', backgroundColor: '#f3f5ff' },
  imagePlaceholder: { height: 110, alignItems: 'center', justifyContent: 'center', gap: 8 },
  imagePlaceholderText: { fontSize: 13, color: '#6b7aaa', fontWeight: '500' },
  imagePreview: { width: '100%', height: 160 },
  removeImage: { position: 'absolute', top: 8, right: 8, backgroundColor: '#e05c6a', borderRadius: 12, padding: 4 }
});
