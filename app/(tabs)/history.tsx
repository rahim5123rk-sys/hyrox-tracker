import { useTheme } from '@/context/ThemeContext'; // <--- Import Theme
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function History() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme(); // <--- Use Theme
  
  const [history, setHistory] = useState<any[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'SIMS' | 'LAB' | 'LOGS'>('ALL');

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const loadHistory = async () => {
    try {
      const json = await AsyncStorage.getItem('raceHistory');
      if (json) setHistory(JSON.parse(json));
    } catch (e) { console.log("Failed to load history"); }
  };

  const clearHistory = async () => {
      Alert.alert("CONFIRM WIPE", "This will permanently delete all logs.", [
          { text: "CANCEL", style: "cancel" },
          { text: "DELETE ALL", style: "destructive", onPress: async () => { await AsyncStorage.removeItem('raceHistory'); setHistory([]); } }
      ]);
  };

  const filteredHistory = history.filter(item => {
    if (filter === 'ALL') return true;
    if (filter === 'SIMS') return item.type === 'SIMULATION';
    if (filter === 'LAB') return item.sessionType === 'TRAINING';
    if (filter === 'LOGS') return item.sessionType === 'QUICK LOG' || (!item.type && !item.sessionType);
    return true;
  });

  const getLogStyle = (item: any) => {
      if (item.type === 'SIMULATION') return { icon: 'trophy', color: colors.primary, label: 'RACE SIM' };
      if (item.sessionType === 'TRAINING') return { icon: 'flash', color: '#0A84FF', label: 'TRAINING LAB' };
      switch (item.type) {
          case 'RUN': return { icon: 'map', color: colors.success, label: 'RUN LOG' };
          case 'STATION': return { icon: 'barbell', color: colors.danger, label: 'STATION LOG' };
          case 'WORKOUT': return { icon: 'fitness', color: colors.primary, label: 'GYM LOG' };
          default: return { icon: 'time', color: colors.subtext, label: 'LOG' };
      }
  };

  const renderItem = ({ item }: { item: any }) => {
    const style = getLogStyle(item);
    return (
      <TouchableOpacity 
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: style.color }]} // <--- Dynamic Colors
        activeOpacity={0.9}
        onPress={() => {
          if (item.sessionType === 'QUICK LOG') router.push({ pathname: '/manual_log_details', params: { data: JSON.stringify(item) } });
          else router.push({ pathname: '/log_details', params: { data: JSON.stringify(item.splits), date: item.date, totalTime: item.totalTime, sessionType: item.sessionType, completedAt: item.completedAt } });
        }}
      >
        <View style={styles.cardContent}>
          <View style={styles.headerRow}>
              <View style={styles.typeTag}>
                  <Ionicons name={style.icon as any} size={12} color={style.color} />
                  <Text style={[styles.typeText, { color: style.color }]}>{style.label}</Text>
              </View>
              <Text style={[styles.timestamp, { color: colors.subtext }]}>{item.completedAt || ''}</Text>
          </View>
          <View style={styles.mainRow}>
              <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>{item.title || "UNTITLED"}</Text>
              <Text style={[styles.totalTime, { color: colors.text }]}>{item.totalTime}</Text>
          </View>
          <Text style={[styles.cardDate, { color: colors.subtext }]}>{item.date}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.subtext} style={{marginRight: 10}} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}> 
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      <View style={[styles.header, { borderColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>OPERATIONS LOG</Text>
      </View>

      <View style={styles.filterRow}>
          {['ALL', 'SIMS', 'LAB', 'LOGS'].map((f) => (
              <TouchableOpacity 
                key={f} 
                style={[styles.filterBtn, { backgroundColor: colors.card, borderColor: colors.border }, filter === f && { borderColor: colors.primary, backgroundColor: isDark ? '#333' : '#e0e0e0' }]} 
                onPress={() => setFilter(f as any)}
              >
                  <Text style={[styles.filterText, { color: colors.subtext }, filter === f && { color: colors.primary }]}>{f}</Text>
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
                <Ionicons name="file-tray-outline" size={48} color={colors.subtext} />
                <Text style={[styles.emptyText, { color: colors.subtext }]}>NO RECORDS FOUND</Text>
            </View>
        }
        ListFooterComponent={
            history.length > 0 ? (
                <TouchableOpacity style={[styles.clearBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={clearHistory}>
                    <Text style={styles.clearBtnText}>CLEAR OPERATIONS LOG</Text>
                </TouchableOpacity>
            ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1 },
  headerTitle: { fontSize: 24, fontWeight: '900', letterSpacing: 1, fontStyle: 'italic' },
  filterRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginTop: 15, marginBottom: 10 },
  filterBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1 },
  filterText: { fontSize: 10, fontWeight: '900' },
  listContent: { padding: 20, paddingBottom: 100 },
  card: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, marginBottom: 12, borderWidth: 1, borderLeftWidth: 4, overflow: 'hidden' },
  cardContent: { flex: 1, padding: 15 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  typeTag: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  typeText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  timestamp: { fontSize: 10, fontWeight: 'bold' },
  mainRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardTitle: { fontSize: 16, fontWeight: '900', flex: 1, marginRight: 10 },
  totalTime: { fontSize: 18, fontWeight: 'bold', fontFamily: 'Courier' },
  cardDate: { fontSize: 11, fontWeight: '500' },
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 12, fontWeight: '900', marginTop: 10, letterSpacing: 1 },
  clearBtn: { marginTop: 30, padding: 15, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  clearBtnText: { color: '#FF453A', fontSize: 10, fontWeight: '900', letterSpacing: 1 }
});