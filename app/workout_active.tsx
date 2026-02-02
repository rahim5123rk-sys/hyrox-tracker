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
  
  // PARAMS
  const sessionId = params.sessionId as string; // The ID of the planned session
  const titleParam = params.title as string;
  
  const [sessionTitle, setSessionTitle] = useState("");
  const initialSteps = params.steps 
    ? (typeof params.steps === 'string' ? JSON.parse(params.steps) : ["Warmup", "Work", "Rest"]) 
    : ["Warmup", "Work", "Rest"];

  const totalRounds = params.rounds 
    ? parseInt(String(params.rounds).match(/\d+/)?.[0] || "1") 
    : 1;

  const [activeSteps, setActiveSteps] = useState<string[]>(Array.isArray(initialSteps) ? initialSteps : ["Work", "Rest"]);
  const [currentRound, setCurrentRound] = useState(1);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  
  const [detailedSplits, setDetailedSplits] = useState<{name: string, time: number}[]>([]); 
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [stepSeconds, setStepSeconds] = useState(0); 
  const [isActive, setIsActive] = useState(true);
  const [showSummary, setShowSummary] = useState(false);

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
    const currentStepName = activeSteps[currentStepIdx];
    const logName = `${currentStepName} (R${currentRound})`; 
    setDetailedSplits(prev => [...prev, { name: logName, time: stepSeconds }]);

    if (currentStepIdx < activeSteps.length - 1) {
      setCurrentStepIdx(prev => prev + 1);
      setStepSeconds(0); 
      scrollViewRef.current?.scrollTo({ y: (currentStepIdx + 1) * 80, animated: true });
    } else {
      if (currentRound < totalRounds) {
        setCurrentRound(prev => prev + 1);
        setCurrentStepIdx(0);
        setStepSeconds(0);
        setActiveSteps(initialSteps); 
        Vibration.vibrate([0, 100, 50, 100]); 
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      } else {
        finishWorkout(); 
      }
    }
  };

  const handleAddSet = () => {
    const currentStepName = activeSteps[currentStepIdx];
    if (currentStepName.toUpperCase().includes('REST')) {
        Alert.alert("RECOVERY MODE", "Cannot add sets during a rest period.");
        return;
    }
    const newSteps = [...activeSteps];
    newSteps.splice(currentStepIdx + 1, 0, `${activeSteps[currentStepIdx]} (EXTRA)`);
    setActiveSteps(newSteps);
    Vibration.vibrate(20);
  };

  const finishWorkout = async () => {
    setIsActive(false);
    setShowSummary(true);
    Vibration.vibrate(1000);

    const completionTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const finalSplits = [...detailedSplits, {name: "FINISH", time: stepSeconds}];

    try {
        // 1. SAVE TO HISTORY (The Logbook)
        const newLog = {
            date: new Date().toLocaleDateString(),
            completedAt: completionTime,
            totalTime: formatTime(totalSeconds),
            title: titleParam || sessionTitle, 
            type: 'WORKOUT',           
            sessionType: 'TRAINING',
            splits: finalSplits,
        };

        const existingLogs = await AsyncStorage.getItem('raceHistory');
        const history = existingLogs ? JSON.parse(existingLogs) : [];
        await AsyncStorage.setItem('raceHistory', JSON.stringify([newLog, ...history]));
        
        // 2. TICK OFF IN PLANNER (The Engine)
        if (sessionId) {
            await markSessionComplete(sessionId);
        }
    } catch (error) {
        console.error("Failed to save workout:", error);
    }
  };

  // --- NEW: Updates the planned session status ---
  const markSessionComplete = async (targetId: string) => {
    try {
        const planJson = await AsyncStorage.getItem('active_weekly_plan');
        if (!planJson) return;
        
        let plan = JSON.parse(planJson);
        
        // Find and update the specific session
        plan = plan.map((session: any) => {
            if (session.id === targetId) {
                return { 
                    ...session, 
                    status: 'COMPLETED',
                    feedback: { rpeActual: 8, note: "Completed via Active Mode" } // Default feedback
                };
            }
            return session;
        });

        await AsyncStorage.setItem('active_weekly_plan', JSON.stringify(plan));
    } catch (e) {
        console.log("Failed to update planner status", e);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (showSummary) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <StatusBar barStyle="light-content" />
        <View style={{alignItems:'center', marginTop: 20}}>
            <Ionicons name="checkmark-circle" size={64} color="#FFD700" />
            <Text style={styles.summaryHeader}>MISSION COMPLETE</Text>
            <Text style={styles.totalTimeLarge}>{formatTime(totalSeconds)}</Text>
            <Text style={styles.subLabel}>TOTAL ACTIVE TIME</Text>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={() => { router.dismissAll(); router.replace('/'); }}>
          <Text style={styles.saveBtnText}>CONFIRM & EXIT</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View>
            <Text style={styles.sessionType}>{titleParam || "TRAINING LAB"}</Text>
            <Text style={styles.dynamicTitle}>{sessionTitle}</Text>
        </View>
        <View style={styles.totalTimerBox}>
            <Text style={styles.totalTimerLabel}>TOTAL TIME</Text>
            <Text style={styles.totalTimerValue}>{formatTime(totalSeconds)}</Text>
        </View>
      </View>

      {/* PROGRESS */}
      <View style={styles.roundInfo}>
        <Text style={styles.roundText}>ROUND {currentRound} <Text style={{color:'#666'}}>/</Text> {totalRounds}</Text>
        <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${(currentRound / totalRounds) * 100}%` }]} />
        </View>
      </View>

      {/* STEPS LIST */}
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

      {/* FOOTER */}
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
  
  summaryHeader: { color: '#fff', fontSize: 24, fontWeight: '900', marginTop: 15, letterSpacing: 1 },
  totalTimeLarge: { color: '#FFD700', fontSize: 60, fontWeight: 'bold', marginVertical: 10, fontVariant: ['tabular-nums'] },
  subLabel: { color: '#666', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  saveBtn: { backgroundColor: '#FFD700', height: 60, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  saveBtnText: { color: '#000', fontSize: 16, fontWeight: '900' },
});