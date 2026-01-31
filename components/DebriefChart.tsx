import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';

const { width } = Dimensions.get('window');

interface Split {
  name: string;
  actual: number;
  target: number;
}

interface DebriefChartProps {
  splits: Split[];
}

export function DebriefChart({ splits }: DebriefChartProps) {
  if (!splits || splits.length === 0) return null;

  // MATH ENGINE
  // Fix: Use 1 as a fallback to prevent division by zero; handle missing targets for Lab sessions
  const maxBarValue = Math.max(...splits.map(s => Math.max(s.actual, s.target || 0)), 1);
  
  // Identify if this is a Lab session (no targets) to adjust visuals
  const isLab = splits.every(s => s.target === 0);

  // Calculate "Bonk Factor" (2nd half drift)
  const half = Math.floor(splits.length / 2);
  const firstHalfDiff = splits.slice(0, half).reduce((acc, s) => acc + (s.actual - (s.target || s.actual)), 0);
  const secondHalfDiff = splits.slice(half).reduce((acc, s) => acc + (s.actual - (s.target || s.actual)), 0);
  const drift = secondHalfDiff - firstHalfDiff;

  const getStatusColor = (diff: number) => {
    if (isLab) return '#0A84FF'; // Tactical Blue for Training Lab
    if (diff <= 0) return '#32D74B'; // Green (Ahead)
    if (diff < 15) return '#FFD700'; // Yellow (Close)
    return '#FF453A'; // Red (Behind)
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.chartHeader}>
          <Ionicons name="stats-chart" size={16} color="#FFD700" />
          <Text style={styles.chartTitle}>{isLab ? 'LAB PERFORMANCE' : 'PACING STRATEGY'}</Text>
      </View>
      
      {/* CHART SCROLL */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chartScroll}>
          {splits.map((split, i) => {
              const heightPercent = Math.min((split.actual / maxBarValue) * 100, 100);
              const targetPercent = split.target > 0 ? Math.min((split.target / maxBarValue) * 100, 100) : 0;
              const diff = split.actual - split.target;
              const barColor = getStatusColor(diff);
              const isRun = split.name.includes('RUN');

              return (
                  <View key={i} style={styles.barGroup}>
                      <View style={styles.barsArea}>
                          {/* Target Marker Line - Only show if target > 0 */}
                          {split.target > 0 && (
                              <View style={[
                                  styles.targetLine, 
                                  { bottom: `${targetPercent}%` }
                              ]} />
                          )}
                          
                          {/* Actual Bar */}
                          <View style={[
                              styles.bar, 
                              { 
                                height: `${heightPercent}%`, 
                                backgroundColor: barColor, 
                                opacity: isRun ? 0.6 : 1 
                              }
                          ]} />
                      </View>
                      <Text style={styles.barLabel}>{split.name.replace('ROUND ', 'R')}</Text>
                  </View>
              );
          })}
      </ScrollView>

      {/* LEGEND */}
      <View style={styles.legend}>
          {isLab ? (
              <View style={styles.legendItem}>
                  <View style={[styles.dot, {backgroundColor:'#0A84FF'}]} />
                  <Text style={styles.legendText}>LAB SPLIT</Text>
              </View>
          ) : (
              <>
                <View style={styles.legendItem}>
                    <View style={[styles.dot, {backgroundColor:'#32D74B'}]} />
                    <Text style={styles.legendText}>AHEAD</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.dot, {backgroundColor:'#FF453A'}]} />
                    <Text style={styles.legendText}>BEHIND</Text>
                </View>
              </>
          )}
          <View style={styles.legendItem}>
              <View style={[styles.dot, {backgroundColor:'#666'}]} />
              <Text style={styles.legendText}>RUNS (DIMMED)</Text>
          </View>
      </View>

      {/* AUTOMATED INSIGHT */}
      <View style={styles.insightBox}>
           <Ionicons name="bulb-outline" size={20} color="#FFD700" />
           <View style={{flex: 1}}>
               <Text style={styles.insightTitle}>ANALYSIS</Text>
               <Text style={styles.insightText}>
                  {isLab 
                    ? `Consistency Check: Your second half was ${Math.abs(drift)}s ${drift > 0 ? 'slower' : 'faster'} than the first.`
                    : drift > 30 
                      ? `FATIGUE DETECTED. You slowed down by ${drift}s in the second half. Try starting 5% slower next time.` 
                      : "PERFECT EXECUTION. Your pacing remained consistent from start to finish."}
               </Text>
           </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#1E1E1E', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#333', marginBottom: 25 },
  chartHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15 },
  chartTitle: { color: '#FFD700', fontSize: 12, fontWeight: '900' },
  chartScroll: { height: 150, alignItems: 'flex-end', paddingRight: 20 },
  barGroup: { width: 30, marginRight: 12, alignItems: 'center' },
  barsArea: { width: '100%', height: 120, justifyContent: 'flex-end', backgroundColor: '#111', borderRadius: 4, overflow: 'hidden' },
  bar: { width: '100%', borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  targetLine: { position: 'absolute', width: '100%', height: 2, backgroundColor: '#fff', zIndex: 10, opacity: 0.8 },
  barLabel: { color: '#666', fontSize: 8, marginTop: 6, fontWeight: 'bold' },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 15, marginTop: 15, borderTopWidth: 1, borderTopColor: '#333', paddingTop: 10 },
  legendItem: { flexDirection:'row', alignItems:'center', gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  legendText: { color: '#888', fontSize: 9, fontWeight: 'bold' },
  insightBox: { flexDirection: 'row', gap: 15, backgroundColor: 'rgba(255, 215, 0, 0.1)', padding: 15, borderRadius: 12, marginTop: 20, borderColor: 'rgba(255, 215, 0, 0.2)', borderWidth: 1 },
  insightTitle: { color: '#FFD700', fontSize: 11, fontWeight: '900', marginBottom: 4 },
  insightText: { color: '#ccc', fontSize: 12, lineHeight: 18 },
});