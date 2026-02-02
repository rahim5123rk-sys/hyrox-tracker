import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// IMPORT DATA
import { RaceEvent, Region, UPCOMING_RACES } from './data/races';
import { ALL_WORKOUTS } from './data/workouts';

const { width } = Dimensions.get('window');

const STEPS = [
  { id: '1', title: 'IDENTIFICATION', subtitle: 'Establish your service record.' },
  { id: '2', title: 'MISSION TARGET', subtitle: 'Select your deployment.' },
  { id: '3', title: 'TACTICAL PROFILE', subtitle: 'Define your strategy.' },
];

const ATHLETE_PROFILES = [
  { 
    id: 'RUNNER', 
    label: 'THE RUNNER', 
    desc: 'High aerobic engine, but lacks raw power. We will focus on sled strength and wall ball capacity.' 
  },
  { 
    id: 'LIFTER', 
    label: 'THE LIFTER', 
    desc: 'Strong and explosive, but redlines on the run. We will focus on compromised running and endurance.' 
  },
  { 
    id: 'BALANCED', 
    label: 'THE HYBRID', 
    desc: 'Jack of all trades. We will focus on transition speed and threshold pacing.' 
  },
];

const LEVELS = [
  { id: 'ROOKIE', label: 'ROOKIE', sub: 'New to Hyrox. 3 sessions/week.' },
  { id: 'INTERMEDIATE', label: 'INTERMEDIATE', sub: 'Experienced. 5 sessions/week.' },
  { id: 'ELITE', label: 'ELITE', sub: 'Competitive. 6+ sessions/week.' }
];

const DIVISIONS = [
    { id: 'MEN_OPEN', label: 'MEN OPEN' },
    { id: 'WOMEN_OPEN', label: 'WOMEN OPEN' },
    { id: 'MEN_PRO', label: 'MEN PRO' },
    { id: 'WOMEN_PRO', label: 'WOMEN PRO' },
    { id: 'DOUBLES_MEN', label: 'MEN DOUBLES' },
    { id: 'DOUBLES_WOMEN', label: 'WOMEN DOUBLES' },
    { id: 'DOUBLES_MIXED', label: 'MIXED DOUBLES' },
];

export default function Onboarding() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // --- FORM STATE ---
  const [name, setName] = useState('');
  const [category, setCategory] = useState('MEN_OPEN'); // NEW: Division State
  const [level, setLevel] = useState('INTERMEDIATE');
  
  const [targetRace, setTargetRace] = useState<RaceEvent | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<Region>('ALL');

  const [targetTime, setTargetTime] = useState('');
  const [athleteType, setAthleteType] = useState('BALANCED');

  const handleNext = async () => {
    Keyboard.dismiss();
    if (currentStep < STEPS.length - 1) {
      Animated.timing(slideAnim, {
        toValue: -(width * (currentStep + 1)),
        duration: 300,
        useNativeDriver: true,
      }).start();
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const handleBack = () => {
    Keyboard.dismiss();
    if (currentStep > 0) {
      Animated.timing(slideAnim, {
        toValue: -(width * (currentStep - 1)),
        duration: 300,
        useNativeDriver: true,
      }).start();
      setCurrentStep(currentStep - 1);
    }
  };

  // --- INTELLIGENCE: MISSION SELECTOR ---
  const getMissionOrder = (type: string, userLevel: string) => {
    if (type === 'Rest' || type === 'Recovery') return null;

    const allowedLevels = userLevel === 'ROOKIE' 
        ? ['BEGINNER', 'ALL LEVELS']
        : userLevel === 'ELITE'
        ? ['ADVANCED', 'ELITE']
        : ['INTERMEDIATE', 'ADVANCED', 'ALL LEVELS'];

    let candidates = ALL_WORKOUTS.filter(w => allowedLevels.includes(w.level));

    if (type === 'Strength') {
        candidates = candidates.filter(w => 
            ['SLED PUSH', 'SLED PULL', 'FARMERS', 'WALL BALLS'].includes(w.station) || w.type === 'STRENGTH'
        );
    } else if (type === 'Hybrid' || type === 'Hyrox') {
        candidates = candidates.filter(w => 
            ['HYBRID', 'BURPEES', 'LUNGES'].includes(w.station) || w.type === 'SIMULATION'
        );
    } else if (type === 'Run') {
        candidates = candidates.filter(w => ['ROWING', 'SKI ERG'].includes(w.station));
    }

    if (candidates.length > 0) {
        const randomIndex = Math.floor(Math.random() * candidates.length);
        return candidates[randomIndex].id;
    }
    return null;
  };

  const generateWeeklyPlan = (userLevel: string) => {
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const fullDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
    
    const ROOKIE_TEMPLATE = ['Rest', 'Strength', 'Rest', 'Run', 'Rest', 'Hybrid', 'Rest'];
    const INT_TEMPLATE = ['Run', 'Strength', 'Run', 'Rest', 'Hybrid', 'Hyrox', 'Rest'];
    const ELITE_TEMPLATE = ['Run', 'Strength', 'Run', 'Hybrid', 'Recovery', 'Hyrox', 'Run'];

    let template = INT_TEMPLATE;
    if (userLevel === 'ROOKIE') template = ROOKIE_TEMPLATE;
    if (userLevel === 'ELITE') template = ELITE_TEMPLATE;

    return days.map((d, i) => {
      const type = template[i];
      const isRest = type === 'Rest' || type === 'Recovery';
      const assignedMissionId = getMissionOrder(type, userLevel);
      const assignedWorkout = assignedMissionId ? ALL_WORKOUTS.find(w => w.id === assignedMissionId) : null;

      return {
        day: d,
        fullDay: fullDays[i],
        type: type,
        title: assignedWorkout ? assignedWorkout.title : (isRest ? 'RECOVERY PROTOCOL' : `${type.toUpperCase()} SESSION`),
        subtitle: assignedWorkout ? `${assignedWorkout.station} • ${assignedWorkout.level}` : (isRest ? 'Mobility & Hydration' : 'Tap to select mission'),
        scheduledId: assignedMissionId || null, 
        duration: isRest ? '0' : '60',
        rpe: isRest ? '0' : '7',
        complete: false
      };
    });
  };

  const completeOnboarding = async () => {
    // SAVE PROFILE
    const profile = { 
        name: name || 'ATHLETE',
        level,
        targetRace, 
        targetTime: targetTime || '90', 
        athleteType,
        joined: new Date().toISOString() 
    };
    await AsyncStorage.setItem('user_profile', JSON.stringify(profile));
    
    // SAVE CATEGORY (GENDER CONTEXT)
    await AsyncStorage.setItem('userCategory', category);

    // GENERATE PLAN
    const initialPlan = generateWeeklyPlan(level);
    await AsyncStorage.setItem('user_weekly_plan', JSON.stringify(initialPlan));

    router.replace('/');
  };

  // --- STEP 1: IDENTITY ---
  const renderStep1 = () => (
    <ScrollView style={styles.stepScroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>NAME / NICKNAME</Text>
        <TextInput 
            style={styles.input} 
            placeholder="E.G. ALEX" 
            placeholderTextColor="#444" 
            value={name} 
            onChangeText={setName} 
            autoCapitalize="words"
        />

        <Text style={[styles.label, { marginTop: 30 }]}>SERVICE CATEGORY</Text>
        <Text style={styles.helperText}>Used for division standards and PFT benchmarks.</Text>
        <View style={styles.catGrid}>
            {DIVISIONS.map((div) => (
                <TouchableOpacity 
                    key={div.id} 
                    style={[styles.catChip, category === div.id && styles.catChipActive]}
                    onPress={() => setCategory(div.id)}
                >
                    <Text style={[styles.catText, category === div.id && {color: '#000'}]}>{div.label}</Text>
                </TouchableOpacity>
            ))}
        </View>

        <Text style={[styles.label, { marginTop: 30 }]}>EXPERIENCE LEVEL</Text>
        <View style={styles.levelContainer}>
            {LEVELS.map((lvl) => (
                <TouchableOpacity 
                    key={lvl.id} 
                    style={[styles.levelCard, level === lvl.id && styles.levelCardActive]} 
                    onPress={() => setLevel(lvl.id)}
                    activeOpacity={0.9}
                >
                    <View style={styles.levelHeader}>
                        <Text style={[styles.levelTitle, level === lvl.id && {color: '#000'}]}>{lvl.label}</Text>
                        {level === lvl.id && <Ionicons name="checkmark-circle" size={18} color="#000" />}
                    </View>
                    <Text style={[styles.levelSub, level === lvl.id && {color: '#333'}]}>{lvl.sub}</Text>
                </TouchableOpacity>
            ))}
        </View>
    </ScrollView>
  );

  // --- STEP 2: RACES ---
  const renderStep2 = () => {
      const filteredRaces = selectedRegion === 'ALL' 
          ? UPCOMING_RACES 
          : UPCOMING_RACES.filter(r => r.region === selectedRegion);

      return (
        <View style={styles.stepContainer}>
            <Text style={styles.label}>SELECT DEPLOYMENT</Text>
            <View style={{ height: 50, marginBottom: 10 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    {['ALL', 'UK', 'EUROPE', 'USA', 'APAC', 'LATAM'].map((region) => (
                        <TouchableOpacity 
                            key={region} 
                            style={[styles.regionChip, selectedRegion === region && styles.regionChipActive]}
                            onPress={() => setSelectedRegion(region as Region)}
                        >
                            <Text style={[styles.regionText, selectedRegion === region && {color: '#000'}]}>{region}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <TouchableOpacity 
                style={[styles.noRaceCard, targetRace === null && styles.raceCardActive]} 
                onPress={() => setTargetRace(null)}
                activeOpacity={0.8}
            >
                <View style={styles.iconCircle}>
                    <Ionicons name="infinite" size={20} color={targetRace === null ? "#000" : "#fff"} />
                </View>
                <View style={{flex: 1}}>
                    <Text style={[styles.raceCity, targetRace === null && {color: '#000'}]}>OFF SEASON</Text>
                    <Text style={[styles.raceDate, targetRace === null && {color: '#000'}]}>Training without a specific deadline.</Text>
                </View>
                {targetRace === null && <Ionicons name="checkmark-circle" size={24} color="#000" />}
            </TouchableOpacity>

            <Text style={[styles.label, { marginTop: 20, marginBottom: 10 }]}>UPCOMING EVENTS ({filteredRaces.length})</Text>

            <FlatList
                data={filteredRaces}
                keyExtractor={(item) => item.id}
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                    <TouchableOpacity 
                        style={[styles.raceCard, targetRace?.id === item.id && styles.raceCardActive]} 
                        onPress={() => setTargetRace(item)}
                    >
                        <View>
                            <Text style={[styles.raceCity, targetRace?.id === item.id && {color: '#000'}]}>{item.city}</Text>
                            <Text style={[styles.raceDate, targetRace?.id === item.id && {color: '#000'}]}>{item.date}</Text>
                        </View>
                        {targetRace?.id === item.id && <Ionicons name="checkmark-circle" size={24} color="#000" />}
                    </TouchableOpacity>
                )}
            />
        </View>
      );
  };

  // --- STEP 3: STRATEGY ---
  const renderStep3 = () => (
    <ScrollView style={styles.stepScroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>GOAL FINISH TIME (MINS)</Text>
        <TextInput 
            style={styles.input} 
            placeholder="90" 
            placeholderTextColor="#444" 
            value={targetTime} 
            onChangeText={setTargetTime} 
            keyboardType="numeric"
            maxLength={3}
        />
        <Text style={styles.helperText}>Elite: &lt;60m • Pro: &lt;70m • Open: 90m</Text>

        <Text style={[styles.label, { marginTop: 30 }]}>ATHLETE BIAS</Text>
        <Text style={styles.helperText}>Select the profile that best describes your weakness.</Text>
        
        <View style={styles.profileContainer}>
            {ATHLETE_PROFILES.map((profile) => (
                <TouchableOpacity 
                    key={profile.id} 
                    style={[styles.profileCard, athleteType === profile.id && styles.profileCardActive]} 
                    onPress={() => setAthleteType(profile.id)}
                    activeOpacity={0.9}
                >
                    <View style={styles.profileHeader}>
                        <Text style={[styles.profileTitle, athleteType === profile.id && {color: '#000'}]}>{profile.label}</Text>
                        {athleteType === profile.id && <Ionicons name="checkmark-circle" size={20} color="#000" />}
                    </View>
                    <Text style={[styles.profileDesc, athleteType === profile.id && {color: '#333'}]}>
                        {profile.desc}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          {currentStep > 0 ? (
              <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
                  <Ionicons name="arrow-back" size={24} color="#666" />
              </TouchableOpacity>
          ) : <View style={{width: 40}} />}
          <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { width: `${((currentStep + 1) / STEPS.length) * 100}%` }]} />
          </View>
          <View style={{width: 40}} /> 
        </View>

        <View style={styles.titleContainer}>
          <Text style={styles.stepTitle}>{STEPS[currentStep].title}</Text>
          <Text style={styles.stepSub}>{STEPS[currentStep].subtitle}</Text>
        </View>

        <Animated.View style={[styles.slider, { transform: [{ translateX: slideAnim }] }]}>
          <View style={{ width }}>{renderStep1()}</View>
          <View style={{ width }}>{renderStep2()}</View>
          <View style={{ width }}>{renderStep3()}</View>
        </Animated.View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
              <Text style={styles.nextText}>{currentStep === STEPS.length - 1 ? "INITIALIZE" : "NEXT"}</Text>
              <Ionicons name="arrow-forward" size={20} color="#000" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, height: 60, justifyContent: 'space-between' },
  backBtn: { padding: 5 },
  progressContainer: { flex: 1, height: 4, backgroundColor: '#222', borderRadius: 2, marginHorizontal: 20 },
  progressBar: { height: '100%', backgroundColor: '#FFD700', borderRadius: 2 },
  
  titleContainer: { paddingHorizontal: 25, marginTop: 20, marginBottom: 30 },
  stepTitle: { color: '#fff', fontSize: 28, fontWeight: '900', fontStyle: 'italic', letterSpacing: 1 },
  stepSub: { color: '#666', fontSize: 14, marginTop: 5, fontWeight: '500' },

  slider: { flexDirection: 'row', flex: 1 },
  stepContainer: { flex: 1, paddingHorizontal: 25 },
  stepScroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 25, paddingBottom: 100 },
  
  label: { color: '#FFD700', fontSize: 10, fontWeight: '900', marginBottom: 10, letterSpacing: 1 },
  input: { backgroundColor: '#1E1E1E', fontSize: 24, color: '#fff', padding: 20, borderRadius: 16, fontWeight: 'bold', borderWidth: 1, borderColor: '#333' },
  helperText: { color: '#666', fontSize: 12, marginTop: 8, fontStyle: 'italic', lineHeight: 18 },

  // DIVISION SELECTOR
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  catChip: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: '#333' },
  catChipActive: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
  catText: { color: '#666', fontWeight: '900', fontSize: 10 },

  // REGION CHIPS
  regionChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: '#333', justifyContent: 'center' },
  regionChipActive: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
  regionText: { color: '#666', fontWeight: '900', fontSize: 10 },

  levelContainer: { gap: 10, marginTop: 15 },
  levelCard: { backgroundColor: '#1E1E1E', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#333' },
  levelCardActive: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
  levelHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  levelTitle: { color: '#fff', fontSize: 16, fontWeight: '900' },
  levelSub: { color: '#666', fontSize: 12, fontWeight: 'bold' },

  noRaceCard: { flexDirection: 'row', gap: 15, alignItems: 'center', backgroundColor: '#151515', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#444' },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' },

  raceCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1E1E1E', padding: 20, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#333' },
  raceCardActive: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
  raceCity: { color: '#fff', fontSize: 18, fontWeight: '900', fontStyle: 'italic' },
  raceDate: { color: '#666', fontSize: 12, fontWeight: 'bold', marginTop: 4 },

  profileContainer: { marginTop: 15, gap: 12 },
  profileCard: { backgroundColor: '#1E1E1E', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#333' },
  profileCardActive: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
  profileHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  profileTitle: { color: '#fff', fontSize: 16, fontWeight: '900' },
  profileDesc: { color: '#888', fontSize: 12, lineHeight: 18 },

  footer: { padding: 25, paddingBottom: 40 },
  nextBtn: { backgroundColor: '#FFD700', padding: 20, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  nextText: { color: '#000', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
});