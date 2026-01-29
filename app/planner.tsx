import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Modal, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// --- TYPES ---
type WorkoutType = 'Run' | 'Strength' | 'Hybrid' | 'Hyrox' | 'Recovery';

interface PlanDay {
  day: string;
  fullDay: string;
  type: WorkoutType;
  title: string;
  subtitle: string;
  duration: string; // e.g. "60"
  rpe: string; // 1-10
  complete: boolean;
}

// --- CONFIG ---
const WORKOUT_TYPES: { id: WorkoutType; color: string; icon: any }[] = [
  { id: 'Run', color: '#007AFF', icon: 'footsteps' },
  { id: 'Strength', color: '#FF3B30', icon: 'barbell' },
  { id: 'Hybrid', color: '#FFD700', icon: 'flash' },
  { id: 'Hyrox', color: '#FF9500', icon: 'trophy' },
  { id: 'Recovery', color: '#32D74B', icon: 'pulse' },
];

export default function Planner() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [weekPlan, setWeekPlan] = useState<PlanDay[]>([]);
  const [editingDay, setEditingDay] = useState<PlanDay | null>(null);
  const [stats, setStats] = useState({ completed: 0, total: 0, hours: 0 });

  // --- LOAD DATA ---
  useFocusEffect(
    useCallback(() => {
      loadSchedule();
    }, [])
  );

  const loadSchedule = async () => {
    try {
      const json = await AsyncStorage.getItem('user_weekly_plan');
      const profileJson = await AsyncStorage.getItem('user_profile');
      const profile = profileJson ? JSON.parse(profileJson) : { primaryGoal: 'BALANCED' };

      if (json) {
        let data = JSON.parse(json);
        
        // MIGRATION: If old data format (simple strings), upgrade it to Pro format
        if (!data[0].title) {
          data = upgradeToProPlan(data, profile.primaryGoal);
        }
        
        setWeekPlan(data);
        calculateStats(data);
      }
    } catch (e) {
      console.log(e);
    }
  };

  // Helper to upgrade simple data to detailed data
  const upgradeToProPlan = (simpleData: any[], goal: string) => {
    return simpleData.map((d: any) => ({
      ...d,
      fullDay: getFullDay(d.day),
      title: d.focus || 'WORKOUT',
      subtitle: getSmartDescription(d.type, goal),
      duration: d.type === 'Recovery' ? '30' : '60',
      rpe: d.type === 'Recovery' ? '3' : '8',
    }));
  };

  const getFullDay = (short: string) => {
    const map: any = { MON: 'MONDAY', TUE: 'TUESDAY', WED: 'WEDNESDAY', THU: 'THURSDAY', FRI: 'FRIDAY', SAT: 'SATURDAY', SUN: 'SUNDAY' };
    return map[short] || short;
  };

  const getSmartDescription = (type: string, goal: string) => {
    if (type === 'Run') return goal === 'ENGINE' ? 'Zone 2 Capacity work' : 'Interval Sprints';
    if (type === 'Strength') return goal === 'STRENGTH' ? 'Heavy compounds (5x5)' : 'High volume hypertrophy';
    if (type === 'Hyrox') return 'Full race simulation';
    if (type === 'Recovery') return 'Mobility & light flush';
    return 'Mixed modal session';
  };

  const calculateStats = (data: PlanDay[]) => {
    const completed = data.filter(d => d.complete).length;
    const totalMins = data.reduce((acc, curr) => acc + (parseInt(curr.duration) || 0), 0);
    setStats({
      completed,
      total: data.length,
      hours: Math.round(totalMins / 60)
    });
  };

  // --- ACTIONS ---
  const toggleComplete = async (index: number) => {
    const newData = [...weekPlan];
    newData[index].complete = !newData[index].complete;
    setWeekPlan(newData);
    calculateStats(newData);
    await AsyncStorage.setItem('user_weekly_plan', JSON.stringify(newData));
  };

  const saveEdit = async () => {
    if (!editingDay) return;
    
    const newData = weekPlan.map(d => d.day === editingDay.day ? editingDay : d);
    setWeekPlan(newData);
    calculateStats(newData);
    await AsyncStorage.setItem('user_weekly_plan', JSON.stringify(newData));
    setEditingDay(null);
  };

  const updateEditField = (field: keyof PlanDay, value: any) => {
    if (editingDay) {
      setEditingDay({ ...editingDay, [field]: value });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>WEEKLY PROTOCOL</Text>
        <View style={{ width: 40 }} /> 
      </View>

      {/* STATS BAR */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.completed}/{stats.total}</Text>
            <Text style={styles.statLabel}>COMPLETE</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.hours}h</Text>
            <Text style={styles.statLabel}>VOLUME</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
            <Text style={styles.statValue}>{Math.round((stats.completed/stats.total)*100)}%</Text>
            <Text style={styles.statLabel}>ADHERENCE</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {weekPlan.map((item, index) => {
          const typeConfig = WORKOUT_TYPES.find(t => t.id === item.type) || WORKOUT_TYPES[2];
          
          return (
            <TouchableOpacity 
              key={index} 
              style={[styles.card, item.complete && styles.cardComplete]} 
              activeOpacity={0.9}
              onPress={() => setEditingDay(item)}
            >
              {/* Left Stripe */}
              <View style={[styles.cardStripe, { backgroundColor: typeConfig.color }]} />
              
              <View style={styles.cardContent}>
                {/* Date & Checkbox */}
                <View style={styles.cardTop}>
                  <Text style={[styles.dayText, item.complete && { color: '#666' }]}>{item.fullDay}</Text>
                  <TouchableOpacity onPress={() => toggleComplete(index)} hitSlop={20}>
                     <Ionicons 
                        name={item.complete ? "checkbox" : "square-outline"} 
                        size={24} 
                        color={item.complete ? "#FFD700" : "#666"} 
                     />
                  </TouchableOpacity>
                </View>

                {/* Main Content */}
                <View style={styles.cardMain}>
                    <Text style={[styles.cardTitle, item.complete && styles.textComplete]}>{item.title}</Text>
                    <Text style={styles.cardSub} numberOfLines={1}>{item.subtitle}</Text>
                </View>

                {/* Footer Badges */}
                <View style={styles.cardFooter}>
                    <View style={[styles.badge, { borderColor: typeConfig.color }]}>
                        <Ionicons name={typeConfig.icon} size={10} color={typeConfig.color} />
                        <Text style={[styles.badgeText, { color: typeConfig.color }]}>{item.type.toUpperCase()}</Text>
                    </View>
                    <View style={styles.badge}>
                        <Ionicons name="time-outline" size={10} color="#666" />
                        <Text style={styles.badgeText}>{item.duration} MIN</Text>
                    </View>
                    <View style={styles.badge}>
                        <Text style={[styles.badgeText, { color: '#FFD700' }]}>RPE {item.rpe}</Text>
                    </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* --- EDIT MODAL --- */}
      <Modal visible={!!editingDay} animationType="slide" transparent>
        <BlurView intensity={80} tint="dark" style={styles.modalContainer}>
           <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
              
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>EDIT SESSION</Text>
                <TouchableOpacity onPress={() => setEditingDay(null)} style={styles.closeBtn}>
                    <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              {editingDay && (
                <ScrollView showsVerticalScrollIndicator={false}>
                    {/* TYPE SELECTOR */}
                    <Text style={styles.inputLabel}>SESSION TYPE</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
                        {WORKOUT_TYPES.map(t => (
                            <TouchableOpacity 
                                key={t.id} 
                                style={[styles.typeOption, editingDay.type === t.id && { backgroundColor: t.color, borderColor: t.color }]}
                                onPress={() => updateEditField('type', t.id)}
                            >
                                <Ionicons name={t.icon} size={20} color={editingDay.type === t.id ? '#000' : '#fff'} />
                                <Text style={[styles.typeOptionText, editingDay.type === t.id && { color: '#000' }]}>{t.id}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* TEXT INPUTS */}
                    <Text style={styles.inputLabel}>FOCUS TITLE</Text>
                    <TextInput 
                        style={styles.input} 
                        value={editingDay.title}
                        onChangeText={(t) => updateEditField('title', t)}
                    />

                    <Text style={styles.inputLabel}>DETAILS / EXERCISES</Text>
                    <TextInput 
                        style={[styles.input, { height: 80, paddingTop: 15 }]} 
                        value={editingDay.subtitle}
                        multiline
                        onChangeText={(t) => updateEditField('subtitle', t)}
                    />

                    <View style={{ flexDirection: 'row', gap: 15 }}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.inputLabel}>DURATION (MIN)</Text>
                            <TextInput 
                                style={styles.input} 
                                value={editingDay.duration}
                                keyboardType="numeric"
                                onChangeText={(t) => updateEditField('duration', t)}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.inputLabel}>INTENSITY (RPE 1-10)</Text>
                            <TextInput 
                                style={styles.input} 
                                value={editingDay.rpe}
                                keyboardType="numeric"
                                maxLength={2}
                                onChangeText={(t) => updateEditField('rpe', t)}
                            />
                        </View>
                    </View>

                    <TouchableOpacity style={styles.saveBtn} onPress={saveEdit}>
                        <Text style={styles.saveBtnText}>SAVE CHANGES</Text>
                    </TouchableOpacity>
                </ScrollView>
              )}
           </View>
        </BlurView>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 20 },
  backBtn: { padding: 8, backgroundColor: '#1E1E1E', borderRadius: 12 },
  headerTitle: { color: '#FFD700', fontSize: 16, fontWeight: '900', letterSpacing: 1 },

  // STATS
  statsBar: { flexDirection: 'row', backgroundColor: '#1E1E1E', marginHorizontal: 20, padding: 15, borderRadius: 15, marginBottom: 20, justifyContent: 'space-between', borderWidth: 1, borderColor: '#333' },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { color: '#fff', fontSize: 18, fontWeight: '900' },
  statLabel: { color: '#666', fontSize: 9, fontWeight: 'bold', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#333' },

  // CARDS
  card: { flexDirection: 'row', backgroundColor: '#1E1E1E', marginHorizontal: 20, marginBottom: 12, borderRadius: 12, overflow: 'hidden', height: 110, borderWidth: 1, borderColor: '#252525' },
  cardComplete: { opacity: 0.6, borderColor: '#333' },
  cardStripe: { width: 6, height: '100%' },
  cardContent: { flex: 1, padding: 15, justifyContent: 'space-between' },
  
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dayText: { color: '#888', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  
  cardMain: { marginVertical: 4 },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: '900', marginBottom: 2 },
  textComplete: { textDecorationLine: 'line-through', color: '#666' },
  cardSub: { color: '#888', fontSize: 12 },

  cardFooter: { flexDirection: 'row', gap: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#333', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { color: '#666', fontSize: 9, fontWeight: 'bold' },

  // MODAL
  modalContainer: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { height: '85%', backgroundColor: '#121212', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: 1 },
  closeBtn: { padding: 5 },

  inputLabel: { color: '#FFD700', fontSize: 10, fontWeight: '900', marginBottom: 8, marginTop: 15 },
  input: { backgroundColor: '#1E1E1E', borderRadius: 12, padding: 15, color: '#fff', fontSize: 16, borderWidth: 1, borderColor: '#333' },
  
  typeScroll: { flexDirection: 'row', gap: 10, marginBottom: 5 },
  typeOption: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#333', marginRight: 10 },
  typeOptionText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },

  saveBtn: { backgroundColor: '#FFD700', marginTop: 40, padding: 20, borderRadius: 20, alignItems: 'center', marginBottom: 20 },
  saveBtnText: { color: '#000', fontWeight: '900', fontSize: 16 },
});