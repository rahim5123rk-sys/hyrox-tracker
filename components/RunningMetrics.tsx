import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Split {
  name: string;
  actual: number;
  target: number;
}

export function RunningMetrics({ splits }: { splits: Split[] }) {
  // 1. Filter only the runs
  const runSplits = splits.filter(s => s.name.includes('RUN'));
  
  if (runSplits.length === 0) return null;

  // 2. Math Engine
  const totalRunSeconds = runSplits.reduce((acc, s) => acc + s.actual, 0);
  const avgSecondsPerKm = totalRunSeconds / runSplits.length; // usually 8 runs
  const effectiveFiveKSeconds = avgSecondsPerKm * 5;

  // 3. Formatter (Seconds -> MM:SS)
  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = Math.round(totalSeconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="speedometer-outline" size={14} color="#FFD700" />
        <Text style={styles.title}>RUNNING TELEMETRY</Text>
      </View>

      <View style={styles.row}>
        {/* Metric 1: Avg Pace */}
        <View style={styles.metric}>
            <Text style={styles.label}>AVG ROX PACE</Text>
            <Text style={styles.value}>{formatTime(avgSecondsPerKm)}<Text style={styles.unit}>/km</Text></Text>
        </View>

        {/* Metric 2: Effective 5k */}
        <View style={[styles.metric, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#333' }]}>
            <Text style={styles.label}>EFFECTIVE 5K</Text>
            <Text style={[styles.value, { color: '#32D74B' }]}>{formatTime(effectiveFiveKSeconds)}</Text>
        </View>

        {/* Metric 3: Consistency */}
        <View style={styles.metric}>
            <Text style={styles.label}>TOTAL RUN TIME</Text>
            <Text style={styles.value}>{formatTime(totalRunSeconds)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#1E1E1E', borderRadius: 16, padding: 15, borderWidth: 1, borderColor: '#333', marginBottom: 25 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 15 },
  title: { color: '#FFD700', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  metric: { flex: 1, alignItems: 'center' },
  label: { color: '#888', fontSize: 8, fontWeight: 'bold', marginBottom: 4 },
  value: { color: '#fff', fontSize: 20, fontWeight: '900', fontVariant: ['tabular-nums'] },
  unit: { fontSize: 10, color: '#666' }
});