import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { useFocusEffect, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Modal, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { updateStreak } from '../../utils/gamification';

// IMPORT DATA
import { Region, UPCOMING_RACES } from './../data/races';

// --- ANIMATION CONFIG ---
const HEADER_MAX_HEIGHT = 320;

const STRATEGY_VIDEOS: any = {
  RUNNER: require('../../assets/videos/runner.mp4'),
  BALANCED: require('../../assets/videos/balanced.mp4'),
  LIFTER: require('../../assets/videos/lifter.mp4'),
};

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  
  const HEADER_MIN_HEIGHT = insets.top + 85; 
  const SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

  // STATE
  const [codename, setCodename] = useState('Athlete');
  const [targetTime, setTargetTime] = useState('90');
  const [athleteType, setAthleteType] = useState('BALANCED');
  
  const [selectedEventIndex, setSelectedEventIndex] = useState(-1); 
  const [isEventListOpen, setEventListOpen] = useState(false);
  const [weeklyPlan, setWeeklyPlan] = useState<any[]>([]);
  const [streak, setStreak] = useState(0); 
  const [isLoading, setIsLoading] = useState(true);

  // MODAL FILTER STATE
  const [modalRegion, setModalRegion] = useState<Region>('ALL');

  // Get current event object
  const currentEvent = selectedEventIndex >= 0 ? UPCOMING_RACES[selectedEventIndex] : null;

  // --- DYNAMIC COUNTDOWN CALCULATOR ---
  const getDaysOut = () => {
      if (!currentEvent) return 0;
      
      const now = new Date();
      // Reset time to midnight (UTC) to prevent timezone bugs
      const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
      
      // Parse ISO string manually (YYYY-MM-DD)
      const parts = currentEvent.isoDate.split('-');
      const raceDay = Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));

      const diffTime = raceDay - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      return diffDays > 0 ? diffDays : 0; 
  };

  // --- ANIMATIONS ---
  const headerHeight = scrollY.interpolate({
    inputRange: [0, SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp',
  });

  const imageOpacity = scrollY.interpolate({
    inputRange: [0, SCROLL_DISTANCE],
    outputRange: [0.6, 0], 
    extrapolate: 'clamp',
  });

  const headerContentOpacity = scrollY.interpolate({
    inputRange: [0, SCROLL_DISTANCE * 0.6], 
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const titleScale = scrollY.interpolate({
    inputRange: [0, SCROLL_DISTANCE],
    outputRange: [1, 0.60], 
    extrapolate: 'clamp',
  });

  const titleTranslateY = scrollY.interpolate({
    inputRange: [0, SCROLL_DISTANCE],
    outputRange: [0, -38], 
    extrapolate: 'clamp',
  });

  useFocusEffect(
    useCallback(() => {
        checkProfile();
        handleStreak();
    }, [])
  );

  const handleStreak = async () => {
      const s = await updateStreak();
      setStreak(s);
  };

  const checkProfile = async () => {
    try {
      const profileJson = await AsyncStorage.getItem('user_profile');
      
      // IF NO PROFILE FOUND -> SEND TO ONBOARDING
      if (!profileJson) {
        router.replace('/onboarding');
        return;
      } 
      
      const profile = JSON.parse(profileJson);
      if (profile.name) setCodename(profile.name);
      if (profile.targetTime) setTargetTime(profile.targetTime);
      if (profile.athleteType) setAthleteType(profile.athleteType);
      
      // Match city string to new data file ID
      if (profile.targetRace) {
          const idx = UPCOMING_RACES.findIndex(e => e.id === profile.targetRace.id);
          if (idx !== -1) setSelectedEventIndex(idx);
      } else {
          setSelectedEventIndex(-1);
      }
      
      loadPlan();
      setIsLoading(false);

    } catch (e) {
      console.log('Error loading profile', e);
    }
  };

  const loadPlan = async () => {
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

  // Filter races for the modal
  const filteredRaces = modalRegion === 'ALL' 
    ? UPCOMING_RACES 
    : UPCOMING_RACES.filter(r => r.region === modalRegion);

  if (isLoading) return <View style={{flex:1, backgroundColor:'#000'}} />;

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
            
            {/* Top Row: Status & Profile */}
            <Animated.View style={{ opacity: headerContentOpacity, marginBottom: 15 }}>
                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                    
                    {/* STREAK WIDGET */}
                    <View style={styles.streakBadge}>
                        <Ionicons name="flame" size={14} color="#FFD700" />
                        <Text style={styles.streakText}>{streak} DAY STREAK</Text>
                    </View>

                    <TouchableOpacity onPress={() => router.push('/progress')} style={styles.profileBtn}>
                        <Ionicons name="person-circle-outline" size={32} color="#fff" />
                    </TouchableOpacity>
                </View>
            </Animated.View>

            {/* Logo */}
            <Animated.View style={{
                transform: [{ scale: titleScale }, { translateY: titleTranslateY }],
                alignItems: 'center', width: '100%', zIndex: 999,
            }}>
                <Text style={styles.title}>HYROX<Text style={{color: '#FFD700'}}>ENGINEER</Text></Text>
            </Animated.View>

            <Animated.Text style={[styles.subtitle, { opacity: headerContentOpacity }]}>
                WELCOME, {codename.toUpperCase()}
            </Animated.Text>

          </View>
      </Animated.View>

      {/* --- SCROLL CONTENT --- */}
      <Animated.ScrollView 
        style={styles.content} 
        contentContainerStyle={{ paddingTop: HEADER_MAX_HEIGHT + 20, paddingBottom: 120 }} 
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
      >
        
        {/* WEEKLY PLAN WIDGET */}
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

        {/* BROWSE WORKOUTS */}
        <TouchableOpacity style={styles.labPortal} onPress={() => router.push('/templates')}>
            <View>
                <Text style={styles.labTitle}>BROWSE WORKOUTS</Text>
                <Text style={styles.labSub}>Find sessions for Strength, Running, and Hyrox</Text>
            </View>
            <Text style={styles.labArrow}>→</Text>
        </TouchableOpacity>

        {/* NEXT EVENT */}
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>NEXT EVENT</Text>
        </View>
        <TouchableOpacity style={styles.missionCard} activeOpacity={0.9} onPress={() => setEventListOpen(true)}>
            {currentEvent ? (
                <>
                    <View style={styles.missionLeft}>
                        <View style={styles.tagBadge}><Text style={styles.tagText}>{currentEvent.type}</Text></View>
                        <Text style={styles.missionCity}>HYROX {currentEvent.city}</Text>
                        <Text style={styles.missionDate}>{currentEvent.date} • {currentEvent.venue}</Text>
                    </View>
                    <View style={styles.missionRight}>
                        {/* Dynamic Days Out */}
                        {currentEvent.isoDate.startsWith('2099') ? (
                           <View style={[styles.countdownBox, { borderColor: '#444' }]}>
                               <Ionicons name="time-outline" size={24} color="#666" style={{marginBottom: 4}} />
                               <Text style={[styles.cdLabel, {color: '#666'}]}>SOON</Text>
                           </View>
                        ) : (
                           <View style={styles.countdownBox}>
                               <Text style={styles.cdNumber}>{getDaysOut()}</Text>
                               <Text style={styles.cdLabel}>DAYS</Text>
                           </View>
                        )}
                    </View>
                </>
            ) : (
                <>
                     <View style={styles.missionLeft}>
                        <View style={[styles.tagBadge, {backgroundColor: '#333'}]}><Text style={[styles.tagText, {color: '#888'}]}>SEASON OFF</Text></View>
                        <Text style={styles.missionCity}>OFF SEASON</Text>
                        <Text style={styles.missionDate}>Tap here to select your next race.</Text>
                    </View>
                </>
            )}
        </TouchableOpacity>

        {/* RACE CALCULATOR */}
        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>RACE CALCULATOR</Text></View>
        <View style={styles.consoleContainer}>
            <View style={styles.consoleTop}>
                <Text style={styles.inputLabel}>GOAL FINISH TIME</Text>
                <View style={styles.inputWrapper}>
                    <TextInput style={styles.mainInput} value={targetTime} onChangeText={setTargetTime} keyboardType="numeric" maxLength={3} />
                    <Text style={styles.inputUnit}>MINS</Text>
                </View>
                <View style={styles.typeGrid}>
                    {['RUNNER', 'BALANCED', 'LIFTER'].map((type) => (
                        <TouchableOpacity key={type} style={[styles.typeBtn, athleteType === type && styles.activeTypeBtn]} onPress={() => setAthleteType(type)}>
                            <Text style={[styles.typeBtnText, athleteType === type && { color: '#000' }]}>{type}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
            <TouchableOpacity activeOpacity={0.9} style={styles.consoleBottom} onPress={() => router.push({ pathname: '/race', params: { goalMinutes: targetTime, bias: athleteType }})}>
                <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />
                <View style={styles.videoOverlay} />
                <View style={styles.btnContent}><Text style={styles.actionText}>LAUNCH CALCULATOR</Text></View>
            </TouchableOpacity>
        </View>
        
        {/* === FACTORY RESET (DEV ONLY) === */}
        <TouchableOpacity 
            style={{ marginVertical: 40, alignSelf: 'center', padding: 15 }} 
            onPress={async () => {
                await AsyncStorage.clear(); 
                router.replace('/onboarding');
            }}
        >
            <Text style={{ color: '#333', fontWeight: '900', fontSize: 10 }}>FACTORY RESET</Text>
        </TouchableOpacity>

      </Animated.ScrollView>

      {/* EVENT SELECTION MODAL */}
      <Modal visible={isEventListOpen} animationType="slide" transparent={true} onRequestClose={() => setEventListOpen(false)}>
        <BlurView intensity={90} tint="dark" style={styles.modalContainer}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeaderRow}>
                    <Text style={styles.modalTitle}>SELECT DEPLOYMENT</Text>
                    <TouchableOpacity onPress={() => setEventListOpen(false)} style={styles.closeBtn}>
                        <Ionicons name="close" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* REGION FILTERS */}
                <View style={{ height: 40, marginBottom: 15 }}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                        {['ALL', 'UK', 'EUROPE', 'USA', 'APAC', 'LATAM'].map((region) => (
                            <TouchableOpacity 
                                key={region} 
                                style={[styles.regionChip, modalRegion === region && styles.regionChipActive]}
                                onPress={() => setModalRegion(region as Region)}
                            >
                                <Text style={[styles.regionText, modalRegion === region && {color: '#000'}]}>{region}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* RACE LIST */}
                <ScrollView showsVerticalScrollIndicator={false}>
                    {/* NO RACE OPTION */}
                    <TouchableOpacity style={styles.eventOption} onPress={() => { setSelectedEventIndex(-1); setEventListOpen(false); }}>
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                             <Ionicons name="infinite" size={18} color="#666" />
                             <Text style={[styles.optionCity, {color: '#888'}]}>NO RACE / OFF SEASON</Text>
                        </View>
                    </TouchableOpacity>

                    {filteredRaces.map((event) => {
                        // Find original index in UPCOMING_RACES to set correctly
                        const originalIndex = UPCOMING_RACES.findIndex(r => r.id === event.id);
                        return (
                            <TouchableOpacity 
                                key={event.id} 
                                style={styles.eventOption} 
                                onPress={() => { setSelectedEventIndex(originalIndex); setEventListOpen(false); }}
                            >
                                <View>
                                    <Text style={styles.optionCity}>{event.city}</Text>
                                    <Text style={{color:'#666', fontSize:12, fontWeight:'bold'}}>{event.date}</Text>
                                </View>
                                {selectedEventIndex === originalIndex && <Ionicons name="checkmark-circle" size={20} color="#FFD700" />}
                            </TouchableOpacity>
                        );
                    })}
                    <View style={{height: 40}} />
                </ScrollView>
            </View>
        </BlurView>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  headerContainer: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: '#000', zIndex: 100, overflow: 'hidden', borderBottomLeftRadius: 35, borderBottomRightRadius: 35 },
  heroContent: { paddingHorizontal: 25 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A1A', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#333', gap: 6 },
  streakText: { color: '#FFF', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  profileBtn: { padding: 5, marginTop: -5 },
  title: { color: '#fff', fontSize: 38, fontWeight: '900', fontStyle: 'italic', letterSpacing: -1, textAlign: 'center' },
  subtitle: { color: '#fff', fontSize: 11, fontWeight: 'bold', letterSpacing: 2, textAlign: 'center', marginTop: 10 },
  content: { flex: 1, backgroundColor: '#121212' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 25, marginTop: 30, marginBottom: 15 },
  sectionTitle: { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
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
  labPortal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFD700', marginHorizontal: 20, marginTop: 25, marginBottom: 10, padding: 22, borderRadius: 25 },
  labTitle: { color: '#000', fontSize: 16, fontWeight: '900' },
  labSub: { color: '#000', fontSize: 12, opacity: 0.8 },
  labArrow: { color: '#000', fontSize: 20, fontWeight: '900' },
  missionCard: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: '#1E1E1E', borderRadius: 25, padding: 20, borderWidth: 1, borderColor: '#333', alignItems: 'center' },
  missionLeft: { flex: 1 },
  tagBadge: { backgroundColor: '#333', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginBottom: 8 },
  tagText: { color: '#FFD700', fontSize: 9, fontWeight: 'bold' },
  missionCity: { color: '#fff', fontSize: 22, fontWeight: '900', fontStyle: 'italic' },
  missionDate: { color: '#888', fontSize: 14, fontWeight: '500', marginTop: 4 },
  missionRight: { justifyContent: 'center', alignItems: 'flex-end' },
  countdownBox: { alignItems: 'center', backgroundColor: '#121212', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 15, borderWidth: 1, borderColor: '#333' },
  cdNumber: { color: '#fff', fontSize: 28, fontWeight: '900' },
  cdLabel: { color: '#FFD700', fontSize: 9, fontWeight: '900' },
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
  consoleBottom: { height: 100, justifyContent: 'center', alignItems: 'center' },
  videoOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  btnContent: { alignItems: 'center' },
  actionText: { color: '#fff', fontSize: 20, fontWeight: '900', fontStyle: 'italic' },
  modalContainer: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { height: '70%', backgroundColor: '#121212', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25 },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  closeBtn: { padding: 5 },
  eventOption: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding: 20, backgroundColor: '#1E1E1E', borderRadius: 20, marginBottom: 12 },
  optionCity: { color: '#fff', fontSize: 18, fontWeight: '900' },
  
  // MODAL CHIPS
  regionChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: '#333', justifyContent: 'center' },
  regionChipActive: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
  regionText: { color: '#666', fontWeight: '900', fontSize: 10 },
});