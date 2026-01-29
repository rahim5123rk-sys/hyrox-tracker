import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Modal, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// IMPORT MASTER DATA
import { ALL_WORKOUTS } from './data/workouts';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export default function Planner() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [weeklyPlan, setWeeklyPlan] = useState<any[]>([]);
  const [stats, setStats] = useState({ completed: 0, total: 0, xp: 0 });
  
  // LOGGING STATE
  const [isLogModalOpen, setLogModalOpen] = useState(false);
  const [selectedDayIdx, setSelectedDayIdx] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const loadHistory = async () => {
    try {
      const json = await AsyncStorage.getItem('user_weekly_plan');
      let data = [];

      if (json) {
        data = JSON.parse(json);
      } else {
        // Initialize empty week
        data = DAYS.map(d => ({ day: d, workouts: [] }));
        await AsyncStorage.setItem('user_weekly_plan', JSON.stringify(data));
      }
      
      setWeeklyPlan(data);
      calculateStats(data);
    } catch (e) { console.log("Load error", e); }
  };

  const calculateStats = (data: any[]) => {
    let completed = 0;
    let totalXP = 0;
    
    data.forEach(day => {
        if (day.workouts) {
            completed += day.workouts.length;
            day.workouts.forEach((w: any) => totalXP += (w.xp || 0));
        }
    });

    setStats({ completed, total: 7, xp: totalXP });
  };

  const openLogModal = (dayIdx: number) => {
    setSelectedDayIdx(dayIdx);
    setLogModalOpen(true);
  };

  const logWorkoutToDay = async (workout: any) => {
    if (selectedDayIdx === null) return;

    const newPlan = [...weeklyPlan];
    const dayLog = newPlan[selectedDayIdx];

    if (!dayLog.workouts) dayLog.workouts = [];

    // Create Log Entry
    const entry = {
        id: `manual-${Date.now()}`,
        title: workout.title,
        sessionType: 'MANUAL LOG',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        stats: { 
            exercises: workout.steps ? workout.steps.length : 0, 
            sets: workout.rounds || '1' 
        },
        complete: true,
        xp: workout.stats?.xp || 100
    };

    dayLog.workouts.push(entry);
    
    setWeeklyPlan(newPlan);
    calculateStats(newPlan);
    await AsyncStorage.setItem('user_weekly_plan', JSON.stringify(newPlan));
    
    // Also update Career Stats
    updateCareerStats(workout.stats);

    setLogModalOpen(false);
  };

  const updateCareerStats = async (stats: any) => {
      try {
        const historyJson = await AsyncStorage.getItem('user_history_stats');
        const history = historyJson ? JSON.parse(historyJson) : { xp: 0, workouts: 0, run: 0, sled: 0 };
        
        const updated = {
            ...history,
            xp: history.xp + (stats?.xp || 100),
            workouts: history.workouts + 1,
            run: history.run + (stats?.runKm || 0),
            sled: history.sled + (stats?.sledKm || 0)
        };
        
        await AsyncStorage.setItem('user_history_stats', JSON.stringify(updated));
      } catch (e) {}
  };

  const clearDay = async (dayIdx: number) => {
      Alert.alert("CLEAR LOGS", "Remove all logs for this day?", [
          { text: "Cancel", style: "cancel" },
          { text: "Clear", style: "destructive", onPress: async () => {
              const newPlan = [...weeklyPlan];
              newPlan[dayIdx].workouts = [];
              setWeeklyPlan(newPlan);
              calculateStats(newPlan);
              await AsyncStorage.setItem('user_weekly_plan', JSON.stringify(newPlan));
          }}
      ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#FFD700" />
        </TouchableOpacity>
        <View>
            <Text style={styles.headerTitle}>SESSION <Text style={{color: '#FFD700'}}>LOG</Text></Text>
            <Text style={styles.headerSub}>HISTORY & TRACKING</Text>
        </View>
        <View style={{width: 40}} /> 
      </View>

      {/* STATS OVERVIEW */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
            <Text style={styles.statNum}>{stats.completed}</Text>
            <Text style={styles.statLabel}>SESSIONS</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
            <Text style={styles.statNum}>{stats.xp}</Text>
            <Text style={styles.statLabel}>XP EARNED</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {weeklyPlan.map((day, idx) => (
          <View key={idx} style={styles.dayContainer}>
            
            {/* Day Header */}
            <View style={styles.dayHeader}>
                <Text style={styles.dayLabel}>{day.day}</Text>
                <View style={styles.line} />
                <TouchableOpacity onPress={() => openLogModal(idx)} style={styles.logBtn}>
                    <Ionicons name="add" size={16} color="#000" />
                    <Text style={styles.logBtnText}>LOG</Text>
                </TouchableOpacity>
                {day.workouts && day.workouts.length > 0 && (
                    <TouchableOpacity onPress={() => clearDay(idx)} style={{marginLeft: 10}}>
                        <Ionicons name="trash-outline" size={16} color="#444" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Empty State */}
            {(!day.workouts || day.workouts.length === 0) && (
                <Text style={styles.emptyText}>No activity recorded.</Text>
            )}

            {/* Workout Cards */}
            {day.workouts && day.workouts.map((wk: any, i: number) => (
                <View key={i} style={styles.historyCard}>
                    <View style={styles.cardTop}>
                        <Text style={styles.sessionType}>{wk.sessionType || 'MANUAL ENTRY'}</Text>
                        <Text style={styles.timestamp}>{wk.timestamp}</Text>
                    </View>
                    
                    <Text style={styles.wkTitle}>{wk.title}</Text>
                    
                    <View style={styles.metaRow}>
                        <View style={styles.badge}>
                            <Ionicons name="layers-outline" size={10} color="#000" />
                            <Text style={styles.badgeText}>{wk.stats?.exercises || 0} EXERCISES</Text>
                        </View>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>+{wk.xp} XP</Text>
                        </View>
                    </View>
                </View>
            ))}

          </View>
        ))}
      </ScrollView>

      {/* LOGGING MODAL */}
      <Modal visible={isLogModalOpen} animationType="slide" transparent>
        <BlurView intensity={90} tint="dark" style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>SELECT MISSION COMPLETED</Text>
                    <TouchableOpacity onPress={() => setLogModalOpen(false)}>
                        <Ionicons name="close" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
                
                <ScrollView showsVerticalScrollIndicator={false}>
                    {ALL_WORKOUTS.map((wk: any) => (
                        <TouchableOpacity 
                            key={wk.id} 
                            style={styles.optionCard}
                            onPress={() => logWorkoutToDay(wk)}
                        >
                            <View>
                                <Text style={styles.optionTitle}>{wk.title}</Text>
                                <Text style={styles.optionSub}>{wk.station} • {wk.level}</Text>
                            </View>
                            <Ionicons name="add-circle-outline" size={24} color="#FFD700" />
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
  
  statsRow: { flexDirection: 'row', backgroundColor: '#121212', margin: 20, borderRadius: 16, padding: 15, borderWidth: 1, borderColor: '#222' },
  statBox: { flex: 1, alignItems: 'center' },
  statNum: { color: '#fff', fontSize: 24, fontWeight: '900' },
  statLabel: { color: '#666', fontSize: 9, fontWeight: 'bold', marginTop: 4 },
  statDivider: { width: 1, backgroundColor: '#333' },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
  
  dayContainer: { marginBottom: 25 },
  dayHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  dayLabel: { color: '#FFD700', fontSize: 12, fontWeight: '900', width: 35 },
  line: { flex: 1, height: 1, backgroundColor: '#222', marginRight: 15 },
  logBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFD700', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, gap: 4 },
  logBtnText: { color: '#000', fontSize: 10, fontWeight: '900' },
  
  emptyText: { color: '#333', fontSize: 12, fontStyle: 'italic', marginLeft: 35 },

  historyCard: { backgroundColor: '#121212', borderRadius: 16, padding: 15, marginLeft: 35, marginBottom: 10, borderLeftWidth: 2, borderLeftColor: '#FFD700' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  sessionType: { color: '#666', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  timestamp: { color: '#444', fontSize: 9, fontWeight: 'bold' },
  wkTitle: { color: '#fff', fontSize: 16, fontWeight: '900', fontStyle: 'italic', marginBottom: 10 },
  
  metaRow: { flexDirection: 'row', gap: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFD700', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 4 },
  badgeText: { color: '#000', fontSize: 9, fontWeight: '900' },

  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#121212', height: '80%', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  
  optionCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, backgroundColor: '#1E1E1E', borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#333' },
  optionTitle: { color: '#fff', fontSize: 16, fontWeight: '900', fontStyle: 'italic' },
  optionSub: { color: '#666', fontSize: 11, marginTop: 2 }
});