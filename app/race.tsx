import { Ionicons } from '@expo/vector-icons'; // Make sure you have @expo/vector-icons installed
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { useEffect, useState } from 'react';
import { Dimensions, StatusBar, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// --- DATA ---
const WEIGHTS_DB: any = {
  MEN_OPEN: { sledPush: '152kg', sledPull: '103kg', lunge: '20kg', wallBall: '6kg' },
  MEN_PRO: { sledPush: '202kg', sledPull: '153kg', lunge: '30kg', wallBall: '9kg' },
  WOMEN_OPEN: { sledPush: '102kg', sledPull: '78kg', lunge: '10kg', wallBall: '4kg' },
  WOMEN_PRO: { sledPush: '152kg', sledPull: '103kg', lunge: '20kg', wallBall: '6kg' },
};

const BASE_STATIONS = [
  { name: '1km RUN', type: 'run', weight: 1.0, key: 'run', icon: 'walk-outline' },
  { name: 'SKI ERG', type: 'station', weight: 1.0, key: 'ski', details: '1000m', icon: 'snow-outline' },
  { name: '1km RUN', type: 'run', weight: 1.05, key: 'run', icon: 'walk-outline' },
  { name: 'SLED PUSH', type: 'station', weight: 1.5, key: 'sledPush', icon: 'push-outline' },
  { name: '1km RUN', type: 'run', weight: 1.05, key: 'run', icon: 'walk-outline' },
  { name: 'SLED PULL', type: 'station', weight: 1.4, key: 'sledPull', icon: 'arrow-down-outline' },
  { name: '1km RUN', type: 'run', weight: 1.1, key: 'run', icon: 'walk-outline' },
  { name: 'BURPEES', type: 'station', weight: 1.3, key: 'burpee', details: '80m Broad Jump', icon: 'fitness-outline' },
  { name: '1km RUN', type: 'run', weight: 1.1, key: 'run', icon: 'walk-outline' },
  { name: 'ROWING', type: 'station', weight: 1.1, key: 'row', details: '1000m', icon: 'boat-outline' },
  { name: '1km RUN', type: 'run', weight: 1.15, key: 'run', icon: 'walk-outline' },
  { name: 'FARMERS', type: 'station', weight: 0.9, key: 'farmers', details: '200m Carry', icon: 'barbell-outline' },
  { name: '1km RUN', type: 'run', weight: 1.15, key: 'run', icon: 'walk-outline' },
  { name: 'LUNGES', type: 'station', weight: 1.6, key: 'lunge', icon: 'footsteps-outline' },
  { name: '1km RUN', type: 'run', weight: 1.2, key: 'run', icon: 'walk-outline' },
  { name: 'WALL BALLS', type: 'station', weight: 1.2, key: 'wallBall', icon: 'basketball-outline' },
  { name: 'FINISH', type: 'finish', weight: 0, key: 'finish', icon: 'flag-outline' },
];

export default function Race() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const totalGoalMinutes = parseFloat(params.goalMinutes as string) || 60;
  const bias = (params.bias as string) || 'BALANCED';

  const [stations, setStations] = useState(BASE_STATIONS); 
  const [index, setIndex] = useState(0);
  const [seconds, setSeconds] = useState(0);      
  const [totalTime, setTotalTime] = useState(0);  
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const loadCategory = async () => {
      const category = await AsyncStorage.getItem('userCategory') || 'MEN_OPEN';
      const weights = WEIGHTS_DB[category];

      let updated = BASE_STATIONS.map(s => {
        if (s.key === 'sledPush') return { ...s, details: `${weights.sledPush} (4 x 12.5m)` };
        if (s.key === 'sledPull') return { ...s, details: `${weights.sledPull} (4 x 12.5m)` };
        if (s.key === 'lunge') return { ...s, details: `${weights.lunge} Sandbag (100m)` };
        if (s.key === 'wallBall') return { ...s, details: `${weights.wallBall} (100 Reps)` };
        return s;
      });

      if (bias === 'RUNNER') updated = updated.map(s => s.type === 'run' ? { ...s, weight: s.weight * 0.85 } : { ...s, weight: s.weight * 1.15 });
      else if (bias === 'LIFTER') updated = updated.map(s => s.type === 'station' ? { ...s, weight: s.weight * 0.85 } : { ...s, weight: s.weight * 1.15 });

      setStations(updated);
    };
    loadCategory();
  }, [bias]);

  const currentStation = stations[index];
  const totalWeight = stations.reduce((acc, item) => acc + item.weight, 0);
  const secondsPerUnit = (totalGoalMinutes * 60) / totalWeight;
  const targetSeconds = Math.floor(secondsPerUnit * currentStation.weight);
  const isBehindPace = seconds > targetSeconds;

  useEffect(() => {
    let interval: any = null;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
        setTotalTime(t => t + 1);
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
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

  const handleNext = () => {
    Vibration.vibrate(50); 
    
    if (!isActive) {
      setIsActive(true);
      speakText("Race Started. Good luck.");
    } else {
      const newHistory = [...history, { name: currentStation.name, actual: seconds, target: targetSeconds }];
      setHistory(newHistory);

      if (currentStation.type === 'finish') {
        setIsActive(false);
        speakText("Race Finished. Well done.");

        const raceDate = new Date().toLocaleDateString();
        const raceResult = { date: raceDate, totalTime: formatTime(totalTime), splits: newHistory };
        
        AsyncStorage.getItem('raceHistory').then(existing => {
            const oldHistory = existing ? JSON.parse(existing) : [];
            const updatedHistory = [raceResult, ...oldHistory];
            AsyncStorage.setItem('raceHistory', JSON.stringify(updatedHistory));
        });

        router.replace({ pathname: "/results", params: { data: JSON.stringify(newHistory), totalTime: formatTime(totalTime) } });
        return;
      }

      const diff = targetSeconds - seconds; 
      if (diff > 0) speakText(`Next Station. Ahead.`);
      else speakText(`Next Station. Push.`);

      setIndex(prev => prev + 1);
      setSeconds(0); 
    }
  };

  const handleUndo = () => {
    if (index === 0) return; 
    Vibration.vibrate(50);
    setIndex(prev => prev - 1);
    setSeconds(0); 
    setHistory(prev => prev.slice(0, -1));
  };

  return (
    <View style={[styles.container, { backgroundColor: currentStation.type === 'run' ? '#000' : '#111' }]}>
      <StatusBar barStyle="light-content" />
      
      {/* 1. COMPACT HEADER */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
           <Ionicons name="close-circle-outline" size={28} color="#666" />
        </TouchableOpacity>
        
        {/* Total Time Mini Display */}
        <View style={styles.miniTimer}>
            <Text style={styles.miniLabel}>TOTAL TIME</Text>
            <Text style={styles.miniValue}>{formatTime(totalTime)}</Text>
        </View>

        <TouchableOpacity onPress={() => setIsMuted(!isMuted)} style={styles.iconBtn}>
            <Ionicons name={isMuted ? "volume-mute-outline" : "volume-high-outline"} size={24} color={isMuted ? "#666" : "#FFD700"} />
        </TouchableOpacity>
      </View>

      {/* 2. PROGRESS BAR */}
      <View style={styles.progressTrack}>
        {stations.map((_, i) => (
            <View key={i} style={[
                styles.progressSegment, 
                { backgroundColor: i < index ? '#FFD700' : (i === index ? '#fff' : '#333') }
            ]} />
        ))}
      </View>

      {/* 3. MAIN STATION DISPLAY */}
      <View style={styles.mainContent}>
        <Text style={styles.stationLabel}>CURRENT STATION {index + 1}/17</Text>
        <Text style={[styles.stationTitle, { color: currentStation.type === 'run' ? '#fff' : '#4dabf7' }]}>
            {currentStation.name}
        </Text>
        
        {currentStation.details && (
          <View style={styles.detailPill}>
             <Text style={styles.detailText}>{currentStation.details}</Text>
          </View>
        )}

        {/* LARGE MONOSPACE TIMER */}
        <Text style={[styles.mainTimer, { color: isBehindPace ? '#FF453A' : '#fff' }]}>
            {formatTime(seconds)}
        </Text>

        {/* GHOST PACER BADGE */}
        <View style={[styles.pacerBadge, { backgroundColor: isBehindPace ? 'rgba(255, 69, 58, 0.15)' : 'rgba(50, 215, 75, 0.15)' }]}>
            <Text style={[styles.pacerText, { color: isBehindPace ? '#FF453A' : '#32D74B' }]}>
                {isBehindPace ? `BEHIND TARGET (+${formatTime(seconds - targetSeconds)})` : `AHEAD OF TARGET (-${formatTime(targetSeconds - seconds)})`}
            </Text>
        </View>
      </View>

      {/* 4. CONTROLS FOOTER */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
          {isActive && index > 0 && (
             <TouchableOpacity style={styles.undoBtn} onPress={handleUndo}>
                <Ionicons name="arrow-undo" size={20} color="#666" />
                <Text style={styles.undoText}>UNDO</Text>
             </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[styles.actionBtn, { 
                backgroundColor: isActive ? (currentStation.type === 'finish' ? '#FFD700' : (isBehindPace ? '#FF453A' : '#32D74B')) : '#FFD700',
                flex: 1 
            }]} 
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={[styles.actionBtnText, { color: '#000' }]}>
                {isActive ? (currentStation.type === 'finish' ? 'FINISH RACE' : 'NEXT STATION') : 'START RACE'}
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

  mainTimer: { fontSize: 110, fontWeight: 'bold', fontFamily: 'Courier', letterSpacing: -5, marginBottom: 20 },
  
  pacerBadge: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12 },
  pacerText: { fontWeight: 'bold', fontSize: 14, letterSpacing: 0.5 },

  footer: { flexDirection: 'row', paddingHorizontal: 25, gap: 15, alignItems: 'flex-end' },
  undoBtn: { backgroundColor: '#1A1A1A', width: 80, height: 80, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  undoText: { color: '#666', fontSize: 10, fontWeight: 'bold', marginTop: 4 },
  
  actionBtn: { height: 80, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  actionBtnText: { fontSize: 22, fontWeight: '900', letterSpacing: 1 },
});