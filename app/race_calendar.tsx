import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Linking, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// --- MOCK DATA: 2026 RACE CALENDAR ---
const RACES = [
  // UK & IRELAND
  { id: '1', city: 'LONDON', date: '2026-05-04', region: 'UK & IRE', venue: 'Olympia', status: 'SOLD OUT' },
  { id: '2', city: 'GLASGOW', date: '2026-03-02', region: 'UK & IRE', venue: 'SEC Centre', status: 'OPEN' },
  { id: '3', city: 'MANCHESTER', date: '2026-01-28', region: 'UK & IRE', venue: 'Central Convention', status: 'WAITLIST' },
  { id: '4', city: 'DUBLIN', date: '2026-11-15', region: 'UK & IRE', venue: 'RDS Simmonscourt', status: 'OPEN' },

  // EUROPE
  { id: '5', city: 'STOCKHOLM', date: '2026-06-25', region: 'EUROPE', venue: 'Strawberry Arena', status: 'OPEN' },
  { id: '6', city: 'BERLIN', date: '2026-04-12', region: 'EUROPE', venue: 'Messe Berlin', status: 'SELLING FAST' },
  { id: '7', city: 'AMSTERDAM', date: '2026-10-08', region: 'EUROPE', venue: 'RAI Amsterdam', status: 'OPEN' },
  { id: '8', city: 'MADRID', date: '2026-09-22', region: 'EUROPE', venue: 'IFEMA', status: 'OPEN' },

  // USA
  { id: '9', city: 'NEW YORK', date: '2026-06-12', region: 'NORTH AMERICA', venue: 'Javits Center', status: 'OPEN' },
  { id: '10', city: 'CHICAGO', date: '2026-11-05', region: 'NORTH AMERICA', venue: 'Navy Pier', status: 'OPEN' },
  { id: '11', city: 'DALLAS', date: '2026-02-14', region: 'NORTH AMERICA', venue: 'Kay Bailey Hutchison', status: 'SOLD OUT' },
  
  // APAC / MIDDLE EAST
  { id: '12', city: 'DUBAI', date: '2026-09-02', region: 'APAC / ME', venue: 'World Trade Centre', status: 'OPEN' },
  { id: '13', city: 'SYDNEY', date: '2026-08-18', region: 'APAC / ME', venue: 'ICC Sydney', status: 'SELLING FAST' },
  { id: '14', city: 'HONG KONG', date: '2026-10-25', region: 'APAC / ME', venue: 'AsiaWorld-Expo', status: 'OPEN' },
];

const REGIONS = ["ALL", "UK & IRE", "EUROPE", "NORTH AMERICA", "APAC / ME"];

export default function RaceCalendar() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeRegion, setActiveRegion] = useState("ALL");

  // Filter Logic
  const filteredRaces = activeRegion === "ALL" 
    ? RACES.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    : RACES.filter(r => r.region === activeRegion).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const handleBooking = () => {
    Linking.openURL('https://hyrox.com/find-my-race/');
  };

  const renderItem = ({ item }: any) => {
    const dateObj = new Date(item.date);
    const day = dateObj.getDate();
    const month = dateObj.toLocaleString('default', { month: 'short' }).toUpperCase();
    
    // Status Color Logic
    let statusColor = '#32D74B'; // Green (Open)
    if (item.status === 'SOLD OUT') statusColor = '#FF453A';
    if (item.status === 'WAITLIST') statusColor = '#FFD700';
    if (item.status === 'SELLING FAST') statusColor = '#FF9500';

    return (
      <View style={styles.raceCard}>
        {/* Date Box */}
        <View style={styles.dateBox}>
            <Text style={styles.monthText}>{month}</Text>
            <Text style={styles.dayText}>{day}</Text>
        </View>

        {/* Info */}
        <View style={styles.infoCol}>
            <View style={styles.topRow}>
                <Text style={styles.cityText}>{item.city}</Text>
                <View style={[styles.statusBadge, { borderColor: statusColor }]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
                </View>
            </View>
            <Text style={styles.venueText}>{item.venue}</Text>
            <Text style={styles.regionTag}>{item.region}</Text>
        </View>

        {/* Action */}
        <TouchableOpacity style={styles.arrowBtn} onPress={handleBooking}>
             <Ionicons name="arrow-forward-circle-outline" size={32} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backLink}>← BACK TO DISCOVER</Text>
        </TouchableOpacity>
        <Text style={styles.title}>GLOBAL <Text style={{color: '#FFD700'}}>DEPLOYMENTS</Text></Text>
        <Text style={styles.subtitle}>{filteredRaces.length} EVENTS FOUND</Text>
      </View>

      {/* Region Filter */}
      <View style={styles.filterContainer}>
        <FlatList
            horizontal
            data={REGIONS}
            keyExtractor={item => item}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
            renderItem={({ item }) => (
                <TouchableOpacity 
                    style={[styles.filterChip, activeRegion === item && styles.filterChipActive]}
                    onPress={() => setActiveRegion(item)}
                >
                    <Text style={[styles.filterText, activeRegion === item && { color: '#000' }]}>{item}</Text>
                </TouchableOpacity>
            )}
        />
      </View>

      {/* Race List */}
      <FlatList 
        data={filteredRaces}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
            <Text style={styles.emptyText}>No races scheduled in this region yet.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { paddingHorizontal: 25, paddingBottom: 15, backgroundColor: '#121212', borderBottomWidth: 1, borderBottomColor: '#222' },
  backBtn: { marginBottom: 15 },
  backLink: { color: '#FFD700', fontWeight: '900', fontSize: 11, letterSpacing: 1 },
  title: { color: '#fff', fontSize: 32, fontWeight: '900', fontStyle: 'italic', letterSpacing: -1 },
  subtitle: { color: '#666', fontSize: 11, fontWeight: 'bold', letterSpacing: 1, marginTop: 4 },

  filterContainer: { height: 60, justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: '#222' },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: '#333' },
  filterChipActive: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
  filterText: { color: '#888', fontSize: 11, fontWeight: '900' },

  listContent: { padding: 20, paddingBottom: 50 },
  emptyText: { color: '#666', textAlign: 'center', marginTop: 50, fontWeight: 'bold' },

  raceCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E1E1E', padding: 15, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#333' },
  dateBox: { alignItems: 'center', backgroundColor: '#121212', padding: 10, borderRadius: 12, width: 60, marginRight: 15 },
  monthText: { color: '#FFD700', fontSize: 10, fontWeight: '900' },
  dayText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  
  infoCol: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  cityText: { color: '#fff', fontSize: 18, fontWeight: '900', fontStyle: 'italic' },
  statusBadge: { borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  statusText: { fontSize: 8, fontWeight: '900' },
  venueText: { color: '#ccc', fontSize: 12, fontWeight: '500' },
  regionTag: { color: '#666', fontSize: 10, fontWeight: 'bold', marginTop: 4 },

  arrowBtn: { padding: 5 },
});