import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Modal, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TrainingEngine, TrainingSession, UserProfile } from '../utils/TrainingEngine';
import { ALL_WORKOUTS } from './data/workouts';

const DAYS_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export default function Planner() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [weekPlan, setWeekPlan] = useState<TrainingSession[]>([]);
  const [stats, setStats] = useState({ completed: 0, xp: 0 });
  const [profileName, setProfileName] = useState("ATHLETE");
  
  const [isLogModalOpen, setLogModalOpen] = useState(false);
  const [selectedDayIdx, setSelectedDayIdx] = useState<number | null>(null);

  // --- ENGINE INITIALIZATION ---
  useFocusEffect(useCallback(() => {
    let isActive = true;

    const load = async () => {
        try {
            const profileJson = await AsyncStorage.getItem('user_profile');
            if (!profileJson) return; // Wait for onboarding
            
            const profile: UserProfile = JSON.parse(profileJson);
            if (isActive) setProfileName(profile.name || "ATHLETE");

            const planJson = await AsyncStorage.getItem('active_weekly_plan');
            let plan: TrainingSession[] = [];

            if (planJson) {
                // Plan exists: Run Adaptation
                plan = TrainingEngine.adaptPlan(JSON.parse(planJson));
            } else {
                // No plan: Generate New
                plan = TrainingEngine.generateWeek(profile);
            }

            // Save & Set State
            await AsyncStorage.setItem('active_weekly_plan', JSON.stringify(plan));
            if (isActive) {
                setWeekPlan(plan);
                calculateStats(plan);
            }
        } catch (e) {
            console.log("Planner Load Error:", e);
        }
    };

    load();
    return () => { isActive = false };
  }, []));

  const calculateStats = (plan: TrainingSession[]) => {
      const completed = plan.filter(s => s.status === 'COMPLETED').length;
      setStats({ completed, xp: completed * 150 });
  };

  // --- ACTIONS ---
  const handleDeploy = (session: TrainingSession) => {
    router.push({
        pathname: '/mission_brief',
        params: { session: JSON.stringify(session) }
    });
  };

  const manualAssignWorkout = async (workout: any) => {
    if (selectedDayIdx === null) return;
    
    const newSession: TrainingSession = {
        id: `manual-${Date.now()}`,
        dayIndex: selectedDayIdx,
        workoutId: workout.id,
        title: workout.title,
        type: 'MIXED',
        intent: "Manual Override Protocol",
        duration: parseInt(workout.estTime) || 60,
        rpeTarget: 7,
        status: 'PENDING',
        steps: workout.steps || ["Manual Work"],
        rounds: workout.rounds || "1 Round"
    };

    const updatedPlan = [...weekPlan];
    updatedPlan[selectedDayIdx] = newSession;
    
    setWeekPlan(updatedPlan);
    await AsyncStorage.setItem('active_weekly_plan', JSON.stringify(updatedPlan));
    setLogModalOpen(false);
  };

  const clearDay = async (dayIdx: number) => {
      const updatedPlan = [...weekPlan];
      updatedPlan[dayIdx].status = 'PENDING';
      setWeekPlan(updatedPlan);
      await AsyncStorage.setItem('active_weekly_plan', JSON.stringify(updatedPlan));
      calculateStats(updatedPlan);
  };

  // --- RENDERING ---
  const getStatusColor = (status: string) => {
    if (status === 'COMPLETED') return '#32D74B';
    if (status === 'MISSED') return '#FF453A';
    return '#FFD700'; 
  };

  const jsDay = new Date().getDay();
  const todayIndex = jsDay === 0 ? 6 : jsDay - 1;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#FFD700" />
        </TouchableOpacity>
        <View>
            <Text style={styles.headerTitle}>WEEKLY <Text style={{color: '#FFD700'}}>PROTOCOL</Text></Text>
            <Text style={styles.headerSub}>{profileName.toUpperCase()} // ACTIVE CYCLE</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
            <Text style={styles.statNum}>{stats.completed}</Text>
            <Text style={styles.statLabel}>COMPLETE</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
            <Text style={styles.statNum}>{stats.xp}</Text>
            <Text style={styles.statLabel}>XP EARNED</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {weekPlan.map((session, idx) => {
          const isToday = idx === todayIndex;
          const isRest = session.type === 'RECOVERY';
          const isCompleted = session.status === 'COMPLETED';
          const isMissed = session.status === 'MISSED';
          const borderColor = getStatusColor(session.status);

          return (
            <View key={idx} style={[styles.cardContainer, isToday && styles.cardActive]}>
              <View style={styles.dateCol}>
                <Text style={[styles.dayText, isToday && {color: '#FFD700'}]}>{DAYS_LABELS[idx]}</Text>
                {isToday && <View style={styles.todayDot} />}
              </View>

              <TouchableOpacity 
                style={[styles.sessionCard, { borderColor }]}
                activeOpacity={0.9}
                onPress={() => !isCompleted && handleDeploy(session)}
                disabled={isMissed}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.badgeRow}>
                    <View style={[styles.typeBadge, {backgroundColor: isRest ? '#333' : '#FFD700'}]}>
                      <Text style={[styles.typeText, {color: isRest ? '#888' : '#000'}]}>{session.type}</Text>
                    </View>
                    {isCompleted && <Ionicons name="checkmark-circle" size={16} color="#32D74B" />}
                    {isMissed && <Text style={styles.missedText}>MISSED</Text>}
                  </View>
                  
                  <TouchableOpacity onPress={() => { setSelectedDayIdx(idx); setLogModalOpen(true); }} style={{padding: 5}}>
                      <Ionicons name="ellipsis-horizontal" size={16} color="#666" />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.sessionTitle, isMissed && {textDecorationLine: 'line-through', opacity: 0.5}]}>
                  {session.title}
                </Text>
                <Text style={styles.intentText}>// {session.intent}</Text>

                {!isCompleted && !isMissed && isToday && (
                   <View style={styles.deployBtn}>
                      <Text style={styles.deployLabel}>DEPLOY MISSION</Text>
                      <Ionicons name="arrow-forward" size={12} color="#000" />
                   </View>
                )}

                {isCompleted && (
                    <TouchableOpacity onPress={() => clearDay(idx)} style={{marginTop: 10, alignSelf: 'flex-end'}}>
                        <Text style={{color: '#444', fontSize: 10}}>UNDO</Text>
                    </TouchableOpacity>
                )}
              </TouchableOpacity>
            </View>
          );
        })}

        <TouchableOpacity 
          style={styles.resetBtn} 
          onPress={async () => { await AsyncStorage.removeItem('active_weekly_plan'); router.replace('/'); }}
        >
          <Text style={styles.resetText}>RESET CYCLE (DEV)</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* OVERRIDE MODAL */}
      <Modal visible={isLogModalOpen} animationType="slide" transparent>
        <BlurView intensity={90} tint="dark" style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>MANUAL OVERRIDE</Text>
                    <TouchableOpacity onPress={() => setLogModalOpen(false)}>
                        <Ionicons name="close" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                    {ALL_WORKOUTS.map((wk: any) => (
                        <TouchableOpacity key={wk.id} style={styles.optionCard} onPress={() => manualAssignWorkout(wk)}>
                            <View>
                                <Text style={styles.optionTitle}>{wk.title}</Text>
                                <Text style={styles.optionSub}>{wk.station}</Text>
                            </View>
                            <Ionicons name="swap-horizontal" size={24} color="#FFD700" />
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        </BlurView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#1E1E1E' },
  backBtn: { padding: 8, backgroundColor: '#1E1E1E', borderRadius: 12, marginRight: 15 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '900', fontStyle: 'italic' },
  headerSub: { color: '#666', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  scrollContent: { padding: 20, paddingBottom: 80 },
  statsRow: { flexDirection: 'row', backgroundColor: '#161616', marginHorizontal: 20, marginTop: 20, borderRadius: 12, padding: 15, borderWidth: 1, borderColor: '#333' },
  statBox: { flex: 1, alignItems: 'center' },
  statNum: { color: '#fff', fontSize: 20, fontWeight: '900' },
  statLabel: { color: '#666', fontSize: 8, fontWeight: 'bold', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#333' },
  cardContainer: { flexDirection: 'row', marginBottom: 15, marginTop: 10 },
  cardActive: { marginBottom: 25 },
  dateCol: { width: 50, alignItems: 'center', paddingTop: 10 },
  dayText: { color: '#666', fontSize: 12, fontWeight: '900' },
  todayDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFD700', marginTop: 4 },
  sessionCard: { flex: 1, backgroundColor: '#161616', borderRadius: 12, padding: 15, borderWidth: 1, borderColor: '#333' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  typeText: { fontSize: 8, fontWeight: '900' },
  missedText: { color: '#FF453A', fontSize: 10, fontWeight: '900' },
  sessionTitle: { color: '#fff', fontSize: 16, fontWeight: '900', fontStyle: 'italic', marginBottom: 4 },
  intentText: { color: '#888', fontSize: 10, fontStyle: 'italic' },
  deployBtn: { marginTop: 15, backgroundColor: '#FFD700', padding: 10, borderRadius: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  deployLabel: { color: '#000', fontSize: 12, fontWeight: '900' },
  resetBtn: { marginTop: 40, alignItems: 'center', marginBottom: 40 },
  resetText: { color: '#333', fontSize: 10, fontWeight: '900' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#121212', height: '80%', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  modalSub: { color: '#666', fontSize: 12, marginBottom: 20 },
  optionCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, backgroundColor: '#1E1E1E', borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#333' },
  optionTitle: { color: '#fff', fontSize: 16, fontWeight: '900', fontStyle: 'italic' },
  optionSub: { color: '#666', fontSize: 11, marginTop: 2 },
});