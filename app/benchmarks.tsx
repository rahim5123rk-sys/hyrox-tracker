import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BENCHMARKS = [
    {
        workoutId: 'pft_1', // Points to app/data/workouts.ts
        title: 'HYROX PFT',
        subtitle: 'PHYSICAL FITNESS TEST',
        desc: 'The official standard for determining your division. Max effort.',
        duration: '15-40 MINS',
        difficulty: 'MAX EFFORT',
        icon: 'ribbon',
        color: '#FFD700',
    },
    {
        workoutId: 'pft_2', // Points to app/data/workouts.ts
        title: '5K TIME TRIAL',
        subtitle: 'AEROBIC CAPACITY BASELINE',
        desc: 'Pure running capacity test. Flat road or track recommended.',
        duration: '20-30 MINS',
        difficulty: 'HARD',
        icon: 'speedometer',
        color: '#32D74B',
    },
    // [NEW] KAREN BENCHMARK ADDED HERE
    {
        workoutId: 'wall_2', // Points to app/data/workouts.ts
        title: 'KAREN',
        subtitle: '150 WALL BALLS FOR TIME',
        desc: 'The classic benchmark for muscular endurance and mental grit. Unbroken if possible.',
        duration: '5-10 MINS',
        difficulty: 'THRESHOLD',
        icon: 'basketball', 
        color: '#FF453A',
    }
];

export default function Benchmarks() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleStart = (bm: any) => {
      router.push({
          pathname: '/mission_brief',
          params: { workoutId: bm.workoutId }
      });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View>
            <Text style={styles.headerTitle}>PERFORMANCE <Text style={{color: '#FFD700'}}>STANDARDS</Text></Text>
            <Text style={styles.headerSub}>ESTABLISH YOUR BASELINES</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>OFFICIAL ASSESSMENTS</Text>
        
        {BENCHMARKS.map((bm, index) => (
            <TouchableOpacity 
                key={index} 
                style={[styles.card, { borderColor: bm.color }]}
                activeOpacity={0.9}
                onPress={() => handleStart(bm)}
            >
                <View style={styles.cardHeader}>
                    <View style={[styles.iconBox, { backgroundColor: bm.color + '20' }]}>
                        <Ionicons name={bm.icon as any} size={24} color={bm.color} />
                    </View>
                    <View style={{flex: 1}}>
                        <Text style={styles.cardTitle}>{bm.title}</Text>
                        <Text style={[styles.cardSub, { color: bm.color }]}>{bm.subtitle}</Text>
                    </View>
                    <View style={styles.goBtn}>
                        <Ionicons name="arrow-forward" size={20} color="#000" />
                    </View>
                </View>
                
                <Text style={styles.cardDesc}>{bm.desc}</Text>
                
                <View style={styles.metaRow}>
                    <View style={styles.metaTag}>
                        <Ionicons name="time-outline" size={12} color="#666" />
                        <Text style={styles.metaText}>{bm.duration}</Text>
                    </View>
                    <View style={styles.metaTag}>
                        <Ionicons name="stats-chart-outline" size={12} color="#666" />
                        <Text style={styles.metaText}>{bm.difficulty}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        ))}

        <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color="#666" />
            <Text style={styles.infoText}>
                Benchmark results will be used to calibrate your athlete profile and race pacing strategies.
            </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 25, borderBottomWidth: 1, borderBottomColor: '#1E1E1E' },
  backBtn: { padding: 8, backgroundColor: '#1E1E1E', borderRadius: 12, marginRight: 15 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '900', fontStyle: 'italic' },
  headerSub: { color: '#666', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  content: { padding: 20 },
  sectionLabel: { color: '#666', fontSize: 12, fontWeight: '900', marginBottom: 15, letterSpacing: 1 },
  
  card: { backgroundColor: '#161616', borderRadius: 20, padding: 20, marginBottom: 15, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 12 },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: '900', fontStyle: 'italic' },
  cardSub: { fontSize: 10, fontWeight: 'bold', marginTop: 2 },
  goBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  
  cardDesc: { color: '#ccc', fontSize: 13, lineHeight: 20, marginBottom: 15 },
  
  metaRow: { flexDirection: 'row', gap: 10 },
  metaTag: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#111', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#333' },
  metaText: { color: '#888', fontSize: 10, fontWeight: 'bold' },

  infoBox: { flexDirection: 'row', gap: 15, backgroundColor: '#111', padding: 20, borderRadius: 16, marginTop: 10, borderWidth: 1, borderColor: '#222' },
  infoText: { color: '#666', fontSize: 12, lineHeight: 18, flex: 1 }
});