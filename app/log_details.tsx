import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// REUSE THE CHART COMPONENT
import { DebriefChart } from '../components/DebriefChart';
// IMPORT THE NEW COMPONENT
import { RunningMetrics } from '../components/RunningMetrics';

interface Split {
  name: string;
  actual: number;
  target: number;
}

export default function LogDetails() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  
  const [splits, setSplits] = useState<Split[]>([]);
  const [totalTime, setTotalTime] = useState('--:--');
  const [date, setDate] = useState('');

  useEffect(() => {
    // FIX: Only parse if the DATA string specifically changes
    if (params.data && typeof params.data === 'string') {
        try {
            const parsed = JSON.parse(params.data);
            setSplits(parsed);
        } catch (e) {
            console.log('Error parsing split data');
        }
    }
    if (params.totalTime) setTotalTime(params.totalTime as string);
    if (params.date) setDate(params.date as string);
  }, [params.data, params.totalTime, params.date]);

  // MATH ENGINE (Filter out finish line for stats)
  const validSplits = useMemo(() => splits.filter(s => s.name !== 'FINISH'), [splits]);

  const totalTargetSeconds = validSplits.reduce((acc, s) => acc + s.target, 0);
  const totalActualSeconds = validSplits.reduce((acc, s) => acc + s.actual, 0);
  const diffSeconds = totalActualSeconds - totalTargetSeconds;

  const getStatusColor = (diff: number) => {
      if (diff <= 0) return '#32D74B'; 
      if (diff < 15) return '#FFD700'; 
      return '#FF453A'; 
  };

  const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View>
            <Text style={styles.title}>MISSION <Text style={{color: '#FFD700'}}>LOG</Text></Text>
            <Text style={styles.date}>{date}</Text>
        </View>
        <View style={{width: 24}} /> 
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* SUMMARY CARDS */}
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

        {/* THE CHART */}
        <DebriefChart splits={validSplits} />

        {/* RUNNING METRICS */}
        <RunningMetrics splits={validSplits} />

        {/* DETAILED TABLE */}
        <View style={styles.table}>
            <View style={styles.tableHeader}>
                <Text style={[styles.col, {flex: 2}]}>STATION</Text>
                <Text style={styles.col}>TARGET</Text>
                <Text style={styles.col}>ACTUAL</Text>
                <Text style={[styles.col, {textAlign: 'right'}]}>+/-</Text>
            </View>
            {validSplits.map((split, i) => {
                const diff = split.actual - split.target;
                const isRun = split.name.includes('RUN');
                
                return (
                    <View key={i} style={[styles.row, i % 2 === 0 && {backgroundColor: '#1A1A1A'}]}>
                         <View style={{flex: 2, flexDirection: 'row', alignItems: 'center', gap: 6}}>
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
        
        <View style={{height: 50}} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 25, borderBottomWidth: 1, borderBottomColor: '#222' },
  backBtn: { padding: 5 },
  title: { color: '#fff', fontSize: 20, fontWeight: '900', fontStyle: 'italic', textAlign: 'center' },
  date: { color: '#666', fontSize: 10, fontWeight: 'bold', marginTop: 2, textAlign: 'center', letterSpacing: 1 },
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
});