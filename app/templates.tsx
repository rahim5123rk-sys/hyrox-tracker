import { useNavigation, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// --- DATA: MASTER WORKOUT LIBRARY ---
const ALL_WORKOUTS = [
  // =======================================================
  // 1. HYBRID / FULL RACE SIMULATIONS
  // =======================================================
  { 
    id: 1, title: 'THE PUNISHER', station: 'HYBRID', type: 'COMPROMISED', level: 'ADVANCED',
    desc: 'Strict continuous movement. No rest between runs and stations.',
    steps: ['1km Run (Fast)', '50m Sled Push (Heavy)', '1km Run (Fast)', '20 Burpees'],
    rounds: 'Repeat 4 Rounds'
  },
  { 
    id: 2, title: 'ENGINE ROOM', station: 'HYBRID', type: 'ENDURANCE', level: 'INTERMEDIATE',
    desc: 'Target Race Pace. Practice moving through stations without stopping.',
    steps: ['1km Run (Race Pace)', '500m Row (Steady)', '1km Run (Race Pace)', '100m Farmers Carry'],
    rounds: 'Repeat 6 Rounds'
  },
  { 
    id: 3, title: 'ROXZONE SPRINT', station: 'HYBRID', type: 'SPEED', level: 'ELITE',
    desc: 'Focus on transition speed. Minimal air between tasks.',
    steps: ['400m Sprint', '15 Wall Balls', '400m Sprint', '10m Sled Pull'],
    rounds: 'Repeat 8 Rounds'
  },

  // =======================================================
  // 2. SKI ERG PROTOCOLS
  // =======================================================
  { 
    id: 10, title: 'SKI INTERVALS', station: 'SKI ERG', type: 'POWER', level: 'ALL LEVELS',
    desc: 'Build upper body aerobic capacity. Focus on high stroke rate.',
    steps: ['250m SkiErg (Sprint)', '90s Rest', '250m SkiErg (Sprint)', '90s Rest'],
    rounds: 'Repeat 8 Rounds'
  },
  { 
    id: 11, title: 'VO2 MAX SKI', station: 'SKI ERG', type: 'AEROBIC', level: 'ELITE',
    desc: 'Short, sharp bursts to increase maximum oxygen uptake.',
    steps: ['30s Ski (Max Effort)', '30s Rest'],
    rounds: 'Repeat 20 Rounds'
  },
  { 
    id: 12, title: 'ARM PUMP', station: 'SKI ERG', type: 'STRENGTH', level: 'INTERMEDIATE',
    desc: 'High drag factor work to build tricep and lat endurance.',
    steps: ['500m Ski (Damper 10)', '15 Pushups', '200m Run'],
    rounds: 'Repeat 5 Rounds'
  },

  // =======================================================
  // 3. SLED PUSH PROTOCOLS
  // =======================================================
  { 
    id: 20, title: 'QUAD BURNER', station: 'SLED PUSH', type: 'STRENGTH', level: 'ADVANCED',
    desc: 'Heavy leg drive simulation for the Sled Push.',
    steps: ['25m Sled Push (Very Heavy)', '10 Box Jumps', '25m Sled Push', '200m Run'],
    rounds: 'Repeat 5 Rounds'
  },
  { 
    id: 21, title: 'SPEED SLEDS', station: 'SLED PUSH', type: 'SPEED', level: 'BEGINNER',
    desc: 'Lighter weight, focusing on running mechanics behind the sled.',
    steps: ['15m Sled Sprint (Light)', '50m Sprint Run', '90s Rest'],
    rounds: 'Repeat 8 Rounds'
  },
  { 
    id: 22, title: 'THE WALL', station: 'SLED PUSH', type: 'MENTAL', level: 'ELITE',
    desc: 'Non-stop pushing endurance.',
    steps: ['100m Sled Push (Race Weight)', '2 min Rest'],
    rounds: 'Repeat 4 Rounds'
  },

  // =======================================================
  // 4. SLED PULL PROTOCOLS
  // =======================================================
  { 
    id: 30, title: 'BACK CHAIN', station: 'SLED PULL', type: 'STRENGTH', level: 'INTERMEDIATE',
    desc: 'Posterior chain endurance. Keep chest up and hips low.',
    steps: ['25m Sled Pull', '15 Kettlebell Swings', '25m Sled Pull', '400m Run'],
    rounds: 'Repeat 4 Rounds'
  },
  { 
    id: 31, title: 'HEAVY ANCHOR', station: 'SLED PULL', type: 'POWER', level: 'ADVANCED',
    desc: 'Short, heavy pulls to build raw power.',
    steps: ['10m Sled Pull (Max Weight)', '60s Rest'],
    rounds: 'Repeat 10 Rounds'
  },

  // =======================================================
  // 5. BURPEE BROAD JUMPS
  // =======================================================
  { 
    id: 40, title: 'JUMP CAPACITY', station: 'BURPEES', type: 'EXPLOSIVE', level: 'ADVANCED',
    desc: 'Plyometric fatigue management. Land soft.',
    steps: ['40m Burpee Broad Jumps', '400m Run (Recovery Pace)', '20 Air Squats'],
    rounds: 'Repeat 4 Rounds'
  },
  { 
    id: 41, title: 'TECHNIQUE 101', station: 'BURPEES', type: 'SKILL', level: 'BEGINNER',
    desc: 'Focus on efficient hip extension and landing mechanics.',
    steps: ['10 Burpee Broad Jumps', '30s Rest', '10 Burpee Broad Jumps', '60s Rest'],
    rounds: 'Repeat 6 Rounds'
  },
  { 
    id: 42, title: 'LEG FLUSH', station: 'BURPEES', type: 'ENDURANCE', level: 'INTERMEDIATE',
    desc: 'Clearing lactate while moving.',
    steps: ['60m Burpee Broad Jumps', '500m Row (Easy)'],
    rounds: 'Repeat 3 Rounds'
  },

  // =======================================================
  // 6. ROWING
  // =======================================================
  { 
    id: 50, title: 'ROW FLUSH', station: 'ROWING', type: 'AEROBIC', level: 'BEGINNER',
    desc: 'Learning to recover while working. Negative splits.',
    steps: ['1000m Row (Moderate)', '2 min Rest', '500m Row (Fast)', '1 min Rest'],
    rounds: 'Repeat 3 Rounds'
  },
  { 
    id: 51, title: 'POWER 10s', station: 'ROWING', type: 'POWER', level: 'ADVANCED',
    desc: 'Max wattage strokes to build explosive pull.',
    steps: ['10 Strokes Max Power', '50 Strokes Recovery Paddle'],
    rounds: 'Repeat 10 Rounds'
  },
  { 
    id: 52, title: '2K TEST PREP', station: 'ROWING', type: 'THRESHOLD', level: 'ELITE',
    desc: 'Classic interval training for the 2km distance.',
    steps: ['500m Row (Target 2k Pace)', '90s Rest'],
    rounds: 'Repeat 6 Rounds'
  },

  // =======================================================
  // 7. FARMERS CARRY
  // =======================================================
  { 
    id: 60, title: 'GRIP GAUNTLET', station: 'FARMERS', type: 'STRENGTH', level: 'ELITE',
    desc: 'Compromised grip training for the Farmers Carry.',
    steps: ['200m Farmers Carry', '1 min Dead Hang', '200m Run (Shake out arms)'],
    rounds: 'Repeat 3 Rounds'
  },
  { 
    id: 61, title: 'CORE STABILITY', station: 'FARMERS', type: 'CORE', level: 'BEGINNER',
    desc: 'Single arm carries to build oblique strength.',
    steps: ['50m Single Arm Carry (L)', '50m Single Arm Carry (R)', '20 Sit-ups'],
    rounds: 'Repeat 4 Rounds'
  },

  // =======================================================
  // 8. LUNGES
  // =======================================================
  { 
    id: 70, title: 'LUNGE LEGION', station: 'LUNGES', type: 'ENDURANCE', level: 'ADVANCED',
    desc: 'High volume unilateral leg work.',
    steps: ['50m Sandbag Lunges', '400m Run', '50m Sandbag Lunges', '20 Jumping Lunges'],
    rounds: 'Repeat 4 Rounds'
  },
  { 
    id: 71, title: 'COMPROMISED LEGS', station: 'LUNGES', type: 'HYBRID', level: 'INTERMEDIATE',
    desc: 'Running on heavy legs.',
    steps: ['400m Run (Hard)', '30m Lunges (Unweighted)', '400m Run (Hard)'],
    rounds: 'Repeat 5 Rounds'
  },
  { 
    id: 72, title: 'GLUTE DRIVE', station: 'LUNGES', type: 'STRENGTH', level: 'ELITE',
    desc: 'Heavy sandbag work focusing on form.',
    steps: ['20m Heavy Lunges', '10 Goblet Squats', '20m Heavy Lunges', '90s Rest'],
    rounds: 'Repeat 6 Rounds'
  },

  // =======================================================
  // 9. WALL BALLS
  // =======================================================
  { 
    id: 80, title: 'SHOULDER SMOKE', station: 'WALL BALLS', type: 'VOLUME', level: 'INTERMEDIATE',
    desc: 'Simulation of the final station fatigue.',
    steps: ['30 Wall Balls', '10 Burpees', '30 Wall Balls', '200m Run'],
    rounds: 'Repeat 3 Rounds'
  },
  { 
    id: 81, title: 'KAREN\'S COUSIN', station: 'WALL BALLS', type: 'THRESHOLD', level: 'ADVANCED',
    desc: 'High volume unbroken sets.',
    steps: ['50 Wall Balls', '2 min Rest'],
    rounds: 'Repeat 3 Rounds'
  },
  { 
    id: 82, title: 'DEPTH CHARGE', station: 'WALL BALLS', type: 'SKILL', level: 'BEGINNER',
    desc: 'Focusing on full squat depth and accuracy.',
    steps: ['15 Wall Balls (Slow Tempo)', '15 Air Squats', '1 min Rest'],
    rounds: 'Repeat 5 Rounds'
  }
];

const FILTERS = ["ALL", "SKI ERG", "SLED PUSH", "SLED PULL", "BURPEES", "ROWING", "FARMERS", "LUNGES", "WALL BALLS"];

export default function Templates() {
  const router = useRouter();
  const navigation = useNavigation();
  const [activeFilter, setActiveFilter] = useState("ALL");

  const handleBack = () => {
    if (navigation.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  const filteredWorkouts = activeFilter === "ALL" 
    ? ALL_WORKOUTS 
    : ALL_WORKOUTS.filter(w => w.station === activeFilter);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <Text style={styles.backLink}>← DISMISS LAB</Text>
        </TouchableOpacity>
        <Text style={styles.title}>TRAINING <Text style={{color: '#FFD700'}}>LAB</Text></Text>
        <Text style={styles.subtitle}>SELECT A STATION TO BROWSE PROTOCOLS</Text>
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
          <View key={wk.id} style={styles.wkCard}>
            <View style={styles.wkHeader}>
                <View style={[styles.badge, { backgroundColor: wk.level === 'ELITE' ? '#FFD700' : '#333' }]}>
                    <Text style={[styles.badgeText, { color: wk.level === 'ELITE' ? '#000' : '#fff' }]}>{wk.type}</Text>
                </View>
                <Text style={styles.level}>{wk.level}</Text>
            </View>
            
            <Text style={styles.stationTag}>{wk.station}</Text>
            <Text style={styles.wkTitle}>{wk.title}</Text>
            <Text style={styles.wkDesc}>{wk.desc}</Text>
            
            <View style={styles.stepsBox}>
                {wk.steps.map((step, i) => (
                    <View key={i} style={styles.stepRow}>
                        <Text style={styles.bullet}>▶</Text>
                        <Text style={styles.step}>{step}</Text>
                    </View>
                ))}
            </View>
            
            <View style={styles.footerRow}>
                <Text style={styles.rounds}>{wk.rounds}</Text>
                <TouchableOpacity 
                    style={styles.startBtn}
                    onPress={() => router.push({
                        pathname: '/workout_active',
                        params: { 
                          title: wk.title, 
                          steps: JSON.stringify(wk.steps), 
                          rounds: wk.rounds 
                        }
                    })}
                >
                    <Text style={styles.startBtnText}>START</Text>
                </TouchableOpacity>
            </View>
          </View>
        ))}
        <View style={{height: 100}} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { paddingTop: 60, paddingHorizontal: 25, paddingBottom: 15, backgroundColor: '#121212' },
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
  
  stepsBox: { backgroundColor: '#121212', padding: 20, borderRadius: 20, marginBottom: 20 },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  bullet: { color: '#FFD700', fontSize: 10, marginRight: 10 },
  step: { color: '#ccc', fontSize: 14, fontWeight: '500' },
  
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  rounds: { color: '#FFD700', fontWeight: '900', fontSize: 13, fontStyle: 'italic' },
  startBtn: { backgroundColor: '#fff', paddingHorizontal: 25, paddingVertical: 12, borderRadius: 14 },
  startBtnText: { color: '#000', fontWeight: '900', fontSize: 12, letterSpacing: 1 }
});