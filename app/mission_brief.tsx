import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ALL_WORKOUTS } from './data/workouts';

export default function MissionBrief() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  
  const workoutId = params.workoutId as string;
  const workout = ALL_WORKOUTS.find(w => w.id === workoutId);

  if (!workout) return null;

  const handleLaunch = () => {
      // Direct Launch - Weights are handled inside the active workout now
      router.replace({ 
          pathname: '/workout_active', 
          params: { 
              steps: JSON.stringify(workout.steps), 
              rounds: workout.rounds, 
              title: workout.title,
              sessionId: params.sessionId
          } 
      });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Image source={{ uri: 'https://images.unsplash.com/photo-1517963879466-e1b54ebd6694?q=80&w=1000' }} style={[StyleSheet.absoluteFill, { opacity: 0.4 }]} />
      <View style={[styles.gradientOverlay, { paddingTop: insets.top }]}>
        
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="close-circle" size={32} color="#fff" />
        </TouchableOpacity>

        <View style={styles.content}>
            <View style={styles.badge}><Text style={styles.badgeText}>{workout.level}</Text></View>
            <Text style={styles.title}>{workout.title}</Text>
            <Text style={styles.station}>{workout.station}</Text>
            
            <View style={styles.metaRow}>
                <View style={styles.metaBox}>
                    <Ionicons name="repeat" size={24} color="#FFD700" />
                    <Text style={styles.metaVal}>{workout.rounds}</Text>
                    <Text style={styles.metaLabel}>ROUNDS</Text>
                </View>
                <View style={styles.metaBox}>
                    <Ionicons name="time" size={24} color="#FFD700" />
                    <Text style={styles.metaVal}>{workout.estTime}</Text>
                    <Text style={styles.metaLabel}>EST TIME</Text>
                </View>
            </View>

            <ScrollView style={styles.descBox} contentContainerStyle={{paddingBottom: 40}}>
                <Text style={styles.descTitle}>MISSION BRIEFING</Text>
                <Text style={styles.descText}>{workout.desc}</Text>
                
                <Text style={[styles.descTitle, {marginTop: 20}]}>SEQUENCE OF EVENTS</Text>
                {workout.steps.map((step, i) => (
                    <View key={i} style={styles.stepRow}>
                        <Text style={styles.stepNum}>{i+1}</Text>
                        <Text style={styles.stepText}>{step}</Text>
                    </View>
                ))}
            </ScrollView>
        </View>

        <TouchableOpacity style={styles.launchBtn} onPress={handleLaunch}>
            <Text style={styles.launchText}>INITIATE MISSION</Text>
            <Ionicons name="arrow-forward" size={24} color="#000" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  gradientOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 20 },
  backBtn: { alignSelf: 'flex-start', marginBottom: 20 },
  content: { flex: 1 },
  badge: { backgroundColor: '#FFD700', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4, marginBottom: 10 },
  badgeText: { color: '#000', fontWeight: 'bold', fontSize: 10 },
  title: { color: '#fff', fontSize: 36, fontWeight: '900', fontStyle: 'italic', lineHeight: 36 },
  station: { color: '#ccc', fontSize: 14, fontWeight: 'bold', letterSpacing: 2, marginBottom: 30 },
  metaRow: { flexDirection: 'row', gap: 15, marginBottom: 30 },
  metaBox: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', padding: 15, borderRadius: 12, alignItems: 'center' },
  metaVal: { color: '#fff', fontSize: 18, fontWeight: '900', marginTop: 5 },
  metaLabel: { color: '#888', fontSize: 10, fontWeight: 'bold' },
  descBox: { flex: 1 },
  descTitle: { color: '#FFD700', fontSize: 12, fontWeight: '900', letterSpacing: 1, marginBottom: 10 },
  descText: { color: '#ddd', fontSize: 14, lineHeight: 22 },
  stepRow: { flexDirection: 'row', gap: 15, marginBottom: 12 },
  stepNum: { color: '#666', fontWeight: '900', fontSize: 14, width: 20 },
  stepText: { color: '#fff', fontSize: 14, fontWeight: 'bold', flex: 1 },
  launchBtn: { backgroundColor: '#FFD700', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, padding: 20, borderRadius: 16, marginBottom: 40 },
  launchText: { color: '#000', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
});