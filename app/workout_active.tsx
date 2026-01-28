import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function WorkoutActive() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { title, steps, rounds } = useLocalSearchParams();
  
  const parsedSteps = steps ? JSON.parse(steps as string) : [];
  const totalRounds = rounds ? parseInt((rounds as string).match(/\d+/)![0]) : 1;

  const [currentRound, setCurrentRound] = useState(1);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(true);
  
  const [roundSplits, setRoundSplits] = useState<number[]>([]);
  const [lastRoundTime, setLastRoundTime] = useState(0);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    let interval: any;
    if (isActive && !showSummary) {
      interval = setInterval(() => setSeconds(s => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, showSummary]);

  const handleNext = () => {
    Vibration.vibrate(100); 
    
    if (currentStepIdx < parsedSteps.length - 1) {
      setCurrentStepIdx(currentStepIdx + 1);
    } else {
      const currentSplit = seconds - lastRoundTime;
      const updatedSplits = [...roundSplits, currentSplit];
      setRoundSplits(updatedSplits);
      setLastRoundTime(seconds);

      if (currentRound < totalRounds) {
        setCurrentRound(currentRound + 1);
        setCurrentStepIdx(0);
        Vibration.vibrate([0, 100, 50, 100]); 
      } else {
        setIsActive(false);
        setShowSummary(true);
        Vibration.vibrate([0, 500, 100, 500]);
      }
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // --- HYROX CONSISTENCY LOGIC ---
  const getConsistencyRating = () => {
    if (roundSplits.length < 2) return { label: "DATA PENDING", color: "#444", msg: "Complete more rounds for analysis." };
    
    const max = Math.max(...roundSplits);
    const min = Math.min(...roundSplits);
    const variance = ((max - min) / min) * 100;

    if (variance < 5) return { label: "ELITE CONSISTENCY", color: "#FFD700", msg: "Perfect pacing. You are race-ready." };
    if (variance < 12) return { label: "STRONG ENGINE", color: "#fff", msg: "Minor fading. Focus on the final 400m." };
    return { label: "ENGINE FAILURE", color: "#FF3B30", msg: "Significant fade. Back off 5% on Round 1." };
  };

  const rating = getConsistencyRating();

  if (showSummary) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.summaryTitle}>SESSION DEBRIEF</Text>
        <Text style={styles.summaryTime}>{formatTime(seconds)}</Text>
        <Text style={styles.summaryLabel}>TOTAL CONTINUOUS TIME</Text>

        {/* AUTOMATIC RATING CARD */}
        <View style={[styles.ratingCard, { borderColor: rating.color }]}>
            <Text style={[styles.ratingLabel, { color: rating.color }]}>{rating.label}</Text>
            <Text style={styles.ratingMsg}>"{rating.msg}"</Text>
        </View>

        <View style={styles.statsContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {roundSplits.map((split, i) => (
              <View key={i} style={styles.splitRow}>
                <Text style={styles.splitRound}>ROUND {i + 1}</Text>
                <Text style={styles.splitTime}>{formatTime(split)}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        <TouchableOpacity style={styles.exitBtn} onPress={() => router.back()}>
          <Text style={styles.exitBtnText}>SAVE TO PERFORMANCE HUB</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.sessionTitle}>{title}</Text>
        <Text style={styles.roundTracker}>ROUND {currentRound} <Text style={{color: '#444'}}>/</Text> {totalRounds}</Text>
        <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${(currentRound / totalRounds) * 100}%` }]} /></View>
      </View>

      <View style={styles.timerContainer}>
          <Text style={styles.timerLabel}>ELAPSED PERFORMANCE</Text>
          <Text style={styles.timerValue}>{formatTime(seconds)}</Text>
      </View>

      <View style={styles.taskCard}>
          <Text style={styles.taskLabel}>CURRENT OBJECTIVE</Text>
          <Text style={styles.taskName}>{parsedSteps[currentStepIdx]}</Text>
          <View style={styles.nextUp}>
              <Text style={styles.nextLabel}>UP NEXT: </Text>
              <Text style={styles.nextTask}>{parsedSteps[currentStepIdx + 1] || "ROUND COMPLETE"}</Text>
          </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 40 }]}>
        <TouchableOpacity style={styles.mainBtn} onPress={handleNext}><Text style={styles.mainBtnText}>COMPLETE & NEXT</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} style={styles.abortBtn}><Text style={styles.exitText}>ABORT MISSION</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', paddingHorizontal: 30 },
  header: { alignItems: 'center', marginBottom: 30 },
  sessionTitle: { color: '#FFD700', fontSize: 10, fontWeight: '900', letterSpacing: 3 },
  roundTracker: { color: '#fff', fontSize: 28, fontWeight: '900', marginTop: 8 },
  progressBar: { width: '100%', height: 4, backgroundColor: '#222', borderRadius: 2, marginTop: 20 },
  progressFill: { height: '100%', backgroundColor: '#FFD700', borderRadius: 2 },
  
  timerContainer: { alignItems: 'center', marginBottom: 30 },
  timerLabel: { color: '#444', fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 5 },
  timerValue: { color: '#fff', fontSize: 80, fontWeight: '900', fontStyle: 'italic', letterSpacing: -2 },
  
  taskCard: { backgroundColor: '#111', padding: 40, borderRadius: 40, alignItems: 'center', borderWidth: 1, borderColor: '#222' },
  taskLabel: { color: '#FFD700', fontSize: 10, fontWeight: '900', marginBottom: 15 },
  taskName: { color: '#fff', fontSize: 30, fontWeight: '900', textAlign: 'center', textTransform: 'uppercase' },
  nextUp: { marginTop: 35, flexDirection: 'row', backgroundColor: '#1A1A1A', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12 },
  nextLabel: { color: '#555', fontSize: 11, fontWeight: 'bold' },
  nextTask: { color: '#aaa', fontSize: 11, fontWeight: 'bold' },

  footer: { position: 'absolute', bottom: 0, left: 30, right: 30, alignItems: 'center' },
  mainBtn: { backgroundColor: '#FFD700', width: '100%', padding: 25, borderRadius: 25, alignItems: 'center', marginBottom: 20 },
  mainBtnText: { color: '#000', fontSize: 20, fontWeight: '900' },
  abortBtn: { padding: 10 },
  exitText: { color: '#444', fontSize: 11, fontWeight: '900' },

  summaryTitle: { color: '#FFD700', fontSize: 12, fontWeight: '900', textAlign: 'center', letterSpacing: 2 },
  summaryTime: { color: '#fff', fontSize: 50, fontWeight: '900', textAlign: 'center', marginTop: 10 },
  summaryLabel: { color: '#444', fontSize: 10, fontWeight: '900', textAlign: 'center', marginBottom: 20 },

  ratingCard: { backgroundColor: '#111', padding: 25, borderRadius: 25, borderWidth: 1, marginBottom: 25, alignItems: 'center' },
  ratingLabel: { fontSize: 14, fontWeight: '900', marginBottom: 8, letterSpacing: 1 },
  ratingMsg: { color: '#888', fontSize: 12, textAlign: 'center', fontStyle: 'italic', lineHeight: 18 },

  statsContainer: { height: 180, backgroundColor: '#111', borderRadius: 25, padding: 20, marginBottom: 20 },
  splitRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#222' },
  splitRound: { color: '#888', fontWeight: 'bold', fontSize: 12 },
  splitTime: { color: '#fff', fontWeight: '900', fontSize: 14 },

  exitBtn: { backgroundColor: '#fff', width: '100%', padding: 20, borderRadius: 20, alignItems: 'center', marginBottom: 40 },
  exitBtnText: { color: '#000', fontWeight: '900', fontSize: 16 }
});