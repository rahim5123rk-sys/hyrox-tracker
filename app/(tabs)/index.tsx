import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { useFocusEffect, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
// [CHANGE 1] Import the new SQLite DataStore
import { DataStore } from './../services/DataStore';

const HEADER_MAX_HEIGHT = 320;

const STRATEGY_VIDEOS: any = {
  RUNNER: require('../../assets/videos/runner.mp4'),
  BALANCED: require('../../assets/videos/balanced.mp4'),
  LIFTER: require('../../assets/videos/lifter.mp4'),
};

const PACER_DESCRIPTIONS: any = {
    MANUAL: "Standard Command. Input your target goal (e.g., 90 mins) to generate pacing splits.",
    SMART: "AI Deployment. Input your 5k Run Time. The system will calculate your optimal race pace."
};

const BIAS_DESCRIPTIONS: any = {
    RUNNER: "Speed Specialist. Generates aggressive running splits to buy time for heavy stations.",
    BALANCED: "Hybrid Operator. Distributes effort equally between running and functional stations.",
    LIFTER: "Strength Specialist. Prioritizes fast station times to compensate for a steady run pace."
};

const RUN_TYPES = ['EASY (Z2)', 'TEMPO', 'INTERVALS', 'LONG RUN'];
const GYM_FOCUS = ['FULL BODY', 'UPPER', 'LOWER', 'CORE', 'RECOVERY'];
const STATIONS_LIST = ['SKI ERG', 'SLED PUSH', 'SLED PULL', 'BURPEES', 'ROWING', 'FARMERS', 'LUNGES', 'WALL BALLS'];

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme(); 
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const HEADER_MIN_HEIGHT = insets.top + 85; 
  const SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

  const [codename, setCodename] = useState('Athlete');
  const [targetTime, setTargetTime] = useState('90');
  const [athleteType, setAthleteType] = useState('BALANCED');
  const [calcMode, setCalcMode] = useState<'MANUAL' | 'SMART'>('MANUAL');
  const [fiveKTime, setFiveKTime] = useState('');
  const [category, setCategory] = useState('MEN_OPEN');
  const [selectedEventIndex, setSelectedEventIndex] = useState(-1); 
  const [isEventListOpen, setEventListOpen] = useState(false);
  const [weeklyPlan, setWeeklyPlan] = useState<any[]>([]);
  const [streak, setStreak] = useState(0); 
  const [isLoading, setIsLoading] = useState(true);

  // LOG STATE
  const [showLogModal, setShowLogModal] = useState(false);
  const [logType, setLogType] = useState<'RUN' | 'STATION' | 'WORKOUT'>('RUN');
  
  // SPECIFIC INPUTS
  const [logMinutes, setLogMinutes] = useState('');
  const [logSeconds, setLogSeconds] = useState('');
  const [logReps, setLogReps] = useState('');
  const [logDistance, setLogDistance] = useState('');
  const [logWeight, setLogWeight] = useState('');
  const [logRPE, setLogRPE] = useState(5);
  
  const [logNote, setLogNote] = useState('');
  const [logSubCategory, setLogSubCategory] = useState('');
  const [modalRegion, setModalRegion] = useState<Region>('ALL');

  const currentEvent = selectedEventIndex >= 0 ? UPCOMING_RACES[selectedEventIndex] : null;

  const headerHeight = scrollY.interpolate({ inputRange: [0, SCROLL_DISTANCE], outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT], extrapolate: 'clamp' });
  const imageOpacity = scrollY.interpolate({ inputRange: [0, SCROLL_DISTANCE], outputRange: [0.6, 0], extrapolate: 'clamp' });
  const headerContentOpacity = scrollY.interpolate({ inputRange: [0, SCROLL_DISTANCE * 0.6], outputRange: [1, 0], extrapolate: 'clamp' });
  const titleScale = scrollY.interpolate({ inputRange: [0, SCROLL_DISTANCE], outputRange: [1, 0.60], extrapolate: 'clamp' });
  const titleTranslateY = scrollY.interpolate({ inputRange: [0, SCROLL_DISTANCE], outputRange: [0, -38], extrapolate: 'clamp' });

  useFocusEffect(useCallback(() => { checkProfile(); handleStreak(); }, []));
  const handleStreak = async () => { setStreak(await updateStreak()); };

  const checkProfile = async () => {
    try {
      const profileJson = await AsyncStorage.getItem('user_profile');
      if (!profileJson) { router.replace('/onboarding'); return; } 
      const profile = JSON.parse(profileJson);
      if (profile.name) setCodename(profile.name);
      if (profile.targetTime) setTargetTime(profile.targetTime);
      if (profile.athleteType) setAthleteType(profile.athleteType);
      const savedCat = await AsyncStorage.getItem('userCategory');
      if (savedCat) setCategory(savedCat);
      if (profile.targetRace) { const idx = UPCOMING_RACES.findIndex(e => e.id === profile.targetRace.id); if (idx !== -1) setSelectedEventIndex(idx); }
      loadPlan(); setIsLoading(false);
    } catch (e) {}
  };

  const loadPlan = async () => { const saved = await AsyncStorage.getItem('user_weekly_plan'); if (saved) setWeeklyPlan(JSON.parse(saved)); };

  const toggleDayComplete = async (index: number) => {
    const newPlan = [...weeklyPlan]; newPlan[index].complete = !newPlan[index].complete;
    setWeeklyPlan(newPlan); await AsyncStorage.setItem('user_weekly_plan', JSON.stringify(newPlan));
    if (newPlan[index].complete) handleStreak();
  };

  const completedCount = weeklyPlan.filter(d => d.complete).length;
  const progress = weeklyPlan.length > 0 ? completedCount / weeklyPlan.length : 0;

  const player = useVideoPlayer(STRATEGY_VIDEOS.BALANCED, (p) => { p.loop = true; p.muted = true; p.play(); });
  useEffect(() => { async function updateVideo() { try { await player.replaceAsync(STRATEGY_VIDEOS[athleteType]); player.play(); } catch (e) {} } updateVideo(); }, [athleteType]);

  const handleLaunch = () => {
      if (calcMode === 'MANUAL') { router.push({ pathname: '/race', params: { goalMinutes: targetTime, bias: athleteType, category } }); } 
      else {
          if (!fiveKTime) { Alert.alert("Missing Data", "Please enter your 5k time."); return; }
          const roxPace = calculateRoxPace(fiveKTime, category);
          const predictedMinutes = predictFinishTime(roxPace, category);
          router.push({ pathname: '/race', params: { goalMinutes: predictedMinutes.toString(), bias: athleteType, smartPace: roxPace.toString(), category } });
      }
  };

  const openQuickLog = (type: 'RUN' | 'STATION' | 'WORKOUT') => {
      setLogType(type);
      setLogMinutes(''); setLogSeconds(''); setLogReps('');
      setLogNote(''); setLogDistance(''); setLogWeight(''); setLogSubCategory(''); 
      setLogRPE(5);
      setShowLogModal(true);
  };

  // [CHANGE 2] Updated Save Function to use SQLite DataStore
  const saveQuickLog = async () => {
      let finalTime = '';
      if (logMinutes || logSeconds) {
          const m = parseInt(logMinutes) || 0;
          const s = parseInt(logSeconds) || 0;
          finalTime = `${m}:${s < 10 ? '0' : ''}${s}`;
      }

      let logTitle = '';
      if (logType === 'RUN') logTitle = `${logDistance || '?'}km ${logSubCategory || 'RUN'}`;
      else if (logType === 'STATION') logTitle = `${logSubCategory || 'STATION'}`;
      else logTitle = `${logSubCategory || 'GYM'} SESSION`;

      const completedAt = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

      try {
          const newHistoryLog = { 
              id: `quick-${Date.now()}`, 
              date: new Date().toISOString(), // Use ISO for sorting in DB
              timestamp: Date.now(),          // Required for DataStore sort
              completedAt: completedAt,
              totalTime: finalTime || '--:--', 
              type: logType, 
              sessionType: 'QUICK LOG', 
              title: logTitle.toUpperCase(),
              details: {
                  subCategory: logSubCategory,
                  distance: logDistance,
                  weight: logWeight,
                  reps: logReps,
                  rpe: logRPE,
                  note: logNote
              }
          };

          // WRITE TO SQLITE DATABASE
          await DataStore.logEvent(newHistoryLog);
          
          // (Legacy Weekly Plan Logic - Preserved)
          const planJson = await AsyncStorage.getItem('user_weekly_plan');
          if (planJson) {
              const plan = JSON.parse(planJson);
              const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
              if (plan[todayIndex]) {
                  if (!plan[todayIndex].workouts) plan[todayIndex].workouts = [];
                  plan[todayIndex].workouts.push({
                      id: newHistoryLog.id,
                      title: logTitle.toUpperCase(),
                      sessionType: 'QUICK LOG',
                      timestamp: completedAt,
                      complete: true,
                      xp: 150
                  });
                  plan[todayIndex].complete = true;
                  setWeeklyPlan(plan);
                  await AsyncStorage.setItem('user_weekly_plan', JSON.stringify(plan));
                  handleStreak();
              }
          }
          
          setShowLogModal(false);
          Alert.alert("LOG SECURED", "Mission data recorded successfully.");
      } catch (e) { console.log(e); }
  };

  const filteredRaces = modalRegion === 'ALL' ? UPCOMING_RACES : UPCOMING_RACES.filter(r => r.region === modalRegion);
  const getDaysOut = () => { if (!currentEvent) return 0; const t = new Date(); const r = new Date(currentEvent.isoDate); return Math.max(0, Math.ceil((r.getTime()-t.getTime())/(1000*3600*24))); };

  if (isLoading) return <View style={{flex:1, backgroundColor: colors.background}} />;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      <Animated.View style={[styles.headerContainer, { height: headerHeight }]}>
          <Animated.Image source={{ uri: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000' }} style={[StyleSheet.absoluteFill, { opacity: imageOpacity }]} resizeMode="cover" />
          <View style={[styles.heroContent, { paddingTop: insets.top + 10 }]}>
            <Animated.View style={{ opacity: headerContentOpacity, marginBottom: 15 }}>
                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                    <View style={styles.streakBadge}><Ionicons name="flame" size={14} color={colors.primary} /><Text style={styles.streakText}>{streak} DAY STREAK</Text></View>
                    
                    {/* RESTORED LINK TO PROGRESS */}
                    <TouchableOpacity onPress={() => router.push('/progress')} style={styles.profileBtn}>
                        <Ionicons name="person-circle-outline" size={32} color="#fff" />
                    </TouchableOpacity>

                </View>
            </Animated.View>
            <Animated.View style={{ transform: [{ scale: titleScale }, { translateY: titleTranslateY }], alignItems: 'center', width: '100%', zIndex: 999 }}>
                <Text style={styles.title}>HYROX<Text style={{color: colors.primary}}>ENGINEER</Text></Text>
            </Animated.View>
            <Animated.Text style={[styles.subtitle, { opacity: headerContentOpacity }]}>WELCOME, {codename.toUpperCase()}</Animated.Text>
          </View>
      </Animated.View>

      <Animated.ScrollView style={[styles.content, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingTop: HEADER_MAX_HEIGHT + 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false} scrollEventThrottle={16} onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}>
        
        {/* WIDGETS AND BUTTONS */}
        <TouchableOpacity style={[styles.widgetBase, { backgroundColor: colors.card, borderColor: colors.border }]} activeOpacity={0.9} onPress={() => router.push('/planner')}>
            <View style={styles.plannerHeader}>
                <View>
                    <Text style={[styles.plannerTitle, { color: colors.primary }]}>YOUR TRAINING WEEK</Text>
                    <Text style={[styles.plannerSub, { color: colors.subtext }]}>{completedCount} of {weeklyPlan.length} sessions done</Text>
                </View>
                <Text style={[styles.plannerLink, { color: colors.subtext }]}>VIEW SCHEDULE →</Text>
            </View>
            <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
                <View style={[styles.progressBarFill, { width: `${progress * 100}%`, backgroundColor: colors.primary }]} />
            </View>
            <View style={styles.daysGrid}>
                {weeklyPlan.map((day, i) => (
                    <TouchableOpacity key={i} style={styles.dayCol} onPress={() => toggleDayComplete(i)} activeOpacity={0.7}>
                        <View style={[styles.dayDot, day.complete && { backgroundColor: colors.primary }, { borderWidth: 1, borderColor: day.complete ? colors.primary : colors.border }]} />
                        <Text style={[styles.dayLabel, { color: day.complete ? colors.text : colors.subtext }]}>{day.day.charAt(0)}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </TouchableOpacity>

        <View style={styles.sectionHeader}><Text style={[styles.sectionTitle, { color: colors.text }]}>FIELD OPERATIONS</Text><Ionicons name="grid-outline" size={14} color={colors.subtext} /></View>
        <TouchableOpacity style={[styles.labPortal, { backgroundColor: colors.primary }]} onPress={() => router.push('/templates')}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 15}}>
                <View style={styles.iconCircle}><Ionicons name="library" size={24} color="#000" /></View>
                <View>
                    <Text style={[styles.labTitle, { color: '#000' }]}>BROWSE WORKOUTS</Text>
                    <Text style={[styles.labSub, { color: '#000' }]}>Access the Training Lab Library</Text>
                </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#000" />
        </TouchableOpacity>
        
        <View style={styles.quickLogGrid}>
            <TouchableOpacity style={[styles.logBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => openQuickLog('RUN')}>
                <Ionicons name="stopwatch-outline" size={24} color={colors.success} />
                <Text style={[styles.logBtnText, { color: colors.text }]}>LOG RUN</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.logBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => openQuickLog('STATION')}>
                <Ionicons name="barbell-outline" size={24} color={colors.danger} />
                <Text style={[styles.logBtnText, { color: colors.text }]}>LOG STATION</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.logBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => openQuickLog('WORKOUT')}>
                <Ionicons name="fitness-outline" size={24} color={colors.primary} />
                <Text style={[styles.logBtnText, { color: colors.text }]}>LOG GYM</Text>
            </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}><Text style={[styles.sectionTitle, { color: colors.text }]}>NEXT EVENT</Text><Ionicons name="calendar-outline" size={14} color={colors.subtext} /></View>
        <TouchableOpacity style={[styles.widgetBase, { backgroundColor: colors.card, borderColor: colors.border }]} activeOpacity={0.9} onPress={() => setEventListOpen(true)}>
            {currentEvent ? (
                <>
                    <View style={styles.missionLeft}>
                        <View style={[styles.tagBadge, { backgroundColor: colors.background }]}>
                            <Text style={[styles.tagText, { color: colors.primary }]}>{currentEvent.type}</Text>
                        </View>
                        <Text style={[styles.missionCity, { color: colors.text }]}>HYROX {currentEvent.city}</Text>
                        <Text style={[styles.missionDate, { color: colors.subtext }]}>{currentEvent.date} • {currentEvent.venue}</Text>
                    </View>
                    <View style={styles.missionRight}>
                        <View style={[styles.countdownBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                            <Text style={[styles.cdNumber, { color: colors.text }]}>{getDaysOut()}</Text>
                            <Text style={[styles.cdLabel, { color: colors.primary }]}>DAYS</Text>
                        </View>
                    </View>
                </>
            ) : (
                <View style={styles.missionLeft}>
                    <Text style={[styles.missionCity, { color: colors.text }]}>OFF SEASON</Text>
                    <Text style={[styles.missionDate, { color: colors.subtext }]}>Tap to select your next race.</Text>
                </View>
            )}
        </TouchableOpacity>

        <View style={styles.sectionHeader}><Text style={[styles.sectionTitle, { color: colors.text }]}>RACE CALCULATOR</Text><Ionicons name="calculator-outline" size={14} color={colors.subtext} /></View>
        <View style={[styles.consoleContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.toggleRow, { borderBottomColor: colors.border }]}>
                <TouchableOpacity style={[styles.toggleBtn, calcMode === 'MANUAL' && { backgroundColor: colors.background }]} onPress={() => setCalcMode('MANUAL')}>
                    <Text style={[styles.toggleText, { color: calcMode === 'MANUAL' ? colors.text : colors.subtext }]}>MANUAL</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.toggleBtn, calcMode === 'SMART' && { backgroundColor: colors.background }]} onPress={() => setCalcMode('SMART')}>
                    <Text style={[styles.toggleText, { color: calcMode === 'SMART' ? colors.text : colors.subtext }]}>SMART PACER</Text>
                </TouchableOpacity>
            </View>
            <View style={[styles.infoBox, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
                <Ionicons name="information-circle-outline" size={14} color={colors.subtext} style={{marginTop: 2}} />
                <Text style={[styles.infoText, { color: colors.subtext }]}>{PACER_DESCRIPTIONS[calcMode]}</Text>
            </View>
            <View style={styles.consoleTop}>
                {calcMode === 'MANUAL' ? (
                    <>
                        <Text style={[styles.inputLabel, { color: colors.subtext }]}>GOAL FINISH TIME</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput style={[styles.mainInput, { color: colors.text }]} value={targetTime} onChangeText={setTargetTime} keyboardType="numeric" maxLength={3} />
                            <Text style={[styles.inputUnit, { color: colors.primary }]}>MINS</Text>
                        </View>
                    </>
                ) : (
                    <>
                        <Text style={[styles.inputLabel, { color: colors.subtext }]}>FRESH 5K TIME (MM:SS)</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput style={[styles.mainInput, { color: colors.text }]} value={fiveKTime} onChangeText={setFiveKTime} keyboardType="numbers-and-punctuation" placeholder="20:00" placeholderTextColor={colors.subtext} maxLength={5} />
                        </View>
                        <View style={{flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap'}}>
                            {Object.keys(CATEGORIES).map((cat) => (
                                <TouchableOpacity key={cat} style={[styles.catChip, { backgroundColor: colors.background, borderColor: colors.border }, category === cat && { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => setCategory(cat)}>
                                    <Text style={[styles.catText, { color: category === cat ? '#000' : colors.subtext }]}>{CATEGORIES[cat as keyof typeof CATEGORIES].label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </>
                )}
                
                <Text style={[styles.inputLabel, { marginBottom: 10, color: colors.subtext }]}>ATHLETE BIAS</Text>
                <View style={styles.typeGrid}>
                    {['RUNNER', 'BALANCED', 'LIFTER'].map((type) => (
                        <TouchableOpacity key={type} style={[styles.typeBtn, { backgroundColor: colors.background, borderColor: colors.border }, athleteType === type && { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => setAthleteType(type)}>
                            <Text style={[styles.typeBtnText, { color: athleteType === type ? '#000' : colors.subtext }]}>{type}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <View style={[styles.infoBox, {marginTop: 15, borderRadius: 8, backgroundColor: colors.background, borderBottomWidth: 0}]}><Text style={[styles.infoText, {color: colors.subtext}]}>{BIAS_DESCRIPTIONS[athleteType]}</Text></View>
            </View>
            <TouchableOpacity activeOpacity={0.9} style={styles.consoleBottom} onPress={handleLaunch}>
                <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />
                <View style={styles.videoOverlay} />
                <View style={styles.btnContent}><Text style={styles.actionText}>{calcMode === 'SMART' ? 'CALCULATE & LAUNCH' : 'LAUNCH CALCULATOR'}</Text></View>
            </TouchableOpacity>
        </View>
      </Animated.ScrollView>

      {/* EVENT MODAL */}
      <Modal visible={isEventListOpen} animationType="slide" transparent={true} onRequestClose={() => setEventListOpen(false)}>
        <BlurView intensity={isDark ? 80 : 40} tint={isDark ? "dark" : "light"} style={styles.modalContainer}>
            <View style={[styles.modalContent, { backgroundColor: colors.card, paddingTop: 30 }]}>
                <View style={styles.modalHeaderRow}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>SELECT DEPLOYMENT</Text>
                    <TouchableOpacity onPress={() => setEventListOpen(false)} style={styles.closeBtn}>
                        <Ionicons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>
                <View style={{ height: 40, marginBottom: 15 }}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                        {['ALL', 'UK', 'EUROPE', 'USA', 'APAC', 'LATAM'].map((region) => (
                            <TouchableOpacity key={region} style={[styles.regionChip, { backgroundColor: colors.background, borderColor: colors.border }, modalRegion === region && { borderColor: colors.primary, backgroundColor: colors.primary + '20' }]} onPress={() => setModalRegion(region as Region)}>
                                <Text style={[styles.regionText, { color: modalRegion === region ? colors.primary : colors.subtext }]}>{region}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                    {filteredRaces.map((event) => { 
                        const originalIndex = UPCOMING_RACES.findIndex(r => r.id === event.id); 
                        return (
                            <TouchableOpacity key={event.id} style={[styles.eventOption, { backgroundColor: colors.background }]} onPress={() => { setSelectedEventIndex(originalIndex); setEventListOpen(false); }}>
                                <View>
                                    <Text style={[styles.optionCity, { color: colors.text }]}>{event.city}</Text>
                                    <Text style={{color: colors.subtext, fontSize:12, fontWeight:'bold'}}>{event.date}</Text>
                                </View>
                                {selectedEventIndex === originalIndex && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                            </TouchableOpacity>
                        ); 
                    })}
                    <View style={{height: 40}} />
                </ScrollView>
            </View>
        </BlurView>
      </Modal>

      {/* COMPLEX MANUAL LOG MODAL */}
      <Modal visible={showLogModal} animationType="slide" transparent>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <BlurView intensity={isDark ? 90 : 50} tint={isDark ? "dark" : "light"} style={styles.modalContainer}>
            <View style={[styles.modalContent, {height: 'auto', paddingBottom: 40, backgroundColor: colors.card, paddingTop: 30}]}>
                <View style={styles.modalHeaderRow}>
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                        <Ionicons name={logType === 'RUN' ? 'stopwatch' : (logType === 'STATION' ? 'barbell' : 'fitness')} size={24} color={colors.primary} />
                        <Text style={[styles.modalTitle, { color: colors.text }]}>LOG {logType}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setShowLogModal(false)}><Ionicons name="close-circle" size={30} color={colors.subtext} /></TouchableOpacity>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                    
                    {/* CATEGORY SELECTOR */}
                    <Text style={[styles.inputLabel, { color: colors.subtext }]}>{logType === 'RUN' ? 'RUN TYPE' : (logType === 'STATION' ? 'STATION' : 'FOCUS')}</Text>
                    <View style={{marginBottom: 20}}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap: 8}}>
                            {(logType === 'RUN' ? RUN_TYPES : (logType === 'STATION' ? STATIONS_LIST : GYM_FOCUS)).map((item) => (
                                <TouchableOpacity key={item} style={[styles.catChip, { backgroundColor: colors.background, borderColor: colors.border }, logSubCategory === item && { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => setLogSubCategory(item)}>
                                    <Text style={[styles.catText, { color: logSubCategory === item ? '#000' : colors.subtext }]}>{item}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                    
                    {/* --- DYNAMIC FIELDS --- */}
                    
                    {/* RUN INPUTS */}
                    {logType === 'RUN' && (
                        <View style={{flexDirection: 'row', gap: 15, marginBottom: 15}}>
                            <View style={{flex: 1}}>
                                <Text style={[styles.inputLabel, { color: colors.subtext }]}>DISTANCE (KM)</Text>
                                <TextInput style={[styles.modalInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]} placeholder="5.0" placeholderTextColor={colors.subtext} keyboardType="numeric" value={logDistance} onChangeText={setLogDistance} />
                            </View>
                            <View style={{flex: 1}}>
                                <Text style={[styles.inputLabel, { color: colors.subtext }]}>TIME (MM:SS)</Text>
                                <View style={{flexDirection:'row', gap: 5}}>
                                    <TextInput style={[styles.modalInput, {flex: 1, backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border}]} placeholder="MM" placeholderTextColor={colors.subtext} keyboardType="number-pad" value={logMinutes} onChangeText={setLogMinutes} maxLength={3} />
                                    <TextInput style={[styles.modalInput, {flex: 1, backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border}]} placeholder="SS" placeholderTextColor={colors.subtext} keyboardType="number-pad" value={logSeconds} onChangeText={setLogSeconds} maxLength={2} />
                                </View>
                            </View>
                        </View>
                    )}

                    {/* STATION INPUTS */}
                    {logType === 'STATION' && (
                        <View>
                            <View style={{flexDirection: 'row', gap: 15, marginBottom: 15}}>
                                <View style={{flex: 1}}>
                                    <Text style={[styles.inputLabel, { color: colors.subtext }]}>WEIGHT (KG)</Text>
                                    <TextInput style={[styles.modalInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]} placeholder="0" placeholderTextColor={colors.subtext} keyboardType="numeric" value={logWeight} onChangeText={setLogWeight} />
                                </View>
                                <View style={{flex: 1}}>
                                    <Text style={[styles.inputLabel, { color: colors.subtext }]}>REPS / CALS</Text>
                                    <TextInput style={[styles.modalInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]} placeholder="0" placeholderTextColor={colors.subtext} keyboardType="numeric" value={logReps} onChangeText={setLogReps} />
                                </View>
                            </View>
                            <Text style={[styles.inputLabel, { color: colors.subtext }]}>DURATION (OPTIONAL)</Text>
                            <View style={{flexDirection:'row', gap: 5, marginBottom: 15}}>
                                <TextInput style={[styles.modalInput, {flex: 1, backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border}]} placeholder="0" placeholderTextColor={colors.subtext} keyboardType="number-pad" value={logMinutes} onChangeText={setLogMinutes} maxLength={3} />
                                
                            </View>
                        </View>
                    )}

                    {/* GYM INPUTS */}
                    {logType === 'WORKOUT' && (
                        <View style={{marginBottom: 15}}>
                            <Text style={[styles.inputLabel, { color: colors.subtext }]}>SESSION DURATION (min)</Text>
                            <View style={{flexDirection:'row', gap: 5}}>
                                <TextInput style={[styles.modalInput, {flex: 1, backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border}]} placeholder="0" placeholderTextColor={colors.subtext} keyboardType="number-pad" value={logMinutes} onChangeText={setLogMinutes} maxLength={3} />
                                
                            </View>
                        </View>
                    )}

                    {/* RPE SLIDER */}
                    <Text style={[styles.inputLabel, { color: colors.subtext }]}>RPE (INTENSITY): {logRPE}/10</Text>
                    <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20}}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                            <TouchableOpacity key={num} onPress={() => setLogRPE(num)} style={[styles.rpeBox, { backgroundColor: colors.inputBackground, borderColor: colors.border }, logRPE === num && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                                <Text style={[styles.rpeText, { color: logRPE === num ? '#000' : colors.subtext }]}>{num}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    
                    <Text style={[styles.inputLabel, { color: colors.subtext }]}>NOTES</Text>
                    <TextInput style={[styles.modalInput, {height: 80, textAlignVertical: 'top', backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border}]} placeholder="How did it feel?" placeholderTextColor={colors.subtext} value={logNote} onChangeText={setLogNote} multiline />
                    
                    <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={saveQuickLog}><Text style={styles.saveBtnText}>CONFIRM ENTRY</Text></TouchableOpacity>
                </ScrollView>
            </View>
        </BlurView>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: '#000', zIndex: 100, overflow: 'hidden', borderBottomLeftRadius: 35, borderBottomRightRadius: 35 },
  heroContent: { paddingHorizontal: 25 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A1A', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#333', gap: 6 },
  streakText: { color: '#FFF', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  profileBtn: { padding: 5, marginTop: -5 },
  title: { color: '#fff', fontSize: 38, fontWeight: '900', fontStyle: 'italic', letterSpacing: -1, textAlign: 'center' },
  subtitle: { color: '#fff', fontSize: 11, fontWeight: 'bold', letterSpacing: 2, textAlign: 'center', marginTop: 10 },
  content: { flex: 1 },
  
  // WIDGETS
  widgetBase: { marginHorizontal: 20, padding: 20, borderRadius: 25, borderWidth: 1, marginBottom: 5 },
  plannerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  plannerTitle: { fontSize: 14, fontWeight: '900' },
  plannerSub: { fontSize: 12, marginTop: 2 },
  plannerLink: { fontSize: 10, fontWeight: 'bold' },
  progressBarBg: { height: 6, borderRadius: 3, marginBottom: 15 },
  progressBarFill: { height: '100%', borderRadius: 3 },
  daysGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCol: { alignItems: 'center', gap: 6 },
  dayDot: { width: 8, height: 8, borderRadius: 4 },
  dayLabel: { fontSize: 10, fontWeight: 'bold' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, marginTop: 30, marginBottom: 15 },
  sectionTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  labPortal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 20, marginTop: 5, marginBottom: 15, padding: 20, borderRadius: 25 },
  labTitle: { fontSize: 16, fontWeight: '900' },
  labSub: { fontSize: 12, opacity: 0.8 },
  iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  quickLogGrid: { flexDirection: 'row', gap: 10, marginHorizontal: 20 },
  logBtn: { flex: 1, paddingVertical: 15, borderRadius: 16, borderWidth: 1, alignItems: 'center', gap: 8 },
  logBtnText: { fontSize: 10, fontWeight: '900' },
  
  // MISSION CARD
  missionLeft: { flex: 1 },
  tagBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginBottom: 8 },
  tagText: { fontSize: 9, fontWeight: 'bold' },
  missionCity: { fontSize: 22, fontWeight: '900', fontStyle: 'italic' },
  missionDate: { fontSize: 14, fontWeight: '500', marginTop: 4 },
  missionRight: { justifyContent: 'center', alignItems: 'flex-end' },
  countdownBox: { alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 15, borderWidth: 1 },
  cdNumber: { fontSize: 28, fontWeight: '900' },
  cdLabel: { fontSize: 9, fontWeight: '900' },

  // CALCULATOR
  consoleContainer: { marginHorizontal: 20, borderRadius: 30, borderWidth: 1, overflow: 'hidden', marginBottom: 40 },
  toggleRow: { flexDirection: 'row', borderBottomWidth: 1 },
  toggleBtn: { flex: 1, paddingVertical: 15, alignItems: 'center' },
  toggleText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  infoBox: { flexDirection: 'row', gap: 10, padding: 15, borderBottomWidth: 1 },
  infoText: { fontSize: 10, fontWeight: '500', flex: 1, lineHeight: 15 },
  consoleTop: { padding: 25 },
  inputLabel: { fontSize: 10, fontWeight: '900', marginBottom: 5, marginTop: 15 },
  inputWrapper: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 25 },
  mainInput: { fontSize: 60, fontWeight: '900', letterSpacing: -2, width: '100%' },
  inputUnit: { fontSize: 18, fontWeight: 'bold', marginLeft: 10, position: 'absolute', right: 0, bottom: 15 },
  catChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  catText: { fontSize: 9, fontWeight: '900' },
  typeGrid: { flexDirection: 'row', gap: 10 },
  typeBtn: { flex: 1, paddingVertical: 15, borderRadius: 15, alignItems: 'center', borderWidth: 1 },
  typeBtnText: { fontSize: 10, fontWeight: '900' },
  consoleBottom: { height: 100, justifyContent: 'center', alignItems: 'center' },
  videoOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  btnContent: { alignItems: 'center' },
  actionText: { color: '#fff', fontSize: 20, fontWeight: '900', fontStyle: 'italic' },

  // MODAL
  modalContainer: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, height: '75%' },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  closeBtn: { padding: 5 },
  regionChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, justifyContent: 'center' },
  regionText: { fontWeight: '900', fontSize: 10 },
  eventOption: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding: 20, borderRadius: 20, marginBottom: 12 },
  optionCity: { fontSize: 18, fontWeight: '900' },
  modalInput: { fontSize: 18, padding: 15, borderRadius: 12, borderWidth: 1 },
  saveBtn: { marginTop: 30, padding: 20, borderRadius: 16, alignItems: 'center' },
  saveBtnText: { color: '#000', fontSize: 16, fontWeight: '900' },
  rpeBox: { width: 28, height: 28, borderRadius: 6, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  rpeText: { fontSize: 10, fontWeight: '900' }
});