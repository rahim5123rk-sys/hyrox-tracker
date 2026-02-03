import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DataStore, LogEntry } from './services/DataStore';

// --- DUMMY DATA ---
const DUMMY_LOG: LogEntry = {
    id: 'legacy-seed-1',
    date: new Date().toISOString(),
    timestamp: Date.now() - 172800000, // 2 days ago
    type: 'SIMULATION',
    title: 'LEGACY SEED DATA',
    totalTime: '65:00',
    totalSeconds: 3900,
    sessionType: 'SOLO',
    splits: [
        { name: '1km RUN', actual: 250, target: 240 },
        { name: 'SKI ERG', actual: 250, target: 240 },
        { name: '1km RUN', actual: 260, target: 240 },
        { name: 'SLED PUSH', actual: 180, target: 140 }
    ],
    details: { note: 'Injected via Debug Console' }
};

export default function DebugConsole() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [consoleLog, setConsoleLog] = useState<string[]>([]);
  const [dbStats, setDbStats] = useState({ logs: 0, splits: 0, profile: 'MISSING' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    refreshStats();
  }, []);

  const log = (msg: string) => setConsoleLog(prev => [`[${new Date().toLocaleTimeString().split(' ')[0]}] ${msg}`, ...prev]);

  const refreshStats = async () => {
    try {
        // @ts-ignore - Accessing internal DB for diagnostics
        const db = await DataStore._getDb();
        const l = await db.getAllAsync('SELECT count(*) as c FROM logs');
        const s = await db.getAllAsync('SELECT count(*) as c FROM splits');
        
        // Profile Check
        const p = await DataStore.getUserProfile();
        
        setDbStats({ 
            logs: l[0].c, 
            splits: s[0].c, 
            profile: p ? `${p.name} (${p.category})` : 'MISSING' 
        });
        log("Stats Refreshed.");
    } catch (e) { log(`Stats Error: ${e}`); }
  };

  // --- 1. MIGRATION TESTS ---

  const handleSeedLegacy = async () => {
      setLoading(true);
      const history = Array(5).fill(DUMMY_LOG).map((l, i) => ({ 
          ...l, 
          id: `legacy-${i}-${Date.now()}`,
          timestamp: Date.now() - (i * 86400000) 
      }));
      await AsyncStorage.setItem('raceHistory', JSON.stringify(history));
      log(`Success: 5 Legacy Logs written to AsyncStorage.`);
      log("Action: Click 'Force SQL Migration' to import them.");
      setLoading(false);
  };

  const handleForceMigration = async () => {
      setLoading(true);
      log("Starting Migration...");
      // @ts-ignore
      await DataStore._migrateFromLegacy();
      log("Migration Routine Completed.");
      await refreshStats();
      setLoading(false);
  };

  // --- 2. RELIABILITY TESTS ---

  const injectCrash = async (stationIndex: number, stationName: string) => {
      const crashState = {
          savedAt: Date.now(), // Crash happened JUST NOW
          category: 'MEN_OPEN',
          goalMinutes: 90,
          bias: 'BALANCED',
          history: [
              { name: '1km RUN', actual: 240, target: 240 },
              { name: 'SKI ERG', actual: 240, target: 240 },
          ],
          index: stationIndex, 
          raceStartRef: Date.now() - (stationIndex * 300000), // Fake start time
          stationStartRef: Date.now() - 30000 // Fake station start
      };
      await AsyncStorage.setItem('hyrox_race_recovery_state', JSON.stringify(crashState));
      log(`CRASH INJECTED @ ${stationName}`);
      
      Alert.alert(
          "CRASH SIMULATED", 
          `App state set to 'Crashed at ${stationName}'.\n\nGo to Race Calculator -> Launch to test recovery.`,
          [{ text: "Go to Race", onPress: () => router.push('/race?goalMinutes=90') }, { text: "Stay Here" }]
      );
  };

  // --- 3. ANALYTICS TESTS ---

  const handleBenchmark = async () => {
      setLoading(true);
      log("Running SQL Analytics Engine...");
      const start = performance.now();
      // @ts-ignore
      const stats = await DataStore._refreshAnalytics();
      const end = performance.now();
      
      log(`COMPLETED IN ${(end - start).toFixed(2)}ms`);
      log(`Total Ops: ${stats.totalOps}`);
      log(`Run Volume: ${stats.totalRunDistance}km`);
      log(`Consistency: ${stats.consistencyScore}%`);
      setLoading(false);
  };

  // --- 4. DATA DESTRUCTION ---

  const handleNuke = async () => {
      Alert.alert("NUCLEAR LAUNCH DETECTED", "This will wipe the SQLite Database and AsyncStorage. There is no undo.", [
          { text: "ABORT" },
          { text: "EXECUTE", style: 'destructive', onPress: async () => {
              await DataStore.clearAll();
              await AsyncStorage.clear(); // Total wipe
              log("SYSTEM PURGED.");
              refreshStats();
          }}
      ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>COMMANDER CONSOLE v7.5</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
          
          {/* STATS DASHBOARD */}
          <View style={styles.statsRow}>
              <View style={styles.statBox}>
                  <Text style={styles.statVal}>{dbStats.logs}</Text>
                  <Text style={styles.statLabel}>SQL LOGS</Text>
              </View>
              <View style={styles.statBox}>
                  <Text style={styles.statVal}>{dbStats.splits}</Text>
                  <Text style={styles.statLabel}>SQL SPLITS</Text>
              </View>
          </View>
          <View style={[styles.statBox, {marginBottom: 30, borderColor: dbStats.profile === 'MISSING' ? '#FF453A' : '#32D74B'}]}>
               <Text style={[styles.statVal, {fontSize: 14}]}>{dbStats.profile}</Text>
               <Text style={styles.statLabel}>ACTIVE PROFILE</Text>
          </View>

          {/* ACTIONS */}
          <Text style={styles.sectionTitle}>MIGRATION PROTOCOLS</Text>
          <View style={styles.btnRow}>
            <TouchableOpacity style={[styles.btn, {flex:1}]} onPress={handleSeedLegacy}>
                <Text style={styles.btnText}>SEED LEGACY JSON</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, {flex:1, backgroundColor: '#003300', borderColor: '#005500'}]} onPress={handleForceMigration}>
                <Text style={styles.btnText}>RUN IMPORT</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>CRASH SIMULATION</Text>
          <View style={styles.btnRow}>
            <TouchableOpacity style={[styles.btn, {flex:1}]} onPress={() => injectCrash(2, 'STATION 3 (SLED)')}>
                <Text style={styles.btnText}>CRASH @ SLED</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, {flex:1}]} onPress={() => injectCrash(8, 'RUN 5')}>
                <Text style={styles.btnText}>CRASH @ RUN 5</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>PERFORMANCE BENCHMARK</Text>
          <TouchableOpacity style={[styles.btn, {borderColor: '#FFD700'}]} onPress={handleBenchmark}>
              <Text style={[styles.btnText, {color: '#FFD700'}]}>RUN ANALYTICS ENGINE (SQL)</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>DANGER ZONE</Text>
          <TouchableOpacity style={[styles.btn, {borderColor: '#FF453A', backgroundColor: '#330000'}]} onPress={handleNuke}>
              <Text style={[styles.btnText, {color: '#FF453A'}]}>FACTORY RESET (WIPE DATA)</Text>
          </TouchableOpacity>
          
          {/* CONSOLE */}
          <View style={styles.consoleBox}>
              <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom: 10}}>
                <Text style={styles.consoleTitle}>SYSTEM LOG</Text>
                <TouchableOpacity onPress={() => setConsoleLog([])}><Text style={{color:'#666', fontSize:10}}>CLEAR</Text></TouchableOpacity>
              </View>
              <ScrollView nestedScrollEnabled style={{height: 180}}>
                  {consoleLog.length === 0 && <Text style={{color:'#444', fontStyle:'italic', fontSize:10}}>Waiting for commands...</Text>}
                  {consoleLog.map((L, i) => (
                      <Text key={i} style={styles.consoleText}>{L}</Text>
                  ))}
              </ScrollView>
          </View>
          
          {/* NAVIGATION SHORTCUTS */}
          <View style={{flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 20}}>
              <TouchableOpacity onPress={() => router.push('/onboarding')}><Text style={styles.link}>Go To Onboarding</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/(tabs)/history')}><Text style={styles.link}>Go To Logbook</Text></TouchableOpacity>
          </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#222' },
  closeBtn: { marginRight: 15 },
  title: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  content: { padding: 20, paddingBottom: 50 },
  
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  statBox: { flex: 1, backgroundColor: '#111', padding: 15, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  statVal: { color: '#fff', fontSize: 20, fontWeight: '900', fontFamily: 'Courier' },
  statLabel: { color: '#666', fontSize: 10, fontWeight: 'bold', marginTop: 5 },

  sectionTitle: { color: '#666', fontSize: 10, fontWeight: '900', marginBottom: 10, marginTop: 20, letterSpacing: 1 },
  btnRow: { flexDirection: 'row', gap: 10 },
  btn: { padding: 15, backgroundColor: '#1A1A1A', borderRadius: 10, borderWidth: 1, borderColor: '#333', marginBottom: 10 },
  btnText: { color: '#fff', fontSize: 11, fontWeight: 'bold', textAlign: 'center' },

  consoleBox: { backgroundColor: '#111', borderRadius: 12, padding: 15, marginTop: 30, borderWidth: 1, borderColor: '#333' },
  consoleTitle: { color: '#FFD700', fontSize: 10, fontWeight: '900' },
  consoleText: { color: '#ccc', fontFamily: 'Courier', fontSize: 10, marginBottom: 4 },
  
  link: { color: '#FFD700', fontSize: 12, textDecorationLine: 'underline', fontWeight: 'bold' }
});