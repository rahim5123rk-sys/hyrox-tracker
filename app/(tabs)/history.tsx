import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function History() {
  const router = useRouter();
  const [history, setHistory] = useState<any[]>([]);
  const [latestTime, setLatestTime] = useState('--:--');

  // useFocusEffect ensures that every time you click the "LOG" tab,
  // it refreshes the list with your latest race data.
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
        
        // FIX: Display LATEST session time instead of PB.
        // Since logs are saved [new, old...], index 0 is always the latest.
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* HEADER SECTION */}
      <View style={styles.header}>
        <View>
            <Text style={styles.title}>PERFORMANCE <Text style={{color: '#FFD700'}}>LOG</Text></Text>
            <Text style={styles.subtitle}>{history.length} SESSIONS COMPLETED</Text>
        </View>
        <View style={styles.statBox}>
            <Text style={styles.statLabel}>LATEST</Text>
            <Text style={styles.statValue}>{latestTime}</Text>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {history.length === 0 ? (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>NO DATA FOUND</Text>
                <Text style={styles.emptySub}>Finish a race simulation to unlock your history.</Text>
            </View>
        ) : (
            history.map((race, index) => (
                <TouchableOpacity 
                    key={index} 
                    style={styles.card}
                    activeOpacity={0.7}
                    onPress={() => {
                        router.push({
                            pathname: "/log_details",
                            params: { 
                                data: JSON.stringify(race.splits),
                                date: race.date,
                                totalTime: race.totalTime
                            }
                        });
                    }}
                >
                    <View style={styles.cardHeader}>
                        <View>
                            <Text style={styles.dateText}>{race.date}</Text>
                            {/* Shows specific workout name (e.g. "THE PUNISHER") instead of generic title */}
                            <Text style={styles.raceName}>{race.name || 'HYROX SIMULATION'}</Text>
                        </View>
                        <Text style={styles.timeText}>{race.totalTime}</Text>
                    </View>
                    
                    <View style={styles.footerRow}>
                        <Text style={styles.detailLink}>VIEW ANALYTICS</Text>
                        <Text style={styles.arrow}>→</Text>
                    </View>
                </TouchableOpacity>
            ))
        )}
        
        {history.length > 0 && (
            <TouchableOpacity style={styles.clearBtn} onPress={clearHistory}>
                <Text style={styles.clearText}>RESET ALL HISTORY</Text>
            </TouchableOpacity>
        )}
        
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingTop: 60, 
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
  
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: '#333', fontSize: 24, fontWeight: '900' },
  emptySub: { color: '#666', fontSize: 14, marginTop: 10, textAlign: 'center' },

  card: { 
    backgroundColor: '#1E1E1E', 
    padding: 20, 
    borderRadius: 12, 
    marginBottom: 16, 
    borderLeftWidth: 4, 
    borderLeftColor: '#FFD700',
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