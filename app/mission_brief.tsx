import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TrainingSession } from '../utils/TrainingEngine';

export default function MissionBrief() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  
  // --- CRASH PROOF LOGIC ---
  // Replaced useState/useEffect with useMemo.
  // This calculates the session ONLY when the params string changes.
  // No state updates = No re-render loops.
  const session = useMemo(() => {
    if (!params.session || typeof params.session !== 'string') return null;
    try {
        return JSON.parse(params.session) as TrainingSession;
    } catch (e) {
        console.error("Failed to parse mission data", e);
        return null;
    }
  }, [params.session]); // Dependency is the string value, not the object

  // Safety Fallback if parsing failed
  if (!session) {
      return (
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{color: '#fff'}}>Loading Mission Data...</Text>
            <TouchableOpacity onPress={() => router.back()} style={{marginTop: 20, padding: 10}}>
                <Text style={{color: '#FFD700'}}>Return to Base</Text>
            </TouchableOpacity>
        </View>
      );
  }

  const isRecovery = session.type === 'RECOVERY';

  const handleExecute = () => {
    // Pass strictly necessary data to avoid bloated params
    router.replace({
        pathname: '/workout_active',
        params: {
            sessionId: session.id, // ID for ticking off the plan later
            title: session.title,
            steps: JSON.stringify(session.steps),
            rounds: session.rounds,
            type: session.type
        }
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* HERO HEADER */}
      <View style={styles.heroHeader}>
        <View style={[styles.headerOverlay, { opacity: isRecovery ? 0.2 : 0.6 }]} />
        <View style={[styles.headerContent, { paddingTop: insets.top + 20 }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            
            <View style={styles.badgeContainer}>
                <View style={[styles.typeBadge, { backgroundColor: isRecovery ? '#333' : '#FFD700' }]}>
                    <Text style={[styles.typeText, { color: isRecovery ? '#fff' : '#000' }]}>{session.type}</Text>
                </View>
                <Text style={styles.durationText}>{session.duration} MINS</Text>
            </View>

            <Text style={styles.title}>{session.title}</Text>
            <Text style={styles.intent}>"{session.intent}"</Text>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{paddingBottom: 100}} showsVerticalScrollIndicator={false}>
        
        {/* STATS GRID */}
        <View style={styles.statsRow}>
            <View style={styles.statBox}>
                <Text style={styles.statLabel}>INTENSITY</Text>
                <Text style={[styles.statValue, { color: isRecovery ? '#32D74B' : '#FFD700' }]}>RPE {session.rpeTarget}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
                <Text style={styles.statLabel}>STRUCTURE</Text>
                <Text style={styles.statValue}>{session.rounds}</Text>
            </View>
        </View>

        {/* MISSION STEPS */}
        <Text style={styles.sectionTitle}>PROTOCOL STEPS</Text>
        <View style={styles.stepsContainer}>
            {session.steps.map((step, idx) => (
                <View key={idx} style={styles.stepRow}>
                    <View style={styles.stepIndex}>
                        <Text style={styles.indexText}>{idx + 1}</Text>
                    </View>
                    <Text style={styles.stepText}>{step}</Text>
                </View>
            ))}
        </View>

      </ScrollView>

      {/* ACTION FOOTER */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity style={styles.engageBtn} onPress={handleExecute}>
            <Text style={styles.engageText}>{isRecovery ? "START RECOVERY" : "INITIATE WORKOUT"}</Text>
            <Ionicons name="arrow-forward" size={20} color="#000" />
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  heroHeader: { height: 280, backgroundColor: '#1A1A1A', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, overflow: 'hidden' },
  headerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000' },
  headerContent: { padding: 25, flex: 1, justifyContent: 'flex-end' },
  backBtn: { position: 'absolute', top: 60, left: 25, padding: 5 },
  
  badgeContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  typeText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  durationText: { color: '#888', fontSize: 10, fontWeight: 'bold' },

  title: { color: '#fff', fontSize: 32, fontWeight: '900', fontStyle: 'italic', marginBottom: 8, lineHeight: 32 },
  intent: { color: '#ccc', fontSize: 14, fontStyle: 'italic', opacity: 0.8 },

  content: { flex: 1, padding: 25 },
  
  statsRow: { flexDirection: 'row', backgroundColor: '#161616', padding: 20, borderRadius: 16, marginBottom: 30, borderWidth: 1, borderColor: '#333' },
  statBox: { flex: 1, alignItems: 'center' },
  statLabel: { color: '#666', fontSize: 10, fontWeight: '900', marginBottom: 5 },
  statValue: { color: '#fff', fontSize: 16, fontWeight: '900' },
  statDivider: { width: 1, backgroundColor: '#333' },

  sectionTitle: { color: '#fff', fontSize: 14, fontWeight: '900', marginBottom: 15, letterSpacing: 1 },
  stepsContainer: { gap: 10 },
  stepRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#222' },
  stepIndex: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#222', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  indexText: { color: '#666', fontSize: 12, fontWeight: 'bold' },
  stepText: { color: '#fff', fontSize: 14, fontWeight: '600', flex: 1 },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 25, backgroundColor: '#000', borderTopWidth: 1, borderTopColor: '#1A1A1A', paddingTop: 20 },
  engageBtn: { backgroundColor: '#FFD700', padding: 18, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  engageText: { color: '#000', fontSize: 16, fontWeight: '900', letterSpacing: 1 }
});