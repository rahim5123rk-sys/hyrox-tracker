import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DEFAULT_PLAN = [
  { day: 'MON', focus: 'LOWER BODY', type: 'Strength', complete: false },
  { day: 'TUE', focus: 'ZONE 2', type: 'Run', complete: false },
  { day: 'WED', focus: 'UPPER BODY', type: 'Strength', complete: false },
  { day: 'THU', focus: 'INTERVALS', type: 'Run', complete: false },
  { day: 'FRI', focus: 'FULL BODY', type: 'Hybrid', complete: false },
  { day: 'SAT', focus: 'SIMULATION', type: 'Hyrox', complete: false },
  { day: 'SUN', focus: 'REST', type: 'Recovery', complete: false },
];

export default function Planner() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [weeklyPlan, setWeeklyPlan] = useState(DEFAULT_PLAN);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDay, setEditingDay] = useState<any>(null);
  const [tempFocus, setTempFocus] = useState('');
  const [tempType, setTempType] = useState('');

  useEffect(() => {
    loadPlan();
  }, []);

  const loadPlan = async () => {
    const saved = await AsyncStorage.getItem('user_weekly_plan');
    if (saved) setWeeklyPlan(JSON.parse(saved));
  };

  const savePlan = async (newPlan: any) => {
    setWeeklyPlan(newPlan);
    await AsyncStorage.setItem('user_weekly_plan', JSON.stringify(newPlan));
  };

  const openEditModal = (index: number) => {
    const day = weeklyPlan[index];
    setEditingDay({ ...day, index });
    setTempFocus(day.focus);
    setTempType(day.type);
    setModalVisible(true);
  };

  const saveDayEdit = () => {
    const updated = [...weeklyPlan];
    updated[editingDay.index] = { ...updated[editingDay.index], focus: tempFocus, type: tempType };
    savePlan(updated);
    setModalVisible(false);
  };

  const toggleComplete = (index: number) => {
    const updated = [...weeklyPlan];
    updated[index].complete = !updated[index].complete;
    savePlan(updated);
  };

  const completedCount = weeklyPlan.filter(d => d.complete).length;
  const progress = completedCount / 7;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backLink}>← DASHBOARD</Text>
        </TouchableOpacity>
        <Text style={styles.title}>BATTLE <Text style={{color: '#FFD700'}}>PLAN</Text></Text>
        <Text style={styles.subtitle}>WEEKLY OPERATIONAL SCHEDULE</Text>
      </View>

      {/* PROGRESS CARD */}
      <View style={styles.progressCard}>
        <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>WEEKLY COMPLETION</Text>
            <Text style={styles.progressValue}>{Math.round(progress * 100)}%</Text>
        </View>
        <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {weeklyPlan.map((day, i) => (
          <TouchableOpacity 
            key={i} 
            style={[styles.dayRow, day.complete && styles.dayRowComplete]}
            onPress={() => toggleComplete(i)}
            onLongPress={() => openEditModal(i)}
            delayLongPress={200}
          >
            <View style={styles.dayLeft}>
                <View style={[styles.checkCircle, day.complete && styles.checkCircleActive]}>
                    {day.complete && <Ionicons name="checkmark" size={16} color="#000" />}
                </View>
                <View>
                    <Text style={[styles.dayName, day.complete && {color: '#000'}]}>{day.day}</Text>
                    <Text style={[styles.dayType, day.complete && {color: '#333'}]}>{day.type}</Text>
                </View>
            </View>

            <View style={styles.dayRight}>
                <Text style={[styles.dayFocus, day.complete && {color: '#000'}]}>{day.focus}</Text>
                <TouchableOpacity onPress={() => openEditModal(i)} style={styles.editIcon}>
                     <Ionicons name="ellipsis-horizontal" size={16} color={day.complete ? "#333" : "#666"} />
                </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
        <View style={{height: 50}} />
      </ScrollView>

      {/* EDIT MODAL */}
      <Modal visible={modalVisible} transparent={true} animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>EDIT {editingDay?.day}</Text>
                
                <Text style={styles.inputLabel}>PRIMARY FOCUS</Text>
                <TextInput style={styles.input} value={tempFocus} onChangeText={setTempFocus} />

                <Text style={styles.inputLabel}>SESSION TYPE</Text>
                <TextInput style={styles.input} value={tempType} onChangeText={setTempType} />

                <View style={styles.modalActions}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                        <Text style={styles.cancelText}>CANCEL</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.saveBtn} onPress={saveDayEdit}>
                        <Text style={styles.saveText}>SAVE CHANGES</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { paddingHorizontal: 25, paddingBottom: 20, backgroundColor: '#121212', borderBottomWidth: 1, borderBottomColor: '#222' },
  backBtn: { marginBottom: 15 },
  backLink: { color: '#FFD700', fontWeight: '900', fontSize: 11, letterSpacing: 1 },
  title: { color: '#fff', fontSize: 32, fontWeight: '900', fontStyle: 'italic', letterSpacing: -1 },
  subtitle: { color: '#666', fontSize: 11, fontWeight: 'bold', letterSpacing: 1, marginTop: 4 },
  
  progressCard: { margin: 20, padding: 20, backgroundColor: '#1E1E1E', borderRadius: 20, borderWidth: 1, borderColor: '#333' },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressLabel: { color: '#888', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  progressValue: { color: '#FFD700', fontSize: 12, fontWeight: '900' },
  progressBarBg: { height: 8, backgroundColor: '#333', borderRadius: 4 },
  progressBarFill: { height: '100%', backgroundColor: '#FFD700', borderRadius: 4 },

  scroll: { padding: 20 },
  dayRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#121212', borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#222' },
  dayRowComplete: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
  dayLeft: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  checkCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#444', justifyContent: 'center', alignItems: 'center' },
  checkCircleActive: { borderColor: '#000', backgroundColor: 'rgba(255,255,255,0.2)' },
  dayName: { color: '#fff', fontSize: 14, fontWeight: '900' },
  dayType: { color: '#666', fontSize: 10, fontWeight: 'bold' },
  dayRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dayFocus: { color: '#ccc', fontSize: 12, fontWeight: 'bold', textAlign: 'right' },
  editIcon: { padding: 5 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#1E1E1E', padding: 25, borderRadius: 25, borderWidth: 1, borderColor: '#333' },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '900', fontStyle: 'italic', marginBottom: 20 },
  inputLabel: { color: '#666', fontSize: 10, fontWeight: '900', marginBottom: 8 },
  input: { backgroundColor: '#121212', color: '#fff', padding: 15, borderRadius: 12, marginBottom: 20, fontWeight: 'bold', borderWidth: 1, borderColor: '#333' },
  modalActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, padding: 15, backgroundColor: '#333', borderRadius: 12, alignItems: 'center' },
  cancelText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  saveBtn: { flex: 1, padding: 15, backgroundColor: '#FFD700', borderRadius: 12, alignItems: 'center' },
  saveText: { color: '#000', fontWeight: 'bold', fontSize: 12 },
});