import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    Dimensions,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { LineChart } from "react-native-chart-kit";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { calculateLevel } from '../../utils/gamification';
import { DataStore, LogEntry } from './../services/DataStore'; // Ensure path is correct

const SCREEN_WIDTH = Dimensions.get('window').width;

// --- BENCHMARK STANDARDS ---
const STANDARDS_5K: any = {
    MEN_PRO:   { p1: 15.5, p5: 17.0, p20: 18.5, p50: 20.0 },
    MEN_OPEN:  { p1: 16.5, p5: 18.5, p20: 20.5, p50: 24.0 },
    WOMEN_PRO: { p1: 17.5, p5: 19.5, p20: 21.5, p50: 23.5 },
    WOMEN_OPEN:{ p1: 19.0, p5: 22.0, p20: 25.0, p50: 29.0 },
};

const STANDARDS_PFT: any = {
    MEN_PRO:   { p1: 14.0, p10: 16.0, p25: 18.0, p50: 20.0 },
    MEN_OPEN:  { p1: 16.0, p10: 19.0, p25: 22.0, p50: 26.0 },
    WOMEN_PRO: { p1: 16.0, p10: 18.0, p25: 20.0, p50: 23.0 },
    WOMEN_OPEN:{ p1: 18.0, p10: 22.0, p25: 25.0, p50: 30.0 },
};

const getPercentileRank = (time: number, standards: any) => {
    if (!standards) return { text: "UNRANKED", color: "#666", diff: "No Data" };
    if (time <= standards.p1) return { text: "TOP 1% (ELITE)", color: "#FFD700", diff: "World Class Pace" };
    if (time <= standards.p5 || time <= standards.p10) return { text: "TOP 10% (ADVANCED)", color: "#32D74B", diff: "Podium Contender" };
    if (time <= standards.p20 || time <= standards.p25) return { text: "TOP 25% (STRONG)", color: "#32D74B", diff: "Well Above Average" };
    if (time <= standards.p50) return { text: "TOP 50% (AVERAGE)", color: "#0A84FF", diff: "Solid Baseline" };
    return { text: "DEVELOPING", color: "#888", diff: "Keep Pushing" };
};

const STATION_OPTIONS = ['AVG', 'SKI ERG', 'SLED PUSH', 'SLED PULL', 'BURPEES', 'ROWING', 'FARMERS', 'LUNGES', 'WALL BALLS'];

export default function Profile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // USER STATE
  const [name, setName] = useState('ATHLETE');
  const [currentCategory, setCurrentCategory] = useState('MEN_OPEN');
  
  // DATASTORE STATE
  const [history, setHistory] = useState<LogEntry[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [rankData, setRankData] = useState<any>(null);
  
  // BENCHMARK STATE
  const [pftResult, setPftResult] = useState<{ time: string, grade: string, color: string, sub: string } | null>(null);
  const [runTestResult, setRunTestResult] = useState<{ time: string, grade: string, diff: string, color: string } | null>(null);

  // CHART STATE
  const [chartMode, setChartMode] = useState<'RACE' | 'STATIONS' | 'FATIGUE'>('RACE');
  const [stationFilter, setStationFilter] = useState('AVG');
  const [chartData, setChartData] = useState<number[]>([0]);
  const [chartLabels, setChartLabels] = useState<string[]>(['']);
  
  // INSIGHTS
  const [insightTitle, setInsightTitle] = useState('');
  const [insightValue, setInsightValue] = useState('');
  const [insightSub, setInsightSub] = useState('');
  const [trendPositive, setTrendPositive] = useState(true);

  // EDIT MODAL
  const [showEditPBModal, setShowEditPBModal] = useState(false);
  const [pbs, setPbs] = useState({ run5k: '', sledPush: '', roxzone: '', raceSim: '' });
  const [editingPbs, setEditingPbs] = useState({...pbs});

  useFocusEffect(useCallback(() => { loadCareerData(); }, []));
  
  // Recalculate chart whenever filter/mode/history changes
  React.useEffect(() => { 
      if (history.length > 0) calculateChart(); 
  }, [chartMode, history, stationFilter]);

  const loadCareerData = async () => {
    try {
      // 1. GET CENTRAL DATASTORE DOSSIER
      const dossier = await DataStore.getFullDossier();
      setHistory(dossier.history);
      setAnalytics(dossier.analytics);

      // 2. PROFILE BASICS
      const profileJson = await AsyncStorage.getItem('user_profile');
      if (profileJson) setName(JSON.parse(profileJson).name?.toUpperCase() || 'ATHLETE');
      
      const savedCat = await AsyncStorage.getItem('userCategory');
      const activeCategory = savedCat || 'MEN_OPEN';
      setCurrentCategory(activeCategory);

      // 3. RANK CALCULATION
      // We calculate XP based on totalOps from DataStore + Weekly plan (optional)
      const totalXP = (dossier.analytics.totalOps * 150); 
      setRankData(calculateLevel(totalXP));

      // 4. LOAD PBs (Manual Overrides + Auto Detect)
      const pbsJson = await AsyncStorage.getItem('user_pbs');
      let currentPbs = pbsJson ? JSON.parse(pbsJson) : {};
      
      // Auto-detect best SIM time from history
      const bestSim = dossier.history
        .filter(h => h.type === 'SIMULATION')
        .sort((a, b) => a.totalSeconds - b.totalSeconds)[0];
      
      if (bestSim) currentPbs.raceSim = bestSim.totalTime;
      setPbs(currentPbs);

      // 5. ANALYZE BENCHMARKS (PFT / 5K)
      analyzeBenchmarks(dossier.history, activeCategory);

    } catch (e) {
      console.log('Error loading data', e);
    }
  };

  const analyzeBenchmarks = (logs: LogEntry[], category: string) => {
      // PFT
      const pftLog = logs.find(r => r.title.includes('PFT'));
      if (pftLog) {
          const mins = pftLog.totalSeconds / 60;
          const standards = STANDARDS_PFT[category] || STANDARDS_PFT.MEN_OPEN;
          const rank = getPercentileRank(mins, standards);
          setPftResult({ time: pftLog.totalTime, grade: rank.text, color: rank.color, sub: rank.diff });
      }

      // 5K
      const runLog = logs.find(r => r.title.includes('5K') || r.title.includes('RUN TEST'));
      if (runLog) {
          const mins = runLog.totalSeconds / 60;
          const standards = STANDARDS_5K[category] || STANDARDS_5K.MEN_OPEN;
          const rank = getPercentileRank(mins, standards);
          setRunTestResult({ time: runLog.totalTime, grade: rank.text, diff: rank.diff, color: rank.color });
      }
  };

  // --- THE ADVANCED CHART ENGINE ---
  const calculateChart = () => {
      // Filter for valid simulations or races that have split data
      const validRaces = history.filter(r => r.splits && r.splits.length > 0 && (r.type === 'SIMULATION' || r.title.includes('HYROX')));
      
      // We need at least 2 data points for a line, but UI looks better with recent 5
      const recentRaces = validRaces.slice(0, 5).reverse(); // Oldest to Newest
      
      if (recentRaces.length === 0) {
          setChartData([0]); 
          return; 
      }

      const labels = recentRaces.map((_, i) => `R${i + 1}`);
      let rawDataPoints: number[] = [];

      // MODE 1: TOTAL RACE TIME
      if (chartMode === 'RACE') {
          rawDataPoints = recentRaces.map(r => r.totalSeconds / 60);
          
          if (rawDataPoints.length > 0) {
              const current = rawDataPoints[rawDataPoints.length - 1];
              const first = rawDataPoints[0];
              const diff = first - current; // Positive means we got faster
              
              setInsightTitle("PROJECTED FINISH");
              setInsightValue(recentRaces[recentRaces.length - 1].totalTime);
              setInsightSub(diff >= 0 ? `-${diff.toFixed(1)} min (Improved)` : `+${Math.abs(diff).toFixed(1)} min (Slower)`);
              setTrendPositive(diff >= 0);
          }
      } 
      
      // MODE 2: SPECIFIC STATION BREAKDOWN
      else if (chartMode === 'STATIONS') {
          if (stationFilter === 'AVG') {
              // Calculate average of all non-run stations per race
              rawDataPoints = recentRaces.map(r => {
                  const stations = r.splits?.filter(s => !s.name.includes('Run') && !s.name.includes('RUN') && s.name !== 'FINISH') || [];
                  if (stations.length === 0) return 0;
                  const total = stations.reduce((a, b) => a + (b.actual || b.time || 0), 0);
                  return parseFloat((total / stations.length / 60).toFixed(2));
              });
              setInsightTitle("AVG STATION TIME");
              setInsightValue("METABOLIC BASE");
              setInsightSub("Average time across all functional stations");
              setTrendPositive(true); 
          } else {
              // Look for specific station (e.g. "Wall Balls")
              rawDataPoints = recentRaces.map(r => {
                  // Fuzzy match the name
                  const station = r.splits?.find(s => s.name.toUpperCase().includes(stationFilter));
                  const val = station ? (station.actual || station.time || 0) : 0;
                  return parseFloat((val / 60).toFixed(2)); // Minutes
              });
              
              const validPoints = rawDataPoints.filter(p => p > 0);
              const current = validPoints.length > 0 ? validPoints[validPoints.length - 1] : 0;
              setInsightTitle(stationFilter);
              setInsightValue(current > 0 ? `${current.toFixed(1)}m` : "--");
              setInsightSub("Recent Performance");
              setTrendPositive(true); // Simplified logic
          }
      }
      
      // MODE 3: FATIGUE INDEX (Run 1 vs Last Run)
      else if (chartMode === 'FATIGUE') {
          rawDataPoints = recentRaces.map(r => {
              const runs = r.splits?.filter(s => s.name.toUpperCase().includes('RUN')) || [];
              if (runs.length < 2) return 0;
              
              const run1 = runs[0].actual || runs[0].time;
              const lastRun = runs[runs.length - 1].actual || runs[runs.length - 1].time;
              
              if (!run1 || run1 === 0) return 0;
              
              // Fatigue % = How much slower was the last run?
              const degradation = ((lastRun - run1) / run1) * 100;
              return parseFloat(degradation.toFixed(1));
          });
          
          const currentFatigue = rawDataPoints.length > 0 ? rawDataPoints[rawDataPoints.length - 1] : 0;
          setInsightTitle("FATIGUE INDEX");
          setInsightValue(`${currentFatigue > 0 ? '+' : ''}${currentFatigue}%`);
          setInsightSub(currentFatigue < 15 ? "Elite Endurance" : "High Degradation");
          setTrendPositive(currentFatigue < 15); // Good if less than 15% dropoff
      }

      setChartLabels(labels);
      setChartData(rawDataPoints.map(p => Number.isFinite(p) ? p : 0));
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

  if (!rankData || !analytics) return <View style={styles.container} />;

  const validRaceCount = history.filter(r => r.type === 'SIMULATION').length;
  const isDataValid = chartData.some(d => d > 0);
  
  const chartConfig = {
    backgroundGradientFrom: "#1E1E1E",
    backgroundGradientTo: "#1E1E1E",
    color: (opacity = 1) => `rgba(255, 215, 0, ${opacity})`,
    strokeWidth: 3,
    barPercentage: 0.5,
    decimalPlaces: chartMode === 'RACE' ? 0 : 1,
    propsForDots: { r: "5", strokeWidth: "2", stroke: "#000", fill: "#FFD700" },
    propsForBackgroundLines: { strokeDasharray: "5", stroke: "#333" },
    fillShadowGradientFrom: "#FFD700",
    fillShadowGradientTo: "#1E1E1E",
    fillShadowGradientOpacity: 0.2,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{alignItems: 'center'}}>
            <Text style={styles.headerLabel}>{currentCategory.replace('_', ' ')}</Text>
            <Text style={styles.headerTitle}>{name}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/settings')} style={styles.backBtn}>
          <Ionicons name="settings-sharp" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        
        {/* IDENTITY CARD (XP & LEVEL) */}
        <View style={styles.identityCard}>
          <View style={styles.cardHeaderRow}>
             <View>
                 <Text style={styles.rankLabel}>CURRENT RANK</Text>
                 <Text style={styles.rankTitle}>{rankData.currentRank.title}</Text>
             </View>
             <View style={styles.xpBadge}>
                <Text style={styles.xpText}>{rankData.totalXP} XP</Text>
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
            <Text style={styles.sectionTitle}>ADVANCED TELEMETRY</Text>
        </View>

        <View style={styles.chartContainer}>
            {/* TABS */}
            <View style={styles.toggleRow}>
                {['RACE', 'STATIONS', 'FATIGUE'].map((mode) => (
                    <TouchableOpacity 
                        key={mode} 
                        style={[styles.toggleBtn, chartMode === mode && styles.toggleBtnActive]} 
                        onPress={() => setChartMode(mode as any)}
                    >
                        <Text style={[styles.toggleText, chartMode === mode && {color: '#000'}]}>{mode}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* SUB-FILTER FOR STATIONS */}
            {chartMode === 'STATIONS' && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 15, maxHeight: 40}}>
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
            )}

            {/* CHART VISUAL */}
            {isDataValid ? (
                <>
                    <View style={styles.chartWrapper}>
                        <LineChart
                            data={{ labels: chartLabels, datasets: [{ data: chartData }] }}
                            width={SCREEN_WIDTH - 40} 
                            height={180}
                            yAxisSuffix={chartMode === 'FATIGUE' ? '%' : 'm'}
                            chartConfig={chartConfig}
                            bezier
                            fromZero={chartMode !== 'RACE'}
                            style={styles.chart}
                            withInnerLines={true}
                            withOuterLines={false}
                            withVerticalLines={false}
                        />
                    </View>
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
                    <Ionicons name="stats-chart" size={40} color="#666" />
                    <Text style={styles.emptyText}>NOT ENOUGH DATA</Text>
                    <Text style={styles.emptySub}>Complete more simulations to unlock telemetry.</Text>
                </View>
            )}
        </View>

        {/* BENCHMARK REPORT */}
        {(pftResult || runTestResult) && (
            <>
                <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>OFFICIAL BENCHMARKS</Text></View>
                <View style={styles.benchmarkContainer}>
                    <View style={styles.benchmarkRow}>
                        <View style={styles.benchLeft}>
                            <Text style={styles.benchLabel}>OFFICIAL PFT</Text>
                            <Text style={styles.benchTime}>{pftResult ? pftResult.time : "NO DATA"}</Text>
                        </View>
                        <View style={styles.benchRight}>
                            <Text style={[styles.benchGrade, { color: pftResult ? pftResult.color : '#666' }]}>
                                {pftResult ? pftResult.grade : "UNRANKED"}
                            </Text>
                            <Text style={styles.benchSub}>{pftResult ? pftResult.sub : "Run PFT to classify"}</Text>
                        </View>
                    </View>
                    <View style={styles.benchDivider} />
                    <View style={styles.benchmarkRow}>
                        <View style={styles.benchLeft}>
                            <Text style={styles.benchLabel}>5K CAPACITY</Text>
                            <Text style={styles.benchTime}>{runTestResult ? runTestResult.time : "NO DATA"}</Text>
                        </View>
                        <View style={styles.benchRight}>
                            <Text style={[styles.benchGrade, { color: runTestResult ? runTestResult.color : '#666' }]}>
                                {runTestResult ? runTestResult.grade : "UNRANKED"}
                            </Text>
                            <Text style={styles.benchSub}>{runTestResult ? runTestResult.diff : "Run a 5k to unlock"}</Text>
                        </View>
                    </View>
                </View>
            </>
        )}

        {/* TROPHY CASE */}
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>TROPHY CASE</Text>
            <TouchableOpacity onPress={() => { setEditingPbs({...pbs}); setShowEditPBModal(true); }}>
                <Text style={styles.editLink}>EDIT RECORDS</Text>
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
        
        <View style={{height: 30}} />
        
        {/* SERVICE RECORD (Connected to DataStore Analytics) */}
        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>SERVICE RECORD</Text></View>
        <View style={styles.statsGrid}>
           <View style={styles.statBox}>
              <Text style={styles.statNum}>{analytics.totalOps}</Text>
              <Text style={styles.statLabel}>MISSIONS</Text>
           </View>
           <View style={styles.statBox}>
              <Text style={styles.statNum}>{analytics.totalRunDistance.toFixed(0)}<Text style={styles.unit}>km</Text></Text>
              <Text style={styles.statLabel}>DISTANCE</Text>
           </View>
           <View style={styles.statBox}>
              <Text style={styles.statNum}>{analytics.totalTonnage > 1000 ? (analytics.totalTonnage/1000).toFixed(1) + 'k' : analytics.totalTonnage.toFixed(0)}<Text style={styles.unit}>kg</Text></Text>
              <Text style={styles.statLabel}>MOVED</Text>
           </View>
           <View style={[styles.statBox, {borderColor: analytics.consistencyScore > 80 ? '#32D74B' : '#333'}]}>
              <Text style={[styles.statNum, {color: analytics.consistencyScore > 80 ? '#32D74B' : '#fff'}]}>{analytics.consistencyScore}%</Text>
              <Text style={styles.statLabel}>CONSISTENCY</Text>
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

  benchmarkContainer: { backgroundColor: '#1E1E1E', marginHorizontal: 20, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#333', marginBottom: 25 },
  benchmarkRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  benchLeft: { justifyContent: 'center' },
  benchLabel: { color: '#666', fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 2 },
  benchTime: { color: '#fff', fontSize: 24, fontWeight: '900', fontStyle: 'italic' },
  benchRight: { alignItems: 'flex-end', justifyContent: 'center' },
  benchGrade: { fontSize: 16, fontWeight: '900' },
  benchSub: { color: '#666', fontSize: 9, fontWeight: 'bold', marginTop: 2 },
  benchDivider: { height: 1, backgroundColor: '#333', marginVertical: 15 },

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