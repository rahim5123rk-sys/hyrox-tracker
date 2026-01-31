import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { LayoutAnimation, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, UIManager, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
  const [completedAt, setCompletedAt] = useState('');
  
  const [expandedIndices, setExpandedIndices] = useState<Record<number, boolean>>({});

  useEffect(() => {
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
    if (params.completedAt) setCompletedAt(params.completedAt as string);
  }, [params.data, params.totalTime, params.date, params.completedAt]);

  const validSplits = useMemo(() => splits.filter(s => s.name !== 'FINISH'), [splits]);

  const toggleExpand = (index: number) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setExpandedIndices(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // --- INTELLIGENCE ENGINE ---
  const { processedSplits, uniqueExercises, workSets, bestSplit, worstSplit } = useMemo(() => {
      let best = { name: '', time: Infinity };
      let worst = { name: '', time: 0 };
      
      const counts: Record<string, number> = {};
      const uniqueTypes = new Set<string>();
      let workSetCount = 0;

      const processed = validSplits.map((split, index) => {
          let baseName = split.name.replace(/\(R\d+\)/, '').replace(/\(EXTRA\)/, '').trim();
          const isRest = baseName.toUpperCase().includes('REST') || baseName.toUpperCase().includes('RECOVERY');

          let typeKey = 'Station';
          if (!isRest) {
              if (baseName.toUpperCase().includes('RUN')) typeKey = 'Run';
              else if (baseName.toUpperCase().includes('SKI')) typeKey = 'Ski';
              else if (baseName.toUpperCase().includes('ROW')) typeKey = 'Row';
              else if (baseName.toUpperCase().includes('SLED')) typeKey = 'Sled';
              else if (baseName.toUpperCase().includes('FARMER')) typeKey = 'Carry';
              else if (baseName.toUpperCase().includes('LUNGE')) typeKey = 'Lunge';
              else if (baseName.toUpperCase().includes('WALL')) typeKey = 'WallBall';
              else if (baseName.toUpperCase().includes('BURPEE')) typeKey = 'Burpee';
              
              uniqueTypes.add(typeKey);
              workSetCount++;
              
              if (split.actual < best.time && split.actual > 0) best = { name: baseName, time: split.actual };
              if (split.actual > worst.time) worst = { name: baseName, time: split.actual };
          }

          let setNum = 0;
          if (!isRest) {
              if (!counts[typeKey]) counts[typeKey] = 0;
              counts[typeKey] += 1;
              setNum = counts[typeKey];
          }

          const distMatch = split.name.match(/(\d+(?:\.\d+)?)(km|m)/);
          const weightMatch = split.name.match(/(Heavy|Light|Comp|\d+kg)/i);
          const repsMatch = split.name.match(/^(\d+)\s/); 

          let distance = distMatch ? distMatch[0] : null;
          let weight = weightMatch ? weightMatch[0] : null;
          let reps = repsMatch ? repsMatch[1] : null;
          if (typeKey === 'Run' || typeKey === 'Ski' || typeKey === 'Row') reps = null;

          let pace = null;
          if (distance && split.actual > 0 && !isRest) {
              const distVal = parseFloat(distMatch![1]);
              const unit = distMatch![2];
              let meters = unit === 'km' ? distVal * 1000 : distVal;
              if (meters > 0) {
                  const secondsPerKm = split.actual / (meters / 1000);
                  const pM = Math.floor(secondsPerKm / 60);
                  const pS = Math.round(secondsPerKm % 60);
                  pace = `${pM}:${pS < 10 ? '0' : ''}${pS}/km`;
              }
          }

          return {
              ...split,
              cleanName: baseName.toUpperCase(),
              typeKey,
              globalIndex: index + 1,
              distance, weight, reps, pace, setNum, isRest,
              isExtra: split.name.includes('(EXTRA)')
          };
      });

      return { processedSplits: processed, uniqueExercises: uniqueTypes.size, workSets: workSetCount, bestSplit: best, worstSplit: worst };
  }, [validSplits]);

  // --- AUTO EXPAND EFFECT ---
  useEffect(() => {
      if (processedSplits.length > 0) {
          // Create an object where every index is true
          const allOpen = processedSplits.reduce((acc, _, i) => {
              acc[i] = true;
              return acc;
          }, {} as Record<number, boolean>);
          setExpandedIndices(allOpen);
      }
  }, [processedSplits]);

  const renderDetailItem = (label: string, value: string | null) => {
      if (!value) return null;
      return (
          <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>{label}</Text>
              <Text style={styles.detailValue}>{value}</Text>
          </View>
      );
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
            <Text style={styles.title}>
                MISSION <Text style={{color: '#FFD700'}}>DEBRIEF</Text>
            </Text>
            <Text style={styles.date}>
                {date}{completedAt ? ` • ${completedAt}` : ''}
            </Text>
        </View>
        <View style={{width: 24}} /> 
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* BIG IMPACT GRID */}
        <View style={styles.overviewGrid}>
            <View style={[styles.overviewCard, { borderTopColor: '#FFD700' }]}>
                <Text style={styles.overviewLabel}>EXERCISES</Text>
                <Text style={styles.overviewValue}>{uniqueExercises}</Text>
            </View>
            <View style={[styles.overviewCard, { borderTopColor: '#0A84FF' }]}>
                <Text style={styles.overviewLabel}>TOTAL SETS</Text>
                <Text style={styles.overviewValue}>{workSets}</Text>
            </View>
            <View style={[styles.overviewCard, { borderTopColor: '#32D74B' }]}>
                <Text style={styles.overviewLabel}>DURATION</Text>
                <Text style={[styles.overviewValue, {fontSize: 24}]}>{totalTime}</Text>
            </View>
            <View style={[styles.overviewCard, { borderTopColor: '#FF453A' }]}>
                <Text style={styles.overviewLabel}>FASTEST SPLIT</Text>
                <Text style={styles.overviewSub} numberOfLines={1}>{bestSplit.name || '-'}</Text>
                <Text style={[styles.overviewValue, {fontSize: 22}]}>{formatTime(bestSplit.time)}</Text>
            </View>
        </View>

        {/* TIMELINE */}
        <View style={{ gap: 10, marginTop: 25 }}>
            {processedSplits.map((item, index) => {
                const isOpen = expandedIndices[index];
                const isRun = item.typeKey === 'Run';
                
                if (item.isRest) {
                    return (
                        <View key={index} style={styles.restCard}>
                            <Ionicons name="hourglass-outline" size={14} color="#666" />
                            <Text style={styles.restText}>RECOVERY • {formatTime(item.actual)}</Text>
                        </View>
                    );
                }

                return (
                    <TouchableOpacity 
                        key={index} 
                        style={[styles.card, isOpen && styles.cardOpen]}
                        activeOpacity={0.9}
                        onPress={() => toggleExpand(index)}
                    >
                        <View style={styles.cardHeader}>
                            <View style={styles.leftGroup}>
                                <View style={styles.seqBadge}>
                                    <Text style={styles.seqText}>#{item.globalIndex < 10 ? `0${item.globalIndex}` : item.globalIndex}</Text>
                                </View>
                                <View style={styles.iconBox}>
                                    <Ionicons 
                                        name={isRun ? "walk" : "barbell"} 
                                        size={14} 
                                        color={isOpen ? "#000" : "#FFD700"} 
                                    />
                                </View>
                                <Text style={styles.cardTitle} numberOfLines={1}>{item.cleanName}</Text>
                            </View>
                            
                            <View style={styles.rightGroup}>
                                <Text style={styles.setLabel}>{isOpen ? 'DETAILS' : (item.isExtra ? 'EXTRA SET' : `${item.setNum} SET`)}</Text>
                                <Ionicons 
                                    name="chevron-down" 
                                    size={16} 
                                    color="#666" 
                                    style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }], marginLeft: 8 }} 
                                />
                            </View>
                        </View>

                        {isOpen && (
                            <View style={styles.cardBody}>
                                <View style={styles.detailRow}>
                                    {renderDetailItem("SET", item.isExtra ? `${item.setNum} (EXTRA)` : `${item.setNum}`)}
                                    {renderDetailItem("TIME", formatTime(item.actual))}
                                    {item.distance && renderDetailItem("DIST", item.distance)}
                                    {item.weight && renderDetailItem("KG", item.weight.toUpperCase())}
                                    {item.reps && !item.distance && renderDetailItem("REPS", item.reps)}
                                    {item.pace && renderDetailItem("PACE", item.pace)}
                                </View>
                            </View>
                        )}
                    </TouchableOpacity>
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

  overviewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  overviewCard: { width: '48%', backgroundColor: '#161616', padding: 20, borderRadius: 16, borderTopWidth: 4, borderColor: '#333' },
  overviewLabel: { color: '#666', fontSize: 9, fontWeight: '900', marginBottom: 8, letterSpacing: 1 },
  overviewValue: { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  overviewSub: { color: '#888', fontSize: 10, fontWeight: 'bold', marginBottom: 4 },

  restCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, backgroundColor: '#111', borderRadius: 8, borderWidth: 1, borderColor: '#222', marginBottom: 5 },
  restText: { color: '#666', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },

  card: { backgroundColor: '#1E1E1E', borderRadius: 12, marginBottom: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#333' },
  cardOpen: { borderColor: '#FFD700', backgroundColor: '#222' },
  
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, height: 60 },
  leftGroup: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  rightGroup: { flexDirection: 'row', alignItems: 'center' },
  
  seqBadge: { backgroundColor: '#333', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  seqText: { color: '#888', fontSize: 10, fontWeight: 'bold', fontVariant: ['tabular-nums'] },
  
  iconBox: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  cardTitle: { color: '#fff', fontSize: 14, fontWeight: '900', flex: 1 },
  setLabel: { color: '#666', fontSize: 10, fontWeight: '900' },

  cardBody: { paddingHorizontal: 15, paddingBottom: 15, borderTopWidth: 1, borderTopColor: '#333', backgroundColor: '#181818' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  detailItem: { alignItems: 'center', flex: 1 },
  detailLabel: { color: '#555', fontSize: 8, fontWeight: '900', marginBottom: 4 },
  detailValue: { color: '#fff', fontSize: 13, fontWeight: 'bold', fontFamily: 'Courier' },
});