import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { useEffect, useState } from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';

// ADVANCED DATA
const STATIONS_DATA = [
  { name: '1km RUN', type: 'run', weight: 1.0 },
  { name: 'SKI ERG', type: 'station', weight: 1.0 },
  { name: '1km RUN', type: 'run', weight: 1.05 },
  { name: 'SLED PUSH', type: 'station', weight: 1.5 },
  { name: '1km RUN', type: 'run', weight: 1.05 },
  { name: 'SLED PULL', type: 'station', weight: 1.4 },
  { name: '1km RUN', type: 'run', weight: 1.1 },
  { name: 'BURPEES', type: 'station', weight: 1.3 },
  { name: '1km RUN', type: 'run', weight: 1.1 },
  { name: 'ROWING', type: 'station', weight: 1.1 },
  { name: '1km RUN', type: 'run', weight: 1.15 },
  { name: 'FARMERS', type: 'station', weight: 0.9 },
  { name: '1km RUN', type: 'run', weight: 1.15 },
  { name: 'LUNGES', type: 'station', weight: 1.6 },
  { name: '1km RUN', type: 'run', weight: 1.2 },
  { name: 'WALL BALLS', type: 'station', weight: 1.2 },
  { name: 'FINISH', type: 'finish', weight: 0 },
];

export default function Race() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const totalGoalMinutes = parseFloat(params.goalMinutes as string) || 60;
  
  const [index, setIndex] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  // NEW: Store history of every split
  const [history, setHistory] = useState<any[]>([]);
  
  const currentStation = STATIONS_DATA[index];

  // MATH
  const totalWeight = STATIONS_DATA.reduce((acc, item) => acc + item.weight, 0);
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

  const handlePress = () => {
    Vibration.vibrate(50); 
    
    if (!isActive) {
      setIsActive(true);
      speakText("Race Started. Go!");
    } else {
      // 1. SAVE THE LAP DATA
      const newHistory = [...history, {
        name: currentStation.name,
        actual: seconds,
        target: targetSeconds
      }];
      setHistory(newHistory);

      // 2. CHECK IF FINISHED
      if (currentStation.type === 'finish') {
        setIsActive(false);
        speakText("Race Finished.");
        
        // NAVIGATE TO RESULTS SCREEN
        router.replace({
            pathname: "/results",
            params: { 
                data: JSON.stringify(newHistory), // Pass data as string
                totalTime: formatTime(totalTime)
            }
        });
        return;
      }

      // 3. IF NOT FINISHED, NEXT STATION
      const diff = targetSeconds - seconds; 
      if (diff > 0) speakText(`Next Station. You are ahead.`);
      else speakText(`Next Station. Push harder.`);

      setIndex(prev => prev + 1);
      setSeconds(0); 
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.smallBtn}>
          <Text style={styles.btnText}>QUIT</Text>
        </TouchableOpacity>
        <Text style={styles.totalTime}>TOTAL: {formatTime(totalTime)}</Text>
        <TouchableOpacity onPress={() => setIsMuted(!isMuted)} style={styles.smallBtn}>
          <Text style={[styles.btnText, { color: isMuted ? '#666' : '#D9232D' }]}>
            {isMuted ? 'UNMUTE' : 'MUTE'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.topSection}>
        <Text style={styles.label}>CURRENT STATION</Text>
        <Text style={[styles.stationName, { color: currentStation.type === 'run' ? '#fff' : '#4dabf7' }]}>
          {currentStation.name}
        </Text>
        
        <View style={styles.pacerBox}>
            <Text style={[styles.timer, { color: isBehindPace ? '#D9232D' : '#fff' }]}>
                {formatTime(seconds)}
            </Text>
            <Text style={styles.targetLabel}>
                TARGET: {formatTime(targetSeconds)} 
                {isBehindPace ? ' (BEHIND)' : ''}
            </Text>
        </View>
        
        {index < STATIONS_DATA.length - 1 && (
           <Text style={styles.nextLabel}>NEXT: {STATIONS_DATA[index + 1].name}</Text>
        )}
      </View>

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: isActive ? (isBehindPace ? '#D9232D' : '#333') : '#2ecc71' }]} 
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>
          {isActive ? (currentStation.type === 'finish' ? 'FINISH' : 'LAP') : 'START'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'space-between' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, paddingTop: 60, alignItems: 'center' },
  smallBtn: { padding: 10 },
  btnText: { color: '#888', fontWeight: 'bold', fontSize: 12 },
  totalTime: { color: '#fff', fontWeight: 'bold', fontSize: 16, fontVariant: ['tabular-nums'] },
  topSection: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  label: { color: '#666', fontSize: 16, fontWeight: 'bold', letterSpacing: 2, marginBottom: 10 },
  stationName: { fontSize: 42, fontWeight: '900', textAlign: 'center', marginBottom: 20 },
  pacerBox: { alignItems: 'center', marginVertical: 20 },
  timer: { fontSize: 90, fontWeight: 'bold', fontVariant: ['tabular-nums'] },
  targetLabel: { color: '#888', fontSize: 18, fontWeight: 'bold', marginTop: -5 },
  nextLabel: { color: '#444', marginTop: 40, fontSize: 14, fontWeight: 'bold' },
  button: { width: '100%', height: 140, justifyContent: 'center', alignItems: 'center', paddingBottom: 30 },
  buttonText: { color: '#fff', fontSize: 32, fontWeight: '900', letterSpacing: 1 },
});