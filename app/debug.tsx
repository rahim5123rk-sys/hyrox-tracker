import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DataStore } from './services/DataStore';

export default function DebugConsole() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [dossier, setDossier] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const data = await DataStore.getFullDossier();
    setDossier(data);
  };

  const nukeData = async () => {
      await DataStore.clearAll();
      loadData();
      Alert.alert("SYSTEM PURGED", "Database cleared. Analytics engine reset.");
  };

  // --- ENGINE: GENERATE RACE ---
  const generateRace = (dateOffset: number, multipliers: any) => {
      const { runMod, stationMod, fatigueMod } = multipliers;
      const runBase = 300; // 5:00/km
      const splits = [];

      // 8 Runs
      for(let i=1; i<=8; i++) {
          const fatigue = 1 + ((i - 1) * fatigueMod); 
          splits.push({ name: `Run ${i}`, actual: Math.round(runBase * runMod * fatigue) });
      }

      // 8 Stations
      const stations = [
          { name: "SKI ERG", base: 240 }, { name: "SLED PUSH", base: 150 }, { name: "SLED PULL", base: 210 },
          { name: "BURPEES", base: 270 }, { name: "ROWING", base: 250 }, { name: "FARMERS", base: 120 },
          { name: "LUNGES", base: 240 }, { name: "WALL BALLS", base: 210 }, { name: "ROXZONE", base: 300 }
      ];

      stations.forEach(s => {
          splits.push({ name: s.name, actual: Math.round(s.base * stationMod) });
      });

      // Calc Total
      const totalSeconds = splits.reduce((acc, s) => acc + s.actual, 0);
      const m = Math.floor(totalSeconds / 60);
      const s = totalSeconds % 60;

      return {
          date: new Date(Date.now() - dateOffset).toISOString(),
          title: "HYROX SIMULATION",
          totalTime: `${m}:${s.toString().padStart(2, '0')}`,
          totalSeconds: totalSeconds,
          type: "SIMULATION",
          sessionType: "SIMULATION",
          splits: splits,
          details: { hrAvg: 160, rpe: 8 }
      };
  };

  // --- SCENARIO RUNNER ---
  const runScenario = async (name: string, races: any[]) => {
      setLoading(true);
      await DataStore.clearAll();
      const oneWeek = 604800000;

      for (let i = 0; i < races.length; i++) {
          const r = races[i];
          // Determine time offset (reverse order, so last item is newest)
          const offset = (races.length - 1 - i) * oneWeek;
          const log = generateRace(offset, r);
          await DataStore.logEvent(log);
      }

      await loadData();
      setLoading(false);
      Alert.alert("SCENARIO LOADED", `${name} data injected.`);
  };

  // --- SCENARIOS ---

  // 1. THE "RUNNER" (Fast Runs, Weak Stations)
  const injectRunner = () => runScenario("THE RUNNER", [
      { runMod: 0.85, stationMod: 1.3, fatigueMod: 0.02 }, // Fast run, slow stations
      { runMod: 0.84, stationMod: 1.28, fatigueMod: 0.02 },
      { runMod: 0.82, stationMod: 1.25, fatigueMod: 0.02 },
  ]);

  // 2. THE "TANK" (Slow Runs, Elite Strength)
  const injectTank = () => runScenario("THE TANK", [
      { runMod: 1.2, stationMod: 0.8, fatigueMod: 0.05 }, // Slow run, fast sleds
      { runMod: 1.18, stationMod: 0.78, fatigueMod: 0.05 },
      { runMod: 1.15, stationMod: 0.75, fatigueMod: 0.05 },
  ]);

  // 3. PERFECT TAPER (Fatigue -> Peak)
  const injectTaper = () => runScenario("THE TAPER", [
      { runMod: 1.1, stationMod: 1.1, fatigueMod: 0.1 }, // Week 1: Tired
      { runMod: 1.08, stationMod: 1.08, fatigueMod: 0.08 },
      { runMod: 1.05, stationMod: 1.05, fatigueMod: 0.05 },
      { runMod: 0.95, stationMod: 0.95, fatigueMod: 0.0 }, // Week 4: PEAK
  ]);

  // 4. THE BONK (Good start, horrible finish)
  const injectBonk = () => runScenario("THE BONK", [
      { runMod: 0.9, stationMod: 0.9, fatigueMod: 0.15 }, // 15% degradation/run
      { runMod: 0.9, stationMod: 0.9, fatigueMod: 0.18 }, // Getting worse
      { runMod: 0.9, stationMod: 0.9, fatigueMod: 0.20 }, // 20% degradation
  ]);

  // 5. OVERTRAINING (Getting slower every week)
  const injectOvertraining = () => runScenario("OVERTRAINING", [
      { runMod: 1.0, stationMod: 1.0, fatigueMod: 0.02 }, // Week 1: Good
      { runMod: 1.05, stationMod: 1.05, fatigueMod: 0.05 }, // Week 2: Slower
      { runMod: 1.10, stationMod: 1.10, fatigueMod: 0.08 }, // Week 3: Tired
      { runMod: 1.15, stationMod: 1.15, fatigueMod: 0.12 }, // Week 4: Burnout
  ]);

  // 6. CONSISTENCY KING (Flat lines)
  const injectConsistency = () => runScenario("ROBOT", [
      { runMod: 1.0, stationMod: 1.0, fatigueMod: 0.0 },
      { runMod: 1.0, stationMod: 1.0, fatigueMod: 0.0 },
      { runMod: 1.0, stationMod: 1.0, fatigueMod: 0.0 },
      { runMod: 1.0, stationMod: 1.0, fatigueMod: 0.0 },
  ]);

  // 7. SIMULATE TRAINING LAB (Specific Workout Test)
  const injectLabWorkout = async () => {
      setLoading(true);
      // Mimic "SKI INTERVALS"
      const log = {
          date: new Date().toISOString(),
          title: "SKI INTERVALS",
          totalTime: "30:00",
          totalSeconds: 1800,
          type: "WORKOUT",
          sessionType: "TRAINING",
          splits: [
              { name: "250m SkiErg (Sprint)", actual: 45 },
              { name: "Rest", actual: 90 },
              { name: "250m SkiErg (Sprint)", actual: 44 },
              { name: "Rest", actual: 90 },
              { name: "250m SkiErg (Sprint)", actual: 42 },
          ]
      };
      await DataStore.logEvent(log);
      await loadData();
      setLoading(false);
      Alert.alert("LAB INJECTED", "Added 'Ski Intervals'. Check 'Ski Erg' chart in Profile.");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.btn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>SIMULATION <Text style={{color: '#FF453A'}}>SUITE</Text></Text>
        <TouchableOpacity onPress={loadData} style={styles.btn}>
            <Ionicons name="refresh" size={24} color="#FFD700" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 50 }}>
          
          <Text style={styles.sectionHeader}>ARCHETYPES</Text>
          <View style={styles.grid}>
              <TouchableOpacity style={styles.btn} onPress={injectRunner}>
                  <Text style={styles.btnText}>THE RUNNER</Text>
                  <Text style={styles.btnSub}>Fast Run / Slow Strength</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btn} onPress={injectTank}>
                  <Text style={styles.btnText}>THE TANK</Text>
                  <Text style={styles.btnSub}>Slow Run / Elite Strength</Text>
              </TouchableOpacity>
          </View>

          <Text style={styles.sectionHeader}>TRENDS & ANOMALIES</Text>
          <View style={styles.grid}>
              <TouchableOpacity style={styles.btn} onPress={injectTaper}>
                  <Text style={styles.btnText}>PERFECT TAPER</Text>
                  <Text style={styles.btnSub}>Fatigue → Peak</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btn} onPress={injectOvertraining}>
                  <Text style={styles.btnText}>OVERTRAINING</Text>
                  <Text style={styles.btnSub}>Performance Decay</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btn} onPress={injectBonk}>
                  <Text style={styles.btnText}>THE BONK</Text>
                  <Text style={styles.btnSub}>High Fatigue Index</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btn} onPress={injectConsistency}>
                  <Text style={styles.btnText}>THE ROBOT</Text>
                  <Text style={styles.btnSub}>Zero Deviation</Text>
              </TouchableOpacity>
          </View>

          <Text style={styles.sectionHeader}>INTEGRATION TESTS</Text>
          <TouchableOpacity style={[styles.btn, {backgroundColor: '#333'}]} onPress={injectLabWorkout}>
              <Ionicons name="flask" size={20} color="#FFD700" style={{marginBottom:5}}/>
              <Text style={[styles.btnText, {color: '#FFD700'}]}>SIMULATE LAB: SKI INTERVALS</Text>
              <Text style={styles.btnSub}>Tests if Training Lab affects Analytics</Text>
          </TouchableOpacity>

          <View style={{height: 30}} />
          <TouchableOpacity style={styles.nukeBtn} onPress={nukeData}>
              <Text style={styles.nukeText}>NUKE DATABASE</Text>
          </TouchableOpacity>

          <Text style={styles.jsonHeader}>RAW ANALYTICS DUMP</Text>
          <Text style={styles.json}>
              {dossier ? JSON.stringify(dossier.analytics, null, 2) : "NO DATA"}
          </Text>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderColor: '#333' },
  title: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  
  sectionHeader: { color: '#666', fontSize: 10, fontWeight: '900', marginBottom: 10, marginTop: 10, letterSpacing: 1 },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  btn: { width: '48%', backgroundColor: '#1E1E1E', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#333', marginBottom: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 12, fontWeight: '900', textAlign: 'center' },
  btnSub: { color: '#666', fontSize: 10, marginTop: 4, textAlign: 'center' },

  nukeBtn: { backgroundColor: 'rgba(255, 69, 58, 0.15)', padding: 15, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#FF453A', marginBottom: 30 },
  nukeText: { color: '#FF453A', fontWeight: '900', letterSpacing: 1 },

  jsonHeader: { color: '#FFD700', fontSize: 12, fontWeight: '900', marginBottom: 10 },
  json: { color: '#00FF00', fontFamily: 'Courier', fontSize: 10, backgroundColor: '#111', padding: 10, borderRadius: 8 }
});