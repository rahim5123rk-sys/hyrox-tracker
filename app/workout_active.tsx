import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, Vibration, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DataStore } from './services/DataStore';

// --- HYROX STANDARDS MATRIX ---
const HYROX_WEIGHTS: any = {
    MEN_OPEN: { SLED_PUSH: '152', SLED_PULL: '103', LUNGE: '20', WALL: '6', FARMER: '24', DEADLIFT: '100' },
    MEN_PRO: { SLED_PUSH: '202', SLED_PULL: '153', LUNGE: '30', WALL: '9', FARMER: '32', DEADLIFT: '140' },
    WOMEN_OPEN: { SLED_PUSH: '102', SLED_PULL: '78', LUNGE: '10', WALL: '4', FARMER: '16', DEADLIFT: '70' },
    WOMEN_PRO: { SLED_PUSH: '152', SLED_PULL: '103', LUNGE: '20', WALL: '6', FARMER: '24', DEADLIFT: '100' },
    DOUBLES_MEN: { SLED_PUSH: '152', SLED_PULL: '103', LUNGE: '20', WALL: '6', FARMER: '24', DEADLIFT: '100' },
    DOUBLES_WOMEN: { SLED_PUSH: '102', SLED_PULL: '78', LUNGE: '10', WALL: '4', FARMER: '16', DEADLIFT: '70' },
    DOUBLES_MIXED: { SLED_PUSH: '152', SLED_PULL: '103', LUNGE: '20', WALL: '6', FARMER: '24', DEADLIFT: '100' }
};

interface StepData {
  label: string;
  isLoadBearing: boolean;
  weight: string; 
  duration: number;
}

export default function WorkoutActive() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  
  const sessionId = params.sessionId as string; 
  const titleParam = params.title as string;
  const initialStepsRaw: string[] = params.steps ? JSON.parse(params.steps as string) : [];
  const totalRounds = params.rounds ? parseInt(String(params.rounds).match(/\d+/)?.[0] || "1") : 1;

  const [sessionTitle, setSessionTitle] = useState("");
  const [userCategory, setUserCategory] = useState('MEN_OPEN');
  
  const [activeSteps, setActiveSteps] = useState<StepData[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [stepSeconds, setStepSeconds] = useState(0); 
  const [isActive, setIsActive] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  const [finalTonnage, setFinalTonnage] = useState(0);
  
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const init = async () => {
        const cat = await AsyncStorage.getItem('userCategory') || 'MEN_OPEN';
        setUserCategory(cat);
        const standards = HYROX_WEIGHTS[cat] || HYROX_WEIGHTS.MEN_OPEN;

        const steps: StepData[] = initialStepsRaw.map(stepText => {
            const up = stepText.toUpperCase();
            let defaultWeight = '';
            let isHeavy = false;

            if (up.includes('SLED PUSH')) { isHeavy = true; defaultWeight = standards.SLED_PUSH; }
            else if (up.includes('SLED PULL')) { isHeavy = true; defaultWeight = standards.SLED_PULL; }
            else if (up.includes('LUNGE')) { isHeavy = true; defaultWeight = standards.LUNGE; }
            else if (up.includes('WALL BALL')) { isHeavy = true; defaultWeight = standards.WALL; }
            else if (up.includes('FARMER') || up.includes('CARRY')) { isHeavy = true; defaultWeight = standards.FARMER; }
            else if (up.includes('KETTLEBELL') || up.includes('KB') || up.includes('SWING')) { isHeavy = true; defaultWeight = standards.FARMER; }
            else if (up.includes('DEADLIFT')) { isHeavy = true; defaultWeight = standards.DEADLIFT; }
            else if (up.includes('WEIGHT') || up.includes('HEAVY') || up.includes('BARBELL') || up.includes('DB')) { isHeavy = true; }

            return { label: stepText, isLoadBearing: isHeavy, weight: defaultWeight, duration: 0 };
        });
        setActiveSteps(steps);
    };
    init();
    const hour = new Date().getHours();
    setSessionTitle(`${hour < 12 ? 'MORNING' : hour < 18 ? 'AFTERNOON' : 'EVENING'} PROTOCOL`);
  }, []);

  useEffect(() => {
    let interval: any;
    if (isActive && !showSummary) {
      interval = setInterval(() => {
        setTotalSeconds(t => t + 1);
        setStepSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, showSummary]);

  const updateStepWeight = (val: string) => {
      const updated = [...activeSteps];
      updated[currentStepIdx].weight = val;
      setActiveSteps(updated);
  };

  const handleNext = () => {
    Vibration.vibrate(50); 
    const updated = [...activeSteps];
    updated[currentStepIdx].duration = stepSeconds;
    setActiveSteps(updated);

    if (currentStepIdx < activeSteps.length - 1) {
      setCurrentStepIdx(prev => prev + 1);
      setStepSeconds(0); 
      scrollViewRef.current?.scrollTo({ y: (currentStepIdx + 1) * 90, animated: true });
    } else {
      if (currentRound < totalRounds) {
        setCurrentRound(prev => prev + 1);
        setCurrentStepIdx(0);
        setStepSeconds(0);
        const nextSteps = activeSteps.map(s => ({ ...s, duration: 0 }));
        setActiveSteps(nextSteps);
        Vibration.vibrate([0, 100, 50, 100]); 
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      } else {
        finishWorkout(); 
      }
    }
  };

  const finishWorkout = () => {
    let totalLoad = 0;
    activeSteps.forEach(s => {
        const w = parseFloat(s.weight);
        if (!isNaN(w) && w > 0) totalLoad += (w * totalRounds);
    });
    setFinalTonnage(totalLoad);
    setIsActive(false);
    setShowSummary(true);
    Vibration.vibrate(1000);
  };

  const saveAndExit = async () => {
    const completionTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const finalSplits = activeSteps.map(s => ({
        name: s.label,
        time: s.duration, 
        actual: s.duration,
        target: 0
    }));

    try {
        const newLog = {
          date: new Date().toISOString(),
          completedAt: completionTime,
          totalTime: formatTime(totalSeconds),
          title: titleParam || sessionTitle, 
          type: 'WORKOUT',           
          sessionType: 'TRAINING',
          splits: finalSplits,
          details: {
              weight: finalTonnage.toString(),
              // [FIX] MATH ERROR CORRECTION
              // We set reps to "1" because finalTonnage is ALREADY multiplied by rounds.
              // This prevents the Database from multiplying (Load * Rounds) * Rounds again.
              reps: "1", 
              note: `Completed ${totalRounds} Rounds via Smart Logbook`
          }
        };

        await DataStore.logEvent(newLog);
        
        if (sessionId) {
            const planJson = await AsyncStorage.getItem('active_weekly_plan');
            if (planJson) {
                let plan = JSON.parse(planJson);
                plan = plan.map((session: any) => {
                    if (session.id === sessionId) {
                        return { ...session, status: 'COMPLETED', feedback: { rpeActual: 8 } };
                    }
                    return session;
                });
                await AsyncStorage.setItem('active_weekly_plan', JSON.stringify(plan));
            }
        }
        router.dismissAll();
        router.replace('/');
    } catch (error) { console.error(error); }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // --- SUMMARY VIEW ---
  if (showSummary) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <StatusBar barStyle="light-content" />
        <View style={{alignItems:'center', marginTop: 40}}>
            <Ionicons name="checkmark-circle" size={64} color="#FFD700" />
            <Text style={styles.summaryHeader}>MISSION COMPLETE</Text>
            <Text style={styles.totalTimeLarge}>{formatTime(totalSeconds)}</Text>
        </View>

        <View style={styles.statGrid}>
            <View style={styles.statBox}>
                <Text style={styles.statLabel}>TOTAL TONNAGE</Text>
                <Text style={styles.statValue}>{finalTonnage} KG</Text>
                <Text style={styles.statSub}>VOLUME LOAD</Text>
            </View>
            <View style={styles.statBox}>
                <Text style={styles.statLabel}>ROUNDS</Text>
                <Text style={styles.statValue}>{totalRounds}</Text>
            </View>
        </View>
        <View style={{flex: 1}} />
        <TouchableOpacity style={styles.saveBtn} onPress={saveAndExit}>
          <Text style={styles.saveBtnText}>SAVE LOGBOOK</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- ACTIVE VIEW ---
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View>
            <Text style={styles.sessionType}>{titleParam || "TRAINING LAB"}</Text>
            <Text style={styles.dynamicTitle}>{sessionTitle}</Text>
            <Text style={styles.catBadge}>{userCategory.replace('_', ' ')}</Text>
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
        contentContainerStyle={{ paddingBottom: 150, paddingTop: 10 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {activeSteps.map((step, index) => {
          const isCompleted = index < currentStepIdx;
          const isCurrent = index === currentStepIdx;
          
          return (
            <TouchableOpacity 
                key={index} 
                activeOpacity={1}
                style={[
                    styles.stepCard, 
                    isCurrent && styles.stepCardActive, 
                    isCompleted && styles.stepCardDone
                ]}
                onPress={() => isCurrent && Keyboard.dismiss()} 
            >
                {/* --- SAFE LAYOUT ROW --- */}
                <View style={styles.cardRow}>
                    
                    {/* LEFT: Icon & Text */}
                    <View style={styles.leftContent}>
                        <View style={[styles.statusIcon, isCurrent && styles.statusIconActive, isCompleted && styles.statusIconDone]}>
                            {isCompleted ? <Ionicons name="checkmark" size={16} color="#000" /> : <Text style={[styles.stepNum, isCurrent && {color: '#000'}]}>{index + 1}</Text>}
                        </View>
                        <View style={styles.textContent}>
                            <Text style={[styles.stepText, isCurrent && styles.stepTextActive, isCompleted && styles.stepTextDone]}>
                                {step.label}
                            </Text>
                            {isCurrent && <Text style={styles.stepSubtext}>ACTIVE</Text>}
                        </View>
                    </View>

                    {/* RIGHT: Timer & Inputs */}
                    <View style={styles.rightContent}>
                         {/* Timer */}
                         {isCurrent && <Text style={styles.stepTimer}>{formatTime(stepSeconds)}</Text>}
                         
                         {/* Input Box */}
                         {step.isLoadBearing && isCurrent && (
                             <View style={styles.compactInputWrapper}>
                                <TextInput 
                                    style={styles.compactInput}
                                    value={step.weight}
                                    onChangeText={updateStepWeight}
                                    placeholder="0"
                                    placeholderTextColor="#666"
                                    keyboardType="numeric"
                                    maxLength={4}
                                />
                                <Text style={styles.compactUnit}>KG</Text>
                             </View>
                         )}

                         {/* Read Only Load */}
                         {step.isLoadBearing && !isCurrent && step.weight !== '' && (
                            <View style={styles.readOnlyLoad}>
                                <Text style={styles.readOnlyLoadText}>{step.weight}kg</Text>
                            </View>
                         )}
                    </View>
                </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? "padding" : "height"} keyboardVerticalOffset={20}>
      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
            <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                <Text style={styles.nextBtnText}>{currentStepIdx === activeSteps.length - 1 ? "FINISH ROUND" : "CHECK OFF"}</Text>
                <Ionicons name="arrow-forward" size={20} color="#000" />
            </TouchableOpacity>
      </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sessionType: { color: '#FFD700', fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 4 },
  dynamicTitle: { color: '#fff', fontSize: 22, fontWeight: '900', fontStyle: 'italic' },
  catBadge: { color: '#666', fontSize: 10, fontWeight: 'bold', marginTop: 2 },
  
  totalTimerBox: { alignItems: 'flex-end' },
  totalTimerLabel: { color: '#666', fontSize: 9, fontWeight: 'bold' },
  totalTimerValue: { color: '#fff', fontSize: 24, fontWeight: '900', fontVariant: ['tabular-nums'] },
  roundInfo: { marginBottom: 20 },
  roundText: { color: '#ccc', fontSize: 12, fontWeight: 'bold', marginBottom: 8 },
  progressBarBg: { height: 4, backgroundColor: '#222', borderRadius: 2 },
  progressBarFill: { height: '100%', backgroundColor: '#FFD700', borderRadius: 2 },
  
  listContainer: { flex: 1 },
  stepCard: { backgroundColor: '#111', padding: 15, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#222', width: '100%' },
  stepCardActive: { backgroundColor: '#1A1A1A', borderColor: '#FFD700', shadowColor: "#FFD700", shadowOffset: {width: 0, height: 0}, shadowOpacity: 0.2, shadowRadius: 10, zIndex: 10 },
  stepCardDone: { opacity: 0.4 },
  
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  leftContent: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 },
  textContent: { flex: 1 }, 
  rightContent: { alignItems: 'flex-end', gap: 6, minWidth: 70 },
  
  statusIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#222', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  statusIconActive: { backgroundColor: '#FFD700' },
  statusIconDone: { backgroundColor: '#FFD700' },
  stepNum: { color: '#666', fontSize: 12, fontWeight: 'bold' },
  
  stepText: { color: '#ccc', fontSize: 14, fontWeight: 'bold' },
  stepTextActive: { color: '#fff', fontSize: 15 },
  stepTextDone: { textDecorationLine: 'line-through' },
  stepSubtext: { color: '#FFD700', fontSize: 10, fontWeight: 'bold', marginTop: 2 },
  stepTimer: { color: '#fff', fontSize: 18, fontWeight: '900', fontVariant: ['tabular-nums'] },
  
  compactInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#000', borderRadius: 8, borderWidth: 1, borderColor: '#333', paddingHorizontal: 6, height: 30, width: 75 },
  compactInput: { color: '#FFD700', fontSize: 14, fontWeight: '900', flex: 1, textAlign: 'right', padding: 0 },
  compactUnit: { color: '#666', fontSize: 10, fontWeight: 'bold', marginLeft: 2 },

  readOnlyLoad: { backgroundColor: '#222', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  readOnlyLoadText: { color: '#888', fontSize: 10, fontWeight: 'bold' },

  footer: { position: 'absolute', bottom: 0, left: 20, right: 20 },
  nextBtn: { backgroundColor: '#FFD700', borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, paddingVertical: 18 },
  nextBtnText: { color: '#000', fontSize: 16, fontWeight: '900' },
  
  summaryHeader: { color: '#fff', fontSize: 24, fontWeight: '900', marginTop: 15, letterSpacing: 1 },
  totalTimeLarge: { color: '#FFD700', fontSize: 60, fontWeight: 'bold', marginVertical: 10, fontVariant: ['tabular-nums'] },
  statGrid: { flexDirection: 'row', gap: 15, marginTop: 30 },
  statBox: { flex: 1, backgroundColor: '#1A1A1A', padding: 20, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  statLabel: { color: '#666', fontSize: 10, fontWeight: '900', marginBottom: 5 },
  statValue: { color: '#fff', fontSize: 24, fontWeight: '900' },
  statSub: { color: '#444', fontSize: 9, marginTop: 5, fontWeight: 'bold' },
  saveBtn: { backgroundColor: '#FFD700', height: 70, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  saveBtnText: { color: '#000', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
});