import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { C } from '../config/theme';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const getInitials = (name = 'P') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('') || 'P';

const display = (value, fallback = 'Not provided') => {
  if (value === 0) return '0';
  return value ? String(value) : fallback;
};

function DetailRow({ icon, label, value }) {
  return (
    <View style={s.detailRow}>
      <View style={s.detailIcon}>
        <MaterialIcons name={icon} size={18} color={C.primary} />
      </View>
      <View style={s.detailCopy}>
        <Text style={s.detailLabel}>{label}</Text>
        <Text style={s.detailValue} numberOfLines={2}>{display(value)}</Text>
      </View>
    </View>
  );
}

export default function ProfileScreen({ user, onLogout }) {
  const { width } = useWindowDimensions();
  const compact = width < 380;
  const [loggingOut, setLoggingOut] = useState(false);

  const address = useMemo(
    () => [user.houseNumber, user.address, user.landmark, user.city].filter(Boolean).join(', '),
    [user.address, user.city, user.houseNumber, user.landmark]
  );

  const handleLogout = async () => {
    setLoggingOut(true);
    await wait(250);
    onLogout();
    setLoggingOut(false);
  };

  return (
    <ScrollView style={s.page} contentContainerStyle={[s.content, compact && s.contentCompact]} showsVerticalScrollIndicator={false}>

      {/* ── Header banner ── */}
      <View style={s.banner}>
        <View style={s.bannerTop}>
          <View style={s.avatarWrap}>
            <Text style={s.avatarText}>{getInitials(user.name)}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={s.bannerName} numberOfLines={1}>{display(user.name, 'Patient')}</Text>
            <Text style={s.bannerPhone} numberOfLines={1}>{display(user.phone, 'Phone not added')}</Text>
            <View style={s.activePill}>
              <View style={s.activeDot} />
              <Text style={s.activeText}>Active Patient</Text>
            </View>
          </View>
        </View>

        {/* quick vitals */}
        <View style={s.vitalsRow}>
          <View style={s.vitalItem}>
            <Text style={s.vitalValue}>{display(user.age, '--')}</Text>
            <Text style={s.vitalLabel}>Age</Text>
          </View>
          <View style={s.vitalDivider} />
          <View style={s.vitalItem}>
            <Text style={s.vitalValue}>{display(user.gender, '--')}</Text>
            <Text style={s.vitalLabel}>Gender</Text>
          </View>
          <View style={s.vitalDivider} />
          <View style={s.vitalItem}>
            <Text style={s.vitalValue}>{display(user.bloodGroup, '--')}</Text>
            <Text style={s.vitalLabel}>Blood</Text>
          </View>
          <View style={s.vitalDivider} />
          <View style={s.vitalItem}>
            <Text style={s.vitalValue}>{display(user.city, '--')}</Text>
            <Text style={s.vitalLabel}>City</Text>
          </View>
        </View>
      </View>

      {/* ── Contact info ── */}
      <View style={s.card}>
        <View style={s.cardHeader}>
          <View style={s.cardHeaderIcon}>
            <MaterialIcons name="contact-phone" size={18} color={C.primary} />
          </View>
          <Text style={s.cardTitle}>Contact Information</Text>
        </View>
        <DetailRow icon="phone"      label="Phone Number" value={user.phone} />
        <DetailRow icon="email"      label="Email Address" value={user.email} />
        <DetailRow icon="location-on" label="Full Address"  value={address} />
      </View>

      {/* ── Account info ── */}
      <View style={s.card}>
        <View style={s.cardHeader}>
          <View style={s.cardHeaderIcon}>
            <MaterialIcons name="manage-accounts" size={18} color={C.primary} />
          </View>
          <Text style={s.cardTitle}>Account Details</Text>
        </View>
        <DetailRow icon="badge"       label="Role"       value={user.role} />
        <DetailRow icon="event-note"  label="Last Visit"  value={user.lastVisit} />
        <DetailRow icon="event-available" label="Next Appointment" value={user.nextAppointment} />
      </View>

      {/* ── Health message ── */}
      {user.message ? (
        <View style={s.messageCard}>
          <MaterialIcons name="health-and-safety" size={20} color={C.accent} />
          <Text style={s.messageText}>{user.message}</Text>
        </View>
      ) : null}

      {/* ── Logout ── */}
      <TouchableOpacity disabled={loggingOut} style={[s.logoutBtn, loggingOut && s.btnDisabled]} onPress={handleLogout}>
        {loggingOut
          ? <ActivityIndicator color={C.danger} />
          : <>
              <MaterialIcons name="logout" size={18} color={C.danger} />
              <Text style={s.logoutText}>Sign Out</Text>
            </>
        }
      </TouchableOpacity>

      <Text style={s.version}>HealthCare Patient App · v1.0</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page:           { flex: 1, backgroundColor: C.bg },
  content:        { padding: 16, paddingBottom: 110 },
  contentCompact: { padding: 12, paddingBottom: 100 },

  /* banner */
  banner: { backgroundColor: C.primary, borderRadius: 24, padding: 20, marginBottom: 14, shadowColor: C.primaryDark, shadowOpacity: 0.22, shadowRadius: 16, elevation: 7 },
  bannerTop:   { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  avatarWrap:  { width: 64, height: 64, borderRadius: 20, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#ffffff55' },
  avatarText:  { color: C.primary, fontSize: 22, fontWeight: '900' },
  bannerName:  { color: '#fff', fontSize: 18, fontWeight: '800' },
  bannerPhone: { color: '#bae6fd', fontSize: 13, fontWeight: '600', marginTop: 3 },
  activePill:  { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8, backgroundColor: '#ffffff22', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start' },
  activeDot:   { width: 7, height: 7, borderRadius: 4, backgroundColor: '#6ee7b7' },
  activeText:  { color: '#fff', fontSize: 11, fontWeight: '700' },

  vitalsRow:    { flexDirection: 'row', backgroundColor: '#ffffff18', borderRadius: 16, padding: 14 },
  vitalItem:    { flex: 1, alignItems: 'center' },
  vitalDivider: { width: 1, backgroundColor: '#ffffff30', marginVertical: 2 },
  vitalValue:   { color: '#fff', fontSize: 15, fontWeight: '900' },
  vitalLabel:   { color: '#bae6fd', fontSize: 11, fontWeight: '600', marginTop: 4 },

  /* cards */
  card: { backgroundColor: C.bgCard, borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border, shadowColor: C.shadow, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
  cardHeader:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.borderLight },
  cardHeaderIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  cardTitle:      { color: C.textPrimary, fontSize: 15, fontWeight: '800' },

  detailRow:   { flexDirection: 'row', alignItems: 'center', paddingTop: 13 },
  detailIcon:  { width: 36, height: 36, borderRadius: 12, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  detailCopy:  { flex: 1, marginLeft: 12 },
  detailLabel: { color: C.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  detailValue: { color: C.textPrimary, fontSize: 14, fontWeight: '700', marginTop: 3, lineHeight: 20 },

  /* message */
  messageCard: { backgroundColor: C.accentLight, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12, borderWidth: 1, borderColor: '#a7f3d0' },
  messageText: { flex: 1, color: '#065f46', fontSize: 13, fontWeight: '600', lineHeight: 20 },

  /* logout */
  logoutBtn:  { backgroundColor: C.dangerLight, borderRadius: 16, paddingVertical: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#fecaca', marginBottom: 16 },
  logoutText: { color: C.danger, fontSize: 15, fontWeight: '800' },
  btnDisabled:{ opacity: 0.8 },

  version: { textAlign: 'center', color: C.textMuted, fontSize: 11, fontWeight: '600' },
});
