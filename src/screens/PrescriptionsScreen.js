import { FlatList, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

export default function PrescriptionsScreen({ prescriptions }) {
  const { width } = useWindowDimensions();
  const compact = width < 380;

  return (
    <View style={[styles.page, compact && styles.pageCompact]}>
      <Text style={[styles.title, compact && styles.titleCompact]}>Saved Prescriptions</Text>
      <FlatList
        data={prescriptions}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.card, compact && styles.cardCompact]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDate}>{item.date}</Text>
            </View>
            <Text style={styles.medicine}>{item.medicine}</Text>
            <Text style={styles.notes}>{item.notes}</Text>
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
    marginBottom: 10
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2d55',
    paddingRight: 8
  },
  cardDate: {
    fontSize: 12,
    color: '#7c83a0'
  },
  medicine: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4f7cff',
    marginBottom: 7
  },
  notes: {
    fontSize: 13,
    color: '#5e688c',
    lineHeight: 19
  }
});
