import { useNavigation, useRouter } from 'expo-router';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const WORKOUTS = [
  { 
    id: 1, title: 'THE PUNISHER', type: 'COMPROMISED', level: 'ADVANCED',
    desc: 'Strict continuous movement. No rest between runs and stations.',
    steps: ['1km Run (Fast)', '50m Sled Push (Heavy)', '1km Run (Fast)', '20 Burpees'],
    rounds: 'Repeat 4 Rounds'
  },
  { 
    id: 2, title: 'ENGINE ROOM', type: 'ENDURANCE', level: 'INTERMEDIATE',
    desc: 'Target Race Pace. Practice moving through stations without stopping.',
    steps: ['1km Run (Race Pace)', '500m Row (Steady)', '1km Run (Race Pace)', '100m Farmers Carry'],
    rounds: 'Repeat 6 Rounds'
  },
  { 
    id: 3, title: 'ROXZONE SPRINT', type: 'SPEED', level: 'ELITE',
    desc: 'Focus on transition speed. Minimal air between tasks.',
    steps: ['400m Sprint', '15 Wall Balls', '400m Sprint', '10m Sled Pull'],
    rounds: 'Repeat 8 Rounds'
  }
];

export default function Templates() {
  const router = useRouter();
  const navigation = useNavigation();

  const handleBack = () => {
    if (navigation.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <Text style={styles.backLink}>← DISMISS LAB</Text>
        </TouchableOpacity>
        <Text style={styles.title}>TRAINING <Text style={{color: '#FFD700'}}>LAB</Text></Text>
        <Text style={styles.subtitle}>HYROX COMPROMISED PERFORMANCE</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {WORKOUTS.map((wk) => (
          <View key={wk.id} style={styles.wkCard}>
            <View style={styles.wkHeader}>
                <View style={styles.badge}><Text style={styles.badgeText}>{wk.type}</Text></View>
                <Text style={styles.level}>{wk.level}</Text>
            </View>
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
                    <Text style={styles.startBtnText}>START SESSION</Text>
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
  header: { paddingTop: 60, paddingHorizontal: 25, paddingBottom: 25, backgroundColor: '#121212', borderBottomWidth: 1, borderBottomColor: '#222' },
  backBtn: { marginBottom: 15 },
  backLink: { color: '#FFD700', fontWeight: '900', fontSize: 11, letterSpacing: 1 },
  title: { color: '#fff', fontSize: 32, fontWeight: '900', fontStyle: 'italic', letterSpacing: -1 },
  subtitle: { color: '#666', fontSize: 11, fontWeight: 'bold', letterSpacing: 1, marginTop: 4 },
  scroll: { padding: 20 },
  wkCard: { backgroundColor: '#1E1E1E', padding: 25, borderRadius: 28, marginBottom: 20, borderWidth: 1, borderColor: '#2A2A2A' },
  wkHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  badge: { backgroundColor: '#FFD700', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  badgeText: { color: '#000', fontSize: 10, fontWeight: '900' },
  level: { color: '#555', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  wkTitle: { color: '#fff', fontSize: 24, fontWeight: '900', fontStyle: 'italic', marginBottom: 8 },
  wkDesc: { color: '#888', fontSize: 14, lineHeight: 22, marginBottom: 20 },
  stepsBox: { backgroundColor: '#121212', padding: 20, borderRadius: 20, marginBottom: 20 },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  bullet: { color: '#FFD700', fontSize: 10, marginRight: 10 },
  step: { color: '#ccc', fontSize: 14, fontWeight: '500' },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  rounds: { color: '#FFD700', fontWeight: '900', fontSize: 13, fontStyle: 'italic' },
  startBtn: { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  startBtnText: { color: '#000', fontWeight: '900', fontSize: 11 }
});