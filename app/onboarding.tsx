import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// --- DATA CONFIG ---
const RACES = [
  { city: 'LONDON', date: 'MAY 04', type: 'MAJOR', venue: 'Olympia' },
  { city: 'NEW YORK', date: 'JUN 01', type: 'MAJOR', venue: 'Javits Ctr' },
  { city: 'DUBAI', date: 'FEB 12', type: 'INTL', venue: 'DWTC' },
  { city: 'CHICAGO', date: 'NOV 11', type: 'US', venue: 'Navy Pier' },
];

const EXPERIENCE_LEVELS = [
  { 
    id: 'ROOKIE', 
    label: 'FIRST TIMER', 
    icon: 'leaf',
    desc: 'I have never done a Hyrox race before. I need guidance.' 
  },
  { 
    id: 'ATHLETE', 
    label: 'EXPERIENCED', 
    icon: 'medal',
    desc: 'I have raced before and want to beat my time.' 
  },
];

const ATHLETE_TYPES = [
  { id: 'RUNNER', label: 'RUNNER', desc: 'Good at cardio, need help with weights.' },
  { id: 'BALANCED', label: 'HYBRID', desc: 'I feel okay at both running and lifting.' },
  { id: 'LIFTER', label: 'LIFTER', desc: 'Strong at stations, struggle with running.' },
];

const GOALS = [
  { 
    id: 'ENGINE', 
    label: 'BUILD ENDURANCE', 
    icon: 'heart-circle', 
    desc: 'Focus on running capacity so you don\'t burn out.' 
  },
  { 
    id: 'STRENGTH', 
    label: 'BUILD STRENGTH', 
    icon: 'barbell', 
    desc: 'Focus on moving the heavy sleds comfortably.' 
  },
  { 
    id: 'COMPROMISE', 
    label: 'RACE SIMULATION', 
    icon: 'stopwatch', 
    desc: 'Practice running while your legs are tired.' 
  },
];

export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [experience, setExperience] = useState('ROOKIE'); // NEW
  const [selectedRace, setSelectedRace] = useState<number | null>(null);
  const [athleteType, setAthleteType] = useState('BALANCED');
  const [primaryGoal, setPrimaryGoal] = useState('ENGINE'); 
  const [targetTime, setTargetTime] = useState('90');

  const finishSetup = async () => {
    const profile = {
      name,
      experience,
      targetRace: selectedRace !== null ? RACES[selectedRace] : null,
      athleteType,
      primaryGoal,
      targetTime,
      isOnboarded: true
    };
    
    // Clear old data for a fresh start
    await AsyncStorage.removeItem('user_weekly_plan');
    await AsyncStorage.setItem('user_profile', JSON.stringify(profile));
    
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      
      {/* Progress Bar (5 Steps now) */}
      <View style={[styles.progressContainer, { marginTop: insets.top + 20 }]}>
        <View style={[styles.progressBar, { width: `${(step / 5) * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* STEP 1: WELCOME */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Ionicons name="hand-right-outline" size={60} color="#FFD700" style={{marginBottom: 20}} />
            <Text style={styles.stepTitle}>WELCOME</Text>
            <Text style={styles.stepSub}>Let's build your perfect training plan. What should we call you?</Text>
            
            <View style={styles.inputContainer}>
                <Text style={styles.label}>FIRST NAME</Text>
                <TextInput 
                    style={styles.textInput} 
                    placeholder="e.g. Sarah" 
                    placeholderTextColor="#444"
                    value={name}
                    onChangeText={setName}
                    autoFocus
                />
            </View>

            <TouchableOpacity 
                style={[styles.nextBtn, !name && styles.disabledBtn]} 
                disabled={!name}
                onPress={() => setStep(2)}
            >
                <Text style={styles.nextText}>NEXT STEP</Text>
                <Ionicons name="arrow-forward" size={20} color="#000" />
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 2: EXPERIENCE LEVEL (NEW) */}
        {step === 2 && (
          <View style={styles.stepContainer}>
            <Ionicons name="school-outline" size={60} color="#FFD700" style={{marginBottom: 20}} />
            <Text style={styles.stepTitle}>EXPERIENCE</Text>
            <Text style={styles.stepSub}>Have you competed in Hyrox before?</Text>
            
            <View style={styles.typeList}>
                {EXPERIENCE_LEVELS.map((level) => (
                    <TouchableOpacity 
                        key={level.id} 
                        style={[styles.typeCard, experience === level.id && styles.typeCardActive]}
                        onPress={() => setExperience(level.id)}
                    >
                        <View style={styles.typeHeader}>
                            <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                                <Ionicons name={level.icon as any} size={22} color={experience === level.id ? '#000' : '#FFD700'} />
                                <Text style={[styles.typeLabel, experience === level.id && {color: '#000'}]}>{level.label}</Text>
                            </View>
                            {experience === level.id && <Ionicons name="checkmark-circle" size={22} color="#000" />}
                        </View>
                        <Text style={[styles.typeDesc, experience === level.id && {color: '#333'}]}>{level.desc}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <TouchableOpacity style={styles.nextBtn} onPress={() => setStep(3)}>
                <Text style={styles.nextText}>CONTINUE</Text>
                <Ionicons name="arrow-forward" size={20} color="#000" />
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 3: FITNESS PROFILE */}
        {step === 3 && (
          <View style={styles.stepContainer}>
            <Ionicons name="body-outline" size={60} color="#FFD700" style={{marginBottom: 20}} />
            <Text style={styles.stepTitle}>YOUR BASE</Text>
            <Text style={styles.stepSub}>How would you describe your current fitness?</Text>
            
            <View style={styles.typeList}>
                {ATHLETE_TYPES.map((type) => (
                    <TouchableOpacity 
                        key={type.id} 
                        style={[styles.typeCard, athleteType === type.id && styles.typeCardActive]}
                        onPress={() => setAthleteType(type.id)}
                    >
                        <View style={styles.typeHeader}>
                            <Text style={[styles.typeLabel, athleteType === type.id && {color: '#000'}]}>{type.label}</Text>
                            {athleteType === type.id && <Ionicons name="checkmark-circle" size={20} color="#000" />}
                        </View>
                        <Text style={[styles.typeDesc, athleteType === type.id && {color: '#333'}]}>{type.desc}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <TouchableOpacity style={styles.nextBtn} onPress={() => setStep(4)}>
                <Text style={styles.nextText}>CONTINUE</Text>
                <Ionicons name="arrow-forward" size={20} color="#000" />
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 4: GOAL */}
        {step === 4 && (
          <View style={styles.stepContainer}>
            <Ionicons name="compass-outline" size={60} color="#FFD700" style={{marginBottom: 20}} />
            <Text style={styles.stepTitle}>PRIMARY GOAL</Text>
            <Text style={styles.stepSub}>What do you want to improve the most?</Text>
            
            <View style={styles.typeList}>
                {GOALS.map((goal) => (
                    <TouchableOpacity 
                        key={goal.id} 
                        style={[styles.typeCard, primaryGoal === goal.id && styles.typeCardActive]}
                        onPress={() => setPrimaryGoal(goal.id)}
                    >
                        <View style={styles.typeHeader}>
                            <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                                <Ionicons name={goal.icon as any} size={20} color={primaryGoal === goal.id ? '#000' : '#FFD700'} />
                                <Text style={[styles.typeLabel, primaryGoal === goal.id && {color: '#000'}]}>{goal.label}</Text>
                            </View>
                            {primaryGoal === goal.id && <Ionicons name="checkmark-circle" size={20} color="#000" />}
                        </View>
                        <Text style={[styles.typeDesc, primaryGoal === goal.id && {color: '#333'}]}>{goal.desc}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <TouchableOpacity style={styles.nextBtn} onPress={() => setStep(5)}>
                <Text style={styles.nextText}>NEXT STEP</Text>
                <Ionicons name="arrow-forward" size={20} color="#000" />
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 5: RACE SELECT */}
        {step === 5 && (
          <View style={styles.stepContainer}>
            <Ionicons name="calendar-outline" size={60} color="#FFD700" style={{marginBottom: 20}} />
            <Text style={styles.stepTitle}>EVENTS</Text>
            <Text style={styles.stepSub}>Do you have a race booked?</Text>
            
            <View style={styles.listContainer}>
                <TouchableOpacity 
                    style={[styles.raceOption, selectedRace === null && styles.raceOptionActive]}
                    onPress={() => setSelectedRace(null)}
                >
                    <View>
                        <Text style={[styles.raceCity, selectedRace === null && {color: '#000'}]}>NOT YET</Text>
                        <Text style={[styles.raceDate, selectedRace === null && {color: '#333'}]}>Just training for fitness</Text>
                    </View>
                    {selectedRace === null && <Ionicons name="checkmark-circle" size={24} color="#000" />}
                </TouchableOpacity>

                {RACES.map((race, index) => (
                    <TouchableOpacity 
                        key={index} 
                        style={[styles.raceOption, selectedRace === index && styles.raceOptionActive]}
                        onPress={() => setSelectedRace(index)}
                    >
                        <View>
                            <Text style={[styles.raceCity, selectedRace === index && {color: '#000'}]}>{race.city}</Text>
                            <Text style={[styles.raceDate, selectedRace === index && {color: '#333'}]}>{race.date}</Text>
                        </View>
                        {selectedRace === index && <Ionicons name="checkmark-circle" size={24} color="#000" />}
                    </TouchableOpacity>
                ))}
            </View>

            <TouchableOpacity style={styles.finishBtn} onPress={finishSetup}>
                <Text style={styles.finishText}>CREATE MY PLAN</Text>
                <Ionicons name="checkmark" size={24} color="#000" />
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  progressContainer: { height: 4, backgroundColor: '#222', marginHorizontal: 20, borderRadius: 2, marginBottom: 20 },
  progressBar: { height: '100%', backgroundColor: '#FFD700', borderRadius: 2 },
  scrollContent: { flexGrow: 1, paddingBottom: 50 },
  
  stepContainer: { flex: 1, paddingHorizontal: 25, alignItems: 'center', paddingTop: 10 },
  stepTitle: { fontSize: 24, fontWeight: '900', color: '#fff', letterSpacing: 0.5, marginBottom: 8 },
  stepSub: { fontSize: 16, color: '#999', textAlign: 'center', marginBottom: 30, lineHeight: 22 },
  
  inputContainer: { width: '100%', marginBottom: 40 },
  label: { color: '#FFD700', fontSize: 12, fontWeight: '900', marginBottom: 10, alignSelf: 'flex-start' },
  textInput: { width: '100%', backgroundColor: '#1E1E1E', padding: 20, borderRadius: 15, color: '#fff', fontSize: 24, fontWeight: 'bold', borderWidth: 1, borderColor: '#333' },
  
  nextBtn: { flexDirection: 'row', backgroundColor: '#FFD700', paddingVertical: 18, paddingHorizontal: 30, borderRadius: 30, alignItems: 'center', gap: 10, marginTop: 30, marginBottom: 30 },
  nextText: { color: '#000', fontSize: 16, fontWeight: '900' },
  disabledBtn: { backgroundColor: '#333', opacity: 0.5 },
  
  listContainer: { width: '100%', gap: 12, marginBottom: 20 },
  raceOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#1E1E1E', borderRadius: 15, borderWidth: 1, borderColor: '#333' },
  raceOptionActive: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
  raceCity: { color: '#fff', fontSize: 18, fontWeight: '900' },
  raceDate: { color: '#888', fontSize: 14, marginTop: 4 },

  typeList: { width: '100%', gap: 12 },
  typeCard: { padding: 20, backgroundColor: '#1E1E1E', borderRadius: 15, borderWidth: 1, borderColor: '#333' },
  typeCardActive: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
  typeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  typeLabel: { color: '#fff', fontSize: 16, fontWeight: '900' },
  typeDesc: { color: '#888', fontSize: 14, lineHeight: 20 },
  
  finishBtn: { width: '100%', flexDirection: 'row', backgroundColor: '#FFD700', paddingVertical: 20, borderRadius: 20, alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 40, marginBottom: 50 },
  finishText: { color: '#000', fontSize: 18, fontWeight: '900' },
});