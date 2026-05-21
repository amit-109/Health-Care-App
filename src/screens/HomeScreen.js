import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Image, RefreshControl, ScrollView,
  StyleSheet, Text, TouchableOpacity, View, useWindowDimensions
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { extractPatientDashboard, getAppointmentStatusLabel, getPatientDashboard } from '../api/dashboard';
import { C } from '../config/theme';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const formatDate = (v) => {
  if (!v) return 'Not scheduled';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};

const getHourGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};

const getInitials = (name = 'P') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('') || 'P';

const getServiceName = (s) => s.name || s.serviceName || s.ServiceName || 'Health Service';
const getStaffName   = (s) => s.name || s.fullName || s.staffName || 'Care Specialist';
const getStaffImage  = (s) => s.image || s.profileImage || null;
const getStaffSpec   = (s) => s.specialization || s.Specialization || s.role || 'Specialist';

const STATUS_META = {
  Pending:   C.pending,
  Approved:  C.approved,
  Confirmed: C.approved,
  Completed: C.completed,
  Cancelled: C.cancelled,
  Rejected:  C.cancelled,
};

const getStatusMeta = (status) => {
  const label = getAppointmentStatusLabel(status);
  return { label, ...(STATUS_META[label] || C.pending) };
};

/* ── Stat card ── */
function StatCard({ icon, label, value, color }) {
  return (
    <View style={[st.statCard, { borderTopColor: color }]}>
      <View style={[st.statIcon, { backgroundColor: `${color}18` }]}>
        <MaterialIcons name={icon} size={20} color={color} />
      </View>
      <Text style={st.statValue}>{value ?? 0}</Text>
      <Text style={st.statLabel}>{label}</Text>
    </View>
  );
}

/* ── Section header ── */
function Section({ title, sub }) {
  return (
    <View style={st.section}>
      <Text style={st.sectionTitle}>{title}</Text>
      {sub ? <Text style={st.sectionSub}>{sub}</Text> : null}
    </View>
  );
}

/* ── Appointment card ── */
function ApptCard({ appt, label, accent }) {
  if (!appt) {
    return (
      <View style={[st.apptCard, accent && st.apptCardAccent]}>
        <View style={st.apptIconWrap}>
          <MaterialIcons name="event-available" size={22} color={C.textMuted} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={st.apptLabel}>{label}</Text>
          <Text style={st.apptEmpty}>No appointment scheduled</Text>
        </View>
      </View>
    );
  }
  const meta = getStatusMeta(appt.status);
  return (
    <View style={[st.apptCard, accent && st.apptCardAccent]}>
      <View style={[st.apptIconWrap, { backgroundColor: `${meta.dot}18` }]}>
        <MaterialIcons name="event-note" size={22} color={meta.dot} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={st.apptRow}>
          <Text style={st.apptLabel}>{label}</Text>
          <View style={[st.pill, { backgroundColor: meta.bg }]}>
            <View style={[st.pillDot, { backgroundColor: meta.dot }]} />
            <Text style={[st.pillText, { color: meta.text }]}>{meta.label}</Text>
          </View>
        </View>
        <Text style={st.apptService}>{appt.serviceName || appt.diseaseName || 'Booked Visit'}</Text>
        <View style={st.apptMeta}>
          <MaterialIcons name="calendar-today" size={12} color={C.textMuted} />
          <Text style={st.apptMetaText}>{formatDate(appt.appointmentDate)}</Text>
          {appt.slotTime ? (
            <>
              <View style={st.metaDot} />
              <MaterialIcons name="access-time" size={12} color={C.textMuted} />
              <Text style={st.apptMetaText}>{appt.slotTime}</Text>
            </>
          ) : null}
        </View>
      </View>
    </View>
  );
}

/* ── Main ── */
export default function HomeScreen({ user }) {
  const { width } = useWindowDimensions();
  const compact = width < 380;
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]         = useState('');

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      setDashboard(extractPatientDashboard(await getPatientDashboard()));
    } catch (e) {
      setError(e.message || 'Unable to load dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const summary     = dashboard?.userSummary || {};
  const services    = dashboard?.services || [];
  const staffs      = dashboard?.staffs || [];
  const recentAppts = dashboard?.recentAppointments || [];
  const upcoming    = dashboard?.upcomingAppointment || null;
  const lastAppt    = dashboard?.lastAppointment || null;

  const patientName = summary.name || user?.name || 'Patient';
  const firstName   = patientName.split(' ')[0];
  const total       = Number(summary.totalAppointments || 0);
  const completed   = Number(summary.totalCompleted || 0);
  const pending     = Number(summary.totalPending || 0);
  const approved    = Number(summary.totalApproved || 0);
  const cancelled   = Number(summary.totalCancelled || 0);
  const rate        = useMemo(() => (!total ? 0 : Math.round((completed / total) * 100)), [total, completed]);

  if (loading && !dashboard) {
    return (
      <View style={st.loader}>
        <ActivityIndicator color={C.primary} size="large" />
        <Text style={st.loaderText}>Loading your dashboard…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={st.page}
      contentContainerStyle={[st.content, compact && st.contentCompact]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={C.primary} colors={[C.primary]} />}
    >
      {/* ── Hero ── */}
      <View style={[st.hero, compact && st.heroCompact]}>
        <View style={st.heroTop}>
          <View style={{ flex: 1 }}>
            <Text style={st.greeting}>{getHourGreeting()}, {firstName} 👋</Text>
            <Text style={st.heroDate}>{formatDate(new Date().toISOString())}</Text>
          </View>
          {summary.profileImage
            ? <Image source={{ uri: summary.profileImage }} style={st.avatar} />
            : <View style={st.avatarFallback}><Text style={st.avatarText}>{getInitials(patientName)}</Text></View>
          }
        </View>

        <View style={st.heroStrip}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={st.heroKicker}>PATIENT DASHBOARD</Text>
            <Text style={[st.heroTitle, compact && { fontSize: 18 }]}>{total} Total Visits</Text>
            <Text style={st.heroSub}>{pending} pending · {approved} approved · {cancelled} cancelled</Text>
          </View>
          <View style={st.ring}>
            <Text style={st.ringValue}>{rate}%</Text>
            <Text style={st.ringLabel}>done</Text>
          </View>
        </View>

        <View style={{ gap: 6 }}>
          <View style={st.progressTrack}>
            <View style={[st.progressFill, { width: `${rate}%` }]} />
          </View>
          <Text style={st.progressLabel}>{rate}% completion rate</Text>
        </View>
      </View>

      {/* ── Error ── */}
      {error ? (
        <TouchableOpacity style={st.errorBox} onPress={() => load()}>
          <MaterialIcons name="wifi-off" size={18} color={C.danger} />
          <Text style={st.errorText}>{error}  Tap to retry.</Text>
        </TouchableOpacity>
      ) : null}

      {/* ── Stats ── */}
      <View style={st.statsRow}>
        <StatCard icon="event-note"    label="Total"     value={total}     color={C.primary} />
        <StatCard icon="hourglass-top" label="Pending"   value={pending}   color="#eab308" />
        <StatCard icon="verified"      label="Approved"  value={approved}  color="#3b82f6" />
        <StatCard icon="check-circle"  label="Completed" value={completed} color={C.accent} />
      </View>

      {/* ── Appointments ── */}
      <Section title="Appointments" sub="Your schedule" />
      <ApptCard appt={upcoming} label="Upcoming" accent />
      <ApptCard appt={lastAppt} label="Last Visit" />

      {/* ── Recent ── */}
      {recentAppts.length > 0 && (
        <>
          <Section title="Recent Activity" sub={`${recentAppts.length} records`} />
          {recentAppts.slice(0, 4).map((a, i) => (
            <ApptCard key={a.id || i} appt={a} label={`Visit #${a.id || i + 1}`} />
          ))}
        </>
      )}

      {/* ── Services ── */}
      <Section title="Our Services" sub={`${services.length} available`} />
      {services.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.hList}>
          {services.map((s, i) => (
            <View key={s.id || i} style={st.serviceCard}>
              {s.image
                ? <Image source={{ uri: s.image }} style={st.serviceImg} />
                : <View style={st.serviceFallback}><MaterialIcons name="medical-services" size={26} color={C.primary} /></View>
              }
              <Text style={st.serviceName} numberOfLines={2}>{getServiceName(s)}</Text>
              <Text style={st.serviceCat} numberOfLines={1}>{s.category || s.categoryName || 'Care'}</Text>
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={st.emptyRow}>
          <MaterialIcons name="medical-services" size={20} color={C.textMuted} />
          <Text style={st.emptyText}>No services available right now.</Text>
        </View>
      )}

      {/* ── Staff ── */}
      <Section title="Care Team" sub={`${staffs.length} specialists`} />
      {staffs.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.hList}>
          {staffs.slice(0, 10).map((s, i) => (
            <View key={s.id || i} style={st.staffCard}>
              {getStaffImage(s)
                ? <Image source={{ uri: getStaffImage(s) }} style={st.staffImg} />
                : <View style={st.staffAvatar}><Text style={st.staffAvatarText}>{getInitials(getStaffName(s))}</Text></View>
              }
              <View style={st.staffOnline} />
              <Text style={st.staffName} numberOfLines={1}>{getStaffName(s)}</Text>
              <Text style={st.staffSpec} numberOfLines={1}>{getStaffSpec(s)}</Text>
              <View style={st.staffBadge}>
                <Text style={st.staffBadgeText}>{s.experience || 0} yrs exp</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={st.emptyRow}>
          <MaterialIcons name="people" size={20} color={C.textMuted} />
          <Text style={st.emptyText}>No staff profiles available right now.</Text>
        </View>
      )}

      <View style={{ height: 4 }} />
    </ScrollView>
  );
}

const st = StyleSheet.create({
  page:           { flex: 1, backgroundColor: C.bg },
  content:        { padding: 16, paddingBottom: 110 },
  contentCompact: { padding: 12, paddingBottom: 100 },
  loader:         { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  loaderText:     { marginTop: 12, color: C.textSecondary, fontSize: 13, fontWeight: '600' },

  hero:        { backgroundColor: C.primary, borderRadius: 24, padding: 20, marginBottom: 16, shadowColor: C.primaryDark, shadowOpacity: 0.25, shadowRadius: 18, elevation: 8 },
  heroCompact: { padding: 16, borderRadius: 20 },
  heroTop:     { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  greeting:    { color: '#fff', fontSize: 20, fontWeight: '800' },
  heroDate:    { color: '#bae6fd', fontSize: 12, fontWeight: '600', marginTop: 3 },

  avatar:         { width: 50, height: 50, borderRadius: 16, backgroundColor: C.primaryLight },
  avatarFallback: { width: 50, height: 50, borderRadius: 16, backgroundColor: '#ffffff22', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#ffffff55' },
  avatarText:     { color: '#fff', fontSize: 18, fontWeight: '900' },

  heroStrip:  { backgroundColor: '#ffffff18', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  heroKicker: { color: '#bae6fd', fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginBottom: 4 },
  heroTitle:  { color: '#fff', fontSize: 22, fontWeight: '900' },
  heroSub:    { color: '#bae6fd', fontSize: 12, fontWeight: '600', marginTop: 4, lineHeight: 18 },

  ring:      { width: 70, height: 70, borderRadius: 35, backgroundColor: '#ffffff22', borderWidth: 3, borderColor: '#ffffff44', alignItems: 'center', justifyContent: 'center' },
  ringValue: { color: '#fff', fontSize: 17, fontWeight: '900' },
  ringLabel: { color: '#bae6fd', fontSize: 10, fontWeight: '700' },

  progressTrack: { height: 6, backgroundColor: '#ffffff22', borderRadius: 6, overflow: 'hidden' },
  progressFill:  { height: '100%', backgroundColor: '#6ee7b7', borderRadius: 6 },
  progressLabel: { color: '#bae6fd', fontSize: 11, fontWeight: '600', textAlign: 'right' },

  errorBox:  { backgroundColor: C.dangerLight, borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14, borderWidth: 1, borderColor: '#fecaca' },
  errorText: { flex: 1, color: C.danger, fontSize: 12, fontWeight: '600' },

  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  statCard: { flex: 1, backgroundColor: C.bgCard, borderRadius: 16, padding: 11, alignItems: 'center', borderTopWidth: 3, borderWidth: 1, borderColor: C.border, shadowColor: C.shadow, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  statIcon:  { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 7 },
  statValue: { color: C.textPrimary, fontSize: 19, fontWeight: '900' },
  statLabel: { color: C.textMuted, fontSize: 10, fontWeight: '700', marginTop: 2, textAlign: 'center' },

  section:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 22, marginBottom: 10 },
  sectionTitle: { color: C.textPrimary, fontSize: 17, fontWeight: '800' },
  sectionSub:   { color: C.textMuted, fontSize: 12, fontWeight: '600' },

  apptCard:       { backgroundColor: C.bgCard, borderRadius: 18, padding: 14, marginBottom: 10, flexDirection: 'row', gap: 12, borderWidth: 1, borderColor: C.border, shadowColor: C.shadow, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  apptCardAccent: { borderLeftWidth: 4, borderLeftColor: C.primary },
  apptIconWrap:   { width: 46, height: 46, borderRadius: 14, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  apptRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  apptLabel:      { color: C.textPrimary, fontSize: 13, fontWeight: '800', flex: 1 },
  apptEmpty:      { color: C.textMuted, fontSize: 13, fontWeight: '500', marginTop: 4 },
  apptService:    { color: C.primary, fontSize: 14, fontWeight: '700', marginBottom: 7 },
  apptMeta:       { flexDirection: 'row', alignItems: 'center', gap: 4 },
  apptMetaText:   { color: C.textMuted, fontSize: 12, fontWeight: '600' },
  metaDot:        { width: 3, height: 3, borderRadius: 2, backgroundColor: C.border, marginHorizontal: 2 },

  pill:     { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  pillDot:  { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontSize: 11, fontWeight: '700' },

  hList: { paddingRight: 16, gap: 12 },

  serviceCard:     { width: 138, backgroundColor: C.bgCard, borderRadius: 18, padding: 10, borderWidth: 1, borderColor: C.border, shadowColor: C.shadow, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  serviceImg:      { width: '100%', height: 78, borderRadius: 12, backgroundColor: C.primaryLight },
  serviceFallback: { height: 78, borderRadius: 12, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  serviceName:     { color: C.textPrimary, fontSize: 13, fontWeight: '700', marginTop: 8, lineHeight: 18 },
  serviceCat:      { color: C.textMuted, fontSize: 11, fontWeight: '600', marginTop: 3 },

  staffCard:       { width: 124, backgroundColor: C.bgCard, borderRadius: 18, padding: 13, alignItems: 'center', borderWidth: 1, borderColor: C.border, shadowColor: C.shadow, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2, position: 'relative' },
  staffImg:        { width: 58, height: 58, borderRadius: 18, backgroundColor: C.primaryLight },
  staffAvatar:     { width: 58, height: 58, borderRadius: 18, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  staffAvatarText: { color: C.primary, fontSize: 20, fontWeight: '900' },
  staffOnline:     { position: 'absolute', top: 13, right: 13, width: 10, height: 10, borderRadius: 5, backgroundColor: C.accent, borderWidth: 2, borderColor: '#fff' },
  staffName:       { color: C.textPrimary, fontSize: 13, fontWeight: '800', marginTop: 9, textAlign: 'center' },
  staffSpec:       { color: C.textMuted, fontSize: 11, fontWeight: '600', marginTop: 3, textAlign: 'center' },
  staffBadge:      { marginTop: 8, backgroundColor: C.primaryLight, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  staffBadgeText:  { color: C.primary, fontSize: 11, fontWeight: '700' },

  emptyRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.bgCard, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border },
  emptyText: { color: C.textMuted, fontSize: 13, fontWeight: '600' },
});
