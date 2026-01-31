import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, FlatList, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function History() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [history, setHistory] = useState<any[]>([]);
  const [latestTime, setLatestTime] = useState('--:--');

  // useFocusEffect ensures the list refreshes every time the tab is visited
  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const loadHistory = async () => {
    try {
      const json = await AsyncStorage.getItem('raceHistory');
      if (json) {
        const data = JSON.parse(json);
        setHistory(data);
        
        // Displays the most recent session time
        if (data.length > 0) {
            setLatestTime(data[0].totalTime);
        }
      }
    } catch (e) {
      console.error("Error loading history", e);
    }
  };

  const clearHistory = async () => {
    Alert.alert(
      "DELETE ALL LOGS", 
      "This will permanently erase your race history. Proceed?", 
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete Everything", 
          style: 'destructive', 
          onPress: async () => {
            await AsyncStorage.removeItem('raceHistory');
            setHistory([]);
            setLatestTime('--:--');
          }
        }
      ]
    );
  };

  const renderHistoryItem = ({ item, index }: { item: any, index: number }) => {
    // Determine if entry is a full simulation or a manual log based on split data
    const isRace = item.splits && item.splits.length > 0;

    return (
      <TouchableOpacity 
        key={index} 
        style={[
            styles.card, 
            { borderLeftColor: isRace ? '#FFD700' : (item.type === 'RUN' ? '#32D74B' : '#FF453A') }
        ]}
        activeOpacity={0.7}
        onPress={() => {
            if (isRace) {
                // Route to full simulation details
                router.push({
                    pathname: "/log_details",
                    params: { 
                        data: JSON.stringify(item.splits),
                        date: item.date,
                        totalTime: item.totalTime
                    }
                });
            } else {
                // Route to customized manual briefing
                router.push({
                    pathname: "/manual_log_details",
                    params: { 
                        type: item.type, 
                        totalTime: item.totalTime, 
                        date: item.date, 
                        note: item.note 
                    }
                });
            }
        }}
      >
        <View style={styles.cardHeader}>
            <View>
                <Text style={styles.dateText}>{item.date}</Text>
                <Text style={styles.raceName}>
                    {isRace ? (item.name || 'HYROX SIMULATION') : `${item.type} SESSION`}
                </Text>
            </View>
            <Text style={styles.timeText}>{item.totalTime}</Text>
        </View>
        
        <View style={styles.footerRow}>
            <Text style={styles.detailLink}>
                {isRace ? 'VIEW ANALYTICS' : 'VIEW DEBRIEF'}
            </Text>
            <Text style={styles.arrow}>→</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* HEADER SECTION */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View>
            <Text style={styles.title}>MISSION <Text style={{color: '#FFD700'}}>LOGS</Text></Text>
            <Text style={styles.subtitle}>{history.length} ENTRIES RECORDED</Text>
        </View>
        <View style={styles.statBox}>
            <Text style={styles.statLabel}>LATEST</Text>
            <Text style={styles.statValue}>{latestTime}</Text>
        </View>
      </View>

      <FlatList
        data={history}
        keyExtractor={(_, index) => index.toString()}
        renderItem={renderHistoryItem}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <Ionicons name="clipboard-outline" size={48} color="#333" />
                <Text style={styles.emptyText}>NO DATA FOUND</Text>
                <Text style={styles.emptySub}>Finish a mission to unlock your history.</Text>
            </View>
        }
        ListFooterComponent={
            history.length > 0 ? (
                <TouchableOpacity style={styles.clearBtn} onPress={clearHistory}>
                    <Text style={styles.clearText}>RESET ALL HISTORY</Text>
                </TouchableOpacity>
            ) : null
        }
      />
      <View style={{ height: 80 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingBottom: 25, 
    paddingHorizontal: 20, 
    backgroundColor: '#000' 
  },
  title: { color: '#fff', fontSize: 24, fontWeight: '900', fontStyle: 'italic' },
  subtitle: { color: '#666', fontSize: 10, fontWeight: 'bold', letterSpacing: 1.5, marginTop: 2 },
  statBox: { alignItems: 'flex-end', backgroundColor: '#1E1E1E', padding: 10, borderRadius: 8, minWidth: 80 },
  statLabel: { color: '#FFD700', fontWeight: 'bold', fontSize: 10 },
  statValue: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  scroll: { padding: 20 },
  emptyContainer: { alignItems: 'center', marginTop: 80, opacity: 0.5 },
  emptyText: { color: '#fff', fontSize: 24, fontWeight: '900', marginTop: 10 },
  emptySub: { color: '#666', fontSize: 14, marginTop: 10, textAlign: 'center' },
  card: { 
    backgroundColor: '#1E1E1E', 
    padding: 20, 
    borderRadius: 12, 
    marginBottom: 16, 
    borderLeftWidth: 4, 
  },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    borderBottomWidth: 1, 
    borderBottomColor: '#2A2A2A', 
    paddingBottom: 15 
  },
  dateText: { color: '#888', fontSize: 12, fontWeight: 'bold' },
  raceName: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginTop: 2, textTransform: 'uppercase' },
  timeText: { color: '#fff', fontSize: 26, fontWeight: '900', fontStyle: 'italic' },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, alignItems: 'center' },
  detailLink: { color: '#FFD700', fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },
  arrow: { color: '#FFD700', fontSize: 16, fontWeight: 'bold' },
  clearBtn: { marginTop: 30, alignItems: 'center', padding: 15 },
  clearText: { color: '#444', fontWeight: 'bold', fontSize: 12, letterSpacing: 1 }
});