import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DataStore } from '../services/DataStore';

export default function History() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [history, setHistory] = useState<any[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'SIMS' | 'LAB' | 'LOGS'>('ALL');

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const loadHistory = async () => {
    try {
      const data = await DataStore.getHistory();
    setHistory(data);
    } catch (e) {
      console.log("Failed to load history");
    }
  };

  const clearHistory = async () => {
      Alert.alert(
          "CONFIRM WIPE",
          "This will permanently delete all operation logs. This cannot be undone.",
          [
              { text: "CANCEL", style: "cancel" },
              { 
                  text: "DELETE ALL", 
                  style: "destructive", 
                  onPress: async () => {
                      await AsyncStorage.removeItem('raceHistory');
                      setHistory([]);
                  }
              }
          ]
      );
  };

  const filteredHistory = history.filter(item => {
    if (filter === 'ALL') return true;
    if (filter === 'SIMS') return item.type === 'SIMULATION';
    if (filter === 'LAB') return item.sessionType === 'TRAINING';
    if (filter === 'LOGS') return item.sessionType === 'QUICK LOG' || (!item.type && !item.sessionType);
    return true;
  });

  const getLogStyle = (item: any) => {
      if (item.type === 'SIMULATION') return { icon: 'trophy', color: '#FFD700', label: 'RACE SIM' };
      if (item.sessionType === 'TRAINING') return { icon: 'flash', color: '#0A84FF', label: 'TRAINING LAB' };
      
      switch (item.type) {
          case 'RUN': return { icon: 'map', color: '#32D74B', label: 'RUN LOG' };
          case 'STATION': return { icon: 'barbell', color: '#FF453A', label: 'STATION LOG' };
          case 'WORKOUT': return { icon: 'fitness', color: '#FFD700', label: 'GYM LOG' };
          default: return { icon: 'time', color: '#888', label: 'LOG' };
      }
  };

  const renderItem = ({ item }: { item: any }) => {
    const style = getLogStyle(item);

    return (
      <TouchableOpacity 
        style={[styles.card, { borderLeftColor: style.color }]}
        activeOpacity={0.9}
        onPress={() => {
          if (item.sessionType === 'QUICK LOG') {
               router.push({ pathname: '/manual_log_details', params: { data: JSON.stringify(item) } });
          } else {
               router.push({ 
                  pathname: '/log_details', 
                  params: { 
                      data: JSON.stringify(item.splits),
                      date: item.date,
                      totalTime: item.totalTime,
                      sessionType: item.sessionType,
                      completedAt: item.completedAt
                  } 
               });
          }
        }}
      >
        <View style={styles.cardContent}>
          <View style={styles.headerRow}>
              <View style={styles.typeTag}>
                  <Ionicons name={style.icon as any} size={12} color={style.color} />
                  <Text style={[styles.typeText, { color: style.color }]}>{style.label}</Text>
              </View>
              <Text style={styles.timestamp}>{item.completedAt || ''}</Text>
          </View>

          <View style={styles.mainRow}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.title || item.name || "UNTITLED SESSION"}
              </Text>
              <Text style={styles.totalTime}>{item.totalTime}</Text>
          </View>
          
          <Text style={styles.cardDate}>{item.date}</Text>
        </View>
        
        <Ionicons name="chevron-forward" size={16} color="#444" style={{marginRight: 10}} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      
      {/* HEADER WITH CALENDAR BUTTON ADDED */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>OPERATIONS LOG</Text>
        
        <TouchableOpacity 
            style={styles.calBtn} 
            onPress={() => router.push('/calendar')} // Navigates to app/calendar.tsx
        >
            <Ionicons name="calendar" size={16} color="#000" />
            <Text style={styles.calBtnText}>VIEW CALENDAR</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
          {['ALL', 'SIMS', 'LAB', 'LOGS'].map((f) => (
              <TouchableOpacity 
                key={f} 
                style={[styles.filterBtn, filter === f && styles.filterBtnActive]} 
                onPress={() => setFilter(f as any)}
              >
                  <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
              </TouchableOpacity>
          ))}
      </View>

      <FlatList
        data={filteredHistory}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
            <View style={styles.emptyState}>
                <Ionicons name="file-tray-outline" size={48} color="#333" />
                <Text style={styles.emptyText}>NO RECORDS FOUND</Text>
            </View>
        }
        ListFooterComponent={
            history.length > 0 ? (
                <TouchableOpacity style={styles.clearBtn} onPress={clearHistory}>
                    <Text style={styles.clearBtnText}>CLEAR OPERATIONS LOG</Text>
                </TouchableOpacity>
            ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  // UPDATED HEADER STYLE TO ROW
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#222' },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: 1, fontStyle: 'italic' },
  
  // NEW CALENDAR BUTTON STYLE
  calBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFD700', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 6 },
  calBtnText: { color: '#000', fontSize: 10, fontWeight: '900' },

  filterRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginTop: 15, marginBottom: 10 },
  filterBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#333', backgroundColor: '#111' },
  filterBtnActive: { backgroundColor: '#333', borderColor: '#FFD700' },
  filterText: { color: '#666', fontSize: 10, fontWeight: '900' },
  filterTextActive: { color: '#FFD700' },

  listContent: { padding: 20, paddingBottom: 100 },
  
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#161616', borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#333', borderLeftWidth: 4, overflow: 'hidden' },
  cardContent: { flex: 1, padding: 15 },
  
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  typeTag: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  typeText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  timestamp: { color: '#666', fontSize: 10, fontWeight: 'bold' },

  mainRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: '900', flex: 1, marginRight: 10 },
  totalTime: { color: '#fff', fontSize: 18, fontWeight: 'bold', fontFamily: 'Courier' },
  
  cardDate: { color: '#888', fontSize: 11, fontWeight: '500' },

  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#333', fontSize: 12, fontWeight: '900', marginTop: 10, letterSpacing: 1 },

  clearBtn: { marginTop: 30, padding: 15, backgroundColor: '#111', borderRadius: 12, borderWidth: 1, borderColor: '#333', alignItems: 'center' },
  clearBtnText: { color: '#FF453A', fontSize: 10, fontWeight: '900', letterSpacing: 1 }
});