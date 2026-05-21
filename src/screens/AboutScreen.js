import { ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const ABOUT_POINTS = [
  { icon: 'support-agent', title: 'Home care support', text: 'Book trained caretakers and health support services from your phone.' },
  { icon: 'event-available', title: 'Easy appointments', text: 'Select service, share your reason, choose time, and confirm available staff.' },
  { icon: 'verified-user', title: 'Patient first', text: 'Your care details stay organized across bookings, OTP verification, and profile.' }
];

export default function AboutScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const compact = width < 380;

  return (
    <ScrollView style={styles.page} contentContainerStyle={[styles.content, compact && styles.contentCompact]} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={18} color="#ffffff" />
        </TouchableOpacity>
        <Text style={[styles.title, compact && styles.titleCompact]}>About Care Services</Text>
        <Text style={styles.subtitle}>A guided patient app for booking trusted care at your doorstep.</Text>
      </View>

      <View style={styles.card}>
        {ABOUT_POINTS.map((item) => (
          <View key={item.title} style={styles.point}>
            <View style={styles.pointIcon}>
              <MaterialIcons name={item.icon} size={22} color="#1c35ff" />
            </View>
            <View style={styles.pointCopy}>
              <Text style={styles.pointTitle}>{item.title}</Text>
              <Text style={styles.pointText}>{item.text}</Text>
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('Signup')}>
        <Text style={styles.primaryText}>Create Account</Text>
        <MaterialIcons name="arrow-forward" size={18} color="#ffffff" />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#dff5f1' },
  content: { padding: 16, paddingBottom: 30 },
  contentCompact: { padding: 12, paddingBottom: 26 },
  hero: { backgroundColor: '#1c35ff', borderRadius: 28, padding: 18, minHeight: 190, justifyContent: 'flex-end', shadowColor: '#1c35ff', shadowOpacity: 0.24, shadowRadius: 18, elevation: 8 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#ffffff22', alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  title: { color: '#ffffff', fontSize: 30, fontWeight: '900', lineHeight: 36 },
  titleCompact: { fontSize: 26, lineHeight: 32 },
  subtitle: { color: '#dfe6ff', fontSize: 14, lineHeight: 21, fontWeight: '700', marginTop: 10 },
  card: { backgroundColor: '#ffffff', borderRadius: 24, padding: 16, marginTop: 14, borderWidth: 1, borderColor: '#edf0ff', shadowColor: '#1c35ff', shadowOpacity: 0.08, shadowRadius: 14, elevation: 5 },
  point: { flexDirection: 'row', gap: 12, paddingVertical: 12 },
  pointIcon: { width: 46, height: 46, borderRadius: 16, backgroundColor: '#edf0ff', alignItems: 'center', justifyContent: 'center' },
  pointCopy: { flex: 1 },
  pointTitle: { color: '#141c38', fontSize: 15, fontWeight: '900' },
  pointText: { color: '#6d7484', fontSize: 13, lineHeight: 19, fontWeight: '600', marginTop: 4 },
  primaryBtn: { marginTop: 14, backgroundColor: '#1c35ff', borderRadius: 16, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  primaryText: { color: '#ffffff', fontSize: 15, fontWeight: '800' }
});
