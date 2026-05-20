import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { extractPatientDashboard, getAppointmentStatusLabel, getPatientDashboard } from '../api/dashboard';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatDate = (value) => {
  if (!value) return 'Not scheduled';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

const getInitials = (name = 'P') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'P';

const getServiceName = (service) => service.name || service.serviceName || service.ServiceName || 'Health Service';
const getServiceCategory = (service) => service.category || service.categoryName || 'Care';
const getStaffName = (staff) => staff.name || staff.fullName || 'Care Specialist';
const getStaffImage = (staff) => staff.image || staff.profileImage || null;

const STATUS_STYLES = {
  Pending: { bg: '#fff6db', text: '#986600' },
  Approved: { bg: '#e6efff', text: '#2851b6' },
  Cancelled: { bg: '#ffe6e9', text: '#bd3447' },
  Completed: { bg: '#e8f8ef', text: '#2f8a55' }
};

const getTodayLabel = () => formatDate(new Date().toISOString());

function MetricCard({ icon, label, value, tone, compact }) {
  return (
    <View style={[styles.metricCard, compact && styles.metricCardCompact, { borderTopColor: tone }]}>
      <View style={[styles.metricIcon, { backgroundColor: `${tone}18` }]}>
        <MaterialIcons name={icon} size={18} color={tone} />
      </View>
      <View style={styles.metricCopy}>
        <Text style={styles.metricValue}>{value ?? 0}</Text>
        <Text style={styles.metricLabel}>{label}</Text>
      </View>
    </View>
  );
}

function AppointmentCard({ appointment, title, featured }) {
  if (!appointment) {
    return (
      <View style={[styles.appointmentCard, featured && styles.featuredAppointment]}>
        <View style={styles.emptyIcon}>
          <MaterialIcons name="event-available" size={24} color="#9eabd3" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardMeta}>No appointment available</Text>
        </View>
      </View>
    );
  }

  const statusLabel = getAppointmentStatusLabel(appointment.status);
  const statusStyle = STATUS_STYLES[statusLabel] || STATUS_STYLES.Pending;

  return (
    <View style={[styles.appointmentCard, featured && styles.featuredAppointment]}>
      <View style={styles.appointmentIcon}>
        <MaterialIcons name="event-note" size={22} color="#4f7cff" />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={[styles.statusPill, { backgroundColor: statusStyle.bg, color: statusStyle.text }]}>{statusLabel}</Text>
        </View>
        <Text style={styles.appointmentName}>{appointment.serviceName || 'Booked Visit'}</Text>
        <View style={styles.metaRow}>
          <MaterialIcons name="calendar-today" size={13} color="#8a91a7" />
          <Text style={styles.cardMeta}>{formatDate(appointment.appointmentDate)}</Text>
        </View>
        <View style={styles.metaRow}>
          <MaterialIcons name="access-time" size={13} color="#8a91a7" />
          <Text style={styles.cardMeta}>{appointment.slotTime || 'Time pending'}</Text>
        </View>
      </View>
    </View>
  );
}

function SectionHeader({ title, actionLabel }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionLabel ? <Text style={styles.sectionAction}>{actionLabel}</Text> : null}
    </View>
  );
}

function QuickAction({ icon, label, color }) {
  return (
    <View style={styles.quickAction}>
      <View style={[styles.quickIcon, { backgroundColor: `${color}18` }]}>
        <MaterialIcons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </View>
  );
}

export default function HomeScreen({ user }) {
  const { width } = useWindowDimensions();
  const compact = width < 380;
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');

    try {
      const payload = await getPatientDashboard();
      setDashboard(extractPatientDashboard(payload));
    } catch (e) {
      setError(e.message || 'Unable to load dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const summary = dashboard?.userSummary || {};
  const patientName = summary.name || user?.name || 'Patient';
  const firstName = patientName.split(' ')[0] || 'Patient';
  const services = dashboard?.services || [];
  const staffs = dashboard?.staffs || [];
  const recentAppointments = dashboard?.recentAppointments || [];

  const completionRate = useMemo(() => {
    const total = Number(summary.totalAppointments || 0);
    if (!total) return 0;
    return Math.round((Number(summary.totalCompleted || 0) / total) * 100);
  }, [summary.totalAppointments, summary.totalCompleted]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard(true);
  };

  if (loading && !dashboard) {
    return (
      <View style={styles.centerPage}>
        <ActivityIndicator color="#4f7cff" size="large" />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={[styles.content, compact && styles.contentCompact]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4f7cff" />}
    >
      <View style={[styles.topPanel, compact && styles.topPanelCompact]}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.greeting}>Good health, {firstName}</Text>
            <Text style={styles.todayText}>{getTodayLabel()}</Text>
          </View>
          {summary.profileImage ? (
            <Image source={{ uri: summary.profileImage }} style={styles.profileImage} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(patientName)}</Text>
            </View>
          )}
        </View>

        <View style={styles.hero}>
          <View style={styles.heroText}>
            <Text style={styles.heroKicker}>Patient Dashboard</Text>
            <Text style={[styles.heroTitle, compact && styles.heroTitleCompact]}>Your care plan at a glance</Text>
            <Text style={styles.heroSub}>{summary.totalAppointments || 0} appointments tracked with {summary.totalPending || 0} awaiting action</Text>
          </View>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeValue}>{completionRate}%</Text>
            <Text style={styles.heroBadgeLabel}>complete</Text>
          </View>
        </View>

        <View style={styles.quickRow}>
          <QuickAction icon="event-available" label="Book Visit" color="#4f7cff" />
          <QuickAction icon="medical-services" label="Services" color="#149688" />
          <QuickAction icon="support-agent" label="Care Staff" color="#f59e0b" />
        </View>
      </View>

      {error ? (
        <TouchableOpacity style={styles.errorBox} onPress={() => loadDashboard()}>
          <MaterialIcons name="refresh" size={18} color="#c94a59" />
          <Text style={styles.errorText}>{error} Tap to retry.</Text>
        </TouchableOpacity>
      ) : null}

      <View style={styles.metricsGrid}>
        <MetricCard icon="event-note" label="Total Visits" value={summary.totalAppointments} tone="#4f7cff" compact={compact} />
        <MetricCard icon="hourglass-top" label="Pending" value={summary.totalPending} tone="#f59e0b" compact={compact} />
        <MetricCard icon="verified" label="Approved" value={summary.totalApproved} tone="#149688" compact={compact} />
        <MetricCard icon="check-circle" label="Completed" value={summary.totalCompleted} tone="#2f9e62" compact={compact} />
      </View>

      <View style={styles.progressCard}>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.progressTitle}>Completion Rate</Text>
            <Text style={styles.progressHint}>{summary.totalCancelled || 0} cancelled appointments</Text>
          </View>
          <Text style={styles.progressPercent}>{completionRate}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${completionRate}%` }]} />
        </View>
      </View>

      <SectionHeader title="Appointments" actionLabel="Latest schedule" />
      <AppointmentCard title="Upcoming" appointment={dashboard?.upcomingAppointment} featured />
      <AppointmentCard title="Last Visit" appointment={dashboard?.lastAppointment} />

      <SectionHeader title="Services" actionLabel={`${services.length} available`} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
        {services.length ? (
          services.map((service) => (
            <View key={service.id || getServiceName(service)} style={styles.serviceCard}>
              {service.image ? (
                <Image source={{ uri: service.image }} style={styles.serviceImage} />
              ) : (
                <View style={styles.serviceFallback}>
                  <MaterialIcons name="medical-services" size={24} color="#4f7cff" />
                </View>
              )}
              <Text style={styles.serviceTitle} numberOfLines={2}>{getServiceName(service)}</Text>
              <Text style={styles.serviceCategory} numberOfLines={1}>{getServiceCategory(service)}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No services available right now.</Text>
        )}
      </ScrollView>

      <SectionHeader title="Care Staff" actionLabel={`${staffs.length} listed`} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
        {staffs.length ? (
          staffs.slice(0, 10).map((staff) => (
            <View key={staff.id || getStaffName(staff)} style={styles.staffCard}>
              {getStaffImage(staff) ? (
                <Image source={{ uri: getStaffImage(staff) }} style={styles.staffImage} />
              ) : (
                <View style={styles.staffAvatar}>
                  <Text style={styles.staffAvatarText}>{getInitials(getStaffName(staff))}</Text>
                </View>
              )}
              <Text style={styles.staffName} numberOfLines={1}>{getStaffName(staff)}</Text>
              <Text style={styles.staffSpeciality} numberOfLines={1}>{staff.specialization || 'Specialist'}</Text>
              <Text style={styles.staffExperience}>{staff.experience || 0} yrs exp.</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No staff profiles available right now.</Text>
        )}
      </ScrollView>

      <SectionHeader title="Recent Activity" />
      {recentAppointments.length ? (
        recentAppointments.slice(0, 4).map((appointment) => (
          <AppointmentCard key={appointment.id} title={`Appointment #${appointment.id}`} appointment={appointment} />
        ))
      ) : (
        <View style={styles.emptyCard}>
          <MaterialIcons name="history" size={24} color="#a9b3d4" />
          <Text style={styles.emptyText}>No recent appointments found.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f7f9fc' },
  content: { padding: 16, paddingBottom: 30 },
  contentCompact: { padding: 12, paddingBottom: 26 },
  centerPage: { flex: 1, backgroundColor: '#f7f9fc', alignItems: 'center', justifyContent: 'center', padding: 20 },
  loadingText: { marginTop: 12, color: '#60708f', fontSize: 13, fontWeight: '700' },

  topPanel: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e8edf7',
    shadowColor: '#1c2742',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 7
  },
  topPanelCompact: { padding: 13, borderRadius: 20 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  greeting: { color: '#16213f', fontSize: 18, fontWeight: '900' },
  todayText: { color: '#7b859d', fontSize: 12, fontWeight: '700', marginTop: 4 },
  profileImage: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#dfe6ff' },
  avatar: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#e9f1ff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#dbe6ff' },
  avatarText: { color: '#4f7cff', fontSize: 18, fontWeight: '900' },

  hero: {
    backgroundColor: '#18233f',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden'
  },
  heroText: { flex: 1, paddingRight: 12 },
  heroKicker: { color: '#8fb3ff', fontSize: 12, fontWeight: '900', marginBottom: 7, textTransform: 'uppercase' },
  heroTitle: { color: '#ffffff', fontSize: 24, fontWeight: '900', lineHeight: 30 },
  heroTitleCompact: { fontSize: 21, lineHeight: 27 },
  heroSub: { color: '#d8e1f5', fontSize: 13, marginTop: 9, lineHeight: 19, fontWeight: '600' },
  heroBadge: { width: 86, height: 86, borderRadius: 28, backgroundColor: '#263657', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#3b4d74' },
  heroBadgeValue: { color: '#ffffff', fontSize: 24, fontWeight: '900' },
  heroBadgeLabel: { color: '#aebce0', fontSize: 11, fontWeight: '800', marginTop: 2 },
  quickRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  quickAction: { flex: 1, backgroundColor: '#f5f7fb', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 8, alignItems: 'center', borderWidth: 1, borderColor: '#edf1f8' },
  quickIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 7 },
  quickLabel: { color: '#293550', fontSize: 11, fontWeight: '900', textAlign: 'center' },

  errorBox: {
    marginTop: 14,
    backgroundColor: '#fff0f2',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  errorText: { flex: 1, color: '#c94a59', fontSize: 12, fontWeight: '600' },

  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
  metricCard: {
    width: '48.5%',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 13,
    borderTopWidth: 4,
    borderWidth: 1,
    borderColor: '#edf1f8',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#1c2742',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3
  },
  metricCardCompact: { padding: 11 },
  metricIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  metricCopy: { flex: 1 },
  metricValue: { color: '#16213f', fontSize: 22, fontWeight: '900' },
  metricLabel: { color: '#69748e', fontSize: 11, fontWeight: '800', marginTop: 2 },

  progressCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#edf1f8',
    shadowColor: '#1c2742',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  progressTitle: { color: '#16213f', fontSize: 15, fontWeight: '900' },
  progressHint: { color: '#74809a', fontSize: 12, marginTop: 4, fontWeight: '600' },
  progressPercent: { color: '#149688', fontSize: 22, fontWeight: '900' },
  progressTrack: { height: 9, backgroundColor: '#edf2f7', borderRadius: 8, overflow: 'hidden', marginTop: 14 },
  progressFill: { height: '100%', backgroundColor: '#2f9e62', borderRadius: 8 },

  sectionHeader: { marginTop: 20, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { color: '#16213f', fontSize: 18, fontWeight: '900' },
  sectionAction: { color: '#6c7894', fontSize: 12, fontWeight: '800' },

  appointmentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderColor: '#edf1f8',
    shadowColor: '#1c2742',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3
  },
  featuredAppointment: { borderLeftWidth: 4, borderLeftColor: '#4f7cff' },
  appointmentIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#eef3ff', alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#f0f3fb', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { color: '#16213f', fontSize: 14, fontWeight: '900', flex: 1 },
  appointmentName: { color: '#4f7cff', fontSize: 14, fontWeight: '700', marginTop: 6, marginBottom: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  cardMeta: { color: '#74809a', fontSize: 12, fontWeight: '700' },
  statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, fontSize: 11, fontWeight: '800', overflow: 'hidden' },

  horizontalList: { paddingRight: 16, gap: 12 },
  serviceCard: {
    width: 142,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 10,
    borderWidth: 1,
    borderColor: '#edf1f8',
    shadowColor: '#1c2742',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3
  },
  serviceImage: { width: '100%', height: 82, borderRadius: 14, backgroundColor: '#eef2ff' },
  serviceFallback: { height: 82, borderRadius: 14, backgroundColor: '#eef3ff', alignItems: 'center', justifyContent: 'center' },
  serviceTitle: { color: '#16213f', fontSize: 13, fontWeight: '900', marginTop: 9, minHeight: 34 },
  serviceCategory: { color: '#74809a', fontSize: 12, fontWeight: '700', marginTop: 3 },

  staffCard: {
    width: 132,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#edf1f8',
    shadowColor: '#1c2742',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3
  },
  staffImage: { width: 58, height: 58, borderRadius: 18, backgroundColor: '#eef2ff' },
  staffAvatar: { width: 58, height: 58, borderRadius: 18, backgroundColor: '#eef3ff', alignItems: 'center', justifyContent: 'center' },
  staffAvatarText: { color: '#4f7cff', fontSize: 17, fontWeight: '800' },
  staffName: { color: '#16213f', fontSize: 13, fontWeight: '900', marginTop: 10, maxWidth: '100%' },
  staffSpeciality: { color: '#6f7894', fontSize: 12, marginTop: 3, maxWidth: '100%', fontWeight: '600' },
  staffExperience: { color: '#149688', fontSize: 11, fontWeight: '900', marginTop: 6 },

  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  emptyText: { color: '#74809a', fontSize: 13, fontWeight: '700' }
});
