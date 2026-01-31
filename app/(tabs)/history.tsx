import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type FilterType = 'SIMS' | 'LAB' | 'LOGS';

export default function History() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [history, setHistory] = useState<any[]>([]);
  const [filter, setFilter] = useState<FilterType>('SIMS');
  const [filteredData, setFilteredData] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [filter])
  );

  const loadHistory = async () => {
    try {
      const json = await AsyncStorage.getItem('raceHistory');
      if (json) {
        const data = JSON.parse(json);
        setHistory(data);
        applyFilter(data, filter);
      }
    } catch (e) {
      console.log('Error', e);
    }
  };

  const applyFilter = (data: any[], currentFilter: FilterType) => {
    const result = data.filter((item) => {
        // --- 1. DETECT FEATURES ---
        const hasSplits = item.splits && Array.isArray(item.splits) && item.splits.length > 0;
        const isTrainingType = item.type === 'WORKOUT' || item.sessionType === 'TRAINING';
        const isSimType = item.title === 'HYROX SIMULATION' || item.type === 'SIMULATION' || item.type === 'RACE';

        // --- 2. CATEGORIZATION LOGIC ---
        
        // A. LOGS (Manual Entries) -> Anything without splits
        const isLog = !hasSplits;

        // B. LAB (Structured Workouts) -> Has Splits AND is marked as Workout/Training
        // (This catches "The Punisher" because we now save it with type='WORKOUT')
        const isLab = hasSplits && (isTrainingType || !isSimType);

        // C. SIMS (Race Day) -> Has Splits AND is marked as Simulation/Race
        const isSim = hasSplits && isSimType;

        // --- 3. FILTER MATCH ---
        if (currentFilter === 'LOGS') return isLog;
        if (currentFilter === 'LAB') return isLab;
        if (currentFilter === 'SIMS') return isSim;
        
        return false;
    });

    setFilteredData(result);
  };

  const clearHistory = async () => {
    Alert.alert("PURGE DATABASE", "Permanently delete all history?", [
        { text: "Cancel", style: "cancel" },
        { text: "Purge", style: 'destructive', onPress: async () => { await AsyncStorage.removeItem('raceHistory'); setHistory([]); setFilteredData([]); }}
    ]);
  };

  const renderItem = ({ item, index }: { item: any, index: number }) => {
    // Determine visuals based on the FILTER, not just the item properties
    let borderColor = '#444'; 
    let iconName = 'trophy';
    let badgeText = 'ENTRY';
    let categoryColor = '#888';

    if (filter === 'SIMS') {
        borderColor = '#FFD700'; // Gold
        iconName = 'trophy';
        badgeText = 'SIMULATION';
        categoryColor = '#FFD700';
    } else if (filter === 'LAB') {
        borderColor = '#0A84FF'; // Blue
        iconName = 'library';
        badgeText = 'LAB WORKOUT';
        categoryColor = '#0A84FF';
    } else {
        // LOGS styling
        if (item.type === 'RUN') { borderColor = '#32D74B'; iconName = 'stopwatch'; badgeText = 'RUN OP'; categoryColor='#32D74B'; }
        else if (item.type === 'STATION') { borderColor = '#FF453A'; iconName = 'barbell'; badgeText = 'STATION'; categoryColor='#FF453A'; }
        else { borderColor = '#FF9F0A'; iconName = 'create'; badgeText = 'MANUAL'; categoryColor='#FF9F0A'; }
    }

    return (
      <TouchableOpacity 
        key={index} 
        style={[styles.card, { borderLeftColor: borderColor }]}
        activeOpacity={0.7}
        onPress={() => {
            // ROUTING LOGIC
            if (filter === 'LOGS') {
                // Logs go to manual debrief
                router.push({ 
                    pathname: "/manual_log_details", 
                    params: { 
                        type: item.type, 
                        totalTime: item.totalTime, 
                        date: item.date, 
                        note: item.note,
                        unit: item.unit 
                    } 
                });
            } else {
                // Sims and Lab (with splits) go to Analytics
                router.push({ 
                    pathname: "/log_details", 
                    params: { data: JSON.stringify(item.splits), date: item.date, totalTime: item.totalTime } 
                });
            }
        }}
      >
        <View style={styles.cardHeader}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                <View style={[styles.miniIcon, {backgroundColor: categoryColor}]}>
                    <Ionicons name={iconName as any} size={16} color="#000" />
                </View>
                <View>
                    <View style={{flexDirection:'row', alignItems:'center', gap: 8}}>
                        <Text style={styles.cardTitle}>
                            {item.title || item.name || item.type}
                        </Text>
                        {filter !== 'SIMS' && (
                            <View style={[styles.badge, {borderColor: categoryColor}]}>
                                <Text style={[styles.badgeText, {color: categoryColor}]}>{badgeText}</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.cardDate}>{item.date}</Text>
                </View>
            </View>
            
            <View style={{alignItems: 'flex-end'}}>
               <Text style={styles.timeText}>{item.totalTime}</Text>
               <Text style={styles.unitText}>{item.unit || (filter !== 'LOGS' ? 'TOTAL' : '')}</Text>
            </View>
        </View>

        {/* Show Notes for Logs/Lab if available */}
        {item.note && filter !== 'SIMS' && (
            <View style={styles.intelBox}>
                <Ionicons name="document-text-outline" size={12} color="#666" style={{marginRight: 6}} />
                <Text numberOfLines={1} style={styles.intelText}>{item.note}</Text>
            </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View>
            <Text style={styles.title}>MISSION <Text style={{color: '#FFD700'}}>LOGS</Text></Text>
            <Text style={styles.subtitle}>DATABASE ACCESS</Text>
        </View>
        <View style={styles.statBadge}>
            <Text style={styles.statNum}>{filteredData.length}</Text>
            <Text style={styles.statLabel}>FILES</Text>
        </View>
      </View>

      <View style={styles.filterRow}>
          <TouchableOpacity onPress={() => setFilter('SIMS')} style={[styles.filterTab, filter === 'SIMS' && styles.filterTabActive]}>
              <Text style={[styles.filterText, filter === 'SIMS' && {color: '#000'}]}>SIMS</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setFilter('LAB')} style={[styles.filterTab, filter === 'LAB' && styles.filterTabActive]}>
              <Text style={[styles.filterText, filter === 'LAB' && {color: '#000'}]}>LAB</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setFilter('LOGS')} style={[styles.filterTab, filter === 'LOGS' && styles.filterTabActive]}>
              <Text style={[styles.filterText, filter === 'LOGS' && {color: '#000'}]}>LOGS</Text>
          </TouchableOpacity>
      </View>

      <FlatList 
        data={filteredData} 
        keyExtractor={(_, index) => index.toString()} 
        renderItem={renderItem} 
        contentContainerStyle={styles.scroll} 
        showsVerticalScrollIndicator={false} 
        ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <Ionicons name="file-tray-outline" size={48} color="#333" />
                <Text style={styles.emptyText}>NO DATA FOUND</Text>
                <Text style={styles.emptySub}>
                    {filter === 'SIMS' ? "Complete a Race Simulation to see data." : 
                     filter === 'LAB' ? "Complete a Training Lab workout." : 
                     "Log a manual run or station session."}
                </Text>
            </View>
        } 
        ListFooterComponent={
            history.length > 0 ? (
                <TouchableOpacity style={styles.clearBtn} onPress={clearHistory}>
                    <Text style={styles.clearText}>PURGE ALL DATA</Text>
                </TouchableOpacity>
            ) : null
        } 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 20, paddingHorizontal: 20, backgroundColor: '#000', borderBottomWidth: 1, borderBottomColor: '#1E1E1E' },
  title: { color: '#fff', fontSize: 24, fontWeight: '900', fontStyle: 'italic' },
  subtitle: { color: '#666', fontSize: 10, fontWeight: 'bold', letterSpacing: 1.5, marginTop: 2 },
  statBadge: { alignItems: 'center', backgroundColor: '#1E1E1E', paddingVertical: 5, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#333' },
  statNum: { color: '#fff', fontSize: 16, fontWeight: '900' },
  statLabel: { color: '#666', fontSize: 8, fontWeight: 'bold' },
  filterRow: { flexDirection: 'row', padding: 15, gap: 8, backgroundColor: '#000' },
  filterTab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: '#333' },
  filterTabActive: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
  filterText: { color: '#888', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  scroll: { padding: 20 },
  emptyContainer: { alignItems: 'center', marginTop: 80, opacity: 0.5 },
  emptyText: { color: '#fff', fontSize: 18, fontWeight: '900', marginTop: 15 },
  emptySub: { color: '#666', fontSize: 12, marginTop: 5 },
  card: { backgroundColor: '#1E1E1E', padding: 16, borderRadius: 16, marginBottom: 12, borderLeftWidth: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  miniIcon: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { color: '#fff', fontSize: 14, fontWeight: '900' },
  cardDate: { color: '#666', fontSize: 10, fontWeight: 'bold', marginTop: 2 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  badgeText: { fontSize: 8, fontWeight: '900' },
  timeText: { color: '#fff', fontSize: 20, fontWeight: '900', fontStyle: 'italic' },
  unitText: { color: '#666', fontSize: 9, fontWeight: 'bold', textAlign: 'right' },
  intelBox: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#2A2A2A' },
  intelText: { color: '#888', fontSize: 11, fontStyle: 'italic', flex: 1 },
  clearBtn: { marginTop: 30, marginBottom: 50, alignItems: 'center', padding: 15, backgroundColor: '#181818', borderRadius: 8 },
  clearText: { color: '#444', fontWeight: '900', fontSize: 10, letterSpacing: 1 }
});