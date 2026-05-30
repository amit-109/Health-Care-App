import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  RefreshControl,
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
import { C } from '../config/theme';
import * as Location from 'expo-location';
import {
  createPatientAppointment,
  extractAppointments,
  extractAvailableStaff,
  extractServices,
  getAvailableStaff,
  getPatientAppointmentsByUser,
  getServices
} from '../api/patient';
import AppointmentMapPicker from '../components/AppointmentMapPicker';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (n) => String(n).padStart(2, '0');
const DEFAULT_MAP_REGION = {
  latitude: 28.6139,
  longitude: 77.209,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08
};

const SERVICE_TYPES = [
  { id: 'full', title: 'Full Time Services', subtitle: 'Fulltime Service' },
  { id: 'day', title: 'Day Care', subtitle: 'DayCare Service' }
];

const APPOINTMENT_STATUS_STYLES = {
  Pending: { bg: '#fff3d6', text: '#9a6400', icon: '#f59e0b' },
  Approved: { bg: '#e7efff', text: '#214ab3', icon: '#1c35ff' },
  Confirmed: { bg: '#e7efff', text: '#214ab3', icon: '#1c35ff' },
  Completed: { bg: '#e5f8ee', text: '#247a49', icon: '#149688' },
  Cancelled: { bg: '#ffe6ea', text: '#b83246', icon: '#e84d5b' },
  Rejected: { bg: '#ffe6ea', text: '#b83246', icon: '#e84d5b' }
};

const normalizeStatusLabel = (status) => {
  if (status === 1) return 'Pending';
  if (status === 2) return 'Approved';
  if (status === 3) return 'Completed';
  if (status === 4) return 'Cancelled';

  const label = String(status || 'Pending').trim();
  return label ? label.charAt(0).toUpperCase() + label.slice(1).toLowerCase() : 'Pending';
};

const getAppointmentStatusStyle = (status) => {
  const label = normalizeStatusLabel(status);
  return {
    label,
    ...(APPOINTMENT_STATUS_STYLES[label] || APPOINTMENT_STATUS_STYLES.Pending)
  };
};

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

const formatTimeSpanValue = (value) => {
  if (!value) return '';

  const date = parseTimeValue(value);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
};

const buildAvailabilitySlot = (startTime, endTime) => {
  if (!startTime || !endTime) return '';
  return `${formatTimeSpanValue(startTime)}-${formatTimeSpanValue(endTime)}`;
};

const getStaffId = (staff) => staff?.id || staff?.staffId || staff?.StaffId || staff?.userId || staff?.UserId || '';
const getStaffLabel = (staff) => {
  const id = getStaffId(staff);
  const name = staff?.name || staff?.fullName || staff?.staffName || staff?.StaffName || staff?.userName || staff?.UserName;
  const specialization = staff?.specialization || staff?.Specialization || staff?.role || staff?.Role;

  return [name || (id ? `Staff #${id}` : 'Available staff'), specialization].filter(Boolean).join(' - ');
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
        <MaterialIcons name="calendar-today" size={18} color={C.primary} />
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
        <MaterialIcons name="access-time" size={18} color={C.primary} />
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
            <MaterialIcons name="access-time" size={16} color={C.primary} />
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
  const [refreshing, setRefreshing] = useState(false);
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [serviceType, setServiceType] = useState('day');
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
  const [doctorPrescriptionImage, setDoctorPrescriptionImage] = useState(null);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [mapRegion, setMapRegion] = useState(DEFAULT_MAP_REGION);
  const [appointmentAddress, setAppointmentAddress] = useState('');
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressAutoFilled, setAddressAutoFilled] = useState(false);
  const [staffId, setStaffId] = useState('0');
  const [availableStaff, setAvailableStaff] = useState([]);
  const [availableStaffLoading, setAvailableStaffLoading] = useState(false);
  const [availableStaffError, setAvailableStaffError] = useState('');
  const [diseaseImage, setDiseaseImage] = useState(null);

  const loadAll = useCallback(async (silent = false) => {
    if (!user?.id) {
      setAppointments([]);
      setApptLoading(false);
      setServicesLoading(false);
      setRefreshing(false);
      setError('Unable to load appointments for this user.');
      return;
    }

    if (!silent) {
      setApptLoading(true);
      setServicesLoading(true);
    }

    setError('');

    try {
      const [apptPayload, svcPayload] = await Promise.all([getPatientAppointmentsByUser(user.id), getServices()]);
      setAppointments(extractAppointments(apptPayload));
      setServices(extractServices(svcPayload));
    } catch (e) {
      setError(e.message || 'Unable to load data.');
    } finally {
      setApptLoading(false);
      setServicesLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (serviceType === 'day') {
      setNoOfDays('1');
    } else if (serviceType === 'full') {
      setNoOfDays((current) => (current === '1' ? '2' : current || '2'));
    }
  }, [serviceType]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadAll(true);
  };

  useEffect(() => {
    const slot = buildAvailabilitySlot(startTime.trim(), endTime.trim());

    if (!appointmentDate.trim() || !slot) {
      setAvailableStaff([]);
      setAvailableStaffError('');
      return;
    }

    let active = true;
    setAvailableStaffLoading(true);
    setAvailableStaffError('');

    getAvailableStaff(appointmentDate.trim(), slot)
      .then((payload) => {
        if (!active) return;

        const staff = extractAvailableStaff(payload);
        setAvailableStaff(staff);
        setStaffId((current) => {
          if (current && current !== '0' && staff.some((s) => String(getStaffId(s)) === String(current))) {
            return current;
          }

          const firstAvailableId = getStaffId(staff[0]);
          return firstAvailableId ? String(firstAvailableId) : '0';
        });
      })
      .catch((e) => {
        if (!active) return;
        setAvailableStaff([]);
        setStaffId('0');
        setAvailableStaffError(e.message || 'Unable to load available staff.');
      })
      .finally(() => {
        if (active) setAvailableStaffLoading(false);
      });

    return () => {
      active = false;
    };
  }, [appointmentDate, startTime, endTime]);

  useEffect(() => {
    const lat = Number(latitude);
    const lng = Number(longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !latitude.trim() || !longitude.trim()) {
      return;
    }

    const fetchAddress = async () => {
      setAddressLoading(true);
      try {
        const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        if (Array.isArray(results) && results.length > 0) {
          const place = results[0];
          const formatted = [
            place.name,
            place.street,
            place.district || place.subregion,
            place.city,
            place.region,
            place.postalCode,
            place.country
          ].filter(Boolean).join(', ');

          if (formatted && (!appointmentAddress || addressAutoFilled)) {
            setAppointmentAddress(formatted);
            setAddressAutoFilled(true);
          }
        }
      } catch (e) {
        // ignore reverse geocode failures, keep manual address if any
      } finally {
        setAddressLoading(false);
      }
    };

    fetchAddress();
  }, [latitude, longitude, appointmentAddress, addressAutoFilled]);

  const selectedService = useMemo(
    () => services.find((s) => String(s.id || s.serviceId || s.ServiceId) === String(selectedServiceId)),
    [selectedServiceId, services]
  );

  const selectedServiceLabel =
    selectedService?.serviceName || selectedService?.name || selectedService?.ServiceName ||
    (selectedServiceId ? `Service #${selectedServiceId}` : 'Select service');

  const selectedLocation = useMemo(() => {
    const lat = Number(latitude);
    const lng = Number(longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }

    return { latitude: lat, longitude: lng };
  }, [latitude, longitude]);

  const setAppointmentLocation = ({ latitude: lat, longitude: lng }) => {
    const nextLatitude = Number(lat);
    const nextLongitude = Number(lng);

    if (!Number.isFinite(nextLatitude) || !Number.isFinite(nextLongitude)) {
      return;
    }

    setLatitude(nextLatitude.toFixed(6));
    setLongitude(nextLongitude.toFixed(6));
    setMapRegion((current) => ({
      ...current,
      latitude: nextLatitude,
      longitude: nextLongitude
    }));
  };

  const handleUseCurrentLocation = async () => {
    setLocationLoading(true);
    setError('');

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setError('Location permission is required to use your current location.');
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });

      setAppointmentLocation(current.coords);
    } catch (e) {
      setError(e.message || 'Unable to get your current location.');
    } finally {
      setLocationLoading(false);
    }
  };

  const pickImage = async (onSelect, fallbackName) => {
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
      onSelect({ uri: asset.uri, name: asset.fileName || fallbackName, type: asset.mimeType || 'image/jpeg' });
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
    setDoctorPrescriptionImage(null);
    setLatitude('');
    setLongitude('');
    setAppointmentAddress('');
    setAddressLoading(false);
    setAddressAutoFilled(false);
    setMapRegion(DEFAULT_MAP_REGION);
    setLocationLoading(false);
    setStaffId('0');
    setAvailableStaff([]);
    setAvailableStaffLoading(false);
    setAvailableStaffError('');
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

  const handleAppointmentDateChange = (value) => {
    setAppointmentDate(value);
    setDischargeDate((current) => current || value);
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

    if (availableStaffLoading) {
      setError('Please wait while available staff is loading.');
      return;
    }

    if (!availableStaff.length || !Number(staffId)) {
      setError('Please select an available staff member for this slot.');
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
        doctorPrescriptionImage,
        latitude: latitude.trim(),
        longitude: longitude.trim(),
        appointmentAddress: appointmentAddress.trim(),
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
      <ScrollView
        style={styles.page}
        contentContainerStyle={[styles.content, compact && styles.contentCompact]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#1c35ff" colors={['#1c35ff']} />}
      >
        <View style={styles.listHeader}>
          <Text style={[styles.title, compact && styles.titleCompact]}>My Appointments</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconBtn} onPress={handleRefresh} disabled={refreshing || apptLoading}>
              {refreshing ? <ActivityIndicator color="#fff" size="small" /> : <MaterialIcons name="refresh" size={18} color="#fff" />}
            </TouchableOpacity>
            <TouchableOpacity style={styles.bookBtn} onPress={() => setView('form')}>
              <MaterialIcons name="add" size={18} color="#fff" />
              <Text style={styles.bookBtnText}>Book Appointment</Text>
            </TouchableOpacity>
          </View>
        </View>

        {apptLoading ? (
          <ActivityIndicator color="#4f7cff" style={{ marginTop: 32 }} />
        ) : appointments.length ? (
          appointments.map((item) => {
            const statusStyle = getAppointmentStatusStyle(item.status);

            return (
              <View key={item.id} style={[styles.card, compact && styles.cardCompact]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.cardIconWrap, { backgroundColor: statusStyle.bg }]}>
                    <MaterialIcons name="event-note" size={20} color={statusStyle.icon} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{item.type}</Text>
                    <Text style={styles.cardSub}>{item.doctor}</Text>
                  </View>
                  <Text style={[styles.status, { backgroundColor: statusStyle.bg, color: statusStyle.text }]}>{statusStyle.label}</Text>
                </View>
                <View style={styles.cardFooter}>
                  <MaterialIcons name="calendar-today" size={13} color="#8a91a7" />
                  <Text style={styles.cardMeta}>  {item.date}</Text>
                  <MaterialIcons name="access-time" size={13} color="#8a91a7" style={{ marginLeft: 10 }} />
                  <Text style={styles.cardMeta}>  {item.time}</Text>
                </View>
              </View>
            );
          })
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

  const TABS = ['Service Type','Services','Reason','Images','Location','Date','Time','Discharge Date','No. of Days','Confirm Booking'];

  const handleNext = () => {
    setError('');

    // Step 0: Service Type
    if (formTab === 0) {
      if (!serviceType) {
        setError('Please select a care type.');
        return;
      }
      setFormTab(1);
      return;
    }

    // Step 1: Services
    if (formTab === 1) {
      if (!selectedServiceId) {
        setError('Please select a service.');
        return;
      }
      setFormTab(2);
      return;
    }

    // Step 2: Reason
    if (formTab === 2) {
      if (!diseaseName.trim()) {
        setError('Please enter the reason for care.');
        return;
      }
      setFormTab(3);
      return;
    }

    // Step 3: Images (optional)
    if (formTab === 3) {
      setFormTab(4);
      return;
    }

    // Step 4: Location (optional)
    if (formTab === 4) {
      setFormTab(5);
      return;
    }

    // Step 5: Date
    if (formTab === 5) {
      if (!appointmentDate.trim()) {
        setError('Please select an appointment date.');
        return;
      }
      setFormTab(6);
      return;
    }

    // Step 6: Time
    if (formTab === 6) {
      if (!validateTimeRange()) {
        return;
      }
      setFormTab(7);
      return;
    }

    // Step 7: Discharge Date (optional)
    if (formTab === 7) {
      setFormTab(8);
      return;
    }

    // Step 8: No. of Days
    if (formTab === 8) {
      if (!noOfDays || Number(noOfDays) <= 0) {
        setError('Please enter a valid number of days.');
        return;
      }
      setFormTab(9);
      return;
    }

    // Step 9: Confirm Booking (final)
  };

  const renderStepContent = () => {
    const selectedService = services.find((s) => String(s.id || s.serviceId || s.ServiceId) === String(selectedServiceId));
    const selectedServiceLabel = selectedService?.serviceName || selectedService?.name || selectedService?.ServiceName || (selectedServiceId ? `Service #${selectedServiceId}` : 'Select service');
    const serviceDescription = selectedService?.description || selectedService?.subtitle || selectedService?.serviceDescription || 'Tap to select this service';
    const imageUri = selectedService?.image || selectedService?.serviceImage || selectedService?.imageUrl || selectedService?.iconUrl;

    if (formTab === 0) {
      return (
        <>
          <Text style={styles.serviceSelectionHeading}>Select your care service</Text>
          <Text style={styles.serviceSelectionHint}>Choose the type of care service that best fits your needs.</Text>
          <View style={styles.serviceTypeRow}>
            {SERVICE_TYPES.map((type) => {
              const active = serviceType === type.id;
              return (
                <TouchableOpacity
                  key={type.id}
                  style={[styles.serviceTypeCard, active && styles.serviceTypeCardActive]}
                  onPress={() => {
                    setServiceType(type.id);
                    setError('');
                  }}
                  disabled={loading}
                >
                  <View style={[styles.serviceTypeIconWrap, active && styles.serviceTypeIconWrapActive]}>
                    <MaterialIcons name="schedule" size={22} color={active ? '#ffffff' : C.primary} />
                  </View>
                  <Text style={[styles.serviceTypeTitle, active && styles.serviceTypeTitleActive]}>{type.title}</Text>
                  <Text style={[styles.serviceTypeSubtitle, active && styles.serviceTypeSubtitleActive]}>{type.subtitle}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      );
    }

    if (formTab === 1) {
      return (
        <>
          <Text style={styles.serviceSelectionHeading}>Choose a service</Text>
          <Text style={styles.serviceSelectionHint}>Tap a card to select the service you need.</Text>
          {servicesLoading ? (
            <ActivityIndicator color="#4f7cff" style={{ marginTop: 24 }} />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.serviceCardList}>
              {services.length ? services.map((s) => {
                const sid = String(s.id || s.serviceId || s.ServiceId);
                const title = s.serviceName || s.name || s.ServiceName || `Service #${sid}`;
                const category = s.category || s.categoryName || s.type || 'Care';
                const selected = String(selectedServiceId) === sid;
                const svcImage = s.image || s.serviceImage || s.imageUrl || s.iconUrl;

                return (
                  <TouchableOpacity
                    key={sid}
                    style={[styles.serviceCard, selected && styles.serviceCardActive]}
                    onPress={() => setSelectedServiceId(sid)}
                    disabled={loading}
                  >
                    {svcImage ? (
                      <Image source={{ uri: svcImage }} style={styles.serviceImage} resizeMode="cover" />
                    ) : (
                      <View style={styles.serviceFallback}>
                        <MaterialIcons name="medical-services" size={26} color={C.primary} />
                      </View>
                    )}
                    <Text style={[styles.serviceTitle, selected && styles.serviceTitleActive]} numberOfLines={2}>{title}</Text>
                    <Text style={styles.serviceCategory} numberOfLines={1}>{category}</Text>
                  </TouchableOpacity>
                );
              }) : (
                <View style={styles.emptyRow}>
                  <Text style={styles.emptyText}>No services available.</Text>
                </View>
              )}
            </ScrollView>
          )}
        </>
      );
    }

    if (formTab === 2) {
      return (
        <>
          <Text style={styles.serviceSelectionHeading}>Tell us why</Text>
          <Text style={styles.serviceSelectionHint}>Describe why you need this service.</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Reason *</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Describe the care reason"
              value={diseaseName}
              onChangeText={setDiseaseName}
              editable={!loading}
              multiline
            />
          </View>
        </>
      );
    }

    if (formTab === 3) {
      return (
        <>
          <Text style={styles.serviceSelectionHeading}>Add images</Text>
          <Text style={styles.serviceSelectionHint}>Upload illness or prescription images.</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Disease Image (optional)</Text>
            <TouchableOpacity style={styles.imagePicker} onPress={() => pickImage(setDiseaseImage, 'disease-image.jpg')} disabled={loading}>
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
            <Text style={styles.label}>Prescription Image (optional)</Text>
            <TouchableOpacity style={styles.imagePicker} onPress={() => pickImage(setDoctorPrescriptionImage, 'doctor-prescription-image.jpg')} disabled={loading}>
              {doctorPrescriptionImage ? (
                <Image source={{ uri: doctorPrescriptionImage.uri }} style={styles.imagePreview} resizeMode="cover" />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <MaterialIcons name="add-photo-alternate" size={28} color="#4f7cff" />
                  <Text style={styles.imagePlaceholderText}>Tap to upload prescription</Text>
                </View>
              )}
            </TouchableOpacity>
            {doctorPrescriptionImage ? (
              <TouchableOpacity style={styles.removeImage} onPress={() => setDoctorPrescriptionImage(null)}>
                <MaterialIcons name="close" size={14} color="#fff" />
              </TouchableOpacity>
            ) : null}
          </View>
        </>
      );
    }

    if (formTab === 4) {
      return (
        <>
          <Text style={styles.serviceSelectionHeading}>Pick location</Text>
          <Text style={styles.serviceSelectionHint}>Set your appointment location.</Text>
          <View style={styles.inputGroup}>
            <TouchableOpacity
              disabled={loading || locationLoading}
              style={[styles.locationButton, (loading || locationLoading) && styles.btnDisabled]}
              onPress={handleUseCurrentLocation}
            >
              {locationLoading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <MaterialIcons name="my-location" size={18} color="#ffffff" />
                  <Text style={styles.locationButtonText}>Use My Current Location</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          <View style={styles.locationCoordRow}>
            <View style={styles.locationCoordField}>
              <Text style={styles.label}>Latitude</Text>
              <TextInput
                style={styles.input}
                placeholder="28.6139"
                value={latitude}
                onChangeText={(value) => {
                  setLatitude(value);
                  setAddressAutoFilled(false);
                }}
                editable={!loading}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.locationCoordField}>
              <Text style={styles.label}>Longitude</Text>
              <TextInput
                style={styles.input}
                placeholder="77.2090"
                value={longitude}
                onChangeText={(value) => {
                  setLongitude(value);
                  setAddressAutoFilled(false);
                }}
                editable={!loading}
                keyboardType="numeric"
              />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Appointment Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Auto-filled from coordinates"
              value={appointmentAddress}
              onChangeText={(value) => {
                setAppointmentAddress(value);
                setAddressAutoFilled(false);
              }}
              editable={!addressLoading && !loading}
              multiline
            />
            <Text style={styles.addressHint}>
              {addressLoading ? 'Looking up address from coordinates...' : 'Address is auto-filled from latitude/longitude.'}
            </Text>
          </View>
          <View style={styles.mapWrap}>
            <AppointmentMapPicker
              region={mapRegion}
              selectedLocation={selectedLocation}
              onLocationSelect={setAppointmentLocation}
            />
          </View>
        </>
      );
    }

    if (formTab === 5) {
      return (
        <>
          <Text style={styles.serviceSelectionHeading}>Pick appointment date</Text>
          <Text style={styles.serviceSelectionHint}>Choose when the care service should begin.</Text>
          <DateField label="Appointment Date *" value={appointmentDate} onChange={handleAppointmentDateChange} disabled={loading} />
        </>
      );
    }

    if (formTab === 6) {
      return (
        <>
          <Text style={styles.serviceSelectionHeading}>Pick appointment time</Text>
          <Text style={styles.serviceSelectionHint}>Choose start and end time for the visit.</Text>
          <TimeField label="Start Time *" value={startTime} onChange={setStartTime} disabled={loading} />
          <TimeField label="End Time *" value={endTime} onChange={setEndTime} disabled={loading} />
          {startTime && endTime ? (
            <View style={styles.rangeSummary}>
              <MaterialIcons name="schedule" size={16} color="#4f7cff" />
              <Text style={styles.rangeSummaryText}>{buildSlotTimeRange(startTime, endTime)}</Text>
            </View>
          ) : null}
        </>
      );
    }

    if (formTab === 7) {
      return (
        <>
          <Text style={styles.serviceSelectionHeading}>Discharge date</Text>
          <Text style={styles.serviceSelectionHint}>When should the service end?</Text>
          <DateField label="Discharge Date" value={dischargeDate} onChange={setDischargeDate} disabled={loading} />
        </>
      );
    }

    if (formTab === 8) {
      return (
        <>
          <Text style={styles.serviceSelectionHeading}>Duration</Text>
          <Text style={styles.serviceSelectionHint}>How many days do you need support?</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>No. of Days</Text>
            <TextInput style={styles.input} placeholder="1" value={noOfDays} onChangeText={setNoOfDays} editable={!loading} keyboardType="numeric" />
          </View>
        </>
      );
    }

    return (
      <>
        <Text style={styles.serviceSelectionHeading}>Confirm booking</Text>
        <Text style={styles.serviceSelectionHint}>Review your details and submit the appointment.</Text>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Service Type</Text>
          <Text style={styles.summaryValue}>{serviceType === 'full' ? 'Full Time Services' : 'Day Care'}</Text>
          <Text style={styles.summaryLabel}>Service</Text>
          <Text style={styles.summaryValue}>{selectedServiceLabel}</Text>
          <Text style={styles.summaryLabel}>Reason</Text>
          <Text style={styles.summaryValue}>{diseaseName || '-'}</Text>
          <Text style={styles.summaryLabel}>Appointment Address</Text>
          <Text style={styles.summaryValue}>{appointmentAddress || '-'}</Text>
          <Text style={styles.summaryLabel}>Date</Text>
          <Text style={styles.summaryValue}>{appointmentDate ? formatDisplay(appointmentDate) : '-'}</Text>
          <Text style={styles.summaryLabel}>Time</Text>
          <Text style={styles.summaryValue}>{buildSlotTimeRange(startTime, endTime) || '-'}</Text>
          <Text style={styles.summaryLabel}>Discharge Date</Text>
          <Text style={styles.summaryValue}>{dischargeDate ? formatDisplay(dischargeDate) : '-'}</Text>
          <Text style={styles.summaryLabel}>No. of Days</Text>
          <Text style={styles.summaryValue}>{noOfDays || '-'}</Text>
        </View>
        {appointmentDate && startTime && endTime ? (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Available Staff</Text>
            {availableStaffLoading ? (
              <View style={styles.staffStatus}>
                <ActivityIndicator color="#4f7cff" size="small" />
                <Text style={styles.staffStatusText}>Checking available staff...</Text>
              </View>
            ) : availableStaff.length ? (
              <View style={styles.staffOptions}>
                {availableStaff.map((staff, index) => {
                  const sid = String(getStaffId(staff) || index);
                  const selected = String(staffId) === String(getStaffId(staff));
                  return (
                    <TouchableOpacity
                      key={sid}
                      style={[styles.staffOption, selected && styles.staffOptionActive]}
                      onPress={() => setStaffId(String(getStaffId(staff) || '0'))}
                      disabled={loading}
                    >
                      <MaterialIcons name={selected ? 'radio-button-checked' : 'radio-button-unchecked'} size={18} color={selected ? '#4f7cff' : '#8a91a7'} />
                      <Text style={[styles.staffOptionText, selected && styles.staffOptionTextActive]}>{getStaffLabel(staff)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={styles.staffStatus}>
                <MaterialIcons name="person-off" size={18} color="#c94a59" />
                <Text style={[styles.staffStatusText, styles.staffStatusError]}>
                  {availableStaffError || 'No staff available for this slot.'}
                </Text>
              </View>
            )}
          </View>
        ) : null}
      </>
    );
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={[styles.content, compact && styles.contentCompact]} showsVerticalScrollIndicator={false}>
      <View style={styles.formHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => { resetForm(); setView('list'); }}>
          <MaterialIcons name="arrow-back" size={18} color="#ffffff" />
        </TouchableOpacity>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.title, { marginBottom: 0, fontSize: 19 }]} numberOfLines={1}>Book Appointment</Text>
          <Text style={styles.formSubtitle}>{TABS[formTab] ? `Step ${formTab + 1}: ${TABS[formTab]}` : 'Book your appointment'}</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBarContent}>
        {TABS.map((label, i) => (
          <TouchableOpacity
            key={label}
            style={[styles.tabItem, formTab === i && styles.tabItemActive]}
            onPress={() => { setError(''); setFormTab(i); }}
          >
            <Text style={[styles.tabLabel, formTab === i && styles.tabLabelActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.progressBlock}>
        <Text style={styles.progressLabel}>Step {formTab + 1} of {TABS.length}</Text>
        <View style={styles.progressTrack}>
          {TABS.map((label, index) => (
            <View key={label} style={[styles.progressSegment, index <= formTab && styles.progressSegmentActive]} />
          ))}
        </View>
      </View>

      <View style={[styles.formCard, compact && styles.cardCompact]}>
        {renderStepContent()}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.actionRow}>
          <TouchableOpacity
            disabled={loading || formTab === 0}
            style={styles.secondaryBtn}
            onPress={() => { setError(''); setFormTab((t) => Math.max(0, t - 1)); }}
          >
            <MaterialIcons name="arrow-back" size={18} color="#4f7cff" />
            <Text style={styles.secondaryBtnText}>Back</Text>
          </TouchableOpacity>

          {formTab < TABS.length - 1 ? (
            <TouchableOpacity
              disabled={loading}
              style={[styles.submitBtn, styles.actionSubmitBtn, loading && styles.btnDisabled]}
              onPress={handleNext}
            >
              <Text style={styles.submitBtnText}>Next</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              disabled={loading || servicesLoading || availableStaffLoading}
              style={[styles.submitBtn, styles.actionSubmitBtn, (loading || servicesLoading || availableStaffLoading) && styles.btnDisabled]}
              onPress={handleBook}
            >
              {loading ? <ActivityIndicator color="#fff" /> : (
                <>
                  <MaterialIcons name="check-circle" size={18} color="#fff" />
                  <Text style={styles.submitBtnText}>{availableStaffLoading ? 'Checking Staff' : 'Confirm Booking'}</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, paddingBottom: 140 },
  contentCompact: { padding: 12, paddingBottom: 140 },

  listHeader: { backgroundColor: C.primary, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, shadowColor: C.primaryDark, shadowOpacity: 0.22, shadowRadius: 16, elevation: 8 },
  title: { fontSize: 20, fontWeight: '900', color: '#ffffff', marginBottom: 0, flexShrink: 1 },
  titleCompact: { fontSize: 17 },

  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 },
  iconBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#ffffff22', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ffffff45' },
  bookBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff22', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, gap: 4, borderWidth: 1, borderColor: '#ffffff45' },
  bookBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },

  card: { backgroundColor: C.bgCard, borderRadius: 20, padding: 16, marginBottom: 12, shadowColor: C.shadow, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, borderWidth: 1, borderColor: C.border },
  cardCompact: { padding: 13 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  cardIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: C.textPrimary },
  cardSub: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
  status: { fontSize: 11, fontWeight: '900', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10, alignSelf: 'flex-start', overflow: 'hidden' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: C.borderLight, paddingTop: 10 },
  cardMeta: { fontSize: 12, color: C.textMuted },

  emptyCard: { backgroundColor: C.bgCard, borderRadius: 18, padding: 32, alignItems: 'center', shadowColor: C.shadow, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: C.textPrimary, marginTop: 12 },
  emptyHint: { fontSize: 13, color: C.textMuted, textAlign: 'center', marginTop: 6, lineHeight: 19 },

  formHeader: { backgroundColor: C.primary, borderRadius: 26, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14, shadowColor: C.primaryDark, shadowOpacity: 0.22, shadowRadius: 18, elevation: 8 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#ffffff22', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  formSubtitle: { color: '#bae6fd', fontSize: 12, fontWeight: '700', marginTop: 3 },
  tabBarContent: { flexDirection: 'row', gap: 10, paddingBottom: 8, marginBottom: 12 },

  tabBar: { flexDirection: 'row', backgroundColor: C.bgCard, borderRadius: 18, padding: 5, marginBottom: 12, borderWidth: 1, borderColor: C.border },
  tabItem: { flex: 1, paddingVertical: 9, borderRadius: 11, alignItems: 'center' },
  tabItemActive: { backgroundColor: C.primary, shadowColor: C.primaryDark, shadowOpacity: 0.2, shadowRadius: 6, elevation: 3 },
  tabLabel: { fontSize: 13, fontWeight: '600', color: C.textMuted },
  tabLabelActive: { color: '#fff' },

  progressBlock: { backgroundColor: C.bgCard, borderRadius: 18, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: C.border },
  progressLabel: { color: C.textSecondary, fontSize: 13, fontWeight: '700', marginBottom: 10 },
  progressTrack: { flexDirection: 'row', gap: 8 },
  progressSegment: { flex: 1, height: 5, borderRadius: 8, backgroundColor: C.border },
  progressSegmentActive: { backgroundColor: C.primary },

  formCard: { backgroundColor: C.bgCard, borderRadius: 24, padding: 18, shadowColor: C.shadow, shadowOpacity: 0.06, shadowRadius: 14, elevation: 4, borderWidth: 1, borderColor: C.border },

  inputGroup: { marginBottom: 14 },
  label: { fontSize: 13, color: C.textSecondary, marginBottom: 7, fontWeight: '600' },
  input: { backgroundColor: C.bgMuted, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: C.textPrimary, borderWidth: 1, borderColor: C.border },
  multilineInput: { minHeight: 80, textAlignVertical: 'top' },
  locationButton: { backgroundColor: C.accent, borderRadius: 12, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  locationButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  mapHint: { color: C.textSecondary, fontSize: 12, marginTop: 10, marginBottom: 8, fontWeight: '600' },
  mapWrap: { height: 210, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: C.border, backgroundColor: C.primaryLight },
  map: { flex: 1 },
  locationSummary: { marginTop: 10, backgroundColor: C.bgMuted, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  locationSummaryText: { flex: 1, color: C.textPrimary, fontSize: 12, fontWeight: '700' },
  locationEmptyText: { flex: 1, color: C.textMuted, fontSize: 12, fontWeight: '600' },
  locationCoordRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  locationCoordField: { flex: 1 },
  addressHint: { color: C.textSecondary, fontSize: 12, marginTop: 6 },

  pickerButton: { backgroundColor: C.bgMuted, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: C.border },
  pickerText: { flex: 1, fontSize: 15, color: C.textPrimary },
  placeholderText: { color: C.textMuted },
  nativePickerWrap: { marginTop: 10, borderWidth: 1, borderColor: C.border, borderRadius: 18, overflow: 'hidden', backgroundColor: C.bgCard },
  timePreview: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderTopWidth: 1, borderTopColor: C.borderLight },
  timePreviewText: { fontSize: 18, fontWeight: '700', color: C.textPrimary },
  rangeSummary: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.primaryLight, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14 },
  rangeSummaryText: { color: C.primaryDark, fontSize: 14, fontWeight: '700' },
  staffStatus: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.bgMuted, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  staffStatusText: { flex: 1, color: C.textSecondary, fontSize: 13, fontWeight: '600' },
  staffStatusError: { color: C.danger },
  staffOptions: { gap: 8 },
  staffOption: { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: C.bgMuted, borderRadius: 14, paddingHorizontal: 13, paddingVertical: 12, borderWidth: 1, borderColor: C.border },
  staffOptionActive: { backgroundColor: C.primaryLight, borderColor: C.primaryMid },
  staffOptionText: { flex: 1, color: C.textSecondary, fontSize: 13, fontWeight: '600' },
  staffOptionTextActive: { color: C.primaryDark },
  scheduleGrid: { marginBottom: 2 },

  dropdownButton: { backgroundColor: C.bgMuted, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: C.border },
  dropdownText: { flex: 1, color: C.textPrimary, fontSize: 15, paddingRight: 8 },
  dropdownMenu: { backgroundColor: C.bgCard, borderRadius: 14, marginTop: 8, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  dropdownItem: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.borderLight },
  dropdownItemText: { color: C.textPrimary, fontSize: 14 },

  actionRow: { flexDirection: 'row', gap: 10, marginTop: 8, alignItems: 'center' },
  secondaryBtn: { minWidth: 96, borderWidth: 1, borderColor: C.primaryMid, backgroundColor: C.primaryLight, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  secondaryBtnText: { color: C.primary, fontSize: 15, fontWeight: '700' },
  submitBtn: { backgroundColor: C.primary, borderRadius: 16, paddingVertical: 15, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7, shadowColor: C.primaryDark, shadowOpacity: 0.2, shadowRadius: 10, elevation: 4 },
  actionSubmitBtn: { flex: 1, marginTop: 0 },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  submitBtnDisabled: { opacity: 0.7 },
  btnDisabled: { opacity: 0.75 },

  emptyText: { color: C.textMuted, fontSize: 13, padding: 12 },
  error: { color: C.danger, marginTop: 4, marginBottom: 6, fontSize: 12 },

  imagePicker: { borderRadius: 16, overflow: 'hidden', borderWidth: 1.5, borderColor: C.primaryMid, borderStyle: 'dashed', backgroundColor: C.bgMuted },
  imagePlaceholder: { height: 110, alignItems: 'center', justifyContent: 'center', gap: 8 },
  imagePlaceholderText: { fontSize: 13, color: C.textSecondary, fontWeight: '500' },
  imagePreview: { width: '100%', height: 160 },
  removeImage: { position: 'absolute', top: 8, right: 8, backgroundColor: C.danger, borderRadius: 12, padding: 4 },

  serviceCardList: { paddingRight: 16, gap: 12, paddingTop: 6, paddingBottom: 4 },
  serviceCard: { width: 142, backgroundColor: C.bgCard, borderRadius: 18, padding: 10, borderWidth: 1, borderColor: C.border, shadowColor: C.shadow, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3, marginRight: 12 },
  serviceCardActive: { borderColor: C.primary, shadowColor: C.primaryDark, shadowOpacity: 0.12, shadowRadius: 12, elevation: 5 },
  serviceImage: { width: '100%', height: 82, borderRadius: 14, backgroundColor: '#eef2ff' },
  serviceFallback: { height: 82, borderRadius: 14, backgroundColor: '#eef3ff', alignItems: 'center', justifyContent: 'center' },
  serviceTitle: { color: C.textPrimary, fontSize: 13, fontWeight: '900', marginTop: 9, minHeight: 34 },
  serviceTitleActive: { color: C.primary },
  serviceCategory: { color: C.textSecondary, fontSize: 12, fontWeight: '600', marginTop: 3 },
  guidanceCard: { backgroundColor: C.primaryLight, borderRadius: 16, padding: 12, marginBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: 1, borderColor: C.primaryMid },
  guidanceText: { flex: 1, color: C.primaryDark, fontSize: 12, fontWeight: '700', lineHeight: 18 },
  serviceChoice: { backgroundColor: C.bgMuted, borderRadius: 18, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: C.border },
  serviceChoiceActive: { backgroundColor: C.primary, borderColor: C.primary, shadowColor: C.primaryDark, shadowOpacity: 0.18, shadowRadius: 10, elevation: 4 },
  serviceChoiceIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  serviceChoiceIconActive: { backgroundColor: '#ffffff26' },
  serviceChoiceText: { flex: 1, color: C.textPrimary, fontSize: 14, fontWeight: '700', lineHeight: 18 },
  serviceChoiceTextActive: { color: '#ffffff' },
  serviceTypeRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  serviceTypeCard: { flex: 1, borderRadius: 20, backgroundColor: C.bgMuted, padding: 16, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  serviceTypeCardActive: { backgroundColor: C.primary, borderColor: C.primaryDark },
  serviceTypeIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  serviceTypeIconWrapActive: { backgroundColor: '#ffffff30' },
  serviceTypeTitle: { fontSize: 15, fontWeight: '800', color: C.textPrimary, textAlign: 'center', marginBottom: 4 },
  serviceTypeTitleActive: { color: '#ffffff' },
  serviceTypeSubtitle: { fontSize: 12, color: C.textSecondary, textAlign: 'center' },
  serviceTypeSubtitleActive: { color: '#ebf2ff' },
  serviceSelectionHeading: { fontSize: 17, fontWeight: '800', color: C.textPrimary, marginBottom: 6 },
  serviceSelectionHint: { fontSize: 13, color: C.textSecondary, marginBottom: 12, lineHeight: 18 },
  selectedTypeSummary: { backgroundColor: C.bgMuted, borderRadius: 18, padding: 14, marginBottom: 16 },
  selectedTypeLabel: { fontSize: 12, color: C.textSecondary, marginBottom: 4, fontWeight: '700' },
  selectedTypeValue: { fontSize: 15, color: C.textPrimary, fontWeight: '800' },
  dayMode: { flexDirection: 'row', backgroundColor: C.primaryLight, borderRadius: 18, padding: 5, marginBottom: 16 },
  dayModeButton: { flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: 14 },
  dayModeButtonDisabled: { opacity: 0.5 },
  dayModeActive: { backgroundColor: C.primary },
  dayModeText: { color: C.textSecondary, fontSize: 14, fontWeight: '700' },
  dayModeTextActive: { color: '#ffffff' }
});
