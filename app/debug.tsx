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
      Alert.alert("Nuked", "All DataStore keys cleared.");
  };

  // --- FULL RACE GENERATOR ---
  const injectSeasonData = async () => {
      setLoading(true);
      
      const today = new Date();
      const oneWeek = 7 * 24 * 60 * 60 * 1000;

      // We simulate a 10-week block where you get ~5% faster
      // Format: { offset: msAgo, multiplier: 1.05 (slow) -> 1.0 (fast) }
      const progression = [
          { week: 10, mod: 1.10, note: "Baseline Test" },  // 10 weeks ago (Slowest)
          { week: 8,  mod: 1.08, note: "Early Season" },
          { week: 6,  mod: 1.05, note: "Mid Block" },
          { week: 4,  mod: 1.02, note: "Peak Phase" },
          { week: 2,  mod: 1.00, note: "Race Ready" }      // 2 weeks ago (Fastest)
      ];

      // BASELINE TIMES (The "Fastest" reference)
      const baseStats = {
          run: 300,        // 5:00 min per km
          ski: 240,        // 4:00 min
          sledPush: 150,   // 2:30 min
          sledPull: 210,   // 3:30 min
          burpees: 270,    // 4:30 min
          row: 250,        // 4:10 min
          farmers: 120,    // 2:00 min
          lunges: 240,     // 4:00 min
          wallballs: 210,  // 3:30 min
          roxzone: 300     // 5:00 min total transition
      };

      for (const p of progression) {
          const m = p.mod; // Multiplier (e.g. 1.10 = 10% slower)
          
          // Generate realistic fatigue (Run 8 is slower than Run 1)
          const runSplits = [];
          for(let i=1; i<=8; i++) {
              // Each run gets 2% slower due to fatigue
              const fatigue = 1 + (i * 0.02); 
              runSplits.push({ 
                  name: `Run ${i}`, 
                  actual: Math.round(baseStats.run * m * fatigue) 
              });
          }

          const splits = [
              runSplits[0], // Run 1
              { name: "SKI ERG", actual: Math.round(baseStats.ski * m) },
              runSplits[1],
              { name: "SLED PUSH", actual: Math.round(baseStats.sledPush * m) },
              runSplits[2],
              { name: "SLED PULL", actual: Math.round(baseStats.sledPull * m) },
              runSplits[3],
              { name: "BURPEES", actual: Math.round(baseStats.burpees * m) },
              runSplits[4],
              { name: "ROWING", actual: Math.round(baseStats.row * m) },
              runSplits[5],
              { name: "FARMERS", actual: Math.round(baseStats.farmers * m) },
              runSplits[6],
              { name: "LUNGES", actual: Math.round(baseStats.lunges * m) },
              runSplits[7],
              { name: "WALL BALLS", actual: Math.round(baseStats.wallballs * m) },
              // Add a summary Roxzone split for the Analytics Engine
              { name: "ROXZONE (TOTAL)", actual: Math.round(baseStats.roxzone * m) }
          ];

          // Calculate Total Time
          const totalSeconds = splits.reduce((acc, s) => acc + s.actual, 0);
          const minutes = Math.floor(totalSeconds / 60);
          const seconds = totalSeconds % 60;
          const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

          const log = {
              date: new Date(today.getTime() - (p.week * oneWeek)).toISOString(),
              title: "HYROX SIMULATION (PRO)",
              totalTime: timeStr,
              totalSeconds: totalSeconds,
              type: "SIMULATION",
              sessionType: "SIMULATION",
              splits: splits,
              details: { note: p.note }
          };
          
          await DataStore.logEvent(log);
      }

      await loadData();
      setLoading(false);
      Alert.alert("FULL SEASON INJECTED", "5 Complete Races with all 8 stations and fatigue logic added.");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.btn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>SYSTEM <Text style={{color: '#FF453A'}}>DEBUG</Text></Text>
        <TouchableOpacity onPress={loadData} style={styles.btn}>
            <Ionicons name="refresh" size={24} color="#FFD700" />
        </TouchableOpacity>
      </View>

      <View style={styles.controls}>
          <TouchableOpacity 
            style={[styles.actionBtn, {backgroundColor: '#32D74B'}]} 
            onPress={injectSeasonData}
            disabled={loading}
          >
              <Text style={styles.btnText}>{loading ? "GENERATING..." : "+ INJECT FULL SEASON"}</Text>
              <Text style={styles.btnSub}>5 Races (All Stations)</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionBtn, {backgroundColor: '#FF453A'}]} 
            onPress={nukeData}
          >
              <Text style={styles.btnText}>NUKE DATABASE</Text>
              <Text style={styles.btnSub}>Clear All Data</Text>
          </TouchableOpacity>
      </View>

      <ScrollView style={styles.console} contentContainerStyle={{paddingBottom: 50}}>
          <Text style={styles.sectionHeader}>ANALYTICS ENGINE STATUS</Text>
          <Text style={styles.json}>
              {dossier ? JSON.stringify(dossier.analytics, null, 2) : "NO DATA"}
          </Text>

          <Text style={styles.sectionHeader}>RAW HISTORY LOG ({dossier?.history?.length || 0})</Text>
          <Text style={styles.json}>
              {dossier ? JSON.stringify(dossier.history, null, 2) : "NO DATA"}
          </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderColor: '#333' },
  title: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  btn: { padding: 5 },
  controls: { flexDirection: 'row', gap: 10, padding: 15 },
  actionBtn: { flex: 1, padding: 20, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#000', fontWeight: '900', fontSize: 11, marginBottom: 2 },
  btnSub: { color: 'rgba(0,0,0,0.6)', fontSize: 9, fontWeight: 'bold' },
  console: { flex: 1, padding: 15 },
  sectionHeader: { color: '#FFD700', fontSize: 14, fontWeight: '900', marginBottom: 10, marginTop: 20 },
  json: { color: '#00FF00', fontFamily: 'Courier', fontSize: 10, backgroundColor: '#111', padding: 10, borderRadius: 8 }
});