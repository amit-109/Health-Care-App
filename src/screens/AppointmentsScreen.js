import { FlatList, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

export default function AppointmentsScreen({ appointments }) {
  const { width } = useWindowDimensions();
  const compact = width < 380;

  return (
    <View style={[styles.page, compact && styles.pageCompact]}>
      <Text style={[styles.title, compact && styles.titleCompact]}>Upcoming Appointments</Text>
      <FlatList
        data={appointments}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.card, compact && styles.cardCompact]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.type}</Text>
              <Text style={[styles.status, item.status === 'Confirmed' ? styles.confirmed : styles.pending]}>{item.status}</Text>
            </View>
            <Text style={styles.cardText}>{`${item.date} • ${item.time}`}</Text>
            <Text style={styles.doctor}>Doctor: {item.doctor}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#f5f7ff',
    padding: 16
  },
  pageCompact: {
    padding: 14
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#232b42',
    marginBottom: 16
  },
  titleCompact: {
    fontSize: 18
  },
  list: {
    paddingBottom: 22
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#2f3a4a',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 5
  },
  cardCompact: {
    padding: 14
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2d55',
    paddingRight: 8
  },
  status: {
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    color: '#ffffff'
  },
  confirmed: {
    backgroundColor: '#4f7cff'
  },
  pending: {
    backgroundColor: '#f8b334'
  },
  cardText: {
    fontSize: 14,
    color: '#5e688c',
    marginBottom: 7
  },
  doctor: {
    fontSize: 13,
    color: '#5a5f6e'
  }
});
