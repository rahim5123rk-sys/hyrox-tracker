import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DataStore, METRICS } from './services/DataStore';

export default function Debug() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [logs, setLogs] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  
  // [PACER LAB STATE]
  const [simFatigue, setSimFatigue] = useState<number | null>(null);
  const [baseRunWeight, setBaseRunWeight] = useState(1.0);
  const [finalRunWeight, setFinalRunWeight] = useState(1.0);

  useEffect(() => {
    loadData();
  }, [simFatigue]);

  const loadData = async () => {
    const history = await DataStore.getHistory();
    setLogs(history);
    
    const stats = await DataStore.getAnalytics();
    setAnalytics(stats);

    // [PACER LAB CALCULATION]
    // 1. Get Fatigue (Real or Simulated)
    const realFatigue = stats.trends[METRICS.FATIGUE]?.[0] || 0;
    const fatigueToUse = simFatigue !== null ? simFatigue : realFatigue;
    
    // 2. Calculate Morph (Logic from race.tsx)
    const fatigueMod = Math.max(0, fatigueToUse / 100);
    // Simulate Run #8 (Index 7 -> Math.floor(7/2) = 3)
    const run8_Adder = (3 * fatigueMod * 0.05); 
    
    setBaseRunWeight(1.0);
    setFinalRunWeight(1.0 + run8_Adder);
  };

  const nukeDb = async () => {
      Alert.alert("CONFIRM NUKE", "Wipe entire database?", [
          { text: "Cancel" },
          { text: "NUKE", style: 'destructive', onPress: async () => {
              await DataStore.clearAll();
              loadData();
          }}
      ]);
  };

  const seedData = async () => {
      // Inject dummy data for testing
      const dummyLog = {
          date: new Date().toISOString(),
          totalTime: "01:30:00",
          totalSeconds: 5400,
          type: "SIMULATION",
          title: "DEBUG SIM",
          splits: [
              { name: "1km RUN", actual: 300, target: 300 },
              { name: "SLED PUSH", actual: 180, target: 180 },
              { name: "ROXZONE", actual: 400, target: 0 }
          ]
      };
      await DataStore.logEvent(dummyLog);
      loadData();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
          <Text style={styles.title}>DEVELOPER CONSOLE</Text>
          <View style={{width: 24}} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* --- 1. PACER LAB --- */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>PACER LAB (v2 LOGIC)</Text>
            
            <View style={styles.statRow}>
                <Text style={styles.label}>CURRENT FATIGUE INDEX:</Text>
                <Text style={[styles.value, {color: '#FFD700'}]}>
                    {simFatigue !== null ? `${simFatigue}% (SIM)` : `${analytics?.trends?.fatigueIndex?.[0] || 0}% (REAL)`}
                </Text>
            </View>

            <View style={styles.simRow}>
                <TouchableOpacity style={styles.simBtn} onPress={() => setSimFatigue(0)}>
                    <Text style={styles.simText}>SIM 0%</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.simBtn} onPress={() => setSimFatigue(15)}>
                    <Text style={styles.simText}>SIM 15%</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.simBtn} onPress={() => setSimFatigue(30)}>
                    <Text style={styles.simText}>SIM 30%</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.simBtn, {borderColor: '#FF453A'}]} onPress={() => setSimFatigue(null)}>
                    <Text style={[styles.simText, {color: '#FF453A'}]}>RESET</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.calcBox}>
                <Text style={styles.calcTitle}>MORPH CALCULATION (RUN #8)</Text>
                <View style={styles.calcRow}>
                    <Text style={styles.calcLabel}>BASE WEIGHT:</Text>
                    <Text style={styles.calcValue}>{baseRunWeight.toFixed(2)}x</Text>
                </View>
                <View style={styles.calcRow}>
                    <Text style={styles.calcLabel}>MORPHED WEIGHT:</Text>
                    <Text style={[styles.calcValue, {color: '#32D74B'}]}>{finalRunWeight.toFixed(3)}x</Text>
                </View>
                <Text style={styles.calcNote}>
                    *At 90min goal, Run #8 target increases by {Math.round((finalRunWeight - baseRunWeight) * 330)} seconds due to fatigue.
                </Text>
            </View>
        </View>

        {/* --- 2. DATABASE TOOLS --- */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>DATABASE TOOLS</Text>
            <Text style={styles.info}>Total Logs: {logs.length}</Text>
            <Text style={styles.info}>DB Name: hyrox_data_v2.db</Text>
            
            <View style={{flexDirection: 'row', gap: 10, marginTop: 15}}>
                <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#32D74B'}]} onPress={seedData}>
                    <Text style={styles.btnText}>SEED DUMMY DATA</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#FF453A'}]} onPress={nukeDb}>
                    <Text style={styles.btnText}>NUKE DATABASE</Text>
                </TouchableOpacity>
            </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#222' },
  title: { color: '#fff', fontWeight: '900', letterSpacing: 1 },
  scroll: { padding: 20 },
  section: { marginBottom: 30, backgroundColor: '#111', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#222' },
  sectionTitle: { color: '#666', fontWeight: '900', marginBottom: 15, fontSize: 12 },
  
  statRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  label: { color: '#ccc', fontWeight: 'bold' },
  value: { color: '#fff', fontWeight: '900' },
  
  simRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  simBtn: { flex: 1, padding: 8, borderWidth: 1, borderColor: '#444', borderRadius: 8, alignItems: 'center' },
  simText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  
  calcBox: { backgroundColor: '#000', padding: 15, borderRadius: 8 },
  calcTitle: { color: '#888', fontSize: 10, fontWeight: '900', marginBottom: 10 },
  calcRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  calcLabel: { color: '#ccc', fontSize: 12 },
  calcValue: { color: '#fff', fontWeight: 'bold', fontFamily: 'Courier' },
  calcNote: { color: '#666', fontSize: 10, marginTop: 10, fontStyle: 'italic' },

  info: { color: '#888', marginBottom: 5, fontFamily: 'Courier' },
  actionBtn: { flex: 1, padding: 15, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#000', fontWeight: '900', fontSize: 12 }
});