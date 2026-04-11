import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { MaterialIcons, Entypo } from '@expo/vector-icons';
import { useState } from 'react';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function ProfileScreen({ user, onLogout }) {
  const { width } = useWindowDimensions();
  const compact = width < 380;
  const [loggingOut, setLoggingOut] = useState(false);

  const fields = [
    { icon: 'email', label: 'Email', value: user.email },
    { icon: 'phone', label: 'Phone', value: user.phone },
    { icon: 'cake', label: 'Age', value: `${user.age} yrs` },
    { icon: 'person', label: 'Gender', value: user.gender },
    { icon: 'opacity', label: 'Blood Group', value: user.bloodGroup },
    { icon: 'location-city', label: 'City', value: user.city }
  ];

  const handleLogoutPress = async () => {
    setLoggingOut(true);
    await wait(350);
    onLogout();
    setLoggingOut(false);
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={[styles.content, compact && styles.contentCompact]} showsVerticalScrollIndicator={false}>
      <View style={[styles.headerCard, compact && styles.headerCardCompact]}>
        <View>
          <Text style={[styles.name, compact && styles.nameCompact]}>{user.name}</Text>
          <Text style={styles.status}>Patient Profile</Text>
        </View>
        <View style={[styles.iconBackground, compact && styles.iconBackgroundCompact]}>
          <Entypo name="heart" size={compact ? 22 : 24} color="#ffffff" />
        </View>
      </View>

      <View style={styles.infoCard}>
        {fields.map((field) => (
          <View style={styles.fieldRow} key={field.label}>
            <MaterialIcons name={field.icon} size={19} color="#4f7cff" />
            <View style={styles.fieldText}>
              <Text style={styles.label}>{field.label}</Text>
              <Text style={styles.value}>{field.value}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.noteCard}>
        <Text style={styles.noteTitle}>Health Reminder</Text>
        <Text style={styles.noteText}>Stay hydrated, keep walking daily, and review your medications before bedtime.</Text>
      </View>

      <TouchableOpacity disabled={loggingOut} style={[styles.logoutButton, loggingOut && styles.buttonDisabled]} onPress={handleLogoutPress}>
        {loggingOut ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <>
            <MaterialIcons name="logout" size={19} color="#ffffff" />
            <Text style={styles.logoutText}>Logout</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#f5f7ff'
  },
  content: {
    padding: 16,
    paddingBottom: 24
  },
  contentCompact: {
    padding: 14
  },
  headerCard: {
    backgroundColor: '#4f7cff',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    shadowColor: '#4f7cff',
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 8
  },
  headerCardCompact: {
    padding: 16
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff'
  },
  nameCompact: {
    fontSize: 20
  },
  status: {
    marginTop: 6,
    color: '#d7e3ff',
    fontSize: 13
  },
  iconBackground: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: '#2e57ff',
    justifyContent: 'center',
    alignItems: 'center'
  },
  iconBackgroundCompact: {
    width: 48,
    height: 48
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#2f3a4a',
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 6
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  fieldText: {
    marginLeft: 12,
    flex: 1
  },
  label: {
    color: '#7d86a1',
    fontSize: 12,
    marginBottom: 3
  },
  value: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2d55'
  },
  noteCard: {
    backgroundColor: '#eef3ff',
    borderRadius: 18,
    padding: 16,
    marginTop: 18
  },
  noteTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2d3d6d',
    marginBottom: 8
  },
  noteText: {
    color: '#5f677f',
    lineHeight: 20,
    fontSize: 13
  },
  logoutButton: {
    marginTop: 18,
    backgroundColor: '#ff6a6a',
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 48
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8
  },
  buttonDisabled: {
    opacity: 0.8
  }
});
