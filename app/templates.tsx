import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Modal, Platform, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// IMPORT DATA
import { EXERCISE_LIBRARY, Exercise } from './data/exercises';
import { ALL_WORKOUTS } from './data/workouts';

const FILTERS = ["ALL", "CUSTOM", "BENCHMARKS", "HYBRID", "SKI ERG", "SLED PUSH", "SLED PULL", "BURPEES", "ROWING", "FARMERS", "LUNGES", "WALL BALLS"];

const getStationColor = (station: string) => {
  switch (station) {
    case 'BENCHMARK': return '#FF453A'; 
    case 'HYBRID': return '#FFD700'; 
    case 'SLED PUSH': return '#FF3B30'; 
    case 'SLED PULL': return '#FF453A'; 
    case 'SKI ERG': return '#32D74B'; 
    case 'ROWING': return '#0A84FF'; 
    case 'WALL BALLS': return '#BF5AF2'; 
    case 'BURPEES': return '#EBEBF5'; 
    case 'FARMERS': return '#FF9F0A'; 
    case 'LUNGES': return '#FFD60A'; 
    case 'CUSTOM': return '#64D2FF'; 
    default: return '#8E8E93'; 
  }
};

export default function Templates() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [selectedWorkout, setSelectedWorkout] = useState<any>(null);
  const [customWorkouts, setCustomWorkouts] = useState<any[]>([]);

  // BUILDER STATE
  const [isBuilderOpen, setBuilderOpen] = useState(false);
  const [buildTitle, setBuildTitle] = useState("");
  const [buildSearch, setBuildSearch] = useState("");
  const [buildSteps, setBuildSteps] = useState<string[]>([]);

  useFocusEffect(useCallback(() => { loadCustoms(); }, []));

  const loadCustoms = async () => {
    try {
      const saved = await AsyncStorage.getItem('custom_workouts');
      if (saved) setCustomWorkouts(JSON.parse(saved));
    } catch (e) { console.error("Load error", e); }
  };

  const addToDraft = (name: string) => {
    setBuildSteps([...buildSteps, name]);
  };

  const removeFromDraft = (index: number) => {
    setBuildSteps(buildSteps.filter((_, i) => i !== index));
  };

  const saveProtocol = async () => {
    if (!buildTitle || buildSteps.length === 0) return Alert.alert("INCOMPLETE", "Enter a title and at least one exercise.");
    
    const newProtocol = {
      id: `custom-${Date.now()}`,
      title: buildTitle.toUpperCase(),
      station: 'CUSTOM',
      type: 'USER',
      level: 'CUSTOM',
      desc: 'Custom tactical protocol.',
      steps: buildSteps,
      rounds: "1 Round",
      estTime: `${buildSteps.length * 2}-${buildSteps.length * 4} MINS`,
      stats: { xp: 150 + (buildSteps.length * 10), runKm: 0, sledKm: 0 }
    };

    const updated = [newProtocol, ...customWorkouts];
    await AsyncStorage.setItem('custom_workouts', JSON.stringify(updated));
    setCustomWorkouts(updated);
    setBuilderOpen(false);
    setBuildTitle("");
    setBuildSteps([]);
    setBuildSearch("");
  };

  const fullLibrary = [...customWorkouts, ...ALL_WORKOUTS];
  
  const filteredWorkouts = activeFilter === "ALL" 
    ? fullLibrary 
    : fullLibrary.filter(w => (activeFilter === "BENCHMARKS" ? w.station === 'BENCHMARK' : w.station === activeFilter));
  
  const searchResults = buildSearch.length > 0 
    ? EXERCISE_LIBRARY.filter((e: Exercise) => e.name.toLowerCase().includes(buildSearch.toLowerCase())) 
    : EXERCISE_LIBRARY;

  // [NEW] SMART LAUNCH LOGIC
  const handleLaunchMission = () => {
      if (!selectedWorkout) return;
      
      // Close Modal first
      setSelectedWorkout(null);

      // Route through Mission Brief for Pre-Flight Check
      router.push({
          pathname: '/mission_brief',
          params: { workoutId: selectedWorkout.id }
      });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color="#fff" /></TouchableOpacity>
          <TouchableOpacity style={styles.createBtn} onPress={() => setBuilderOpen(true)}>
            <Ionicons name="build" size={16} color="#FFD700" /><Text style={styles.createBtnText}>BUILDER</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>TRAINING <Text style={{color: '#FFD700'}}>LAB</Text></Text>
      </View>

      {/* FILTER BAR */}
      <View style={{height: 50}}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {FILTERS.map(f => (
            <TouchableOpacity key={f} style={[styles.filterChip, activeFilter === f && styles.activeFilter]} onPress={() => setActiveFilter(f)}>
              <Text style={[styles.filterText, activeFilter === f && {color: '#000'}]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* WORKOUT LIST */}
      <ScrollView contentContainerStyle={styles.listContent}>
        {filteredWorkouts.map(wk => {
          const accentColor = getStationColor(wk.station);
          return (
            <TouchableOpacity 
              key={wk.id} 
              style={[styles.card, { borderLeftColor: accentColor, borderLeftWidth: 4 }]} 
              activeOpacity={0.9}
              onPress={() => setSelectedWorkout(wk)}
            >
              <View style={styles.cardHeader}>
                  <View style={{flexDirection:'row', alignItems:'center', gap: 6}}>
                    <Ionicons name="flash" size={12} color={accentColor} />
                    <Text style={[styles.cardType, {color: accentColor}]}>{wk.station}</Text>
                  </View>
                  <Text style={styles.cardLevel}>{wk.level}</Text>
              </View>

              <Text style={styles.cardTitle}>{wk.title}</Text>
              
              <View style={styles.cardMetrics}>
                <View style={styles.metricItem}>
                    <Ionicons name="time" size={12} color="#666" />
                    <Text style={styles.metricText}>{wk.estTime || '20 MINS'}</Text>
                </View>
                <View style={styles.metricItem}>
                    <Ionicons name="list" size={12} color="#666" />
                    <Text style={styles.metricText}>{wk.steps.length} Steps</Text>
                </View>
                <View style={styles.metricItem}>
                    <Ionicons name="trophy" size={12} color="#666" />
                    <Text style={styles.metricText}>+{wk.stats?.xp || 100} XP</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
        <View style={{height: 100}} />
      </ScrollView>

      {/* --- BUILDER MODAL --- */}
      <Modal visible={isBuilderOpen} animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{flex: 1}}>
        <View style={styles.builderContainer}>
          
          <View style={styles.builderHeader}>
            <Text style={styles.builderTitle}>PROTOCOL BUILDER</Text>
            <TouchableOpacity onPress={() => setBuilderOpen(false)}>
                <Text style={{color:'#666', fontWeight:'900'}}>CLOSE</Text>
            </TouchableOpacity>
          </View>

          {/* 1. PROTOCOL NAME */}
          <Text style={styles.label}>CODENAME</Text>
          <TextInput 
            style={styles.input} 
            placeholder="E.G. DEATH RUN" 
            placeholderTextColor="#444" 
            value={buildTitle} 
            onChangeText={setBuildTitle} 
          />

          {/* 2. DRAFT SEQUENCE */}
          <View style={{flexDirection:'row', justifyContent:'space-between', marginTop: 10, marginBottom: 5}}>
            <Text style={styles.label}>SEQUENCE ({buildSteps.length})</Text>
            {buildSteps.length > 0 && <TouchableOpacity onPress={() => setBuildSteps([])}><Text style={{color:'#FF3B30', fontSize:10, fontWeight:'900'}}>CLEAR ALL</Text></TouchableOpacity>}
          </View>
          
          <View style={styles.draftContainer}>
            {buildSteps.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="clipboard-outline" size={24} color="#333" />
                    <Text style={styles.emptyText}>Add movements from database below.</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={{paddingBottom: 10}}>
                    {buildSteps.map((s,i) => (
                        <View key={i} style={styles.draftItem}>
                            <View style={{flexDirection:'row', gap: 10, flex: 1}}>
                                <Text style={{color:'#FFD700', fontWeight:'900'}}>{i+1}</Text>
                                <Text style={{color:'#fff', fontWeight:'bold'}}>{s}</Text>
                            </View>
                            <TouchableOpacity onPress={() => removeFromDraft(i)}>
                                <Ionicons name="close-circle" size={20} color="#FF3B30"/>
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>
            )}
          </View>

          {/* 3. EXERCISE DATABASE */}
          <View style={styles.dbHeader}>
            <Text style={styles.label}>DATABASE</Text>
            <View style={styles.searchBox}>
                <Ionicons name="search" size={14} color="#666" />
                <TextInput 
                    style={styles.searchInput} 
                    placeholder="Search..." 
                    placeholderTextColor="#444" 
                    value={buildSearch} 
                    onChangeText={setBuildSearch}
                />
                {buildSearch.length > 0 && (
                    <TouchableOpacity onPress={() => setBuildSearch("")}>
                        <Ionicons name="close" size={14} color="#666" />
                    </TouchableOpacity>
                )}
            </View>
          </View>

          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            style={styles.resultsList}
            contentContainerStyle={{paddingBottom: 20}}
            keyboardShouldPersistTaps="handled"
            renderItem={({item}) => (
                <TouchableOpacity style={styles.resultItem} onPress={() => addToDraft(item.name)}>
                    <View>
                        <Text style={{color:'#fff', fontWeight:'bold', fontSize: 13}}>{item.name}</Text>
                        <Text style={{color:'#444', fontSize: 10, fontWeight:'bold'}}>{item.type.toUpperCase()}</Text>
                    </View>
                    <Ionicons name="add-circle" size={24} color="#333"/>
                </TouchableOpacity>
            )}
          />

          <TouchableOpacity style={styles.saveBtn} onPress={saveProtocol}>
            <Text style={styles.saveBtnText}>SAVE PROTOCOL</Text>
          </TouchableOpacity>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* --- DETAIL MODAL --- */}
      <Modal visible={!!selectedWorkout} animationType="fade" transparent>
        <BlurView intensity={95} tint="dark" style={styles.detailOverlay}>
            {selectedWorkout && (
                <View style={[styles.detailBox, {borderColor: getStationColor(selectedWorkout.station)}]}>
                    <View style={styles.detailHeader}>
                        <Text style={[styles.detailStation, {color: getStationColor(selectedWorkout.station)}]}>{selectedWorkout.station}</Text>
                        <Text style={styles.detailLevel}>{selectedWorkout.level}</Text>
                    </View>
                    <Text style={styles.detailTitle}>{selectedWorkout.title}</Text>
                    <Text style={styles.detailDesc}>{selectedWorkout.desc}</Text>
                    <View style={styles.intelGrid}>
                        <View style={styles.intelItem}>
                            <Text style={styles.intelVal}>{selectedWorkout.estTime || '20 MINS'}</Text>
                            <Text style={styles.intelLabel}>DURATION</Text>
                        </View>
                        <View style={styles.intelItem}>
                            <Text style={styles.intelVal}>+{selectedWorkout.stats?.xp || 100}</Text>
                            <Text style={styles.intelLabel}>XP REWARD</Text>
                        </View>
                    </View>
                    <Text style={styles.sectionTitle}>EXECUTION STEPS</Text>
                    <ScrollView style={styles.stepsList} showsVerticalScrollIndicator={false}>
                        {selectedWorkout.steps.map((step: string, i: number) => (
                            <View key={i} style={styles.stepRow}>
                                <Text style={styles.stepIndex}>{i + 1}</Text>
                                <Text style={styles.stepText}>{step}</Text>
                            </View>
                        ))}
                    </ScrollView>
                    
                    {/* [UPDATED] Uses Smart Launch Logic */}
                    <TouchableOpacity 
                        style={[styles.startBtn, {backgroundColor: getStationColor(selectedWorkout.station)}]} 
                        onPress={handleLaunchMission}
                    >
                        <Text style={styles.startBtnText}>START MISSION</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity onPress={() => setSelectedWorkout(null)} style={styles.cancelBtn}>
                        <Text style={styles.cancelText}>ABORT</Text>
                    </TouchableOpacity>
                </View>
            )}
        </BlurView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { padding: 20, backgroundColor: '#000', borderBottomWidth: 1, borderBottomColor: '#1E1E1E' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  createBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E1E1E', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, gap: 5, borderWidth: 1, borderColor: '#333' },
  createBtnText: { fontWeight: '900', fontSize: 10, color: '#FFD700' },
  title: { color: '#fff', fontSize: 32, fontWeight: '900', fontStyle: 'italic', letterSpacing: -1 },
  filterScroll: { paddingHorizontal: 20, gap: 8, paddingVertical: 10 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: '#333' },
  activeFilter: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
  filterText: { color: '#666', fontSize: 10, fontWeight: '900' },
  listContent: { padding: 20 },
  card: { backgroundColor: '#121212', padding: 20, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#222' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  cardType: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  cardLevel: { color: '#444', fontSize: 10, fontWeight: 'bold' },
  cardTitle: { color: '#fff', fontSize: 20, fontWeight: '900', fontStyle: 'italic', marginBottom: 12 },
  cardMetrics: { flexDirection: 'row', gap: 15, borderTopWidth: 1, borderTopColor: '#222', paddingTop: 10 },
  metricItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metricText: { color: '#888', fontSize: 10, fontWeight: 'bold' },

  // BUILDER
  builderContainer: { flex: 1, backgroundColor: '#121212', padding: 20, paddingTop: 60 },
  builderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  builderTitle: { color: '#fff', fontSize: 20, fontWeight: '900', fontStyle: 'italic' },
  label: { color: '#666', fontSize: 9, fontWeight: '900', marginBottom: 5, letterSpacing: 1 },
  input: { backgroundColor: '#1E1E1E', padding: 15, borderRadius: 12, color: '#fff', fontSize: 16, marginBottom: 15, borderWidth: 1, borderColor: '#333' },
  
  // DRAFT SECTION
  draftContainer: { height: 150, backgroundColor: '#1A1A1A', borderRadius: 12, marginBottom: 20, padding: 10, borderWidth: 1, borderColor: '#333' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', opacity: 0.5 },
  emptyText: { color: '#666', marginTop: 10, fontStyle: 'italic', fontSize: 12 },
  draftItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#222', padding: 10, borderRadius: 8, marginBottom: 6 },
  
  // DATABASE SECTION
  dbHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E1E1E', paddingHorizontal: 10, borderRadius: 8, height: 36, borderWidth: 1, borderColor: '#333', width: '50%' },
  searchInput: { flex: 1, color: '#fff', marginLeft: 8, fontSize: 12 },
  resultsList: { flex: 1, backgroundColor: '#121212', borderRadius: 12 },
  resultItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#222' },
  
  saveBtn: { backgroundColor: '#FFD700', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 10, marginBottom: 20 },
  saveBtnText: { color: '#000', fontWeight: '900', fontSize: 16 },

  // DETAIL MODAL
  detailOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 15 },
  detailBox: { backgroundColor: '#000', width: '100%', padding: 25, borderRadius: 24, maxHeight: '85%', borderWidth: 2 },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  detailStation: { fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  detailLevel: { color: '#666', fontSize: 12, fontWeight: 'bold' },
  detailTitle: { color: '#fff', fontSize: 28, fontWeight: '900', fontStyle: 'italic', marginBottom: 10 },
  detailDesc: { color: '#AAA', fontSize: 14, lineHeight: 20, marginBottom: 20 },
  intelGrid: { flexDirection: 'row', gap: 10, marginBottom: 25 },
  intelItem: { flex: 1, backgroundColor: '#1A1A1A', padding: 10, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  intelVal: { color: '#fff', fontSize: 16, fontWeight: '900' },
  intelLabel: { color: '#666', fontSize: 8, fontWeight: '900', marginTop: 4 },
  sectionTitle: { color: '#FFD700', fontSize: 12, fontWeight: '900', marginBottom: 10, letterSpacing: 1 },
  stepsList: { maxHeight: 250 },
  stepRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'center' },
  stepIndex: { color: '#444', fontSize: 12, fontWeight: '900', width: 25 },
  stepText: { color: '#DDD', fontSize: 15, fontWeight: '500' },
  startBtn: { padding: 18, borderRadius: 16, alignItems: 'center', marginBottom: 10, marginTop: 20 },
  startBtnText: { color: '#000', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  cancelBtn: { padding: 10, alignItems: 'center' },
  cancelText: { color: '#666', fontWeight: 'bold', fontSize: 12 }
});