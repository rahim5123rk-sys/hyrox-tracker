import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Modal, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// --- DATA: EXPANDED MASTER WORKOUT LIBRARY ---
const ALL_WORKOUTS = [
  // =======================================================
  // 1. HYBRID / FULL RACE SIMULATIONS
  // =======================================================
  { 
    id: 'hyb_1', title: 'THE PUNISHER', station: 'HYBRID', type: 'COMPROMISED', level: 'ADVANCED',
    desc: 'Strict continuous movement. No rest between runs and stations.',
    steps: ['1km Run (Fast)', '50m Sled Push (Heavy)', '1km Run (Fast)', '20 Burpees'],
    rounds: 'Repeat 4 Rounds',
    stats: { xp: 450, runKm: 8, sledKm: 0.2 } 
  },
  { 
    id: 'hyb_2', title: 'ENGINE ROOM', station: 'HYBRID', type: 'ENDURANCE', level: 'INTERMEDIATE',
    desc: 'Target Race Pace. Practice moving through stations without stopping.',
    steps: ['1km Run (Race Pace)', '500m Row (Steady)', '1km Run (Race Pace)', '100m Farmers Carry'],
    rounds: 'Repeat 4 Rounds',
    stats: { xp: 400, runKm: 8, sledKm: 0 }
  },
  { 
    id: 'hyb_3', title: 'ROXZONE SPRINT', station: 'HYBRID', type: 'SPEED', level: 'ELITE',
    desc: 'Focus on transition speed. Minimal air between tasks.',
    steps: ['400m Sprint', '15 Wall Balls', '400m Sprint', '10m Sled Pull'],
    rounds: 'Repeat 6 Rounds',
    stats: { xp: 350, runKm: 4.8, sledKm: 0.06 }
  },
  { 
    id: 'hyb_4', title: 'THE HALF SIM (A)', station: 'HYBRID', type: 'SIMULATION', level: 'ADVANCED',
    desc: 'The first half of a standard Hyrox race.',
    steps: ['1km Run', '1000m Ski', '1km Run', '50m Sled Push', '1km Run', '50m Sled Pull', '1km Run', '80m Burpees'],
    rounds: '1 Round For Time',
    stats: { xp: 500, runKm: 4, sledKm: 0.1 }
  },
  { 
    id: 'hyb_5', title: 'THE HALF SIM (B)', station: 'HYBRID', type: 'SIMULATION', level: 'ADVANCED',
    desc: 'The second half of a standard Hyrox race.',
    steps: ['1km Run', '1000m Row', '1km Run', '200m Farmers', '1km Run', '100m Lunges', '1km Run', '100 Wall Balls'],
    rounds: '1 Round For Time',
    stats: { xp: 500, runKm: 4, sledKm: 0 }
  },
  { 
    id: 'hyb_6', title: 'LEG COMPROMISE', station: 'HYBRID', type: 'LEGS', level: 'INTERMEDIATE',
    desc: 'Heavy leg fatigue simulation.',
    steps: ['800m Run', '40 Lunges', '40 Air Squats', '400m Run'],
    rounds: 'Repeat 4 Rounds',
    stats: { xp: 300, runKm: 4.8, sledKm: 0 }
  },

  // =======================================================
  // 2. SKI ERG PROTOCOLS
  // =======================================================
  { 
    id: 'ski_1', title: 'SKI INTERVALS', station: 'SKI ERG', type: 'POWER', level: 'ALL LEVELS',
    desc: 'Build upper body aerobic capacity. Focus on high stroke rate.',
    steps: ['250m SkiErg (Sprint)', '90s Rest', '250m SkiErg (Sprint)', '90s Rest'],
    rounds: 'Repeat 8 Rounds',
    stats: { xp: 200, runKm: 0, sledKm: 0 }
  },
  { 
    id: 'ski_2', title: 'VO2 MAX SKI', station: 'SKI ERG', type: 'AEROBIC', level: 'ELITE',
    desc: 'Short, sharp bursts to increase maximum oxygen uptake.',
    steps: ['30s Ski (Max Effort)', '30s Rest'],
    rounds: 'Repeat 20 Rounds',
    stats: { xp: 250, runKm: 0, sledKm: 0 }
  },
  { 
    id: 'ski_3', title: 'THE 5K SKI', station: 'SKI ERG', type: 'ENDURANCE', level: 'ADVANCED',
    desc: 'Pure aerobic capacity builder. Steady state.',
    steps: ['5000m Ski Erg (Zone 2)'],
    rounds: '1 Round',
    stats: { xp: 300, runKm: 0, sledKm: 0 }
  },
  { 
    id: 'ski_4', title: 'MINUTE MAN', station: 'SKI ERG', type: 'THRESHOLD', level: 'INTERMEDIATE',
    desc: 'EMOM style training. Consistency is key.',
    steps: ['Min 1: 150m Ski', 'Min 2: 15 Burpees', 'Min 3: Rest'],
    rounds: 'Repeat 10 Rounds (30 Mins)',
    stats: { xp: 350, runKm: 0, sledKm: 0 }
  },

  // =======================================================
  // 3. SLED PUSH PROTOCOLS
  // =======================================================
  { 
    id: 'push_1', title: 'QUAD BURNER', station: 'SLED PUSH', type: 'STRENGTH', level: 'ADVANCED',
    desc: 'Heavy leg drive simulation for the Sled Push.',
    steps: ['25m Sled Push (Very Heavy)', '10 Box Jumps', '25m Sled Push', '200m Run'],
    rounds: 'Repeat 5 Rounds',
    stats: { xp: 300, runKm: 1, sledKm: 0.25 }
  },
  { 
    id: 'push_2', title: 'SPEED SLEDS', station: 'SLED PUSH', type: 'SPEED', level: 'BEGINNER',
    desc: 'Lighter weight, focusing on running mechanics behind the sled.',
    steps: ['15m Sled Sprint (Light)', '50m Sprint Run', '90s Rest'],
    rounds: 'Repeat 8 Rounds',
    stats: { xp: 150, runKm: 0.4, sledKm: 0.12 }
  },
  { 
    id: 'push_3', title: 'HEAVY PYRAMID', station: 'SLED PUSH', type: 'STRENGTH', level: 'ELITE',
    desc: 'Increase weight every round until failure.',
    steps: ['15m Push', 'Add 20kg', '90s Rest'],
    rounds: 'Repeat until failure',
    stats: { xp: 250, runKm: 0, sledKm: 0.1 }
  },
  { 
    id: 'push_4', title: 'PUSH & RUN', station: 'SLED PUSH', type: 'HYBRID', level: 'INTERMEDIATE',
    desc: 'Simulating the "Roxzone" feeling after a sled.',
    steps: ['50m Sled Push (Comp Weight)', '400m Run (Threshold)'],
    rounds: 'Repeat 4 Rounds',
    stats: { xp: 280, runKm: 1.6, sledKm: 0.2 }
  },

  // =======================================================
  // 4. SLED PULL PROTOCOLS
  // =======================================================
  { 
    id: 'pull_1', title: 'BACK CHAIN', station: 'SLED PULL', type: 'STRENGTH', level: 'INTERMEDIATE',
    desc: 'Posterior chain endurance. Keep chest up and hips low.',
    steps: ['25m Sled Pull', '15 Kettlebell Swings', '25m Sled Pull', '400m Run'],
    rounds: 'Repeat 4 Rounds',
    stats: { xp: 250, runKm: 1.6, sledKm: 0.2 }
  },
  { 
    id: 'pull_2', title: 'HEAVY ANCHOR', station: 'SLED PULL', type: 'POWER', level: 'ADVANCED',
    desc: 'Short, heavy pulls to build raw power.',
    steps: ['10m Sled Pull (Max Weight)', '60s Rest'],
    rounds: 'Repeat 10 Rounds',
    stats: { xp: 200, runKm: 0, sledKm: 0.1 }
  },
  { 
    id: 'pull_3', title: 'ARM PUMP', station: 'SLED PULL', type: 'ENDURANCE', level: 'BEGINNER',
    desc: 'Lighter weight, high volume walking backwards.',
    steps: ['50m Sled Pull (Light)', '20 Pushups'],
    rounds: 'Repeat 4 Rounds',
    stats: { xp: 180, runKm: 0, sledKm: 0.2 }
  },

  // =======================================================
  // 5. BURPEE BROAD JUMPS
  // =======================================================
  { 
    id: 'burp_1', title: 'JUMP CAPACITY', station: 'BURPEES', type: 'EXPLOSIVE', level: 'ADVANCED',
    desc: 'Plyometric fatigue management. Land soft.',
    steps: ['40m Burpee Broad Jumps', '400m Run (Recovery Pace)', '20 Air Squats'],
    rounds: 'Repeat 4 Rounds',
    stats: { xp: 220, runKm: 1.6, sledKm: 0 }
  },
  { 
    id: 'burp_2', title: 'TECHNIQUE 101', station: 'BURPEES', type: 'SKILL', level: 'BEGINNER',
    desc: 'Focus on efficient hip extension and landing mechanics.',
    steps: ['10 Burpee Broad Jumps', '30s Rest', '10 Burpee Broad Jumps', '60s Rest'],
    rounds: 'Repeat 6 Rounds',
    stats: { xp: 150, runKm: 0, sledKm: 0 }
  },
  { 
    id: 'burp_3', title: 'THE MILE', station: 'BURPEES', type: 'ENDURANCE', level: 'ELITE',
    desc: 'Volume accumulation.',
    steps: ['100m Burpee Broad Jumps', '800m Run'],
    rounds: 'Repeat 2 Rounds',
    stats: { xp: 350, runKm: 1.6, sledKm: 0 }
  },

  // =======================================================
  // 6. ROWING
  // =======================================================
  { 
    id: 'row_1', title: 'ROW FLUSH', station: 'ROWING', type: 'AEROBIC', level: 'BEGINNER',
    desc: 'Learning to recover while working. Negative splits.',
    steps: ['1000m Row (Moderate)', '2 min Rest', '500m Row (Fast)', '1 min Rest'],
    rounds: 'Repeat 3 Rounds',
    stats: { xp: 180, runKm: 0, sledKm: 0 }
  },
  { 
    id: 'row_2', title: '2K TEST PREP', station: 'ROWING', type: 'THRESHOLD', level: 'ELITE',
    desc: 'Classic interval training for the 2km distance.',
    steps: ['500m Row (Target 2k Pace)', '90s Rest'],
    rounds: 'Repeat 6 Rounds',
    stats: { xp: 250, runKm: 0, sledKm: 0 }
  },
  { 
    id: 'row_3', title: 'POWER STROKES', station: 'ROWING', type: 'POWER', level: 'INTERMEDIATE',
    desc: 'Max watts training.',
    steps: ['10 Strokes Max Power', '50 Strokes Recovery'],
    rounds: 'Repeat 10 Rounds',
    stats: { xp: 200, runKm: 0, sledKm: 0 }
  },
  { 
    id: 'row_4', title: '5K ROW', station: 'ROWING', type: 'ENDURANCE', level: 'ADVANCED',
    desc: 'Mental toughness and steady state cardio.',
    steps: ['5000m Row (Consistent Pace)'],
    rounds: '1 Round',
    stats: { xp: 300, runKm: 0, sledKm: 0 }
  },

  // =======================================================
  // 7. FARMERS CARRY
  // =======================================================
  { 
    id: 'farm_1', title: 'GRIP GAUNTLET', station: 'FARMERS', type: 'STRENGTH', level: 'ELITE',
    desc: 'Compromised grip training for the Farmers Carry.',
    steps: ['200m Farmers Carry', '1 min Dead Hang', '200m Run (Shake out arms)'],
    rounds: 'Repeat 3 Rounds',
    stats: { xp: 200, runKm: 0.6, sledKm: 0 }
  },
  { 
    id: 'farm_2', title: 'TRACK CARRY', station: 'FARMERS', type: 'ENDURANCE', level: 'INTERMEDIATE',
    desc: 'Long distance carry endurance.',
    steps: ['400m Run', '100m Farmers Carry', '400m Run'],
    rounds: 'Repeat 4 Rounds',
    stats: { xp: 250, runKm: 3.2, sledKm: 0 }
  },
  { 
    id: 'farm_3', title: 'HEAVY HOLD', station: 'FARMERS', type: 'STRENGTH', level: 'ADVANCED',
    desc: 'Overloading the grip with heavier than competition weight.',
    steps: ['50m Heavy Carry', '30s Rest'],
    rounds: 'Repeat 8 Rounds',
    stats: { xp: 220, runKm: 0, sledKm: 0 }
  },

  // =======================================================
  // 8. LUNGES
  // =======================================================
  { 
    id: 'lung_1', title: 'LUNGE LEGION', station: 'LUNGES', type: 'ENDURANCE', level: 'ADVANCED',
    desc: 'High volume unilateral leg work.',
    steps: ['50m Sandbag Lunges', '400m Run', '50m Sandbag Lunges', '20 Jumping Lunges'],
    rounds: 'Repeat 4 Rounds',
    stats: { xp: 300, runKm: 1.6, sledKm: 0 }
  },
  { 
    id: 'lung_2', title: 'COMPROMISED LEGS', station: 'LUNGES', type: 'HYBRID', level: 'INTERMEDIATE',
    desc: 'Running on heavy legs.',
    steps: ['400m Run (Hard)', '30m Lunges (Unweighted)', '400m Run (Hard)'],
    rounds: 'Repeat 5 Rounds',
    stats: { xp: 280, runKm: 4, sledKm: 0 }
  },
  { 
    id: 'lung_3', title: 'GLUTE BURNER', station: 'LUNGES', type: 'STRENGTH', level: 'BEGINNER',
    desc: 'Focusing on form and glute activation.',
    steps: ['20m Lunges', '20 Air Squats', '20 Glute Bridges'],
    rounds: 'Repeat 4 Rounds',
    stats: { xp: 150, runKm: 0, sledKm: 0 }
  },

  // =======================================================
  // 9. WALL BALLS
  // =======================================================
  { 
    id: 'wall_1', title: 'SHOULDER SMOKE', station: 'WALL BALLS', type: 'VOLUME', level: 'INTERMEDIATE',
    desc: 'Simulation of the final station fatigue.',
    steps: ['30 Wall Balls', '10 Burpees', '30 Wall Balls', '200m Run'],
    rounds: 'Repeat 3 Rounds',
    stats: { xp: 220, runKm: 0.6, sledKm: 0 }
  },
  { 
    id: 'wall_2', title: 'KAREN BENCHMARK', station: 'WALL BALLS', type: 'THRESHOLD', level: 'ADVANCED',
    desc: 'The classic CrossFit benchmark.',
    steps: ['150 Wall Balls for time'],
    rounds: '1 Round',
    stats: { xp: 300, runKm: 0, sledKm: 0 }
  },
  { 
    id: 'wall_3', title: 'EMOM 10', station: 'WALL BALLS', type: 'AEROBIC', level: 'BEGINNER',
    desc: 'Consistent pacing practice.',
    steps: ['10 Wall Balls every minute'],
    rounds: '10 Minutes',
    stats: { xp: 150, runKm: 0, sledKm: 0 }
  },
  { 
    id: 'wall_4', title: 'LEG & LUNG', station: 'WALL BALLS', type: 'HYBRID', level: 'ELITE',
    desc: 'Heavy squat volume under fatigue.',
    steps: ['400m Run', '40 Wall Balls'],
    rounds: 'Repeat 4 Rounds',
    stats: { xp: 350, runKm: 1.6, sledKm: 0 }
  }
];

const FILTERS = ["ALL", "HYBRID", "SKI ERG", "SLED PUSH", "SLED PULL", "BURPEES", "ROWING", "FARMERS", "LUNGES", "WALL BALLS"];

export default function Templates() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [selectedWorkout, setSelectedWorkout] = useState<any>(null);

  const filteredWorkouts = activeFilter === "ALL" 
    ? ALL_WORKOUTS 
    : ALL_WORKOUTS.filter(w => w.station === activeFilter);

  // --- START SESSION FUNCTION ---
  const startSession = (workout: any) => {
    router.push({
      pathname: '/workout_active',
      params: { 
        title: workout.title, 
        steps: JSON.stringify(workout.steps), 
        rounds: workout.rounds,
        stats: JSON.stringify(workout.stats) 
      }
    });
    setSelectedWorkout(null);
  };

  // --- MANUAL LOGGING ---
  const manualLogSession = async (workout: any) => {
    try {
        const historyJson = await AsyncStorage.getItem('user_history_stats');
        const history = historyJson ? JSON.parse(historyJson) : { xp: 0, workouts: 0, run: 0, sled: 0, lab: 0 };

        const newStats = {
            xp: history.xp + workout.stats.xp,
            workouts: (history.workouts || 0) + 1,
            run: (history.run || 0) + workout.stats.runKm,
            sled: (history.sled || 0) + workout.stats.sledKm,
            lab: (history.lab || 0) + 1 
        };

        await AsyncStorage.setItem('user_history_stats', JSON.stringify(newStats));

        Alert.alert(
            "SESSION LOGGED",
            `+${workout.stats.xp} XP added to Career Record.`,
            [{ text: "OK", onPress: () => setSelectedWorkout(null) }]
        );

    } catch (e) {
        console.log("Error logging session", e);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>TRAINING <Text style={{color: '#FFD700'}}>LAB</Text></Text>
        <Text style={styles.subtitle}>SELECT PROTOCOL TO START</Text>
      </View>

      {/* FILTER BAR */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {FILTERS.map((f) => (
                <TouchableOpacity 
                    key={f} 
                    style={[styles.filterChip, activeFilter === f && styles.activeFilter]} 
                    onPress={() => setActiveFilter(f)}
                >
                    <Text style={[styles.filterText, activeFilter === f && { color: '#000' }]}>{f}</Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {filteredWorkouts.map((wk) => (
          <TouchableOpacity 
            key={wk.id} 
            style={styles.wkCard} 
            activeOpacity={0.95}
            onPress={() => setSelectedWorkout(wk)}
          >
            <View style={styles.wkHeader}>
                <View style={[styles.badge, { backgroundColor: wk.level === 'ELITE' ? '#FFD700' : '#333' }]}>
                    <Text style={[styles.badgeText, { color: wk.level === 'ELITE' ? '#000' : '#fff' }]}>{wk.type}</Text>
                </View>
                <Text style={styles.level}>{wk.level}</Text>
            </View>
            
            <Text style={styles.stationTag}>{wk.station}</Text>
            <Text style={styles.wkTitle}>{wk.title}</Text>
            <Text style={styles.wkDesc} numberOfLines={2}>{wk.desc}</Text>
            
            <View style={styles.stepsBox}>
                {wk.steps.slice(0, 2).map((step: string, i: number) => (
                    <View key={i} style={styles.stepRow}>
                        <Text style={styles.bullet}>▶</Text>
                        <Text style={styles.step}>{step}</Text>
                    </View>
                ))}
                {wk.steps.length > 2 && <Text style={{color:'#666', fontSize: 10, marginTop: 5}}>+ {wk.steps.length - 2} more steps...</Text>}
            </View>
            
            <View style={styles.footerRow}>
                <Text style={styles.rounds}>{wk.rounds}</Text>
                <View style={styles.startBadge}>
                    <Text style={styles.startBadgeText}>START</Text>
                    <Ionicons name="play" size={10} color="#000" />
                </View>
            </View>
          </TouchableOpacity>
        ))}
        <View style={{height: 100}} />
      </ScrollView>

      {/* --- WORKOUT DETAIL MODAL --- */}
      <Modal visible={!!selectedWorkout} animationType="slide" transparent>
        <BlurView intensity={90} tint="dark" style={styles.modalContainer}>
            {selectedWorkout && (
                <View style={styles.modalContent}>
                    <Text style={styles.modalType}>{selectedWorkout.type} PROTOCOL</Text>
                    <Text style={styles.modalTitle}>{selectedWorkout.title}</Text>
                    <View style={styles.divider} />
                    
                    <ScrollView style={{maxHeight: 250}} showsVerticalScrollIndicator={false}>
                        <Text style={styles.sectionLabel}>MISSION BRIEFING</Text>
                        <Text style={styles.modalDesc}>{selectedWorkout.desc}</Text>
                        
                        <Text style={[styles.sectionLabel, {marginTop: 15}]}>EXECUTION</Text>
                        {selectedWorkout.steps.map((step: string, i: number) => (
                            <View key={i} style={styles.stepRow}>
                                <Text style={styles.bullet}>▶</Text>
                                <Text style={[styles.step, {color: '#fff'}]}>{step}</Text>
                            </View>
                        ))}
                        <Text style={[styles.rounds, {marginTop: 10, color: '#FFD700'}]}>{selectedWorkout.rounds}</Text>
                    </ScrollView>

                    <View style={{flex: 1}} />

                    {/* STATS PREVIEW */}
                    <View style={styles.dataGrid}>
                        <View style={styles.dataBox}>
                            <Text style={styles.dataVal}>+{selectedWorkout.stats.xp}</Text>
                            <Text style={styles.dataLab}>XP REWARD</Text>
                        </View>
                        <View style={styles.dataBox}>
                            <Text style={styles.dataVal}>{selectedWorkout.stats.runKm}k</Text>
                            <Text style={styles.dataLab}>DISTANCE</Text>
                        </View>
                    </View>

                    {/* ACTIONS */}
                    <TouchableOpacity style={styles.logBtn} onPress={() => startSession(selectedWorkout)}>
                        <Text style={styles.logBtnText}>START SESSION</Text>
                        <Ionicons name="stopwatch-outline" size={20} color="#000" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.manualBtn} onPress={() => manualLogSession(selectedWorkout)}>
                        <Text style={styles.manualBtnText}>Mark Complete (Manual Log)</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedWorkout(null)}>
                        <Text style={styles.closeBtnText}>CANCEL</Text>
                    </TouchableOpacity>
                </View>
            )}
        </BlurView>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { paddingHorizontal: 25, paddingBottom: 15, backgroundColor: '#121212' },
  backBtn: { marginBottom: 15 },
  backLink: { color: '#FFD700', fontWeight: '900', fontSize: 11, letterSpacing: 1 },
  title: { color: '#fff', fontSize: 32, fontWeight: '900', fontStyle: 'italic', letterSpacing: -1 },
  subtitle: { color: '#666', fontSize: 11, fontWeight: 'bold', letterSpacing: 1, marginTop: 4 },
  
  filterContainer: { backgroundColor: '#121212', paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#222' },
  filterScroll: { paddingHorizontal: 20, gap: 10 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: '#333' },
  activeFilter: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
  filterText: { color: '#888', fontSize: 11, fontWeight: '900' },

  scroll: { padding: 20 },
  wkCard: { backgroundColor: '#1E1E1E', padding: 25, borderRadius: 28, marginBottom: 20, borderWidth: 1, borderColor: '#2A2A2A' },
  wkHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '900' },
  level: { color: '#555', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  
  stationTag: { color: '#FFD700', fontSize: 10, fontWeight: '900', marginBottom: 4, letterSpacing: 1 },
  wkTitle: { color: '#fff', fontSize: 24, fontWeight: '900', fontStyle: 'italic', marginBottom: 8 },
  wkDesc: { color: '#888', fontSize: 14, lineHeight: 22, marginBottom: 20 },
  
  stepsBox: { backgroundColor: '#121212', padding: 15, borderRadius: 15, marginBottom: 20 },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  bullet: { color: '#FFD700', fontSize: 10, marginRight: 10 },
  step: { color: '#ccc', fontSize: 13, fontWeight: '500' },
  
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 },
  rounds: { color: '#FFD700', fontWeight: '900', fontSize: 13, fontStyle: 'italic' },
  
  startBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFD700', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  startBadgeText: { color: '#000', fontSize: 10, fontWeight: '900' },

  // MODAL
  modalContainer: { flex: 1, justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#1E1E1E', borderRadius: 30, padding: 30, height: '85%', borderWidth: 1, borderColor: '#333' },
  modalType: { color: '#FFD700', fontSize: 12, fontWeight: '900', letterSpacing: 1, marginBottom: 5 },
  modalTitle: { color: '#fff', fontSize: 32, fontWeight: '900', fontStyle: 'italic', marginBottom: 20 },
  divider: { height: 1, backgroundColor: '#333', marginBottom: 20 },
  sectionLabel: { color: '#666', fontSize: 10, fontWeight: '900', marginBottom: 10 },
  modalDesc: { color: '#fff', fontSize: 16, lineHeight: 24, marginBottom: 10 },
  
  dataGrid: { flexDirection: 'row', gap: 10, marginBottom: 20, marginTop: 10 },
  dataBox: { flex: 1, backgroundColor: '#121212', borderRadius: 15, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  dataVal: { color: '#fff', fontSize: 18, fontWeight: '900' },
  dataLab: { color: '#666', fontSize: 8, fontWeight: 'bold', marginTop: 4 },

  logBtn: { backgroundColor: '#FFD700', padding: 20, borderRadius: 15, alignItems: 'center', marginBottom: 10, flexDirection: 'row', justifyContent: 'center', gap: 10 },
  logBtnText: { color: '#000', fontSize: 16, fontWeight: '900' },
  
  manualBtn: { padding: 10, alignItems: 'center', marginBottom: 10 },
  manualBtnText: { color: '#666', fontSize: 12, textDecorationLine: 'underline' },

  closeBtn: { padding: 10, alignItems: 'center' },
  closeBtnText: { color: '#fff', fontWeight: 'bold' }
});