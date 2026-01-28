import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { useEffect, useState } from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';

// --- DATA ---
const WEIGHTS_DB: any = {
  MEN_OPEN: { sledPush: '152kg', sledPull: '103kg', lunge: '20kg', wallBall: '6kg' },
  MEN_PRO: { sledPush: '202kg', sledPull: '153kg', lunge: '30kg', wallBall: '9kg' },
  WOMEN_OPEN: { sledPush: '102kg', sledPull: '78kg', lunge: '10kg', wallBall: '4kg' },
  WOMEN_PRO: { sledPush: '152kg', sledPull: '103kg', lunge: '20kg', wallBall: '6kg' },
};

const BASE_STATIONS = [
  { name: '1km RUN', type: 'run', weight: 1.0, key: 'run' },
  { name: 'SKI ERG', type: 'station', weight: 1.0, key: 'ski', details: '1000m' },
  { name: '1km RUN', type: 'run', weight: 1.05, key: 'run' },
  { name: 'SLED PUSH', type: 'station', weight: 1.5, key: 'sledPush' },
  { name: '1km RUN', type: 'run', weight: 1.05, key: 'run' },
  { name: 'SLED PULL', type: 'station', weight: 1.4, key: 'sledPull' },
  { name: '1km RUN', type: 'run', weight: 1.1, key: 'run' },
  { name: 'BURPEES', type: 'station', weight: 1.3, key: 'burpee', details: '80m Broad Jump' },
  { name: '1km RUN', type: 'run', weight: 1.1, key: 'run' },
  { name: 'ROWING', type: 'station', weight: 1.1, key: 'row', details: '1000m' },
  { name: '1km RUN', type: 'run', weight: 1.15, key: 'run' },
  { name: 'FARMERS', type: 'station', weight: 0.9, key: 'farmers', details: '200m Carry' },
  { name: '1km RUN', type: 'run', weight: 1.15, key: 'run' },
  { name: 'LUNGES', type: 'station', weight: 1.6, key: 'lunge' },
  { name: '1km RUN', type: 'run', weight: 1.2, key: 'run' },
  { name: 'WALL BALLS', type: 'station', weight: 1.2, key: 'wallBall' },
  { name: 'FINISH', type: 'finish', weight: 0, key: 'finish' },
];

export default function Race() {
  const router = useRouter();
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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.smallBtn}>
            <Text style={styles.btnText}>EXIT RACE</Text>
        </TouchableOpacity>
        <Text style={styles.totalTime}>{formatTime(totalTime)}</Text>
        <TouchableOpacity onPress={() => setIsMuted(!isMuted)} style={styles.smallBtn}>
            <Text style={[styles.btnText, { color: isMuted ? '#666' : '#FFD700' }]}>{isMuted ? 'UNMUTE' : 'MUTE'}</Text>
        </TouchableOpacity>
      </View>

      {/* CENTER DISPLAY */}
      <View style={styles.topSection}>
        <Text style={styles.label}>CURRENT TASK</Text>
        <Text style={[styles.stationName, { color: currentStation.type === 'run' ? '#fff' : '#4dabf7' }]}>
            {currentStation.name}
        </Text>
        
        {currentStation.details && (
          <View style={styles.detailBadge}><Text style={styles.detailText}>{currentStation.details}</Text></View>
        )}
        
        <View style={styles.pacerBox}>
            <Text style={[styles.timer, { color: isBehindPace ? '#FFD700' : '#fff' }]}>{formatTime(seconds)}</Text>
            <Text style={styles.targetLabel}>TARGET: {formatTime(targetSeconds)}</Text>
            {isBehindPace && <Text style={styles.behindLabel}>BEHIND PACE</Text>}
        </View>
      </View>

      {/* CONTROLS */}
      <View style={styles.controls}>
          {isActive && index > 0 && (
             <TouchableOpacity style={styles.undoBtn} onPress={handleUndo}><Text style={styles.undoText}>← UNDO</Text></TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[styles.mainBtn, { 
                backgroundColor: isActive ? (isBehindPace ? '#FFD700' : '#333') : '#28a745', 
                flex: isActive ? 1 : 0, 
                width: isActive ? 'auto' : '100%' 
            }]} 
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={[styles.buttonText, { color: isActive && isBehindPace ? '#000' : '#fff' }]}>
                {isActive ? (currentStation.type === 'finish' ? 'FINISH RACE' : 'COMPLETE STATION') : 'START RACE'}
            </Text>
          </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'space-between' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, paddingTop: 60, alignItems: 'center' },
  smallBtn: { padding: 10 },
  btnText: { color: '#888', fontWeight: 'bold', fontSize: 12 },
  totalTime: { color: '#fff', fontWeight: 'bold', fontSize: 24, fontVariant: ['tabular-nums'] },
  
  topSection: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  label: { color: '#666', fontSize: 14, fontWeight: 'bold', letterSpacing: 2, marginBottom: 10 },
  stationName: { fontSize: 42, fontWeight: '900', textAlign: 'center', marginBottom: 10 },
  detailBadge: { backgroundColor: '#1E1E1E', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginBottom: 20 },
  detailText: { color: '#ccc', fontWeight: 'bold', fontSize: 16 },
  
  pacerBox: { alignItems: 'center', marginVertical: 10 },
  timer: { fontSize: 100, fontWeight: 'bold', fontVariant: ['tabular-nums'] },
  targetLabel: { color: '#888', fontSize: 16, fontWeight: 'bold', marginTop: -5 },
  behindLabel: { color: '#FFD700', fontWeight: 'bold', marginTop: 5 },
  
  controls: { flexDirection: 'row', height: 130 },
  undoBtn: { width: 90, backgroundColor: '#1E1E1E', justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderRightColor: '#333', paddingBottom: 30 },
  undoText: { color: '#888', fontWeight: 'bold', fontSize: 12 },
  mainBtn: { justifyContent: 'center', alignItems: 'center', paddingBottom: 30, flex: 1 },
  buttonText: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: 0.5 },
});