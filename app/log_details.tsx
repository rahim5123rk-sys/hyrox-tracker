import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Dimensions, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LineChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

export default function LogDetails() {
  const router = useRouter();
  const { data, date, totalTime } = useLocalSearchParams();

  let raceData: any[] = [];
  try {
    raceData = data ? JSON.parse(data as string) : [];
  } catch (e) { console.error(e); }

  // --- NEW: DATA DRIVEN INSIGHTS (No more static text) ---
  const stats = useMemo(() => {
    if (raceData.length === 0) return null;

    // 1. Calculate Pacing Strategy (First Half vs Second Half)
    const half = Math.floor(raceData.length / 2);
    // Handle edge case of 1 round
    if (half === 0) return { pacing: "SINGLE ROUND", fastest: raceData[0], slowest: raceData[0], consistency: "0.0", avg: raceData[0].actual };

    const firstHalfAvg = raceData.slice(0, half).reduce((a, b) => a + b.actual, 0) / half;
    const secondHalfAvg = raceData.slice(half).reduce((a, b) => a + b.actual, 0) / (raceData.length - half);
    
    // Negative Split = You got faster (Good). Positive Split = You faded (Bad).
    const pacing = secondHalfAvg < firstHalfAvg 
        ? "NEGATIVE SPLIT (Strong Finish)" 
        : `POSITIVE SPLIT (Faded by ${Math.round(((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100)}%)`;

    // 2. Identify Extremes
    const sorted = [...raceData].sort((a, b) => a.actual - b.actual);
    const fastest = sorted[0];
    const slowest = sorted[sorted.length - 1];

    // 3. Consistency (Standard Deviation)
    const avg = raceData.reduce((a, b) => a + b.actual, 0) / raceData.length;
    const variance = raceData.reduce((a, b) => a + Math.pow(b.actual - avg, 2), 0) / raceData.length;
    const consistency = Math.sqrt(variance).toFixed(1);

    return { pacing, fastest, slowest, consistency, avg: avg.toFixed(1) };
  }, [raceData]);

  // Chart Data - Using actuals only for clearer training visualization
  const actuals = raceData.map(item => item.actual);
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← BACK TO LOG</Text>
        </TouchableOpacity>
        <Text style={styles.dateLabel}>{date}</Text>
        <Text style={styles.totalTime}>{totalTime}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 60}}>
        
        {/* NEW: INTELLIGENCE GRID */}
        {stats && (
            <View style={styles.statsContainer}>
                {/* STRATEGY CARD */}
                <View style={styles.statCardFull}>
                    <Text style={styles.statLabel}>PACING STRATEGY</Text>
                    <Text style={[styles.statValue, { color: stats.pacing.includes("NEGATIVE") ? '#32D74B' : '#FF453A' }]}>
                        {stats.pacing}
                    </Text>
                </View>

                {/* METRICS ROW */}
                <View style={styles.row}>
                    <View style={[styles.statCard, { marginRight: 10 }]}>
                        <Text style={styles.statLabel}>BEST ROUND</Text>
                        <Text style={styles.statValue}>{formatMinSec(stats.fastest.actual)}</Text>
                        <Text style={styles.statSub}>{stats.fastest.name}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>CONSISTENCY</Text>
                        <Text style={styles.statValue}>±{stats.consistency}s</Text>
                        <Text style={styles.statSub}>AVG: {formatMinSec(parseFloat(stats.avg))}</Text>
                    </View>
                </View>
            </View>
        )}

        {/* CHART */}
        <View style={styles.chartWrapper}>
            <Text style={styles.sectionTitle}>PERFORMANCE CURVE</Text>
            <LineChart
                data={{
                    labels: actuals.map((_, i) => (i % 2 === 0 ? `${i + 1}` : "")), // Numbered labels
                    datasets: [{ data: actuals, color: (opacity = 1) => `#FFD700`, strokeWidth: 3 }]
                }}
                width={screenWidth - 40}
                height={200}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
            />
        </View>

        {/* LIST BREAKDOWN */}
        <View style={styles.listSection}>
            <Text style={styles.sectionTitle}>ROUND BREAKDOWN</Text>
            {raceData.map((item, i) => (
                <View key={i} style={styles.listRow}>
                    <Text style={styles.rowName}>{item.name}</Text>
                    <Text style={styles.rowTime}>{formatMinSec(item.actual)}</Text>
                </View>
            ))}
        </View>
      </ScrollView>
    </View>
  );
}

const formatMinSec = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.round(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
};

const chartConfig = {
    backgroundGradientFrom: "#1E1E1E",
    backgroundGradientTo: "#1E1E1E",
    color: (opacity = 1) => `rgba(255, 215, 0, ${opacity})`,
    labelColor: () => `#888`,
    strokeWidth: 2,
    propsForDots: { r: "4", strokeWidth: "2", stroke: "#000" }
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { backgroundColor: '#111', padding: 20, paddingTop: 60, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#222' },
  backBtn: { alignSelf: 'flex-start', marginBottom: 10 },
  backText: { color: '#FFD700', fontWeight: 'bold', fontSize: 12 },
  dateLabel: { color: '#666', fontSize: 12, fontWeight: 'bold' },
  totalTime: { color: '#fff', fontSize: 48, fontWeight: '900', fontStyle: 'italic', fontFamily: 'Courier' }, // Monospace helps alignment
  
  statsContainer: { padding: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  statCardFull: { backgroundColor: '#1E1E1E', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#333' },
  statCard: { flex: 1, backgroundColor: '#1E1E1E', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#333' },
  statLabel: { color: '#666', fontSize: 10, fontWeight: '900', marginBottom: 5, letterSpacing: 1 },
  statValue: { color: '#fff', fontSize: 24, fontWeight: '900' },
  statSub: { color: '#888', fontSize: 11, fontWeight: 'bold', marginTop: 4 },

  chartWrapper: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { color: '#444', fontSize: 11, fontWeight: '900', marginBottom: 15, letterSpacing: 1 },
  chart: { borderRadius: 16 },

  listSection: { paddingHorizontal: 20 },
  listRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#222' },
  rowName: { color: '#ccc', fontSize: 14, fontWeight: 'bold' },
  rowTime: { color: '#FFD700', fontSize: 18, fontWeight: 'bold', fontFamily: 'Courier' }
});