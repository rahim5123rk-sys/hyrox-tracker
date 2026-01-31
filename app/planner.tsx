import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Modal, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ALL_WORKOUTS } from './data/workouts';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export default function Planner() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [weeklyPlan, setWeeklyPlan] = useState<any[]>([]);
  const [stats, setStats] = useState({ completed: 0, total: 0, xp: 0 });
  const [isLogModalOpen, setLogModalOpen] = useState(false);
  const [selectedDayIdx, setSelectedDayIdx] = useState<number | null>(null);

  useFocusEffect(useCallback(() => { loadHistory(); }, []));

  const loadHistory = async () => {
    try {
      const json = await AsyncStorage.getItem('user_weekly_plan');
      let data = json ? JSON.parse(json) : DAYS.map(d => ({ day: d, workouts: [] }));
      if (!json) await AsyncStorage.setItem('user_weekly_plan', JSON.stringify(data));
      setWeeklyPlan(data);
      calculateStats(data);
    } catch (e) {}
  };

  const calculateStats = (data: any[]) => {
    let completed = 0; let totalXP = 0;
    data.forEach(day => {
        if (day.workouts) {
            completed += day.workouts.length;
            day.workouts.forEach((w: any) => totalXP += (w.xp || 0));
        }
    });
    setStats({ completed, total: 7, xp: totalXP });
  };

  const logWorkoutToDay = async (workout: any) => {
    if (selectedDayIdx === null) return;
    const newPlan = [...weeklyPlan];
    const dayLog = newPlan[selectedDayIdx];
    if (!dayLog.workouts) dayLog.workouts = [];

    const entry = {
        id: `manual-${Date.now()}`,
        title: workout.title,
        sessionType: 'PLANNER LOG',
        type: 'WORKOUT',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        result: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        unit: 'TIME',
        note: `${workout.title} (${workout.level}) - Completed via Planner.`,
        stats: { exercises: workout.steps ? workout.steps.length : 0, sets: workout.rounds || '1' },
        complete: true,
        xp: workout.stats?.xp || 100
    };

    dayLog.workouts.push(entry);
    setWeeklyPlan(newPlan);
    calculateStats(newPlan);
    await AsyncStorage.setItem('user_weekly_plan', JSON.stringify(newPlan));
    
    // Save to History Tab
    const historyJson = await AsyncStorage.getItem('raceHistory');
    const history = historyJson ? JSON.parse(historyJson) : [];
    const historyEntry = { 
        date: new Date().toLocaleDateString(), 
        totalTime: entry.timestamp, 
        splits: [], 
        type: 'WORKOUT', 
        sessionType: 'PLANNER LOG', 
        note: entry.note,
        unit: 'TIME'
    };
    await AsyncStorage.setItem('raceHistory', JSON.stringify([historyEntry, ...history]));

    setLogModalOpen(false);
  };

  const clearDay = async (dayIdx: number) => {
      Alert.alert("CLEAR DAY", "Remove all logs?", [
          { text: "Cancel", style: "cancel" },
          { text: "Clear", style: "destructive", onPress: async () => {
              const newPlan = [...weeklyPlan]; newPlan[dayIdx].workouts = [];
              setWeeklyPlan(newPlan); calculateStats(newPlan); await AsyncStorage.setItem('user_weekly_plan', JSON.stringify(newPlan));
          }}
      ]);
  };

  // Helper to determine icon
  const getIcon = (type: string) => {
      if (type === 'RUN') return 'stopwatch';
      if (type === 'STATION') return 'barbell';
      return 'fitness'; // Default / Gym
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
            <Text style={styles.headerTitle}>WEEKLY <Text style={{color: '#FFD700'}}>PROTOCOL</Text></Text>
            <Text style={styles.headerSub}>SCHEDULE & LOGS</Text>
        </View>
        <View style={{width: 40}} /> 
      </View>

      {/* STATS STRIP */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
            <Text style={styles.statNum}>{stats.completed}</Text>
            <Text style={styles.statLabel}>COMPLETED</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
            <Text style={styles.statNum}>{stats.xp}</Text>
            <Text style={styles.statLabel}>XP EARNED</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {weeklyPlan.map((day, idx) => {
          const hasWorkouts = day.workouts && day.workouts.length > 0;
          return (
            <View key={idx} style={styles.dayContainer}>
              {/* Day Header Row */}
              <View style={styles.dayHeader}>
                  <Text style={[styles.dayLabel, hasWorkouts && {color: '#FFD700'}]}>{day.day}</Text>
                  
                  {/* Action Buttons (Right Aligned) */}
                  <View style={{flexDirection: 'row', gap: 10}}>
                      <TouchableOpacity onPress={() => { setSelectedDayIdx(idx); setLogModalOpen(true); }} style={styles.iconAction}>
                          <Ionicons name="add" size={18} color="#666" />
                      </TouchableOpacity>
                      {hasWorkouts && (
                          <TouchableOpacity onPress={() => clearDay(idx)} style={styles.iconAction}>
                              <Ionicons name="trash-outline" size={16} color="#444" />
                          </TouchableOpacity>
                      )}
                  </View>
              </View>

              {/* Logs List (Compact) */}
              {!hasWorkouts ? (
                  <View style={styles.emptyLine} />
              ) : (
                  <View style={styles.logsList}>
                      {day.workouts.map((wk: any, i: number) => (
                          <TouchableOpacity 
                              key={i} 
                              style={styles.logRow}
                              activeOpacity={0.7}
                              onPress={() => router.push({
                                  pathname: "/manual_log_details",
                                  params: { 
                                      type: wk.type || 'WORKOUT', 
                                      totalTime: wk.result || wk.timestamp, 
                                      date: day.day, 
                                      note: wk.note,
                                      unit: wk.unit || 'TIME'
                                  }
                              })}
                          >
                              {/* Icon */}
                              <View style={styles.logIcon}>
                                  <Ionicons name={getIcon(wk.type) as any} size={16} color="#000" />
                              </View>
                              
                              {/* Text Info */}
                              <View style={styles.logInfo}>
                                  <Text style={styles.logTitle}>{wk.title}</Text>
                                  <Text style={styles.logTime}>{wk.timestamp}</Text>
                              </View>

                              {/* Arrow */}
                              <Ionicons name="chevron-forward" size={14} color="#444" />
                          </TouchableOpacity>
                      ))}
                  </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* MODAL */}
      <Modal visible={isLogModalOpen} animationType="slide" transparent>
        <BlurView intensity={90} tint="dark" style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>SELECT MISSION</Text>
                    <TouchableOpacity onPress={() => setLogModalOpen(false)}>
                        <Ionicons name="close" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                    {ALL_WORKOUTS.map((wk: any) => (
                        <TouchableOpacity key={wk.id} style={styles.optionCard} onPress={() => logWorkoutToDay(wk)}>
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
  statNum: { color: '#fff', fontSize: 20, fontWeight: '900' },
  statLabel: { color: '#666', fontSize: 8, fontWeight: 'bold', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#333' },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
  
  dayContainer: { marginBottom: 20 },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  dayLabel: { color: '#666', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  iconAction: { padding: 5 },
  
  emptyLine: { height: 1, backgroundColor: '#222', marginTop: 5 },

  logsList: { gap: 8 },
  logRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#161616', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#222' },
  logIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFD700', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  logInfo: { flex: 1 },
  logTitle: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  logTime: { color: '#666', fontSize: 10, marginTop: 2 },

  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#121212', height: '80%', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  optionCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, backgroundColor: '#1E1E1E', borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#333' },
  optionTitle: { color: '#fff', fontSize: 16, fontWeight: '900', fontStyle: 'italic' },
  optionSub: { color: '#666', fontSize: 11, marginTop: 2 }
});