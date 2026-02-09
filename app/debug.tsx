import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DataStore, METRICS } from '../services/DataStore';

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
    const realFatigue = stats.trends[METRICS.FATIGUE]?.[0] || 0;
    const fatigueToUse = simFatigue !== null ? simFatigue : realFatigue;
    
    const fatigueMod = Math.max(0, fatigueToUse / 100);
    const run8_Adder = (3 * fatigueMod * 0.05); 
    
    setBaseRunWeight(1.0);
    setFinalRunWeight(1.0 + run8_Adder);
  };

  const nukeDb = async () => {
      Alert.alert("CONFIRM NUKE", "Wipe entire database? This cannot be undone.", [
          { text: "Cancel" },
          { text: "NUKE", style: 'destructive', onPress: async () => {
              await DataStore.clearAll();
              loadData();
          }}
      ]);
  };

  // --- SEED FACTORY LOGIC ---

  const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

  const getStationWeight = (name: string) => {
      const n = name.toUpperCase();
      if (n.includes('SLED PUSH')) return 152;
      if (n.includes('SLED PULL')) return 103;
      if (n.includes('FARMER')) return 48; // 2x24kg
      if (n.includes('LUNGE')) return 20;
      if (n.includes('WALL')) return 6;
      return 0; // Bodyweight (Burpees, Run, Ski, Row)
  };

  const generateRealisticRace = (index: number) => {
      const performanceFactor = getRandomInt(90, 110) / 100; 
      
      const stations = [
          { name: "1km RUN", base: 300 }, { name: "SKI ERG", base: 280 },
          { name: "1km RUN", base: 310 }, { name: "SLED PUSH", base: 180 },
          { name: "1km RUN", base: 320 }, { name: "SLED PULL", base: 240 },
          { name: "1km RUN", base: 330 }, { name: "BURPEES", base: 300 },
          { name: "1km RUN", base: 340 }, { name: "ROWING", base: 280 },
          { name: "1km RUN", base: 350 }, { name: "FARMERS", base: 120 },
          { name: "1km RUN", base: 360 }, { name: "LUNGES", base: 300 },
          { name: "1km RUN", base: 370 }, { name: "WALL BALLS", base: 280 },
          { name: "ROXZONE", base: 300 } 
      ];

      const splits = stations.map(s => {
          const actual = Math.floor(s.base * performanceFactor);
          return { 
              name: s.name, 
              actual, 
              target: s.base, 
              weight_kg: getStationWeight(s.name), 
              reps: 0 
          };
      });

      const totalSeconds = splits.reduce((acc, s) => acc + s.actual, 0);
      const m = Math.floor(totalSeconds / 60);
      const s = totalSeconds % 60;
      const totalTime = `${m}:${s < 10 ? '0' : ''}${s}`;

      const date = new Date();
      date.setDate(date.getDate() - (index * 7)); 

      return {
          date: date.toISOString(),
          totalTime,
          totalSeconds,
          type: "SIMULATION",
          title: `SIMULATION (SEED ${index + 1})`,
          splits,
          details: { note: "Auto-generated seed data for testing." }
      };
  };

  const seedRaceSims = async () => {
      for (let i = 0; i < 5; i++) {
          const race = generateRealisticRace(i);
          await DataStore.logEvent(race);
      }
      Alert.alert("INJECTED", "5x Valid Race Simulations added.");
      loadData();
  };

  const seedTrainingLab = async () => {
      const types = ["RUN", "STATION", "WORKOUT"];
      const subtypes = ["INTERVALS", "SLED PUSH", "HYBRID ENGINE"];
      
      for (let i = 0; i < 5; i++) {
          const type = types[i % 3];
          const sub = subtypes[i % 3];
          const duration = getRandomInt(1200, 3600); 
          
          const m = Math.floor(duration / 60);
          const timeStr = `${m}:00`;

          const date = new Date();
          date.setDate(date.getDate() - (i * 3)); 

          const log = {
              date: date.toISOString(),
              totalTime: timeStr,
              totalSeconds: duration,
              type: type,
              sessionType: "TRAINING",
              title: `${sub} (SEED)`,
              details: {
                  note: "Training lab seed data.",
                  rpe: getRandomInt(6, 9),
                  weight: type === 'STATION' ? "152" : "0" 
              }
          };
          await DataStore.logEvent(log);
      }
      Alert.alert("INJECTED", "5x Training Lab sessions added.");
      loadData();
  };

  const deleteLog = async (id: string) => {
      const db = await DataStore._getDb();
      await db.runAsync('DELETE FROM logs WHERE id = ?', [id]);
      await db.runAsync('DELETE FROM splits WHERE log_id = ?', [id]);
      loadData();
  };

  const renderLogItem = ({ item, index }: { item: any, index: number }) => (
      <View style={[styles.logRow, index === logs.length - 1 && styles.lastRow]}>
          <View style={{flex: 1}}>
              <Text style={styles.logDate}>{new Date(item.date).toLocaleDateString()}</Text>
              <Text style={styles.logTitle} numberOfLines={1}>{item.title}</Text>
          </View>
          <View style={{alignItems: 'flex-end', marginRight: 10}}>
              <Text style={styles.logType}>{item.type}</Text>
              <Text style={styles.logTime}>{item.totalTime}</Text>
          </View>
          <TouchableOpacity onPress={() => deleteLog(item.id)} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={18} color="#FF453A" />
          </TouchableOpacity>
      </View>
  );

  const formatSecs = (s: number) => {
      const m = Math.floor(s / 60);
      const sec = s % 60;
      return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const StationRow = ({ label, metric }: { label: string, metric: string }) => {
      const data = analytics?.trends?.[metric] || [];
      const count = data.length;
      const best = count > 0 ? Math.min(...data) : 0;
      const last = count > 0 ? data[0] : 0; // Trends are reversed in DataStore, index 0 is latest? Check DataStore.
      // DataStore: stats.trends[metric] = rows.map(r => r.val).reverse();
      // So index 0 is OLDEST? No wait.
      // SQL: ORDER BY timestamp DESC. 
      // rows[0] is NEWEST.
      // .reverse() makes index 0 OLDEST? 
      // Let's assume standard array behavior: typically charts want [old -> new].
      
      // Let's just display the array for inspection.
      
      return (
          <View style={styles.stationRow}>
              <View style={{flex: 1}}>
                  <Text style={styles.stLabel}>{label}</Text>
                  <Text style={styles.stSub}>Samples: {count}</Text>
              </View>
              <View style={{alignItems: 'flex-end'}}>
                  <Text style={styles.stValue}>Best: {best > 0 ? formatSecs(best) : '--:--'}</Text>
                  <Text style={styles.stArray}>[{data.slice(-5).join(', ')}]</Text>
              </View>
          </View>
      );
  };

  const DebugHeader = () => (
    <View style={styles.headerContent}>
        
        {/* 1. SEED FACTORY */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>SEED FACTORY</Text>
            <View style={{gap: 10, marginTop: 10}}>
                <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#FFD700'}]} onPress={seedRaceSims}>
                    <Text style={[styles.btnText, {color: '#000'}]}>INJECT 5x RACE SIMS</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#0A84FF'}]} onPress={seedTrainingLab}>
                    <Text style={styles.btnText}>INJECT 5x TRAINING LAB</Text>
                </TouchableOpacity>
            </View>
        </View>

        {/* 2. STATION INSPECTOR (NEW) */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>STATION INSPECTOR (ANALYTICS)</Text>
            <Text style={styles.info}>Valid data points passing weight filters.</Text>
            
            <View style={{marginTop: 10, gap: 8}}>
                <StationRow label="SKI ERG" metric={METRICS.SKI_ERG} />
                <StationRow label="SLED PUSH" metric={METRICS.SLED_PUSH} />
                <StationRow label="SLED PULL" metric={METRICS.SLED_PULL} />
                <StationRow label="BURPEES" metric={METRICS.BURPEES} />
                <StationRow label="ROWING" metric={METRICS.ROWING} />
                <StationRow label="FARMERS" metric={METRICS.FARMERS} />
                <StationRow label="LUNGES" metric={METRICS.LUNGES} />
                <StationRow label="WALL BALLS" metric={METRICS.WALL_BALLS} />
                <View style={{height: 1, backgroundColor: '#333', marginVertical: 5}} />
                <StationRow label="RUN PACE" metric={METRICS.RUN_PACE} />
            </View>
        </View>

        {/* 3. PACER LAB */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>PACER LAB (v2 LOGIC)</Text>
            <View style={styles.statRow}>
                <Text style={styles.label}>FATIGUE INDEX:</Text>
                <Text style={[styles.value, {color: '#FFD700'}]}>
                    {simFatigue !== null ? `${simFatigue}% (SIM)` : `${analytics?.trends?.fatigueIndex?.[0] || 0}% (REAL)`}
                </Text>
            </View>
            <View style={styles.simRow}>
                <TouchableOpacity style={styles.simBtn} onPress={() => setSimFatigue(0)}><Text style={styles.simText}>0%</Text></TouchableOpacity>
                <TouchableOpacity style={styles.simBtn} onPress={() => setSimFatigue(20)}><Text style={styles.simText}>20%</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.simBtn, {borderColor: '#FF453A'}]} onPress={() => setSimFatigue(null)}><Text style={[styles.simText, {color: '#FF453A'}]}>RESET</Text></TouchableOpacity>
            </View>
            <View style={styles.calcBox}>
                <Text style={styles.calcTitle}>RUN #8 WEIGHTING</Text>
                <View style={styles.calcRow}><Text style={styles.calcLabel}>BASE:</Text><Text style={styles.calcValue}>{baseRunWeight.toFixed(2)}x</Text></View>
                <View style={styles.calcRow}><Text style={styles.calcLabel}>MORPHED:</Text><Text style={[styles.calcValue, {color: '#32D74B'}]}>{finalRunWeight.toFixed(3)}x</Text></View>
            </View>
        </View>

        {/* 4. DATABASE HEADER */}
        <View style={styles.tableHeader}>
            <Text style={styles.sectionTitle}>DATA VAULT ({logs.length})</Text>
            <TouchableOpacity onPress={nukeDb}>
                <Text style={{color: '#FF453A', fontWeight: '900', fontSize: 10}}>NUKE DB</Text>
            </TouchableOpacity>
        </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
          <Text style={styles.title}>DEVELOPER CONSOLE</Text>
          <View style={{width: 24}} />
      </View>

      <FlatList 
        data={logs}
        keyExtractor={(item) => item.id}
        renderItem={renderLogItem}
        ListHeaderComponent={DebugHeader}
        contentContainerStyle={{ paddingBottom: 50 }}
        style={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#222' },
  title: { color: '#fff', fontWeight: '900', letterSpacing: 1 },
  list: { flex: 1 },
  headerContent: { padding: 20 },
  section: { marginBottom: 30, backgroundColor: '#111', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#222' },
  sectionTitle: { color: '#666', fontWeight: '900', marginBottom: 10, fontSize: 12 },
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
  info: { color: '#888', marginBottom: 5, fontSize: 12 },
  actionBtn: { flex: 1, padding: 15, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '900', fontSize: 12 },
  tableHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, backgroundColor: '#111', borderTopLeftRadius: 12, borderTopRightRadius: 12, borderWidth: 1, borderColor: '#222', borderBottomWidth: 1 },
  logRow: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#111', borderBottomWidth: 1, borderBottomColor: '#222', borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#222', marginHorizontal: 20 },
  lastRow: { borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
  logDate: { color: '#666', fontSize: 10, fontWeight: 'bold' },
  logTitle: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  logType: { color: '#FFD700', fontSize: 10, fontWeight: '900', textAlign: 'right' },
  logTime: { color: '#fff', fontSize: 12, fontFamily: 'Courier', textAlign: 'right' },
  deleteBtn: { padding: 5 },
  // STATION ROW STYLES
  stationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#222' },
  stLabel: { color: '#fff', fontSize: 12, fontWeight: '900' },
  stSub: { color: '#666', fontSize: 10 },
  stValue: { color: '#32D74B', fontSize: 12, fontWeight: 'bold', fontFamily: 'Courier', textAlign: 'right' },
  stArray: { color: '#444', fontSize: 9, fontFamily: 'Courier', marginTop: 2, textAlign: 'right' }
});