import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Dimensions, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RANKS, calculateLevel } from '../utils/gamification';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function Progress() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // REAL STATE
  const [name, setName] = useState('ATHLETE'); // Added Name State
  const [stats, setStats] = useState({
    xp: 0,
    workoutsDone: 0,
    labSessions: 0,
    runVolume: 0,
    sledVolume: 0
  });

  const [pbs, setPbs] = useState({
    run5k: '',
    sledPush: '',
    roxzone: '',
    wallBalls: '',
    raceSim: ''
  });
  
  const [rankData, setRankData] = useState<any>(null);
  const [showRanksModal, setShowRanksModal] = useState(false);
  const [showEditPBModal, setShowEditPBModal] = useState(false);
  const [editingPbs, setEditingPbs] = useState({...pbs});

  useFocusEffect(
    useCallback(() => {
      loadCareerData();
    }, [])
  );

  const loadCareerData = async () => {
    try {
      // 1. GET PROFILE (Name)
      const profileJson = await AsyncStorage.getItem('user_profile');
      if (profileJson) {
          const profile = JSON.parse(profileJson);
          if (profile.name) setName(profile.name.toUpperCase());
      }

      // 2. AGGREGATE STATS (Planner + History/Lab)
      const planJson = await AsyncStorage.getItem('user_weekly_plan');
      const plan = planJson ? JSON.parse(planJson) : [];
      
      // Load History (This now contains data from templates.tsx)
      const historyJson = await AsyncStorage.getItem('user_history_stats');
      const history = historyJson ? JSON.parse(historyJson) : { xp: 0, workouts: 0, run: 0, sled: 0, lab: 0 };

      // Calculate Current Week Stats
      let weeklyXP = 0;
      let weeklyRun = 0;
      let weeklyWorkouts = 0;

      plan.forEach((day: any) => {
        if (day.complete) {
            weeklyWorkouts += 1;
            weeklyXP += 100;
            if (day.type === 'Run' || day.type === 'Hybrid') weeklyRun += 5;
        }
      });

      // Combine Week + History
      const totalXP = history.xp + weeklyXP;
      
      setStats({
        xp: totalXP,
        workoutsDone: (history.workouts || 0) + weeklyWorkouts,
        labSessions: history.lab || 0, // Loads real lab count from templates.tsx
        runVolume: (history.run || 0) + weeklyRun, // Loads real run km from templates.tsx
        sledVolume: (history.sled || 0) // Loads real sled km from templates.tsx
      });
      setRankData(calculateLevel(totalXP));

      // 3. LOAD PBs
      const pbsJson = await AsyncStorage.getItem('user_pbs');
      let currentPbs = pbsJson ? JSON.parse(pbsJson) : {};

      const raceHistoryJson = await AsyncStorage.getItem('raceHistory');
      if (raceHistoryJson) {
          const races = JSON.parse(raceHistoryJson);
          if (races.length > 0) {
              const bestRace = races.sort((a: any, b: any) => {
                  const [m1, s1] = a.totalTime.split(':').map(Number);
                  const [m2, s2] = b.totalTime.split(':').map(Number);
                  return (m1 * 60 + s1) - (m2 * 60 + s2);
              })[0];
              currentPbs.raceSim = bestRace.totalTime;
          }
      }
      setPbs(currentPbs);

    } catch (e) {
      console.log('Error calculating stats', e);
    }
  };

  const handleEditOpen = () => {
    setEditingPbs({...pbs});
    setShowEditPBModal(true);
  };

  const savePBs = async () => {
    try {
        await AsyncStorage.setItem('user_pbs', JSON.stringify(editingPbs));
        setPbs(editingPbs);
        setShowEditPBModal(false);
    } catch (e) {
        console.log("Error saving PBs", e);
    }
  };

  if (!rankData) return <View style={styles.container} />;

  return (
    <View style={styles.container}>
      
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        {/* NAME IN HEADER */}
        <View style={{alignItems: 'center'}}>
            <Text style={styles.headerLabel}>OPERATOR</Text>
            <Text style={styles.headerTitle}>{name}</Text>
        </View>
        
        <View style={{width: 40}} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        
        {/* 1. IDENTITY & LEVEL CARD */}
        <View style={styles.identityCard}>
          <View style={styles.cardHeaderRow}>
             <View>
                 <Text style={styles.rankLabel}>CURRENT RANK</Text>
                 <Text style={styles.rankTitle}>{rankData.currentRank.title}</Text>
             </View>
             <View style={styles.xpBadge}>
                <Text style={styles.xpText}>{stats.xp} XP</Text>
             </View>
          </View>

          <View style={styles.levelContainer}>
            <View style={styles.levelInfo}>
                <Text style={styles.levelSub}>LEVEL {rankData.currentRank.id}</Text>
                {rankData.nextRank ? (
                     <Text style={styles.levelNext}>{rankData.xpNeeded} XP TO PROMOTION</Text>
                ) : (
                    <Text style={styles.levelNext}>MAX RANK ACHIEVED</Text>
                )}
            </View>
            <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${rankData.progress * 100}%` }]} />
            </View>
          </View>

          <TouchableOpacity style={styles.viewPathBtn} onPress={() => setShowRanksModal(true)}>
             <Text style={styles.viewPathText}>VIEW PROMOTION PATH</Text>
             <Ionicons name="chevron-forward" size={12} color="#000" />
          </TouchableOpacity>
        </View>

        {/* 2. CAREER VOLUME GRID */}
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>SERVICE RECORD</Text>
        </View>

        <View style={styles.statsGrid}>
           <View style={styles.statBox}>
              <Text style={styles.statNum}>{stats.workoutsDone}</Text>
              <Text style={styles.statLabel}>TOTAL OPS</Text>
           </View>
           <View style={styles.statBox}>
              <Text style={styles.statNum}>{stats.labSessions}</Text>
              <Text style={styles.statLabel}>LAB SESSIONS</Text>
           </View>
           <View style={styles.statBox}>
              <Text style={styles.statNum}>{stats.runVolume.toFixed(1)}<Text style={styles.unit}>km</Text></Text>
              <Text style={styles.statLabel}>DISTANCE</Text>
           </View>
        </View>

        {/* 3. TROPHY CASE */}
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>TROPHY CASE</Text>
            <TouchableOpacity onPress={handleEditOpen}>
                <Text style={styles.editLink}>EDIT</Text>
            </TouchableOpacity>
        </View>

        <View style={styles.pbGrid}>
            <View style={[styles.pbCard, {borderColor: '#FFD700'}]}>
                <Text style={[styles.pbLabel, {color: '#FFD700'}]}>SIMULATOR PB</Text>
                <Text style={[styles.pbValue, {color: '#fff'}]}>{pbs.raceSim || '--:--'}</Text>
                <View style={{position: 'absolute', top: 10, right: 10}}>
                    <Ionicons name="trophy" size={16} color="#FFD700" />
                </View>
            </View>
            <View style={styles.pbCard}>
                <Text style={styles.pbLabel}>5K RUN</Text>
                <Text style={styles.pbValue}>{pbs.run5k || '--:--'}</Text>
            </View>
            <View style={styles.pbCard}>
                <Text style={styles.pbLabel}>SLED PUSH</Text>
                <Text style={styles.pbValue}>{pbs.sledPush || '--'} KG</Text>
            </View>
            <View style={styles.pbCard}>
                <Text style={styles.pbLabel}>ROXZONE</Text>
                <Text style={styles.pbValue}>{pbs.roxzone || '--:--'}</Text>
            </View>
        </View>

      </ScrollView>

      {/* --- PROMOTION PATH MODAL --- */}
      <Modal visible={showRanksModal} animationType="slide" transparent>
        <BlurView intensity={90} tint="dark" style={styles.modalContainer}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>CAREER PATH</Text>
                    <TouchableOpacity onPress={() => setShowRanksModal(false)} style={styles.closeBtn}>
                        <Ionicons name="close" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                    {RANKS.map((rank: any, index: number) => {
                        const isUnlocked = stats.xp >= rank.minXP;
                        return (
                            <View key={rank.id} style={[styles.rankRow, isUnlocked ? styles.rankUnlocked : styles.rankLocked]}>
                                <View style={styles.rankIcon}>
                                    <Ionicons name={isUnlocked ? "checkmark-circle" : "lock-closed"} size={isUnlocked ? 24 : 20} color={isUnlocked ? "#000" : "#666"} />
                                </View>
                                <View style={{flex: 1}}>
                                    <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                                        <Text style={[styles.rankRowTitle, isUnlocked && {color: '#000'}]}>{rank.title}</Text>
                                        <Text style={[styles.rankRowXP, isUnlocked && {color: '#333'}]}>{rank.minXP} XP</Text>
                                    </View>
                                    <Text style={[styles.rankRowBen, isUnlocked && {color: '#333'}]}>Unlocks: {rank.benefit}</Text>
                                </View>
                            </View>
                        );
                    })}
                </ScrollView>
            </View>
        </BlurView>
      </Modal>

      {/* --- EDIT PBS MODAL --- */}
      <Modal visible={showEditPBModal} animationType="slide" transparent>
        <BlurView intensity={90} tint="dark" style={styles.modalContainer}>
            <View style={[styles.modalContent, {height: '70%'}]}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>UPDATE RECORDS</Text>
                    <TouchableOpacity onPress={() => setShowEditPBModal(false)} style={styles.closeBtn}>
                        <Ionicons name="close" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                    
                    <View style={{opacity: 0.5, marginBottom: 20}}>
                        <Text style={styles.inputLabel}>RACE SIMULATOR BEST (AUTO)</Text>
                        <TextInput 
                            style={styles.input} 
                            value={editingPbs.raceSim || "No Data Yet"}
                            editable={false}
                        />
                        <Text style={{color: '#666', fontSize: 10, marginTop: 5}}>Generated automatically from Race Simulator.</Text>
                    </View>

                    <Text style={styles.inputLabel}>5K RUN TIME</Text>
                    <TextInput 
                        style={styles.input} 
                        placeholder="20:00" 
                        placeholderTextColor="#444"
                        value={editingPbs.run5k}
                        onChangeText={(t) => setEditingPbs({...editingPbs, run5k: t})}
                    />

                    <Text style={styles.inputLabel}>HEAVY SLED PUSH (KG)</Text>
                    <TextInput 
                        style={styles.input} 
                        placeholder="150" 
                        placeholderTextColor="#444"
                        keyboardType="numeric"
                        value={editingPbs.sledPush}
                        onChangeText={(t) => setEditingPbs({...editingPbs, sledPush: t})}
                    />

                    <Text style={styles.inputLabel}>ROXZONE AVG PACE</Text>
                    <TextInput 
                        style={styles.input} 
                        placeholder="4:30" 
                        placeholderTextColor="#444"
                        value={editingPbs.roxzone}
                        onChangeText={(t) => setEditingPbs({...editingPbs, roxzone: t})}
                    />

                    <TouchableOpacity style={styles.saveBtn} onPress={savePBs}>
                        <Text style={styles.saveBtnText}>SAVE RECORDS</Text>
                    </TouchableOpacity>
                    
                </ScrollView>
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
  headerLabel: { color: '#666', fontSize: 9, fontWeight: 'bold' },

  // IDENTITY
  identityCard: { backgroundColor: '#1E1E1E', marginHorizontal: 20, padding: 20, borderRadius: 20, marginBottom: 25, borderWidth: 1, borderColor: '#333' },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  rankLabel: { color: '#666', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  rankTitle: { color: '#fff', fontSize: 28, fontWeight: '900', fontStyle: 'italic', marginTop: 4 },
  xpBadge: { backgroundColor: '#333', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  xpText: { color: '#FFD700', fontWeight: 'bold', fontSize: 12 },

  levelContainer: { marginBottom: 20 },
  levelInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  levelSub: { color: '#FFD700', fontSize: 12, fontWeight: '900' },
  levelNext: { color: '#666', fontSize: 10, fontWeight: 'bold' },
  progressBarBg: { height: 8, backgroundColor: '#333', borderRadius: 4 },
  progressBarFill: { height: '100%', backgroundColor: '#FFD700', borderRadius: 4 },

  viewPathBtn: { backgroundColor: '#FFD700', borderRadius: 12, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  viewPathText: { color: '#000', fontWeight: '900', fontSize: 10, letterSpacing: 1 },

  // STATS GRID
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, marginBottom: 15 },
  sectionTitle: { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  editLink: { color: '#FFD700', fontSize: 10, fontWeight: 'bold' },
  
  statsGrid: { flexDirection: 'row', marginHorizontal: 20, gap: 10, marginBottom: 30 },
  statBox: { flex: 1, backgroundColor: '#121212', padding: 15, borderRadius: 15, alignItems: 'center', borderWidth: 1, borderColor: '#222' },
  statNum: { color: '#fff', fontSize: 20, fontWeight: '900' },
  statLabel: { color: '#666', fontSize: 9, fontWeight: 'bold', marginTop: 4 },
  unit: { fontSize: 10, color: '#444' },

  // PBs
  pbGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 10 },
  pbCard: { width: (SCREEN_WIDTH - 50) / 2, backgroundColor: '#1E1E1E', padding: 15, borderRadius: 15, borderWidth: 1, borderColor: '#333' },
  pbLabel: { color: '#666', fontSize: 10, fontWeight: '900', marginBottom: 8 },
  pbValue: { color: '#fff', fontSize: 20, fontWeight: '900' },

  // MODAL
  modalContainer: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { height: '80%', backgroundColor: '#121212', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  closeBtn: { padding: 5 },

  rankRow: { flexDirection: 'row', padding: 15, marginBottom: 10, borderRadius: 15, alignItems: 'center', gap: 15 },
  rankUnlocked: { backgroundColor: '#FFD700' },
  rankLocked: { backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: '#333' },
  rankIcon: { width: 30, alignItems: 'center' },
  rankRowTitle: { fontSize: 16, fontWeight: '900', color: '#666' },
  rankRowXP: { fontSize: 12, fontWeight: 'bold', color: '#444' },
  rankRowBen: { fontSize: 11, color: '#666', marginTop: 2 },

  // INPUTS
  inputLabel: { color: '#FFD700', fontSize: 10, fontWeight: '900', marginBottom: 8, marginTop: 15 },
  input: { backgroundColor: '#1E1E1E', borderRadius: 12, padding: 15, color: '#fff', fontSize: 16, borderWidth: 1, borderColor: '#333' },
  saveBtn: { backgroundColor: '#FFD700', marginTop: 30, padding: 20, borderRadius: 20, alignItems: 'center', marginBottom: 20 },
  saveBtnText: { color: '#000', fontWeight: '900', fontSize: 16 },
});