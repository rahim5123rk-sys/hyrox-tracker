import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { useEffect, useRef, useState } from 'react';
import { Alert, StatusBar, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HYROX_STANDARDS, HyroxDivision } from '../constants/HyroxStandards';
import { DataStore, METRICS, MetricKey } from '../services/DataStore';

const RECOVERY_KEY = 'hyrox_race_recovery_state';

// [ARCHITECT] MAP STATIONS TO DB METRICS
const METRIC_MAP: Record<string, MetricKey> = {
    'ski': METRICS.SKI_ERG,
    'sledPush': METRICS.SLED_PUSH,
    'sledPull': METRICS.SLED_PULL,
    'burpee': METRICS.BURPEES,
    'row': METRICS.ROWING,
    'farmers': METRICS.FARMERS,
    'lunge': METRICS.LUNGES,
    'wallBall': METRICS.WALL_BALLS
};

const BASE_STATIONS = [
  { name: '1km RUN', type: 'run', weight: 1.0, key: 'run', icon: 'walk-outline' },
  { name: 'SKI ERG', type: 'station', weight: 0.95, key: 'ski', details: '1000m', icon: 'snow-outline' },
  { name: '1km RUN', type: 'run', weight: 1.02, key: 'run', icon: 'walk-outline' },
  { name: 'SLED PUSH', type: 'station', weight: 0.7, key: 'sledPush', icon: 'push-outline' },
  { name: '1km RUN', type: 'run', weight: 1.05, key: 'run', icon: 'walk-outline' },
  { name: 'SLED PULL', type: 'station', weight: 0.9, key: 'sledPull', icon: 'arrow-down-outline' },
  { name: '1km RUN', type: 'run', weight: 1.08, key: 'run', icon: 'walk-outline' },
  { name: 'BURPEES', type: 'station', weight: 1.2, key: 'burpee', details: '80m Broad Jump', icon: 'fitness-outline' },
  { name: '1km RUN', type: 'run', weight: 1.1, key: 'run', icon: 'walk-outline' },
  { name: 'ROWING', type: 'station', weight: 1.0, key: 'row', details: '1000m', icon: 'boat-outline' },
  { name: '1km RUN', type: 'run', weight: 1.12, key: 'run', icon: 'walk-outline' },
  { name: 'FARMERS', type: 'station', weight: 0.5, key: 'farmers', details: '200m Carry', icon: 'barbell-outline' },
  { name: '1km RUN', type: 'run', weight: 1.15, key: 'run', icon: 'walk-outline' },
  { name: 'LUNGES', type: 'station', weight: 1.4, key: 'lunge', icon: 'footsteps-outline' },
  { name: '1km RUN', type: 'run', weight: 1.18, key: 'run', icon: 'walk-outline' },
  { name: 'WALL BALLS', type: 'station', weight: 0.9, key: 'wallBall', icon: 'basketball-outline' },
  { name: 'FINISH', type: 'finish', weight: 0, key: 'finish', icon: 'flag-outline' },
];

export default function Race() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  
  const [goalMinutes, setGoalMinutes] = useState(parseFloat(params.goalMinutes as string) || 90);
  const [bias, setBias] = useState((params.bias as string) || 'BALANCED');
  const [smartPace, setSmartPace] = useState(params.smartPace ? parseFloat(params.smartPace as string) : null);
  const [category, setCategory] = useState(params.category as string || 'MEN_OPEN');

  const [stations, setStations] = useState(BASE_STATIONS); 
  const [index, setIndex] = useState(0);
  const [isTransition, setIsTransition] = useState(false);

  const [seconds, setSeconds] = useState(0);      
  const [totalTime, setTotalTime] = useState(0);  
  const [isActive, setIsActive] = useState(false);
  
  const stationStartRef = useRef<number | null>(null);
  const raceStartRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [displayCategory, setDisplayCategory] = useState('');

  useEffect(() => {
    checkRecovery();
  }, []);

  const checkRecovery = async () => {
      try {
          const savedState = await AsyncStorage.getItem(RECOVERY_KEY);
          if (savedState) {
              const state = JSON.parse(savedState);
              const now = Date.now();
              const diff = now - state.savedAt;

              if (diff < 3 * 60 * 60 * 1000) {
                  Alert.alert(
                      "CRASH RECOVERED",
                      "We found an active race that was interrupted. Resuming from where you left off.",
                      [
                          { text: "Discard", style: "destructive", onPress: () => clearRecovery() },
                          { text: "Resume", onPress: () => resumeState(state) }
                      ]
                  );
                  return; 
              } else {
                  clearRecovery(); 
              }
          }
          loadConfig(category);
      } catch (e) { loadConfig(category); }
  };

  const resumeState = (state: any) => {
      setCategory(state.category);
      setGoalMinutes(state.goalMinutes);
      setBias(state.bias);
      setSmartPace(state.smartPace);
      setHistory(state.history);
      setIndex(state.index);
      setIsTransition(state.isTransition || false);
      
      raceStartRef.current = state.raceStartRef;
      stationStartRef.current = state.stationStartRef;
      
      setIsActive(true);
      loadConfig(state.category);
  };

  const clearRecovery = async () => {
      await AsyncStorage.removeItem(RECOVERY_KEY);
  };

  const saveRecoveryState = async (newHistory: any[], newIndex: number, transitionState: boolean) => {
      if (!isActive && newIndex === 0) return;
      
      const state = {
          savedAt: Date.now(),
          category, goalMinutes, bias, smartPace,
          history: newHistory,
          index: newIndex,
          isTransition: transitionState,
          raceStartRef: raceStartRef.current,
          stationStartRef: stationStartRef.current || Date.now()
      };
      await AsyncStorage.setItem(RECOVERY_KEY, JSON.stringify(state));
  };

  const loadConfig = async (cat: string) => {
      let selectedCat = cat;
      if (!selectedCat) selectedCat = await AsyncStorage.getItem('userCategory') || 'MEN_OPEN';
      
      setDisplayCategory(selectedCat.replace('_', ' '));
      const weights = HYROX_STANDARDS[selectedCat as HyroxDivision] || HYROX_STANDARDS.MEN_OPEN;

      // FETCH BIOMETRIC DATA
      let analytics = { trends: {} as any };
      try {
          analytics = await DataStore.getAnalytics();
      } catch (e) { console.log('No analytics available'); }

      // 1. CALCULATE FATIGUE MODIFIER
      const fatigueIndex = (analytics.trends[METRICS.FATIGUE]?.[0] || 0);
      const fatigueMod = Math.max(0, fatigueIndex / 100); 

      // 2. MORPH WEIGHTS BASED ON HISTORY
      let updated = BASE_STATIONS.map((s, i) => {
        let newWeight = s.weight;

        // Run Fatigue Logic
        if (s.type === 'run') {
            // Base progression (1.0 -> 1.18) + Fatigue Penalty
            const runNumber = Math.floor(i / 2); // 0 to 7
            newWeight += (runNumber * fatigueMod * 0.05); 
        }

        // Apply Standards text
        let details = s.details;
        if (s.key === 'sledPush') details = `${weights.SLED_PUSH}kg (4 x 12.5m)`;
        else if (s.key === 'sledPull') details = `${weights.SLED_PULL}kg (4 x 12.5m)`;
        else if (s.key === 'lunge') details = `${weights.LUNGE}kg Sandbag (100m)`;
        else if (s.key === 'wallBall') details = `${weights.WALL_BALL}kg (100 Reps)`;
        else if (s.key === 'farmers') details = `2 x ${weights.KETTLEBELL}kg KBs (200m)`;

        return { ...s, weight: newWeight, details };
      });

      // 3. APPLY BIAS (Legacy Override - Only if NOT Smart Pace)
      if (!smartPace) {
          if (bias === 'RUNNER') updated = updated.map(s => s.type === 'run' ? { ...s, weight: s.weight * 0.85 } : { ...s, weight: s.weight * 1.15 });
          else if (bias === 'LIFTER') updated = updated.map(s => s.type === 'station' ? { ...s, weight: s.weight * 0.85 } : { ...s, weight: s.weight * 1.15 });
      }
      setStations(updated);
  };

  const currentStation = stations[index] || stations[stations.length - 1];
  const nextStation = stations[index + 1]; 
  
  const getTargetSeconds = () => {
      if (!currentStation) return 0;
      
      // 1. SMART PACER MODE (Uses Bio-Morphing)
      if (smartPace && currentStation.type === 'run') {
          return Math.floor(smartPace * currentStation.weight);
      }
      
      // 2. MANUAL CALCULATOR FIX (Dynamic Roxzone Buffer - The 6% Rule)
      // We assume transition time scales with fitness level.
      // Elite (60m) -> 3.6m buffer. Beginner (120m) -> 7.2m buffer.
      const roxBufferMinutes = goalMinutes * 0.06; 
      const effectiveGoalMinutes = Math.max(0, goalMinutes - roxBufferMinutes);

      // Distribute the EFFECTIVE time (Pure Work)
      const totalWeight = stations.reduce((acc, item) => acc + item.weight, 0);
      const secondsPerUnit = (effectiveGoalMinutes * 60) / totalWeight;
      
      return Math.floor(secondsPerUnit * currentStation.weight);
  };

  const targetSeconds = getTargetSeconds();

  useEffect(() => {
    if (isActive) {
      if (!stationStartRef.current) stationStartRef.current = Date.now();
      if (!raceStartRef.current) raceStartRef.current = Date.now();

      if (index === 0 && seconds === 0) saveRecoveryState(history, index, isTransition);

      intervalRef.current = setInterval(() => {
        const now = Date.now();
        setSeconds(Math.floor((now - (stationStartRef.current || now)) / 1000));
        setTotalTime(Math.floor((now - (raceStartRef.current || now)) / 1000));
      }, 500);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isActive]);

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const speakText = (text: string) => {
    if (isMuted) return;
    Speech.stop();
    Speech.speak(text, { language: 'en', pitch: 1.0, rate: 0.9 });
  };

  const handleNext = async() => {
    Vibration.vibrate(50); 
    
    if (!isActive) {
      stationStartRef.current = Date.now();
      raceStartRef.current = Date.now();
      setIsActive(true);
      speakText("Race Started. Stick to the plan.");
      saveRecoveryState([], 0, false); 
      return;
    } 

    if (isTransition) {
        const roxTime = seconds;
        const newHistory = [...history, { name: 'ROXZONE', actual: roxTime, target: 0 }]; 
        setHistory(newHistory);
        
        setIndex(prev => prev + 1);
        setIsTransition(false);
        setSeconds(0);
        stationStartRef.current = Date.now();
        
        speakText(`Starting ${stations[index+1]?.name || 'Next Station'}`);
        saveRecoveryState(newHistory, index + 1, false);
        return;
    }

    const actualTime = seconds;
    const newHistory = [...history, { name: currentStation.name, actual: actualTime, target: targetSeconds }];
    setHistory(newHistory);

    if (currentStation.type === 'finish') {
        setIsActive(false);
        speakText("Race Finished. Well done.");
        
        const raceResult = { 
          date: new Date().toISOString(), 
          totalTime: formatTime(totalTime),
          totalSeconds: totalTime, 
          splits: newHistory, 
          type: 'SIMULATION', 
          title: `HYROX SIM (${displayCategory})`,
          name: `HYROX SIM (${displayCategory})`
        };
        await DataStore.logEvent(raceResult);
        await clearRecovery();

        router.replace({ pathname: "/results", params: { data: JSON.stringify(newHistory), totalTime: formatTime(totalTime) } });
        return;
    }

    const diff = targetSeconds - actualTime; 
    if (diff > 15) speakText(`Banked ${diff} seconds.`);
    else if (diff < -15) speakText(`Behind by ${Math.abs(diff)} seconds.`);
    
    const nextIsFinish = stations[index + 1]?.type === 'finish';
    
    if (nextIsFinish) {
        setIndex(prev => prev + 1);
        setSeconds(0);
        stationStartRef.current = Date.now();
        saveRecoveryState(newHistory, index + 1, false);
    } else {
        setIsTransition(true);
        setSeconds(0);
        stationStartRef.current = Date.now();
        speakText("Transition.");
        saveRecoveryState(newHistory, index, true);
    }
  };

  const handleUndo = () => {
    if (index === 0 && !isTransition) return; 
    Vibration.vibrate(50);
    
    if (isTransition) {
        setIsTransition(false);
        stationStartRef.current = Date.now(); 
        setSeconds(0);
        const revertedHistory = history.slice(0, -1);
        setHistory(revertedHistory);
        saveRecoveryState(revertedHistory, index, false);
    } else {
        if (index > 0) {
            setIndex(prev => prev - 1);
            setIsTransition(true);
            stationStartRef.current = Date.now();
            setSeconds(0);
            const revertedHistory = history.slice(0, -1);
            setHistory(revertedHistory);
            saveRecoveryState(revertedHistory, index - 1, true);
        }
    }
  };

  const getPacerStatus = () => {
      if (!isActive && index === 0) return { text: 'READY TO RACE', color: '#FFD700', bg: 'rgba(255, 215, 0, 0.15)' };
      if (isTransition) return { text: 'ROXZONE', color: '#888', bg: '#222' }; 

      const totalTargetSoFar = history.reduce((acc, item) => acc + (item.name === 'ROXZONE' ? 0 : item.target), 0);
      const totalActualSoFar = history.reduce((acc, item) => acc + item.actual, 0);
      const bankedHistory = totalTargetSoFar - (totalActualSoFar); 
      const currentCushion = targetSeconds - seconds;
      const liveLead = bankedHistory + currentCushion;
      const absLead = Math.abs(liveLead);
      const timeStr = formatTime(absLead);

      if (liveLead >= 0) return { text: `TIME CUSHION (${timeStr})`, color: '#32D74B', bg: 'rgba(50, 215, 75, 0.15)' };
      else return { text: `BEHIND PACE (+${timeStr})`, color: '#FF453A', bg: 'rgba(255, 69, 58, 0.15)' };
  };

  const pacer = getPacerStatus();

  const getBackgroundColor = () => {
      if (isTransition) return '#1A1A1A'; 
      if (currentStation.type === 'run') return '#000'; 
      return '#111'; 
  };

  return (
    <View style={[styles.container, { backgroundColor: getBackgroundColor() }]}>
      <StatusBar barStyle="light-content" />
      
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => {
            if (isActive) {
                Alert.alert("ABORT MISSION?", "This will discard your current race data.", [
                    { text: "Cancel", style: "cancel" },
                    { text: "Abort", style: "destructive", onPress: () => { clearRecovery(); router.back(); } }
                ]);
            } else {
                router.back();
            }
        }} style={styles.iconBtn}>
           <Ionicons name="close-circle-outline" size={28} color="#666" />
        </TouchableOpacity>
        
        <View style={styles.miniTimer}>
            <Text style={styles.miniLabel}>{displayCategory}</Text>
            <Text style={styles.miniValue}>{formatTime(totalTime)}</Text>
        </View>

        <TouchableOpacity onPress={() => setIsMuted(!isMuted)} style={styles.iconBtn}>
            <Ionicons name={isMuted ? "volume-mute-outline" : "volume-high-outline"} size={24} color={isMuted ? "#666" : "#FFD700"} />
        </TouchableOpacity>
      </View>

      <View style={styles.progressTrack}>
        {stations.map((_, i) => (
            <View key={i} style={[
                styles.progressSegment, 
                { backgroundColor: i < index ? '#FFD700' : (i === index ? '#fff' : '#333') }
            ]} />
        ))}
      </View>

      <View style={styles.mainContent}>
        {isTransition ? (
            <>
                <Text style={styles.stationLabel}>TRANSITION</Text>
                <Text style={[styles.stationTitle, { color: '#888' }]}>ROXZONE</Text>
                <View style={styles.detailPill}>
                    <Text style={styles.detailText}>NEXT: {nextStation?.name}</Text>
                </View>
            </>
        ) : (
            <>
                <Text style={styles.stationLabel}>STATION {index + 1}/17</Text>
                <Text style={[styles.stationTitle, { color: currentStation.type === 'run' ? '#fff' : '#4dabf7' }]}>
                    {currentStation.name}
                </Text>
                {currentStation.details && (
                  <View style={styles.detailPill}>
                     <Text style={styles.detailText}>{currentStation.details}</Text>
                  </View>
                )}
            </>
        )}

        <Text style={[styles.mainTimer, { color: isTransition ? '#888' : '#fff' }]}>{formatTime(seconds)}</Text>

        {!isTransition && (
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20}}>
                 <Text style={{color: '#666', fontWeight: 'bold', fontSize: 16}}>TARGET:</Text>
                 <Text style={{color: '#FFD700', fontWeight: '900', fontSize: 24, fontVariant: ['tabular-nums']}}>{formatTime(targetSeconds)}</Text>
            </View>
        )}

        <View style={[styles.pacerBadge, { backgroundColor: pacer.bg }]}>
            <Text style={[styles.pacerText, { color: pacer.color }]}>{pacer.text}</Text>
        </View>
        
        {smartPace && !isTransition && <Text style={styles.smartModeText}>SMART PACER ACTIVE</Text>}
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
          {isActive && (
             <TouchableOpacity style={styles.undoBtn} onPress={handleUndo}>
                <Ionicons name="arrow-undo" size={20} color="#666" />
                <Text style={styles.undoText}>UNDO</Text>
             </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[styles.actionBtn, { 
                backgroundColor: isActive ? (isTransition ? '#fff' : '#FFD700') : '#FFD700',
                flex: 1 
            }]} 
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={[styles.actionBtnText, { color: '#000' }]}>
                {!isActive ? 'START RACE' : (
                    isTransition ? `START ${nextStation?.key?.toUpperCase() || 'NEXT'}` : 
                    (currentStation.type === 'finish' ? 'FINISH RACE' : 'FINISH STATION')
                )}
            </Text>
          </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 15 },
  iconBtn: { padding: 10 },
  miniTimer: { alignItems: 'center' },
  miniLabel: { color: '#666', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  miniValue: { color: '#fff', fontSize: 18, fontWeight: 'bold', fontVariant: ['tabular-nums'] },
  progressTrack: { flexDirection: 'row', height: 4, marginHorizontal: 20, gap: 4, marginBottom: 40 },
  progressSegment: { flex: 1, borderRadius: 2 },
  mainContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, marginTop: -60 },
  stationLabel: { color: '#666', fontSize: 12, fontWeight: '900', letterSpacing: 2, marginBottom: 10 },
  stationTitle: { fontSize: 46, fontWeight: '900', textAlign: 'center', lineHeight: 50, marginBottom: 15 },
  detailPill: { backgroundColor: '#222', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, marginBottom: 30, borderWidth: 1, borderColor: '#333' },
  detailText: { color: '#ccc', fontWeight: 'bold', fontSize: 16 },
  mainTimer: { fontSize: 110, fontWeight: 'bold', fontFamily: 'Courier', letterSpacing: -5, marginBottom: 5 },
  pacerBadge: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12, marginBottom: 10 },
  pacerText: { fontWeight: 'bold', fontSize: 14, letterSpacing: 0.5 },
  smartModeText: { color: '#666', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  footer: { flexDirection: 'row', paddingHorizontal: 25, gap: 15, alignItems: 'flex-end' },
  undoBtn: { backgroundColor: '#1A1A1A', width: 80, height: 80, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  undoText: { color: '#666', fontSize: 10, fontWeight: 'bold', marginTop: 4 },
  actionBtn: { height: 80, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  actionBtnText: { fontSize: 18, fontWeight: '900', letterSpacing: 1 },
});