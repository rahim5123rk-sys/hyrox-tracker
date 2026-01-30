import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DebriefChart } from '../components/DebriefChart';
// 1. IMPORT THE NEW COMPONENT
import { RunningMetrics } from '../components/RunningMetrics';

interface Split {
  name: string;
  actual: number;
  target: number;
}

export default function Results() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  
  const [splits, setSplits] = useState<Split[]>([]);
  const [totalTime, setTotalTime] = useState('00:00');
  
  useEffect(() => {
    if (params.data && typeof params.data === 'string') {
        try {
            const parsed = JSON.parse(params.data);
            setSplits(parsed);
        } catch (e) {
            console.log('Error parsing split data');
        }
    }
    if (params.totalTime) {
        setTotalTime(params.totalTime as string);
    }
  }, [params.data, params.totalTime]);

  const totalTargetSeconds = splits.reduce((acc, s) => acc + s.target, 0);
  const totalActualSeconds = splits.reduce((acc, s) => acc + s.actual, 0);
  const diffSeconds = totalActualSeconds - totalTargetSeconds;

  const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const getStatusColor = (diff: number) => {
      if (diff <= 0) return '#32D74B'; 
      if (diff < 15) return '#FFD700'; 
      return '#FF453A'; 
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <Text style={styles.title}>MISSION <Text style={{color: '#FFD700'}}>DEBRIEF</Text></Text>
          <Text style={styles.date}>{new Date().toLocaleDateString().toUpperCase()}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        <View style={styles.summaryRow}>
            <View style={styles.card}>
                <Text style={styles.cardLabel}>TOTAL TIME</Text>
                <Text style={styles.cardValue}>{totalTime}</Text>
            </View>
            <View style={styles.card}>
                <Text style={styles.cardLabel}>PERFORMANCE</Text>
                <Text style={[styles.cardValue, { color: getStatusColor(diffSeconds) }]}>
                    {diffSeconds > 0 ? '+' : ''}{diffSeconds}s
                </Text>
                <Text style={styles.cardSub}>{diffSeconds > 0 ? 'BEHIND TARGET' : 'AHEAD OF TARGET'}</Text>
            </View>
        </View>

        <DebriefChart splits={splits} />

        {/* 2. INSERT THE RUNNING METRICS HERE */}
        <RunningMetrics splits={splits} />

        <View style={styles.table}>
            <View style={styles.tableHeader}>
                <Text style={[styles.col, {flex: 2}]}>STATION</Text>
                <Text style={styles.col}>TARGET</Text>
                <Text style={styles.col}>ACTUAL</Text>
                <Text style={[styles.col, {textAlign: 'right'}]}>+/-</Text>
            </View>
            {splits.map((split, i) => {
                const diff = split.actual - split.target;
                const isRun = split.name.includes('RUN');
                
                return (
                    <View key={i} style={[styles.row, i % 2 === 0 && {backgroundColor: '#1A1A1A'}]}>
                        <View style={{flex: 2, flexDirection: 'row', alignItems: 'center', gap: 6}}>
                            {/* Visual indicator for runs vs stations */}
                            {isRun && <Ionicons name="walk" size={10} color="#666" />}
                            <Text style={[styles.cell, {color: '#fff'}]}>{split.name}</Text>
                        </View>
                        <Text style={styles.cell}>{formatTime(split.target)}</Text>
                        <Text style={styles.cell}>{formatTime(split.actual)}</Text>
                        <Text style={[styles.cell, {textAlign: 'right', color: getStatusColor(diff), fontWeight: 'bold'}]}>
                            {diff > 0 ? '+' : ''}{diff}s
                        </Text>
                    </View>
                );
            })}
        </View>

        <TouchableOpacity style={styles.closeBtn} onPress={() => router.replace('/(tabs)/')}>
            <Text style={styles.closeText}>RETURN TO BASE</Text>
        </TouchableOpacity>
        
        <View style={{height: 50}} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { paddingHorizontal: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#222' },
  title: { color: '#fff', fontSize: 28, fontWeight: '900', fontStyle: 'italic', letterSpacing: -1 },
  date: { color: '#666', fontSize: 12, fontWeight: 'bold', marginTop: 4, letterSpacing: 1 },
  scroll: { padding: 20 },
  summaryRow: { flexDirection: 'row', gap: 15, marginBottom: 25 },
  card: { flex: 1, backgroundColor: '#1E1E1E', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#333' },
  cardLabel: { color: '#888', fontSize: 10, fontWeight: '900', marginBottom: 5 },
  cardValue: { color: '#fff', fontSize: 28, fontWeight: '900' },
  cardSub: { color: '#666', fontSize: 9, fontWeight: 'bold', marginTop: 5 },
  table: { backgroundColor: '#1E1E1E', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#333', marginBottom: 30 },
  tableHeader: { flexDirection: 'row', padding: 12, backgroundColor: '#252525', borderBottomWidth: 1, borderBottomColor: '#333' },
  row: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#222' },
  col: { flex: 1, color: '#888', fontSize: 9, fontWeight: '900' },
  cell: { flex: 1, color: '#ccc', fontSize: 11, fontWeight: '500', fontVariant: ['tabular-nums'] },
  closeBtn: { backgroundColor: '#FFD700', padding: 20, borderRadius: 15, alignItems: 'center' },
  closeText: { color: '#000', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
});