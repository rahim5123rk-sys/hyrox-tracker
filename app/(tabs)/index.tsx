import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useRef, useState } from 'react';
import { Animated, Modal, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// --- ANIMATION CONFIG ---
const HEADER_MAX_HEIGHT = 320;

// --- DATA ---
const UPCOMING_EVENTS = [
  { id: 1, city: 'LONDON', date: 'MAY 04', type: 'MAJOR', venue: 'Olympia' },
  { id: 2, city: 'GLASGOW', date: 'MAR 12', type: 'REGIONAL', venue: 'SEC Centre' },
  { id: 4, city: 'NEW YORK', date: 'JUN 01', type: 'MAJOR', venue: 'Javits Ctr' },
  { id: 5, city: 'DUBAI', date: 'FEB 12', type: 'INTL', venue: 'DWTC' },
];

const STRATEGY_VIDEOS: any = {
  RUNNER: require('../../assets/videos/runner.mp4'),
  BALANCED: require('../../assets/videos/balanced.mp4'),
  LIFTER: require('../../assets/videos/lifter.mp4'),
};

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // FIX: Increased Min Height to prevent bottom clipping
  const HEADER_MIN_HEIGHT = insets.top + 85; 
  const SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

  const [codename, setCodename] = useState('Athlete');
  const [targetTime, setTargetTime] = useState('90');
  const [athleteType, setAthleteType] = useState('BALANCED');
  const [primaryGoal, setPrimaryGoal] = useState('BALANCED');
  
  const [selectedEventIndex, setSelectedEventIndex] = useState(-1); 
  const [isEventListOpen, setEventListOpen] = useState(false);
  const [weeklyPlan, setWeeklyPlan] = useState<any[]>([]);

  const currentEvent = selectedEventIndex >= 0 ? UPCOMING_EVENTS[selectedEventIndex] : null;

  // --- ANIMATIONS ---
  
  // 1. Shrink Header Height
  const headerHeight = scrollY.interpolate({
    inputRange: [0, SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp',
  });

  // 2. Fade Background Image to Black
  const imageOpacity = scrollY.interpolate({
    inputRange: [0, SCROLL_DISTANCE],
    outputRange: [0.6, 0], 
    extrapolate: 'clamp',
  });

  // 3. Fade Out Status & Welcome Text
  const headerContentOpacity = scrollY.interpolate({
    inputRange: [0, SCROLL_DISTANCE * 0.6], 
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // 4. Shrink Logo Scale
  const titleScale = scrollY.interpolate({
    inputRange: [0, SCROLL_DISTANCE],
    outputRange: [1, 0.60], 
    extrapolate: 'clamp',
  });

  // 5. Move Logo Up (FIXED: Pushed higher to -38)
  const titleTranslateY = scrollY.interpolate({
    inputRange: [0, SCROLL_DISTANCE],
    outputRange: [0, -38], 
    extrapolate: 'clamp',
  });

  useEffect(() => {
    checkProfile();
  }, []);

  const checkProfile = async () => {
    try {
      const profileJson = await AsyncStorage.getItem('user_profile');
      if (!profileJson) {
        router.replace('/onboarding');
      } else {
        const profile = JSON.parse(profileJson);
        if (profile.name) setCodename(profile.name);
        if (profile.targetTime) setTargetTime(profile.targetTime);
        if (profile.athleteType) setAthleteType(profile.athleteType);
        if (profile.primaryGoal) setPrimaryGoal(profile.primaryGoal);
        
        if (profile.targetRace) {
            const idx = UPCOMING_EVENTS.findIndex(e => e.city === profile.targetRace.city);
            if (idx !== -1) setSelectedEventIndex(idx);
        } else {
            setSelectedEventIndex(-1);
        }
        loadPlan(profile.primaryGoal || 'BALANCED');
      }
    } catch (e) {
      console.log('Error loading profile', e);
    }
  };

  const loadPlan = async (goal?: string) => {
    const saved = await AsyncStorage.getItem('user_weekly_plan');
    if (saved) {
        setWeeklyPlan(JSON.parse(saved));
    }
  };

  const completedCount = weeklyPlan.filter(d => d.complete).length;
  const progress = weeklyPlan.length > 0 ? completedCount / weeklyPlan.length : 0;

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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* --- ANIMATED HEADER --- */}
      <Animated.View style={[styles.headerContainer, { height: headerHeight }]}>
          <Animated.Image 
            source={{ uri: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000' }} 
            style={[StyleSheet.absoluteFill, { opacity: imageOpacity }]}
            resizeMode="cover"
          />
          
          <View style={[styles.heroContent, { paddingTop: insets.top + 10 }]}>
            
            {/* Top Row: Status & Profile (Fades Out) */}
            <Animated.View style={{ opacity: headerContentOpacity, marginBottom: 15 }}>
                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                    <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>TRAINING ACTIVE</Text>
                    </View>
                    <TouchableOpacity onPress={() => router.push('/progress')} style={styles.profileBtn}>
                        <Ionicons name="person-circle-outline" size={32} color="#fff" />
                    </TouchableOpacity>
                </View>
            </Animated.View>

            {/* The Logo (Shrinks, Moves Up & Pins) */}
            <Animated.View style={{
                transform: [
                    { scale: titleScale },
                    { translateY: titleTranslateY }
                ],
                alignItems: 'center', 
                width: '100%',
                zIndex: 999, // Ensure it stays on top
            }}>
                <Text style={styles.title}>HYROX<Text style={{color: '#FFD700'}}>ENGINEER</Text></Text>
            </Animated.View>

            {/* Subtitle (Fades Out) */}
            <Animated.Text style={[styles.subtitle, { opacity: headerContentOpacity }]}>
                WELCOME, {codename.toUpperCase()}
            </Animated.Text>

          </View>
      </Animated.View>

      {/* --- SCROLL CONTENT --- */}
      <Animated.ScrollView 
        style={styles.content} 
        contentContainerStyle={{ 
            // Push content down to start below header
            paddingTop: HEADER_MAX_HEIGHT + 20, 
            paddingBottom: 120 
        }} 
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
        )}
      >
        
        {/* === WIDGET 1: WEEKLY PLAN === */}
        <TouchableOpacity style={styles.plannerWidget} activeOpacity={0.9} onPress={() => router.push('/planner')}>
            <View style={styles.plannerHeader}>
                <View>
                    <Text style={styles.plannerTitle}>YOUR TRAINING WEEK</Text>
                    <Text style={styles.plannerSub}>{completedCount} of {weeklyPlan.length} sessions done</Text>
                </View>
                <Text style={styles.plannerLink}>VIEW SCHEDULE →</Text>
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

        {/* === SECTION 2: BROWSE WORKOUTS === */}
        <TouchableOpacity style={styles.labPortal} onPress={() => router.push('/templates')}>
            <View>
                <Text style={styles.labTitle}>BROWSE WORKOUTS</Text>
                <Text style={styles.labSub}>Find sessions for Strength, Running, and Hyrox</Text>
            </View>
            <Text style={styles.labArrow}>→</Text>
        </TouchableOpacity>

        {/* === WIDGET 3: NEXT EVENT === */}
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>NEXT EVENT</Text>
        </View>

        <TouchableOpacity 
            style={styles.missionCard} 
            activeOpacity={0.9}
            onPress={() => setEventListOpen(true)}
        >
            {currentEvent ? (
                <>
                    <View style={styles.missionLeft}>
                        <View style={styles.tagBadge}>
                            <Text style={styles.tagText}>{currentEvent.type}</Text>
                        </View>
                        <Text style={styles.missionCity}>HYROX {currentEvent.city}</Text>
                        <Text style={styles.missionDate}>{currentEvent.date} • {currentEvent.venue}</Text>
                        <View style={styles.changeBtn}>
                            <Text style={styles.changeBtnText}>CHANGE EVENT</Text>
                        </View>
                    </View>
                    <View style={styles.missionRight}>
                        <View style={styles.countdownBox}>
                            <Text style={styles.cdNumber}>42</Text> 
                            <Text style={styles.cdLabel}>DAYS</Text>
                        </View>
                    </View>
                </>
            ) : (
                <>
                     <View style={styles.missionLeft}>
                        <View style={[styles.tagBadge, {backgroundColor: '#333'}]}>
                            <Text style={[styles.tagText, {color: '#888'}]}>SEASON OFF</Text>
                        </View>
                        <Text style={styles.missionCity}>OFF SEASON</Text>
                        <Text style={styles.missionDate}>Tap here to select your next race.</Text>
                    </View>
                    <View style={styles.missionRight}>
                         <Ionicons name="calendar" size={30} color="#333" />
                    </View>
                </>
            )}
        </TouchableOpacity>

        {/* === WIDGET 4: RACE CALCULATOR === */}
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>RACE CALCULATOR</Text>
        </View>

        <View style={styles.consoleContainer}>
            <View style={styles.consoleTop}>
                <Text style={styles.inputLabel}>GOAL FINISH TIME</Text>
                <View style={styles.inputWrapper}>
                    <TextInput 
                        style={styles.mainInput} 
                        value={targetTime} 
                        onChangeText={setTargetTime} 
                        keyboardType="numeric" 
                        maxLength={3} 
                    />
                    <Text style={styles.inputUnit}>MINS</Text>
                </View>
                <View style={styles.typeGrid}>
                    {['RUNNER', 'BALANCED', 'LIFTER'].map((type) => (
                        <TouchableOpacity 
                            key={type} 
                            style={[styles.typeBtn, athleteType === type && styles.activeTypeBtn]} 
                            onPress={() => setAthleteType(type)}
                        >
                            <Text style={[styles.typeBtnText, athleteType === type && { color: '#000' }]}>{type}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.consoleSeparator} />

            <TouchableOpacity 
                activeOpacity={0.9} 
                style={styles.consoleBottom} 
                onPress={() => router.push({ pathname: '/race', params: { goalMinutes: targetTime, bias: athleteType }})}
            >
                <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />
                <View style={styles.videoOverlay} />
                <View style={styles.btnContent}>
                    <Text style={styles.actionText}>LAUNCH CALCULATOR</Text>
                    <Text style={styles.actionSubtext}>GET PACING STRATEGY</Text>
                </View>
                <Ionicons name="arrow-forward-circle" size={32} color="#FFD700" style={styles.actionArrow} />
            </TouchableOpacity>
        </View>

      </Animated.ScrollView>

      {/* EVENT MODAL */}
      <Modal visible={isEventListOpen} animationType="slide" transparent={true} onRequestClose={() => setEventListOpen(false)}>
        <BlurView intensity={90} tint="dark" style={styles.modalContainer}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>SELECT EVENT</Text>
                    <TouchableOpacity onPress={() => setEventListOpen(false)} style={styles.closeBtn}>
                        <Ionicons name="close" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
                <ScrollView contentContainerStyle={{paddingBottom: 40}}>
                    <TouchableOpacity 
                        style={[styles.eventOption, selectedEventIndex === -1 && styles.eventOptionSelected]}
                        onPress={() => {
                            setSelectedEventIndex(-1);
                            setEventListOpen(false);
                        }}
                    >
                        <View>
                            <Text style={[styles.optionCity, selectedEventIndex === -1 && {color: '#000'}]}>NO RACE PLANNED</Text>
                            <Text style={[styles.optionDate, selectedEventIndex === -1 && {color: '#333'}]}>Just training</Text>
                        </View>
                    </TouchableOpacity>
                    {UPCOMING_EVENTS.map((event, index) => (
                        <TouchableOpacity 
                            key={event.id} 
                            style={[styles.eventOption, selectedEventIndex === index && styles.eventOptionSelected]}
                            onPress={() => {
                                setSelectedEventIndex(index);
                                setEventListOpen(false);
                            }}
                        >
                            <View>
                                <Text style={[styles.optionCity, selectedEventIndex === index && {color: '#000'}]}>{event.city}</Text>
                                <Text style={[styles.optionDate, selectedEventIndex === index && {color: '#333'}]}>{event.date}</Text>
                            </View>
                            {selectedEventIndex === index && <Ionicons name="checkmark-circle" size={24} color="#000" />}
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        </BlurView>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  
  // HEADER ABSOLUTE
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000', // Solid black when image fades
    zIndex: 100, 
    overflow: 'hidden',
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
  },
  heroContent: { paddingHorizontal: 25 },
  
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,215,0,0.1)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)' },
  statusText: { color: '#FFD700', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  profileBtn: { padding: 5, marginTop: -5 },
  
  // UPDATED TITLE & SUBTITLE FOR VISIBILITY
  title: { color: '#fff', fontSize: 38, fontWeight: '900', fontStyle: 'italic', letterSpacing: -1, textAlign: 'center' },
  subtitle: { 
    color: '#fff', 
    fontSize: 11, 
    fontWeight: 'bold', 
    letterSpacing: 2, 
    textAlign: 'center', 
    marginTop: 10,
    textShadowColor: 'rgba(0,0,0,0.9)', 
    textShadowOffset: {width: 0, height: 2}, 
    textShadowRadius: 4 
  },
  
  content: { flex: 1, backgroundColor: '#121212' },
  
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 25, marginTop: 30, marginBottom: 15 },
  sectionTitle: { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 1 },

  // PLANNER
  plannerWidget: { marginHorizontal: 20, backgroundColor: '#1E1E1E', padding: 20, borderRadius: 25, borderWidth: 1, borderColor: '#333' },
  plannerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  plannerTitle: { color: '#FFD700', fontSize: 14, fontWeight: '900' },
  plannerSub: { color: '#888', fontSize: 12, marginTop: 2 },
  plannerLink: { color: '#666', fontSize: 10, fontWeight: 'bold' },
  progressBarBg: { height: 6, backgroundColor: '#333', borderRadius: 3, marginBottom: 15 },
  progressBarFill: { height: '100%', backgroundColor: '#FFD700', borderRadius: 3 },
  daysGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCol: { alignItems: 'center', gap: 6 },
  dayDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#333' },
  dayDotComplete: { backgroundColor: '#FFD700' },
  dayLabel: { color: '#444', fontSize: 10, fontWeight: 'bold' },

  // LAB PORTAL
  labPortal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFD700', marginHorizontal: 20, marginTop: 25, marginBottom: 10, padding: 22, borderRadius: 25 },
  labTitle: { color: '#000', fontSize: 16, fontWeight: '900' },
  labSub: { color: '#000', fontSize: 12, opacity: 0.8 },
  labArrow: { color: '#000', fontSize: 20, fontWeight: '900' },

  // MISSION CARD
  missionCard: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: '#1E1E1E', borderRadius: 25, padding: 20, borderWidth: 1, borderColor: '#333', alignItems: 'center' },
  missionLeft: { flex: 1 },
  tagBadge: { backgroundColor: '#333', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginBottom: 8 },
  tagText: { color: '#FFD700', fontSize: 9, fontWeight: 'bold' },
  missionCity: { color: '#fff', fontSize: 22, fontWeight: '900', fontStyle: 'italic' },
  missionDate: { color: '#888', fontSize: 14, fontWeight: '500', marginTop: 4 },
  changeBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#333', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, gap: 4, marginTop: 12 },
  changeBtnText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  missionRight: { justifyContent: 'center', alignItems: 'flex-end' },
  countdownBox: { alignItems: 'center', backgroundColor: '#121212', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 15, borderWidth: 1, borderColor: '#333' },
  cdNumber: { color: '#fff', fontSize: 28, fontWeight: '900' },
  cdLabel: { color: '#FFD700', fontSize: 9, fontWeight: '900' },

  // CONSOLE
  consoleContainer: { marginHorizontal: 20, backgroundColor: '#1E1E1E', borderRadius: 30, borderWidth: 1, borderColor: '#333', overflow: 'hidden', marginBottom: 40 },
  consoleTop: { padding: 25 },
  inputLabel: { color: '#888', fontSize: 10, fontWeight: '900', marginBottom: 5 },
  inputWrapper: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 25 },
  mainInput: { color: '#fff', fontSize: 75, fontWeight: '900', letterSpacing: -3 },
  inputUnit: { color: '#FFD700', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
  typeGrid: { flexDirection: 'row', gap: 10 },
  typeBtn: { flex: 1, paddingVertical: 15, borderRadius: 15, backgroundColor: '#121212', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  activeTypeBtn: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
  typeBtnText: { color: '#666', fontSize: 10, fontWeight: '900' },
  consoleSeparator: { height: 1, backgroundColor: '#333' },
  consoleBottom: { height: 100, justifyContent: 'center', alignItems: 'center' },
  videoOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  btnContent: { alignItems: 'center' },
  actionText: { color: '#fff', fontSize: 20, fontWeight: '900', fontStyle: 'italic' },
  actionSubtext: { color: '#FFD700', fontSize: 9, fontWeight: 'bold', marginTop: 5 },
  actionArrow: { position: 'absolute', right: 25 },

  // MODAL
  modalContainer: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { height: '60%', backgroundColor: '#121212', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  closeBtn: { padding: 5 },
  eventOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#1E1E1E', borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: '#333' },
  eventOptionSelected: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
  optionCity: { color: '#fff', fontSize: 18, fontWeight: '900' },
  optionDate: { color: '#888', fontSize: 14, marginTop: 2 },
});