import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ManualLogDetails() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { type, totalTime, date, note, unit } = useLocalSearchParams();

  // Color Coding Logic
  const getTheme = () => {
      const t = Array.isArray(type) ? type[0] : type; 
      if (t === 'RUN') return { color: '#32D74B', icon: 'stopwatch' };
      if (t === 'STATION') return { color: '#FF453A', icon: 'barbell' };
      return { color: '#FFD700', icon: 'fitness' };
  };

  const { color, icon } = getTheme();
  const displayType = Array.isArray(type) ? type[0] : type;
  const displayUnit = unit || 'MINS';

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SESSION DEBRIEF</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* HERO CARD */}
        <View style={[styles.heroCard, { borderColor: color }]}>
            <View style={[styles.iconBox, { backgroundColor: color }]}>
                <Ionicons name={icon as any} size={32} color="#000" />
            </View>
            <Text style={styles.heroType}>{displayType} SESSION</Text>
            <Text style={styles.heroDate}>{date}</Text>
        </View>

        {/* METRICS GRID */}
        <View style={styles.grid}>
            <View style={styles.statBox}>
                <Text style={styles.statLabel}>RESULT</Text>
                <Text style={styles.statValue}>
                    {totalTime} <Text style={{fontSize: 14, color: '#666'}}>{displayUnit}</Text>
                </Text>
            </View>
            <View style={styles.statBox}>
                <Text style={styles.statLabel}>STATUS</Text>
                <Text style={[styles.statValue, {color: '#32D74B'}]}>COMPLETE</Text>
            </View>
        </View>

        {/* MISSION INTEL (NOTES) */}
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>MISSION INTEL</Text>
        </View>
        <View style={styles.noteCard}>
            <Text style={styles.noteText}>
              {note ? note : "No additional details recorded."}
            </Text>
        </View>

        <TouchableOpacity style={[styles.doneBtn, { backgroundColor: color }]} onPress={() => router.back()}>
            <Text style={styles.doneBtnText}>DISMISS</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 20 },
  backBtn: { padding: 8, backgroundColor: '#1E1E1E', borderRadius: 12 },
  headerTitle: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 2 },
  content: { padding: 20 },
  heroCard: { padding: 30, borderRadius: 25, alignItems: 'center', backgroundColor: '#111', borderWidth: 1, marginBottom: 20 },
  iconBox: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  heroType: { color: '#fff', fontSize: 24, fontWeight: '900', fontStyle: 'italic' },
  heroDate: { color: '#666', fontSize: 12, fontWeight: 'bold', marginTop: 5 },
  grid: { flexDirection: 'row', gap: 15, marginBottom: 25 },
  statBox: { flex: 1, backgroundColor: '#111', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#222' },
  statLabel: { color: '#666', fontSize: 9, fontWeight: '900', marginBottom: 8 },
  statValue: { color: '#fff', fontSize: 18, fontWeight: '900' },
  sectionHeader: { marginBottom: 15 },
  sectionTitle: { color: '#666', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  noteCard: { backgroundColor: '#1E1E1E', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#333' },
  noteText: { color: '#BBB', fontSize: 16, lineHeight: 24, fontWeight: '500' },
  doneBtn: { padding: 20, borderRadius: 15, alignItems: 'center', marginTop: 40 },
  doneBtnText: { color: '#000', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
});