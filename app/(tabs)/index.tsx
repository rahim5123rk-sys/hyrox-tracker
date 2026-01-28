import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useState } from 'react';
import { Alert, Dimensions, ImageBackground, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// --- DATA: 2026 UK & GLOBAL TOUR ---
const UPCOMING_EVENTS = [
  { id: 1, city: 'GLASGOW', date: 'MAR 11-15', venue: 'SEC Centre', type: 'UK MAJOR' },
  { id: 2, city: 'LONDON', date: 'MAR 21-22', venue: 'Olympia (Regional)', type: 'CHAMPIONSHIP' },
  { id: 3, city: 'LONDON', date: 'MAR 24-29', venue: 'Olympia London', type: 'UK MAJOR' },
  { id: 4, city: 'CARDIFF', date: 'APR 29', venue: 'International Arena', type: 'UK TOUR' },
  { id: 5, city: 'STOCKHOLM', date: 'JUN 18-21', venue: 'Strawberry Arena', type: 'WORLD CHAMPS' },
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
  const [lastRaceTime, setLastRaceTime] = useState<number | null>(null);
  const [isNotifyEnabled, setIsNotifyEnabled] = useState(false);

  // --- LOGIC: PACING CALCULATIONS ---
  const currentTargetSec = (parseInt(targetTime) || 80) * 60;
  let runRatio = athleteType === 'RUNNER' ? 0.40 : athleteType === 'LIFTER' ? 0.50 : 0.45;
  const stationSplit = Math.floor((currentTargetSec * (1 - runRatio)) / 8);
  const runSplit = Math.floor((currentTargetSec * runRatio) / 8);

  const formatMinSec = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // --- NOTIFICATIONS: TACTICAL ALERTS ---
  const scheduleDailyReminder = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("SYSTEM ERROR", "Enable notifications to activate alerts.");
      return;
    }
    if (!isNotifyEnabled) {
      await Notifications.scheduleNotificationAsync({
        content: { title: "ENGINE CHECK: 0700H", body: "Consistency is the only strategy.", sound: true },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.CALENDAR, hour: 7, minute: 0, repeats: true } as any,
      });
      setIsNotifyEnabled(true);
      Alert.alert("ALERT SET", "07:00 Tactical Check-in active.");
    } else {
      await Notifications.cancelAllScheduledNotificationsAsync();
      setIsNotifyEnabled(false);
      Alert.alert("OFFLINE", "Notifications deactivated.");
    }
  };

  // --- VIDEO PLAYER SETUP ---
  const player = useVideoPlayer(STRATEGY_VIDEOS.BALANCED, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  useEffect(() => {
    async function updateVideo() {
        try { 
          await player.replaceAsync(STRATEGY_VIDEOS[athleteType]); 
          player.play(); 
        } catch (e) { console.log("Video error", e); }
    }
    updateVideo();
  }, [athleteType]);

  // --- PERSISTENCE: LOAD HISTORY ---
  useEffect(() => {
    const loadData = async () => {
      const saved = await AsyncStorage.getItem('race_history');
      if (saved) {
        const history = JSON.parse(saved);
        if (history.length > 0) {
          const last = history[history.length - 1];
          const [m, s] = last.totalTime.split(':').map(Number);
          setLastRaceTime(m * 60 + s);
        }
      }
    };
    loadData();
  }, []);

  // --- GHOST PACER MATH ---
  const ghost = lastRaceTime ? {
    diff: Math.abs(lastRaceTime - currentTargetSec),
    isAhead: (lastRaceTime - currentTargetSec) > 0,
    percent: Math.min(Math.max(((lastRaceTime - currentTargetSec) / lastRaceTime) * 100 + 50, 10), 90)
  } : null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
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
        
        {/* SECTION 1: WORLD BENCHMARKS */}
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>WORLD BENCHMARKS</Text>
            <Text style={styles.benchValue}>PRO MEN: 54:07</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
            <View style={styles.statCard}>
                <Text style={styles.statLabel}>AVG TIME</Text>
                <Text style={styles.statValue}>88<Text style={styles.statUnit}>m</Text></Text>
            </View>
            <View style={[styles.statCard, {borderColor: '#FFD700'}]}>
                <Text style={styles.statLabel}>RUN %</Text>
                <Text style={styles.statValue}>52<Text style={styles.statUnit}>%</Text></Text>
            </View>
            <View style={styles.statCard}>
                <Text style={styles.statLabel}>ZONES</Text>
                <Text style={styles.statValue}>8</Text>
            </View>
        </ScrollView>

        {/* SECTION 2: UPCOMING DEPLOYMENTS (EVENT CALENDAR) */}
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>UPCOMING DEPLOYMENTS</Text>
            <Text style={styles.benchValue}>UK & EUROPE</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
            {UPCOMING_EVENTS.map((event) => (
                <View key={event.id} style={styles.eventCard}>
                    <Text style={styles.eventTag}>{event.type}</Text>
                    <Text style={styles.eventCity}>{event.city}</Text>
                    <Text style={styles.eventDate}>{event.date}</Text>
                    <Text style={styles.eventVenue}>{event.venue}</Text>
                </View>
            ))}
        </ScrollView>

        {/* SECTION 3: TRAINING LAB PORTAL */}
        <TouchableOpacity style={styles.labPortal} onPress={() => router.push('/templates')}>
            <View>
                <Text style={styles.labTitle}>TRAINING LABORATORY</Text>
                <Text style={styles.labSub}>Access compromised session templates</Text>
            </View>
            <Text style={styles.labArrow}>→</Text>
        </TouchableOpacity>

        {/* SECTION 4: TARGET INPUT */}
        <View style={styles.glassCard}>
            <Text style={styles.inputLabel}>TARGET FINISH TIME</Text>
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

        {/* SECTION 5: LIVE PACE CALCULATOR */}
        <View style={styles.tableCard}>
            <Text style={styles.tableTitle}>LIVE PACE CALCULATOR</Text>
            <View style={styles.tableRow}>
                <Text style={styles.rowName}>Run Pace (1km)</Text>
                <Text style={styles.rowTime}>{formatMinSec(runSplit)}/km</Text>
            </View>
            <View style={styles.tableRow}>
                <Text style={styles.rowName}>Avg Station Time</Text>
                <Text style={styles.rowTime}>{formatMinSec(stationSplit)}/ea</Text>
            </View>
            <View style={styles.tableRow}>
                <Text style={styles.rowName}>Ghost Pacer Gap</Text>
                <Text style={[styles.rowTime, ghost && {color: ghost.isAhead ? '#FFD700' : '#FF3B30'}]}>
                    {ghost ? `${ghost.isAhead ? '-' : '+'}${formatMinSec(ghost.diff)}` : '--:--'}
                </Text>
            </View>
        </View>

        {/* SECTION 6: GHOST TRACKER VISUAL */}
        {ghost && (
            <View style={styles.ghostVisual}>
                <View style={styles.ghostTrack}>
                    <View style={[styles.ghostIcon, { left: `${ghost.percent}%` }]}>
                        <Text style={{fontSize: 16}}>👻</Text>
                    </View>
                    <View style={[styles.userIcon, { left: '50%' }]}>
                        <View style={styles.userDot} />
                    </View>
                </View>
            </View>
        )}

        {/* SECTION 7: START BUTTON */}
        <TouchableOpacity 
            activeOpacity={0.9} 
            style={styles.actionButton} 
            onPress={() => router.push({ pathname: '/race', params: { goalMinutes: targetTime, bias: athleteType }})}
        >
            <VideoView 
                player={player} 
                style={StyleSheet.absoluteFill} 
                contentFit="cover" 
                nativeControls={false} 
            />
            <View style={styles.videoOverlay} />
            <View style={styles.btnContent}>
                <Text style={styles.actionText}>DEPLOY RACE TRACKER</Text>
                <Text style={styles.actionSubtext}>READY FOR DEPLOYMENT</Text>
            </View>
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
  
  statsScroll: { paddingLeft: 20, marginBottom: 20 },
  statCard: { width: 115, height: 85, backgroundColor: '#1E1E1E', borderRadius: 18, padding: 15, marginRight: 12, borderWidth: 1, borderColor: '#252525' },
  statLabel: { color: '#444', fontSize: 9, fontWeight: 'bold', marginBottom: 5 },
  statValue: { color: '#fff', fontSize: 24, fontWeight: '900' },
  statUnit: { fontSize: 12, color: '#FFD700' },

  eventCard: { width: 160, height: 110, backgroundColor: '#1E1E1E', borderRadius: 18, padding: 15, marginRight: 12, borderWidth: 1, borderColor: '#333' },
  eventTag: { color: '#FFD700', fontSize: 8, fontWeight: '900', marginBottom: 5 },
  eventCity: { color: '#fff', fontSize: 16, fontWeight: '900' },
  eventDate: { color: '#888', fontSize: 12, fontWeight: 'bold', marginVertical: 4 },
  eventVenue: { color: '#444', fontSize: 9, fontWeight: 'bold' },

  labPortal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFD700', marginHorizontal: 20, marginBottom: 25, padding: 22, borderRadius: 25 },
  labTitle: { color: '#000', fontSize: 15, fontWeight: '900' },
  labSub: { color: '#000', fontSize: 11, opacity: 0.7 },
  labArrow: { color: '#000', fontSize: 20, fontWeight: '900' },

  glassCard: { backgroundColor: '#1E1E1E', marginHorizontal: 20, padding: 25, borderRadius: 30, marginBottom: 20, borderWidth: 1, borderColor: '#252525' },
  inputLabel: { color: '#444', fontSize: 10, fontWeight: '900', marginBottom: 5 },
  inputWrapper: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 25 },
  mainInput: { color: '#fff', fontSize: 75, fontWeight: '900', letterSpacing: -3 },
  inputUnit: { color: '#FFD700', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
  typeGrid: { flexDirection: 'row', gap: 10 },
  typeBtn: { flex: 1, paddingVertical: 15, borderRadius: 15, backgroundColor: '#121212', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  activeTypeBtn: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
  typeBtnText: { color: '#666', fontSize: 10, fontWeight: '900' },

  tableCard: { backgroundColor: '#1E1E1E', marginHorizontal: 20, padding: 20, borderRadius: 25, marginBottom: 20 },
  tableTitle: { color: '#FFD700', fontSize: 10, fontWeight: '900', marginBottom: 15 },
  tableRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#252525' },
  rowName: { color: '#888', fontSize: 13 },
  rowTime: { color: '#fff', fontSize: 13, fontWeight: 'bold' },

  ghostVisual: { marginHorizontal: 30, marginBottom: 30 },
  ghostTrack: { height: 2, backgroundColor: '#222', width: '100%', justifyContent: 'center' },
  ghostIcon: { position: 'absolute', top: -12 },
  userIcon: { position: 'absolute', top: -10 },
  userDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFD700', borderWidth: 4, borderColor: '#000' },

  actionButton: { height: 140, marginHorizontal: 20, borderRadius: 35, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FFD700' },
  videoOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  btnContent: { alignItems: 'center' },
  actionText: { color: '#fff', fontSize: 24, fontWeight: '900', fontStyle: 'italic' },
  actionSubtext: { color: '#FFD700', fontSize: 10, fontWeight: 'bold', marginTop: 5 },
});