import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Dimensions, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LineChart } from "react-native-chart-kit";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { calculateLevel } from '../utils/gamification';

const SCREEN_WIDTH = Dimensions.get('window').width;

// INTERFACES
interface RaceResult {
  totalTime: string;
  splits: { name: string; actual: number }[];
  date: string;
}

const STATION_OPTIONS = ['AVG', 'SKI ERG', 'SLED PUSH', 'SLED PULL', 'BURPEES', 'ROWING', 'FARMERS', 'LUNGES', 'WALL BALLS'];

export default function Progress() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // USER STATE
  const [name, setName] = useState('ATHLETE');
  const [stats, setStats] = useState({ xp: 0, workoutsDone: 0, runVolume: 0, sledVolume: 0 });
  const [pbs, setPbs] = useState({ run5k: '', sledPush: '', roxzone: '', raceSim: '' });
  const [rankData, setRankData] = useState<any>(null);

  // DATA STATE
  const [raceHistory, setRaceHistory] = useState<RaceResult[]>([]);
  const [validRaceCount, setValidRaceCount] = useState(0);

  // CHART STATE
  const [chartMode, setChartMode] = useState<'RACE' | 'STATIONS' | 'FATIGUE'>('RACE');
  const [stationFilter, setStationFilter] = useState('AVG');
  
  const [chartData, setChartData] = useState<number[]>([0]);
  const [chartLabels, setChartLabels] = useState<string[]>(['']);
  
  // INSIGHT STATE
  const [insightTitle, setInsightTitle] = useState('');
  const [insightValue, setInsightValue] = useState('');
  const [insightSub, setInsightSub] = useState('');
  const [trendPositive, setTrendPositive] = useState(true);

  // MODALS
  const [showEditPBModal, setShowEditPBModal] = useState(false);
  const [editingPbs, setEditingPbs] = useState({...pbs});

  useFocusEffect(
    useCallback(() => {
      loadCareerData();
    }, [])
  );

  useEffect(() => {
      calculateChart();
  }, [chartMode, raceHistory, stationFilter]);

  const loadCareerData = async () => {
    try {
      const profileJson = await AsyncStorage.getItem('user_profile');
      if (profileJson) setName(JSON.parse(profileJson).name?.toUpperCase() || 'ATHLETE');

      const planJson = await AsyncStorage.getItem('user_weekly_plan');
      const plan = planJson ? JSON.parse(planJson) : [];
      const historyJson = await AsyncStorage.getItem('user_history_stats');
      const history = historyJson ? JSON.parse(historyJson) : { xp: 0, workouts: 0, run: 0, sled: 0 };

      let weeklyXP = 0;
      let weeklyRun = 0;
      let weeklyWorkouts = 0;
      plan.forEach((day: any) => {
        if (day.complete) {
            weeklyWorkouts += 1;
            weeklyXP += 100;
            if (day.type === 'Run' || day.type === 'Hybrid') weeklyRun += 5;
        }
      });

      const totalXP = history.xp + weeklyXP;
      setStats({
        xp: totalXP,
        workoutsDone: (history.workouts || 0) + weeklyWorkouts,
        runVolume: (history.run || 0) + weeklyRun,
        sledVolume: (history.sled || 0)
      });
      setRankData(calculateLevel(totalXP));

      const pbsJson = await AsyncStorage.getItem('user_pbs');
      let currentPbs = pbsJson ? JSON.parse(pbsJson) : {};

      const raceHistoryJson = await AsyncStorage.getItem('raceHistory');
      if (raceHistoryJson) {
          const races: RaceResult[] = JSON.parse(raceHistoryJson);
          setRaceHistory(races);
          const validCount = races.filter(r => r.splits && r.splits.length > 0).length;
          setValidRaceCount(validCount);
          if (races.length > 0) {
              const bestRace = [...races].sort((a, b) => parseTimeToSeconds(a.totalTime) - parseTimeToSeconds(b.totalTime))[0];
              currentPbs.raceSim = bestRace.totalTime;
          }
      }
      setPbs(currentPbs);
    } catch (e) {
      console.log('Error loading data', e);
    }
  };

  const calculateChart = () => {
      const validRaces = raceHistory.filter(r => r.splits && r.splits.length > 0);
      
      // MINIMUM 5 RACES TO UNLOCK
      if (validRaces.length < 5) {
          setChartData([]); 
          return;
      }

      const recentRaces = validRaces.slice(0, 5).reverse();
      const labels = recentRaces.map((_, i) => `R${i + 1}`);
      let rawDataPoints: number[] = [];
      
      // MODE 1: RACE TIME
      if (chartMode === 'RACE') {
          rawDataPoints = recentRaces.map(r => parseTimeToMinutes(r.totalTime));
          if (rawDataPoints.length > 0) {
              const current = rawDataPoints[rawDataPoints.length - 1];
              const first = rawDataPoints[0];
              const diff = first - current;
              
              setInsightTitle("PROJECTED FINISH");
              setInsightValue(recentRaces[recentRaces.length - 1].totalTime);
              setInsightSub(diff >= 0 ? `-${diff.toFixed(1)} min` : `+${Math.abs(diff).toFixed(1)} min`);
              setTrendPositive(diff >= 0);
          }
      } 
      
      // MODE 2: STATIONS (With Weakest Link Detection)
      else if (chartMode === 'STATIONS') {
          if (stationFilter === 'AVG') {
              // 1. Calculate General Avg for the chart
              rawDataPoints = recentRaces.map(r => {
                  const stations = r.splits.filter(s => !s.name.includes('RUN') && s.name !== 'FINISH');
                  if (stations.length === 0) return 0;
                  const total = stations.reduce((a, b) => a + b.actual, 0);
                  return parseFloat((total / stations.length / 60).toFixed(2));
              });

              // 2. WEAKEST LINK DETECTOR
              // Scan all station averages to find the slowest one
              let slowestStationName = 'NONE';
              let maxAvgTime = 0;

              STATION_OPTIONS.forEach(opt => {
                  if (opt === 'AVG') return;
                  // Calculate avg time for this station across all recent races
                  let stationTotalTime = 0;
                  let count = 0;
                  recentRaces.forEach(r => {
                      const match = r.splits.find(s => s.name.trim().toUpperCase() === opt.trim().toUpperCase());
                      if (match) {
                          stationTotalTime += match.actual;
                          count++;
                      }
                  });
                  if (count > 0) {
                      const avg = stationTotalTime / count;
                      if (avg > maxAvgTime) {
                          maxAvgTime = avg;
                          slowestStationName = opt;
                      }
                  }
              });

              setInsightTitle("WEAKEST LINK");
              setInsightValue(slowestStationName); // e.g. "LUNGES"
              setInsightSub("Slowest Avg Station");
              setTrendPositive(false); // Weakest link is always a "warning"

          } else {
              // Specific Station Selected
              rawDataPoints = recentRaces.map(r => {
                  const station = r.splits.find(s => s.name.trim().toUpperCase() === stationFilter.trim().toUpperCase());
                  return station ? parseFloat((station.actual / 60).toFixed(2)) : 0;
              });

              const validPoints = rawDataPoints.filter(p => p > 0);
              const current = validPoints.length > 0 ? validPoints[validPoints.length - 1] : 0;
              const first = validPoints.length > 0 ? validPoints[0] : 0;
              
              setInsightTitle(stationFilter);
              setInsightValue(current > 0 ? `${current.toFixed(1)}m` : "--");
              setInsightSub(validPoints.length > 1 ? (current <= first ? "Improved" : "Slower") : "Tracked Trend");
              setTrendPositive(current <= first);
          }
      }
      
      // MODE 3: FATIGUE
      else if (chartMode === 'FATIGUE') {
          rawDataPoints = recentRaces.map(r => {
              const runs = r.splits.filter(s => s.name.includes('RUN'));
              if (!runs || runs.length < 4) return 0;
              const run1 = runs[0].actual;
              const run4 = runs[3].actual; 
              if (run1 <= 0) return 0; 
              const degradation = ((run4 - run1) / run1) * 100;
              return parseFloat(degradation.toFixed(1));
          });

          const currentFatigue = rawDataPoints.length > 0 ? rawDataPoints[rawDataPoints.length - 1] : 0;
          setInsightTitle("FATIGUE INDEX");
          setInsightValue(`${currentFatigue > 0 ? '+' : ''}${currentFatigue}%`);
          setInsightSub("Run 1 vs Run 4 Pace");
          setTrendPositive(currentFatigue < 10);
      }

      const safeData = rawDataPoints.map(p => (Number.isFinite(p) ? p : 0));
      setChartLabels(labels);
      setChartData(safeData);
  };

  const parseTimeToSeconds = (timeStr: string) => {
      if (!timeStr) return 0;
      const parts = timeStr.split(':').map(Number);
      return (parts[0] * 60) + (parts[1] || 0);
  };

  const parseTimeToMinutes = (timeStr: string) => {
      if (!timeStr) return 0;
      const parts = timeStr.split(':').map(Number);
      return parts[0] + ((parts[1] || 0) / 60);
  };

  const savePBs = async () => {
    try {
        await AsyncStorage.setItem('user_pbs', JSON.stringify(editingPbs));
        setPbs(editingPbs);
        setShowEditPBModal(false);
    } catch (e) {
        console.log("Error saving PBs", e);
    }
  };

  if (!rankData) return <View style={styles.container} />;

  const isChartLocked = validRaceCount < 5;
  const isDataValid = !isChartLocked && chartLabels.length > 0 && chartData.length > 0;
  
  const suffix = chartMode === 'FATIGUE' ? '%' : (chartMode === 'STATIONS' ? ' min' : ' min');
  const decimals = chartMode === 'RACE' ? 0 : 1; 

  const chartConfig = {
    backgroundGradientFrom: "#1E1E1E",
    backgroundGradientTo: "#1E1E1E",
    color: (opacity = 1) => `rgba(255, 215, 0, ${opacity})`,
    strokeWidth: 3,
    barPercentage: 0.5,
    decimalPlaces: decimals,
    propsForDots: { r: "5", strokeWidth: "2", stroke: "#000", fill: "#FFD700" },
    propsForBackgroundLines: { strokeDasharray: "5", stroke: "#333" },
    fillShadowGradientFrom: "#FFD700",
    fillShadowGradientTo: "#1E1E1E",
    fillShadowGradientOpacity: 0.2,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  };

  return (
    <View style={styles.container}>
      
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{alignItems: 'center'}}>
            <Text style={styles.headerLabel}>OPERATOR</Text>
            <Text style={styles.headerTitle}>{name}</Text>
        </View>
        <View style={{width: 40}} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        
        {/* IDENTITY CARD */}
        <View style={styles.identityCard}>
          <View style={styles.cardHeaderRow}>
             <View>
                 <Text style={styles.rankLabel}>CURRENT RANK</Text>
                 <Text style={styles.rankTitle}>{rankData.currentRank.title}</Text>
             </View>
             <View style={styles.xpBadge}>
                <Text style={styles.xpText}>{stats.xp} XP</Text>
             </View>
          </View>
          <View style={styles.levelContainer}>
            <View style={styles.levelInfo}>
                <Text style={styles.levelSub}>LEVEL {rankData.currentRank.id}</Text>
                <Text style={styles.levelNext}>{rankData.nextRank ? `${rankData.xpNeeded} XP TO PROMOTION` : "MAX RANK"}</Text>
            </View>
            <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${rankData.progress * 100}%` }]} />
            </View>
          </View>
        </View>

        {/* ANALYTICS ENGINE */}
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>MISSION ANALYTICS</Text>
        </View>

        <View style={styles.chartContainer}>
            {/* MAIN TABS */}
            <View style={styles.toggleRow}>
                {['RACE', 'STATIONS', 'FATIGUE'].map((mode) => (
                    <TouchableOpacity 
                        key={mode} 
                        style={[styles.toggleBtn, chartMode === mode && styles.toggleBtnActive]} 
                        onPress={() => setChartMode(mode as any)}
                        disabled={isChartLocked}
                    >
                        <Text style={[styles.toggleText, chartMode === mode && {color: '#000'}, isChartLocked && {color: '#444'}]}>{mode}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* SECONDARY STATION FILTER */}
            {chartMode === 'STATIONS' && !isChartLocked && (
                <View style={{ marginBottom: 15, height: 35 }}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap: 8}}>
                        {STATION_OPTIONS.map((st) => (
                            <TouchableOpacity 
                                key={st} 
                                style={[styles.chip, stationFilter === st && styles.chipActive]}
                                onPress={() => setStationFilter(st)}
                            >
                                <Text style={[styles.chipText, stationFilter === st && {color: '#000'}]}>{st}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* CHART */}
            {isDataValid ? (
                <>
                    <View style={styles.chartWrapper}>
                        <LineChart
                            data={{
                                labels: chartLabels,
                                datasets: [{ data: chartData }]
                            }}
                            width={SCREEN_WIDTH - 40} 
                            height={180}
                            yAxisSuffix={suffix}
                            chartConfig={chartConfig}
                            bezier
                            fromZero={true}
                            style={styles.chart}
                            withInnerLines={true}
                            withOuterLines={false}
                            withVerticalLines={false}
                        />
                    </View>
                    
                    {/* INSIGHT BOX */}
                    <View style={[styles.trendBox, { borderColor: trendPositive ? '#32D74B' : '#FF453A', backgroundColor: trendPositive ? 'rgba(50, 215, 75, 0.1)' : 'rgba(255, 69, 58, 0.1)' }]}>
                        <View style={{flex: 1}}>
                            <Text style={[styles.trendLabel, { color: trendPositive ? "#32D74B" : "#FF453A" }]}>{insightTitle}</Text>
                            <Text style={styles.trendValue}>{insightValue}</Text>
                        </View>
                        <View style={{alignItems: 'flex-end'}}>
                             <Ionicons name={trendPositive ? "trending-up" : "trending-down"} size={24} color={trendPositive ? "#32D74B" : "#FF453A"} />
                             <Text style={[styles.trendSub, { color: trendPositive ? "#32D74B" : "#FF453A" }]}>{insightSub}</Text>
                        </View>
                    </View>
                </>
            ) : (
                <View style={styles.emptyChart}>
                    <Ionicons name="lock-closed-outline" size={40} color="#666" />
                    <Text style={styles.emptyText}>GATHERING INTEL</Text>
                    
                    <View style={{width: '60%', height: 6, backgroundColor: '#333', borderRadius: 3, marginVertical: 10}}>
                        <View style={{width: `${(validRaceCount / 5) * 100}%`, height: '100%', backgroundColor: '#FFD700', borderRadius: 3}} />
                    </View>
                    
                    <Text style={styles.emptySub}>
                        {validRaceCount}/5 Simulations Complete
                    </Text>
                </View>
            )}
        </View>

        {/* 3. TROPHY CASE */}
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>TROPHY CASE</Text>
            <TouchableOpacity onPress={() => { setEditingPbs({...pbs}); setShowEditPBModal(true); }}>
                <Text style={styles.editLink}>EDIT</Text>
            </TouchableOpacity>
        </View>
        <View style={styles.pbGrid}>
            <View style={[styles.pbCard, {borderColor: '#FFD700'}]}>
                <Text style={[styles.pbLabel, {color: '#FFD700'}]}>SIMULATOR PB</Text>
                <Text style={[styles.pbValue, {color: '#fff'}]}>{pbs.raceSim || '--:--'}</Text>
            </View>
            <View style={styles.pbCard}>
                <Text style={styles.pbLabel}>5K RUN</Text>
                <Text style={styles.pbValue}>{pbs.run5k || '--:--'}</Text>
            </View>
            <View style={styles.pbCard}>
                <Text style={styles.pbLabel}>SLED PUSH</Text>
                <Text style={styles.pbValue}>{pbs.sledPush || '--'} KG</Text>
            </View>
            <View style={styles.pbCard}>
                <Text style={styles.pbLabel}>ROXZONE</Text>
                <Text style={styles.pbValue}>{pbs.roxzone || '--:--'}</Text>
            </View>
        </View>
        <View style={{height: 40}} />
        
        {/* 4. CAREER VOLUME */}
        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>SERVICE RECORD</Text></View>
        <View style={styles.statsGrid}>
           <View style={styles.statBox}>
              <Text style={styles.statNum}>{stats.workoutsDone}</Text>
              <Text style={styles.statLabel}>OPS</Text>
           </View>
           <View style={styles.statBox}>
              <Text style={styles.statNum}>{stats.runVolume.toFixed(0)}<Text style={styles.unit}>km</Text></Text>
              <Text style={styles.statLabel}>RUN</Text>
           </View>
           <View style={styles.statBox}>
              <Text style={styles.statNum}>{stats.sledVolume.toFixed(0)}<Text style={styles.unit}>m</Text></Text>
              <Text style={styles.statLabel}>SLED</Text>
           </View>
        </View>
      </ScrollView>

      {/* EDIT MODAL */}
      <Modal visible={showEditPBModal} animationType="slide" transparent>
        <BlurView intensity={90} tint="dark" style={styles.modalContainer}>
            <View style={[styles.modalContent, {height: '70%'}]}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>UPDATE RECORDS</Text>
                    <TouchableOpacity onPress={() => setShowEditPBModal(false)} style={styles.closeBtn}>
                        <Ionicons name="close" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={{opacity: 0.5, marginBottom: 20}}>
                        <Text style={styles.inputLabel}>RACE SIMULATOR BEST (AUTO)</Text>
                        <TextInput style={styles.input} value={editingPbs.raceSim || "No Data Yet"} editable={false} />
                    </View>
                    <Text style={styles.inputLabel}>5K RUN TIME</Text>
                    <TextInput style={styles.input} placeholder="20:00" placeholderTextColor="#444" value={editingPbs.run5k} onChangeText={(t) => setEditingPbs({...editingPbs, run5k: t})} />
                    <Text style={styles.inputLabel}>HEAVY SLED PUSH (KG)</Text>
                    <TextInput style={styles.input} placeholder="150" placeholderTextColor="#444" keyboardType="numeric" value={editingPbs.sledPush} onChangeText={(t) => setEditingPbs({...editingPbs, sledPush: t})} />
                    <Text style={styles.inputLabel}>ROXZONE AVG PACE</Text>
                    <TextInput style={styles.input} placeholder="4:30" placeholderTextColor="#444" value={editingPbs.roxzone} onChangeText={(t) => setEditingPbs({...editingPbs, roxzone: t})} />
                    <TouchableOpacity style={styles.saveBtn} onPress={savePBs}>
                        <Text style={styles.saveBtnText}>SAVE RECORDS</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </BlurView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 20 },
  backBtn: { padding: 8, backgroundColor: '#1E1E1E', borderRadius: 12 },
  headerTitle: { color: '#FFD700', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  headerLabel: { color: '#666', fontSize: 9, fontWeight: 'bold' },

  identityCard: { backgroundColor: '#1E1E1E', marginHorizontal: 20, padding: 20, borderRadius: 20, marginBottom: 25, borderWidth: 1, borderColor: '#333' },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  rankLabel: { color: '#666', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  rankTitle: { color: '#fff', fontSize: 28, fontWeight: '900', fontStyle: 'italic', marginTop: 4 },
  xpBadge: { backgroundColor: '#333', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  xpText: { color: '#FFD700', fontWeight: 'bold', fontSize: 12 },
  levelContainer: { marginBottom: 5 },
  levelInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  levelSub: { color: '#FFD700', fontSize: 12, fontWeight: '900' },
  levelNext: { color: '#666', fontSize: 10, fontWeight: 'bold' },
  progressBarBg: { height: 8, backgroundColor: '#333', borderRadius: 4 },
  progressBarFill: { height: '100%', backgroundColor: '#FFD700', borderRadius: 4 },

  chartContainer: { backgroundColor: '#1E1E1E', marginHorizontal: 20, borderRadius: 20, padding: 15, borderWidth: 1, borderColor: '#333', marginBottom: 25 },
  toggleRow: { flexDirection: 'row', backgroundColor: '#111', borderRadius: 12, padding: 4, marginBottom: 15 },
  toggleBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  toggleBtnActive: { backgroundColor: '#FFD700' },
  toggleText: { color: '#666', fontSize: 10, fontWeight: '900' },
  
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#111', borderWidth: 1, borderColor: '#333', marginRight: 5 },
  chipActive: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
  chipText: { color: '#666', fontSize: 10, fontWeight: '900' },

  chartWrapper: { alignItems: 'center', marginBottom: 15, paddingRight: 20 },
  chart: { borderRadius: 16 }, 
  
  trendBox: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, borderWidth: 1 },
  trendLabel: { fontSize: 10, fontWeight: '900', marginBottom: 4 },
  trendValue: { color: '#fff', fontSize: 22, fontWeight: '900' },
  trendSub: { fontSize: 10, fontWeight: 'bold', marginTop: 4 },

  emptyChart: { height: 180, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#444', fontWeight: '900', fontSize: 14, marginTop: 10 },
  emptySub: { color: '#666', fontSize: 10, marginTop: 5, textAlign: 'center', fontWeight: 'bold' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, marginBottom: 15 },
  sectionTitle: { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  editLink: { color: '#FFD700', fontSize: 10, fontWeight: 'bold' },
  
  pbGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 10 },
  pbCard: { width: (SCREEN_WIDTH - 50) / 2, backgroundColor: '#1E1E1E', padding: 15, borderRadius: 15, borderWidth: 1, borderColor: '#333' },
  pbLabel: { color: '#666', fontSize: 10, fontWeight: '900', marginBottom: 8 },
  pbValue: { color: '#fff', fontSize: 20, fontWeight: '900' },

  statsGrid: { flexDirection: 'row', marginHorizontal: 20, gap: 10, marginBottom: 30 },
  statBox: { flex: 1, backgroundColor: '#121212', padding: 15, borderRadius: 15, alignItems: 'center', borderWidth: 1, borderColor: '#222' },
  statNum: { color: '#fff', fontSize: 20, fontWeight: '900' },
  statLabel: { color: '#666', fontSize: 9, fontWeight: 'bold', marginTop: 4 },
  unit: { fontSize: 10, color: '#444' },

  modalContainer: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { height: '80%', backgroundColor: '#121212', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  closeBtn: { padding: 5 },
  inputLabel: { color: '#FFD700', fontSize: 10, fontWeight: '900', marginBottom: 8, marginTop: 15 },
  input: { backgroundColor: '#1E1E1E', borderRadius: 12, padding: 15, color: '#fff', fontSize: 16, borderWidth: 1, borderColor: '#333' },
  saveBtn: { backgroundColor: '#FFD700', marginTop: 30, padding: 20, borderRadius: 20, alignItems: 'center', marginBottom: 20 },
  saveBtnText: { color: '#000', fontWeight: '900', fontSize: 16 },
});