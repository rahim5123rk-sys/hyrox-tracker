import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    Dimensions, Image, Modal, ScrollView, StatusBar,
    StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { LineChart } from "react-native-chart-kit";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RadarChart } from '../../components/RadarChart';
import { calculateLevel } from '../../utils/gamification';
import { AnalysisEngine, AnalysisReport } from './../services/AnalysisEngine';
// [IMPORT] METRICS & MetricKey for Type Safety
import { AnalyticsProfile, DataStore, LogEntry, METRICS, MetricKey } from './../services/DataStore';

const SCREEN_WIDTH = Dimensions.get('window').width;

// [UPDATE] USE METRIC KEYS (No more Magic Strings)
const STATION_KEYS: Record<string, MetricKey> = {
    'SKI ERG': METRICS.SKI_ERG,
    'SLED PUSH': METRICS.SLED_PUSH,
    'SLED PULL': METRICS.SLED_PULL,
    'BURPEES': METRICS.BURPEES,
    'ROWING': METRICS.ROWING,
    'FARMERS': METRICS.FARMERS,
    'LUNGES': METRICS.LUNGES,
    'WALL BALLS': METRICS.WALL_BALLS,
    'ROXZONE': METRICS.ROXZONE
};

const STANDARDS_PFT: any = { MEN_PRO: { p1: 14.0, p10: 16.0, p25: 18.0, p50: 20.0 }, MEN_OPEN: { p1: 16.0, p10: 19.0, p25: 22.0, p50: 26.0 }, WOMEN_PRO: { p1: 16.0, p10: 18.0, p25: 20.0, p50: 23.0 }, WOMEN_OPEN:{ p1: 18.0, p10: 22.0, p25: 25.0, p50: 30.0 }};
const STANDARDS_5K: any = { MEN_PRO: { p1: 15.5, p5: 17.0, p20: 18.5, p50: 20.0 }, MEN_OPEN: { p1: 16.5, p5: 18.5, p20: 20.5, p50: 24.0 }, WOMEN_PRO: { p1: 17.5, p5: 19.5, p20: 21.5, p50: 23.5 }, WOMEN_OPEN:{ p1: 19.0, p5: 22.0, p20: 25.0, p50: 29.0 }};

const getPercentileRank = (time: number, standards: any) => { if (!standards) return { text: "UNRANKED", color: "#666", diff: "No Data" }; if (time <= standards.p1) return { text: "TOP 1% (ELITE)", color: "#FFD700", diff: "World Class Pace" }; if (time <= standards.p5 || time <= standards.p10) return { text: "TOP 10% (ADVANCED)", color: "#32D74B", diff: "Podium Contender" }; if (time <= standards.p20 || time <= standards.p25) return { text: "TOP 25% (STRONG)", color: "#32D74B", diff: "Well Above Average" }; if (time <= standards.p50) return { text: "TOP 50% (AVERAGE)", color: "#0A84FF", diff: "Solid Baseline" }; return { text: "DEVELOPING", color: "#888", diff: "Keep Pushing" };};

export default function Profile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [name, setName] = useState('ATHLETE');
  const [currentCategory, setCurrentCategory] = useState('MEN_OPEN');
  const [analytics, setAnalytics] = useState<AnalyticsProfile | null>(null);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [history, setHistory] = useState<LogEntry[]>([]);
  const [rankData, setRankData] = useState<any>(null);
  
  const [pftResult, setPftResult] = useState<any>(null);
  const [runTestResult, setRunTestResult] = useState<any>(null);

  const [chartMode, setChartMode] = useState<'RACE' | 'STATIONS' | 'FATIGUE'>('RACE');
  const [stationFilter, setStationFilter] = useState('SKI ERG'); 
  const [chartData, setChartData] = useState<number[]>([0]);
  const [chartLabels, setChartLabels] = useState<string[]>(['']);
  const [radarData, setRadarData] = useState<number[]>([50, 50, 50, 50, 50]);
  const [insight, setInsight] = useState({ title: '', value: '', sub: '', positive: true });
  
  const [pbs, setPbs] = useState<any>({});
  const [showEditPBModal, setShowEditPBModal] = useState(false);
  const [editingPbs, setEditingPbs] = useState<any>({});
  const [showCertificate, setShowCertificate] = useState(false);
  const [activeCertificate, setActiveCertificate] = useState<any>(null);

  useFocusEffect(useCallback(() => { loadData(); }, []));
  React.useEffect(() => { if (analytics) calculateLineChart(); }, [chartMode, analytics, stationFilter]);

  const loadData = async () => {
    try {
      const dossier = await DataStore.getFullDossier();
      setAnalytics(dossier.analytics);
      setHistory(dossier.history);

      // [FIX] LOAD FROM SQLITE SOURCE OF TRUTH
      const profile = await DataStore.getUserProfile();
      let category = 'MEN_OPEN'; // Default fallback

      if (profile) {
          setName(profile.name?.toUpperCase());
          category = profile.category;
          setCurrentCategory(category);
      } else {
          // Legacy Fallback (Safe to remove later)
          const legacyName = await AsyncStorage.getItem('user_profile');
          if (legacyName) setName(JSON.parse(legacyName).name?.toUpperCase());
      }

      const totalXP = dossier.analytics.totalOps * 150;
      setRankData(calculateLevel(totalXP));
      
      calculateBioSignature(dossier.analytics);
      
      // [FIX] PASS CATEGORY TO ENGINE
      const coachReport = AnalysisEngine.generateReport(dossier.analytics, category);
      setReport(coachReport);

      const savedPbs = await AsyncStorage.getItem('user_pbs');
      setPbs(savedPbs ? JSON.parse(savedPbs) : {});

      analyzeBenchmarks(dossier.history, category);
    } catch (e) { console.log(e); }
  };

  const analyzeBenchmarks = async (logs: LogEntry[], category: string) => {
      const pftLog = logs.find(r => r.title.includes('PFT'));
      if (pftLog) {
          const mins = pftLog.totalSeconds / 60;
          const standards = STANDARDS_PFT[category] || STANDARDS_PFT.MEN_OPEN;
          const rank = getPercentileRank(mins, standards);
          setPftResult({ title: "HYROX PFT", time: pftLog.totalTime, grade: rank.text, color: rank.color, sub: rank.diff, date: pftLog.date });
      }
      const runLog = logs.find(r => r.title.includes('5K') || r.title.includes('RUN TEST'));
      if (runLog) {
          const mins = runLog.totalSeconds / 60;
          const standards = STANDARDS_5K[category] || STANDARDS_5K.MEN_OPEN;
          const rank = getPercentileRank(mins, standards);
          setRunTestResult({ title: "5K CAPACITY", time: runLog.totalTime, grade: rank.text, color: rank.color, sub: rank.diff, date: runLog.date });
      }
  };

  const calculateBioSignature = (stats: AnalyticsProfile) => {
      const score = (val: number, elite: number, rookie: number) => {
          if (!val) return 0;
          if (val <= elite) return 100;
          if (val >= rookie) return 20;
          return Math.round(20 + ((rookie - val) / (rookie - elite)) * 80);
      };
      
      const last = (arr: number[]) => (arr && arr.length > 0) ? arr[arr.length - 1] : 0;

      // [UPDATE] USE METRIC CONSTANTS
      const lastPace = last(stats.trends[METRICS.RUN_PACE]) || 360;
      const speed = score(lastPace, 240, 420); 
      
      const lastSled = last(stats.trends[METRICS.SLED_PUSH]) || 180;
      const power = score(lastSled, 120, 300); 
      
      const ski = last(stats.trends[METRICS.SKI_ERG]) || 270;
      const row = last(stats.trends[METRICS.ROWING]) || 270;
      const engine = score((ski+row)/2, 230, 360); 
      
      const lastFatigue = last(stats.trends[METRICS.FATIGUE]) || 20;
      const grit = Math.max(0, 100 - (lastFatigue * 2)); 
      
      const consistency = stats.consistencyScore || 0;
      setRadarData([speed, power, engine, grit, consistency]);
  };

  const calculateLineChart = () => {
      if (!analytics) return;
      
      // [UPDATE] USE METRIC CONSTANTS
      const count = analytics.trends[METRICS.RUN_PACE].length; 
      if (count < 1 && chartMode === 'RACE') { setChartData([0]); return; }

      const labels = Array.from({length: Math.max(1, count)}, (_, i) => `R${i+1}`);
      let dataPoints: number[] = [];

      const sanitize = (val: any) => (val === null || val === undefined || isNaN(val)) ? 0 : val;

      if (chartMode === 'RACE') {
          dataPoints = analytics.trends[METRICS.RUN_PACE].map(x => parseFloat((sanitize(x) / 60).toFixed(2))); 
          setInsight({ title: "RUN PACE", value: `${dataPoints[count-1] || '--'}`, sub: "MINS / KM", positive: true });
      } 
      else if (chartMode === 'STATIONS') {
          // [UPDATE] Type-Safe Lookup
          const key = STATION_KEYS[stationFilter];
          const raw = analytics.trends[key] || [];
          
          if (raw.length === 0) {
              dataPoints = [0];
              setInsight({ title: stationFilter, value: "--", sub: "NO DATA", positive: false });
          } else {
              dataPoints = raw.map((x: any) => parseFloat((sanitize(x) / 60).toFixed(2)));
              const curr = dataPoints[dataPoints.length-1];
              setInsight({ title: stationFilter, value: `${curr}m`, sub: "STATION TIME", positive: true });
          }
      } 
      else if (chartMode === 'FATIGUE') {
          const raw = analytics.trends[METRICS.FATIGUE] || [];
          if (raw.length === 0) {
              dataPoints = [0];
              setInsight({ title: "FATIGUE", value: "--", sub: "NO DATA", positive: false });
          } else {
              dataPoints = raw.map(x => parseFloat(sanitize(x).toFixed(1)));
              const curr = dataPoints[dataPoints.length - 1];
              setInsight({ title: "FATIGUE INDEX", value: `${curr}%`, sub: "% DEGRADATION", positive: curr < 15 });
          }
      }

      setChartLabels(labels);
      setChartData(dataPoints);
  };

  const openCertificate = (data: any) => {
      setActiveCertificate(data);
      setShowCertificate(true);
  };

  const savePBs = async () => {
     try {
        await AsyncStorage.setItem('user_pbs', JSON.stringify(editingPbs));
        setPbs(editingPbs);
        setShowEditPBModal(false);
    } catch (e) { console.log(e); }
  };

  if (!rankData || !analytics) return <View style={styles.container} />;
  const isDataValid = chartData.length > 0 && chartData.some(d => d > 0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* 1. HEADER */}
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
          <View style={styles.headerTop}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/settings')} style={styles.backBtn}><Ionicons name="settings-sharp" size={20} color="#fff" /></TouchableOpacity>
          </View>
          <View style={styles.profileRow}>
              <View style={styles.avatarContainer}>
                  <Image source={require('../../assets/images/icon.png')} style={styles.avatar} />
                  <View style={styles.rankBadge}>
                      <Text style={styles.rankBadgeText}>{rankData.currentRank.id}</Text>
                  </View>
              </View>
              <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{name}</Text>
                  <Text style={styles.profileCategory}>{currentCategory.replace('_', ' ')} DIVISION</Text>
                  <View style={styles.xpBarContainer}>
                      <View style={[styles.xpBarFill, { width: `${rankData.progress * 100}%` }]} />
                  </View>
                  <Text style={styles.xpText}>{rankData.totalXP} XP • {rankData.currentRank.title}</Text>
              </View>
          </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        
        {/* 2. RADAR CHART & BIO-SIGNATURE */}
        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>ATHLETE BIO-SIGNATURE</Text></View>
        <View style={styles.chartContainer}>
             <View style={{alignItems: 'center', marginVertical: 10}}>
                <RadarChart 
                    data={radarData} 
                    labels={["SPEED", "POWER", "ENGINE", "GRIT", "CONSISTENCY"]}
                    size={180}
                />
            </View>
            {report && <Text style={styles.radarAnalysis}>{report.radarAnalysis}</Text>}
        </View>

        {/* 3. TACTICAL ANALYSIS CARD (THE BRAIN) */}
        {report && (
            <View style={styles.coachContainer}>
                <View style={styles.coachHeaderRow}>
                    <Ionicons name="medical" size={24} color="#FFD700" />
                    <Text style={styles.coachTitle}>TACTICAL ANALYSIS</Text>
                </View>
                
                <View style={styles.archetypeBox}>
                    <Text style={styles.archetypeLabel}>CLASSIFICATION</Text>
                    <Text style={styles.archetypeTitle}>{report.archetype}</Text>
                    <Text style={styles.archetypeDesc}>{report.archetypeDesc}</Text>
                </View>

                <View style={styles.weaknessRow}>
                    <View style={{flex:1}}>
                        <Text style={styles.weaknessLabel}>CRITICAL WEAKNESS</Text>
                        <Text style={styles.weaknessValue}>{report.primaryWeakness}</Text>
                    </View>
                    <View style={styles.focusBadge}>
                        <Text style={styles.focusText}>{report.focusArea} FOCUS</Text>
                    </View>
                </View>

                <View style={styles.adviceList}>
                    {report.tacticalAdvice.map((tip, i) => (
                        <View key={i} style={styles.adviceRow}>
                            <Ionicons name="alert-circle" size={14} color="#FF453A" style={{marginTop: 2}} />
                            <Text style={styles.adviceText}>{tip}</Text>
                        </View>
                    ))}
                </View>

                <Text style={styles.recHeader}>RECOMMENDED OPERATIONS</Text>
                {report.recommendedWorkouts.map((workout, i) => (
                    <TouchableOpacity key={i} style={styles.recCard} onPress={() => router.push({ pathname: '/mission_brief', params: { workoutId: workout.id } })}>
                        <View>
                            <Text style={styles.recTitle}>{workout.title}</Text>
                            <Text style={styles.recSub}>{workout.station} • {workout.estTime}</Text>
                        </View>
                        <Ionicons name="arrow-forward-circle" size={28} color="#FFD700" />
                    </TouchableOpacity>
                ))}
            </View>
        )}

        {/* 4. TELEMETRY */}
        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>ADVANCED TELEMETRY</Text></View>
        <View style={styles.chartContainer}>
            <View style={styles.toggleRow}>
                {['RACE', 'STATIONS', 'FATIGUE'].map((mode) => (
                    <TouchableOpacity key={mode} style={[styles.toggleBtn, chartMode === mode && styles.toggleBtnActive]} onPress={() => setChartMode(mode as any)}>
                        <Text style={[styles.toggleText, chartMode === mode && {color: '#000'}]}>{mode}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {chartMode === 'STATIONS' && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 15, maxHeight: 40}}>
                    {Object.keys(STATION_KEYS).map((st) => (
                        <TouchableOpacity key={st} style={[styles.chip, stationFilter === st && styles.chipActive]} onPress={() => setStationFilter(st)}>
                            <Text style={[styles.chipText, stationFilter === st && {color: '#000'}]}>{st}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}

            {isDataValid ? (
                <>
                    <View style={{ paddingRight: 20 }}> 
                        <LineChart
                            data={{ labels: chartLabels, datasets: [{ data: chartData }] }}
                            width={SCREEN_WIDTH - 64} 
                            height={180}
                            yAxisSuffix={chartMode === 'FATIGUE' ? '%' : ''}
                            chartConfig={{
                                backgroundGradientFrom: "#1E1E1E", backgroundGradientTo: "#1E1E1E",
                                color: (opacity = 1) => `rgba(255, 215, 0, ${opacity})`,
                                strokeWidth: 3, decimalPlaces: 1, 
                                propsForDots: { r: "4", fill: "#FFD700" },
                                propsForLabels: { fontSize: 10 }
                            }}
                            bezier style={{ borderRadius: 16 }}
                            withInnerLines={false}
                        />
                    </View>
                    
                    <View style={[styles.trendBox, { borderColor: insight.positive ? '#32D74B' : '#FF453A' }]}>
                        <View>
                            <Text style={[styles.trendLabel, { color: insight.positive ? "#32D74B" : "#FF453A" }]}>{insight.title}</Text>
                            <Text style={styles.trendValue}>{insight.value}</Text>
                        </View>
                        <Text style={[styles.trendSub, { color: insight.positive ? "#32D74B" : "#FF453A" }]}>{insight.sub}</Text>
                    </View>
                </>
            ) : (
                <View style={styles.emptyChart}><Text style={styles.emptyText}>NOT ENOUGH DATA</Text></View>
            )}
        </View>

        {/* 5. BENCHMARKS */}
        {(pftResult || runTestResult) && (
            <>
                <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>OFFICIAL BENCHMARKS</Text></View>
                <View style={styles.benchmarkGrid}>
                     {pftResult && (
                         <TouchableOpacity style={[styles.benchCard, {borderColor: pftResult.color}]} onPress={() => openCertificate(pftResult)}>
                            <View style={styles.benchHeader}>
                                <Ionicons name="ribbon" size={24} color={pftResult.color} />
                                <Text style={[styles.benchCardTitle, {color: pftResult.color}]}>{pftResult.grade}</Text>
                            </View>
                            <Text style={styles.benchCardTime}>{pftResult.time}</Text>
                            <Text style={styles.benchCardLabel}>{pftResult.title}</Text>
                            <Text style={styles.tapTip}>TAP FOR CERTIFICATE</Text>
                         </TouchableOpacity>
                     )}
                     {runTestResult && (
                         <TouchableOpacity style={[styles.benchCard, {borderColor: runTestResult.color}]} onPress={() => openCertificate(runTestResult)}>
                            <View style={styles.benchHeader}>
                                <Ionicons name="speedometer" size={24} color={runTestResult.color} />
                                <Text style={[styles.benchCardTitle, {color: runTestResult.color}]}>{runTestResult.grade}</Text>
                            </View>
                            <Text style={styles.benchCardTime}>{runTestResult.time}</Text>
                            <Text style={styles.benchCardLabel}>{runTestResult.title}</Text>
                            <Text style={styles.tapTip}>TAP FOR CERTIFICATE</Text>
                         </TouchableOpacity>
                     )}
                </View>
            </>
        )}

        {/* 6. TROPHY CASE */}
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

        {/* 7. SERVICE RECORD */}
        <View style={styles.statsGrid}>
           <View style={styles.statBox}><Text style={styles.statNum}>{analytics.totalOps}</Text><Text style={styles.statLabel}>MISSIONS</Text></View>
           <View style={styles.statBox}><Text style={styles.statNum}>{(analytics.totalTonnage/1000).toFixed(0)}k</Text><Text style={styles.statLabel}>KG MOVED</Text></View>
           <View style={styles.statBox}><Text style={styles.statNum}>{analytics.consistencyScore}%</Text><Text style={styles.statLabel}>CONSISTENCY</Text></View>
        </View>
        
        <View style={{height: 30}} />
      </ScrollView>

      {/* EDIT MODAL */}
      <Modal visible={showEditPBModal} animationType="slide" transparent>
        <BlurView intensity={90} tint="dark" style={styles.modalContainer}>
            <View style={[styles.modalContent, {height: '60%'}]}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>UPDATE RECORDS</Text>
                    <TouchableOpacity onPress={() => setShowEditPBModal(false)} style={styles.closeBtn}><Ionicons name="close" size={24} color="#fff" /></TouchableOpacity>
                </View>
                <ScrollView>
                    <Text style={styles.inputLabel}>5K RUN TIME</Text>
                    <TextInput style={styles.input} placeholder="20:00" placeholderTextColor="#444" value={editingPbs.run5k} onChangeText={(t) => setEditingPbs({...editingPbs, run5k: t})} />
                    <Text style={styles.inputLabel}>HEAVY SLED PUSH (KG)</Text>
                    <TextInput style={styles.input} placeholder="150" placeholderTextColor="#444" keyboardType="numeric" value={editingPbs.sledPush} onChangeText={(t) => setEditingPbs({...editingPbs, sledPush: t})} />
                    <Text style={styles.inputLabel}>ROXZONE AVG PACE</Text>
                    <TextInput style={styles.input} placeholder="4:30" placeholderTextColor="#444" value={editingPbs.roxzone} onChangeText={(t) => setEditingPbs({...editingPbs, roxzone: t})} />
                    <TouchableOpacity style={styles.saveBtn} onPress={savePBs}><Text style={styles.saveBtnText}>SAVE RECORDS</Text></TouchableOpacity>
                </ScrollView>
            </View>
        </BlurView>
      </Modal>

      {/* CERTIFICATE MODAL */}
      <Modal visible={showCertificate} animationType="fade" transparent>
          <BlurView intensity={100} tint="dark" style={styles.certContainer}>
              <View style={[styles.certCard, {borderColor: activeCertificate?.color}]}>
                  <View style={styles.certHeader}>
                      <Ionicons name="ribbon" size={40} color={activeCertificate?.color} />
                      <Text style={styles.certTitle}>OFFICIAL RESULT</Text>
                  </View>
                  <View style={styles.certBody}>
                      <Text style={styles.certLabel}>ATHLETE</Text>
                      <Text style={styles.certValue}>{name}</Text>
                      <Text style={styles.certLabel}>EVENT</Text>
                      <Text style={styles.certValue}>{activeCertificate?.title}</Text>
                      <View style={styles.certDivider} />
                      <Text style={styles.certLabel}>PERFORMANCE</Text>
                      <Text style={[styles.certBigTime, {color: activeCertificate?.color}]}>{activeCertificate?.time}</Text>
                      <Text style={[styles.certRank, {backgroundColor: activeCertificate?.color}]}>{activeCertificate?.grade}</Text>
                      <Text style={styles.certDate}>{new Date(activeCertificate?.date).toDateString()}</Text>
                  </View>
                  <TouchableOpacity style={[styles.shareBtn, {backgroundColor: activeCertificate?.color}]} onPress={() => setShowCertificate(false)}>
                      <Text style={styles.shareBtnText}>CLOSE CERTIFICATE</Text>
                  </TouchableOpacity>
              </View>
          </BlurView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  
  // HEADER
  headerContainer: { backgroundColor: '#111', paddingBottom: 20, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#222' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  backBtn: { padding: 5 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  avatarContainer: { position: 'relative' },
  avatar: { width: 70, height: 70, borderRadius: 35, borderWidth: 2, borderColor: '#333' },
  rankBadge: { position: 'absolute', bottom: -5, right: -5, backgroundColor: '#FFD700', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#000' },
  rankBadgeText: { fontSize: 10, fontWeight: '900', color: '#000' },
  profileInfo: { flex: 1 },
  profileName: { color: '#fff', fontSize: 20, fontWeight: '900', fontStyle: 'italic' },
  profileCategory: { color: '#888', fontSize: 10, fontWeight: 'bold', marginBottom: 6, letterSpacing: 1 },
  xpBarContainer: { height: 6, backgroundColor: '#333', borderRadius: 3, marginBottom: 6 },
  xpBarFill: { height: '100%', backgroundColor: '#FFD700', borderRadius: 3 },
  xpText: { color: '#666', fontSize: 10, fontWeight: 'bold' },

  chartContainer: { backgroundColor: '#1E1E1E', marginHorizontal: 20, borderRadius: 20, padding: 15, borderWidth: 1, borderColor: '#333', marginBottom: 25 },
  radarAnalysis: { color: '#888', fontSize: 10, textAlign: 'center', fontStyle: 'italic', marginTop: 10 },
  toggleRow: { flexDirection: 'row', backgroundColor: '#111', borderRadius: 12, padding: 4, marginBottom: 15 },
  toggleBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  toggleBtnActive: { backgroundColor: '#FFD700' },
  toggleText: { color: '#666', fontSize: 10, fontWeight: '900' },
  
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#111', borderWidth: 1, borderColor: '#333', marginRight: 5 },
  chipActive: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
  chipText: { color: '#666', fontSize: 10, fontWeight: '900' },

  trendBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderRadius: 12, borderWidth: 1, backgroundColor: 'rgba(0,0,0,0.2)', marginTop: 10 },
  trendLabel: { fontSize: 10, fontWeight: '900', marginBottom: 4 },
  trendValue: { color: '#fff', fontSize: 22, fontWeight: '900' },
  trendSub: { fontSize: 10, fontWeight: 'bold', marginTop: 4 },

  emptyChart: { height: 180, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#444', fontWeight: '900', fontSize: 14 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, marginBottom: 15 },
  sectionTitle: { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  editLink: { color: '#FFD700', fontSize: 10, fontWeight: 'bold' },
  
  benchmarkGrid: { paddingHorizontal: 20, gap: 15, marginBottom: 30 },
  benchCard: { backgroundColor: '#1E1E1E', padding: 20, borderRadius: 16, borderWidth: 1, alignItems: 'center' },
  benchHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  benchCardTitle: { fontSize: 16, fontWeight: '900' },
  benchCardTime: { color: '#fff', fontSize: 32, fontWeight: '900', fontFamily: 'Courier', marginBottom: 5 },
  benchCardLabel: { color: '#666', fontSize: 10, fontWeight: 'bold', letterSpacing: 2 },
  tapTip: { color: '#444', fontSize: 9, marginTop: 15, fontWeight: 'bold' },

  pbGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 10 },
  pbCard: { width: (SCREEN_WIDTH - 50) / 2, backgroundColor: '#1E1E1E', padding: 15, borderRadius: 15, borderWidth: 1, borderColor: '#333' },
  pbLabel: { color: '#666', fontSize: 10, fontWeight: '900', marginBottom: 8 },
  pbValue: { color: '#fff', fontSize: 20, fontWeight: '900' },

  statsGrid: { flexDirection: 'row', marginHorizontal: 20, gap: 10, marginBottom: 30, marginTop: 20 },
  statBox: { flex: 1, backgroundColor: '#121212', padding: 15, borderRadius: 15, alignItems: 'center', borderWidth: 1, borderColor: '#222' },
  statNum: { color: '#fff', fontSize: 20, fontWeight: '900' },
  statLabel: { color: '#666', fontSize: 9, fontWeight: 'bold', marginTop: 4 },

  modalContainer: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { height: '70%', backgroundColor: '#121212', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  closeBtn: { padding: 5 },
  inputLabel: { color: '#FFD700', fontSize: 10, fontWeight: '900', marginBottom: 8, marginTop: 15 },
  input: { backgroundColor: '#1E1E1E', borderRadius: 12, padding: 15, color: '#fff', fontSize: 16, borderWidth: 1, borderColor: '#333' },
  saveBtn: { backgroundColor: '#FFD700', marginTop: 30, padding: 20, borderRadius: 20, alignItems: 'center', marginBottom: 20 },
  saveBtnText: { color: '#000', fontWeight: '900', fontSize: 16 },

  certContainer: { flex: 1, justifyContent: 'center', padding: 20 },
  certCard: { backgroundColor: '#000', borderWidth: 2, borderRadius: 20, padding: 25, alignItems: 'center' },
  certHeader: { alignItems: 'center', marginBottom: 20 },
  certTitle: { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: 2, marginTop: 10 },
  certBody: { width: '100%', alignItems: 'center' },
  certLabel: { color: '#666', fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginTop: 15 },
  certValue: { color: '#fff', fontSize: 18, fontWeight: 'bold', fontStyle: 'italic' },
  certDivider: { width: '40%', height: 1, backgroundColor: '#333', marginVertical: 20 },
  certBigTime: { fontSize: 48, fontWeight: '900', fontFamily: 'Courier', marginVertical: 10 },
  certRank: { color: '#000', fontWeight: '900', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 8, overflow: 'hidden', marginTop: 5 },
  certDate: { color: '#444', fontSize: 10, marginTop: 20 },
  shareBtn: { width: '100%', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 30 },
  shareBtnText: { color: '#000', fontWeight: '900', fontSize: 12 },

  coachContainer: { backgroundColor: '#1E1E1E', marginHorizontal: 20, marginTop: 20, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#FFD700' },
  coachHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
  coachTitle: { color: '#FFD700', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  archetypeBox: { marginBottom: 20 },
  archetypeLabel: { color: '#666', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  archetypeTitle: { color: '#fff', fontSize: 24, fontWeight: '900', fontStyle: 'italic', marginTop: 4 },
  archetypeDesc: { color: '#ccc', fontSize: 12, marginTop: 4, lineHeight: 16 },
  weaknessRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#333' },
  weaknessLabel: { color: '#FF453A', fontSize: 10, fontWeight: 'bold' },
  weaknessValue: { color: '#fff', fontSize: 16, fontWeight: '900', marginTop: 2 },
  focusBadge: { backgroundColor: '#333', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  focusText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  adviceList: { marginBottom: 20 },
  adviceRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  adviceText: { color: '#ccc', fontSize: 12, flex: 1, lineHeight: 18 },
  recHeader: { color: '#666', fontSize: 10, fontWeight: '900', marginBottom: 10 },
  recCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#252525', padding: 15, borderRadius: 12, marginBottom: 8 },
  recTitle: { color: '#fff', fontSize: 14, fontWeight: '900' },
  recSub: { color: '#888', fontSize: 10, marginTop: 2, fontWeight: 'bold' },
});