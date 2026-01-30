import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { useFocusEffect, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Keyboard,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { updateStreak } from '../../utils/gamification';
import { calculateRoxPace, CATEGORIES, predictFinishTime } from '../../utils/pacing';

import { Region, UPCOMING_RACES } from './../data/races';

// --- CONFIG ---
const HEADER_MAX_HEIGHT = 320;

const STRATEGY_VIDEOS: any = {
  RUNNER: require('../../assets/videos/runner.mp4'),
  BALANCED: require('../../assets/videos/balanced.mp4'),
  LIFTER: require('../../assets/videos/lifter.mp4'),
};

const PACER_DESCRIPTIONS: any = {
    MANUAL: "Traditional Mode: You guess your total finish time. We divide it into splits based on standard averages.",
    SMART: "Coaching Mode: Enter your fresh 5k time. We calculate exactly how fast you can run under fatigue (RoxPace)."
};

const BIAS_DESCRIPTIONS: any = {
    RUNNER: "Strategy: Aggressive running splits. Conservative station pacing. Ideal for sub-40 min 10k runners.",
    BALANCED: "Strategy: Equal effort distribution. The standard Hyrox pacing model.",
    LIFTER: "Strategy: Fast station times. Recover on the runs. Ideal for Crossfitters and Strength athletes."
};

// --- LOGGING CONSTANTS ---
const RUN_TYPES = ['EASY (Z2)', 'TEMPO', 'INTERVALS', 'LONG RUN'];
const GYM_FOCUS = ['FULL BODY', 'UPPER', 'LOWER', 'CORE', 'RECOVERY'];
const STATIONS_LIST = ['SKI ERG', 'SLED PUSH', 'SLED PULL', 'BURPEES', 'ROWING', 'FARMERS', 'LUNGES', 'WALL BALLS'];

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  
  const HEADER_MIN_HEIGHT = insets.top + 85; 
  const SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

  // USER PROFILE
  const [codename, setCodename] = useState('Athlete');
  const [targetTime, setTargetTime] = useState('90');
  const [athleteType, setAthleteType] = useState('BALANCED');
  
  // CALCULATOR
  const [calcMode, setCalcMode] = useState<'MANUAL' | 'SMART'>('MANUAL');
  const [fiveKTime, setFiveKTime] = useState('');
  const [category, setCategory] = useState('MEN_OPEN');
  
  // DASHBOARD
  const [selectedEventIndex, setSelectedEventIndex] = useState(-1); 
  const [isEventListOpen, setEventListOpen] = useState(false);
  const [weeklyPlan, setWeeklyPlan] = useState<any[]>([]);
  const [streak, setStreak] = useState(0); 
  const [isLoading, setIsLoading] = useState(true);

  // --- DETAILED LOG STATE ---
  const [showLogModal, setShowLogModal] = useState(false);
  const [logType, setLogType] = useState<'RUN' | 'STATION' | 'WORKOUT'>('RUN');
  
  // Shared Fields
  const [logTime, setLogTime] = useState(''); // Duration or Result
  const [logNote, setLogNote] = useState('');
  
  // Specific Fields
  const [logDistance, setLogDistance] = useState('');
  const [logSubCategory, setLogSubCategory] = useState(''); // Holds Run Type, Station Name, or Gym Focus
  const [logWeight, setLogWeight] = useState(''); // For Stations

  const [modalRegion, setModalRegion] = useState<Region>('ALL');

  const currentEvent = selectedEventIndex >= 0 ? UPCOMING_RACES[selectedEventIndex] : null;

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
      if (!profileJson) {
        router.replace('/onboarding');
        return;
      } 
      const profile = JSON.parse(profileJson);
      if (profile.name) setCodename(profile.name);
      if (profile.targetTime) setTargetTime(profile.targetTime);
      if (profile.athleteType) setAthleteType(profile.athleteType);
      
      const savedCat = await AsyncStorage.getItem('userCategory');
      if (savedCat) setCategory(savedCat);
      
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
    if (saved) setWeeklyPlan(JSON.parse(saved));
  };

  const toggleDayComplete = async (index: number) => {
    const newPlan = [...weeklyPlan];
    newPlan[index].complete = !newPlan[index].complete;
    setWeeklyPlan(newPlan);
    await AsyncStorage.setItem('user_weekly_plan', JSON.stringify(newPlan));
    if (newPlan[index].complete) handleStreak();
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

  const handleLaunch = () => {
      if (calcMode === 'MANUAL') {
          router.push({ pathname: '/race', params: { goalMinutes: targetTime, bias: athleteType, category: category } });
      } else {
          if (!fiveKTime) { Alert.alert("Missing Data", "Please enter your 5k time."); return; }
          const roxPace = calculateRoxPace(fiveKTime, category);
          const predictedMinutes = predictFinishTime(roxPace, category);
          router.push({ pathname: '/race', params: { goalMinutes: predictedMinutes.toString(), bias: athleteType, smartPace: roxPace.toString(), category: category } });
      }
  };

  // --- DETAILED LOGGING LOGIC ---
  const openQuickLog = (type: 'RUN' | 'STATION' | 'WORKOUT') => {
      setLogType(type);
      setLogTime('');
      setLogNote('');
      setLogDistance('');
      setLogWeight('');
      setLogSubCategory(''); // Reset sub-selection
      setShowLogModal(true);
  };

  const saveQuickLog = async () => {
      if (!logTime) { Alert.alert("Missing Info", "Please enter a time or score."); return; }

      // 1. Construct the detailed note
      let finalNote = logNote;
      if (logType === 'RUN') {
          const typeStr = logSubCategory || 'RUN';
          const distStr = logDistance ? `${logDistance}km` : '';
          finalNote = `${distStr} ${typeStr} • ${logNote}`.trim();
      } else if (logType === 'STATION') {
          const stationStr = logSubCategory || 'STATION';
          const weightStr = logWeight ? `@ ${logWeight}kg` : '';
          finalNote = `${stationStr} ${weightStr} • ${logNote}`.trim();
      } else {
          const focusStr = logSubCategory || 'GYM';
          finalNote = `${focusStr} • ${logNote}`.trim();
      }

      const newLog = {
          date: new Date().toLocaleDateString(),
          totalTime: logTime,
          splits: [],
          type: logType,
          note: finalNote
      };

      try {
          // A. SAVE TO HISTORY
          const existing = await AsyncStorage.getItem('raceHistory');
          const history = existing ? JSON.parse(existing) : [];
          const updated = [newLog, ...history];
          await AsyncStorage.setItem('raceHistory', JSON.stringify(updated));
          
          // B. UPDATE CAREER VOLUMES
          const statsJson = await AsyncStorage.getItem('user_history_stats');
          const stats = statsJson ? JSON.parse(statsJson) : { xp: 0, workouts: 0, run: 0, sled: 0 };
          
          stats.workouts += 1;
          stats.xp += 150; 
          
          if (logType === 'RUN' && logDistance) {
              stats.run += parseFloat(logDistance);
          } else if (logType === 'RUN') {
              stats.run += 5; // Default assumption if no distance
          }
          
          if (logType === 'STATION' && (logSubCategory.includes('SLED') || logSubCategory.includes('LUNGE'))) {
              stats.sled += 50; 
          }
          
          await AsyncStorage.setItem('user_history_stats', JSON.stringify(stats));

          // C. UPDATE PLANNER (Mark Today as Complete)
          const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1; // Mon=0, Sun=6
          if (weeklyPlan.length > 0 && weeklyPlan[todayIndex]) {
              const newPlan = [...weeklyPlan];
              if (!newPlan[todayIndex].complete) {
                  newPlan[todayIndex].complete = true;
                  setWeeklyPlan(newPlan);
                  await AsyncStorage.setItem('user_weekly_plan', JSON.stringify(newPlan));
                  handleStreak(); // Update streak immediately
              }
          }

          setShowLogModal(false);
          Alert.alert("Log Saved", "Session saved to History & Planner updated.");
      } catch (e) {
          console.log(e);
      }
  };

  const getDaysOut = () => {
      if (!currentEvent) return 0;
      const now = new Date();
      const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
      const parts = currentEvent.isoDate.split('-');
      const raceDay = Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const diffTime = raceDay - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      return diffDays > 0 ? diffDays : 0; 
  };

  const filteredRaces = modalRegion === 'ALL' 
    ? UPCOMING_RACES 
    : UPCOMING_RACES.filter(r => r.region === modalRegion);

  if (isLoading) return <View style={{flex:1, backgroundColor:'#000'}} />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* HEADER */}
      <Animated.View style={[styles.headerContainer, { height: headerHeight }]}>
          <Animated.Image 
            source={{ uri: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000' }} 
            style={[StyleSheet.absoluteFill, { opacity: imageOpacity }]}
            resizeMode="cover"
          />
          <View style={[styles.heroContent, { paddingTop: insets.top + 10 }]}>
            <Animated.View style={{ opacity: headerContentOpacity, marginBottom: 15 }}>
                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                    <View style={styles.streakBadge}>
                        <Ionicons name="flame" size={14} color="#FFD700" />
                        <Text style={styles.streakText}>{streak} DAY STREAK</Text>
                    </View>
                    <TouchableOpacity onPress={() => router.push('/progress')} style={styles.profileBtn}>
                        <Ionicons name="person-circle-outline" size={32} color="#fff" />
                    </TouchableOpacity>
                </View>
            </Animated.View>
            <Animated.View style={{ transform: [{ scale: titleScale }, { translateY: titleTranslateY }], alignItems: 'center', width: '100%', zIndex: 999 }}>
                <Text style={styles.title}>HYROX<Text style={{color: '#FFD700'}}>ENGINEER</Text></Text>
            </Animated.View>
            <Animated.Text style={[styles.subtitle, { opacity: headerContentOpacity }]}>
                WELCOME, {codename.toUpperCase()}
            </Animated.Text>
          </View>
      </Animated.View>

      <Animated.ScrollView 
        style={styles.content} 
        contentContainerStyle={{ paddingTop: HEADER_MAX_HEIGHT + 20, paddingBottom: 120 }} 
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
      >
        
        {/* WEEKLY PLAN */}
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
                    <TouchableOpacity 
                        key={i} 
                        style={styles.dayCol} 
                        onPress={() => toggleDayComplete(i)}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.dayDot, day.complete && styles.dayDotComplete, { borderWidth: 1, borderColor: day.complete ? '#FFD700' : '#444' }]} />
                        <Text style={[styles.dayLabel, day.complete && {color: '#fff'}]}>{day.day.charAt(0)}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </TouchableOpacity>

        {/* FIELD OPERATIONS */}
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>FIELD OPERATIONS</Text>
            <Ionicons name="grid-outline" size={14} color="#666" />
        </View>

        <TouchableOpacity style={styles.labPortal} onPress={() => router.push('/templates')}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 15}}>
                <View style={styles.iconCircle}>
                     <Ionicons name="library" size={24} color="#000" />
                </View>
                <View>
                    <Text style={styles.labTitle}>BROWSE WORKOUTS</Text>
                    <Text style={styles.labSub}>Access the Training Lab Library</Text>
                </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#000" />
        </TouchableOpacity>

        {/* QUICK LOG GRID */}
        <View style={styles.quickLogGrid}>
            <TouchableOpacity style={styles.logBtn} onPress={() => openQuickLog('RUN')}>
                <Ionicons name="stopwatch-outline" size={24} color="#32D74B" />
                <Text style={styles.logBtnText}>LOG RUN</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logBtn} onPress={() => openQuickLog('STATION')}>
                <Ionicons name="barbell-outline" size={24} color="#FF453A" />
                <Text style={styles.logBtnText}>LOG STATION</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logBtn} onPress={() => openQuickLog('WORKOUT')}>
                <Ionicons name="fitness-outline" size={24} color="#FFD700" />
                <Text style={styles.logBtnText}>LOG GYM</Text>
            </TouchableOpacity>
        </View>

        {/* NEXT EVENT */}
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>NEXT EVENT</Text>
            <Ionicons name="calendar-outline" size={14} color="#666" />
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
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>RACE CALCULATOR</Text>
            <Ionicons name="calculator-outline" size={14} color="#666" />
        </View>

        <View style={styles.consoleContainer}>
            <View style={styles.toggleRow}>
                <TouchableOpacity style={[styles.toggleBtn, calcMode === 'MANUAL' && styles.toggleBtnActive]} onPress={() => setCalcMode('MANUAL')}>
                    <Text style={[styles.toggleText, calcMode === 'MANUAL' && {color: '#000'}]}>MANUAL</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.toggleBtn, calcMode === 'SMART' && styles.toggleBtnActive]} onPress={() => setCalcMode('SMART')}>
                    <Text style={[styles.toggleText, calcMode === 'SMART' && {color: '#000'}]}>SMART PACER</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.infoBox}>
                 <Ionicons name="information-circle-outline" size={14} color="#666" style={{marginTop: 2}} />
                 <Text style={styles.infoText}>{PACER_DESCRIPTIONS[calcMode]}</Text>
            </View>

            <View style={styles.consoleTop}>
                {calcMode === 'MANUAL' ? (
                    <>
                        <Text style={styles.inputLabel}>GOAL FINISH TIME</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput style={styles.mainInput} value={targetTime} onChangeText={setTargetTime} keyboardType="numeric" maxLength={3} />
                            <Text style={styles.inputUnit}>MINS</Text>
                        </View>
                    </>
                ) : (
                    <>
                        <Text style={styles.inputLabel}>FRESH 5K TIME (MM:SS)</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput 
                                style={styles.mainInput} 
                                value={fiveKTime} 
                                onChangeText={setFiveKTime} 
                                keyboardType="numbers-and-punctuation" 
                                placeholder="20:00" 
                                placeholderTextColor="#333"
                                maxLength={5} 
                            />
                        </View>
                        <View style={{flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap'}}>
                             {Object.keys(CATEGORIES).map((cat) => (
                                 <TouchableOpacity 
                                    key={cat} 
                                    style={[styles.catChip, category === cat && styles.catChipActive]}
                                    onPress={() => setCategory(cat)}
                                 >
                                     <Text style={[styles.catText, category === cat && {color: '#000'}]}>{CATEGORIES[cat as keyof typeof CATEGORIES].label}</Text>
                                 </TouchableOpacity>
                             ))}
                        </View>
                    </>
                )}
                
                <Text style={[styles.inputLabel, {marginBottom: 10}]}>ATHLETE BIAS</Text>
                <View style={styles.typeGrid}>
                    {['RUNNER', 'BALANCED', 'LIFTER'].map((type) => (
                        <TouchableOpacity key={type} style={[styles.typeBtn, athleteType === type && styles.activeTypeBtn]} onPress={() => setAthleteType(type)}>
                            <Text style={[styles.typeBtnText, athleteType === type && { color: '#000' }]}>{type}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={[styles.infoBox, { backgroundColor: 'transparent', paddingHorizontal: 0, paddingBottom: 0, marginTop: 15, borderBottomWidth: 0 }]}>
                     <Ionicons name="stats-chart-outline" size={14} color="#666" style={{marginTop: 2}} />
                     <Text style={styles.infoText}>{BIAS_DESCRIPTIONS[athleteType]}</Text>
                </View>

            </View>

            <TouchableOpacity activeOpacity={0.9} style={styles.consoleBottom} onPress={handleLaunch}>
                <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />
                <View style={styles.videoOverlay} />
                <View style={styles.btnContent}><Text style={styles.actionText}>{calcMode === 'SMART' ? 'CALCULATE & LAUNCH' : 'LAUNCH CALCULATOR'}</Text></View>
            </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
            style={{ marginVertical: 40, alignSelf: 'center', padding: 15 }} 
            onPress={async () => { await AsyncStorage.clear(); router.replace('/onboarding'); }}
        >
            <Text style={{ color: '#333', fontWeight: '900', fontSize: 10 }}>FACTORY RESET</Text>
        </TouchableOpacity>

      </Animated.ScrollView>

      {/* --- MODAL: EVENT SELECTOR --- */}
      <Modal visible={isEventListOpen} animationType="slide" transparent={true} onRequestClose={() => setEventListOpen(false)}>
        <BlurView intensity={90} tint="dark" style={styles.modalContainer}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeaderRow}>
                    <Text style={styles.modalTitle}>SELECT DEPLOYMENT</Text>
                    <TouchableOpacity onPress={() => setEventListOpen(false)} style={styles.closeBtn}>
                        <Ionicons name="close" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
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
                <ScrollView showsVerticalScrollIndicator={false}>
                    <TouchableOpacity style={styles.eventOption} onPress={() => { setSelectedEventIndex(-1); setEventListOpen(false); }}>
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                             <Ionicons name="infinite" size={18} color="#666" />
                             <Text style={[styles.optionCity, {color: '#888'}]}>NO RACE / OFF SEASON</Text>
                        </View>
                    </TouchableOpacity>
                    {filteredRaces.map((event) => {
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

      {/* --- MODAL: DETAILED QUICK LOG (NEW) --- */}
      <Modal visible={showLogModal} animationType="slide" transparent>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <BlurView intensity={90} tint="dark" style={styles.modalContainer}>
            <View style={[styles.modalContent, {height: '75%'}]}>
                <View style={styles.modalHeaderRow}>
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                        <Ionicons 
                            name={logType === 'RUN' ? 'stopwatch' : (logType === 'STATION' ? 'barbell' : 'fitness')} 
                            size={24} 
                            color="#FFD700" 
                        />
                        <Text style={styles.modalTitle}>LOG {logType}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setShowLogModal(false)}>
                        <Ionicons name="close-circle" size={30} color="#666" />
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                    {/* DYNAMIC FORM FIELDS */}
                    
                    {/* 1. SUB-CATEGORY SELECTOR */}
                    <Text style={styles.inputLabel}>
                        {logType === 'RUN' ? 'RUN TYPE' : (logType === 'STATION' ? 'SELECT STATION' : 'FOCUS')}
                    </Text>
                    <View style={{marginBottom: 20}}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap: 8}}>
                            {(logType === 'RUN' ? RUN_TYPES : (logType === 'STATION' ? STATIONS_LIST : GYM_FOCUS)).map((item) => (
                                <TouchableOpacity 
                                    key={item} 
                                    style={[styles.catChip, logSubCategory === item && styles.catChipActive]}
                                    onPress={() => setLogSubCategory(item)}
                                >
                                    <Text style={[styles.catText, logSubCategory === item && {color: '#000'}]}>{item}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* 2. LOG SPECIFIC INPUTS */}
                    {logType === 'RUN' && (
                        <>
                            <Text style={styles.inputLabel}>DISTANCE (KM)</Text>
                            <TextInput 
                                style={styles.modalInput} 
                                placeholder="e.g. 5.0" 
                                placeholderTextColor="#444" 
                                keyboardType="numeric"
                                value={logDistance}
                                onChangeText={setLogDistance}
                            />
                        </>
                    )}

                    {logType === 'STATION' && (
                        <>
                            <Text style={styles.inputLabel}>WEIGHT (KG) - OPTIONAL</Text>
                            <TextInput 
                                style={styles.modalInput} 
                                placeholder="e.g. 152" 
                                placeholderTextColor="#444" 
                                keyboardType="numeric"
                                value={logWeight}
                                onChangeText={setLogWeight}
                            />
                        </>
                    )}

                    {/* 3. MAIN TIME/SCORE INPUT */}
                    <Text style={styles.inputLabel}>
                        {logType === 'RUN' ? 'TOTAL TIME (MM:SS)' : (logType === 'STATION' ? 'TIME OR REPS' : 'DURATION (MINS)')}
                    </Text>
                    <TextInput 
                        style={styles.modalInput} 
                        placeholder={logType === 'RUN' ? "25:00" : "e.g. 4:30"} 
                        placeholderTextColor="#444"
                        value={logTime}
                        onChangeText={setLogTime}
                    />

                    {/* 4. NOTES */}
                    <Text style={styles.inputLabel}>SESSION NOTES (RPE, FEELING, ETC)</Text>
                    <TextInput 
                        style={[styles.modalInput, {height: 80, textAlignVertical: 'top'}]} 
                        placeholder="e.g. Felt strong, RPE 8" 
                        placeholderTextColor="#444"
                        value={logNote}
                        onChangeText={setLogNote}
                        multiline
                    />

                    <TouchableOpacity style={styles.saveBtn} onPress={saveQuickLog}>
                        <Text style={styles.saveBtnText}>SAVE TO PLANNER & HISTORY</Text>
                    </TouchableOpacity>
                    
                    <View style={{height: 50}} />
                </ScrollView>
            </View>
        </BlurView>
        </TouchableWithoutFeedback>
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
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, marginTop: 30, marginBottom: 15 },
  sectionTitle: { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  
  // WIDGETS
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

  labPortal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFD700', marginHorizontal: 20, marginTop: 5, marginBottom: 15, padding: 20, borderRadius: 25 },
  labTitle: { color: '#000', fontSize: 16, fontWeight: '900' },
  labSub: { color: '#000', fontSize: 12, opacity: 0.8 },
  iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },

  quickLogGrid: { flexDirection: 'row', gap: 10, marginHorizontal: 20 },
  logBtn: { flex: 1, backgroundColor: '#1E1E1E', paddingVertical: 15, borderRadius: 16, borderWidth: 1, borderColor: '#333', alignItems: 'center', gap: 8 },
  logBtnText: { color: '#fff', fontSize: 10, fontWeight: '900' },

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
  toggleRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#333' },
  toggleBtn: { flex: 1, paddingVertical: 15, alignItems: 'center', backgroundColor: '#151515' },
  toggleBtnActive: { backgroundColor: '#1E1E1E' },
  toggleText: { color: '#666', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  
  infoBox: { flexDirection: 'row', gap: 10, padding: 15, backgroundColor: '#181818', borderBottomWidth: 1, borderBottomColor: '#252525' },
  infoText: { color: '#888', fontSize: 10, fontWeight: '500', flex: 1, lineHeight: 15 },

  consoleTop: { padding: 25 },
  inputLabel: { color: '#888', fontSize: 10, fontWeight: '900', marginBottom: 5, marginTop: 15 },
  inputWrapper: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 25 },
  mainInput: { color: '#fff', fontSize: 60, fontWeight: '900', letterSpacing: -2, width: '100%' },
  inputUnit: { color: '#FFD700', fontSize: 18, fontWeight: 'bold', marginLeft: 10, position: 'absolute', right: 0, bottom: 15 },
  
  catChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: '#121212', borderWidth: 1, borderColor: '#333' },
  catChipActive: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
  catText: { color: '#666', fontSize: 9, fontWeight: '900' },
  
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
  regionChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: '#333', justifyContent: 'center' },
  regionChipActive: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
  regionText: { color: '#666', fontWeight: '900', fontSize: 10 },

  modalInput: { backgroundColor: '#111', color: '#fff', fontSize: 18, padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#333' },
  saveBtn: { backgroundColor: '#FFD700', marginTop: 30, padding: 20, borderRadius: 16, alignItems: 'center' },
  saveBtnText: { color: '#000', fontSize: 16, fontWeight: '900' },
});