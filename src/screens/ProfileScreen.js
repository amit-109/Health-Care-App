import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getInitials = (name = 'P') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'P';

const display = (value, fallback = 'Not provided') => {
  if (value === 0) return '0';
  return value ? String(value) : fallback;
};

function DetailRow({ icon, label, value }) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <MaterialIcons name={icon} size={18} color="#4f7cff" />
      </View>
      <View style={styles.detailCopy}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue} numberOfLines={2}>{display(value)}</Text>
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

  const handleLogoutPress = async () => {
    setLoggingOut(true);
    await wait(250);
    onLogout();
    setLoggingOut(false);
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={[styles.content, compact && styles.contentCompact]} showsVerticalScrollIndicator={false}>
      <Text style={[styles.title, compact && styles.titleCompact]}>Profile</Text>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
        </View>
        <View style={styles.profileCopy}>
          <Text style={styles.name} numberOfLines={1}>{display(user.name, 'Patient')}</Text>
          <Text style={styles.meta} numberOfLines={1}>{display(user.phone, 'Phone not added')}</Text>
        </View>
        <View style={styles.activePill}>
          <MaterialIcons name="verified" size={14} color="#149688" />
          <Text style={styles.activeText}>Active</Text>
        </View>
      </View>

      <View style={styles.quickStats}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{display(user.age, '--')}</Text>
          <Text style={styles.statLabel}>Age</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{display(user.gender, '--')}</Text>
          <Text style={styles.statLabel}>Gender</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{display(user.bloodGroup, '--')}</Text>
          <Text style={styles.statLabel}>Blood</Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Contact</Text>
        <DetailRow icon="phone" label="Phone" value={user.phone} />
        <DetailRow icon="email" label="Email" value={user.email} />
        <DetailRow icon="place" label="Address" value={address} />
      </View>

      <TouchableOpacity disabled={loggingOut} style={[styles.logoutButton, loggingOut && styles.buttonDisabled]} onPress={handleLogoutPress}>
        {loggingOut ? (
          <ActivityIndicator color="#e84d5b" />
        ) : (
          <>
            <MaterialIcons name="logout" size={18} color="#e84d5b" />
            <Text style={styles.logoutText}>Logout</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f5f7ff' },
  content: { padding: 16, paddingBottom: 132 },
  contentCompact: { padding: 12, paddingBottom: 128 },
  title: { color: '#16213f', fontSize: 26, fontWeight: '900', marginBottom: 16 },
  titleCompact: { fontSize: 23 },

  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e8edf7',
    shadowColor: '#1c2742',
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 5
  },
  avatar: { width: 58, height: 58, borderRadius: 18, backgroundColor: '#e9f1ff', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#4f7cff', fontSize: 20, fontWeight: '900' },
  profileCopy: { flex: 1, marginLeft: 12 },
  name: { color: '#16213f', fontSize: 18, fontWeight: '900' },
  meta: { color: '#74809a', fontSize: 12, fontWeight: '700', marginTop: 4 },
  activePill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#e8fbf4', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6 },
  activeText: { color: '#149688', fontSize: 11, fontWeight: '900' },

  quickStats: { flexDirection: 'row', gap: 10, marginTop: 12 },
  statBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e8edf7'
  },
  statValue: { color: '#16213f', fontSize: 16, fontWeight: '900' },
  statLabel: { color: '#74809a', fontSize: 11, fontWeight: '800', marginTop: 4 },

  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e8edf7',
    shadowColor: '#1c2742',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3
  },
  sectionTitle: { color: '#16213f', fontSize: 17, fontWeight: '900', marginBottom: 2 },
  detailRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 14 },
  detailIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: '#eef3ff', alignItems: 'center', justifyContent: 'center' },
  detailCopy: { flex: 1, marginLeft: 12 },
  detailLabel: { color: '#74809a', fontSize: 12, fontWeight: '800' },
  detailValue: { color: '#16213f', fontSize: 14, fontWeight: '800', marginTop: 3, lineHeight: 19 },

  logoutButton: {
    marginTop: 14,
    backgroundColor: '#fff0f2',
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffd6dc'
  },
  logoutText: { color: '#e84d5b', fontSize: 15, fontWeight: '900', marginLeft: 8 },
  buttonDisabled: { opacity: 0.8 }
});
