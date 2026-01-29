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

export default function Onboarding() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // --- FORM STATE ---
  const [name, setName] = useState('');
  const [level, setLevel] = useState('INTERMEDIATE');
  
  // Race Selection
  const [targetRace, setTargetRace] = useState<RaceEvent | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<Region>('ALL');

  // Strategy
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

  // --- GENERATE TAILORED PLAN ---
  const generateWeeklyPlan = (userLevel: string) => {
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const fullDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
    
    // TEMPLATES
    const ROOKIE_TEMPLATE = ['Rest', 'Strength', 'Rest', 'Run', 'Rest', 'Hybrid', 'Rest'];
    const INT_TEMPLATE = ['Run', 'Strength', 'Run', 'Rest', 'Hybrid', 'Hyrox', 'Rest'];
    const ELITE_TEMPLATE = ['Run', 'Strength', 'Run', 'Hybrid', 'Recovery', 'Hyrox', 'Run'];

    let template = INT_TEMPLATE;
    if (userLevel === 'ROOKIE') template = ROOKIE_TEMPLATE;
    if (userLevel === 'ELITE') template = ELITE_TEMPLATE;

    return days.map((d, i) => ({
      day: d,
      fullDay: fullDays[i],
      type: template[i],
      title: template[i] === 'Rest' ? 'REST DAY' : `${template[i].toUpperCase()} SESSION`,
      subtitle: template[i] === 'Rest' ? 'Recovery & Mobility' : 'Tap to customize orders',
      duration: template[i] === 'Rest' ? '0' : '60',
      rpe: template[i] === 'Rest' ? '0' : '7',
      complete: false
    }));
  };

  const completeOnboarding = async () => {
    const profile = { 
        name: name || 'ATHLETE',
        level,
        targetRace, 
        targetTime: targetTime || '90', 
        athleteType,
        joined: new Date().toISOString() 
    };
    await AsyncStorage.setItem('user_profile', JSON.stringify(profile));

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

        <Text style={[styles.label, { marginTop: 30 }]}>EXPERIENCE LEVEL</Text>
        <Text style={styles.helperText}>This will determine your weekly training volume.</Text>
        
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

  // --- STEP 2: RACES (WITH FILTER) ---
  const renderStep2 = () => {
      // Filter races
      const filteredRaces = selectedRegion === 'ALL' 
          ? UPCOMING_RACES 
          : UPCOMING_RACES.filter(r => r.region === selectedRegion);

      return (
        <View style={styles.stepContainer}>
            <Text style={styles.label}>SELECT DEPLOYMENT</Text>
            
            {/* REGION CHIPS */}
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

            {/* NO RACE OPTION */}
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
        
        {/* HEADER */}
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

        {/* TITLES */}
        <View style={styles.titleContainer}>
          <Text style={styles.stepTitle}>{STEPS[currentStep].title}</Text>
          <Text style={styles.stepSub}>{STEPS[currentStep].subtitle}</Text>
        </View>

        {/* SLIDING CONTENT */}
        <Animated.View style={[styles.slider, { transform: [{ translateX: slideAnim }] }]}>
          <View style={{ width }}>{renderStep1()}</View>
          <View style={{ width }}>{renderStep2()}</View>
          <View style={{ width }}>{renderStep3()}</View>
        </Animated.View>

        {/* FOOTER */}
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

  // REGION CHIPS
  regionChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: '#333', justifyContent: 'center' },
  regionChipActive: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
  regionText: { color: '#666', fontWeight: '900', fontSize: 10 },

  // LEVEL CARDS
  levelContainer: { gap: 10, marginTop: 15 },
  levelCard: { backgroundColor: '#1E1E1E', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#333' },
  levelCardActive: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
  levelHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  levelTitle: { color: '#fff', fontSize: 16, fontWeight: '900' },
  levelSub: { color: '#666', fontSize: 12, fontWeight: 'bold' },

  // NO RACE CARD
  noRaceCard: { flexDirection: 'row', gap: 15, alignItems: 'center', backgroundColor: '#151515', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#444' },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' },

  // RACE CARDS
  raceCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1E1E1E', padding: 20, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#333' },
  raceCardActive: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
  raceCity: { color: '#fff', fontSize: 18, fontWeight: '900', fontStyle: 'italic' },
  raceDate: { color: '#666', fontSize: 12, fontWeight: 'bold', marginTop: 4 },

  // PROFILE CARDS
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