import { ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { AntDesign, Feather, MaterialCommunityIcons } from '@expo/vector-icons';

export default function HomeScreen({ user, appointments, prescriptions }) {
  const { width } = useWindowDimensions();
  const compact = width < 380;
  const singleColumn = width < 350;
  const firstName = user.name.split(' ')[0];
  const nextAppointment = appointments[0]?.date || user.nextAppointment;

  const summaryCards = [
    { id: '1', title: 'Next Appointment', value: nextAppointment, icon: 'calendar', family: 'ant' },
    { id: '2', title: 'Upcoming Medicines', value: prescriptions.length.toString(), icon: 'pill', family: 'mc' },
    { id: '3', title: 'Last Visit', value: user.lastVisit, icon: 'clockcircle', family: 'ant' }
  ];

  return (
    <ScrollView style={styles.page} contentContainerStyle={[styles.content, compact && styles.contentCompact]} showsVerticalScrollIndicator={false}>
      <View style={[styles.headerCard, compact && styles.headerCardCompact]}>
        <View style={styles.headerTextBlock}>
          <Text style={[styles.welcome, compact && styles.welcomeCompact]}>Hello, {firstName}</Text>
          <Text style={[styles.caption, compact && styles.captionCompact]}>{user.message}</Text>
        </View>
        <View style={[styles.avatar, compact && styles.avatarCompact]}>
          <Text style={[styles.avatarText, compact && styles.avatarTextCompact]}>{user.name.charAt(0)}</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, compact && styles.sectionTitleCompact]}>Your Health Summary</Text>

      <View style={[styles.summaryGrid, singleColumn && styles.summaryGridSingle]}>
        {summaryCards.map((item) => (
          <View style={[styles.summaryCard, compact && styles.summaryCardCompact, singleColumn && styles.fullWidthCard]} key={item.id}>
            <View style={styles.summaryIconWrapper}>
              {item.family === 'mc' ? (
                <MaterialCommunityIcons name={item.icon} size={18} color="#4f7cff" />
              ) : (
                <AntDesign name={item.icon} size={18} color="#4f7cff" />
              )}
            </View>
            <Text style={[styles.summaryValue, compact && styles.summaryValueCompact]}>{item.value}</Text>
            <Text style={styles.summaryTitle}>{item.title}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.quickRow, singleColumn && styles.quickRowStack]}>
        <TouchableOpacity style={[styles.quickCard, singleColumn && styles.quickCardFull]}>
          <Feather name="phone-call" size={18} color="#4f7cff" />
          <Text style={styles.quickText}>Call Clinic</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.quickCard, singleColumn && styles.quickCardFull]}>
          <Feather name="calendar" size={18} color="#4f7cff" />
          <Text style={styles.quickText}>Book Visit</Text>
        </TouchableOpacity>
      </View>
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
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    shadowColor: '#2f3a4a',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 6
  },
  headerCardCompact: {
    padding: 16
  },
  headerTextBlock: {
    flex: 1,
    paddingRight: 12
  },
  welcome: {
    fontSize: 22,
    fontWeight: '800',
    color: '#222b42'
  },
  welcomeCompact: {
    fontSize: 20
  },
  caption: {
    marginTop: 8,
    color: '#5f6583',
    lineHeight: 24,
    fontSize: 14
  },
  captionCompact: {
    lineHeight: 22,
    fontSize: 13
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 18,
    backgroundColor: '#eef3ff',
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarCompact: {
    width: 56,
    height: 56
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#4f7cff'
  },
  avatarTextCompact: {
    fontSize: 22
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#232b42',
    marginBottom: 12
  },
  sectionTitleCompact: {
    fontSize: 16
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12
  },
  summaryGridSingle: {
    rowGap: 10
  },
  summaryCard: {
    width: '48%',
    minHeight: 138,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#2f3a4a',
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 5
  },
  summaryCardCompact: {
    padding: 14,
    minHeight: 126
  },
  fullWidthCard: {
    width: '100%'
  },
  summaryIconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#eef3ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14
  },
  summaryValue: {
    fontSize: 19,
    fontWeight: '800',
    color: '#242f54'
  },
  summaryValueCompact: {
    fontSize: 17
  },
  summaryTitle: {
    marginTop: 8,
    color: '#6f7790',
    fontSize: 14,
    lineHeight: 20
  },
  quickRow: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  quickRowStack: {
    flexDirection: 'column',
    gap: 10
  },
  quickCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 14,
    alignItems: 'center',
    shadowColor: '#2f3a4a',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 5
  },
  quickCardFull: {
    width: '100%'
  },
  quickText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '700',
    color: '#2c3452'
  }
});
