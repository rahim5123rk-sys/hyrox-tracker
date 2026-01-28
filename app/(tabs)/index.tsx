import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useCallback, useEffect, useState } from 'react';
import { ImageBackground, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// --- DATA ---
const UPCOMING_EVENTS = [
  { id: 1, city: 'LONDON', date: 'MAY 04', type: 'MAJOR', days: 42 },
  { id: 2, city: 'GLASGOW', date: 'MAR 12', type: 'REGIONAL', days: 14 },
  { id: 3, city: 'STOCKHOLM', date: 'JUN 21', type: 'CHAMPS', days: 85 },
  { id: 4, city: 'NEW YORK', date: 'NOV 11', type: 'MAJOR', days: 210 },
];

const STRATEGY_VIDEOS: any = {
  RUNNER: require('../../assets/videos/runner.mp4'),
  BALANCED: require('../../assets/videos/balanced.mp4'),
  LIFTER: require('../../assets/videos/lifter.mp4'),
};

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [targetTime, setTargetTime] = useState('80');
  const [athleteType, setAthleteType] = useState('BALANCED');
  const [selectedEventIndex, setSelectedEventIndex] = useState(0);
  const [isNotifyEnabled, setIsNotifyEnabled] = useState(false);
  const [weeklyPlan, setWeeklyPlan] = useState<any[]>([]);

  const currentEvent = UPCOMING_EVENTS[selectedEventIndex];

  // Reload planner logic
  useFocusEffect(
    useCallback(() => {
      loadPlan();
    }, [])
  );

  const loadPlan = async () => {
    const saved = await AsyncStorage.getItem('user_weekly_plan');
    if (saved) {
        setWeeklyPlan(JSON.parse(saved));
    } else {
        const defaultPlan = [
            { day: 'MON', focus: 'LOWER BODY', type: 'Strength', complete: false },
            { day: 'TUE', focus: 'ZONE 2', type: 'Run', complete: false },
            { day: 'WED', focus: 'UPPER BODY', type: 'Strength', complete: false },
            { day: 'THU', focus: 'INTERVALS', type: 'Run', complete: false },
            { day: 'FRI', focus: 'FULL BODY', type: 'Hybrid', complete: false },
            { day: 'SAT', focus: 'SIMULATION', type: 'Hyrox', complete: false },
            { day: 'SUN', focus: 'REST', type: 'Recovery', complete: false },
        ];
        setWeeklyPlan(defaultPlan);
        AsyncStorage.setItem('user_weekly_plan', JSON.stringify(defaultPlan));
    }
  };

  const completedCount = weeklyPlan.filter(d => d.complete).length;
  const progress = weeklyPlan.length > 0 ? completedCount / weeklyPlan.length : 0;

  // Video Player
  const player = useVideoPlayer(STRATEGY_VIDEOS.BALANCED, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  useEffect(() => {
    async function updateVideo() {
        try { await player.replaceAsync(STRATEGY_VIDEOS[athleteType]); player.play(); } catch (e) {}
    }
    updateVideo();
  }, [athleteType]);

  const cycleEvent = () => {
    const nextIndex = (selectedEventIndex + 1) % UPCOMING_EVENTS.length;
    setSelectedEventIndex(nextIndex);
  };

  const scheduleDailyReminder = async () => {
    setIsNotifyEnabled(!isNotifyEnabled);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* HERO BACKGROUND */}
      <ImageBackground 
        source={{ uri: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000' }} 
        style={[styles.hero, { paddingTop: insets.top + 20 }]}
        imageStyle={{ opacity: 0.5 }}
      >
        <View style={styles.heroContent}>
            <TouchableOpacity onPress={scheduleDailyReminder} style={styles.statusBadge}>
                <View style={[styles.pulse, { backgroundColor: isNotifyEnabled ? '#FFD700' : '#444' }]} />
                <Text style={styles.statusText}>{isNotifyEnabled ? 'SYSTEM ACTIVE' : 'ALERTS OFFLINE'}</Text>
            </TouchableOpacity>
            <Text style={styles.title}>HYROX<Text style={{color: '#FFD700'}}>ENGINEER</Text></Text>
            <Text style={styles.subtitle}>ELITE PERFORMANCE HUB • 2026 PRO</Text>
        </View>
      </ImageBackground>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        
        {/* === WIDGET 1: WEEKLY PLAN === */}
        <TouchableOpacity 
            style={styles.plannerWidget} 
            activeOpacity={0.9}
            onPress={() => router.push('/planner')}
        >
            <View style={styles.plannerHeader}>
                <Text style={styles.plannerTitle}>WEEKLY BATTLE PLAN</Text>
                <Text style={styles.plannerLink}>MANAGE →</Text>
            </View>
            <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
            </View>
            <View style={styles.daysGrid}>
                {weeklyPlan.map((day, i) => (
                    <View key={i} style={styles.dayCol}>
                        <View style={[styles.dayDot, day.complete && styles.dayDotComplete]} />
                        <Text style={[styles.dayLabel, day.complete && {color: '#fff'}]}>{day.day.charAt(0)}</Text>
                    </View>
                ))}
            </View>
        </TouchableOpacity>

        {/* === WIDGET 2: UNIFIED MISSION CONTROL === */}
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>MISSION CONTROL</Text>
            <Text style={styles.benchValue}>DEPLOYMENT CONFIG</Text>
        </View>

        <View style={styles.missionControlCard}>
            
            {/* TOP PANEL: RACE SELECTOR */}
            <TouchableOpacity style={styles.mcTopPanel} onPress={cycleEvent} activeOpacity={0.8}>
                <View>
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                        <Text style={styles.mcLabel}>TARGET EVENT</Text>
                        <View style={styles.tagBadge}>
                            <Text style={styles.tagText}>{currentEvent.type}</Text>
                        </View>
                    </View>
                    <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 4}}>
                        <Text style={styles.mcEventName}>HYROX {currentEvent.city}</Text>
                        <Ionicons name="chevron-down" size={16} color="#666" style={{marginLeft: 8}} />
                    </View>
                    <Text style={styles.mcEventDate}>{currentEvent.date}</Text>
                </View>
                
                <View style={styles.countdownBox}>
                    <Text style={styles.cdNumber}>{currentEvent.days}</Text>
                    <Text style={styles.cdLabel}>DAYS</Text>
                </View>
            </TouchableOpacity>

            {/* DIVIDER LINE */}
            <View style={styles.mcDivider} />

            {/* MIDDLE PANEL: STRATEGY INPUTS */}
            <View style={styles.mcMiddlePanel}>
                {/* Target Time */}
                <View style={styles.strategyCol}>
                    <Text style={styles.mcLabel}>GOAL TIME</Text>
                    <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
                        <TextInput 
                            style={styles.strategyInput}
                            value={targetTime}
                            onChangeText={setTargetTime}
                            keyboardType="numeric"
                            maxLength={3}
                        />
                        <Text style={styles.strategyUnit}>MIN</Text>
                    </View>
                </View>

                {/* Vertical Line */}
                <View style={styles.verticalDivider} />

                {/* Athlete Bias */}
                <TouchableOpacity 
                    style={styles.strategyCol} 
                    onPress={() => {
                        const types = ['RUNNER', 'BALANCED', 'LIFTER'];
                        const next = types[(types.indexOf(athleteType) + 1) % types.length];
                        setAthleteType(next);
                    }}
                >
                    <Text style={styles.mcLabel}>STRATEGY BIAS</Text>
                    <Text style={styles.strategyValue}>{athleteType}</Text>
                    <Text style={styles.strategySub}>Tap to change</Text>
                </TouchableOpacity>
            </View>

            {/* BOTTOM PANEL: DEPLOY BUTTON (Attached) */}
            <TouchableOpacity 
                activeOpacity={0.9} 
                style={styles.mcBottomPanel} 
                onPress={() => router.push({ pathname: '/race', params: { goalMinutes: targetTime, bias: athleteType }})}
            >
                <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />
                <View style={styles.videoOverlay} />
                <View style={styles.btnContent}>
                    <Text style={styles.actionText}>INITIATE TRACKER</Text>
                    <Text style={styles.actionSubtext}>START RACE SIMULATION</Text>
                </View>
                <Ionicons name="arrow-forward-circle" size={32} color="#FFD700" style={{position: 'absolute', right: 20}} />
            </TouchableOpacity>

        </View>

        {/* === SECTION 3: LAB PORTAL === */}
        <TouchableOpacity style={styles.labPortal} onPress={() => router.push('/templates')}>
            <View>
                <Text style={styles.labTitle}>TRAINING LABORATORY</Text>
                <Text style={styles.labSub}>Access compromised session templates</Text>
            </View>
            <Text style={styles.labArrow}>→</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  hero: { height: 320, paddingHorizontal: 25, justifyContent: 'center' },
  heroContent: { marginTop: 40 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,215,0,0.1)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)' },
  pulse: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusText: { color: '#FFD700', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  title: { color: '#fff', fontSize: 38, fontWeight: '900', fontStyle: 'italic', letterSpacing: -1 },
  subtitle: { color: '#666', fontSize: 11, fontWeight: 'bold', letterSpacing: 2 },
  
  content: { flex: 1, backgroundColor: '#121212', marginTop: -40, borderTopLeftRadius: 35, borderTopRightRadius: 35 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 25, marginTop: 30, marginBottom: 15 },
  sectionTitle: { color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  benchValue: { color: '#444', fontSize: 10, fontWeight: 'bold' },

  // WEEKLY PLANNER
  plannerWidget: { marginHorizontal: 20, marginTop: 30, backgroundColor: '#1E1E1E', padding: 20, borderRadius: 25, borderWidth: 1, borderColor: '#333' },
  plannerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  plannerTitle: { color: '#FFD700', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  plannerLink: { color: '#666', fontSize: 10, fontWeight: 'bold' },
  progressBarBg: { height: 6, backgroundColor: '#333', borderRadius: 3, marginBottom: 15 },
  progressBarFill: { height: '100%', backgroundColor: '#FFD700', borderRadius: 3 },
  daysGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCol: { alignItems: 'center', gap: 6 },
  dayDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#333' },
  dayDotComplete: { backgroundColor: '#FFD700', shadowColor: '#FFD700', shadowOpacity: 0.5, shadowRadius: 5 },
  dayLabel: { color: '#444', fontSize: 10, fontWeight: 'bold' },

  // === UNIFIED MISSION CONTROL CARD ===
  missionControlCard: {
    marginHorizontal: 20,
    backgroundColor: '#1E1E1E',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#333',
    overflow: 'hidden', // Keeps the video button inside the border radius
  },
  
  // TOP: Event Selector
  mcTopPanel: {
    padding: 20,
    paddingBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mcLabel: { color: '#666', fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 4 },
  tagBadge: { backgroundColor: '#333', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tagText: { color: '#FFD700', fontSize: 8, fontWeight: 'bold' },
  mcEventName: { color: '#fff', fontSize: 20, fontWeight: '900', fontStyle: 'italic' },
  mcEventDate: { color: '#888', fontSize: 12, fontWeight: 'bold' },
  
  countdownBox: { alignItems: 'center', backgroundColor: '#121212', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#252525' },
  cdNumber: { color: '#fff', fontSize: 22, fontWeight: '900' },
  cdLabel: { color: '#FFD700', fontSize: 8, fontWeight: '900' },

  mcDivider: { height: 1, backgroundColor: '#252525', marginHorizontal: 20 },

  // MIDDLE: Inputs
  mcMiddlePanel: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 15,
  },
  strategyCol: { flex: 1, justifyContent: 'center' },
  verticalDivider: { width: 1, backgroundColor: '#252525', marginHorizontal: 20 },
  
  strategyInput: { color: '#fff', fontSize: 32, fontWeight: '900', letterSpacing: -1, minWidth: 60 },
  strategyUnit: { color: '#FFD700', fontSize: 12, fontWeight: 'bold', marginLeft: 4 },
  strategyValue: { color: '#fff', fontSize: 16, fontWeight: '900' },
  strategySub: { color: '#444', fontSize: 10, fontWeight: 'bold' },

  // BOTTOM: Action Button
  mcBottomPanel: {
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  videoOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  btnContent: { alignItems: 'center' },
  actionText: { color: '#fff', fontSize: 18, fontWeight: '900', fontStyle: 'italic' },
  actionSubtext: { color: '#FFD700', fontSize: 9, fontWeight: 'bold', letterSpacing: 1 },

  // OTHER
  labPortal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFD700', marginHorizontal: 20, marginTop: 25, marginBottom: 25, padding: 22, borderRadius: 25 },
  labTitle: { color: '#000', fontSize: 15, fontWeight: '900' },
  labSub: { color: '#000', fontSize: 11, opacity: 0.7 },
  labArrow: { color: '#000', fontSize: 20, fontWeight: '900' },
});