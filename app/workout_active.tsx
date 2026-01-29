import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function WorkoutActive() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  
  // --- INITIAL SETUP ---
  const [sessionTitle, setSessionTitle] = useState("");

  // CRITICAL FIX: Robust parsing for steps and rounds to prevent "no datamap" crash
  const initialSteps = params.steps 
    ? (typeof params.steps === 'string' ? JSON.parse(params.steps) : ["Warmup", "Work", "Rest"]) 
    : ["Warmup", "Work", "Rest"];

  // CRITICAL FIX: Convert rounds to string safely before matching, handling both numbers and strings
  const totalRounds = params.rounds 
    ? parseInt(String(params.rounds).match(/\d+/)?.[0] || "1") 
    : 1;

  // --- STATE ---
  const [activeSteps, setActiveSteps] = useState<string[]>(Array.isArray(initialSteps) ? initialSteps : ["Work", "Rest"]);
  const [currentRound, setCurrentRound] = useState(1);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  
  // LOGGING STATE
  const [roundSplits, setRoundSplits] = useState<number[]>([]);
  const [lastRoundTime, setLastRoundTime] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  
  // TIMERS
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [stepSeconds, setStepSeconds] = useState(0); 
  const [isActive, setIsActive] = useState(true);

  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? 'MORNING' : hour < 18 ? 'AFTERNOON' : 'EVENING';
    setSessionTitle(`${timeOfDay} PROTOCOL`);

    let interval: any;
    if (isActive && !showSummary) {
      interval = setInterval(() => {
        setTotalSeconds(t => t + 1);
        setStepSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, showSummary]);

  const handleNext = () => {
    Vibration.vibrate(50); 
    
    if (currentStepIdx < activeSteps.length - 1) {
      setCurrentStepIdx(prev => prev + 1);
      setStepSeconds(0); 
      scrollViewRef.current?.scrollTo({ y: (currentStepIdx + 1) * 80, animated: true });
    } else {
      // --- ROUND COMPLETE ---
      const currentSplit = totalSeconds - lastRoundTime;
      const updatedSplits = [...roundSplits, currentSplit];
      setRoundSplits(updatedSplits);
      setLastRoundTime(totalSeconds);

      if (currentRound < totalRounds) {
        setCurrentRound(prev => prev + 1);
        setCurrentStepIdx(0);
        setStepSeconds(0);
        setActiveSteps(initialSteps); 
        Vibration.vibrate([0, 100, 50, 100]); 
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      } else {
        finishWorkout(updatedSplits);
      }
    }
  };

  const handleAddSet = () => {
    const newSteps = [...activeSteps];
    newSteps.splice(currentStepIdx + 1, 0, `${activeSteps[currentStepIdx]} (EXTRA)`);
    setActiveSteps(newSteps);
    Vibration.vibrate(20);
    Alert.alert("EXTRA SET ADDED", "One additional set added to this round.");
  };

  const finishWorkout = async (finalSplits: number[]) => {
    setIsActive(false);
    setShowSummary(true); 
    Vibration.vibrate(1000);

    try {
        const formattedSplits = finalSplits.map((time, index) => ({
            name: `ROUND ${index + 1}`,
            actual: time,
            target: 0
        }));

        const newLog = {
            date: new Date().toLocaleDateString(),
            totalTime: formatTime(totalSeconds),
            name: params.title || sessionTitle, 
            splits: formattedSplits
        };

        const existingLogs = await AsyncStorage.getItem('raceHistory');
        const history = existingLogs ? JSON.parse(existingLogs) : [];
        await AsyncStorage.setItem('raceHistory', JSON.stringify([newLog, ...history]));
        
        // AUTO-SYNC TO PLANNER
        await syncToPlanner(params.title || sessionTitle, 100);

    } catch (error) {
        console.error("Failed to save workout:", error);
    }
  };

  const syncToPlanner = async (title: any, xp: number) => {
    try {
        const planJson = await AsyncStorage.getItem('user_weekly_plan');
        const plan = planJson ? JSON.parse(planJson) : [];
        const jsDay = new Date().getDay(); 
        const dayIndex = jsDay === 0 ? 6 : jsDay - 1;

        if (plan[dayIndex]) {
            const hour = new Date().getHours();
            const sessionType = hour < 12 ? 'MORNING WORKOUT' : hour < 18 ? 'AFTERNOON WORKOUT' : 'EVENING WORKOUT';
            
            const newEntry = {
                id: `log-${Date.now()}`,
                title: title.toString().toUpperCase(),
                sessionType: sessionType,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                stats: { exercises: activeSteps.length, sets: totalRounds },
                complete: true,
                xp: xp
            };
            
            if (!plan[dayIndex].workouts) plan[dayIndex].workouts = [];
            plan[dayIndex].workouts.push(newEntry);
            await AsyncStorage.setItem('user_weekly_plan', JSON.stringify(plan));
        }
    } catch (e) { console.log(e); }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (showSummary) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.summaryHeader}>SESSION COMPLETE</Text>
        <Text style={styles.totalTimeLarge}>{formatTime(totalSeconds)}</Text>
        <Text style={styles.subLabel}>TOTAL WORK TIME</Text>

        <View style={styles.statsGrid}>
            <View style={styles.statBox}>
                <Text style={styles.statLabel}>ROUNDS</Text>
                <Text style={styles.statValue}>{totalRounds}</Text>
            </View>
            <View style={styles.statBox}>
                <Text style={styles.statLabel}>FASTEST</Text>
                <Text style={styles.statValue}>{roundSplits.length > 0 ? formatTime(Math.min(...roundSplits)) : "--:--"}</Text>
            </View>
            <View style={styles.statBox}>
                <Text style={styles.statLabel}>AVG LAP</Text>
                <Text style={styles.statValue}>{roundSplits.length > 0 ? formatTime(Math.round(totalSeconds / roundSplits.length)) : "--:--"}</Text>
            </View>
        </View>

        <ScrollView style={{flex: 1, width: '100%'}} contentContainerStyle={{paddingBottom: 40}}>
            {roundSplits.map((split, i) => (
              <View key={i} style={styles.splitRow}>
                <Text style={styles.splitIndex}>ROUND {i + 1}</Text>
                <Text style={styles.splitValue}>{formatTime(split)}</Text>
              </View>
            ))}
        </ScrollView>

        <TouchableOpacity style={styles.saveBtn} onPress={() => { router.dismissAll(); router.replace('/'); }}>
          <Text style={styles.saveBtnText}>RETURN TO BASE</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View>
            <Text style={styles.sessionType}>{params.title || "TRAINING LAB"}</Text>
            <Text style={styles.dynamicTitle}>{sessionTitle}</Text>
        </View>
        <View style={styles.totalTimerBox}>
            <Text style={styles.totalTimerLabel}>TOTAL TIME</Text>
            <Text style={styles.totalTimerValue}>{formatTime(totalSeconds)}</Text>
        </View>
      </View>

      <View style={styles.roundInfo}>
        <Text style={styles.roundText}>ROUND {currentRound} <Text style={{color:'#666'}}>/</Text> {totalRounds}</Text>
        <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${(currentRound / totalRounds) * 100}%` }]} />
        </View>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.listContainer} 
        contentContainerStyle={{ paddingBottom: 150 }}
        showsVerticalScrollIndicator={false}
      >
        {activeSteps.map((step, index) => {
          const isCompleted = index < currentStepIdx;
          const isCurrent = index === currentStepIdx;
          
          return (
            <TouchableOpacity 
                key={index} 
                activeOpacity={0.8}
                style={[styles.stepCard, isCurrent && styles.stepCardActive, isCompleted && styles.stepCardDone]}
                onPress={() => isCurrent && handleNext()} 
            >
                <View style={[styles.statusIcon, isCurrent && styles.statusIconActive, isCompleted && styles.statusIconDone]}>
                    {isCompleted ? <Ionicons name="checkmark" size={16} color="#000" /> : <Text style={[styles.stepNum, isCurrent && {color: '#000'}]}>{index + 1}</Text>}
                </View>
                <View style={styles.stepContent}>
                    <Text style={[styles.stepText, isCurrent && styles.stepTextActive, isCompleted && styles.stepTextDone]}>{step}</Text>
                    {isCurrent && <Text style={styles.stepSubtext}>ACTIVE • {formatTime(stepSeconds)}</Text>}
                </View>
                {isCurrent && <Text style={styles.stepTimer}>{formatTime(stepSeconds)}</Text>}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.footerRow}>
            <TouchableOpacity style={styles.addSetBtn} onPress={handleAddSet}>
                <Ionicons name="add" size={24} color="#FFF" />
                <Text style={styles.addSetText}>ADD SET</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                <Text style={styles.nextBtnText}>{currentStepIdx === activeSteps.length - 1 ? "FINISH ROUND" : "CHECK OFF"}</Text>
                <Ionicons name="arrow-forward" size={20} color="#000" />
            </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sessionType: { color: '#FFD700', fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 4 },
  dynamicTitle: { color: '#fff', fontSize: 22, fontWeight: '900', fontStyle: 'italic' },
  totalTimerBox: { alignItems: 'flex-end' },
  totalTimerLabel: { color: '#666', fontSize: 9, fontWeight: 'bold' },
  totalTimerValue: { color: '#fff', fontSize: 24, fontWeight: '900', fontVariant: ['tabular-nums'] },
  roundInfo: { marginBottom: 20 },
  roundText: { color: '#ccc', fontSize: 12, fontWeight: 'bold', marginBottom: 8 },
  progressBarBg: { height: 4, backgroundColor: '#222', borderRadius: 2 },
  progressBarFill: { height: '100%', backgroundColor: '#FFD700', borderRadius: 2 },
  listContainer: { flex: 1 },
  stepCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 15, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#222' },
  stepCardActive: { backgroundColor: '#1A1A1A', borderColor: '#FFD700', transform: [{scale: 1.02}] },
  stepCardDone: { opacity: 0.4 },
  statusIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#222', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  statusIconActive: { backgroundColor: '#FFD700' },
  statusIconDone: { backgroundColor: '#FFD700' },
  stepNum: { color: '#666', fontSize: 12, fontWeight: 'bold' },
  stepContent: { flex: 1 },
  stepText: { color: '#ccc', fontSize: 16, fontWeight: 'bold' },
  stepTextActive: { color: '#fff', fontSize: 18 },
  stepTextDone: { textDecorationLine: 'line-through' },
  stepSubtext: { color: '#FFD700', fontSize: 10, fontWeight: 'bold', marginTop: 4 },
  stepTimer: { color: '#fff', fontSize: 18, fontWeight: '900', fontVariant: ['tabular-nums'] },
  footer: { position: 'absolute', bottom: 0, left: 20, right: 20 },
  footerRow: { flexDirection: 'row', gap: 15 },
  addSetBtn: { flex: 0.3, backgroundColor: '#222', borderRadius: 16, justifyContent: 'center', alignItems: 'center', paddingVertical: 15 },
  addSetText: { color: '#fff', fontSize: 9, fontWeight: 'bold', marginTop: 2 },
  nextBtn: { flex: 0.7, backgroundColor: '#FFD700', borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, paddingVertical: 15 },
  nextBtnText: { color: '#000', fontSize: 16, fontWeight: '900' },
  summaryHeader: { color: '#fff', fontSize: 18, fontWeight: '900', textAlign: 'center', marginBottom: 10, letterSpacing: 1 },
  totalTimeLarge: { color: '#FFD700', fontSize: 60, fontWeight: 'bold', textAlign: 'center', fontFamily: 'Courier' },
  subLabel: { color: '#444', fontSize: 10, fontWeight: '900', textAlign: 'center', marginBottom: 30 },
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 30 },
  statBox: { flex: 1, backgroundColor: '#111', padding: 15, borderRadius: 12, alignItems: 'center' },
  statLabel: { color: '#666', fontSize: 9, fontWeight: '900', marginBottom: 5 },
  statValue: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  splitRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#222' },
  splitIndex: { color: '#888', fontWeight: 'bold' },
  splitValue: { color: '#fff', fontWeight: 'bold', fontFamily: 'Courier' },
  saveBtn: { backgroundColor: '#333', height: 60, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 },
});