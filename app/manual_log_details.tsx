import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ManualLogDetails() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const [log, setLog] = useState<any>(null);

  // 1. DATA LOADER
  useEffect(() => {
    if (params.data && typeof params.data === 'string') {
        try { setLog(JSON.parse(params.data)); } catch (e) {}
    }
  }, [params.data]);

  // 2. SAFE ACCESSORS (Hooks must run unconditionally)
  const details = log?.details || {};
  const isRun = log?.type === 'RUN';
  const isStation = log?.type === 'STATION';
  const isGym = log?.type === 'WORKOUT';

  // 3. INTELLIGENCE: PACE CALCULATOR (Safe useMemo)
  const pace = useMemo(() => {
      // Check inside the hook, not before it
      if (!log || !isRun || !details.distance || !log.totalTime) return null;
      
      try {
          const dist = parseFloat(details.distance);
          if (!dist || dist === 0) return null;

          const parts = log.totalTime.split(':');
          let totalMinutes = 0;
          if (parts.length === 2) {
              totalMinutes = parseInt(parts[0]) + (parseInt(parts[1]) / 60);
          } else {
              totalMinutes = parseInt(parts[0]);
          }

          const paceDec = totalMinutes / dist;
          const pMin = Math.floor(paceDec);
          const pSec = Math.round((paceDec - pMin) * 60);
          
          return `${pMin}:${pSec < 10 ? '0' : ''}${pSec}/km`;
      } catch (e) {
          return null;
      }
  }, [log, details, isRun]);

  const getIntensityColor = (rpe: number) => {
      if (rpe <= 4) return '#32D74B'; // Green
      if (rpe <= 7) return '#FFD700'; // Gold
      return '#FF453A'; // Red
  };

  const rpeColor = getIntensityColor(details.rpe || 5);

  // 4. LOADING STATE (Now it's safe to return early)
  if (!log) return <View style={{flex:1, backgroundColor:'#000'}} />;

  // 5. RENDER
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View>
            <Text style={styles.title}>FIELD REPORT</Text>
            <Text style={styles.date}>
                {log.date}{log.completedAt ? ` • ${log.completedAt}` : ''}
            </Text>
        </View>
        <View style={{width: 24}} /> 
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* --- DYNAMIC HERO CARD --- */}
        <View style={styles.mainCard}>
            <View style={[styles.cardHeader, isRun ? {backgroundColor: '#32D74B'} : isStation ? {backgroundColor: '#FF453A'} : {backgroundColor: '#FFD700'}]}>
                <Ionicons 
                    name={isRun ? "map" : isStation ? "barbell" : "fitness"} 
                    size={18} 
                    color="#000" 
                />
                <Text style={styles.cardHeaderTitle}>{log.title}</Text>
            </View>

            <View style={styles.cardBody}>
                
                {/* HERO STAT DISPLAY */}
                <View style={{alignItems: 'center', marginVertical: 20}}>
                    {isRun ? (
                        <>
                            <Text style={styles.primaryValue}>{details.distance}</Text>
                            <Text style={styles.primaryLabel}>KILOMETERS</Text>
                        </>
                    ) : isStation ? (
                        <>
                            <Text style={styles.primaryValue}>
                                {details.weight ? details.weight : details.reps}
                            </Text>
                            <Text style={styles.primaryLabel}>
                                {details.weight ? 'KG LOAD' : 'TOTAL REPS'}
                            </Text>
                        </>
                    ) : (
                        <>
                            <Text style={styles.primaryValue}>{log.totalTime}</Text>
                            <Text style={styles.primaryLabel}>SESSION TIME</Text>
                        </>
                    )}
                </View>

                {/* TAILORED DATA GRID */}
                <View style={styles.grid}>
                    {/* RUN SPECIFIC */}
                    {isRun && (
                        <>
                            <View style={styles.gridItem}>
                                <Text style={styles.gridLabel}>PACE</Text>
                                <Text style={styles.gridValue}>{pace || '--:--'}</Text>
                            </View>
                            <View style={styles.gridItem}>
                                <Text style={styles.gridLabel}>TIME</Text>
                                <Text style={styles.gridValue}>{log.totalTime}</Text>
                            </View>
                        </>
                    )}

                    {/* STATION SPECIFIC */}
                    {isStation && (
                        <>
                            {details.weight && details.reps && (
                                <View style={styles.gridItem}>
                                    <Text style={styles.gridLabel}>REPS</Text>
                                    <Text style={styles.gridValue}>{details.reps}</Text>
                                </View>
                            )}
                            {log.totalTime && (
                                <View style={styles.gridItem}>
                                    <Text style={styles.gridLabel}>DURATION</Text>
                                    <Text style={styles.gridValue}>{log.totalTime}</Text>
                                </View>
                            )}
                        </>
                    )}

                    {/* GYM SPECIFIC */}
                    {isGym && (
                        <View style={styles.gridItem}>
                            <Text style={styles.gridLabel}>FOCUS</Text>
                            <Text style={styles.gridValue}>{details.subCategory || 'GENERAL'}</Text>
                        </View>
                    )}

                    {/* UNIVERSAL: RPE */}
                    <View style={styles.gridItem}>
                        <Text style={styles.gridLabel}>INTENSITY</Text>
                        <Text style={[styles.gridValue, {color: rpeColor}]}>RPE {details.rpe || 5}</Text>
                    </View>
                </View>

                {/* RPE VISUALIZER */}
                <View style={styles.rpeContainer}>
                    <View style={[styles.rpeFill, { width: `${(details.rpe || 5) * 10}%`, backgroundColor: rpeColor }]} />
                </View>
            </View>
        </View>

        {/* NOTES SECTION */}
        {details.note ? (
            <View style={styles.noteCard}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10}}>
                    <Ionicons name="document-text-outline" size={14} color="#666" />
                    <Text style={styles.noteTitle}>OPERATIONAL NOTES</Text>
                </View>
                <Text style={styles.noteText}>{details.note}</Text>
            </View>
        ) : null}

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

  mainCard: { backgroundColor: '#1E1E1E', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#333', marginBottom: 20 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 15 },
  cardHeaderTitle: { color: '#000', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  
  cardBody: { padding: 20 },
  primaryValue: { color: '#fff', fontSize: 60, fontWeight: '900', letterSpacing: -2 },
  primaryLabel: { color: '#666', fontSize: 12, fontWeight: '900', letterSpacing: 2, marginTop: -5 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 30 },
  gridItem: { flex: 1, backgroundColor: '#111', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#222', minWidth: '40%' },
  gridLabel: { color: '#666', fontSize: 9, fontWeight: '900', marginBottom: 5 },
  gridValue: { color: '#fff', fontSize: 18, fontWeight: 'bold', fontFamily: 'Courier' },

  rpeContainer: { height: 4, backgroundColor: '#333', borderRadius: 2, marginTop: 25, overflow: 'hidden' },
  rpeFill: { height: '100%' },

  noteCard: { backgroundColor: '#1E1E1E', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#333' },
  noteTitle: { color: '#666', fontSize: 10, fontWeight: '900' },
  noteText: { color: '#ccc', fontSize: 14, lineHeight: 22, fontWeight: '500' }
});